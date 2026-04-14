"use client";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/api";

export const useFetchExperiences = () => {
  return useQuery({
    // queryKey inabaki hivi hivi kwa ajili ya caching
    queryKey: ["experiences-today"], 
    queryFn: async () => {
      try {
        // FIX: Tumeongeza /api/ mwanzo ili iendane na urls.py ya Django
        // Hii sasa hivi itaita: http://127.0.0.1:8000/api/experiences/today-near-me/
        const res = await apiClient.get("/api/experiences/today-near-me/");
        
        // Tunarudisha data (orodha ya experiences kutoka kwa Locals)
        return res.data;
      } catch (error) {
        console.error("Error fetching experiences:", error);
        throw error;
      }
    },
    // Inakaa "fresh" kwa dakika 5 ili kupunguza mzigo kwenye server
    staleTime: 1000 * 60 * 5, 
  });
};