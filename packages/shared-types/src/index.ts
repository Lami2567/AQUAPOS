// User & Auth Types
export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  BRANCH_MANAGER: 'BRANCH_MANAGER',
  STOREKEEPER: 'STOREKEEPER',
  CASHIER: 'CASHIER',
  FIELD_SALESPERSON: 'FIELD_SALESPERSON',
  ACCOUNTANT: 'ACCOUNTANT',
  AUDITOR: 'AUDITOR',
} as const;
export type UserRole = typeof UserRole[keyof typeof UserRole];

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  branchId: string;
  storeId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// Branch & Organization Infrastructure
export const StoreType = {
  MAIN_STORE: 'MAIN_STORE',
  SALES_STORE: 'SALES_STORE',
  MOBILE_VEHICLE: 'MOBILE_VEHICLE',
} as const;
export type StoreType = typeof StoreType[keyof typeof StoreType];

export interface Branch {
  id: string;
  code: string; // e.g. LWG-01, ISG-01
  name: string;
  location: string;
  isActive: boolean;
  createdAt: string;
}

export interface Store {
  id: string;
  branchId: string;
  code: string;
  name: string;
  type: StoreType;
  isActive: boolean;
}

export const VehicleType = {
  LORRY: 'LORRY',
  TRICYCLE: 'TRICYCLE',
} as const;
export type VehicleType = typeof VehicleType[keyof typeof VehicleType];

export interface Vehicle {
  id: string;
  branchId: string;
  registrationNumber: string; // e.g. UBA 123X
  type: VehicleType;
  model: string;
  isActive: boolean;
}

export interface Worker {
  id: string;
  branchId: string;
  department: string;
  fullName: string;
  phone: string;
  role: UserRole;
  basicSalaryUgx: number; // BigInt integer minor unit in UGX
  isActive: boolean;
}

// Product Management
export interface BranchPrice {
  id?: string;
  branchId: string;
  productId?: string;
  costPriceUgx?: number;
  sellingPriceUgx: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string; // e.g. "Pure Water 500ml"
  category: string; // e.g. "Bottled Water"
  variant?: string; // e.g. "Standard", "Flavored", "Refill"
  packaging?: string; // e.g. "PET Bottle", "Carton", "Jerrican"
  unitOfMeasure: string; // e.g. "Carton", "Bottle", "Piece"
  capacityMl: number; // 500, 1500, 5000, 20000
  costPriceUgx: number;
  sellingPriceUgx: number;
  branchSpecificPrices?: BranchPrice[];
  minStockAlert: number;
  maxStockLevel: number;
  isActive: boolean;
  createdAt: string;
}

// Stock Ledger Architecture
export const StockMovementType = {
  RECEIPT: 'RECEIPT',
  SALE: 'SALE',
  FIELD_ISSUE: 'FIELD_ISSUE',
  FIELD_RETURN: 'FIELD_RETURN',
  TRANSFER_OUT: 'TRANSFER_OUT',
  TRANSFER_IN: 'TRANSFER_IN',
  DAMAGE: 'DAMAGE',
  LOSS: 'LOSS',
  ADJUSTMENT: 'ADJUSTMENT',
  OPENING_BALANCE: 'OPENING_BALANCE',
} as const;
export type StockMovementType = typeof StockMovementType[keyof typeof StockMovementType];

export interface StockLedgerEntry {
  id: string;
  storeId: string;
  productId: string;
  movementType: StockMovementType;
  quantityChange: number; // + for incoming, - for outgoing
  unitCostUgx: number;
  referenceType: 'SALE' | 'FIELD_SESSION' | 'STOCK_TRANSFER' | 'STOCK_RECEIPT' | 'ADJUSTMENT';
  referenceId: string;
  createdBy: string;
  deviceId: string;
  notes?: string;
  createdAt: string;
}

export interface StockBalance {
  storeId: string;
  productId: string;
  quantityOnHand: number;
  reservedQuantity: number;
  availableQuantity: number;
  lastUpdated: string;
}

