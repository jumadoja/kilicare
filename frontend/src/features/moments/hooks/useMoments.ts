"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTrendingMoments, likeMoment } from "@/services/api";

export interface Moment {
  id: number;
  title: string;
  description: string;
  likes_count: number;
}

export const useMoments = () => {
  const queryClient = useQueryClient();

  // 🔥 Fetch moments
  const { data, isLoading, isError } = useQuery({
    queryKey: ["moments"],
    queryFn: () => fetchTrendingMoments(),
    staleTime: 1000 * 60,
  });

  // 🔥 Like mutation (optimistic)
  const mutation = useMutation({
    mutationFn: (id: number) => likeMoment(id),

    onSuccess: (_, id) => {
      queryClient.setQueryData<any>(["moments"], (old: any) => {
        if (!old) return old;

        const list = old.results || old;

        const updated = list.map((m: any) =>
          m.id === id
            ? { ...m, likes_count: (m.likes_count || 0) + 1 }
            : m
        );

        return old.results ? { ...old, results: updated } : updated;
      });
    },
  });

  const like = (id: number) => mutation.mutate(id);

  return {
    moments: data?.results || data || [],
    isLoading,
    isError,
    like,
  };
};