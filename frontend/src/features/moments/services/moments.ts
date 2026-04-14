"use client";

import { apiClient } from "@/services/api"; // ✅ correct absolute import

// Moment type
export interface Moment {
  id: number;
  title: string;
  description: string;
  likes_count: number;
  user?: string;
  comments_count?: number;
}

// Pagination type
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Fetch moments (handles both paginated & non-paginated)
export const fetchMoments = async (): Promise<Moment[]> => {
  const res = await apiClient.get<Moment[] | PaginatedResponse<Moment>>(
    "/api/moments/"
  );

  // Check if response is paginated
  if ("results" in res.data) {
    return res.data.results;
  }

  return res.data;
};