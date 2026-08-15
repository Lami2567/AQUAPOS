import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { BRAND_ASSETS, APP_ICONS } from '../config/assets.config';
import { UserRole, User } from '@water-business/shared-types';
import { canAccessDomain } from '../utils/rbac';
import {
  ChevronDown,
  Wifi,
  WifiOff,
  UserCheck,
  RefreshCw,
  AlertCircle,
  LogOut,
  KeyRound,
  ShieldAlert,
  CheckCircle,
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
  const { user, isOnline, syncStatus, pendingSyncCount, currentStoreId, setStore, setOnlineStatus, setUser, usersList } = useStore();
  const [openDropdown, setOpenDropdown] = useState<NavDomain | null>(null);
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
        { key: 'sync', label: 'Synchronization', icon: APP_ICONS.synchronization, description: 'Offline outbox & sync queue' },
        { key: 'backups', label: 'Data Backups', icon: APP_ICONS.backups, description: 'Database backup & restores' },
        { key: 'devices', label: 'Registered Devices', icon: APP_ICONS.devices, description: 'Authorized POS hardware' },
        { key: 'admin_config', label: 'Master Configuration', icon: APP_ICONS.settings, description: 'Code-free system settings' },
        { key: 'audit_log', label: 'Audit Log', icon: APP_ICONS.auditLog, description: 'Security & action records' },
      ],
    },
  ];

  // Predefined role profile switcher options
  const roleProfiles: { role: UserRole; username: string; name: string }[] = [
    { role: UserRole.SUPER_ADMIN, username: 'admin', name: 'System Super Administrator' },
    { role: UserRole.BRANCH_MANAGER, username: 'mgr_lwengo', name: 'Lwengo Branch Manager' },
    { role: UserRole.STOREKEEPER, username: 'storekeeper_a', name: 'Lwengo Storekeeper C' },
    { role: UserRole.CASHIER, username: 'cashier_isingiro', name: 'Isingiro Cashier B' },
    { role: UserRole.FIELD_SALESPERSON, username: 'sales_worker_a', name: 'Lwengo Field Representative A' },
    { role: UserRole.ACCOUNTANT, username: 'accountant_01', name: 'Lead Finance Accountant' },
    { role: UserRole.AUDITOR, username: 'auditor_01', name: 'Internal Auditor' },
  ];

  const handleSwitchUserRole = (profile: { role: UserRole; username: string; name: string }) => {
    const existing = usersList.find((u) => u.username === profile.username);
    const selectedUser: User = existing || {
      id: `u-${profile.username}`,
      username: profile.username,
      fullName: profile.name,
      role: profile.role,
      branchId: 'b1111111-1111-1111-1111-111111111111',
      storeId: 's1111111-1111-1111-1111-111111111111',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setUser(selectedUser, 'mock-jwt-token-2026');
    setShowLogoutModal(false);
  };

  return (
    <header className="bg-slate-950 border-b border-slate-800 text-slate-100 select-none sticky top-0 z-50 shadow-md">
      <div className="max-w-[1500px] mx-auto px-3 py-2 flex flex-wrap items-center justify-between gap-2">
        
        {/* Brand & Store Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-cyan-400 font-extrabold text-lg tracking-tight">
            <div className="p-1.5 bg-cyan-950/90 rounded-xl border border-cyan-500/30 text-cyan-400">
              <LogoIcon className="w-5 h-5 animate-pulse" />
            </div>
            <span>AQUA<span className="text-slate-300">POS</span></span>
          </div>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          {/* Store Picker */}
          <div className="flex items-center gap-1.5 text-[11px] bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1">
            <span className="text-slate-400 font-medium">Store:</span>
            <select
              value={currentStoreId}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 's1111111-1111-1111-1111-111111111111') {
                  setStore('b1111111-1111-1111-1111-111111111111', val);
                } else {
                  setStore('b2222222-2222-2222-2222-222222222222', val);
                }
              }}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer text-[11px]"
            >
              <option value="s1111111-1111-1111-1111-111111111111" className="bg-slate-900">
                Lwengo Main Store
              </option>
              <option value="s2222222-2222-2222-2222-222222222222" className="bg-slate-900">
                Isingiro Main Store
              </option>
              <option value="s3333333-3333-3333-3333-333333333333" className="bg-slate-900">
                Isingiro Retail Sales Store
              </option>
            </select>
          </div>
        </div>

        {/* 8 Business Domain Navigation Tabs - Role Based Access Control Filtered */}
        <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800/80 relative" ref={dropdownRef}>
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
                      onSelectNav({ domain: domain.key, subView: domain.subViews[0].key });
                      setOpenDropdown(null);
                    } else {
                      setOpenDropdown(openDropdown === domain.key ? null : domain.key);
                    }
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap ${
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
                          onClick={() => {
                            onSelectNav({ domain: domain.key, subView: sub.key });
                            setOpenDropdown(null);
                          }}
                          className={`w-full flex items-start gap-2 p-1.5 rounded-xl text-left transition-all ${
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

        {/* Network & User Status + Logout Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (syncStatus === 'FAILED' || pendingSyncCount > 0) {
                onSelectNav({ domain: 'system', subView: 'sync' });
              } else {
                setOnlineStatus(!isOnline);
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all border ${
              !isOnline
                ? 'bg-amber-950/80 border-amber-500/40 text-amber-400'
                : syncStatus === 'SYNCING'
                ? 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300 animate-pulse'
                : syncStatus === 'FAILED'
                ? 'bg-rose-950/80 border-rose-500/50 text-rose-300 shadow-md shadow-rose-900/30'
                : 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400'
            }`}
            title={syncStatus === 'FAILED' ? 'Click to inspect sync errors' : 'Click to toggle network simulation'}
          >
            {!isOnline ? (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span>OFFLINE ({pendingSyncCount})</span>
              </>
            ) : syncStatus === 'SYNCING' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>SYNCING...</span>
              </>
            ) : syncStatus === 'FAILED' ? (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>SYNC ERROR ({pendingSyncCount || 3})</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5" />
                <span>SYNCED</span>
              </>
            )}
          </button>

          {/* User Badge */}
          <div className="flex items-center gap-2 text-[11px] bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1">
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            <div className="leading-tight">
              <div className="font-semibold text-slate-200 truncate max-w-[110px]">{user?.fullName}</div>
              <div className="text-[9px] text-slate-400">{user?.role}</div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-1.5 bg-rose-950/80 hover:bg-rose-900/90 border border-rose-800/50 text-rose-300 px-3 py-1 rounded-xl text-[11px] font-bold transition-all shadow-sm shadow-rose-950"
            title="Sign out of current user account"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <ShieldAlert className="w-4 h-4" />
                <span>Confirm User Sign Out</span>
              </div>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-bold"
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
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setUser(null, null);
                  setShowLogoutModal(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all shadow-md shadow-rose-950"
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
