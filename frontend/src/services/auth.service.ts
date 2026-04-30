import api from '@/core/api/axios';
import { AuthResponse, LoginPayload, RegisterPayload, UpdateProfilePayload, User } from '@/types';
import { API } from '@/lib/constants';
import { ForgotPasswordInput } from '@/lib/validators';
import { tokenManager } from '@/core/auth/tokenManager';

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>(API.AUTH.LOGIN, payload);
    return data;
  },

  async register(payload: RegisterPayload): Promise<User> {
    const formData = new FormData();
    formData.append('username', payload.username);
    formData.append('email', payload.email);
    formData.append('password', payload.password);
    formData.append('first_name', payload.first_name);
    formData.append('last_name', payload.last_name);
    formData.append('role', payload.role);
    if (payload.bio) formData.append('bio', payload.bio);
    if (payload.location) formData.append('location', payload.location);
    if (payload.avatar) formData.append('avatar', payload.avatar);

    const { data } = await api.post<User>(API.AUTH.REGISTER, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async getMe(): Promise<User> {
    const { data } = await api.get<User>(API.AUTH.ME);
    return data;
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<User> {
    const { data } = await api.put<User>(API.AUTH.ME, payload);
    return data;
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

  async logout(refreshToken: string): Promise<void> {
    await api.post(API.AUTH.LOGOUT, { refresh_token: refreshToken });
  },
};