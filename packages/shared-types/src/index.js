// User & Auth Types
export var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    UserRole["BRANCH_MANAGER"] = "BRANCH_MANAGER";
    UserRole["STOREKEEPER"] = "STOREKEEPER";
    UserRole["CASHIER"] = "CASHIER";
    UserRole["FIELD_SALESPERSON"] = "FIELD_SALESPERSON";
    UserRole["ACCOUNTANT"] = "ACCOUNTANT";
    UserRole["AUDITOR"] = "AUDITOR";
})(UserRole || (UserRole = {}));
// Branch & Organization Infrastructure
export var StoreType;
(function (StoreType) {
    StoreType["MAIN_STORE"] = "MAIN_STORE";
    StoreType["SALES_STORE"] = "SALES_STORE";
    StoreType["MOBILE_VEHICLE"] = "MOBILE_VEHICLE";
})(StoreType || (StoreType = {}));
export var VehicleType;
(function (VehicleType) {
    VehicleType["LORRY"] = "LORRY";
    VehicleType["TRICYCLE"] = "TRICYCLE";
})(VehicleType || (VehicleType = {}));
// Stock Ledger Architecture
export var StockMovementType;
(function (StockMovementType) {
    StockMovementType["RECEIPT"] = "RECEIPT";
    StockMovementType["SALE"] = "SALE";
    StockMovementType["FIELD_ISSUE"] = "FIELD_ISSUE";
    StockMovementType["FIELD_RETURN"] = "FIELD_RETURN";
    StockMovementType["TRANSFER_OUT"] = "TRANSFER_OUT";
    StockMovementType["TRANSFER_IN"] = "TRANSFER_IN";
    StockMovementType["DAMAGE"] = "DAMAGE";
    StockMovementType["LOSS"] = "LOSS";
    StockMovementType["ADJUSTMENT"] = "ADJUSTMENT";
    StockMovementType["OPENING_BALANCE"] = "OPENING_BALANCE";
})(StockMovementType || (StockMovementType = {}));
// Stock Transfers
export var TransferStatus;
(function (TransferStatus) {
    TransferStatus["DRAFT"] = "DRAFT";
    TransferStatus["APPROVED"] = "APPROVED";
    TransferStatus["DISPATCHED"] = "DISPATCHED";
    TransferStatus["IN_TRANSIT"] = "IN_TRANSIT";
    TransferStatus["RECEIVED"] = "RECEIVED";
    TransferStatus["CONFIRMED"] = "CONFIRMED";
    TransferStatus["CANCELLED"] = "CANCELLED";
})(TransferStatus || (TransferStatus = {}));
// Store Sales & POS
export var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH"] = "CASH";
    PaymentMethod["MOBILE_MONEY"] = "MOBILE_MONEY";
    PaymentMethod["BANK_TRANSFER"] = "BANK_TRANSFER";
    PaymentMethod["CREDIT"] = "CREDIT";
})(PaymentMethod || (PaymentMethod = {}));
// Field Sales & Reconciliation Engine
export var FieldSessionStatus;
(function (FieldSessionStatus) {
    FieldSessionStatus["OPEN"] = "OPEN";
    FieldSessionStatus["CLOSING_SUBMITTED"] = "CLOSING_SUBMITTED";
    FieldSessionStatus["RECONCILED"] = "RECONCILED";
    FieldSessionStatus["DISCREPANCY_FLAGGED"] = "DISCREPANCY_FLAGGED";
})(FieldSessionStatus || (FieldSessionStatus = {}));
// Debts & Losses
export var DebtStatus;
(function (DebtStatus) {
    DebtStatus["OUTSTANDING"] = "OUTSTANDING";
    DebtStatus["PARTIALLY_PAID"] = "PARTIALLY_PAID";
    DebtStatus["CLEARED"] = "CLEARED";
    DebtStatus["WAIVED"] = "WAIVED";
    DebtStatus["WRITTEN_OFF"] = "WRITTEN_OFF";
})(DebtStatus || (DebtStatus = {}));
// Synchronization & Audit Log
export var SyncStatus;
(function (SyncStatus) {
    SyncStatus["PENDING"] = "PENDING";
    SyncStatus["SYNCING"] = "SYNCING";
    SyncStatus["SYNCED"] = "SYNCED";
    SyncStatus["FAILED"] = "FAILED";
    SyncStatus["CONFLICT"] = "CONFLICT";
})(SyncStatus || (SyncStatus = {}));
