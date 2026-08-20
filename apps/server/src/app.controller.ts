import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, Req, SetMetadata } from '@nestjs/common';
import { DatabaseService } from './database/database.service.js';
import { AuthService } from './auth/auth.service.js';
import { StockService } from './stock/stock.service.js';
import { PosService } from './pos/pos.service.js';
import { FieldSalesService } from './field-sales/field-sales.service.js';
import { FinanceService } from './finance/finance.service.js';
import { SyncService } from './sync/sync.service.js';
import { BackupService } from './backup/backup.service.js';
import { AuditService } from './audit/audit.service.js';
import { AuthGuard } from './auth/auth.guard.js';
import { Roles } from './auth/roles.decorator.js';
import { UserRole, PaymentMethod, TransferStatus } from '@water-business/shared-types';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Controller('api/v1')
@UseGuards(AuthGuard)
export class AppController {
  constructor(
    private dbService: DatabaseService,
    private authService: AuthService,
    private stockService: StockService,
    private posService: PosService,
    private fieldSalesService: FieldSalesService,
    private financeService: FinanceService,
    private syncService: SyncService,
    private backupService: BackupService,
    private auditService: AuditService
  ) {}

  @Public()
  @Get('health')
  async health() {
    return this.dbService.getHealthStatus();
  }

  @Public()
  @Get('status')
  async status() {
    return this.dbService.getHealthStatus();
  }

  @Public()
  @Post('auth/login')
  async login(@Body() body: { username: string; password: string }) {
    return this.authService.login(body.username, body.password);
  }

  // Inventory & Stock
  @Get('stock/inventory/:storeId')
  async getInventory(@Param('storeId') storeId: string) {
    return this.stockService.getStoreInventoryOverview(storeId);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER, UserRole.STOREKEEPER)
  @Post('stock/receipts')
  async addReceipt(@Body() body: { storeId: string; productId: string; quantity: number; unitCostUgx: number; notes?: string }, @Request() req: any) {
    return this.stockService.addStockReceipt(
      body.storeId,
      body.productId,
      body.quantity,
      body.unitCostUgx,
      req.user.sub,
      req.headers['x-device-id'] || 'device-01',
      body.notes
    );
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER, UserRole.STOREKEEPER)
  @Post('stock/transfers')
  async createTransfer(@Body() body: any, @Request() req: any) {
    return this.stockService.createStockTransfer(
      body.sourceStoreId,
      body.destinationStoreId,
      body.vehicleId,
      body.driverWorkerId,
      body.items,
      req.user.sub,
      req.headers['x-device-id'] || 'device-01',
      body.notes
    );
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER)
  @Post('stock/transfers/:id/approve')
  async approveTransfer(@Param('id') id: string, @Request() req: any) {
    return this.stockService.approveStockTransfer(id, req.user.sub);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER, UserRole.STOREKEEPER)
  @Post('stock/transfers/:id/dispatch')
  async dispatchTransfer(@Param('id') id: string, @Body() body: { dispatchedItems?: any[] }, @Request() req: any) {
    return this.stockService.dispatchStockTransfer(
      id,
      body?.dispatchedItems || [],
      req.user.sub,
      req.headers['x-device-id'] || 'device-01'
    );
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER, UserRole.STOREKEEPER)
  @Post('stock/transfers/:id/receive')
  async receiveTransfer(@Param('id') id: string, @Body() body: { receivedItems: any[] }, @Request() req: any) {
    return this.stockService.receiveStockTransfer(id, body.receivedItems, req.user.sub);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER, UserRole.STOREKEEPER)
  @Post('stock/transfers/:id/confirm')
  async confirmTransfer(@Param('id') id: string, @Request() req: any) {
    return this.stockService.confirmStockTransferReceive(id, req.user.sub, req.headers['x-device-id'] || 'device-01');
  }

