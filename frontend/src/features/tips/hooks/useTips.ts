"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchLatestTips, upvoteTip } from "@/services/api";
import { toast } from "react-hot-toast";

export interface Tip {
  id: number;
  title: string;
  content: string;
  upvotes: number;
}

export const useTips = () => {
  const queryClient = useQueryClient();

  // 🔥 Fetch tips
  const { data: tips = [], isLoading, isError } = useQuery<Tip[]>({
    queryKey: ["tips"],
    queryFn: fetchLatestTips,
    staleTime: 1000 * 60, // 1 minute cache
  });

  // 🔥 Upvote mutation (optimistic)
  const mutation = useMutation({
    mutationFn: (id: number) => upvoteTip(id),

    onSuccess: (_, id) => {
      queryClient.setQueryData<Tip[]>(["tips"], (old) =>
        old?.map((tip) =>
          tip.id === id
            ? { ...tip, upvotes: (tip.upvotes || 0) + 1 }
            : tip
        )
      );

      toast.success("Upvoted!");
    },

    onError: () => {
      toast.error("Failed to upvote.");
    },
  });

  const upvote = (id: number) => mutation.mutate(id);

  return {
    tips,
    isLoading,
    isError,
    upvote,
  };
};