import { useEffect } from 'react';
import { SocketService } from '../api/socketService';

export interface RealtimeEventPayload {
  type: string;
  data: any;
  timestamp: string;
}

export const useRealtimeDashboard = (onRealtimeUpdate: (event: RealtimeEventPayload) => void) => {
  useEffect(() => {
    const unsub = SocketService.on('*', (event: any) => {
      if (event && event.type) {
        onRealtimeUpdate({
          type: event.type,
          data: event.data || event.payload,
          timestamp: new Date().toISOString(),
        });
      }
    });

    return () => {
      unsub();
    };
  }, [onRealtimeUpdate]);
};
