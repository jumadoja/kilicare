/**
 * Feed WebSocket Service - Real-time Feed Integration
 * 
 * Production-grade WebSocket system for real-time feed updates.
 * Uses DTO contracts exclusively - no raw API data.
 * 
 * CRITICAL RULES:
 * - WebSocket ONLY updates React Query cache
 * - NEVER directly mutates UI state
 * - ALL updates must pass DTO validation
 * - Authenticated connections only
 */

import { QueryClient } from '@tanstack/react-query';
import { 
  FeedWebSocketEvent, 
  NewMomentEvent, 
  LikeUpdateEvent, 
  CommentUpdateEvent, 
  ShareUpdateEvent, 
  FollowUpdateEvent,
  ConnectionStatusEvent,
  FeedErrorEvent,
  MomentDTO,
  FeedItemDTO,
  PaginatedFeedDTO,
  DTOValidationError
} from '@/features/moments/types';
import { normalizeMomentResponse, normalizeFeedItemResponse } from '@/features/moments/utils/contract-mapper';

export interface FeedWebSocketConfig {
  url: string;
  token: string;
  queryClient: QueryClient;
  onConnectionChange?: (connected: boolean) => void;
  onError?: (error: string) => void;
}

export class FeedWebSocketService {
  private ws: WebSocket | null = null;
  private config: FeedWebSocketConfig | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private isDestroyed = false;

  constructor() {}

