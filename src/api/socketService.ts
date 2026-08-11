/**
 * Enterprise Real-time Socket.IO Client
 *
 * The backend uses Socket.IO (not raw WebSocket). Using the `socket.io-client`
 * library is required — raw `new WebSocket()` is INCOMPATIBLE with Socket.IO.
 *
 * Architecture:
 *   SocketService (singleton)
 *     → socket.io-client
 *     → Backend Socket.IO server at path: /ws
 *     → JWT auth via handshake.auth.token
 */

// @ts-ignore - Import runtime io directly from pre-bundled UMD distribution file to bypass Metro CJS extension resolution bug
import { io } from 'socket.io-client/dist/socket.io.js';
import type { Socket } from 'socket.io-client';
import { getApiBaseUrl } from '../config/environment';
import { TokenManager } from '../security/tokenManager';

export type SocketStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

type SocketEventHandler = (data: any) => void;

export class SocketService {
  private static socket: Socket | null = null;
  private static status: SocketStatus = 'disconnected';

  /** Map of eventType → Set of handlers. */
  private static listeners: Map<string, Set<SocketEventHandler>> = new Map();
  /** Callbacks notified on status change. */
  private static statusListeners: Set<(status: SocketStatus) => void> = new Set();

  // ─── Status ───────────────────────────────────────────────────────────────

  static getStatus(): SocketStatus {
    return this.status;
  }

  static isConnected(): boolean {
    return this.status === 'connected' && !!this.socket?.connected;
  }

  static onStatusChange(callback: (status: SocketStatus) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  private static updateStatus(newStatus: SocketStatus) {
    this.status = newStatus;
    this.statusListeners.forEach((cb) => {
      try {
        cb(newStatus);
      } catch (err) {
        console.error('[SocketService] Error in status listener:', err);
      }
    });
  }

  // ─── Connect ──────────────────────────────────────────────────────────────

  static async connect(): Promise<void> {
    if (this.socket && this.socket.connected) {
      return;
    }

    const token = await TokenManager.getAccessToken();
    if (!token) {
      console.warn('[SocketService] Cannot connect: No access token available');
      return;
    }

    this.updateStatus('connecting');

    // Extract host:port from API base URL (e.g. http://10.0.2.2:3000/api -> http://10.0.2.2:3000)
    const apiBase = getApiBaseUrl();
    const httpBase = apiBase.replace(/\/api\/?$/, '');

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    const sock = io(httpBase, {
      path: '/ws',
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 20000,
      timeout: 20000,
    }) as Socket;

    this.socket = sock;

    sock.on('connect', () => {
      console.log('[SocketService] Connected:', sock.id);
      this.updateStatus('connected');
    });

    sock.on('disconnect', (reason) => {
      console.log('[SocketService] Disconnected:', reason);
      this.updateStatus('disconnected');
    });

    sock.on('connect_error', (err) => {
      console.warn('[SocketService] Connection error:', err.message);
      this.updateStatus('error');
    });

    // ── Business Events ────────────────────────────────────────────────────

    // Catch-all: forward every event to registered listeners
    sock.onAny((eventName: string, data: any) => {
      this.emitLocal(eventName, data);
    });

    // Handle forced logout from backend
    sock.on('logout', (payload: any) => {
      console.warn('[SocketService] Forced logout received:', payload?.reason);
      this.emitLocal('logout', payload);
    });

    // Handle permission updates
    sock.on('permissions-updated', (permissions: any) => {
      this.emitLocal('permissions-updated', permissions);
    });
  }

  // ─── Disconnect ──────────────────────────────────────────────────────────

  static disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.updateStatus('disconnected');
  }

  // ─── Event Subscriptions ──────────────────────────────────────────────────

  static on(eventType: string, handler: SocketEventHandler): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(handler);

    return () => {
      const set = this.listeners.get(eventType);
      if (set) {
        set.delete(handler);
        if (set.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  static emit(eventType: string, data: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(eventType, data);
    } else {
      console.warn(`[SocketService] Cannot emit "${eventType}": Socket disconnected`);
    }
  }

  /** Alias for emit() for backwards compatibility */
  static send(eventType: string, data: any): void {
    this.emit(eventType, data);
  }

  /** Remove all registered local event listeners */
  static removeAllListeners(): void {
    this.listeners.clear();
  }


  private static emitLocal(eventType: string, data: any) {
    const handlers = this.listeners.get(eventType);
    if (handlers) {
      handlers.forEach((fn) => {
        try {
          fn(data);
        } catch (err) {
          console.error(`[SocketService] Error in event listener for "${eventType}":`, err);
        }
      });
    }
  }
}
