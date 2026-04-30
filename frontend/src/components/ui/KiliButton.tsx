'use client';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
type Size = 'sm' | 'md' | 'lg' | 'xl';

interface KiliButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, {
  base: string;
  style: React.CSSProperties;
  hoverStyle?: React.CSSProperties;
}> = {
  primary: {
    base: 'text-dark-bg font-bold',
    style: {
      background: 'linear-gradient(135deg, #F5A623, #D4891A)',
      boxShadow: '0 4px 20px rgba(245,166,35,0.3)',
      border: 'none',
    },
  },
  secondary: {
    base: 'text-kili-gold font-semibold',
    style: {
      background: 'transparent',
      border: '1px solid rgba(245,166,35,0.4)',
    },
  },
  danger: {
    base: 'text-white font-bold',
    style: {
      background: 'linear-gradient(135deg, #E84545, #C73535)',
      boxShadow: '0 4px 20px rgba(232,69,69,0.3)',
      border: 'none',
    },
  },
  ghost: {
    base: 'text-text-secondary font-medium',
    style: {
      background: 'transparent',
      border: '1px solid rgba(255,255,255,0.08)',
    },
  },
  success: {
    base: 'text-dark-bg font-bold',
    style: {
      background: 'linear-gradient(135deg, #00E5A0, #00C47A)',
      boxShadow: '0 4px 20px rgba(0,229,160,0.3)',
      border: 'none',
    },
  },
};

const sizeStyles: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
  md: 'h-10 px-4 text-sm rounded-xl gap-2',
  lg: 'h-12 px-6 text-sm rounded-xl gap-2',
  xl: 'h-14 px-8 text-base rounded-xl gap-2',
};

export const KiliButton = forwardRef<HTMLButtonElement, KiliButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const vStyle = variantStyles[variant];
    const isDisabled = disabled || loading;

    return (
      <motion.button
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center font-body',
          'transition-all duration-200 select-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kili-gold focus-visible:ring-offset-2 focus-visible:ring-offset-dark-bg',
          sizeStyles[size],
          vStyle.base,
          fullWidth && 'w-full',
          isDisabled && 'opacity-50 cursor-not-allowed',
          className,
        )}
        style={vStyle.style}
        disabled={isDisabled}
        aria-busy={loading}
        aria-disabled={isDisabled}
        whileHover={!isDisabled ? { scale: 1.01 } : {}}
        whileTap={!isDisabled ? { scale: 0.97 } : {}}
        {...(props as React.ComponentProps<typeof motion.button>)}
      >
        {loading ? (
          <>
            <Loader2 size={size === 'sm' ? 12 : 16} className="animate-spin" />
            <span>{children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children && <span>{children}</span>}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </motion.button>
    );
  }
);

KiliButton.displayName = 'KiliButton';