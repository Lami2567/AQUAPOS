-- Water Business Management System - Central PostgreSQL DDL Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Branches & Infrastructure
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  location VARCHAR(200) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(30) NOT NULL CHECK (type IN ('MAIN_STORE', 'SALES_STORE', 'MOBILE_VEHICLE')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  registration_number VARCHAR(30) UNIQUE NOT NULL,
  type VARCHAR(30) NOT NULL CHECK (type IN ('LORRY', 'TRICYCLE')),
  model VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. People & Users (RBAC)
CREATE TABLE IF NOT EXISTS workers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  department VARCHAR(50) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  role VARCHAR(30) NOT NULL,
  basic_salary_ugx BIGINT NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(30) NOT NULL CHECK (role IN ('SUPER_ADMIN', 'BRANCH_MANAGER', 'STOREKEEPER', 'CASHIER', 'FIELD_SALESPERSON', 'ACCOUNTANT', 'AUDITOR')),
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  device_name VARCHAR(100) NOT NULL,
  device_hardware_uuid VARCHAR(100) UNIQUE NOT NULL,
  api_key_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_seen_at TIMESTAMPTZ
);

-- 3. Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  unit_of_measure VARCHAR(20) NOT NULL,
  capacity_ml INT NOT NULL,
  cost_price_ugx BIGINT NOT NULL,
  selling_price_ugx BIGINT NOT NULL,
  min_stock_alert INT DEFAULT 10,
  max_stock_level INT DEFAULT 1000,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Stock Ledger Architecture (Immutable)
CREATE TABLE IF NOT EXISTS stock_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  movement_type VARCHAR(30) NOT NULL CHECK (movement_type IN ('RECEIPT', 'SALE', 'FIELD_ISSUE', 'FIELD_RETURN', 'TRANSFER_OUT', 'TRANSFER_IN', 'DAMAGE', 'LOSS', 'ADJUSTMENT', 'OPENING_BALANCE')),
  quantity_change INT NOT NULL,
  unit_cost_ugx BIGINT NOT NULL,
  reference_type VARCHAR(50) NOT NULL,
  reference_id UUID NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  device_id UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stock_ledger_store_product ON stock_ledger (store_id, product_id);
CREATE INDEX idx_stock_ledger_created_at ON stock_ledger (created_at);

-- 5. Stock Transfers
CREATE TABLE IF NOT EXISTS stock_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transfer_number VARCHAR(50) UNIQUE NOT NULL,
  source_store_id UUID NOT NULL REFERENCES stores(id),
  destination_store_id UUID NOT NULL REFERENCES stores(id),
  vehicle_id UUID REFERENCES vehicles(id),
  driver_worker_id UUID REFERENCES workers(id),
  status VARCHAR(30) NOT NULL CHECK (status IN ('DRAFT', 'APPROVED', 'DISPATCHED', 'IN_TRANSIT', 'RECEIVED', 'CONFIRMED', 'CANCELLED')),
  created_by UUID NOT NULL REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  dispatched_by UUID REFERENCES users(id),
  received_by UUID REFERENCES users(id),
  dispatch_timestamp TIMESTAMPTZ,
  receive_timestamp TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_transfer_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transfer_id UUID NOT NULL REFERENCES stock_transfers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity_requested INT NOT NULL,
  quantity_dispatched INT DEFAULT 0,
  quantity_received INT DEFAULT 0,
  unit_price_ugx BIGINT NOT NULL
);

-- 6. POS Store Sales
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receipt_number VARCHAR(50) UNIQUE NOT NULL,
  store_id UUID NOT NULL REFERENCES stores(id),
  cashier_id UUID NOT NULL REFERENCES users(id),
  customer_name VARCHAR(100),
  customer_phone VARCHAR(30),
  total_amount_ugx BIGINT NOT NULL,
  discount_amount_ugx BIGINT DEFAULT 0,
  net_amount_ugx BIGINT NOT NULL,
  paid_amount_ugx BIGINT NOT NULL,
  change_amount_ugx BIGINT DEFAULT 0,
  payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('CASH', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CREDIT')),
  payment_reference VARCHAR(100),
  is_voided BOOLEAN DEFAULT FALSE,
  voided_by UUID REFERENCES users(id),
  void_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  product_name VARCHAR(100) NOT NULL,
  quantity INT NOT NULL,
  unit_price_ugx BIGINT NOT NULL,
  discount_ugx BIGINT DEFAULT 0,
  subtotal_ugx BIGINT NOT NULL
);

