'use client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

type GlowColor = 'gold' | 'red' | 'green' | 'blue' | 'none';

interface KiliCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: GlowColor;
  gradient?: boolean;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  as?: 'div' | 'article' | 'section';
}

const glowStyles: Record<GlowColor, string> = {
  gold: '0 0 24px rgba(245,166,35,0.2)',
  red: '0 0 24px rgba(232,69,69,0.2)',
  green: '0 0 24px rgba(0,229,160,0.2)',
  blue: '0 0 24px rgba(74,158,255,0.2)',
  none: '0 4px 24px rgba(0,0,0,0.4)',
};

const glowBorder: Record<GlowColor, string> = {
  gold: 'rgba(245,166,35,0.2)',
  red: 'rgba(232,69,69,0.2)',
  green: 'rgba(0,229,160,0.2)',
  blue: 'rgba(74,158,255,0.2)',
  none: 'rgba(255,255,255,0.05)',
};

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export const KiliCard = forwardRef<HTMLDivElement, KiliCardProps>(
  (
    {
      glow = 'none',
      gradient = false,
      hoverable = false,
      padding = 'md',
      children,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const cardStyle: React.CSSProperties = {
      background: gradient
        ? 'linear-gradient(135deg, rgba(28,28,39,0.8) 0%, rgba(19,19,26,0.8) 100%)'
        : 'rgba(19,19,26,0.8)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: `1px solid ${glowBorder[glow]}`,
      boxShadow: glowStyles[glow],
      borderRadius: '16px',
      ...style,
    };

    if (hoverable) {
      return (
        <motion.div
          ref={ref}
          className={cn(paddingStyles[padding], 'relative overflow-hidden', className)}
          style={cardStyle}
          whileHover={{
            scale: 1.01,
            boxShadow: glowStyles[glow].replace('0.2', '0.4'),
            y: -2,
          }}
          whileTap={{ scale: 0.99 }}
          transition={{ duration: 0.2 }}
          {...(props as any)}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(paddingStyles[padding], 'relative overflow-hidden', className)}
        style={cardStyle}
        {...props}
      >
        {children}
      </div>
    );
  }
);

KiliCard.displayName = 'KiliCard';