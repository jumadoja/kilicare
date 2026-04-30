'use client';
import { motion } from 'framer-motion';
import { useId } from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  fullScreen?: boolean;
}

const sizeMap = {
  sm: 24,
  md: 40,
  lg: 56,
  xl: 72,
};

export function LoadingSpinner({
  size = 'md',
  text,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const s = sizeMap[size];
  const r = s / 2 - 4;
  const circumference = 2 * Math.PI * r;
  const gradientId = `spinner-${useId()}`;

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: s, height: s }}>
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className="animate-spin-slow">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F5A623" stopOpacity="0" />
              <stop offset="50%" stopColor="#F5A623" stopOpacity="1" />
              <stop offset="100%" stopColor="#E84545" stopOpacity="1" />
            </linearGradient>
          </defs>
          <circle
            cx={s / 2} cy={s / 2} r={r}
            fill="none"
            stroke="rgba(42,42,58,0.6)"
            strokeWidth="3"
          />
          <circle
            cx={s / 2} cy={s / 2} r={r}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${circumference * 0.7} ${circumference * 0.3}`}
            transform={`rotate(-90 ${s / 2} ${s / 2})`}
          />
        </svg>

        {/* Center dot */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: '#F5A623' }}
          />
        </motion.div>
      </div>

      {text && (
        <motion.p
          className="text-xs text-text-muted font-body"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-bg/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
}