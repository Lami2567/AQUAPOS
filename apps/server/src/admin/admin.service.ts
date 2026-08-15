import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { AuditService } from '../audit/audit.service.js';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AdminService {
  constructor(
    private dbService: DatabaseService,
    private auditService: AuditService
  ) {}

  // 1. Branches
  getAllBranches() {
    return this.dbService.query('SELECT * FROM branches ORDER BY name ASC');
  }

  saveBranch(data: { id?: string; code: string; name: string; location: string; isActive?: boolean }, userId: string) {
    const id = data.id || uuidv4();
    const isActive = data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1;
    const existing = this.dbService.queryOne('SELECT * FROM branches WHERE id = ?', [id]);

    if (existing) {
      this.dbService.execute(
        'UPDATE branches SET code = ?, name = ?, location = ?, is_active = ? WHERE id = ?',
        [data.code, data.name, data.location, isActive, id]
      );
      this.auditService.logAction(userId, 'System Admin', 'GLOBAL', 'SERVER-01', 'UPDATE', 'Branch', id, existing, data);
    } else {
      this.dbService.execute(
        'INSERT INTO branches (id, code, name, location, is_active) VALUES (?, ?, ?, ?, ?)',
        [id, data.code, data.name, data.location, isActive]
      );
      this.auditService.logAction(userId, 'System Admin', 'GLOBAL', 'SERVER-01', 'CREATE', 'Branch', id, undefined, data);
    }
    return this.dbService.queryOne('SELECT * FROM branches WHERE id = ?', [id]);
  }

  // 2. Stores
  getAllStores() {
    return this.dbService.query(`
      SELECT s.*, b.name as branch_name 
      FROM stores s 
      LEFT JOIN branches b ON s.branch_id = b.id 
      ORDER BY s.name ASC
    `);
  }

  saveStore(data: { id?: string; branchId: string; code: string; name: string; type: string; isActive?: boolean }, userId: string) {
    const id = data.id || uuidv4();
    const isActive = data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1;
    const existing = this.dbService.queryOne('SELECT * FROM stores WHERE id = ?', [id]);

    if (existing) {
      this.dbService.execute(
        'UPDATE stores SET branch_id = ?, code = ?, name = ?, type = ?, is_active = ? WHERE id = ?',
        [data.branchId, data.code, data.name, data.type, isActive, id]
      );
      this.auditService.logAction(userId, 'System Admin', data.branchId, 'SERVER-01', 'UPDATE', 'Store', id, existing, data);
    } else {
      this.dbService.execute(
        'INSERT INTO stores (id, branch_id, code, name, type, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        [id, data.branchId, data.code, data.name, data.type, isActive]
      );
      this.auditService.logAction(userId, 'System Admin', data.branchId, 'SERVER-01', 'CREATE', 'Store', id, undefined, data);
    }
    return this.dbService.queryOne('SELECT * FROM stores WHERE id = ?', [id]);
  }

  // 3. Departments
  getAllDepartments() {
    return this.dbService.query('SELECT * FROM departments ORDER BY name ASC');
  }

  saveDepartment(data: { id?: string; code: string; name: string; description?: string; isActive?: boolean }, userId: string) {
    const id = data.id || uuidv4();
    const isActive = data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1;
    const existing = this.dbService.queryOne('SELECT * FROM departments WHERE id = ?', [id]);

    if (existing) {
      this.dbService.execute(
        'UPDATE departments SET code = ?, name = ?, description = ?, is_active = ? WHERE id = ?',
        [data.code, data.name, data.description || '', isActive, id]
      );
      this.auditService.logAction(userId, 'System Admin', 'GLOBAL', 'SERVER-01', 'UPDATE', 'Department', id, existing, data);
    } else {
      this.dbService.execute(
        'INSERT INTO departments (id, code, name, description, is_active) VALUES (?, ?, ?, ?, ?)',
        [id, data.code, data.name, data.description || '', isActive]
      );
      this.auditService.logAction(userId, 'System Admin', 'GLOBAL', 'SERVER-01', 'CREATE', 'Department', id, undefined, data);
    }
    return this.dbService.queryOne('SELECT * FROM departments WHERE id = ?', [id]);
  }

  // 4. Workers
  getAllWorkers() {
    return this.dbService.query(`
      SELECT w.*, b.name as branch_name 
      FROM workers w 
      LEFT JOIN branches b ON w.branch_id = b.id 
      ORDER BY w.full_name ASC
    `);
  }

  saveWorker(data: { id?: string; branchId: string; department: string; fullName: string; phone: string; role: string; basicSalaryUgx: number; isActive?: boolean }, userId: string) {
    const id = data.id || uuidv4();
    const isActive = data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1;
    const existing = this.dbService.queryOne('SELECT * FROM workers WHERE id = ?', [id]);

    if (existing) {
      this.dbService.execute(
        'UPDATE workers SET branch_id = ?, department = ?, full_name = ?, phone = ?, role = ?, basic_salary_ugx = ?, is_active = ? WHERE id = ?',
        [data.branchId, data.department, data.fullName, data.phone, data.role, data.basicSalaryUgx, isActive, id]
      );
      this.auditService.logAction(userId, 'System Admin', data.branchId, 'SERVER-01', 'UPDATE', 'Worker', id, existing, data);
    } else {
      this.dbService.execute(
        'INSERT INTO workers (id, branch_id, department, full_name, phone, role, basic_salary_ugx, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, data.branchId, data.department, data.fullName, data.phone, data.role, data.basicSalaryUgx, isActive]
      );
      this.auditService.logAction(userId, 'System Admin', data.branchId, 'SERVER-01', 'CREATE', 'Worker', id, undefined, data);
    }
    return this.dbService.queryOne('SELECT * FROM workers WHERE id = ?', [id]);
  }

  // 5. Users
  getAllUsers() {
    return this.dbService.query(`
      SELECT u.id, u.username, u.full_name, u.role, u.branch_id, u.store_id, u.is_active, u.created_at, b.name as branch_name, s.name as store_name
      FROM users u 
      LEFT JOIN branches b ON u.branch_id = b.id 
      LEFT JOIN stores s ON u.store_id = s.id 
      ORDER BY u.username ASC
    `);
  }

  saveUser(data: { id?: string; username: string; fullName: string; role: string; branchId: string; storeId?: string; passwordHash?: string; isActive?: boolean }, userId: string) {
    const id = data.id || uuidv4();
    const isActive = data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1;
    const existing = this.dbService.queryOne('SELECT * FROM users WHERE id = ?', [id]);

    if (existing) {
      if (data.passwordHash) {
        this.dbService.execute(
          'UPDATE users SET username = ?, full_name = ?, role = ?, branch_id = ?, store_id = ?, password_hash = ?, is_active = ? WHERE id = ?',
          [data.username, data.fullName, data.role, data.branchId, data.storeId || null, data.passwordHash, isActive, id]
        );
      } else {
        this.dbService.execute(
          'UPDATE users SET username = ?, full_name = ?, role = ?, branch_id = ?, store_id = ?, is_active = ? WHERE id = ?',
          [data.username, data.fullName, data.role, data.branchId, data.storeId || null, isActive, id]
        );
      }
      this.auditService.logAction(userId, 'System Admin', data.branchId, 'SERVER-01', 'UPDATE', 'User', id, existing, data);
    } else {
      const defaultHash = data.passwordHash || '$2b$10$wE1.h4.oZqU/9P7vFhD2g.y6c3gA0jX8A0C9Z0C9Z0C9Z0C9Z0C9Z';
      this.dbService.execute(
        'INSERT INTO users (id, username, full_name, password_hash, role, branch_id, store_id, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, data.username, data.fullName, defaultHash, data.role, data.branchId, data.storeId || null, isActive]
      );
      this.auditService.logAction(userId, 'System Admin', data.branchId, 'SERVER-01', 'CREATE', 'User', id, undefined, data);
    }
    return this.dbService.queryOne('SELECT id, username, full_name, role, branch_id, store_id, is_active, created_at FROM users WHERE id = ?', [id]);
  }

  // 6. Roles
  getAllRoles() {
    return this.dbService.query('SELECT * FROM roles ORDER BY display_name ASC');
  }

  saveRole(data: { id?: string; code: string; displayName: string; description?: string; permissions: string[]; isActive?: boolean }, userId: string) {
    const id = data.id || uuidv4();
    const isActive = data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1;
    const permissionsJson = JSON.stringify(data.permissions || []);
    const existing = this.dbService.queryOne('SELECT * FROM roles WHERE id = ?', [id]);

    if (existing) {
      this.dbService.execute(
        'UPDATE roles SET code = ?, display_name = ?, description = ?, permissions = ?, is_active = ? WHERE id = ?',
        [data.code, data.displayName, data.description || '', permissionsJson, isActive, id]
      );
      this.auditService.logAction(userId, 'System Admin', 'GLOBAL', 'SERVER-01', 'UPDATE', 'Role', id, existing, data);
    } else {
      this.dbService.execute(
        'INSERT INTO roles (id, code, display_name, description, permissions, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        [id, data.code, data.displayName, data.description || '', permissionsJson, isActive]
      );
      this.auditService.logAction(userId, 'System Admin', 'GLOBAL', 'SERVER-01', 'CREATE', 'Role', id, undefined, data);
    }
    return this.dbService.queryOne('SELECT * FROM roles WHERE id = ?', [id]);
  }

  // 7. Vehicles
  getAllVehicles() {
    return this.dbService.query(`
      SELECT v.*, b.name as branch_name 
      FROM vehicles v 
      LEFT JOIN branches b ON v.branch_id = b.id 
      ORDER BY v.registration_number ASC
    `);
  }

  saveVehicle(data: { id?: string; branchId: string; registrationNumber: string; type: string; model: string; isActive?: boolean }, userId: string) {
    const id = data.id || uuidv4();
    const isActive = data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1;
    const existing = this.dbService.queryOne('SELECT * FROM vehicles WHERE id = ?', [id]);

    if (existing) {
      this.dbService.execute(
        'UPDATE vehicles SET branch_id = ?, registration_number = ?, type = ?, model = ?, is_active = ? WHERE id = ?',
        [data.branchId, data.registrationNumber, data.type, data.model, isActive, id]
      );
      this.auditService.logAction(userId, 'System Admin', data.branchId, 'SERVER-01', 'UPDATE', 'Vehicle', id, existing, data);
    } else {
      this.dbService.execute(
        'INSERT INTO vehicles (id, branch_id, registration_number, type, model, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        [id, data.branchId, data.registrationNumber, data.type, data.model, isActive]
      );
      this.auditService.logAction(userId, 'System Admin', data.branchId, 'SERVER-01', 'CREATE', 'Vehicle', id, undefined, data);
    }
    return this.dbService.queryOne('SELECT * FROM vehicles WHERE id = ?', [id]);
  }

  // 8. Products
  getAllProducts() {
    return this.dbService.query('SELECT * FROM products ORDER BY name ASC');
  }

  saveProduct(data: { id?: string; sku: string; name: string; category: string; variant?: string; packaging?: string; unitOfMeasure: string; capacityMl: number; costPriceUgx: number; sellingPriceUgx: number; minStockAlert?: number; maxStockLevel?: number; isActive?: boolean }, userId: string) {
    const id = data.id || uuidv4();
    const isActive = data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1;
    const existing = this.dbService.queryOne('SELECT * FROM products WHERE id = ?', [id]);

    if (existing) {
      this.dbService.execute(
        `UPDATE products SET sku = ?, name = ?, category = ?, variant = ?, packaging = ?, unit_of_measure = ?, capacity_ml = ?, cost_price_ugx = ?, selling_price_ugx = ?, min_stock_alert = ?, max_stock_level = ?, is_active = ? WHERE id = ?`,
        [data.sku, data.name, data.category, data.variant || null, data.packaging || null, data.unitOfMeasure, data.capacityMl, data.costPriceUgx, data.sellingPriceUgx, data.minStockAlert || 10, data.maxStockLevel || 1000, isActive, id]
      );
      this.auditService.logAction(userId, 'System Admin', 'GLOBAL', 'SERVER-01', 'UPDATE', 'Product', id, existing, data);
    } else {
      this.dbService.execute(
        `INSERT INTO products (id, sku, name, category, variant, packaging, unit_of_measure, capacity_ml, cost_price_ugx, selling_price_ugx, min_stock_alert, max_stock_level, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, data.sku, data.name, data.category, data.variant || null, data.packaging || null, data.unitOfMeasure, data.capacityMl, data.costPriceUgx, data.sellingPriceUgx, data.minStockAlert || 10, data.maxStockLevel || 1000, isActive]
      );
      this.auditService.logAction(userId, 'System Admin', 'GLOBAL', 'SERVER-01', 'CREATE', 'Product', id, undefined, data);
    }
    return this.dbService.queryOne('SELECT * FROM products WHERE id = ?', [id]);
  }

  // 9. Categories
  getAllCategories() {
    return this.dbService.query('SELECT * FROM categories ORDER BY name ASC');
  }

  saveCategory(data: { id?: string; code: string; name: string; description?: string; isActive?: boolean }, userId: string) {
    const id = data.id || uuidv4();
    const isActive = data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1;
    const existing = this.dbService.queryOne('SELECT * FROM categories WHERE id = ?', [id]);

    if (existing) {
      this.dbService.execute(
        'UPDATE categories SET code = ?, name = ?, description = ?, is_active = ? WHERE id = ?',
        [data.code, data.name, data.description || '', isActive, id]
      );
      this.auditService.logAction(userId, 'System Admin', 'GLOBAL', 'SERVER-01', 'UPDATE', 'Category', id, existing, data);
    } else {
      this.dbService.execute(
        'INSERT INTO categories (id, code, name, description, is_active) VALUES (?, ?, ?, ?, ?)',
        [id, data.code, data.name, data.description || '', isActive]
      );
      this.auditService.logAction(userId, 'System Admin', 'GLOBAL', 'SERVER-01', 'CREATE', 'Category', id, undefined, data);
    }
    return this.dbService.queryOne('SELECT * FROM categories WHERE id = ?', [id]);
  }

  // 10. Prices (Branch Product Price Overrides)
  getAllBranchPrices() {
    return this.dbService.query(`
      SELECT bp.*, b.name as branch_name, p.name as product_name, p.sku 
      FROM branch_product_prices bp 
      JOIN branches b ON bp.branch_id = b.id 
      JOIN products p ON bp.product_id = p.id 
      ORDER BY b.name, p.name ASC
    `);
  }

  saveBranchPrice(data: { id?: string; branchId: string; productId: string; costPriceUgx?: number; sellingPriceUgx: number }, userId: string) {
    const id = data.id || uuidv4();
    const existing = this.dbService.queryOne('SELECT * FROM branch_product_prices WHERE id = ? OR (branch_id = ? AND product_id = ?)', [id, data.branchId, data.productId]);

    if (existing) {
      this.dbService.execute(
        'UPDATE branch_product_prices SET cost_price_ugx = ?, selling_price_ugx = ? WHERE id = ?',
        [data.costPriceUgx || null, data.sellingPriceUgx, existing.id]
      );
      this.auditService.logAction(userId, 'System Admin', data.branchId, 'SERVER-01', 'UPDATE', 'BranchPrice', existing.id, existing, data);
      return this.dbService.queryOne('SELECT * FROM branch_product_prices WHERE id = ?', [existing.id]);
    } else {
      this.dbService.execute(
        'INSERT INTO branch_product_prices (id, branch_id, product_id, cost_price_ugx, selling_price_ugx) VALUES (?, ?, ?, ?, ?)',
        [id, data.branchId, data.productId, data.costPriceUgx || null, data.sellingPriceUgx]
      );
      this.auditService.logAction(userId, 'System Admin', data.branchId, 'SERVER-01', 'CREATE', 'BranchPrice', id, undefined, data);
      return this.dbService.queryOne('SELECT * FROM branch_product_prices WHERE id = ?', [id]);
    }
  }

  // 11. Payment Methods
  getAllPaymentMethods() {
    return this.dbService.query('SELECT * FROM payment_methods ORDER BY name ASC');
  }

  savePaymentMethod(data: { id?: string; code: string; name: string; requiresReference?: boolean; isActive?: boolean }, userId: string) {
    const id = data.id || uuidv4();
    const isActive = data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1;
    const reqRef = data.requiresReference !== undefined ? (data.requiresReference ? 1 : 0) : 0;
    const existing = this.dbService.queryOne('SELECT * FROM payment_methods WHERE id = ?', [id]);

    if (existing) {
      this.dbService.execute(
        'UPDATE payment_methods SET code = ?, name = ?, requires_reference = ?, is_active = ? WHERE id = ?',
        [data.code, data.name, reqRef, isActive, id]
      );
      this.auditService.logAction(userId, 'System Admin', 'GLOBAL', 'SERVER-01', 'UPDATE', 'PaymentMethod', id, existing, data);
    } else {
      this.dbService.execute(
        'INSERT INTO payment_methods (id, code, name, requires_reference, is_active) VALUES (?, ?, ?, ?, ?)',
        [id, data.code, data.name, reqRef, isActive]
      );
      this.auditService.logAction(userId, 'System Admin', 'GLOBAL', 'SERVER-01', 'CREATE', 'PaymentMethod', id, undefined, data);
    }
    return this.dbService.queryOne('SELECT * FROM payment_methods WHERE id = ?', [id]);
  }

  // 12. Expense Types
  getAllExpenseTypes() {
    return this.dbService.query('SELECT * FROM expense_types ORDER BY name ASC');
  }

  saveExpenseType(data: { id?: string; code: string; name: string; requiresApproval?: boolean; description?: string; isActive?: boolean }, userId: string) {
    const id = data.id || uuidv4();
    const isActive = data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1;
    const reqApp = data.requiresApproval !== undefined ? (data.requiresApproval ? 1 : 0) : 1;
    const existing = this.dbService.queryOne('SELECT * FROM expense_types WHERE id = ?', [id]);

    if (existing) {
      this.dbService.execute(
        'UPDATE expense_types SET code = ?, name = ?, requires_approval = ?, description = ?, is_active = ? WHERE id = ?',
        [data.code, data.name, reqApp, data.description || '', isActive, id]
      );
      this.auditService.logAction(userId, 'System Admin', 'GLOBAL', 'SERVER-01', 'UPDATE', 'ExpenseType', id, existing, data);
    } else {
      this.dbService.execute(
        'INSERT INTO expense_types (id, code, name, requires_approval, description, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        [id, data.code, data.name, reqApp, data.description || '', isActive]
      );
      this.auditService.logAction(userId, 'System Admin', 'GLOBAL', 'SERVER-01', 'CREATE', 'ExpenseType', id, undefined, data);
    }
    return this.dbService.queryOne('SELECT * FROM expense_types WHERE id = ?', [id]);
  }

  // 13. Debt Types
  getAllDebtTypes() {
    return this.dbService.query('SELECT * FROM debt_types ORDER BY name ASC');
  }

  saveDebtType(data: { id?: string; code: string; name: string; autoDeductPayroll?: boolean; description?: string; isActive?: boolean }, userId: string) {
    const id = data.id || uuidv4();
    const isActive = data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1;
    const autoDed = data.autoDeductPayroll !== undefined ? (data.autoDeductPayroll ? 1 : 0) : 1;
    const existing = this.dbService.queryOne('SELECT * FROM debt_types WHERE id = ?', [id]);

    if (existing) {
      this.dbService.execute(
        'UPDATE debt_types SET code = ?, name = ?, auto_deduct_payroll = ?, description = ?, is_active = ? WHERE id = ?',
        [data.code, data.name, autoDed, data.description || '', isActive, id]
      );
      this.auditService.logAction(userId, 'System Admin', 'GLOBAL', 'SERVER-01', 'UPDATE', 'DebtType', id, existing, data);
    } else {
      this.dbService.execute(
        'INSERT INTO debt_types (id, code, name, auto_deduct_payroll, description, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        [id, data.code, data.name, autoDed, data.description || '', isActive]
      );
      this.auditService.logAction(userId, 'System Admin', 'GLOBAL', 'SERVER-01', 'CREATE', 'DebtType', id, undefined, data);
    }
    return this.dbService.queryOne('SELECT * FROM debt_types WHERE id = ?', [id]);
  }

  // 14. Salary Settings
  getAllSalarySettings() {
    return this.dbService.query('SELECT * FROM salary_settings ORDER BY role_code, department_code ASC');
  }

  saveSalarySetting(data: { id?: string; roleCode: string; departmentCode: string; baseSalaryUgx: number; commissionPerUnitUgx?: number; allowanceUgx?: number; isActive?: boolean }, userId: string) {
    const id = data.id || uuidv4();
    const isActive = data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1;
    const existing = this.dbService.queryOne('SELECT * FROM salary_settings WHERE id = ?', [id]);

    if (existing) {
      this.dbService.execute(
        'UPDATE salary_settings SET role_code = ?, department_code = ?, base_salary_ugx = ?, commission_per_unit_ugx = ?, allowance_ugx = ?, is_active = ? WHERE id = ?',
        [data.roleCode, data.departmentCode, data.baseSalaryUgx, data.commissionPerUnitUgx || 0, data.allowanceUgx || 0, isActive, id]
      );
      this.auditService.logAction(userId, 'System Admin', 'GLOBAL', 'SERVER-01', 'UPDATE', 'SalarySetting', id, existing, data);
    } else {
      this.dbService.execute(
        'INSERT INTO salary_settings (id, role_code, department_code, base_salary_ugx, commission_per_unit_ugx, allowance_ugx, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, data.roleCode, data.departmentCode, data.baseSalaryUgx, data.commissionPerUnitUgx || 0, data.allowanceUgx || 0, isActive]
      );
      this.auditService.logAction(userId, 'System Admin', 'GLOBAL', 'SERVER-01', 'CREATE', 'SalarySetting', id, undefined, data);
    }
    return this.dbService.queryOne('SELECT * FROM salary_settings WHERE id = ?', [id]);
  }

  // 15. System Settings
  getAllSystemSettings() {
    return this.dbService.query('SELECT * FROM system_settings ORDER BY category, setting_key ASC');
  }

  saveSystemSetting(data: { id?: string; settingKey: string; settingValue: string; category: string; description?: string }, userId: string) {
    const id = data.id || uuidv4();
    const existing = this.dbService.queryOne('SELECT * FROM system_settings WHERE id = ? OR setting_key = ?', [id, data.settingKey]);

    if (existing) {
      this.dbService.execute(
        'UPDATE system_settings SET setting_value = ?, category = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [data.settingValue, data.category, data.description || '', existing.id]
      );
      this.auditService.logAction(userId, 'System Admin', 'GLOBAL', 'SERVER-01', 'UPDATE', 'SystemSetting', existing.id, existing, data);
      return this.dbService.queryOne('SELECT * FROM system_settings WHERE id = ?', [existing.id]);
    } else {
      this.dbService.execute(
        'INSERT INTO system_settings (id, setting_key, setting_value, category, description) VALUES (?, ?, ?, ?, ?)',
        [id, data.settingKey, data.settingValue, data.category, data.description || '']
      );
      this.auditService.logAction(userId, 'System Admin', 'GLOBAL', 'SERVER-01', 'CREATE', 'SystemSetting', id, undefined, data);
      return this.dbService.queryOne('SELECT * FROM system_settings WHERE id = ?', [id]);
    }
  }
}
