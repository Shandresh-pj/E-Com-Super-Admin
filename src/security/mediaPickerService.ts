import { Platform, Alert } from 'react-native';
import { PermissionService } from './permissionService';

export interface PickedMedia {
  uri: string;
  name: string;
  type: string;
  size?: number;
  base64?: string;
}

export class MediaPickerService {
  private static readonly MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  /**
   * Validate image file size and MIME type
   */
  static validateImage(media: PickedMedia): { valid: boolean; error?: string } {
    if (media.size && media.size > this.MAX_FILE_SIZE_BYTES) {
      return {
        valid: false,
        error: `File size exceeds limit (${(media.size / (1024 * 1024)).toFixed(1)}MB > 5MB max).`,
      };
    }

    if (media.type && !this.ALLOWED_MIME_TYPES.includes(media.type.toLowerCase())) {
      return {
        valid: false,
        error: 'Only JPG, PNG, and WebP image formats are permitted.',
      };
    }

    return { valid: true };
  }

  /**
   * Pick Image with permission check
   */
  static async requestAndPickMedia(): Promise<boolean> {
    const hasStorage = await PermissionService.requestStorage();
    if (!hasStorage) {
      Alert.alert(
        'Storage Permission Required',
        'Please allow storage / media access in device settings to choose photos from your gallery.'
      );
      return false;
    }
    return true;
  }
}
