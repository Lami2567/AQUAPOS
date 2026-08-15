import React from 'react';
import {
  Droplets,
  LayoutDashboard,
  ShoppingCart,
  Truck,
  Package,
  Building2,
  Users,
  DollarSign,
  BarChart3,
  Settings,
  Database,
  ArrowRightLeft,
  Receipt,
  FileSpreadsheet,
  Coins,
  ShieldCheck,
  Briefcase,
  Store,
  CreditCard,
  History,
  AlertTriangle,
  RotateCcw,
  HardDrive,
  Cpu,
  UserCheck,
  Layers,
} from 'lucide-react';

/**
 * CENTRALIZED ASSET REGISTRY
 * 
 * To replace any logo, icon, or graphic across the entire application:
 * Simply update the entries in this file. Application components reference
 * this registry, ensuring no hardcoded assets exist in business logic.
 */

export const BRAND_ASSETS = {
  appName: 'AQUA POS',
  tagline: 'Water Business Management System',
  companyName: 'Aqua Pure Water Uganda Ltd',
  
  // Logos - Replace render methods or image URLs when custom brand logos are provided
  LogoIcon: Droplets,
  
  // Custom Image Asset URLs (Swap these path strings when custom media files are placed in /assets)
  logoUrl: '/assets/logo.svg',
  logoDarkUrl: '/assets/logo-dark.svg',
  brandBannerUrl: '/assets/brand-banner.png',
  receiptHeaderLogoUrl: '/assets/receipt-logo.png',
  productPlaceholderUrl: '/assets/product-placeholder.png',
  avatarPlaceholderUrl: '/assets/avatar-placeholder.png',
};

export const APP_ICONS = {
  // Navigation Domains
  dashboard: LayoutDashboard,
  operations: ShoppingCart,
  inventory: Package,
  branches: Building2,
  people: Users,
  finance: DollarSign,
  reports: BarChart3,
  system: Settings,

  // Operations Sub-Views
  pos: ShoppingCart,
  fieldSales: Truck,
  fieldSessions: Layers,
  stockReceipts: Receipt,
  stockTransfers: ArrowRightLeft,
  returns: RotateCcw,
  expenses: Receipt,
  payments: CreditCard,

  // Inventory Sub-Views
  products: Package,
  stock: HardDrive,
  stockMovements: History,
  damages: AlertTriangle,
  adjustments: RotateCcw,

  // Branches Sub-Views
  branchList: Building2,
  stores: Store,
  vehicles: Truck,

  // People Sub-Views
  workers: Users,
  departments: Briefcase,
  users: UserCheck,
  roles: ShieldCheck,

  // Finance Sub-Views
  sales: DollarSign,
  cash: Coins,
  bank: CreditCard,
  mobileMoney: CreditCard,
  debts: FileSpreadsheet,
  salaries: Coins,

  // Reports Sub-Views
  salesReports: BarChart3,
  stockReports: Package,
  fieldReports: Truck,
  financialReports: DollarSign,
  workerReports: Users,
  auditReports: History,

  // System Sub-Views
  synchronization: Database,
  backups: HardDrive,
  devices: Cpu,
  settings: Settings,
  auditLog: History,
};
