"use client";
import { useState } from "react";
import { askAI } from "@/services/api";
import { toast } from "react-hot-toast";

export default function AIChatSection() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const sendQuery = async () => {
    if (!query.trim()) return;
    try {
      setLoading(true);
      const res = await askAI(query);
      setResponse(res.response || res.reply);
    } catch {
      toast.error("AI failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass p-4">
      <h2 className="section-title">🤖 AI Assistant</h2>
      <input
        className="input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask AI about experiences..."
      />
      <button
        onClick={sendQuery}
        className="btn-primary w-full mt-3"
      >
        {loading ? "Thinking..." : "Ask"}
      </button>
      {response && <p className="mt-4">{response}</p>}
    </div>
  );
}