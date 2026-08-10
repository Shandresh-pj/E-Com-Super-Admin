import { UserRole } from './roleResolver';
import { useAuthStore } from '../store/authStore';

export type SystemPermissionAction =
  | 'VIEW_PRODUCTS'
  | 'CREATE_PRODUCT'
  | 'UPDATE_PRODUCT'
  | 'DELETE_PRODUCT'
  | 'VIEW_ORDERS'
  | 'CREATE_ORDER'
  | 'UPDATE_ORDER'
  | 'DELETE_ORDER'
  | 'VIEW_INVENTORY'
  | 'UPDATE_INVENTORY'
  | 'VIEW_BRANCHES'
  | 'MANAGE_BRANCHES'
  | 'VIEW_EMPLOYEES'
  | 'MANAGE_EMPLOYEES'
  | 'VIEW_ANALYTICS'
  | 'MANAGE_ROLES'
  | 'VIEW_AUDIT_LOGS'
  | 'MANAGE_SETTINGS';

export class ActionPermissionResolver {
  /**
   * Evaluates granular system action permission against authenticated session.
   * Super_Admin possesses 100% full clearance.
   */
  static can(action: SystemPermissionAction): boolean {
    const { role, user } = useAuthStore.getState();

    if (role === UserRole.SUPER_ADMIN) {
      return true;
    }

    if (!user) {
      return false;
    }

    // Role level baseline checks
    switch (action) {
      case 'VIEW_PRODUCTS':
      case 'VIEW_ORDERS':
      case 'VIEW_INVENTORY':
      case 'VIEW_BRANCHES':
      case 'VIEW_EMPLOYEES':
      case 'VIEW_ANALYTICS':
        return role !== UserRole.UNSUPPORTED;

      case 'CREATE_PRODUCT':
      case 'UPDATE_PRODUCT':
        return [UserRole.ADMIN, UserRole.BRANCH_MANAGER].includes(role);

      case 'DELETE_PRODUCT':
        return role === UserRole.ADMIN;

      case 'CREATE_ORDER':
      case 'UPDATE_ORDER':
        return [UserRole.ADMIN, UserRole.BRANCH, UserRole.BRANCH_MANAGER, UserRole.SHOPKEEPER, UserRole.DELIVERY_BOY].includes(role);

      case 'DELETE_ORDER':
        return role === UserRole.ADMIN;

      case 'UPDATE_INVENTORY':
        return [UserRole.ADMIN, UserRole.BRANCH, UserRole.BRANCH_MANAGER].includes(role);

      case 'MANAGE_BRANCHES':
      case 'MANAGE_EMPLOYEES':
      case 'MANAGE_ROLES':
      case 'VIEW_AUDIT_LOGS':
      case 'MANAGE_SETTINGS':
        return role === UserRole.ADMIN;

      default:
        return false;
    }
  }
}
