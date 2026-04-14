"use client";
import { useFetchTips } from "@/features/dashboard/hooks/useFetchTips";

export default function ContentAuditSection() {
  const { data } = useFetchTips();

  return (
    <div className="glass p-4">
      <h2 className="section-title">📝 Content Audit</h2>
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {data?.map((tip: any) => (
          <div
            key={tip.id}
            className="flex justify-between items-center p-2 rounded-xl hover:bg-gray-50"
          >
            <span>{tip.title}</span>
            <span className="badge-success">{tip.upvotes} 👍</span>
          </div>
        ))}
      </div>
    </div>
  );
}