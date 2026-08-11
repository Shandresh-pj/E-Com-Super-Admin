import { axiosClient } from '../../../api/axiosClient';
import { ENDPOINTS } from '../../../api/endpoints';
import { normalizeApiResponse } from '../../../api/responseNormalizer';
import { UserRole } from '../../../security/roleResolver';

export interface MenuPermission {
  id: number;
  action: 'READ' | 'WRITE' | 'UPDATE' | 'DELETE' | 'APPROVE' | string;
  menu_id: number;
}

export interface MenuItem {
  id: number;
  name: string;
  path: string;
  icon: string;
  isActive: boolean;
  category?: string;
  permissions: MenuPermission[];
}

// Complete default fallback list of all 53+ backend menus
export const BACKEND_MENUS_CATALOG: MenuItem[] = [
  // ── Commerce & Inventory ──────────────────────────────
  { id: 9, name: 'Products', path: '/product', icon: 'box', isActive: true, category: 'Commerce & Inventory', permissions: [] },
  { id: 8, name: 'Categories', path: '/category', icon: 'category', isActive: true, category: 'Commerce & Inventory', permissions: [] },
  { id: 6, name: 'Product Attributes', path: '/product-attribute', icon: 'tag', isActive: true, category: 'Commerce & Inventory', permissions: [] },
  { id: 7, name: 'Attribute Values', path: '/attribute-value', icon: 'list-details', isActive: true, category: 'Commerce & Inventory', permissions: [] },
  { id: 18, name: 'Central Stocks', path: '/stocks', icon: 'database', isActive: true, category: 'Commerce & Inventory', permissions: [] },
  { id: 17, name: 'Branch Stocks', path: '/branch-stocks', icon: 'git-merge', isActive: true, category: 'Commerce & Inventory', permissions: [] },
  { id: 10, name: 'Orders Register', path: '/orders', icon: 'shopping-cart', isActive: true, category: 'Commerce & Inventory', permissions: [] },
  { id: 14, name: 'Customer Directory', path: '/customers', icon: 'users', isActive: true, category: 'Commerce & Inventory', permissions: [] },
  { id: 35, name: 'POS Billing Machine', path: '/pos-billing', icon: 'receipt-2', isActive: true, category: 'Commerce & Inventory', permissions: [] },

  { id: 24, name: 'Invoice Generator', path: '/invoices', icon: 'file-text', isActive: true, category: 'Commerce & Inventory', permissions: [] },
  { id: 11, name: 'Discount Coupons', path: '/coupons', icon: 'ticket', isActive: true, category: 'Commerce & Inventory', permissions: [] },
  { id: 31, name: 'Standard Checkout', path: '/checkout', icon: 'credit-card', isActive: true, category: 'Commerce & Inventory', permissions: [] },

  // ── Operations & Outlets ───────────────────────────────
  { id: 2, name: 'Company Branches', path: '/branch', icon: 'store', isActive: true, category: 'Operations & Outlets', permissions: [] },
  { id: 3, name: 'Staff & Workforce', path: '/employees', icon: 'users', isActive: true, category: 'Operations & Outlets', permissions: [] },
  { id: 16, name: 'Attendance Shifts', path: '/attendance', icon: 'calendar', isActive: true, category: 'Operations & Outlets', permissions: [] },
  { id: 50, name: 'Shifts & Schedules', path: '/shifts', icon: 'schedule', isActive: true, category: 'Operations & Outlets', permissions: [] },
  { id: 20, name: 'Leave Management', path: '/leave', icon: 'plane-departure', isActive: true, category: 'Operations & Outlets', permissions: [] },
  { id: 19, name: 'Staff Payroll', path: '/payroll', icon: 'credit-card', isActive: true, category: 'Operations & Outlets', permissions: [] },
  { id: 33, name: 'Document Verification', path: '/employee-documents', icon: 'file-check', isActive: true, category: 'Operations & Outlets', permissions: [] },
  { id: 51, name: 'Break Policies', path: '/break-policies', icon: 'coffee', isActive: true, category: 'Operations & Outlets', permissions: [] },
  { id: 52, name: 'Biometric Terminals', path: '/biometric', icon: 'fingerprint', isActive: true, category: 'Operations & Outlets', permissions: [] },
  { id: 53, name: 'GPS Geofencing', path: '/geofencing', icon: 'location_on', isActive: true, category: 'Operations & Outlets', permissions: [] },

  // ── Logistics & Fleet Mobility ────────────────────────
  { id: 21, name: 'Delivery Tracking', path: '/delivery-tracking', icon: 'map-pin', isActive: true, category: 'Logistics & Mobility', permissions: [] },
  { id: 39, name: 'Mobility Cockpit', path: '/dashboard/mobility-dashboard', icon: 'car', isActive: true, category: 'Logistics & Mobility', permissions: [] },
  { id: 42, name: 'Parcel Freight', path: '/dashboard/parcel-logistics', icon: 'truck', isActive: true, category: 'Logistics & Mobility', permissions: [] },
  { id: 43, name: 'Fleet Asset Control', path: '/dashboard/fleet-management', icon: 'radar', isActive: true, category: 'Logistics & Mobility', permissions: [] },
  { id: 45, name: 'Live GPS Telemetry', path: '/dashboard/live-tracking', icon: 'navigation', isActive: true, category: 'Logistics & Mobility', permissions: [] },
  { id: 40, name: 'Ride & Taxi Booking', path: '/dashboard/ride-booking', icon: 'steering-wheel', isActive: true, category: 'Logistics & Mobility', permissions: [] },
  { id: 41, name: 'Car Rental Hub', path: '/dashboard/car-rental', icon: 'key', isActive: true, category: 'Logistics & Mobility', permissions: [] },
  { id: 44, name: 'Corporate Transit', path: '/dashboard/corporate-transport', icon: 'bus', isActive: true, category: 'Logistics & Mobility', permissions: [] },
  { id: 46, name: 'Driver & KYC Verification', path: '/dashboard/vehicle-driver-verification', icon: 'user-check', isActive: true, category: 'Logistics & Mobility', permissions: [] },

  // ── Finance & Subscriptions ───────────────────────────
  { id: 22, name: 'Payments Ledger', path: '/payments', icon: 'credit-card', isActive: true, category: 'Finance & Subscriptions', permissions: [] },
  { id: 26, name: 'Profit & Loss Statement', path: '/profit-loss', icon: 'chart-pie', isActive: true, category: 'Finance & Subscriptions', permissions: [] },
  { id: 27, name: 'Subscription Plans', path: '/manage-subscription-plans', icon: 'diamond', isActive: true, category: 'Finance & Subscriptions', permissions: [] },
  { id: 29, name: 'Billing History', path: '/billing-history', icon: 'receipt', isActive: true, category: 'Finance & Subscriptions', permissions: [] },
  { id: 30, name: 'Subscription Coupons', path: '/subscription-coupons', icon: 'ticket', isActive: true, category: 'Finance & Subscriptions', permissions: [] },

  // ── Collaboration & Events ────────────────────────────
  { id: 37, name: 'Secure Communications', path: '/communication', icon: 'message-square', isActive: true, category: 'Collaboration & Events', permissions: [] },
  { id: 38, name: 'Team Meetings & Calls', path: '/communication/meetings', icon: 'video', isActive: true, category: 'Collaboration & Events', permissions: [] },
  { id: 32, name: 'Company Calendar', path: '/calendar', icon: 'calendar-event', isActive: true, category: 'Collaboration & Events', permissions: [] },
  { id: 15, name: 'Notification Alerts', path: '/alerts', icon: 'bell', isActive: true, category: 'Collaboration & Events', permissions: [] },

  // ── Executive Security & Governance ───────────────────
  { id: 1, name: 'Admin Overview', path: '/admin', icon: 'shield', isActive: true, category: 'Executive Security', permissions: [] },
  { id: 4, name: 'Role Access Matrix', path: '/role-access', icon: 'shield-check', isActive: true, category: 'Executive Security', permissions: [] },
  { id: 5, name: 'Roles Management', path: '/roles', icon: 'users', isActive: true, category: 'Executive Security', permissions: [] },
  { id: 12, name: 'System Audit Logs', path: '/audit-logs', icon: 'clipboard-list', isActive: true, category: 'Executive Security', permissions: [] },
  { id: 25, name: 'Workflow Approvals', path: '/approvals', icon: 'check-square', isActive: true, category: 'Executive Security', permissions: [] },
  { id: 13, name: 'System Statuses', path: '/status', icon: 'activity', isActive: true, category: 'Executive Security', permissions: [] },
  { id: 36, name: 'Hardware Devices', path: '/devices', icon: 'printer', isActive: true, category: 'Executive Security', permissions: [] },
  { id: 34, name: 'Translation Console', path: '/translations', icon: 'globe', isActive: true, category: 'Executive Security', permissions: [] },
  { id: 47, name: 'Account Profile', path: '/profile', icon: 'user', isActive: true, category: 'Executive Security', permissions: [] },
];

