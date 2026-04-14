"use client";
import { useFetchMoments } from "@/features/dashboard/hooks/useFetchMoments";
import { likeMoment } from "@/services/api";

export default function KilicareMomentsSection() {
  const { data, refetch } = useFetchMoments();

  return (
    <div className="space-y-4">
      {data?.map((m: any) => (
        <div key={m.id} className="card hover-scale p-4">
          <h3 className="font-bold">{m.user}</h3>
          <p>{m.content}</p>
          <div className="flex gap-4 mt-2 text-sm">
            <button
              onClick={async () => {
                await likeMoment(m.id);
                refetch();
              }}
              className="btn-soft"
            >
              ❤️ {m.likes}
            </button>
            <span>💬 {m.comments_count}</span>
          </div>
        </div>
      ))}
    </div>
  );
}