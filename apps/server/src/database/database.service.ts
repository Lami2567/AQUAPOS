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
      return await this.pgPool.query(formattedSql, params).catch((err: Error) => {
        this.logger.error('PostgreSQL execute error: ' + err.message);
      });
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
      await this.pgPool.query(sql);
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
