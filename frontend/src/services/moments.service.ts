import api from '@/core/api/axios';
import { Moment, CreateMomentPayload, PaginatedMoments, MomentComment } from '@/features/moments/types';

export const momentsService = {
  async getFeed(page = 1): Promise<PaginatedMoments> {
    const { data } = await api.get<PaginatedMoments>(
      `/api/moments/feed/?page=${page}`,
    );
    return data;
  },

  async getTrending(): Promise<Moment[]> {
    const { data } = await api.get<Moment[]>('/api/moments/trending/');
    return data;
  },

  async getMoment(id: number): Promise<Moment> {
    const { data } = await api.get<Moment>(`/api/moments/${id}/`);
    return data;
  },

  async getComments(id: number): Promise<MomentComment[]> {
    const { data } = await api.get<MomentComment[]>(
      `/api/moments/${id}/comments/`,
    );
    return data;
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
    const { data } = await api.post<Moment>('/api/moments/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async likeMoment(
    id: number,
  ): Promise<{ is_liked: boolean; likes_count: number }> {
    const { data } = await api.post(`/api/moments/${id}/like/`);
    return data;
  },

  async commentMoment(id: number, comment: string): Promise<MomentComment> {
    const { data } = await api.post<MomentComment>(
      `/api/moments/${id}/comment/`,
      { comment },
    );
    return data;
  },

  async saveMoment(id: number): Promise<{ is_saved: boolean }> {
    const { data } = await api.post(`/api/moments/${id}/save/`);
    return data;
  },

  async shareMoment(id: number): Promise<void> {
    await api.post(`/api/moments/${id}/share/`);
  },

  async getMyMoments(): Promise<Moment[]> {
    const { data } = await api.get<Moment[]>('/api/moments/my-moments/');
    return data;
  },

  async getSavedMoments(): Promise<Moment[]> {
    const { data } = await api.get<Moment[]>('/api/moments/saved/');
    return data;
  },

  async followUser(userId: number): Promise<void> {
    await api.post('/api/follow/', { following_id: userId });
  },

  async unfollowUser(userId: number): Promise<void> {
    await api.post('/api/follow/unfollow/', { following_id: userId });
  },
};