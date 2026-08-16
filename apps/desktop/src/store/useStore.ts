import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  User,
  UserRole,
  PaymentMethod,
  Branch,
  Store,
  Department,
  Worker,
  RoleDefinition,
  Vehicle,
  Product,
  ProductCategory,
  BranchPrice,
  PaymentMethodConfig,
  ExpenseType,
  DebtType,
  SalarySetting,
  SystemSetting,
} from '@water-business/shared-types';

export interface CartItem {
  productId: string;
  sku: string;
  name: string;
  unitPriceUgx: number;
  quantity: number;
  discountUgx: number;
}

export interface SaleRecord {
  id: string;
  receiptNumber: string;
  storeId: string;
  items: CartItem[];
  subtotalUgx: number;
  overallDiscountUgx: number;
  totalAmountUgx: number;
  paidAmountUgx?: number;
  changeAmountUgx?: number;
  paymentMethod: PaymentMethod;
  customerName?: string;
  customerPhone?: string;
  cashierId?: string;
  date: string;
  createdAt: string;
}

export interface ExpenseRecord {
  id: string;
  voucherNumber: string;
  category: string;
  description: string;
  amountUgx: number;
  branchId: string;
  storeId?: string;
  paymentMethod: string;
  approvedBy: string;
  date: string;
}

export interface DebtRecord {
  id: string;
  debtorName: string;
  source: string;
  originalAmountUgx: number;
  paidAmountUgx: number;
  balanceAmountUgx: number;
  status: 'OUTSTANDING' | 'PARTIALLY_PAID' | 'CLEARED';
  date: string;
  reason?: string;
}

export interface SalaryPaymentRecord {
  id: string;
  workerId: string;
  workerName: string;
  department: string;
  month: string;
  basicSalaryUgx: number;
  commissionUgx: number;
  allowancesUgx: number;
  debtDeductedUgx: number;
  netPaidUgx: number;
  paymentDate: string;
  paymentMethod: string;
  voucherNumber: string;
}

export interface FieldSessionItem {
  productId: string;
  name: string;
  issuedQty: number;
  unitPriceUgx: number;
  soldQty?: number;
  returnedQty?: number;
  damagedQty?: number;
  missingQty?: number;
}

export interface FieldSessionRecord {
  id: string;
  sessionNumber: string;
  vehicleId: string;
  vehicleName: string;
  workerId: string;
  workerName: string;
  storeId: string;
  status: 'OPEN' | 'CLOSED' | 'RECONCILED';
  startTime: string;
  endTime?: string;
  items: FieldSessionItem[];
}

export interface StockTransferRecord {
  id: string;
  transferNumber: string;
  sourceStoreId: string;
  sourceStoreName: string;
  destStoreId: string;
  destStoreName: string;
  productId: string;
  productName: string;
  quantity: number;
  vehicleName: string;
  status: 'DRAFT' | 'APPROVED' | 'DISPATCHED' | 'IN_TRANSIT' | 'RECEIVED' | 'CONFIRMED';
  date: string;
}

export interface OutboxRecord {
  id: string;
  type: string;
  receiptNumber?: string;
  /** PENDING = not yet pushed; SYNCED = server ACK'd; CONFLICT = server rejected (e.g. deleted remotely); FAILED = push error */
  status: 'PENDING' | 'SYNCED' | 'CONFLICT' | 'FAILED';
  createdAt: string;
  payload?: any;
  /** Reason provided by server when status is CONFLICT */
  conflictReason?: string;
}

export interface AuditRecord {
  id: string;
  user: string;
  action: string;
  entity: string;
  details: string;
  timestamp: string;
}

export interface AppState {
  user: User | null;
  token: string | null;
  currentBranchId: string;
  currentStoreId: string;
  isOnline: boolean;
  syncStatus: 'ONLINE' | 'OFFLINE' | 'SYNCING' | 'SYNCED' | 'FAILED';
  pendingSyncCount: number;
  /** ISO timestamp of the last successful sync pull (server clock). Used as `since` watermark on next pull. */
  lastSyncedAt: string | null;

  // Configuration Master Data Arrays
  branches: Branch[];
  stores: Store[];
  departments: Department[];
  workers: Worker[];
  usersList: User[];
  rolesList: RoleDefinition[];
  vehicles: Vehicle[];
  products: Product[];
  categories: ProductCategory[];
  branchPrices: BranchPrice[];
  paymentMethodsList: PaymentMethodConfig[];
  expenseTypes: ExpenseType[];
  debtTypes: DebtType[];
  salarySettings: SalarySetting[];
  systemSettings: SystemSetting[];

  // Live Inventory Levels: [storeId][productId] = quantity
  inventoryStock: Record<string, Record<string, number>>;

  // Transactional & Operational Records
  salesHistory: SaleRecord[];
  expensesList: ExpenseRecord[];
  debtsList: DebtRecord[];
  salaryPaymentsList: SalaryPaymentRecord[];
  fieldSessionsList: FieldSessionRecord[];
  stockTransfersList: StockTransferRecord[];
  outboxQueue: OutboxRecord[];
  auditLogs: AuditRecord[];

  // Cart State for POS
  cart: CartItem[];
  overallDiscountUgx: number;
  selectedPaymentMethod: PaymentMethod;

  setUser: (user: User | null, token: string | null) => void;
  setStore: (branchId: string, storeId: string) => void;
  setOnlineStatus: (isOnline: boolean) => void;
  setSyncStatus: (status: AppState['syncStatus'], pendingCount?: number) => void;
  mergeCentralData: (data: any) => void;
  markOutboxSynced: (ackedIds: string[], conflictItems?: Array<{ id: string; reason?: string }>) => void;

