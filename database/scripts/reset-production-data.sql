-- AquaPOS Production Data Reset & Initialization Script
-- Usage: Run this script against your SQLite local database or Neon PostgreSQL central database to purge demo/test transactions while preserving your clean Master Configuration (Branches, Stores, Departments, Roles, Users, Products).

BEGIN TRANSACTION;

-- 1. Purge Offline Synchronization Queues & Logs
DELETE FROM sync_outbox;
DELETE FROM sync_inbox;
DELETE FROM audit_logs;

-- 2. Purge Operational Financial Records
DELETE FROM debt_payments;
DELETE FROM debts;
DELETE FROM salary_payments;
DELETE FROM salaries;
DELETE FROM expenses;

-- 3. Purge Field Session Route Logs & Reconciliations
DELETE FROM field_reconciliations;
DELETE FROM field_session_items;
DELETE FROM field_sessions;

-- 4. Purge Point of Sale Transactions
DELETE FROM sale_items;
DELETE FROM sales;

-- 5. Purge Stock Transfers & Movements
DELETE FROM stock_transfer_items;
DELETE FROM stock_transfers;
DELETE FROM stock_ledger;

COMMIT;

-- System is now clean and ready for production inventory intake!
