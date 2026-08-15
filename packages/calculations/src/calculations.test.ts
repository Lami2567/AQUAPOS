import assert from 'node:assert';
import { test, describe } from 'node:test';
import {
  calculateStockFromLedger,
  calculateFieldStockReconciliation,
  calculateFieldMoneyReconciliation,
  calculateSaleSummary,
  calculateNetSalary,
} from './index.js';
import { StockMovementType, StockLedgerEntry } from '@water-business/shared-types';

describe('Water Business Domain Calculation Suite', () => {

  test('1. Stock Ledger Equation: Receipts + Field Returns - Sales - Field Issues', () => {
    const dummyEntries: StockLedgerEntry[] = [
      {
        id: '1',
        storeId: 'store-lwg-main',
        productId: 'prod-500ml',
        movementType: StockMovementType.RECEIPT,
        quantityChange: 1000,
        unitCostUgx: 500,
        referenceType: 'STOCK_RECEIPT',
        referenceId: 'rec-1',
        createdBy: 'u1',
        deviceId: 'd1',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        storeId: 'store-lwg-main',
        productId: 'prod-500ml',
        movementType: StockMovementType.FIELD_ISSUE,
        quantityChange: 400,
        unitCostUgx: 500,
        referenceType: 'FIELD_SESSION',
        referenceId: 'fs-1',
        createdBy: 'u1',
        deviceId: 'd1',
        createdAt: new Date().toISOString(),
      },
      {
        id: '3',
        storeId: 'store-lwg-main',
        productId: 'prod-500ml',
        movementType: StockMovementType.FIELD_RETURN,
        quantityChange: 100,
        unitCostUgx: 500,
        referenceType: 'FIELD_SESSION',
        referenceId: 'fs-1',
        createdBy: 'u1',
        deviceId: 'd1',
        createdAt: new Date().toISOString(),
      },
      {
        id: '4',
        storeId: 'store-lwg-main',
        productId: 'prod-500ml',
        movementType: StockMovementType.SALE,
        quantityChange: 200,
        unitCostUgx: 500,
        referenceType: 'SALE',
        referenceId: 's-1',
        createdBy: 'u1',
        deviceId: 'd1',
        createdAt: new Date().toISOString(),
      },
    ];

    const closingStock = calculateStockFromLedger(dummyEntries);
    // 1000 - 400 + 100 - 200 = 500
    assert.strictEqual(closingStock, 500);
  });

  test('2. Field Stock Reconciliation: Issued = Sold + Returned + Damaged + Missing', () => {
    const res = calculateFieldStockReconciliation({
      issuedQty: 1000,
      soldQty: 700,
      returnedQty: 280,
      damagedQty: 10,
      missingQty: 10,
    });

    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.varianceQty, 0);
    assert.strictEqual(res.missingQty, 10);
  });

  test('3. Field Money Reconciliation: Shortage Detection', () => {
    const res = calculateFieldMoneyReconciliation({
      expectedSalesUgx: 500000,
      cashCollectedUgx: 300000,
      mobileMoneyUgx: 150000,
      bankDepositUgx: 0,
      approvedExpensesUgx: 20000,
      cashRemainingUgx: 10000,
    });

    // Total Accounted = 300k + 150k + 20k + 10k = 480,000
    // Expected = 500,000
    // Variance = 480,000 - 500,000 = -20,000 (Shortage of UGX 20,000)
    assert.strictEqual(res.totalAccountedUgx, 480000);
    assert.strictEqual(res.moneyVarianceUgx, -20000);
    assert.strictEqual(res.status, 'SHORTAGE_FLAGGED');
  });

  test('4. POS Sale Calculation Engine', () => {
    const sale = calculateSaleSummary({
      items: [
        { quantity: 10, unitPriceUgx: 1000, discountUgx: 500 }, // 9500
        { quantity: 2, unitPriceUgx: 5000 },                   // 10000
      ],
      overallDiscountUgx: 500,
      paidAmountUgx: 20000,
    });

    // Gross = 10k + 10k = 20k
    // Total discount = 500 + 500 = 1,000
    // Net = 19,000
    // Paid = 20,000
    // Change = 1,000
    assert.strictEqual(sale.grossTotalUgx, 20000);
    assert.strictEqual(sale.totalDiscountUgx, 1000);
    assert.strictEqual(sale.netAmountUgx, 19000);
    assert.strictEqual(sale.changeAmountUgx, 1000);
    assert.strictEqual(sale.isFullyPaid, true);
  });

  test('5. Salary Net Calculation with Debt Recovery', () => {
    const sal = calculateNetSalary({
      basicSalaryUgx: 500000,
      commissionUgx: 50000,
      allowancesUgx: 20000,
      debtDeductionsUgx: 70000,
    });

    // Gross = 500k + 50k + 20k = 570k
    // Net = 570k - 70k = 500,000
    assert.strictEqual(sal.grossSalaryUgx, 570000);
    assert.strictEqual(sal.netSalaryUgx, 500000);
  });

});
