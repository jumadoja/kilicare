export type MediaType = 'image' | 'video';
export type Visibility = 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE';

export interface MomentUser {
  id: number;
  username: string;
  avatar?: string | null;
  passport_trust_score?: number;
  role: string;
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
  caption: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  views: number;
  shares: number;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  is_saved: boolean;
  is_verified: boolean;
  is_featured: boolean;
  visibility: Visibility;
  trending_score: number;
  created_at: string;
}

export interface CreateMomentPayload {
  media: File;
  media_type: MediaType;
  caption: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  visibility?: Visibility;
}