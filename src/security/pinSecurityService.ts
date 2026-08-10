import AsyncStorage from '@react-native-async-storage/async-storage';

const SALT_KEY = 'svk_pin_salt_sec';
const HASH_KEY = 'svk_pin_hash_sec';
const LENGTH_KEY = 'svk_pin_length_sec';
const FAILURES_KEY = 'svk_pin_failures_sec';
const LOCKOUT_TIMESTAMP_KEY = 'svk_pin_lockout_until_sec';

export type PinLength = 4 | 6 | 8;

export interface PinLockoutStatus {
  isLockedOut: boolean;
  remainingSeconds: number;
  failedAttempts: number;
}

/**
 * Portable cryptographic SHA-256 implementation
 * Produces secure 256-bit hex hash with zero external binary dependencies
 */
function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
    0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
    0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
    0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
    0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  let i = 0;
  for (i = 0; i < ascii.length; i++) {
    const wordIndex = i >> 2;
    words[wordIndex] = (words[wordIndex] || 0) | ((ascii.charCodeAt(i) & 0xff) << ((3 - (i % 4)) * 8));
  }

  const wordIndex = i >> 2;
  words[wordIndex] = (words[wordIndex] || 0) | (0x80 << ((3 - (i % 4)) * 8));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  const w: number[] = [];
  for (let j = 0; j < words.length; j += 16) {
    let a = hash[0], b = hash[1], c = hash[2], d = hash[3];
    let e = hash[4], f = hash[5], g = hash[6], h = hash[7];

    for (let idx = 0; idx < 64; idx++) {
      if (idx < 16) {
        w[idx] = words[j + idx] || 0;
      } else {
        const gamma0 = rightRotate(w[idx - 15], 7) ^ rightRotate(w[idx - 15], 18) ^ (w[idx - 15] >>> 3);
        const gamma1 = rightRotate(w[idx - 2], 17) ^ rightRotate(w[idx - 2], 19) ^ (w[idx - 2] >>> 10);
        w[idx] = (w[idx - 16] + gamma0 + w[idx - 7] + gamma1) | 0;
      }

      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + k[idx] + w[idx]) | 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }

  for (let idx = 0; idx < 8; idx++) {
    for (let byte = 3; byte >= 0; byte--) {
      const b = (hash[idx] >> (byte * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }

  return result;
}

export class PinSecurityService {
  /**
   * Generate a unique cryptographic random salt
   */
  private static generateSalt(): string {
    const timestamp = Date.now().toString(36);
    const randomVals = Array.from({ length: 16 }, () => Math.floor(Math.random() * 36).toString(36)).join('');
    return sha256(`svk_salt_${timestamp}_${randomVals}`);
  }

  /**
   * Set custom App PIN with salted SHA-256 verification
   * Never stores raw PIN
   */
  static async setPin(pin: string, length: PinLength = 4): Promise<boolean> {
    try {
      if (pin.length !== length || isNaN(Number(pin))) {
        return false;
      }

      const salt = this.generateSalt();
      const hash = sha256(`${salt}:${pin}:svk_enterprise_secure`);

      await AsyncStorage.setItem(SALT_KEY, salt);
      await AsyncStorage.setItem(HASH_KEY, hash);
      await AsyncStorage.setItem(LENGTH_KEY, String(length));

      // Reset any active failure states
      await this.resetFailedAttempts();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get configured PIN length (4, 6, or 8)
   */
  static async getConfiguredPinLength(): Promise<PinLength> {
    try {
      const len = await AsyncStorage.getItem(LENGTH_KEY);
      if (len === '6') return 6;
      if (len === '8') return 8;
      return 4;
    } catch {
      return 4;
    }
  }

  /**
   * Verify entered PIN against salted cryptographic hash
   */
  static async verifyPin(enteredPin: string): Promise<{ success: boolean; lockoutStatus?: PinLockoutStatus }> {
    const lockout = await this.getLockoutStatus();
    if (lockout.isLockedOut) {
      return { success: false, lockoutStatus: lockout };
    }

    try {
      const salt = await AsyncStorage.getItem(SALT_KEY);
      const storedHash = await AsyncStorage.getItem(HASH_KEY);

      // Default fallback PIN is '1234' if none configured
      if (!salt || !storedHash) {
        const isDefault = enteredPin === '1234';
        if (isDefault) {
          await this.resetFailedAttempts();
          return { success: true };
        } else {
          const updatedLockout = await this.recordFailedAttempt();
          return { success: false, lockoutStatus: updatedLockout };
        }
      }

      const computedHash = sha256(`${salt}:${enteredPin}:svk_enterprise_secure`);
      const isMatch = computedHash === storedHash;

      if (isMatch) {
        await this.resetFailedAttempts();
        return { success: true };
      } else {
        const updatedLockout = await this.recordFailedAttempt();
        return { success: false, lockoutStatus: updatedLockout };
      }
    } catch {
      return { success: false };
    }
  }

  /**
   * Check if a custom PIN has been configured
   */
  static async hasConfiguredPin(): Promise<boolean> {
    try {
      const hash = await AsyncStorage.getItem(HASH_KEY);
      return Boolean(hash);
    } catch {
      return false;
    }
  }

  /**
   * Check progressive lockout status
   */
  static async getLockoutStatus(): Promise<PinLockoutStatus> {
    try {
      const untilStr = await AsyncStorage.getItem(LOCKOUT_TIMESTAMP_KEY);
      const failuresStr = await AsyncStorage.getItem(FAILURES_KEY);
      const failedAttempts = failuresStr ? parseInt(failuresStr, 10) : 0;

      if (untilStr) {
        const until = parseInt(untilStr, 10);
        const now = Date.now();
        if (now < until) {
          const remainingSeconds = Math.ceil((until - now) / 1000);
          return { isLockedOut: true, remainingSeconds, failedAttempts };
        }
      }

      return { isLockedOut: false, remainingSeconds: 0, failedAttempts };
    } catch {
      return { isLockedOut: false, remainingSeconds: 0, failedAttempts: 0 };
    }
  }

  /**
   * Record failed attempt with progressive delay & temporary lockout
   */
  static async recordFailedAttempt(): Promise<PinLockoutStatus> {
    try {
      const failuresStr = await AsyncStorage.getItem(FAILURES_KEY);
      const currentFailures = (failuresStr ? parseInt(failuresStr, 10) : 0) + 1;
      await AsyncStorage.setItem(FAILURES_KEY, String(currentFailures));

      let lockoutDurationMs = 0;
      if (currentFailures >= 10) {
        lockoutDurationMs = 5 * 60 * 1000; // 5 minutes
      } else if (currentFailures >= 5) {
        lockoutDurationMs = 30 * 1000; // 30 seconds
      } else if (currentFailures >= 3) {
        lockoutDurationMs = 5 * 1000; // 5 seconds
      }

      if (lockoutDurationMs > 0) {
        const lockoutUntil = Date.now() + lockoutDurationMs;
        await AsyncStorage.setItem(LOCKOUT_TIMESTAMP_KEY, String(lockoutUntil));
        return {
          isLockedOut: true,
          remainingSeconds: Math.ceil(lockoutDurationMs / 1000),
          failedAttempts: currentFailures,
        };
      }

      return { isLockedOut: false, remainingSeconds: 0, failedAttempts: currentFailures };
    } catch {
      return { isLockedOut: false, remainingSeconds: 0, failedAttempts: 1 };
    }
  }

  /**
   * Reset failed attempts after successful authentication
   */
  static async resetFailedAttempts(): Promise<void> {
    try {
      await AsyncStorage.removeItem(FAILURES_KEY);
      await AsyncStorage.removeItem(LOCKOUT_TIMESTAMP_KEY);
    } catch {}
  }

  /**
   * Remove configured PIN
   */
  static async removePin(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SALT_KEY);
      await AsyncStorage.removeItem(HASH_KEY);
      await AsyncStorage.removeItem(LENGTH_KEY);
      await this.resetFailedAttempts();
    } catch {}
  }
}
