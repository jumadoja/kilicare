'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useId, useState } from 'react';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';
import { getAvatarUrl } from '@/utils/media';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface KiliAvatarProps {
  src?: string | null;
  name?: string;
  size?: AvatarSize;
  trustScore?: number;
  showOnline?: boolean;
  isOnline?: boolean;
  className?: string;
  onClick?: () => void;
}

const sizeMap: Record<AvatarSize, {
  container: number;
  image: number;
  text: string;
  ring: number;
  online: string;
}> = {
  xs:  { container: 24, image: 22, text: 'text-[8px]',  ring: 1.5, online: 'w-2 h-2' },
  sm:  { container: 32, image: 30, text: 'text-[10px]', ring: 1.5, online: 'w-2.5 h-2.5' },
  md:  { container: 40, image: 38, text: 'text-xs',     ring: 2,   online: 'w-3 h-3' },
  lg:  { container: 52, image: 50, text: 'text-sm',     ring: 2,   online: 'w-3.5 h-3.5' },
  xl:  { container: 64, image: 62, text: 'text-base',   ring: 2.5, online: 'w-4 h-4' },
  '2xl': { container: 80, image: 76, text: 'text-xl',   ring: 3,   online: 'w-5 h-5' },
};

function getTrustRingColor(score: number): string {
  if (score >= 86) return 'url(#rainbowGradient)';
  if (score >= 61) return 'url(#goldSunsetGradient)';
  if (score >= 31) return '#F5A623';
  return '#4A4A5A';
}

export function KiliAvatar({
  src,
  name = '',
  size = 'md',
  trustScore,
  showOnline = false,
  isOnline = false,
  className,
  onClick,
}: KiliAvatarProps) {
  const s = sizeMap[size];
  const id = `avatar-${useId()}`;
  const [imageError, setImageError] = useState(false);
  
  // Handle avatar URL fallback
  const avatarSrc = getAvatarUrl(src);

  const content = (
    <div
      className={cn('relative inline-flex flex-shrink-0', className)}
      style={{ width: s.container, height: s.container }}
      onClick={onClick}
    >
      {/* Trust score ring */}
      {trustScore !== undefined && (
        <svg
          className="absolute inset-0"
          width={s.container}
          height={s.container}
          viewBox={`0 0 ${s.container} ${s.container}`}
        >
          <defs>
            <linearGradient id={`goldSunsetGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F5A623" />
              <stop offset="100%" stopColor="#E84545" />
            </linearGradient>
            <linearGradient id={`rainbowGradient-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F5A623" />
              <stop offset="33%" stopColor="#E84545" />
              <stop offset="66%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#4A9EFF" />
            </linearGradient>
          </defs>
          {/* Track */}
          <circle
            cx={s.container / 2}
            cy={s.container / 2}
            r={(s.container - s.ring * 2) / 2}
            fill="none"
            stroke="rgba(42,42,58,0.8)"
            strokeWidth={s.ring}
          />
          {/* Progress */}
          <motion.circle
            cx={s.container / 2}
            cy={s.container / 2}
            r={(s.container - s.ring * 2) / 2}
            fill="none"
            stroke={
              trustScore >= 86
                ? `url(#rainbowGradient-${id})`
                : trustScore >= 61
                ? `url(#goldSunsetGradient-${id})`
                : trustScore >= 31
                ? '#F5A623'
                : '#4A4A5A'
            }
            strokeWidth={s.ring}
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * ((s.container - s.ring * 2) / 2)}`}
            initial={{ strokeDashoffset: 2 * Math.PI * ((s.container - s.ring * 2) / 2) }}
            animate={{
              strokeDashoffset:
                2 * Math.PI * ((s.container - s.ring * 2) / 2) * (1 - trustScore / 100),
            }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
            transform={`rotate(-90 ${s.container / 2} ${s.container / 2})`}
          />
        </svg>
      )}

      {/* Avatar image/initials */}
      <div
        className={cn(
          'absolute rounded-full overflow-hidden flex items-center justify-center',
          'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
        )}
        style={{
          width: trustScore !== undefined ? s.image : s.container,
          height: trustScore !== undefined ? s.image : s.container,
          background: avatarSrc
            ? 'transparent'
            : 'linear-gradient(135deg, #F5A623, #D4891A)',
        }}
      >
        {avatarSrc && !imageError ? (
          <Image
            src={avatarSrc}
            alt={name}
            width={s.image}
            height={s.image}
            className="object-cover w-full h-full"
            onError={() => setImageError(true)}
          />
        ) : (
          <span
            className={cn('font-bold font-display text-dark-bg', s.text)}
          >
            {getInitials(name) || '?'}
          </span>
        )}
      </div>

      {/* Online indicator */}
      {showOnline && (
        <div
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2',
            s.online,
            isOnline ? 'bg-kili-green' : 'bg-text-disabled',
          )}
          style={{ borderColor: '#0A0A0F' }}
        />
      )}
    </div>
  );

  if (onClick) {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="cursor-pointer"
      >
        {content}
      </motion.div>
    );
  }

  return content;
}