import { redirect } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[var(--app-height)] bg-dark-bg">
      {children}
    </div>
  );
}