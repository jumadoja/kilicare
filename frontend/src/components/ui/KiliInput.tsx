'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { forwardRef, useState, useId } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KiliInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  showPasswordToggle?: boolean;
}

export const KiliInput = forwardRef<HTMLInputElement, KiliInputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightElement,
      showPasswordToggle = false,
      type = 'text',
      className,
      value,
      defaultValue,
      onChange,
      id,
      ...props
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false);
    const [showPwd, setShowPwd] = useState(false);
    const [internalValue, setInternalValue] = useState(defaultValue ?? '');
    const generatedId = useId();

    const isControlled = value !== undefined;
    const currentValue = isControlled ? String(value ?? '') : String(internalValue);
    const hasValue = currentValue.length > 0;
    const inputType = showPasswordToggle
      ? showPwd ? 'text' : 'password'
      : type;

    // Generate unique IDs for ARIA relationships (deterministic across SSR/client)
    const inputId = id || `input-${label.replace(/\s+/g, '-').toLowerCase()}-${generatedId}`;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) setInternalValue(e.target.value);
      onChange?.(e);
    };

    return (
      <div className="relative w-full">
        <motion.div
          className="relative"
        >
          {/* Left icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 text-text-muted">
              {leftIcon}
            </div>
          )}

          {/* Floating label */}
          <motion.label
            htmlFor={inputId}
            className="absolute pointer-events-none font-body z-10"
            animate={{
              left: leftIcon ? '40px' : '16px',
              top: '50%',
              transform: focused || hasValue
                ? 'translateY(-1.5rem) scale(0.85)'
                : 'translateY(-50%)',
              fontSize: focused || hasValue ? '10px' : '14px',
              color: focused
                ? '#F5A623'
                : error
                ? '#E84545'
                : '#8B8BA7',
            }}
            transition={{ duration: 0.15 }}
          >
            {label}
          </motion.label>

          <input
            ref={ref}
            id={inputId}
            type={inputType}
            value={isControlled ? value : internalValue}
            onChange={handleChange}
            onFocus={(e) => {
              setFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              props.onBlur?.(e);
            }}
            aria-label={label}
            aria-describedby={cn(
              error && errorId,
              hint && !error && hintId
            ) || undefined}
            aria-invalid={!!error}
            aria-required={props.required || false}
            className={cn(
              'w-full rounded-xl font-body text-sm text-text-primary',
              'bg-dark-elevated transition-all duration-200 outline-none',
              'border',
              leftIcon ? 'pl-10' : 'pl-4',
              showPasswordToggle || rightElement ? 'pr-12' : 'pr-4',
              'pt-6 pb-2',
              'focus-visible:ring-2 focus-visible:ring-kili-gold focus-visible:ring-offset-2 focus-visible:ring-offset-dark-bg',
              focused
                ? 'border-kili-gold shadow-glow-gold'
                : error
                ? 'border-kili-sunset'
                : hasValue
                ? 'border-dark-border-light'
                : 'border-dark-border hover:border-dark-border-light',
              className,
            )}
            style={{ minHeight: 'clamp(48px, 6vh, 56px)' }}
            {...props}
          />

          {/* Right element / password toggle */}
          {(showPasswordToggle || rightElement) && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
              {showPasswordToggle ? (
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                  aria-pressed={showPwd}
                  className="text-text-muted hover:text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-kili-gold rounded"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              ) : (
                rightElement
              )}
            </div>
          )}
        </motion.div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.p
              id={errorId}
              role="alert"
              className="text-kili-sunset text-xs mt-1 ml-1 font-body"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Hint */}
        {hint && !error && (
          <p id={hintId} className="text-text-muted text-xs mt-1 ml-1 font-body">{hint}</p>
        )}
      </div>
    );
  }
);

KiliInput.displayName = 'KiliInput';