// Stock Transfers
export const TransferStatus = {
  DRAFT: 'DRAFT',
  APPROVED: 'APPROVED',
  DISPATCHED: 'DISPATCHED',
  IN_TRANSIT: 'IN_TRANSIT',
  RECEIVED: 'RECEIVED',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
} as const;
export type TransferStatus = typeof TransferStatus[keyof typeof TransferStatus];

export interface StockTransferItem {
  id: string;
  transferId: string;
  productId: string;
  unitOfMeasure: string;
  quantityRequested: number;
  quantityDispatched: number;
  quantityReceived: number;
  unitPriceUgx: number;
}

export interface StockTransfer {
  id: string;
  transferNumber: string; // e.g. TRF-2026-00089
  sourceStoreId: string;
  destinationStoreId: string;
  vehicleId?: string;
  driverWorkerId?: string;
  status: TransferStatus;
  items: StockTransferItem[];
  createdBy: string;
  approvedBy?: string;
  dispatchedBy?: string;
  receivedBy?: string;
  confirmedBy?: string;
  approvedAt?: string;
  dispatchTimestamp?: string;
  receiveTimestamp?: string;
  confirmTimestamp?: string;
  notes?: string;
  createdAt: string;
}

// Store Sales & POS
export const PaymentMethod = {
  CASH: 'CASH',
  MOBILE_MONEY: 'MOBILE_MONEY',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CREDIT: 'CREDIT',
} as const;
export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPriceUgx: number;
  discountUgx: number;
  subtotalUgx: number;
}

export interface Sale {
  id: string;
  receiptNumber: string; // e.g. REC-2026-00501
  storeId: string;
  cashierId: string;
  customerName?: string;
  customerPhone?: string;
  items: SaleItem[];
  totalAmountUgx: number;
  discountAmountUgx: number;
  netAmountUgx: number;
  paidAmountUgx: number;
  changeAmountUgx: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  isVoided: boolean;
  voidedBy?: string;
  voidReason?: string;
  createdAt: string;
}

// Field Sales & Reconciliation Engine
export const FieldSessionStatus = {
  OPEN: 'OPEN',
  CLOSING_SUBMITTED: 'CLOSING_SUBMITTED',
  RECONCILED: 'RECONCILED',
  DISCREPANCY_FLAGGED: 'DISCREPANCY_FLAGGED',
} as const;
export type FieldSessionStatus = typeof FieldSessionStatus[keyof typeof FieldSessionStatus];

export interface FieldSessionItem {
  id: string;
  fieldSessionId: string;
  productId: string;
  productName: string;
  issuedQty: number;
  soldQty: number;
  returnedQty: number;
  damagedQty: number;
  missingQty: number;
  unitPriceUgx: number;
}

export interface FieldSessionReconciliation {
  id: string;
  fieldSessionId: string;

  // Stock Metrics
  totalIssuedUnits: number;
  totalSoldUnits: number;
  totalReturnedUnits: number;
  totalDamagedUnits: number;
  totalMissingUnits: number;
  isStockEquationValid: boolean;

  // Financial Metrics (UGX)
  expectedSalesUgx: number;
  cashCollectedUgx: number;
  mobileMoneyUgx: number;
  bankDepositUgx: number;
  approvedExpensesUgx: number;
  cashRemainingUgx: number;

  totalAccountedMoneyUgx: number;
  moneyVarianceUgx: number; // Shortage (-) or Surplus (+)
  isMoneyEquationValid: boolean;

  status: 'BALANCED' | 'SHORTAGE_FLAGGED' | 'SURPLUS_FLAGGED';
  notes?: string;
  reconciledBy: string;
  reconciledAt: string;
}

export interface FieldSession {
  id: string;
  sessionNumber: string; // e.g. FS-2026-00045
  storeId: string;
  vehicleId: string;
  workerId: string;
  workerName: string;
  status: FieldSessionStatus;
  startTime: string;
  endTime?: string;
  items: FieldSessionItem[];
  reconciliation?: FieldSessionReconciliation;
  createdBy: string;
  createdAt: string;
}

