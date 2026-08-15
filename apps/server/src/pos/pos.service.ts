import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { StockService } from '../stock/stock.service.js';
import { calculateSaleSummary } from '@water-business/calculations';
import { StockMovementType, PaymentMethod } from '@water-business/shared-types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PosService {
  constructor(
    private dbService: DatabaseService,
    private stockService: StockService
  ) {}

  public createSale(
    storeId: string,
    cashierId: string,
    deviceId: string,
    customerName: string | undefined,
    customerPhone: string | undefined,
    items: Array<{ productId: string; quantity: number; unitPriceUgx: number; discountUgx?: number }>,
    discountAmountUgx: number,
    paidAmountUgx: number,
    paymentMethod: PaymentMethod,
    paymentReference?: string
  ) {
    if (!items || items.length === 0) {
      throw new BadRequestException('Cart cannot be empty.');
    }

    // 1. Verify stock availability for all items
    for (const item of items) {
      const available = this.stockService.getStockBalance(storeId, item.productId);
      if (available < item.quantity) {
        throw new BadRequestException(`Insufficient stock for product. Requested: ${item.quantity}, Available: ${available}`);
      }
    }

    // 2. Perform calculation
    const summary = calculateSaleSummary({
      items,
      overallDiscountUgx: discountAmountUgx,
      paidAmountUgx,
    });

    if (!summary.isFullyPaid && paymentMethod !== PaymentMethod.CREDIT) {
      throw new BadRequestException(`Insufficient payment amount. Total due: UGX ${summary.netAmountUgx}, Received: UGX ${paidAmountUgx}`);
    }

    return this.dbService.transaction(() => {
      const saleId = uuidv4();
      const receiptNumber = `REC-${Date.now().toString().slice(-8)}`;

      // Insert Sale Record
      this.dbService.execute(
        `INSERT INTO sales (id, receipt_number, store_id, cashier_id, customer_name, customer_phone, total_amount_ugx, discount_amount_ugx, net_amount_ugx, paid_amount_ugx, change_amount_ugx, payment_method, payment_reference, is_voided)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          saleId,
          receiptNumber,
          storeId,
          cashierId,
          customerName || null,
          customerPhone || null,
          summary.grossTotalUgx,
          summary.totalDiscountUgx,
          summary.netAmountUgx,
          paidAmountUgx,
          summary.changeAmountUgx,
          paymentMethod,
          paymentReference || null,
        ]
      );

      // Insert Items & Stock Ledger entries
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemSummary = summary.itemSummaries[i];

        const product = this.dbService.queryOne<any>(`SELECT name FROM products WHERE id = ?`, [item.productId]);

        this.dbService.execute(
          `INSERT INTO sale_items (id, sale_id, product_id, product_name, quantity, unit_price_ugx, discount_ugx, subtotal_ugx)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            uuidv4(),
            saleId,
            item.productId,
            product ? product.name : 'Water Product',
            itemSummary.quantity,
            itemSummary.unitPriceUgx,
            itemSummary.discountUgx,
            itemSummary.subtotalUgx,
          ]
        );

        // Deduct from stock ledger
        this.dbService.execute(
          `INSERT INTO stock_ledger (id, store_id, product_id, movement_type, quantity_change, unit_cost_ugx, reference_type, reference_id, created_by, device_id, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            uuidv4(),
            storeId,
            item.productId,
            StockMovementType.SALE,
            -itemSummary.quantity,
            itemSummary.unitPriceUgx,
            'SALE',
            saleId,
            cashierId,
            deviceId,
            `POS Store Sale ${receiptNumber}`,
          ]
        );
      }

      // Enqueue Outbox Sync Event
      this.dbService.execute(
        `INSERT INTO sync_outbox (id, branch_id, device_id, user_id, transaction_type, payload, status)
         SELECT ?, store_id, ?, ?, 'CREATE_SALE', ?, 'PENDING' FROM stores WHERE id = ?`,
        [
          saleId,
          deviceId,
          cashierId,
          JSON.stringify({ saleId, receiptNumber, storeId, items, summary, paymentMethod }),
          storeId,
        ]
      );

      return {
        success: true,
        saleId,
        receiptNumber,
        summary,
      };
    });
  }

  public voidSale(saleId: string, voidedBy: string, reason: string, deviceId: string) {
    return this.dbService.transaction(() => {
      const sale = this.dbService.queryOne<any>(`SELECT * FROM sales WHERE id = ?`, [saleId]);
      if (!sale) throw new NotFoundException('Sale not found.');
      if (sale.is_voided) throw new BadRequestException('Sale is already voided.');

      const items = this.dbService.query<any>(`SELECT * FROM sale_items WHERE sale_id = ?`, [saleId]);

      // Reverse stock ledger (Return stock back to store)
      for (const item of items) {
        this.dbService.execute(
          `INSERT INTO stock_ledger (id, store_id, product_id, movement_type, quantity_change, unit_cost_ugx, reference_type, reference_id, created_by, device_id, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            uuidv4(),
            sale.store_id,
            item.product_id,
            StockMovementType.ADJUSTMENT,
            item.quantity, // Positive to restore stock
            item.unit_price_ugx,
            'SALE_REVERSAL',
            saleId,
            voidedBy,
            deviceId,
            `Void Sale Reversal ${sale.receipt_number}: ${reason}`,
          ]
        );
      }

      this.dbService.execute(
        `UPDATE sales SET is_voided = 1, voided_by = ?, void_reason = ? WHERE id = ?`,
        [voidedBy, reason, saleId]
      );

      return { success: true, message: `Sale ${sale.receipt_number} voided successfully.` };
    });
  }
}
