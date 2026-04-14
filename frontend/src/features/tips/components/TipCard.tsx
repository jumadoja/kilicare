"use client";

import React from "react";

export interface TipCardProps {
  id: number;
  title: string;
  content: string;
  upvotes: number;
  category?: string;
  onUpvote: (id: number) => void;
}

export const TipCard: React.FC<TipCardProps> = ({ id, title, content, upvotes, category, onUpvote }) => {
  return (
    <div className="p-4 border rounded shadow">
      <h3 className="font-bold text-lg">{title}</h3>
      {category && <p className="text-sm text-gray-500">{category}</p>}
      <p className="my-2">{content}</p>
      <button
        onClick={() => onUpvote(id)}
        className="px-2 py-1 bg-green-500 text-white rounded"
      >
        Upvote ({upvotes})
      </button>
    </div>
  );
};