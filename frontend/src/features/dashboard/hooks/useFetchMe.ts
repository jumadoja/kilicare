"use client";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/api";

export const useFetchMe = () => {
  return useQuery({
    queryKey: ["auth-me"],
    queryFn: async () => {
      const res = await apiClient.get("/auth/me/");
      return res.data; // Inarudisha: id, username, email, role, profile: { avatar, bio, location... }
    },
    staleTime: 1000 * 60 * 10, 
  });
};