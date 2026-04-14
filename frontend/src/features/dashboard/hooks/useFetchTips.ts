"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/api";

export const useTips = (category?: string) => {
  const queryClient = useQueryClient();

  const fetchQuery = useQuery({
    queryKey: ["tips", category],
    queryFn: async () => {
      const params = category ? { params: { category } } : {};
      const res = await apiClient.get("/api/tips/list/", params);
      return res.data;
    }
  });

  const upvoteMutation = useMutation({
    mutationFn: async (tipId: number) => {
      const res = await apiClient.post(`/api/tips/upvote/${tipId}/`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tips"] });
    }
  });

  return { ...fetchQuery, upvoteTip: upvoteMutation.mutate };
};