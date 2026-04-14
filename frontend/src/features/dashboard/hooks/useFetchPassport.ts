"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/api";

// 1. HOOK YA PASSPORT (Taarifa kuu za Mtumiaji)
export const useFetchPassport = () => {
  return useQuery({
    queryKey: ["my-passport"],
    queryFn: async () => {
      try {
        // Hapa tunagonga /api/passport/me/ kulingana na Django urls.py
        const res = await apiClient.get("/api/passport/me/");
        return res.data;
      } catch (error: any) {
        console.error("Passport Error:", error?.response?.data || error.message);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // Data inakaa fresh kwa dakika 5
  });
};

// 2. HOOK YA BADGES (Zile nishani za mtumiaji)
export const useFetchBadges = () => {
  return useQuery({
    queryKey: ["my-badges"],
    queryFn: async () => {
      try {
        // Hapa tunagonga /api/passport/badges/
        const res = await apiClient.get("/api/passport/badges/");
        return res.data;
      } catch (error: any) {
        console.error("Badges Error:", error?.response?.data || error.message);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 10, // Badges hazibadiliki mara kwa mara
  });
};

// 3. HOOK YA AWARD POINTS (Pointi za Kilicare+)
export const useFetchAwardPoints = () => {
  return useQuery({
    queryKey: ["award-points"],
    queryFn: async () => {
      try {
        // Hapa tunagonga /api/passport/award-points/
        const res = await apiClient.get("/api/passport/award-points/");
        return res.data;
      } catch (error: any) {
        console.error("Points Error:", error?.response?.data || error.message);
        throw error;
      }
    },
    refetchOnWindowFocus: true, // I-refetch mtumiaji akirudi kwenye tab ili aone pointi mpya
  });
};