import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SystemPermissionAction, ActionPermissionResolver } from '../security/actionPermissionResolver';

export interface ShortcutItem {
  id: string;
  title: string;
  route: string;
  icon: string;
  permission?: SystemPermissionAction;
  isPinned: boolean;
  category: string;
}

const DEFAULT_SHORTCUTS: ShortcutItem[] = [
  { id: 'sc-1', title: 'Products', route: 'Products', icon: 'box', permission: 'VIEW_PRODUCTS', isPinned: true, category: 'Commerce' },
  { id: 'sc-2', title: 'Orders', route: 'Orders', icon: 'shopping-cart', permission: 'VIEW_ORDERS', isPinned: true, category: 'Commerce' },
  { id: 'sc-3', title: 'Branches', route: 'Branches', icon: 'store', permission: 'VIEW_BRANCHES', isPinned: true, category: 'Operations' },
  { id: 'sc-4', title: 'Staff', route: 'Employees', icon: 'users', permission: 'VIEW_EMPLOYEES', isPinned: true, category: 'Operations' },
  { id: 'sc-5', title: 'Attendance', route: 'Attendance', icon: 'calendar', permission: 'VIEW_EMPLOYEES', isPinned: false, category: 'Operations' },
  { id: 'sc-7', title: 'Security', route: 'RoleAccess', icon: 'shield-check', permission: 'MANAGE_ROLES', isPinned: false, category: 'Governance' },
  { id: 'sc-8', title: 'Alerts', route: 'Notifications', icon: 'bell', permission: 'VIEW_PRODUCTS', isPinned: false, category: 'Events' },
  { id: 'sc-9', title: 'Profile', route: 'Profile', icon: 'user', isPinned: true, category: 'Personal' },
];

const STORAGE_KEY = '@svk_pinned_shortcuts_v1';

interface ShortcutState {
  shortcuts: ShortcutItem[];
  loadShortcuts: () => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  resetDefaults: () => Promise<void>;
  getPinnedAuthorizedShortcuts: () => ShortcutItem[];
}

export const useShortcutStore = create<ShortcutState>((set, get) => ({
  shortcuts: DEFAULT_SHORTCUTS,

  loadShortcuts: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        set({ shortcuts: parsed });
      }
    } catch {}
  },

  togglePin: async (id: string) => {
    const updated = get().shortcuts.map((s) => (s.id === id ? { ...s, isPinned: !s.isPinned } : s));
    set({ shortcuts: updated });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  },

  resetDefaults: async () => {
    set({ shortcuts: DEFAULT_SHORTCUTS });
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {}
  },

  getPinnedAuthorizedShortcuts: () => {
    return get().shortcuts.filter((s) => {
      if (!s.isPinned) return false;
      if (!s.permission) return true;
      return ActionPermissionResolver.can(s.permission);
    });
  },
}));
