import { useEffect, useState } from 'react';
import { SocketService, SocketStatus } from '../api/socketService';
import { useAuthStore } from '../store/authStore';

export function useRealtimeSocket() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [status, setStatus] = useState<SocketStatus>(SocketService.getStatus());

  useEffect(() => {
    if (isAuthenticated) {
      SocketService.connect();
    } else {
      SocketService.disconnect();
    }

    const unsub = SocketService.onStatusChange(setStatus);
    return () => {
      unsub();
    };
  }, [isAuthenticated]);

  return {
    status,
    isConnected: status === 'connected',
    send: SocketService.send.bind(SocketService),
    subscribe: SocketService.on.bind(SocketService),
  };
}
