import React, { useState } from 'react';
import {
  DollarSign,
  CreditCard,
  UserCheck,
  AlertCircle,
  CheckCircle,
  Plus,
  Receipt,
  FileText,
  TrendingDown,
  Building2,
  Calendar,
  Wallet,
  XCircle,
  ArrowDownCircle,
} from 'lucide-react';
import { calculateNetSalary } from '@water-business/calculations';
import { useStore, ExpenseRecord, DebtRecord, SalaryPaymentRecord } from '../store/useStore';
import { v4 as uuidv4 } from 'uuid';

export const FinanceView: React.FC = () => {
  const {
    user,
    branches,
    stores,
    workers,
    currentBranchId,
    currentStoreId,
    expenseTypes,
    paymentMethodsList,
    expensesList,
    debtsList,
    salaryPaymentsList,
    addExpense,
    addDebt,
    settleDebt,
    recordSalaryPayment,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'expenses' | 'salaries' | 'debts'>('expenses');
  const [notification, setNotification] = useState<string | null>(null);

  const branchStores = stores.filter((s) => !currentBranchId || s.branchId === currentBranchId);
  const branchWorkers = workers.filter((w) => !currentBranchId || w.branchId === currentBranchId);
  const filteredExpenses = expensesList.filter(
    (e) => !currentBranchId || e.branchId === currentBranchId
  );

  // New Expense Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState(expenseTypes[0]?.code || 'FUEL');
  const [expenseAmount, setExpenseAmount] = useState(50000);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseStoreId, setExpenseStoreId] = useState(currentStoreId || branchStores[0]?.id || stores[0]?.id || '');
  const [expensePaymentMethod, setExpensePaymentMethod] = useState('CASH');

  // Salary Payslip Modal State
  const [selectedWorkerForSalary, setSelectedWorkerForSalary] = useState<any | null>(null);
  const [salaryCommission, setSalaryCommission] = useState(50000);
  const [salaryAllowances, setSalaryAllowances] = useState(20000);
  const [salaryPaymentMethod, setSalaryPaymentMethod] = useState('MOBILE_MONEY');

  // Settle Debt Modal State
  const [settleDebtModalTarget, setSettleDebtModalTarget] = useState<DebtRecord | null>(null);
  const [settleAmount, setSettleAmount] = useState(0);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Calculations for Salary Payslip Modal
  const workerDebtBalance = selectedWorkerForSalary
    ? debtsList
        .filter((d) => d.debtorName === selectedWorkerForSalary.fullName && d.status !== 'CLEARED')
        .reduce((sum, d) => sum + d.balanceAmountUgx, 0)
    : 0;

  const salaryCalc = selectedWorkerForSalary
    ? calculateNetSalary({
        basicSalaryUgx: selectedWorkerForSalary.basicSalaryUgx || 450000,
        commissionUgx: Number(salaryCommission) || 0,
        allowancesUgx: Number(salaryAllowances) || 0,
        debtDeductionsUgx: workerDebtBalance,
      })
    : null;

  // Expense Handlers
  const handleRecordExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseAmount <= 0) {
      alert('Expense amount must be greater than 0');
      return;
    }

    const voucherNumber = `EXP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const newExp: ExpenseRecord = {
      id: uuidv4(),
      voucherNumber,
      category: expenseCategory,
      description: expenseDesc || `${expenseCategory} operating expense`,
      amountUgx: Number(expenseAmount),
      branchId: stores.find((s) => s.id === expenseStoreId)?.branchId || 'b1111111-1111-1111-1111-111111111111',
      storeId: expenseStoreId,
      paymentMethod: expensePaymentMethod,
      approvedBy: user?.fullName || 'Branch Manager',
      date: new Date().toISOString().split('T')[0],
    };

    addExpense(newExp);
    setIsExpenseModalOpen(false);
    setExpenseDesc('');
    notify(`Expense voucher ${voucherNumber} (UGX ${expenseAmount.toLocaleString()}) recorded successfully!`);
  };

  // Salary Payment Authorize Handler
  const handleAuthorizeSalaryPayment = () => {
    if (!selectedWorkerForSalary || !salaryCalc) return;

    const voucherNumber = `SAL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const paymentRecord: SalaryPaymentRecord = {
      id: uuidv4(),
      workerId: selectedWorkerForSalary.id,
      workerName: selectedWorkerForSalary.fullName,
      department: selectedWorkerForSalary.department,
      month: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      basicSalaryUgx: salaryCalc.basicSalaryUgx,
      commissionUgx: salaryCalc.commissionUgx,
      allowancesUgx: salaryCalc.allowancesUgx,
      debtDeductedUgx: salaryCalc.debtDeductionsUgx,
      netPaidUgx: salaryCalc.netSalaryUgx,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: salaryPaymentMethod,
      voucherNumber,
    };

    recordSalaryPayment(paymentRecord);
    const workerName = selectedWorkerForSalary.fullName;
    setSelectedWorkerForSalary(null);
    notify(`Salary voucher ${voucherNumber} processed for ${workerName}! Net Paid: UGX ${salaryCalc.netSalaryUgx.toLocaleString()}`);
  };

  // Settle Debt Handler
  const handleSettleDebtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleDebtModalTarget || settleAmount <= 0) return;

    settleDebt(settleDebtModalTarget.id, Number(settleAmount));
    const name = settleDebtModalTarget.debtorName;
    setSettleDebtModalTarget(null);
    notify(`Payment of UGX ${Number(settleAmount).toLocaleString()} recorded against debt for ${name}.`);
  };

  // Totals
  const totalExpensesUgx = expensesList.reduce((sum, e) => sum + e.amountUgx, 0);
  const totalDebtsOutstandingUgx = debtsList
    .filter((d) => d.status !== 'CLEARED')
    .reduce((sum, d) => sum + d.balanceAmountUgx, 0);
  const totalSalariesPaidUgx = salaryPaymentsList.reduce((sum, s) => sum + s.netPaidUgx, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-emerald-400" />
            <span>Finance, Expenses & Payroll Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track business operating expenses, route staff debt recoveries, and calculate monthly worker payrolls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'expenses' && (
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="btn-touch bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Record New Expense
            </button>
          )}

          <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex">
            {(['expenses', 'salaries', 'debts'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {notification && (
        <div className="bg-emerald-950 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-lg animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Total Expenses Recorded</div>
            <div className="text-xl font-extrabold text-rose-400 mt-1 font-mono">
              UGX {totalExpensesUgx.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">{expensesList.length} Vouchers Filed</div>
          </div>
          <div className="p-3 bg-rose-950/60 text-rose-400 rounded-xl border border-rose-500/30">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Payroll Salaries Paid</div>
            <div className="text-xl font-extrabold text-emerald-400 mt-1 font-mono">
              UGX {totalSalariesPaidUgx.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">{salaryPaymentsList.length} Payslips Disbursed</div>
          </div>
          <div className="p-3 bg-emerald-950/60 text-emerald-400 rounded-xl border border-emerald-500/30">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Outstanding Shortage Debts</div>
            <div className="text-xl font-extrabold text-amber-400 mt-1 font-mono">
              UGX {totalDebtsOutstandingUgx.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Recoverable from payroll</div>
          </div>
          <div className="p-3 bg-amber-950/60 text-amber-400 rounded-xl border border-amber-500/30">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* EXPENSES TAB */}
      {activeTab === 'expenses' && (
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-200 text-sm">Operating Expenses & Vouchers Ledger ({expensesList.length})</h3>
            <span className="text-xs text-slate-400">Fuel, factory maintenance, driver allowances, utilities</span>
          </div>

          {expensesList.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs space-y-2">
              <Receipt className="w-8 h-8 mx-auto text-slate-600" />
              <p>No expenses recorded yet. Click "Record New Expense" to create a voucher.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">Voucher #</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Payment Method</th>
                    <th className="p-3">Approved By</th>
                    <th className="p-3 text-right">Amount (UGX)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {expensesList.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-900/50">
                      <td className="p-3 font-mono font-bold text-cyan-400">{exp.voucherNumber}</td>
                      <td className="p-3 text-slate-400">{exp.date}</td>
                      <td className="p-3">
                        <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] font-mono text-slate-300 font-bold">
                          {exp.category}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-200">{exp.description}</td>
                      <td className="p-3 text-slate-400">{exp.paymentMethod}</td>
                      <td className="p-3 text-slate-400">{exp.approvedBy}</td>
                      <td className="p-3 text-right font-mono font-bold text-rose-400">
                        UGX {exp.amountUgx.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SALARIES TAB */}
      {activeTab === 'salaries' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-200 text-sm">Monthly Staff Payroll Processing</h3>
                <p className="text-xs text-slate-400">Compute basic salaries, route commissions, and auto-recover field debts.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">Worker Full Name</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Basic Salary</th>
                    <th className="p-3">Outstanding Shortage Debt</th>
                    <th className="p-3 text-right">Payroll Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {workers.map((worker) => {
                    const activeDebt = debtsList
                      .filter((d) => d.debtorName === worker.fullName && d.status !== 'CLEARED')
                      .reduce((sum, d) => sum + d.balanceAmountUgx, 0);

                    return (
                      <tr key={worker.id} className="hover:bg-slate-900/50">
                        <td className="p-3 font-bold text-slate-100">{worker.fullName}</td>
                        <td className="p-3 text-slate-400">{worker.department}</td>
                        <td className="p-3 font-mono text-slate-200 font-semibold">
                          UGX {worker.basicSalaryUgx.toLocaleString()}
                        </td>
                        <td className="p-3">
                          {activeDebt > 0 ? (
                            <span className="font-mono text-rose-400 font-bold bg-rose-950/70 border border-rose-800/50 px-2 py-0.5 rounded text-[11px]">
                              - UGX {activeDebt.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-bold text-[11px]">No Outstanding Debt ✓</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedWorkerForSalary(worker);
                              setSalaryCommission(50000);
                              setSalaryAllowances(20000);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-md cursor-pointer"
                          >
                            Process Payslip & Disburse
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paid Salary Vouchers History */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
            <h3 className="font-bold text-slate-200 text-sm">Disbursed Salary Payments History ({salaryPaymentsList.length})</h3>

            {salaryPaymentsList.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">No salary payments processed yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                    <tr>
                      <th className="p-3">Voucher #</th>
                      <th className="p-3">Payment Date</th>
                      <th className="p-3">Worker</th>
                      <th className="p-3">Month</th>
                      <th className="p-3">Basic</th>
                      <th className="p-3">Commission & Allowances</th>
                      <th className="p-3">Debt Recovered</th>
                      <th className="p-3 text-right">Net Disbursed (UGX)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {salaryPaymentsList.map((sp) => (
                      <tr key={sp.id}>
                        <td className="p-3 font-mono font-bold text-cyan-400">{sp.voucherNumber}</td>
                        <td className="p-3 text-slate-400">{sp.paymentDate}</td>
                        <td className="p-3 font-semibold text-slate-200">{sp.workerName}</td>
                        <td className="p-3 text-slate-400">{sp.month}</td>
                        <td className="p-3 font-mono">UGX {sp.basicSalaryUgx.toLocaleString()}</td>
                        <td className="p-3 font-mono text-emerald-400">+ UGX {(sp.commissionUgx + sp.allowancesUgx).toLocaleString()}</td>
                        <td className="p-3 font-mono text-rose-400">
                          {sp.debtDeductedUgx > 0 ? `- UGX ${sp.debtDeductedUgx.toLocaleString()}` : '-'}
                        </td>
                        <td className="p-3 text-right font-mono font-extrabold text-emerald-400">
                          UGX {sp.netPaidUgx.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DEBTS TAB */}
      {activeTab === 'debts' && (
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-200 text-sm">Staff Shortage & Customer Credit Debts ({debtsList.length})</h3>
            <span className="text-xs text-slate-400">Auto-created on field route shortages</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Debtor Worker</th>
                  <th className="p-3">Source & Reason</th>
                  <th className="p-3">Original Amount</th>
                  <th className="p-3">Amount Paid</th>
                  <th className="p-3">Outstanding Balance</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {debtsList.map((debt) => (
                  <tr key={debt.id} className="hover:bg-slate-900/50">
                    <td className="p-3 font-bold text-slate-100">{debt.debtorName}</td>
                    <td className="p-3 text-slate-400">{debt.source}</td>
                    <td className="p-3 font-semibold text-slate-200 font-mono">UGX {debt.originalAmountUgx.toLocaleString()}</td>
                    <td className="p-3 text-emerald-400 font-mono">UGX {debt.paidAmountUgx.toLocaleString()}</td>
                    <td className="p-3 font-extrabold text-rose-400 font-mono">UGX {debt.balanceAmountUgx.toLocaleString()}</td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          debt.status === 'CLEARED'
                            ? 'bg-emerald-950 border-emerald-500/40 text-emerald-400'
                            : 'bg-rose-950 border-rose-500/40 text-rose-400'
                        }`}
                      >
                        {debt.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {debt.status !== 'CLEARED' && (
                        <button
                          onClick={() => {
                            setSettleDebtModalTarget(debt);
                            setSettleAmount(debt.balanceAmountUgx);
                          }}
                          className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md cursor-pointer"
                        >
                          Direct Payment Settle
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record New Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-rose-400 text-base">
                <Receipt className="w-5 h-5" />
                <span>Record New Business Expense</span>
              </div>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-slate-400 hover:text-white text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordExpenseSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Expense Category</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 font-semibold"
                  required
                >
                  {expenseTypes.map((et) => (
                    <option key={et.id} value={et.code}>
                      {et.name} ({et.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Amount (UGX)</label>
                <input
                  type="number"
                  min="100"
                  required
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-rose-400 font-bold text-base"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Description / Purpose</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50 Litres Diesel for Isuzu Lorry"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Store / Branch</label>
                  <select
                    value={expenseStoreId}
                    onChange={(e) => setExpenseStoreId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-semibold"
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Payment Method</label>
                  <select
                    value={expensePaymentMethod}
                    onChange={(e) => setExpensePaymentMethod(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-semibold"
                  >
                    {paymentMethodsList.map((pm) => (
                      <option key={pm.id} value={pm.code}>
                        {pm.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 border-t border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-rose-950 cursor-pointer"
                >
                  Authorize & Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Salary Payslip Modal */}
      {selectedWorkerForSalary && salaryCalc && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-100">
            <div className="text-center border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-lg text-emerald-400">Worker Payslip Calculation</h3>
              <div className="text-xs text-slate-300 font-bold">{selectedWorkerForSalary.fullName}</div>
              <div className="text-[11px] text-slate-500">{selectedWorkerForSalary.department} Department</div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Route Commission (UGX)</label>
                  <input
                    type="number"
                    value={salaryCommission}
                    onChange={(e) => setSalaryCommission(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-emerald-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Allowances (UGX)</label>
                  <input
                    type="number"
                    value={salaryAllowances}
                    onChange={(e) => setSalaryAllowances(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-emerald-300 font-bold"
                  />
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>Basic Salary:</span>
                  <span className="font-bold font-mono">UGX {salaryCalc.basicSalaryUgx.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Commissions + Allowances:</span>
                  <span className="font-bold font-mono text-emerald-400">+ UGX {(salaryCalc.commissionUgx + salaryCalc.allowancesUgx).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-100 font-extrabold border-t border-slate-800/80 pt-1">
                  <span>Gross Pay:</span>
                  <span className="font-mono">UGX {salaryCalc.grossSalaryUgx.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-rose-400 font-bold">
                  <span>Auto Debt Recovery Deduction:</span>
                  <span className="font-mono">- UGX {salaryCalc.debtDeductionsUgx.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-extrabold text-sm border-t border-slate-800/80 pt-1.5">
                  <span>Net Salary Payable:</span>
                  <span className="font-mono text-base">UGX {salaryCalc.netSalaryUgx.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Payment Disbursal Method</label>
                <select
                  value={salaryPaymentMethod}
                  onChange={(e) => setSalaryPaymentMethod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-semibold"
                >
                  <option value="MOBILE_MONEY">Mobile Money (MTN / Airtel)</option>
                  <option value="CASH">Physical Cash</option>
                  <option value="BANK_TRANSFER">Bank Direct Deposit</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 border-t border-slate-800 pt-4">
              <button
                onClick={() => setSelectedWorkerForSalary(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleAuthorizeSalaryPayment}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" /> Authorize & Pay Salary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settle Debt Modal */}
      {settleDebtModalTarget && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-cyan-400 text-base">
                <CreditCard className="w-5 h-5" />
                <span>Settle Debt / Record Cash Payment</span>
              </div>
              <button onClick={() => setSettleDebtModalTarget(null)} className="text-slate-400 hover:text-white text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleSettleDebtSubmit} className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400">Debtor: </span>
                <span className="text-slate-100 font-bold">{settleDebtModalTarget.debtorName}</span>
              </div>
              <div>
                <span className="text-slate-400">Total Outstanding Balance: </span>
                <span className="text-rose-400 font-mono font-bold">
                  UGX {settleDebtModalTarget.balanceAmountUgx.toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Payment Amount (UGX)</label>
                <input
                  type="number"
                  min="100"
                  max={settleDebtModalTarget.balanceAmountUgx}
                  required
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-emerald-400 font-bold text-base"
                />
              </div>

              <div className="flex gap-2 border-t border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setSettleDebtModalTarget(null)}
                  className="px-4 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 rounded-xl shadow-md cursor-pointer"
                >
                  Record Payment & Settle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
