import { axiosClient } from '../../../api/axiosClient';
import { ENDPOINTS } from '../../../api/endpoints';
import { normalizeApiResponse, ApiResponse } from '../../../api/responseNormalizer';
import { LoginCredentials, LoginResponseData } from '../types/auth.types';

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<LoginResponseData> {
    // Send ONLY email and password required by backend
    const response = await axiosClient.post(ENDPOINTS.AUTH_LOGIN, {
      email: credentials.email.trim(),
      password: credentials.password,
    });

    const normalized: ApiResponse = normalizeApiResponse(response.data);

    if (!normalized.success) {
      throw new Error(normalized.message || 'Login failed with invalid credentials');
    }

    const payload = response.data;
    let user = payload?.data?.user || payload?.user;
    let token = payload?.data?.accessToken || payload?.data?.token || payload?.accessToken || payload?.token;
    let refreshToken = payload?.data?.refreshToken || payload?.refreshToken;

    if (!user || !token) {
      throw new Error('Invalid backend login response format: missing user or access token');
    }

    return {
      user,
      accessToken: token,
      refreshToken: refreshToken || null,
    };
  }

  static async logout(): Promise<void> {
    try {
      await axiosClient.post(ENDPOINTS.AUTH_LOGOUT);
    } catch (e) {
      console.warn('Backend logout call failed or endpoint unavailable, continuing local logout', e);
    }
  }

  static async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string }> {
    const response = await axiosClient.post(ENDPOINTS.AUTH_REFRESH, { refreshToken });
    const payload = response.data;
    const token = payload?.data?.accessToken || payload?.accessToken || payload?.token;
    const newRefresh = payload?.data?.refreshToken || payload?.refreshToken;

    if (!token) {
      throw new Error('Refresh token exchange failed');
    }

    return { accessToken: token, refreshToken: newRefresh };
  }
}