  // Master Data Mutators
  saveBranchInStore: (branch: Branch) => void;
  deleteBranchFromStore: (id: string) => void;
  saveStoreInStore: (store: Store) => void;
  deleteStoreFromStore: (id: string) => void;
  saveDepartmentInStore: (dept: Department) => void;
  deleteDepartmentFromStore: (id: string) => void;
  saveWorkerInStore: (worker: Worker) => void;
  deleteWorkerFromStore: (id: string) => void;
  saveUserInStore: (u: User) => void;
  deleteUserFromStore: (id: string) => void;
  saveRoleInStore: (role: RoleDefinition) => void;
  deleteRoleFromStore: (id: string) => void;
  saveVehicleInStore: (v: Vehicle) => void;
  deleteVehicleFromStore: (id: string) => void;
  saveProductInStore: (p: Product) => void;
  deleteProductFromStore: (id: string) => void;
  saveCategoryInStore: (cat: ProductCategory) => void;
  deleteCategoryFromStore: (id: string) => void;
  saveBranchPriceInStore: (price: BranchPrice) => void;
  deleteBranchPriceFromStore: (id: string) => void;
  savePaymentMethodInStore: (pm: PaymentMethodConfig) => void;
  deletePaymentMethodFromStore: (id: string) => void;
  saveExpenseTypeInStore: (et: ExpenseType) => void;
  deleteExpenseTypeFromStore: (id: string) => void;
  saveDebtTypeInStore: (dt: DebtType) => void;
  deleteDebtTypeFromStore: (id: string) => void;
  saveSalarySettingInStore: (ss: SalarySetting) => void;
  deleteSalarySettingFromStore: (id: string) => void;
  saveSystemSettingInStore: (sys: SystemSetting) => void;
  deleteSystemSettingFromStore: (id: string) => void;

  // Operational Mutators
  addSaleRecord: (sale: SaleRecord) => void;
  addStockIntake: (intake: { storeId: string; productId: string; quantity: number; unitCostUgx: number; batchRef: string; notes?: string }) => void;
  addExpense: (expense: ExpenseRecord) => void;
  addDebt: (debt: DebtRecord) => void;
  settleDebt: (debtId: string, amountPaidUgx: number) => void;
  recordSalaryPayment: (payment: SalaryPaymentRecord) => void;
  startFieldSession: (session: FieldSessionRecord) => void;
  closeFieldSession: (sessionId: string, reconciledItems: FieldSessionItem[], varianceUgx?: number) => void;
  createStockTransfer: (transfer: StockTransferRecord) => void;
  advanceTransferStatus: (transferId: string, nextStatus: StockTransferRecord['status']) => void;
  resetProductionData: (clearDemoMaster?: boolean) => void;

  // Cart actions
  addToCart: (product: { id: string; sku: string; name: string; sellingPriceUgx: number }) => void;
  removeFromCart: (productId: string) => void;
  updateCartQty: (productId: string, qty: number) => void;
  updateCartDiscount: (productId: string, discountUgx: number) => void;
  setOverallDiscount: (discountUgx: number) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  clearCart: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      currentBranchId: '',
      currentStoreId: '',
      isOnline: true,
      syncStatus: 'SYNCED',
      pendingSyncCount: 0,
      lastSyncedAt: null,

