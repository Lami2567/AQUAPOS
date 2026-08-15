import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { SyncStatus } from '@water-business/shared-types';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(private dbService: DatabaseService) {}

  public getPendingOutboxItems() {
    return this.dbService.query<any>(
      `SELECT * FROM sync_outbox WHERE status IN ('PENDING', 'FAILED') ORDER BY created_at ASC LIMIT 50`
    );
  }

  public ingestTransactionBatch(
    branchId: string,
    deviceId: string,
    transactions: Array<{ id: string; transactionType: string; payload: any; version: number; createdAt: string }>
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
          this.dbService.execute(
            `INSERT INTO sync_inbox (id, branch_id, device_id, transaction_type, payload, status)
             VALUES (?, ?, ?, ?, ?, 'PROCESSED')`,
            [tx.id, branchId, deviceId, tx.transactionType, JSON.stringify(tx.payload)]
          );
        });

        results.push({ id: tx.id, status: 'ACK' });
      } catch (err: any) {
        this.logger.error(`Error processing sync transaction ${tx.id}: ${err.message}`);
        results.push({ id: tx.id, status: 'CONFLICT', error: err.message });
      }
    }

    return { success: true, processedCount: results.length, results };
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
