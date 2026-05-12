// Import DTO contracts - DO NOT manually define types
export type MediaType = 'image' | 'video';

export type Visibility = 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE';

// === DTO-DRIVEN TYPES ===
// These types MUST match backend DTO contracts exactly
// NO manual field guessing - derive from backend contracts

export interface ProfileDTO {
  avatar: string | null;
  bio: string;
  location: string;
  phone_number?: string;
  gender?: string;
  dob?: string | null;
}

export interface UserDTO {
  id: number;
  username: string;
  email: string;
  role: 'TOURIST' | 'LOCAL_GUIDE' | 'ADMIN'; // CRITICAL: Always included
  is_verified: boolean;
  first_name: string;
  last_name: string;
  date_joined: string;
  
  // Nested profile - STANDARDIZED STRUCTURE
  profile?: ProfileDTO | null;
  
  // Optional passport data
  passport_trust_score?: number | null;
  passport_level?: number | null;
}

export interface MomentDTO {
  id: number;
  caption: string;
  media: string;
  media_type: MediaType;
  location: string;
  latitude: number | null;
  longitude: number | null;
  
  // Engagement metrics - STANDARDIZED NAMES
  views: number;
  shares: number; // CRITICAL: ONLY 'shares', not 'shares_count'
  likes_count: number;
  comments_count: number;
  is_following?: boolean;
  
  // Status fields
  is_verified: boolean;
  is_featured: boolean;
  visibility: Visibility;
  is_hidden: boolean;
  content_warning: string;
  
  // Trending
  trending_score: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // User - ALWAYS use UserDTO
  posted_by: UserDTO;
  
  // Interaction status for current user
  is_liked: boolean;
  is_saved: boolean;
  
  // Background music
  background_music?: {
    id: number;
    title: string;
    file: string;
    description: string;
  } | null;
}

export interface CommentDTO {
  id: number;
  comment: string;
  created_at: string;
  
  // User - ALWAYS use UserDTO
  user: UserDTO;
}

export interface FeedItemDTO {
  moment: MomentDTO;
  user: UserDTO; // Redundant but matches backend structure
  
  // Additional feed-specific metadata
  feed_score: number;
  is_following_author: boolean;
}

export interface PaginatedFeedDTO {
  count: number;
  next: string | null;
  previous: string | null;
  results: FeedItemDTO[];
}

// === LEGACY COMPATIBILITY ALIASES ===
// These maintain compatibility with existing frontend code
// while enforcing DTO contracts

export interface MomentUser extends UserDTO {}
export interface MomentComment extends CommentDTO {}
export interface Moment extends MomentDTO {}
export interface PaginatedMoments extends PaginatedFeedDTO {}

// === API TYPES ===

export interface CreateMomentPayload {
  media: File;
  media_type: MediaType;
  caption?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  visibility: Visibility;
  background_music?: number;
}

// === WEBSOCKET EVENT TYPES ===

export interface FeedWebSocketEvent {
  type: string;
  timestamp: string;
  [key: string]: any;
}

export interface NewMomentEvent extends FeedWebSocketEvent {
  type: 'new_moment';
  moment: MomentDTO;
  feed_type: 'global' | 'personal';
}

export interface LikeUpdateEvent extends FeedWebSocketEvent {
  type: 'like_update';
  moment_id: number;
  is_liked: boolean;
  likes_count: number;
  user_id: number;
}

export interface CommentUpdateEvent extends FeedWebSocketEvent {
  type: 'comment_update';
  moment_id: number;
  comment: CommentDTO;
  comments_count: number;
}

export interface ShareUpdateEvent extends FeedWebSocketEvent {
  type: 'share_update';
  moment_id: number;
  shares_count: number;
  shared_by: number;
}

export interface FollowUpdateEvent extends FeedWebSocketEvent {
  type: 'follow_update';
  follower_id: number;
  following_id: number;
  is_following: boolean;
}

export interface ConnectionStatusEvent extends FeedWebSocketEvent {
  type: 'connection_status';
  status: 'connected' | 'disconnected';
  user_id: number;
  channels?: string[];
}

export interface FeedErrorEvent extends FeedWebSocketEvent {
  type: 'error';
  message: string;
}

// === VALIDATION ERROR CLASS ===

export class DTOValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DTOValidationError';
  }
}