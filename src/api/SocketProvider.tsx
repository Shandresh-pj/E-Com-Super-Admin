/**
 * SocketProvider — wraps the app and manages the Socket.IO connection lifecycle.
 *
 * Responsibilities:
 *  - Connect when authenticated, disconnect on logout
 *  - Reconnect when app comes to foreground
 *  - Handle `permissions-updated` → refresh auth store permissions
 *  - Handle `logout` (force-logout) → trigger local logout
 *  - Expose socket status via useSocket() hook
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
  const { isAuthenticated, logout } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);

  /**
   * Handle forced logout pushed from the backend.
   * Cleans up socket first, then logs out locally.
   */
  const handleForcedLogout = useCallback((payload: any) => {
    console.warn('[SocketProvider] Force logout received:', payload?.reason);
    SocketService.removeAllListeners();
    SocketService.disconnect();
    logout();
  }, [logout]);

  /**
   * Handle permissions-updated event pushed from backend.
   * The authStore will re-fetch permissions from /auth/me/permissions.
   */
  const handlePermissionsUpdated = useCallback((_permissions: any) => {
    // Re-fetch fresh permissions from backend (authStore refreshPermissions handles this)
    const store = useAuthStore.getState();
    if ((store as any).refreshPermissions) {
      (store as any).refreshPermissions();
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      // Cleanup on logout
      SocketService.removeAllListeners();
      SocketService.disconnect();
      setIsConnected(false);
      return;
    }

    // ── Connect ────────────────────────────────────────────────────────
    SocketService.connect();

    // ── Subscribe to status changes ────────────────────────────────────
    const unsubStatus = SocketService.onStatusChange((status: SocketStatus) => {
      setIsConnected(status === 'connected');
    });

    // ── BUG-010: Subscribe to force-logout and permission events ──────
    const unsubLogout = SocketService.on('logout', handleForcedLogout);
    const unsubPermissions = SocketService.on('permissions-updated', handlePermissionsUpdated);

    // ── Reconnect on app foreground ────────────────────────────────────
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active' && isAuthenticated) {
        if (SocketService.getStatus() !== 'connected') {
          SocketService.connect();
        }
      } else if (nextState === 'background') {
        // Optionally disconnect on background to save battery
        // SocketService.disconnect();
      }
    };

    const appStateSub = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      unsubStatus();
      unsubLogout();
      unsubPermissions();
      appStateSub.remove();
      // Do NOT disconnect here — this effect re-runs on auth state change;
      // we only disconnect when isAuthenticated becomes false (handled above).
    };
  }, [isAuthenticated, handleForcedLogout, handlePermissionsUpdated]);

  return (
    <SocketContext.Provider value={{ isConnected, socketService: SocketService }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
