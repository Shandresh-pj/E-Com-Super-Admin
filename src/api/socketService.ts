import { getApiBaseUrl } from '../config/environment';
import { TokenManager } from '../security/tokenManager';
import { NotificationService } from '../features/notifications/services/notificationService';

export type SocketStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface SocketMessage {
  type: string;
  payload: any;
  timestamp: string;
}

type SocketEventHandler = (data: any) => void;

/**
 * Enterprise Real-time WebSocket Client
 * Connects directly to backend WebSocket with token auth, auto-reconnect, and event bus
 */
export class SocketService {
  private static socket: WebSocket | null = null;
  private static status: SocketStatus = 'disconnected';
  private static listeners: Map<string, Set<SocketEventHandler>> = new Map();
  private static statusListeners: Set<(status: SocketStatus) => void> = new Set();
  private static reconnectAttempts = 0;
  private static maxReconnectAttempts = 10;
  private static reconnectTimer: any = null;
  private static pingInterval: any = null;

  /**
   * Get current connection status
   */
  static getStatus(): SocketStatus {
    return this.status;
  }

  /**
   * Subscribe to connection status changes
   */
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
      try { cb(newStatus); } catch {}
    });
  }

  /**
   * Connect to backend WebSocket server
   */
  static async connect(): Promise<void> {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const token = await TokenManager.getAccessToken();
    const httpBase = getApiBaseUrl().replace('/api', '');
    const wsBase = httpBase.replace('https://', 'wss://').replace('http://', 'ws://');
    const wsUrl = `${wsBase}/ws${token ? `?token=${encodeURIComponent(token)}` : ''}`;

    this.updateStatus('connecting');

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.updateStatus('connected');
        this.reconnectAttempts = 0;

        // Start heartbeat ping
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          this.send('ping', { clientTime: Date.now() });
        }, 25000);

        // Notify socket listeners
        this.emitLocal('connected', { timestamp: new Date().toISOString() });
      };

      this.socket.onmessage = (event) => {
        try {
          const raw = typeof event.data === 'string' ? event.data : '';
          if (!raw) return;

          // Handle simple pong
          if (raw === 'pong' || raw === '{"type":"pong"}') return;

          const msg: SocketMessage = JSON.parse(raw);
          if (msg.type) {
            this.emitLocal(msg.type, msg.payload || msg);

            // Handle incoming real-time notifications with configured tone
            if (msg.type === 'notification' || msg.type === 'alert' || msg.type === 'ORDER_CREATED') {
              NotificationService.getSelectedTone().then((tone) => {
                NotificationService.previewTone(tone);
              });
            }
          }
        } catch {
          // Non-JSON message handler
          this.emitLocal('raw_message', event.data);
        }
      };

      this.socket.onerror = () => {
        this.updateStatus('error');
      };

      this.socket.onclose = () => {
        this.updateStatus('disconnected');
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.scheduleReconnect();
      };
    } catch {
      this.updateStatus('error');
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule automatic reconnect with exponential backoff
   */
  private static scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 20000);
      this.reconnectAttempts++;

      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, delay);
    }
  }

  /**
   * Send event payload to backend socket
   */
  static send(type: string, payload: any = {}): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      const message = JSON.stringify({
        type,
        payload,
        timestamp: new Date().toISOString(),
      });
      this.socket.send(message);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Subscribe to specific socket event
   */
  static on(eventType: string, handler: SocketEventHandler): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(handler);

    return () => {
      this.off(eventType, handler);
    };
  }

  /**
   * Unsubscribe from event
   */
  static off(eventType: string, handler: SocketEventHandler): void {
    const handlers = this.listeners.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  /**
   * Emit event internally to subscribers
   */
  private static emitLocal(eventType: string, data: any): void {
    const handlers = this.listeners.get(eventType);
    if (handlers) {
      handlers.forEach((h) => {
        try { h(data); } catch {}
      });
    }

    // Also trigger wildcard listeners
    const wildcardHandlers = this.listeners.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach((h) => {
        try { h({ type: eventType, data }); } catch {}
      });
    }
  }

  /**
   * Disconnect socket cleanly
   */
  static disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.updateStatus('disconnected');
  }
}
