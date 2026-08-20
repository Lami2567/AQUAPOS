import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { apiClient } from '../utils/api';
import {
  Database,
  Download,
  Upload,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  RefreshCw,
  Server,
  HardDrive,
  FileText,
  Clock,
  Layers,
  ArrowDownToLine,
  ArrowUpFromLine,
  Activity,
  Copy,
  Check,
} from 'lucide-react';

export const BackupView: React.FC = () => {
  const {
    branches,
    stores,
    products,
    salesHistory,
    expensesList,
    debtsList,
    usersList,
    workers,
    categories,
    vehicles,
    salarySettings,
    systemSettings,
    mergeCentralData,
  } = useStore();

  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);
  const [restoreStatus, setRestoreStatus] = useState<{
    type: 'idle' | 'analyzing' | 'ready' | 'restoring' | 'success' | 'error';
    message?: string;
    details?: any;
  }>({ type: 'idle' });

  const [selectedBackupFile, setSelectedBackupFile] = useState<File | null>(null);
  const [parsedBackupData, setParsedBackupData] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(() => {
    return sessionStorage.getItem('aquapos-last-backup-time');
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Live total records calculation
  const totalLocalRecords =
    branches.length +
    stores.length +
    products.length +
    salesHistory.length +
    expensesList.length +
    debtsList.length +
    usersList.length +
    workers.length +
    categories.length +
    vehicles.length +
    salarySettings.length +
    systemSettings.length;

  // 1. Export Full Cloud Backup (.json)
  const handleExportBackup = async () => {
    setIsExporting(true);
    setExportSuccessMsg(null);

    try {
      const res = await apiClient.get('/api/v1/backup/export');
      const backupPackage = res.data;

      if (!backupPackage || !backupPackage.data) {
        throw new Error('Server returned an empty backup payload.');
      }

      // Trigger automatic browser file download
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(backupPackage, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      const filename = `aquapos-backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', filename);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      const timeStr = new Date().toLocaleString();
      setLastBackupTime(timeStr);
      try {
        sessionStorage.setItem('aquapos-last-backup-time', timeStr);
      } catch (_) {}

      setExportSuccessMsg(
        `Cloud Backup downloaded successfully! (${backupPackage.metadata?.totalRecords || 0} records exported into ${filename})`
      );
    } catch (err: any) {
      alert(`Export Failed: ${err?.response?.data?.message || err?.message || 'Server connection error.'}`);
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Handle File Selection for Restoration
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedBackupFile(file);
    setRestoreStatus({ type: 'analyzing', message: 'Analyzing backup file structure and verifying schema...' });

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed || !parsed.data || typeof parsed.data !== 'object') {
          throw new Error('Invalid backup file format. Missing data structure.');
        }

        const counts = parsed.metadata?.tableCounts || {
          branches: parsed.data.branches?.length || 0,
          stores: parsed.data.stores?.length || 0,
          products: parsed.data.products?.length || 0,
          sales: parsed.data.sales?.length || 0,
          expenses: parsed.data.expenses?.length || 0,
          debts: parsed.data.debts?.length || 0,
          users: parsed.data.users?.length || 0,
        };

        const totalRecs =
          parsed.metadata?.totalRecords ||
          Object.values(counts).reduce((a: any, b: any) => Number(a) + Number(b), 0);

        setParsedBackupData(parsed);
        setRestoreStatus({
          type: 'ready',
          message: `Backup file validated! Contains ${totalRecs} total records ready for restoration.`,
          details: {
            filename: file.name,
            sizeKb: (file.size / 1024).toFixed(1),
            exportedAt: parsed.metadata?.exportedAt ? new Date(parsed.metadata.exportedAt).toLocaleString() : 'Unknown',
            exportedBy: parsed.metadata?.exportedBy || 'System Admin',
            counts,
            totalRecs,
          },
        });
      } catch (err: any) {
        setRestoreStatus({
          type: 'error',
          message: `Failed to parse backup file: ${err.message}. Please provide a valid AQUAPOS JSON backup.`,
        });
        setParsedBackupData(null);
      }
    };
    reader.readAsText(file);
  };

  // 3. Execute Database Restoration
  const handleExecuteRestore = async () => {
    if (!parsedBackupData) return;

    const confirmed = window.confirm(
      `CONFIRM DATABASE RESTORATION:\n\nAre you sure you want to restore data from "${selectedBackupFile?.name}" into Neon Cloud PostgreSQL?\n\nAll existing records will be safely integrated and updated.`
    );
    if (!confirmed) return;

    setIsRestoring(true);
    setRestoreStatus({ type: 'restoring', message: 'Restoring tables into Neon Cloud PostgreSQL database...' });

    try {
      const res = await apiClient.post('/api/v1/backup/restore', parsedBackupData);

      if (res.data?.success) {
        // Merge into local UI state immediately so no refresh is needed
        if (parsedBackupData.data) {
          mergeCentralData({
            branches: parsedBackupData.data.branches,
            stores: parsedBackupData.data.stores,
            departments: parsedBackupData.data.departments,
            workers: parsedBackupData.data.workers,
            users: parsedBackupData.data.users,
            roles: parsedBackupData.data.roles,
            vehicles: parsedBackupData.data.vehicles,
            products: parsedBackupData.data.products,
            categories: parsedBackupData.data.categories,
            branchPrices: parsedBackupData.data.branchProductPrices,
            paymentMethods: parsedBackupData.data.paymentMethods,
            expenseTypes: parsedBackupData.data.expenseTypes,
            debtTypes: parsedBackupData.data.debtTypes,
            salarySettings: parsedBackupData.data.salarySettings,
            systemSettings: parsedBackupData.data.systemSettings,
            sales: parsedBackupData.data.sales,
            expenses: parsedBackupData.data.expenses,
            debts: parsedBackupData.data.debts,
            salaries: parsedBackupData.data.salaries,
            fieldSessions: parsedBackupData.data.fieldSessions,
          });
        }

        setRestoreStatus({
          type: 'success',
          message: res.data.message || 'Database restored and synchronized successfully!',
          details: res.data.restoredCounts,
        });

        setSelectedBackupFile(null);
        setParsedBackupData(null);
      } else {
        throw new Error(res.data?.message || 'Server reported restoration failure.');
      }
    } catch (err: any) {
      setRestoreStatus({
        type: 'error',
        message: `Restoration Failed: ${err?.response?.data?.message || err?.message || 'Server error'}`,
      });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 select-none">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-cyan-950/80 rounded-xl border border-cyan-500/30 text-cyan-400">
            <Database className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              Cloud Database Backup & Disaster Recovery
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-950 border border-emerald-500/30 text-emerald-400 rounded-full">
                Neon Cloud Live
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Download complete database snapshots to your computer and restore data seamlessly in case of system crashes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportBackup}
            disabled={isExporting}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-cyan-900/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{isExporting ? 'Exporting Cloud Data...' : 'Export Full Backup (.json)'}</span>
          </button>
        </div>
      </div>

      {/* Live Cloud Database Health & Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Total Records</div>
          <div className="text-xl font-extrabold text-cyan-400 mt-1 font-mono">{totalLocalRecords}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Across all tables</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Sales History</div>
          <div className="text-xl font-extrabold text-emerald-400 mt-1 font-mono">{salesHistory.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Recorded orders</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Products Catalog</div>
          <div className="text-xl font-extrabold text-slate-200 mt-1 font-mono">{products.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{categories.length} categories</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Branches & Stores</div>
          <div className="text-xl font-extrabold text-slate-200 mt-1 font-mono">{branches.length} / {stores.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Multi-branch network</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Expenses & Debts</div>
          <div className="text-xl font-extrabold text-amber-400 mt-1 font-mono">{expensesList.length + debtsList.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Financial ledgers</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Staff & Users</div>
          <div className="text-xl font-extrabold text-cyan-300 mt-1 font-mono">{usersList.length + workers.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Active accounts</div>
        </div>
      </div>

      {exportSuccessMsg && (
        <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 p-4 rounded-xl text-xs flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{exportSuccessMsg}</span>
        </div>
      )}

      {/* Main Grid: Export and Restore Portals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Card: Backup Generator */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-lg flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="p-2.5 bg-cyan-950 rounded-xl text-cyan-400 border border-cyan-800/40">
                <ArrowDownToLine className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-100">1. Generate & Download Backup</h2>
                <p className="text-xs text-slate-400">Save a complete, verified snapshot file to your local computer.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Exporting creates an encrypted, structured JSON backup containing all 21 tables: Branches, Products, Prices, Users, Customer Sales, Expenses, Debts, Stock Ledgers, and Staff settings.
            </p>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Storage Engine:</span>
                <span className="text-cyan-300 font-semibold">Neon Cloud PostgreSQL</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Backup Format:</span>
                <span className="text-slate-200 font-mono">AQUAPOS JSON (.json)</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Last Backup Export:</span>
                <span className="text-slate-300 font-mono">{lastBackupTime || 'None recorded this session'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleExportBackup}
            disabled={isExporting}
            className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-xl text-xs font-bold shadow-md shadow-cyan-900/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{isExporting ? 'Extracting Cloud Records...' : 'Download Complete Backup File'}</span>
          </button>
        </div>

        {/* Right Card: Disaster Recovery & Restore */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-lg flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="p-2.5 bg-emerald-950 rounded-xl text-emerald-400 border border-emerald-800/40">
                <ArrowUpFromLine className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-100">2. Disaster Recovery & Upload</h2>
                <p className="text-xs text-slate-400">Upload a previous backup file to restore the entire system state.</p>
              </div>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".json,.aquabackup"
              className="hidden"
            />

            {/* Upload Box / Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 bg-slate-950/60 hover:bg-slate-950 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2 group"
            >
              <div className="mx-auto w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 group-hover:text-cyan-400 group-hover:bg-cyan-950/50 transition-colors">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-xs font-semibold text-slate-300">
                {selectedBackupFile ? selectedBackupFile.name : 'Click to Browse or Drag Backup File Here'}
              </div>
              <div className="text-[10px] text-slate-500">Supports standard .json backup snapshots</div>
            </div>

            {/* File Inspection / Status Feedback */}
            {restoreStatus.type === 'ready' && restoreStatus.details && (
              <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-4 space-y-2 text-xs animate-fade-in">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <FileCheck className="w-4 h-4" />
                  <span>Valid Backup Package Detected</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
                  <div>Exported On: <span className="text-slate-200">{restoreStatus.details.exportedAt}</span></div>
                  <div>Exported By: <span className="text-slate-200">{restoreStatus.details.exportedBy}</span></div>
                  <div>Sales Orders: <span className="text-emerald-400 font-mono font-bold">{restoreStatus.details.counts?.sales || 0}</span></div>
                  <div>Products: <span className="text-cyan-400 font-mono font-bold">{restoreStatus.details.counts?.products || 0}</span></div>
                </div>
              </div>
            )}

            {restoreStatus.type === 'error' && (
              <div className="bg-red-950/80 border border-red-500/40 text-red-300 p-3.5 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{restoreStatus.message}</span>
              </div>
            )}

            {restoreStatus.type === 'success' && (
              <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 p-3.5 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{restoreStatus.message}</span>
              </div>
            )}
          </div>

          <button
            onClick={handleExecuteRestore}
            disabled={isRestoring || !parsedBackupData}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl text-xs font-bold shadow-md shadow-emerald-900/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isRestoring ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            <span>{isRestoring ? 'Restoring All Cloud Tables...' : 'Confirm & Restore Database'}</span>
          </button>
        </div>

      </div>

      {/* Security & Reliability Advisory Footer */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
          <span>
            <strong>Disaster Recovery Guarantee:</strong> Cloud backups contain full relational keys and can be restored onto any fresh server instance with 100% data integrity.
          </span>
        </div>
        <div className="text-[11px] text-slate-500 whitespace-nowrap">
          Engine: Neon PostgreSQL 16
        </div>
      </div>
    </div>
  );
};
