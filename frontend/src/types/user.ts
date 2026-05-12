export type UserRole = 'TOURIST' | 'LOCAL_GUIDE' | 'ADMIN';
export type UserLevel = 'EXPLORER' | 'ADVENTURER' | 'GUARDIAN' | 'LEGEND';
export type Gender = 'M' | 'F' | 'O';

export interface UserProfile {
  phone_number: string | null;
  bio: string | null;
  avatar: string | null;
  gender: Gender | null;
  dob: string | null;
  location: string | null;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  is_verified: boolean;
  profile: UserProfile;
  date_joined: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  role: 'TOURIST' | 'LOCAL_GUIDE';
  bio?: string;
  location?: string;
  avatar?: File;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface UpdateProfilePayload {
  profile?: Partial<UserProfile>;
}