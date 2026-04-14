"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchSavedTrips } from "@/services/api";

export const useFetchSavedTrips = () => {
  return useQuery({
    queryKey: ["tourist-saved-trips"],
    queryFn: fetchSavedTrips,
  });
};