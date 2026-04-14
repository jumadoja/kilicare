"use client";

import React from "react";
import { TipCard } from "@/features/tips/components/TipCard"; // ✅ named import
import { Tip } from "../hooks/useTips";

interface TipsListProps {
  tips: Tip[];
  onUpvote: (id: number) => void;
}

export const TipsList: React.FC<TipsListProps> = ({ tips, onUpvote }) => {
  if (!tips || tips.length === 0) {
    return <p className="text-center text-gray-500">No tips available.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {tips.map((tip) => (
        <TipCard
          key={tip.id}
          id={tip.id}
          title={tip.title}
          content={tip.content}
          upvotes={tip.upvotes}
          onUpvote={onUpvote}
        />
      ))}
    </div>
  );
};