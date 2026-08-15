import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { calculateStockFromLedger, validateStockAvailability } from '@water-business/calculations';
import { StockMovementType, StockLedgerEntry, TransferStatus } from '@water-business/shared-types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StockService {
  constructor(private dbService: DatabaseService) {}

  public getStockBalance(storeId: string, productId: string): number {
    const rawEntries = this.dbService.query<any>(
      `SELECT * FROM stock_ledger WHERE store_id = ? AND product_id = ?`,
      [storeId, productId]
    );

    const entries: StockLedgerEntry[] = rawEntries.map((row) => ({
      id: row.id,
      storeId: row.store_id,
      productId: row.product_id,
      movementType: row.movement_type as StockMovementType,
      quantityChange: Number(row.quantity_change),
      unitCostUgx: Number(row.unit_cost_ugx),
      referenceType: row.reference_type,
      referenceId: row.reference_id,
      createdBy: row.created_by,
      deviceId: row.device_id,
      createdAt: row.created_at,
    }));

    return calculateStockFromLedger(entries);
  }

  public getStoreInventoryOverview(storeId: string) {
    const products = this.dbService.query<any>(`SELECT * FROM products WHERE is_active = 1`);
    return products.map((p) => {
      const currentStock = this.getStockBalance(storeId, p.id);
      return {
        productId: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        capacityMl: p.capacity_ml,
        costPriceUgx: Number(p.cost_price_ugx),
        sellingPriceUgx: Number(p.selling_price_ugx),
        currentStock,
        minStockAlert: p.min_stock_alert,
        isLowStock: currentStock <= p.min_stock_alert,
      };
    });
  }

  public addStockReceipt(
    storeId: string,
    productId: string,
    quantity: number,
    unitCostUgx: number,
    userId: string,
    deviceId: string,
    notes?: string
  ) {
    if (quantity <= 0) throw new BadRequestException('Quantity must be greater than zero.');

    return this.dbService.transaction(() => {
      const ledgerId = uuidv4();
      const receiptId = uuidv4();

      this.dbService.execute(
        `INSERT INTO stock_ledger (id, store_id, product_id, movement_type, quantity_change, unit_cost_ugx, reference_type, reference_id, created_by, device_id, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ledgerId,
          storeId,
          productId,
          StockMovementType.RECEIPT,
          quantity,
          unitCostUgx,
          'STOCK_RECEIPT',
          receiptId,
          userId,
          deviceId,
          notes || 'Stock Received',
        ]
      );

      // Enqueue to sync outbox
      this.dbService.execute(
        `INSERT INTO sync_outbox (id, branch_id, device_id, user_id, transaction_type, payload, status)
         SELECT ?, store_id, ?, ?, 'ADD_STOCK_RECEIPT', ?, 'PENDING' FROM stores WHERE id = ?`,
        [
          ledgerId,
          deviceId,
          userId,
          JSON.stringify({ storeId, productId, quantity, unitCostUgx, ledgerId, receiptId }),
          storeId,
        ]
      );

      return { success: true, ledgerId, currentBalance: this.getStockBalance(storeId, productId) };
    });
  }

  // Stock Transfer Workflow: DRAFT -> APPROVED -> DISPATCHED -> IN_TRANSIT -> RECEIVED -> CONFIRMED
  public createStockTransfer(
    sourceStoreId: string,
    destinationStoreId: string,
    vehicleId: string | undefined,
    driverWorkerId: string | undefined,
    items: Array<{ productId: string; quantityRequested: number; unitPriceUgx: number; unitOfMeasure?: string }>,
    userId: string,
    deviceId: string = 'device-01',
    notes?: string
  ) {
    if (sourceStoreId === destinationStoreId) {
      throw new BadRequestException('Source and Destination stores cannot be identical.');
    }
    if (!items || items.length === 0) {
      throw new BadRequestException('Transfer must include at least one product.');
    }

    return this.dbService.transaction(() => {
      const transferId = uuidv4();
      const transferNumber = `TRF-${Date.now().toString().slice(-6)}`;

      this.dbService.execute(
        `INSERT INTO stock_transfers (id, transfer_number, source_store_id, destination_store_id, vehicle_id, driver_worker_id, status, created_by, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transferId,
          transferNumber,
          sourceStoreId,
          destinationStoreId,
          vehicleId || null,
          driverWorkerId || null,
          TransferStatus.DRAFT,
          userId,
          notes || null,
        ]
      );

      for (const item of items) {
        this.dbService.execute(
          `INSERT INTO stock_transfer_items (id, transfer_id, product_id, unit_of_measure, quantity_requested, unit_price_ugx)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [uuidv4(), transferId, item.productId, item.unitOfMeasure || 'Carton', item.quantityRequested, item.unitPriceUgx]
        );
      }

      // Enqueue offline pending transaction if source is offline
      this.dbService.execute(
        `INSERT INTO sync_outbox (id, branch_id, device_id, user_id, transaction_type, payload, status)
         SELECT ?, store_id, ?, ?, 'CREATE_STOCK_TRANSFER', ?, 'PENDING' FROM stores WHERE id = ?`,
        [
          transferId,
          deviceId,
          userId,
          JSON.stringify({ transferId, transferNumber, sourceStoreId, destinationStoreId, items }),
          sourceStoreId,
        ]
      );

      return { success: true, transferId, transferNumber, status: TransferStatus.DRAFT };
    });
  }

  public approveStockTransfer(transferId: string, userId: string) {
    return this.dbService.transaction(() => {
      const transfer = this.dbService.queryOne<any>(`SELECT * FROM stock_transfers WHERE id = ?`, [transferId]);
      if (!transfer) throw new NotFoundException('Transfer not found.');

      if (transfer.status !== TransferStatus.DRAFT) {
        throw new BadRequestException(`Only DRAFT transfers can be approved. Current status: ${transfer.status}`);
      }

      this.dbService.execute(
        `UPDATE stock_transfers SET status = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [TransferStatus.APPROVED, userId, transferId]
      );

      return { success: true, status: TransferStatus.APPROVED };
    });
  }

  public dispatchStockTransfer(
    transferId: string,
    dispatchedItems: Array<{ productId: string; quantityDispatched: number }>,
    userId: string,
    deviceId: string
  ) {
    return this.dbService.transaction(() => {
      const transfer = this.dbService.queryOne<any>(`SELECT * FROM stock_transfers WHERE id = ?`, [transferId]);
      if (!transfer) throw new NotFoundException('Transfer not found.');

      if (transfer.status !== TransferStatus.APPROVED && transfer.status !== TransferStatus.DRAFT) {
        throw new BadRequestException(`Transfer cannot be dispatched from status: ${transfer.status}`);
      }

      const items = this.dbService.query<any>(`SELECT * FROM stock_transfer_items WHERE transfer_id = ?`, [transferId]);

      // Check available stock & create TRANSFER_OUT entries for source store
      for (const item of items) {
        const itemDispatch = dispatchedItems.find((d) => d.productId === item.product_id);
        const qtyToDispatch = itemDispatch ? itemDispatch.quantityDispatched : item.quantity_requested;

        if (qtyToDispatch <= 0) {
          throw new BadRequestException(`Dispatched quantity for product ${item.product_id} must be positive.`);
        }

        const currentBalance = this.getStockBalance(transfer.source_store_id, item.product_id);
        const val = validateStockAvailability(currentBalance, qtyToDispatch, StockMovementType.TRANSFER_OUT);
        if (!val.isValid) {
          throw new BadRequestException(`Cannot dispatch: ${val.errorMessage}`);
        }

        this.dbService.execute(
          `UPDATE stock_transfer_items SET quantity_dispatched = ? WHERE id = ?`,
          [qtyToDispatch, item.id]
        );

        // Deduct from Source Store Ledger (TRANSFER_OUT)
        this.dbService.execute(
          `INSERT INTO stock_ledger (id, store_id, product_id, movement_type, quantity_change, unit_cost_ugx, reference_type, reference_id, created_by, device_id, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            uuidv4(),
            transfer.source_store_id,
            item.product_id,
            StockMovementType.TRANSFER_OUT,
            -qtyToDispatch,
            item.unit_price_ugx,
            'STOCK_TRANSFER',
            transferId,
            userId,
            deviceId,
            `Stock Transfer Out (${transfer.transfer_number}) to Store ${transfer.destination_store_id}`,
          ]
        );
      }

      this.dbService.execute(
        `UPDATE stock_transfers SET status = ?, dispatched_by = ?, dispatch_timestamp = CURRENT_TIMESTAMP WHERE id = ?`,
        [TransferStatus.IN_TRANSIT, userId, transferId]
      );

      return { success: true, status: TransferStatus.IN_TRANSIT };
    });
  }

  public receiveStockTransfer(
    transferId: string,
    receivedItems: Array<{ productId: string; quantityReceived: number }>,
    userId: string
  ) {
    return this.dbService.transaction(() => {
      const transfer = this.dbService.queryOne<any>(`SELECT * FROM stock_transfers WHERE id = ?`, [transferId]);
      if (!transfer) throw new NotFoundException('Transfer not found.');

      if (transfer.status !== TransferStatus.IN_TRANSIT && transfer.status !== TransferStatus.DISPATCHED) {
        throw new BadRequestException(`Transfer must be IN_TRANSIT to receive. Current status: ${transfer.status}`);
      }

      for (const itemRec of receivedItems) {
        const itemObj = this.dbService.queryOne<any>(
          `SELECT * FROM stock_transfer_items WHERE transfer_id = ? AND product_id = ?`,
          [transferId, itemRec.productId]
        );

        if (!itemObj) continue;

        this.dbService.execute(
          `UPDATE stock_transfer_items SET quantity_received = ? WHERE id = ?`,
          [itemRec.quantityReceived, itemObj.id]
        );
      }

      this.dbService.execute(
        `UPDATE stock_transfers SET status = ?, received_by = ?, receive_timestamp = CURRENT_TIMESTAMP WHERE id = ?`,
        [TransferStatus.RECEIVED, userId, transferId]
      );

      return { success: true, status: TransferStatus.RECEIVED };
    });
  }

  public confirmStockTransferReceive(
    transferId: string,
    userId: string,
    deviceId: string
  ) {
    return this.dbService.transaction(() => {
      const transfer = this.dbService.queryOne<any>(`SELECT * FROM stock_transfers WHERE id = ?`, [transferId]);
      if (!transfer) throw new NotFoundException('Transfer not found.');

      if (transfer.status !== TransferStatus.RECEIVED && transfer.status !== TransferStatus.IN_TRANSIT) {
        throw new BadRequestException(`Transfer must be RECEIVED before final confirmation. Current status: ${transfer.status}`);
      }

      // Check if ledger entries were already recorded to prevent double-counting
      const existingLedger = this.dbService.queryOne<any>(
        `SELECT id FROM stock_ledger WHERE reference_id = ? AND store_id = ? AND movement_type = ?`,
        [transferId, transfer.destination_store_id, StockMovementType.TRANSFER_IN]
      );

      if (existingLedger) {
        throw new BadRequestException('Transfer stock has already been confirmed and credited to destination store.');
      }

      const items = this.dbService.query<any>(`SELECT * FROM stock_transfer_items WHERE transfer_id = ?`, [transferId]);

      for (const item of items) {
        const finalQty = item.quantity_received > 0 ? item.quantity_received : item.quantity_dispatched;

        // Add TRANSFER_IN to destination store ledger ONLY upon final confirmation
        this.dbService.execute(
          `INSERT INTO stock_ledger (id, store_id, product_id, movement_type, quantity_change, unit_cost_ugx, reference_type, reference_id, created_by, device_id, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            uuidv4(),
            transfer.destination_store_id,
            item.product_id,
            StockMovementType.TRANSFER_IN,
            finalQty,
            item.unit_price_ugx,
            'STOCK_TRANSFER',
            transferId,
            userId,
            deviceId,
            `Stock Transfer In (${transfer.transfer_number}) from Store ${transfer.source_store_id}`,
          ]
        );
      }

      this.dbService.execute(
        `UPDATE stock_transfers SET status = ?, confirmed_by = ?, confirm_timestamp = CURRENT_TIMESTAMP WHERE id = ?`,
        [TransferStatus.CONFIRMED, userId, transferId]
      );

      return { success: true, status: TransferStatus.CONFIRMED };
    });
  }
}
