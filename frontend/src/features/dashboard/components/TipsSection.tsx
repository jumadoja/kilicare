"use client";
import { useTips } from "@/features/dashboard/hooks/useFetchTips";
import { upvoteTip } from "@/services/api";
import { toast } from "react-hot-toast";

export default function TipsSection() {
  const { data, refetch } = useTips();

  return (
    <div className="space-y-4">
      {data?.map((tip: any) => (
        <div key={tip.id} className="card hover-scale p-4">
          <h3 className="font-semibold">{tip.title}</h3>
          <p>{tip.description}</p>
          <button
            className="btn-secondary mt-2"
            onClick={async () => {
              try {
                await upvoteTip(tip.id);
                refetch();
              } catch {
                toast.error("Failed");
              }
            }}
          >
            👍 {tip.upvotes}
          </button>
        </div>
      ))}
    </div>
  );
}