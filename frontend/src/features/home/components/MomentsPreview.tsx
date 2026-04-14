"use client";

import { MomentsList } from "@/features/moments/components/MomentsList";

interface MomentsPreviewProps {
  moments: any[];
  onLike: (id: number) => void;
}

export const MomentsPreview: React.FC<MomentsPreviewProps> = ({
  moments,
  onLike,
}) => {
  if (!moments || moments.length === 0) {
    return <p className="text-gray-500">No moments found.</p>;
  }

  return <MomentsList moments={moments} onLike={onLike} />;
};