import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { canAccessDomain } from '../utils/rbac';
import {
  Building2,
  Store,
  ChevronDown,
  ChevronRight,
  UserCheck,
  LogOut,
  ShieldAlert,
  Menu,
  X,
  Droplets,
  LayoutDashboard,
  ShoppingCart,
  Truck,
  Package,
  Receipt,
  BarChart3,
  DollarSign,
  Settings,
  Layers,
  ArrowRightLeft,
  Users,
  HardDrive,
  History,
  AlertTriangle,
  Briefcase,
  Coins,
  CreditCard,
  FileSpreadsheet,
  Cpu,
} from 'lucide-react';

export type NavDomain =
  | 'dashboard'
  | 'operations'
  | 'inventory'
  | 'branches'
  | 'people'
  | 'finance'
  | 'reports'
  | 'system';

export interface NavSelection {
  domain: NavDomain;
  subView: string;
}

interface NavbarProps {
  currentNav: NavSelection;
  onSelectNav: (nav: NavSelection) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentNav, onSelectNav }) => {
  const {
    user,
    branches,
    stores,
    currentBranchId,
    currentStoreId,
    setStore,
    setUser,
  } = useStore();
  const [openDropdown, setOpenDropdown] = useState<NavDomain | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileExpandedDomain, setMobileExpandedDomain] = useState<NavDomain | null>(currentNav.domain);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync mobile expanded domain with active domain
  useEffect(() => {
    setMobileExpandedDomain(currentNav.domain);
  }, [currentNav.domain]);

  const domainConfigs: {
    key: NavDomain;
    label: string;
    icon: React.ElementType;
    subViews: { key: string; label: string; icon: React.ElementType; description?: string }[];
  }[] = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      subViews: [
        { key: 'overview', label: 'Executive Overview', icon: LayoutDashboard, description: 'Real-time KPIs & daily metrics' },
      ],
    },
    {
      key: 'operations',
      label: 'Operations',
      icon: ShoppingCart,
      subViews: [
        { key: 'pos', label: 'Store POS', icon: ShoppingCart, description: 'Counter retail sales & checkout' },
        { key: 'field_sales', label: 'Field Sales', icon: Truck, description: 'Route delivery sessions' },
        { key: 'field_sessions', label: 'Field Sessions', icon: Layers, description: 'Active & closed session logs' },
        { key: 'stock_receipts', label: 'Stock Receipts', icon: Receipt, description: 'Goods intake & receiving' },
        { key: 'stock_transfers', label: 'Stock Transfers', icon: ArrowRightLeft, description: 'Branch-to-branch transfers' },
        { key: 'expenses', label: 'Expenses', icon: Receipt, description: 'Operating expense vouchers' },
      ],
    },
    {
      key: 'inventory',
      label: 'Inventory',
      icon: Package,
      subViews: [
        { key: 'products', label: 'Products', icon: Package, description: 'Product catalog & SKUs' },
        { key: 'stock', label: 'Stock Levels', icon: HardDrive, description: 'Store inventory balances' },
        { key: 'stock_movements', label: 'Stock Movements', icon: History, description: 'Immutable stock ledger' },
        { key: 'damages', label: 'Damages & Loss', icon: AlertTriangle, description: 'Spoilage & missing stock' },
      ],
    },
    {
      key: 'branches',
      label: 'Branches',
      icon: Building2,
      subViews: [
        { key: 'branches', label: 'Branches', icon: Building2, description: 'Regional branch locations' },
        { key: 'stores', label: 'Stores', icon: Store, description: 'Warehouses & sales stores' },
        { key: 'vehicles', label: 'Vehicles', icon: Truck, description: 'Delivery lorries & tuk-tuks' },
      ],
    },
    {
      key: 'people',
      label: 'People',
      icon: Users,
      subViews: [
        { key: 'workers', label: 'Workers', icon: Users, description: 'Staff directory & profiles' },
        { key: 'departments', label: 'Departments', icon: Briefcase, description: 'Organizational departments' },
        { key: 'users', label: 'Users', icon: UserCheck, description: 'User login credentials' },
        { key: 'roles', label: 'Roles & Permissions', icon: ShieldAlert, description: 'RBAC security policies' },
      ],
    },
    {
      key: 'finance',
      label: 'Finance',
      icon: DollarSign,
      subViews: [
        { key: 'sales_ledger', label: 'Sales Ledger', icon: DollarSign, description: 'POS & Field revenue records' },
        { key: 'cash', label: 'Cash Accounts', icon: Coins, description: 'Cash drawer balances' },
        { key: 'bank_mobile', label: 'Bank & Mobile Money', icon: CreditCard, description: 'Digital & bank payments' },
        { key: 'debts', label: 'Debts & Recovery', icon: FileSpreadsheet, description: 'Worker shortages & credit' },
        { key: 'salaries', label: 'Salary Processing', icon: Coins, description: 'Monthly payroll & commissions' },
      ],
    },
    {
      key: 'reports',
      label: 'Reports',
      icon: BarChart3,
      subViews: [
        { key: 'sales_reports', label: 'Sales Reports', icon: BarChart3, description: 'Revenue & product performance' },
        { key: 'stock_reports', label: 'Stock Reports', icon: Package, description: 'Valuation & movement analytics' },
        { key: 'financial_reports', label: 'Financial Reports', icon: DollarSign, description: 'P&L, expenses & debt ledgers' },
        { key: 'audit_reports', label: 'Audit Reports', icon: History, description: 'System audit trail logs' },
      ],
    },
    {
      key: 'system',
      label: 'System',
      icon: Settings,
      subViews: [
        { key: 'backups', label: 'Cloud Data Backups', icon: HardDrive, description: 'Export snapshots & disaster recovery' },
        { key: 'admin_config', label: 'Master Configuration', icon: Settings, description: 'Code-free system settings' },
        { key: 'audit_log', label: 'Audit Log', icon: History, description: 'Security & action records' },
        { key: 'devices', label: 'Registered Devices', icon: Cpu, description: 'Authorized POS hardware' },
      ],
    },
  ];

  const handleSelectSubView = (domain: NavDomain, subView: string) => {
    onSelectNav({ domain, subView });
    setOpenDropdown(null);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-[#0B132B] border-b border-blue-900/60 text-white select-none sticky top-0 z-50 shadow-xl">
      {/* Top Main Navigation Bar */}
      <div className="max-w-[1600px] mx-auto px-3 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between gap-3">
        
        {/* Left Section: Brand & Store Selector */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Logo */}
          <div
            onClick={() => onSelectNav({ domain: 'dashboard', subView: 'overview' })}
            className="flex items-center gap-2.5 text-white font-extrabold text-lg sm:text-xl tracking-tight cursor-pointer hover:opacity-90 transition-opacity"
          >
            <div className="p-1.5 sm:p-2 bg-blue-950 rounded-xl border border-blue-700/70 text-white shadow-md">
              <Droplets className="w-5 h-5 text-white animate-pulse" />
            </div>
            <span className="flex items-center">
              AQUA<span className="text-cyan-400 font-black">POS</span>
            </span>
          </div>

          <div className="h-6 w-px bg-blue-900/60 hidden md:block" />

          {/* Dynamic Branch Picker (Desktop/Tablet) */}
          <div className="hidden lg:flex items-center gap-2 text-xs bg-[#101C38] border border-blue-800/60 rounded-xl px-3 py-1.5 shadow-sm">
            <Building2 className="w-4 h-4 text-white shrink-0" />
            <span className="text-blue-100 font-semibold">Branch:</span>
            <select
              value={currentBranchId}
              onChange={(e) => {
                const newBranchId = e.target.value;
                const branchStores = stores.filter((s) => s.branchId === newBranchId);
                const firstStoreId = branchStores[0]?.id || '';
                setStore(newBranchId, firstStoreId);
              }}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer text-xs max-w-[130px] xl:max-w-none truncate"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id} className="bg-[#0B132B] text-white">
                  {b.name} ({b.code})
                </option>
              ))}
              {branches.length === 0 && (
                <option value="" className="bg-[#0B132B] text-white">
                  All Branches
                </option>
              )}
            </select>
          </div>

          {/* Dynamic Store Picker (Desktop/Tablet) */}
          <div className="hidden md:flex items-center gap-2 text-xs bg-[#101C38] border border-blue-800/60 rounded-xl px-3 py-1.5 shadow-sm">
            <Store className="w-4 h-4 text-white shrink-0" />
            <span className="text-blue-100 font-semibold">Store:</span>
            <select
              value={currentStoreId}
              onChange={(e) => {
                const newStoreId = e.target.value;
                const selectedStore = stores.find((s) => s.id === newStoreId);
                setStore(selectedStore?.branchId || currentBranchId, newStoreId);
              }}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer text-xs max-w-[140px] xl:max-w-none truncate"
            >
              {stores
                .filter((s) => !currentBranchId || s.branchId === currentBranchId)
                .map((st) => (
                  <option key={st.id} value={st.id} className="bg-[#0B132B] text-white">
                    {st.name} ({st.type})
                  </option>
                ))}
              {stores.filter((s) => !currentBranchId || s.branchId === currentBranchId).length === 0 && (
                <option value="" className="bg-[#0B132B] text-white">
                  All Stores
                </option>
              )}
            </select>
          </div>
        </div>

        {/* Center Section: 8 Business Domain Navigation Tabs (Desktop screens >= 1200px) */}
        <nav className="hidden xl:flex items-center gap-1.5 bg-[#101C38] p-1.5 rounded-2xl border border-blue-800/60 shadow-inner" ref={dropdownRef}>
          {domainConfigs
            .filter((domain) => canAccessDomain(user?.role, domain.key))
            .map((domain) => {
            const IconComponent = domain.icon;
            const isDomainActive = currentNav.domain === domain.key;
            const isSingleView = domain.subViews.length === 1;

            return (
              <div key={domain.key} className="relative">
                <button
                  onClick={() => {
                    if (isSingleView) {
                      handleSelectSubView(domain.key, domain.subViews[0].key);
                    } else {
                      setOpenDropdown(openDropdown === domain.key ? null : domain.key);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isDomainActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-950 border border-blue-400/40'
                      : 'text-white hover:bg-blue-900/50 hover:text-cyan-200'
                  }`}
                >
                  <IconComponent className="w-4 h-4 text-white" />
                  <span>{domain.label}</span>
                  {!isSingleView && (
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-white transition-transform ${openDropdown === domain.key ? 'rotate-180' : ''}`}
                    />
                  )}
                </button>

                {/* Sub-menu Dropdown Popup */}
                {!isSingleView && openDropdown === domain.key && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-[#0D1836] border border-blue-700/60 rounded-2xl p-2 shadow-2xl z-50 animate-fade-in space-y-1">
                    <div className="text-[11px] font-bold text-white uppercase tracking-wider px-3 py-1.5 border-b border-blue-900/60 mb-1 flex items-center gap-1.5">
                      <IconComponent className="w-3.5 h-3.5 text-white" />
                      <span>{domain.label} Menu</span>
                    </div>
                    {domain.subViews.map((sub) => {
                      const SubIcon = sub.icon;
                      const isSubActive = currentNav.domain === domain.key && currentNav.subView === sub.key;

                      return (
                        <button
                          key={sub.key}
                          onClick={() => handleSelectSubView(domain.key, sub.key)}
                          className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-all cursor-pointer ${
                            isSubActive
                              ? 'bg-blue-600 text-white shadow-md border border-blue-400/50 font-bold'
                              : 'hover:bg-blue-900/50 text-white'
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg my-auto ${isSubActive ? 'bg-blue-900 text-white' : 'bg-[#101C38] text-white border border-blue-800/60'}`}>
                            <SubIcon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">{sub.label}</div>
                            {sub.description && <div className="text-[10px] text-blue-100/70">{sub.description}</div>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Right Section: Quick Shortcuts, User Profile, Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Access Operational Shortcuts */}
          <div className="hidden sm:flex items-center gap-1 bg-[#101C38] border border-blue-800/60 p-1 rounded-xl">
            <button
              onClick={() => onSelectNav({ domain: 'operations', subView: 'pos' })}
              title="Quick POS Checkout"
              className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
                currentNav.subView === 'pos' ? 'bg-blue-600 text-white shadow' : 'text-white hover:bg-blue-900/50'
              }`}
            >
              <ShoppingCart className="w-4 h-4 text-white" />
              <span className="hidden lg:inline">POS</span>
            </button>

            <button
              onClick={() => onSelectNav({ domain: 'operations', subView: 'field_sales' })}
              title="Quick Field Sales"
              className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
                currentNav.subView === 'field_sales' ? 'bg-blue-600 text-white shadow' : 'text-white hover:bg-blue-900/50'
              }`}
            >
              <Truck className="w-4 h-4 text-white" />
              <span className="hidden lg:inline">Field</span>
            </button>

            <button
              onClick={() => onSelectNav({ domain: 'inventory', subView: 'stock' })}
              title="Quick Stock View"
              className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
                currentNav.subView === 'stock' ? 'bg-blue-600 text-white shadow' : 'text-white hover:bg-blue-900/50'
              }`}
            >
              <Package className="w-4 h-4 text-white" />
              <span className="hidden lg:inline">Stock</span>
            </button>
          </div>

          {/* User Badge (Desktop) */}
          <div className="hidden md:flex items-center gap-2.5 text-xs bg-[#101C38] border border-blue-800/60 rounded-xl px-3 py-1.5">
            <UserCheck className="w-4 h-4 text-white shrink-0" />
            <div className="leading-tight text-left">
              <div className="font-bold text-white truncate max-w-[110px]">{user?.fullName || user?.username}</div>
              <div className="text-[10px] text-blue-200 font-semibold">{user?.role}</div>
            </div>
          </div>

          {/* Desktop Logout Button */}
          <button
            onClick={() => setShowLogoutModal(true)}
            className="hidden sm:flex items-center gap-1.5 bg-rose-900/80 hover:bg-rose-800 border border-rose-700/80 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-950/60 cursor-pointer"
            title="Sign out"
          >
            <LogOut className="w-4 h-4 text-white" />
            <span className="hidden md:inline">Sign Out</span>
          </button>

          {/* Mobile/Tablet Hamburger Menu Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="xl:hidden p-2 rounded-xl bg-[#101C38] hover:bg-blue-900/60 border border-blue-800/60 text-white transition-all flex items-center justify-center cursor-pointer shadow-md"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
          </button>
        </div>

      </div>

      {/* Mobile Fast-Access Navigation Bar (Visible on mobile screens < 640px) */}
      <div className="sm:hidden border-t border-blue-900/40 bg-[#09112A] px-3 py-1.5 flex items-center justify-around gap-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => onSelectNav({ domain: 'dashboard', subView: 'overview' })}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
            currentNav.domain === 'dashboard' ? 'bg-blue-600 text-white shadow' : 'text-white hover:bg-blue-900/40'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-white" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => onSelectNav({ domain: 'operations', subView: 'pos' })}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
            currentNav.subView === 'pos' ? 'bg-blue-600 text-white shadow' : 'text-white hover:bg-blue-900/40'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5 text-white" />
          <span>POS</span>
        </button>

        <button
          onClick={() => onSelectNav({ domain: 'operations', subView: 'field_sales' })}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
            currentNav.subView === 'field_sales' ? 'bg-blue-600 text-white shadow' : 'text-white hover:bg-blue-900/40'
          }`}
        >
          <Truck className="w-3.5 h-3.5 text-white" />
          <span>Field</span>
        </button>

        <button
          onClick={() => onSelectNav({ domain: 'inventory', subView: 'stock' })}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
            currentNav.subView === 'stock' ? 'bg-blue-600 text-white shadow' : 'text-white hover:bg-blue-900/40'
          }`}
        >
          <Package className="w-3.5 h-3.5 text-white" />
          <span>Stock</span>
        </button>

        <button
          onClick={() => onSelectNav({ domain: 'reports', subView: 'sales_reports' })}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
            currentNav.domain === 'reports' ? 'bg-blue-600 text-white shadow' : 'text-white hover:bg-blue-900/40'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-white" />
          <span>Reports</span>
        </button>
      </div>

      {/* Mobile Navigation Drawer / Off-Canvas Sheet */}
      {isMobileMenuOpen && (
        <div className="xl:hidden fixed inset-0 top-[52px] sm:top-[56px] z-50 bg-[#070E24]/98 backdrop-blur-xl flex flex-col justify-between animate-fade-in border-t border-blue-900/60 overflow-y-auto">
          <div className="p-4 space-y-4 max-w-lg mx-auto w-full">
            
            {/* Mobile User Profile Card */}
            <div className="bg-[#101C38] border border-blue-800/70 rounded-2xl p-4 flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-950 rounded-xl border border-blue-700/60 text-white">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-extrabold text-white text-base">{user?.fullName || user?.username}</div>
                  <div className="text-xs text-cyan-300 font-mono">
                    @{user?.username} • <span className="text-white font-bold">{user?.role}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setShowLogoutModal(true);
                }}
                className="p-2.5 bg-rose-900/80 hover:bg-rose-800 border border-rose-700/70 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                title="Sign out"
              >
                <LogOut className="w-4 h-4 text-white" />
                <span className="text-white">Exit</span>
              </button>
            </div>

            {/* Mobile Branch & Store Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#101C38]/80 p-3.5 rounded-2xl border border-blue-800/60 shadow-lg">
              <div>
                <label className="text-xs text-white uppercase tracking-wider font-bold block mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-white" /> Active Branch
                </label>
                <select
                  value={currentBranchId}
                  onChange={(e) => {
                    const newBranchId = e.target.value;
                    const branchStores = stores.filter((s) => s.branchId === newBranchId);
                    const firstStoreId = branchStores[0]?.id || '';
                    setStore(newBranchId, firstStoreId);
                  }}
                  className="w-full bg-[#081028] border border-blue-800/70 rounded-xl px-3 py-2.5 text-xs text-white font-bold focus:outline-none"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id} className="bg-[#0B132B] text-white">
                      {b.name} ({b.code})
                    </option>
                  ))}
                  {branches.length === 0 && (
                    <option value="" className="bg-[#0B132B] text-white">All Branches</option>
                  )}
                </select>
              </div>

              <div>
                <label className="text-xs text-white uppercase tracking-wider font-bold block mb-1.5 flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-white" /> Active Store
                </label>
                <select
                  value={currentStoreId}
                  onChange={(e) => {
                    const newStoreId = e.target.value;
                    const selectedStore = stores.find((s) => s.id === newStoreId);
                    setStore(selectedStore?.branchId || currentBranchId, newStoreId);
                  }}
                  className="w-full bg-[#081028] border border-blue-800/70 rounded-xl px-3 py-2.5 text-xs text-white font-bold focus:outline-none"
                >
                  {stores
                    .filter((s) => !currentBranchId || s.branchId === currentBranchId)
                    .map((st) => (
                      <option key={st.id} value={st.id} className="bg-[#0B132B] text-white">
                        {st.name} ({st.type})
                      </option>
                    ))}
                  {stores.length === 0 && (
                    <option value="" className="bg-[#0B132B] text-white">All Stores</option>
                  )}
                </select>
              </div>
            </div>

            {/* Mobile Business Navigation Domains */}
            <div className="space-y-2 pt-1">
              <div className="text-xs font-bold text-white uppercase tracking-wider px-2 flex items-center gap-1.5">
                <span>System Modules</span>
              </div>

              {domainConfigs
                .filter((domain) => canAccessDomain(user?.role, domain.key))
                .map((domain) => {
                  const DomainIcon = domain.icon;
                  const isDomainActive = currentNav.domain === domain.key;
                  const isExpanded = mobileExpandedDomain === domain.key;
                  const isSingleView = domain.subViews.length === 1;

                  return (
                    <div key={domain.key} className="bg-[#101C38] border border-blue-800/60 rounded-2xl overflow-hidden shadow-md">
                      <button
                        onClick={() => {
                          if (isSingleView) {
                            handleSelectSubView(domain.key, domain.subViews[0].key);
                          } else {
                            setMobileExpandedDomain(isExpanded ? null : domain.key);
                          }
                        }}
                        className={`w-full flex items-center justify-between p-3.5 text-xs font-bold transition-all cursor-pointer ${
                          isDomainActive
                            ? 'bg-blue-600 text-white font-extrabold shadow-md'
                            : 'text-white hover:bg-blue-900/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${isDomainActive ? 'bg-blue-900 text-white' : 'bg-[#081028] text-white border border-blue-800/60'}`}>
                            <DomainIcon className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm font-bold text-white">{domain.label}</span>
                        </div>
                        {!isSingleView && (
                          <ChevronDown
                            className={`w-4 h-4 text-white transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        )}
                      </button>

                      {/* Sub-items */}
                      {isExpanded && !isSingleView && (
                        <div className="p-2.5 pt-1 space-y-1.5 bg-[#081028] border-t border-blue-900/60">
                          {domain.subViews.map((sub) => {
                            const SubIcon = sub.icon;
                            const isSubActive = currentNav.domain === domain.key && currentNav.subView === sub.key;

                            return (
                              <button
                                key={sub.key}
                                onClick={() => handleSelectSubView(domain.key, sub.key)}
                                className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left text-xs transition-all cursor-pointer ${
                                  isSubActive
                                    ? 'bg-blue-600 text-white font-bold shadow-md'
                                    : 'text-white hover:bg-blue-900/50 font-medium'
                                }`}
                              >
                                <SubIcon className="w-4 h-4 text-white shrink-0" />
                                <div className="flex-1">
                                  <div className="text-xs font-bold text-white">{sub.label}</div>
                                  {sub.description && (
                                    <div className="text-[10px] text-blue-100/70">
                                      {sub.description}
                                    </div>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="p-4 border-t border-blue-900/60 bg-[#070E24] text-center text-xs text-white font-medium">
            AquaPOS Management System • Mobile & Desktop Responsive
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#0F1B3E] border border-blue-800/70 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-blue-900/60 pb-3.5">
              <div className="flex items-center gap-2.5 text-white font-extrabold text-base">
                <ShieldAlert className="w-5 h-5 text-white" />
                <span>Confirm Sign Out</span>
              </div>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="text-white hover:text-cyan-300 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#081028] border border-blue-800/60 p-3.5 rounded-2xl space-y-1">
              <div className="text-sm font-extrabold text-white">{user?.fullName || user?.username}</div>
              <div className="text-xs text-white font-mono">
                Username: <span className="text-cyan-300 font-bold">{user?.username}</span> | Role: <span className="text-white font-bold">{user?.role}</span>
              </div>
            </div>

            <p className="text-xs text-blue-100/90 leading-relaxed font-medium">
              Are you sure you want to sign out? Your current session will end, and you will need to re-enter your credentials.
            </p>

            <div className="border-t border-blue-900/60 pt-4 flex items-center justify-end gap-2.5 text-xs">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2.5 bg-blue-900/60 hover:bg-blue-800 text-white font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setUser(null, null);
                  setShowLogoutModal(false);
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl transition-all shadow-lg shadow-rose-950 cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
