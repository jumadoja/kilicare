"use client";

import React from "react";

interface MomentCardProps {
  id: number;
  title: string;
  description: string;
  likes_count: number;
  onLike: (id: number) => void;
}

export const MomentCard: React.FC<MomentCardProps> = ({
  id,
  title,
  description,
  likes_count,
  onLike,
}) => {
  return (
    <div className="card hover-scale">

      <h3 className="font-bold text-lg text-gray-900">
        {title}
      </h3>

      <p className="text-gray-700 mt-2">
        {description}
      </p>

      <button
        onClick={() => onLike(id)}
        className="btn-soft mt-4"
      >
        ❤️ {likes_count}
      </button>

    </div>
  );
};