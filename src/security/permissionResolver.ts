import { UserRole } from './roleResolver';

export type Resource =
  | 'dashboard'
  | 'products'
  | 'orders'
  | 'inventory'
  | 'customers'
  | 'branches'
  | 'employees'
  | 'delivery'
  | 'pos'
  | 'settings'
  | 'security';

export type Action = 'view' | 'create' | 'update' | 'delete' | 'approve';

const ROLE_PERMISSIONS: Record<UserRole, Record<Resource, Action[]>> = {
  [UserRole.SUPER_ADMIN]: {
    dashboard: ['view', 'create', 'update', 'delete', 'approve'],
    products: ['view', 'create', 'update', 'delete', 'approve'],
    orders: ['view', 'create', 'update', 'delete', 'approve'],
    inventory: ['view', 'create', 'update', 'delete', 'approve'],
    customers: ['view', 'create', 'update', 'delete', 'approve'],
    branches: ['view', 'create', 'update', 'delete', 'approve'],
    employees: ['view', 'create', 'update', 'delete', 'approve'],
    delivery: ['view', 'create', 'update', 'delete', 'approve'],
    pos: ['view', 'create', 'update', 'delete', 'approve'],
    settings: ['view', 'create', 'update', 'delete', 'approve'],
    security: ['view', 'create', 'update', 'delete', 'approve'],
  },

  [UserRole.ADMIN]: {
    dashboard: ['view'],
    products: ['view', 'create', 'update', 'delete'],
    orders: ['view', 'create', 'update', 'approve'],
    inventory: ['view', 'create', 'update'],
    customers: ['view', 'create', 'update'],
    branches: ['view', 'update'],
    employees: ['view', 'create', 'update'],
    delivery: ['view', 'update'],
    pos: ['view', 'create'],
    settings: ['view', 'update'],
    security: ['view'],
  },

  [UserRole.BRANCH]: {
    dashboard: ['view'],
    products: ['view'],
    orders: ['view', 'create', 'update'],
    inventory: ['view', 'update'],
    customers: ['view', 'create'],
    branches: ['view'],
    employees: ['view'],
    delivery: ['view'],
    pos: ['view', 'create'],
    settings: ['view'],
    security: [],
  },

  [UserRole.BRANCH_MANAGER]: {
    dashboard: ['view'],
    products: ['view', 'update'],
    orders: ['view', 'update', 'approve'],
    inventory: ['view', 'update'],
    customers: ['view'],
    branches: ['view'],
    employees: ['view', 'update'],
    delivery: ['view', 'update'],
    pos: ['view', 'create'],
    settings: ['view'],
    security: [],
  },

  [UserRole.EMPLOYEE]: {
    dashboard: ['view'],
    products: ['view'],
    orders: ['view', 'update'],
    inventory: ['view'],
    customers: ['view'],
    branches: ['view'],
    employees: ['view'],
    delivery: ['view'],
    pos: ['view'],
    settings: [],
    security: [],
  },

  [UserRole.SHOPKEEPER]: {
    dashboard: ['view'],
    products: ['view'],
    orders: ['view', 'create', 'update'],
    inventory: ['view'],
    customers: ['view', 'create'],
    branches: ['view'],
    employees: [],
    delivery: [],
    pos: ['view', 'create', 'update', 'approve'],
    settings: [],
    security: [],
  },

  [UserRole.DELIVERY_BOY]: {
    dashboard: ['view'],
    products: ['view'],
    orders: ['view', 'update'],
    inventory: [],
    customers: ['view'],
    branches: [],
    employees: [],
    delivery: ['view', 'update', 'approve'],
    pos: [],
    settings: [],
    security: [],
  },

  [UserRole.UNSUPPORTED]: {
    dashboard: [],
    products: [],
    orders: [],
    inventory: [],
    customers: [],
    branches: [],
    employees: [],
    delivery: [],
    pos: [],
    settings: [],
    security: [],
  },
};

export class PermissionResolver {
  static hasPermission(role: UserRole, resource: Resource, action: Action): boolean {
    const permissions = ROLE_PERMISSIONS[role]?.[resource];
    return Array.isArray(permissions) && permissions.includes(action);
  }

  static canView(role: UserRole, resource: Resource): boolean {
    return this.hasPermission(role, resource, 'view');
  }

  static canCreate(role: UserRole, resource: Resource): boolean {
    return this.hasPermission(role, resource, 'create');
  }

  static canUpdate(role: UserRole, resource: Resource): boolean {
    return this.hasPermission(role, resource, 'update');
  }

  static canDelete(role: UserRole, resource: Resource): boolean {
    return this.hasPermission(role, resource, 'delete');
  }

  static canApprove(role: UserRole, resource: Resource): boolean {
    return this.hasPermission(role, resource, 'approve');
  }
}
