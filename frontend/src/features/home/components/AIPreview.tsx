"use client";

import { useState } from "react";
import { askAI } from "@/services/api";

export const AIPreview = () => {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!query.trim()) return;

    try {
      setLoading(true);
      const res = await askAI(query);
      setResponse(res.reply || res.response);
    } catch {
      setResponse("⚠️ Failed to get AI response.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass p-6">

      <h2 className="section-title">🤖 Ask Kilicare AI</h2>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask about travel, safety, places..."
        className="input mb-3"
      />

      <button
        onClick={handleAsk}
        className="btn-primary w-full"
      >
        {loading ? "Thinking..." : "Ask AI"}
      </button>

      {response && (
        <div className="mt-4 p-3 bg-gray-50 rounded-xl">
          <p className="text-sm">{response}</p>
        </div>
      )}

    </div>
  );
};