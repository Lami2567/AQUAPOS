-- Water Business Management System - Central PostgreSQL DDL Schema

-- 1. Branches & Infrastructure
CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  location VARCHAR(200) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stores (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(30) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL,
  registration_number VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(30) NOT NULL,
  model VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. People & Users (RBAC)
CREATE TABLE IF NOT EXISTS workers (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL,
  department VARCHAR(50) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  role VARCHAR(30) NOT NULL,
  basic_salary_ugx BIGINT NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(30) NOT NULL,
  branch_id TEXT,
  store_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL,
  device_name VARCHAR(100) NOT NULL,
  device_hardware_uuid VARCHAR(100) UNIQUE NOT NULL,
  api_key_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_seen_at TIMESTAMPTZ
);

-- 3. Products
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  sku VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  variant VARCHAR(100),
  packaging VARCHAR(100),
  unit_of_measure VARCHAR(50) NOT NULL,
  capacity_ml INT NOT NULL,
  cost_price_ugx BIGINT NOT NULL,
  selling_price_ugx BIGINT NOT NULL,
  min_stock_alert INT DEFAULT 10,
  max_stock_level INT DEFAULT 1000,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS branch_product_prices (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  cost_price_ugx BIGINT,
  selling_price_ugx BIGINT NOT NULL,
  min_wholesale_price_ugx BIGINT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Stock Ledger Architecture (Immutable)
CREATE TABLE IF NOT EXISTS stock_ledger (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  movement_type VARCHAR(30) NOT NULL,
  quantity_change INT NOT NULL,
  unit_cost_ugx BIGINT NOT NULL,
  reference_type VARCHAR(50) NOT NULL,
  reference_id TEXT NOT NULL,
  created_by TEXT NOT NULL,
  device_id TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stock_ledger_store_product ON stock_ledger (store_id, product_id);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_created_at ON stock_ledger (created_at);

-- 5. Stock Transfers
CREATE TABLE IF NOT EXISTS stock_transfers (
  id TEXT PRIMARY KEY,
  transfer_number VARCHAR(50) UNIQUE NOT NULL,
  source_store_id TEXT NOT NULL,
  destination_store_id TEXT NOT NULL,
  vehicle_id TEXT,
  driver_worker_id TEXT,
  status VARCHAR(30) NOT NULL,
  created_by TEXT NOT NULL,
  approved_by TEXT,
  dispatched_by TEXT,
  received_by TEXT,
  confirmed_by TEXT,
  dispatch_timestamp TIMESTAMPTZ,
  receive_timestamp TIMESTAMPTZ,
  confirm_timestamp TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_transfer_items (
  id TEXT PRIMARY KEY,
  transfer_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  unit_of_measure VARCHAR(50),
  quantity_requested INT NOT NULL,
  quantity_dispatched INT DEFAULT 0,
  quantity_received INT DEFAULT 0,
  unit_price_ugx BIGINT NOT NULL
);

-- 6. POS Store Sales
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  receipt_number VARCHAR(50) UNIQUE NOT NULL,
  store_id TEXT NOT NULL,
  cashier_id TEXT NOT NULL,
  customer_name VARCHAR(100),
  customer_phone VARCHAR(30),
  total_amount_ugx BIGINT NOT NULL,
  discount_amount_ugx BIGINT DEFAULT 0,
  net_amount_ugx BIGINT NOT NULL,
  paid_amount_ugx BIGINT NOT NULL,
  change_amount_ugx BIGINT DEFAULT 0,
  payment_method VARCHAR(30) NOT NULL,
  payment_reference VARCHAR(100),
  is_voided BOOLEAN DEFAULT FALSE,
  voided_by TEXT,
  void_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sale_items (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name VARCHAR(100) NOT NULL,
  quantity INT NOT NULL,
  unit_price_ugx BIGINT NOT NULL,
  discount_ugx BIGINT DEFAULT 0,
  subtotal_ugx BIGINT NOT NULL
);

-- 7. Field Sales & Reconciliations
CREATE TABLE IF NOT EXISTS field_sessions (
  id TEXT PRIMARY KEY,
  session_number VARCHAR(50) UNIQUE NOT NULL,
  store_id TEXT NOT NULL,
  vehicle_id TEXT NOT NULL,
  worker_id TEXT NOT NULL,
  status VARCHAR(30) NOT NULL,
  start_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS field_session_items (
  id TEXT PRIMARY KEY,
  field_session_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name VARCHAR(100) NOT NULL,
  issued_qty INT NOT NULL DEFAULT 0,
  sold_qty INT NOT NULL DEFAULT 0,
  returned_qty INT NOT NULL DEFAULT 0,
  damaged_qty INT NOT NULL DEFAULT 0,
  missing_qty INT NOT NULL DEFAULT 0,
  unit_price_ugx BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS field_reconciliations (
  id TEXT PRIMARY KEY,
  field_session_id TEXT UNIQUE NOT NULL,
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
  status VARCHAR(30) NOT NULL,
  notes TEXT,
  reconciled_by TEXT NOT NULL,
  reconciled_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. Finance, Expenses, Debts & Salaries
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL,
  store_id TEXT,
  field_session_id TEXT,
  category VARCHAR(50) NOT NULL,
  amount_ugx BIGINT NOT NULL,
  description TEXT NOT NULL,
  approved_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS debts (
  id TEXT PRIMARY KEY,
  debtor_worker_id TEXT,
  debtor_customer_name VARCHAR(100),
  source_type VARCHAR(50) NOT NULL,
  source_id TEXT NOT NULL,
  original_amount_ugx BIGINT NOT NULL,
  paid_amount_ugx BIGINT DEFAULT 0,
  balance_amount_ugx BIGINT NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(30) NOT NULL,
  approved_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS debt_payments (
  id TEXT PRIMARY KEY,
  debt_id TEXT NOT NULL,
  amount_paid_ugx BIGINT NOT NULL,
  payment_method VARCHAR(30) NOT NULL,
  payment_reference VARCHAR(100),
  recorded_by TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS salaries (
  id TEXT PRIMARY KEY,
  worker_id TEXT NOT NULL,
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
  paid_by TEXT NOT NULL,
  paid_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. Audit Logs & Sync Ingestion
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name VARCHAR(100) NOT NULL,
  branch_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_name VARCHAR(100) NOT NULL,
  entity_id TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  reason TEXT,
  ip_address VARCHAR(45),
  timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sync_inbox (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  transaction_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'PROCESSED',
  received_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sync_inbox_branch ON sync_inbox(branch_id);

-- 10. Dynamic Configuration Master Tables
CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_methods (
  id TEXT PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  requires_reference BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expense_types (
  id TEXT PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  requires_approval BOOLEAN DEFAULT TRUE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS debt_types (
  id TEXT PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  auto_deduct_payroll BOOLEAN DEFAULT TRUE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS salary_settings (
  id TEXT PRIMARY KEY,
  role_code VARCHAR(50) NOT NULL,
  department_code VARCHAR(50) NOT NULL,
  base_salary_ugx BIGINT NOT NULL DEFAULT 0,
  commission_per_unit_ugx BIGINT DEFAULT 0,
  allowance_ugx BIGINT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_settings (
  id TEXT PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Tombstone Deletion Log
CREATE TABLE IF NOT EXISTS deleted_records (
  id TEXT PRIMARY KEY,
  entity_type VARCHAR(100) NOT NULL,
  entity_id TEXT NOT NULL,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_by TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_deleted_records_entity
  ON deleted_records (entity_type, entity_id);
