"use client";

import React from "react";
import { TipCard } from "@/features/tips/components/TipCard"; // ✅ named import

interface TipsPreviewProps {
  tips: {
    id: number;
    title: string;
    content: string;
    upvotes: number;
    category?: string;
  }[];
  onUpvote: (id: number) => void;
}

export const TipsPreview: React.FC<TipsPreviewProps> = ({ tips, onUpvote }) => {
  if (!tips || tips.length === 0) {
    return <p className="text-gray-500 text-center">No tips available.</p>;
  }

  return (
    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
      {tips.map((tip) => (
        <TipCard
          key={tip.id}
          id={tip.id}
          title={tip.title}
          content={tip.content}
          category={tip.category}
          upvotes={tip.upvotes}
          onUpvote={onUpvote}
        />
      ))}
    </div>
  );
};