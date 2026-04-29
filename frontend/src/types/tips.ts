export type TipCategory =
  | 'SAFETY'
  | 'LIFESTYLE'
  | 'NAVIGATION'
  | 'EXPERIENCE'
  | 'ACCESSIBILITY';

export interface Tip {
  id: number;
  title: string;
  description: string;
  category: TipCategory;
  sub_topics: string[];
  latitude: number | null;
  longitude: number | null;
  location_address: string | null;
  created_by_info: {
    id: number;
    username: string;
    role: string;
    avatar?: string | null;
  };
  trust_score: number;
  upvotes: number;
  downvotes: number;
  is_verified: boolean;
  is_public: boolean;
  is_upvoted_by_user: boolean;
  created_at: string;
}

export interface CreateTipPayload {
  title: string;
  description: string;
  category: TipCategory;
  sub_topics: string[];
  latitude?: number;
  longitude?: number;
  location_address?: string;
}