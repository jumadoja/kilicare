/**
 * Central Auth Event Bus
 * 
 * Provides a lightweight pub/sub system for auth events across the application.
 * Ensures all auth-related systems (Axios, WebSocket, AuthProvider, tokenManager)
 * stay synchronized.
 */

type AuthEvent = 'AUTH_LOGIN' | 'AUTH_LOGOUT' | 'AUTH_REFRESH' | 'AUTH_TOKEN_UPDATED';

type AuthEventListener = () => void;

class AuthEventBus {
  private listeners: Map<AuthEvent, Set<AuthEventListener>> = new Map();

  /**
   * Subscribe to an auth event
   */
  on(event: AuthEvent, listener: AuthEventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }

  /**
   * Emit an auth event
   */
  emit(event: AuthEvent): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((listener) => {
        try {
          listener();
        } catch (error) {
          console.error(`[AuthEventBus] Error in listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Clear all listeners for an event (useful for testing)
   */
  clear(event: AuthEvent): void {
    this.listeners.delete(event);
  }
}

export const authEvents = new AuthEventBus();
export type { AuthEvent, AuthEventListener };
