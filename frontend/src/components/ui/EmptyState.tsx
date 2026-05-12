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
      className="flex flex-col items-center justify-center py-12 md:py-20 px-6 md:px-12 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="text-4xl md:text-6xl mb-4 md:mb-6"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {icon}
      </motion.div>

      <h3 className="text-base md:text-xl font-bold font-display text-text-primary mb-2 md:mb-3">
        {title}
      </h3>

      <p className="text-sm md:text-base text-text-muted font-body leading-relaxed max-w-sm md:max-w-md mb-6 md:mb-8">
        {subtitle}
      </p>

      {actionLabel && onAction && (
        <KiliButton
          variant="primary"
          size="md"
          onClick={onAction}
          className="w-full md:w-auto"
        >
          {actionLabel}
        </KiliButton>
      )}
    </motion.div>
  );
}