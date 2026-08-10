import AsyncStorage from '@react-native-async-storage/async-storage';

export class SecureStorage {
  static async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(`sec_${key}`, value);
    } catch (error) {
      console.warn(`SecureStorage setItem failed for key ${key}`, error);
    }
  }

  static async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(`sec_${key}`);
    } catch (error) {
      console.warn(`SecureStorage getItem failed for key ${key}`, error);
      return null;
    }
  }

  static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`sec_${key}`);
    } catch (error) {
      console.warn(`SecureStorage removeItem failed for key ${key}`, error);
    }
  }
}
