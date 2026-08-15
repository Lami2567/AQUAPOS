export declare enum UserRole {
    SUPER_ADMIN = "SUPER_ADMIN",
    BRANCH_MANAGER = "BRANCH_MANAGER",
    STOREKEEPER = "STOREKEEPER",
    CASHIER = "CASHIER",
    FIELD_SALESPERSON = "FIELD_SALESPERSON",
    ACCOUNTANT = "ACCOUNTANT",
    AUDITOR = "AUDITOR"
}
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
export declare enum StoreType {
    MAIN_STORE = "MAIN_STORE",
    SALES_STORE = "SALES_STORE",
    MOBILE_VEHICLE = "MOBILE_VEHICLE"
}
export interface Branch {
    id: string;
    code: string;
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
export declare enum VehicleType {
    LORRY = "LORRY",
    TRICYCLE = "TRICYCLE"
}
export interface Vehicle {
    id: string;
    branchId: string;
    registrationNumber: string;
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
    basicSalaryUgx: number;
    isActive: boolean;
}
export interface Product {
    id: string;
    sku: string;
    name: string;
    category: string;
    unitOfMeasure: string;
    capacityMl: number;
    costPriceUgx: number;
    sellingPriceUgx: number;
    minStockAlert: number;
    maxStockLevel: number;
    isActive: boolean;
    createdAt: string;
}
export declare enum StockMovementType {
    RECEIPT = "RECEIPT",
    SALE = "SALE",
    FIELD_ISSUE = "FIELD_ISSUE",
    FIELD_RETURN = "FIELD_RETURN",
    TRANSFER_OUT = "TRANSFER_OUT",
    TRANSFER_IN = "TRANSFER_IN",
    DAMAGE = "DAMAGE",
    LOSS = "LOSS",
    ADJUSTMENT = "ADJUSTMENT",
    OPENING_BALANCE = "OPENING_BALANCE"
}
export interface StockLedgerEntry {
    id: string;
    storeId: string;
    productId: string;
    movementType: StockMovementType;
    quantityChange: number;
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
export declare enum TransferStatus {
    DRAFT = "DRAFT",
    APPROVED = "APPROVED",
    DISPATCHED = "DISPATCHED",
    IN_TRANSIT = "IN_TRANSIT",
    RECEIVED = "RECEIVED",
    CONFIRMED = "CONFIRMED",
    CANCELLED = "CANCELLED"
}
export interface StockTransferItem {
    id: string;
    transferId: string;
    productId: string;
    quantityRequested: number;
    quantityDispatched: number;
    quantityReceived: number;
    unitPriceUgx: number;
}
export interface StockTransfer {
    id: string;
    transferNumber: string;
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
    dispatchTimestamp?: string;
    receiveTimestamp?: string;
    notes?: string;
    createdAt: string;
}
export declare enum PaymentMethod {
    CASH = "CASH",
    MOBILE_MONEY = "MOBILE_MONEY",
    BANK_TRANSFER = "BANK_TRANSFER",
    CREDIT = "CREDIT"
}
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
    receiptNumber: string;
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
export declare enum FieldSessionStatus {
    OPEN = "OPEN",
    CLOSING_SUBMITTED = "CLOSING_SUBMITTED",
    RECONCILED = "RECONCILED",
    DISCREPANCY_FLAGGED = "DISCREPANCY_FLAGGED"
}
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
    totalIssuedUnits: number;
    totalSoldUnits: number;
    totalReturnedUnits: number;
    totalDamagedUnits: number;
    totalMissingUnits: number;
    isStockEquationValid: boolean;
    expectedSalesUgx: number;
    cashCollectedUgx: number;
    mobileMoneyUgx: number;
    bankDepositUgx: number;
    approvedExpensesUgx: number;
    cashRemainingUgx: number;
    totalAccountedMoneyUgx: number;
    moneyVarianceUgx: number;
    isMoneyEquationValid: boolean;
    status: 'BALANCED' | 'SHORTAGE_FLAGGED' | 'SURPLUS_FLAGGED';
    notes?: string;
    reconciledBy: string;
    reconciledAt: string;
}
export interface FieldSession {
    id: string;
    sessionNumber: string;
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
export declare enum DebtStatus {
    OUTSTANDING = "OUTSTANDING",
    PARTIALLY_PAID = "PARTIALLY_PAID",
    CLEARED = "CLEARED",
    WAIVED = "WAIVED",
    WRITTEN_OFF = "WRITTEN_OFF"
}
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
export interface SalaryDeduction {
    id: string;
    salaryPaymentId: string;
    reason: string;
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
    category: string;
    amountUgx: number;
    description: string;
    approvedBy: string;
    receiptImageUrl?: string;
    createdAt: string;
}
export declare enum SyncStatus {
    PENDING = "PENDING",
    SYNCING = "SYNCING",
    SYNCED = "SYNCED",
    FAILED = "FAILED",
    CONFLICT = "CONFLICT"
}
export interface SyncOutboxItem {
    id: string;
    branchId: string;
    deviceId: string;
    userId: string;
    transactionType: string;
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
    action: string;
    entityName: string;
    entityId: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    reason?: string;
    ipAddress?: string;
    timestamp: string;
}
