import { StockLedgerEntry, StockMovementType } from '@water-business/shared-types';

/**
 * 1. Stock Ledger Calculations
 * Computes exact closing stock balance from an append-only sequence of immutable stock ledger entries.
 */
export interface StockLedgerBreakdown {
  openingStock: number;
  receipts: number;
  transfersIn: number;
  fieldReturns: number;
  sales: number;
  fieldIssues: number;
  transfersOut: number;
  damages: number;
  losses: number;
  adjustments: number;
  closingStock: number;
}

export function calculateStockLedgerBreakdown(entries: StockLedgerEntry[]): StockLedgerBreakdown {
  const breakdown: StockLedgerBreakdown = {
    openingStock: 0,
    receipts: 0,
    transfersIn: 0,
    fieldReturns: 0,
    sales: 0,
    fieldIssues: 0,
    transfersOut: 0,
    damages: 0,
    losses: 0,
    adjustments: 0,
    closingStock: 0,
  };

  for (const entry of entries) {
    const qty = Math.abs(entry.quantityChange);

    switch (entry.movementType) {
      case StockMovementType.OPENING_BALANCE:
        breakdown.openingStock += qty;
        break;
      case StockMovementType.RECEIPT:
        breakdown.receipts += qty;
        break;
      case StockMovementType.TRANSFER_IN:
        breakdown.transfersIn += qty;
        break;
      case StockMovementType.FIELD_RETURN:
        breakdown.fieldReturns += qty;
        break;
      case StockMovementType.SALE:
        breakdown.sales += qty;
        break;
      case StockMovementType.FIELD_ISSUE:
        breakdown.fieldIssues += qty;
        break;
      case StockMovementType.TRANSFER_OUT:
        breakdown.transfersOut += qty;
        break;
      case StockMovementType.DAMAGE:
        breakdown.damages += qty;
        break;
      case StockMovementType.LOSS:
        breakdown.losses += qty;
        break;
      case StockMovementType.ADJUSTMENT:
        breakdown.adjustments += entry.quantityChange;
        break;
    }
  }

  breakdown.closingStock =
    breakdown.openingStock +
    breakdown.receipts +
    breakdown.transfersIn +
    breakdown.fieldReturns -
    (breakdown.sales +
      breakdown.fieldIssues +
      breakdown.transfersOut +
      breakdown.damages +
      breakdown.losses) +
    breakdown.adjustments;

  return breakdown;
}

export function calculateStockFromLedger(entries: StockLedgerEntry[]): number {
  return calculateStockLedgerBreakdown(entries).closingStock;
}

export function validateStockAvailability(
  currentAvailableQty: number,
  requestedQuantity: number,
  movementType: StockMovementType
): { isValid: boolean; errorMessage?: string } {
  if (requestedQuantity <= 0) {
    return { isValid: false, errorMessage: 'Quantity must be greater than zero.' };
  }

  // Outward movements check stock availability
  const isOutward = (
    [
      StockMovementType.SALE,
      StockMovementType.FIELD_ISSUE,
      StockMovementType.TRANSFER_OUT,
      StockMovementType.DAMAGE,
      StockMovementType.LOSS,
    ] as string[]
  ).includes(movementType as string);

  if (isOutward && currentAvailableQty < requestedQuantity) {
    return {
      isValid: false,
      errorMessage: `Insufficient stock! Requested: ${requestedQuantity}, Available: ${currentAvailableQty}.`,
    };
  }

  return { isValid: true };
}

/**
 * 2. Field Sales Stock Reconciliation Equation:
 * Issued = Sold + Returned + Damaged + Missing
 */
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
  varianceQty: number; // 0 if balanced
  isValid: boolean;
  statusMessage: string;
}

export function calculateFieldStockReconciliation(
  input: FieldStockReconciliationInput
): FieldStockReconciliationResult {
  const issued = Math.max(0, Math.floor(input.issuedQty));
  const sold = Math.max(0, Math.floor(input.soldQty));
  const returned = Math.max(0, Math.floor(input.returnedQty));
  const damaged = Math.max(0, Math.floor(input.damagedQty));
  const missingProvided = Math.max(0, Math.floor(input.missingQty || 0));

  const calculatedAccounted = sold + returned + damaged + missingProvided;
  const varianceQty = issued - calculatedAccounted;
  const missingQty = missingProvided + Math.max(0, varianceQty);

  const isValid = issued === (sold + returned + damaged + missingQty);

  let statusMessage = 'STOCK_BALANCED';
  if (varianceQty > 0) {
    statusMessage = `UNACCOUNTED_STOCK_VARIANCE: ${varianceQty} units missing!`;
  } else if (varianceQty < 0) {
    statusMessage = `SURPLUS_STOCK_VARIANCE: ${Math.abs(varianceQty)} extra units recorded!`;
  }

  return {
    issuedQty: issued,
    soldQty: sold,
    returnedQty: returned,
    damagedQty: damaged,
    missingQty,
    calculatedAccounted,
    varianceQty,
    isValid,
    statusMessage,
  };
}

