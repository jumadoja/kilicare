"use client";

import { Protected } from "@/hooks/Protected";
import AIPreviewSection from "@/features/dashboard/local/components/AIPreviewSection";
import KilicarePassportSection from "@/features/dashboard/local/components/KilicarePassportSection";
import MessagingSection from "@/features/dashboard/local/components/MessagingSection";
import MyExperiencesSection from "@/features/dashboard/local/components/MyExperiencesSection";
import MyMomentsSection from "@/features/dashboard/local/components/MyMomentsSection";
import MyTipsSection from "@/features/dashboard/local/components/MyTipsSection";
import ProfileSection from "@/features/dashboard/local/components/ProfileSection";

export default function Page() {
  return (
    <Protected requiredRole="LOCAL" requireVerified={true}>
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Column 1 */}
        <div className="space-y-6">
          <ProfileSection />
          <MyExperiencesSection />
        </div>

        {/* Column 2 */}
        <div className="space-y-6">
          <MyMomentsSection />
          <MyTipsSection />
        </div>

        {/* Column 3 */}
        <div className="space-y-6">
          <MessagingSection />
          <AIPreviewSection />
          <KilicarePassportSection />
        </div>

      </div>
    </Protected>
  );
}