'use client';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopBarProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  rightSlot?: React.ReactNode;
  transparent?: boolean;
  className?: string;
}

export function TopBar({
  title,
  subtitle,
  showBack = false,
  rightSlot,
  transparent = false,
  className,
}: TopBarProps) {
  const router = useRouter();

  return (
    <motion.header
      className={cn(
        'flex items-center gap-3 px-4 py-3 sticky top-0 z-30',
        !transparent && 'glass-strong border-b border-dark-border/40',
        'pt-safe',
        className,
      )}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Back button */}
      {showBack && (
        <motion.button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          whileHover={{ background: 'rgba(255,255,255,0.1)' }}
          whileTap={{ scale: 0.92 }}
        >
          <ArrowLeft size={18} className="text-text-primary" />
        </motion.button>
      )}

      {/* Title */}
      <div className="flex-1 min-w-0">
        {title && (
          <h1 className="text-base font-bold font-display text-text-primary truncate leading-tight">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="text-xs text-text-muted font-body truncate mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right slot */}
      {rightSlot && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {rightSlot}
        </div>
      )}
    </motion.header>
  );
}