'use client';
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
      onChange,
      id,
      ...props
    },
    ref
  ) => {
    const [showPwd, setShowPwd] = useState(false);
    const generatedId = useId();

    const currentValue = String(value ?? '');
    const hasValue = currentValue.length > 0;
    const inputType = showPasswordToggle
      ? showPwd ? 'text' : 'password'
      : type;

    // Generate unique IDs for ARIA relationships (deterministic across SSR/client)
    const inputId = id || `input-${label.replace(/\s+/g, '-').toLowerCase()}-${generatedId}`;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
    };

    return (
      <div className="relative w-full">
        {/* Label above input */}
        <label
          htmlFor={inputId}
          className={cn(
            "block font-body text-sm mb-1.5",
            error ? "text-kili-sunset" : "text-text-primary"
          )}
        >
          {label}
        </label>

        <div className="relative">
          {/* Left icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 text-text-muted">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={inputType}
            value={value}
            onChange={handleChange}
            onFocus={(e) => {
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              props.onBlur?.(e);
            }}
            placeholder={props.placeholder || label}
            aria-label={label}
            aria-describedby={cn(
              error && errorId,
              hint && !error && hintId
            ) || undefined}
            aria-invalid={!!error}
            aria-required={props.required || false}
            className={cn(
              'w-full rounded-xl font-body text-sm text-text-primary',
              'bg-dark-elevated transition-all duration-150 ease outline-none',
              'border',
              leftIcon ? 'pl-10' : 'pl-4',
              showPasswordToggle || rightElement ? 'pr-12' : 'pr-4',
              'py-3',
              'focus-visible:ring-2 focus-visible:ring-kili-gold focus-visible:ring-offset-2 focus-visible:ring-offset-dark-bg',
              'border-dark-border hover:border-dark-border-light',
              'focus:border-kili-gold focus:shadow-glow-gold',
              error && 'border-kili-sunset',
              'placeholder:text-text-muted/50',
              className,
            )}
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
        </div>

        {/* Error message */}
        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-kili-sunset text-xs mt-1 ml-1 font-body transition-opacity duration-150 ease"
          >
            {error}
          </p>
        )}

        {/* Hint */}
        {hint && !error && (
          <p id={hintId} className="text-text-muted text-xs mt-1 ml-1 font-body">{hint}</p>
        )}
      </div>
    );
  }
);

KiliInput.displayName = 'KiliInput';