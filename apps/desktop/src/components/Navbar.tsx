import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { apiClient } from '../utils/api';
import { syncManager } from '../services/syncService';
import { BRAND_ASSETS, APP_ICONS } from '../config/assets.config';
import { UserRole, User } from '@water-business/shared-types';
import { canAccessDomain } from '../utils/rbac';
import {
  Building2,
  Store,
  ChevronDown,
  ChevronRight,
  Wifi,
  WifiOff,
  UserCheck,
  RefreshCw,
  AlertCircle,
  LogOut,
  KeyRound,
  ShieldAlert,
  CheckCircle,
  Menu,
  X,
  Database,
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
    isOnline,
    syncStatus,
    pendingSyncCount,
    setStore,
    setOnlineStatus,
    setUser,
    usersList,
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

  const LogoIcon = BRAND_ASSETS.LogoIcon;

  const domainConfigs: {
    key: NavDomain;
    label: string;
    icon: React.ElementType;
    subViews: { key: string; label: string; icon: React.ElementType; description?: string }[];
  }[] = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: APP_ICONS.dashboard,
      subViews: [
        { key: 'overview', label: 'Executive Overview', icon: APP_ICONS.dashboard, description: 'Real-time KPIs & daily metrics' },
      ],
    },
    {
      key: 'operations',
      label: 'Operations',
      icon: APP_ICONS.operations,
      subViews: [
        { key: 'pos', label: 'Store POS', icon: APP_ICONS.pos, description: 'Counter retail sales & checkout' },
        { key: 'field_sales', label: 'Field Sales', icon: APP_ICONS.fieldSales, description: 'Route delivery sessions' },
        { key: 'field_sessions', label: 'Field Sessions', icon: APP_ICONS.fieldSessions, description: 'Active & closed session logs' },
        { key: 'stock_receipts', label: 'Stock Receipts', icon: APP_ICONS.stockReceipts, description: 'Goods intake & receiving' },
        { key: 'stock_transfers', label: 'Stock Transfers', icon: APP_ICONS.stockTransfers, description: 'Branch-to-branch transfers' },
        { key: 'expenses', label: 'Expenses', icon: APP_ICONS.expenses, description: 'Operating expense vouchers' },
      ],
    },
    {
      key: 'inventory',
      label: 'Inventory',
      icon: APP_ICONS.inventory,
      subViews: [
        { key: 'products', label: 'Products', icon: APP_ICONS.products, description: 'Product catalog & SKUs' },
        { key: 'stock', label: 'Stock Levels', icon: APP_ICONS.stock, description: 'Store inventory balances' },
        { key: 'stock_movements', label: 'Stock Movements', icon: APP_ICONS.stockMovements, description: 'Immutable stock ledger' },
        { key: 'damages', label: 'Damages & Loss', icon: APP_ICONS.damages, description: 'Spoilage & missing stock' },
      ],
    },
    {
      key: 'branches',
      label: 'Branches',
      icon: APP_ICONS.branches,
      subViews: [
        { key: 'branches', label: 'Branches', icon: APP_ICONS.branchList, description: 'Regional branch locations' },
        { key: 'stores', label: 'Stores', icon: APP_ICONS.stores, description: 'Warehouses & sales stores' },
        { key: 'vehicles', label: 'Vehicles', icon: APP_ICONS.vehicles, description: 'Delivery lorries & tuk-tuks' },
      ],
    },
    {
      key: 'people',
      label: 'People',
      icon: APP_ICONS.people,
      subViews: [
        { key: 'workers', label: 'Workers', icon: APP_ICONS.workers, description: 'Staff directory & profiles' },
        { key: 'departments', label: 'Departments', icon: APP_ICONS.departments, description: 'Organizational departments' },
        { key: 'users', label: 'Users', icon: APP_ICONS.users, description: 'User login credentials' },
        { key: 'roles', label: 'Roles & Permissions', icon: APP_ICONS.roles, description: 'RBAC security policies' },
      ],
    },
    {
      key: 'finance',
      label: 'Finance',
      icon: APP_ICONS.finance,
      subViews: [
        { key: 'sales_ledger', label: 'Sales Ledger', icon: APP_ICONS.sales, description: 'POS & Field revenue records' },
        { key: 'cash', label: 'Cash Accounts', icon: APP_ICONS.cash, description: 'Cash drawer balances' },
        { key: 'bank_mobile', label: 'Bank & Mobile Money', icon: APP_ICONS.bank, description: 'Digital & bank payments' },
        { key: 'debts', label: 'Debts & Recovery', icon: APP_ICONS.debts, description: 'Worker shortages & credit' },
        { key: 'salaries', label: 'Salary Processing', icon: APP_ICONS.salaries, description: 'Monthly payroll & commissions' },
      ],
    },
    {
      key: 'reports',
      label: 'Reports',
      icon: APP_ICONS.reports,
      subViews: [
        { key: 'sales_reports', label: 'Sales Reports', icon: APP_ICONS.salesReports, description: 'Revenue & product performance' },
        { key: 'stock_reports', label: 'Stock Reports', icon: APP_ICONS.stockReports, description: 'Valuation & movement analytics' },
        { key: 'financial_reports', label: 'Financial Reports', icon: APP_ICONS.financialReports, description: 'P&L, expenses & debt ledgers' },
        { key: 'audit_reports', label: 'Audit Reports', icon: APP_ICONS.auditReports, description: 'System audit trail logs' },
      ],
    },
    {
      key: 'system',
      label: 'System',
      icon: APP_ICONS.system,
      subViews: [
        { key: 'backups', label: 'Cloud Data Backups', icon: APP_ICONS.backups, description: 'Export snapshots & disaster recovery' },
        { key: 'admin_config', label: 'Master Configuration', icon: APP_ICONS.settings, description: 'Code-free system settings' },
        { key: 'audit_log', label: 'Audit Log', icon: APP_ICONS.auditLog, description: 'Security & action records' },
        { key: 'devices', label: 'Registered Devices', icon: APP_ICONS.devices, description: 'Authorized POS hardware' },
      ],
    },
  ];

  const handleSelectSubView = (domain: NavDomain, subView: string) => {
    onSelectNav({ domain, subView });
    setOpenDropdown(null);
    setIsMobileMenuOpen(false);
  };

  const currentBranch = branches.find((b) => b.id === currentBranchId);
  const currentStore = stores.find((s) => s.id === currentStoreId);

  return (
    <header className="bg-slate-950 border-b border-slate-800 text-slate-100 select-none sticky top-0 z-50 shadow-md">
      <div className="max-w-[1500px] mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2">
        
        {/* Brand & Store Selector */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            onClick={() => onSelectNav({ domain: 'dashboard', subView: 'overview' })}
            className="flex items-center gap-2 text-cyan-400 font-extrabold text-base sm:text-lg tracking-tight cursor-pointer"
          >
            <div className="p-1 sm:p-1.5 bg-cyan-950/90 rounded-xl border border-cyan-500/30 text-cyan-400">
              <LogoIcon className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
            </div>
            <span>AQUA<span className="text-slate-300">POS</span></span>
          </div>

          <div className="h-5 w-px bg-slate-800 hidden md:block" />

          {/* Dynamic Branch Picker (Desktop/Tablet) */}
          <div className="hidden md:flex items-center gap-1.5 text-[11px] bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1">
            <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-slate-400 font-medium">Branch:</span>
            <select
              value={currentBranchId}
              onChange={(e) => {
                const newBranchId = e.target.value;
                const branchStores = stores.filter((s) => s.branchId === newBranchId);
                const firstStoreId = branchStores[0]?.id || '';
                setStore(newBranchId, firstStoreId);
              }}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer text-[11px] max-w-[120px] lg:max-w-none truncate"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id} className="bg-slate-900 text-slate-200">
                  {b.name} ({b.code})
                </option>
              ))}
              {branches.length === 0 && (
                <option value="" className="bg-slate-900 text-slate-400">
                  No Branches Configured
                </option>
              )}
            </select>
          </div>

          {/* Dynamic Store Picker (Desktop/Tablet) */}
          <div className="hidden md:flex items-center gap-1.5 text-[11px] bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1">
            <Store className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-slate-400 font-medium">Store:</span>
            <select
              value={currentStoreId}
              onChange={(e) => {
                const newStoreId = e.target.value;
                const selectedStore = stores.find((s) => s.id === newStoreId);
                setStore(selectedStore?.branchId || currentBranchId, newStoreId);
              }}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer text-[11px] max-w-[120px] lg:max-w-none truncate"
            >
              {stores
                .filter((s) => !currentBranchId || s.branchId === currentBranchId)
                .map((st) => (
                  <option key={st.id} value={st.id} className="bg-slate-900 text-slate-200">
                    {st.name} ({st.type})
                  </option>
                ))}
              {stores.filter((s) => !currentBranchId || s.branchId === currentBranchId).length === 0 && (
                <option value="" className="bg-slate-900 text-slate-400">
                  No Stores in Branch
                </option>
              )}
            </select>
          </div>
        </div>

        {/* 8 Business Domain Navigation Tabs (Desktop screens >= 1024px) */}
        <nav className="hidden xl:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800/80 relative" ref={dropdownRef}>
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
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isDomainActive
                      ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-900/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <IconComponent className="w-3.5 h-3.5" />
                  <span>{domain.label}</span>
                  {!isSingleView && (
                    <ChevronDown
                      className={`w-3 h-3 transition-transform ${openDropdown === domain.key ? 'rotate-180 text-cyan-200' : 'text-slate-500'}`}
                    />
                  )}
                </button>

                {/* Sub-menu Dropdown Popup */}
                {!isSingleView && openDropdown === domain.key && (
                  <div className="absolute top-full left-0 mt-1.5 w-60 bg-slate-900 border border-slate-800 rounded-2xl p-1.5 shadow-2xl z-50 animate-fade-in space-y-1">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1 border-b border-slate-800/60 mb-0.5">
                      {domain.label} Options
                    </div>
                    {domain.subViews.map((sub) => {
                      const SubIcon = sub.icon;
                      const isSubActive = currentNav.domain === domain.key && currentNav.subView === sub.key;

                      return (
                        <button
                          key={sub.key}
                          onClick={() => handleSelectSubView(domain.key, sub.key)}
                          className={`w-full flex items-start gap-2 p-1.5 rounded-xl text-left transition-all cursor-pointer ${
                            isSubActive
                              ? 'bg-cyan-950/80 border border-cyan-500/40 text-cyan-300'
                              : 'hover:bg-slate-800/60 text-slate-300'
                          }`}
                        >
                          <div className={`p-1 rounded-lg my-auto ${isSubActive ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                            <SubIcon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold">{sub.label}</div>
                            {sub.description && <div className="text-[10px] text-slate-400">{sub.description}</div>}
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

        {/* Right Action Bar (Network Status, User Profile, Mobile Hamburger) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* User Badge (Desktop) */}
          <div className="hidden lg:flex items-center gap-2 text-[11px] bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1">
            <UserCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <div className="leading-tight">
              <div className="font-semibold text-slate-200 truncate max-w-[100px]">{user?.fullName}</div>
              <div className="text-[9px] text-slate-400">{user?.role}</div>
            </div>
          </div>

          {/* Desktop Logout Button */}
          <button
            onClick={() => setShowLogoutModal(true)}
            className="hidden sm:flex items-center gap-1.5 bg-rose-950/80 hover:bg-rose-900/90 border border-rose-800/50 text-rose-300 px-2.5 sm:px-3 py-1 rounded-xl text-[11px] font-bold transition-all shadow-sm shadow-rose-950 cursor-pointer"
            title="Sign out of current user account"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Logout</span>
          </button>

          {/* Mobile/Tablet Hamburger Menu Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="xl:hidden p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-all flex items-center justify-center cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-cyan-400" /> : <Menu className="w-5 h-5 text-slate-200" />}
          </button>
        </div>

      </div>

      {/* Mobile Navigation Drawer / Off-Canvas Sheet */}
      {isMobileMenuOpen && (
        <div className="xl:hidden fixed inset-0 top-[53px] z-50 bg-slate-950/90 backdrop-blur-md flex flex-col justify-between animate-fade-in border-t border-slate-800 overflow-y-auto">
          <div className="p-4 space-y-4 max-w-lg mx-auto w-full">
            
            {/* User Account & Status Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-950 rounded-xl border border-cyan-500/30 text-cyan-400">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-100 text-sm">{user?.fullName}</div>
                  <div className="text-[11px] text-cyan-400 font-mono">
                    @{user?.username} • <span className="text-amber-300">{user?.role}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setShowLogoutModal(true);
                }}
                className="p-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-800/50 text-rose-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Branch & Store Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-1 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-cyan-400" /> Active Branch
                </label>
                <select
                  value={currentBranchId}
                  onChange={(e) => {
                    const newBranchId = e.target.value;
                    const branchStores = stores.filter((s) => s.branchId === newBranchId);
                    const firstStoreId = branchStores[0]?.id || '';
                    setStore(newBranchId, firstStoreId);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-semibold focus:outline-none"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-1 flex items-center gap-1">
                  <Store className="w-3 h-3 text-emerald-400" /> Active Store
                </label>
                <select
                  value={currentStoreId}
                  onChange={(e) => {
                    const newStoreId = e.target.value;
                    const selectedStore = stores.find((s) => s.id === newStoreId);
                    setStore(selectedStore?.branchId || currentBranchId, newStoreId);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-semibold focus:outline-none"
                >
                  {stores
                    .filter((s) => !currentBranchId || s.branchId === currentBranchId)
                    .map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.type})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Business Domain Menu Accordions */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                Business Navigation
              </div>

              {domainConfigs
                .filter((domain) => canAccessDomain(user?.role, domain.key))
                .map((domain) => {
                  const DomainIcon = domain.icon;
                  const isDomainActive = currentNav.domain === domain.key;
                  const isExpanded = mobileExpandedDomain === domain.key;
                  const isSingleView = domain.subViews.length === 1;

                  return (
                    <div key={domain.key} className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden">
                      <button
                        onClick={() => {
                          if (isSingleView) {
                            handleSelectSubView(domain.key, domain.subViews[0].key);
                          } else {
                            setMobileExpandedDomain(isExpanded ? null : domain.key);
                          }
                        }}
                        className={`w-full flex items-center justify-between p-3 text-xs font-bold transition-all cursor-pointer ${
                          isDomainActive
                            ? 'bg-cyan-950/60 text-cyan-300'
                            : 'text-slate-300 hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-lg ${isDomainActive ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                            <DomainIcon className="w-4 h-4" />
                          </div>
                          <span>{domain.label}</span>
                        </div>
                        {!isSingleView && (
                          <ChevronDown
                            className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180 text-cyan-400' : ''}`}
                          />
                        )}
                      </button>

                      {/* Sub-items */}
                      {isExpanded && !isSingleView && (
                        <div className="p-2 pt-0 space-y-1 bg-slate-950/50 border-t border-slate-800/60">
                          {domain.subViews.map((sub) => {
                            const SubIcon = sub.icon;
                            const isSubActive = currentNav.domain === domain.key && currentNav.subView === sub.key;

                            return (
                              <button
                                key={sub.key}
                                onClick={() => handleSelectSubView(domain.key, sub.key)}
                                className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left text-xs transition-all cursor-pointer ${
                                  isSubActive
                                    ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-950'
                                    : 'text-slate-300 hover:bg-slate-800/60 font-medium'
                                }`}
                              >
                                <SubIcon className="w-3.5 h-3.5 shrink-0" />
                                <div className="flex-1">
                                  <div>{sub.label}</div>
                                  {sub.description && (
                                    <div className={`text-[10px] ${isSubActive ? 'text-cyan-100' : 'text-slate-400'}`}>
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

          <div className="p-4 border-t border-slate-900 bg-slate-950 text-center text-[10px] text-slate-500">
            AQUAPOS Mobile • Offline First Engine
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <ShieldAlert className="w-4 h-4" />
                <span>Confirm User Sign Out</span>
              </div>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl space-y-1">
              <div className="text-xs font-bold text-slate-100">{user?.fullName}</div>
              <div className="text-[10px] text-slate-400 font-mono">
                Username: <span className="text-cyan-400 font-semibold">{user?.username}</span> | Role: <span className="text-amber-300">{user?.role}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to sign out? You will need to enter your username and password credentials to log back in.
            </p>

            <div className="border-t border-slate-800 pt-3 flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setUser(null, null);
                  setShowLogoutModal(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all shadow-md shadow-rose-950 cursor-pointer"
              >
                Sign Out Now
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

