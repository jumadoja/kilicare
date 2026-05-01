export interface AIThread {
  id: string;
  title: string;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIMessage {
  id?: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  image_url?: string;
  timestamp: string;
  isStreaming?: boolean;
}

export interface AIChatPayload {
  message: string;
  thread_id?: string;
  image?: string;
}

export interface AIChatResponse {
  response: string;
  thread_id: string;
  voice_preference: 'male' | 'female';
}

export interface AIPreferences {
  preferred_voice: 'male' | 'female';
  preferred_language: 'sw' | 'en';
  interests: string[];
}

export interface ProactiveAlert {
  id: number;
  message: string;
  alert_type: 'weather' | 'event' | 'security';
  is_sent: boolean;
  created_at: string;
}