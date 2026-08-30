import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { apiClient } from '../utils/api';
import { syncManager } from '../services/syncService';
import {
  Building2,
  Store,
  Briefcase,
  Users,
  ShieldCheck,
  Truck,
  Package,
  Tag,
  DollarSign,
  CreditCard,
  Receipt,
  FileSpreadsheet,
  Coins,
  Settings,
  Plus,
  Edit,
  Search,
  CheckCircle,
  XCircle,
  Layers,
  Save,
  Check,
  KeyRound,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

type AdminTab =
  | 'branches'
  | 'stores'
  | 'departments'
  | 'workers'
  | 'users'
  | 'roles'
  | 'vehicles'
  | 'products'
  | 'categories'
  | 'prices'
  | 'payment_methods'
  | 'expense_types'
  | 'debt_types'
  | 'salary_settings'
  | 'system_settings';

export const AdminConfigView: React.FC = () => {
  const {
    user,
    branches,
    stores,
    departments,
    workers,
    usersList,
    rolesList,
    vehicles,
    products,
    categories,
    branchPrices,
    paymentMethodsList,
    expenseTypes,
    debtTypes,
    salarySettings,
    systemSettings,
    saveBranchInStore,
    deleteBranchFromStore,
    saveStoreInStore,
    deleteStoreFromStore,
    saveDepartmentInStore,
    deleteDepartmentFromStore,
    saveWorkerInStore,
    deleteWorkerFromStore,
    saveUserInStore,
    deleteUserFromStore,
    saveRoleInStore,
    deleteRoleFromStore,
    saveVehicleInStore,
    deleteVehicleFromStore,
    saveProductInStore,
    deleteProductFromStore,
    saveCategoryInStore,
    deleteCategoryFromStore,
    saveBranchPriceInStore,
    deleteBranchPriceFromStore,
    savePaymentMethodInStore,
    deletePaymentMethodFromStore,
    saveExpenseTypeInStore,
    deleteExpenseTypeFromStore,
    saveDebtTypeInStore,
    deleteDebtTypeFromStore,
    saveSalarySettingInStore,
    deleteSalarySettingFromStore,
    saveSystemSettingInStore,
    deleteSystemSettingFromStore,
    resetProductionData,
  } = useStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('branches');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isResetConfirmModalOpen, setIsResetConfirmModalOpen] = useState(false);
  const [clearDemoMaster, setClearDemoMaster] = useState(false);
  const [adminUsernameInput, setAdminUsernameInput] = useState(() => user?.username || 'ismael');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminConfirmPasswordInput, setAdminConfirmPasswordInput] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (user?.username) {
      setAdminUsernameInput(user.username);
    }
  }, [user?.username]);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDelete = async (tab: AdminTab, id: string, name?: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete this ${tab.slice(0, -1).replace('_', ' ')} (${name || id})? This will be removed from local storage and the central database.`)) {
      return;
    }

    try {
      if (tab === 'branches') deleteBranchFromStore(id);
      else if (tab === 'stores') deleteStoreFromStore(id);
      else if (tab === 'departments') deleteDepartmentFromStore(id);
      else if (tab === 'workers') deleteWorkerFromStore(id);
      else if (tab === 'users') deleteUserFromStore(id);
      else if (tab === 'roles') deleteRoleFromStore(id);
      else if (tab === 'vehicles') deleteVehicleFromStore(id);
      else if (tab === 'products') deleteProductFromStore(id);
      else if (tab === 'categories') deleteCategoryFromStore(id);
      else if (tab === 'prices') deleteBranchPriceFromStore(id);
      else if (tab === 'payment_methods') deletePaymentMethodFromStore(id);
      else if (tab === 'expense_types') deleteExpenseTypeFromStore(id);
      else if (tab === 'debt_types') deleteDebtTypeFromStore(id);
      else if (tab === 'salary_settings') deleteSalarySettingFromStore(id);
      else if (tab === 'system_settings') deleteSystemSettingFromStore(id);

      const apiEndpoints: Record<string, string> = {
        branches: 'branches',
        stores: 'stores',
        departments: 'departments',
        workers: 'workers',
        users: 'users',
        roles: 'roles',
        vehicles: 'vehicles',
        products: 'products',
        categories: 'categories',
        prices: 'prices',
        payment_methods: 'payment-methods',
        expense_types: 'expense-types',
        debt_types: 'debt-types',
        salary_settings: 'salary-settings',
        system_settings: 'system-settings',
      };

      const endpoint = apiEndpoints[tab];
      if (endpoint) {
        await apiClient.delete(`/api/v1/admin/${endpoint}/${id}`).catch(() => {});
      }

      if (navigator.onLine) {
        syncManager.triggerSync().catch(() => {});
      }

      notify(`Deleted item successfully from local state and queued for central sync.`);
    } catch (e: any) {
      notify(`Error deleting item: ${e.message}`);
    }
  };

  const tabs: { key: AdminTab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: 'branches', label: 'Branches', icon: <Building2 className="w-4 h-4" />, count: branches.length },
    { key: 'stores', label: 'Stores', icon: <Store className="w-4 h-4" />, count: stores.length },
    { key: 'departments', label: 'Departments', icon: <Briefcase className="w-4 h-4" />, count: departments.length },
    { key: 'workers', label: 'Workers', icon: <Users className="w-4 h-4" />, count: workers.length },
    { key: 'users', label: 'Users', icon: <Users className="w-4 h-4" />, count: usersList.length },
    { key: 'roles', label: 'Roles & Permissions', icon: <ShieldCheck className="w-4 h-4" />, count: rolesList.length },
    { key: 'vehicles', label: 'Vehicles', icon: <Truck className="w-4 h-4" />, count: vehicles.length },
    { key: 'products', label: 'Products', icon: <Package className="w-4 h-4" />, count: products.length },
    { key: 'categories', label: 'Categories', icon: <Tag className="w-4 h-4" />, count: categories.length },
    { key: 'prices', label: 'Price Rules', icon: <DollarSign className="w-4 h-4" />, count: branchPrices.length },
    { key: 'payment_methods', label: 'Payment Methods', icon: <CreditCard className="w-4 h-4" />, count: paymentMethodsList.length },
    { key: 'expense_types', label: 'Expense Types', icon: <Receipt className="w-4 h-4" />, count: expenseTypes.length },
    { key: 'debt_types', label: 'Debt Types', icon: <FileSpreadsheet className="w-4 h-4" />, count: debtTypes.length },
    { key: 'salary_settings', label: 'Salary Settings', icon: <Coins className="w-4 h-4" />, count: salarySettings.length },
    { key: 'system_settings', label: 'System Settings', icon: <Settings className="w-4 h-4" />, count: systemSettings.length },
  ];

  // Helper to open edit / add modal
  const openAddModal = () => {
    let defaults: any = { id: uuidv4(), isActive: true };
    if (activeTab === 'branches') {
      defaults = { ...defaults, code: '', name: '', location: '' };
    } else if (activeTab === 'stores') {
      defaults = { ...defaults, code: '', name: '', branchId: branches[0]?.id || '', type: 'MAIN_STORE' };
    } else if (activeTab === 'departments') {
      defaults = { ...defaults, code: '', name: '', description: '' };
    } else if (activeTab === 'users') {
      defaults = { ...defaults, username: '', fullName: '', role: 'CASHIER', branchId: branches[0]?.id || '', storeId: '', password: '123' };
    } else if (activeTab === 'workers') {
      defaults = { ...defaults, fullName: '', phone: '', department: departments[0]?.code || 'SALES', branchId: branches[0]?.id || '', role: 'FIELD_SALESPERSON', basicSalaryUgx: 350000 };
    } else if (activeTab === 'roles') {
      defaults = { ...defaults, code: '', displayName: '', description: '', permissions: [] };
    } else if (activeTab === 'vehicles') {
      defaults = { ...defaults, registrationNumber: '', type: 'TRICYCLE', model: '', branchId: branches[0]?.id || '' };
    } else if (activeTab === 'products') {
      defaults = { ...defaults, sku: '', name: '', category: categories[0]?.code || 'BOTTLED_WATER', unitOfMeasure: 'Carton (24)', capacityMl: 500, costPriceUgx: 5000, sellingPriceUgx: 8000, minStockAlert: 50 };
    } else if (activeTab === 'categories') {
      defaults = { ...defaults, code: '', name: '', description: '' };
    } else if (activeTab === 'prices') {
      defaults = { ...defaults, productId: products[0]?.id || '', branchId: branches[0]?.id || '', sellingPriceUgx: 8000, minWholesalePriceUgx: 7500 };
    } else if (activeTab === 'payment_methods') {
      defaults = { ...defaults, code: '', name: '', requiresReference: false };
    } else if (activeTab === 'expense_types') {
      defaults = { ...defaults, code: '', name: '', requiresApproval: true, description: '' };
    } else if (activeTab === 'debt_types') {
      defaults = { ...defaults, code: '', name: '', autoDeductPayroll: true, description: '' };
    } else if (activeTab === 'salary_settings') {
      defaults = { ...defaults, roleCode: 'FIELD_SALESPERSON', departmentCode: 'SALES', baseSalaryUgx: 300000, commissionPerUnitUgx: 500, allowanceUgx: 50000 };
    } else if (activeTab === 'system_settings') {
      defaults = { ...defaults, settingKey: '', settingValue: '', category: 'GENERAL', description: '' };
    }
    setEditingItem(defaults);
    setShowModal(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem({ ...item });
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    switch (activeTab) {
      case 'branches':
        saveBranchInStore(editingItem);
        notify(`Branch '${editingItem.name}' saved successfully!`);
        break;
      case 'stores':
        saveStoreInStore(editingItem);
        notify(`Store '${editingItem.name}' saved successfully!`);
        break;
      case 'departments':
        saveDepartmentInStore(editingItem);
        notify(`Department '${editingItem.name}' saved successfully!`);
        break;
      case 'workers':
        saveWorkerInStore(editingItem);
        notify(`Worker '${editingItem.fullName}' saved successfully!`);
        break;
      case 'users':
        saveUserInStore(editingItem);
        notify(`User '${editingItem.username}' saved successfully!`);
        break;
      case 'roles':
        saveRoleInStore(editingItem);
        notify(`Role '${editingItem.displayName}' saved successfully!`);
        break;
      case 'vehicles':
        saveVehicleInStore(editingItem);
        notify(`Vehicle '${editingItem.registrationNumber}' saved successfully!`);
        break;
      case 'products':
        saveProductInStore(editingItem);
        notify(`Product '${editingItem.name}' saved successfully!`);
        break;
      case 'categories':
        saveCategoryInStore(editingItem);
        notify(`Category '${editingItem.name}' saved successfully!`);
        break;
      case 'prices':
        saveBranchPriceInStore(editingItem);
        notify(`Branch Price Rule saved successfully!`);
        break;
      case 'payment_methods':
        savePaymentMethodInStore(editingItem);
        notify(`Payment Method '${editingItem.name}' saved successfully!`);
        break;
      case 'expense_types':
        saveExpenseTypeInStore(editingItem);
        notify(`Expense Type '${editingItem.name}' saved successfully!`);
        break;
      case 'debt_types':
        saveDebtTypeInStore(editingItem);
        notify(`Debt Type '${editingItem.name}' saved successfully!`);
        break;
      case 'salary_settings':
        saveSalarySettingInStore(editingItem);
        notify(`Salary Setting saved successfully!`);
        break;
      case 'system_settings':
        saveSystemSettingInStore(editingItem);
        notify(`System Setting '${editingItem.settingKey}' saved successfully!`);
        break;
    }

    const apiEndpoints: Record<string, string> = {
      branches: 'branches',
      stores: 'stores',
      departments: 'departments',
      workers: 'workers',
      users: 'users',
      roles: 'roles',
      vehicles: 'vehicles',
      products: 'products',
      categories: 'categories',
      prices: 'prices',
      payment_methods: 'payment-methods',
      expense_types: 'expense-types',
      debt_types: 'debt-types',
      salary_settings: 'salary-settings',
      system_settings: 'system-settings',
    };

    const endpoint = apiEndpoints[activeTab];
    if (endpoint && navigator.onLine) {
      apiClient.post(`/api/v1/admin/${endpoint}`, editingItem).catch((err) => {
        console.warn(`Direct online save notice for ${endpoint}:`, err?.message || err);
      });
    }

    if (navigator.onLine) {
      syncManager.triggerSync().catch(() => {});
    }

    setShowModal(false);
    setEditingItem(null);
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2.5 sm:p-3 bg-cyan-950/80 rounded-xl border border-cyan-500/30 text-cyan-400 shrink-0">
            <Settings className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-100">System Administration & Master Configuration</h1>
            <p className="text-xs text-slate-400 mt-0.5 sm:mt-1">
              Configure system parameters, branches, roles, pricing, workers, products, and operational rules dynamically.
            </p>
          </div>
        </div>

        {notification && (
          <div className="flex items-center gap-2 bg-emerald-950 border border-emerald-500/40 text-emerald-300 px-3.5 py-1.5 rounded-xl text-xs font-semibold animate-fade-in shrink-0">
            <CheckCircle className="w-4 h-4" />
            <span>{notification}</span>
          </div>
        )}
      </div>

      {/* Mobile Module Selector (< lg) */}
      <div className="lg:hidden bg-slate-900/90 border border-slate-800 rounded-2xl p-3 space-y-2 shadow-lg">
        <label className="text-[11px] font-bold tracking-wider text-slate-400 uppercase block">
          Select Configuration Module:
        </label>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setSearchQuery('');
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/40'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === tab.key ? 'bg-cyan-800 text-cyan-100' : 'bg-slate-800 text-slate-400'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Sidebar Navigation & Content Portal */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Desktop Left Sub-Nav Tabs (hidden on < lg) */}
        <div className="hidden lg:block lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-3 space-y-1 shadow-lg h-fit">
          <div className="text-[11px] font-bold tracking-wider text-slate-400 px-3 py-2 uppercase">
            Configuration Modules ({tabs.length})
          </div>
          <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setSearchQuery('');
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {tab.icon}
                  <span>{tab.label}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === tab.key ? 'bg-cyan-700 text-cyan-100' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg space-y-4 sm:space-y-6">
          
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 capitalize">
                {tabs.find((t) => t.key === activeTab)?.label} Management
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage dynamic master definitions for {activeTab.replace('_', ' ')}.
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search entries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                onClick={openAddModal}
                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-3.5 sm:px-4 py-2 rounded-xl transition-all shadow-md shadow-cyan-900/30 whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Entry</span>
              </button>
            </div>
          </div>

          {/* Dynamic Data Table Render */}
          <div className="overflow-x-auto rounded-xl border border-slate-800/80">
            {activeTab === 'branches' && (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3 rounded-l-lg">Code</th>
                    <th className="p-3">Branch Name</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 rounded-r-lg text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {branches
                    .filter((b) => {
                      const name = (b?.name || '').toLowerCase();
                      const code = (b?.code || '').toLowerCase();
                      const q = (searchQuery || '').toLowerCase();
                      return name.includes(q) || code.includes(q);
                    })
                    .map((b) => (
                      <tr key={b.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-semibold text-cyan-400">{b.code}</td>
                        <td className="p-3 font-medium text-slate-100">{b.name}</td>
                        <td className="p-3">{b.location}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${b.isActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' : 'bg-rose-950 text-rose-400 border border-rose-800/50'}`}>
                            {b.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="p-3 text-right flex items-center justify-end gap-1">
                          <button onClick={() => openEditModal(b)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-cyan-400" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete('branches', b.id, b.name)} className="p-1.5 hover:bg-rose-950/60 rounded-lg text-slate-400 hover:text-rose-400" title="Delete Branch">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {activeTab === 'stores' && (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3 rounded-l-lg">Code</th>
                    <th className="p-3">Store Name</th>
                    <th className="p-3">Branch ID</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 rounded-r-lg text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {stores
                    .filter((s) => {
                      const name = (s?.name || '').toLowerCase();
                      const code = (s?.code || '').toLowerCase();
                      const q = (searchQuery || '').toLowerCase();
                      return name.includes(q) || code.includes(q);
                    })
                    .map((s) => (
                      <tr key={s.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-semibold text-cyan-400">{s.code}</td>
                        <td className="p-3 font-medium text-slate-100">{s.name}</td>
                        <td className="p-3 text-slate-400 font-mono text-[11px]">{s.branchId}</td>
                        <td className="p-3"><span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] font-mono">{s.type}</span></td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.isActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' : 'bg-rose-950 text-rose-400 border border-rose-800/50'}`}>
                            {s.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="p-3 text-right flex items-center justify-end gap-1">
                          <button onClick={() => openEditModal(s)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-cyan-400" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete('stores', s.id, s.name)} className="p-1.5 hover:bg-rose-950/60 rounded-lg text-slate-400 hover:text-rose-400" title="Delete Store">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {activeTab === 'departments' && (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3 rounded-l-lg">Code</th>
                    <th className="p-3">Department Name</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 rounded-r-lg text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {departments
                    .filter((d) => {
                      const name = (d?.name || '').toLowerCase();
                      const code = (d?.code || '').toLowerCase();
                      const q = (searchQuery || '').toLowerCase();
                      return name.includes(q) || code.includes(q);
                    })
                    .map((d) => (
                      <tr key={d.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-semibold text-cyan-400">{d.code}</td>
                        <td className="p-3 font-medium text-slate-100">{d.name}</td>
                        <td className="p-3 text-slate-400">{d.description || '-'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${d.isActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' : 'bg-rose-950 text-rose-400 border border-rose-800/50'}`}>
                            {d.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="p-3 text-right flex items-center justify-end gap-1">
                          <button onClick={() => openEditModal(d)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-cyan-400" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete('departments', d.id, d.name)} className="p-1.5 hover:bg-rose-950/60 rounded-lg text-slate-400 hover:text-rose-400" title="Delete Department">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {activeTab === 'workers' && (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3 rounded-l-lg">Full Name</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Base Salary (UGX)</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 rounded-r-lg text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {workers
                    .filter((w) => {
                      const name = (w?.fullName || (w as any)?.full_name || '').toLowerCase();
                      const phone = (w?.phone || '').toLowerCase();
                      const q = (searchQuery || '').toLowerCase();
                      return name.includes(q) || phone.includes(q);
                    })
                    .map((w) => (
                      <tr key={w.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-semibold text-slate-100">{w.fullName}</td>
                        <td className="p-3 font-mono text-cyan-400">{w.phone}</td>
                        <td className="p-3">{w.department}</td>
                        <td className="p-3"><span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] font-mono">{w.role}</span></td>
                        <td className="p-3 font-mono text-emerald-400 font-semibold">{w.basicSalaryUgx.toLocaleString()}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${w.isActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' : 'bg-rose-950 text-rose-400 border border-rose-800/50'}`}>
                            {w.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="p-3 text-right flex items-center justify-end gap-1">
                          <button onClick={() => openEditModal(w)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-cyan-400" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete('workers', w.id, w.fullName)} className="p-1.5 hover:bg-rose-950/60 rounded-lg text-slate-400 hover:text-rose-400" title="Delete Worker">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {activeTab === 'users' && (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3 rounded-l-lg">Username</th>
                    <th className="p-3">Full Name</th>
                    <th className="p-3">System Role</th>
                    <th className="p-3">Branch</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 rounded-r-lg text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {usersList
                    .filter((u) => {
                      const uname = (u?.username || '').toLowerCase();
                      const fname = (u?.fullName || (u as any)?.full_name || '').toLowerCase();
                      const q = (searchQuery || '').toLowerCase();
                      return uname.includes(q) || fname.includes(q);
                    })
                    .map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-cyan-400">{u.username}</td>
                        <td className="p-3 font-medium text-slate-100">{u.fullName}</td>
                        <td className="p-3"><span className="bg-cyan-950 text-cyan-300 border border-cyan-800/40 px-2 py-0.5 rounded text-[10px] font-mono">{u.role}</span></td>
                        <td className="p-3 text-slate-400 text-[11px]">{branches.find(b => b.id === u.branchId)?.name || u.branchId}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.isActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' : 'bg-rose-950 text-rose-400 border border-rose-800/50'}`}>
                            {u.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="p-3 text-right flex items-center justify-end gap-1">
                          <button onClick={() => openEditModal(u)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-cyan-400" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          {u.username !== 'admin' && (
                            <button onClick={() => handleDelete('users', u.id, u.username)} className="p-1.5 hover:bg-rose-950/60 rounded-lg text-slate-400 hover:text-rose-400" title="Delete User">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {activeTab === 'roles' && (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3 rounded-l-lg">Role Code</th>
                    <th className="p-3">Display Name</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Permissions</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 rounded-r-lg text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {rolesList
                    .filter((r) => {
                      const dname = (r?.displayName || (r as any)?.display_name || '').toLowerCase();
                      const code = (r?.code || '').toLowerCase();
                      const q = (searchQuery || '').toLowerCase();
                      return dname.includes(q) || code.includes(q);
                    })
                    .map((r) => (
                      <tr key={r.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-semibold text-cyan-400">{r.code}</td>
                        <td className="p-3 font-medium text-slate-100">{r.displayName}</td>
                        <td className="p-3 text-slate-400">{r.description || '-'}</td>
                        <td className="p-3 font-mono text-[10px] text-slate-300">
                          {r.permissions.map((p) => (
                            <span key={p} className="bg-slate-800 px-1.5 py-0.5 rounded mr-1 inline-block my-0.5">{p}</span>
                          ))}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.isActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' : 'bg-rose-950 text-rose-400 border border-rose-800/50'}`}>
                            {r.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="p-3 text-right flex items-center justify-end gap-1">
                          <button onClick={() => openEditModal(r)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-cyan-400" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete('roles', r.id, r.displayName)} className="p-1.5 hover:bg-rose-950/60 rounded-lg text-slate-400 hover:text-rose-400" title="Delete Role">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {activeTab === 'vehicles' && (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3 rounded-l-lg">Reg Number</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Model</th>
                    <th className="p-3">Branch</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 rounded-r-lg text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {vehicles
                    .filter((v) => {
                      const reg = (v?.registrationNumber || (v as any)?.registration_number || '').toLowerCase();
                      const model = (v?.model || '').toLowerCase();
                      const q = (searchQuery || '').toLowerCase();
                      return reg.includes(q) || model.includes(q);
                    })
                    .map((v) => (
                      <tr key={v.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-amber-400">{v.registrationNumber}</td>
                        <td className="p-3 font-mono"><span className="bg-slate-800 px-2 py-0.5 rounded text-[10px]">{v.type}</span></td>
                        <td className="p-3 font-medium text-slate-100">{v.model}</td>
                        <td className="p-3 text-slate-400">{branches.find(b => b.id === v.branchId)?.name || v.branchId}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${v.isActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' : 'bg-rose-950 text-rose-400 border border-rose-800/50'}`}>
                            {v.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="p-3 text-right flex items-center justify-end gap-1">
                          <button onClick={() => openEditModal(v)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-cyan-400" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete('vehicles', v.id, v.registrationNumber)} className="p-1.5 hover:bg-rose-950/60 rounded-lg text-slate-400 hover:text-rose-400" title="Delete Vehicle">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {activeTab === 'products' && (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3 rounded-l-lg">SKU</th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Capacity (ml)</th>
                    <th className="p-3">Cost Price</th>
                    <th className="p-3">Selling Price</th>
                    <th className="p-3">Alert Threshold</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 rounded-r-lg text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {products
                    .filter((p) => {
                      const name = (p?.name || '').toLowerCase();
                      const sku = (p?.sku || '').toLowerCase();
                      const q = (searchQuery || '').toLowerCase();
                      return name.includes(q) || sku.includes(q);
                    })
                    .map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-cyan-400">{p.sku}</td>
                        <td className="p-3 font-semibold text-slate-100">{p.name}</td>
                        <td className="p-3 text-slate-300"><span className="bg-slate-800 px-2 py-0.5 rounded text-[10px]">{p.category}</span></td>
                        <td className="p-3 font-mono">{p.capacityMl} ml</td>
                        <td className="p-3 font-mono text-slate-400">UGX {p.costPriceUgx.toLocaleString()}</td>
                        <td className="p-3 font-mono text-emerald-400 font-bold">UGX {p.sellingPriceUgx.toLocaleString()}</td>
                        <td className="p-3 font-mono text-amber-400">{p.minStockAlert} / {p.maxStockLevel}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.isActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' : 'bg-rose-950 text-rose-400 border border-rose-800/50'}`}>
                            {p.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="p-3 text-right flex items-center justify-end gap-1">
                          <button onClick={() => openEditModal(p)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-cyan-400" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete('products', p.id, p.name)} className="p-1.5 hover:bg-rose-950/60 rounded-lg text-slate-400 hover:text-rose-400" title="Delete Product">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {activeTab === 'categories' && (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3 rounded-l-lg">Code</th>
                    <th className="p-3">Category Name</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 rounded-r-lg text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {categories
                    .filter((c) => {
                      const name = (c?.name || '').toLowerCase();
                      const code = (c?.code || '').toLowerCase();
                      const q = (searchQuery || '').toLowerCase();
                      return name.includes(q) || code.includes(q);
                    })
                    .map((c) => (
                      <tr key={c.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-cyan-400">{c.code}</td>
                        <td className="p-3 font-medium text-slate-100">{c.name}</td>
                        <td className="p-3 text-slate-400">{c.description || '-'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.isActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' : 'bg-rose-950 text-rose-400 border border-rose-800/50'}`}>
                            {c.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="p-3 text-right flex items-center justify-end gap-1">
                          <button onClick={() => openEditModal(c)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-cyan-400" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete('categories', c.id, c.name)} className="p-1.5 hover:bg-rose-950/60 rounded-lg text-slate-400 hover:text-rose-400" title="Delete Category">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {activeTab === 'prices' && (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3 rounded-l-lg">Branch ID</th>
                    <th className="p-3">Cost Price (UGX)</th>
                    <th className="p-3">Selling Price (UGX)</th>
                    <th className="p-3 rounded-r-lg text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {branchPrices.map((bp, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono text-cyan-400">{bp.branchId}</td>
                      <td className="p-3 font-mono text-slate-400">{bp.costPriceUgx ? `UGX ${bp.costPriceUgx.toLocaleString()}` : 'Default'}</td>
                      <td className="p-3 font-mono font-bold text-emerald-400">UGX {bp.sellingPriceUgx.toLocaleString()}</td>
                      <td className="p-3 text-right flex items-center justify-end gap-1">
                        <button onClick={() => openEditModal(bp)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-cyan-400" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete('prices', bp.id || `${bp.branchId}-${bp.productId}`)} className="p-1.5 hover:bg-rose-950/60 rounded-lg text-slate-400 hover:text-rose-400" title="Delete Price Rule">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'payment_methods' && (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3 rounded-l-lg">Code</th>
                    <th className="p-3">Method Name</th>
                    <th className="p-3">Requires Reference ID</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 rounded-r-lg text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {paymentMethodsList
                    .filter((pm) => (pm?.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()))
                    .map((pm) => (
                      <tr key={pm.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-cyan-400">{pm.code}</td>
                        <td className="p-3 font-medium text-slate-100">{pm.name}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${pm.requiresReference ? 'bg-amber-950 text-amber-300 border border-amber-800/40' : 'bg-slate-800 text-slate-400'}`}>
                            {pm.requiresReference ? 'YES (TX ID Required)' : 'NO'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${pm.isActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' : 'bg-rose-950 text-rose-400 border border-rose-800/50'}`}>
                            {pm.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="p-3 text-right flex items-center justify-end gap-1">
                          <button onClick={() => openEditModal(pm)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-cyan-400" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete('payment_methods', pm.id, pm.name)} className="p-1.5 hover:bg-rose-950/60 rounded-lg text-slate-400 hover:text-rose-400" title="Delete Payment Method">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {activeTab === 'expense_types' && (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3 rounded-l-lg">Code</th>
                    <th className="p-3">Category Name</th>
                    <th className="p-3">Approval Rule</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 rounded-r-lg text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {expenseTypes
                    .filter((et) => (et?.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()))
                    .map((et) => (
                      <tr key={et.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-cyan-400">{et.code}</td>
                        <td className="p-3 font-medium text-slate-100">{et.name}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${et.requiresApproval ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/40' : 'bg-slate-800 text-slate-400'}`}>
                            {et.requiresApproval ? 'Manager Approval Needed' : 'Auto-Approve'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{et.description || '-'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${et.isActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' : 'bg-rose-950 text-rose-400 border border-rose-800/50'}`}>
                            {et.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="p-3 text-right flex items-center justify-end gap-1">
                          <button onClick={() => openEditModal(et)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-cyan-400" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete('expense_types', et.id, et.name)} className="p-1.5 hover:bg-rose-950/60 rounded-lg text-slate-400 hover:text-rose-400" title="Delete Expense Type">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {activeTab === 'debt_types' && (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3 rounded-l-lg">Code</th>
                    <th className="p-3">Debt Type Name</th>
                    <th className="p-3">Payroll Auto-Deduct</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 rounded-r-lg text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {debtTypes
                    .filter((dt) => (dt?.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()))
                    .map((dt) => (
                      <tr key={dt.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-cyan-400">{dt.code}</td>
                        <td className="p-3 font-medium text-slate-100">{dt.name}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${dt.autoDeductPayroll ? 'bg-rose-950 text-rose-300 border border-rose-800/40' : 'bg-slate-800 text-slate-400'}`}>
                            {dt.autoDeductPayroll ? 'AUTO DEDUCT' : 'MANUAL CLEARANCE'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{dt.description || '-'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${dt.isActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' : 'bg-rose-950 text-rose-400 border border-rose-800/50'}`}>
                            {dt.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="p-3 text-right flex items-center justify-end gap-1">
                          <button onClick={() => openEditModal(dt)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-cyan-400" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete('debt_types', dt.id, dt.name)} className="p-1.5 hover:bg-rose-950/60 rounded-lg text-slate-400 hover:text-rose-400" title="Delete Debt Type">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {activeTab === 'salary_settings' && (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3 rounded-l-lg">Role Code</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Base Salary (UGX)</th>
                    <th className="p-3">Commission / Unit</th>
                    <th className="p-3">Monthly Allowance</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 rounded-r-lg text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {salarySettings.map((ss) => (
                    <tr key={ss.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-cyan-400">{ss.roleCode}</td>
                      <td className="p-3 font-medium text-slate-100">{ss.departmentCode}</td>
                      <td className="p-3 font-mono text-emerald-400 font-bold">UGX {ss.baseSalaryUgx.toLocaleString()}</td>
                      <td className="p-3 font-mono text-cyan-300">UGX {ss.commissionPerUnitUgx.toLocaleString()}</td>
                      <td className="p-3 font-mono text-amber-300">UGX {ss.allowanceUgx.toLocaleString()}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ss.isActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' : 'bg-rose-950 text-rose-400 border border-rose-800/50'}`}>
                          {ss.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="p-3 text-right flex items-center justify-end gap-1">
                        <button onClick={() => openEditModal(ss)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-cyan-400" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete('salary_settings', ss.id, ss.roleCode)} className="p-1.5 hover:bg-rose-950/60 rounded-lg text-slate-400 hover:text-rose-400" title="Delete Salary Setting">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'system_settings' && (
              <div className="space-y-6">
                {/* Admin Credentials Manager Block */}
                <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl space-y-4">
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                    <div className="p-2 bg-cyan-950 text-cyan-400 rounded-xl border border-cyan-800/40">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-100">Administrator Credentials & Login Security</h3>
                      <p className="text-xs text-slate-400">Update your administrator login username and password credentials.</p>
                    </div>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const targetUser = adminUsernameInput.trim() || user?.username || 'ismael';
                      const newPass = adminPasswordInput.trim();
                      const confirmPass = adminConfirmPasswordInput.trim();

                      if (!newPass) {
                        alert('Please enter a new password.');
                        return;
                      }

                      if (newPass !== confirmPass) {
                        alert('New passwords do not match. Please re-enter.');
                        return;
                      }

                      if (newPass.length < 3) {
                        alert('Password must be at least 3 characters long.');
                        return;
                      }

                      setIsUpdatingPassword(true);

                      try {
                        // 1. Send direct password change to Neon PostgreSQL
                        const res = await apiClient.post('/api/v1/auth/change-password', {
                          username: targetUser,
                          newPassword: newPass,
                        });

                        const existingAdmin = usersList.find(
                          (u) => u.username.toLowerCase() === targetUser.toLowerCase()
                        ) || usersList[0];

                        if (existingAdmin) {
                          saveUserInStore({
                            ...existingAdmin,
                            username: targetUser,
                            password: newPass,
                          } as any);
                        }

                        notify(res.data?.message || `Password for "${targetUser}" updated successfully in Neon Cloud!`);
                        setAdminPasswordInput('');
                        setAdminConfirmPasswordInput('');
                      } catch (err: any) {
                        alert(`Password update failed: ${err?.response?.data?.message || err?.message || 'Server error'}`);
                      } finally {
                        setIsUpdatingPassword(false);
                      }
                    }}
                    className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs"
                  >
                    <div>
                      <label className="block text-slate-400 mb-1">Select Account</label>
                      <select
                        value={adminUsernameInput}
                        onChange={(e) => setAdminUsernameInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                      >
                        <option value="ismael">ismael (SUPER_ADMIN)</option>
                        <option value="admin">admin (SUPER_ADMIN)</option>
                        {usersList
                          .filter((u) => u.username !== 'ismael' && u.username !== 'admin')
                          .map((u) => (
                            <option key={u.id} value={u.username}>
                              {u.username} ({u.role})
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">New Password</label>
                      <input
                        type="password"
                        placeholder="Enter new password"
                        value={adminPasswordInput}
                        onChange={(e) => setAdminPasswordInput(e.target.value)}
                        required
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        placeholder="Re-enter new password"
                        value={adminConfirmPasswordInput}
                        onChange={(e) => setAdminConfirmPasswordInput(e.target.value)}
                        required
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        disabled={isUpdatingPassword}
                        className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-xl transition-all shadow-md shadow-cyan-900/40 cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>{isUpdatingPassword ? 'Saving...' : 'Update Password'}</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Production Clean Up & Reset Block */}
                <div className="bg-rose-950/20 border border-rose-900/60 p-5 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-rose-950 text-rose-400 rounded-xl border border-rose-800/50">
                        <Trash2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-rose-200">Reset Production Data & Outbox Queues</h3>
                        <p className="text-xs text-slate-400">
                          Purge all test transactions, mock sales, test field sessions, draft transfers, test expenses, and offline outbox queues while preserving Master Configurations (Branches, Stores, Departments, Roles, Workers, Users, Products).
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsResetConfirmModalOpen(true)}
                      className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-950 flex items-center gap-2 cursor-pointer transition-all flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Reset Production Ledger</span>
                    </button>
                  </div>
                </div>

                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3 rounded-l-lg">Setting Key</th>
                      <th className="p-3">Setting Value</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Description</th>
                      <th className="p-3 rounded-r-lg text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {systemSettings
                      .filter((sys: any) => {
                        const k = (sys?.settingKey || sys?.setting_key || '').toString().toLowerCase();
                        const v = (sys?.settingValue || sys?.setting_value || '').toString().toLowerCase();
                        const q = (searchQuery || '').toLowerCase();
                        return k.includes(q) || v.includes(q);
                      })
                      .map((sys: any) => {
                        const key = sys?.settingKey || sys?.setting_key || '';
                        const val = sys?.settingValue || sys?.setting_value || '';
                        const cat = sys?.category || 'GENERAL';
                        const desc = sys?.description || '-';
                        return (
                          <tr key={sys.id || key} className="hover:bg-slate-800/40">
                            <td className="p-3 font-mono font-bold text-cyan-400">{key}</td>
                            <td className="p-3 font-mono text-slate-100 font-semibold">{val}</td>
                            <td className="p-3"><span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] font-mono">{cat}</span></td>
                            <td className="p-3 text-slate-400">{desc}</td>
                            <td className="p-3 text-right flex items-center justify-end gap-1">
                              <button onClick={() => openEditModal(sys)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-cyan-400" title="Edit">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete('system_settings', sys.id || key, key)} className="p-1.5 hover:bg-rose-950/60 rounded-lg text-slate-400 hover:text-rose-400" title="Delete System Setting">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Edit / Add Modal */}
      {showModal && editingItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm sm:text-base font-bold text-slate-100 capitalize">
                Configure {activeTab.replace('_', ' ')} Entry
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              {/* Dynamic form inputs based on active Tab */}
              {activeTab === 'branches' && (
                <>
                  <div>
                    <label className="block text-slate-400 mb-1">Branch Code</label>
                    <input
                      type="text"
                      required
                      value={editingItem.code || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Branch Name</label>
                    <input
                      type="text"
                      required
                      value={editingItem.name || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Location</label>
                    <input
                      type="text"
                      required
                      value={editingItem.location || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, location: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                    />
                  </div>
                </>
              )}

              {activeTab === 'stores' && (
                <>
                  <div>
                    <label className="block text-slate-400 mb-1">Store Code</label>
                    <input
                      type="text"
                      required
                      value={editingItem.code || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Store Name</label>
                    <input
                      type="text"
                      required
                      value={editingItem.name || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Branch</label>
                    <select
                      value={editingItem.branchId || branches[0]?.id}
                      onChange={(e) => setEditingItem({ ...editingItem, branchId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Store Type</label>
                    <select
                      value={editingItem.type || 'MAIN_STORE'}
                      onChange={(e) => setEditingItem({ ...editingItem, type: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                    >
                      <option value="MAIN_STORE">MAIN_STORE</option>
                      <option value="SALES_STORE">SALES_STORE</option>
                      <option value="MOBILE_VEHICLE">MOBILE_VEHICLE</option>
                    </select>
                  </div>
                </>
              )}

              {activeTab === 'departments' && (
                <>
                  <div>
                    <label className="block text-slate-400 mb-1">Department Code</label>
                    <input
                      type="text"
                      required
                      value={editingItem.code || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Department Name</label>
                    <input
                      type="text"
                      required
                      value={editingItem.name || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={editingItem.description || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                    />
                  </div>
                </>
              )}

              {activeTab === 'users' && (
                <>
                  <div>
                    <label className="block text-slate-400 mb-1">Username</label>
                    <input
                      type="text"
                      required
                      value={editingItem.username || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, username: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={editingItem.fullName || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, fullName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">System Role</label>
                    <select
                      value={editingItem.role || 'CASHIER'}
                      onChange={(e) => setEditingItem({ ...editingItem, role: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                    >
                      <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                      <option value="BRANCH_MANAGER">BRANCH_MANAGER</option>
                      <option value="STOREKEEPER">STOREKEEPER</option>
                      <option value="CASHIER">CASHIER</option>
                      <option value="FIELD_SALESPERSON">FIELD_SALESPERSON</option>
                      <option value="ACCOUNTANT">ACCOUNTANT</option>
                      <option value="AUDITOR">AUDITOR</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Branch</label>
                      <select
                        value={editingItem.branchId || branches[0]?.id}
                        onChange={(e) => setEditingItem({ ...editingItem, branchId: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs"
                      >
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Store (Optional)</label>
                      <select
                        value={editingItem.storeId || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, storeId: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs"
                      >
                        <option value="">-- None / All --</option>
                        {stores.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Set Password</label>
                    <input
                      type="password"
                      placeholder="Leave blank to keep existing password"
                      value={editingItem.password || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, password: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                    />
                  </div>
                </>
              )}

              {activeTab === 'workers' && (
                <>
                  <div>
                    <label className="block text-slate-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={editingItem.fullName || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, fullName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Phone Number</label>
                    <input
                      type="text"
                      required
                      value={editingItem.phone || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, phone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Branch</label>
                      <select
                        value={editingItem.branchId || branches[0]?.id}
                        onChange={(e) => setEditingItem({ ...editingItem, branchId: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                      >
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.code})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Role / Designation</label>
                      <select
                        value={editingItem.role || 'FIELD_SALESPERSON'}
                        onChange={(e) => setEditingItem({ ...editingItem, role: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                      >
                        <option value="FIELD_SALESPERSON">Field Sales / Driver</option>
                        <option value="CASHIER">Cashier</option>
                        <option value="STOREKEEPER">Storekeeper</option>
                        <option value="BRANCH_MANAGER">Branch Manager</option>
                        <option value="ACCOUNTANT">Accountant</option>
                        <option value="SECURITY">Security</option>
                        <option value="LOADER">Loader / Porter</option>
                        <option value="TECHNICIAN">Technician</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Department</label>
                    <select
                      value={editingItem.department || departments[0]?.code}
                      onChange={(e) => setEditingItem({ ...editingItem, department: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.code}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Base Salary (UGX)</label>
                    <input
                      type="number"
                      required
                      value={editingItem.basicSalaryUgx || 0}
                      onChange={(e) => setEditingItem({ ...editingItem, basicSalaryUgx: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                    />
                  </div>
                </>
              )}

              {activeTab === 'products' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">SKU</label>
                      <input
                        type="text"
                        required
                        value={editingItem.sku || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, sku: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Category</label>
                      <select
                        value={editingItem.category || categories[0]?.code}
                        onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.code}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Product Name</label>
                    <input
                      type="text"
                      required
                      value={editingItem.name || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Unit of Measure</label>
                      <input
                        type="text"
                        required
                        value={editingItem.unitOfMeasure || 'Carton (24)'}
                        onChange={(e) => setEditingItem({ ...editingItem, unitOfMeasure: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Capacity (ml)</label>
                      <input
                        type="number"
                        required
                        value={editingItem.capacityMl || 500}
                        onChange={(e) => setEditingItem({ ...editingItem, capacityMl: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Cost Price (UGX)</label>
                      <input
                        type="number"
                        required
                        value={editingItem.costPriceUgx || 0}
                        onChange={(e) => setEditingItem({ ...editingItem, costPriceUgx: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Selling Price (UGX)</label>
                      <input
                        type="number"
                        required
                        value={editingItem.sellingPriceUgx || 0}
                        onChange={(e) => setEditingItem({ ...editingItem, sellingPriceUgx: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'vehicles' && (
                <>
                  <div>
                    <label className="block text-slate-400 mb-1">Registration Number / Plate</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. UBB 450L or UFX 101T"
                      value={editingItem.registrationNumber || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, registrationNumber: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Vehicle Type</label>
                      <select
                        value={editingItem.type || 'TRICYCLE'}
                        onChange={(e) => setEditingItem({ ...editingItem, type: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                      >
                        <option value="TRICYCLE">TRICYCLE (Tuk-Tuk)</option>
                        <option value="LORRY">LORRY / TRUCK</option>
                        <option value="VAN">VAN / PICKUP</option>
                        <option value="MOTORCYCLE">MOTORCYCLE</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Assigned Branch</label>
                      <select
                        value={editingItem.branchId || branches[0]?.id}
                        onChange={(e) => setEditingItem({ ...editingItem, branchId: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                      >
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Model / Make Description</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tuk-Tuk Cargo Tricycle 150cc"
                      value={editingItem.model || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, model: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                    />
                  </div>
                </>
              )}

              {activeTab === 'categories' && (
                <>
                  <div>
                    <label className="block text-slate-400 mb-1">Category Code</label>
                    <input
                      type="text"
                      required
                      value={editingItem.code || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Category Name</label>
                    <input
                      type="text"
                      required
                      value={editingItem.name || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={editingItem.description || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                    />
                  </div>
                </>
              )}

              {activeTab === 'roles' && (
                <>
                  <div>
                    <label className="block text-slate-400 mb-1">Role Code</label>
                    <input
                      type="text"
                      required
                      value={editingItem.code || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Display Name</label>
                    <input
                      type="text"
                      required
                      value={editingItem.displayName || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, displayName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={editingItem.description || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                    />
                  </div>
                </>
              )}

              {activeTab === 'prices' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Product</label>
                      <select
                        value={editingItem.productId || products[0]?.id}
                        onChange={(e) => setEditingItem({ ...editingItem, productId: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Branch</label>
                      <select
                        value={editingItem.branchId || branches[0]?.id}
                        onChange={(e) => setEditingItem({ ...editingItem, branchId: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                      >
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Selling Price (UGX)</label>
                      <input
                        type="number"
                        required
                        value={editingItem.sellingPriceUgx || 0}
                        onChange={(e) => setEditingItem({ ...editingItem, sellingPriceUgx: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Min Wholesale Price (UGX)</label>
                      <input
                        type="number"
                        required
                        value={editingItem.minWholesalePriceUgx || 0}
                        onChange={(e) => setEditingItem({ ...editingItem, minWholesalePriceUgx: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'payment_methods' && (
                <>
                  <div>
                    <label className="block text-slate-400 mb-1">Method Code</label>
                    <input
                      type="text"
                      required
                      value={editingItem.code || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Method Name</label>
                    <input
                      type="text"
                      required
                      value={editingItem.name || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                    />
                  </div>
                  <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-300">Requires Transaction Reference Number</span>
                    <input
                      type="checkbox"
                      checked={editingItem.requiresReference || false}
                      onChange={(e) => setEditingItem({ ...editingItem, requiresReference: e.target.checked })}
                      className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                    />
                  </div>
                </>
              )}

              {activeTab === 'expense_types' && (
                <>
                  <div>
                    <label className="block text-slate-400 mb-1">Expense Type Code</label>
                    <input
                      type="text"
                      required
                      value={editingItem.code || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Expense Type Name</label>
                    <input
                      type="text"
                      required
                      value={editingItem.name || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={editingItem.description || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                    />
                  </div>
                  <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-300">Requires Manager Approval</span>
                    <input
                      type="checkbox"
                      checked={editingItem.requiresApproval ?? true}
                      onChange={(e) => setEditingItem({ ...editingItem, requiresApproval: e.target.checked })}
                      className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                    />
                  </div>
                </>
              )}

              {activeTab === 'debt_types' && (
                <>
                  <div>
                    <label className="block text-slate-400 mb-1">Debt Type Code</label>
                    <input
                      type="text"
                      required
                      value={editingItem.code || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Debt Type Name</label>
                    <input
                      type="text"
                      required
                      value={editingItem.name || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={editingItem.description || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                    />
                  </div>
                  <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-300">Auto Deduct From Monthly Worker Payroll</span>
                    <input
                      type="checkbox"
                      checked={editingItem.autoDeductPayroll ?? true}
                      onChange={(e) => setEditingItem({ ...editingItem, autoDeductPayroll: e.target.checked })}
                      className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                    />
                  </div>
                </>
              )}

              {activeTab === 'salary_settings' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Role Code</label>
                      <input
                        type="text"
                        required
                        value={editingItem.roleCode || 'FIELD_SALESPERSON'}
                        onChange={(e) => setEditingItem({ ...editingItem, roleCode: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Department Code</label>
                      <input
                        type="text"
                        required
                        value={editingItem.departmentCode || 'SALES'}
                        onChange={(e) => setEditingItem({ ...editingItem, departmentCode: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-slate-400 mb-1">Base (UGX)</label>
                      <input
                        type="number"
                        required
                        value={editingItem.baseSalaryUgx || 0}
                        onChange={(e) => setEditingItem({ ...editingItem, baseSalaryUgx: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Commission/Unit</label>
                      <input
                        type="number"
                        required
                        value={editingItem.commissionPerUnitUgx || 0}
                        onChange={(e) => setEditingItem({ ...editingItem, commissionPerUnitUgx: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Allowance</label>
                      <input
                        type="number"
                        required
                        value={editingItem.allowanceUgx || 0}
                        onChange={(e) => setEditingItem({ ...editingItem, allowanceUgx: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'system_settings' && (
                <>
                  <div>
                    <label className="block text-slate-400 mb-1">Setting Key</label>
                    <input
                      type="text"
                      required
                      value={editingItem.settingKey || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, settingKey: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Setting Value</label>
                    <input
                      type="text"
                      required
                      value={editingItem.settingValue || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, settingValue: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Category</label>
                    <input
                      type="text"
                      required
                      value={editingItem.category || 'GENERAL'}
                      onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={editingItem.description || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                    />
                  </div>
                </>
              )}

              {/* Status Toggle Switch */}
              {editingItem.isActive !== undefined && (
                <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 mt-2">
                  <span className="text-slate-300 font-medium">Is Active Status</span>
                  <input
                    type="checkbox"
                    checked={editingItem.isActive}
                    onChange={(e) => setEditingItem({ ...editingItem, isActive: e.target.checked })}
                    className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl transition-all shadow-md shadow-cyan-900/40"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Entry</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Production Data Confirmation Modal */}
      {isResetConfirmModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-rose-900/80 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2.5 bg-rose-950 text-rose-400 rounded-2xl border border-rose-800/60">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-rose-300">Confirm Production Ledger Reset</h3>
                <p className="text-xs text-slate-400">This action cleans transactional data to prepare for live business.</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-2 text-slate-300">
              <div className="font-bold text-rose-400 flex items-center gap-1.5">
                <span>⚠️ What will be purged:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1 text-[11px]">
                <li>All mock/test POS cart sales and receipts</li>
                <li>All field route sessions and worker reconciliations</li>
                <li>All draft and dispatched stock transfers</li>
                <li>All recorded test expenses, debt records, and salary payouts</li>
                <li>All pending offline sync outbox items (resets outbox to 0)</li>
                <li>Inventory stock quantities reset to clean 0 for actual opening intake</li>
              </ul>

              <div className="pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/40">
                  <input
                    type="checkbox"
                    checked={clearDemoMaster}
                    onChange={(e) => setClearDemoMaster(e.target.checked)}
                    className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
                  />
                  <span className="text-rose-300 font-bold text-xs">
                    Also wipe sample branches, demo workers, and demo products (Fresh Customer Setup)
                  </span>
                </label>
              </div>

              {!clearDemoMaster && (
                <>
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5 pt-2 border-t border-slate-900">
                    <span>✓ What will be PRESERVED safely:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1 text-[11px]">
                    <li>All Branches, Stores, Warehouses & Delivery Vehicles</li>
                    <li>All Registered Products, SKUs, Categories & Price Rules</li>
                    <li>All Workers, Departments, User Accounts & Security Roles</li>
                    <li>All System Settings & Master Configurations</li>
                  </ul>
                </>
              )}
            </div>

            <div className="flex gap-2 border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => {
                  setIsResetConfirmModalOpen(false);
                  setClearDemoMaster(false);
                }}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
              >
                Cancel / Keep Data
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    // Also trigger central server reset if online
                    await apiClient.post('/api/v1/admin/reset-production', { clearDemoMaster }).catch(() => {});
                  } catch (e) {}

                  resetProductionData(clearDemoMaster);
                  setIsResetConfirmModalOpen(false);
                  notify(
                    clearDemoMaster
                      ? 'System completely reset for fresh customer setup! Master data & test ledger cleared.'
                      : 'Production ledger reset successfully! Test sales wiped and stock initialized to 0.'
                  );
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-950 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{clearDemoMaster ? 'Wipe Everything & Start Fresh' : 'Purge Test Data & Prepare Real Ledger'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminConfigView;
