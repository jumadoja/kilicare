"use client";

import { useEffect, useState } from "react";
import { fetchTrendingMoments, likeMoment } from "@/services/api";
import { MomentsList } from "@/features/moments/MomentsList";
import { toast } from "react-hot-toast";

export default function MomentsPage() {
  const [moments, setMoments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMoments = async () => {
      try {
        const data = await fetchTrendingMoments();
        setMoments(data.results || data);
      } catch (error) {
        toast.error("Failed to load moments");
      } finally {
        setLoading(false);
      }
    };

    loadMoments();
  }, []);

  const handleLike = async (id: number) => {
    try {
      await likeMoment(id);

      setMoments((prev) =>
        prev.map((m) =>
          m.id === id
            ? { ...m, likes_count: (m.likes_count || 0) + 1 }
            : m
        )
      );
    } catch (error) {
      toast.error("Failed to like moment");
    }
  };

  if (loading) return <p>Loading moments...</p>;

  return <MomentsList moments={moments} onLike={handleLike} />;
}