-- 7. Field Sales & Reconciliations
CREATE TABLE IF NOT EXISTS field_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_number VARCHAR(50) UNIQUE NOT NULL,
  store_id UUID NOT NULL REFERENCES stores(id),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  worker_id UUID NOT NULL REFERENCES workers(id),
  status VARCHAR(30) NOT NULL CHECK (status IN ('OPEN', 'CLOSING_SUBMITTED', 'RECONCILED', 'DISCREPANCY_FLAGGED')),
  start_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS field_session_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_session_id UUID NOT NULL REFERENCES field_sessions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  product_name VARCHAR(100) NOT NULL,
  issued_qty INT NOT NULL DEFAULT 0,
  sold_qty INT NOT NULL DEFAULT 0,
  returned_qty INT NOT NULL DEFAULT 0,
  damaged_qty INT NOT NULL DEFAULT 0,
  missing_qty INT NOT NULL DEFAULT 0,
  unit_price_ugx BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS field_reconciliations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_session_id UUID UNIQUE NOT NULL REFERENCES field_sessions(id) ON DELETE CASCADE,
  total_issued_units INT NOT NULL,
  total_sold_units INT NOT NULL,
  total_returned_units INT NOT NULL,
  total_damaged_units INT NOT NULL,
  total_missing_units INT NOT NULL,
  is_stock_equation_valid BOOLEAN NOT NULL,

  expected_sales_ugx BIGINT NOT NULL,
  cash_collected_ugx BIGINT NOT NULL,
  mobile_money_ugx BIGINT NOT NULL,
  bank_deposit_ugx BIGINT NOT NULL,
  approved_expenses_ugx BIGINT NOT NULL,
  cash_remaining_ugx BIGINT NOT NULL,
  total_accounted_money_ugx BIGINT NOT NULL,
  money_variance_ugx BIGINT NOT NULL,
  is_money_equation_valid BOOLEAN NOT NULL,

  status VARCHAR(30) NOT NULL CHECK (status IN ('BALANCED', 'SHORTAGE_FLAGGED', 'SURPLUS_FLAGGED')),
  notes TEXT,
  reconciled_by UUID NOT NULL REFERENCES users(id),
  reconciled_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. Finance, Expenses, Debts & Salaries
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  store_id UUID REFERENCES stores(id),
  field_session_id UUID REFERENCES field_sessions(id),
  category VARCHAR(50) NOT NULL,
  amount_ugx BIGINT NOT NULL,
  description TEXT NOT NULL,
  approved_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS debts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  debtor_worker_id UUID REFERENCES workers(id),
  debtor_customer_name VARCHAR(100),
  source_type VARCHAR(30) NOT NULL CHECK (source_type IN ('FIELD_SHORTAGE', 'STOCK_LOSS', 'CUSTOMER_CREDIT', 'SALARY_ADVANCE')),
  source_id UUID NOT NULL,
  original_amount_ugx BIGINT NOT NULL,
  paid_amount_ugx BIGINT DEFAULT 0,
  balance_amount_ugx BIGINT NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(30) NOT NULL CHECK (status IN ('OUTSTANDING', 'PARTIALLY_PAID', 'CLEARED', 'WAIVED', 'WRITTEN_OFF')),
  approved_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS debt_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  debt_id UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  amount_paid_ugx BIGINT NOT NULL,
  payment_method VARCHAR(30) NOT NULL,
  payment_reference VARCHAR(100),
  recorded_by UUID NOT NULL REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS salaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID NOT NULL REFERENCES workers(id),
  period_year INT NOT NULL,
  period_month INT NOT NULL,
  basic_salary_ugx BIGINT NOT NULL,
  commission_ugx BIGINT DEFAULT 0,
  allowances_ugx BIGINT DEFAULT 0,
  gross_salary_ugx BIGINT NOT NULL,
  total_deductions_ugx BIGINT DEFAULT 0,
  net_salary_ugx BIGINT NOT NULL,
  payment_method VARCHAR(30) NOT NULL,
  payment_reference VARCHAR(100),
  paid_by UUID NOT NULL REFERENCES users(id),
  paid_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. Audit Logs & Sync Ingestion
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  user_name VARCHAR(100) NOT NULL,
  branch_id UUID NOT NULL,
  device_id UUID NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_name VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  reason TEXT,
  ip_address VARCHAR(45),
  timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sync_inbox (
  id UUID PRIMARY KEY, -- Client-side Transaction UUID
  branch_id UUID NOT NULL REFERENCES branches(id),
  device_id UUID NOT NULL,
  transaction_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'PROCESSED',
  received_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sync_inbox_branch ON sync_inbox(branch_id);

-- 10. Dynamic Configuration Master Tables
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  requires_reference BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expense_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  requires_approval BOOLEAN DEFAULT TRUE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS debt_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  auto_deduct_payroll BOOLEAN DEFAULT TRUE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS salary_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_code VARCHAR(50) NOT NULL,
  department_code VARCHAR(50) NOT NULL,
  base_salary_ugx BIGINT NOT NULL DEFAULT 0,
  commission_per_unit_ugx BIGINT DEFAULT 0,
  allowance_ugx BIGINT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Tombstone Deletion Log (for conflict-free sync propagation)
-- A row is written here whenever any entity is deleted on the central server.
-- Offline clients check this table on next pull to apply deletions locally.
-- Rows are NEVER removed so long-offline devices can always catch up.
CREATE TABLE IF NOT EXISTS deleted_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(100) NOT NULL,
  entity_id TEXT NOT NULL,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_by TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_deleted_records_entity
  ON deleted_records (entity_type, entity_id);
