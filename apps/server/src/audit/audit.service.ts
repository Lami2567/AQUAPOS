import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuditService {
  constructor(private dbService: DatabaseService) {}

  public logAction(
    userId: string,
    userName: string,
    branchId: string,
    deviceId: string,
    action: string,
    entityName: string,
    entityId: string,
    oldValues?: any,
    newValues?: any,
    reason?: string,
    ipAddress?: string
  ) {
    this.dbService.execute(
      `INSERT INTO audit_logs (id, user_id, user_name, branch_id, device_id, action, entity_name, entity_id, old_values, new_values, reason, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        userId,
        userName,
        branchId,
        deviceId,
        action,
        entityName,
        entityId,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        reason || null,
        ipAddress || '127.0.0.1',
      ]
    );
  }

  public getAuditLogs(entityName?: string, userId?: string, limit = 100) {
    let sql = `SELECT * FROM audit_logs`;
    const conditions: string[] = [];
    const params: any[] = [];

    if (entityName) {
      conditions.push(`entity_name = ?`);
      params.push(entityName);
    }

    if (userId) {
      conditions.push(`user_id = ?`);
      params.push(userId);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ` + conditions.join(' AND ');
    }

    sql += ` ORDER BY timestamp DESC LIMIT ?`;
    params.push(limit);

    return this.dbService.query<any>(sql, params);
  }
}
