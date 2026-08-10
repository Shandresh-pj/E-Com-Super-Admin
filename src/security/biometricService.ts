import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/constants';

const PIN_STORAGE_KEY = 'svk_app_security_pin';

export interface BiometricResult {
  success: boolean;
  error?: string;
  biometricsAvailable: boolean;
}

export class BiometricService {
  static async checkAvailability(): Promise<{
    hasHardware: boolean;
    isEnrolled: boolean;
    supportedTypes: string[];
  }> {
    return {
      hasHardware: true,
      isEnrolled: true,
      supportedTypes: ['FINGERPRINT', 'FACE_RECOGNITION', 'SECURITY_PIN'],
    };
  }

  /**
   * Interactive biometric authentication with simulated sensor verification
   */
  static async authenticate(reason: string = 'Verify identity to access application'): Promise<BiometricResult> {
    try {
      // Simulate hardware sensor handshake (150ms)
      await new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 200);
      });
      return { success: true, biometricsAvailable: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Authentication failed',
        biometricsAvailable: true,
      };
    }
  }

  /**
   * Set 4-digit security PIN
   */
  static async setPin(pin: string): Promise<boolean> {
    try {
      if (pin.length !== 4) return false;
      await AsyncStorage.setItem(PIN_STORAGE_KEY, pin);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verify entered PIN against stored PIN
   */
  static async verifyPin(enteredPin: string): Promise<boolean> {
    try {
      const storedPin = await AsyncStorage.getItem(PIN_STORAGE_KEY);
      // Default fallback PIN is '1234' if none has been explicitly set
      if (!storedPin) {
        return enteredPin === '1234';
      }
      return enteredPin === storedPin;
    } catch {
      return false;
    }
  }

  /**
   * Check if a custom PIN is configured
   */
  static async hasPin(): Promise<boolean> {
    try {
      const storedPin = await AsyncStorage.getItem(PIN_STORAGE_KEY);
      return Boolean(storedPin);
    } catch {
      return false;
    }
  }

  /**
   * Remove configured PIN
   */
  static async removePin(): Promise<void> {
    try {
      await AsyncStorage.removeItem(PIN_STORAGE_KEY);
    } catch {}
  }
}
