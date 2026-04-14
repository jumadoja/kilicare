import axios from "axios";

export const apiClient = axios.create({
  baseURL: "http://127.0.0.1:8000", // badilisha kwa backend yako URL
  withCredentials: true,
});

// Payloads & Types
export interface LoginPayload { 
  username: string; 
  password: string; 
}

export interface RegisterPayload { 
  username: string; 
  email: string; 
  password: string; 
  confirm_password: string; 
  role: "TOURIST" | "LOCAL"; 
}

export interface AuthTokens { 
  access: string; 
  refresh: string; 
}

export interface User { 
  id: number; 
  username: string; 
  email: string; 
  role: "TOURIST" | "LOCAL" | "ADMIN"; 
  is_verified: boolean; 
}

// Tumeongeza hii Interface ili kuzuia makosa ya TypeScript kwenye Forgot Password
export interface ForgotPasswordPayload {
  username: string;
  email_or_phone: string;
}

// Auth API calls
export const login = async (data: LoginPayload): Promise<AuthTokens> => {
  const res = await apiClient.post("/auth/login/", data);
  return res.data;
};

export const register = async (data: RegisterPayload): Promise<void> => {
  await apiClient.post("/auth/register/", data);
};

export const getMe = async (accessToken: string): Promise<User> => {
  const res = await apiClient.get("/auth/me/", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data;
};

// Forgot/Reset password API
// Hapa tumerekebisha ili ipokee username na email_or_phone kama fomu yako inavyotuma
export const forgotPassword = async (data: ForgotPasswordPayload) => {
  const res = await apiClient.post("/auth/forgot-password/", data);
  return res.data;
};

export const resetPassword = async (data: { otp: string; new_password: string }) => {
  const res = await apiClient.post("/auth/reset-password/", data);
  return res.data;
};

// Helper for persisted auth
export const getPersistedAuth = (): { user: User; accessToken: string; refreshToken: string } | null => {
  if (typeof window === "undefined") return null; // Kinga kwa ajili ya SSR (Next.js)
  
  const user = localStorage.getItem("user");
  const accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");
  
  if (user && accessToken && refreshToken) {
    try {
      return { user: JSON.parse(user), accessToken, refreshToken };
    } catch (e) {
      return null;
    }
  }
  return null;
};