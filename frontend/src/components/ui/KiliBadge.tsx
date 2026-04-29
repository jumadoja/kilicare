'use client';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';
import { UserRole, UserLevel } from '@/types';
import { TipCategory, SOSSeverity } from '@/types';

type BadgeVariant =
  | UserRole
  | UserLevel
  | TipCategory
  | SOSSeverity
  | 'verified'
  | 'featured'
  | 'trending';

type BadgeSize = 'xs' | 'sm' | 'md';

interface KiliBadgeProps {
  variant: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

const badgeConfig: Record<string, {
  label: string;
  bg: string;
  color: string;
  border: string;
}> = {
  // Roles
  TOURIST: {
    label: 'Msafiri',
    bg: 'rgba(74,158,255,0.12)',
    color: '#4A9EFF',
    border: 'rgba(74,158,255,0.3)',
  },
  LOCAL_GUIDE: {
    label: 'Kiongozi',
    bg: 'rgba(245,166,35,0.12)',
    color: '#F5A623',
    border: 'rgba(245,166,35,0.3)',
  },
  ADMIN: {
    label: 'Admin',
    bg: 'rgba(168,85,247,0.12)',
    color: '#A855F7',
    border: 'rgba(168,85,247,0.3)',
  },
  // Levels
  EXPLORER: {
    label: '🧭 Explorer',
    bg: 'rgba(74,158,255,0.1)',
    color: '#4A9EFF',
    border: 'rgba(74,158,255,0.25)',
  },
  ADVENTURER: {
    label: '⚡ Adventurer',
    bg: 'rgba(245,166,35,0.1)',
    color: '#F5A623',
    border: 'rgba(245,166,35,0.25)',
  },
  GUARDIAN: {
    label: '🛡️ Guardian',
    bg: 'rgba(168,85,247,0.1)',
    color: '#A855F7',
    border: 'rgba(168,85,247,0.25)',
  },
  LEGEND: {
    label: '👑 Legend',
    bg: 'rgba(232,69,69,0.1)',
    color: '#FF6B6B',
    border: 'rgba(232,69,69,0.3)',
  },
  // Categories
  SAFETY: {
    label: '🛡️ Usalama',
    bg: 'rgba(232,69,69,0.1)',
    color: '#E84545',
    border: 'rgba(232,69,69,0.25)',
  },
  LIFESTYLE: {
    label: '✨ Maisha',
    bg: 'rgba(0,229,160,0.1)',
    color: '#00E5A0',
    border: 'rgba(0,229,160,0.25)',
  },
  NAVIGATION: {
    label: '🗺️ Mwelekeo',
    bg: 'rgba(74,158,255,0.1)',
    color: '#4A9EFF',
    border: 'rgba(74,158,255,0.25)',
  },
  EXPERIENCE: {
    label: '🌟 Uzoefu',
    bg: 'rgba(245,166,35,0.1)',
    color: '#F5A623',
    border: 'rgba(245,166,35,0.25)',
  },
  ACCESSIBILITY: {
    label: '♿ Ufikivu',
    bg: 'rgba(0,229,160,0.1)',
    color: '#00C47A',
    border: 'rgba(0,229,160,0.25)',
  },
  // SOS Severity
  LOW: {
    label: 'Chini',
    bg: 'rgba(74,158,255,0.1)',
    color: '#4A9EFF',
    border: 'rgba(74,158,255,0.25)',
  },
  MEDIUM: {
    label: 'Wastani',
    bg: 'rgba(255,183,0,0.1)',
    color: '#FFB700',
    border: 'rgba(255,183,0,0.25)',
  },
  HIGH: {
    label: 'Juu',
    bg: 'rgba(255,119,0,0.1)',
    color: '#FF7700',
    border: 'rgba(255,119,0,0.25)',
  },
  CRITICAL: {
    label: '🚨 Hatari',
    bg: 'rgba(232,69,69,0.15)',
    color: '#E84545',
    border: 'rgba(232,69,69,0.4)',
  },
  // Special
  verified: {
    label: '✓ Imehakikishwa',
    bg: 'rgba(0,229,160,0.1)',
    color: '#00E5A0',
    border: 'rgba(0,229,160,0.3)',
  },
  featured: {
    label: '⭐ Featured',
    bg: 'rgba(245,166,35,0.12)',
    color: '#F5A623',
    border: 'rgba(245,166,35,0.3)',
  },
  trending: {
    label: '🔥 Inayoongoza',
    bg: 'rgba(232,69,69,0.1)',
    color: '#FF6B6B',
    border: 'rgba(232,69,69,0.25)',
  },
};

const sizeStyles: Record<BadgeSize, string> = {
  xs: 'text-[9px] px-1.5 py-0.5 rounded-md',
  sm: 'text-[10px] px-2 py-0.5 rounded-lg',
  md: 'text-xs px-2.5 py-1 rounded-lg',
};

export function KiliBadge({ variant, size = 'sm', className }: KiliBadgeProps) {
  const config = badgeConfig[variant];
  if (!config) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold font-body whitespace-nowrap',
        sizeStyles[size],
        className,
      )}
      style={{
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
      }}
    >
      {variant === 'verified' && (
        <CheckCircle2 size={9} className="mr-1 flex-shrink-0" />
      )}
      {config.label}
    </span>
  );
}