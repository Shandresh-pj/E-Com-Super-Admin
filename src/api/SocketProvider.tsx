import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { SocketService, SocketStatus } from './socketService';
import { useAuthStore } from '../store/authStore';

interface SocketContextValue {
  isConnected: boolean;
  socketService: typeof SocketService;
}

const SocketContext = createContext<SocketContextValue>({
  isConnected: false,
  socketService: SocketService,
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { accessToken, isAuthenticated } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      SocketService.disconnect();
      setIsConnected(false);
      return;
    }

    // Connect WebSocket
    SocketService.connect();

    const unsub = SocketService.onStatusChange((status: SocketStatus) => {
      setIsConnected(status === 'connected');
    });

    // Handle App background/foreground transitions
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active' && isAuthenticated && accessToken) {
        if (SocketService.getStatus() !== 'connected') {
          SocketService.connect();
        }
      }
    };

    const appStateSub = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      unsub();
      appStateSub.remove();
    };
  }, [isAuthenticated, accessToken]);

  return (
    <SocketContext.Provider value={{ isConnected, socketService: SocketService }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
