import { UserRole } from '@water-business/shared-types';
import { NavDomain } from '../components/Navbar';

export type Permission =
  | 'MANAGE_USERS'
  | 'MANAGE_BRANCHES'
  | 'MANAGE_PRODUCTS'
  | 'RECEIVE_STOCK'
  | 'TRANSFER_STOCK'
  | 'ADJUST_STOCK'
  | 'DELETE_STOCK'
  | 'POS_SALES'
  | 'FIELD_SALES'
  | 'MANAGE_EXPENSES'
  | 'PROCESS_SALARIES'
  | 'MANAGE_DEBTS'
  | 'VIEW_REPORTS'
  | 'MANAGE_SYSTEM'
  | 'AUDIT_LOGS';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    'MANAGE_USERS',
    'MANAGE_BRANCHES',
    'MANAGE_PRODUCTS',
    'RECEIVE_STOCK',
    'TRANSFER_STOCK',
    'ADJUST_STOCK',
    'DELETE_STOCK',
    'POS_SALES',
    'FIELD_SALES',
    'MANAGE_EXPENSES',
    'PROCESS_SALARIES',
    'MANAGE_DEBTS',
    'VIEW_REPORTS',
    'MANAGE_SYSTEM',
    'AUDIT_LOGS',
  ],
  BRANCH_MANAGER: [
    'MANAGE_PRODUCTS',
    'RECEIVE_STOCK',
    'TRANSFER_STOCK',
    'POS_SALES',
    'FIELD_SALES',
    'MANAGE_EXPENSES',
    'MANAGE_DEBTS',
    'VIEW_REPORTS',
    'AUDIT_LOGS',
  ],
  STOREKEEPER: [
    'RECEIVE_STOCK',
    'TRANSFER_STOCK',
    'VIEW_REPORTS',
  ],
  CASHIER: [
    'POS_SALES',
    'VIEW_REPORTS',
  ],
  FIELD_SALESPERSON: [
    'FIELD_SALES',
    'VIEW_REPORTS',
  ],
  ACCOUNTANT: [
    'MANAGE_EXPENSES',
    'PROCESS_SALARIES',
    'MANAGE_DEBTS',
    'VIEW_REPORTS',
  ],
  AUDITOR: [
    'VIEW_REPORTS',
    'AUDIT_LOGS',
  ],
};

export const hasPermission = (role: UserRole | undefined, permission: Permission): boolean => {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
};

export const canAccessDomain = (role: UserRole | undefined, domain: NavDomain): boolean => {
  if (!role) return false;
  if (role === 'SUPER_ADMIN') return true;

  switch (domain) {
    case 'dashboard':
      return true; // All roles can view dashboard
    case 'operations':
      return hasPermission(role, 'POS_SALES') || hasPermission(role, 'FIELD_SALES') || hasPermission(role, 'RECEIVE_STOCK') || hasPermission(role, 'MANAGE_EXPENSES');
    case 'inventory':
      return hasPermission(role, 'RECEIVE_STOCK') || hasPermission(role, 'TRANSFER_STOCK') || hasPermission(role, 'VIEW_REPORTS');
    case 'branches':
      return hasPermission(role, 'MANAGE_BRANCHES');
    case 'people':
      return hasPermission(role, 'MANAGE_USERS');
    case 'finance':
      return hasPermission(role, 'MANAGE_EXPENSES') || hasPermission(role, 'PROCESS_SALARIES') || hasPermission(role, 'MANAGE_DEBTS');
    case 'reports':
      return hasPermission(role, 'VIEW_REPORTS');
    case 'system':
      return hasPermission(role, 'MANAGE_SYSTEM') || hasPermission(role, 'AUDIT_LOGS');
    default:
      return false;
  }
};
