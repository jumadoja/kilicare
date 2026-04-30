import { env } from '@/config/env';
import { tokenManager } from '@/core/auth/tokenManager';
import { authEvents } from '@/core/auth/authEvents';

type Handler = (data: unknown) => void;

class WsManager {
  private sockets = new Map<string, WebSocket>();
  private handlers = new Map<string, Map<string, Handler[]>>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private attempts = new Map<string, number>();
  private pendingUrls = new Map<string, string>(); // Store URLs for reconnect after refresh
  private MAX_DELAY = 30_000;
  private unsubscribeAuthLogout: (() => void) | null = null;
  private unsubscribeAuthRefresh: (() => void) | null = null;

  constructor() {
    this.unsubscribeAuthLogout = authEvents.on('AUTH_LOGOUT', () => {
      this.disconnectAll();
    });

    this.unsubscribeAuthRefresh = authEvents.on('AUTH_REFRESH', () => {
      this.reconnectAllWithNewToken();
    });
  }

  destroy() {
    this.disconnectAll();
    this.unsubscribeAuthLogout?.();
    this.unsubscribeAuthRefresh?.();
  }

  connect(key: string, url: string) {
    if (this.sockets.get(key)?.readyState === WebSocket.OPEN) return;
    const token = tokenManager.getAccess();
    if (!token || !tokenManager.isAuthenticated()) return;

    // Store URL for potential reconnect after refresh
    this.pendingUrls.set(key, url);

    const ws = new WebSocket(`${url}?token=${token}`);
    ws.onopen = () => { this.attempts.set(key, 0); };
    ws.onmessage = ({ data }) => {
      try {
        const parsed = JSON.parse(data as string);
        const action = parsed.action ?? 'message';
        const m = this.handlers.get(key);
        if (!m) return;
        [...(m.get(action) ?? []), ...(m.get('*') ?? [])].forEach((h) => h(parsed));
      } catch { /* ignore */ }
    };
    ws.onclose = () => {
      const token = tokenManager.getAccess();
      if (token && tokenManager.isAuthenticated()) {
        this.reconnect(key, url);
      } else {
        this.pendingUrls.delete(key);
      }
    };
    ws.onerror = (e) => {/* Silent error logging */};
    this.sockets.set(key, ws);
  }

  private reconnect(key: string, url: string) {
    const n = this.attempts.get(key) ?? 0;
    if (n >= 5) return; // Max 5 retry attempts
    const delay = Math.min(1000 * 2 ** n, this.MAX_DELAY);
    this.attempts.set(key, n + 1);
    this.timers.set(key, setTimeout(() => this.connect(key, url), delay));
  }

  private reconnectAllWithNewToken() {
    const token = tokenManager.getAccess();
    if (!token) return;

    this.pendingUrls.forEach((url, key) => {
      // Clear existing connection and reconnect with new token
      this.disconnect(key);
      this.attempts.set(key, 0); // Reset attempts for fresh start
      this.connect(key, url);
    });
  }

  send(key: string, data: unknown) {
    const ws = this.sockets.get(key);
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data));
  }

  on(key: string, action: string, handler: Handler): () => void {
    if (!this.handlers.has(key)) this.handlers.set(key, new Map());
    const m = this.handlers.get(key)!;
    if (!m.has(action)) m.set(action, []);
    m.get(action)!.push(handler);
    return () => m.set(action, (m.get(action) ?? []).filter((h) => h !== handler));
  }

  disconnect(key: string) {
    clearTimeout(this.timers.get(key));
    this.sockets.get(key)?.close();
    this.sockets.delete(key);
    this.handlers.delete(key);
    this.attempts.delete(key);
    this.pendingUrls.delete(key);
  }

  disconnectAll() {
    [...this.sockets.keys()].forEach((k) => this.disconnect(k));
  }
}

export const wsManager = new WsManager();

export const WS_URLS = {
  chat: (room: string) => `${env.WS_BASE_URL}/ws/chat/${room}/`,
  sos: () => `${env.WS_BASE_URL}/ws/sos/`,
};