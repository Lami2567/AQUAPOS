import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { AdminService } from '../admin/admin.service.js';
import { SyncStatus } from '@water-business/shared-types';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private dbService: DatabaseService,
    private adminService: AdminService
  ) {}

  /**
   * Pull central data for an online dashboard or offline branch client.
   * @param branchId - optional branch filter (not yet used for filtering, kept for future scope)
   * @param since - optional ISO timestamp; when provided returns only tombstones newer than this
   */
  public async pullCentralData(branchId?: string, since?: string) {
    const rawBranches = await this.dbService.query<any>('SELECT * FROM branches WHERE is_active = 1 ORDER BY name ASC');
    const branches = rawBranches.map((b) => ({
      id: b.id,
      code: b.code,
      name: b.name,
      location: b.location || '',
      isActive: Boolean(b.is_active),
      createdAt: b.created_at,
    }));

    const rawStores = await this.dbService.query<any>('SELECT * FROM stores WHERE is_active = 1 ORDER BY name ASC');
    const stores = rawStores.map((s) => ({
      id: s.id,
      branchId: s.branch_id,
      code: s.code,
      name: s.name,
      type: s.type,
      isActive: Boolean(s.is_active),
    }));

    const rawDepartments = await this.dbService.query<any>('SELECT * FROM departments WHERE is_active = 1 ORDER BY name ASC');
    const departments = rawDepartments.map((d) => ({
      id: d.id,
      code: d.code,
      name: d.name,
      description: d.description || '',
      isActive: Boolean(d.is_active),
      createdAt: d.created_at,
    }));

    const rawWorkers = await this.dbService.query<any>('SELECT * FROM workers WHERE is_active = 1 ORDER BY full_name ASC');
    const workers = rawWorkers.map((w) => ({
      id: w.id,
      branchId: w.branch_id,
      department: w.department,
      fullName: w.full_name,
      phone: w.phone || '',
      role: w.role,
      basicSalaryUgx: Number(w.basic_salary_ugx || 0),
      isActive: Boolean(w.is_active),
    }));

    const rawUsers = await this.dbService.query<any>('SELECT id, username, full_name, role, branch_id, store_id, is_active, created_at FROM users WHERE is_active = 1 ORDER BY username ASC');
    const users = rawUsers.map((u) => ({
      id: u.id,
      username: u.username,
      fullName: u.full_name,
      role: u.role,
      branchId: u.branch_id,
      storeId: u.store_id || '',
      isActive: Boolean(u.is_active),
      createdAt: u.created_at,
      updatedAt: u.created_at,
    }));

    const rawRoles = await this.dbService.query<any>('SELECT * FROM roles WHERE is_active = 1 ORDER BY display_name ASC');
    const roles = rawRoles.map((r) => ({
      id: r.id,
      code: r.code,
      displayName: r.display_name,
      description: r.description || '',
      permissions: typeof r.permissions === 'string' ? (() => { try { return JSON.parse(r.permissions); } catch(e) { return []; } })() : (r.permissions || []),
      isActive: Boolean(r.is_active),
    }));

    const rawVehicles = await this.dbService.query<any>('SELECT * FROM vehicles WHERE is_active = 1 ORDER BY registration_number ASC');
    const vehicles = rawVehicles.map((v) => ({
      id: v.id,
      branchId: v.branch_id,
      registrationNumber: v.registration_number,
      type: v.type,
      model: v.model,
      isActive: Boolean(v.is_active),
    }));

    const rawProducts = await this.dbService.query<any>('SELECT * FROM products WHERE is_active = 1 ORDER BY name ASC');
    const products = rawProducts.map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category,
      variant: p.variant || '',
      packaging: p.packaging || '',
      unitOfMeasure: p.unit_of_measure,
      capacityMl: Number(p.capacity_ml || 500),
      costPriceUgx: Number(p.cost_price_ugx || 0),
      sellingPriceUgx: Number(p.selling_price_ugx || 0),
      minStockAlert: Number(p.min_stock_alert || 10),
      maxStockLevel: Number(p.max_stock_level || 5000),
      isActive: Boolean(p.is_active),
    }));

    const rawCategories = await this.dbService.query<any>('SELECT * FROM categories WHERE is_active = 1 ORDER BY name ASC');
    const categories = rawCategories.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      description: c.description || '',
      isActive: Boolean(c.is_active),
    }));

    const rawPrices = await this.dbService.query<any>('SELECT * FROM branch_product_prices');
    const branchPrices = rawPrices.map((bp) => ({
      id: bp.id,
      branchId: bp.branch_id,
      productId: bp.product_id,
      costPriceUgx: Number(bp.cost_price_ugx || 0),
      sellingPriceUgx: Number(bp.selling_price_ugx || 0),
    }));

    const rawPM = await this.dbService.query<any>('SELECT * FROM payment_methods WHERE is_active = 1');
    const paymentMethods = rawPM.map((pm) => ({
      id: pm.id,
      code: pm.code,
      name: pm.name,
      requiresReference: Boolean(pm.requires_reference),
      isActive: Boolean(pm.is_active),
    }));

    const rawET = await this.dbService.query<any>('SELECT * FROM expense_types WHERE is_active = 1');
    const expenseTypes = rawET.map((et) => ({
      id: et.id,
      code: et.code,
      name: et.name,
      requiresApproval: Boolean(et.requires_approval),
      description: et.description || '',
      isActive: Boolean(et.is_active),
    }));

    const rawDT = await this.dbService.query<any>('SELECT * FROM debt_types WHERE is_active = 1');
    const debtTypes = rawDT.map((dt) => ({
      id: dt.id,
      code: dt.code,
      name: dt.name,
      autoDeductPayroll: Boolean(dt.auto_deduct_payroll),
      description: dt.description || '',
      isActive: Boolean(dt.is_active),
    }));

    const rawSS = await this.dbService.query<any>('SELECT * FROM salary_settings WHERE is_active = 1');
    const salarySettings = rawSS.map((ss) => ({
      id: ss.id,
      roleCode: ss.role_code,
      departmentCode: ss.department_code,
      baseSalaryUgx: Number(ss.base_salary_ugx || 0),
      commissionPerUnitUgx: Number(ss.commission_per_unit_ugx || 0),
      allowanceUgx: Number(ss.allowance_ugx || 0),
      isActive: Boolean(ss.is_active),
    }));

    const rawSys = await this.dbService.query<any>('SELECT * FROM system_settings');
    const systemSettings = rawSys.map((sys) => ({
      id: sys.id,
      settingKey: sys.setting_key || sys.settingKey || '',
      settingValue: sys.setting_value || sys.settingValue || '',
      category: sys.category || 'GENERAL',
      description: sys.description || '',
      updatedAt: sys.updated_at || new Date().toISOString(),
    }));

    // Aggregate real live inventory levels per store & product
    const ledger = await this.dbService.query<any>('SELECT store_id, product_id, SUM(quantity_change) as total_qty FROM stock_ledger GROUP BY store_id, product_id');
    const inventoryStock: Record<string, Record<string, number>> = {};
    for (const entry of ledger) {
      if (!inventoryStock[entry.store_id]) inventoryStock[entry.store_id] = {};
      inventoryStock[entry.store_id][entry.product_id] = Math.max(0, entry.total_qty || 0);
    }

    // Recent sales, expenses, debts, field sessions, transfers
    const sales = await this.dbService.query<any>('SELECT * FROM sales ORDER BY created_at DESC LIMIT 200');
    const expenses = await this.dbService.query<any>('SELECT * FROM expenses ORDER BY created_at DESC LIMIT 200');
    const debts = await this.dbService.query<any>('SELECT * FROM debts ORDER BY created_at DESC LIMIT 200');
    let salaryPayments: any[] = [];
    try {
      salaryPayments = await this.dbService.query<any>('SELECT * FROM salaries ORDER BY paid_at DESC LIMIT 200');
    } catch (e) {
      salaryPayments = [];
    }
    const fieldSessions = await this.dbService.query<any>('SELECT * FROM field_sessions ORDER BY created_at DESC LIMIT 100');
    const stockTransfers = await this.dbService.query<any>('SELECT * FROM stock_transfers ORDER BY created_at DESC LIMIT 100');

    // ── Tombstone list: deletions since last sync ────────────────────────────
    // Offline clients use this to remove locally cached records that were
    // deleted centrally.  When no `since` is provided we return ALL tombstones
    // (full sync / first sync scenario).
    let deletedRecords: Array<{ entityType: string; entityId: string; deletedAt: string }> = [];
    try {
      const rawTombstones = since
        ? await this.dbService.query<any>(
            `SELECT entity_type, entity_id, deleted_at FROM deleted_records WHERE deleted_at > ? ORDER BY deleted_at ASC`,
            [since]
          )
        : await this.dbService.query<any>(
            `SELECT entity_type, entity_id, deleted_at FROM deleted_records ORDER BY deleted_at ASC`
          );
      deletedRecords = rawTombstones.map((t: any) => ({
        entityType: t.entity_type,
        entityId: t.entity_id,
        deletedAt: t.deleted_at,
      }));
    } catch (_) {
      // Table may not exist yet on older databases — safe to ignore
      deletedRecords = [];
    }

    const serverTime = new Date().toISOString();

    return {
      success: true,
      serverTime,
      timestamp: serverTime,
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
        deletedRecords,
      },
    };
  }

  /**
   * Ingest a batch of offline transactions from a client outbox queue
   */
  public async ingestTransactionBatch(
    branchId: string,
    deviceId: string,
    transactions: Array<{ id: string; transactionType: string; payload: any; version?: number; createdAt?: string }>
  ) {
    const results: Array<{ id: string; status: 'ACK' | 'CONFLICT' | 'DUPLICATE'; error?: string; reason?: string }> = [];

    for (const tx of transactions) {
      try {
        // Idempotency check: Has this transaction UUID already been ingested centrally?
        const existing = await this.dbService.queryOne<any>(`SELECT id FROM sync_inbox WHERE id = ?`, [tx.id]);
        if (existing) {
          results.push({ id: tx.id, status: 'DUPLICATE' });
          continue;
        }

        // ── Tombstone conflict check (Last-Write-Wins) ────────────────────────
        // If the payload references an entity ID (e.g. a branch being saved)
        // and a tombstone exists for it with a deleted_at NEWER than when the
        // local client created this outbox item, the deletion wins.
        const payloadEntityId = tx.payload?.id || tx.payload?.entityId;
        if (payloadEntityId && tx.createdAt) {
          try {
            const tombstone = await this.dbService.queryOne<any>(
              `SELECT entity_id, deleted_at FROM deleted_records WHERE entity_id = ?`,
              [payloadEntityId]
            );
            if (tombstone && tombstone.deleted_at > tx.createdAt) {
              this.logger.warn(
                `CONFLICT: outbox ${tx.id} references entity ${payloadEntityId} ` +
                `deleted at ${tombstone.deleted_at} (newer than tx.createdAt=${tx.createdAt}). ` +
                `Rejection by Last-Write-Wins.`
              );
              results.push({
                id: tx.id,
                status: 'CONFLICT',
                reason: 'DELETED_REMOTELY',
                error: `Entity ${payloadEntityId} was deleted on ${tombstone.deleted_at}`,
              });
              continue;
            }
          } catch (_) {
            // deleted_records table may not exist on older server — skip conflict check
          }
        }

        await this.dbService.transaction(async () => {
          // 1. Log into sync_inbox
          await this.dbService.execute(
            `INSERT INTO sync_inbox (id, branch_id, device_id, transaction_type, payload, status)
             VALUES (?, ?, ?, ?, ?, 'PROCESSED')`,
            [tx.id, branchId, deviceId, tx.transactionType, JSON.stringify(tx.payload || {})]
          );

          // 2. Apply transaction payload to relevant table
          const p = tx.payload || {};
          const opUser = (tx as any).userId || p.userId || 'offline-sync';

          if (tx.transactionType === 'SAVE_BRANCH' || tx.transactionType === 'BRANCH') {
            await this.adminService.saveBranch(p, opUser);
          } else if (tx.transactionType === 'DELETE_BRANCH') {
            await this.adminService.deleteBranch(p.id || tx.id, opUser);
          } else if (tx.transactionType === 'SAVE_STORE' || tx.transactionType === 'STORE') {
            await this.adminService.saveStore(p, opUser);
          } else if (tx.transactionType === 'DELETE_STORE') {
            await this.adminService.deleteStore(p.id || tx.id, opUser);
          } else if (tx.transactionType === 'SAVE_DEPARTMENT' || tx.transactionType === 'DEPARTMENT') {
            await this.adminService.saveDepartment(p, opUser);
          } else if (tx.transactionType === 'DELETE_DEPARTMENT') {
            await this.adminService.deleteDepartment(p.id || tx.id, opUser);
          } else if (tx.transactionType === 'SAVE_WORKER' || tx.transactionType === 'WORKER') {
            await this.adminService.saveWorker(p, opUser);
          } else if (tx.transactionType === 'DELETE_WORKER') {
            await this.adminService.deleteWorker(p.id || tx.id, opUser);
          } else if (tx.transactionType === 'SAVE_USER' || tx.transactionType === 'USER') {
            await this.adminService.saveUser(p, opUser);
          } else if (tx.transactionType === 'DELETE_USER') {
            await this.adminService.deleteUser(p.id || tx.id, opUser);
          } else if (tx.transactionType === 'SAVE_ROLE' || tx.transactionType === 'ROLE') {
            await this.adminService.saveRole(p, opUser);
          } else if (tx.transactionType === 'DELETE_ROLE') {
            await this.adminService.deleteRole(p.id || tx.id, opUser);
          } else if (tx.transactionType === 'SAVE_VEHICLE' || tx.transactionType === 'VEHICLE') {
            await this.adminService.saveVehicle(p, opUser);
          } else if (tx.transactionType === 'DELETE_VEHICLE') {
            await this.adminService.deleteVehicle(p.id || tx.id, opUser);
          } else if (tx.transactionType === 'SAVE_PRODUCT' || tx.transactionType === 'PRODUCT') {
            await this.adminService.saveProduct(p, opUser);
          } else if (tx.transactionType === 'DELETE_PRODUCT') {
            await this.adminService.deleteProduct(p.id || tx.id, opUser);
          } else if (tx.transactionType === 'SAVE_CATEGORY' || tx.transactionType === 'CATEGORY') {
            await this.adminService.saveCategory(p, opUser);
          } else if (tx.transactionType === 'DELETE_CATEGORY') {
            await this.adminService.deleteCategory(p.id || tx.id, opUser);
          } else if (tx.transactionType === 'SAVE_BRANCH_PRICE' || tx.transactionType === 'BRANCH_PRICE' || tx.transactionType === 'SAVE_PRICE') {
            await this.adminService.saveBranchPrice(p, opUser);
          } else if (tx.transactionType === 'DELETE_BRANCH_PRICE') {
            await this.adminService.deleteBranchPrice(p.id || tx.id, opUser);
          } else if (tx.transactionType === 'SAVE_PAYMENT_METHOD' || tx.transactionType === 'PAYMENT_METHOD') {
            await this.adminService.savePaymentMethod(p, opUser);
          } else if (tx.transactionType === 'DELETE_PAYMENT_METHOD') {
            await this.adminService.deletePaymentMethod(p.id || tx.id, opUser);
          } else if (tx.transactionType === 'SAVE_EXPENSE_TYPE' || tx.transactionType === 'EXPENSE_TYPE') {
            await this.adminService.saveExpenseType(p, opUser);
          } else if (tx.transactionType === 'DELETE_EXPENSE_TYPE') {
            await this.adminService.deleteExpenseType(p.id || tx.id, opUser);
          } else if (tx.transactionType === 'SAVE_DEBT_TYPE' || tx.transactionType === 'DEBT_TYPE') {
            await this.adminService.saveDebtType(p, opUser);
          } else if (tx.transactionType === 'DELETE_DEBT_TYPE') {
            await this.adminService.deleteDebtType(p.id || tx.id, opUser);
          } else if (tx.transactionType === 'SAVE_SALARY_SETTING' || tx.transactionType === 'SALARY_SETTING') {
            await this.adminService.saveSalarySetting(p, opUser);
          } else if (tx.transactionType === 'DELETE_SALARY_SETTING') {
            await this.adminService.deleteSalarySetting(p.id || tx.id, opUser);
          } else if (tx.transactionType === 'SAVE_SYSTEM_SETTING' || tx.transactionType === 'SYSTEM_SETTING') {
            await this.adminService.saveSystemSetting(p, opUser);
          } else if (tx.transactionType === 'DELETE_SYSTEM_SETTING') {
            await this.adminService.deleteSystemSetting(p.id || tx.id, opUser);
          } else if ((tx.transactionType === 'SALE' || tx.transactionType === 'CREATE_SALE') && (p.receiptNumber || p.id)) {
            const saleId = p.id || tx.id;
            const receiptNum = p.receiptNumber || `REC-${saleId.slice(-8)}`;
            await this.dbService.execute(
              `INSERT OR REPLACE INTO sales (id, receipt_number, store_id, cashier_id, customer_name, customer_phone, total_amount_ugx, discount_amount_ugx, net_amount_ugx, paid_amount_ugx, change_amount_ugx, payment_method, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                saleId,
                receiptNum,
                p.storeId,
                p.cashierId || 'u-cashier',
                p.customerName || null,
                p.customerPhone || null,
                p.totalAmountUgx || p.subtotalUgx || 0,
                p.overallDiscountUgx || p.discountAmountUgx || 0,
                p.netAmountUgx || p.totalAmountUgx || 0,
                p.paidAmountUgx || p.totalAmountUgx || 0,
                p.changeAmountUgx || 0,
                p.paymentMethod || 'CASH',
                p.createdAt || new Date().toISOString(),
              ]
            );

            // Deduct stock ledger for items
            if (Array.isArray(p.items)) {
              for (const item of p.items) {
                await this.dbService.execute(
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
                    `POS Sale ${receiptNum}`,
                  ]
                );
              }
            }
          } else if ((tx.transactionType === 'STOCK_INTAKE' || tx.transactionType === 'ADD_STOCK_RECEIPT') && p.storeId && p.productId) {
            await this.dbService.execute(
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
          } else if (tx.transactionType === 'EXPENSE' && (p.voucherNumber || p.category)) {
            await this.dbService.execute(
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
                p.date || p.createdAt || new Date().toISOString(),
              ]
            );
          } else if (tx.transactionType === 'DEBT' && (p.debtorName || p.debtor_worker_id)) {
            await this.dbService.execute(
              `INSERT OR REPLACE INTO debts (id, debtor_customer_name, source_type, source_id, original_amount_ugx, paid_amount_ugx, balance_amount_ugx, reason, status, approved_by, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                p.id || tx.id,
                p.debtorName || p.debtor_customer_name || 'Customer',
                p.source || 'MANUAL',
                tx.id,
                p.originalAmountUgx || p.amountUgx || 0,
                p.paidAmountUgx || 0,
                p.balanceAmountUgx || p.amountUgx || 0,
                p.reason || 'Debt Record',
                p.status || 'OUTSTANDING',
                'Manager',
                p.date || p.createdAt || new Date().toISOString(),
              ]
            );
          } else if (tx.transactionType === 'FIELD_SESSION' && (p.sessionNumber || p.id)) {
            await this.dbService.execute(
              `INSERT OR REPLACE INTO field_sessions (id, session_number, store_id, vehicle_id, worker_id, status, start_time, end_time, created_by)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                p.id || tx.id,
                p.sessionNumber || `FS-${Date.now().toString().slice(-6)}`,
                p.storeId,
                p.vehicleId,
                p.workerId,
                p.status || 'CLOSED',
                p.startTime || new Date().toISOString(),
                p.endTime || new Date().toISOString(),
                p.workerName || 'Salesperson',
              ]
            );
          } else if (tx.transactionType === 'SALARY_PAYMENT' && (p.workerId || p.workerName)) {
            try {
              await this.dbService.execute(
                `INSERT OR REPLACE INTO salaries (id, worker_id, month_year, gross_salary_ugx, net_salary_ugx, status, paid_at)
                 VALUES (?, ?, ?, ?, ?, 'PAID', ?)`,
                [
                  p.id || tx.id,
                  p.workerId || tx.id,
                  p.month || new Date().toISOString().slice(0, 7),
                  p.basicSalaryUgx || 0,
                  p.netPaidUgx || p.basicSalaryUgx || 0,
                  p.paymentDate || p.createdAt || new Date().toISOString(),
                ]
              );
            } catch (_) {}
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
  public async resetProductionData(clearDemoMaster = false) {
    return await this.dbService.transaction(async () => {
      // 1. Clear all transactions, queues, logs safely
      try { await this.dbService.execute('DELETE FROM sync_outbox'); } catch (e) {}
      try { await this.dbService.execute('DELETE FROM sync_inbox'); } catch (e) {}
      try { await this.dbService.execute('DELETE FROM audit_logs'); } catch (e) {}

      // 1b. Fix column types in PostgreSQL to allow string identifiers
      const tableColumnFixes = [
        "ALTER TABLE stock_ledger ALTER COLUMN reference_id DROP DEFAULT",
        "ALTER TABLE stock_ledger ALTER COLUMN reference_id SET DATA TYPE TEXT USING reference_id::TEXT",
        "ALTER TABLE stock_ledger ALTER COLUMN created_by DROP DEFAULT",
        "ALTER TABLE stock_ledger ALTER COLUMN created_by SET DATA TYPE TEXT USING created_by::TEXT",
        "ALTER TABLE stock_ledger ALTER COLUMN device_id DROP DEFAULT",
        "ALTER TABLE stock_ledger ALTER COLUMN device_id SET DATA TYPE TEXT USING device_id::TEXT",
        "ALTER TABLE stock_ledger DROP CONSTRAINT IF EXISTS stock_ledger_created_by_fkey",
        "ALTER TABLE stock_ledger DROP CONSTRAINT IF EXISTS stock_ledger_store_id_fkey",
        "ALTER TABLE stock_ledger DROP CONSTRAINT IF EXISTS stock_ledger_product_id_fkey",
        "ALTER TABLE sync_inbox ALTER COLUMN device_id DROP DEFAULT",
        "ALTER TABLE sync_inbox ALTER COLUMN device_id SET DATA TYPE TEXT USING device_id::TEXT",
        "ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_approved_by_fkey",
        "ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_branch_id_fkey",
        "ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_store_id_fkey",
        "ALTER TABLE expenses ALTER COLUMN approved_by DROP DEFAULT",
        "ALTER TABLE expenses ALTER COLUMN approved_by SET DATA TYPE TEXT USING approved_by::TEXT",
        "ALTER TABLE debts DROP CONSTRAINT IF EXISTS debts_approved_by_fkey",
        "ALTER TABLE debts DROP CONSTRAINT IF EXISTS debts_debtor_worker_id_fkey",
        "ALTER TABLE debts DROP CONSTRAINT IF EXISTS debts_source_type_check",
        "ALTER TABLE debts ALTER COLUMN approved_by DROP DEFAULT",
        "ALTER TABLE debts ALTER COLUMN approved_by SET DATA TYPE TEXT USING approved_by::TEXT",
      ];
      for (const fixStmt of tableColumnFixes) {
        try { await this.dbService.execute(fixStmt); } catch (e) {}
      }
      try { await this.dbService.execute('DELETE FROM debt_payments'); } catch (e) {}
      try { await this.dbService.execute('DELETE FROM debts'); } catch (e) {}
      try { await this.dbService.execute('DELETE FROM salary_payments'); } catch (e) {}
      try { await this.dbService.execute('DELETE FROM salaries'); } catch (e) {}
      try { await this.dbService.execute('DELETE FROM expenses'); } catch (e) {}
      try { await this.dbService.execute('DELETE FROM field_reconciliations'); } catch (e) {}
      try { await this.dbService.execute('DELETE FROM field_session_items'); } catch (e) {}
      try { await this.dbService.execute('DELETE FROM field_sessions'); } catch (e) {}
      try { await this.dbService.execute('DELETE FROM sale_items'); } catch (e) {}
      try { await this.dbService.execute('DELETE FROM sales'); } catch (e) {}
      try { await this.dbService.execute('DELETE FROM stock_transfer_items'); } catch (e) {}
      try { await this.dbService.execute('DELETE FROM stock_transfers'); } catch (e) {}
      try { await this.dbService.execute('DELETE FROM stock_ledger'); } catch (e) {}
      try { await this.dbService.execute('DELETE FROM deleted_records'); } catch (e) {}

      if (clearDemoMaster) {
        try { await this.dbService.execute('DELETE FROM branch_product_prices'); } catch (e) {}
        try { await this.dbService.execute('DELETE FROM products'); } catch (e) {}
        try { await this.dbService.execute('DELETE FROM vehicles'); } catch (e) {}
        try { await this.dbService.execute('DELETE FROM workers'); } catch (e) {}
        try {
          await this.dbService.execute("UPDATE users SET branch_id = NULL, store_id = NULL WHERE username = 'admin'");
        } catch (e) {
          try { await this.dbService.execute("UPDATE users SET branch_id = '', store_id = '' WHERE username = 'admin'"); } catch (_) {}
        }
        try { await this.dbService.execute("DELETE FROM users WHERE username != 'admin'"); } catch (e) {}
        try { await this.dbService.execute('DELETE FROM stores'); } catch (e) {}
        try { await this.dbService.execute('DELETE FROM branches'); } catch (e) {}
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

  public async getPendingOutboxItems() {
    return await this.dbService.query<any>(
      `SELECT * FROM sync_outbox WHERE status IN ('PENDING', 'FAILED') ORDER BY created_at ASC LIMIT 50`
    );
  }

  public async updateOutboxStatus(id: string, status: SyncStatus, errorMsg?: string) {
    if (status === SyncStatus.SYNCED) {
      await this.dbService.execute(
        `UPDATE sync_outbox SET status = ?, synced_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [status, id]
      );
    } else {
      await this.dbService.execute(
        `UPDATE sync_outbox SET status = ?, retry_count = retry_count + 1, last_error = ? WHERE id = ?`,
        [status, errorMsg || null, id]
      );
    }
  }
}

