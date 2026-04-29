'use client';
import { motion } from 'framer-motion';
import { KiliButton } from './KiliButton';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 px-8 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="text-5xl mb-4"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {icon}
      </motion.div>

      <h3 className="text-lg font-bold font-display text-text-primary mb-2">
        {title}
      </h3>

      <p className="text-sm text-text-muted font-body leading-relaxed max-w-xs mb-6">
        {subtitle}
      </p>

      {actionLabel && onAction && (
        <KiliButton
          variant="primary"
          size="md"
          onClick={onAction}
        >
          {actionLabel}
        </KiliButton>
      )}
    </motion.div>
  );
}