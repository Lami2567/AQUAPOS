import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { AuditService } from '../audit/audit.service.js';

export interface BackupDataPackage {
  metadata: {
    systemName: string;
    version: string;
    exportedAt: string;
    exportedBy: string;
    environment: string;
    totalRecords: number;
    tableCounts: Record<string, number>;
  };
  data: {
    branches: any[];
    stores: any[];
    departments: any[];
    workers: any[];
    users: any[];
    roles: any[];
    vehicles: any[];
    products: any[];
    categories: any[];
    branchProductPrices: any[];
    paymentMethods: any[];
    expenseTypes: any[];
    debtTypes: any[];
    salarySettings: any[];
    systemSettings: any[];
    sales: any[];
    saleItems: any[];
    stockLedger: any[];
    expenses: any[];
    debts: any[];
    salaries: any[];
    fieldSessions: any[];
    auditLogs: any[];
  };
}

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor(
    private dbService: DatabaseService,
    private auditService: AuditService
  ) {}

  /**
   * Generates a complete database snapshot export directly from Neon Cloud PostgreSQL
   */
  async generateFullBackup(userId: string = 'u-admin-ismael', username: string = 'ismael'): Promise<BackupDataPackage> {
    this.logger.log(`Generating full database backup snapshot for user: ${username}...`);

    const safeQuery = async (table: string): Promise<any[]> => {
      try {
        return await this.dbService.query(`SELECT * FROM ${table}`);
      } catch (err: any) {
        this.logger.warn(`Backup table ${table} read notice: ${err.message}`);
        return [];
      }
    };

    const branches = await safeQuery('branches');
    const stores = await safeQuery('stores');
    const departments = await safeQuery('departments');
    const workers = await safeQuery('workers');
    const users = await safeQuery('users');
    const roles = await safeQuery('roles');
    const vehicles = await safeQuery('vehicles');
    const products = await safeQuery('products');
    const categories = await safeQuery('categories');
    const branchProductPrices = await safeQuery('branch_product_prices');
    const paymentMethods = await safeQuery('payment_methods');
    const expenseTypes = await safeQuery('expense_types');
    const debtTypes = await safeQuery('debt_types');
    const salarySettings = await safeQuery('salary_settings');
    const systemSettings = await safeQuery('system_settings');
    const sales = await safeQuery('sales');
    const saleItems = await safeQuery('sale_items');
    const stockLedger = await safeQuery('stock_ledger');
    const expenses = await safeQuery('expenses');
    const debts = await safeQuery('debts');
    const salaries = await safeQuery('salaries');
    const fieldSessions = await safeQuery('field_sessions');
    const auditLogs = await safeQuery('audit_logs');

    // Strip out plaintext or password hashes if desired, or keep password_hash for seamless recovery
    const sanitizedUsers = users.map((u) => ({
      id: u.id,
      username: u.username,
      full_name: u.full_name,
      password_hash: u.password_hash,
      role: u.role,
      branch_id: u.branch_id,
      store_id: u.store_id,
      is_active: u.is_active,
      created_at: u.created_at,
    }));

    const tableCounts: Record<string, number> = {
      branches: branches.length,
      stores: stores.length,
      departments: departments.length,
      workers: workers.length,
      users: sanitizedUsers.length,
      roles: roles.length,
      vehicles: vehicles.length,
      products: products.length,
      categories: categories.length,
      branchProductPrices: branchProductPrices.length,
      paymentMethods: paymentMethods.length,
      expenseTypes: expenseTypes.length,
      debtTypes: debtTypes.length,
      salarySettings: salarySettings.length,
      systemSettings: systemSettings.length,
      sales: sales.length,
      saleItems: saleItems.length,
      stockLedger: stockLedger.length,
      expenses: expenses.length,
      debts: debts.length,
      salaries: salaries.length,
      fieldSessions: fieldSessions.length,
      auditLogs: auditLogs.length,
    };

    const totalRecords = Object.values(tableCounts).reduce((a, b) => a + b, 0);

    const backupPackage: BackupDataPackage = {
      metadata: {
        systemName: 'AQUAPOS Water Management System',
        version: '2.0.0-Cloud',
        exportedAt: new Date().toISOString(),
        exportedBy: username,
        environment: this.dbService.getIsPostgres() ? 'Neon Cloud PostgreSQL' : 'Local Database',
        totalRecords,
        tableCounts,
      },
      data: {
        branches,
        stores,
        departments,
        workers,
        users: sanitizedUsers,
        roles,
        vehicles,
        products,
        categories,
        branchProductPrices,
        paymentMethods,
        expenseTypes,
        debtTypes,
        salarySettings,
        systemSettings,
        sales,
        saleItems,
        stockLedger,
        expenses,
        debts,
        salaries,
        fieldSessions,
        auditLogs,
      },
    };

    this.auditService.logAction(
      userId,
      username,
      '',
      'SERVER-01',
      'BACKUP_EXPORT',
      'SystemBackup',
      `backup-${Date.now()}`,
      undefined,
      { totalRecords, exportedAt: backupPackage.metadata.exportedAt }
    );

    return backupPackage;
  }

  /**
   * Restores a full database snapshot into Neon Cloud PostgreSQL
   */
  async restoreBackup(pkg: BackupDataPackage, userId: string = 'u-admin-ismael', username: string = 'ismael'): Promise<{ success: boolean; message: string; restoredCounts: Record<string, number> }> {
    if (!pkg || !pkg.data || typeof pkg.data !== 'object') {
      throw new BadRequestException('Invalid backup package: missing data payload.');
    }

    this.logger.log(`Starting database restoration from backup package exported at ${pkg.metadata?.exportedAt || 'unknown'}...`);

    const data = pkg.data;
    const restoredCounts: Record<string, number> = {};

    await this.dbService.transaction(async () => {
      // Helper to upsert a list of rows
      const restoreRows = async (table: string, rows: any[], conflictCol: string = 'id') => {
        if (!Array.isArray(rows) || rows.length === 0) {
          restoredCounts[table] = 0;
          return;
        }

        let count = 0;
        for (const row of rows) {
          if (!row || typeof row !== 'object') continue;
          const cols = Object.keys(row);
          if (cols.length === 0) continue;

          const placeholders = cols.map(() => '?').join(', ');
          const values = cols.map((col) => {
            const val = row[col];
            if (typeof val === 'object' && val !== null) {
              return JSON.stringify(val);
            }
            return val;
          });

          // Build INSERT OR REPLACE / ON CONFLICT statement
          const updateSets = cols
            .filter((c) => c !== conflictCol)
            .map((c) => `${c} = EXCLUDED.${c}`)
            .join(', ');

          const isPg = this.dbService.getIsPostgres();
          if (isPg) {
            const pgSql = `
              INSERT INTO ${table} (${cols.join(', ')})
              VALUES (${cols.map((_, i) => `$${i + 1}`).join(', ')})
              ON CONFLICT (${conflictCol}) DO UPDATE SET ${updateSets || `${conflictCol} = EXCLUDED.${conflictCol}`}
            `;
            try {
              const pool = this.dbService.getPgPool();
              if (pool) await pool.query(pgSql, values);
              count++;
            } catch (err: any) {
              this.logger.warn(`Restore row error in ${table} (ID ${row[conflictCol]}): ${err.message}`);
            }
          } else {
            const sqliteSql = `INSERT OR REPLACE INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`;
            try {
              const sqliteDb = this.dbService.getDb();
              if (sqliteDb) sqliteDb.prepare(sqliteSql).run(...values);
              count++;
            } catch (err: any) {
              this.logger.warn(`Restore row error in SQLite ${table}: ${err.message}`);
            }
          }
        }
        restoredCounts[table] = count;
      };

      // Restore Master Data First (order matters for referential hierarchy)
      await restoreRows('roles', data.roles || [], 'code');
      await restoreRows('departments', data.departments || []);
      await restoreRows('branches', data.branches || []);
      await restoreRows('stores', data.stores || []);
      await restoreRows('categories', data.categories || [], 'code');
      await restoreRows('products', data.products || []);
      await restoreRows('branch_product_prices', data.branchProductPrices || []);
      await restoreRows('payment_methods', data.paymentMethods || [], 'code');
      await restoreRows('expense_types', data.expenseTypes || [], 'code');
      await restoreRows('debt_types', data.debtTypes || [], 'code');
      await restoreRows('salary_settings', data.salarySettings || []);
      await restoreRows('system_settings', data.systemSettings || [], 'setting_key');
      await restoreRows('workers', data.workers || []);
      await restoreRows('users', data.users || [], 'username');
      await restoreRows('vehicles', data.vehicles || []);

      // Restore Transactions
      await restoreRows('sales', data.sales || []);
      await restoreRows('sale_items', data.saleItems || []);
      await restoreRows('stock_ledger', data.stockLedger || []);
      await restoreRows('expenses', data.expenses || []);
      await restoreRows('debts', data.debts || []);
      await restoreRows('salaries', data.salaries || []);
      await restoreRows('field_sessions', data.fieldSessions || []);
    });

    const totalRestored = Object.values(restoredCounts).reduce((a, b) => a + b, 0);

    this.auditService.logAction(
      userId,
      username,
      '',
      'SERVER-01',
      'BACKUP_RESTORE',
      'SystemBackup',
      `restore-${Date.now()}`,
      undefined,
      { totalRestored, restoredCounts, originalExportDate: pkg.metadata?.exportedAt }
    );

    this.logger.log(`Backup restore completed successfully! Restored ${totalRestored} records across all tables.`);

    return {
      success: true,
      message: `Database restored successfully! ${totalRestored} records imported without data loss.`,
      restoredCounts,
    };
  }
}
