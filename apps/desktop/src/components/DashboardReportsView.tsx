import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  AlertTriangle,
  Database,
  Download,
  Receipt,
  FileSpreadsheet,
  PieChart,
  Wallet,
} from 'lucide-react';
import { useStore } from '../store/useStore';

export const DashboardReportsView: React.FC = () => {
  const {
    branches,
    stores,
    products,
    inventoryStock,
    salesHistory,
    fieldSessionsList,
    expensesList,
    debtsList,
    auditLogs,
    currentBranchId,
    isOnline,
    pendingSyncCount,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports'>('dashboard');

  // Filters state
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBranch, setSelectedBranch] = useState(currentBranchId || 'ALL');
  const [selectedReportType, setSelectedReportType] = useState('PROFITABILITY');

  // Determine active branch scope
  const activeBranchFilter = selectedBranch === 'ALL' ? currentBranchId : selectedBranch;
  const activeBranchStores = stores.filter((s) => !activeBranchFilter || s.branchId === activeBranchFilter);
  const activeStoreIdSet = new Set(activeBranchStores.map((s) => s.id));

  // Branch-filtered datasets
  const filteredSales = salesHistory.filter(
    (s) => activeStoreIdSet.size === 0 || activeStoreIdSet.has(s.storeId)
  );
  const filteredExpenses = expensesList.filter(
    (e) => !activeBranchFilter || e.branchId === activeBranchFilter || (e.storeId && activeStoreIdSet.has(e.storeId))
  );
  const filteredSessions = fieldSessionsList.filter(
    (fs) => activeStoreIdSet.size === 0 || activeStoreIdSet.has(fs.storeId)
  );

  // Dynamically compute real metrics from live branch store state
  const totalSalesUgx = filteredSales.reduce((sum, s) => sum + s.totalAmountUgx, 0);
  const todaysDate = new Date().toISOString().split('T')[0];
  const todaysSalesUgx = filteredSales
    .filter((s) => s.date === todaysDate)
    .reduce((sum, s) => sum + s.totalAmountUgx, 0);

  let currentStockCartons = 0;
  let lowStockCount = 0;
  Object.entries(inventoryStock).forEach(([storeId, prodMap]) => {
    if (activeStoreIdSet.size === 0 || activeStoreIdSet.has(storeId)) {
      Object.entries(prodMap).forEach(([prodId, qty]) => {
        currentStockCartons += qty;
        const prod = products.find((p) => p.id === prodId);
        if (prod && qty > 0 && qty <= prod.minStockAlert) {
          lowStockCount += 1;
        }
      });
    }
  });

  const outstandingDebtsUgx = debtsList
    .filter((d) => d.status !== 'CLEARED')
    .reduce((sum, d) => sum + d.balanceAmountUgx, 0);

  const expensesUgx = filteredExpenses.reduce((sum, e) => sum + e.amountUgx, 0);

  // Net Profit Calculation: Gross Sales Revenue minus Operational Expenses and Outstanding Debts
  const netProfitUgx = totalSalesUgx - expensesUgx - outstandingDebtsUgx;
  const profitMarginPercent = totalSalesUgx > 0 ? ((netProfitUgx / totalSalesUgx) * 100).toFixed(1) : '0.0';

  const bankedMoneyUgx = filteredSales
    .filter((s) => s.paymentMethod === 'BANK_TRANSFER')
    .reduce((sum, s) => sum + s.totalAmountUgx, 0);

  const mobileMoneyUgx = filteredSales
    .filter((s) => s.paymentMethod === 'MOBILE_MONEY')
    .reduce((sum, s) => sum + s.totalAmountUgx, 0);

  const stockVariancesCount = filteredSessions.filter((s) => s.status === 'OPEN').length;

  const adminMetrics = {
    totalSalesUgx,
    todaysSalesUgx,
    monthlySalesUgx: totalSalesUgx,
    currentStockCartons,
    lowStockCount,
    outstandingDebtsUgx,
    expensesUgx,
    netProfitUgx,
    profitMarginPercent,
    bankedMoneyUgx,
    mobileMoneyUgx,
    stockVariancesCount,
    syncStatus: `${isOnline ? 'ONLINE' : 'OFFLINE'} (${pendingSyncCount} Pending)`,
    backupStatus: `Active (${auditLogs.length} Audit Logs)`,
  };

  const reportsList = [
    { id: 'PROFITABILITY', title: 'Gross & Net Profitability Summary (After Expenses & Debts)' },
    { id: 'DAILY_SALES', title: 'Daily Sales Report' },
    { id: 'MONTHLY_SALES', title: 'Monthly Sales Summary' },
    { id: 'BRANCH_PERFORMANCE', title: 'Branch Performance & Profitability' },
    { id: 'PRODUCT_SALES', title: 'Product Sales Analysis' },
    { id: 'STOCK_BALANCE', title: 'Stock Balance Report' },
    { id: 'EXPENSES', title: 'Branch Expenses Summary' },
    { id: 'DEBTS_PAID', title: 'Outstanding Debts & Payments' },
    { id: 'AUDIT_LOG', title: 'System Audit Log Report' },
  ];

  const handleExportCSV = () => {
    let csvData = `AquaPOS Business Report - ${selectedReportType}\n`;
    csvData += `Generated At,${new Date().toLocaleString()}\n`;
    csvData += `Date Scope,${startDate} to ${endDate}\n`;
    csvData += `Branch Scope,${selectedBranch === 'ALL' ? 'Consolidated All Branches' : 'Filtered Branch'}\n\n`;
    csvData += `FINANCIAL SUMMARY\n`;
    csvData += `Gross Sales Revenue (UGX),${totalSalesUgx}\n`;
    csvData += `Total Expenses (UGX),${expensesUgx}\n`;
    csvData += `Outstanding Uncollected Debts (UGX),${outstandingDebtsUgx}\n`;
    csvData += `NET PROFIT REALIZED (UGX),${netProfitUgx}\n`;
    csvData += `Profit Margin (%),${profitMarginPercent}%\n\n`;

    if (selectedReportType === 'EXPENSES') {
      csvData += `Voucher Ref,Category,Description,Branch,Date,Amount (UGX)\n`;
      filteredExpenses.forEach((e) => {
        csvData += `"${e.voucherNumber}","${e.category}","${e.description}","${e.branchId}","${e.date}",${e.amountUgx}\n`;
      });
    } else if (selectedReportType === 'DEBTS_PAID') {
      csvData += `Debtor Name,Source,Original Amount (UGX),Paid (UGX),Balance (UGX),Status,Date\n`;
      debtsList.forEach((d) => {
        csvData += `"${d.debtorName}","${d.source}",${d.originalAmountUgx},${d.paidAmountUgx},${d.balanceAmountUgx},"${d.status}","${d.date}"\n`;
      });
    } else {
      csvData += `Receipt Ref,Date,Payment Method,Items,Total Amount (UGX)\n`;
      filteredSales.forEach((s) => {
        const itemsStr = s.items.map((it) => `${it.quantity}x ${it.name}`).join('; ');
        csvData += `"${s.receiptNumber}","${s.date}","${s.paymentMethod}","${itemsStr}",${s.totalAmountUgx}\n`;
      });
    }

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `${selectedReportType}_Report_${Date.now()}.csv`);
    a.click();
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6 select-none">
      
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-400 shrink-0" />
            <span>Business Reports & Analytics</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time business performance analytics, expense tracking, and net profit calculations after expenses & debts.
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Reports Center
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        <div className="space-y-4 sm:space-y-6">
          {/* Financial Summary Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            
            {/* 1. Total Sales / Revenue */}
            <div className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-900/80">
              <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
                <span>Total Sales (Gross Revenue)</span>
                <TrendingUp className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-extrabold text-cyan-400 mt-2 font-mono">
                UGX {adminMetrics.totalSalesUgx.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Today: UGX {adminMetrics.todaysSalesUgx.toLocaleString()} • ({filteredSales.length} sales)
              </div>
            </div>

            {/* 2. Total Expenses */}
            <div className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-900/80">
              <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
                <span>Total Expenses</span>
                <TrendingDown className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-extrabold text-rose-400 mt-2 font-mono">
                UGX {adminMetrics.expensesUgx.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                ({filteredExpenses.length} Expense Voucher Records)
              </div>
            </div>

            {/* 3. Outstanding Debts */}
            <div className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-900/80">
              <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
                <span>Outstanding Debts</span>
                <DollarSign className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-extrabold text-amber-400 mt-2 font-mono">
                UGX {adminMetrics.outstandingDebtsUgx.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Uncollected Credit & Debt Balances
              </div>
            </div>

            {/* 4. Net Profit Realized */}
            <div className={`glass-card rounded-2xl p-4 border ${netProfitUgx >= 0 ? 'border-emerald-500/40 bg-emerald-950/20' : 'border-rose-500/40 bg-rose-950/20'}`}>
              <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
                <span className="text-slate-200 font-bold">Net Profit (After Exp. & Debts)</span>
                <PieChart className={`w-4 h-4 ${netProfitUgx >= 0 ? 'text-emerald-400' : 'text-rose-400'}`} />
              </div>
              <div className={`text-2xl font-extrabold mt-2 font-mono ${netProfitUgx >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                UGX {netProfitUgx.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-300 mt-1 font-semibold">
                Margin: <span className="text-cyan-400 font-bold">{profitMarginPercent}%</span> • (Sales - Expenses - Debts)
              </div>
            </div>

          </div>

          {/* Secondary Operational Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-900/60">
              <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
                <span>Current Stock Level</span>
                <Package className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-xl font-extrabold text-slate-100 mt-2 font-mono">
                {adminMetrics.currentStockCartons.toLocaleString()} <span className="text-xs font-normal text-slate-400">Cartons / Units</span>
              </div>
              <div className={`text-[11px] mt-1 font-semibold ${adminMetrics.lowStockCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {adminMetrics.lowStockCount > 0 ? `${adminMetrics.lowStockCount} Low-Stock Alert(s)` : 'Healthy Stock Levels ✓'}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-900/60">
              <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
                <span>Digital Collections</span>
                <Wallet className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-xl font-extrabold text-cyan-400 mt-2 font-mono">
                UGX {(mobileMoneyUgx + bankedMoneyUgx).toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                MoMo: UGX {mobileMoneyUgx.toLocaleString()} • Bank: UGX {bankedMoneyUgx.toLocaleString()}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-900/60">
              <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
                <span>Sync & Backup Status</span>
                <Database className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-sm font-extrabold text-emerald-400 mt-2 truncate font-mono">
                {adminMetrics.syncStatus}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 truncate">{adminMetrics.backupStatus}</div>
            </div>
          </div>

          {/* Branch Performance Breakdown */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
            <h3 className="font-bold text-slate-200 text-sm">Branch Performance & Stock Availability</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {branches.map((b) => {
                const branchStores = stores.filter((s) => s.branchId === b.id);
                let branchStock = 0;
                branchStores.forEach((st) => {
                  const prodMap = inventoryStock[st.id] || {};
                  Object.values(prodMap).forEach((q) => {
                    branchStock += q;
                  });
                });

                return (
                  <div key={b.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-100 text-sm">{b.name}</div>
                      <div className="text-slate-400 text-[11px]">{b.location} • {branchStores.length} Stores</div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-cyan-400 text-sm font-mono">{branchStock.toLocaleString()} Units</div>
                      <div className="text-emerald-400 text-[10px] font-semibold">Live Stock Available</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      ) : (
        /* Professional Reports Center */
        <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-slate-800 space-y-4 sm:space-y-6">
          
          {/* Report Filtering Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 bg-slate-950 p-3 sm:p-4 rounded-xl border border-slate-800">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Report Type</label>
              <select
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-semibold mt-1 focus:outline-none focus:border-cyan-500"
              >
                {reportsList.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Branch Scope</label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-semibold mt-1 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-semibold mt-1"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-semibold mt-1"
              />
            </div>
          </div>

          {/* Prominent Profitability & Expense Financial Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 bg-slate-950 p-3 sm:p-4 rounded-xl border border-slate-800">
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                <span>Gross Revenue (Sales)</span>
              </div>
              <div className="text-lg sm:text-xl font-extrabold text-cyan-400 mt-1 font-mono">
                UGX {totalSalesUgx.toLocaleString()}
              </div>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                <span>Total Expenses</span>
              </div>
              <div className="text-lg sm:text-xl font-extrabold text-rose-400 mt-1 font-mono">
                UGX {expensesUgx.toLocaleString()}
              </div>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                <span>Outstanding Debts</span>
              </div>
              <div className="text-lg sm:text-xl font-extrabold text-amber-400 mt-1 font-mono">
                UGX {outstandingDebtsUgx.toLocaleString()}
              </div>
            </div>

            <div className={`p-3 bg-slate-900/80 rounded-xl border ${netProfitUgx >= 0 ? 'border-emerald-500/40' : 'border-rose-500/40'}`}>
              <div className="text-slate-400 text-xs font-semibold flex items-center justify-between">
                <span className="text-slate-200 font-bold">Net Profit Realized</span>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${netProfitUgx >= 0 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
                  {netProfitUgx >= 0 ? 'PROFIT ✓' : 'LOSS'}
                </span>
              </div>
              <div className={`text-lg sm:text-xl font-extrabold mt-1 font-mono ${netProfitUgx >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                UGX {netProfitUgx.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Margin: {profitMarginPercent}% • Sales - Expenses - Debts
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-cyan-400">
                {reportsList.find((r) => r.id === selectedReportType)?.title}
              </h2>
              <span className="text-[11px] sm:text-xs text-slate-400">
                Period: {startDate} to {endDate} • Scope: {selectedBranch === 'ALL' ? 'Consolidated All Branches' : 'Filtered Branch'}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleExportCSV}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            </div>
          </div>

          {/* Dynamic Report Data Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800/80">
            {selectedReportType === 'EXPENSES' ? (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">Voucher #</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-right">Amount (UGX)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id}>
                      <td className="p-3 font-mono font-bold text-cyan-400">{exp.voucherNumber}</td>
                      <td className="p-3 font-semibold text-slate-200">{exp.category}</td>
                      <td className="p-3 text-slate-300">{exp.description}</td>
                      <td className="p-3 text-slate-400">{exp.date}</td>
                      <td className="p-3 text-right font-mono font-bold text-rose-400">
                        UGX {exp.amountUgx.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {filteredExpenses.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        No expense records filed for this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : selectedReportType === 'DEBTS_PAID' ? (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">Debtor Name</th>
                    <th className="p-3">Source / Reason</th>
                    <th className="p-3">Original Debt</th>
                    <th className="p-3">Paid Amount</th>
                    <th className="p-3 text-right">Balance (UGX)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {debtsList.map((d) => (
                    <tr key={d.id}>
                      <td className="p-3 font-bold text-slate-100">{d.debtorName}</td>
                      <td className="p-3 text-slate-300">{d.source}</td>
                      <td className="p-3 font-mono text-slate-400">UGX {d.originalAmountUgx.toLocaleString()}</td>
                      <td className="p-3 font-mono text-emerald-400">UGX {d.paidAmountUgx.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-bold text-amber-400">
                        UGX {d.balanceAmountUgx.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {debtsList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        No outstanding debts recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : selectedReportType === 'PROFITABILITY' ? (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">Financial Statement Metric</th>
                    <th className="p-3">Calculation Details</th>
                    <th className="p-3 text-right">Amount (UGX)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr>
                    <td className="p-3 font-bold text-cyan-400 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-cyan-400" />
                      <span>Gross Sales Revenue</span>
                    </td>
                    <td className="p-3 text-slate-400">Sum of all completed sales across branch stores</td>
                    <td className="p-3 text-right font-mono font-extrabold text-cyan-400">
                      UGX {totalSalesUgx.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-rose-400 flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-rose-400" />
                      <span>Operational Expenses</span>
                    </td>
                    <td className="p-3 text-slate-400">Sum of fuel, maintenance, salaries & operational vouchers</td>
                    <td className="p-3 text-right font-mono font-extrabold text-rose-400">
                      - UGX {expensesUgx.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-amber-400 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-amber-400" />
                      <span>Outstanding Uncollected Debts</span>
                    </td>
                    <td className="p-3 text-slate-400">Uncollected customer & credit balances</td>
                    <td className="p-3 text-right font-mono font-extrabold text-amber-400">
                      - UGX {outstandingDebtsUgx.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-slate-900/90 font-extrabold text-sm">
                    <td className={`p-4 flex items-center gap-2 ${netProfitUgx >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      <Receipt className="w-5 h-5" />
                      <span>Net Realized Profit</span>
                    </td>
                    <td className="p-4 text-slate-300 text-xs font-normal">
                      Net Profit = Gross Sales - Expenses - Debts (Margin: {profitMarginPercent}%)
                    </td>
                    <td className={`p-4 text-right font-mono text-base ${netProfitUgx >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      UGX {netProfitUgx.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">Receipt / Ref</th>
                    <th className="p-3">Entity / Products</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-right">Amount / Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredSales.map((s) => (
                    <tr key={s.id}>
                      <td className="p-3 font-mono font-bold text-cyan-400">{s.receiptNumber}</td>
                      <td className="p-3 font-semibold text-slate-200">
                        {s.items.map((it) => `${it.quantity}x ${it.name}`).join(', ')}
                      </td>
                      <td className="p-3 text-slate-400">{s.date}</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-400">
                        UGX {s.totalAmountUgx.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {filteredSales.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500">
                        No sales or transactions recorded for this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
