'use client';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Compass, Shield, MessageCircle, Award,
  Map, Lightbulb, User, Settings, LogOut,
  ChevronLeft, ChevronRight, Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/app.store';
import { useAuthStore } from '@/store/auth.store';
import { useChatStore } from '@/store/chat.store';
import { useAuth } from '@/hooks/useAuth';
import { getInitials } from '@/lib/utils';
import { useState, useEffect } from 'react';

const NAV_ITEMS = [
  { href: '/feed', icon: Home, label: 'Feed', color: '#F5A623' },
  { href: '/discover', icon: Compass, label: 'Gundua', color: '#4A9EFF' },
  { href: '/map', icon: Map, label: 'Ramani', color: '#00E5A0' },
  { href: '/tips', icon: Lightbulb, label: 'Vidokezo', color: '#FFB84D' },
  { href: '/experiences', icon: Briefcase, label: 'Uzoefu', color: '#A855F7' },
  { href: '/chat', icon: MessageCircle, label: 'Ujumbe', color: '#4A9EFF' },
  { href: '/sos', icon: Shield, label: 'SOS Dharura', color: '#E84545' },
  { href: '/passport', icon: Award, label: 'Pasipoti', color: '#F5A623' },
  { href: '/profile', icon: User, label: 'Wasifu', color: '#8B8BA7' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const { user } = useAuthStore();
  const { unreadTotal } = useChatStore();
  const { logout, token } = useAuth();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const isAuthenticated = !!token;

  if (!isHydrated) return null;
  if (!isAuthenticated) return null;

  const W = sidebarOpen ? 260 : 72;

  return (
    <motion.aside
      className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-40"
      animate={{ width: W }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        background: 'rgba(13,13,20,0.95)',
        backdropFilter: 'blur(16px)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-8 w-6 h-6 rounded-full flex items-center justify-center z-50 transition-colors"
        style={{
          background: '#1C1C27',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {sidebarOpen
          ? <ChevronLeft size={12} className="text-text-muted" />
          : <ChevronRight size={12} className="text-text-muted" />
        }
      </button>

      {/* Logo */}
      <div className="flex items-center gap-3 p-4 mb-2 border-b border-dark-border/50">
        <motion.div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #F5A623, #D4891A)',
            boxShadow: '0 0 16px rgba(245,166,35,0.3)',
          }}
          whileHover={{ scale: 1.05 }}
        >
          <span className="text-base font-black text-dark-bg font-display">K</span>
        </motion.div>

        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <p className="font-black text-sm font-display text-text-primary leading-none">
                Kilicare<span className="text-gradient-gold">GO+</span>
              </p>
              <p className="text-[10px] text-text-muted font-body mt-0.5">
                Tanzania Tourism
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          const isChat = item.href === '/chat';
          const isSOS = item.href === '/sos';

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 relative',
                  'transition-colors duration-150 group',
                )}
                style={{
                  background: isActive
                    ? `rgba(${isSOS ? '232,69,69' : '245,166,35'},0.1)`
                    : 'transparent',
                  border: isActive
                    ? `1px solid rgba(${isSOS ? '232,69,69' : '245,166,35'},0.2)`
                    : '1px solid transparent',
                }}
                whileHover={{
                  background: isActive
                    ? undefined
                    : 'rgba(255,255,255,0.04)',
                }}
                whileTap={{ scale: 0.97 }}
              >
                {/* Active bar */}
                {isActive && (
                  <motion.div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                    style={{ background: isSOS ? '#E84545' : '#F5A623' }}
                    layoutId="activeBar"
                  />
                )}

                {/* Icon */}
                <div className="relative flex-shrink-0">
                  <Icon
                    size={18}
                    style={{
                      color: isActive ? item.color : '#8B8BA7',
                      filter: isActive && isSOS
                        ? 'drop-shadow(0 0 6px rgba(232,69,69,0.6))'
                        : isActive
                        ? 'drop-shadow(0 0 6px rgba(245,166,35,0.4))'
                        : 'none',
                    }}
                  />
                  {isChat && unreadTotal > 0 && (
                    <div
                      className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                      style={{ background: '#E84545' }}
                    >
                      <span className="text-[8px] font-bold text-white">
                        {unreadTotal > 9 ? '9+' : unreadTotal}
                      </span>
                    </div>
                  )}
                </div>

                {/* Label */}
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      className="text-sm font-medium font-body whitespace-nowrap"
                      style={{ color: isActive ? item.color : '#C8C8D8' }}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* SOS pulse */}
                {isSOS && (
                  <motion.div
                    className="absolute inset-0 rounded-xl"
                    style={{ border: '1px solid rgba(232,69,69,0.3)' }}
                    animate={{ opacity: [0.3, 0.8, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom: user + settings + logout */}
      <div className="p-2 border-t border-dark-border/50 space-y-1">
        {/* Settings */}
        <motion.button
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/5 transition-colors"
          whileTap={{ scale: 0.97 }}
        >
          <Settings size={18} className="text-text-muted flex-shrink-0" />
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                className="text-sm font-body text-text-muted"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              >
                Mipangilio
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Logout */}
        <motion.button
          onClick={logout}
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors"
          style={{ color: '#E84545' }}
          whileHover={{ background: 'rgba(232,69,69,0.08)' }}
          whileTap={{ scale: 0.97 }}
        >
          <LogOut size={18} className="flex-shrink-0" />
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                className="text-sm font-body"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              >
                Toka
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* User card */}
        {user && (
          <Link href="/profile">
            <motion.div
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 mt-1 cursor-pointer"
              style={{
                background: 'rgba(245,166,35,0.06)',
                border: '1px solid rgba(245,166,35,0.1)',
              }}
              whileHover={{ background: 'rgba(245,166,35,0.1)' }}
              whileTap={{ scale: 0.97 }}
            >
              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-dark-bg"
                style={{
                  background: user.profile?.avatar
                    ? 'transparent'
                    : 'linear-gradient(135deg, #F5A623, #D4891A)',
                }}
              >
                {user.profile?.avatar ? (
                  <img
                    src={user.profile.avatar}
                    alt={user.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="font-display">
                    {getInitials(user.username)}
                  </span>
                )}
              </div>

              <AnimatePresence>
                {sidebarOpen && (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                    className="min-w-0"
                  >
                    <p className="text-xs font-semibold text-text-primary font-body truncate">
                      {user.username}
                    </p>
                    <p className="text-[10px] text-text-muted font-body truncate">
                      @{user.username}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </Link>
        )}
      </div>
    </motion.aside>
  );
}