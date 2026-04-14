"use client";
import { useState } from "react";
import { useFetchChatHistory } from "@/features/dashboard/hooks/useChatQueries";
import { sendMessage } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "react-hot-toast";

export default function MessagingSection() {
  const { data, refetch } = useFetchChatHistory(null);
  const user = useAuthStore((s) => s.user);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    try {
      setSending(true);
      const receiverId =
        data?.[0]?.sender === user?.id ? data?.[0]?.receiver : data?.[0]?.sender;
      await sendMessage(receiverId, message);
      setMessage("");
      refetch();
      toast.success("Sent");
    } catch {
      toast.error("Failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="glass flex flex-col h-[420px] p-4">
      <h2 className="section-title">💬 Messages</h2>
      <div className="flex-1 overflow-y-auto space-y-2 mb-3">
        {data?.map((msg: any) => {
          const isMe = msg.sender === user?.id;
          return (
            <div
              key={msg.id}
              className={`p-2 rounded-xl max-w-[75%] text-sm ${
                isMe
                  ? "bg-green-600 text-white ml-auto"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {msg.content}
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        <input
          className="input flex-1"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button onClick={handleSend} className="btn-primary">
          {sending ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}