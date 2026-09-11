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
    { id: 'PROFITABILITY', title: 'Profit & Loss Statement (After Expenses & Debts)' },
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/15/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7 text-white shrink-0" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Business Reports & Analytics
            </h1>
          </div>
          <p className="text-xs text-white/70 mt-1">
            Real-time multi-store operations tracking, sales audit service, expense vouchers, debt recovery, and stock grid.
          </p>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#0F1B3E]/90 p-1.5 rounded-2xl border border-white/15">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'dashboard'
                ? 'bg-white/20 text-white border border-white/40 shadow-md font-black'
                : 'text-white/70 hover:text-white hover:bg-[#182855]/50'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Executive Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('sales_service')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sales_service'
                ? 'bg-white/20 text-white border border-white/40 shadow-md font-black'
                : 'text-white/70 hover:text-white hover:bg-[#182855]/50'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-white" />
            <span>Sales Service</span>
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'expenses'
                ? 'bg-white/20 text-white border border-white/40 shadow-md font-black'
                : 'text-white/70 hover:text-white hover:bg-[#182855]/50'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5 text-white" />
            <span>Expenses</span>
          </button>

          <button
            onClick={() => setActiveTab('debts')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'debts'
                ? 'bg-white/20 text-white border border-white/40 shadow-md font-black'
                : 'text-white/70 hover:text-white hover:bg-[#182855]/50'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-white" />
            <span>Debts</span>
          </button>

          <button
            onClick={() => setActiveTab('stock_grid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'stock_grid'
                ? 'bg-white/20 text-white border border-white/40 shadow-md font-black'
                : 'text-white/70 hover:text-white hover:bg-[#182855]/50'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-white" />
            <span>Stock Grid</span>
          </button>

          <button
            onClick={() => setActiveTab('digital_collections')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'digital_collections'
                ? 'bg-white/20 text-white border border-white/40 shadow-md font-black'
                : 'text-white/70 hover:text-white hover:bg-[#182855]/50'
            }`}
          >
            <Wallet className="w-3.5 h-3.5 text-white" />
            <span>Digital Collections</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'reports'
                ? 'bg-white/20 text-white border border-white/40 shadow-md font-black'
                : 'text-white/70 hover:text-white hover:bg-[#182855]/50'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Reports Center</span>
          </button>
        </div>
      </div>

      {/* Global Store Switcher Bar */}
      <div className="bg-[#0F1B3E]/80 border border-white/15 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-inner">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white/10 border border-white/20 rounded-lg text-white">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/70 font-extrabold">Active Store Filter</div>
            <div className="text-xs font-bold text-white">
              {selectedStoreId === 'ALL' ? 'Consolidated All Stores' : stores.find((s) => s.id === selectedStoreId)?.name || 'Selected Store'}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-white/70 font-medium">Switch Store:</span>
          <select
            value={selectedStoreId}
            onChange={(e) => setSelectedStoreId(e.target.value)}
            className="bg-[#070E24] border border-white/20 hover:border-white/30 rounded-xl px-3 py-1.5 text-xs text-white font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
          >
            <option value="ALL">🏢 All Stores (Consolidated View)</option>
            {activeBranchStores.map((st) => (
              <option key={st.id} value={st.id}>
                🏬 {st.name} ({st.code})
              </option>
            ))}
          </select>

          {/* Quick Date Scope Selector */}
          <div className="flex items-center gap-1.5 bg-[#070E24] border border-white/15 rounded-xl px-2.5 py-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-white/70" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-white text-xs focus:outline-none"
            />
            <span className="text-white/60">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-white text-xs focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* TAB 1: EXECUTIVE DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Financial Overview & Real-Time Performance</span>
              <span className="text-[11px] font-normal text-white/60">(Click any card to open its detailed operations view)</span>
            </h2>
          </div>

          {/* Primary 4 Metric Cards (Clickable) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            
            {/* Card 1: Total Sales */}
            <div
              onClick={() => setActiveTab('sales_service')}
              className="rounded-3xl p-6 border border-white/15 bg-[#0F1B3E] hover:border-white/40 hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group active:scale-[0.99] flex flex-col justify-between min-h-[175px]"
              title="Click to view Sales Operations Service"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-white/80 tracking-wide">
                  Total Sales (Gross Revenue)
                </span>
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-md group-hover:bg-white/20 transition-all">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className="my-2">
                <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
                  UGX {totalSalesUgx.toLocaleString()}
                </div>
              </div>

              <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
                <span>Today: UGX {todaysSalesUgx.toLocaleString()}</span>
                <span className="font-bold text-white group-hover:underline flex items-center gap-1">
                  <span>{filteredSales.length} Orders</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Card 2: Total Expenses */}
            <div
              onClick={() => setActiveTab('expenses')}
              className="rounded-3xl p-6 border border-white/15 bg-[#0F1B3E] hover:border-white/40 hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group active:scale-[0.99] flex flex-col justify-between min-h-[175px]"
              title="Click to view Expense Records & Descriptions"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-white/80 tracking-wide">
                  Total Expenses
                </span>
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-md group-hover:bg-white/20 transition-all">
                  <TrendingDown className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className="my-2">
                <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
                  UGX {expensesUgx.toLocaleString()}
                </div>
              </div>

              <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
                <span>{filteredExpenses.length} Expenses Logged</span>
                <span className="font-bold text-white group-hover:underline flex items-center gap-1">
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Card 3: Outstanding Debts */}
            <div
              onClick={() => setActiveTab('debts')}
              className="rounded-3xl p-6 border border-white/15 bg-[#0F1B3E] hover:border-white/40 hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group active:scale-[0.99] flex flex-col justify-between min-h-[175px]"
              title="Click to view Debt Records & Recovery"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-white/80 tracking-wide">
                  Outstanding Debts
                </span>
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-md group-hover:bg-white/20 transition-all">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className="my-2">
                <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
                  UGX {outstandingDebtsUgx.toLocaleString()}
                </div>
              </div>

              <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
                <span>Credit Balances</span>
                <span className="font-bold text-white group-hover:underline flex items-center gap-1">
                  <span>Debts List</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Card 4: Net Profit Realized */}
            <div
              onClick={() => setActiveTab('profitability')}
              className="rounded-3xl p-6 border border-white/15 bg-[#0F1B3E] hover:border-white/40 hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group active:scale-[0.99] flex flex-col justify-between min-h-[175px]"
              title="Click to view Profit & Loss Statement"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-white/80 tracking-wide">
                  Net Profit (After Exp. & Debts)
                </span>
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-md group-hover:bg-white/20 transition-all">
                  <PieChart className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className="my-2">
                <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
                  UGX {netProfitUgx.toLocaleString()}
                </div>
              </div>

              <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
                <span>Margin: <span className="text-white font-bold">{profitMarginPercent}%</span></span>
                <span className="font-bold text-white group-hover:underline flex items-center gap-1">
                  <span>P&L Statement</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

          </div>

          {/* Secondary 3 Operational Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            
            {/* Card 5: Current Stock Levels */}
            <div
              onClick={() => setActiveTab('stock_grid')}
              className="rounded-3xl p-6 border border-white/15 bg-[#0F1B3E] hover:border-white/40 hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group active:scale-[0.99] flex flex-col justify-between min-h-[160px]"
              title="Click to view Current Stock in Grid View"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-white/80 tracking-wide">
                  Current Stock Levels
                </span>
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-md group-hover:bg-white/20 transition-all">
                  <Package className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className="my-2">
                <div className="text-2xl font-extrabold text-white font-mono">
                  {currentStockCartons.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-white/60">Cartons / Units</span>
                </div>
              </div>

              <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
                <span>{lowStockCount > 0 ? `${lowStockCount} Low Stock Alert(s)` : 'Healthy Inventory ✓'}</span>
                <span className="font-bold text-white group-hover:underline flex items-center gap-1">
                  <span>Stock Grid</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Card 6: Digital Collections */}
            <div
              onClick={() => setActiveTab('digital_collections')}
              className="rounded-3xl p-6 border border-white/15 bg-[#0F1B3E] hover:border-white/40 hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group active:scale-[0.99] flex flex-col justify-between min-h-[160px]"
              title="Click to view Mobile Money & Bank Collections"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-white/80 tracking-wide">
                  Digital Collections
                </span>
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-md group-hover:bg-white/20 transition-all">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className="my-2">
                <div className="text-2xl font-extrabold text-white font-mono">
                  UGX {(mobileMoneyUgx + bankedMoneyUgx).toLocaleString()}
                </div>
              </div>

              <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
                <span>MoMo: UGX {mobileMoneyUgx.toLocaleString()} • Bank: UGX {bankedMoneyUgx.toLocaleString()}</span>
                <span className="font-bold text-white group-hover:underline flex items-center gap-1">
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Card 7: Sync & Cloud Status */}
            <div
              onClick={() => {
                setSelectedReportType('AUDIT_LOG');
                setActiveTab('reports');
              }}
              className="rounded-3xl p-6 border border-white/15 bg-[#0F1B3E] hover:border-white/40 hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group active:scale-[0.99] flex flex-col justify-between min-h-[160px]"
              title="Click to view Audit Log & Backup Status"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-white/80 tracking-wide">
                  Cloud Sync & Database
                </span>
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-md group-hover:bg-white/20 transition-all">
                  <Database className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className="my-2">
                <div className="text-xl font-extrabold text-white truncate font-mono">
                  {isOnline ? 'Online (Postgres Cloud)' : 'Offline (Local SQLite)'}
                </div>
              </div>

              <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
                <span>{pendingSyncCount} Pending Sync Items</span>
                <span className="font-bold text-white group-hover:underline flex items-center gap-1">
                  <span>Audit Trail</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

          </div>

          {/* Branch Performance Summary */}
          <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/15 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-white" />
                <span>Branch Stock & Store Breakdown</span>
              </h3>
              <span className="text-xs text-white/70">{branches.length} Registered Branches</span>
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
                    className="bg-[#070E24] border border-white/15 hover:border-white/20 rounded-xl p-3.5 flex justify-between items-center cursor-pointer transition-all hover:bg-[#0F1B3E]/50"
                  >
                    <div>
                      <div className="font-bold text-white text-sm flex items-center gap-1.5">
                        <span>{b.name}</span>
                        <span className="text-[10px] text-white bg-white/10 px-1.5 py-0.5 rounded border border-white/15 font-mono">{b.code}</span>
                      </div>
                      <div className="text-white/70 text-[11px] mt-0.5">{b.location} • {branchStores.length} Active Store(s)</div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-white text-sm font-mono">{branchStock.toLocaleString()} Units</div>
                      <div className="text-white text-[10px] font-semibold">Click for Stock Grid →</div>
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
        <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-white/15 space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/15 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="p-1.5 rounded-lg bg-[#0F1B3E] hover:bg-[#182855] text-white/70 hover:text-white transition-colors cursor-pointer"
                  title="Back to Overview"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-white" />
                  <span>Sales Operations Service</span>
                </h2>
              </div>
              <p className="text-xs text-white/70 mt-1">
                Real-time tracking of every operation performed in the system: time, date, products bought, customer name, and store switcher.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {onSelectNav && (
                <button
                  onClick={() => onSelectNav({ domain: 'operations', subView: 'pos' })}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/25 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Open Store POS</span>
                </button>
              )}
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-white/20 text-white border border-white/40 font-black hover:bg-white/25 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Sales CSV</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar for Sales */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#070E24] p-3 rounded-xl border border-white/15">
            <div className="p-2">
              <div className="text-[10px] uppercase font-bold text-white/70">Total Sales Revenue</div>
              <div className="text-base font-extrabold text-white font-mono">UGX {totalSalesUgx.toLocaleString()}</div>
            </div>
            <div className="p-2">
              <div className="text-[10px] uppercase font-bold text-white/70">Completed Orders</div>
              <div className="text-base font-extrabold text-white font-mono">{filteredSales.length} Transactions</div>
            </div>
            <div className="p-2">
              <div className="text-[10px] uppercase font-bold text-white/70">Digital Receipts</div>
              <div className="text-base font-extrabold text-white font-mono">
                {filteredSales.filter((s) => s.paymentMethod !== 'CASH').length} Digital Payments
              </div>
            </div>
            <div className="p-2">
              <div className="text-[10px] uppercase font-bold text-white/70">Avg Order Value</div>
              <div className="text-base font-extrabold text-white font-mono">
                UGX {filteredSales.length > 0 ? Math.round(totalSalesUgx / filteredSales.length).toLocaleString() : 0}
              </div>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-white/70 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search sales by customer name, receipt #, phone, or product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#070E24] border border-white/15 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/30"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="bg-[#070E24] border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white/30 cursor-pointer"
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
          <div className="overflow-x-auto rounded-xl border border-white/15">
            <table className="w-full text-left text-xs text-white">
              <thead className="bg-[#070E24] text-white/70 font-bold uppercase border-b border-white/15">
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
                    <tr key={s.id} className="hover:bg-[#0F1B3E]/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-white">
                        {s.receiptNumber}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-white font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-white/70 shrink-0" />
                          <span>{timeInfo.date}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-white/70 mt-0.5">
                          <Clock className="w-3 h-3 text-white shrink-0" />
                          <span>{timeInfo.time}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-white">{storeObj ? storeObj.name : s.storeId}</div>
                        <div className="text-[10px] text-white/70">{storeObj ? storeObj.code : ''}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-white" />
                          <span>{s.customerName || 'Walk-in Customer'}</span>
                        </div>
                        {s.customerPhone && (
                          <div className="text-[10px] text-white/70 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            <span>{s.customerPhone}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3 max-w-[280px]">
                        {s.items && s.items.length > 0 ? (
                          <div className="space-y-1">
                            {s.items.slice(0, 2).map((it, idx) => (
                              <div key={idx} className="text-white text-[11px] truncate flex items-center justify-between">
                                <span><span className="font-bold text-white">{it.quantity}x</span> {it.name}</span>
                                <span className="text-white/70 font-mono text-[10px]">UGX {(it.quantity * it.unitPriceUgx).toLocaleString()}</span>
                              </div>
                            ))}
                            {s.items.length > 2 && (
                              <button
                                onClick={() => setSelectedSaleForModal(s)}
                                className="text-[10px] text-white font-bold hover:underline cursor-pointer flex items-center gap-1"
                              >
                                +{s.items.length - 2} more product(s) (Click to view)
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-white/60 italic text-[11px]">Water Products Sale</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          s.paymentMethod === 'CASH'
                            ? 'bg-[#182855] text-white'
                            : s.paymentMethod === 'MOBILE_MONEY'
                            ? 'bg-white/10 text-white/90 border border-white/20'
                            : 'bg-white/10 text-white/90 border border-white/20'
                        }`}>
                          {s.paymentMethod}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-extrabold text-white text-sm">
                        UGX {s.totalAmountUgx.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setSelectedSaleForModal(s)}
                          className="p-1.5 bg-[#182855] hover:bg-white/25 text-white font-black hover:text-white rounded-lg text-white transition-colors cursor-pointer"
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
                    <td colSpan={8} className="p-8 text-center text-white/60">
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
        <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-white/15 space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/15 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="p-1.5 rounded-lg bg-[#0F1B3E] hover:bg-[#182855] text-white/70 hover:text-white transition-colors cursor-pointer"
                  title="Back to Overview"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-white" />
                  <span>Expenses Records & Voucher Ledger</span>
                </h2>
              </div>
              <p className="text-xs text-white/70 mt-1">
                Records of operational expenses, who approved/spent the money, time recorded, and clickable description cells with instant pop-up modals.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {onSelectNav && (
                <button
                  onClick={() => onSelectNav({ domain: 'operations', subView: 'expenses' })}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/25 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Open Expense Manager</span>
                </button>
              )}
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-white/20 text-white border border-white/40 font-black hover:bg-white/25 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Expenses CSV</span>
              </button>
            </div>
          </div>

          {/* Quick Expense Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#070E24] p-3 rounded-xl border border-white/15">
            <div className="p-2">
              <div className="text-[10px] uppercase font-bold text-white/70">Total Spent</div>
              <div className="text-base font-extrabold text-white font-mono">UGX {expensesUgx.toLocaleString()}</div>
            </div>
            <div className="p-2">
              <div className="text-[10px] uppercase font-bold text-white/70">Total Vouchers</div>
              <div className="text-base font-extrabold text-white font-mono">{filteredExpenses.length} Records</div>
            </div>
            <div className="p-2">
              <div className="text-[10px] uppercase font-bold text-white/70">Scope Scope</div>
              <div className="text-xs font-bold text-white truncate">
                {selectedStoreId === 'ALL' ? 'All Stores' : stores.find((s) => s.id === selectedStoreId)?.name || 'Filtered'}
              </div>
            </div>
            <div className="p-2">
              <div className="text-[10px] uppercase font-bold text-white/70">Interactive Feature</div>
              <div className="text-xs font-bold text-white/90">Click Description Cell for Pop-up Modal ✓</div>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-white/70 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search expenses by voucher #, keyword, description, or approver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#070E24] border border-white/15 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/30"
            />
          </div>

          {/* Expenses Table with Clickable Description Cell */}
          <div className="overflow-x-auto rounded-xl border border-white/15">
            <table className="w-full text-left text-xs text-white">
              <thead className="bg-[#070E24] text-white/70 font-bold uppercase border-b border-white/15">
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
                    <tr key={exp.id} className="hover:bg-[#0F1B3E]/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-white whitespace-nowrap">
                        {exp.voucherNumber}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-white font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-white/70 shrink-0" />
                          <span>{timeInfo.date}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-white/70 mt-0.5">
                          <Clock className="w-3 h-3 text-white shrink-0" />
                          <span>{timeInfo.time}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-white" />
                          <span>{exp.approvedBy || 'Manager'}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-[#182855] text-white rounded font-semibold text-[11px]">
                          {exp.category}
                        </span>
                      </td>
                      
                      {/* CLICKABLE DESCRIPTION CELL WITH POPUP MODAL */}
                      <td className="p-3 max-w-xs">
                        <div
                          onClick={() => setSelectedExpenseForModal(exp)}
                          className="bg-[#070E24]/80 hover:bg-[#182855]/90 border border-white/15 hover:border-white/20 p-2 rounded-xl cursor-pointer transition-all group flex items-start justify-between gap-2"
                          title="Click to open full description pop-up modal"
                        >
                          <span className="text-white text-xs truncate">
                            {exp.description || 'No detailed description provided.'}
                          </span>
                          <span className="shrink-0 p-1 bg-white/10 text-white rounded-md border border-white/20 group-hover:scale-110 transition-transform">
                            <Eye className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <span className="text-[11px] text-white/70 font-medium">
                          {exp.paymentMethod || 'CASH'}
                        </span>
                      </td>

                      <td className="p-3 text-right font-mono font-extrabold text-white text-sm whitespace-nowrap">
                        UGX {exp.amountUgx.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}

                {filteredExpenses.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-white/60">
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
        <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-white/15 space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/15 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="p-1.5 rounded-lg bg-[#0F1B3E] hover:bg-[#182855] text-white/70 hover:text-white transition-colors cursor-pointer"
                  title="Back to Overview"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-white" />
                  <span>Debts & Credit Recovery Records</span>
                </h2>
              </div>
              <p className="text-xs text-white/70 mt-1">
                Outstanding customer & worker debts, who approved the credit, date/time recorded, and clickable reason cells with pop-up modal.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {onSelectNav && (
                <button
                  onClick={() => onSelectNav({ domain: 'finance', subView: 'debts' })}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/25 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Open Debts Manager</span>
                </button>
              )}
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-white/20 text-white border border-white/40 font-black hover:bg-white/25 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Debts CSV</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#070E24] p-3 rounded-xl border border-white/15">
            <div className="p-2">
              <div className="text-[10px] uppercase font-bold text-white/70">Total Outstanding Balance</div>
              <div className="text-base font-extrabold text-white font-mono">UGX {outstandingDebtsUgx.toLocaleString()}</div>
            </div>
            <div className="p-2">
              <div className="text-[10px] uppercase font-bold text-white/70">Total Uncollected Count</div>
              <div className="text-base font-extrabold text-white font-mono">
                {debtsList.filter((d) => d.status !== 'CLEARED').length} Accounts
              </div>
            </div>
            <div className="p-2">
              <div className="text-[10px] uppercase font-bold text-white/70">Recovered to Date</div>
              <div className="text-base font-extrabold text-white font-mono">
                UGX {debtsList.reduce((sum, d) => sum + d.paidAmountUgx, 0).toLocaleString()}
              </div>
            </div>
            <div className="p-2">
              <div className="text-[10px] uppercase font-bold text-white/70">Interactive Feature</div>
              <div className="text-xs font-bold text-white/90">Click Reason Cell for Pop-up Modal ✓</div>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-white/70 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search debts by debtor name, source, or reason notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#070E24] border border-white/15 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/30"
            />
          </div>

          {/* Debts Table with Clickable Reason Cell */}
          <div className="overflow-x-auto rounded-xl border border-white/15">
            <table className="w-full text-left text-xs text-white">
              <thead className="bg-[#070E24] text-white/70 font-bold uppercase border-b border-white/15">
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
                    <tr key={d.id} className="hover:bg-[#0F1B3E]/40 transition-colors">
                      <td className="p-3 font-bold text-white flex items-center gap-1.5 whitespace-nowrap">
                        <User className="w-3.5 h-3.5 text-white" />
                        <span>{d.debtorName}</span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-white font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-white/70 shrink-0" />
                          <span>{timeInfo.date}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-white/70 mt-0.5">
                          <Clock className="w-3 h-3 text-white shrink-0" />
                          <span>{timeInfo.time}</span>
                        </div>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-[#182855] text-white rounded font-semibold text-[11px]">
                          {d.source}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap text-white">
                        {d.approvedBy || 'Branch Manager'}
                      </td>

                      {/* CLICKABLE REASON CELL WITH POPUP MODAL */}
                      <td className="p-3 max-w-xs">
                        <div
                          onClick={() => setSelectedDebtForModal(d)}
                          className="bg-[#070E24]/80 hover:bg-[#182855]/90 border border-white/15 hover:border-white/20 p-2 rounded-xl cursor-pointer transition-all group flex items-start justify-between gap-2"
                          title="Click to open full debt reason pop-up modal"
                        >
                          <span className="text-white text-xs truncate">
                            {d.reason || 'No detailed notes recorded.'}
                          </span>
                          <span className="shrink-0 p-1 bg-white/10 text-white rounded-md border border-white/20 group-hover:scale-110 transition-transform">
                            <Eye className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          d.status === 'CLEARED'
                            ? 'bg-white/10 text-white border border-white/20'
                            : d.status === 'PARTIALLY_PAID'
                            ? 'bg-white/10 text-white border border-white/20'
                            : 'bg-white/10 text-white border border-white/20'
                        }`}>
                          {d.status}
                        </span>
                      </td>

                      <td className="p-3 text-right font-mono text-white/70 whitespace-nowrap">
                        UGX {d.originalAmountUgx.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono text-white whitespace-nowrap">
                        UGX {d.paidAmountUgx.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono font-extrabold text-white text-sm whitespace-nowrap">
                        UGX {d.balanceAmountUgx.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}

                {filteredDebts.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-white/60">
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
        <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-white/15 space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/15 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="p-1.5 rounded-lg bg-[#0F1B3E] hover:bg-[#182855] text-white/70 hover:text-white transition-colors cursor-pointer"
                  title="Back to Overview"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-white" />
                  <span>Current Stock Levels (Grid View: Rows & Columns)</span>
                </h2>
              </div>
              <p className="text-xs text-white/70 mt-1">
                Real-time store inventory matrix showing physical units, min alert triggers, cost/retail valuations, and stock health status.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {onSelectNav && (
                <button
                  onClick={() => onSelectNav({ domain: 'inventory', subView: 'stock' })}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/25 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Stock Management</span>
                </button>
              )}
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-white/20 text-white border border-white/40 font-black hover:bg-white/25 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Stock CSV</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics for Stock */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#070E24] p-3 rounded-xl border border-white/15">
            <div className="p-2">
              <div className="text-[10px] uppercase font-bold text-white/70">Total Physical Units</div>
              <div className="text-base font-extrabold text-white font-mono">{currentStockCartons.toLocaleString()} Units</div>
            </div>
            <div className="p-2">
              <div className="text-[10px] uppercase font-bold text-white/70">Total Inventory Valuation (Cost)</div>
              <div className="text-base font-extrabold text-white font-mono">UGX {totalStockValuationCost.toLocaleString()}</div>
            </div>
            <div className="p-2">
              <div className="text-[10px] uppercase font-bold text-white/70">Low Stock Triggers</div>
              <div className="text-base font-extrabold text-white font-mono">{lowStockCount} Items</div>
            </div>
            <div className="p-2">
              <div className="text-[10px] uppercase font-bold text-white/70">Stock Outages</div>
              <div className="text-base font-extrabold text-white font-mono">
                {stockGridRows.filter((r) => r.quantity <= 0).length} Items
              </div>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-white/70 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by product name, SKU, or store..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#070E24] border border-white/15 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/30"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setLowStockOnly(!lowStockOnly)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  lowStockOnly
                    ? 'bg-white/10 border-white/30 text-white/90'
                    : 'bg-[#070E24] border-white/15 text-white/70 hover:text-white'
                }`}
              >
                {lowStockOnly ? 'Showing Low Stock Only ✓' : 'Filter Low Stock Only'}
              </button>
            </div>
          </div>

          {/* Grid View Table: Rows and Columns */}
          <div className="overflow-x-auto rounded-xl border border-white/15 shadow-xl">
            <table className="w-full text-left text-xs text-white">
              <thead className="bg-[#070E24] text-white/70 font-bold uppercase border-b border-white/15">
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
                  <tr key={`${row.storeId}-${row.productId}-${idx}`} className="hover:bg-[#0F1B3E]/50 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-white">{row.productName}</div>
                      <div className="text-[10px] text-white/70">{row.packaging}</div>
                    </td>
                    <td className="p-3 font-mono text-white font-semibold">{row.sku}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-[#182855] text-white rounded text-[10px] font-semibold">
                        {row.category}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-white">{row.storeName}</div>
                      <div className="text-[10px] text-white/70">{row.branchName}</div>
                    </td>
                    <td className="p-3 text-right font-mono font-extrabold text-white text-sm">
                      {row.quantity.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono text-white/70">
                      {row.minStockAlert}
                    </td>
                    <td className="p-3 text-right font-mono text-white/70">
                      UGX {row.costPriceUgx.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono text-white/90">
                      UGX {row.sellingPriceUgx.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-white">
                      UGX {row.valuationCostUgx.toLocaleString()}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider ${
                        row.status === 'IN_STOCK'
                          ? 'bg-white/10 text-white border border-white/20'
                          : row.status === 'LOW_STOCK'
                          ? 'bg-white/10 text-white border border-white/20 animate-pulse'
                          : 'bg-white/10 text-white border border-white/20'
                      }`}>
                        {row.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}

                {stockGridRows.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-white/60">
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
        <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-white/15 space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/15 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="p-1.5 rounded-lg bg-[#0F1B3E] hover:bg-[#182855] text-white/70 hover:text-white transition-colors cursor-pointer"
                  title="Back to Overview"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-white" />
                  <span>Digital Collections (Mobile Money & Bank Transfers)</span>
                </h2>
              </div>
              <p className="text-xs text-white/70 mt-1">
                Records of all cashless digital transactions: who processed the transaction, the customer, when it was done, and at what exact time.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {onSelectNav && (
                <button
                  onClick={() => onSelectNav({ domain: 'finance', subView: 'bank_mobile' })}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/25 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Landmark className="w-3.5 h-3.5" />
                  <span>Bank & Cash Accounts</span>
                </button>
              )}
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-white/20 text-white border border-white/40 font-black hover:bg-white/25 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Digital CSV</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#070E24] p-3 rounded-xl border border-white/15">
            <div className="p-2">
              <div className="text-[10px] uppercase font-bold text-white/70">Total Digital Collections</div>
              <div className="text-base font-extrabold text-white font-mono">
                UGX {(mobileMoneyUgx + bankedMoneyUgx).toLocaleString()}
              </div>
            </div>
            <div className="p-2">
              <div className="text-[10px] uppercase font-bold text-white/70">Mobile Money (MTN / Airtel)</div>
              <div className="text-base font-extrabold text-white/90 font-mono">
                UGX {mobileMoneyUgx.toLocaleString()}
              </div>
            </div>
            <div className="p-2">
              <div className="text-[10px] uppercase font-bold text-white/70">Bank Deposits & EFT</div>
              <div className="text-base font-extrabold text-white font-mono">
                UGX {bankedMoneyUgx.toLocaleString()}
              </div>
            </div>
            <div className="p-2">
              <div className="text-[10px] uppercase font-bold text-white/70">Total Digital Transactions</div>
              <div className="text-base font-extrabold text-white font-mono">
                {digitalCollections.length} Processed
              </div>
            </div>
          </div>

          {/* Digital Collections Table */}
          <div className="overflow-x-auto rounded-xl border border-white/15">
            <table className="w-full text-left text-xs text-white">
              <thead className="bg-[#070E24] text-white/70 font-bold uppercase border-b border-white/15">
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
                    <tr key={s.id} className="hover:bg-[#0F1B3E]/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-white whitespace-nowrap">
                        {s.receiptNumber}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1.5 w-fit ${
                          s.paymentMethod === 'MOBILE_MONEY'
                            ? 'bg-white/10 text-white/90 border border-white/20'
                            : 'bg-white/10 text-white/90 border border-white/20'
                        }`}>
                          {s.paymentMethod === 'MOBILE_MONEY' ? <Smartphone className="w-3.5 h-3.5" /> : <Landmark className="w-3.5 h-3.5" />}
                          <span>{s.paymentMethod}</span>
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-white" />
                          <span>{s.customerName || 'Walk-in Customer'}</span>
                        </div>
                        {s.customerPhone && (
                          <div className="text-[10px] text-white/70 mt-0.5">{s.customerPhone}</div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-white flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-white" />
                          <span>{s.cashierId ? `Cashier (${s.cashierId.slice(-6)})` : 'Store Operator'}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-white">{storeObj ? storeObj.name : s.storeId}</div>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-white font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-white/70 shrink-0" />
                          <span>{timeInfo.date}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-white/90 mt-0.5 font-mono">
                          <Clock className="w-3 h-3 text-white shrink-0" />
                          <span>{timeInfo.time}</span>
                        </div>
                      </td>
                      <td className="p-3 max-w-xs truncate text-white">
                        {s.items.map((it) => `${it.quantity}x ${it.name}`).join(', ') || 'Sale Items'}
                      </td>
                      <td className="p-3 text-right font-mono font-extrabold text-white/90 text-sm whitespace-nowrap">
                        UGX {s.totalAmountUgx.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}

                {digitalCollections.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-white/60">
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
        <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-white/15 space-y-4">
          
          <div className="flex items-center justify-between border-b border-white/15 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="p-1.5 rounded-lg bg-[#0F1B3E] hover:bg-[#182855] text-white/70 hover:text-white transition-colors cursor-pointer"
                title="Back to Overview"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <PieChart className="w-5 h-5 text-white" />
                <span>Net Realized Profit Statement (After Expenses & Debts)</span>
              </h2>
            </div>
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-white/20 text-white border border-white/40 font-black hover:bg-white/25 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export P&L CSV</span>
            </button>
          </div>

          {/* Statement Table */}
          <div className="overflow-x-auto rounded-xl border border-white/15">
            <table className="w-full text-left text-xs text-white">
              <thead className="bg-[#070E24] text-white/70 font-bold uppercase border-b border-white/15">
                <tr>
                  <th className="p-3.5">Financial Metric</th>
                  <th className="p-3.5">Accounting Description</th>
                  <th className="p-3.5 text-right">Amount (UGX)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                <tr className="hover:bg-[#0F1B3E]/30">
                  <td className="p-3.5 font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-white" />
                    <span>Gross Sales Revenue</span>
                  </td>
                  <td className="p-3.5 text-white/70">Total revenue from store POS and field route sales</td>
                  <td className="p-3.5 text-right font-mono font-extrabold text-white text-sm">
                    UGX {totalSalesUgx.toLocaleString()}
                  </td>
                </tr>

                <tr className="hover:bg-[#0F1B3E]/30">
                  <td className="p-3.5 font-bold text-white flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-white" />
                    <span>Operational Expenses</span>
                  </td>
                  <td className="p-3.5 text-white/70">Total vouchers paid for fuel, utilities, route allowances & maintenance</td>
                  <td className="p-3.5 text-right font-mono font-extrabold text-white text-sm">
                    - UGX {expensesUgx.toLocaleString()}
                  </td>
                </tr>

                <tr className="hover:bg-[#0F1B3E]/30">
                  <td className="p-3.5 font-bold text-white flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-white" />
                    <span>Outstanding Uncollected Debts</span>
                  </td>
                  <td className="p-3.5 text-white/70">Uncollected customer credit and route cash shortages</td>
                  <td className="p-3.5 text-right font-mono font-extrabold text-white text-sm">
                    - UGX {outstandingDebtsUgx.toLocaleString()}
                  </td>
                </tr>

                <tr className="bg-[#0F1B3E]/90 font-extrabold text-sm border-t-2 border-white/20">
                  <td className={`p-4 flex items-center gap-2 ${netProfitUgx >= 0 ? 'text-white' : 'text-white'}`}>
                    <Receipt className="w-5 h-5" />
                    <span>Net Realized Profit Realized</span>
                  </td>
                  <td className="p-4 text-white text-xs font-normal">
                    Equation: Gross Sales - Expenses - Debts (Net Margin: {profitMarginPercent}%)
                  </td>
                  <td className={`p-4 text-right font-mono text-base ${netProfitUgx >= 0 ? 'text-white' : 'text-white'}`}>
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
        <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-white/15 space-y-4 sm:space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/15 pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-white" />
                <span>Reports & Audit Center</span>
              </h2>
              <p className="text-xs text-white/70 mt-1">
                Generate and export detailed CSV reports across sales, inventory, expenses, debts, and system audit trails.
              </p>
            </div>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-white/20 text-white border border-white/40 font-black hover:bg-white/25 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export {selectedReportType} CSV</span>
            </button>
          </div>

          {/* Filtering Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#070E24] p-4 rounded-xl border border-white/15">
            <div>
              <label className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Report Selection</label>
              <select
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value)}
                className="w-full bg-[#0F1B3E] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white font-semibold mt-1 focus:outline-none focus:border-white/30 cursor-pointer"
              >
                {reportsList.map((r) => (
                  <option key={r.id} value={r.id}>{r.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Store Scope</label>
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="w-full bg-[#0F1B3E] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white font-semibold mt-1 focus:outline-none focus:border-white/30 cursor-pointer"
              >
                <option value="ALL">All Stores (Consolidated)</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#0F1B3E] border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white font-semibold mt-1"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-white/70 uppercase tracking-wider">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[#0F1B3E] border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white font-semibold mt-1"
              />
            </div>
          </div>

          {/* Dynamic Table Preview */}
          <div className="overflow-x-auto rounded-xl border border-white/15">
            {selectedReportType === 'AUDIT_LOG' ? (
              <table className="w-full text-left text-xs text-white">
                <thead className="bg-[#070E24] text-white/70 font-bold uppercase border-b border-white/15">
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
                    <tr key={log.id} className="hover:bg-[#0F1B3E]/40">
                      <td className="p-3 font-mono text-white/70">{log.timestamp}</td>
                      <td className="p-3 font-bold text-white">{log.user}</td>
                      <td className="p-3 font-semibold text-white">{log.action}</td>
                      <td className="p-3 text-white">{log.entity}</td>
                      <td className="p-3 text-white/70">{log.details}</td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-white/60">No audit logs recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : selectedReportType === 'EXPENSES' ? (
              <table className="w-full text-left text-xs text-white">
                <thead className="bg-[#070E24] text-white/70 font-bold uppercase border-b border-white/15">
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
                      <td className="p-3 font-mono font-bold text-white">{exp.voucherNumber}</td>
                      <td className="p-3 text-white/70">{exp.date}</td>
                      <td className="p-3 font-semibold text-white">{exp.category}</td>
                      <td className="p-3 text-white">{exp.approvedBy}</td>
                      <td className="p-3 text-white/70">{exp.description}</td>
                      <td className="p-3 text-right font-mono font-bold text-white">
                        UGX {exp.amountUgx.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : selectedReportType === 'STOCK_BALANCE' ? (
              <table className="w-full text-left text-xs text-white">
                <thead className="bg-[#070E24] text-white/70 font-bold uppercase border-b border-white/15">
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
                      <td className="p-3 font-bold text-white">{r.productName}</td>
                      <td className="p-3 font-mono text-white">{r.sku}</td>
                      <td className="p-3 text-white">{r.storeName}</td>
                      <td className="p-3 text-right font-mono font-bold text-white">{r.quantity}</td>
                      <td className="p-3 text-right font-mono text-white/70">UGX {r.sellingPriceUgx.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-bold text-white">UGX {r.valuationCostUgx.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-xs text-white">
                <thead className="bg-[#070E24] text-white/70 font-bold uppercase border-b border-white/15">
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
                      <td className="p-3 font-mono font-bold text-white">{s.receiptNumber}</td>
                      <td className="p-3 text-white/70">{s.date}</td>
                      <td className="p-3 font-bold text-white">{s.customerName || 'Walk-in'}</td>
                      <td className="p-3 text-white">
                        {s.items.map((it) => `${it.quantity}x ${it.name}`).join(', ') || 'Water Product'}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-white">
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
          <div className="bg-[#0F1B3E] border border-white/20 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-rose-950/40">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-white/15 flex items-center justify-between bg-[#070E24]/60">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white/10 text-white rounded-xl border border-white/20">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Expense Details & Voucher Summary
                  </h3>
                  <div className="text-xs font-mono text-white">
                    {selectedExpenseForModal.voucherNumber} • {selectedExpenseForModal.category}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedExpenseForModal(null)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-[#182855] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 text-xs">
              
              {/* Full Description Box */}
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-white/70 block mb-1.5">
                  Complete Expense Description
                </label>
                <div className="bg-[#070E24] border border-white/15 rounded-xl p-3.5 text-white leading-relaxed break-words whitespace-pre-wrap font-medium select-text">
                  {selectedExpenseForModal.description || 'No detailed description was recorded for this voucher.'}
                </div>
              </div>

              {/* Financial & Authority Details Grid */}
              <div className="grid grid-cols-2 gap-3 bg-[#070E24]/60 p-3.5 rounded-xl border border-white/15/80">
                <div>
                  <span className="text-[10px] text-white/70 uppercase font-bold block">Approved / Spent By:</span>
                  <span className="font-bold text-white flex items-center gap-1 mt-0.5">
                    <User className="w-3.5 h-3.5 text-white" />
                    <span>{selectedExpenseForModal.approvedBy || 'Manager'}</span>
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-white/70 uppercase font-bold block">Amount (UGX):</span>
                  <span className="font-mono font-extrabold text-white text-sm mt-0.5 block">
                    UGX {selectedExpenseForModal.amountUgx.toLocaleString()}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-white/70 uppercase font-bold block">Time & Date Recorded:</span>
                  <span className="text-white font-semibold mt-0.5 block">
                    {formatDateTime(selectedExpenseForModal.createdAt, selectedExpenseForModal.date).display}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-white/70 uppercase font-bold block">Payment Method:</span>
                  <span className="font-bold text-white mt-0.5 block">
                    {selectedExpenseForModal.paymentMethod || 'CASH'}
                  </span>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-[#070E24]/60 border-t border-white/15 flex items-center justify-between">
              <button
                onClick={() => handleCopy(selectedExpenseForModal.description)}
                className="px-3 py-1.5 bg-[#182855] hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedText ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedText ? 'Copied Description' : 'Copy Description'}</span>
              </button>

              <button
                onClick={() => setSelectedExpenseForModal(null)}
                className="px-4 py-1.5 bg-white/20 text-white border border-white/40 font-black hover:bg-white/25 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md"
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
          <div className="bg-[#0F1B3E] border border-white/20 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-amber-950/40">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-white/15 flex items-center justify-between bg-[#070E24]/60">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white/10 text-white rounded-xl border border-white/20">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Debt Information & Reason
                  </h3>
                  <div className="text-xs font-mono text-white">
                    {selectedDebtForModal.debtorName} • {selectedDebtForModal.source}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedDebtForModal(null)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-[#182855] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 text-xs">
              
              {/* Full Reason Box */}
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-white/70 block mb-1.5">
                  Debt Reason / Shortage Notes
                </label>
                <div className="bg-[#070E24] border border-white/15 rounded-xl p-3.5 text-white leading-relaxed break-words whitespace-pre-wrap font-medium select-text">
                  {selectedDebtForModal.reason || 'No detailed notes recorded for this debt record.'}
                </div>
              </div>

              {/* Debt Balances Grid */}
              <div className="grid grid-cols-3 gap-2 bg-[#070E24]/60 p-3 rounded-xl border border-white/15">
                <div className="text-center p-1.5">
                  <div className="text-[10px] uppercase text-white/70 font-bold">Original Debt</div>
                  <div className="font-mono font-bold text-white mt-1">
                    UGX {selectedDebtForModal.originalAmountUgx.toLocaleString()}
                  </div>
                </div>

                <div className="text-center p-1.5 border-x border-white/15">
                  <div className="text-[10px] uppercase text-white/70 font-bold">Amount Paid</div>
                  <div className="font-mono font-bold text-white mt-1">
                    UGX {selectedDebtForModal.paidAmountUgx.toLocaleString()}
                  </div>
                </div>

                <div className="text-center p-1.5">
                  <div className="text-[10px] uppercase text-white/70 font-bold">Balance Due</div>
                  <div className="font-mono font-extrabold text-white mt-1">
                    UGX {selectedDebtForModal.balanceAmountUgx.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Authority & Timing */}
              <div className="grid grid-cols-2 gap-3 bg-[#070E24]/60 p-3.5 rounded-xl border border-white/15/80">
                <div>
                  <span className="text-[10px] text-white/70 uppercase font-bold block">Recorded / Approved By:</span>
                  <span className="font-bold text-white flex items-center gap-1 mt-0.5">
                    <User className="w-3.5 h-3.5 text-white" />
                    <span>{selectedDebtForModal.approvedBy || 'Branch Manager'}</span>
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-white/70 uppercase font-bold block">Status:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider w-fit inline-block mt-0.5 ${
                    selectedDebtForModal.status === 'CLEARED'
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'bg-white/10 text-white border border-white/20'
                  }`}>
                    {selectedDebtForModal.status}
                  </span>
                </div>

                <div className="col-span-2">
                  <span className="text-[10px] text-white/70 uppercase font-bold block">Time & Date Recorded:</span>
                  <span className="text-white font-semibold mt-0.5 block">
                    {formatDateTime(selectedDebtForModal.createdAt, selectedDebtForModal.date).display}
                  </span>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-[#070E24]/60 border-t border-white/15 flex items-center justify-between">
              <button
                onClick={() => handleCopy(selectedDebtForModal.reason || '')}
                className="px-3 py-1.5 bg-[#182855] hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedText ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedText ? 'Copied Reason' : 'Copy Reason'}</span>
              </button>

              <button
                onClick={() => setSelectedDebtForModal(null)}
                className="px-4 py-1.5 bg-white/20 text-white border border-white/40 font-black hover:bg-white/25 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md"
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
          <div className="bg-[#0F1B3E] border border-white/20 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl shadow-cyan-950/40">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-white/15 flex items-center justify-between bg-[#070E24]/60">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white/10 text-white rounded-xl border border-white/20">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Sale Receipt & Products Bought
                  </h3>
                  <div className="text-xs font-mono text-white">
                    {selectedSaleForModal.receiptNumber} • {stores.find((st) => st.id === selectedSaleForModal.storeId)?.name || 'Store'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedSaleForModal(null)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-[#182855] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 text-xs">
              
              {/* Sale Timing & Customer Header */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#070E24] p-3.5 rounded-xl border border-white/15">
                <div>
                  <span className="text-[10px] text-white/70 uppercase font-bold block">Customer:</span>
                  <span className="font-bold text-white block mt-0.5">
                    {selectedSaleForModal.customerName || 'Walk-in Customer'}
                  </span>
                  {selectedSaleForModal.customerPhone && (
                    <span className="text-[10px] text-white/70 block">{selectedSaleForModal.customerPhone}</span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-white/70 uppercase font-bold block">Exact Time & Date:</span>
                  <span className="font-semibold text-white/90 block mt-0.5">
                    {formatDateTime(selectedSaleForModal.createdAt, selectedSaleForModal.date).display}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-white/70 uppercase font-bold block">Payment Method:</span>
                  <span className="font-bold text-white block mt-0.5">
                    {selectedSaleForModal.paymentMethod}
                  </span>
                </div>
              </div>

              {/* Itemized Products Bought Table */}
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-white/70 block mb-1.5">
                  Products Bought ({selectedSaleForModal.items?.length || 0} item lines)
                </label>
                <div className="overflow-x-auto rounded-xl border border-white/15">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#070E24] text-white/70 font-bold uppercase border-b border-white/15">
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
                          <tr key={idx} className="hover:bg-[#070E24]/40">
                            <td className="p-2.5 font-bold text-white">{it.name}</td>
                            <td className="p-2.5 text-center font-mono font-extrabold text-white">{it.quantity}</td>
                            <td className="p-2.5 text-right font-mono text-white/70">UGX {it.unitPriceUgx.toLocaleString()}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-white">
                              UGX {(it.quantity * it.unitPriceUgx).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-white/60 italic">
                            Water Products Sale
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Totals */}
              <div className="bg-[#070E24] p-3.5 rounded-xl border border-white/15 space-y-1.5 text-xs">
                <div className="flex justify-between text-white/70">
                  <span>Gross Subtotal:</span>
                  <span className="font-mono">UGX {selectedSaleForModal.subtotalUgx.toLocaleString()}</span>
                </div>
                {selectedSaleForModal.overallDiscountUgx > 0 && (
                  <div className="flex justify-between text-white">
                    <span>Discount Applied:</span>
                    <span className="font-mono">- UGX {selectedSaleForModal.overallDiscountUgx.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-extrabold text-white pt-1 border-t border-white/15">
                  <span>Total Amount Due:</span>
                  <span className="font-mono">UGX {selectedSaleForModal.totalAmountUgx.toLocaleString()}</span>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-[#070E24]/60 border-t border-white/15 flex items-center justify-end">
              <button
                onClick={() => setSelectedSaleForModal(null)}
                className="px-4 py-1.5 bg-white/20 text-white border border-white/40 font-black hover:bg-white/25 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md"
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
