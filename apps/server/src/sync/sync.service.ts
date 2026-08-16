import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { SyncStatus } from '@water-business/shared-types';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(private dbService: DatabaseService) {}

  /**
   * Pull all central data for an online dashboard or offline branch client
   */
  public pullCentralData(branchId?: string) {
    const branches = this.dbService.query<any>('SELECT * FROM branches WHERE is_active = 1 ORDER BY name ASC');
    const stores = this.dbService.query<any>('SELECT * FROM stores WHERE is_active = 1 ORDER BY name ASC');
    const departments = this.dbService.query<any>('SELECT * FROM departments WHERE is_active = 1 ORDER BY name ASC');
    const workers = this.dbService.query<any>('SELECT * FROM workers WHERE is_active = 1 ORDER BY full_name ASC');
    const users = this.dbService.query<any>('SELECT id, username, full_name, role, branch_id, store_id, is_active, created_at FROM users WHERE is_active = 1 ORDER BY username ASC');
    const roles = this.dbService.query<any>('SELECT * FROM roles WHERE is_active = 1 ORDER BY display_name ASC');
    const vehicles = this.dbService.query<any>('SELECT * FROM vehicles WHERE is_active = 1 ORDER BY registration_number ASC');
    const products = this.dbService.query<any>('SELECT * FROM products WHERE is_active = 1 ORDER BY name ASC');
    const categories = this.dbService.query<any>('SELECT * FROM categories WHERE is_active = 1 ORDER BY name ASC');
    const branchPrices = this.dbService.query<any>('SELECT * FROM branch_product_prices');
    const paymentMethods = this.dbService.query<any>('SELECT * FROM payment_methods WHERE is_active = 1');
    const expenseTypes = this.dbService.query<any>('SELECT * FROM expense_types WHERE is_active = 1');
    const debtTypes = this.dbService.query<any>('SELECT * FROM debt_types WHERE is_active = 1');
    const salarySettings = this.dbService.query<any>('SELECT * FROM salary_settings WHERE is_active = 1');
    const systemSettings = this.dbService.query<any>('SELECT * FROM system_settings');

    // Aggregate real live inventory levels per store & product
    const ledger = this.dbService.query<any>('SELECT store_id, product_id, SUM(quantity_change) as total_qty FROM stock_ledger GROUP BY store_id, product_id');
    const inventoryStock: Record<string, Record<string, number>> = {};
    for (const entry of ledger) {
      if (!inventoryStock[entry.store_id]) inventoryStock[entry.store_id] = {};
      inventoryStock[entry.store_id][entry.product_id] = Math.max(0, entry.total_qty || 0);
    }

    // Recent sales, expenses, debts, field sessions, transfers
    const sales = this.dbService.query<any>('SELECT * FROM sales ORDER BY created_at DESC LIMIT 200');
    const expenses = this.dbService.query<any>('SELECT * FROM expenses ORDER BY created_at DESC LIMIT 200');
    const debts = this.dbService.query<any>('SELECT * FROM debts ORDER BY created_at DESC LIMIT 200');
    let salaryPayments: any[] = [];
    try {
      salaryPayments = this.dbService.query<any>('SELECT * FROM salaries ORDER BY paid_at DESC LIMIT 200');
    } catch (e) {
      salaryPayments = [];
    }
    const fieldSessions = this.dbService.query<any>('SELECT * FROM field_sessions ORDER BY created_at DESC LIMIT 100');
    const stockTransfers = this.dbService.query<any>('SELECT * FROM stock_transfers ORDER BY created_at DESC LIMIT 100');

    return {
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        branches,
        stores,
        departments,
        workers,
        users,
        roles,
        vehicles,
        products,
        categories,
        branchPrices,
        paymentMethods,
        expenseTypes,
        debtTypes,
        salarySettings,
        systemSettings,
        inventoryStock,
        sales,
        expenses,
        debts,
        salaryPayments,
        fieldSessions,
        stockTransfers,
      },
    };
  }

  /**
   * Ingest a batch of offline transactions from a client outbox queue
   */
  public ingestTransactionBatch(
    branchId: string,
    deviceId: string,
    transactions: Array<{ id: string; transactionType: string; payload: any; version?: number; createdAt?: string }>
  ) {
    const results: Array<{ id: string; status: 'ACK' | 'CONFLICT' | 'DUPLICATE'; error?: string }> = [];

    for (const tx of transactions) {
      try {
        // Idempotency check: Has this transaction UUID already been ingested centrally?
        const existing = this.dbService.queryOne<any>(`SELECT id FROM sync_inbox WHERE id = ?`, [tx.id]);
        if (existing) {
          results.push({ id: tx.id, status: 'DUPLICATE' });
          continue;
        }

        this.dbService.transaction(() => {
          // 1. Log into sync_inbox
          this.dbService.execute(
            `INSERT INTO sync_inbox (id, branch_id, device_id, transaction_type, payload, status)
             VALUES (?, ?, ?, ?, ?, 'PROCESSED')`,
            [tx.id, branchId, deviceId, tx.transactionType, JSON.stringify(tx.payload || {})]
          );

          // 2. Apply transaction payload to relevant table
          const p = tx.payload || {};

          if (tx.transactionType === 'SALE' && p.receiptNumber) {
            const saleId = p.id || tx.id;
            this.dbService.execute(
              `INSERT OR REPLACE INTO sales (id, receipt_number, store_id, cashier_id, customer_name, customer_phone, total_amount_ugx, discount_amount_ugx, net_amount_ugx, paid_amount_ugx, change_amount_ugx, payment_method, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                saleId,
                p.receiptNumber,
                p.storeId,
                p.cashierId || 'u-cashier',
                p.customerName || null,
                p.customerPhone || null,
                p.totalAmountUgx || p.subtotalUgx || 0,
                p.overallDiscountUgx || 0,
                p.totalAmountUgx || 0,
                p.paidAmountUgx || p.totalAmountUgx || 0,
                p.changeAmountUgx || 0,
                p.paymentMethod || 'CASH',
                p.createdAt || new Date().toISOString(),
              ]
            );

            // Deduct stock ledger for items
            if (Array.isArray(p.items)) {
              for (const item of p.items) {
                this.dbService.execute(
                  `INSERT INTO stock_ledger (id, store_id, product_id, movement_type, quantity_change, unit_cost_ugx, reference_type, reference_id, created_by, device_id, notes)
                   VALUES (?, ?, ?, 'SALE', ?, ?, 'SALE', ?, ?, ?, ?)`,
                  [
                    `${saleId}-${item.productId}`,
                    p.storeId,
                    item.productId,
                    -Math.abs(item.quantity || 1),
                    item.unitPriceUgx || 0,
                    saleId,
                    p.cashierId || 'u-cashier',
                    deviceId,
                    `POS Sale ${p.receiptNumber}`,
                  ]
                );
              }
            }
          } else if (tx.transactionType === 'STOCK_INTAKE' && p.storeId && p.productId) {
            this.dbService.execute(
              `INSERT INTO stock_ledger (id, store_id, product_id, movement_type, quantity_change, unit_cost_ugx, reference_type, reference_id, created_by, device_id, notes)
               VALUES (?, ?, ?, 'RECEIPT', ?, ?, 'STOCK_RECEIPT', ?, ?, ?, ?)`,
              [
                tx.id,
                p.storeId,
                p.productId,
                Math.abs(p.quantity || 0),
                p.unitCostUgx || 0,
                p.batchRef || tx.id,
                p.createdBy || 'u-admin',
                deviceId,
                p.notes || 'Stock Intake',
              ]
            );
          } else if (tx.transactionType === 'EXPENSE' && p.voucherNumber) {
            this.dbService.execute(
              `INSERT OR REPLACE INTO expenses (id, branch_id, store_id, category, amount_ugx, description, approved_by, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                p.id || tx.id,
                p.branchId || branchId,
                p.storeId || null,
                p.category,
                p.amountUgx,
                p.description,
                p.approvedBy || 'Manager',
                p.date || new Date().toISOString(),
              ]
            );
          } else if (tx.transactionType === 'DEBT' && p.debtorName) {
            this.dbService.execute(
              `INSERT OR REPLACE INTO debts (id, debtor_customer_name, source_type, source_id, original_amount_ugx, paid_amount_ugx, balance_amount_ugx, reason, status, approved_by, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                p.id || tx.id,
                p.debtorName,
                p.source || 'MANUAL',
                tx.id,
                p.originalAmountUgx || p.amountUgx,
                p.paidAmountUgx || 0,
                p.balanceAmountUgx || p.amountUgx,
                p.reason || 'Debt Record',
                p.status || 'OUTSTANDING',
                'Manager',
                p.date || new Date().toISOString(),
              ]
            );
          } else if (tx.transactionType === 'FIELD_SESSION' && p.sessionNumber) {
            this.dbService.execute(
              `INSERT OR REPLACE INTO field_sessions (id, session_number, store_id, vehicle_id, worker_id, status, start_time, end_time, created_by)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                p.id || tx.id,
                p.sessionNumber,
                p.storeId,
                p.vehicleId,
                p.workerId,
                p.status || 'CLOSED',
                p.startTime || new Date().toISOString(),
                p.endTime || new Date().toISOString(),
                p.workerName || 'Salesperson',
              ]
            );
          }
        });

        results.push({ id: tx.id, status: 'ACK' });
      } catch (err: any) {
        this.logger.error(`Error processing sync transaction ${tx.id}: ${err.message}`);
        results.push({ id: tx.id, status: 'CONFLICT', error: err.message });
      }
    }

    return { success: true, processedCount: results.length, results };
  }

  /**
   * Reset transactional demo data for a fresh customer deployment
   */
  public resetProductionData(clearDemoMaster = false) {
    return this.dbService.transaction(() => {
      // 1. Clear all transactions, queues, logs
      this.dbService.execute('DELETE FROM sync_outbox');
      this.dbService.execute('DELETE FROM sync_inbox');
      this.dbService.execute('DELETE FROM audit_logs');
      this.dbService.execute('DELETE FROM debt_payments');
      this.dbService.execute('DELETE FROM debts');
      this.dbService.execute('DELETE FROM salary_payments');
      this.dbService.execute('DELETE FROM salaries');
      this.dbService.execute('DELETE FROM expenses');
      this.dbService.execute('DELETE FROM field_reconciliations');
      this.dbService.execute('DELETE FROM field_session_items');
      this.dbService.execute('DELETE FROM field_sessions');
      this.dbService.execute('DELETE FROM sale_items');
      this.dbService.execute('DELETE FROM sales');
      this.dbService.execute('DELETE FROM stock_transfer_items');
      this.dbService.execute('DELETE FROM stock_transfers');
      this.dbService.execute('DELETE FROM stock_ledger');

      if (clearDemoMaster) {
        this.dbService.execute('DELETE FROM branch_product_prices');
        this.dbService.execute('DELETE FROM products');
        this.dbService.execute('DELETE FROM vehicles');
        this.dbService.execute('DELETE FROM workers');
        this.dbService.execute('DELETE FROM stores');
        this.dbService.execute('DELETE FROM branches');
        this.dbService.execute("DELETE FROM users WHERE username != 'admin'");
      }

      this.logger.log(`Production reset completed. Demo master cleared: ${clearDemoMaster}`);
      return {
        success: true,
        message: clearDemoMaster
          ? 'System reset completed. Master data and transactions cleared. Ready for fresh customer setup.'
          : 'Transactions, sales, and ledger entries reset cleanly. Master catalog preserved.',
      };
    });
  }

  public getPendingOutboxItems() {
    return this.dbService.query<any>(
      `SELECT * FROM sync_outbox WHERE status IN ('PENDING', 'FAILED') ORDER BY created_at ASC LIMIT 50`
    );
  }

  public updateOutboxStatus(id: string, status: SyncStatus, errorMsg?: string) {
    if (status === SyncStatus.SYNCED) {
      this.dbService.execute(
        `UPDATE sync_outbox SET status = ?, synced_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [status, id]
      );
    } else {
      this.dbService.execute(
        `UPDATE sync_outbox SET status = ?, retry_count = retry_count + 1, last_error = ? WHERE id = ?`,
        [status, errorMsg || null, id]
      );
    }
  }
}