  /**
   * Initialize WebSocket connection
   */
  connect(config: FeedWebSocketConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isDestroyed) {
        reject(new Error('WebSocket service has been destroyed'));
        return;
      }

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        reject(new Error('Connection already in progress'));
        return;
      }

      this.config = config;
      this.isConnecting = true;

      try {
        // Build WebSocket URL with token
        const wsUrl = `${config.url}?token=${config.token}`;
        this.ws = new WebSocket(wsUrl);

        // Connection opened
        this.ws.onopen = () => {
          console.log('Feed WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          config.onConnectionChange?.(true);
          resolve();
        };

        // Message received
        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        // Connection closed
        this.ws.onclose = (event) => {
          console.log('Feed WebSocket disconnected:', event.code, event.reason);
          this.isConnecting = false;
          config.onConnectionChange?.(false);
          
          // Attempt reconnection if not explicitly closed
          if (!this.isDestroyed && event.code !== 1000) {
            this.attemptReconnect();
          }
        };

        // Connection error
        this.ws.onerror = (error) => {
          console.error('Feed WebSocket error:', error);
          this.isConnecting = false;
          config.onError?.('WebSocket connection error');
          reject(new Error('WebSocket connection failed'));
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    this.isDestroyed = true;
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  /**
   * Send message to WebSocket
   */
  private send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: string): void {
    try {
      const event: FeedWebSocketEvent = JSON.parse(data);
      
      // Validate basic event structure
      if (!event.type || !event.timestamp) {
        console.warn('Invalid WebSocket event structure:', event);
        return;
      }

      // Route to appropriate handler
      switch (event.type) {
        case 'connection_status':
          this.handleConnectionStatus(event as ConnectionStatusEvent);
          break;
        case 'new_moment':
          this.handleNewMoment(event as NewMomentEvent);
          break;
        case 'like_update':
          this.handleLikeUpdate(event as LikeUpdateEvent);
          break;
        case 'comment_update':
          this.handleCommentUpdate(event as CommentUpdateEvent);
          break;
        case 'share_update':
          this.handleShareUpdate(event as ShareUpdateEvent);
          break;
        case 'follow_update':
          this.handleFollowUpdate(event as FollowUpdateEvent);
          break;
        case 'error':
          this.handleError(event as FeedErrorEvent);
          break;
        default:
          console.warn('Unknown WebSocket event type:', event.type);
      }

    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Handle connection status updates
   */
  private handleConnectionStatus(event: ConnectionStatusEvent): void {
    console.log('Connection status:', event.status);
    this.config?.onConnectionChange?.(event.status === 'connected');
  }

  /**
   * Handle new moment events
   */
  private handleNewMoment(event: NewMomentEvent): void {
    try {
      // Validate and normalize moment data
      const normalizedMoment = normalizeMomentResponse(event.moment);
      
      // Update React Query cache
      this.config?.queryClient.setQueryData(
        ['moments', 'feed'],
        (oldData: PaginatedFeedDTO | undefined) => {
          if (!oldData) return oldData;

          // Create new FeedItemDTO
          const newFeedItem: FeedItemDTO = {
            moment: normalizedMoment,
            user: normalizedMoment.posted_by,
            feed_score: event.feed_type === 'global' ? 100 : 0,
            is_following_author: false
          };

          // Add to beginning of results
          return {
            ...oldData,
            results: [newFeedItem, ...oldData.results],
            count: oldData.count + 1
          };
        }
      );

    } catch (error) {
      console.error('Failed to handle new moment event:', error);
      if (error instanceof DTOValidationError) {
        this.config?.onError?.(`Contract validation failed: ${error.message}`);
      }
    }
  }

  /**
   * Handle like/unlike events
   */
  private handleLikeUpdate(event: LikeUpdateEvent): void {
    // Update React Query cache
    this.config?.queryClient.setQueryData(
      ['moments', 'feed'],
      (oldData: PaginatedFeedDTO | undefined) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          results: oldData.results.map((feedItem) => {
            const moment = feedItem.moment;
            if (moment.id === event.moment_id) {
              return {
                ...feedItem,
                moment: {
                  ...moment,
                  is_liked: event.is_liked,
                  likes_count: event.likes_count
                }
              };
            }
            return feedItem;
          })
        };
      }
    );
  }

  /**
   * Handle comment events
   */
  private handleCommentUpdate(event: CommentUpdateEvent): void {
    // Update React Query cache
    this.config?.queryClient.setQueryData(
      ['moments', 'feed'],
      (oldData: PaginatedFeedDTO | undefined) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          results: oldData.results.map((feedItem) => {
            const moment = feedItem.moment;
            if (moment.id === event.moment_id) {
              return {
                ...feedItem,
                moment: {
                  ...moment,
                  comments_count: event.comments_count
                }
              };
            }
            return feedItem;
          })
        };
      }
    );

    // Invalidate comments query for this moment
    this.config?.queryClient.invalidateQueries({ queryKey: ['moment', event.moment_id, 'comments'] });
  }

  /**
   * Handle share events
   */
  private handleShareUpdate(event: ShareUpdateEvent): void {
    // Update React Query cache
    this.config?.queryClient.setQueryData(
      ['moments', 'feed'],
      (oldData: PaginatedFeedDTO | undefined) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          results: oldData.results.map((feedItem) => {
            const moment = feedItem.moment;
            if (moment.id === event.moment_id) {
              return {
                ...feedItem,
                moment: {
                  ...moment,
                  shares: event.shares_count
                }
              };
            }
            return feedItem;
          })
        };
      }
    );
  }

  /**
   * Handle follow/unfollow events
   */
  private handleFollowUpdate(event: FollowUpdateEvent): void {
    // Update React Query cache for user relationships
    this.config?.queryClient.invalidateQueries({ queryKey: ['following'] });
    this.config?.queryClient.invalidateQueries({ queryKey: ['followers'] });
    
    // Update feed items to reflect follow status
    this.config?.queryClient.setQueryData(
      ['moments', 'feed'],
      (oldData: PaginatedFeedDTO | undefined) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          results: oldData.results.map((feedItem) => {
            // Update follow status for relevant users
            if (feedItem.user.id === event.following_id) {
              return {
                ...feedItem,
                is_following_author: event.is_following
              };
            }
            return feedItem;
          })
        };
      }
    );
  }

  /**
   * Handle error events
   */
  private handleError(event: FeedErrorEvent): void {
    console.error('WebSocket error from server:', event.message);
    this.config?.onError?.(event.message);
  }

  /**
   * Attempt to reconnect WebSocket
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts || this.isDestroyed) {
      console.log('Max reconnection attempts reached or service destroyed');
      this.config?.onError?.('Unable to establish WebSocket connection');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      if (this.config && !this.isDestroyed) {
        this.connect(this.config).catch((error) => {
          console.error('Reconnection failed:', error);
        });
      }
    }, delay);
  }

  /**
   * Subscribe to specific feed types
   */
  subscribeToFeed(feedType: 'personal' | 'trending' | 'global'): void {
    this.send({
      action: 'subscribe_feed',
      feed_type: feedType
    });
  }

  /**
   * Unsubscribe from specific feed types
   */
  unsubscribeFromFeed(feedType: 'personal' | 'trending' | 'global'): void {
    this.send({
      action: 'unsubscribe_feed',
      feed_type: feedType
    });
  }

  /**
   * Mark moment as viewed
   */
  markMomentViewed(momentId: number): void {
    this.send({
      action: 'mark_viewed',
      moment_id: momentId
    });
  }

  /**
   * Get connection status
   */
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection state
   */
  get connectionState(): string {
    if (!this.ws) return 'disconnected';
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'closed';
      default: return 'unknown';
    }
  }
}

// === SINGLETON INSTANCE ===

let feedWebSocketInstance: FeedWebSocketService | null = null;

export function getFeedWebSocketService(): FeedWebSocketService {
  if (!feedWebSocketInstance) {
    feedWebSocketInstance = new FeedWebSocketService();
  }
  return feedWebSocketInstance;
}

export function destroyFeedWebSocketService(): void {
  if (feedWebSocketInstance) {
    feedWebSocketInstance.disconnect();
    feedWebSocketInstance = null;
  }
}
