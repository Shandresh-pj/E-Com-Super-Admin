import { useState, useEffect, useCallback } from 'react';
import { NotificationService } from '../features/notifications/services/notificationService';
import { SocketService } from '../api/socketService';

/**
 * useNotificationCount
 *
 * Returns the real unread notification count from the backend.
 * Subscribes to socket events to update in real-time when new notifications arrive.
 *
 * Used by the tab bar to show an accurate notification badge (BUG-014 fix).
 */
export const useNotificationCount = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchCount = useCallback(async () => {
    const count = await NotificationService.getUnreadCount();
    setUnreadCount(count);
  }, []);

  useEffect(() => {
    fetchCount();

    // Update count when new notifications arrive via socket
    const unsubNotification = SocketService.on('notification', () => fetchCount());
    const unsubAlert = SocketService.on('alert', () => fetchCount());
    const unsubOrderCreated = SocketService.on('ORDER_CREATED', () => fetchCount());
    const unsubOrderNew = SocketService.on('order-created', () => fetchCount());

    return () => {
      unsubNotification();
      unsubAlert();
      unsubOrderCreated();
      unsubOrderNew();
    };
  }, [fetchCount]);

  return { unreadCount, refetch: fetchCount };
};