  // Store Sales / POS
  @Roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER, UserRole.STOREKEEPER, UserRole.CASHIER)
  @Post('pos/sales')
  async createSale(@Body() body: any, @Request() req: any) {
    return this.posService.createSale(
      body.storeId,
      req.user.sub,
      req.headers['x-device-id'] || 'device-01',
      body.customerName,
      body.customerPhone,
      body.items,
      body.discountAmountUgx || 0,
      body.paidAmountUgx,
      body.paymentMethod as PaymentMethod,
      body.paymentReference
    );
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER)
  @Post('pos/sales/:id/void')
  async voidSale(@Param('id') id: string, @Body() body: { reason: string }, @Request() req: any) {
    return this.posService.voidSale(id, req.user.sub, body.reason, req.headers['x-device-id'] || 'device-01');
  }

  // Field Sales & Reconciliation
  @Roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER, UserRole.FIELD_SALESPERSON)
  @Post('field-sales/sessions/start')
  async startFieldSession(@Body() body: any, @Request() req: any) {
    return this.fieldSalesService.startFieldSession(
      body.storeId,
      body.vehicleId,
      body.workerId,
      body.issuedItems,
      req.user.sub,
      req.headers['x-device-id'] || 'device-01'
    );
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER, UserRole.ACCOUNTANT)
  @Post('field-sales/sessions/:id/reconcile')
  async reconcileFieldSession(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.fieldSalesService.closeAndReconcileFieldSession(
      id,
      body.returnedItems,
      body.cashCollectedUgx,
      body.mobileMoneyUgx || 0,
      body.bankDepositUgx || 0,
      body.approvedExpensesUgx || 0,
      body.cashRemainingUgx || 0,
      req.user.sub,
      req.headers['x-device-id'] || 'device-01',
      body.notes
    );
  }

  // Finance & Debts
  @Roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER, UserRole.ACCOUNTANT)
  @Post('finance/expenses')
  async recordExpense(@Body() body: any, @Request() req: any) {
    return this.financeService.recordExpense(
      body.branchId,
      body.storeId,
      body.fieldSessionId,
      body.category,
      body.amountUgx,
      body.description,
      req.user.sub
    );
  }

  @Get('finance/debts')
  async getDebts(@Query('workerId') workerId?: string) {
    return this.financeService.getDebts(workerId);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER, UserRole.ACCOUNTANT)
  @Post('finance/debts/:id/pay')
  async payDebt(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.financeService.recordDebtPayment(
      id,
      body.amountPaidUgx,
      body.paymentMethod as PaymentMethod,
      req.user.sub,
      body.paymentReference,
      body.notes
    );
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER, UserRole.ACCOUNTANT)
  @Post('finance/salaries/process')
  async processSalary(@Body() body: any, @Request() req: any) {
    return this.financeService.processWorkerSalary(
      body.workerId,
      body.periodYear,
      body.periodMonth,
      body.commissionUgx || 0,
      body.allowancesUgx || 0,
      body.autoDeductDebts ?? true,
      req.user.sub,
      body.paymentMethod as PaymentMethod,
      body.paymentReference
    );
  }

  // Offline Sync Ingestion & Pull
  @Public()
  @Get('sync/pull')
  async pullSync(@Query('branchId') branchId?: string, @Query('since') since?: string) {
    return this.syncService.pullCentralData(branchId, since);
  }

  @Public()
  @Post('sync/ingest')
  async ingestSync(@Body() body: any) {
    return this.syncService.ingestTransactionBatch(body.branchId, body.deviceId, body.transactions);
  }

  @Public()
  @Roles(UserRole.SUPER_ADMIN)
  @Post('admin/reset-production')
  async resetProduction(@Body() body: { clearDemoMaster?: boolean }) {
    return this.syncService.resetProductionData(body?.clearDemoMaster || false);
  }

  // Backups & Auditing
  @Roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER)
  @Post('backup/create')
  async createBackup(@Req() req: any) {
    const userId = req.user?.id || 'u-admin-ismael';
    const username = req.user?.username || 'ismael';
    return this.backupService.generateFullBackup(userId, username);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER, UserRole.AUDITOR)
  @Get('audit/logs')
  async getAuditLogs(@Query('entity') entity?: string, @Query('userId') userId?: string) {
    return this.auditService.getAuditLogs(entity, userId);
  }
}
