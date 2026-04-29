'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff } from 'lucide-react';
import { useAppStore } from '@/store/app.store';

export function OfflineIndicator() {
  const { isOnline } = useAppStore();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 py-2 px-4"
          style={{
            background: 'rgba(232,69,69,0.95)',
            backdropFilter: 'blur(10px)',
          }}
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <WifiOff size={14} className="text-white" />
          <span className="text-white text-xs font-semibold font-body">
            Hakuna mtandao — baadhi ya vitu havitafanya kazi
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}