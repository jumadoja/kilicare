"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import axios from "axios";

interface VoiceChatPayload {
  audioBlob: Blob;
  threadId: string | null;
}

export const useVoiceAI = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: VoiceChatPayload) => {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Tafadhali login kwanza.");

      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      
      const formData = new FormData();
      formData.append("audio", payload.audioBlob, "recording.webm");
      
      if (payload.threadId) {
        formData.append("thread_id", payload.threadId);
      }

      // Tunatumia axios hapa kwa urahisi wa FormData
      const response = await axios.post(`${BASE_URL}/api/ai/voice/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      /**
       * Backend sasa inarudisha:
       * { 
       * user_text: "...", 
       * thread_id: "...", 
       * audio_url: "...", 
       * voice_preference: "..." 
       * }
       */
      return { 
        userText: response.data.user_text, 
        threadId: response.data.thread_id,
        audioUrl: response.data.audio_url,           // Nyama mpya hapa 🔥
        voicePreference: response.data.voice_preference // Nyama mpya hapa 🔥
      };
    },

    onError: (error: any) => {
      const errorMessage = 
        error?.response?.data?.error || 
        error.message || 
        "Sauti haijaeleweka, jaribu tena.";
        
      toast.error(errorMessage);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-threads"] });
    },
  });
};