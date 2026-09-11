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

  public async createSale(
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
      const available = await this.stockService.getStockBalance(storeId, item.productId);
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

    return await this.dbService.transaction(async () => {
      const saleId = uuidv4();
      const receiptNumber = `REC-${Date.now().toString().slice(-8)}`;

      // Insert Sale Record
      await this.dbService.execute(
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

        const product = await this.dbService.queryOne<any>(`SELECT name FROM products WHERE id = ?`, [item.productId]);

        await this.dbService.execute(
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
        await this.dbService.execute(
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
      await this.dbService.execute(
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

  public async voidSale(saleId: string, voidedBy: string, reason: string, deviceId: string) {
    return await this.dbService.transaction(async () => {
      const sale = await this.dbService.queryOne<any>(`SELECT * FROM sales WHERE id = ?`, [saleId]);
      if (!sale) throw new NotFoundException('Sale not found.');
      if (sale.is_voided) throw new BadRequestException('Sale is already voided.');

      const items = await this.dbService.query<any>(`SELECT * FROM sale_items WHERE sale_id = ?`, [saleId]);

      // Reverse stock ledger (Return stock back to store)
      for (const item of items) {
        await this.dbService.execute(
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

      await this.dbService.execute(
        `UPDATE sales SET is_voided = 1, voided_by = ?, void_reason = ? WHERE id = ?`,
        [voidedBy, reason, saleId]
      );

      return { success: true, message: `Sale ${sale.receipt_number} voided successfully.` };
    });
  }

  public async getSalesRecords(
    storeId?: string,
    startDate?: string,
    endDate?: string,
    search?: string
  ) {
    let sql = `SELECT * FROM sales WHERE 1=1`;
    const params: any[] = [];

    if (storeId && storeId !== 'ALL') {
      sql += ` AND store_id = ?`;
      params.push(storeId);
    }
    if (startDate) {
      sql += ` AND (created_at >= ? OR date >= ?)`;
      params.push(startDate, startDate);
    }
    if (endDate) {
      sql += ` AND (created_at <= ? OR date <= ?)`;
      params.push(`${endDate} 23:59:59`, endDate);
    }
    if (search) {
      sql += ` AND (receipt_number LIKE ? OR customer_name LIKE ? OR payment_reference LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    sql += ` ORDER BY created_at DESC LIMIT 500`;

    const rawSales = await this.dbService.query<any>(sql, params);
    const saleIds = rawSales.map((s) => s.id).filter(Boolean);
    let allSaleItems: any[] = [];
    if (saleIds.length > 0) {
      try {
        allSaleItems = await this.dbService.query<any>(
          `SELECT * FROM sale_items WHERE sale_id IN (${saleIds.map(() => '?').join(',')})`,
          saleIds
        );
      } catch (e) {}
    }
    const itemsMap = new Map<string, any[]>();
    for (const it of allSaleItems) {
      if (!itemsMap.has(it.sale_id)) itemsMap.set(it.sale_id, []);
      itemsMap.get(it.sale_id)!.push({
        id: it.id,
        productId: it.product_id,
        name: it.product_name,
        quantity: Number(it.quantity || 0),
        unitPriceUgx: Number(it.unit_price_ugx || 0),
        discountUgx: Number(it.discount_ugx || 0),
        subtotalUgx: Number(it.subtotal_ugx || 0),
      });
    }

    return rawSales.map((s) => ({
      id: s.id,
      receiptNumber: s.receipt_number,
      storeId: s.store_id,
      cashierId: s.cashier_id,
      customerName: s.customer_name || '',
      customerPhone: s.customer_phone || '',
      totalAmountUgx: Number(s.total_amount_ugx || 0),
      discountAmountUgx: Number(s.discount_amount_ugx || 0),
      netAmountUgx: Number(s.net_amount_ugx || 0),
      paidAmountUgx: Number(s.paid_amount_ugx || 0),
      changeAmountUgx: Number(s.change_amount_ugx || 0),
      paymentMethod: s.payment_method,
      paymentReference: s.payment_reference,
      isVoided: Boolean(s.is_voided),
      voidedBy: s.voided_by,
      voidReason: s.void_reason,
      createdAt: s.created_at,
      items: itemsMap.get(s.id) || [],
    }));
  }
}