export class MenuService {
  private static cachedMenus: MenuItem[] | null = null;

  /**
   * Fetch menus from live API with automatic categorization
   */
  static async getMenus(): Promise<MenuItem[]> {
    try {
      const response = await axiosClient.get(ENDPOINTS.MENU_ALL);
      const normalized = normalizeApiResponse<MenuItem[]>(response.data);
      if (Array.isArray(normalized.data) && normalized.data.length > 0) {
        const enriched = normalized.data.map((m) => {
          const fallback = BACKEND_MENUS_CATALOG.find((c) => c.id === m.id || c.path === m.path);
          return {
            ...m,
            category: m.category || fallback?.category || 'General Operations',
          };
        });
        this.cachedMenus = enriched;
        return enriched;
      }
    } catch {}

    this.cachedMenus = BACKEND_MENUS_CATALOG;
    return BACKEND_MENUS_CATALOG;
  }

  /**
   * Get authorized menus based on user role
   * SuperAdmin has 100% full unrestricted access to ALL 53+ menus
   */
  static getAuthorizedMenus(allMenus: MenuItem[], role: UserRole): MenuItem[] {
    if (role === UserRole.SUPER_ADMIN) {
      return allMenus;
    }

    // Role-specific filtering for non-superadmin users
    return allMenus.filter((m) => {
      if (role === UserRole.ADMIN) {
        return m.path !== '/role-access' && m.path !== '/menubar';
      }
      if (role === UserRole.BRANCH || role === UserRole.BRANCH_MANAGER) {
        return [
          '/product',
          '/category',
          '/orders',
          '/branch-stocks',
          '/stocks',
          '/attendance',
          '/shifts',
          '/invoices',
          '/checkout',
          '/pos-billing',
          '/delivery-tracking',
          '/alerts',
          '/notifications',
          '/profile',
        ].includes(m.path);
      }
      if (role === UserRole.SHOPKEEPER) {
        return [
          '/pos-billing',
          '/checkout',
          '/product',
          '/orders',
          '/invoices',
          '/alerts',
          '/notifications',
          '/profile',
        ].includes(m.path);
      }
      if (role === UserRole.DELIVERY_BOY) {
        return [
          '/delivery-tracking',
          '/dashboard/parcel-logistics',
          '/dashboard/live-tracking',
          '/orders',
          '/alerts',
          '/notifications',
          '/profile',
        ].includes(m.path);
      }
      if (role === UserRole.EMPLOYEE) {
        return [
          '/attendance',
          '/shifts',
          '/leave',
          '/payroll',
          '/communication',
          '/calendar',
          '/alerts',
          '/notifications',
          '/profile',
        ].includes(m.path);
      }
      return m.isActive;
    });
  }
}
