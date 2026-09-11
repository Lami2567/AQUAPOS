import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { canAccessDomain } from '../utils/rbac';
import {
  Building2,
  Store,
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
  Settings,
  Users,
  FileSpreadsheet,
  Wifi,
  ChevronRight,
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

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [currentNav.domain, currentNav.subView]);

  // Current Store / Branch names
  const activeBranch = branches.find((b) => b.id === currentBranchId);
  const activeStore = stores.find((s) => s.id === currentStoreId);

  // All 10 Core Business Modules in Plain, Easy-to-Understand Language
  const navigationMenuItems: {
    id: string;
    label: string;
    icon: React.ElementType;
    domain: NavDomain;
    subView: string;
  }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      domain: 'dashboard',
      subView: 'overview',
    },
    {
      id: 'pos',
      label: 'Point of Sale (POS)',
      icon: ShoppingCart,
      domain: 'operations',
      subView: 'pos',
    },
    {
      id: 'field_sales',
      label: 'Field Sales',
      icon: Truck,
      domain: 'operations',
      subView: 'field_sales',
    },
    {
      id: 'stock',
      label: 'Current Stock',
      icon: Package,
      domain: 'inventory',
      subView: 'stock',
    },
    {
      id: 'expenses',
      label: 'Expenses',
      icon: Receipt,
      domain: 'operations',
      subView: 'expenses',
    },
    {
      id: 'debts',
      label: 'Debts & Credit',
      icon: FileSpreadsheet,
      domain: 'finance',
      subView: 'debts',
    },
    {
      id: 'workers',
      label: 'Staff & Payroll',
      icon: Users,
      domain: 'people',
      subView: 'workers',
    },
    {
      id: 'stores',
      label: 'Stores & Vehicles',
      icon: Store,
      domain: 'branches',
      subView: 'stores',
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      icon: BarChart3,
      domain: 'reports',
      subView: 'sales_reports',
    },
    {
      id: 'settings',
      label: 'System Settings',
      icon: Settings,
      domain: 'system',
      subView: 'admin_config',
    },
  ];

  return (
    <>
      <header className="bg-[#070E24] border-b border-white/15 text-white select-none sticky top-0 z-40 shadow-2xl">
        {/* ========================================================================= */}
        {/* MENU 1: TOP APPLICATION BAR (Brand, Store Context, Status, User & Logout) */}
        {/* ========================================================================= */}
        <div className="bg-[#0A122E] border-b border-white/10">
          <div className="max-w-[1700px] mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4">
            
            {/* Left: Brand Logo & Name */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                onClick={() => onSelectNav({ domain: 'dashboard', subView: 'overview' })}
                className="flex items-center gap-2 sm:gap-2.5 text-white font-black text-base sm:text-xl tracking-tight cursor-pointer hover:opacity-90 transition-opacity"
              >
                <div className="p-1.5 sm:p-2 bg-white/10 rounded-xl border border-white/20 text-white shadow-md flex items-center justify-center">
                  <Droplets className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse" />
                </div>
                <div className="text-left leading-none">
                  <span className="tracking-wider text-base sm:text-lg font-black">
                    AQUA<span className="text-white/80 font-normal">POS</span>
                  </span>
                  <span className="hidden sm:block text-[9px] uppercase tracking-widest text-white/60 font-semibold mt-0.5">
                    Water System
                  </span>
                </div>
              </button>
            </div>

            {/* Mobile Store Quick Switcher Button (Visible on mobile screens) */}
            <div className="flex lg:hidden items-center gap-1.5 max-w-[180px] sm:max-w-xs">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="flex items-center gap-1.5 bg-[#0F1B3E] hover:bg-[#13224E] border border-white/20 rounded-xl px-2.5 py-1 text-xs text-white font-bold transition-all truncate"
                title="Tap to switch store or branch"
              >
                <Store className="w-3.5 h-3.5 text-white shrink-0" />
                <span className="truncate text-[11px] sm:text-xs">
                  {activeStore ? activeStore.name : 'Switch Store'}
                </span>
              </button>
            </div>

            {/* Desktop Center: Branch & Store Switchers (Visible on desktop / laptops) */}
            <div className="hidden lg:flex items-center gap-2.5">
              {/* Branch Switcher */}
              <div className="flex items-center gap-2 text-xs bg-[#0F1B3E] hover:bg-[#13224E] border border-white/15 rounded-xl px-3 py-1.5 transition-colors">
                <Building2 className="w-4 h-4 text-white shrink-0" />
                <span className="text-white/60 font-medium">Branch:</span>
                <select
                  value={currentBranchId}
                  onChange={(e) => {
                    const newBranchId = e.target.value;
                    const branchStores = stores.filter((s) => s.branchId === newBranchId);
                    const firstStoreId = branchStores[0]?.id || '';
                    setStore(newBranchId, firstStoreId);
                  }}
                  className="bg-transparent text-white font-bold focus:outline-none cursor-pointer text-xs max-w-[150px] truncate"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id} className="bg-[#0A122E] text-white">
                      {b.name} ({b.code})
                    </option>
                  ))}
                  {branches.length === 0 && (
                    <option value="" className="bg-[#0A122E] text-white">
                      All Branches
                    </option>
                  )}
                </select>
              </div>

              {/* Store Switcher */}
              <div className="flex items-center gap-2 text-xs bg-[#0F1B3E] hover:bg-[#13224E] border border-white/15 rounded-xl px-3 py-1.5 transition-colors">
                <Store className="w-4 h-4 text-white shrink-0" />
                <span className="text-white/60 font-medium">Store:</span>
                <select
                  value={currentStoreId}
                  onChange={(e) => {
                    const newStoreId = e.target.value;
                    const selectedStore = stores.find((s) => s.id === newStoreId);
                    setStore(selectedStore?.branchId || currentBranchId, newStoreId);
                  }}
                  className="bg-transparent text-white font-bold focus:outline-none cursor-pointer text-xs max-w-[160px] truncate"
                >
                  {stores
                    .filter((s) => !currentBranchId || s.branchId === currentBranchId)
                    .map((st) => (
                      <option key={st.id} value={st.id} className="bg-[#0A122E] text-white">
                        {st.name} ({st.type})
                      </option>
                    ))}
                  {stores.length === 0 && (
                    <option value="" className="bg-[#0A122E] text-white">
                      All Stores
                    </option>
                  )}
                </select>
              </div>
            </div>

            {/* Right: Cloud Status, User Profile, Sign Out Button */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Cloud Sync Status */}
              <div className="hidden sm:flex items-center gap-2 text-xs bg-white/10 border border-white/15 rounded-xl px-3 py-1.5">
                <Wifi className="w-3.5 h-3.5 text-white animate-pulse" />
                <span className="text-white/90 font-medium">Cloud Online</span>
              </div>

              {/* User Profile Badge (Desktop & Tablet) */}
              <div className="hidden sm:flex items-center gap-2 text-xs bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 shadow-sm">
                <UserCheck className="w-4 h-4 text-white shrink-0" />
                <div className="leading-tight text-left">
                  <div className="font-extrabold text-white truncate max-w-[110px] sm:max-w-[140px]">
                    {user?.fullName || user?.username}
                  </div>
                  <div className="text-[10px] text-white/70 font-semibold tracking-wider uppercase">
                    {user?.role}
                  </div>
                </div>
              </div>

              {/* Sign Out Button */}
              <button
                onClick={() => setShowLogoutModal(true)}
                className="hidden sm:flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                title="Sign out of system"
              >
                <LogOut className="w-4 h-4 text-white" />
                <span>Sign Out</span>
              </button>

              {/* Mobile Hamburger Drawer Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all flex items-center justify-center cursor-pointer shadow-md"
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
              </button>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* MENU 2: SYSTEM NAVIGATION STRIP (Visible on Desktop / Tablets)            */}
        {/* ========================================================================= */}
        <div className="hidden md:block bg-[#070E24] border-t border-white/10">
          <div className="max-w-[1700px] mx-auto px-2 sm:px-4">
            <nav className="flex items-center gap-1 sm:gap-1.5 py-1.5 overflow-x-auto no-scrollbar scroll-smooth">
              {navigationMenuItems
                .filter((item) => canAccessDomain(user?.role, item.domain))
                .map((item) => {
                  const IconComponent = item.icon;
                  const isSelected =
                    currentNav.domain === item.domain &&
                    (item.subView === '' || currentNav.subView === item.subView || currentNav.subView.startsWith(item.subView));

                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectNav({ domain: item.domain, subView: item.subView })}
                      className={`flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                        isSelected
                          ? 'bg-white/20 text-white border border-white/40 shadow-lg font-black'
                          : 'text-white/80 hover:text-white hover:bg-white/10 border border-transparent'
                      }`}
                    >
                      <IconComponent className="w-4 h-4 text-white" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
            </nav>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MOBILE BOTTOM NAVIGATION BAR (Fixed at bottom for 1-thumb touch access)    */}
      {/* ========================================================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A122E]/98 backdrop-blur-xl border-t border-white/15 px-2 py-1.5 flex items-center justify-around shadow-2xl">
        {/* Tab 1: Overview */}
        <button
          onClick={() => onSelectNav({ domain: 'dashboard', subView: 'overview' })}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            currentNav.domain === 'dashboard'
              ? 'bg-white/20 text-white border border-white/30 font-black shadow'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 text-white" />
          <span className="text-[10px] mt-0.5 font-bold">Overview</span>
        </button>

        {/* Tab 2: POS */}
        <button
          onClick={() => onSelectNav({ domain: 'operations', subView: 'pos' })}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            currentNav.domain === 'operations' && currentNav.subView === 'pos'
              ? 'bg-white/20 text-white border border-white/30 font-black shadow'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <ShoppingCart className="w-5 h-5 text-white" />
          <span className="text-[10px] mt-0.5 font-bold">POS</span>
        </button>

        {/* Tab 3: Field Sales */}
        <button
          onClick={() => onSelectNav({ domain: 'operations', subView: 'field_sales' })}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            currentNav.domain === 'operations' && (currentNav.subView === 'field_sales' || currentNav.subView === 'field_sessions')
              ? 'bg-white/20 text-white border border-white/30 font-black shadow'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Truck className="w-5 h-5 text-white" />
          <span className="text-[10px] mt-0.5 font-bold">Field</span>
        </button>

        {/* Tab 4: Current Stock */}
        <button
          onClick={() => onSelectNav({ domain: 'inventory', subView: 'stock' })}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            currentNav.domain === 'inventory'
              ? 'bg-white/20 text-white border border-white/30 font-black shadow'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Package className="w-5 h-5 text-white" />
          <span className="text-[10px] mt-0.5 font-bold">Stock</span>
        </button>

        {/* Tab 5: All Menu (Opens Full Drawer) */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            isMobileMenuOpen || (!['dashboard', 'inventory'].includes(currentNav.domain) && currentNav.subView !== 'pos' && currentNav.subView !== 'field_sales')
              ? 'bg-white/20 text-white border border-white/30 font-black shadow'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Menu className="w-5 h-5 text-white" />
          <span className="text-[10px] mt-0.5 font-bold">Menu</span>
        </button>
      </nav>

      {/* ========================================================================= */}
      {/* MOBILE FULL-SCREEN DRAWER (Spacious, easy-to-tap, responsive for all phones) */}
      {/* ========================================================================= */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-[#070E24] flex flex-col justify-between overflow-y-auto animate-fade-in">
          <div className="p-4 sm:p-5 space-y-4 max-w-lg mx-auto w-full">
            
            {/* Mobile Drawer Top Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/15">
              <div className="flex items-center gap-2 text-white font-black text-base">
                <div className="p-1.5 bg-white/10 rounded-xl border border-white/20">
                  <Droplets className="w-4 h-4 text-white" />
                </div>
                <span>AQUAPOS Menu</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Mobile User Profile Card */}
            <div className="bg-[#0F1B3E] border border-white/15 rounded-2xl p-3.5 flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-xl border border-white/20 text-white">
                  <UserCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">{user?.fullName || user?.username}</div>
                  <div className="text-[11px] text-white/70 font-mono">
                    Role: <span className="text-white font-bold">{user?.role}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setShowLogoutModal(true);
                }}
                className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                title="Sign out"
              >
                <LogOut className="w-4 h-4 text-white" />
                <span>Exit</span>
              </button>
            </div>

            {/* Mobile Branch & Store Switchers (Large easy touch dropdowns) */}
            <div className="bg-[#0F1B3E] p-3.5 rounded-2xl border border-white/15 shadow-lg space-y-3">
              <div>
                <label className="text-xs text-white/80 uppercase tracking-wider font-bold mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-white" /> Active Branch
                </label>
                <select
                  value={currentBranchId}
                  onChange={(e) => {
                    const newBranchId = e.target.value;
                    const branchStores = stores.filter((s) => s.branchId === newBranchId);
                    const firstStoreId = branchStores[0]?.id || '';
                    setStore(newBranchId, firstStoreId);
                  }}
                  className="w-full bg-[#070E24] border border-white/20 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none cursor-pointer"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id} className="bg-[#070E24] text-white">
                      {b.name} ({b.code})
                    </option>
                  ))}
                  {branches.length === 0 && (
                    <option value="" className="bg-[#070E24] text-white">All Branches</option>
                  )}
                </select>
              </div>

              <div>
                <label className="text-xs text-white/80 uppercase tracking-wider font-bold mb-1 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-white" /> Active Store
                </label>
                <select
                  value={currentStoreId}
                  onChange={(e) => {
                    const newStoreId = e.target.value;
                    const selectedStore = stores.find((s) => s.id === newStoreId);
                    setStore(selectedStore?.branchId || currentBranchId, newStoreId);
                  }}
                  className="w-full bg-[#070E24] border border-white/20 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none cursor-pointer"
                >
                  {stores
                    .filter((s) => !currentBranchId || s.branchId === currentBranchId)
                    .map((st) => (
                      <option key={st.id} value={st.id} className="bg-[#070E24] text-white">
                        {st.name} ({st.type})
                      </option>
                    ))}
                  {stores.length === 0 && (
                    <option value="" className="bg-[#070E24] text-white">All Stores</option>
                  )}
                </select>
              </div>
            </div>

            {/* Mobile Navigation List (All 10 modules in comfortable touch rows) */}
            <div className="space-y-1.5 pt-1">
              <div className="text-xs font-bold text-white/60 uppercase tracking-wider px-1 mb-1">
                System Modules
              </div>

              <div className="space-y-1.5">
                {navigationMenuItems
                  .filter((item) => canAccessDomain(user?.role, item.domain))
                  .map((item) => {
                    const IconComponent = item.icon;
                    const isSelected = currentNav.domain === item.domain && (item.subView === '' || currentNav.subView === item.subView || currentNav.subView.startsWith(item.subView));

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onSelectNav({ domain: item.domain, subView: item.subView });
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white/20 text-white border border-white/40 shadow-md font-black'
                            : 'bg-[#0F1B3E] hover:bg-[#13224E] border border-white/10 text-white/90'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${isSelected ? 'bg-white/20' : 'bg-white/10'}`}>
                            <IconComponent className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-xs sm:text-sm font-bold">{item.label}</span>
                        </div>
                        <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-white/40'}`} />
                      </button>
                    );
                  })}
              </div>
            </div>

          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-white/10 bg-[#0A122E] text-center text-xs text-white/60 font-medium">
            AquaPOS Water Business Management System • All rights reserved
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#0A122E] border border-white/20 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/15 pb-3.5">
              <div className="flex items-center gap-2.5 text-white font-black text-base">
                <ShieldAlert className="w-5 h-5 text-white" />
                <span>Confirm Sign Out</span>
              </div>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="text-white/60 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#0F1B3E] border border-white/15 p-3.5 rounded-2xl space-y-1">
              <div className="text-sm font-black text-white">{user?.fullName || user?.username}</div>
              <div className="text-xs text-white/70 font-mono">
                Username: <span className="text-white font-bold">{user?.username}</span> | Role: <span className="text-white font-bold">{user?.role}</span>
              </div>
            </div>

            <p className="text-xs text-white/80 leading-relaxed font-medium">
              Are you sure you want to sign out? Your current session will end safely.
            </p>

            <div className="border-t border-white/15 pt-4 flex items-center justify-end gap-2.5 text-xs">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setUser(null, null);
                  setShowLogoutModal(false);
                }}
                className="px-5 py-2.5 bg-white/20 hover:bg-white/35 text-white border border-white/40 font-black rounded-xl transition-all shadow-lg cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
