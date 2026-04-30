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

      {/* ── Main content wrapper ── */}
      <motion.div
        className="relative z-10 w-full max-w-md md:max-w-lg mx-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo section */}
        <motion.div
          className="text-center mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <motion.div
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-2 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #F5A623, #D4891A)',
              boxShadow: '0 0 40px rgba(245,166,35,0.4)',
            }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="text-2xl font-black text-dark-bg font-display">K</span>
          </motion.div>

          <h1 className="text-2xl font-black font-display text-text-primary tracking-tight">
            Kilicare<span className="text-gradient-gold">+</span>
          </h1>
          <p className="text-text-muted text-xs mt-1 font-body">
            Discover Tanzania, Reimagined
          </p>

          <motion.div
            className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full"
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

        {/* ── Glass card ── */}
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
        >
          {/* Top gradient line */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(245,166,35,0.6), transparent)',
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

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              {/* Username field */}
              <div className="relative">
                <div className="relative">
                  <motion.label
                    className="absolute left-4 pointer-events-none font-body z-10 transition-all duration-200 ease-out px-2"
                    animate={{
                      top: focusedField === 'username' || watchUsername ? '5px' : '50%',
                      transform: focusedField === 'username' || watchUsername ? 'translateY(0)' : 'translateY(-50%)',
                      fontSize: focusedField === 'username' || watchUsername ? '11px' : '15px',
                      color: focusedField === 'username' ? '#F5A623' : '#8B8BA7',
                      backgroundColor: focusedField === 'username' || watchUsername ? '#1C1C27' : 'rgba(0, 0, 0, 0)',
                    }}
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
                      'w-full py-3 px-4 pt-5 rounded-xl font-body text-base',
                      'text-text-primary',
                      'bg-dark-elevated transition-all duration-200 outline-none border',
                      focusedField === 'username'
                        ? 'border-kili-gold shadow-glow-gold'
                        : errors.username
                        ? 'border-kili-sunset'
                        : 'border-dark-border hover:border-dark-border-light',
                    )}
                    style={{ height: '48px' }}
                  />
                </div>

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
                <div className="relative">
                  <motion.label
                    className="absolute left-4 pointer-events-none font-body z-10 transition-all duration-200 ease-out px-2"
                    animate={{
                      top: focusedField === 'password' || watchPassword ? '5px' : '50%',
                      transform: focusedField === 'password' || watchPassword ? 'translateY(0)' : 'translateY(-50%)',
                      fontSize: focusedField === 'password' || watchPassword ? '11px' : '15px',
                      color: focusedField === 'password' ? '#F5A623' : '#8B8BA7',
                      backgroundColor: focusedField === 'password' || watchPassword ? '#1C1C27' : 'rgba(0, 0, 0, 0)',
                    }}
                  >
                    Password
                  </motion.label>

                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className={cn(
                      'w-full py-3 px-4 pt-5 pr-12 rounded-xl font-body text-base',
                      'text-text-primary',
                      'bg-dark-elevated transition-all duration-200 outline-none border',
                      focusedField === 'password'
                        ? 'border-kili-gold shadow-glow-gold'
                        : errors.password
                        ? 'border-kili-sunset'
                        : 'border-dark-border hover:border-dark-border-light',
                    )}
                    style={{ height: '48px' }}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

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
            <p className="text-center text-text-muted text-xs mt-4 font-body">
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