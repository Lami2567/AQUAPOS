import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Database from 'better-sqlite3';
import * as fs from 'node:fs';
import * as path from 'node:path';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private db!: Database.Database;

  onModuleInit() {
    const dbDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const dbPath = path.join(dbDir, 'water_pos_local.db');
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');

    this.initializeSchema();
  }

  onModuleDestroy() {
    if (this.db) {
      this.db.close();
    }
  }

  public getDb(): Database.Database {
    return this.db;
  }

  public query<T = any>(sql: string, params: any[] = []): T[] {
    return this.db.prepare(sql).all(...params) as T[];
  }

  public queryOne<T = any>(sql: string, params: any[] = []): T | undefined {
    return this.db.prepare(sql).get(...params) as T | undefined;
  }

  public execute(sql: string, params: any[] = []): Database.RunResult {
    return this.db.prepare(sql).run(...params);
  }

  public transaction<T>(fn: () => T): T {
    return this.db.transaction(fn)();
  }

  private initializeSchema() {
    const candidateSchemaPaths = [
      path.join(process.cwd(), 'database', 'schema', 'sqlite-schema.sql'),
      path.join(process.cwd(), '..', '..', 'database', 'schema', 'sqlite-schema.sql'),
      path.join(process.cwd(), '..', 'database', 'schema', 'sqlite-schema.sql'),
      path.join(__dirname, '..', '..', '..', 'database', 'schema', 'sqlite-schema.sql'),
    ];
    const schemaPath = candidateSchemaPaths.find((p) => fs.existsSync(p));
    if (schemaPath) {
      const sql = fs.readFileSync(schemaPath, 'utf-8');
      this.db.exec(sql);
    }

    // Seed if empty
    const userCount = this.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM users');
    if (userCount && userCount.count === 0) {
      const candidateSeedPaths = [
        path.join(process.cwd(), 'database', 'seeds', 'seed-data.sql'),
        path.join(process.cwd(), '..', '..', 'database', 'seeds', 'seed-data.sql'),
        path.join(process.cwd(), '..', 'database', 'seeds', 'seed-data.sql'),
        path.join(__dirname, '..', '..', '..', 'database', 'seeds', 'seed-data.sql'),
      ];
      const seedPath = candidateSeedPaths.find((p) => fs.existsSync(p));
      if (seedPath) {
        const seedSql = fs.readFileSync(seedPath, 'utf-8');
        this.db.exec(seedSql);
      }
    }
  }
}
