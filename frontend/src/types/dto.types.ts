/**
 * DTO Types - Frontend Contract Layer
 * 
 * These types MUST match backend DTO contracts exactly.
 * NO manual field guessing - derive from backend contracts.
 * 
 * CRITICAL RULES:
 * - ALL field names match backend 1:1
 * - NO frontend-only field transformations
 * - Use these types for all API responses
 * - Map to UI types via contract enforcement layer
 */

// === PROFILE DTO ===
export interface ProfileDTO {
  avatar: string | null;
  bio: string;
  location: string;
  phone_number?: string;
  gender?: string;
  dob?: string | null;
}

// === USER DTO ===
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

// === MOMENT DTO ===
export interface MomentDTO {
  id: number;
  caption: string;
  media: string;
  media_type: 'image' | 'video';
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
  visibility: 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE';
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
}

// === COMMENT DTO ===
export interface CommentDTO {
  id: number;
  comment: string;
  created_at: string;
  
  // User - ALWAYS use UserDTO
  user: UserDTO;
}

// === FEED ITEM DTO ===
export interface FeedItemDTO {
  moment: MomentDTO;
  user: UserDTO; // Redundant but matches backend structure
  
  // Additional feed-specific metadata
  feed_score: number;
  is_following_author: boolean;
}

// === PAGINATED FEED DTO ===
export interface PaginatedFeedDTO {
  count: number;
  next: string | null;
  previous: string | null;
  results: FeedItemDTO[];
}

// === LEGACY COMPATIBILITY TYPES ===
// These maintain compatibility with existing frontend code
// while enforcing DTO contracts

export interface Moment extends MomentDTO {}
export interface MomentUser extends UserDTO {}
export interface MomentComment extends CommentDTO {}

// === API RESPONSE TYPES ===
export interface FeedResponse extends PaginatedFeedDTO {}
export interface CreateMomentPayload {
  media: File;
  media_type: 'image' | 'video';
  caption?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  visibility: 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE';
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

// === TYPE GUARDS ===
export function isValidUserDTO(obj: any): obj is UserDTO {
  return (
    obj &&
    typeof obj.id === 'number' &&
    typeof obj.username === 'string' &&
    typeof obj.email === 'string' &&
    ['TOURIST', 'LOCAL_GUIDE', 'ADMIN'].includes(obj.role) &&
    typeof obj.is_verified === 'boolean'
  );
}

export function isValidMomentDTO(obj: any): obj is MomentDTO {
  return (
    obj &&
    typeof obj.id === 'number' &&
    typeof obj.caption === 'string' &&
    typeof obj.media === 'string' &&
    ['image', 'video'].includes(obj.media_type) &&
    typeof obj.views === 'number' &&
    typeof obj.shares === 'number' && // CRITICAL: Check for 'shares' not 'shares_count'
    typeof obj.likes_count === 'number' &&
    typeof obj.comments_count === 'number' &&
    isValidUserDTO(obj.posted_by)
  );
}

export function isValidFeedItemDTO(obj: any): obj is FeedItemDTO {
  return (
    obj &&
    isValidMomentDTO(obj.moment) &&
    isValidUserDTO(obj.user)
  );
}

// === CONTRACT VALIDATION ===
export class DTOValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DTOValidationError';
  }
}

export function validateMomentDTO(data: any): MomentDTO {
  if (!isValidMomentDTO(data)) {
    throw new DTOValidationError('Invalid MomentDTO structure');
  }
  
  // CRITICAL: Check for field name consistency
  if ('shares_count' in data) {
    throw new DTOValidationError("Use 'shares' instead of 'shares_count'");
  }
  
  if (!data.posted_by.role) {
    throw new DTOValidationError("User data missing required 'role' field");
  }
  
  return data;
}

export function validateUserDTO(data: any): UserDTO {
  if (!isValidUserDTO(data)) {
    throw new DTOValidationError('Invalid UserDTO structure');
  }
  
  // Check profile structure
  if (data.profile && typeof data.profile === 'object') {
    if (data.profile.avatar && typeof data.profile.avatar !== 'string') {
      throw new DTOValidationError('Profile avatar must be string URL');
    }
  }
  
  return data;
}

// === RESPONSE NORMALIZATION ===
export function normalizeMomentResponse(data: any): MomentDTO {
  const normalized = { ...data };
  
  // Fix field name inconsistencies
  if ('shares_count' in normalized) {
    normalized.shares = normalized.shares_count;
    delete normalized.shares_count;
  }
  
  // Ensure user data structure
  if (normalized.posted_by) {
    const user = normalized.posted_by;
    
    // Ensure role is present
    if (!user.role) {
      throw new DTOValidationError("User data missing required 'role' field");
    }
    
    // Normalize profile structure
    if (user.profile && user.profile.avatar) {
      if (typeof user.profile.avatar !== 'string') {
        // Convert FileField object to URL string if needed
        user.profile.avatar = user.profile.avatar.url || user.profile.avatar;
      }
    }
  }
  
  return validateMomentDTO(normalized);
}

export function normalizeFeedResponse(data: any): PaginatedFeedDTO {
  const normalized = { ...data };
  
  if (normalized.results) {
    normalized.results = normalized.results.map((item: any) => {
      if (item.moment) {
        // FeedItemDTO structure
        return {
          ...item,
          moment: normalizeMomentResponse(item.moment),
          user: validateUserDTO(item.user)
        };
      } else {
        // Direct MomentDTO structure
        return {
          moment: normalizeMomentResponse(item),
          user: validateUserDTO(item.posted_by),
          feed_score: 0,
          is_following_author: false
        };
      }
    });
  }
  
  return normalized;
}
