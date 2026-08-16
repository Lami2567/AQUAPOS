import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Database from 'better-sqlite3';
import pg from 'pg';
import * as fs from 'node:fs';
import * as path from 'node:path';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private sqliteDb?: Database.Database;
  private pgPool?: pg.Pool;
  private isPostgres = false;

  async onModuleInit() {
    const databaseUrl = process.env.DATABASE_URL;

    if (databaseUrl && (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://'))) {
      this.logger.log('Connecting to Neon Cloud PostgreSQL Database via DATABASE_URL...');
      this.isPostgres = true;
      this.pgPool = new pg.Pool({
        connectionString: databaseUrl,
        ssl: {
          rejectUnauthorized: false,
        },
      });

      try {
        await this.initializePostgresSchema();
        this.logger.log('Connected to Neon PostgreSQL and synchronized schema successfully.');
      } catch (err: any) {
        this.logger.error('Failed to initialize Neon PostgreSQL database: ' + err.message, err.stack);
      }
    } else {
      this.logger.log('Initializing Local SQLite Database for Offline / Local Mode...');
      this.isPostgres = false;
      const dbDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      const dbPath = path.join(dbDir, 'water_pos_local.db');
      this.sqliteDb = new Database(dbPath);
      this.sqliteDb.pragma('journal_mode = WAL');
      this.sqliteDb.pragma('foreign_keys = ON');

      this.initializeSqliteSchema();
      this.logger.log('Local SQLite Database initialized at: ' + dbPath);
    }
  }

  async onModuleDestroy() {
    if (this.sqliteDb) {
      this.sqliteDb.close();
    }
    if (this.pgPool) {
      await this.pgPool.end();
    }
  }

  public getDb(): Database.Database | undefined {
    return this.sqliteDb;
  }

  public getPgPool(): pg.Pool | undefined {
    return this.pgPool;
  }

  public getIsPostgres(): boolean {
    return this.isPostgres;
  }

  private formatPgSql(sql: string): string {
    let paramIndex = 1;
    // Replace ? placeholders with $1, $2, $3...
    let formatted = sql.replace(/\?/g, () => `$${paramIndex++}`);
    // Replace SQLite "INSERT OR REPLACE INTO" with Postgres ON CONFLICT DO NOTHING / UPDATE
    if (/INSERT\s+OR\s+REPLACE\s+INTO/i.test(formatted)) {
      formatted = formatted.replace(/INSERT\s+OR\s+REPLACE\s+INTO/gi, 'INSERT INTO');
      if (!/ON\s+CONFLICT/i.test(formatted)) {
        formatted += ' ON CONFLICT (id) DO NOTHING';
      }
    }
    // Replace SQLite integer boolean checks with Postgres boolean checks
    formatted = formatted.replace(/\bis_active\s*=\s*1\b/gi, 'is_active = true');
    formatted = formatted.replace(/\bis_active\s*=\s*0\b/gi, 'is_active = false');
    formatted = formatted.replace(/\bis_voided\s*=\s*1\b/gi, 'is_voided = true');
    formatted = formatted.replace(/\bis_voided\s*=\s*0\b/gi, 'is_voided = false');
    formatted = formatted.replace(/\bis_system_role\s*=\s*1\b/gi, 'is_system_role = true');
    formatted = formatted.replace(/\bis_system_role\s*=\s*0\b/gi, 'is_system_role = false');
    formatted = formatted.replace(/\brequires_reference\s*=\s*1\b/gi, 'requires_reference = true');
    formatted = formatted.replace(/\brequires_reference\s*=\s*0\b/gi, 'requires_reference = false');
    formatted = formatted.replace(/\brequires_approval\s*=\s*1\b/gi, 'requires_approval = true');
    formatted = formatted.replace(/\brequires_approval\s*=\s*0\b/gi, 'requires_approval = false');
    formatted = formatted.replace(/\bauto_deduct_payroll\s*=\s*1\b/gi, 'auto_deduct_payroll = true');
    formatted = formatted.replace(/\bauto_deduct_payroll\s*=\s*0\b/gi, 'auto_deduct_payroll = false');
    formatted = formatted.replace(/\bis_stock_equation_valid\s*=\s*1\b/gi, 'is_stock_equation_valid = true');
    formatted = formatted.replace(/\bis_stock_equation_valid\s*=\s*0\b/gi, 'is_stock_equation_valid = false');
    formatted = formatted.replace(/\bis_money_equation_valid\s*=\s*1\b/gi, 'is_money_equation_valid = true');
    formatted = formatted.replace(/\bis_money_equation_valid\s*=\s*0\b/gi, 'is_money_equation_valid = false');

    return formatted;
  }

  public async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return this.queryAsync<T>(sql, params);
  }

  public async queryAsync<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (this.isPostgres && this.pgPool) {
      const formattedSql = this.formatPgSql(sql);
      const res = await this.pgPool.query(formattedSql, params);
      return res.rows as T[];
    } else if (this.sqliteDb) {
      return this.sqliteDb.prepare(sql).all(...params) as T[];
    }
    return [];
  }

  public async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    return this.queryOneAsync<T>(sql, params);
  }

  public async queryOneAsync<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    if (this.isPostgres && this.pgPool) {
      const formattedSql = this.formatPgSql(sql);
      const res = await this.pgPool.query(formattedSql, params);
      return res.rows[0] as T | undefined;
    } else if (this.sqliteDb) {
      return this.sqliteDb.prepare(sql).get(...params) as T | undefined;
    }
    return undefined;
  }

  public async execute(sql: string, params: any[] = []): Promise<any> {
    return this.executeAsync(sql, params);
  }

  public async executeAsync(sql: string, params: any[] = []): Promise<any> {
    if (this.isPostgres && this.pgPool) {
      const formattedSql = this.formatPgSql(sql);
      try {
        return await this.pgPool.query(formattedSql, params);
      } catch (err: any) {
        this.logger.error('PostgreSQL execute error: ' + err.message);
        throw err;
      }
    } else if (this.sqliteDb) {
      return this.sqliteDb.prepare(sql).run(...params);
    }
  }

  public async transaction<T>(fn: () => Promise<T> | T): Promise<T> {
    if (this.isPostgres) {
      return await fn();
    } else if (this.sqliteDb) {
      return (this.sqliteDb.transaction(() => fn()) as any)();
    }
    return await fn();
  }

  public async getHealthStatus() {
    let dbConnected = false;
    let branchCount = 0;
    let error: string | null = null;
    try {
      const res = await this.queryOne<{ count: string | number }>('SELECT count(*) as count FROM branches');
      branchCount = res ? Number(res.count) : 0;
      dbConnected = true;
    } catch (e: any) {
      error = e.message;
      dbConnected = false;
    }

    return {
      status: dbConnected ? 'HEALTHY' : 'DEGRADED',
      databaseEngine: this.isPostgres ? 'Neon Cloud PostgreSQL' : 'Local SQLite',
      databaseConnected: dbConnected,
      databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
      branchCount,
      serverTime: new Date().toISOString(),
      error,
    };
  }

  private async initializePostgresSchema() {
    if (!this.pgPool) return;

    const candidateSchemaPaths = [
      path.join(process.cwd(), 'database', 'schema', 'postgresql-schema.sql'),
      path.join(process.cwd(), '..', '..', 'database', 'schema', 'postgresql-schema.sql'),
      path.join(process.cwd(), '..', 'database', 'schema', 'postgresql-schema.sql'),
      path.join(__dirname, '..', '..', '..', 'database', 'schema', 'postgresql-schema.sql'),
    ];
    const schemaPath = candidateSchemaPaths.find((p) => fs.existsSync(p));
    if (schemaPath) {
      const sql = fs.readFileSync(schemaPath, 'utf-8');
      await this.pgPool.query(sql).catch((e: Error) => {
        this.logger.warn('Neon Postgres schema initialization notice: ' + e.message);
      });
    }

    // Safely migrate existing columns if they were created as UUID
    const migrationStatements = [
      `ALTER TABLE IF EXISTS branches ALTER COLUMN id DROP DEFAULT;`,
      `ALTER TABLE IF EXISTS branches ALTER COLUMN id SET DATA TYPE TEXT USING id::TEXT;`,
      `ALTER TABLE IF EXISTS stores ALTER COLUMN id DROP DEFAULT;`,
      `ALTER TABLE IF EXISTS stores ALTER COLUMN id SET DATA TYPE TEXT USING id::TEXT;`,
      `ALTER TABLE IF EXISTS stores ALTER COLUMN branch_id SET DATA TYPE TEXT USING branch_id::TEXT;`,
      `ALTER TABLE IF EXISTS workers ALTER COLUMN id DROP DEFAULT;`,
      `ALTER TABLE IF EXISTS workers ALTER COLUMN id SET DATA TYPE TEXT USING id::TEXT;`,
      `ALTER TABLE IF EXISTS workers ALTER COLUMN branch_id SET DATA TYPE TEXT USING branch_id::TEXT;`,
      `ALTER TABLE IF EXISTS users ALTER COLUMN id DROP DEFAULT;`,
      `ALTER TABLE IF EXISTS users ALTER COLUMN id SET DATA TYPE TEXT USING id::TEXT;`,
      `ALTER TABLE IF EXISTS users ALTER COLUMN branch_id SET DATA TYPE TEXT USING branch_id::TEXT;`,
      `ALTER TABLE IF EXISTS users ALTER COLUMN store_id SET DATA TYPE TEXT USING store_id::TEXT;`,
      `ALTER TABLE IF EXISTS products ALTER COLUMN id DROP DEFAULT;`,
      `ALTER TABLE IF EXISTS products ALTER COLUMN id SET DATA TYPE TEXT USING id::TEXT;`,
      `ALTER TABLE IF EXISTS branch_product_prices ALTER COLUMN id DROP DEFAULT;`,
      `ALTER TABLE IF EXISTS branch_product_prices ALTER COLUMN id SET DATA TYPE TEXT USING id::TEXT;`,
      `ALTER TABLE IF EXISTS branch_product_prices ALTER COLUMN branch_id SET DATA TYPE TEXT USING branch_id::TEXT;`,
      `ALTER TABLE IF EXISTS branch_product_prices ALTER COLUMN product_id SET DATA TYPE TEXT USING product_id::TEXT;`,
      `ALTER TABLE IF EXISTS sales ALTER COLUMN id DROP DEFAULT;`,
      `ALTER TABLE IF EXISTS sales ALTER COLUMN id SET DATA TYPE TEXT USING id::TEXT;`,
      `ALTER TABLE IF EXISTS sales ALTER COLUMN store_id SET DATA TYPE TEXT USING store_id::TEXT;`,
      `ALTER TABLE IF EXISTS sales ALTER COLUMN cashier_id SET DATA TYPE TEXT USING cashier_id::TEXT;`,
      `ALTER TABLE IF EXISTS sale_items ALTER COLUMN id DROP DEFAULT;`,
      `ALTER TABLE IF EXISTS sale_items ALTER COLUMN id SET DATA TYPE TEXT USING id::TEXT;`,
      `ALTER TABLE IF EXISTS sale_items ALTER COLUMN sale_id SET DATA TYPE TEXT USING sale_id::TEXT;`,
      `ALTER TABLE IF EXISTS sale_items ALTER COLUMN product_id SET DATA TYPE TEXT USING product_id::TEXT;`,
      `ALTER TABLE IF EXISTS stock_ledger ALTER COLUMN id DROP DEFAULT;`,
      `ALTER TABLE IF EXISTS stock_ledger ALTER COLUMN id SET DATA TYPE TEXT USING id::TEXT;`,
      `ALTER TABLE IF EXISTS stock_ledger ALTER COLUMN store_id SET DATA TYPE TEXT USING store_id::TEXT;`,
      `ALTER TABLE IF EXISTS stock_ledger ALTER COLUMN product_id SET DATA TYPE TEXT USING product_id::TEXT;`,
      `ALTER TABLE IF EXISTS sync_inbox DROP CONSTRAINT IF EXISTS sync_inbox_branch_id_fkey;`,
      `ALTER TABLE IF EXISTS sync_inbox DROP CONSTRAINT IF EXISTS sync_inbox_device_id_fkey;`,
      `ALTER TABLE IF EXISTS audit_logs DROP CONSTRAINT IF EXISTS audit_logs_branch_id_fkey;`,
      `ALTER TABLE IF EXISTS audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;`,
      `ALTER TABLE IF EXISTS audit_logs DROP CONSTRAINT IF EXISTS audit_logs_device_id_fkey;`,
      `ALTER TABLE IF EXISTS stores DROP CONSTRAINT IF EXISTS stores_branch_id_fkey;`,
      `ALTER TABLE IF EXISTS vehicles DROP CONSTRAINT IF EXISTS vehicles_branch_id_fkey;`,
      `ALTER TABLE IF EXISTS workers DROP CONSTRAINT IF EXISTS workers_branch_id_fkey;`,
      `ALTER TABLE IF EXISTS users DROP CONSTRAINT IF EXISTS users_branch_id_fkey;`,
      `ALTER TABLE IF EXISTS users DROP CONSTRAINT IF EXISTS users_store_id_fkey;`,
      `ALTER TABLE IF EXISTS sync_inbox ALTER COLUMN id DROP DEFAULT;`,
      `ALTER TABLE IF EXISTS sync_inbox ALTER COLUMN id SET DATA TYPE TEXT USING id::TEXT;`,
      `ALTER TABLE IF EXISTS sync_inbox ALTER COLUMN branch_id SET DATA TYPE TEXT USING branch_id::TEXT;`,
      `ALTER TABLE IF EXISTS sync_inbox ALTER COLUMN device_id SET DATA TYPE TEXT USING device_id::TEXT;`,
      `ALTER TABLE IF EXISTS audit_logs ALTER COLUMN id DROP DEFAULT;`,
      `ALTER TABLE IF EXISTS audit_logs ALTER COLUMN id SET DATA TYPE TEXT USING id::TEXT;`,
      `ALTER TABLE IF EXISTS audit_logs ALTER COLUMN user_id SET DATA TYPE TEXT USING user_id::TEXT;`,
      `ALTER TABLE IF EXISTS audit_logs ALTER COLUMN branch_id SET DATA TYPE TEXT USING branch_id::TEXT;`,
      `ALTER TABLE IF EXISTS audit_logs ALTER COLUMN device_id SET DATA TYPE TEXT USING device_id::TEXT;`,
      `ALTER TABLE IF EXISTS audit_logs ALTER COLUMN entity_id SET DATA TYPE TEXT USING entity_id::TEXT;`,
      `ALTER TABLE IF EXISTS deleted_records ALTER COLUMN id DROP DEFAULT;`,
      `ALTER TABLE IF EXISTS deleted_records ALTER COLUMN id SET DATA TYPE TEXT USING id::TEXT;`,
      `ALTER TABLE IF EXISTS deleted_records ALTER COLUMN entity_id SET DATA TYPE TEXT USING entity_id::TEXT;`,
    ];

    for (const stmt of migrationStatements) {
      try {
        await this.pgPool.query(stmt);
      } catch (e: any) {
        this.logger.debug('Schema column migration statement notice: ' + e.message);
      }
    }
  }

  private initializeSqliteSchema() {
    if (!this.sqliteDb) return;

    const candidateSchemaPaths = [
      path.join(process.cwd(), 'database', 'schema', 'sqlite-schema.sql'),
      path.join(process.cwd(), '..', '..', 'database', 'schema', 'sqlite-schema.sql'),
      path.join(process.cwd(), '..', 'database', 'schema', 'sqlite-schema.sql'),
      path.join(__dirname, '..', '..', '..', 'database', 'schema', 'sqlite-schema.sql'),
    ];
    const schemaPath = candidateSchemaPaths.find((p) => fs.existsSync(p));
    if (schemaPath) {
      const sql = fs.readFileSync(schemaPath, 'utf-8');
      this.sqliteDb.exec(sql);
    }
  }
}
