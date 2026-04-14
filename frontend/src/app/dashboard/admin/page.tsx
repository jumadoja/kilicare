"use client";

import UsersManagementSection from "@/features/dashboard/admin/components/UsersManagementSection";
import MonitorAISection from "@/features/dashboard/admin/components/MonitorAISection";
import ModerateTipsSection from "@/features/dashboard/admin/components/ModerateTipsSection";
import ContentAuditSection from "@/features/dashboard/admin/components/ContentAuditSection";
import KilicarePassportAuditSection from "@/features/dashboard/admin/components/KilicarePassportAuditSection";
import DirectChatSection from "@/features/dashboard/admin/components/DirectChatSection";

export default function Page() {
  return (
    <div className="p-6 space-y-6">

      <h1 className="text-3xl font-bold text-gray-800">🛠 Admin Dashboard</h1>

      {/* Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        <UsersManagementSection />
        <MonitorAISection />
      </div>

      {/* Row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        <ModerateTipsSection />
        <ContentAuditSection />
      </div>

      {/* Row 3 */}
      <div className="grid lg:grid-cols-2 gap-6">
        <KilicarePassportAuditSection />
        <DirectChatSection />
      </div>

    </div>
  );
}