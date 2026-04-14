"use client";

import React from "react";
import { MomentCard } from "./MomentCard";

interface MomentsListProps {
  moments: any[];
  onLike: (id: number) => void;
}

export const MomentsList: React.FC<MomentsListProps> = ({
  moments,
  onLike,
}) => {
  if (!moments || moments.length === 0) {
    return <p className="text-center text-gray-500">No moments found.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {moments.map((m) => (
        <MomentCard
          key={m.id}
          id={m.id}
          title={m.title}
          description={m.description}
          likes_count={m.likes_count}
          onLike={onLike}
        />
      ))}
    </div>
  );
};