// Debts & Losses
export const DebtStatus = {
  OUTSTANDING: 'OUTSTANDING',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  CLEARED: 'CLEARED',
  WAIVED: 'WAIVED',
  WRITTEN_OFF: 'WRITTEN_OFF',
} as const;
export type DebtStatus = typeof DebtStatus[keyof typeof DebtStatus];

export interface Debt {
  id: string;
  debtorWorkerId?: string;
  debtorCustomerName?: string;
  sourceType: 'FIELD_SHORTAGE' | 'STOCK_LOSS' | 'CUSTOMER_CREDIT' | 'SALARY_ADVANCE';
  sourceId: string;
  originalAmountUgx: number;
  paidAmountUgx: number;
  balanceAmountUgx: number;
  reason: string;
  status: DebtStatus;
  approvedBy: string;
  createdAt: string;
}

export interface DebtPayment {
  id: string;
  debtId: string;
  amountPaidUgx: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  recordedBy: string;
  notes?: string;
  createdAt: string;
}

// Finance & Salary Engine
export interface SalaryDeduction {
  id: string;
  salaryPaymentId: string;
  reason: string; // e.g., "Debt Recovery - FS-2026-00045"
  amountUgx: number;
  debtId?: string;
}

export interface SalaryPayment {
  id: string;
  workerId: string;
  workerName: string;
  periodYear: number;
  periodMonth: number;
  basicSalaryUgx: number;
  commissionUgx: number;
  allowancesUgx: number;
  grossSalaryUgx: number;
  totalDeductionsUgx: number;
  netSalaryUgx: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  paidBy: string;
  paidAt: string;
  deductions: SalaryDeduction[];
}

export interface Expense {
  id: string;
  branchId: string;
  storeId?: string;
  fieldSessionId?: string;
  category: string; // Fuel, Maintenance, Meals, Logistics
  amountUgx: number;
  description: string;
  approvedBy: string;
  receiptImageUrl?: string;
  createdAt: string;
}

// Synchronization & Audit Log
export const SyncStatus = {
  PENDING: 'PENDING',
  SYNCING: 'SYNCING',
  SYNCED: 'SYNCED',
  FAILED: 'FAILED',
  CONFLICT: 'CONFLICT',
} as const;
export type SyncStatus = typeof SyncStatus[keyof typeof SyncStatus];

export interface SyncOutboxItem {
  id: string; // Transaction UUID
  branchId: string;
  deviceId: string;
  userId: string;
  transactionType: string; // e.g. 'CREATE_SALE', 'CLOSE_FIELD_SESSION'
  payload: Record<string, any>;
  status: SyncStatus;
  retryCount: number;
  lastError?: string;
  version: number;
  createdAt: string;
  syncedAt?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  branchId: string;
  deviceId: string;
  action: string; // e.g. USER_LOGIN, SALE_CREATED, SALE_VOIDED, TRANSFER_APPROVED
  entityName: string;
  entityId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  reason?: string;
  ipAddress?: string;
  timestamp: string;
}

// Administration Configuration Suite Interfaces
export interface Department {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface RoleDefinition {
  id: string;
  code: string;
  displayName: string;
  description?: string;
  permissions: string[];
  isActive: boolean;
  createdAt?: string;
}

export interface ProductCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface PaymentMethodConfig {
  id: string;
  code: string;
  name: string;
  requiresReference: boolean;
  isActive: boolean;
  createdAt?: string;
}

export interface ExpenseType {
  id: string;
  code: string;
  name: string;
  requiresApproval: boolean;
  description?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface DebtType {
  id: string;
  code: string;
  name: string;
  autoDeductPayroll: boolean;
  description?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface SalarySetting {
  id: string;
  roleCode: string;
  departmentCode: string;
  baseSalaryUgx: number;
  commissionPerUnitUgx: number;
  allowanceUgx: number;
  isActive: boolean;
  createdAt?: string;
}

export interface SystemSetting {
  id: string;
  settingKey: string;
  settingValue: string;
  category: string;
  description?: string;
  updatedAt?: string;
}

