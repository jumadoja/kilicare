export type MediaType = 'image' | 'video';
export type Visibility = 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE';

export interface MomentUser {
  id: number;
  username: string;
  passport_trust_score: number;
  role: string;
  profile?: {
    avatar: string | null;
  };
}

export interface MomentComment {
  id: number;
  user: MomentUser;
  comment: string;
  created_at: string;
}

export interface Moment {
  id: number;
  posted_by: MomentUser;
  media: string;
  media_type: MediaType;
  caption: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  views: number;
  shares: number;
  is_verified: boolean;
  is_featured: boolean;
  visibility: Visibility;
  trending_score: number;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  is_saved: boolean;
  created_at: string;
  comments?: MomentComment[];
}

export interface CreateMomentPayload {
  media: File;
  media_type: MediaType;
  caption?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  visibility: Visibility;
}

export interface PaginatedMoments {
  count: number;
  next: string | null;
  previous: string | null;
  results: Moment[];
}