"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateStockFromLedger = calculateStockFromLedger;
exports.validateStockAvailability = validateStockAvailability;
exports.calculateFieldStockReconciliation = calculateFieldStockReconciliation;
exports.calculateFieldMoneyReconciliation = calculateFieldMoneyReconciliation;
exports.calculateSaleSummary = calculateSaleSummary;
exports.calculateNetSalary = calculateNetSalary;
const shared_types_1 = require("@water-business/shared-types");
function calculateStockFromLedger(entries) {
    return entries.reduce((currentQty, entry) => {
        switch (entry.movementType) {
            case shared_types_1.StockMovementType.OPENING_BALANCE:
            case shared_types_1.StockMovementType.RECEIPT:
            case shared_types_1.StockMovementType.TRANSFER_IN:
            case shared_types_1.StockMovementType.FIELD_RETURN:
                return currentQty + Math.abs(entry.quantityChange);
            case shared_types_1.StockMovementType.SALE:
            case shared_types_1.StockMovementType.FIELD_ISSUE:
            case shared_types_1.StockMovementType.TRANSFER_OUT:
            case shared_types_1.StockMovementType.DAMAGE:
            case shared_types_1.StockMovementType.LOSS:
                return currentQty - Math.abs(entry.quantityChange);
            case shared_types_1.StockMovementType.ADJUSTMENT:
                return currentQty + entry.quantityChange;
            default:
                return currentQty;
        }
    }, 0);
}
function validateStockAvailability(currentAvailableQty, requestedQuantity, movementType) {
    if (requestedQuantity <= 0) {
        return { isValid: false, errorMessage: 'Quantity must be greater than zero.' };
    }
    const isOutward = [
        shared_types_1.StockMovementType.SALE,
        shared_types_1.StockMovementType.FIELD_ISSUE,
        shared_types_1.StockMovementType.TRANSFER_OUT,
        shared_types_1.StockMovementType.DAMAGE,
        shared_types_1.StockMovementType.LOSS,
    ].includes(movementType);
    if (isOutward && currentAvailableQty < requestedQuantity) {
        return {
            isValid: false,
            errorMessage: `Insufficient stock! Requested: ${requestedQuantity}, Available: ${currentAvailableQty}.`,
        };
    }
    return { isValid: true };
}
function calculateFieldStockReconciliation(input) {
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
    }
    else if (varianceQty < 0) {
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
function calculateFieldMoneyReconciliation(input) {
    const expected = Math.floor(input.expectedSalesUgx);
    const cash = Math.floor(input.cashCollectedUgx);
    const mobileMoney = Math.floor(input.mobileMoneyUgx);
    const bank = Math.floor(input.bankDepositUgx);
    const expenses = Math.floor(input.approvedExpensesUgx);
    const remaining = Math.floor(input.cashRemainingUgx);
    const totalAccountedUgx = cash + mobileMoney + bank + expenses + remaining;
    const moneyVarianceUgx = totalAccountedUgx - expected;
    let status = 'BALANCED';
    let formattedMessage = 'MONEY_BALANCED';
    if (moneyVarianceUgx < 0) {
        status = 'SHORTAGE_FLAGGED';
        formattedMessage = `SHORTAGE: UGX ${Math.abs(moneyVarianceUgx).toLocaleString()}`;
    }
    else if (moneyVarianceUgx > 0) {
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
function calculateSaleSummary(input) {
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
function calculateNetSalary(input) {
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
//# sourceMappingURL=index.js.map