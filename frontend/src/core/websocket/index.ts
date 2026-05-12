import { env } from '@/config/env';

type Handler = (data: unknown) => void;

class WsManager {
  private sockets = new Map<string, WebSocket>();
  private handlers = new Map<string, Map<string, Handler[]>>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private attempts = new Map<string, number>();
  private MAX_DELAY = 30_000;
  private MAX_RETRIES = 5;

  constructor() {
    // Clean initialization - no auth event listeners
  }

  destroy() {
    this.disconnectAll();
  }

  // Auth-safe connection method
  connect(key: string, url: string) {
    // Prevent duplicate connections
    if (this.sockets.get(key)?.readyState === WebSocket.OPEN) {
      return;
    }
    
    // SSR-safe token access
    const token = this.getAuthToken();
    if (!token) {
      console.warn(`WebSocket: No auth token available for ${key}`);
      return;
    }

    const wsUrl = `${url}?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      this.attempts.set(key, 0);
      console.log(`WebSocket: Connected to ${key}`);
    };
    
    ws.onmessage = ({ data }) => {
      try {
        const parsed = JSON.parse(data as string);
        const action = parsed.action ?? 'message';
        const handlers = this.handlers.get(key);
        if (!handlers) return;
        
        const actionHandlers = handlers.get(action) ?? [];
        const wildcardHandlers = handlers.get('*') ?? [];
        
        [...actionHandlers, ...wildcardHandlers].forEach((h) => h(parsed));
      } catch (error) {
        console.error(`WebSocket: Failed to parse message from ${key}:`, error);
      }
    };
    
    ws.onclose = (event) => {
      console.log(`WebSocket: Disconnected from ${key}, code: ${event.code}`);
      
      // Only reconnect if it wasn't an intentional disconnect
      if (event.code !== 1000) {
        this.reconnect(key, url);
      }
    };
    
    ws.onerror = (error) => {
      console.error(`WebSocket: Error on ${key}:`, error);
    };
    
    this.sockets.set(key, ws);
  }

  // Cookie-based authentication - no token retrieval needed
  // WebSocket uses cookies automatically via withCredentials
  private getAuthToken(): string | null {
    return null; // Cookies handle authentication automatically
  }

  // Auth-safe disconnection
  disconnect(key: string) {
    const ws = this.sockets.get(key);
    if (ws) {
      ws.close(1000, 'Intentional disconnect');
      this.sockets.delete(key);
    }
    
    // Clear any pending reconnect timer
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
    
    // Reset attempts
    this.attempts.delete(key);
  }

  // Disconnect all connections
  disconnectAll() {
    for (const key of this.sockets.keys()) {
      this.disconnect(key);
    }
  }

  private reconnect(key: string, url: string) {
    const n = this.attempts.get(key) ?? 0;
    if (n >= 5) return; // Max 5 retry attempts
    const delay = Math.min(1000 * 2 ** n, this.MAX_DELAY);
    this.attempts.set(key, n + 1);
    this.timers.set(key, setTimeout(() => this.connect(key, url), delay));
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

  }

export const wsManager = new WsManager();

export const WS_URLS = {
  chat: (room: string) => `${env.WS_BASE_URL}/ws/chat/${room}/`,
  sos: () => `${env.WS_BASE_URL}/ws/sos/`,
};