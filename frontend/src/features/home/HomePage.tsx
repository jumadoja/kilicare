"use client";

import React from "react";
import { Hero } from "./components/Hero";
import { TipsPreview } from "./components/TipsPreview";
import { MomentsPreview } from "./components/MomentsPreview";
import { AIPreview } from "./components/AIPreview";

import { useTips } from "@/features/tips/hooks/useTips";
import { useMoments } from "@/features/moments/hooks/useMoments";

export const HomePage: React.FC = () => {
  const { tips, isLoading: loadingTips, upvote } = useTips();
  const { moments, isLoading: loadingMoments, like } = useMoments();

  return (
    <div className="space-y-12">

      {/* 🔥 HERO */}
      <Hero />

      {/* 💡 TIPS */}
      <section>
        <h2 className="text-3xl font-bold text-blue-600 mb-4">
          Latest Tips
        </h2>

        {loadingTips ? (
          <p className="text-gray-500 animate-pulse">Loading tips...</p>
        ) : (
          <TipsPreview tips={tips} onUpvote={upvote} />
        )}
      </section>

      {/* 🌍 MOMENTS */}
      <section>
        <h2 className="text-3xl font-bold text-purple-600 mb-4">
          Trending Moments
        </h2>

        {loadingMoments ? (
          <p className="text-gray-500 animate-pulse">Loading moments...</p>
        ) : (
          <MomentsPreview moments={moments} onLike={like} />
        )}
      </section>

      {/* 🤖 AI */}
      <section>
        <h2 className="text-3xl font-bold text-green-600 mb-4">
          Ask Kilicare AI
        </h2>

        <AIPreview />
      </section>

    </div>
  );
};