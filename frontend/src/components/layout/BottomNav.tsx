'use client';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Shield, MessageCircle, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/store/chat.store';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';

const NAV_ITEMS = [
  { href: '/feed', icon: Home, label: 'Feed' },
  { href: '/discover', icon: Compass, label: 'Gundua' },
  { href: '/sos', icon: Shield, label: 'SOS', isSOS: true },
  { href: '/chat', icon: MessageCircle, label: 'Ujumbe' },
  { href: '/passport', icon: Award, label: 'Pasipoti' },
];

export function BottomNav() {
  const pathname = usePathname();
  const { unreadTotal } = useChatStore();
  const { token } = useAuth();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const isAuthenticated = !!token;

  if (!isHydrated) return null;
  if (!isAuthenticated) return null;

  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Blur background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(10,10,15,0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      />

      <div className="relative flex items-center justify-around px-2 h-16">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          if (item.isSOS) {
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center -mt-5">
                <motion.div
                  className="w-14 h-14 rounded-full flex items-center justify-center relative"
                  style={{
                    background: 'linear-gradient(135deg, #E84545, #C73535)',
                    boxShadow: '0 0 20px rgba(232,69,69,0.5), 0 4px 12px rgba(0,0,0,0.4)',
                  }}
                  whileTap={{ scale: 0.92 }}
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(232,69,69,0.5)',
                      '0 0 35px rgba(232,69,69,0.8)',
                      '0 0 20px rgba(232,69,69,0.5)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Icon size={22} color="white" />
                </motion.div>
                <span className="text-[9px] font-semibold mt-1 font-body"
                  style={{ color: '#E84545' }}>
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link key={item.href} href={item.href}
              className="flex flex-col items-center gap-1 px-3 py-1 relative">
              <motion.div
                className="relative"
                whileTap={{ scale: 0.85 }}
                animate={{ y: isActive ? -2 : 0 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <Icon
                  size={20}
                  style={{ color: isActive ? '#F5A623' : '#8B8BA7' }}
                />

                {/* Unread badge for chat */}
                {item.href === '/chat' && unreadTotal > 0 && (
                  <motion.div
                    className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full flex items-center justify-center px-1"
                    style={{ background: '#E84545' }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <span className="text-[9px] font-bold text-white font-mono">
                      {unreadTotal > 99 ? '99+' : unreadTotal}
                    </span>
                  </motion.div>
                )}
              </motion.div>

              <span
                className="text-[10px] font-medium font-body transition-colors duration-200"
                style={{ color: isActive ? '#F5A623' : '#8B8BA7' }}
              >
                {item.label}
              </span>

              {/* Active dot */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    className="absolute -bottom-1 w-1 h-1 rounded-full"
                    style={{ background: '#F5A623' }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  />
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}