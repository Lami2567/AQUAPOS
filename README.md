# AquaPOS — Water Business Management & Multi-Branch System

A production-grade, **offline-first enterprise management system** designed for water manufacturing, bottling plants, depot distribution centers, and retail stores.

The system features **dual database architecture**:
- **Branch Desktop Application**: Uses local **SQLite** for 100% offline uptime during internet outages. All transactions write to an immutable local outbox queue.
- **Central Cloud Database & Admin Server**: Uses **Neon Serverless PostgreSQL** hosted on **Render / Vercel** for real-time central multi-branch oversight, live synchronization, and consolidated financial analytics.

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Step-by-Step Operational Manual](#2-step-by-step-operational-manual)
   - [2.1 User Sign In & Role Security](#21-user-sign-in--role-security)
   - [2.2 Adding & Registering Products](#22-adding--registering-products)
   - [2.3 Setting Up Branches, Stores & Delivery Vehicles](#23-setting-up-branches-stores--delivery-vehicles)
   - [2.4 Managing Workers, Departments & User Accounts](#24-managing-workers-departments--user-accounts)
   - [2.5 Operating Store POS Counter Sales](#25-operating-store-pos-counter-sales)
   - [2.6 Field Sales & Route Delivery Sessions](#26-field-sales--route-delivery-sessions)
   - [2.7 Stock Intakes, Branch Transfers & Damages](#27-stock-intakes-branch-transfers--damages)
   - [2.8 Operating Expenses, Debts & Payroll Salaries](#28-operating-expenses-debts--payroll-salaries)
   - [2.9 Offline Outbox Sync & Data Backups](#29-offline-outbox-sync--data-backups)
3. [Cloud Database Hosting Guide (Neon + Render + Vercel)](#3-cloud-database-hosting-guide-neon--render--vercel)
   - [3.1 Setting Up Central PostgreSQL on Neon](#31-setting-up-central-postgresql-on-neon)
   - [3.2 Deploying Backend API Server on Render](#32-deploying-backend-api-server-on-render)
   - [3.3 Deploying Frontend on Vercel & Connecting to Render](#33-deploying-frontend-on-vercel--connecting-to-render)
   - [3.4 Configuring Cross-Origin Communication (CORS) & Troubleshooting](#34-configuring-cross-origin-communication-cors--troubleshooting)
   - [3.5 Connecting Branch Desktop Apps to Cloud Server](#35-connecting-branch-desktop-apps-to-cloud-server)
4. [Clearing Demo Data & Preparing Real Production Data](#4-clearing-demo-data--preparing-real-production-data)
5. [Monorepo Project Structure](#5-monorepo-project-structure)
6. [Verification & Build Commands](#6-verification--build-commands)

---

## 1. System Architecture

```
                                 [AquaPOS Architecture]

    subgraph Branch Desktop POS (Offline Capable)
        UI [React / Vite Desktop UI] --> Store [Zustand Local State]
        Store --> SQLite [Local SQLite Database]
        Store --> Outbox [Offline Outbox Sync Queue]
    end

    subgraph Central Cloud Infrastructure
        Outbox -- Auto Sync when Online --> Render [Render / Vercel API Server]
        Render --> Neon [(Neon Serverless PostgreSQL)]
        CentralDashboard [Web Admin Dashboard] --> Render
    end
```

### Key Business Equations Enforced by Engine
1. **Stock Equation**:
   $$\text{Issued} = \text{Sold} + \text{Returned} + \text{Damaged} + \text{Missing}$$
2. **Money Reconciliation Equation**:
   $$\text{Expected Money} = \text{Cash} + \text{Mobile Money} + \text{Banked} + \text{Approved Expenses} + \text{Remaining Cash}$$
3. **Payroll Equation**:
   $$\text{Net Salary} = \text{Basic Salary} + \text{Commissions} + \text{Allowances} - \text{Debt Deductions}$$

---

## 2. Step-by-Step Operational Manual

### 2.1 User Sign In & Role Security
1. Launch the AquaPOS desktop application.
2. Enter your authorized staff **Username** and **Password**.
3. **Pre-Seeded Registered Accounts**:
   - `admin` (Password: `admin123`) ➔ **Super Administrator**
   - `mgr_lwengo` (Password: `password123`) ➔ **Branch Manager**
   - `storekeeper_a` (Password: `password123`) ➔ **Storekeeper**
   - `cashier_isingiro` (Password: `password123`) ➔ **Cashier**
   - `sales_worker_a` (Password: `password123`) ➔ **Field Representative**
   - `accountant_01` (Password: `password123`) ➔ **Accountant**
   - `auditor_01` (Password: `password123`) ➔ **Auditor**
4. Upon authentication, the system opens the exact interface corresponding to your role, with unauthorized navigation domains automatically hidden and protected actions locked.

---

### 2.2 Adding & Registering Products
To add a new product or water SKU to your inventory catalog:
1. Log in as `admin` or an authorized `BRANCH_MANAGER`.
2. Navigate to **System ➔ Master Configuration** (or **Inventory ➔ Products**).
3. Select the **Products** tab from the left sidebar.
4. Click **"+ Configure Products Entry"** (or **"+ Add Product"**).
5. Fill in the product details:
   - **SKU Code**: e.g., `WTR-500ML`, `WTR-1.5L`, `WTR-5L`, `WTR-20L`
   - **Product Name**: e.g., `Pure Mineral Water 500ml`
   - **Category**: Select `Bottled Water`, `Refill Jerrican`, or `Accessories`
   - **Unit of Measure**: e.g., `Carton (24)`, `Carton (12)`, `Piece`
   - **Capacity (ml)**: e.g., `500` for 500ml, `20000` for 20L
   - **Cost Price (UGX)**: Unit production cost (e.g., `500 UGX`)
   - **Selling Price (UGX)**: Wholesale / retail price (e.g., `1,000 UGX`)
   - **Min Stock Alert Threshold**: Reorder alert trigger level (e.g., `50 cartons`)
   - **Max Stock Level**: Storage capacity limit (e.g., `5,000 cartons`)
6. Click **Save Product**. The item is immediately active and available across POS checkout counters and stock intake receiving screens.

---

### 2.3 Setting Up Branches, Stores & Delivery Vehicles
1. Navigate to **System ➔ Master Configuration**.
2. Select **Branches**: Click **+ Add Branch**, enter branch code (e.g., `LWG-01`), name (e.g., `Lwengo Branch`), and physical location.
3. Select **Stores**: Click **+ Add Store**, assign it to a branch, select store type (`MAIN_STORE`, `SALES_STORE`, or `MOBILE_VEHICLE`), and assign a store code.
4. Select **Vehicles**: Click **+ Add Vehicle**, enter vehicle registration number (e.g., `UBB 450L`), vehicle type (`LORRY` or `TRICYCLE`), model (e.g., `Isuzu Elf Lorry`), and assign to a branch.

---

### 2.4 Managing Workers, Departments & User Accounts
1. **Departments**: In Master Configuration ➔ **Departments**, add organizational units (e.g., `Field Sales`, `Store & Stocking`, `Finance`, `Administration`).
2. **Workers**: In Master Configuration ➔ **Workers**, add staff members with full name, phone number, assigned department, role, and basic monthly salary (UGX).
3. **User Login Credentials**: In Master Configuration ➔ **Users**:
   - Click **+ Add User**.
   - Enter staff **Username**, **Full Name**, assigned **System Role** (`SUPER_ADMIN`, `BRANCH_MANAGER`, `STOREKEEPER`, `CASHIER`, `FIELD_SALESPERSON`, `ACCOUNTANT`, `AUDITOR`), assigned **Branch**, assigned **Store**, and initial **Password**.
   - Click **Save User**. Staff can immediately log in with their credentials.

---

### 2.5 Operating Store POS Counter Sales
1. Log in as a `CASHIER` or `BRANCH_MANAGER`.
2. Click **Operations ➔ Store POS**.
3. Select items from the product grid or search by name/SKU.
4. Click product items to add them to the cart.
5. Adjust item quantities or enter item-level discounts if authorized.
6. Select payment method: **Physical Cash (UGX)**, **Mobile Money**, or **Bank Deposit**.
7. Enter customer name/phone and amount paid.
8. Click **"Complete Sale & Print Receipt"**. The system records the transaction, calculates change, generates receipt `REC-2026-XXXX`, and updates store inventory balances instantly.

---

### 2.6 Field Sales & Route Delivery Sessions
For mobile truck & tuk-tuk route distribution:
1. Log in as `FIELD_SALESPERSON` or `BRANCH_MANAGER`.
2. Click **Operations ➔ Field Sales**.
3. **Start New Field Session**:
   - Select delivery vehicle (e.g., `Isuzu Lorry UBB 450L`), route, and lead salesperson.
   - Enter issued stock quantities (e.g., 1,000 cartons of 500ml water).
   - Click **"Start Session"**. Stock is moved from store to vehicle ledger.
4. **Record Route Sales**:
   - Record customer deliveries during the day with cash or mobile money receipts.
5. **Close Session & Reconcile**:
   - Enter closing stock counts: **Sold**, **Returned**, **Damaged**, and **Unaccounted (Missing)**.
   - Enter money collected: **Cash**, **Mobile Money**, **Banked**, **Approved Expenses**, and **Cash Remaining**.
   - The reconciliation engine calculates variance:
     - If stock or money variance exists, the session flags shortages and routes unaccounted shortages to the worker's debt balance automatically for monthly salary recovery.

---

### 2.7 Stock Intakes, Branch Transfers & Damages
1. **Goods Intake Receipt**: In **Inventory ➔ Stock Levels**, click **"Receive Goods / Intake"** to record new bottled water production receipts from the manufacturing line into the warehouse.
2. **Branch-to-Branch Transfers**:
   - Navigate to **Operations ➔ Stock Transfers**.
   - Click **"Create Draft Transfer"**. Select source store (e.g., Lwengo Main) and destination store (e.g., Isingiro Main), vehicle, product, and quantity.
   - Follow 6-stage workflow: **Draft ➔ Approved ➔ Dispatched ➔ In Transit ➔ Received ➔ Confirmed**. Double-counting is strictly prevented across store ledgers.
3. **Damages & Spoilage**: Record broken or damaged bottles to update stock ledgers accurately.

---

### 2.8 Operating Expenses, Debts & Payroll Salaries
1. **Operating Expenses**: Go to **Operations ➔ Expenses** to issue vouchers for vehicle fuel, maintenance, or store utilities.
2. **Worker Debts**: Track route shortages and cash advances under **Finance ➔ Debts & Recovery**.
3. **Salary Processing**: Go to **Finance ➔ Salary Processing** to calculate monthly payroll:
   $$\text{Net Salary} = \text{Basic Salary} + \text{Route Commissions} - \text{Debt Deductions}$$

---

### 2.9 Offline Outbox Sync & Data Backups
1. **Offline Mode**: If internet drops, an amber `OFFLINE (X)` badge appears in the top navigation header. You can continue selling and taking stock intakes uninterrupted.
2. **Auto-Sync**: When internet returns, the system displays `SYNCING...` and syncs all pending outbox transactions to the cloud database, returning to `SYNCED`.
3. **Encrypted Local Backups**: In **System ➔ Data Backups**, click **"Create Local Backup"** to generate an encrypted `.db.enc` local backup file.

---

## 3. Cloud Database Hosting Guide (Neon + Render / Vercel)

Follow these steps to host your central cloud database on **Neon Serverless PostgreSQL** and your Central API & Web Admin Server on **Render / Vercel**.

```
                           +-------------------------------+
                           |       Neon PostgreSQL         |
                           |  (Serverless Cloud Database)  |
                           +---------------+---------------+
                                           ^
                                           | Database Connection (SSL)
                                           v
                           +---------------+---------------+
                           |  Render / Vercel Central API  |
                           |  (NestJS + Admin Web Dashboard)|
                           +---------------+---------------+
                                           ^
                                           | HTTPS REST Sync API
                    +----------------------+----------------------+
                    |                                             |
    +---------------+---------------+             +---------------+---------------+
    | Branch 1 Desktop (SQLite)    |             | Branch 2 Desktop (SQLite)    |
    | Offline Local POS Outbox      |             | Offline Local POS Outbox      |
    +-------------------------------+             +-------------------------------+
```

---

### 3.1 Setting Up Central PostgreSQL on Neon
1. Go to [Neon.tech](https://neon.tech) and sign up / log in to your account.
2. Click **"Create Project"**.
3. Name your project: `aquapos-central-db` and select your region (e.g., Europe / Frankfurt or US East).
4. Copy your PostgreSQL connection string:
   ```text
   postgres://username:password@ep-cool-dbname-123456.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
5. Open the Neon **SQL Editor** tab (or connect via `psql` / DBeaver).
6. Run the master PostgreSQL schema script located in this repository at:
   `database/schema/postgresql-schema.sql`
7. (Optional) Run the master seed file to populate initial organizational tables:
   `database/seeds/seed-data.sql`

---

### 3.2 Deploying Backend API Server on Render

1. Log in to [Render.com](https://render.com) and click **New ➔ Web Service**.
2. Connect your GitHub repository (`Lami2567/AQUAPOS`).
3. Set the Web Service Settings:
   - **Name**: `aquapos-server` (or your preferred name)
   - **Region**: Select the region closest to your users / Neon database (e.g. Frankfurt or Ohio)
   - **Branch**: `main`
   - **Root Directory**: `.` (leave as root)
   - **Runtime**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start:server` (or `npm start`)
4. Configure **Environment Variables** in Render:
   ```env
   NODE_ENV=production
   PORT=3000
   DATABASE_DRIVER=postgres
   DATABASE_URL=postgres://username:password@ep-cool-dbname-123456.eu-central-1.aws.neon.tech/neondb?sslmode=require
   JWT_SECRET=your_ultra_secure_jwt_secret_key_2026
   CORS_ORIGIN=*
   ```
   > [!TIP]
   > For production security, once your Vercel frontend is deployed, you can restrict `CORS_ORIGIN` to your exact Vercel URL, e.g.:
   > `CORS_ORIGIN=https://aquapos-frontend.vercel.app,http://localhost:3000,http://localhost:1420,tauri://localhost`

5. Click **"Deploy Web Service"**.
6. Once deployed, copy your public Render URL:
   `https://aquapos-server.onrender.com`

---

### 3.3 Deploying Frontend on Vercel & Connecting to Render

Follow these exact steps to host the web application on **Vercel** and connect it to your **Render** backend.

```
+------------------------------------+                  +------------------------------------+
|         Vercel (Frontend)          |   HTTPS Requests |          Render (Backend)          |
|   https://aquapos.vercel.app       | ---------------> |   https://aquapos-server.onrender  |
|                                    | <--------------- |                                    |
|   VITE_API_URL = [Render URL]      |   JSON / CORS OK |   CORS_ORIGIN = [Vercel URL]       |
+------------------------------------+                  +------------------------------------+
```

#### Step 1: Import Repository on Vercel
1. Log in to [Vercel.com](https://vercel.com) and click **"Add New..." ➔ "Project"**.
2. Import your GitHub repository (`Lami2567/AQUAPOS`).

#### Step 2: Configure Project Settings on Vercel
In the **Configure Project** screen:
- **Framework Preset**: Select **Vite** (or **Other**).
- **Root Directory**: Leave as `./` (the repository root).
- **Build & Development Settings**:
  - Check **Override** for **Build Command**:
    ```bash
    npm run build:packages && npm run build --workspace=apps/desktop
    ```
  - Check **Override** for **Output Directory**:
    ```bash
    apps/desktop/dist
    ```
  - Check **Override** for **Install Command**:
    ```bash
    npm install
    ```

#### Step 3: Add Environment Variables on Vercel
Expand the **Environment Variables** section in Vercel and add:

| Key | Value | Description |
|---|---|---|
| `VITE_API_URL` | `https://aquapos-server.onrender.com` | Public HTTPS URL of your Render backend API |
| `VITE_CLOUD_API_URL` | `https://aquapos-server.onrender.com` | Central cloud sync endpoint |
| `VITE_BRANCH_ID` | `b1111111-1111-1111-1111-111111111111` | Default branch UUID (or configured branch) |
| `VITE_DEVICE_ID` | `web-admin-portal-01` | Identifier for web portal sessions |

> [!IMPORTANT]
> Replace `https://aquapos-server.onrender.com` with your actual Render service URL (do NOT include a trailing slash).

#### Step 4: Deploy & Verify
1. Click **Deploy**. Vercel will build the workspace packages and deploy the static frontend.
2. Once the build completes, Vercel will assign you a domain like `https://aquapos-xyz.vercel.app`.
3. Open your Vercel URL and log in with your admin credentials (`admin` / `admin123`).

---

### 3.4 Configuring Cross-Origin Communication (CORS) & Troubleshooting

To ensure seamless communication between your Vercel frontend and Render backend:

#### 1. Configure CORS in Render
In Render Dashboard ➔ Your Web Service ➔ **Environment**:
- Add or update the variable:
  ```env
  CORS_ORIGIN=https://aquapos-xyz.vercel.app
  ```
  *(Or use `CORS_ORIGIN=*` during initial setup to allow all origins).*
- Click **Save Changes**. Render will automatically restart your server with the new CORS policy.

#### 2. Vercel SPA Routing (`vercel.json`)
The repository includes a root [`vercel.json`](file:///c:/Users/USER/Desktop/WATER%20SYSTEM/vercel.json) that automatically handles client-side React routing:
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build:packages && npm run build --workspace=apps/desktop",
  "outputDirectory": "apps/desktop/dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

#### 3. Common Troubleshooting Checklist

| Issue | Cause | Solution |
|---|---|---|
| **CORS policy error in browser console** | `CORS_ORIGIN` on Render doesn't match your Vercel domain | Set `CORS_ORIGIN=*` or add your exact Vercel URL (e.g. `https://your-app.vercel.app`) in Render Environment Variables. |
| **Initial request takes 50+ seconds** | Free-tier Render services spin down after 15 minutes of inactivity | This is normal for Render free instances ("cold start"). Paid instances stay active 24/7. |
| **Network Error / Failed to fetch** | `VITE_API_URL` missing or misspelled in Vercel | Verify `VITE_API_URL` in Vercel Project Settings ➔ Environment Variables, then trigger a Redeploy. |
| **404 on page refresh in Vercel** | Missing SPA rewrite rule | Ensure [`vercel.json`](file:///c:/Users/USER/Desktop/WATER%20SYSTEM/vercel.json) exists in the repository root with the `"source": "/(.*)", "destination": "/index.html"` rewrite rule. |

---

### 3.5 Connecting Branch Desktop Apps to Cloud Server
On physical computers in branch offices (Lwengo, Isingiro, etc.):
1. Create or edit `apps/desktop/.env`:
   ```env
   VITE_API_URL=https://aquapos-server.onrender.com
   VITE_CLOUD_API_URL=https://aquapos-server.onrender.com
   VITE_BRANCH_ID=b1111111-1111-1111-1111-111111111111
   VITE_DEVICE_ID=dev-desktop-lwengo-01
   ```
2. Launch the desktop app. It will operate offline against local SQLite and automatically background-sync transactions to Render & Neon PostgreSQL whenever the branch has internet connection!

---

## 4. Clearing Demo Data & Preparing Real Production Data

When you are ready to launch your business with actual production data, follow these steps to clean out mock data while preserving your clean system tables.

### Option A: Running the Reset SQL Script
Run the reset script located at `database/scripts/reset-production-data.sql` against your database (SQLite or Neon PostgreSQL):

```sql
-- Reset Production Data Script
-- Clears test sales, stock movements, outbox queues, expenses, and temporary field sessions
-- Preserves Master Branches, Stores, Users, Roles, Products, and System Settings

DELETE FROM sync_outbox;
DELETE FROM sync_inbox;
DELETE FROM audit_logs;
DELETE FROM debt_payments;
DELETE FROM debts;
DELETE FROM salary_payments;
DELETE FROM salaries;
DELETE FROM expenses;
DELETE FROM field_reconciliations;
DELETE FROM field_session_items;
DELETE FROM field_sessions;
DELETE FROM sale_items;
DELETE FROM sales;
DELETE FROM stock_transfer_items;
DELETE FROM stock_transfers;
DELETE FROM stock_ledger;

-- Reset initial clean opening stock intake
-- You can now add your actual physical warehouse inventory via Inventory ➔ Receive Goods Intake!
```

### Option B: Resetting via Desktop UI
1. Log in as `admin`.
2. Go to **System ➔ Master Configuration**.
3. Go to **System Settings**.
4. Click **"Reset Production Data & Outbox Queues"**. Confirm the prompt. The system will purge test transactions and prepare the ledger for real operations.

---

## 5. Monorepo Project Structure

```text
WATER SYSTEM/
├── apps/
│   ├── desktop/                # Vite + React Desktop POS Application
│   └── server/                 # NestJS Central API Server
│
├── packages/
│   ├── shared-types/           # Shared TypeScript interfaces & enums
│   ├── domain/                 # Core domain business logic
│   ├── validation/             # Validation schemas & DTOs
│   └── calculations/           # Verified stock & financial engines
│
├── database/
│   ├── schema/
│   │   ├── sqlite-schema.sql   # Local offline SQLite schema
│   │   └── postgresql-schema.sql # Neon Cloud PostgreSQL schema
│   ├── seeds/
│   │   └── seed-data.sql       # Seed data for system setup
│   └── scripts/
│       └── reset-production-data.sql # Production clean-up script
│
├── README.md                   # System documentation & deployment guide
└── start-water-service.bat     # Windows background service launcher
```

---

## 6. Verification & Build Commands

To build all 5 monorepo workspace targets (`shared-types`, `calculations`, `validation`, `server`, `desktop`) and verify zero errors:

```bash
# Build all workspaces synchronously
npm run build

# Run domain calculation unit test suite
npx tsx packages/calculations/src/calculations.test.ts
```

---

**AquaPOS Version 1.0.0** — Production-Ready Offline-First Water Business Management System.
