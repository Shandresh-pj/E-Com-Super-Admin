import { axiosClient } from '../../../api/axiosClient';
import { ENDPOINTS } from '../../../api/endpoints';
import { normalizeApiResponse } from '../../../api/responseNormalizer';
import { LoginCredentials, LoginResponseData, BackendLoginResponse } from '../types/auth.types';

export class AuthService {
  /**
   * Login with email + password.
   *
   * Backend response shape (root level, NOT nested under `data`):
   * {
   *   success: true,
   *   message: "Login successful",
   *   token: "eyJ...",          ← field name is `token`, not `accessToken`
   *   refreshToken: "eyJ...",
   *   user: { id, email, userType, name, ... },
   *   roles: [{ roleId, role, company, branch }]
   * }
   */
  static async login(credentials: LoginCredentials): Promise<LoginResponseData> {
    const response = await axiosClient.post<BackendLoginResponse>(ENDPOINTS.AUTH_LOGIN, {
      email: credentials.email.trim(),
      password: credentials.password,
    });

    const payload = response.data;

    // Validate success flag
    if (!payload?.success) {
      throw new Error(payload?.message || 'Login failed. Please check your credentials.');
    }

    // Extract user — backend puts it at root level
    const user = payload.user ?? payload.data?.user;
    if (!user) {
      throw new Error('Backend did not return a user object. Please contact support.');
    }

    // Extract token — backend uses `token`, but fall back to `accessToken` for forward compatibility
    const accessToken =
      payload.token ??
      payload.accessToken ??
      payload.data?.token ??
      payload.data?.accessToken;

    if (!accessToken) {
      throw new Error(
        'Backend did not return an access token. ' +
        `Response keys: ${Object.keys(payload).join(', ')}`
      );
    }

    const refreshToken =
      payload.refreshToken ??
      payload.data?.refreshToken ??
      null;

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  static async logout(): Promise<void> {
    try {
      await axiosClient.post(ENDPOINTS.AUTH_LOGOUT);
    } catch (e) {
      // Backend logout is best-effort; local cleanup always proceeds
      console.warn('[AuthService] Backend logout call failed, continuing local logout', e);
    }
  }

  static async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string }> {
    const response = await axiosClient.post(ENDPOINTS.AUTH_REFRESH, { refreshToken });
    const payload = response.data;
    // Backend refresh may use `token` or `accessToken`
    const token =
      payload?.data?.accessToken ??
      payload?.data?.token ??
      payload?.accessToken ??
      payload?.token;
    const newRefresh =
      payload?.data?.refreshToken ??
      payload?.refreshToken;

    if (!token) {
      throw new Error('Refresh token exchange failed — no access token in response');
    }

    return { accessToken: token, refreshToken: newRefresh };
  }
}

