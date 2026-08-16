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
  status: 'PENDING' | 'SYNCED';
  createdAt: string;
  payload?: any;
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
  markOutboxSynced: (ackedIds: string[]) => void;

  // Master Data Mutators
  saveBranchInStore: (branch: Branch) => void;
  saveStoreInStore: (store: Store) => void;
  saveDepartmentInStore: (dept: Department) => void;
  saveWorkerInStore: (worker: Worker) => void;
  saveUserInStore: (u: User) => void;
  saveRoleInStore: (role: RoleDefinition) => void;
  saveVehicleInStore: (v: Vehicle) => void;
  saveProductInStore: (p: Product) => void;
  saveCategoryInStore: (cat: ProductCategory) => void;
  saveBranchPriceInStore: (price: BranchPrice) => void;
  savePaymentMethodInStore: (pm: PaymentMethodConfig) => void;
  saveExpenseTypeInStore: (et: ExpenseType) => void;
  saveDebtTypeInStore: (dt: DebtType) => void;
  saveSalarySettingInStore: (ss: SalarySetting) => void;
  saveSystemSettingInStore: (sys: SystemSetting) => void;

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
      currentBranchId: 'b1111111-1111-1111-1111-111111111111',
      currentStoreId: 's1111111-1111-1111-1111-111111111111',
      isOnline: true,
      syncStatus: 'SYNCED',
      pendingSyncCount: 0,

      // Initial Master Data Seeds for Offline & Desktop UI
      branches: [
        { id: 'b1111111-1111-1111-1111-111111111111', code: 'LWG-01', name: 'Lwengo Branch', location: 'Lwengo Town Centre', isActive: true, createdAt: '2026-01-01' },
        { id: 'b2222222-2222-2222-2222-222222222222', code: 'ISG-01', name: 'Isingiro Branch', location: 'Isingiro Main Street', isActive: true, createdAt: '2026-01-01' },
      ],
      stores: [
        { id: 's1111111-1111-1111-1111-111111111111', branchId: 'b1111111-1111-1111-1111-111111111111', code: 'STORE-LWG-MAIN', name: 'Lwengo Main Store', type: 'MAIN_STORE', isActive: true },
        { id: 's2222222-2222-2222-2222-222222222222', branchId: 'b2222222-2222-2222-2222-222222222222', code: 'STORE-ISG-MAIN', name: 'Isingiro Main Store', type: 'MAIN_STORE', isActive: true },
        { id: 's3333333-3333-3333-3333-333333333333', branchId: 'b2222222-2222-2222-2222-222222222222', code: 'STORE-ISG-SALES', name: 'Isingiro Retail Sales Store', type: 'SALES_STORE', isActive: true },
      ],
      departments: [
        { id: 'd1111111-1111-1111-1111-111111111111', code: 'FIELD_SALES', name: 'Field Sales & Distribution', description: 'Route truck sales and van delivery teams', isActive: true },
        { id: 'd2222222-2222-2222-2222-222222222222', code: 'STOCKING', name: 'Store & Inventory Management', description: 'Warehouse stockkeepers and loading clerks', isActive: true },
        { id: 'd3333333-3333-3333-3333-333333333333', code: 'FINANCE', name: 'Finance & Accounting', description: 'Audit, cash handling, and payroll management', isActive: true },
        { id: 'd4444444-4444-4444-4444-444444444444', code: 'ADMIN', name: 'Executive Administration', description: 'General management and system governance', isActive: true },
      ],
      workers: [
        { id: 'w1111111-1111-1111-1111-111111111111', branchId: 'b1111111-1111-1111-1111-111111111111', department: 'FIELD_SALES', fullName: 'Lwengo Sales Worker A', phone: '+256700111001', role: UserRole.FIELD_SALESPERSON, basicSalaryUgx: 450000, isActive: true },
        { id: 'w2222222-2222-2222-2222-222222222222', branchId: 'b1111111-1111-1111-1111-111111111111', department: 'FIELD_SALES', fullName: 'Lwengo Sales Worker B', phone: '+256700111002', role: UserRole.FIELD_SALESPERSON, basicSalaryUgx: 450000, isActive: true },
        { id: 'w3333333-3333-3333-3333-333333333333', branchId: 'b1111111-1111-1111-1111-111111111111', department: 'STOCKING', fullName: 'Lwengo Stocking Worker C', phone: '+256700111003', role: UserRole.STOREKEEPER, basicSalaryUgx: 500000, isActive: true },
        { id: 'w4444444-4444-4444-4444-444444444444', branchId: 'b1111111-1111-1111-1111-111111111111', department: 'STOCKING', fullName: 'Lwengo Stocking Worker D', phone: '+256700111004', role: UserRole.STOREKEEPER, basicSalaryUgx: 500000, isActive: true },
        { id: 'w5555555-5555-5555-5555-555555555555', branchId: 'b2222222-2222-2222-2222-222222222222', department: 'STOCKING', fullName: 'Isingiro Worker A', phone: '+256700222001', role: UserRole.STOREKEEPER, basicSalaryUgx: 520000, isActive: true },
        { id: 'w6666666-6666-6666-6666-666666666666', branchId: 'b2222222-2222-2222-2222-222222222222', department: 'FIELD_SALES', fullName: 'Isingiro Worker B', phone: '+256700222002', role: UserRole.CASHIER, basicSalaryUgx: 480000, isActive: true },
      ],
      usersList: [
        { id: 'u1111111-1111-1111-1111-111111111111', username: 'admin', fullName: 'System Super Administrator', role: UserRole.SUPER_ADMIN, branchId: 'b1111111-1111-1111-1111-111111111111', storeId: 's1111111-1111-1111-1111-111111111111', isActive: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
        { id: 'u2222222-2222-2222-2222-222222222222', username: 'mgr_lwengo', fullName: 'Lwengo Branch Manager', role: UserRole.BRANCH_MANAGER, branchId: 'b1111111-1111-1111-1111-111111111111', storeId: 's1111111-1111-1111-1111-111111111111', isActive: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
        { id: 'u3333333-3333-3333-3333-333333333333', username: 'mgr_isingiro', fullName: 'Isingiro Branch Manager', role: UserRole.BRANCH_MANAGER, branchId: 'b2222222-2222-2222-2222-222222222222', storeId: 's2222222-2222-2222-2222-222222222222', isActive: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
        { id: 'u4444444-4444-4444-4444-444444444444', username: 'storekeeper_a', fullName: 'Lwengo Storekeeper C', role: UserRole.STOREKEEPER, branchId: 'b1111111-1111-1111-1111-111111111111', storeId: 's1111111-1111-1111-1111-111111111111', isActive: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
        { id: 'u5555555-5555-5555-5555-555555555555', username: 'cashier_isingiro', fullName: 'Isingiro Cashier B', role: UserRole.CASHIER, branchId: 'b2222222-2222-2222-2222-222222222222', storeId: 's3333333-3333-3333-3333-333333333333', isActive: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
        { id: 'u6666666-6666-6666-6666-666666666666', username: 'sales_worker_a', fullName: 'Lwengo Field Representative A', role: UserRole.FIELD_SALESPERSON, branchId: 'b1111111-1111-1111-1111-111111111111', storeId: 's1111111-1111-1111-1111-111111111111', isActive: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
        { id: 'u7777777-7777-7777-7777-777777777777', username: 'accountant_01', fullName: 'Lead Finance Accountant', role: UserRole.ACCOUNTANT, branchId: 'b1111111-1111-1111-1111-111111111111', storeId: 's1111111-1111-1111-1111-111111111111', isActive: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
        { id: 'u8888888-8888-8888-8888-888888888888', username: 'auditor_01', fullName: 'Internal Auditor', role: UserRole.AUDITOR, branchId: 'b1111111-1111-1111-1111-111111111111', storeId: 's1111111-1111-1111-1111-111111111111', isActive: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
      ],
      rolesList: [
        { id: 'r1111111-1111-1111-1111-111111111111', code: 'SUPER_ADMIN', displayName: 'Super Administrator', description: 'Full system access and global configuration', permissions: ['*'], isActive: true },
        { id: 'r2222222-2222-2222-2222-222222222222', code: 'BRANCH_MANAGER', displayName: 'Branch Manager', description: 'Branch operations, transfers approval, and reporting', permissions: ['manage_branch', 'approve_transfers', 'view_reports'], isActive: true },
        { id: 'r3333333-3333-3333-3333-333333333333', code: 'STOREKEEPER', displayName: 'Storekeeper', description: 'Stock intake, transfer dispatch, inventory counts', permissions: ['manage_stock', 'dispatch_transfers'], isActive: true },
        { id: 'r4444444-4444-4444-4444-444444444444', code: 'CASHIER', displayName: 'Store Cashier', description: 'Point of sale operations and customer checkout', permissions: ['create_sales', 'print_receipts'], isActive: true },
        { id: 'r5555555-5555-5555-5555-555555555555', code: 'FIELD_SALESPERSON', displayName: 'Field Sales Representative', description: 'Route sales sessions and customer deliveries', permissions: ['field_sales'], isActive: true },
        { id: 'r6666666-6666-6666-6666-666666666666', code: 'ACCOUNTANT', displayName: 'Accountant / Auditor', description: 'Expense approvals, debt payments, salary processing', permissions: ['manage_finance', 'reconcile_sessions'], isActive: true },
      ],
      vehicles: [
        { id: 'v1111111-1111-1111-1111-111111111111', branchId: 'b1111111-1111-1111-1111-111111111111', registrationNumber: 'UBB 450L', type: 'LORRY', model: 'Isuzu Elf Lorry', isActive: true },
        { id: 'v2222222-2222-2222-2222-222222222222', branchId: 'b1111111-1111-1111-1111-111111111111', registrationNumber: 'UFX 101T', type: 'TRICYCLE', model: 'Tuk-Tuk Cargo Tricycle 01', isActive: true },
        { id: 'v3333333-3333-3333-3333-333333333333', branchId: 'b1111111-1111-1111-1111-111111111111', registrationNumber: 'UFX 102T', type: 'TRICYCLE', model: 'Tuk-Tuk Cargo Tricycle 02', isActive: true },
        { id: 'v4444444-4444-4444-4444-444444444444', branchId: 'b2222222-2222-2222-2222-222222222222', registrationNumber: 'UBC 880L', type: 'LORRY', model: 'Mitsubishi Fuso Lorry', isActive: true },
        { id: 'v5555555-5555-5555-5555-555555555555', branchId: 'b2222222-2222-2222-2222-222222222222', registrationNumber: 'UFX 201T', type: 'TRICYCLE', model: 'Tuk-Tuk Cargo Tricycle 03', isActive: true },
      ],
      products: [
        { id: 'p1111111-1111-1111-1111-111111111111', sku: 'WTR-500ML', name: 'Pure Mineral Water 500ml', category: 'BOTTLED_WATER', unitOfMeasure: 'Carton (24)', capacityMl: 500, costPriceUgx: 500, sellingPriceUgx: 1000, minStockAlert: 50, maxStockLevel: 5000, isActive: true, createdAt: '2026-01-01' },
        { id: 'p2222222-2222-2222-2222-222222222222', sku: 'WTR-1.5L', name: 'Pure Mineral Water 1.5L', category: 'BOTTLED_WATER', unitOfMeasure: 'Carton (12)', capacityMl: 1500, costPriceUgx: 1200, sellingPriceUgx: 2000, minStockAlert: 30, maxStockLevel: 3000, isActive: true, createdAt: '2026-01-01' },
        { id: 'p3333333-3333-3333-3333-333333333333', sku: 'WTR-5L', name: 'Pure Water Bottle 5L', category: 'BOTTLED_WATER', unitOfMeasure: 'Piece', capacityMl: 5000, costPriceUgx: 3500, sellingPriceUgx: 6000, minStockAlert: 20, maxStockLevel: 1000, isActive: true, createdAt: '2026-01-01' },
        { id: 'p4444444-4444-4444-4444-444444444444', sku: 'WTR-20L', name: 'Refillable Water Jerrican 20L', category: 'REFILL_JERRICAN', unitOfMeasure: 'Piece', capacityMl: 20000, costPriceUgx: 6000, sellingPriceUgx: 10000, minStockAlert: 10, maxStockLevel: 500, isActive: true, createdAt: '2026-01-01' },
      ],
      categories: [
        { id: 'c1111111-1111-1111-1111-111111111111', code: 'BOTTLED_WATER', name: 'Bottled Mineral Water', description: 'Standard PET bottled drinking water', isActive: true },
        { id: 'c2222222-2222-2222-2222-222222222222', code: 'REFILL_JERRICAN', name: 'Refillable Jerricans', description: 'Large capacity 20L reusable water containers', isActive: true },
        { id: 'c3333333-3333-3333-3333-333333333333', code: 'DISPENSER_ACCESSORIES', name: 'Dispenser & Accessories', description: 'Water pumps, dispensers, and accessories', isActive: true },
      ],
      branchPrices: [
        { id: 'bp-1', branchId: 'b1111111-1111-1111-1111-111111111111', productId: 'p1111111-1111-1111-1111-111111111111', costPriceUgx: 500, sellingPriceUgx: 1000 },
        { id: 'bp-2', branchId: 'b2222222-2222-2222-2222-222222222222', productId: 'p1111111-1111-1111-1111-111111111111', costPriceUgx: 550, sellingPriceUgx: 1100 },
      ],
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
      salarySettings: [
        { id: 'ss111111-1111-1111-1111-111111111111', roleCode: 'FIELD_SALESPERSON', departmentCode: 'FIELD_SALES', baseSalaryUgx: 450000, commissionPerUnitUgx: 50, allowanceUgx: 20000, isActive: true },
        { id: 'ss222222-2222-2222-2222-222222222222', roleCode: 'STOREKEEPER', departmentCode: 'STOCKING', baseSalaryUgx: 500000, commissionPerUnitUgx: 0, allowanceUgx: 10000, isActive: true },
      ],
      systemSettings: [
        { id: 'sys11111-1111-1111-1111-111111111111', settingKey: 'COMPANY_NAME', settingValue: 'AquaPOS Pure Mineral Water Ltd', category: 'GENERAL', description: 'Registered company name', isActive: true },
        { id: 'sys22222-2222-2222-2222-222222222222', settingKey: 'DEFAULT_CURRENCY', settingValue: 'UGX', category: 'FINANCE', description: 'Default transaction currency', isActive: true },
        { id: 'sys33333-3333-3333-3333-333333333333', settingKey: 'ALLOW_OFFLINE_SALES', settingValue: 'TRUE', category: 'OPERATIONS', description: 'Allow offline POS sales queueing', isActive: true },
        { id: 'sys44444-4444-4444-4444-444444444444', settingKey: 'MAX_DISCOUNT_PERCENT', settingValue: '10', category: 'SALES', description: 'Maximum cashier discount allowed without PIN', isActive: true },
      ],

      // Initial Inventory balances: [storeId][productId] = Qty
      inventoryStock: {
        's1111111-1111-1111-1111-111111111111': {
          'p1111111-1111-1111-1111-111111111111': 4500,
          'p2222222-2222-2222-2222-222222222222': 2800,
          'p3333333-3333-3333-3333-333333333333': 600,
          'p4444444-4444-4444-4444-444444444444': 400,
        },
        's2222222-2222-2222-2222-222222222222': {
          'p1111111-1111-1111-1111-111111111111': 3800,
          'p2222222-2222-2222-2222-222222222222': 1500,
          'p3333333-3333-3333-3333-333333333333': 300,
          'p4444444-4444-4444-4444-444444444444': 280,
        },
        's3333333-3333-3333-3333-333333333333': {
          'p1111111-1111-1111-1111-111111111111': 950,
          'p2222222-2222-2222-2222-222222222222': 420,
          'p3333333-3333-3333-3333-333333333333': 120,
          'p4444444-4444-4444-4444-444444444444': 60,
        },
      },

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

          const mergedBranches = Array.isArray(centralData.branches) && centralData.branches.length > 0 ? centralData.branches : state.branches;
          const mergedStores = Array.isArray(centralData.stores) && centralData.stores.length > 0 ? centralData.stores : state.stores;
          const mergedProducts = Array.isArray(centralData.products) && centralData.products.length > 0 ? centralData.products : state.products;

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

          return {
            branches: mergedBranches,
            stores: mergedStores,
            departments: Array.isArray(centralData.departments) && centralData.departments.length > 0 ? centralData.departments : state.departments,
            workers: Array.isArray(centralData.workers) && centralData.workers.length > 0 ? centralData.workers : state.workers,
            usersList: Array.isArray(centralData.users) && centralData.users.length > 0 ? centralData.users : state.usersList,
            rolesList: Array.isArray(centralData.roles) && centralData.roles.length > 0 ? centralData.roles : state.rolesList,
            vehicles: Array.isArray(centralData.vehicles) && centralData.vehicles.length > 0 ? centralData.vehicles : state.vehicles,
            products: mergedProducts,
            categories: Array.isArray(centralData.categories) && centralData.categories.length > 0 ? centralData.categories : state.categories,
            branchPrices: Array.isArray(centralData.branchPrices) ? centralData.branchPrices : state.branchPrices,
            paymentMethodsList: Array.isArray(centralData.paymentMethods) && centralData.paymentMethods.length > 0 ? centralData.paymentMethods : state.paymentMethodsList,
            expenseTypes: Array.isArray(centralData.expenseTypes) && centralData.expenseTypes.length > 0 ? centralData.expenseTypes : state.expenseTypes,
            debtTypes: Array.isArray(centralData.debtTypes) && centralData.debtTypes.length > 0 ? centralData.debtTypes : state.debtTypes,
            salarySettings: Array.isArray(centralData.salarySettings) && centralData.salarySettings.length > 0 ? centralData.salarySettings : state.salarySettings,
            systemSettings: Array.isArray(centralData.systemSettings) && centralData.systemSettings.length > 0 ? centralData.systemSettings : state.systemSettings,
            inventoryStock: mergedStock,
          };
        }),

      markOutboxSynced: (ackedIds: string[]) =>
        set((state) => {
          const updatedOutbox = state.outboxQueue.map((item) =>
            ackedIds.includes(item.id) ? { ...item, status: 'SYNCED' as const } : item
          );
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

      saveDepartmentInStore: (dept) =>
        set((state) => ({
          departments: state.departments.some((d) => d.id === dept.id)
            ? state.departments.map((d) => (d.id === dept.id ? dept : d))
            : [...state.departments, dept],
        })),

      saveWorkerInStore: (worker) =>
        set((state) => ({
          workers: state.workers.some((w) => w.id === worker.id)
            ? state.workers.map((w) => (w.id === worker.id ? worker : w))
            : [...state.workers, worker],
        })),

      saveUserInStore: (u) =>
        set((state) => ({
          usersList: state.usersList.some((usr) => usr.id === u.id)
            ? state.usersList.map((usr) => (usr.id === u.id ? u : usr))
            : [...state.usersList, u],
        })),

      saveRoleInStore: (role) =>
        set((state) => ({
          rolesList: state.rolesList.some((r) => r.id === role.id)
            ? state.rolesList.map((r) => (r.id === role.id ? role : r))
            : [...state.rolesList, role],
        })),

      saveVehicleInStore: (v) =>
        set((state) => ({
          vehicles: state.vehicles.some((veh) => veh.id === v.id)
            ? state.vehicles.map((veh) => (veh.id === v.id ? v : veh))
            : [...state.vehicles, v],
        })),

      saveProductInStore: (p) =>
        set((state) => ({
          products: state.products.some((prod) => prod.id === p.id)
            ? state.products.map((prod) => (prod.id === p.id ? p : prod))
            : [...state.products, p],
        })),

      saveCategoryInStore: (cat) =>
        set((state) => ({
          categories: state.categories.some((c) => c.id === cat.id)
            ? state.categories.map((c) => (c.id === cat.id ? cat : c))
            : [...state.categories, cat],
        })),

      saveBranchPriceInStore: (price) =>
        set((state) => ({
          branchPrices: state.branchPrices.some((bp) => bp.branchId === price.branchId && bp.productId === price.productId)
            ? state.branchPrices.map((bp) => (bp.branchId === price.branchId && bp.productId === price.productId ? price : bp))
            : [...state.branchPrices, price],
        })),

      savePaymentMethodInStore: (pm) =>
        set((state) => ({
          paymentMethodsList: state.paymentMethodsList.some((p) => p.id === pm.id)
            ? state.paymentMethodsList.map((p) => (p.id === pm.id ? pm : p))
            : [...state.paymentMethodsList, pm],
        })),

      saveExpenseTypeInStore: (et) =>
        set((state) => ({
          expenseTypes: state.expenseTypes.some((e) => e.id === et.id)
            ? state.expenseTypes.map((e) => (e.id === et.id ? et : e))
            : [...state.expenseTypes, et],
        })),

      saveDebtTypeInStore: (dt) =>
        set((state) => ({
          debtTypes: state.debtTypes.some((d) => d.id === dt.id)
            ? state.debtTypes.map((d) => (d.id === dt.id ? dt : d))
            : [...state.debtTypes, dt],
        })),

      saveSalarySettingInStore: (ss) =>
        set((state) => ({
          salarySettings: state.salarySettings.some((s) => s.id === ss.id)
            ? state.salarySettings.map((s) => (s.id === ss.id ? ss : s))
            : [...state.salarySettings, ss],
        })),

      saveSystemSettingInStore: (sys) =>
        set((state) => ({
          systemSettings: state.systemSettings.some((s) => s.id === sys.id)
            ? state.systemSettings.map((s) => (s.id === sys.id ? sys : s))
            : [...state.systemSettings, sys],
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
