import api from '@/core/api/axios';
import { AuthResponse, LoginPayload, RegisterPayload, UpdateProfilePayload, User } from '@/types';
import { API } from '@/lib/constants';
import { ForgotPasswordInput } from '@/lib/validators';

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(API.AUTH.LOGIN, payload);
    
    // Tokens are set in httpOnly cookies by backend
    // No localStorage storage needed
    
    return response.data;
  },

  async register(payload: RegisterPayload): Promise<User> {
    try {
      const formData = new FormData();
      formData.append('username', payload.username);
      formData.append('email', payload.email);
      formData.append('password', payload.password);
      formData.append('role', payload.role);
      if (payload.bio) formData.append('bio', payload.bio);
      if (payload.location) formData.append('location', payload.location);
      if (payload.avatar) formData.append('avatar', payload.avatar);

      const { data } = await api.post<any>(API.AUTH.REGISTER, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Backend returns { status, message, data: user_data }
      return data.data;
    } catch (error: unknown) {
      throw error;
    }
  },

  async getMe(): Promise<User | null> {
    try {
      const { data } = await api.get<any>(API.AUTH.ME);
      // Handle standardized response format: {status, message, data: user_data}
      return data.data || data;
    } catch (error: any) {
      // Redirect to login on 401 - no silent failures
      if (error.response?.status === 401) {
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw error; // CRITICAL: Throw error instead of returning null
      }
      throw error;
    }
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<User> {
    const { data } = await api.put<any>(API.AUTH.ME, payload);
    // Handle standardized response format: {status, message, data: user_data}
    return data.data || data;
  },

  async forgotPassword(payload: ForgotPasswordInput): Promise<void> {
    await api.post(API.AUTH.FORGOT, payload);
  },

  async resetPassword(payload: {
    email_or_phone: string;
    otp: string;
    new_password: string;
  }): Promise<void> {
    await api.post(API.AUTH.RESET, payload);
  },

  async logout(): Promise<void> {
    await api.post(API.AUTH.LOGOUT);
    
    // Cookies are cleared by backend
    // No localStorage cleanup needed
  },
};