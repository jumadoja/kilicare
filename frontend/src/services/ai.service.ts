import api from '@/core/api/axios';
import {
  AIThread,
  AIChatPayload,
  AIChatResponse,
  AIPreferences,
  ProactiveAlert,
} from '@/features/ai/types';

export const aiService = {
  async chat(payload: AIChatPayload): Promise<AIChatResponse> {
    const { data } = await api.post<AIChatResponse>('/api/ai/chat/', payload);
    return data;
  },

  async voiceToText(
    audio: Blob,
    threadId?: string,
  ): Promise<{ user_text: string; thread_id: string; voice_preference: string }> {
    const form = new FormData();
    form.append('audio', audio, 'recording.webm');
    if (threadId) form.append('thread_id', threadId);
    const { data } = await api.post('/api/ai/voice-to-text/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async getThreads(): Promise<AIThread[]> {
    const { data } = await api.get<AIThread[]>('/api/ai/threads/');
    return data;
  },

  async getPreferences(): Promise<AIPreferences> {
    const { data } = await api.get<AIPreferences>('/api/ai/preferences/');
    return data;
  },

  async updatePreferences(
    prefs: Partial<AIPreferences>,
  ): Promise<AIPreferences> {
    const { data } = await api.put<AIPreferences>(
      '/api/ai/preferences/',
      prefs,
    );
    return data;
  },

  async getProactiveAlerts(): Promise<ProactiveAlert[]> {
    const { data } = await api.get<ProactiveAlert[]>(
      '/api/ai/proactive-alerts/',
    );
    return data;
  },
};