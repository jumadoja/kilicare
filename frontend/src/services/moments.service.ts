import api from '@/core/api/axios';
import { Moment, CreateMomentPayload, PaginatedMoments, MomentComment } from '@/features/moments/types';

export const momentsService = {
  async getFeed(page = 1): Promise<PaginatedMoments> {
    const url = `/api/moments/feed/?page=${page}`;
    console.log('🔥 FRONTEND FEED REQUEST:', url);
    console.log('🌐 Base URL:', api.defaults.baseURL);
    console.log('🎯 Full URL:', api.defaults.baseURL + url);
    
    const { data } = await api.get<any>(url);
    // Handle standardized response format: {status, message, data: {...}}
    return data.data || data;
  },

  async getTrending(): Promise<Moment[]> {
    const { data } = await api.get<any>('/api/moments/trending/');
    // Handle standardized response format: {status, message, data: {...}}
    return data.data?.results || data.results || data;
  },

  async getMoment(id: number): Promise<Moment> {
    const { data } = await api.get<any>(`/api/moments/${id}/`);
    // Handle standardized response format: {status, message, data: {...}}
    return data.data || data;
  },

  async getComments(id: number): Promise<MomentComment[]> {
    const { data } = await api.get<any>(
      `/api/moments/${id}/comments/`,
    );
    // Handle standardized response format: {status, message, data: {...}}
    return data.data?.results || data.results || data;
  },

  async createMoment(payload: CreateMomentPayload): Promise<Moment> {
    const form = new FormData();
    form.append('media', payload.media);
    form.append('media_type', payload.media_type);
    form.append('visibility', payload.visibility);
    if (payload.caption) form.append('caption', payload.caption);
    if (payload.location) form.append('location', payload.location);
    if (payload.latitude != null)
      form.append('latitude', String(payload.latitude));
    if (payload.longitude != null)
      form.append('longitude', String(payload.longitude));
    if (payload.background_music != null)
      form.append('background_music', String(payload.background_music));
    const { data } = await api.post<any>('/api/moments/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    // Handle standardized response format: {status, message, data: {...}}
    return data.data || data;
  },

  async likeMoment(
    id: number,
  ): Promise<{ is_liked: boolean; likes_count: number }> {
    const { data } = await api.post<any>(`/api/moments/${id}/like/`);
    // Handle standardized response format: {status, message, data: {...}}
    return data.data || data;
  },

  async commentMoment(id: number, comment: string): Promise<MomentComment> {
    const { data } = await api.post<any>(
      `/api/moments/${id}/comments/`,
      { comment },
    );
    // Handle standardized response format: {status, message, data: {...}}
    return data.data || data;
  },

  async saveMoment(id: number): Promise<{ is_saved: boolean }> {
    const { data } = await api.post<any>(`/api/moments/${id}/save/`);
    // Handle standardized response format: {status, message, data: {...}}
    return data.data || data;
  },

  async shareMoment(id: number): Promise<void> {
    await api.post(`/api/moments/${id}/share/`);
  },

  async followUser(userId: number): Promise<{ status: string }> {
    const { data } = await api.post<any>(`/api/moments/follow/follow/`, { user_id: userId });
    return data.data || data;
  },

  async unfollowUser(userId: number): Promise<{ status: string }> {
    const { data } = await api.post<any>(`/api/moments/follow/unfollow/`, { user_id: userId });
    return data.data || data;
  },

  async trackView(momentId: number): Promise<{ views: number }> {
    const { data } = await api.post<any>(`/api/moments/${momentId}/track_view/`);
    return data.data || data;
  },

  async getMyMoments(): Promise<Moment[]> {
    const { data } = await api.get<any>('/api/moments/my-moments/');
    // Handle standardized response format: {status, message, data: {...}}
    return data.data?.results || data.results || data;
  },

  async getSavedMoments(): Promise<Moment[]> {
    const { data } = await api.get<any>('/api/moments/saved/');
    // Handle standardized response format: {status, message, data: {...}}
    return data.data?.results || data.results || data;
  },
};