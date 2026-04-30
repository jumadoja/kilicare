'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
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
  });

  const { focusOnError } = useFocusManagement({
    autoFocusSelector: 'input[name="username"]',
    enableFocusOnError: true,
  }) as { focusOnError: () => void };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
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


  // Watch form values for persistence
  const formValues = watch();

  // Restore form state on mount
  useEffect(() => {
    if (isRestored) {
      if (typeof window === 'undefined') return;
      try {
        const saved = window.sessionStorage.getItem('form_login');
        if (saved) {
          const parsed = JSON.parse(saved);
          const { _timestamp, ...formData } = parsed;
          if (formData.username) setValue('username', formData.username);
          if (formData.password) setValue('password', formData.password);
        }
      } catch (error) {
        console.error('[LoginPage] Failed to restore form state:', error);
      }
    }
  }, [isRestored, setValue]);

  // Save form state on change
  useEffect(() => {
    if (isRestored && (formValues.username || formValues.password)) {
      saveFormState(formValues);
    }
  }, [formValues, isRestored, saveFormState]);

  const onSubmit = (data: LoginInput) => {
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
      <motion.div
        className="relative z-10 w-full max-w-md md:max-w-lg lg:max-w-xl mx-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ willChange: 'transform, opacity' }}
      >
        {/* Logo section */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <motion.div
            className="inline-flex items-center justify-center mb-4"
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, type: 'spring', stiffness: 200 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div
              className="relative p-4 rounded-3xl glass"
              style={{
                background: 'linear-gradient(145deg, rgba(245,166,35,0.15), rgba(0,229,160,0.1))',
                border: '1px solid rgba(245,166,35,0.3)',
                boxShadow: '0 8px 32px rgba(245,166,35,0.2), 0 0 0 1px rgba(245,166,35,0.1), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
            >
              {/* Inner glow effect */}
              <div
                className="absolute inset-0 rounded-3xl pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at 30% 30%, rgba(245,166,35,0.2), transparent 60%)',
                }}
              />
              <img
                src="/kilicare-logo.png"
                alt="Kilicare Logo"
                className="relative h-20 w-auto"
                style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }}
              />
            </div>
          </motion.div>

          <motion.h1
            className="text-3xl font-black font-display text-text-primary tracking-tight mb-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Kilicare<span className="text-gradient-gold">+</span>
          </motion.h1>
        </motion.div>

        {/* ── Glass card ── */}
        <motion.div
          className="relative rounded-3xl overflow-hidden pb-safe glass-auth"
          style={{
            boxShadow: '0 32px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,166,35,0.05)',
          }}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
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
              <motion.button
                type="submit"
                disabled={isLoggingIn}
                className={cn(
                  'w-full h-12 rounded-xl font-display font-bold text-dark-bg text-sm',
                  'relative overflow-hidden transition-all duration-200',
                  isLoggingIn ? 'opacity-80 cursor-not-allowed' : 'hover:brightness-110',
                )}
                style={{
                  background: 'linear-gradient(135deg, #F5A623, #D4891A)',
                  boxShadow: isLoggingIn ? 'none' : '0 4px 20px rgba(245,166,35,0.35)',
                }}
                whileHover={!isLoggingIn ? { scale: 1.01 } : {}}
                whileTap={!isLoggingIn ? { scale: 0.98 } : {}}
              >
                <AnimatePresence mode="wait">
                  {isLoggingIn ? (
                    <motion.div
                      key="loading"
                      className="flex items-center justify-center gap-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Loader2 size={18} className="animate-spin" />
                      <span>Inaingia...</span>
                    </motion.div>
                  ) : (
                    <motion.span
                      key="text"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      Ingia
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-dark-border" />
              <span className="text-text-disabled text-xs font-body">au endelea na</span>
              <div className="flex-1 h-px bg-dark-border" />
            </div>

            {/* Social buttons */}
            <div className="grid grid-cols-2 gap-3">
              {['Google', 'Apple'].map((provider) => (
                <div key={provider} className="relative">
                  <motion.button
                    type="button"
                    disabled
                    className="w-full h-10 rounded-xl border border-dark-border bg-dark-elevated text-text-muted text-xs font-body cursor-not-allowed opacity-60 flex items-center justify-center gap-2"
                  >
                    <span>{provider === 'Google' ? '🌐' : '🍎'}</span>
                    <span>{provider}</span>
                  </motion.button>
                  <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-kili-gold/20 border border-kili-gold/30 text-[9px] font-semibold text-kili-gold">
                    Soon
                  </span>
                </div>
              ))}
            </div>

            {/* Register link with animated underline */}
            <motion.div
              className="mt-6 pt-4 border-t border-dark-border text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-text-muted text-sm font-body">
                Huna akaunti?{' '}
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1 text-kili-gold hover:text-kili-gold-light font-semibold transition-all duration-200 hover:underline hover:underline-offset-4"
                >
                  Jisajili hapa
                  <motion.span
                    initial={{ x: 0 }}
                    whileHover={{ x: 3 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    →
                  </motion.span>
                </Link>
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom text */}
        <motion.p
          className="text-center text-text-disabled text-[10px] mt-4 font-body"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Kwa kuingia, unakubali{' '}
          <span className="text-kili-gold/70 cursor-pointer hover:text-kili-gold">Masharti ya Matumizi</span>
          {' '}na{' '}
          <span className="text-kili-gold/70 cursor-pointer hover:text-kili-gold">Sera ya Faragha</span>
        </motion.p>
      </motion.div>
    </div>
  );
}