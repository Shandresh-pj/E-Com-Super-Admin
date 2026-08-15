import { PermissionsAndroid, Platform, Alert, Linking } from 'react-native';

export type PermissionType = 'camera' | 'notifications' | 'location' | 'storage' | 'biometrics';

export interface PermissionStatus {
  camera: boolean;
  notifications: boolean;
  location: boolean;
  storage?: boolean;
  biometrics?: boolean;
}

export class PermissionService {
  /**
   * Check single permission
   */
  static async checkPermission(type: PermissionType): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    try {
      switch (type) {
        case 'camera':
          return await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);

        case 'notifications':
          if (Platform.Version >= 33) {
            return await PermissionsAndroid.check('android.permission.POST_NOTIFICATIONS' as any);
          }
          return true;

        case 'location':
          return await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);

        case 'storage':
          if (Platform.Version >= 33) {
            return await PermissionsAndroid.check('android.permission.READ_MEDIA_IMAGES' as any);
          }
          return await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);

        case 'biometrics':
          return true;

        default:
          return true;
      }
    } catch {
      return false;
    }
  }

  /**
   * Check current status of all major app permissions
   */
  static async checkAllPermissions(): Promise<PermissionStatus> {
    if (Platform.OS !== 'android') {
      return { camera: true, notifications: true, location: true, storage: true, biometrics: true };
    }

    try {
      const camera = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);

      let notifications = true;
      if (Platform.Version >= 33) {
        notifications = await PermissionsAndroid.check(
          'android.permission.POST_NOTIFICATIONS' as any
        );
      }

      const location = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );

      let storage = true;
      if (Platform.Version >= 33) {
        storage = await PermissionsAndroid.check(
          'android.permission.READ_MEDIA_IMAGES' as any
        );
      } else {
        storage = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
        );
      }

      return { camera, notifications, location, storage, biometrics: true };
    } catch {
      return { camera: false, notifications: false, location: false, storage: false, biometrics: true };
    }
  }

  /**
   * Request Camera permission
   */
  static async requestCamera(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Access Permission',
          message: 'SVK E-Com Pro requires camera access for executive profile photos and barcode scanning.',
          buttonNeutral: 'Ask Later',
          buttonNegative: 'Deny',
          buttonPositive: 'Grant Access',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Camera permission error:', err);
      return false;
    }
  }

  /**
   * Request Device Storage / Gallery permission
   */
  static async requestStorage(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    try {
      if (Platform.Version >= 33) {
        try {
          const granted = await PermissionsAndroid.request(
            'android.permission.READ_MEDIA_IMAGES' as any,
            {
              title: 'Photos & Media Permission',
              message: 'SVK E-Com Pro requires access to your photo library to select profile pictures.',
              buttonNeutral: 'Ask Later',
              buttonNegative: 'Deny',
              buttonPositive: 'Allow Access',
            }
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) return true;
        } catch {
          // fallback to standard check
        }

        const altGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'SVK E-Com Pro requires storage access to pick photos from your device gallery.',
            buttonNeutral: 'Ask Later',
            buttonNegative: 'Deny',
            buttonPositive: 'Allow Access',
          }
        );
        return altGranted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'SVK E-Com Pro requires storage access to pick photos from your device gallery.',
            buttonNeutral: 'Ask Later',
            buttonNegative: 'Deny',
            buttonPositive: 'Allow Access',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (err) {
      console.warn('Storage permission error:', err);
      return true;
    }
  }

  /**
   * Request Notification permission (Android 13+)
   */
  static async requestNotifications(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;
    if (Platform.Version < 33) return true;

    try {
      const granted = await PermissionsAndroid.request(
        'android.permission.POST_NOTIFICATIONS' as any,
        {
          title: 'Notification Permission',
          message: 'SVK E-Com Pro sends critical order updates, attendance alerts, and stock warnings.',
          buttonNeutral: 'Ask Later',
          buttonNegative: 'Deny',
          buttonPositive: 'Allow',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Notification permission error:', err);
      return false;
    }
  }

  /**
   * Request Location permission
   */
  static async requestLocation(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'SVK E-Com Pro requires location for attendance verification and live delivery tracking.',
          buttonNeutral: 'Ask Later',
          buttonNegative: 'Deny',
          buttonPositive: 'Grant',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Location permission error:', err);
      return false;
    }
  }

  /**
   * Request all essential permissions simultaneously
   */
  static async requestAllEssentialPermissions(): Promise<PermissionStatus> {
    if (Platform.OS !== 'android') {
      return { camera: true, notifications: true, location: true, storage: true, biometrics: true };
    }

    try {
      const permissionsToRequest: any[] = [
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ];

      if (Platform.Version >= 33) {
        permissionsToRequest.push('android.permission.POST_NOTIFICATIONS');
        permissionsToRequest.push('android.permission.READ_MEDIA_IMAGES');
      } else {
        permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
      }

      const results = await PermissionsAndroid.requestMultiple(permissionsToRequest);

      const camera = results[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
      const location = results[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
      const notifications = Platform.Version >= 33
        ? (results as any)['android.permission.POST_NOTIFICATIONS'] === PermissionsAndroid.RESULTS.GRANTED
        : true;
      const storage = Platform.Version >= 33
        ? (results as any)['android.permission.READ_MEDIA_IMAGES'] === PermissionsAndroid.RESULTS.GRANTED
        : results[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED;

      return { camera, notifications, location, storage, biometrics: true };
    } catch (err) {
      console.warn('Request all permissions error:', err);
      return { camera: false, notifications: false, location: false, storage: false, biometrics: true };
    }
  }

  /**
   * Open Device System App Settings
   */
  static openAppSettings(): void {
    Linking.openSettings().catch(() => {
      Alert.alert('Unable to open Settings', 'Please manually open your device Settings -> Apps -> SVK E-Com Pro.');
    });
  }
}
