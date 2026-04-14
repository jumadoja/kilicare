"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchUserMoments } from "@/services/api";

export default function KilicarePassportAuditSection() {
  const { data } = useQuery({
    queryKey: ["passport-audit"],
    queryFn: async () => await fetchUserMoments(0), // userId=0 for admin view
  });

  return (
    <div className="glass p-4">
      <h2 className="section-title">🏅 Passport Audit</h2>
      <div className="space-y-2">
        {data?.map((badge: any) => (
          <div key={badge.id} className="flex justify-between">
            <span>{badge.name}</span>
            <span className="badge-success">{badge.criteria_points} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
}