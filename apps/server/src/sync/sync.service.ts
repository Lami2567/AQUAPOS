import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { AdminService } from '../admin/admin.service.js';
import { SyncStatus } from '@water-business/shared-types';
import { v4 as uuidv4 } from 'uuid';

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
    const rawBranches = await this.dbService.query<any>('SELECT * FROM branches ORDER BY name ASC');
    const branches = rawBranches.map((b) => ({
      id: b.id,
      code: b.code,
      name: b.name,
      location: b.location || '',
      isActive: b.is_active !== undefined ? Boolean(b.is_active) : true,
      createdAt: b.created_at,
    }));

    const rawStores = await this.dbService.query<any>('SELECT * FROM stores ORDER BY name ASC');
    const stores = rawStores.map((s) => ({
      id: s.id,
      branchId: s.branch_id,
      code: s.code,
      name: s.name,
      type: s.type,
      isActive: s.is_active !== undefined ? Boolean(s.is_active) : true,
    }));

    const rawDepartments = await this.dbService.query<any>('SELECT * FROM departments ORDER BY name ASC');
    const departments = rawDepartments.map((d) => ({
      id: d.id,
      code: d.code,
      name: d.name,
      description: d.description || '',
      isActive: d.is_active !== undefined ? Boolean(d.is_active) : true,
      createdAt: d.created_at,
    }));

    const rawWorkers = await this.dbService.query<any>('SELECT * FROM workers ORDER BY full_name ASC');
    const workers = rawWorkers.map((w) => ({
      id: w.id,
      branchId: w.branch_id || '',
      department: w.department || '',
      fullName: w.full_name || '',
      phone: w.phone || '',
      role: w.role || 'FIELD_SALESPERSON',
      basicSalaryUgx: Number(w.basic_salary_ugx || 0),
      isActive: w.is_active !== undefined ? Boolean(w.is_active) : true,
    }));

    const rawUsers = await this.dbService.query<any>('SELECT id, username, full_name, role, branch_id, store_id, is_active, created_at FROM users ORDER BY username ASC');
    const users = rawUsers.map((u) => ({
      id: u.id,
      username: u.username,
      fullName: u.full_name,
      role: u.role,
      branchId: u.branch_id || '',
      storeId: u.store_id || '',
      isActive: u.is_active !== undefined ? Boolean(u.is_active) : true,
      createdAt: u.created_at,
      updatedAt: u.created_at,
    }));

    const rawRoles = await this.dbService.query<any>('SELECT * FROM roles ORDER BY display_name ASC');
    const roles = rawRoles.map((r) => ({
      id: r.id,
      code: r.code,
      displayName: r.display_name,
      description: r.description || '',
      permissions: typeof r.permissions === 'string' ? (() => { try { return JSON.parse(r.permissions); } catch(e) { return []; } })() : (r.permissions || []),
      isActive: r.is_active !== undefined ? Boolean(r.is_active) : true,
    }));

    const rawVehicles = await this.dbService.query<any>('SELECT * FROM vehicles ORDER BY registration_number ASC');
    const vehicles = rawVehicles.map((v) => ({
      id: v.id,
      branchId: v.branch_id || '',
      registrationNumber: v.registration_number,
      type: v.type,
      model: v.model,
      isActive: v.is_active !== undefined ? Boolean(v.is_active) : true,
    }));

    const rawProducts = await this.dbService.query<any>('SELECT * FROM products ORDER BY name ASC');
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
      isActive: p.is_active !== undefined ? Boolean(p.is_active) : true,
    }));

    const rawCategories = await this.dbService.query<any>('SELECT * FROM categories ORDER BY name ASC');
    const categories = rawCategories.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      description: c.description || '',
      isActive: c.is_active !== undefined ? Boolean(c.is_active) : true,
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
      if (!entry.store_id || !entry.product_id) continue;
      if (!inventoryStock[entry.store_id]) inventoryStock[entry.store_id] = {};
      inventoryStock[entry.store_id][entry.product_id] = Math.max(0, Number(entry.total_qty || 0));
    }

    // Recent sales, expenses, debts, field sessions, transfers
    const rawSales = await this.dbService.query<any>('SELECT * FROM sales ORDER BY created_at DESC LIMIT 500');
    const saleIds = rawSales.map((s) => s.id).filter(Boolean);
    let allSaleItems: any[] = [];
    if (saleIds.length > 0) {
      try {
        allSaleItems = await this.dbService.query<any>(
          `SELECT * FROM sale_items WHERE sale_id IN (${saleIds.map(() => '?').join(',')})`,
          saleIds
        );
      } catch (err: any) {
        this.logger.warn('Failed to query sale_items in pullCentralData: ' + err.message);
      }
    }
    const itemsBySaleId = new Map<string, any[]>();
    for (const item of allSaleItems) {
      if (!itemsBySaleId.has(item.sale_id)) {
        itemsBySaleId.set(item.sale_id, []);
      }
      itemsBySaleId.get(item.sale_id)!.push({
        id: item.id,
        productId: item.product_id,
        name: item.product_name,
        quantity: Number(item.quantity || 0),
        unitPriceUgx: Number(item.unit_price_ugx || 0),
        discountUgx: Number(item.discount_ugx || 0),
        subtotalUgx: Number(item.subtotal_ugx || 0),
      });
    }

    const sales = rawSales.map((s) => ({
      ...s,
      items: itemsBySaleId.get(s.id) || [],
    }));

    let expenses: any[] = [];
    try {
      expenses = await this.dbService.query<any>('SELECT * FROM expenses ORDER BY created_at DESC LIMIT 200');
    } catch (e: any) {
      this.logger.warn('Failed to query expenses in pullCentralData: ' + e.message);
      expenses = [];
    }

    let debts: any[] = [];
    try {
      debts = await this.dbService.query<any>('SELECT * FROM debts ORDER BY created_at DESC LIMIT 200');
    } catch (e: any) {
      this.logger.warn('Failed to query debts in pullCentralData: ' + e.message);
      debts = [];
    }

    let salaryPayments: any[] = [];
    try {
      salaryPayments = await this.dbService.query<any>('SELECT * FROM salaries ORDER BY paid_at DESC LIMIT 200');
    } catch (e) {
      salaryPayments = [];
    }

    let rawSessions: any[] = [];
    try {
      rawSessions = await this.dbService.query<any>('SELECT * FROM field_sessions ORDER BY created_at DESC LIMIT 100');
    } catch (e: any) {
      this.logger.warn('Failed to query field_sessions in pullCentralData: ' + e.message);
      rawSessions = [];
    }

    let rawReconciliations: any[] = [];
    try {
      rawReconciliations = await this.dbService.query<any>('SELECT * FROM field_reconciliations ORDER BY created_at DESC LIMIT 100');
    } catch (e) {
      rawReconciliations = [];
    }

    const reconByFsId = new Map<string, any>();
    for (const r of rawReconciliations) {
      const fsKey = String(r.field_session_id || '');
      if (fsKey && !reconByFsId.has(fsKey)) {
        reconByFsId.set(fsKey, r);
      }
    }

    const sessionIds = rawSessions.map((s) => s.id).filter(Boolean);
    let allSessionItems: any[] = [];
    if (sessionIds.length > 0) {
      try {
        allSessionItems = await this.dbService.query<any>(
          `SELECT * FROM field_session_items WHERE field_session_id IN (${sessionIds.map(() => '?').join(',')})`,
          sessionIds
        );
      } catch (err: any) {
        this.logger.warn('Failed to query field_session_items in pullCentralData: ' + err.message);
      }
    }
    const itemsBySessionId = new Map<string, any[]>();
    for (const item of allSessionItems) {
      const fsKey = String(item.field_session_id || '');
      if (!itemsBySessionId.has(fsKey)) {
        itemsBySessionId.set(fsKey, []);
      }
      itemsBySessionId.get(fsKey)!.push({
        id: item.id,
        productId: item.product_id,
        name: item.product_name,
        issuedQty: Number(item.issued_qty || 0),
        soldQty: Number(item.sold_qty || 0),
        returnedQty: Number(item.returned_qty || 0),
        damagedQty: Number(item.damaged_qty || 0),
        missingQty: Number(item.missing_qty || 0),
        unitPriceUgx: Number(item.unit_price_ugx || 0),
      });
    }

    // Secondary fallback from expenses table if needed
    const expByFsId = new Map<string, { amount: number; description: string }>();
    for (const exp of expenses) {
      const fsId = exp.field_session_id || (exp.id && String(exp.id).startsWith('exp-fs-') ? String(exp.id).replace('exp-fs-', '') : null);
      if (fsId && !expByFsId.has(String(fsId))) {
        expByFsId.set(String(fsId), {
          amount: Number(exp.amount_ugx || 0),
          description: exp.description || '',
        });
      }
    }

    const fieldSessions = rawSessions.map((fs) => {
      const fsKey = String(fs.id);
      const fallbackExp = expByFsId.get(fsKey);
      const recon = reconByFsId.get(fsKey);
      const approvedExpensesUgx = Number(
        fs.approved_expenses_ugx !== undefined && fs.approved_expenses_ugx !== null && Number(fs.approved_expenses_ugx) > 0
          ? fs.approved_expenses_ugx
          : (recon?.approved_expenses_ugx || fallbackExp?.amount || 0)
      );
      const expenseDescription =
        (fs.expense_description && String(fs.expense_description).trim()) ||
        (recon?.expense_description && String(recon.expense_description).trim()) ||
        (recon?.notes && String(recon.notes).trim()) ||
        fallbackExp?.description ||
        '';
      return {
        id: fs.id,
        sessionNumber: fs.session_number,
        storeId: fs.store_id,
        returnStoreId: fs.return_store_id || recon?.return_store_id || fs.store_id,
        vehicleId: fs.vehicle_id,
        workerId: fs.worker_id,
        status: fs.status,
        startTime: fs.start_time,
        endTime: fs.end_time,
        approvedExpensesUgx,
        expenseDescription,
        createdBy: fs.created_by,
        createdAt: fs.created_at,
        items: itemsBySessionId.get(fsKey) || [],
      };
    });

    let stockTransfers: any[] = [];
    try {
      const rawTransfers = await this.dbService.query<any>(`
        SELECT st.*, 
               src.name as source_store_name, 
               dst.name as dest_store_name, 
               sti.product_id, 
               COALESCE(sti.quantity_requested, sti.quantity_dispatched, sti.quantity_received, 0) as quantity_requested,
               p.name as product_name,
               v.model as vehicle_model,
               v.registration_number as vehicle_reg
        FROM stock_transfers st
        LEFT JOIN stores src ON st.source_store_id = src.id
        LEFT JOIN stores dst ON st.destination_store_id = dst.id
        LEFT JOIN stock_transfer_items sti ON st.id = sti.transfer_id
        LEFT JOIN products p ON sti.product_id = p.id
        LEFT JOIN vehicles v ON st.vehicle_id = v.id
        ORDER BY st.created_at DESC LIMIT 100
      `);
      stockTransfers = rawTransfers.map((t: any) => ({
        id: t.id,
        transferNumber: t.transfer_number || `TRF-${t.id.slice(-6)}`,
        sourceStoreId: t.source_store_id,
        sourceStoreName: t.source_store_name || 'Source Store',
        destStoreId: t.destination_store_id,
        destStoreName: t.dest_store_name || 'Destination Store',
        productId: t.product_id || '',
        productName: t.product_name || 'Product',
        quantity: Number(t.quantity_requested || 0),
        vehicleName: t.vehicle_model ? `${t.vehicle_model} (${t.vehicle_reg})` : (t.notes || 'Delivery Vehicle'),
        status: t.status,
        date: t.created_at ? new Date(t.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
      }));
    } catch (e) {
      stockTransfers = [];
    }

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

            // Deduct stock ledger for items (POS in-store sales only; field route sales stock was already deducted via FIELD_ISSUE)
            const isFieldSale = Boolean(
              p.isFieldSale ||
              (saleId && (saleId.startsWith('sale-fs-') || saleId.startsWith('fs-'))) ||
              (receiptNum && (receiptNum.startsWith('FS-') || receiptNum.startsWith('REC-FS-')))
            );

            if (!isFieldSale && Array.isArray(p.items)) {
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
          } else if (tx.transactionType === 'STOCK_ADJUSTMENT' && p.storeId && p.productId) {
            const deltaQty = typeof p.adjustmentDelta === 'number' ? p.adjustmentDelta : ((p.newQuantity || 0) - (p.previousQuantity || 0));
            await this.dbService.execute(
              `INSERT INTO stock_ledger (id, store_id, product_id, movement_type, quantity_change, unit_cost_ugx, reference_type, reference_id, created_by, device_id, notes)
               VALUES (?, ?, ?, 'ADJUSTMENT', ?, 0, 'AUDIT_ADJUSTMENT', ?, ?, ?, ?)`,
              [
                tx.id,
                p.storeId,
                p.productId,
                deltaQty,
                p.receiptNumber || tx.id,
                p.adjustedBy || 'u-admin',
                deviceId,
                `Stock Adjustment: ${p.reason || 'Audit Correction'}${p.notes ? ` - ${p.notes}` : ''}`,
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
          } else if ((tx.transactionType === 'FIELD_SESSION' || tx.transactionType === 'START_FIELD_SESSION') && p.status !== 'RECONCILED' && (p.sessionNumber || p.id)) {
            const fsId = p.id || tx.id;
            const fsStatus = p.status || 'OPEN';

            let safeStartTime = new Date().toISOString();
            if (p.startTime) {
              const d = new Date(p.startTime);
              if (!isNaN(d.getTime())) safeStartTime = d.toISOString();
            }

            let safeEndTime: string | null = null;
            if (p.endTime) {
              const d = new Date(p.endTime);
              if (!isNaN(d.getTime())) safeEndTime = d.toISOString();
            }

            const safeWorkerName = p.workerName || 'Salesperson';
            const safeVehicleId = p.vehicleId || 'default-van';
            const safeWorkerId = p.workerId || 'w-salesperson';

            const existingSession = await this.dbService.queryOne<any>(
              `SELECT id FROM field_sessions WHERE id = ?`,
              [fsId]
            );

            if (existingSession) {
              await this.dbService.execute(
                `UPDATE field_sessions SET session_number = ?, store_id = ?, vehicle_id = ?, worker_id = ?, status = ?, start_time = ? WHERE id = ?`,
                [
                  p.sessionNumber || existingSession.session_number,
                  p.storeId || existingSession.store_id,
                  safeVehicleId,
                  safeWorkerId,
                  fsStatus,
                  safeStartTime,
                  fsId,
                ]
              );
            } else {
              await this.dbService.execute(
                `INSERT INTO field_sessions (id, session_number, store_id, vehicle_id, worker_id, status, start_time, end_time, created_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  fsId,
                  p.sessionNumber || `FS-${Date.now().toString().slice(-6)}`,
                  p.storeId,
                  safeVehicleId,
                  safeWorkerId,
                  fsStatus,
                  safeStartTime,
                  safeEndTime,
                  safeWorkerName,
                ]
              );
            }

            // Record issued items and ledger entry for store stock reduction
            if (Array.isArray(p.items)) {
              for (const item of p.items) {
                const issuedQty = Number(item.issuedQty || 0);
                if (issuedQty > 0) {
                  const existingItem = await this.dbService.queryOne<any>(
                    `SELECT id FROM field_session_items WHERE field_session_id = ? AND product_id = ?`,
                    [fsId, item.productId]
                  );

                  if (existingItem) {
                    await this.dbService.execute(
                      `UPDATE field_session_items SET product_name = ?, issued_qty = ?, unit_price_ugx = ? WHERE id = ?`,
                      [item.name || 'Water Product', issuedQty, Number(item.unitPriceUgx || 0), existingItem.id]
                    );
                  } else {
                    await this.dbService.execute(
                      `INSERT INTO field_session_items (id, field_session_id, product_id, product_name, issued_qty, sold_qty, returned_qty, damaged_qty, missing_qty, unit_price_ugx)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                      [
                        uuidv4(),
                        fsId,
                        item.productId,
                        item.name || 'Water Product',
                        issuedQty,
                        Number(item.soldQty || 0),
                        Number(item.returnedQty || 0),
                        Number(item.damagedQty || 0),
                        Number(item.missingQty || 0),
                        Number(item.unitPriceUgx || 0),
                      ]
                    );
                  }

                  // Deduct from Store stock via FIELD_ISSUE in stock_ledger (idempotent)
                  const existingIssue = await this.dbService.queryOne<any>(
                    `SELECT id FROM stock_ledger WHERE reference_id = ? AND product_id = ? AND movement_type = 'FIELD_ISSUE'`,
                    [fsId, item.productId]
                  );

                  if (!existingIssue) {
                    await this.dbService.execute(
                      `INSERT INTO stock_ledger (id, store_id, product_id, movement_type, quantity_change, unit_cost_ugx, reference_type, reference_id, created_by, device_id, notes)
                       VALUES (?, ?, ?, 'FIELD_ISSUE', ?, ?, 'FIELD_SESSION', ?, ?, ?, ?)`,
                      [
                        uuidv4(),
                        p.storeId,
                        item.productId,
                        -issuedQty,
                        Number(item.unitPriceUgx || 0),
                        fsId,
                        p.workerName || opUser,
                        deviceId,
                        `Field Session Issue ${p.sessionNumber || fsId}`,
                      ]
                    );
                  }
                }
              }
            }
          } else if ((tx.transactionType === 'RECONCILE_FIELD_SESSION' || (tx.transactionType === 'FIELD_SESSION' && p.status === 'RECONCILED')) && (p.sessionId || p.id)) {
            const fsId = p.sessionId || p.id;
            const session = await this.dbService.queryOne<any>(`SELECT * FROM field_sessions WHERE id = ?`, [fsId]);
            const storeId = p.storeId || session?.store_id;
            const returnStoreId = p.returnStoreId || session?.return_store_id || storeId;
            const sessionNum = p.sessionNumber || session?.session_number || `FS-${fsId.slice(-6)}`;
            const workerId = p.workerId || session?.worker_id || 'w-salesperson';
            const workerName = p.workerName || session?.created_by || 'Salesperson';

            let safeEndTime = new Date().toISOString();
            if (p.endTime) {
              const d = new Date(p.endTime);
              if (!isNaN(d.getTime())) safeEndTime = d.toISOString();
            }

            const expAmount = Number(p.approvedExpensesUgx || 0);
            const expenseDesc = (p.expenseDescription || p.notes || '').trim() || null;

            await this.dbService.execute(
              `UPDATE field_sessions SET status = 'RECONCILED', return_store_id = ?, end_time = ?, approved_expenses_ugx = ?, expense_description = ? WHERE id = ?`,
              [returnStoreId, safeEndTime, expAmount, expenseDesc, fsId]
            );

            let totalSoldUnits = 0;
            let totalExpectedSalesUgx = 0;

            if (Array.isArray(p.items)) {
              for (const item of p.items) {
                const soldQty = Number(item.soldQty || 0);
                const returnedQty = Number(item.returnedQty || 0);
                const damagedQty = Number(item.damagedQty || 0);
                const missingQty = Number(item.missingQty || 0);
                const unitPrice = Number(item.unitPriceUgx || 0);

                totalSoldUnits += soldQty;
                totalExpectedSalesUgx += soldQty * unitPrice;

                const existingItem = await this.dbService.queryOne<any>(
                  `SELECT id FROM field_session_items WHERE field_session_id = ? AND product_id = ?`,
                  [fsId, item.productId]
                );

                if (existingItem) {
                  await this.dbService.execute(
                    `UPDATE field_session_items SET sold_qty = ?, returned_qty = ?, damaged_qty = ?, missing_qty = ?, unit_price_ugx = ? WHERE id = ?`,
                    [soldQty, returnedQty, damagedQty, missingQty, unitPrice, existingItem.id]
                  );
                } else {
                  await this.dbService.execute(
                    `INSERT INTO field_session_items (id, field_session_id, product_id, product_name, issued_qty, sold_qty, returned_qty, damaged_qty, missing_qty, unit_price_ugx)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                      uuidv4(),
                      fsId,
                      item.productId,
                      item.name || 'Water Product',
                      Number(item.issuedQty || 0),
                      soldQty,
                      returnedQty,
                      damagedQty,
                      missingQty,
                      unitPrice,
                    ]
                  );
                }

                // Credit returned stock back to selected destination return store ledger
                if (returnedQty > 0 && returnStoreId) {
                  const existingReturn = await this.dbService.queryOne<any>(
                    `SELECT id FROM stock_ledger WHERE reference_id = ? AND product_id = ? AND movement_type = 'FIELD_RETURN'`,
                    [fsId, item.productId]
                  );
                  if (!existingReturn) {
                    await this.dbService.execute(
                      `INSERT INTO stock_ledger (id, store_id, product_id, movement_type, quantity_change, unit_cost_ugx, reference_type, reference_id, created_by, device_id, notes)
                       VALUES (?, ?, ?, 'FIELD_RETURN', ?, ?, 'FIELD_SESSION', ?, ?, ?, ?)`,
                      [
                        uuidv4(),
                        returnStoreId,
                        item.productId,
                        returnedQty,
                        unitPrice,
                        fsId,
                        workerName,
                        deviceId,
                        `Field Session Return ${sessionNum} to Store ${returnStoreId}`,
                      ]
                    );
                  }
                }
              }
            }

            // Record sale and revenue in sales and sale_items
            const grossSalesRevenue = Number(p.expectedSalesUgx || totalExpectedSalesUgx || 0);
            if (grossSalesRevenue > 0 && storeId) {
              const saleId = `sale-fs-${fsId}`;
              const cashCol = Number(p.cashCollectedUgx || 0);
              const mmCol = Number(p.mobileMoneyUgx || 0);
              const bankCol = Number(p.bankDepositUgx || 0);
              const payMethod = mmCol > cashCol ? 'MOBILE_MONEY' : (bankCol > cashCol ? 'BANK_TRANSFER' : 'CASH');

              await this.dbService.execute(
                `INSERT OR REPLACE INTO sales (id, receipt_number, store_id, cashier_id, customer_name, customer_phone, total_amount_ugx, discount_amount_ugx, net_amount_ugx, paid_amount_ugx, change_amount_ugx, payment_method, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  saleId,
                  sessionNum,
                  storeId,
                  workerId,
                  `Field Route Sales (${workerName})`,
                  null,
                  grossSalesRevenue,
                  0,
                  grossSalesRevenue,
                  cashCol + mmCol + bankCol,
                  Number(p.cashRemainingUgx || 0),
                  payMethod,
                  p.date || p.endTime || new Date().toISOString(),
                ]
              );

              if (Array.isArray(p.items)) {
                for (const item of p.items) {
                  const soldQty = Number(item.soldQty || 0);
                  if (soldQty > 0) {
                    const lineSubtotal = soldQty * Number(item.unitPriceUgx || 0);
                    await this.dbService.execute(
                      `INSERT OR REPLACE INTO sale_items (id, sale_id, product_id, product_name, quantity, unit_price_ugx, discount_ugx, subtotal_ugx)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                      [
                        `${saleId}-${item.productId}`,
                        saleId,
                        item.productId,
                        item.name || 'Water Product',
                        soldQty,
                        Number(item.unitPriceUgx || 0),
                        0,
                        lineSubtotal,
                      ]
                    );
                  }
                }
              }
            }

            // Record approved field expenses
            if (expAmount > 0) {
              const expId = `exp-fs-${fsId}`;
              const safeExpDesc = (p.expenseDescription || p.notes || '').trim() || `Approved Route Expenses (${sessionNum})`;
              await this.dbService.execute(
                `INSERT OR REPLACE INTO expenses (id, branch_id, store_id, field_session_id, category, amount_ugx, description, approved_by, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  expId,
                  branchId,
                  storeId || null,
                  fsId,
                  'FIELD_EXPENSE',
                  expAmount,
                  safeExpDesc,
                  workerName,
                  p.date || p.endTime || new Date().toISOString(),
                ]
              );
            }

            // Record worker debt if shortage
            const variance = Number(p.moneyVarianceUgx || 0);
            if (variance < 0) {
              const shortage = Math.abs(variance);
              const debtId = `debt-fs-${fsId}`;
              await this.dbService.execute(
                `INSERT OR REPLACE INTO debts (id, debtor_customer_name, source_type, source_id, original_amount_ugx, paid_amount_ugx, balance_amount_ugx, reason, status, approved_by, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  debtId,
                  workerName,
                  'FIELD_SHORTAGE',
                  fsId,
                  shortage,
                  0,
                  shortage,
                  `Shortage on field route ${sessionNum}`,
                  'OUTSTANDING',
                  'Branch Manager',
                  p.date || p.endTime || new Date().toISOString(),
                ]
              );
            }

            // Record in field_reconciliations
            const existingRecon = await this.dbService.queryOne<any>(
              `SELECT id FROM field_reconciliations WHERE field_session_id = ?`,
              [fsId]
            );

            if (existingRecon) {
              await this.dbService.execute(
                `UPDATE field_reconciliations SET return_store_id = ?, total_issued_units = ?, total_sold_units = ?, total_returned_units = ?, total_damaged_units = ?, total_missing_units = ?, is_stock_equation_valid = ?, expected_sales_ugx = ?, cash_collected_ugx = ?, mobile_money_ugx = ?, bank_deposit_ugx = ?, approved_expenses_ugx = ?, cash_remaining_ugx = ?, total_accounted_money_ugx = ?, money_variance_ugx = ?, is_money_equation_valid = ?, status = ?, notes = ?, expense_description = ?, reconciled_by = ? WHERE id = ?`,
                [
                  returnStoreId,
                  Number(p.totalIssuedUnits || 0),
                  totalSoldUnits,
                  Number(p.totalReturnedUnits || 0),
                  Number(p.totalDamagedUnits || 0),
                  Number(p.totalMissingUnits || 0),
                  1,
                  grossSalesRevenue,
                  Number(p.cashCollectedUgx || 0),
                  Number(p.mobileMoneyUgx || 0),
                  Number(p.bankDepositUgx || 0),
                  expAmount,
                  Number(p.cashRemainingUgx || 0),
                  Number(p.totalAccountedMoneyUgx || 0),
                  variance,
                  variance === 0 ? 1 : 0,
                  variance < 0 ? 'SHORTAGE_FLAGGED' : (variance > 0 ? 'SURPLUS_FLAGGED' : 'BALANCED'),
                  p.notes || null,
                  expenseDesc,
                  p.reconciledBy || workerName,
                  existingRecon.id,
                ]
              );
            } else {
              await this.dbService.execute(
                `INSERT INTO field_reconciliations (id, field_session_id, return_store_id, total_issued_units, total_sold_units, total_returned_units, total_damaged_units, total_missing_units, is_stock_equation_valid, expected_sales_ugx, cash_collected_ugx, mobile_money_ugx, bank_deposit_ugx, approved_expenses_ugx, cash_remaining_ugx, total_accounted_money_ugx, money_variance_ugx, is_money_equation_valid, status, notes, expense_description, reconciled_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  uuidv4(),
                  fsId,
                  returnStoreId,
                  Number(p.totalIssuedUnits || 0),
                  totalSoldUnits,
                  Number(p.totalReturnedUnits || 0),
                  Number(p.totalDamagedUnits || 0),
                  Number(p.totalMissingUnits || 0),
                  1,
                  grossSalesRevenue,
                  Number(p.cashCollectedUgx || 0),
                  Number(p.mobileMoneyUgx || 0),
                  Number(p.bankDepositUgx || 0),
                  expAmount,
                  Number(p.cashRemainingUgx || 0),
                  Number(p.totalAccountedMoneyUgx || 0),
                  variance,
                  variance === 0 ? 1 : 0,
                  variance < 0 ? 'SHORTAGE_FLAGGED' : (variance > 0 ? 'SURPLUS_FLAGGED' : 'BALANCED'),
                  p.notes || null,
                  expenseDesc,
                  p.reconciledBy || workerName,
                ]
              );
            }
          } else if ((tx.transactionType === 'CREATE_STOCK_TRANSFER' || tx.transactionType === 'STOCK_TRANSFER') && (p.sourceStoreId || p.source_store_id)) {
            const trfId = p.id || tx.id;
            const trfNumber = p.transferNumber || p.transfer_number || `TRF-${trfId.slice(-6)}`;
            const srcStore = p.sourceStoreId || p.source_store_id;
            const dstStore = p.destStoreId || p.destination_store_id;
            const prodId = p.productId || p.product_id;
            const qty = Number(p.quantity || p.quantityRequested || 0);
            const status = p.status || 'DRAFT';

            await this.dbService.execute(
              `INSERT OR REPLACE INTO stock_transfers (id, transfer_number, source_store_id, destination_store_id, vehicle_id, driver_worker_id, status, created_by, notes, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                trfId,
                trfNumber,
                srcStore,
                dstStore,
                p.vehicleId || null,
                p.driverWorkerId || null,
                status,
                p.createdBy || opUser,
                p.vehicleName || p.notes || null,
                p.createdAt || new Date().toISOString(),
              ]
            );

            if (prodId && qty > 0) {
              await this.dbService.execute(
                `INSERT OR REPLACE INTO stock_transfer_items (id, transfer_id, product_id, unit_of_measure, quantity_requested, quantity_dispatched, quantity_received, unit_price_ugx)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  `${trfId}-${prodId}`,
                  trfId,
                  prodId,
                  'Carton',
                  qty,
                  status === 'CONFIRMED' || status === 'IN_TRANSIT' ? qty : 0,
                  status === 'CONFIRMED' ? qty : 0,
                  0,
                ]
              );
            }
          } else if (tx.transactionType === 'ADVANCE_STOCK_TRANSFER' && (p.transferId || p.id)) {
            const trfId = p.transferId || p.id;
            const nextStatus = p.nextStatus || p.status;
            const srcStore = p.sourceStoreId || p.source_store_id;
            const dstStore = p.destStoreId || p.destination_store_id;
            const prodId = p.productId || p.product_id;
            const qty = Number(p.quantity || 0);

            await this.dbService.execute(
              `UPDATE stock_transfers SET status = ? WHERE id = ?`,
              [nextStatus, trfId]
            );

            // Deduct stock from source store on DISPATCH / IN_TRANSIT / CONFIRMED
            if ((nextStatus === 'IN_TRANSIT' || nextStatus === 'DISPATCHED' || nextStatus === 'CONFIRMED') && srcStore && prodId && qty > 0) {
              const existingOut = await this.dbService.queryOne<any>(
                `SELECT id FROM stock_ledger WHERE reference_id = ? AND store_id = ? AND movement_type = 'TRANSFER_OUT'`,
                [trfId, srcStore]
              );
              if (!existingOut) {
                await this.dbService.execute(
                  `INSERT INTO stock_ledger (id, store_id, product_id, movement_type, quantity_change, unit_cost_ugx, reference_type, reference_id, created_by, device_id, notes)
                   VALUES (?, ?, ?, 'TRANSFER_OUT', ?, 0, 'STOCK_TRANSFER', ?, ?, ?, ?)`,
                  [
                    `${trfId}-out`,
                    srcStore,
                    prodId,
                    -Math.abs(qty),
                    trfId,
                    opUser,
                    deviceId,
                    `Stock Transfer Out (${trfId}) to Store ${dstStore}`,
                  ]
                );
              }
            }

            // Credit stock to destination store on CONFIRMED
            if (nextStatus === 'CONFIRMED' && dstStore && prodId && qty > 0) {
              const existingIn = await this.dbService.queryOne<any>(
                `SELECT id FROM stock_ledger WHERE reference_id = ? AND store_id = ? AND movement_type = 'TRANSFER_IN'`,
                [trfId, dstStore]
              );
              if (!existingIn) {
                await this.dbService.execute(
                  `INSERT INTO stock_ledger (id, store_id, product_id, movement_type, quantity_change, unit_cost_ugx, reference_type, reference_id, created_by, device_id, notes)
                   VALUES (?, ?, ?, 'TRANSFER_IN', ?, 0, 'STOCK_TRANSFER', ?, ?, ?, ?)`,
                  [
                    `${trfId}-in`,
                    dstStore,
                    prodId,
                    Math.abs(qty),
                    trfId,
                    opUser,
                    deviceId,
                    `Stock Transfer In (${trfId}) from Store ${srcStore}`,
                  ]
                );
              }
            }
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

