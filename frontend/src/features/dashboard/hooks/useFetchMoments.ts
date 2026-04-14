"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/api";

export const useMoments = () => {
  const queryClient = useQueryClient();

  const fetchQuery = useQuery({
    queryKey: ["moments"],
    queryFn: async () => {
      const res = await apiClient.get("/api/moments/");
      return res.data;
    }
  });

  const likeMutation = useMutation({
    mutationFn: async (momentId: number) => {
      const res = await apiClient.post(`/api/moments/${momentId}/like/`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moments"] });
    }
  });

  return { ...fetchQuery, likeMoment: likeMutation.mutate };
};