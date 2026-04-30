'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthButtonProps {
  children: React.ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary';
  className?: string;
}

export function AuthButton({
  children,
  isLoading = false,
  disabled = false,
  onClick,
  type = 'submit',
  variant = 'primary',
  className,
}: AuthButtonProps) {
  const isDisabled = disabled || isLoading;

  const baseStyles = 'w-full h-12 rounded-xl font-display font-bold text-dark-bg text-sm flex items-center justify-center gap-2 transition-all duration-200';
  
  const variantStyles = {
    primary: {
      background: 'linear-gradient(135deg, #F5A623, #D4891A)',
      boxShadow: isDisabled ? 'none' : '0 4px 20px rgba(245,166,35,0.35)',
    },
    secondary: {
      background: 'rgba(28, 28, 39, 0.8)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      color: '#F8F8FF',
      boxShadow: 'none',
    },
  };

  return (
    <motion.button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={cn(
        baseStyles,
        isDisabled && 'opacity-80 cursor-not-allowed',
        !isDisabled && 'hover:brightness-110',
        className
      )}
      style={variantStyles[variant]}
      whileHover={!isDisabled ? { scale: 1.01 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Loader2 size={18} className="animate-spin" />
            <span>Inashughulikia...</span>
          </motion.div>
        ) : (
          <motion.span
            key="text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