      // Clean Master Data without handcoded demo data
      branches: [],
      stores: [],
      departments: [
        { id: 'd1111111-1111-1111-1111-111111111111', code: 'FIELD_SALES', name: 'Field Sales & Distribution', description: 'Route truck sales and van delivery teams', isActive: true },
        { id: 'd2222222-2222-2222-2222-222222222222', code: 'STOCKING', name: 'Store & Inventory Management', description: 'Warehouse stockkeepers and loading clerks', isActive: true },
        { id: 'd3333333-3333-3333-3333-333333333333', code: 'FINANCE', name: 'Finance & Accounting', description: 'Audit, cash handling, and payroll management', isActive: true },
        { id: 'd4444444-4444-4444-4444-444444444444', code: 'ADMIN', name: 'Executive Administration', description: 'General management and system governance', isActive: true },
      ],
      workers: [],
      usersList: [
        { id: 'u1111111-1111-1111-1111-111111111111', username: 'admin', fullName: 'System Super Administrator', role: UserRole.SUPER_ADMIN, branchId: '', storeId: '', isActive: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
      ],
      rolesList: [
        { id: 'r1111111-1111-1111-1111-111111111111', code: 'SUPER_ADMIN', displayName: 'Super Administrator', description: 'Full system access and global configuration', permissions: ['*'], isActive: true },
        { id: 'r2222222-2222-2222-2222-222222222222', code: 'BRANCH_MANAGER', displayName: 'Branch Manager', description: 'Branch operations, transfers approval, and reporting', permissions: ['manage_branch', 'approve_transfers', 'view_reports'], isActive: true },
        { id: 'r3333333-3333-3333-3333-333333333333', code: 'STOREKEEPER', displayName: 'Storekeeper', description: 'Stock intake, transfer dispatch, inventory counts', permissions: ['manage_stock', 'dispatch_transfers'], isActive: true },
        { id: 'r4444444-4444-4444-4444-444444444444', code: 'CASHIER', displayName: 'Store Cashier', description: 'Point of sale operations and customer checkout', permissions: ['create_sales', 'print_receipts'], isActive: true },
        { id: 'r5555555-5555-5555-5555-555555555555', code: 'FIELD_SALESPERSON', displayName: 'Field Sales Representative', description: 'Route sales sessions and customer deliveries', permissions: ['field_sales'], isActive: true },
        { id: 'r6666666-6666-6666-6666-666666666666', code: 'ACCOUNTANT', displayName: 'Accountant / Auditor', description: 'Expense approvals, debt payments, salary processing', permissions: ['manage_finance', 'reconcile_sessions'], isActive: true },
      ],
      vehicles: [],
      products: [],
      categories: [
        { id: 'c1111111-1111-1111-1111-111111111111', code: 'BOTTLED_WATER', name: 'Bottled Mineral Water', description: 'Standard PET bottled drinking water', isActive: true },
        { id: 'c2222222-2222-2222-2222-222222222222', code: 'REFILL_JERRICAN', name: 'Refillable Jerricans', description: 'Large capacity 20L reusable water containers', isActive: true },
        { id: 'c3333333-3333-3333-3333-333333333333', code: 'DISPENSER_ACCESSORIES', name: 'Dispenser & Accessories', description: 'Water pumps, dispensers, and accessories', isActive: true },
      ],
      branchPrices: [],
      paymentMethodsList: [
        { id: 'pm111111-1111-1111-1111-111111111111', code: 'CASH', name: 'Physical Cash (UGX)', requiresReference: false, isActive: true },
        { id: 'pm222222-2222-2222-2222-222222222222', code: 'MOBILE_MONEY', name: 'Mobile Money (MTN / Airtel)', requiresReference: true, isActive: true },
        { id: 'pm333333-3333-3333-3333-333333333333', code: 'BANK_TRANSFER', name: 'Bank Transfer / Deposit Slip', requiresReference: true, isActive: true },
        { id: 'pm444444-4444-4444-4444-444444444444', code: 'CREDIT', name: 'Customer Credit Account', requiresReference: true, isActive: true },
      ],
      expenseTypes: [
        { id: 'et111111-1111-1111-1111-111111111111', code: 'FUEL', name: 'Vehicle Fuel & Lubricants', requiresApproval: true, description: 'Fuel purchases for delivery vehicles', isActive: true },
        { id: 'et222222-2222-2222-2222-222222222222', code: 'MAINTENANCE', name: 'Vehicle & Plant Maintenance', requiresApproval: true, description: 'Servicing, tire repairs, water filter changes', isActive: true },
        { id: 'et333333-3333-3333-3333-333333333333', code: 'MEALS_ALLOWANCE', name: 'Field Lunch & Route Allowances', requiresApproval: false, description: 'Daily route staff allowances', isActive: true },
        { id: 'et444444-4444-4444-4444-444444444444', code: 'UTILITIES', name: 'Electricity & Water Utilities', requiresApproval: true, description: 'Factory and depot utility bills', isActive: true },
      ],
      debtTypes: [
        { id: 'dt111111-1111-1111-1111-111111111111', code: 'FIELD_SHORTAGE', name: 'Field Route Shortage / Unaccounted Cash', autoDeductPayroll: true, description: 'Route discrepancies', isActive: true },
        { id: 'dt222222-2222-2222-2222-222222222222', code: 'SALARY_ADVANCE', name: 'Staff Emergency Salary Advance', autoDeductPayroll: true, description: 'Emergency cash advances', isActive: true },
        { id: 'dt333333-3333-3333-3333-333333333333', code: 'CUSTOMER_CREDIT', name: 'Wholesale Customer Credit Ledger', autoDeductPayroll: false, description: 'Client credit accounts', isActive: true },
      ],
      salarySettings: [],
      systemSettings: [
        { id: 'sys11111-1111-1111-1111-111111111111', settingKey: 'COMPANY_NAME', settingValue: 'AquaPOS Mineral Water Ltd', category: 'GENERAL', description: 'Registered company name', isActive: true },
        { id: 'sys22222-2222-2222-2222-222222222222', settingKey: 'DEFAULT_CURRENCY', settingValue: 'UGX', category: 'FINANCE', description: 'Default transaction currency', isActive: true },
        { id: 'sys33333-3333-3333-3333-333333333333', settingKey: 'ALLOW_OFFLINE_SALES', settingValue: 'TRUE', category: 'OPERATIONS', description: 'Allow offline POS sales queueing', isActive: true },
        { id: 'sys44444-4444-4444-4444-444444444444', settingKey: 'MAX_DISCOUNT_PERCENT', settingValue: '10', category: 'SALES', description: 'Maximum cashier discount allowed without PIN', isActive: true },
      ],

      // Initial clean inventory balance
      inventoryStock: {},

      salesHistory: [],
      expensesList: [],
      debtsList: [],
      salaryPaymentsList: [],
      fieldSessionsList: [],
      stockTransfersList: [],
      outboxQueue: [],
      auditLogs: [],

      // Cart State for POS
      cart: [],
      overallDiscountUgx: 0,
      selectedPaymentMethod: 'CASH' as PaymentMethod,

      setUser: (user, token) => set({ user, token }),
      setStore: (currentBranchId, currentStoreId) => set({ currentBranchId, currentStoreId }),
      setOnlineStatus: (isOnline) => set({ isOnline, syncStatus: isOnline ? 'SYNCED' : 'OFFLINE' }),
      setSyncStatus: (syncStatus, pendingSyncCount) =>
        set((state) => ({
          syncStatus,
          pendingSyncCount: pendingSyncCount !== undefined ? pendingSyncCount : state.pendingSyncCount,
        })),

      mergeCentralData: (centralData: any) =>
        set((state) => {
          if (!centralData) return state;

          const mergedBranches = Array.isArray(centralData.branches)
            ? centralData.branches.map((b: any) => ({
                id: b.id,
                code: b.code || '',
                name: b.name || '',
                location: b.location || '',
                isActive: b.isActive !== undefined ? Boolean(b.isActive) : Boolean(b.is_active ?? true),
                createdAt: b.createdAt || b.created_at || new Date().toISOString(),
              }))
            : state.branches;

          const mergedStores = Array.isArray(centralData.stores)
            ? centralData.stores.map((s: any) => ({
                id: s.id,
                branchId: s.branchId || s.branch_id || '',
                code: s.code || '',
                name: s.name || '',
                type: s.type || 'MAIN_STORE',
                isActive: s.isActive !== undefined ? Boolean(s.isActive) : Boolean(s.is_active ?? true),
              }))
            : state.stores;

          const mergedDepartments = Array.isArray(centralData.departments)
            ? centralData.departments.map((d: any) => ({
                id: d.id,
                code: d.code || '',
                name: d.name || '',
                description: d.description || '',
                isActive: d.isActive !== undefined ? Boolean(d.isActive) : Boolean(d.is_active ?? true),
                createdAt: d.createdAt || d.created_at || new Date().toISOString(),
              }))
            : state.departments;

          const mergedWorkers = Array.isArray(centralData.workers)
            ? centralData.workers.map((w: any) => ({
                id: w.id,
                branchId: w.branchId || w.branch_id || '',
                department: w.department || '',
                fullName: w.fullName || w.full_name || '',
                phone: w.phone || '',
                role: w.role || 'FIELD_SALESPERSON',
                basicSalaryUgx: Number(w.basicSalaryUgx ?? w.basic_salary_ugx ?? 0),
                isActive: w.isActive !== undefined ? Boolean(w.isActive) : Boolean(w.is_active ?? true),
              }))
            : state.workers;

          const mergedUsers = Array.isArray(centralData.users)
            ? centralData.users.map((u: any) => ({
                id: u.id,
                username: u.username || '',
                fullName: u.fullName || u.full_name || '',
                role: u.role || 'CASHIER',
                branchId: u.branchId || u.branch_id || '',
                storeId: u.storeId || u.store_id || '',
                isActive: u.isActive !== undefined ? Boolean(u.isActive) : Boolean(u.is_active ?? true),
                createdAt: u.createdAt || u.created_at || new Date().toISOString(),
                updatedAt: u.updatedAt || u.updated_at || new Date().toISOString(),
              }))
            : state.usersList;

          const mergedRoles = Array.isArray(centralData.roles)
            ? centralData.roles.map((r: any) => ({
                id: r.id,
                code: r.code || '',
                displayName: r.displayName || r.display_name || '',
                description: r.description || '',
                permissions: Array.isArray(r.permissions) ? r.permissions : (typeof r.permissions === 'string' ? (() => { try { return JSON.parse(r.permissions); } catch(e) { return []; } })() : []),
                isActive: r.isActive !== undefined ? Boolean(r.isActive) : Boolean(r.is_active ?? true),
              }))
            : state.rolesList;

          const mergedVehicles = Array.isArray(centralData.vehicles)
            ? centralData.vehicles.map((v: any) => ({
                id: v.id,
                branchId: v.branchId || v.branch_id || '',
                registrationNumber: v.registrationNumber || v.registration_number || '',
                type: v.type || 'LORRY',
                model: v.model || '',
                isActive: v.isActive !== undefined ? Boolean(v.isActive) : Boolean(v.is_active ?? true),
              }))
            : state.vehicles;

          const mergedProducts = Array.isArray(centralData.products)
            ? centralData.products.map((p: any) => ({
                id: p.id,
                sku: p.sku || '',
                name: p.name || '',
                category: p.category || '',
                variant: p.variant || '',
                packaging: p.packaging || '',
                unitOfMeasure: p.unitOfMeasure || p.unit_of_measure || 'Piece',
                capacityMl: Number(p.capacityMl ?? p.capacity_ml ?? 500),
                costPriceUgx: Number(p.costPriceUgx ?? p.cost_price_ugx ?? 0),
                sellingPriceUgx: Number(p.sellingPriceUgx ?? p.selling_price_ugx ?? 0),
                minStockAlert: Number(p.minStockAlert ?? p.min_stock_alert ?? 10),
                maxStockLevel: Number(p.maxStockLevel ?? p.max_stock_level ?? 5000),
                isActive: p.isActive !== undefined ? Boolean(p.isActive) : Boolean(p.is_active ?? true),
              }))
            : state.products;

          const mergedCategories = Array.isArray(centralData.categories)
            ? centralData.categories.map((c: any) => ({
                id: c.id,
                code: c.code || '',
                name: c.name || '',
                description: c.description || '',
                isActive: c.isActive !== undefined ? Boolean(c.isActive) : Boolean(c.is_active ?? true),
              }))
            : state.categories;

          const mergedBranchPrices = Array.isArray(centralData.branchPrices)
            ? centralData.branchPrices.map((bp: any) => ({
                id: bp.id,
                branchId: bp.branchId || bp.branch_id || '',
                productId: bp.productId || bp.product_id || '',
                costPriceUgx: Number(bp.costPriceUgx ?? bp.cost_price_ugx ?? 0),
                sellingPriceUgx: Number(bp.sellingPriceUgx ?? bp.selling_price_ugx ?? 0),
              }))
            : state.branchPrices;

          const mergedPaymentMethods = Array.isArray(centralData.paymentMethods)
            ? centralData.paymentMethods.map((pm: any) => ({
                id: pm.id,
                code: pm.code || '',
                name: pm.name || '',
                requiresReference: Boolean(pm.requiresReference ?? pm.requires_reference),
                isActive: pm.isActive !== undefined ? Boolean(pm.isActive) : Boolean(pm.is_active ?? true),
              }))
            : state.paymentMethodsList;

          const mergedExpenseTypes = Array.isArray(centralData.expenseTypes)
            ? centralData.expenseTypes.map((et: any) => ({
                id: et.id,
                code: et.code || '',
                name: et.name || '',
                requiresApproval: Boolean(et.requiresApproval ?? et.requires_approval),
                description: et.description || '',
                isActive: et.isActive !== undefined ? Boolean(et.isActive) : Boolean(et.is_active ?? true),
              }))
            : state.expenseTypes;

          const mergedDebtTypes = Array.isArray(centralData.debtTypes)
            ? centralData.debtTypes.map((dt: any) => ({
                id: dt.id,
                code: dt.code || '',
                name: dt.name || '',
                autoDeductPayroll: Boolean(dt.autoDeductPayroll ?? dt.auto_deduct_payroll),
                description: dt.description || '',
                isActive: dt.isActive !== undefined ? Boolean(dt.isActive) : Boolean(dt.is_active ?? true),
              }))
            : state.debtTypes;

          const mergedSalarySettings = Array.isArray(centralData.salarySettings)
            ? centralData.salarySettings.map((ss: any) => ({
                id: ss.id,
                roleCode: ss.roleCode || ss.role_code || '',
                departmentCode: ss.departmentCode || ss.department_code || '',
                baseSalaryUgx: Number(ss.baseSalaryUgx ?? ss.base_salary_ugx ?? 0),
                commissionPerUnitUgx: Number(ss.commissionPerUnitUgx ?? ss.commission_per_unit_ugx ?? 0),
                allowanceUgx: Number(ss.allowanceUgx ?? ss.allowance_ugx ?? 0),
                isActive: ss.isActive !== undefined ? Boolean(ss.isActive) : Boolean(ss.is_active ?? true),
              }))
            : state.salarySettings;

          const mergedSystemSettings = Array.isArray(centralData.systemSettings)
            ? centralData.systemSettings.map((sys: any) => ({
                id: sys.id,
                settingKey: sys.settingKey || sys.setting_key || '',
                settingValue: sys.settingValue || sys.setting_value || '',
                category: sys.category || 'GENERAL',
                description: sys.description || '',
                updatedAt: sys.updatedAt || sys.updated_at || new Date().toISOString(),
              }))
            : state.systemSettings;

          // Merge live central inventory levels
          const mergedStock = { ...state.inventoryStock };
          if (centralData.inventoryStock && typeof centralData.inventoryStock === 'object') {
            Object.keys(centralData.inventoryStock).forEach((storeId) => {
              mergedStock[storeId] = {
                ...(mergedStock[storeId] || {}),
                ...centralData.inventoryStock[storeId],
              };
            });
          }

          // ── Apply tombstones (central deletions) to local state ────────────
          // For each tombstone the server returned, filter out the matching
          // local record. Last-Write-Wins: if the local record's updatedAt is
          // NEWER than the tombstone deletedAt, the local edit wins and we
          // do NOT remove it (the next outbox push will resurrect it on server).
          const tombstones: Array<{ entityType: string; entityId: string; deletedAt: string }> =
            Array.isArray(centralData.deletedRecords) ? centralData.deletedRecords : [];

          const isDeletedRemotely = (entityType: string, id: string, localUpdatedAt?: string): boolean => {
            const ts = tombstones.find((t) => t.entityType === entityType && t.entityId === id);
            if (!ts) return false;
            // If local record has an updatedAt that is NEWER, the edit wins
            if (localUpdatedAt && localUpdatedAt > ts.deletedAt) return false;
            return true;
          };

          // Filter tombstoned records out of each merged list
          const finalBranches = mergedBranches.filter(
            (b: any) => !isDeletedRemotely('branches', b.id, b.updatedAt || b.createdAt)
          );
          const finalStores = mergedStores.filter(
            (s: any) => !isDeletedRemotely('stores', s.id)
          );
          const finalDepartments = mergedDepartments.filter(
            (d: any) => !isDeletedRemotely('departments', d.id, d.updatedAt || d.createdAt)
          );
          const finalWorkers = mergedWorkers.filter(
            (w: any) => !isDeletedRemotely('workers', w.id)
          );
          const finalUsers = mergedUsers.filter(
            (u: any) => u.username === 'admin' || !isDeletedRemotely('users', u.id, u.updatedAt)
          );
          const finalRoles = mergedRoles.filter(
            (r: any) => !isDeletedRemotely('roles', r.id)
          );
          const finalVehicles = mergedVehicles.filter(
            (v: any) => !isDeletedRemotely('vehicles', v.id)
          );
          const finalProducts = mergedProducts.filter(
            (p: any) => !isDeletedRemotely('products', p.id)
          );
          const finalCategories = mergedCategories.filter(
            (c: any) => !isDeletedRemotely('categories', c.id)
          );
          const finalBranchPrices = mergedBranchPrices.filter(
            (bp: any) => !isDeletedRemotely('branch_product_prices', bp.id)
          );
          const finalPaymentMethods = mergedPaymentMethods.filter(
            (pm: any) => !isDeletedRemotely('payment_methods', pm.id)
          );
          const finalExpenseTypes = mergedExpenseTypes.filter(
            (et: any) => !isDeletedRemotely('expense_types', et.id)
          );
          const finalDebtTypes = mergedDebtTypes.filter(
            (dt: any) => !isDeletedRemotely('debt_types', dt.id)
          );
          const finalSalarySettings = mergedSalarySettings.filter(
            (ss: any) => !isDeletedRemotely('salary_settings', ss.id)
          );
          const finalSystemSettings = mergedSystemSettings.filter(
            (sys: any) => !isDeletedRemotely('system_settings', sys.id)
          );


          // Mark any PENDING outbox items that reference a deleted entity as CONFLICT
          // so the UI can notify the user without silently re-pushing dead data.
          const updatedOutbox = state.outboxQueue.map((item) => {
            if (item.status !== 'PENDING') return item;
            const entityId = item.payload?.id || item.payload?.entityId;
            if (!entityId) return item;
            const ts = tombstones.find((t) => t.entityId === entityId && t.deletedAt > item.createdAt);
            if (ts) {
              return { ...item, status: 'CONFLICT' as const, conflictReason: 'DELETED_REMOTELY' };
            }
            return item;
          });
          const conflictCount = updatedOutbox.filter((i) => i.status === 'CONFLICT').length;
          const remainingPending = updatedOutbox.filter((i) => i.status === 'PENDING').length;

          return {
            branches: finalBranches,
            stores: finalStores,
            departments: finalDepartments,
            workers: finalWorkers,
            usersList: finalUsers,
            rolesList: finalRoles,
            vehicles: finalVehicles,
            products: finalProducts,
            categories: finalCategories,
            branchPrices: finalBranchPrices,
            paymentMethodsList: finalPaymentMethods,
            expenseTypes: finalExpenseTypes,
            debtTypes: finalDebtTypes,
            salarySettings: finalSalarySettings,
            systemSettings: finalSystemSettings,
            inventoryStock: mergedStock,
            outboxQueue: updatedOutbox,
            pendingSyncCount: remainingPending,
            // Advance the watermark to the server's clock so the next pull is delta-only
            lastSyncedAt: centralData.serverTime || centralData.timestamp || state.lastSyncedAt,
            // Surface conflict count via sync status when > 0
            syncStatus: conflictCount > 0 ? ('FAILED' as const) : state.syncStatus,
          };
        }),

      markOutboxSynced: (ackedIds: string[], conflictItems?: Array<{ id: string; reason?: string }>) =>
        set((state) => {
          const conflictSet = new Map((conflictItems || []).map((c) => [c.id, c.reason || 'SERVER_CONFLICT']));
          const updatedOutbox = state.outboxQueue.map((item) => {
            if (ackedIds.includes(item.id)) return { ...item, status: 'SYNCED' as const };
            if (conflictSet.has(item.id))
              return { ...item, status: 'CONFLICT' as const, conflictReason: conflictSet.get(item.id) };
            return item;
          });
          const remainingPending = updatedOutbox.filter((i) => i.status === 'PENDING').length;
          return {
            outboxQueue: updatedOutbox,
            pendingSyncCount: remainingPending,
          };
        }),

      // Master Data Mutators
      saveBranchInStore: (branch) =>
        set((state) => {
          const newBranches = state.branches.some((b) => b.id === branch.id)
            ? state.branches.map((b) => (b.id === branch.id ? branch : b))
            : [...state.branches, branch];
          const outboxItem: OutboxRecord = {
            id: `tx-branch-${branch.id}-${Date.now()}`,
            type: 'SAVE_BRANCH',
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            payload: branch,
          };
          return {
            branches: newBranches,
            outboxQueue: [outboxItem, ...state.outboxQueue],
            pendingSyncCount: state.pendingSyncCount + 1,
          };
        }),

      deleteBranchFromStore: (id) =>
        set((state) => ({
          branches: state.branches.filter((b) => b.id !== id),
          currentBranchId: state.currentBranchId === id ? '' : state.currentBranchId,
        })),

      saveStoreInStore: (st) =>
        set((state) => {
          const newStores = state.stores.some((s) => s.id === st.id)
            ? state.stores.map((s) => (s.id === st.id ? st : s))
            : [...state.stores, st];
          const outboxItem: OutboxRecord = {
            id: `tx-store-${st.id}-${Date.now()}`,
            type: 'SAVE_STORE',
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            payload: st,
          };
          return {
            stores: newStores,
            outboxQueue: [outboxItem, ...state.outboxQueue],
            pendingSyncCount: state.pendingSyncCount + 1,
          };
        }),

      deleteStoreFromStore: (id) =>
        set((state) => ({
          stores: state.stores.filter((s) => s.id !== id),
          currentStoreId: state.currentStoreId === id ? '' : state.currentStoreId,
        })),

      saveDepartmentInStore: (dept) =>
        set((state) => ({
          departments: state.departments.some((d) => d.id === dept.id)
            ? state.departments.map((d) => (d.id === dept.id ? dept : d))
            : [...state.departments, dept],
        })),

      deleteDepartmentFromStore: (id) =>
        set((state) => ({
          departments: state.departments.filter((d) => d.id !== id),
        })),

      saveWorkerInStore: (worker) =>
        set((state) => ({
          workers: state.workers.some((w) => w.id === worker.id)
            ? state.workers.map((w) => (w.id === worker.id ? worker : w))
            : [...state.workers, worker],
        })),

      deleteWorkerFromStore: (id) =>
        set((state) => ({
          workers: state.workers.filter((w) => w.id !== id),
        })),

      saveUserInStore: (u) =>
        set((state) => ({
          usersList: state.usersList.some((usr) => usr.id === u.id)
            ? state.usersList.map((usr) => (usr.id === u.id ? u : usr))
            : [...state.usersList, u],
        })),

      deleteUserFromStore: (id) =>
        set((state) => ({
          usersList: state.usersList.filter((usr) => usr.id !== id && usr.username !== 'admin'),
        })),

      saveRoleInStore: (role) =>
        set((state) => ({
          rolesList: state.rolesList.some((r) => r.id === role.id)
            ? state.rolesList.map((r) => (r.id === role.id ? role : r))
            : [...state.rolesList, role],
        })),

      deleteRoleFromStore: (id) =>
        set((state) => ({
          rolesList: state.rolesList.filter((r) => r.id !== id),
        })),

      saveVehicleInStore: (v) =>
        set((state) => ({
          vehicles: state.vehicles.some((veh) => veh.id === v.id)
            ? state.vehicles.map((veh) => (veh.id === v.id ? v : veh))
            : [...state.vehicles, v],
        })),

      deleteVehicleFromStore: (id) =>
        set((state) => ({
          vehicles: state.vehicles.filter((v) => v.id !== id),
        })),

      saveProductInStore: (p) =>
        set((state) => ({
          products: state.products.some((prod) => prod.id === p.id)
            ? state.products.map((prod) => (prod.id === p.id ? p : prod))
            : [...state.products, p],
        })),

      deleteProductFromStore: (id) =>
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        })),

      saveCategoryInStore: (cat) =>
        set((state) => ({
          categories: state.categories.some((c) => c.id === cat.id)
            ? state.categories.map((c) => (c.id === cat.id ? cat : c))
            : [...state.categories, cat],
        })),

      deleteCategoryFromStore: (id) =>
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        })),

      saveBranchPriceInStore: (price) =>
        set((state) => ({
          branchPrices: state.branchPrices.some((bp) => bp.branchId === price.branchId && bp.productId === price.productId)
            ? state.branchPrices.map((bp) => (bp.branchId === price.branchId && bp.productId === price.productId ? price : bp))
            : [...state.branchPrices, price],
        })),

      deleteBranchPriceFromStore: (id) =>
        set((state) => ({
          branchPrices: state.branchPrices.filter((bp) => bp.id !== id),
        })),

      savePaymentMethodInStore: (pm) =>
        set((state) => ({
          paymentMethodsList: state.paymentMethodsList.some((p) => p.id === pm.id)
            ? state.paymentMethodsList.map((p) => (p.id === pm.id ? pm : p))
            : [...state.paymentMethodsList, pm],
        })),

      deletePaymentMethodFromStore: (id) =>
        set((state) => ({
          paymentMethodsList: state.paymentMethodsList.filter((pm) => pm.id !== id),
        })),

      saveExpenseTypeInStore: (et) =>
        set((state) => ({
          expenseTypes: state.expenseTypes.some((e) => e.id === et.id)
            ? state.expenseTypes.map((e) => (e.id === et.id ? et : e))
            : [...state.expenseTypes, et],
        })),

      deleteExpenseTypeFromStore: (id) =>
        set((state) => ({
          expenseTypes: state.expenseTypes.filter((e) => e.id !== id),
        })),

      saveDebtTypeInStore: (dt) =>
        set((state) => ({
          debtTypes: state.debtTypes.some((d) => d.id === dt.id)
            ? state.debtTypes.map((d) => (d.id === dt.id ? dt : d))
            : [...state.debtTypes, dt],
        })),

      deleteDebtTypeFromStore: (id) =>
        set((state) => ({
          debtTypes: state.debtTypes.filter((d) => d.id !== id),
        })),

      saveSalarySettingInStore: (ss) =>
        set((state) => ({
          salarySettings: state.salarySettings.some((s) => s.id === ss.id)
            ? state.salarySettings.map((s) => (s.id === ss.id ? ss : s))
            : [...state.salarySettings, ss],
        })),

      deleteSalarySettingFromStore: (id) =>
        set((state) => ({
          salarySettings: state.salarySettings.filter((s) => s.id !== id),
        })),

      saveSystemSettingInStore: (sys) =>
        set((state) => ({
          systemSettings: state.systemSettings.some((s) => s.id === sys.id)
            ? state.systemSettings.map((s) => (s.id === sys.id ? sys : s))
            : [...state.systemSettings, sys],
        })),

      deleteSystemSettingFromStore: (id) =>
        set((state) => ({
          systemSettings: state.systemSettings.filter((sys) => sys.id !== id),
        })),

      // Operational Mutators
      addSaleRecord: (sale) =>
        set((state) => {
          const storeStock = { ...(state.inventoryStock[sale.storeId] || {}) };
          sale.items.forEach((item) => {
            const cur = storeStock[item.productId] || 0;
            storeStock[item.productId] = Math.max(0, cur - item.quantity);
          });

          const newOutbox: OutboxRecord = {
            id: `outbox-sale-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            type: 'SALE',
            receiptNumber: sale.receiptNumber,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            payload: sale,
          };

          const newAudit: AuditRecord = {
            id: `audit-${Date.now()}`,
            user: state.user?.fullName || 'Cashier',
            action: 'SALE_COMPLETED',
            entity: 'Sale',
            details: `Receipt ${sale.receiptNumber} completed for UGX ${sale.totalAmountUgx.toLocaleString()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };

          return {
            salesHistory: [sale, ...state.salesHistory],
            inventoryStock: {
              ...state.inventoryStock,
              [sale.storeId]: storeStock,
            },
            outboxQueue: [newOutbox, ...state.outboxQueue],
            pendingSyncCount: state.pendingSyncCount + 1,
            auditLogs: [newAudit, ...state.auditLogs],
          };
        }),

      addStockIntake: ({ storeId, productId, quantity, unitCostUgx, batchRef, notes }) =>
        set((state) => {
          const storeStock = state.inventoryStock[storeId] || {};
          const currentQty = storeStock[productId] || 0;

          const outboxItem: OutboxRecord = {
            id: `outbox-intake-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            type: 'STOCK_INTAKE',
            receiptNumber: batchRef,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            payload: { storeId, productId, quantity, unitCostUgx, batchRef, notes },
          };

          const newAudit: AuditRecord = {
            id: `audit-${Date.now()}`,
            user: state.user?.fullName || 'Storekeeper',
            action: 'STOCK_INTAKE_RECEIVED',
            entity: 'StockLedger',
            details: `Received ${quantity} units into store (Batch: ${batchRef})`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };

          return {
            inventoryStock: {
              ...state.inventoryStock,
              [storeId]: {
                ...storeStock,
                [productId]: currentQty + quantity,
              },
            },
            outboxQueue: [outboxItem, ...state.outboxQueue],
            pendingSyncCount: state.pendingSyncCount + 1,
            auditLogs: [newAudit, ...state.auditLogs],
          };
        }),

      addExpense: (expense) =>
        set((state) => {
          const outboxItem: OutboxRecord = {
            id: `outbox-exp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            type: 'EXPENSE',
            receiptNumber: expense.voucherNumber,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            payload: expense,
          };
          return {
            expensesList: [expense, ...state.expensesList],
            outboxQueue: [outboxItem, ...state.outboxQueue],
            pendingSyncCount: state.pendingSyncCount + 1,
          };
        }),

      addDebt: (debt) =>
        set((state) => {
          const outboxItem: OutboxRecord = {
            id: `outbox-debt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            type: 'DEBT',
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            payload: debt,
          };
          return {
            debtsList: [debt, ...state.debtsList],
            outboxQueue: [outboxItem, ...state.outboxQueue],
            pendingSyncCount: state.pendingSyncCount + 1,
          };
        }),

      settleDebt: (debtId, amountPaidUgx) =>
        set((state) => ({
          debtsList: state.debtsList.map((d) => {
            if (d.id === debtId) {
              const newPaid = d.paidAmountUgx + amountPaidUgx;
              const newBalance = Math.max(0, d.originalAmountUgx - newPaid);
              return {
                ...d,
                paidAmountUgx: newPaid,
                balanceAmountUgx: newBalance,
                status: newBalance === 0 ? 'CLEARED' : 'PARTIALLY_PAID',
              };
            }
            return d;
          }),
        })),

      recordSalaryPayment: (payment) =>
        set((state) => ({
          salaryPaymentsList: [payment, ...state.salaryPaymentsList],
          debtsList: payment.debtDeductedUgx > 0
            ? state.debtsList.map((d) =>
                d.debtorName === payment.workerName
                  ? {
                      ...d,
                      paidAmountUgx: d.paidAmountUgx + payment.debtDeductedUgx,
                      balanceAmountUgx: Math.max(0, d.balanceAmountUgx - payment.debtDeductedUgx),
                      status: d.balanceAmountUgx - payment.debtDeductedUgx <= 0 ? 'CLEARED' : 'PARTIALLY_PAID',
                    }
                  : d
              )
            : state.debtsList,
        })),

      startFieldSession: (session) =>
        set((state) => {
          const storeStock = { ...(state.inventoryStock[session.storeId] || {}) };
          session.items.forEach((item) => {
            const cur = storeStock[item.productId] || 0;
            storeStock[item.productId] = Math.max(0, cur - item.issuedQty);
          });

          const outboxItem: OutboxRecord = {
            id: `outbox-fs-${session.id}`,
            type: 'FIELD_SESSION',
            receiptNumber: session.sessionNumber,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            payload: session,
          };

          return {
            fieldSessionsList: [session, ...state.fieldSessionsList],
            inventoryStock: {
              ...state.inventoryStock,
              [session.storeId]: storeStock,
            },
            outboxQueue: [outboxItem, ...state.outboxQueue],
            pendingSyncCount: state.pendingSyncCount + 1,
          };
        }),

      closeFieldSession: (sessionId, reconciledItems, varianceUgx = 0) =>
        set((state) => {
          const session = state.fieldSessionsList.find((s) => s.id === sessionId);
          if (!session) return state;

          const storeStock = { ...(state.inventoryStock[session.storeId] || {}) };
          reconciledItems.forEach((item) => {
            const cur = storeStock[item.productId] || 0;
            const returnBack = (item.returnedQty || 0);
            storeStock[item.productId] = cur + returnBack;
          });

          let updatedDebts = [...state.debtsList];
          if (varianceUgx < 0) {
            const shortageDebt: DebtRecord = {
              id: `debt-${Date.now()}`,
              debtorName: session.workerName,
              source: `FIELD_SHORTAGE (${session.sessionNumber})`,
              originalAmountUgx: Math.abs(varianceUgx),
              paidAmountUgx: 0,
              balanceAmountUgx: Math.abs(varianceUgx),
              status: 'OUTSTANDING',
              date: new Date().toISOString().split('T')[0],
            };
            updatedDebts = [shortageDebt, ...updatedDebts];
          }

          return {
            fieldSessionsList: state.fieldSessionsList.map((s) =>
              s.id === sessionId ? { ...s, status: 'RECONCILED', endTime: new Date().toISOString() } : s
            ),
            inventoryStock: {
              ...state.inventoryStock,
              [session.storeId]: storeStock,
            },
            debtsList: updatedDebts,
          };
        }),

      createStockTransfer: (transfer) =>
        set((state) => ({
          stockTransfersList: [transfer, ...state.stockTransfersList],
        })),

      advanceTransferStatus: (transferId, nextStatus) =>
        set((state) => {
          const trf = state.stockTransfersList.find((t) => t.id === transferId);
          if (!trf) return state;

          const newStock = { ...state.inventoryStock };

          if (nextStatus === 'IN_TRANSIT' || nextStatus === 'DISPATCHED') {
            const srcStock = { ...(newStock[trf.sourceStoreId] || {}) };
            srcStock[trf.productId] = Math.max(0, (srcStock[trf.productId] || 0) - trf.quantity);
            newStock[trf.sourceStoreId] = srcStock;
          }

          if (nextStatus === 'CONFIRMED') {
            const dstStock = { ...(newStock[trf.destStoreId] || {}) };
            dstStock[trf.productId] = (dstStock[trf.productId] || 0) + trf.quantity;
            newStock[trf.destStoreId] = dstStock;
          }

          return {
            stockTransfersList: state.stockTransfersList.map((t) =>
              t.id === transferId ? { ...t, status: nextStatus } : t
            ),
            inventoryStock: newStock,
          };
        }),

      resetProductionData: (clearDemoMaster = false) =>
        set((state) => {
          const cleanStock: Record<string, Record<string, number>> = {};
          const activeStores = clearDemoMaster ? [] : state.stores;
          const activeProducts = clearDemoMaster ? [] : state.products;

          activeStores.forEach((st) => {
            cleanStock[st.id] = {};
            activeProducts.forEach((p) => {
              cleanStock[st.id][p.id] = 0;
            });
          });

          const resetAuditLog: AuditRecord = {
            id: `audit-${Date.now()}`,
            user: state.user?.fullName || 'System Super Administrator',
            action: 'PRODUCTION_DATA_RESET',
            entity: 'SystemLedger',
            details: clearDemoMaster
              ? 'Complete System Reset: Demo branches, products, and transactions cleared. Ready for fresh customer configuration.'
              : 'Purged all test sales, field sessions, transfers, expenses, and outbox queues. Stock initialized to 0.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };

          const defaultAdminUser: User = {
            id: 'u1111111-1111-1111-1111-111111111111',
            username: 'admin',
            fullName: 'System Super Administrator',
            role: UserRole.SUPER_ADMIN,
            branchId: clearDemoMaster ? '' : 'b1111111-1111-1111-1111-111111111111',
            storeId: clearDemoMaster ? '' : 's1111111-1111-1111-1111-111111111111',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          return {
            cart: [],
            overallDiscountUgx: 0,
            pendingSyncCount: 0,
            syncStatus: 'SYNCED',
            salesHistory: [],
            fieldSessionsList: [],
            stockTransfersList: [],
            expensesList: [],
            debtsList: [],
            salaryPaymentsList: [],
            outboxQueue: [],
            auditLogs: [resetAuditLog],
            inventoryStock: cleanStock,
            branches: clearDemoMaster ? [] : state.branches,
            stores: clearDemoMaster ? [] : state.stores,
            workers: clearDemoMaster ? [] : state.workers,
            vehicles: clearDemoMaster ? [] : state.vehicles,
            products: clearDemoMaster ? [] : state.products,
            branchPrices: clearDemoMaster ? [] : state.branchPrices,
            usersList: clearDemoMaster ? [defaultAdminUser] : state.usersList,
          };
        }),

      // Cart actions
      addToCart: (product) =>
        set((state) => {
          const existing = state.cart.find((item) => item.productId === product.id);
          if (existing) {
            return {
              cart: state.cart.map((item) =>
                item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
              ),
            };
          }
          return {
            cart: [
              ...state.cart,
              {
                productId: product.id,
                sku: product.sku,
                name: product.name,
                unitPriceUgx: product.sellingPriceUgx,
                quantity: 1,
                discountUgx: 0,
              },
            ],
          };
        }),

      removeFromCart: (productId) =>
        set((state) => ({ cart: state.cart.filter((item) => item.productId !== productId) })),

      updateCartQty: (productId, qty) =>
        set((state) => ({
          cart: state.cart.map((item) =>
            item.productId === productId ? { ...item, quantity: Math.max(1, qty) } : item
          ),
        })),

      updateCartDiscount: (productId, discountUgx) =>
        set((state) => ({
          cart: state.cart.map((item) =>
            item.productId === productId ? { ...item, discountUgx: Math.max(0, discountUgx) } : item
          ),
        })),

      setOverallDiscount: (overallDiscountUgx) => set({ overallDiscountUgx: Math.max(0, overallDiscountUgx) }),
      setPaymentMethod: (selectedPaymentMethod) => set({ selectedPaymentMethod }),
      clearCart: () => set({ cart: [], overallDiscountUgx: 0 }),
    }),
    {
      name: 'aquapos-offline-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
