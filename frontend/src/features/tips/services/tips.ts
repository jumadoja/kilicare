import { apiClient } from "@/services/api"; // ✅ fixed path

// Tip type
export interface Tip {
  id: number;
  title: string;
  content: string;
  category: string;
  upvotes: number;
}

// Fetch all tips
export const fetchTips = async (): Promise<Tip[]> => {
  const res = await apiClient.get<Tip[]>("/api/tips/list/");
  return res.data;
};