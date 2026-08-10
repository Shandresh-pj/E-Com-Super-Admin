import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, SECURITY_TIMEOUTS } from '../config/constants';
import { BiometricService } from './biometricService';
import { DeviceCredentialService } from './deviceCredentialService';
import { PinSecurityService, PinLength } from './pinSecurityService';

export type AuthMethod = 'biometrics' | 'device_credential' | 'pin';

export interface AppLockSettings {
  isEnabled: boolean;
  authMethod: AuthMethod;
  pinLength: PinLength;
  timeoutSeconds: number;
}

const AUTH_METHOD_KEY = 'svk_app_lock_auth_method';
const PIN_LENGTH_KEY = 'svk_app_lock_pin_len';

export class AppLockService {
  /**
   * Load complete App Lock settings
   */
  static async getSettings(): Promise<AppLockSettings> {
    try {
      const enabledStr = await AsyncStorage.getItem(STORAGE_KEYS.APP_LOCK_ENABLED);
      const timeoutStr = await AsyncStorage.getItem(STORAGE_KEYS.APP_LOCK_TIMEOUT);
      const methodStr = (await AsyncStorage.getItem(AUTH_METHOD_KEY)) as AuthMethod | null;
      const lenStr = await AsyncStorage.getItem(PIN_LENGTH_KEY);

      const isEnabled = enabledStr === 'true';
      const timeoutSeconds = timeoutStr ? parseInt(timeoutStr, 10) : SECURITY_TIMEOUTS.THIRTY_SECONDS;
      const authMethod: AuthMethod = methodStr || 'biometrics';
      const pinLength: PinLength = lenStr === '6' ? 6 : lenStr === '8' ? 8 : 4;

      return { isEnabled, authMethod, pinLength, timeoutSeconds };
    } catch {
      return {
        isEnabled: false,
        authMethod: 'biometrics',
        pinLength: 4,
        timeoutSeconds: SECURITY_TIMEOUTS.THIRTY_SECONDS,
      };
    }
  }

  /**
   * Set App Lock enabled status
   */
  static async setEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.APP_LOCK_ENABLED, String(enabled));
  }

  /**
   * Set active authentication method
   */
  static async setAuthMethod(method: AuthMethod): Promise<void> {
    await AsyncStorage.setItem(AUTH_METHOD_KEY, method);
  }

  /**
   * Set custom PIN length (4, 6, or 8)
   */
  static async setPinLength(length: PinLength): Promise<void> {
    await AsyncStorage.setItem(PIN_LENGTH_KEY, String(length));
  }

  /**
   * Set background auto-lock timeout
   */
  static async setTimeoutSeconds(seconds: number): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.APP_LOCK_TIMEOUT, String(seconds));
  }

  /**
   * Record timestamp of last active user interaction
   */
  static async updateLastActiveTimestamp(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_ACTIVE_TIMESTAMP, String(Date.now()));
  }

  /**
   * Determine if app should re-lock based on elapsed background duration
   */
  static async shouldLockApp(): Promise<boolean> {
    const { isEnabled, timeoutSeconds } = await this.getSettings();
    if (!isEnabled) return false;

    // Immediately timeout = lock every background transition
    if (timeoutSeconds === 0) return true;

    const lastActiveStr = await AsyncStorage.getItem(STORAGE_KEYS.LAST_ACTIVE_TIMESTAMP);
    if (!lastActiveStr) return true;

    const lastActive = parseInt(lastActiveStr, 10);
    const elapsedSeconds = (Date.now() - lastActive) / 1000;

    return elapsedSeconds >= timeoutSeconds;
  }

  /**
   * Verify authentication using the active configured method
   */
  static async verifyActiveUnlock(): Promise<boolean> {
    const settings = await this.getSettings();

    if (settings.authMethod === 'biometrics') {
      const bioResult = await BiometricService.authenticate('Unlock SVK E-Com Pro');
      return bioResult.success;
    }

    if (settings.authMethod === 'device_credential') {
      const devResult = await DeviceCredentialService.authenticateWithDeviceCredential();
      return devResult.success;
    }

    // Default PIN verification handled through AppLockModal
    return false;
  }
}
