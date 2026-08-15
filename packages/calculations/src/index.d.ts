import { StockLedgerEntry, StockMovementType } from '@water-business/shared-types';
export declare function calculateStockFromLedger(entries: StockLedgerEntry[]): number;
export declare function validateStockAvailability(currentAvailableQty: number, requestedQuantity: number, movementType: StockMovementType): {
    isValid: boolean;
    errorMessage?: string;
};
export interface FieldStockReconciliationInput {
    issuedQty: number;
    soldQty: number;
    returnedQty: number;
    damagedQty: number;
    missingQty?: number;
}
export interface FieldStockReconciliationResult {
    issuedQty: number;
    soldQty: number;
    returnedQty: number;
    damagedQty: number;
    missingQty: number;
    calculatedAccounted: number;
    varianceQty: number;
    isValid: boolean;
    statusMessage: string;
}
export declare function calculateFieldStockReconciliation(input: FieldStockReconciliationInput): FieldStockReconciliationResult;
export interface FieldMoneyReconciliationInput {
    expectedSalesUgx: number;
    cashCollectedUgx: number;
    mobileMoneyUgx: number;
    bankDepositUgx: number;
    approvedExpensesUgx: number;
    cashRemainingUgx: number;
}
export interface FieldMoneyReconciliationResult {
    expectedSalesUgx: number;
    cashCollectedUgx: number;
    mobileMoneyUgx: number;
    bankDepositUgx: number;
    approvedExpensesUgx: number;
    cashRemainingUgx: number;
    totalAccountedUgx: number;
    moneyVarianceUgx: number;
    isBalanced: boolean;
    status: 'BALANCED' | 'SHORTAGE_FLAGGED' | 'SURPLUS_FLAGGED';
    formattedMessage: string;
}
export declare function calculateFieldMoneyReconciliation(input: FieldMoneyReconciliationInput): FieldMoneyReconciliationResult;
export interface SaleCalculationInput {
    items: Array<{
        quantity: number;
        unitPriceUgx: number;
        discountUgx?: number;
    }>;
    overallDiscountUgx?: number;
    paidAmountUgx: number;
}
export declare function calculateSaleSummary(input: SaleCalculationInput): {
    itemSummaries: {
        quantity: number;
        unitPriceUgx: number;
        discountUgx: number;
        subtotalUgx: number;
    }[];
    grossTotalUgx: number;
    totalDiscountUgx: number;
    netAmountUgx: number;
    paidAmountUgx: number;
    changeAmountUgx: number;
    isFullyPaid: boolean;
};
export interface SalaryCalculationInput {
    basicSalaryUgx: number;
    commissionUgx?: number;
    allowancesUgx?: number;
    debtDeductionsUgx?: number;
}
export declare function calculateNetSalary(input: SalaryCalculationInput): {
    basicSalaryUgx: number;
    commissionUgx: number;
    allowancesUgx: number;
    grossSalaryUgx: number;
    debtDeductionsUgx: number;
    totalDeductionsUgx: number;
    netSalaryUgx: number;
};
