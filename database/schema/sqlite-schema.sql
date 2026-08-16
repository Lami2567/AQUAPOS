-- Water Business Management System - Local Branch SQLite / SQLCipher Schema

CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stores (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL,
  registration_number TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  model TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workers (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL,
  department TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL,
  basic_salary_ugx INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  branch_id TEXT,
  store_id TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  variant TEXT,
  packaging TEXT,
  unit_of_measure TEXT NOT NULL,
  capacity_ml INTEGER NOT NULL,
  cost_price_ugx INTEGER NOT NULL,
  selling_price_ugx INTEGER NOT NULL,
  min_stock_alert INTEGER DEFAULT 10,
  max_stock_level INTEGER DEFAULT 1000,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS branch_product_prices (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  cost_price_ugx INTEGER,
  selling_price_ugx INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(branch_id, product_id)
);

CREATE TABLE IF NOT EXISTS stock_ledger (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  movement_type TEXT NOT NULL,
  quantity_change INTEGER NOT NULL,
  unit_cost_ugx INTEGER NOT NULL,
  reference_type TEXT NOT NULL,
  reference_id TEXT NOT NULL,
  created_by TEXT NOT NULL,
  device_id TEXT NOT NULL,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_transfers (
  id TEXT PRIMARY KEY,
  transfer_number TEXT UNIQUE NOT NULL,
  source_store_id TEXT NOT NULL,
  destination_store_id TEXT NOT NULL,
  vehicle_id TEXT,
  driver_worker_id TEXT,
  status TEXT NOT NULL,
  created_by TEXT NOT NULL,
  approved_by TEXT,
  dispatched_by TEXT,
  received_by TEXT,
  confirmed_by TEXT,
  approved_at TEXT,
  dispatch_timestamp TEXT,
  receive_timestamp TEXT,
  confirm_timestamp TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_transfer_items (
  id TEXT PRIMARY KEY,
  transfer_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  unit_of_measure TEXT DEFAULT 'Carton',
  quantity_requested INTEGER NOT NULL,
  quantity_dispatched INTEGER DEFAULT 0,
  quantity_received INTEGER DEFAULT 0,
  unit_price_ugx INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  receipt_number TEXT UNIQUE NOT NULL,
  store_id TEXT NOT NULL,
  cashier_id TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  total_amount_ugx INTEGER NOT NULL,
  discount_amount_ugx INTEGER DEFAULT 0,
  net_amount_ugx INTEGER NOT NULL,
  paid_amount_ugx INTEGER NOT NULL,
  change_amount_ugx INTEGER DEFAULT 0,
  payment_method TEXT NOT NULL,
  payment_reference TEXT,
  is_voided INTEGER DEFAULT 0,
  voided_by TEXT,
  void_reason TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sale_items (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price_ugx INTEGER NOT NULL,
  discount_ugx INTEGER DEFAULT 0,
  subtotal_ugx INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS field_sessions (
  id TEXT PRIMARY KEY,
  session_number TEXT UNIQUE NOT NULL,
  store_id TEXT NOT NULL,
  vehicle_id TEXT NOT NULL,
  worker_id TEXT NOT NULL,
  status TEXT NOT NULL,
  start_time TEXT DEFAULT CURRENT_TIMESTAMP,
  end_time TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS field_session_items (
  id TEXT PRIMARY KEY,
  field_session_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  issued_qty INTEGER NOT NULL DEFAULT 0,
  sold_qty INTEGER NOT NULL DEFAULT 0,
  returned_qty INTEGER NOT NULL DEFAULT 0,
  damaged_qty INTEGER NOT NULL DEFAULT 0,
  missing_qty INTEGER NOT NULL DEFAULT 0,
  unit_price_ugx INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS field_reconciliations (
  id TEXT PRIMARY KEY,
  field_session_id TEXT UNIQUE NOT NULL,
  total_issued_units INTEGER NOT NULL,
  total_sold_units INTEGER NOT NULL,
  total_returned_units INTEGER NOT NULL,
  total_damaged_units INTEGER NOT NULL,
  total_missing_units INTEGER NOT NULL,
  is_stock_equation_valid INTEGER NOT NULL,

  expected_sales_ugx INTEGER NOT NULL,
  cash_collected_ugx INTEGER NOT NULL,
  mobile_money_ugx INTEGER NOT NULL,
  bank_deposit_ugx INTEGER NOT NULL,
  approved_expenses_ugx INTEGER NOT NULL,
  cash_remaining_ugx INTEGER NOT NULL,
  total_accounted_money_ugx INTEGER NOT NULL,
  money_variance_ugx INTEGER NOT NULL,
  is_money_equation_valid INTEGER NOT NULL,

  status TEXT NOT NULL,
  notes TEXT,
  reconciled_by TEXT NOT NULL,
  reconciled_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL,
  store_id TEXT,
  field_session_id TEXT,
  category TEXT NOT NULL,
  amount_ugx INTEGER NOT NULL,
  description TEXT NOT NULL,
  approved_by TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS debts (
  id TEXT PRIMARY KEY,
  debtor_worker_id TEXT,
  debtor_customer_name TEXT,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  original_amount_ugx INTEGER NOT NULL,
  paid_amount_ugx INTEGER DEFAULT 0,
  balance_amount_ugx INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL,
  approved_by TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS debt_payments (
  id TEXT PRIMARY KEY,
  debt_id TEXT NOT NULL,
  amount_paid_ugx INTEGER NOT NULL,
  payment_method TEXT NOT NULL,
  payment_reference TEXT,
  recorded_by TEXT NOT NULL,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS salaries (
  id TEXT PRIMARY KEY,
  worker_id TEXT NOT NULL,
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL,
  basic_salary_ugx INTEGER NOT NULL,
  commission_ugx INTEGER DEFAULT 0,
  allowances_ugx INTEGER DEFAULT 0,
  gross_salary_ugx INTEGER NOT NULL,
  total_deductions_ugx INTEGER DEFAULT 0,
  net_salary_ugx INTEGER NOT NULL,
  payment_method TEXT NOT NULL,
  payment_reference TEXT,
  paid_by TEXT NOT NULL,
  paid_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  old_values TEXT,
  new_values TEXT,
  reason TEXT,
  ip_address TEXT,
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Dynamic Configuration Master Tables
CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  permissions TEXT NOT NULL, -- JSON string array
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_methods (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  requires_reference INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expense_types (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  requires_approval INTEGER DEFAULT 1,
  description TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS debt_types (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  auto_deduct_payroll INTEGER DEFAULT 1,
  description TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS salary_settings (
  id TEXT PRIMARY KEY,
  role_code TEXT NOT NULL,
  department_code TEXT NOT NULL,
  base_salary_ugx INTEGER NOT NULL DEFAULT 0,
  commission_per_unit_ugx INTEGER DEFAULT 0,
  allowance_ugx INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_settings (
  id TEXT PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Offline Outbox Sync Queue Table
CREATE TABLE IF NOT EXISTS sync_outbox (
  id TEXT PRIMARY KEY, -- Transaction UUID
  branch_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  transaction_type TEXT NOT NULL,
  payload TEXT NOT NULL, -- JSON String
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, SYNCING, SYNCED, FAILED, CONFLICT
  retry_count INTEGER DEFAULT 0,
  last_error TEXT,
  version INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  synced_at TEXT
);

-- Central Sync Inbox Table
CREATE TABLE IF NOT EXISTS sync_inbox (
  id TEXT PRIMARY KEY, -- Client-side Transaction UUID
  branch_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  transaction_type TEXT NOT NULL,
  payload TEXT NOT NULL, -- JSON String
  status TEXT NOT NULL DEFAULT 'PROCESSED',
  received_at TEXT DEFAULT CURRENT_TIMESTAMP
);