/**
 * 3. Field Money Reconciliation Equation:
 * Expected Money = Cash + Mobile Money + Bank + Approved Expenses + Cash Remaining +/- Variance
 */
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
  moneyVarianceUgx: number; // Negative = Shortage, Positive = Surplus
  isBalanced: boolean;
  status: 'BALANCED' | 'SHORTAGE_FLAGGED' | 'SURPLUS_FLAGGED';
  formattedMessage: string;
}

export function calculateFieldMoneyReconciliation(
  input: FieldMoneyReconciliationInput
): FieldMoneyReconciliationResult {
  const expected = Math.floor(input.expectedSalesUgx);
  const cash = Math.floor(input.cashCollectedUgx);
  const mobileMoney = Math.floor(input.mobileMoneyUgx);
  const bank = Math.floor(input.bankDepositUgx);
  const expenses = Math.floor(input.approvedExpensesUgx);
  const remaining = Math.floor(input.cashRemainingUgx);

  const totalAccountedUgx = cash + mobileMoney + bank + expenses + remaining;
  const moneyVarianceUgx = totalAccountedUgx - expected; // e.g. 480k - 500k = -20k shortage

  let status: 'BALANCED' | 'SHORTAGE_FLAGGED' | 'SURPLUS_FLAGGED' = 'BALANCED';
  let formattedMessage = 'MONEY_BALANCED';

  if (moneyVarianceUgx < 0) {
    status = 'SHORTAGE_FLAGGED';
    formattedMessage = `SHORTAGE: UGX ${Math.abs(moneyVarianceUgx).toLocaleString()}`;
  } else if (moneyVarianceUgx > 0) {
    status = 'SURPLUS_FLAGGED';
    formattedMessage = `SURPLUS: UGX ${moneyVarianceUgx.toLocaleString()}`;
  }

  return {
    expectedSalesUgx: expected,
    cashCollectedUgx: cash,
    mobileMoneyUgx: mobileMoney,
    bankDepositUgx: bank,
    approvedExpensesUgx: expenses,
    cashRemainingUgx: remaining,
    totalAccountedUgx,
    moneyVarianceUgx,
    isBalanced: moneyVarianceUgx === 0,
    status,
    formattedMessage,
  };
}

/**
 * 4. POS Sale Calculation Engine
 */
export interface SaleCalculationInput {
  items: Array<{
    quantity: number;
    unitPriceUgx: number;
    discountUgx?: number;
  }>;
  overallDiscountUgx?: number;
  paidAmountUgx: number;
}

export function calculateSaleSummary(input: SaleCalculationInput) {
  const itemSummaries = input.items.map((item) => {
    const qty = Math.max(1, Math.floor(item.quantity));
    const price = Math.max(0, Math.floor(item.unitPriceUgx));
    const discount = Math.max(0, Math.floor(item.discountUgx || 0));
    const lineTotalBeforeDiscount = qty * price;
    const lineSubtotal = Math.max(0, lineTotalBeforeDiscount - discount);
    return {
      quantity: qty,
      unitPriceUgx: price,
      discountUgx: discount,
      subtotalUgx: lineSubtotal,
    };
  });

  const grossTotalUgx = itemSummaries.reduce((sum, item) => sum + (item.quantity * item.unitPriceUgx), 0);
  const itemDiscountsUgx = itemSummaries.reduce((sum, item) => sum + item.discountUgx, 0);
  const overallDiscountUgx = Math.max(0, Math.floor(input.overallDiscountUgx || 0));
  const totalDiscountUgx = itemDiscountsUgx + overallDiscountUgx;
  const netAmountUgx = Math.max(0, grossTotalUgx - totalDiscountUgx);

  const paidAmountUgx = Math.max(0, Math.floor(input.paidAmountUgx));
  const changeAmountUgx = Math.max(0, paidAmountUgx - netAmountUgx);
  const isFullyPaid = paidAmountUgx >= netAmountUgx;

  return {
    itemSummaries,
    grossTotalUgx,
    totalDiscountUgx,
    netAmountUgx,
    paidAmountUgx,
    changeAmountUgx,
    isFullyPaid,
  };
}

/**
 * 5. Salary & Debt Deductions Calculation Engine
 */
export interface SalaryCalculationInput {
  basicSalaryUgx: number;
  commissionUgx?: number;
  allowancesUgx?: number;
  debtDeductionsUgx?: number;
}

export function calculateNetSalary(input: SalaryCalculationInput) {
  const basic = Math.max(0, Math.floor(input.basicSalaryUgx));
  const comm = Math.max(0, Math.floor(input.commissionUgx || 0));
  const allow = Math.max(0, Math.floor(input.allowancesUgx || 0));
  const debtDed = Math.max(0, Math.floor(input.debtDeductionsUgx || 0));

  const grossSalaryUgx = basic + comm + allow;
  const totalDeductionsUgx = Math.min(grossSalaryUgx, debtDed);
  const netSalaryUgx = Math.max(0, grossSalaryUgx - totalDeductionsUgx);

  return {
    basicSalaryUgx: basic,
    commissionUgx: comm,
    allowancesUgx: allow,
    grossSalaryUgx,
    debtDeductionsUgx: totalDeductionsUgx,
    totalDeductionsUgx,
    netSalaryUgx,
  };
}
