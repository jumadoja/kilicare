'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema, LoginInput } from '@/lib/validators';
import { cn } from '@/lib/utils';
import { TravelVisualLayer } from '@/components/TravelVisualLayer';

export default function LoginPage() {
  const { login, isLoggingIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const watchUsername = watch('username', '');
  const watchPassword = watch('password', '');

  const onSubmit = (data: LoginInput) => {
    login(data);
  };

  return (
    <div className="relative min-h-dvh w-full overflow-hidden flex items-center justify-center">
      {/* Background Visual Layer */}
      <TravelVisualLayer />

      {/* ── Main content wrapper ── */}
      <motion.div
        className="relative z-10 w-full max-w-md md:max-w-lg mx-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo section */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #F5A623, #D4891A)',
              boxShadow: '0 0 40px rgba(245,166,35,0.4)',
            }}
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-3xl font-black text-dark-bg font-display">K</span>
          </motion.div>

          <h1 className="text-3xl font-black font-display text-text-primary tracking-tight">
            Kilicare<span className="text-gradient-gold">+</span>
          </h1>
          <p className="text-text-muted text-sm mt-1 font-body">
            Discover Tanzania, Reimagined
          </p>

          <motion.div
            className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full"
            style={{
              background: 'rgba(245,166,35,0.08)',
              border: '1px solid rgba(245,166,35,0.2)',
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <MapPin size={11} className="text-kili-gold" />
            <span className="text-kili-gold text-xs font-medium">Tanzania 🇹🇿</span>
          </motion.div>
        </motion.div>

        {/* ── Glass card with Floating Hover ── */}
        <motion.div
          className="relative rounded-3xl overflow-hidden"
          style={{
            background: 'rgba(19, 19, 26, 0.85)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          whileHover={{ y: -8, transition: { duration: 0.3, ease: "easeOut" } }}
        >
          {/* Top gradient line */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(245,166,35,0.5), rgba(232,69,69,0.3), transparent)',
            }}
          />

          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold font-display text-text-primary">
                Karibu tena 👋
              </h2>
              <p className="text-text-muted text-sm mt-1">
                Ingia kwenye akaunti yako
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Username field */}
              <div className="relative">
                <motion.div
                  className="relative"
                  animate={{
                    scale: focusedField === 'username' ? 1.01 : 1,
                  }}
                  transition={{ duration: 0.15 }}
                >
                  <motion.label
                    className="absolute left-4 pointer-events-none font-body z-10"
                    animate={{
                      top: focusedField === 'username' || watchUsername ? '6px' : '50%',
                      translateY: focusedField === 'username' || watchUsername ? '0%' : '-50%',
                      fontSize: focusedField === 'username' || watchUsername ? '11px' : '15px',
                      color: focusedField === 'username' ? '#F5A623' : '#8B8BA7',
                    }}
                    transition={{ duration: 0.15 }}
                  >
                    Username
                  </motion.label>

                  <input
                    {...register('username')}
                    type="text"
                    autoComplete="username"
                    onFocus={() => setFocusedField('username')}
                    onBlur={() => setFocusedField(null)}
                    className={cn(
                      'w-full py-3 px-4 rounded-xl font-body text-base',
                      focusedField === 'username' ? 'text-text-primary' : 'text-text-primary',
                      'bg-dark-elevated transition-all duration-200 outline-none border',
                      focusedField === 'username'
                        ? 'border-kili-blue shadow-glow-blue bg-[#0A2A3A] scale-[1.01]'
                        : errors.username
                        ? 'border-kili-sunset'
                        : 'border-dark-border hover:border-dark-border-light',
                    )}
                    style={{ minHeight: '52px' }}
                  />
                </motion.div>

                <AnimatePresence>
                  {errors.username && (
                    <motion.p
                      className="text-kili-sunset text-xs mt-1 ml-1 font-body"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      {errors.username.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Password field */}
              <div className="relative">
                <motion.div
                  className="relative"
                  animate={{ scale: focusedField === 'password' ? 1.01 : 1 }}
                  transition={{ duration: 0.15 }}
                >
                  <motion.label
                    className="absolute left-4 pointer-events-none font-body z-10"
                    animate={{
                      top: focusedField === 'password' || watchPassword ? '6px' : '50%',
                      translateY: focusedField === 'password' || watchPassword ? '0%' : '-50%',
                      fontSize: focusedField === 'password' || watchPassword ? '11px' : '15px',
                      color: focusedField === 'password' ? '#F5A623' : '#8B8BA7',
                    }}
                    transition={{ duration: 0.15 }}
                  >
                    Password
                  </motion.label>

                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className={cn(
                      'w-full py-3 px-4 pr-12 rounded-xl font-body text-base',
                      focusedField === 'password' ? 'text-text-primary' : 'text-text-primary',
                      'bg-dark-elevated transition-all duration-200 outline-none border',
                      focusedField === 'password'
                        ? 'border-kili-blue shadow-glow-blue bg-[#0A2A3A] scale-[1.01]'
                        : errors.password
                        ? 'border-kili-sunset'
                        : 'border-dark-border hover:border-dark-border-light',
                    )}
                    style={{ minHeight: '52px' }}
                  />

                  <motion.button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                    whileHover={{ scale: 1.1, color: '#F5A623' }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </motion.button>
                </motion.div>

                <AnimatePresence>
                  {errors.password && (
                    <motion.p
                      className="text-kili-sunset text-xs mt-1 ml-1 font-body"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      {errors.password.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

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
                  'w-full h-14 rounded-xl font-display font-bold text-dark-bg text-base',
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
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-dark-border" />
              <span className="text-text-disabled text-xs font-body">au endelea na</span>
              <div className="flex-1 h-px bg-dark-border" />
            </div>

            {/* Social buttons */}
            <div className="grid grid-cols-2 gap-3">
              {['Google', 'Apple'].map((provider) => (
                <motion.button
                  key={provider}
                  type="button"
                  disabled
                  className="h-11 rounded-xl border border-dark-border bg-dark-elevated text-text-disabled text-sm font-body cursor-not-allowed opacity-50 flex items-center justify-center gap-2"
                  whileHover={{ opacity: 0.6 }}
                >
                  <span>{provider === 'Google' ? '🌐' : '🍎'}</span>
                  <span>{provider}</span>
                </motion.button>
              ))}
            </div>

            {/* Register link with animated underline */}
            <p className="text-center text-text-muted text-sm mt-6 font-body">
              Huna akaunti?{' '}
              <Link
                href="/register"
                className="group relative text-kili-gold font-semibold transition-colors"
              >
                Jisajili hapa
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-kili-gold transition-all duration-300 group-hover:w-full"></span>
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Bottom text */}
        <motion.p
          className="text-center text-text-disabled text-xs mt-6 font-body"
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