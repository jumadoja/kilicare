import { TravelVisualLayer } from '@/components/TravelVisualLayer';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-auth-page className="relative min-h-[var(--app-height)]">
      <TravelVisualLayer />
      {children}
    </div>
  );
}