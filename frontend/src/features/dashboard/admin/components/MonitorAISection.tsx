"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchAILogs } from "@/services/api";

export default function MonitorAISection() {
  const { data } = useQuery({
    queryKey: ["ai-logs"],
    queryFn: fetchAILogs,
  });

  return (
    <div className="glass p-4">
      <h2 className="section-title">🤖 AI Logs</h2>
      <div className="space-y-2 max-h-[300px] overflow-y-auto text-sm">
        {data?.map((log: any) => (
          <div key={log.id} className="p-2 rounded-xl hover:bg-gray-50">
            <span className="font-medium">{log.user}</span>: {log.query}
          </div>
        ))}
      </div>
    </div>
  );
}