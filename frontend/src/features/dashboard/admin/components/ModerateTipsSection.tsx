"use client";
import { useTips } from "@/features/dashboard/hooks/useFetchTips";
import { upvoteTip } from "@/services/api";
import { toast } from "react-hot-toast";

export default function ModerateTipsSection() {
  const { data, refetch } = useTips();

  return (
    <div className="glass p-4">
      <h2 className="section-title">⚖️ Moderate Tips</h2>
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {data?.map((tip: any) => (
          <div
            key={tip.id}
            className="flex justify-between items-center p-2 rounded-xl hover:bg-gray-50"
          >
            <span>{tip.title}</span>
            <button
              className="btn-secondary btn-sm"
              onClick={async () => {
                try {
                  await upvoteTip(tip.id);
                  refetch();
                } catch {
                  toast.error("Failed");
                }
              }}
            >
              Approve 👍
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}