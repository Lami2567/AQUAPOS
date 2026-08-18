# AQUAPOS Water Business Management System
## Customer Computer Installation & Setup Guide (SETUP.md)

Welcome to **AQUAPOS**! Follow this step-by-step guide to set up a new customer computer and start using the system immediately.

---

## 📋 Prerequisites (One-Time Setup)

Since this is a fresh customer computer without pre-installed software:

### 1. Install Node.js (Runtime Engine)
The system requires **Node.js** to run the continuous background database server.
- **Download**: [https://nodejs.org/](https://nodejs.org/) (Choose the **LTS Version**, e.g. v20 or v18).
- **Installation**: Run the `.msi` setup file and click **Next** through all standard prompts.

---

## 🚀 Quick Setup Instructions

### Step 1: Extract Archive Folder
Extract your zipped `WATER SYSTEM` folder to a permanent location on the customer computer:
- Recommended location: `C:\AquaPOS` or `C:\Users\<Customer>\Desktop\WATER SYSTEM`.

### Step 2: Install Local Dependencies (First Time Only)
1. Open Command Prompt inside the `WATER SYSTEM` folder:
   - Hold `Shift` + Right-click inside the folder $\rightarrow$ Select **Open PowerShell window here** or **Open in Terminal**.
2. Run the following command:
   ```cmd
   npm install --omit=dev
   ```
   *Note: If `node_modules` is already present inside the extracted zip archive, you can skip this step!*

---

## 💻 How to Start the System

### Method 1: Double-Click Native Launcher (Recommended)
Simply double-click **`POSLauncher.exe`** inside the folder:
```text
User double-clicks POSLauncher.exe
          ↓
Starts Node.js continuous background service silently
          ↓
Opens POS Application in your default web browser (http://localhost:3001)
```

### Method 2: Create Desktop Shortcut
To allow the customer to start the POS system from their Desktop:
1. Right-click **`POSLauncher.exe`**.
2. Select **Send to** $\rightarrow$ **Desktop (create shortcut)**.
3. Rename the shortcut on the desktop to **AquaPOS System**.

---

## 🔑 Default Login Credentials

Upon launching the system, log in using the Super Admin account:

- **Username**: `admin`
- **Password**: `admin123`

*(You can create new branch managers, storekeepers, cashiers, and field salespeople under **System Config $\rightarrow$ User Management** once logged in).*

---

## 🌐 Hybrid Online & Offline Operation

- **100% Offline Capable**: If the customer computer has no internet connection, all sales, stock movements, expenses, and debts operate normally using the local SQLite database (`data/water_pos_local.db`).
- **Automatic Cloud Synchronization**: As soon as the computer connects to the internet, background sync automatically pushes pending local sales to central **Neon Cloud PostgreSQL** and pulls updates across all company branches.

---

## ❓ Troubleshooting & Support

- **Browser Page Shows "Connecting to local server..."**:
  Wait 5 seconds for Node.js to initialize on boot.
- **Port Conflict (3001 in use)**:
  Make sure `POSLauncher.exe` is not already running. You can check `logs/launcher.log` for execution logs.

---

*AQUAPOS Management System • Built for Multi-Branch Water Bottling & Distribution Operations.*
