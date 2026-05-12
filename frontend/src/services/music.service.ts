import api from '@/core/api/axios';

export interface BackgroundMusic {
  id: number;
  title: string;
  file: string;
  description: string;
}

export const musicService = {
  async getAllMusic(): Promise<BackgroundMusic[]> {
    const { data } = await api.get<any>('/api/moments/music/');
    return data.data?.results || data.results || data;
  },

  async getMusic(id: number): Promise<BackgroundMusic> {
    const { data } = await api.get<any>(`/api/moments/music/${id}/`);
    return data.data || data;
  },

  async createMusic(formData: FormData): Promise<BackgroundMusic> {
    const { data } = await api.post<any>('/api/moments/music/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data || data;
  },

  async updateMusic(id: number, formData: FormData): Promise<BackgroundMusic> {
    const { data } = await api.put<any>(`/api/moments/music/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data || data;
  },

  async deleteMusic(id: number): Promise<void> {
    await api.delete(`/api/moments/music/${id}/`);
  },
};
