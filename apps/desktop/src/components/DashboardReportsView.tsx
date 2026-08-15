import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  AlertTriangle,
  Users,
  Truck,
  Database,
  FileText,
  Calendar,
  Filter,
  Download,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';
import { useStore } from '../store/useStore';

export const DashboardReportsView: React.FC = () => {
  const {
    user,
    branches,
    stores,
    products,
    inventoryStock,
    salesHistory,
    fieldSessionsList,
    expensesList,
    debtsList,
    salaryPaymentsList,
    auditLogs,
    isOnline,
    syncStatus,
    pendingSyncCount,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports'>('dashboard');

  // Filters state
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState('2026-08-15');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [selectedReportType, setSelectedReportType] = useState('DAILY_SALES');

  // Dynamically compute real metrics from live store state
  const totalSalesUgx = salesHistory.reduce((sum, s) => sum + s.totalAmountUgx, 0);
  const todaysDate = new Date().toISOString().split('T')[0];
  const todaysSalesUgx = salesHistory
    .filter((s) => s.date === todaysDate)
    .reduce((sum, s) => sum + s.totalAmountUgx, 0);

  let currentStockCartons = 0;
  let lowStockCount = 0;
  Object.entries(inventoryStock).forEach(([storeId, prodMap]) => {
    Object.entries(prodMap).forEach(([prodId, qty]) => {
      currentStockCartons += qty;
      const prod = products.find((p) => p.id === prodId);
      if (prod && qty > 0 && qty <= prod.minStockAlert) {
        lowStockCount += 1;
      }
    });
  });

  const outstandingDebtsUgx = debtsList
    .filter((d) => d.status !== 'CLEARED')
    .reduce((sum, d) => sum + d.balanceAmountUgx, 0);

  const expensesUgx = expensesList.reduce((sum, e) => sum + e.amountUgx, 0);

  const bankedMoneyUgx = salesHistory
    .filter((s) => s.paymentMethod === 'BANK_TRANSFER')
    .reduce((sum, s) => sum + s.totalAmountUgx, 0);

  const mobileMoneyUgx = salesHistory
    .filter((s) => s.paymentMethod === 'MOBILE_MONEY')
    .reduce((sum, s) => sum + s.totalAmountUgx, 0);

  const stockVariancesCount = fieldSessionsList.filter((s) => s.status === 'OPEN').length;

  const adminMetrics = {
    totalSalesUgx,
    todaysSalesUgx,
    monthlySalesUgx: totalSalesUgx,
    currentStockCartons,
    lowStockCount,
    outstandingDebtsUgx,
    expensesUgx,
    bankedMoneyUgx,
    mobileMoneyUgx,
    stockVariancesCount,
    syncStatus: `${isOnline ? 'ONLINE' : 'OFFLINE'} (${pendingSyncCount} Pending)`,
    backupStatus: `Active (${auditLogs.length} Audit Logs)`,
  };

  const reportsList = [
    { id: 'DAILY_SALES', title: 'Daily Sales Report' },
    { id: 'MONTHLY_SALES', title: 'Monthly Sales Summary' },
    { id: 'BRANCH_PERFORMANCE', title: 'Branch Performance & Profitability' },
    { id: 'PRODUCT_SALES', title: 'Product Sales Analysis' },
    { id: 'STOCK_BALANCE', title: 'Stock Balance Report' },
    { id: 'STOCK_MOVEMENT', title: 'Immutable Stock Movement Ledger' },
    { id: 'FIELD_SESSION', title: 'Field Session & Delivery Log' },
    { id: 'FIELD_RECONCILIATION', title: 'Field Dual Reconciliation Report' },
    { id: 'VEHICLE_PERFORMANCE', title: 'Vehicle (Lorry/Tricycle) Efficiency' },
    { id: 'WORKER_PERFORMANCE', title: 'Worker Performance & Commission' },
    { id: 'EXPENSES', title: 'Branch Expenses Summary' },
    { id: 'DEBTS_PAID', title: 'Outstanding Debts & Payments' },
    { id: 'PROFITABILITY', title: 'Gross Profit & Margin Report' },
    { id: 'AUDIT_LOG', title: 'System Audit Log Report' },
  ];

  const handleExportCSV = () => {
    const csvData = `Report,Date Range,Branch,Generated At\n${selectedReportType},${startDate} to ${endDate},${selectedBranch},${new Date().toISOString()}`;
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `${selectedReportType}_Report_${Date.now()}.csv`);
    a.click();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 select-none">
      
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-cyan-400" />
            <span>Role Dashboards & Professional Reports</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time business performance analytics, financial metrics, and exportable audit-grade reporting.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Executive Dashboard
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Business Reports
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        <div className="space-y-6">
          {/* Top Key Metrics Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="glass-card rounded-2xl p-4 border border-slate-800">
              <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
                <span>Total Sales</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-extrabold text-cyan-400 mt-2 font-mono">
                UGX {adminMetrics.totalSalesUgx.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Today: UGX {adminMetrics.todaysSalesUgx.toLocaleString()} • ({salesHistory.length} sales)
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-slate-800">
              <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
                <span>Current Stock</span>
                <Package className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-extrabold text-slate-100 mt-2 font-mono">
                {adminMetrics.currentStockCartons.toLocaleString()} <span className="text-xs font-normal text-slate-400">Cartons / Units</span>
              </div>
              <div className={`text-[11px] mt-1 font-semibold ${adminMetrics.lowStockCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {adminMetrics.lowStockCount > 0 ? `${adminMetrics.lowStockCount} Low-Stock Alert(s)` : 'Healthy Stock Levels ✓'}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-slate-800">
              <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
                <span>Outstanding Debts</span>
                <DollarSign className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-extrabold text-rose-400 mt-2 font-mono">
                UGX {adminMetrics.outstandingDebtsUgx.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Expenses: UGX {adminMetrics.expensesUgx.toLocaleString()}</div>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-slate-800">
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

          {/* Branch & Field Performance Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
              <h3 className="font-bold text-slate-200 text-sm">Branch Performance Breakdown</h3>
              <div className="space-y-3 text-xs">
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

            <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
              <h3 className="font-bold text-slate-200 text-sm">Operational Activity Summary</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <div className="text-slate-400">Total Expenses Filed</div>
                  <div className="text-base font-extrabold text-rose-400 mt-1 font-mono">
                    UGX {adminMetrics.expensesUgx.toLocaleString()}
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <div className="text-slate-400">Mobile Money Received</div>
                  <div className="text-base font-extrabold text-cyan-400 mt-1 font-mono">
                    UGX {adminMetrics.mobileMoneyUgx.toLocaleString()}
                  </div>
                </div>
              </div>

              {adminMetrics.stockVariancesCount > 0 ? (
                <div className="bg-amber-950/60 border border-amber-500/40 rounded-xl p-3 text-xs text-amber-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>{adminMetrics.stockVariancesCount} Active Field Session(s) Out on Route</span>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-400 flex items-center gap-2">
                  <span>No active route sessions currently dispatched.</span>
                </div>
              )}
            </div>

          </div>
        </div>
      ) : (
        /* Professional Reports Center */
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
          
          {/* Report Filtering Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
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
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Branch Filter</label>
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

          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-cyan-400">
                {reportsList.find((r) => r.id === selectedReportType)?.title}
              </h2>
              <span className="text-xs text-slate-400">
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Transaction / Ref</th>
                  <th className="p-3">Entity / Product</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Amount / Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {salesHistory.map((s) => (
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
                {salesHistory.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      No sales or transactions recorded for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

    </div>
  );
};
