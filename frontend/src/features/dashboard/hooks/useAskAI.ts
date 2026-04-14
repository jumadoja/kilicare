"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

// 1. Interface imebaki vilevile na vitu vyako vipya 🔥
interface AIChatPayload {
  message: string;
  image?: string | null;
  threadId?: string | null;
  onChunk: (chunk: string) => void;
  onMeta?: (data: { 
    thread_id: string; 
    voice_preference?: string;
    audio_url?: string;         
    summary_updated?: boolean;  
  }) => void;
}

export const useAskAI = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AIChatPayload) => {
      const token = localStorage.getItem("accessToken");
      const BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

      const response = await fetch(`${BASE_URL}/api/ai/ask/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: payload.message,
          image: payload.image || null,
          thread_id: payload.threadId || null,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(
          err.error || "Mifumo yetu ina shughuli nyingi, jaribu tena."
        );
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      if (!reader) return;

      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();

        // Tunadecode chunk inayokuja sasa hivi
        const currentChunk = decoder.decode(value, { stream: !done });
        buffer += currentChunk;

        // Tunasplit kwa mstari mmoja mmoja (\n)
        let lines = buffer.split("\n");
        
        // Tunahifadhi mstari ambao haujakamilika kurudi kwenye buffer
        buffer = lines.pop() || "";

        for (let line of lines) {
          line = line.trim();

          if (!line.startsWith("data:")) continue;

          const clean = line.replace(/^data:\s*/, "").trim();

          if (!clean || clean === "[DONE]") continue;

          const parsed = safeJSONParse(clean);
          if (!parsed) continue;

          // ✅ META SAFE CALL - Imebaki na vitu vyote 🔥
          if (parsed.thread_id && payload.onMeta) {
            payload.onMeta({
              thread_id: parsed.thread_id,
              voice_preference: parsed.voice_preference,
              audio_url: parsed.audio_url,
              summary_updated: parsed.summary_updated,
            });
          }

          // ✅ CONTENT STREAM - Hapa ndipo maneno yanatoka
          if (parsed.content !== undefined) {
            payload.onChunk(parsed.content);
          }

          // ✅ ERROR HANDLING
          if (parsed.error) {
            toast.error(parsed.error);
          }
        }

        if (done) break;
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-threads"] });
    },

    onError: (error: any) => {
      toast.error(error.message);
    },
  });
};

function safeJSONParse(str: string) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}