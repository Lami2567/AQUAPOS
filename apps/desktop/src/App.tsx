import React, { useState, useEffect } from 'react';
import { useStore } from './store/useStore';
import { UserRole } from '@water-business/shared-types';
import { Navbar, NavSelection } from './components/Navbar';
import { DashboardReportsView } from './components/DashboardReportsView';
import { PosView } from './components/PosView';
import { FieldSalesView } from './components/FieldSalesView';
import { StockView } from './components/StockView';
import { FinanceView } from './components/FinanceView';
import { SyncAuditView } from './components/SyncAuditView';
import { AdminConfigView } from './components/AdminConfigView';
import { LoginView } from './components/LoginView';

export const getDefaultNavForRole = (role?: UserRole): NavSelection => {
  switch (role) {
    case 'CASHIER':
      return { domain: 'operations', subView: 'pos' };
    case 'STOREKEEPER':
      return { domain: 'inventory', subView: 'stock' };
    case 'FIELD_SALESPERSON':
      return { domain: 'operations', subView: 'field_sales' };
    case 'ACCOUNTANT':
      return { domain: 'finance', subView: 'sales_ledger' };
    case 'AUDITOR':
      return { domain: 'reports', subView: 'sales_reports' };
    case 'BRANCH_MANAGER':
    case 'SUPER_ADMIN':
    default:
      return { domain: 'dashboard', subView: 'overview' };
  }
};

export const App: React.FC = () => {
  const { user } = useStore();
  const [currentNav, setCurrentNav] = useState<NavSelection>(() => getDefaultNavForRole(user?.role));

  // Automatically land user on their role's respective default interface upon login
  useEffect(() => {
    if (user) {
      setCurrentNav(getDefaultNavForRole(user.role));
    }
  }, [user?.id, user?.role]);

  // If user is signed out, render Login Authentication Portal
  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar currentNav={currentNav} onSelectNav={setCurrentNav} />
      
      <main className="flex-1">
        {currentNav.domain === 'dashboard' && <DashboardReportsView />}
        
        {currentNav.domain === 'operations' && (
          <>
            {currentNav.subView === 'pos' && <PosView />}
            {currentNav.subView === 'field_sales' && <FieldSalesView />}
            {currentNav.subView === 'field_sessions' && <FieldSalesView />}
            {currentNav.subView === 'stock_receipts' && <StockView />}
            {currentNav.subView === 'stock_transfers' && <StockView />}
            {currentNav.subView === 'expenses' && <FinanceView />}
          </>
        )}

        {currentNav.domain === 'inventory' && <StockView />}
        {currentNav.domain === 'branches' && <AdminConfigView />}
        {currentNav.domain === 'people' && <AdminConfigView />}
        {currentNav.domain === 'finance' && <FinanceView />}
        {currentNav.domain === 'reports' && <DashboardReportsView />}
        
        {currentNav.domain === 'system' && (
          <>
            {currentNav.subView === 'sync' && <SyncAuditView />}
            {currentNav.subView === 'admin_config' && <AdminConfigView />}
            {currentNav.subView === 'audit_log' && <SyncAuditView />}
            {currentNav.subView === 'backups' && <SyncAuditView />}
            {currentNav.subView === 'devices' && <SyncAuditView />}
          </>
        )}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-3 text-center text-xs text-slate-500">
        Water Business Management System v1.0.0 — Production-grade Offline-First Engine
      </footer>
    </div>
  );
};

export default App;
