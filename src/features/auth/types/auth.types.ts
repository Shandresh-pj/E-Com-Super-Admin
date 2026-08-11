import { UserProfile } from '../../../store/authStore';

export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Normalized login response — returned by AuthService.login() after mapping
 * the backend response (which uses `token`, not `accessToken`).
 */
export interface LoginResponseData {
  /** JWT access token (normalized from backend `token` field) */
  accessToken: string;
  /** JWT refresh token */
  refreshToken: string | null;
  user: UserProfile;
}

/**
 * Raw backend login response shape — used internally in AuthService.
 */
export interface BackendLoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: UserProfile;
  data?: {
    token?: string;
    accessToken?: string;
    refreshToken?: string;
    user?: UserProfile;
  };
  roles?: Array<{
    roleId: number;
    role: string;
    company: any;
    branch: any;
  }>;
}
