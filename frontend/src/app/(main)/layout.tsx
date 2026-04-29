import { BottomNav } from '@/components/layout/BottomNav';
import { Sidebar } from '@/components/layout/Sidebar';
import { FloatingSOSButton } from '@/components/layout/FloatingSOSButton';
import { OfflineIndicator } from '@/components/layout/OfflineIndicator';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh bg-dark-bg">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 md:ml-[72px] relative">
        <OfflineIndicator />
        {children}
      </main>

      {/* Mobile nav */}
      <BottomNav />

      {/* Floating SOS button */}
      <FloatingSOSButton />
    </div>
  );
}