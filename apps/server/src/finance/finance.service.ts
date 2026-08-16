import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { calculateNetSalary } from '@water-business/calculations';
import { PaymentMethod, DebtStatus } from '@water-business/shared-types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FinanceService {
  constructor(private dbService: DatabaseService) {}

  public async recordExpense(
    branchId: string,
    storeId: string | undefined,
    fieldSessionId: string | undefined,
    category: string,
    amountUgx: number,
    description: string,
    approvedBy: string
  ) {
    if (amountUgx <= 0) throw new BadRequestException('Expense amount must be greater than zero.');

    const expenseId = uuidv4();
    await this.dbService.execute(
      `INSERT INTO expenses (id, branch_id, store_id, field_session_id, category, amount_ugx, description, approved_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [expenseId, branchId, storeId || null, fieldSessionId || null, category, amountUgx, description, approvedBy]
    );

    return { success: true, expenseId };
  }

  public async getDebts(workerId?: string) {
    let sql = `SELECT * FROM debts`;
    const params: any[] = [];
    if (workerId) {
      sql += ` WHERE debtor_worker_id = ?`;
      params.push(workerId);
    }
    return await this.dbService.query<any>(sql, params);
  }

  public async recordDebtPayment(
    debtId: string,
    amountPaidUgx: number,
    paymentMethod: PaymentMethod,
    recordedBy: string,
    paymentReference?: string,
    notes?: string
  ) {
    return await this.dbService.transaction(async () => {
      const debt = await this.dbService.queryOne<any>(`SELECT * FROM debts WHERE id = ?`, [debtId]);
      if (!debt) throw new NotFoundException('Debt record not found.');

      if (debt.status === DebtStatus.CLEARED) {
        throw new BadRequestException('Debt is already fully cleared.');
      }

      const currentBalance = Number(debt.balance_amount_ugx);
      const newPaidTotal = Number(debt.paid_amount_ugx) + amountPaidUgx;
      const newBalance = Math.max(0, currentBalance - amountPaidUgx);
      const newStatus = newBalance === 0 ? DebtStatus.CLEARED : DebtStatus.PARTIALLY_PAID;

      const paymentId = uuidv4();
      await this.dbService.execute(
        `INSERT INTO debt_payments (id, debt_id, amount_paid_ugx, payment_method, payment_reference, recorded_by, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [paymentId, debtId, amountPaidUgx, paymentMethod, paymentReference || null, recordedBy, notes || null]
      );

      await this.dbService.execute(
        `UPDATE debts SET paid_amount_ugx = ?, balance_amount_ugx = ?, status = ? WHERE id = ?`,
        [newPaidTotal, newBalance, newStatus, debtId]
      );

      return { success: true, paymentId, remainingBalanceUgx: newBalance, status: newStatus };
    });
  }

  public async updateDebtStatus(debtId: string, status: DebtStatus, approvedBy: string, reason?: string) {
    return await this.dbService.transaction(async () => {
      const debt = await this.dbService.queryOne<any>(`SELECT * FROM debts WHERE id = ?`, [debtId]);
      if (!debt) throw new NotFoundException('Debt record not found.');

      await this.dbService.execute(
        `UPDATE debts SET status = ? WHERE id = ?`,
        [status, debtId]
      );

      // Audit log the status update without deleting history
      await this.dbService.execute(
        `INSERT INTO audit_logs (id, user_id, user_name, branch_id, device_id, action, entity_name, entity_id, old_values, new_values, reason)
         VALUES (?, ?, ?, ?, ?, 'DEBT_STATUS_UPDATED', 'debts', ?, ?, ?, ?)`,
        [
          uuidv4(),
          approvedBy,
          'System Admin',
          'BRANCH-01',
          'device-01',
          debtId,
          JSON.stringify({ status: debt.status }),
          JSON.stringify({ status }),
          reason || `Debt status changed to ${status}`,
        ]
      );

      return { success: true, debtId, status };
    });
  }

  public async processWorkerSalary(
    workerId: string,
    periodYear: number,
    periodMonth: number,
    commissionUgx: number,
    allowancesUgx: number,
    autoDeductDebts: boolean,
    paidBy: string,
    paymentMethod: PaymentMethod,
    paymentReference?: string
  ) {
    return await this.dbService.transaction(async () => {
      const worker = await this.dbService.queryOne<any>(`SELECT * FROM workers WHERE id = ?`, [workerId]);
      if (!worker) throw new NotFoundException('Worker not found.');

      const basicSalaryUgx = Number(worker.basic_salary_ugx);
      let debtDeductionsUgx = 0;

      // Find outstanding worker debts
      const outstandingDebts = await this.dbService.query<any>(
        `SELECT * FROM debts WHERE debtor_worker_id = ? AND status IN ('OUTSTANDING', 'PARTIALLY_PAID')`,
        [workerId]
      );

      if (autoDeductDebts && outstandingDebts.length > 0) {
        debtDeductionsUgx = outstandingDebts.reduce((sum, d) => sum + Number(d.balance_amount_ugx), 0);
      }

      const salaryRes = calculateNetSalary({
        basicSalaryUgx,
        commissionUgx,
        allowancesUgx,
        debtDeductionsUgx,
      });

      const salaryId = uuidv4();
      await this.dbService.execute(
        `INSERT INTO salaries (id, worker_id, period_year, period_month, basic_salary_ugx, commission_ugx, allowances_ugx, gross_salary_ugx, total_deductions_ugx, net_salary_ugx, payment_method, payment_reference, paid_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          salaryId,
          workerId,
          periodYear,
          periodMonth,
          salaryRes.basicSalaryUgx,
          salaryRes.commissionUgx,
          salaryRes.allowancesUgx,
          salaryRes.grossSalaryUgx,
          salaryRes.totalDeductionsUgx,
          salaryRes.netSalaryUgx,
          paymentMethod,
          paymentReference || null,
          paidBy,
        ]
      );

      // Auto-apply debt recoveries
      if (autoDeductDebts && outstandingDebts.length > 0) {
        let remainingDeductionPool = salaryRes.debtDeductionsUgx;
        for (const debt of outstandingDebts) {
          if (remainingDeductionPool <= 0) break;
          const payAmount = Math.min(remainingDeductionPool, Number(debt.balance_amount_ugx));
          await this.recordDebtPayment(
            debt.id,
            payAmount,
            PaymentMethod.CASH,
            paidBy,
            `SALARY_PAYSLIP_${salaryId}`,
            `Auto-deduction from Salary Period ${periodYear}-${periodMonth}`
          );
          remainingDeductionPool -= payAmount;
        }
      }

      return { success: true, salaryId, salaryCalculation: salaryRes };
    });
  }
}

