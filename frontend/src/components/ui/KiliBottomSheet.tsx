'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KiliBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: 'auto' | 'half' | 'full' | '70';
  showHandle?: boolean;
  className?: string;
}

const heightMap = {
  auto: 'max-h-[90dvh]',
  half: 'h-[50dvh]',
  '70': 'h-[70dvh]',
  full: 'h-[90dvh]',
};

export function KiliBottomSheet({
  isOpen,
  onClose,
  title,
  children,
  height = 'auto',
  showHandle = true,
  className,
}: KiliBottomSheetProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden',
              'flex flex-col pb-safe',
              heightMap[height],
              className,
            )}
            style={{
              background: 'rgba(19,19,26,0.97)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderBottom: 'none',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Top gradient line */}
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{
                background:
                  'linear-gradient(90deg, rgba(255,255,255,0), rgba(245,166,35,0.4), rgba(232,69,69,0.3), rgba(255,255,255,0))',
              }}
            />

            {/* Handle */}
            {showHandle && (
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div
                  className="w-10 h-1 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.15)' }}
                />
              </div>
            )}

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-5 py-3 border-b border-dark-border/50 flex-shrink-0">
                <h3 className="font-bold font-display text-text-primary text-base">
                  {title}
                </h3>
                <motion.button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                  whileHover={{ background: 'rgba(255,255,255,0.1)' }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={16} className="text-text-muted" />
                </motion.button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}