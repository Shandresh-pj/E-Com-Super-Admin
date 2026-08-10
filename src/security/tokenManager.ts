import { SecureStorage } from './secureStorage';
import { STORAGE_KEYS } from '../config/constants';

export class TokenManager {
  private static cachedAccessToken: string | null = null;
  private static cachedRefreshToken: string | null = null;

  static async getAccessToken(): Promise<string | null> {
    if (this.cachedAccessToken) return this.cachedAccessToken;
    const token = await SecureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    this.cachedAccessToken = token;
    return token;
  }

  static async getRefreshToken(): Promise<string | null> {
    if (this.cachedRefreshToken) return this.cachedRefreshToken;
    const token = await SecureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    this.cachedRefreshToken = token;
    return token;
  }

  static async setTokens(accessToken: string, refreshToken?: string | null): Promise<void> {
    this.cachedAccessToken = accessToken;
    await SecureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    if (refreshToken) {
      this.cachedRefreshToken = refreshToken;
      await SecureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }
  }

  static async clearTokens(): Promise<void> {
    this.cachedAccessToken = null;
    this.cachedRefreshToken = null;
    await SecureStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    await SecureStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  }
}
