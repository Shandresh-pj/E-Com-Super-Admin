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
  avatar?: string;
  department?: string;
  staffId?: string;
  emergencyContact?: string;
  officeBranch?: string;
  address?: string;
  cityStatePincode?: string;
  bio?: string;
  branch_id?: number | string | null;
  branchId?: number | string | null;
  branch?: {
    id: number | string;
    name: string;
  };
  role?: string;
  created_at?: string;
  updated_at?: string;
}

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuthData: (user: UserProfile, accessToken: string, refreshToken?: string | null) => Promise<void>;
  logout: () => Promise<void>;
  initializeSession: () => Promise<void>;
  updateUserProfile: (user: Partial<UserProfile>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  role: UserRole.UNSUPPORTED,
  isAuthenticated: false,
  isLoading: true,

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
      console.warn('Failed to restore auth session from storage', e);
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
}));
