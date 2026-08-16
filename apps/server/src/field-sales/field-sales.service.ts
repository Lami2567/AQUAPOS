import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { StockService } from '../stock/stock.service.js';
import { calculateFieldStockReconciliation, calculateFieldMoneyReconciliation } from '@water-business/calculations';
import { StockMovementType, FieldSessionStatus } from '@water-business/shared-types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FieldSalesService {
  constructor(
    private dbService: DatabaseService,
    private stockService: StockService
  ) {}

  public async startFieldSession(
    storeId: string,
    vehicleId: string,
    workerId: string,
    issuedItems: Array<{ productId: string; quantity: number; unitPriceUgx: number }>,
    createdBy: string,
    deviceId: string
  ) {
    if (!issuedItems || issuedItems.length === 0) {
      throw new BadRequestException('Must issue at least one product for a field session.');
    }

    return await this.dbService.transaction(async () => {
      // 1. Verify stock availability in store
      for (const item of issuedItems) {
        const available = await this.stockService.getStockBalance(storeId, item.productId);
        if (available < item.quantity) {
          throw new BadRequestException(`Insufficient store stock to issue. Product ${item.productId}, Available: ${available}, Requested: ${item.quantity}`);
        }
      }

      const sessionId = uuidv4();
      const sessionNumber = `FS-${Date.now().toString().slice(-6)}`;

      await this.dbService.execute(
        `INSERT INTO field_sessions (id, session_number, store_id, vehicle_id, worker_id, status, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [sessionId, sessionNumber, storeId, vehicleId, workerId, FieldSessionStatus.OPEN, createdBy]
      );

      for (const item of issuedItems) {
        const product = await this.dbService.queryOne<any>(`SELECT name FROM products WHERE id = ?`, [item.productId]);

        await this.dbService.execute(
          `INSERT INTO field_session_items (id, field_session_id, product_id, product_name, issued_qty, sold_qty, returned_qty, damaged_qty, missing_qty, unit_price_ugx)
           VALUES (?, ?, ?, ?, ?, 0, 0, 0, 0, ?)`,
          [
            uuidv4(),
            sessionId,
            item.productId,
            product ? product.name : 'Water Product',
            item.quantity,
            item.unitPriceUgx,
          ]
        );

        // Deduct from Store stock via FIELD_ISSUE
        await this.dbService.execute(
          `INSERT INTO stock_ledger (id, store_id, product_id, movement_type, quantity_change, unit_cost_ugx, reference_type, reference_id, created_by, device_id, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            uuidv4(),
            storeId,
            item.productId,
            StockMovementType.FIELD_ISSUE,
            -item.quantity,
            item.unitPriceUgx,
            'FIELD_SESSION',
            sessionId,
            createdBy,
            deviceId,
            `Field Session Issue ${sessionNumber}`,
          ]
        );
      }

      return { success: true, sessionId, sessionNumber };
    });
  }

  public async closeAndReconcileFieldSession(
    fieldSessionId: string,
    returnedItems: Array<{ productId: string; soldQty: number; returnedQty: number; damagedQty: number; missingQty?: number }>,
    cashCollectedUgx: number,
    mobileMoneyUgx: number,
    bankDepositUgx: number,
    approvedExpensesUgx: number,
    cashRemainingUgx: number,
    reconciledBy: string,
    deviceId: string,
    notes?: string
  ) {
    return await this.dbService.transaction(async () => {
      const session = await this.dbService.queryOne<any>(`SELECT * FROM field_sessions WHERE id = ?`, [fieldSessionId]);
      if (!session) throw new NotFoundException('Field Session not found.');

      if (session.status === FieldSessionStatus.RECONCILED) {
        throw new BadRequestException('Field Session is already reconciled.');
      }

      const sessionItems = await this.dbService.query<any>(`SELECT * FROM field_session_items WHERE field_session_id = ?`, [fieldSessionId]);

      let totalExpectedSalesUgx = 0;
      let totalIssued = 0;
      let totalSold = 0;
      let totalReturned = 0;
      let totalDamaged = 0;
      let totalMissing = 0;

      for (const itemObj of sessionItems) {
        const retInput = returnedItems.find((r) => r.productId === itemObj.product_id);
        const soldQty = retInput ? retInput.soldQty : 0;
        const returnedQty = retInput ? retInput.returnedQty : 0;
        const damagedQty = retInput ? retInput.damagedQty : 0;
        const missingQtyInput = retInput ? retInput.missingQty || 0 : 0;

        // Perform stock reconciliation equation per product
        const stockRes = calculateFieldStockReconciliation({
          issuedQty: itemObj.issued_qty,
          soldQty,
          returnedQty,
          damagedQty,
          missingQty: missingQtyInput,
        });

        await this.dbService.execute(
          `UPDATE field_session_items SET sold_qty = ?, returned_qty = ?, damaged_qty = ?, missing_qty = ? WHERE id = ?`,
          [stockRes.soldQty, stockRes.returnedQty, stockRes.damagedQty, stockRes.missingQty, itemObj.id]
        );

        // Return unsold stock back to Store Ledger (FIELD_RETURN)
        if (stockRes.returnedQty > 0) {
          await this.dbService.execute(
            `INSERT INTO stock_ledger (id, store_id, product_id, movement_type, quantity_change, unit_cost_ugx, reference_type, reference_id, created_by, device_id, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              uuidv4(),
              session.store_id,
              itemObj.product_id,
              StockMovementType.FIELD_RETURN,
              stockRes.returnedQty, // Positive incoming
              itemObj.unit_price_ugx,
              'FIELD_SESSION',
              fieldSessionId,
              reconciledBy,
              deviceId,
              `Field Session Stock Return ${session.session_number}`,
            ]
          );
        }

        // Record Damaged stock if any
        if (stockRes.damagedQty > 0) {
          await this.dbService.execute(
            `INSERT INTO stock_ledger (id, store_id, product_id, movement_type, quantity_change, unit_cost_ugx, reference_type, reference_id, created_by, device_id, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              uuidv4(),
              session.store_id,
              itemObj.product_id,
              StockMovementType.DAMAGE,
              -stockRes.damagedQty,
              itemObj.unit_price_ugx,
              'FIELD_SESSION',
              fieldSessionId,
              reconciledBy,
              deviceId,
              `Field Session Damaged Water ${session.session_number}`,
            ]
          );
        }

        totalExpectedSalesUgx += stockRes.soldQty * Number(itemObj.unit_price_ugx);
        totalIssued += stockRes.issuedQty;
        totalSold += stockRes.soldQty;
        totalReturned += stockRes.returnedQty;
        totalDamaged += stockRes.damagedQty;
        totalMissing += stockRes.missingQty;
      }

      // Perform Money Reconciliation Equation
      const moneyRes = calculateFieldMoneyReconciliation({
        expectedSalesUgx: totalExpectedSalesUgx,
        cashCollectedUgx,
        mobileMoneyUgx,
        bankDepositUgx,
        approvedExpensesUgx,
        cashRemainingUgx,
      });

      const reconciliationId = uuidv4();
      const isStockEqValid = totalIssued === (totalSold + totalReturned + totalDamaged + totalMissing);

      await this.dbService.execute(
        `INSERT INTO field_reconciliations (id, field_session_id, total_issued_units, total_sold_units, total_returned_units, total_damaged_units, total_missing_units, is_stock_equation_valid, expected_sales_ugx, cash_collected_ugx, mobile_money_ugx, bank_deposit_ugx, approved_expenses_ugx, cash_remaining_ugx, total_accounted_money_ugx, money_variance_ugx, is_money_equation_valid, status, notes, reconciled_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          reconciliationId,
          fieldSessionId,
          totalIssued,
          totalSold,
          totalReturned,
          totalDamaged,
          totalMissing,
          isStockEqValid ? 1 : 0,
          moneyRes.expectedSalesUgx,
          moneyRes.cashCollectedUgx,
          moneyRes.mobileMoneyUgx,
          moneyRes.bankDepositUgx,
          moneyRes.approvedExpensesUgx,
          moneyRes.cashRemainingUgx,
          moneyRes.totalAccountedUgx,
          moneyRes.moneyVarianceUgx,
          moneyRes.isBalanced ? 1 : 0,
          moneyRes.status,
          notes || null,
          reconciledBy,
        ]
      );

      // If there is a cash shortage, create a worker debt
      if (moneyRes.moneyVarianceUgx < 0) {
        const shortageAmount = Math.abs(moneyRes.moneyVarianceUgx);
        await this.dbService.execute(
          `INSERT INTO debts (id, debtor_worker_id, source_type, source_id, original_amount_ugx, paid_amount_ugx, balance_amount_ugx, reason, status, approved_by)
           VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
          [
            uuidv4(),
            session.worker_id,
            'FIELD_SHORTAGE',
            fieldSessionId,
            shortageAmount,
            shortageAmount,
            `Field Session Shortage on ${session.session_number}`,
            'OUTSTANDING',
            reconciledBy,
          ]
        );
      }

      await this.dbService.execute(
        `UPDATE field_sessions SET status = ?, end_time = CURRENT_TIMESTAMP WHERE id = ?`,
        [FieldSessionStatus.RECONCILED, fieldSessionId]
      );

      return {
        success: true,
        reconciliationId,
        moneyReconciliation: moneyRes,
        stockMetrics: {
          totalIssued,
          totalSold,
          totalReturned,
          totalDamaged,
          totalMissing,
        },
      };
    });
  }
}

