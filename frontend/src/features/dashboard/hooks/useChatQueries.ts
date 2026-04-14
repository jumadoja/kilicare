"use client";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/api";

/**
 * A. Fetch List ya Contacts (Watu uliowahi chati nao)
 * Inatumika kuonyesha watu kwenye sidebar ya MessagingPage
 */
export const useFetchContacts = () => {
  return useQuery({
    queryKey: ["chat-contacts"],
    queryFn: async () => {
      const response = await apiClient.get("/api/messages/contacts/");
      // Tunahakikisha tunarudisha data moja kwa moja
      return response.data; 
    },
    // Inajirudia kila baada ya sekunde 30 kupata unread counts mpya
    refetchInterval: 30000, 
    refetchOnWindowFocus: false,
    staleTime: 10000, // Data inakaa "fresh" kwa sekunde 10
  });
};

/**
 * B. Fetch Historia ya Meseji baina ya watumiaji wawili
 * Inategemea receiverId ili kuleta chati husika
 */
export const useFetchChatHistory = (receiverId: number | null) => {
  return useQuery({
    queryKey: ["chat-history", receiverId],
    queryFn: async () => {
      if (!receiverId) return [];
      const response = await apiClient.get(`/api/messages/history/${receiverId}/`);
      return response.data;
    },
    // Inafanya kazi pale tu ambapo kuna receiverId iliyochaguliwa
    enabled: !!receiverId,
    staleTime: 5000,
    refetchOnWindowFocus: false,
    // Hatuhitaji refetchInterval hapa kwa sababu WebSockets itashughulikia meseji mpya
  });
};