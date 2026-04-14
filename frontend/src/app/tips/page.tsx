"use client";

import { useEffect, useState } from "react";
import { fetchLatestTips, upvoteTip } from "@/services/api";
import { TipsList } from "@/features/tips/TipsList";
import { toast } from "react-hot-toast";

export default function TipsPage() {
  const [tips, setTips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTips = async () => {
      try {
        const data = await fetchLatestTips();
        setTips(data);
      } catch (error) {
        toast.error("Failed to load tips");
      } finally {
        setLoading(false);
      }
    };

    loadTips();
  }, []);

  const handleUpvote = async (id: number) => {
    try {
      await upvoteTip(id);

      setTips((prev) =>
        prev.map((tip) =>
          tip.id === id
            ? { ...tip, upvotes: (tip.upvotes || 0) + 1 }
            : tip
        )
      );
    } catch (error) {
      toast.error("Failed to upvote");
    }
  };

  if (loading) return <p>Loading tips...</p>;

  return <TipsList tips={tips} onUpvote={handleUpvote} />;
}