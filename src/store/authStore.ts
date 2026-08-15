import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/constants';
import { TokenManager } from '../security/tokenManager';
import { resolveRole, UserRole } from '../security/roleResolver';

export interface UserProfile {
  id: number | string;
  email: string;
  userType: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  mobilenumber?: string;
  avatar?: string;
  department?: string;
  staffId?: string;
  emergencyContact?: string;
  officeBranch?: string;
  address?: string;
  cityStatePincode?: string;
  bio?: string;
  company_id?: number | string | null;
  companyId?: number | string | null;
  branch_id?: number | string | null;
  branchId?: number | string | null;
  branch?: {
    id: number | string;
    name: string;
  };
  role?: string;
  isSuperAdmin?: boolean;
  isActive?: boolean;
  created_at?: string;
  updated_at?: string;
}

/** A single permission entry from GET /auth/me/permissions */
export interface AppPermission {
  id: number | string;
  action: string;       // e.g. "view", "create", "update", "delete", "approve"
  canApprove?: boolean;
  menu: {
    id: number | string;
    name: string;       // e.g. "Products", "Orders", "Branches"
    path?: string;
    icon?: string;
  };
}

/** A menu entry from GET /auth/me/permissions */
export interface AppMenu {
  id: number | string;
  name: string;
  path?: string;
  icon?: string;
}

/** A role entry from GET /auth/me/permissions */
export interface AppRole {
  roleId: number | string;
  role: string;
  company?: any;
  branch?: any;
}

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Real backend permissions (BUG-006 fix)
  permissions: AppPermission[];
  menus: AppMenu[];
  backendRoles: AppRole[];
  permissionsLoading: boolean;

  setAuthData: (user: UserProfile, accessToken: string, refreshToken?: string | null) => Promise<void>;
  logout: () => Promise<void>;
  initializeSession: () => Promise<void>;
  updateUserProfile: (user: Partial<UserProfile>) => void;

  // Permission management
  setPermissions: (permissions: AppPermission[], menus: AppMenu[], roles: AppRole[]) => void;
  refreshPermissions: () => Promise<void>;

  /**
   * Check if the user has a specific action on a menu by name.
   * For SUPER_ADMIN, always returns true (FULL_ACCESS).
   */
  hasPermission: (menuName: string, action: string) => boolean;
  canViewMenu: (menuName: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  role: UserRole.UNSUPPORTED,
  isAuthenticated: false,
  isLoading: true,
  permissions: [],
  menus: [],
  backendRoles: [],
  permissionsLoading: false,

  setAuthData: async (user: UserProfile, accessToken: string, refreshToken?: string | null) => {
    const role = resolveRole(user.userType);
    await TokenManager.setTokens(accessToken, refreshToken);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

    set({
      user,
      accessToken,
      refreshToken: refreshToken || null,
      role,
      isAuthenticated: true,
      isLoading: false,
    });

    // Fetch real permissions from backend immediately after login (BUG-006)
    get().refreshPermissions();
  },

  logout: async () => {
    await TokenManager.clearTokens();
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);

    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      role: UserRole.UNSUPPORTED,
      isAuthenticated: false,
      isLoading: false,
      permissions: [],
      menus: [],
      backendRoles: [],
    });
  },

  initializeSession: async () => {
    set({ isLoading: true });
    try {
      const accessToken = await TokenManager.getAccessToken();
      const refreshToken = await TokenManager.getRefreshToken();
      const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);

      if (accessToken && userJson) {
        const user: UserProfile = JSON.parse(userJson);
        const role = resolveRole(user.userType);

        set({
          user,
          accessToken,
          refreshToken,
          role,
          isAuthenticated: true,
          isLoading: false,
        });

        // Refresh permissions in background on session restore
        get().refreshPermissions();
      } else {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          role: UserRole.UNSUPPORTED,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (e) {
      console.warn('[AuthStore] Failed to restore session from storage', e);
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        role: UserRole.UNSUPPORTED,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  updateUserProfile: (updatedFields: Partial<UserProfile>) => {
    const currentUser = get().user;
    if (currentUser) {
      const newProfile = { ...currentUser, ...updatedFields };
      set({ user: newProfile });
      AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(newProfile)).catch(() => {});
    }
  },

  setPermissions: (permissions: AppPermission[], menus: AppMenu[], roles: AppRole[]) => {
    set({ permissions, menus, backendRoles: roles });
  },

  /**
   * Fetch fresh permissions from the backend.
   * Called after login, session restore, and on `permissions-updated` socket event.
   */
  refreshPermissions: async () => {
    const { accessToken, user } = get();
    if (!accessToken) return;

    set({ permissionsLoading: true });
    try {
      // Lazy import to avoid circular dependencies
      const { axiosClient } = await import('../api/axiosClient');
      const { ENDPOINTS } = await import('../api/endpoints');

      const response = await axiosClient.get(ENDPOINTS.AUTH_ME_PERMISSIONS);
      const payload = response.data;

      if (payload?.success) {
        const permissions: AppPermission[] = Array.isArray(payload.permissions)
          ? payload.permissions
          : [];
        const menus: AppMenu[] = Array.isArray(payload.menus) ? payload.menus : [];
        const roles: AppRole[] = Array.isArray(payload.roles) ? payload.roles : [];

        set({ permissions, menus, backendRoles: roles });
      }
    } catch (e) {
      // Permissions refresh is non-blocking — log and continue
      console.warn('[AuthStore] Failed to refresh permissions from backend:', e);
    } finally {
      set({ permissionsLoading: false });
    }
  },

  hasPermission: (menuName: string, action: string): boolean => {
    const { user, permissions } = get();

    // Super admins have full access — backend confirms with permissions: ['FULL_ACCESS']
    if (user?.isSuperAdmin || (permissions as any[]).includes('FULL_ACCESS')) {
      return true;
    }

    return permissions.some(
      (p) =>
        p.menu?.name?.toLowerCase() === menuName.toLowerCase() &&
        p.action?.toLowerCase() === action.toLowerCase()
    );
  },

  canViewMenu: (menuName: string): boolean => {
    const { user, permissions } = get();

    if (user?.isSuperAdmin || (permissions as any[]).includes('FULL_ACCESS')) {
      return true;
    }

    return permissions.some(
      (p) => p.menu?.name?.toLowerCase() === menuName.toLowerCase()
    );
  },
}));
