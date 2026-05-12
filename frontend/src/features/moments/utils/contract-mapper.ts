/**
 * Data Contract Enforcement Mapping Layer
 * 
 * MANDATORY: ALL API responses must pass through this layer
 * NO direct API usage in UI components
 * 
 * This layer ensures:
 * - Backend responses match frontend DTO contracts
 * - Field name consistency
 * - Required fields are present
 * - Type safety
 */

import {
  UserDTO, ProfileDTO, MomentDTO, CommentDTO, 
  FeedItemDTO, PaginatedFeedDTO,
  DTOValidationError
} from '@/features/moments/types';

// === CONTRACT VALIDATION ===

function validateUserDTO(data: any): UserDTO {
  if (!data || typeof data !== 'object') {
    throw new DTOValidationError('User data must be an object');
  }

  const requiredFields = ['id', 'username', 'email', 'role'];
  for (const field of requiredFields) {
    if (!(field in data)) {
      throw new DTOValidationError(`Missing required user field: ${field}`);
    }
  }

  // Validate role
  const validRoles = ['TOURIST', 'LOCAL_GUIDE', 'ADMIN'];
  if (!validRoles.includes(data.role)) {
    throw new DTOValidationError(`Invalid role: ${data.role}`);
  }

  // Validate profile structure if present
  if (data.profile && typeof data.profile === 'object') {
    if (data.profile.avatar && typeof data.profile.avatar !== 'string') {
      // Convert FileField object to URL string if needed
      if (data.profile.avatar.url) {
        data.profile.avatar = data.profile.avatar.url;
      } else {
        throw new DTOValidationError('Profile avatar must be string URL');
      }
    }
  }

  return data as UserDTO;
}

function validateMomentDTO(data: any): MomentDTO {
  if (!data || typeof data !== 'object') {
    throw new DTOValidationError('Moment data must be an object');
  }

  const requiredFields = ['id', 'caption', 'media', 'media_type', 'posted_by'];
  for (const field of requiredFields) {
    if (!(field in data)) {
      throw new DTOValidationError(`Missing required moment field: ${field}`);
    }
  }

  // CRITICAL: Check for field name consistency
  if ('shares_count' in data) {
    throw new DTOValidationError("Use 'shares' instead of 'shares_count'");
  }

  // Validate media_type
  const validMediaTypes = ['image', 'video'];
  if (!validMediaTypes.includes(data.media_type)) {
    throw new DTOValidationError(`Invalid media_type: ${data.media_type}`);
  }

  // Validate posted_by user data
  if (data.posted_by) {
    validateUserDTO(data.posted_by);
  }

  return data as MomentDTO;
}

function validateCommentDTO(data: any): CommentDTO {
  if (!data || typeof data !== 'object') {
    throw new DTOValidationError('Comment data must be an object');
  }

  const requiredFields = ['id', 'comment', 'created_at', 'user'];
  for (const field of requiredFields) {
    if (!(field in data)) {
      throw new DTOValidationError(`Missing required comment field: ${field}`);
    }
  }

  // Validate user data
  if (data.user) {
    validateUserDTO(data.user);
  }

  return data as CommentDTO;
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

export function normalizeUserResponse(data: any): UserDTO {
  const normalized = { ...data };

  // Normalize profile structure
  if (normalized.profile && typeof normalized.profile === 'object') {
    if (normalized.profile.avatar && typeof normalized.profile.avatar !== 'string') {
      // Convert FileField object to URL string if needed
      normalized.profile.avatar = normalized.profile.avatar.url || normalized.profile.avatar;
    }
  }

  return validateUserDTO(normalized);
}

export function normalizeCommentResponse(data: any): CommentDTO {
  const normalized = { ...data };

  // Ensure user data follows UserDTO contract
  if (normalized.user) {
    normalized.user = normalizeUserResponse(normalized.user);
  }

  return validateCommentDTO(normalized);
}

export function normalizeFeedItemResponse(data: any): FeedItemDTO {
  if (!data || typeof data !== 'object') {
    throw new DTOValidationError('FeedItem data must be an object');
  }

  let moment: MomentDTO;
  let user: UserDTO;

  if (data.moment) {
    // FeedItemDTO structure
    moment = normalizeMomentResponse(data.moment);
    user = validateUserDTO(data.user);
  } else {
    // Direct MomentDTO structure - convert to FeedItemDTO
    moment = normalizeMomentResponse(data);
    user = moment.posted_by;
  }

  return {
    moment,
    user,
    feed_score: data.feed_score || 0,
    is_following_author: data.is_following_author || false
  };
}

export function normalizePaginatedFeedResponse(data: any): PaginatedFeedDTO {
  if (!data || typeof data !== 'object') {
    throw new DTOValidationError('Paginated feed data must be an object');
  }

  const normalized = { ...data };

  if (normalized.results) {
    normalized.results = normalized.results.map((item: any) => 
      normalizeFeedItemResponse(item)
    );
  }

  // Validate required pagination fields
  const requiredFields = ['count', 'results'];
  for (const field of requiredFields) {
    if (!(field in normalized)) {
      throw new DTOValidationError(`Missing required pagination field: ${field}`);
    }
  }

  return normalized as PaginatedFeedDTO;
}

// === BATCH NORMALIZATION UTILITIES ===

export function normalizeMomentsList(data: any[]): MomentDTO[] {
  if (!Array.isArray(data)) {
    throw new DTOValidationError('Moments list must be an array');
  }

  return data.map(item => normalizeMomentResponse(item));
}

export function normalizeUsersList(data: any[]): UserDTO[] {
  if (!Array.isArray(data)) {
    throw new DTOValidationError('Users list must be an array');
  }

  return data.map(item => normalizeUserResponse(item));
}

export function normalizeCommentsList(data: any[]): CommentDTO[] {
  if (!Array.isArray(data)) {
    throw new DTOValidationError('Comments list must be an array');
  }

  return data.map(item => normalizeCommentResponse(item));
}

// === API RESPONSE WRAPPER ===

/**
 * Wrap API service calls with contract enforcement
 * This ensures ALL API responses pass through DTO validation
 */
export function withContractValidation<T, Args extends any[]>(
  apiFunction: (...args: Args) => Promise<T>,
  normalizer: (data: any) => T
) {
  return async (...args: Args): Promise<T> => {
    try {
      const response = await apiFunction(...args);
      return normalizer(response);
    } catch (error) {
      // Re-throw DTO validation errors with context
      if (error instanceof DTOValidationError) {
        console.error('Contract validation failed:', error.message);
        throw error;
      }
      // Handle unknown error types
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('API call failed:', errorMessage);
      throw error;
    }
  };
}

// === TYPE GUARDS ===

export function isValidUserDTO(obj: any): obj is UserDTO {
  try {
    validateUserDTO(obj);
    return true;
  } catch {
    return false;
  }
}

export function isValidMomentDTO(obj: any): obj is MomentDTO {
  try {
    validateMomentDTO(obj);
    return true;
  } catch {
    return false;
  }
}

export function isValidFeedItemDTO(obj: any): obj is FeedItemDTO {
  try {
    normalizeFeedItemResponse(obj);
    return true;
  } catch {
    return false;
  }
}
