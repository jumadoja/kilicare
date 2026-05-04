'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Loader2, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { useFocusManagement } from '@/hooks/useFocusManagement';
import { loginSchema, LoginInput } from '@/lib/validators';
import { cn } from '@/lib/utils';
import { KiliInput } from '@/components/ui/KiliInput';

export default function LoginPage() {
  const { login, isLoggingIn } = useAuth();

  const { saveFormState, clearFormState, handleSuccess, isRestored } = useFormPersistence<LoginInput>({
    formKey: 'login',
    initialValues: { username: '', password: '' },
    storageType: 'sessionStorage',
    clearOnSuccess: true,
    onRestore: (data) => {
      // Restore form fields only if empty
      const currentUsername = (document.querySelector('input[name="username"]') as HTMLInputElement)?.value;
      const currentPassword = (document.querySelector('input[name="password"]') as HTMLInputElement)?.value;
      
      if (data.username && !currentUsername) setValue('username', data.username);
      if (data.password && !currentPassword) setValue('password', data.password);
    },
  });

  const { focusOnError } = useFocusManagement({
    autoFocusSelector: 'input[name="username"]',
    enableFocusOnError: true,
    restoreOnMount: false,
  }) as { focusOnError: () => void };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  // Focus on first error when validation fails
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      focusOnError();
    }
  }, [errors, focusOnError]);

  const onSubmit = (data: LoginInput) => {
    // Save form state on submit
    saveFormState(data);
    login(data);
    // Clear form state on successful submission (handled by useAuth onSuccess)
    // We'll clear it in a useEffect when we detect successful navigation
  };

  // Clear form state when user navigates away (success indicator)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Don't clear on refresh, only on successful navigation
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return (
    <div className="relative min-h-[var(--app-height)] w-full overflow-hidden flex items-center justify-center safe-container">
      {/* Background Visual Layer */}

      {/* ── Main content wrapper ── */}
      <div className="relative z-10 w-full max-w-md md:max-w-lg lg:max-w-xl mx-4">
        {/* Logo section */}
        <div className="text-center mb-6">
          <div
            className="inline-flex items-center justify-center mb-4"
          >
            <div
              className="relative p-4 rounded-3xl glass"
              style={{
                background: 'linear-gradient(145deg, rgba(245,166,35,0.15), rgba(0,229,160,0.1))',
                border: '1px solid rgba(245,166,35,0.3)',
                boxShadow: '0 8px 32px rgba(245,166,35,0.2), 0 0 0 1px rgba(245,166,35,0.1), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
            >
              <img
                src="/kilicare-logo.png"
                alt="Kilicare Logo"
                className="relative h-20 w-auto"
                style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }}
              />
            </div>
          </div>

          <h1 className="text-3xl font-black font-display text-text-primary tracking-tight mb-2">
            Kilicare<span className="text-gradient-gold">+</span>
          </h1>
        </div>

        {/* ── Glass card ── */}
        <div
          className="relative rounded-3xl overflow-hidden pb-safe glass-auth"
          style={{
            boxShadow: '0 32px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,166,35,0.05)',
          }}
        >
          {/* Top gradient line */}
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(245,166,35,0.8), rgba(0,229,160,0.6), transparent)',
            }}
          />

          <div className="p-6">
            <div className="mb-4">
              <h2 className="text-lg font-bold font-display text-text-primary">
                Karibu tena 👋
              </h2>
              <p className="text-text-muted text-xs mt-1">
                Ingia kwenye akaunti yako
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {/* Username field */}
              <KiliInput
                {...register('username')}
                label="Username"
                error={errors.username?.message}
                type="text"
                autoComplete="username"
              />

              {/* Password field */}
              <KiliInput
                {...register('password')}
                label="Password"
                error={errors.password?.message}
                type="password"
                showPasswordToggle
                autoComplete="current-password"
              />

              {/* Forgot password link with animated underline */}
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="group relative text-xs text-kili-gold transition-colors font-body"
                >
                  Umesahau password?
                  <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-kili-gold transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoggingIn}
                className={cn(
                  'w-full h-12 rounded-xl font-display font-bold text-dark-bg text-sm',
                  'relative overflow-hidden transition-all duration-200',
                  isLoggingIn ? 'opacity-80 cursor-not-allowed' : 'hover:brightness-110',
                  'transition-transform duration-150 ease hover:scale-[1.01] active:scale-[0.98]',
                )}
                style={{
                  background: 'linear-gradient(135deg, #F5A623, #D4891A)',
                  boxShadow: isLoggingIn ? 'none' : '0 4px 20px rgba(245,166,35,0.35)',
                }}
              >
                {isLoggingIn ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    <span>Inaingia...</span>
                  </div>
                ) : (
                  <span>Ingia</span>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-dark-border" />
              <span className="text-text-disabled text-xs font-body">au endelea na</span>
              <div className="flex-1 h-px bg-dark-border" />
            </div>


            {/* Register link */}
            <div className="mt-6 pt-4 border-t border-dark-border text-center">
              <p className="text-text-muted text-sm font-body">
                Huna akaunti?{' '}
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1 text-kili-gold hover:text-kili-gold-light font-semibold transition-all duration-200 hover:underline hover:underline-offset-4"
                >
                  Jisajili hapa
                  <span>→</span>
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom text */}
        <p className="text-center text-text-disabled text-[10px] mt-4 font-body">
          Kwa kuingia, unakubali{' '}
          <span className="text-kili-gold/70 cursor-pointer hover:text-kili-gold">Masharti ya Matumizi</span>
          {' '}na{' '}
          <span className="text-kili-gold/70 cursor-pointer hover:text-kili-gold">Sera ya Faragha</span>
        </p>
      </div>
    </div>
  );
}