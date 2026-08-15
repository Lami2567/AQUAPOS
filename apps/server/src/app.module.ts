import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseService } from './database/database.service.js';
import { AuthService } from './auth/auth.service.js';
import { StockService } from './stock/stock.service.js';
import { PosService } from './pos/pos.service.js';
import { FieldSalesService } from './field-sales/field-sales.service.js';
import { FinanceService } from './finance/finance.service.js';
import { SyncService } from './sync/sync.service.js';
import { BackupService } from './backup/backup.service.js';
import { AuditService } from './audit/audit.service.js';
import { AdminService } from './admin/admin.service.js';
import { AppController } from './app.controller.js';
import { AdminController } from './admin/admin.controller.js';
import { AuthGuard } from './auth/auth.guard.js';

@Module({
  imports: [
    JwtModule.register({
      secret: 'WATER_POS_SECRET_KEY_2026',
      signOptions: { expiresIn: '12h' },
    }),
  ],
  controllers: [AppController, AdminController],
  providers: [
    DatabaseService,
    AuthService,
    StockService,
    PosService,
    FieldSalesService,
    FinanceService,
    SyncService,
    BackupService,
    AuditService,
    AdminService,
    AuthGuard,
  ],
})
export class AppModule {}

