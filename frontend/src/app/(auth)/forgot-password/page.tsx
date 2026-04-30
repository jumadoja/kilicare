'use client';
import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Loader2, Mail, KeyRound, CheckCircle2, RefreshCw } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authService } from '@/services/auth.service';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { useFocusManagement } from '@/hooks/useFocusManagement';
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '@/lib/validators';
import { parseApiError } from '@/core/errors';
import { cn } from '@/lib/utils';
import { KiliInput } from '@/components/ui/KiliInput';

// ── OTP Input component ──────────────────────────────
function OTPInput({
  value,
  onChange,
  hasError,
}: {
  value: string;
  onChange: (val: string) => void;
  hasError: boolean;
}) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.split('').concat(Array(6).fill('')).slice(0, 6);
  const otpId = 'otp-input-group';

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = [...digits];
      if (next[i]) {
        next[i] = '';
        onChange(next.join(''));
      } else if (i > 0) {
        next[i - 1] = '';
        onChange(next.join(''));
        inputs.current[i - 1]?.focus();
      }
    }
  };

  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = val;
    onChange(next.join(''));
    if (val && i < 5) {
      inputs.current[i + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted.padEnd(6, '').slice(0, 6));
    const focusIdx = Math.min(pasted.length, 5);
    inputs.current[focusIdx]?.focus();
  };

  return (
    <div 
      role="group"
      aria-label="One-time password input"
      aria-describedby={hasError ? 'otp-error' : undefined}
      className="flex gap-3 justify-center"
    >
      {digits.map((digit, i) => (
        <motion.input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          id={`${otpId}-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          aria-label={`OTP digit ${i + 1} of 6`}
          aria-invalid={hasError}
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          className={cn(
            'w-10 h-12 text-center text-lg font-bold font-mono rounded-xl',
            'text-text-primary outline-none transition-all duration-200',
            'border bg-dark-elevated',
            'focus-visible:ring-2 focus-visible:ring-kili-gold focus-visible:ring-offset-2 focus-visible:ring-offset-dark-bg',
            digit
              ? hasError
                ? 'border-kili-sunset shadow-glow-red'
                : 'border-kili-gold shadow-glow-gold text-kili-gold'
              : 'border-dark-border hover:border-dark-border-light focus:border-kili-gold focus:shadow-glow-gold',
          )}
          animate={{
            scale: digit ? [1, 1.1, 1] : 1,
          }}
          transition={{ duration: 0.2 }}
        />
      ))}
    </div>
  );
}

// ── Countdown timer ──────────────────────────────────
function Countdown({
  seconds,
  onDone,
}: {
  seconds: number;
  onDone: () => void;
}) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
    const t = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) { clearInterval(t); onDone(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [seconds, onDone]);

  const pct = (remaining / seconds) * 100;

  return (
    <div className="flex items-center gap-2 justify-center">
      <div className="relative w-8 h-8">
        <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="13" fill="none" stroke="#2A2A3A" strokeWidth="2.5" />
          <circle
            cx="16" cy="16" r="13"
            fill="none"
            stroke="#F5A623"
            strokeWidth="2.5"
            strokeDasharray={`${2 * Math.PI * 13}`}
            strokeDashoffset={`${2 * Math.PI * 13 * (1 - pct / 100)}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-mono text-kili-gold font-bold">
          {remaining}
        </span>
      </div>
      <span className="text-sm text-text-muted font-body">
        Tuma tena kwa sekunde {remaining}
      </span>
    </div>
  );
}

// ── Main page ────────────────────────────────────────
type Step = 'email' | 'otp' | 'password' | 'success';

export default function ForgotPasswordPage() {
  const { saveFormState, clearFormState, handleSuccess, isRestored } = useFormPersistence<{
    emailOrPhone: string;
    username: string;
    step: Step;
  }>({
    formKey: 'forgot-password',
    initialValues: { emailOrPhone: '', username: '', step: 'email' },
    storageType: 'sessionStorage',
    clearOnSuccess: true,
  });

  const { focusOnError } = useFocusManagement({
    autoFocusSelector: 'input[name="email_or_phone"]',
    enableFocusOnError: true,
  }) as { focusOnError: () => void };

  const [step, setStep] = useState<Step>('email');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  // Restore form state on mount
  useEffect(() => {
    if (isRestored) {
      if (typeof window === 'undefined') return;
      try {
        const saved = window.sessionStorage.getItem('form_forgot-password');
        if (saved) {
          const parsed = JSON.parse(saved);
          const { _timestamp, ...formData } = parsed;
          if (formData.emailOrPhone) setEmailOrPhone(formData.emailOrPhone);
          if (formData.username) setUsername(formData.username);
          if (formData.step && ['email', 'otp', 'password', 'success'].includes(formData.step)) {
            setStep(formData.step as Step);
          }
        }
      } catch (error) {
        console.error('[ForgotPasswordPage] Failed to restore form state:', error);
      }
    }
  }, [isRestored]);

  // Save form state on change
  useEffect(() => {
    if (isRestored) {
      saveFormState({ emailOrPhone, username, step });
    }
  }, [emailOrPhone, username, step, isRestored, saveFormState]);

  // Email form
  const emailForm = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  // Password reset form
  const pwdForm = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Focus on first error when validation fails
  useEffect(() => {
    const hasEmailErrors = Object.keys(emailForm.formState.errors).length > 0;
    const hasPwdErrors = Object.keys(pwdForm.formState.errors).length > 0;
    if (hasEmailErrors || hasPwdErrors) {
      focusOnError();
    }
  }, [emailForm.formState.errors, pwdForm.formState.errors, focusOnError]);

  const watchPwd = pwdForm.watch('new_password', '');

  // Mutations
  const forgotMutation = useMutation({
    mutationFn: (data: ForgotPasswordInput) => authService.forgotPassword(data),
    onSuccess: () => {
      setStep('otp');
      setCanResend(false);
      toast.success('Namba ya uthibitisho imetumwa! 📧');
    },
    onError: (e) => toast.error(parseApiError(e)),
  });

  const resetMutation = useMutation({
    mutationFn: (data: { email_or_phone: string; otp: string; new_password: string }) =>
      authService.resetPassword(data),
    onSuccess: () => {
      setStep('success');
      handleSuccess(); // Clear form state on success
      toast.success('Password imebadilishwa! 🎉');
    },
    onError: (e) => {
      toast.error(parseApiError(e));
      setOtpError(true);
      setStep('otp');
    },
  });

  const onEmailSubmit = (data: ForgotPasswordInput) => {
    setEmailOrPhone(data.email_or_phone);
    setUsername(data.username);
    forgotMutation.mutate(data);
  };

  const verifyOtp = () => {
    if (otp.length < 6) {
      setOtpError(true);
      toast.error('Ingiza namba 6 zote');
      return;
    }
    setOtpError(false);
    setStep('password');
  };

  const onPasswordSubmit = (data: ResetPasswordInput) => {
    resetMutation.mutate({
      email_or_phone: emailOrPhone,
      otp,
      new_password: data.new_password,
    });
  };

  const stepConfig: Record<Step, { icon: React.ReactNode; title: string; subtitle: string }> = {
    email: {
      icon: <Mail size={20} className="text-kili-gold" />,
      title: 'Rejesha password yako',
      subtitle: 'Tutakutumia namba ya tarakimu 6 kwenye barua pepe yako.',
    },
    otp: {
      icon: <KeyRound size={20} className="text-kili-gold" />,
      title: 'Ingiza Namba ya Siri',
      subtitle: `Namba imetumwa kwa ${emailOrPhone}`,
    },
    password: {
      icon: <KeyRound size={20} className="text-kili-gold" />,
      title: 'Password Mpya',
      subtitle: 'Weka password mpya salama',
    },
    success: {
      icon: <CheckCircle2 size={20} className="text-kili-green" />,
      title: 'Imebadilishwa! 🎉',
      subtitle: 'Password yako mpya iko tayari',
    },
  };

  const currentConfig = stepConfig[step];

  return (
    <div className="relative min-h-[var(--app-height)] w-full overflow-hidden flex items-center justify-center safe-container">
      <motion.div
        className="relative z-10 w-full max-w-md md:max-w-lg lg:max-w-xl mx-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ willChange: 'transform, opacity' }}
      >
        {/* Card */}
        <motion.div
          className="relative rounded-3xl overflow-hidden pb-safe glass-strong"
          style={{
            boxShadow: '0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          {/* Top gradient line */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background: step === 'success'
                ? 'linear-gradient(90deg, transparent, rgba(0,229,160,0.6), transparent)'
                : 'linear-gradient(90deg, transparent, rgba(245,166,35,0.6), transparent)',
            }}
          />

          <div className="p-6">
            {/* Back button inside card */}
            <motion.div
              className="mb-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-dark-elevated transition-all duration-200 font-body text-sm"
                style={{
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              >
                <ArrowLeft size={14} />
                Rudi Login
              </Link>
            </motion.div>

            {/* Header */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step + '-header'}
                className="mb-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
              >
                {/* Icon */}
                <motion.div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{
                    background: step === 'success'
                      ? 'rgba(0,229,160,0.12)'
                      : 'rgba(245,166,35,0.1)',
                    border: step === 'success'
                      ? '1px solid rgba(0,229,160,0.3)'
                      : '1px solid rgba(245,166,35,0.2)',
                  }}
                  animate={step === 'success' ? {
                    scale: [1, 1.05, 1],
                  } : {}}
                  transition={{ duration: 0.5 }}
                >
                  {currentConfig.icon}
                </motion.div>

                <h2 className="text-lg font-black font-display text-text-primary tracking-tight">
                  {currentConfig.title}
                </h2>
                <p className="text-text-muted text-xs mt-1 font-body">
                  {currentConfig.subtitle}
                </p>

                {step !== 'success' && (
                  <div className="flex gap-2 mt-4">
                    {(['email', 'otp', 'password'] as Step[]).map((s) => {
                      const allSteps = ['email', 'otp', 'password'];
                      const isActive = s === step;
                      const currentStepIndex = allSteps.indexOf(step as string);
                      const isDone = currentStepIndex !== -1 && allSteps.indexOf(s) < currentStepIndex;
                      return (
                        <motion.div
                          key={s}
                          className="h-1 rounded-full"
                          style={{
                            background: isActive
                              ? 'linear-gradient(90deg, #F5A623, #D4891A)'
                              : isDone
                                ? '#00E5A0'
                                : '#2A2A3A',
                          }}
                          animate={{
                            width: isActive ? 24 : 8,
                          }}
                          transition={{ duration: 0.3 }}
                        />
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Content */}
            <AnimatePresence mode="wait">

              {/* ── Email step ── */}
              {step === 'email' && (
                <motion.form
                  key="email-form"
                  onSubmit={emailForm.handleSubmit(onEmailSubmit)}
                  className="space-y-4"
                  noValidate
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3 }}
                >
                  <KiliInput
                    {...emailForm.register('email_or_phone')}
                    label="Barua pepe au namba ya simu"
                    error={emailForm.formState.errors.email_or_phone?.message}
                    type="text"
                    autoComplete="email"
                  />

                  <KiliInput
                    {...emailForm.register('username')}
                    label="Username wako"
                    error={emailForm.formState.errors.username?.message}
                    type="text"
                    autoComplete="username"
                  />

                  {/* Info box */}
                  <div
                    className="p-2.5 rounded-xl flex items-start gap-2"
                    style={{
                      background: 'rgba(245,166,35,0.06)',
                      border: '1px solid rgba(245,166,35,0.15)',
                    }}
                  >
                    <Mail size={12} className="text-kili-gold mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] text-text-muted font-body leading-relaxed">
                      Tutakutumia namba ya tarakimu 6 kwenye barua pepe yako. Angalia pia folda ya spam.
                    </p>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={forgotMutation.isPending}
                    className={cn(
                      'w-full h-12 rounded-xl font-display font-bold text-dark-bg text-sm',
                      'flex items-center justify-center gap-2',
                      forgotMutation.isPending && 'opacity-80 cursor-not-allowed',
                    )}
                    style={{
                      background: 'linear-gradient(135deg, #F5A623, #D4891A)',
                      boxShadow: forgotMutation.isPending ? 'none' : '0 4px 20px rgba(245,166,35,0.35)',
                    }}
                    whileHover={!forgotMutation.isPending ? { scale: 1.01 } : {}}
                    whileTap={!forgotMutation.isPending ? { scale: 0.98 } : {}}
                  >
                    <AnimatePresence mode="wait">
                      {forgotMutation.isPending ? (
                        <motion.div key="loading" className="flex items-center gap-2"
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <Loader2 size={18} className="animate-spin" />
                          <span>Inatuma...</span>
                        </motion.div>
                      ) : (
                        <motion.span key="text"
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          Tuma Namba ya Uthibitisho
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </motion.form>
              )}

              {/* ── OTP step ── */}
              {step === 'otp' && (
                <motion.div
                  key="otp-form"
                  className="space-y-4"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Email sent confirmation */}
                  <motion.div
                    className="flex items-center gap-2 p-2.5 rounded-xl"
                    style={{
                      background: 'rgba(0,229,160,0.06)',
                      border: '1px solid rgba(0,229,160,0.2)',
                    }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <CheckCircle2 size={14} className="text-kili-green flex-shrink-0" />
                    <p className="text-[11px] text-text-secondary font-body">
                      Namba imetumwa kwa <span className="text-kili-green font-semibold">{emailOrPhone}</span>
                    </p>
                  </motion.div>

                  {/* OTP inputs */}
                  <div>
                    <p className="text-center text-xs text-text-muted font-body mb-3">
                      Ingiza namba 6 uliyopokea
                    </p>
                    <OTPInput
                      value={otp}
                      onChange={(val) => { setOtp(val); setOtpError(false); }}
                      hasError={otpError}
                    />
                    <AnimatePresence>
                      {otpError && (
                        <motion.p
                          id="otp-error"
                          role="alert"
                          className="text-center text-kili-sunset text-xs mt-3 font-body"
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                        >
                          Namba si sahihi. Jaribu tena.
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Resend */}
                  <div className="text-center">
                    {canResend ? (
                      <motion.button
                        type="button"
                        onClick={() => {
                          forgotMutation.mutate({ email_or_phone: emailOrPhone, username });
                          setCanResend(false);
                        }}
                        className="inline-flex items-center gap-2 text-kili-gold hover:text-kili-gold-light transition-colors text-sm font-semibold font-body"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <RefreshCw size={14} />
                        Tuma tena
                      </motion.button>
                    ) : (
                      <Countdown
                        seconds={60}
                        onDone={() => setCanResend(true)}
                      />
                    )}
                  </div>

                  <motion.button
                    type="button"
                    onClick={verifyOtp}
                    disabled={otp.length < 6}
                    className={cn(
                      'w-full h-12 rounded-xl font-display font-bold text-dark-bg text-sm',
                      'flex items-center justify-center gap-2 transition-all',
                      otp.length < 6 && 'opacity-50 cursor-not-allowed',
                    )}
                    style={{
                      background: 'linear-gradient(135deg, #F5A623, #D4891A)',
                      boxShadow: otp.length === 6 ? '0 4px 20px rgba(245,166,35,0.35)' : 'none',
                    }}
                    whileHover={otp.length === 6 ? { scale: 1.01 } : {}}
                    whileTap={otp.length === 6 ? { scale: 0.98 } : {}}
                  >
                    Thibitisha Namba
                  </motion.button>

                  <button
                    type="button"
                    onClick={() => setStep('email')}
                    className="w-full text-center text-sm text-text-muted hover:text-text-primary transition-colors font-body"
                  >
                    ← Badilisha email
                  </button>
                </motion.div>
              )}

              {/* ── Password step ── */}
              {step === 'password' && (
                <motion.form
                  key="password-form"
                  onSubmit={pwdForm.handleSubmit(onPasswordSubmit)}
                  className="space-y-4"
                  noValidate
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* New password */}
                  <div>
                    <KiliInput
                      {...pwdForm.register('new_password')}
                      label="Password mpya"
                      error={pwdForm.formState.errors.new_password?.message}
                      type="password"
                      showPasswordToggle
                      autoComplete="new-password"
                    />

                    {/* Password strength */}
                    <AnimatePresence>
                      {watchPwd && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          {(() => {
                            const checks = [
                              { pass: watchPwd.length >= 8 },
                              { pass: /[A-Z]/.test(watchPwd) },
                              { pass: /[0-9]/.test(watchPwd) },
                              { pass: /[^A-Za-z0-9]/.test(watchPwd) },
                            ];
                            const score = checks.filter((c) => c.pass).length;
                            const colors = ['#E84545', '#FF7700', '#F5A623', '#00E5A0'];
                            return (
                              <div className="flex gap-1">
                                {[1, 2, 3, 4].map((i) => (
                                  <div
                                    key={i}
                                    className="flex-1 h-1 rounded-full transition-all duration-300"
                                    style={{ background: i <= score ? colors[score - 1] : '#2A2A3A' }}
                                  />
                                ))}
                              </div>
                            );
                          })()}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <motion.button
                    type="submit"
                    disabled={resetMutation.isPending}
                    className={cn(
                      'w-full h-12 rounded-xl font-display font-bold text-dark-bg text-sm',
                      'flex items-center justify-center gap-2',
                      resetMutation.isPending && 'opacity-80 cursor-not-allowed',
                    )}
                    style={{
                      background: 'linear-gradient(135deg, #F5A623, #D4891A)',
                      boxShadow: resetMutation.isPending ? 'none' : '0 4px 20px rgba(245,166,35,0.35)',
                    }}
                    whileHover={!resetMutation.isPending ? { scale: 1.01 } : {}}
                    whileTap={!resetMutation.isPending ? { scale: 0.98 } : {}}
                  >
                    <AnimatePresence mode="wait">
                      {resetMutation.isPending ? (
                        <motion.div key="loading" className="flex items-center gap-2"
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <Loader2 size={18} className="animate-spin" />
                          <span>Inabadilisha...</span>
                        </motion.div>
                      ) : (
                        <motion.span key="text"
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          Badilisha Password
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </motion.form>
              )}

              {/* ── Success step ── */}
              {step === 'success' && (
                <motion.div
                  key="success"
                  className="text-center py-4 space-y-4"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  {/* Big checkmark */}
                  <motion.div
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                    style={{
                      background: 'rgba(0,229,160,0.12)',
                      border: '2px solid rgba(0,229,160,0.4)',
                      boxShadow: '0 0 40px rgba(0,229,160,0.2)',
                    }}
                    animate={{
                      scale: [1, 1.05, 1],
                      boxShadow: [
                        '0 0 40px rgba(0,229,160,0.2)',
                        '0 0 60px rgba(0,229,160,0.4)',
                        '0 0 40px rgba(0,229,160,0.2)',
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <CheckCircle2 size={36} className="text-kili-green" />
                  </motion.div>

                  <div>
                    <h3 className="text-xl font-bold font-display text-text-primary mb-2">
                      Password Imebadilishwa!
                    </h3>
                    <p className="text-text-muted text-sm font-body leading-relaxed">
                      Password yako mpya imewekwa salama.
                      Unaweza kuingia sasa na password mpya.
                    </p>
                  </div>

                  <motion.div
                    className="p-4 rounded-xl"
                    style={{
                      background: 'rgba(0,229,160,0.06)',
                      border: '1px solid rgba(0,229,160,0.15)',
                    }}
                  >
                    <p className="text-xs text-text-muted font-body">
                      💡 Usisahau kuweka password yako mahali salama. Usishiriki na mtu yeyote.
                    </p>
                  </motion.div>

                  <Link href="/login" className="block">
                    <motion.div
                      className="w-full h-12 rounded-xl font-display font-bold text-dark-bg text-sm flex items-center justify-center gap-2"
                      style={{
                        background: 'linear-gradient(135deg, #F5A623, #D4891A)',
                        boxShadow: '0 4px 20px rgba(245,166,35,0.35)',
                      }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Ingia Sasa →
                    </motion.div>
                  </Link>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}