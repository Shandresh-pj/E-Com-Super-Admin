import { axiosClient } from '../../../api/axiosClient';
import { ENDPOINTS } from '../../../api/endpoints';
import { normalizeApiResponse } from '../../../api/responseNormalizer';
import { UserRole } from '../../../security/roleResolver';

export interface PermissionModule {
  id: string;
  name: string;
  description: string;
  actions: {
    key: string;
    label: string;
    enabled: boolean;
  }[];
}

export interface RolePermissionsMap {
  [role: string]: {
    [moduleKey: string]: {
      [actionKey: string]: boolean;
    };
  };
}

export interface UserAccessItem {
  id: number | string;
  name: string;
  email: string;
  userType: string;
  branch?: { id: number; name: string };
  status: boolean;
}

/**
 * Maps backend menu items to PermissionModule[]
 */
function mapMenuToModules(menuItems: any[]): PermissionModule[] {
  return menuItems.map((item: any) => ({
    id: String(item.id || item.path || item.name).toLowerCase().replace(/\s+/g, '_').replace(/^\//, ''),
    name: item.name || item.path,
    description: item.description || '',
    actions: (item.permissions || []).map((p: any) => ({
      key: (p.action || p.key || '').toLowerCase(),
      label: capitalize(p.action || p.key || ''),
      enabled: p.isActive !== false,
    })),
  }));
}

function capitalize(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export class RoleAccessService {
  /**
   * Fetch menu/permissions from backend API (GET /menu)
   * Falls back to a reasonable default matrix if the API is unavailable.
   */
  static async getMenuPermissions(): Promise<PermissionModule[]> {
    try {
      const response = await axiosClient.get(ENDPOINTS.MENU_ALL);
      const normalized = normalizeApiResponse<any[]>(response.data);
      if (Array.isArray(normalized.data) && normalized.data.length > 0) {
        return mapMenuToModules(normalized.data);
      }
    } catch {}
    return RoleAccessService.getDefaultModules();
  }

  /**
   * Default permission modules as a safe fallback (no per-role override applied).
   */
  static getDefaultModules(): PermissionModule[] {
    return [
      {
        id: 'products',
        name: 'Product Catalog',
        description: 'Catalog items, pricing, inventory & media',
        actions: [
          { key: 'view',   label: 'View Catalog',   enabled: true },
          { key: 'create', label: 'Add Products',    enabled: false },
          { key: 'edit',   label: 'Edit & Price',    enabled: false },
          { key: 'delete', label: 'Delete Item',     enabled: false },
        ],
      },
      {
        id: 'orders',
        name: 'Order Processing',
        description: 'Purchase orders, delivery status & invoices',
        actions: [
          { key: 'view',    label: 'View Orders',        enabled: true },
          { key: 'process', label: 'Process / Dispatch',  enabled: false },
          { key: 'cancel',  label: 'Cancel Order',        enabled: false },
          { key: 'refund',  label: 'Issue Refund',        enabled: false },
        ],
      },
      {
        id: 'branches',
        name: 'Company Outlets',
        description: 'Branch locations, managers & performance',
        actions: [
          { key: 'view',         label: 'View Branches',  enabled: true },
          { key: 'create',       label: 'Add Branch',     enabled: false },
          { key: 'edit',         label: 'Edit Info',      enabled: false },
          { key: 'manage_staff', label: 'Assign Staff',   enabled: false },
        ],
      },
      {
        id: 'workforce',
        name: 'Staff & Personnel',
        description: 'Employee directory, shifts & attendance',
        actions: [
          { key: 'view',       label: 'View Staff',     enabled: true },
          { key: 'create',     label: 'Onboard Staff',  enabled: false },
          { key: 'edit',       label: 'Edit Profile',   enabled: false },
          { key: 'attendance', label: 'Log Attendance', enabled: false },
        ],
      },
      {
        id: 'pos',
        name: 'POS Terminal & Billing',
        description: 'Counter sales, cash drawers & receipt prints',
        actions: [
          { key: 'create_sale',  label: 'Process Bill',    enabled: false },
          { key: 'discount',     label: 'Apply Discount',  enabled: false },
          { key: 'shift_close',  label: 'Close Register',  enabled: false },
        ],
      },
      {
        id: 'notifications',
        name: 'Broadcasts & Alerts',
        description: 'System-wide push alerts and sound profile',
        actions: [
          { key: 'view',        label: 'Receive Alerts',       enabled: true },
          { key: 'broadcast',   label: 'Broadcast Message',    enabled: false },
          { key: 'global_tone', label: 'Set Global Tone',      enabled: false },
        ],
      },
    ];
  }

  /**
   * Build a role-specific permission matrix by enabling relevant actions per role.
   */
  static buildRoleMatrix(baseModules: PermissionModule[]): { [key: string]: PermissionModule[] } {
    const forRole = (enableFn: (moduleId: string, actionKey: string) => boolean) =>
      baseModules.map((m) => ({
        ...m,
        actions: m.actions.map((a) => ({ ...a, enabled: enableFn(m.id, a.key) })),
      }));

    return {
      [UserRole.SUPER_ADMIN]: forRole(() => true),
      [UserRole.ADMIN]: forRole((mid, ak) =>
        ak !== 'global_tone' && ak !== 'broadcast'
      ),
      [UserRole.BRANCH_MANAGER]: forRole((mid, ak) =>
        ak === 'view' || ak === 'process' || ak === 'attendance' || ak === 'create_sale'
      ),
      [UserRole.BRANCH]: forRole((mid, ak) =>
        ak === 'view' || ak === 'process' || ak === 'create_sale'
      ),
      [UserRole.SHOPKEEPER]: forRole((mid, ak) =>
        mid === 'pos' || (mid === 'products' && ak === 'view') || (mid === 'orders' && ak === 'view')
      ),
      [UserRole.DELIVERY_BOY]: forRole((mid, ak) =>
        mid === 'orders' && (ak === 'view' || ak === 'process')
      ),
      [UserRole.EMPLOYEE]: forRole((mid, ak) =>
        ak === 'view' || ak === 'attendance'
      ),
    };
  }

  /**
   * Fetch users list for role assignment (GET /auth/get-users)
   */
  static async getUsersList(): Promise<UserAccessItem[]> {
    try {
      const response = await axiosClient.get(ENDPOINTS.AUTH_GET_USERS);
      const normalized = normalizeApiResponse<UserAccessItem[]>(response.data);
      return Array.isArray(normalized.data) ? normalized.data : [];
    } catch {
      return [];
    }
  }

  /**
   * Assign a system role to a user (POST /auth/assign-role)
   */
  static async assignUserRole(userId: number | string, userType: string, branchId?: number | string): Promise<boolean> {
    try {
      await axiosClient.post(ENDPOINTS.AUTH_ASSIGN_ROLE, {
        userId,
        userType,
        branchId,
      });
      return true;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to assign role');
    }
  }
}
