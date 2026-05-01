import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { aiService } from '@/services/ai.service';
import { AIMessage, AIThread, AIChatPayload } from '@/features/ai/types';
import { parseApiError } from '@/core/errors';

// ── Threads ───────────────────────────────────────────
export function useAIThreads() {
  return useQuery({
    queryKey: ['ai', 'threads'],
    queryFn: aiService.getThreads,
    staleTime: 1000 * 60 * 5,
  });
}

// ── Proactive Alerts ──────────────────────────────────
export function useProactiveAlerts() {
  return useQuery({
    queryKey: ['ai', 'alerts'],
    queryFn: aiService.getProactiveAlerts,
    staleTime: 1000 * 60 * 2,
  });
}

// ── AI Preferences ────────────────────────────────────
export function useAIPreferences() {
  return useQuery({
    queryKey: ['ai', 'preferences'],
    queryFn: aiService.getPreferences,
    staleTime: 1000 * 60 * 10,
  });
}

// ── Main AI Chat Hook ─────────────────────────────────
export function useAIChat() {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [threadId, setThreadId] = useState<string | undefined>(undefined);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const streamTimerRef = useRef<NodeJS.Timeout | null>(null);
  const qc = useQueryClient();

  // Character-by-character typewriter
  const typeText = useCallback(
    (text: string, onComplete: (msg: AIMessage) => void) => {
      setIsStreaming(true);
      setStreamedText('');
      let i = 0;
      // Speed: faster for shorter texts, slower for longer
      const speed = Math.max(6, Math.min(18, 3000 / text.length));

      const tick = () => {
        if (i <= text.length) {
          setStreamedText(text.slice(0, i));
          i++;
          streamTimerRef.current = setTimeout(tick, speed);
        } else {
          setIsStreaming(false);
          setStreamedText('');
          const aiMsg: AIMessage = {
            id: Date.now(),
            role: 'assistant',
            content: text,
            timestamp: new Date().toISOString(),
          };
          onComplete(aiMsg);
        }
      };
      tick();
    },
    [],
  );

  const sendMutation = useMutation({
    mutationFn: (payload: AIChatPayload) => aiService.chat(payload),

    onMutate: ({ message, image }) => {
      // Add user message immediately
      const userMsg: AIMessage = {
        id: Date.now(),
        role: 'user',
        content: message,
        image_url: image,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
    },

    onSuccess: (data) => {
      setThreadId(data.thread_id);
      // Invalidate threads list to refresh titles
      qc.invalidateQueries({ queryKey: ['ai', 'threads'] });
      // Start typewriter for AI response
      typeText(data.response, (aiMsg) => {
        setMessages((prev) => [...prev, aiMsg]);
      });
    },

    onError: (error) => {
      setIsStreaming(false);
      setStreamedText('');
      toast.error(parseApiError(error));
    },
  });

  const sendMessage = useCallback(
    (payload: AIChatPayload) => {
      if (streamTimerRef.current) clearTimeout(streamTimerRef.current);
      sendMutation.mutate({ ...payload, thread_id: threadId });
    },
    [threadId, sendMutation],
  );

  const loadThread = useCallback((thread: AIThread) => {
    setThreadId(thread.id);
    setMessages([]);
    setStreamedText('');
    setIsStreaming(false);
  }, []);

  const newChat = useCallback(() => {
    if (streamTimerRef.current) clearTimeout(streamTimerRef.current);
    setThreadId(undefined);
    setMessages([]);
    setStreamedText('');
    setIsStreaming(false);
  }, []);

  // Cleanup stream timer on unmount
  useEffect(() => {
    return () => {
      if (streamTimerRef.current) clearTimeout(streamTimerRef.current);
    };
  }, []);

  return {
    messages,
    threadId,
    isStreaming,
    streamedText,
    isSending: sendMutation.isPending,
    sendMessage,
    loadThread,
    newChat,
  };
}

// ── Voice Recording ───────────────────────────────────
export function useVoiceRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(100);
      mediaRef.current = recorder;
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch {
      toast.error('Haiwezi kutumia kipaza sauti. Ruhusa inahitajika.');
    }
  }, []);

  const stopRecording = useCallback((): Promise<Blob> => {
    return new Promise((resolve) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setDuration(0);

      if (!mediaRef.current) {
        resolve(new Blob());
        return;
      }

      mediaRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        mediaRef.current?.stream.getTracks().forEach((t) => t.stop());
        resolve(blob);
      };

      mediaRef.current.stop();
      setIsRecording(false);
    });
  }, []);

  const transcribe = useCallback(
    async (
      blob: Blob,
      threadId?: string,
    ): Promise<{ user_text: string; thread_id: string }> => {
      setIsTranscribing(true);
      try {
        const result = await aiService.voiceToText(blob, threadId);
        return result;
      } catch (error) {
        toast.error('Imeshindwa kutambua sauti. Jaribu tena.');
        throw error;
      } finally {
        setIsTranscribing(false);
      }
    },
    [],
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return {
    isRecording,
    duration,
    isTranscribing,
    startRecording,
    stopRecording,
    transcribe,
  };
}