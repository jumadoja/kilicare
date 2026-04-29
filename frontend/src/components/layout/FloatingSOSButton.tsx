'use client';
import { motion } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { Shield } from 'lucide-react';
import { tokenManager } from '@/core/auth/tokenManager';

export function FloatingSOSButton() {
  const router = useRouter();
  const pathname = usePathname();

  // Hide on SOS page and auth pages
  const shouldHide =
    !tokenManager.isAuthenticated() ||
    pathname.startsWith('/sos') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password');

  if (shouldHide) return null;

  return (
    <motion.button
      className="fixed bottom-24 right-4 z-40 md:hidden w-12 h-12 rounded-full flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #E84545, #C73535)',
        boxShadow: '0 0 20px rgba(232,69,69,0.4), 0 4px 12px rgba(0,0,0,0.3)',
      }}
      onClick={() => router.push('/sos')}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, delay: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      {/* Pulse rings */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ border: '2px solid rgba(232,69,69,0.5)' }}
        animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ border: '2px solid rgba(232,69,69,0.3)' }}
        animate={{ scale: [1, 1.9, 1], opacity: [0.4, 0, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
      />

      <Shield size={18} color="white" />
    </motion.button>
  );
}