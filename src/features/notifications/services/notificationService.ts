import AsyncStorage from '@react-native-async-storage/async-storage';
import { Vibration, Platform } from 'react-native';
import { axiosClient } from '../../../api/axiosClient';
import { ENDPOINTS } from '../../../api/endpoints';
import { normalizeApiResponse } from '../../../api/responseNormalizer';

export type NotificationCategory = 'ORDER' | 'STOCK' | 'WORKFORCE' | 'SYSTEM' | 'PAYMENT';

export interface NotificationItem {
  id: string | number;
  title: string;
  message: string;
  category: NotificationCategory;
  is_read: boolean;
  created_at: string;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
}

export type NotificationTone = 'chime' | 'crystal' | 'pulse' | 'subtle' | 'silk' | 'silent';

export interface ToneOption {
  id: NotificationTone;
  name: string;
  description: string;
  tag: string;
}

export const NOTIFICATION_TONES: ToneOption[] = [
  { id: 'chime',   name: 'Executive Chime',  description: 'Clear, authoritative double chime',      tag: 'Recommended' },
  { id: 'crystal', name: 'Crystal Glass',    description: 'Crisp, high-fidelity shimmer melody',     tag: 'Premium' },
  { id: 'pulse',   name: 'Dynamic Pulse',    description: 'Rhythmic low-latency dual impulse',       tag: 'Fast' },
  { id: 'silk',    name: 'Silk Accent',      description: 'Smooth, elegant ambient resonance',       tag: 'Subtle' },
  { id: 'subtle',  name: 'Micro Click',      description: 'Minimal soft haptic tap',                tag: 'Quiet' },
  { id: 'silent',  name: 'Mute',             description: 'No sound or vibration alerts',           tag: 'Silent' },
];

const TONE_STORAGE_KEY = 'svk_notification_tone_pref';

export class NotificationService {
  /**
   * Get selected notification tone preference
   */
  static async getSelectedTone(): Promise<NotificationTone> {
    try {
      const saved = await AsyncStorage.getItem(TONE_STORAGE_KEY);
      return (saved as NotificationTone) || 'chime';
    } catch {
      return 'chime';
    }
  }

  /**
   * Save notification tone preference
   */
  static async setSelectedTone(tone: NotificationTone): Promise<void> {
    try {
      await AsyncStorage.setItem(TONE_STORAGE_KEY, tone);
      this.previewTone(tone);
    } catch {}
  }

  /**
   * Play unique tactile haptic pattern for tone preview
   */
  static previewTone(tone: NotificationTone) {
    if (Platform.OS !== 'android') return;
    try {
      switch (tone) {
        case 'chime':   Vibration.vibrate([0, 50, 40, 90]);            break;
        case 'crystal': Vibration.vibrate([0, 25, 20, 30, 20, 45]);   break;
        case 'pulse':   Vibration.vibrate([0, 100, 50, 120]);          break;
        case 'silk':    Vibration.vibrate([0, 35, 60, 35]);            break;
        case 'subtle':  Vibration.vibrate(30);                         break;
        case 'silent':  Vibration.cancel();                            break;
      }
    } catch {}
  }

  /**
   * Fetch all notifications from backend API (GET /notifications)
   * Returns empty array if API unavailable — NO static fallback data.
   */
  static async getNotifications(): Promise<NotificationItem[]> {
    try {
      const response = await axiosClient.get(ENDPOINTS.NOTIFICATIONS);
      const normalized = normalizeApiResponse<NotificationItem[]>(response.data);
      return Array.isArray(normalized.data) ? normalized.data : [];
    } catch {
      return [];
    }
  }

  /**
   * Get the count of unread notifications.
   * Used for the notification badge in the tab bar.
   */
  static async getUnreadCount(): Promise<number> {
    try {
      const notifications = await this.getNotifications();
      return notifications.filter((n) => !n.is_read).length;
    } catch {
      return 0;
    }
  }

  /**
   * Mark a single notification as read (PUT /notifications/:id/read)
   */
  static async markAsRead(id: string | number): Promise<void> {
    try {
      await axiosClient.put(ENDPOINTS.NOTIFICATION_READ(id));
    } catch {}
  }

  /**
   * Mark all notifications as read (PUT /notifications/read-all)
   */
  static async markAllAsRead(): Promise<void> {
    try {
      await axiosClient.put(ENDPOINTS.NOTIFICATIONS_READ_ALL);
    } catch {}
  }

  /**
   * Send a notification/alert via POST /notifications
   * NOTE: The backend /alerts endpoint does not exist.
   * This posts to /notifications — verify backend supports POST if needed.
   */
  static async sendBroadcast(payload: {
    title: string;
    message: string;
    category: NotificationCategory;
    priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  }): Promise<NotificationItem | null> {
    try {
      const response = await axiosClient.post(ENDPOINTS.NOTIFICATIONS, {
        title: payload.title,
        message: payload.message,
        type: payload.category,
        priority: payload.priority || 'HIGH',
      });
      const normalized = normalizeApiResponse<NotificationItem>(response.data);
      return normalized.data ?? null;
    } catch (e) {
      console.warn('[NotificationService] sendBroadcast failed:', e);
      return null;
    }
  }


  /**
   * Delete a notification (DELETE /notifications/:id)
   */
  static async deleteNotification(id: string | number): Promise<boolean> {
    try {
      await axiosClient.delete(ENDPOINTS.NOTIFICATION_BY_ID(id));
      return true;
    } catch {
      return false;
    }
  }
}
