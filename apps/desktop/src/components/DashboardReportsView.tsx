import React, { useState, useMemo } from 'react';
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
  Store,
  Calendar,
  Clock,
  User,
  Eye,
  X,
  Search,
  Filter,
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  CreditCard,
  Building2,
  CheckCircle2,
  ExternalLink,
  Layers,
  Phone,
  Tag,
  Copy,
  Check,
  Smartphone,
  Landmark,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useStore, SaleRecord, ExpenseRecord, DebtRecord } from '../store/useStore';
import { NavSelection } from './Navbar';

export type DashboardTab =
  | 'dashboard'
  | 'sales_service'
  | 'expenses'
  | 'debts'
  | 'stock_grid'
  | 'digital_collections'
  | 'profitability'
  | 'reports';

interface DashboardReportsViewProps {
  currentNav?: NavSelection;
  onSelectNav?: (nav: NavSelection) => void;
}

export const DashboardReportsView: React.FC<DashboardReportsViewProps> = ({ currentNav, onSelectNav }) => {
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
    currentStoreId,
    isOnline,
    pendingSyncCount,
  } = useStore();

  // Active tab state
  const [activeTab, setActiveTab] = useState<DashboardTab>('dashboard');

  // Interactive Store Switcher (All Stores or specific store)
  const [selectedStoreId, setSelectedStoreId] = useState<string>('ALL');

  // Search & Filter states - default to ALL and empty start date so all historical data is immediately visible
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [selectedReportType, setSelectedReportType] = useState('PROFITABILITY');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('ALL');
  const [stockCategoryFilter, setStockCategoryFilter] = useState<string>('ALL');
  const [lowStockOnly, setLowStockOnly] = useState<boolean>(false);

  // Modals state for clickable description cells
  const [selectedExpenseForModal, setSelectedExpenseForModal] = useState<ExpenseRecord | null>(null);
  const [selectedDebtForModal, setSelectedDebtForModal] = useState<DebtRecord | null>(null);
  const [selectedSaleForModal, setSelectedSaleForModal] = useState<SaleRecord | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  // Sync tab with navigation when user clicks reports subviews in navbar
  React.useEffect(() => {
    if (currentNav?.domain === 'reports') {
      if (currentNav.subView === 'sales_reports') setActiveTab('sales_service');
      else if (currentNav.subView === 'stock_reports') setActiveTab('stock_grid');
      else if (currentNav.subView === 'financial_reports') setActiveTab('expenses');
      else if (currentNav.subView === 'audit_reports') {
        setSelectedReportType('AUDIT_LOG');
        setActiveTab('reports');
      }
    }
  }, [currentNav?.domain, currentNav?.subView]);

  // Determine active branch & store scopes
  const activeBranchFilter = selectedBranch === 'ALL' ? '' : selectedBranch;
  const activeBranchStores = useMemo(() => {
    return stores.filter((s) => !activeBranchFilter || s.branchId === activeBranchFilter);
  }, [stores, activeBranchFilter]);

  const activeStoreIdSet = useMemo(() => {
    if (selectedStoreId !== 'ALL') return new Set([selectedStoreId]);
    return new Set(activeBranchStores.map((s) => s.id));
  }, [selectedStoreId, activeBranchStores]);

  // Branch- & Store-filtered datasets
  const filteredSales = useMemo(() => {
    return salesHistory.filter((s) => {
      const matchStore =
        selectedStoreId === 'ALL'
          ? (!activeBranchFilter || (stores.find((st) => st.id === s.storeId)?.branchId === activeBranchFilter) || !s.storeId)
          : s.storeId === selectedStoreId;
      const matchPayment = paymentMethodFilter === 'ALL' || s.paymentMethod === paymentMethodFilter;
      const matchDate = (!startDate || s.date >= startDate) && (!endDate || s.date <= endDate);
      const matchSearch =
        !searchQuery ||
        s.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.customerName && s.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.customerPhone && s.customerPhone.includes(searchQuery)) ||
        s.items.some((it) => it.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchStore && matchPayment && matchDate && matchSearch;
    });
  }, [salesHistory, selectedStoreId, activeBranchFilter, stores, paymentMethodFilter, startDate, endDate, searchQuery]);

  const filteredExpenses = useMemo(() => {
    return expensesList.filter((e) => {
      const matchBranch = !activeBranchFilter || !e.branchId || e.branchId === activeBranchFilter;
      const matchStore = selectedStoreId === 'ALL' || !e.storeId || e.storeId === selectedStoreId;
      const matchDate = (!startDate || e.date >= startDate) && (!endDate || e.date <= endDate);
      const matchSearch =
        !searchQuery ||
        e.voucherNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.approvedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchBranch && matchStore && matchDate && matchSearch;
    });
  }, [expensesList, activeBranchFilter, selectedStoreId, startDate, endDate, searchQuery]);

  const filteredDebts = useMemo(() => {
    return debtsList.filter((d) => {
      const matchDate = (!startDate || d.date >= startDate) && (!endDate || d.date <= endDate);
      const matchSearch =
        !searchQuery ||
        d.debtorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.reason && d.reason.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (d.approvedBy && d.approvedBy.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchDate && matchSearch;
    });
  }, [debtsList, startDate, endDate, searchQuery]);

  // Stock Grid Data
  const stockGridRows = useMemo(() => {
    const rows: Array<{
      productId: string;
      productName: string;
      sku: string;
      category: string;
      packaging: string;
      storeId: string;
      storeName: string;
      branchName: string;
      quantity: number;
      minStockAlert: number;
      costPriceUgx: number;
      sellingPriceUgx: number;
      valuationCostUgx: number;
      valuationRetailUgx: number;
      status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
    }> = [];

    const targetStores = selectedStoreId === 'ALL' ? activeBranchStores : stores.filter((s) => s.id === selectedStoreId);

    targetStores.forEach((st) => {
      const storeStock = inventoryStock[st.id] || {};
      const branch = branches.find((b) => b.id === st.branchId);

      products.forEach((p) => {
        if (stockCategoryFilter !== 'ALL' && p.category !== stockCategoryFilter) return;

        const qty = storeStock[p.id] || 0;
        if (lowStockOnly && qty > p.minStockAlert) return;

        const matchSearch =
          !searchQuery ||
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          st.name.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchSearch) return;

        let status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'IN_STOCK';
        if (qty <= 0) status = 'OUT_OF_STOCK';
        else if (qty <= p.minStockAlert) status = 'LOW_STOCK';

        rows.push({
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          category: p.category,
          packaging: p.packaging || p.unitOfMeasure,
          storeId: st.id,
          storeName: st.name,
          branchName: branch ? branch.name : 'Branch',
          quantity: qty,
          minStockAlert: p.minStockAlert,
          costPriceUgx: p.costPriceUgx,
          sellingPriceUgx: p.sellingPriceUgx,
          valuationCostUgx: qty * p.costPriceUgx,
          valuationRetailUgx: qty * p.sellingPriceUgx,
          status,
        });
      });
    });

    return rows;
  }, [selectedStoreId, activeBranchStores, stores, inventoryStock, branches, products, stockCategoryFilter, lowStockOnly, searchQuery]);

  // Digital Collections Dataset
  const digitalCollections = useMemo(() => {
    return filteredSales.filter(
      (s) => s.paymentMethod === 'MOBILE_MONEY' || s.paymentMethod === 'BANK_TRANSFER'
    );
  }, [filteredSales]);

  // Compute live high-level metrics
  const totalSalesUgx = useMemo(() => filteredSales.reduce((sum, s) => sum + s.totalAmountUgx, 0), [filteredSales]);
  const todaysDate = new Date().toISOString().split('T')[0];
  const todaysSalesUgx = useMemo(
    () => filteredSales.filter((s) => s.date === todaysDate).reduce((sum, s) => sum + s.totalAmountUgx, 0),
    [filteredSales, todaysDate]
  );
  const expensesUgx = useMemo(() => filteredExpenses.reduce((sum, e) => sum + e.amountUgx, 0), [filteredExpenses]);
  const outstandingDebtsUgx = useMemo(
    () => debtsList.filter((d) => d.status !== 'CLEARED').reduce((sum, d) => sum + d.balanceAmountUgx, 0),
    [debtsList]
  );
  const netProfitUgx = totalSalesUgx - expensesUgx - outstandingDebtsUgx;
  const profitMarginPercent = totalSalesUgx > 0 ? ((netProfitUgx / totalSalesUgx) * 100).toFixed(1) : '0.0';

  const bankedMoneyUgx = useMemo(
    () => filteredSales.filter((s) => s.paymentMethod === 'BANK_TRANSFER').reduce((sum, s) => sum + s.totalAmountUgx, 0),
    [filteredSales]
  );
  const mobileMoneyUgx = useMemo(
    () => filteredSales.filter((s) => s.paymentMethod === 'MOBILE_MONEY').reduce((sum, s) => sum + s.totalAmountUgx, 0),
    [filteredSales]
  );

  let currentStockCartons = 0;
  let lowStockCount = 0;
  let totalStockValuationCost = 0;
  Object.entries(inventoryStock).forEach(([storeId, prodMap]) => {
    if (activeStoreIdSet.size === 0 || activeStoreIdSet.has(storeId)) {
      Object.entries(prodMap).forEach(([prodId, qty]) => {
        currentStockCartons += qty;
        const prod = products.find((p) => p.id === prodId);
        if (prod) {
          totalStockValuationCost += qty * prod.costPriceUgx;
          if (qty > 0 && qty <= prod.minStockAlert) lowStockCount += 1;
        }
      });
    }
  });

  // Timestamp formatting helper
  const formatDateTime = (isoString?: string, fallbackDate?: string) => {
    if (!isoString && !fallbackDate) return { date: '-', time: '-', full: '-' };
    try {
      const d = new Date(isoString || fallbackDate || '');
      if (isNaN(d.getTime())) return { date: fallbackDate || '-', time: '-', full: fallbackDate || '-' };
      const datePart = d.toISOString().split('T')[0];
      const timePart = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return {
        date: datePart,
        time: timePart,
        full: `${datePart} • ${timePart}`,
        display: `${d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      };
    } catch {
      return { date: fallbackDate || '-', time: '-', full: fallbackDate || '-' };
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    let csvData = `AquaPOS Business Report - ${selectedReportType}\n`;
    csvData += `Generated At,${new Date().toLocaleString()}\n`;
    csvData += `Date Scope,${startDate} to ${endDate}\n`;
    csvData += `Store Scope,${selectedStoreId === 'ALL' ? 'All Stores' : stores.find((s) => s.id === selectedStoreId)?.name || selectedStoreId}\n\n`;

    if (selectedReportType === 'EXPENSES') {
      csvData += `Voucher Ref,Category,Description,Who Spent / Approved,Branch,Date,Amount (UGX)\n`;
      filteredExpenses.forEach((e) => {
        csvData += `"${e.voucherNumber}","${e.category}","${(e.description || '').replace(/"/g, '""')}","${e.approvedBy}","${e.branchId}","${e.date}",${e.amountUgx}\n`;
      });
    } else if (selectedReportType === 'DEBTS_PAID') {
      csvData += `Debtor Name,Source,Reason / Description,Approved By,Original (UGX),Paid (UGX),Balance (UGX),Status,Date\n`;
      debtsList.forEach((d) => {
        csvData += `"${d.debtorName}","${d.source}","${(d.reason || '').replace(/"/g, '""')}","${d.approvedBy || ''}",${d.originalAmountUgx},${d.paidAmountUgx},${d.balanceAmountUgx},"${d.status}","${d.date}"\n`;
      });
    } else if (selectedReportType === 'STOCK_BALANCE') {
      csvData += `Product,SKU,Category,Store,In Stock Units,Min Alert,Cost Price,Selling Price,Valuation (UGX),Status\n`;
      stockGridRows.forEach((r) => {
        csvData += `"${r.productName}","${r.sku}","${r.category}","${r.storeName}",${r.quantity},${r.minStockAlert},${r.costPriceUgx},${r.sellingPriceUgx},${r.valuationCostUgx},"${r.status}"\n`;
      });
    } else {
      csvData += `Receipt Ref,Date & Time,Store,Customer Name,Payment Method,Products Bought,Total Amount (UGX)\n`;
      filteredSales.forEach((s) => {
        const itemsStr = s.items.map((it) => `${it.quantity}x ${it.name} (@UGX ${it.unitPriceUgx})`).join('; ');
        const stName = stores.find((st) => st.id === s.storeId)?.name || s.storeId;
        csvData += `"${s.receiptNumber}","${s.createdAt || s.date}","${stName}","${s.customerName || 'Walk-in'}","${s.paymentMethod}","${itemsStr}",${s.totalAmountUgx}\n`;
      });
    }

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `${selectedReportType}_Report_${Date.now()}.csv`);
    a.click();
  };

  const reportsList = [
    { id: 'PROFITABILITY', title: 'Gross & Net Profitability Summary (After Expenses & Debts)' },
    { id: 'DAILY_SALES', title: 'Daily Sales Report' },
    { id: 'MONTHLY_SALES', title: 'Monthly Sales Summary' },
    { id: 'STOCK_BALANCE', title: 'Stock Balance & Inventory Valuation' },
    { id: 'EXPENSES', title: 'Branch & Store Expenses Summary' },
    { id: 'DEBTS_PAID', title: 'Outstanding Debts & Recovery' },
    { id: 'DIGITAL_COLLECTIONS', title: 'Digital Collections (MoMo & Bank)' },
    { id: 'AUDIT_LOG', title: 'System Audit Log & Trail' },
  ];

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6 select-none">
      
      {/* Header & Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-400 shrink-0" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">
              Business Reports & Analytics
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-store operations tracking, sales audit service, expense vouchers, debt recovery, and stock grid.
          </p>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'dashboard'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Executive Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('sales_service')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sales_service'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sales Service</span>
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'expenses'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            <span>Expenses</span>
          </button>

          <button
            onClick={() => setActiveTab('debts')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'debts'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
            <span>Debts</span>
          </button>

          <button
            onClick={() => setActiveTab('stock_grid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'stock_grid'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-emerald-400" />
            <span>Stock Grid</span>
          </button>

          <button
            onClick={() => setActiveTab('digital_collections')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'digital_collections'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Wallet className="w-3.5 h-3.5 text-purple-400" />
            <span>Digital Collections</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'reports'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Reports Center</span>
          </button>
        </div>
      </div>

      {/* Global Store Switcher Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-inner">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-950/80 border border-cyan-500/30 rounded-lg text-cyan-400">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">Active Store Filter</div>
            <div className="text-xs font-bold text-slate-200">
              {selectedStoreId === 'ALL' ? 'Consolidated All Stores' : stores.find((s) => s.id === selectedStoreId)?.name || 'Selected Store'}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-400 font-medium">Switch Store:</span>
          <select
            value={selectedStoreId}
            onChange={(e) => setSelectedStoreId(e.target.value)}
            className="bg-slate-950 border border-slate-700 hover:border-cyan-500 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
          >
            <option value="ALL">🏢 All Stores (Consolidated View)</option>
            {activeBranchStores.map((st) => (
              <option key={st.id} value={st.id}>
                🏬 {st.name} ({st.code})
              </option>
            ))}
          </select>

          {/* Quick Date Scope Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none"
            />
            <span className="text-slate-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* TAB 1: EXECUTIVE DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-300 flex items-center gap-1.5">
              <span>Financial Overview & Real-Time Performance</span>
              <span className="text-[11px] font-normal text-slate-500">(Click any card to open its detailed operations view)</span>
            </h2>
          </div>

          {/* Primary 4 Metric Cards (Clickable) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            
            {/* Card 1: Total Sales */}
            <div
              onClick={() => setActiveTab('sales_service')}
              className="glass-card rounded-2xl p-4.5 border border-slate-800 bg-slate-900/90 hover:border-cyan-500/60 hover:shadow-xl hover:shadow-cyan-950/40 hover:-translate-y-0.5 transition-all cursor-pointer group active:scale-[0.99] relative overflow-hidden"
              title="Click to view Sales Service & Track Every Operation"
            >
              <div className="absolute top-2 right-2 text-[10px] font-bold text-cyan-400/80 bg-cyan-950/60 border border-cyan-500/30 rounded-md px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <span>View Sales</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </div>

              <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
                <span className="group-hover:text-cyan-300 transition-colors">Total Sales (Gross Revenue)</span>
                <div className="p-1.5 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-500/20">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>

              <div className="text-2xl font-extrabold text-cyan-400 mt-2.5 font-mono tracking-tight">
                UGX {totalSalesUgx.toLocaleString()}
              </div>

              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span>Today: UGX {todaysSalesUgx.toLocaleString()}</span>
                <span className="font-semibold text-cyan-300 group-hover:underline">({filteredSales.length} Orders) →</span>
              </div>
            </div>

            {/* Card 2: Total Expenses */}
            <div
              onClick={() => setActiveTab('expenses')}
              className="glass-card rounded-2xl p-4.5 border border-slate-800 bg-slate-900/90 hover:border-rose-500/60 hover:shadow-xl hover:shadow-rose-950/40 hover:-translate-y-0.5 transition-all cursor-pointer group active:scale-[0.99] relative overflow-hidden"
              title="Click to view Expense Records, Approvers & Full Descriptions"
            >
              <div className="absolute top-2 right-2 text-[10px] font-bold text-rose-400/80 bg-rose-950/60 border border-rose-500/30 rounded-md px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <span>View Expenses</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </div>

              <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
                <span className="group-hover:text-rose-300 transition-colors">Total Expenses</span>
                <div className="p-1.5 rounded-lg bg-rose-950/80 text-rose-400 border border-rose-500/20">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>

              <div className="text-2xl font-extrabold text-rose-400 mt-2.5 font-mono tracking-tight">
                UGX {expensesUgx.toLocaleString()}
              </div>

              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span>{filteredExpenses.length} Vouchers Recorded</span>
                <span className="font-semibold text-rose-300 group-hover:underline">View Descriptions →</span>
              </div>
            </div>

            {/* Card 3: Outstanding Debts */}
            <div
              onClick={() => setActiveTab('debts')}
              className="glass-card rounded-2xl p-4.5 border border-slate-800 bg-slate-900/90 hover:border-amber-500/60 hover:shadow-xl hover:shadow-amber-950/40 hover:-translate-y-0.5 transition-all cursor-pointer group active:scale-[0.99] relative overflow-hidden"
              title="Click to view Debt Records & Shortage Information"
            >
              <div className="absolute top-2 right-2 text-[10px] font-bold text-amber-400/80 bg-amber-950/60 border border-amber-500/30 rounded-md px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <span>View Debts</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </div>

              <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
                <span className="group-hover:text-amber-300 transition-colors">Outstanding Debts</span>
                <div className="p-1.5 rounded-lg bg-amber-950/80 text-amber-400 border border-amber-500/20">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>

              <div className="text-2xl font-extrabold text-amber-400 mt-2.5 font-mono tracking-tight">
                UGX {outstandingDebtsUgx.toLocaleString()}
              </div>

              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span>Uncollected Credit Balances</span>
                <span className="font-semibold text-amber-300 group-hover:underline">View Debt Info →</span>
              </div>
            </div>

            {/* Card 4: Net Profit Realized */}
            <div
              onClick={() => setActiveTab('profitability')}
              className={`glass-card rounded-2xl p-4.5 border transition-all cursor-pointer group active:scale-[0.99] relative overflow-hidden hover:shadow-xl ${
                netProfitUgx >= 0
                  ? 'border-emerald-500/40 bg-emerald-950/20 hover:border-emerald-400 hover:shadow-emerald-950/40'
                  : 'border-rose-500/40 bg-rose-950/20 hover:border-rose-400 hover:shadow-rose-950/40'
              }`}
              title="Click to view Net Realized Profit Calculation & Statement"
            >
              <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
                <span className="text-slate-200 font-bold">Net Profit (After Exp. & Debts)</span>
                <div className={`p-1.5 rounded-lg border ${netProfitUgx >= 0 ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/20' : 'bg-rose-950/80 text-rose-400 border-rose-500/20'}`}>
                  <PieChart className="w-4 h-4" />
                </div>
              </div>

              <div className={`text-2xl font-extrabold mt-2.5 font-mono tracking-tight ${netProfitUgx >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                UGX {netProfitUgx.toLocaleString()}
              </div>

              <div className="text-[11px] text-slate-300 mt-1 font-semibold flex items-center justify-between">
                <span>Margin: <span className="text-cyan-400 font-bold">{profitMarginPercent}%</span></span>
                <span className="text-emerald-300 group-hover:underline">P&L Statement →</span>
              </div>
            </div>

          </div>

          {/* Secondary 3 Operational Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
            
            {/* Card 5: Current Stock Levels */}
            <div
              onClick={() => setActiveTab('stock_grid')}
              className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-900/70 hover:border-emerald-500/60 hover:shadow-lg transition-all cursor-pointer group active:scale-[0.99]"
              title="Click to view Current Stock Levels in Grid View Style (Rows & Columns)"
            >
              <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
                <span className="group-hover:text-emerald-300 transition-colors">Current Stock Levels</span>
                <div className="p-1 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-500/20">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-extrabold text-slate-100 mt-2 font-mono">
                {currentStockCartons.toLocaleString()} <span className="text-xs font-normal text-slate-400">Cartons / Units</span>
              </div>
              <div className="text-[11px] mt-1 font-semibold flex items-center justify-between">
                <span className={lowStockCount > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                  {lowStockCount > 0 ? `${lowStockCount} Low Stock Alert(s)` : 'Healthy Inventory ✓'}
                </span>
                <span className="text-cyan-400 group-hover:underline font-bold">Grid View (Rows & Cols) →</span>
              </div>
            </div>

            {/* Card 6: Digital Collections */}
            <div
              onClick={() => setActiveTab('digital_collections')}
              className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-900/70 hover:border-purple-500/60 hover:shadow-lg transition-all cursor-pointer group active:scale-[0.99]"
              title="Click to view Digital Collections, Transactions, Cashier & Exact Timestamps"
            >
              <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
                <span className="group-hover:text-purple-300 transition-colors">Digital Collections</span>
                <div className="p-1 rounded-lg bg-purple-950/80 text-purple-400 border border-purple-500/20">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-extrabold text-purple-400 mt-2 font-mono">
                UGX {(mobileMoneyUgx + bankedMoneyUgx).toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span>MoMo: UGX {mobileMoneyUgx.toLocaleString()} • Bank: UGX {bankedMoneyUgx.toLocaleString()}</span>
                <span className="text-purple-300 group-hover:underline font-bold">View Times →</span>
              </div>
            </div>

            {/* Card 7: Sync & Backup Status */}
            <div
              onClick={() => {
                setSelectedReportType('AUDIT_LOG');
                setActiveTab('reports');
              }}
              className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-900/70 hover:border-cyan-500/60 hover:shadow-lg transition-all cursor-pointer group active:scale-[0.99]"
              title="Click to view Audit Log & Backup Status"
            >
              <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
                <span className="group-hover:text-cyan-300 transition-colors">Sync & Backup Status</span>
                <div className="p-1 rounded-lg bg-cyan-950/80 text-emerald-400 border border-emerald-500/20">
                  <Database className="w-4 h-4" />
                </div>
              </div>
              <div className="text-sm font-extrabold text-emerald-400 mt-2 truncate font-mono">
                {isOnline ? 'ONLINE (Neon Postgres Cloud)' : 'OFFLINE (Local SQLite)'}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span>{pendingSyncCount} Pending Sync Queue</span>
                <span className="text-cyan-400 group-hover:underline font-bold">Audit Reports →</span>
              </div>
            </div>

          </div>

          {/* Branch Performance Summary */}
          <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-cyan-400" />
                <span>Branch Stock & Store Breakdown</span>
              </h3>
              <span className="text-xs text-slate-400">{branches.length} Registered Branches</span>
            </div>

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
                  <div
                    key={b.id}
                    onClick={() => {
                      setSelectedBranch(b.id);
                      setActiveTab('stock_grid');
                    }}
                    className="bg-slate-950 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-3.5 flex justify-between items-center cursor-pointer transition-all hover:bg-slate-900/50"
                  >
                    <div>
                      <div className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                        <span>{b.name}</span>
                        <span className="text-[10px] text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800/40 font-mono">{b.code}</span>
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5">{b.location} • {branchStores.length} Active Store(s)</div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-cyan-400 text-sm font-mono">{branchStock.toLocaleString()} Units</div>
                      <div className="text-emerald-400 text-[10px] font-semibold">Click for Stock Grid →</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SALES SERVICE */}
      {activeTab === 'sales_service' && (
        <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-slate-800 space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Back to Overview"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base sm:text-lg font-bold text-cyan-400 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-cyan-400" />
                  <span>Sales Operations Service</span>
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Real-time tracking of every operation performed in the system: time, date, products bought, customer name, and store switcher.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {onSelectNav && (
                <button
                  onClick={() => onSelectNav({ domain: 'operations', subView: 'pos' })}
                  className="px-3 py-1.5 bg-cyan-600/80 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Open Store POS</span>
                </button>
              )}
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Sales CSV</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar for Sales */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="p-2">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Sales Revenue</div>
              <div className="text-base font-extrabold text-cyan-400 font-mono">UGX {totalSalesUgx.toLocaleString()}</div>
            </div>
            <div className="p-2">
              <div className="text-[10px] uppercase font-bold text-slate-400">Completed Orders</div>
              <div className="text-base font-extrabold text-slate-100 font-mono">{filteredSales.length} Transactions</div>
            </div>
            <div className="p-2">
              <div className="text-[10px] uppercase font-bold text-slate-400">Digital Receipts</div>
              <div className="text-base font-extrabold text-purple-400 font-mono">
                {filteredSales.filter((s) => s.paymentMethod !== 'CASH').length} Digital Payments
              </div>
            </div>
            <div className="p-2">
              <div className="text-[10px] uppercase font-bold text-slate-400">Avg Order Value</div>
              <div className="text-base font-extrabold text-emerald-400 font-mono">
                UGX {filteredSales.length > 0 ? Math.round(totalSalesUgx / filteredSales.length).toLocaleString() : 0}
              </div>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search sales by customer name, receipt #, phone, or product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="ALL">All Payment Methods</option>
                <option value="CASH">Cash</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CREDIT">Credit</option>
              </select>
            </div>
          </div>

          {/* Sales Operations Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Receipt / Ref</th>
                  <th className="p-3">Time & Date Bought</th>
                  <th className="p-3">Store</th>
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">Products Bought</th>
                  <th className="p-3">Payment Method</th>
                  <th className="p-3 text-right">Total Amount (UGX)</th>
                  <th className="p-3 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSales.map((s) => {
                  const timeInfo = formatDateTime(s.createdAt, s.date);
                  const storeObj = stores.find((st) => st.id === s.storeId);

                  return (
                    <tr key={s.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-cyan-400">
                        {s.receiptNumber}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{timeInfo.date}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                          <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span>{timeInfo.time}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-200">{storeObj ? storeObj.name : s.storeId}</div>
                        <div className="text-[10px] text-slate-400">{storeObj ? storeObj.code : ''}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-100 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{s.customerName || 'Walk-in Customer'}</span>
                        </div>
                        {s.customerPhone && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            <span>{s.customerPhone}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3 max-w-[280px]">
                        {s.items && s.items.length > 0 ? (
                          <div className="space-y-1">
                            {s.items.slice(0, 2).map((it, idx) => (
                              <div key={idx} className="text-slate-200 text-[11px] truncate flex items-center justify-between">
                                <span><span className="font-bold text-cyan-400">{it.quantity}x</span> {it.name}</span>
                                <span className="text-slate-400 font-mono text-[10px]">UGX {(it.quantity * it.unitPriceUgx).toLocaleString()}</span>
                              </div>
                            ))}
                            {s.items.length > 2 && (
                              <button
                                onClick={() => setSelectedSaleForModal(s)}
                                className="text-[10px] text-cyan-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                              >
                                +{s.items.length - 2} more product(s) (Click to view)
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">Water Products Sale</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          s.paymentMethod === 'CASH'
                            ? 'bg-slate-800 text-slate-300'
                            : s.paymentMethod === 'MOBILE_MONEY'
                            ? 'bg-purple-950 text-purple-300 border border-purple-800'
                            : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                        }`}>
                          {s.paymentMethod}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-extrabold text-cyan-400 text-sm">
                        UGX {s.totalAmountUgx.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setSelectedSaleForModal(s)}
                          className="p-1.5 bg-slate-800 hover:bg-cyan-600 hover:text-white rounded-lg text-slate-300 transition-colors cursor-pointer"
                          title="View Complete Products & Receipt Breakdown"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredSales.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      No sales recorded for this store or date scope.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 3: EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-slate-800 space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Back to Overview"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base sm:text-lg font-bold text-rose-400 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-rose-400" />
                  <span>Expenses Records & Voucher Ledger</span>
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Records of operational expenses, who approved/spent the money, time recorded, and clickable description cells with instant pop-up modals.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {onSelectNav && (
                <button
                  onClick={() => onSelectNav({ domain: 'operations', subView: 'expenses' })}
                  className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Open Expense Manager</span>
                </button>
              )}
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Expenses CSV</span>
              </button>
            </div>
          </div>

          {/* Quick Expense Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="p-2">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Spent</div>
              <div className="text-base font-extrabold text-rose-400 font-mono">UGX {expensesUgx.toLocaleString()}</div>
            </div>
            <div className="p-2">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Vouchers</div>
              <div className="text-base font-extrabold text-slate-100 font-mono">{filteredExpenses.length} Records</div>
            </div>
            <div className="p-2">
              <div className="text-[10px] uppercase font-bold text-slate-400">Scope Scope</div>
              <div className="text-xs font-bold text-slate-300 truncate">
                {selectedStoreId === 'ALL' ? 'All Stores' : stores.find((s) => s.id === selectedStoreId)?.name || 'Filtered'}
              </div>
            </div>
            <div className="p-2">
              <div className="text-[10px] uppercase font-bold text-slate-400">Interactive Feature</div>
              <div className="text-xs font-bold text-rose-300">Click Description Cell for Pop-up Modal ✓</div>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search expenses by voucher #, keyword, description, or approver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Expenses Table with Clickable Description Cell */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Voucher #</th>
                  <th className="p-3">Date & Time Recorded</th>
                  <th className="p-3">Who Spent / Approved</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Summary of Expense (Click for Details)</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3 text-right">Amount (UGX)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredExpenses.map((exp) => {
                  const timeInfo = formatDateTime(exp.createdAt, exp.date);

                  return (
                    <tr key={exp.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-rose-400 whitespace-nowrap">
                        {exp.voucherNumber}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{timeInfo.date}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                          <Clock className="w-3 h-3 text-rose-400 shrink-0" />
                          <span>{timeInfo.time}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-100 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-rose-400" />
                          <span>{exp.approvedBy || 'Manager'}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-semibold text-[11px]">
                          {exp.category}
                        </span>
                      </td>
                      
                      {/* CLICKABLE DESCRIPTION CELL WITH POPUP MODAL */}
                      <td className="p-3 max-w-xs">
                        <div
                          onClick={() => setSelectedExpenseForModal(exp)}
                          className="bg-slate-950/80 hover:bg-slate-800/90 border border-slate-800 hover:border-rose-500/50 p-2 rounded-xl cursor-pointer transition-all group flex items-start justify-between gap-2"
                          title="Click to open full description pop-up modal"
                        >
                          <span className="text-slate-300 text-xs truncate">
                            {exp.description || 'No detailed description provided.'}
                          </span>
                          <span className="shrink-0 p-1 bg-rose-950/80 text-rose-400 rounded-md border border-rose-500/20 group-hover:scale-110 transition-transform">
                            <Eye className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <span className="text-[11px] text-slate-400 font-medium">
                          {exp.paymentMethod || 'CASH'}
                        </span>
                      </td>

                      <td className="p-3 text-right font-mono font-extrabold text-rose-400 text-sm whitespace-nowrap">
                        UGX {exp.amountUgx.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}

                {filteredExpenses.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No expenses filed for this store or date scope.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 4: DEBTS */}
      {activeTab === 'debts' && (
        <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-slate-800 space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Back to Overview"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base sm:text-lg font-bold text-amber-400 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-amber-400" />
                  <span>Debts & Credit Recovery Records</span>
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Outstanding customer & worker debts, who approved the credit, date/time recorded, and clickable reason cells with pop-up modal.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {onSelectNav && (
                <button
                  onClick={() => onSelectNav({ domain: 'finance', subView: 'debts' })}
                  className="px-3 py-1.5 bg-amber-600/80 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Open Debts Manager</span>
                </button>
              )}
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Debts CSV</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="p-2">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Outstanding Balance</div>
              <div className="text-base font-extrabold text-amber-400 font-mono">UGX {outstandingDebtsUgx.toLocaleString()}</div>
            </div>
            <div className="p-2">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Uncollected Count</div>
              <div className="text-base font-extrabold text-slate-100 font-mono">
                {debtsList.filter((d) => d.status !== 'CLEARED').length} Accounts
              </div>
            </div>
            <div className="p-2">
              <div className="text-[10px] uppercase font-bold text-slate-400">Recovered to Date</div>
              <div className="text-base font-extrabold text-emerald-400 font-mono">
                UGX {debtsList.reduce((sum, d) => sum + d.paidAmountUgx, 0).toLocaleString()}
              </div>
            </div>
            <div className="p-2">
              <div className="text-[10px] uppercase font-bold text-slate-400">Interactive Feature</div>
              <div className="text-xs font-bold text-amber-300">Click Reason Cell for Pop-up Modal ✓</div>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search debts by debtor name, source, or reason notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Debts Table with Clickable Reason Cell */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Debtor Name</th>
                  <th className="p-3">Time & Date Recorded</th>
                  <th className="p-3">Source / Type</th>
                  <th className="p-3">Who Approved / Recorded</th>
                  <th className="p-3">Reason / Description (Click for Details)</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Original (UGX)</th>
                  <th className="p-3 text-right">Paid (UGX)</th>
                  <th className="p-3 text-right">Balance Due (UGX)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredDebts.map((d) => {
                  const timeInfo = formatDateTime(d.createdAt, d.date);

                  return (
                    <tr key={d.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3 font-bold text-slate-100 flex items-center gap-1.5 whitespace-nowrap">
                        <User className="w-3.5 h-3.5 text-amber-400" />
                        <span>{d.debtorName}</span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{timeInfo.date}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                          <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{timeInfo.time}</span>
                        </div>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-semibold text-[11px]">
                          {d.source}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap text-slate-300">
                        {d.approvedBy || 'Branch Manager'}
                      </td>

                      {/* CLICKABLE REASON CELL WITH POPUP MODAL */}
                      <td className="p-3 max-w-xs">
                        <div
                          onClick={() => setSelectedDebtForModal(d)}
                          className="bg-slate-950/80 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/50 p-2 rounded-xl cursor-pointer transition-all group flex items-start justify-between gap-2"
                          title="Click to open full debt reason pop-up modal"
                        >
                          <span className="text-slate-300 text-xs truncate">
                            {d.reason || 'No detailed notes recorded.'}
                          </span>
                          <span className="shrink-0 p-1 bg-amber-950/80 text-amber-400 rounded-md border border-amber-500/20 group-hover:scale-110 transition-transform">
                            <Eye className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          d.status === 'CLEARED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : d.status === 'PARTIALLY_PAID'
                            ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}>
                          {d.status}
                        </span>
                      </td>

                      <td className="p-3 text-right font-mono text-slate-400 whitespace-nowrap">
                        UGX {d.originalAmountUgx.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono text-emerald-400 whitespace-nowrap">
                        UGX {d.paidAmountUgx.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono font-extrabold text-amber-400 text-sm whitespace-nowrap">
                        UGX {d.balanceAmountUgx.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}

                {filteredDebts.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">
                      No debts or credit balances found for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 5: CURRENT STOCK LEVELS (GRID VIEW: ROWS & COLUMNS) */}
      {activeTab === 'stock_grid' && (
        <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-slate-800 space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Back to Overview"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base sm:text-lg font-bold text-emerald-400 flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-400" />
                  <span>Current Stock Levels (Grid View: Rows & Columns)</span>
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Real-time store inventory matrix showing physical units, min alert triggers, cost/retail valuations, and stock health status.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {onSelectNav && (
                <button
                  onClick={() => onSelectNav({ domain: 'inventory', subView: 'stock' })}
                  className="px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Stock Management</span>
                </button>
              )}
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Stock CSV</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics for Stock */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="p-2">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Physical Units</div>
              <div className="text-base font-extrabold text-emerald-400 font-mono">{currentStockCartons.toLocaleString()} Units</div>
            </div>
            <div className="p-2">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Inventory Valuation (Cost)</div>
              <div className="text-base font-extrabold text-cyan-400 font-mono">UGX {totalStockValuationCost.toLocaleString()}</div>
            </div>
            <div className="p-2">
              <div className="text-[10px] uppercase font-bold text-slate-400">Low Stock Triggers</div>
              <div className="text-base font-extrabold text-amber-400 font-mono">{lowStockCount} Items</div>
            </div>
            <div className="p-2">
              <div className="text-[10px] uppercase font-bold text-slate-400">Stock Outages</div>
              <div className="text-base font-extrabold text-rose-400 font-mono">
                {stockGridRows.filter((r) => r.quantity <= 0).length} Items
              </div>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by product name, SKU, or store..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setLowStockOnly(!lowStockOnly)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  lowStockOnly
                    ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {lowStockOnly ? 'Showing Low Stock Only ✓' : 'Filter Low Stock Only'}
              </button>
            </div>
          </div>

          {/* Grid View Table: Rows and Columns */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 shadow-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Product Name & Spec</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Store Location</th>
                  <th className="p-3 text-right">In Stock</th>
                  <th className="p-3 text-right">Min Alert</th>
                  <th className="p-3 text-right">Unit Cost (UGX)</th>
                  <th className="p-3 text-right">Selling Price (UGX)</th>
                  <th className="p-3 text-right">Stock Valuation (UGX)</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {stockGridRows.map((row, idx) => (
                  <tr key={`${row.storeId}-${row.productId}-${idx}`} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-slate-100">{row.productName}</div>
                      <div className="text-[10px] text-slate-400">{row.packaging}</div>
                    </td>
                    <td className="p-3 font-mono text-cyan-400 font-semibold">{row.sku}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-semibold">
                        {row.category}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-200">{row.storeName}</div>
                      <div className="text-[10px] text-slate-400">{row.branchName}</div>
                    </td>
                    <td className="p-3 text-right font-mono font-extrabold text-slate-100 text-sm">
                      {row.quantity.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-400">
                      {row.minStockAlert}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-400">
                      UGX {row.costPriceUgx.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono text-cyan-300">
                      UGX {row.sellingPriceUgx.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">
                      UGX {row.valuationCostUgx.toLocaleString()}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider ${
                        row.status === 'IN_STOCK'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : row.status === 'LOW_STOCK'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {row.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}

                {stockGridRows.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-500">
                      No products matching the active filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 6: DIGITAL COLLECTIONS */}
      {activeTab === 'digital_collections' && (
        <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-slate-800 space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Back to Overview"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base sm:text-lg font-bold text-purple-400 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-purple-400" />
                  <span>Digital Collections (Mobile Money & Bank Transfers)</span>
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Records of all cashless digital transactions: who processed the transaction, the customer, when it was done, and at what exact time.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {onSelectNav && (
                <button
                  onClick={() => onSelectNav({ domain: 'finance', subView: 'bank_mobile' })}
                  className="px-3 py-1.5 bg-purple-600/80 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Landmark className="w-3.5 h-3.5" />
                  <span>Bank & Cash Accounts</span>
                </button>
              )}
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Digital CSV</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="p-2">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Digital Collections</div>
              <div className="text-base font-extrabold text-purple-400 font-mono">
                UGX {(mobileMoneyUgx + bankedMoneyUgx).toLocaleString()}
              </div>
            </div>
            <div className="p-2">
              <div className="text-[10px] uppercase font-bold text-slate-400">Mobile Money (MTN / Airtel)</div>
              <div className="text-base font-extrabold text-purple-300 font-mono">
                UGX {mobileMoneyUgx.toLocaleString()}
              </div>
            </div>
            <div className="p-2">
              <div className="text-[10px] uppercase font-bold text-slate-400">Bank Deposits & EFT</div>
              <div className="text-base font-extrabold text-cyan-400 font-mono">
                UGX {bankedMoneyUgx.toLocaleString()}
              </div>
            </div>
            <div className="p-2">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Digital Transactions</div>
              <div className="text-base font-extrabold text-slate-100 font-mono">
                {digitalCollections.length} Processed
              </div>
            </div>
          </div>

          {/* Digital Collections Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Receipt / Ref</th>
                  <th className="p-3">Payment Channel</th>
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">Who Did The Transaction</th>
                  <th className="p-3">Store Location</th>
                  <th className="p-3">When Done & Exact Time</th>
                  <th className="p-3">Products Purchased</th>
                  <th className="p-3 text-right">Amount (UGX)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {digitalCollections.map((s) => {
                  const timeInfo = formatDateTime(s.createdAt, s.date);
                  const storeObj = stores.find((st) => st.id === s.storeId);

                  return (
                    <tr key={s.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-purple-400 whitespace-nowrap">
                        {s.receiptNumber}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1.5 w-fit ${
                          s.paymentMethod === 'MOBILE_MONEY'
                            ? 'bg-purple-950 text-purple-300 border border-purple-800'
                            : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                        }`}>
                          {s.paymentMethod === 'MOBILE_MONEY' ? <Smartphone className="w-3.5 h-3.5" /> : <Landmark className="w-3.5 h-3.5" />}
                          <span>{s.paymentMethod}</span>
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-100 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-purple-400" />
                          <span>{s.customerName || 'Walk-in Customer'}</span>
                        </div>
                        {s.customerPhone && (
                          <div className="text-[10px] text-slate-400 mt-0.5">{s.customerPhone}</div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-200 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{s.cashierId ? `Cashier (${s.cashierId.slice(-6)})` : 'Store Operator'}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-200">{storeObj ? storeObj.name : s.storeId}</div>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{timeInfo.date}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-purple-300 mt-0.5 font-mono">
                          <Clock className="w-3 h-3 text-purple-400 shrink-0" />
                          <span>{timeInfo.time}</span>
                        </div>
                      </td>
                      <td className="p-3 max-w-xs truncate text-slate-300">
                        {s.items.map((it) => `${it.quantity}x ${it.name}`).join(', ') || 'Sale Items'}
                      </td>
                      <td className="p-3 text-right font-mono font-extrabold text-purple-300 text-sm whitespace-nowrap">
                        UGX {s.totalAmountUgx.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}

                {digitalCollections.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      No digital payments (Mobile Money / Bank) recorded for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 7: PROFITABILITY STATEMENT */}
      {activeTab === 'profitability' && (
        <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-slate-800 space-y-4">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Back to Overview"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-base sm:text-lg font-bold text-emerald-400 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-emerald-400" />
                <span>Net Realized Profit Statement (After Expenses & Debts)</span>
              </h2>
            </div>
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export P&L CSV</span>
            </button>
          </div>

          {/* Statement Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Financial Metric</th>
                  <th className="p-3.5">Accounting Description</th>
                  <th className="p-3.5 text-right">Amount (UGX)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                <tr className="hover:bg-slate-900/30">
                  <td className="p-3.5 font-bold text-cyan-400 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    <span>Gross Sales Revenue</span>
                  </td>
                  <td className="p-3.5 text-slate-400">Total revenue from store POS and field route sales</td>
                  <td className="p-3.5 text-right font-mono font-extrabold text-cyan-400 text-sm">
                    UGX {totalSalesUgx.toLocaleString()}
                  </td>
                </tr>

                <tr className="hover:bg-slate-900/30">
                  <td className="p-3.5 font-bold text-rose-400 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-rose-400" />
                    <span>Operational Expenses</span>
                  </td>
                  <td className="p-3.5 text-slate-400">Total vouchers paid for fuel, utilities, route allowances & maintenance</td>
                  <td className="p-3.5 text-right font-mono font-extrabold text-rose-400 text-sm">
                    - UGX {expensesUgx.toLocaleString()}
                  </td>
                </tr>

                <tr className="hover:bg-slate-900/30">
                  <td className="p-3.5 font-bold text-amber-400 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-amber-400" />
                    <span>Outstanding Uncollected Debts</span>
                  </td>
                  <td className="p-3.5 text-slate-400">Uncollected customer credit and route cash shortages</td>
                  <td className="p-3.5 text-right font-mono font-extrabold text-amber-400 text-sm">
                    - UGX {outstandingDebtsUgx.toLocaleString()}
                  </td>
                </tr>

                <tr className="bg-slate-900/90 font-extrabold text-sm border-t-2 border-slate-700">
                  <td className={`p-4 flex items-center gap-2 ${netProfitUgx >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    <Receipt className="w-5 h-5" />
                    <span>Net Realized Profit Realized</span>
                  </td>
                  <td className="p-4 text-slate-300 text-xs font-normal">
                    Equation: Gross Sales - Expenses - Debts (Net Margin: {profitMarginPercent}%)
                  </td>
                  <td className={`p-4 text-right font-mono text-base ${netProfitUgx >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    UGX {netProfitUgx.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 8: REPORTS CENTER */}
      {activeTab === 'reports' && (
        <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-slate-800 space-y-4 sm:space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-cyan-400 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
                <span>Reports & Audit Center</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Generate and export detailed CSV reports across sales, inventory, expenses, debts, and system audit trails.
              </p>
            </div>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export {selectedReportType} CSV</span>
            </button>
          </div>

          {/* Filtering Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Report Selection</label>
              <select
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-semibold mt-1 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {reportsList.map((r) => (
                  <option key={r.id} value={r.id}>{r.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Store Scope</label>
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-semibold mt-1 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="ALL">All Stores (Consolidated)</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
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

          {/* Dynamic Table Preview */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            {selectedReportType === 'AUDIT_LOG' ? (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">User</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Entity</th>
                    <th className="p-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/40">
                      <td className="p-3 font-mono text-slate-400">{log.timestamp}</td>
                      <td className="p-3 font-bold text-slate-200">{log.user}</td>
                      <td className="p-3 font-semibold text-cyan-400">{log.action}</td>
                      <td className="p-3 text-slate-300">{log.entity}</td>
                      <td className="p-3 text-slate-400">{log.details}</td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">No audit logs recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : selectedReportType === 'EXPENSES' ? (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">Voucher #</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Who Spent</th>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-right">Amount (UGX)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id}>
                      <td className="p-3 font-mono font-bold text-rose-400">{exp.voucherNumber}</td>
                      <td className="p-3 text-slate-400">{exp.date}</td>
                      <td className="p-3 font-semibold text-slate-200">{exp.category}</td>
                      <td className="p-3 text-slate-300">{exp.approvedBy}</td>
                      <td className="p-3 text-slate-400">{exp.description}</td>
                      <td className="p-3 text-right font-mono font-bold text-rose-400">
                        UGX {exp.amountUgx.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : selectedReportType === 'STOCK_BALANCE' ? (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3">SKU</th>
                    <th className="p-3">Store</th>
                    <th className="p-3 text-right">In Stock</th>
                    <th className="p-3 text-right">Selling Price</th>
                    <th className="p-3 text-right">Valuation (UGX)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {stockGridRows.map((r, i) => (
                    <tr key={i}>
                      <td className="p-3 font-bold text-slate-200">{r.productName}</td>
                      <td className="p-3 font-mono text-cyan-400">{r.sku}</td>
                      <td className="p-3 text-slate-300">{r.storeName}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-100">{r.quantity}</td>
                      <td className="p-3 text-right font-mono text-slate-400">UGX {r.sellingPriceUgx.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-400">UGX {r.valuationCostUgx.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">Receipt / Ref</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Products</th>
                    <th className="p-3 text-right">Amount (UGX)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredSales.map((s) => (
                    <tr key={s.id}>
                      <td className="p-3 font-mono font-bold text-cyan-400">{s.receiptNumber}</td>
                      <td className="p-3 text-slate-400">{s.date}</td>
                      <td className="p-3 font-bold text-slate-200">{s.customerName || 'Walk-in'}</td>
                      <td className="p-3 text-slate-300">
                        {s.items.map((it) => `${it.quantity}x ${it.name}`).join(', ') || 'Water Product'}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-cyan-400">
                        UGX {s.totalAmountUgx.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      )}

      {/* POP-UP MODAL 1: EXPENSE FULL DESCRIPTION */}
      {selectedExpenseForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-rose-500/50 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-rose-950/40">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-950/80 text-rose-400 rounded-xl border border-rose-500/30">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Expense Details & Voucher Summary
                  </h3>
                  <div className="text-xs font-mono text-rose-400">
                    {selectedExpenseForModal.voucherNumber} • {selectedExpenseForModal.category}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedExpenseForModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 text-xs">
              
              {/* Full Description Box */}
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Complete Expense Description
                </label>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-slate-200 leading-relaxed break-words whitespace-pre-wrap font-medium select-text">
                  {selectedExpenseForModal.description || 'No detailed description was recorded for this voucher.'}
                </div>
              </div>

              {/* Financial & Authority Details Grid */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Approved / Spent By:</span>
                  <span className="font-bold text-slate-100 flex items-center gap-1 mt-0.5">
                    <User className="w-3.5 h-3.5 text-rose-400" />
                    <span>{selectedExpenseForModal.approvedBy || 'Manager'}</span>
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Amount (UGX):</span>
                  <span className="font-mono font-extrabold text-rose-400 text-sm mt-0.5 block">
                    UGX {selectedExpenseForModal.amountUgx.toLocaleString()}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Time & Date Recorded:</span>
                  <span className="text-slate-300 font-semibold mt-0.5 block">
                    {formatDateTime(selectedExpenseForModal.createdAt, selectedExpenseForModal.date).display}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Payment Method:</span>
                  <span className="font-bold text-slate-200 mt-0.5 block">
                    {selectedExpenseForModal.paymentMethod || 'CASH'}
                  </span>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => handleCopy(selectedExpenseForModal.description)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedText ? 'Copied Description' : 'Copy Description'}</span>
              </button>

              <button
                onClick={() => setSelectedExpenseForModal(null)}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* POP-UP MODAL 2: DEBT REASON & INFORMATION */}
      {selectedDebtForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-amber-500/50 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-amber-950/40">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-950/80 text-amber-400 rounded-xl border border-amber-500/30">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Debt Information & Reason
                  </h3>
                  <div className="text-xs font-mono text-amber-400">
                    {selectedDebtForModal.debtorName} • {selectedDebtForModal.source}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedDebtForModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 text-xs">
              
              {/* Full Reason Box */}
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Debt Reason / Shortage Notes
                </label>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-slate-200 leading-relaxed break-words whitespace-pre-wrap font-medium select-text">
                  {selectedDebtForModal.reason || 'No detailed notes recorded for this debt record.'}
                </div>
              </div>

              {/* Debt Balances Grid */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="text-center p-1.5">
                  <div className="text-[10px] uppercase text-slate-400 font-bold">Original Debt</div>
                  <div className="font-mono font-bold text-slate-200 mt-1">
                    UGX {selectedDebtForModal.originalAmountUgx.toLocaleString()}
                  </div>
                </div>

                <div className="text-center p-1.5 border-x border-slate-800">
                  <div className="text-[10px] uppercase text-slate-400 font-bold">Amount Paid</div>
                  <div className="font-mono font-bold text-emerald-400 mt-1">
                    UGX {selectedDebtForModal.paidAmountUgx.toLocaleString()}
                  </div>
                </div>

                <div className="text-center p-1.5">
                  <div className="text-[10px] uppercase text-slate-400 font-bold">Balance Due</div>
                  <div className="font-mono font-extrabold text-amber-400 mt-1">
                    UGX {selectedDebtForModal.balanceAmountUgx.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Authority & Timing */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Recorded / Approved By:</span>
                  <span className="font-bold text-slate-100 flex items-center gap-1 mt-0.5">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>{selectedDebtForModal.approvedBy || 'Branch Manager'}</span>
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Status:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider w-fit inline-block mt-0.5 ${
                    selectedDebtForModal.status === 'CLEARED'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}>
                    {selectedDebtForModal.status}
                  </span>
                </div>

                <div className="col-span-2">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Time & Date Recorded:</span>
                  <span className="text-slate-300 font-semibold mt-0.5 block">
                    {formatDateTime(selectedDebtForModal.createdAt, selectedDebtForModal.date).display}
                  </span>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => handleCopy(selectedDebtForModal.reason || '')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedText ? 'Copied Reason' : 'Copy Reason'}</span>
              </button>

              <button
                onClick={() => setSelectedDebtForModal(null)}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* POP-UP MODAL 3: SALE PRODUCTS & RECEIPT BREAKDOWN */}
      {selectedSaleForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl shadow-cyan-950/40">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-cyan-950/80 text-cyan-400 rounded-xl border border-cyan-500/30">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Sale Receipt & Products Bought
                  </h3>
                  <div className="text-xs font-mono text-cyan-400">
                    {selectedSaleForModal.receiptNumber} • {stores.find((st) => st.id === selectedSaleForModal.storeId)?.name || 'Store'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedSaleForModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 text-xs">
              
              {/* Sale Timing & Customer Header */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Customer:</span>
                  <span className="font-bold text-slate-100 block mt-0.5">
                    {selectedSaleForModal.customerName || 'Walk-in Customer'}
                  </span>
                  {selectedSaleForModal.customerPhone && (
                    <span className="text-[10px] text-slate-400 block">{selectedSaleForModal.customerPhone}</span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Exact Time & Date:</span>
                  <span className="font-semibold text-cyan-300 block mt-0.5">
                    {formatDateTime(selectedSaleForModal.createdAt, selectedSaleForModal.date).display}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Payment Method:</span>
                  <span className="font-bold text-slate-200 block mt-0.5">
                    {selectedSaleForModal.paymentMethod}
                  </span>
                </div>
              </div>

              {/* Itemized Products Bought Table */}
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Products Bought ({selectedSaleForModal.items?.length || 0} item lines)
                </label>
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">Product Name</th>
                        <th className="p-2.5 text-center">Qty</th>
                        <th className="p-2.5 text-right">Unit Price</th>
                        <th className="p-2.5 text-right">Subtotal (UGX)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {selectedSaleForModal.items && selectedSaleForModal.items.length > 0 ? (
                        selectedSaleForModal.items.map((it, idx) => (
                          <tr key={idx} className="hover:bg-slate-950/40">
                            <td className="p-2.5 font-bold text-slate-200">{it.name}</td>
                            <td className="p-2.5 text-center font-mono font-extrabold text-cyan-400">{it.quantity}</td>
                            <td className="p-2.5 text-right font-mono text-slate-400">UGX {it.unitPriceUgx.toLocaleString()}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-100">
                              UGX {(it.quantity * it.unitPriceUgx).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-slate-500 italic">
                            Water Products Sale
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Totals */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Gross Subtotal:</span>
                  <span className="font-mono">UGX {selectedSaleForModal.subtotalUgx.toLocaleString()}</span>
                </div>
                {selectedSaleForModal.overallDiscountUgx > 0 && (
                  <div className="flex justify-between text-rose-400">
                    <span>Discount Applied:</span>
                    <span className="font-mono">- UGX {selectedSaleForModal.overallDiscountUgx.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-extrabold text-cyan-400 pt-1 border-t border-slate-800">
                  <span>Total Amount Due:</span>
                  <span className="font-mono">UGX {selectedSaleForModal.totalAmountUgx.toLocaleString()}</span>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-slate-950/60 border-t border-slate-800 flex items-center justify-end">
              <button
                onClick={() => setSelectedSaleForModal(null)}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md"
              >
                Close Receipt
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
