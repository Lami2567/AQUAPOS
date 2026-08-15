-- Water Business Management System Seed Data

-- 1. Branches
INSERT INTO branches (id, code, name, location, is_active) VALUES
('b1111111-1111-1111-1111-111111111111', 'LWG-01', 'Lwengo Branch', 'Lwengo Town Centre', 1),
('b2222222-2222-2222-2222-222222222222', 'ISG-01', 'Isingiro Branch', 'Isingiro Main Street', 1);

-- 2. Stores
INSERT INTO stores (id, branch_id, code, name, type, is_active) VALUES
('s1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'STORE-LWG-MAIN', 'Lwengo Main Store', 'MAIN_STORE', 1),
('s2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'STORE-ISG-MAIN', 'Isingiro Main Store', 'MAIN_STORE', 1),
('s3333333-3333-3333-3333-333333333333', 'b2222222-2222-2222-2222-222222222222', 'STORE-ISG-SALES', 'Isingiro Retail Sales Store', 'SALES_STORE', 1);

-- 3. Vehicles
INSERT INTO vehicles (id, branch_id, registration_number, type, model, is_active) VALUES
('v1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'UBB 450L', 'LORRY', 'Isuzu Elf Lorry', 1),
('v2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 'UFX 101T', 'TRICYCLE', 'Tuk-Tuk Cargo Tricycle 01', 1),
('v3333333-3333-3333-3333-333333333333', 'b1111111-1111-1111-1111-111111111111', 'UFX 102T', 'TRICYCLE', 'Tuk-Tuk Cargo Tricycle 02', 1),
('v4444444-4444-4444-4444-444444444444', 'b2222222-2222-2222-2222-222222222222', 'UBC 880L', 'LORRY', 'Mitsubishi Fuso Lorry', 1),
('v5555555-5555-5555-5555-555555555555', 'b2222222-2222-2222-2222-222222222222', 'UFX 201T', 'TRICYCLE', 'Tuk-Tuk Cargo Tricycle 03', 1);

-- 4. Workers
INSERT INTO workers (id, branch_id, department, full_name, phone, role, basic_salary_ugx, is_active) VALUES
('w1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Field Sales', 'Lwengo Sales Worker A', '+256700111001', 'FIELD_SALESPERSON', 450000, 1),
('w2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 'Field Sales', 'Lwengo Sales Worker B', '+256700111002', 'FIELD_SALESPERSON', 450000, 1),
('w3333333-3333-3333-3333-333333333333', 'b1111111-1111-1111-1111-111111111111', 'Stocking', 'Lwengo Stocking Worker C', '+256700111003', 'STOREKEEPER', 500000, 1),
('w4444444-4444-4444-4444-444444444444', 'b1111111-1111-1111-1111-111111111111', 'Stocking', 'Lwengo Stocking Worker D', '+256700111004', 'STOREKEEPER', 500000, 1),
('w5555555-5555-5555-5555-555555555555', 'b2222222-2222-2222-2222-222222222222', 'Main Store', 'Isingiro Worker A', '+256700222001', 'STOREKEEPER', 520000, 1),
('w6666666-6666-6666-6666-666666666666', 'b2222222-2222-2222-2222-222222222222', 'Sales Store', 'Isingiro Worker B', '+256700222002', 'CASHIER', 480000, 1);

-- 5. Users (Password hashes precomputed Argon2id / bcrypt test hashes)
INSERT INTO users (id, username, full_name, password_hash, role, branch_id, store_id, is_active) VALUES
('u1111111-1111-1111-1111-111111111111', 'admin', 'System Super Administrator', '$2b$10$wE1.h4.oZqU/9P7vFhD2g.y6c3gA0jX8A0C9Z0C9Z0C9Z0C9Z0C9Z', 'SUPER_ADMIN', 'b1111111-1111-1111-1111-111111111111', 's1111111-1111-1111-1111-111111111111', 1),
('u2222222-2222-2222-2222-222222222222', 'mgr_lwengo', 'Lwengo Branch Manager', '$2b$10$wE1.h4.oZqU/9P7vFhD2g.y6c3gA0jX8A0C9Z0C9Z0C9Z0C9Z0C9Z', 'BRANCH_MANAGER', 'b1111111-1111-1111-1111-111111111111', 's1111111-1111-1111-1111-111111111111', 1),
('u3333333-3333-3333-3333-333333333333', 'mgr_isingiro', 'Isingiro Branch Manager', '$2b$10$wE1.h4.oZqU/9P7vFhD2g.y6c3gA0jX8A0C9Z0C9Z0C9Z0C9Z0C9Z', 'BRANCH_MANAGER', 'b2222222-2222-2222-2222-222222222222', 's2222222-2222-2222-2222-222222222222', 1),
('u4444444-4444-4444-4444-444444444444', 'cashier_isingiro', 'Isingiro Cashier B', '$2b$10$wE1.h4.oZqU/9P7vFhD2g.y6c3gA0jX8A0C9Z0C9Z0C9Z0C9Z0C9Z', 'CASHIER', 'b2222222-2222-2222-2222-222222222222', 's3333333-3333-3333-3333-333333333333', 1);

-- 6. Products
INSERT INTO products (id, sku, name, category, unit_of_measure, capacity_ml, cost_price_ugx, selling_price_ugx, min_stock_alert, max_stock_level, is_active) VALUES
('p1111111-1111-1111-1111-111111111111', 'WTR-500ML', 'Pure Mineral Water 500ml', 'Bottled Water', 'Carton (24)', 500, 500, 1000, 50, 5000, 1),
('p2222222-2222-2222-2222-222222222222', 'WTR-1.5L', 'Pure Mineral Water 1.5L', 'Bottled Water', 'Carton (12)', 1500, 1200, 2000, 30, 3000, 1),
('p3333333-3333-3333-3333-333333333333', 'WTR-5L', 'Pure Water Bottle 5L', 'Bottled Water', 'Piece', 5000, 3500, 6000, 20, 1000, 1),
('p4444444-4444-4444-4444-444444444444', 'WTR-20L', 'Refillable Water Jerrican 20L', 'Refill Jerrican', 'Piece', 20000, 6000, 10000, 10, 500, 1);

-- 7. Initial Opening Stock Receipts
INSERT INTO stock_ledger (id, store_id, product_id, movement_type, quantity_change, unit_cost_ugx, reference_type, reference_id, created_by, device_id, notes) VALUES
('l1111111-1111-1111-1111-111111111111', 's1111111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111', 'RECEIPT', 5000, 500, 'STOCK_RECEIPT', 'r1111111-1111-1111-1111-111111111111', 'u1111111-1111-1111-1111-111111111111', 'dev-01', 'Initial Opening Stock Receipt Lwengo Main'),
('l2222222-2222-2222-2222-222222222222', 's1111111-1111-1111-1111-111111111111', 'p2222222-2222-2222-2222-222222222222', 'RECEIPT', 3000, 1200, 'STOCK_RECEIPT', 'r1111111-1111-1111-1111-111111111111', 'u1111111-1111-1111-1111-111111111111', 'dev-01', 'Initial Opening Stock Receipt Lwengo Main'),
('l3333333-3333-3333-3333-333333333333', 's2222222-2222-2222-2222-222222222222', 'p1111111-1111-1111-1111-111111111111', 'RECEIPT', 4000, 500, 'STOCK_RECEIPT', 'r2222222-2222-2222-2222-222222222222', 'u1111111-1111-1111-1111-111111111111', 'dev-01', 'Initial Opening Stock Receipt Isingiro Main'),
('l4444444-4444-4444-4444-444444444444', 's3333333-3333-3333-3333-333333333333', 'p4444444-4444-4444-4444-444444444444', 'RECEIPT', 300, 6000, 'STOCK_RECEIPT', 'r3333333-3333-3333-3333-333333333333', 'u1111111-1111-1111-1111-111111111111', 'dev-01', 'Initial Opening Stock Receipt Isingiro Retail Sales Store');

-- 8. Departments
INSERT INTO departments (id, code, name, description, is_active) VALUES
('d1111111-1111-1111-1111-111111111111', 'FIELD_SALES', 'Field Sales & Distribution', 'Route truck sales and van delivery teams', 1),
('d2222222-2222-2222-2222-222222222222', 'STOCKING', 'Store & Inventory Management', 'Warehouse stockkeepers and loading clerks', 1),
('d3333333-3333-3333-3333-333333333333', 'FINANCE', 'Finance & Accounting', 'Audit, cash handling, and payroll management', 1),
('d4444444-4444-4444-4444-444444444444', 'ADMIN', 'Executive Administration', 'General management and system governance', 1);

-- 9. Roles
INSERT INTO roles (id, code, display_name, description, permissions, is_active) VALUES
('r1111111-1111-1111-1111-111111111111', 'SUPER_ADMIN', 'Super Administrator', 'Full system access and global configuration', '["*"]', 1),
('r2222222-2222-2222-2222-222222222222', 'BRANCH_MANAGER', 'Branch Manager', 'Branch operations, transfers approval, and reporting', '["manage_branch", "approve_transfers", "view_reports"]', 1),
('r3333333-3333-3333-3333-333333333333', 'STOREKEEPER', 'Storekeeper', 'Stock intake, transfer dispatch, inventory counts', '["manage_stock", "dispatch_transfers"]', 1),
('r4444444-4444-4444-4444-444444444444', 'CASHIER', 'Store Cashier', 'Point of sale operations and customer checkout', '["create_sales", "print_receipts"]', 1),
('r5555555-5555-5555-5555-555555555555', 'FIELD_SALESPERSON', 'Field Sales Representative', 'Route sales sessions and customer deliveries', '["field_sales"]', 1),
('r6666666-6666-6666-6666-666666666666', 'ACCOUNTANT', 'Accountant / Auditor', 'Expense approvals, debt payments, salary processing', '["manage_finance", "reconcile_sessions"]', 1);

-- 10. Categories
INSERT INTO categories (id, code, name, description, is_active) VALUES
('c1111111-1111-1111-1111-111111111111', 'BOTTLED_WATER', 'Bottled Mineral Water', 'Standard PET bottled drinking water', 1),
('c2222222-2222-2222-2222-222222222222', 'REFILL_JERRICAN', 'Refillable Jerricans', 'Large capacity 20L reusable water containers', 1),
('c3333333-3333-3333-3333-333333333333', 'DISPENSER_ACCESSORIES', 'Dispenser & Accessories', 'Water pumps, dispensers, and accessories', 1);

-- 11. Payment Methods
INSERT INTO payment_methods (id, code, name, requires_reference, is_active) VALUES
('pm111111-1111-1111-1111-111111111111', 'CASH', 'Physical Cash (UGX)', 0, 1),
('pm222222-2222-2222-2222-222222222222', 'MOBILE_MONEY', 'Mobile Money (MTN / Airtel)', 1, 1),
('pm333333-3333-3333-3333-333333333333', 'BANK_TRANSFER', 'Bank Transfer / Deposit Slip', 1, 1),
('pm444444-4444-4444-4444-444444444444', 'CREDIT', 'Customer Credit Account', 1, 1);

-- 12. Expense Types
INSERT INTO expense_types (id, code, name, requires_approval, description, is_active) VALUES
('et111111-1111-1111-1111-111111111111', 'FUEL', 'Vehicle Fuel & Lubricants', 1, 'Fuel purchases for delivery vehicles', 1),
('et222222-2222-2222-2222-222222222222', 'MAINTENANCE', 'Vehicle Repairs & Servicing', 1, 'Mechanical repairs and maintenance', 1),
('et333333-3333-3333-3333-333333333333', 'MEALS_ALLOWANCE', 'Field Meals & Allowance', 0, 'Daily lunch allowance for field crew', 1),
('et444444-4444-4444-4444-444444444444', 'UTILITIES', 'Electricity & Water Utilities', 1, 'Factory and office utility bills', 1);

-- 13. Debt Types
INSERT INTO debt_types (id, code, name, auto_deduct_payroll, description, is_active) VALUES
('dt111111-1111-1111-1111-111111111111', 'FIELD_SHORTAGE', 'Field Reconciliation Cash Shortage', 1, 'Shortage flagged during field session reconciliation', 1),
('dt222222-2222-2222-2222-222222222222', 'STOCK_LOSS', 'Inventory Missing / Unaccounted Loss', 1, 'Missing stock assigned to responsible storekeeper', 1),
('dt333333-3333-3333-3333-333333333333', 'CUSTOMER_CREDIT', 'Customer Credit Balance', 0, 'Unpaid customer balance on invoice', 1),
('dt444444-4444-4444-4444-444444444444', 'SALARY_ADVANCE', 'Salary Advance Loan', 1, 'Pre-approved payroll advance loan', 1);

-- 14. Salary Settings
INSERT INTO salary_settings (id, role_code, department_code, base_salary_ugx, commission_per_unit_ugx, allowance_ugx, is_active) VALUES
('ss111111-1111-1111-1111-111111111111', 'FIELD_SALESPERSON', 'FIELD_SALES', 450000, 200, 50000, 1),
('ss222222-2222-2222-2222-222222222222', 'STOREKEEPER', 'STOCKING', 500000, 0, 30000, 1),
('ss333333-3333-3333-3333-333333333333', 'CASHIER', 'FIELD_SALES', 480000, 0, 20000, 1),
('ss444444-4444-4444-4444-444444444444', 'BRANCH_MANAGER', 'ADMIN', 1200000, 50, 150000, 1);

-- 15. System Settings
INSERT INTO system_settings (id, setting_key, setting_value, category, description) VALUES
('sys11111-1111-1111-1111-111111111111', 'COMPANY_NAME', 'AQUA PURE WATER UGANDA LTD', 'GENERAL', 'Official registered company name'),
('sys22222-2222-2222-2222-222222222222', 'TAX_TIN_NUMBER', '1000998877', 'GENERAL', 'Uganda Revenue Authority TIN number'),
('sys33333-3333-3333-3333-333333333333', 'CURRENCY_SYMBOL', 'UGX', 'FINANCE', 'Default system currency code'),
('sys44444-4444-4444-4444-444444444444', 'MAX_DISCOUNT_PERCENT', '15', 'POS', 'Maximum permitted cashier discount %'),
('sys55555-5555-5555-5555-555555555555', 'RECEIPT_FOOTER_TEXT', 'Thank you for choosing Aqua Pure Mineral Water!', 'POS', 'Receipt bottom message'),
('sys66666-6666-6666-6666-666666666666', 'SYNC_AUTO_INTERVAL_SEC', '300', 'SYSTEM', 'Offline sync background interval in seconds');

