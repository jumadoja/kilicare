'use client';
import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Eye, EyeOff, Loader2, ArrowLeft,
  ArrowRight, User, Map, Camera,
  CheckCircle2, Shield, Star, Compass,
  Sparkles, Heart, Zap, Trophy, Lock,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { registerSchema, RegisterInput } from '@/lib/validators';
import { cn } from '@/lib/utils';

// ── AI Onboarding Assistant ────────────────────────────
function OnboardingAssistant({ step }: { step: number }) {
  const messages = {
    1: 'Habari mimi ni AsKkiliCare,👋 Nitakusaidia kukupa maelezo mafupi kujaza taarifa zako',
    2: 'Chagua jukumu lako - utapata experiences zinakufaa',
    3: 'Weka picha yako ili watu wakutambue kwa urahisi',
  };

  return (
    <motion.div
      className="mb-4 p-3 rounded-xl flex items-start gap-3"
      style={{
        background: 'rgba(245,166,35,0.08)',
        border: '1px solid rgba(245,166,35,0.2)',
      }}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(245,166,35,0.2)' }}>
        <Sparkles size={16} className="text-kili-gold" />
      </div>
      <div>
        <p className="text-sm font-body text-text-primary">{messages[step as keyof typeof messages]}</p>
      </div>
    </motion.div>
  );
}

// ── Progress Bar ─────────────────────────────────────
function ProgressIntelligence({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const progress = (current / total) * 100;
  const achievements = {
    1: { icon: '🎯', text: 'Mwanzo mzuri!' },
    2: { icon: '⚡', text: 'Endelea vizuri!' },
    3: { icon: '🏆', text: 'Karibu kumaliza!' },
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <motion.div
          key={current}
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <span className="text-sm font-body font-semibold text-kili-gold">
            Hatua ya {current} kati ya {total}
          </span>
          <motion.span
            key={`achievement-${current}`}
            className="text-lg"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {achievements[current as keyof typeof achievements].icon}
          </motion.span>
        </motion.div>
        <motion.span
          key={`pct-${current}`}
          className="text-xs font-body text-text-muted"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {Math.round(progress)}%
        </motion.span>
      </div>

      <div
        className="relative h-2 rounded-full overflow-hidden"
        style={{ background: 'rgba(42,42,58,1)' }}
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: 'linear-gradient(90deg, #F5A623, #00E5A0)',
            boxShadow: '0 0 20px rgba(245,166,35,0.4)',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      <motion.p
        key={`motivation-${current}`}
        className="text-xs text-kili-green mt-2 font-body text-center"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {achievements[current as keyof typeof achievements].text}
      </motion.p>
    </div>
  );
}

// ── Floating Input ────────────────────────────────────
function FloatingInput({
  label,
  error,
  type = 'text',
  rightElement,
  microFeedback,
  value,
  onFocus,
  onBlur,
  ...props
}: {
  label: string;
  error?: string;
  type?: string;
  rightElement?: React.ReactNode;
  microFeedback?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false);
  const hasValue = !!(value as string);

  return (
    <div className="relative">
      <div className="relative">
        <motion.label
          className="absolute left-4 pointer-events-none font-body z-10 transition-all duration-200 ease-out px-2"
          animate={{
            top: focused || hasValue ? '5px' : '50%',
            transform: focused || hasValue ? 'translateY(0)' : 'translateY(-50%)',
            fontSize: focused || hasValue ? '11px' : '15px',
            color: focused ? '#F5A623' : '#8B8BA7',
            backgroundColor: focused || hasValue ? '#1C1C27' : 'rgba(0, 0, 0, 0)',
          }}
        >
          {label}
        </motion.label>

        <input
          {...props}
          value={value}
          type={type}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          className={cn(
            'w-full py-3 px-4 pt-5 rounded-xl font-body text-base',
            'text-text-primary',
            'bg-dark-elevated transition-all duration-200 outline-none border',
            rightElement ? 'pr-12' : '',
            focused
              ? 'border-kili-gold shadow-glow-gold'
              : error
              ? 'border-kili-sunset'
              : 'border-dark-border hover:border-dark-border-light',
          )}
          style={{
            height: '48px',
          }}
          aria-label={label}
          aria-invalid={!!error}
          aria-describedby={error ? `${label}-error` : microFeedback ? `${label}-feedback` : undefined}
        />

        {rightElement && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
            {rightElement}
          </div>
        )}
      </div>

      <AnimatePresence>
        {microFeedback && !error && (
          <motion.p
            id={`${label}-feedback`}
            key="feedback"
            className="text-kili-green text-xs mt-1 ml-1 font-body flex items-center gap-1"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="status"
            aria-live="polite"
          >
            <Zap size={10} />
            {microFeedback}
          </motion.p>
        )}
        {error && (
          <motion.p
            id={`${label}-error`}
            key="error"
            className="text-kili-sunset text-xs mt-1 ml-1 font-body"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="alert"
            aria-live="assertive"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Password Strength ─────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'Herufi 8+', pass: password.length >= 8 },
    { label: 'Herufi kubwa', pass: /[A-Z]/.test(password) },
    { label: 'Namba', pass: /[0-9]/.test(password) },
    { label: 'Alama maalum', pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const colors = ['#E84545', '#FF7700', '#F5A623', '#00E5A0'];
  const labels = ['Dhaifu', 'Wastani', 'Nzuri', 'Bora 🔥'];
  const isMax = score === 4;
  const [showSparkles, setShowSparkles] = useState(false);

  // Trigger sparkle animation when password becomes strong
  useEffect(() => {
    if (isMax && !showSparkles) {
      setShowSparkles(true);
      setTimeout(() => setShowSparkles(false), 800);
    }
  }, [isMax, showSparkles]);

  if (!password) return null;

  return (
    <motion.div
      className="mt-2 space-y-2"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
    >
      {/* Strength bars */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="flex-1 h-1.5 rounded-full"
            style={{ background: i <= score ? colors[score - 1] : '#2A2A3A' }}
            animate={{ scaleX: i <= score ? 1 : 0.3, originX: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          />
        ))}
      </div>

      {/* Checks row */}
      <div className="flex justify-between items-center flex-wrap gap-1">
        <div className="flex gap-3 flex-wrap">
          {checks.map((c) => (
            <span
              key={c.label}
              className={cn(
                'text-xs font-body flex items-center gap-1',
                c.pass ? 'text-kili-green' : 'text-text-muted',
              )}
            >
              {c.pass ? '✓' : '○'} {c.label}
            </span>
          ))}
        </div>

        {score > 0 && (
          <motion.span
            className="text-xs font-semibold font-body flex items-center gap-1"
            style={{ color: colors[score - 1] }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            {isMax && <Sparkles size={12} className="animate-pulse" />}
            {labels[score - 1]}
          </motion.span>
        )}
      </div>
    </motion.div>
  );
}

// ── Role Card ─────────────────────────────────────────
function RoleCard({
  role,
  selected,
  onSelect,
  stepCompleted,
}: {
  role: 'TOURIST' | 'LOCAL_GUIDE';
  selected: boolean;
  onSelect: () => void;
  stepCompleted?: boolean;
}) {
  const isTourist = role === 'TOURIST';

  const config = isTourist
    ? {
        icon: <Compass size={28} />,
        title: 'Msafiri',
        subtitle: 'Mtalii / Tourist',
        description: 'Mimi ninataka kugundua Tanzania na kupata msaada wa utalii.',
        features: [
          'Gundua maeneo mazuri',
          'AI travel assistant',
          'SOS dharura',
          'Fuata local guides',
          'Angalia moments za Tanzania',
        ],
        color: '#F5A623',
        gradient: 'linear-gradient(135deg, rgba(245,166,35,0.15), rgba(245,166,35,0.05))',
        border: 'rgba(245,166,35,0.3)',
        glow: '0 0 30px rgba(245,166,35,0.2)',
        badge: '🧳 Karibu Tanzania!',
        feedback: 'Vizuri! Hii itakusaidia kupata experiences sahihi',
      }
    : {
        icon: <Star size={28} />,
        title: 'Kiongozi wa Ndani',
        subtitle: 'Local Guide',
        description: 'Mimi ni mzawa wa Tanzania nataka kushiriki maarifa yangu.',
        features: [
          'Unda na uza experiences',
          'Shiriki vidokezo vya usalama',
          'Jibu SOS za dharura',
          'Jenga trust score yako',
          'Pata alama na badge',
        ],
        color: '#F5A623',
        gradient: 'linear-gradient(135deg, rgba(245,166,35,0.15), rgba(245,166,35,0.05))',
        border: 'rgba(245,166,35,0.3)',
        glow: '0 0 30px rgba(245,166,35,0.25)',
        badge: '⭐ Mwenyeji wa Tanzania!',
        feedback: 'Vizuri! Utashiriki maarifa yako na watalii',
      };

  return (
    <motion.div
      onClick={onSelect}
      className="relative cursor-pointer rounded-2xl p-4 md:p-5 w-full min-h-[120px] md:min-h-[140px]"
      style={{
        background: selected ? config.gradient : 'rgba(28,28,39,0.5)',
        border: `1px solid ${selected ? config.border : 'rgba(42,42,58,0.8)'}`,
        boxShadow: selected ? config.glow : 'none',
      }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      animate={{ scale: selected ? 1.01 : 1 }}
    >
      {/* Subtle ambient particles when selected - one-time burst */}
      <AnimatePresence>
        {selected && (
          <>
            {[...Array(6)].map((_, i) => {
              const angle = (i / 6) * Math.PI * 2;
              const radiusX = 50 + Math.cos(angle) * 50;
              const radiusY = 50 + Math.sin(angle) * 50;
              
              return (
                <motion.div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full pointer-events-none"
                  style={{
                    background: config.color,
                    boxShadow: `0 0 6px ${config.color}, 0 0 12px ${config.color}`,
                  }}
                  initial={{ 
                    opacity: 0, 
                    scale: 0,
                    x: '50%',
                    y: '50%'
                  }}
                  animate={{
                    opacity: [0, 0.6, 0.3, 0],
                    scale: [0, 1, 0.8, 0],
                    x: [50, radiusX + (Math.random() - 0.5) * 10, radiusX],
                    y: [50, radiusY + (Math.random() - 0.5) * 10, radiusY],
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.1,
                    ease: 'easeOut'
                  }}
                />
              );
            })}
          </>
        )}
      </AnimatePresence>

      {/* Soft ambient breathing glow when selected */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              background: `radial-gradient(circle at center, ${config.color}15, transparent 70%)`,
            }}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0.2, 0.35, 0.2], 
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        )}
      </AnimatePresence>

      {/* Check icon - subtle fade-in */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="absolute top-3 right-3"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <CheckCircle2 size={20} style={{ color: config.color }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content container with max-width to prevent text spreading */}
      <div className="max-w-[280px] md:max-w-[320px]">
        {/* Icon box */}
        <motion.div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
          style={{
            background: selected ? config.gradient : 'rgba(42,42,58,0.5)',
            border: `1px solid ${selected ? config.border : 'transparent'}`,
            color: config.color,
          }}
          animate={{ rotate: selected ? [0, -5, 5, 0] : 0 }}
          transition={{ duration: 0.4 }}
        >
          {config.icon}
        </motion.div>

        <h3 className="font-bold font-display text-base text-text-primary mb-0.5">
          {config.title}
        </h3>
        <p className="text-xs font-body mb-3" style={{ color: config.color }}>
          {config.subtitle}
        </p>
        <p className="text-xs text-text-muted font-body leading-relaxed mb-4">
          {config.description}
        </p>

        {/* Features */}
        <div className="space-y-1.5 mb-4">
          {config.features.map((f) => (
            <div key={f} className="flex items-center gap-2">
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: config.color }}
              />
              <span className="text-xs text-text-secondary font-body">{f}</span>
            </div>
          ))}
        </div>

        {/* Badge */}
        <div
          className="text-center py-1.5 px-3 rounded-lg text-xs font-semibold font-body"
          style={{
            background: selected
              ? `rgba(${isTourist ? '74,158,255' : '245,166,35'},0.15)`
              : 'rgba(42,42,58,0.5)',
            color: selected ? config.color : '#8B8BA7',
            border: `1px solid ${selected ? config.border : 'transparent'}`,
          }}
        >
          {config.badge}
        </div>

        {/* Selection feedback */}
        <AnimatePresence>
          {selected && (
            <motion.p
              className="mt-3 text-xs text-kili-green font-body text-center flex items-center justify-center gap-1"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
            >
              <Heart size={10} />
              {config.feedback}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Success Screen ────────────────────────────────────
function SuccessScreen({ onRedirect }: { onRedirect: () => void }) {
  useEffect(() => {
    const t = setTimeout(onRedirect, 2000);
    return () => {
      clearTimeout(t);
    };
  }, [onRedirect]);

  return (
    <div className="relative">
      <motion.div
        className="text-center py-12 relative z-10"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Icon */}
        <motion.div
          className="relative inline-flex items-center justify-center w-24 h-24 rounded-full mb-6"
          style={{
            background: 'linear-gradient(135deg, #00E5A0, #00C47A)',
            boxShadow: '0 0 40px rgba(0,229,160,0.4)',
          }}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <CheckCircle2 size={48} className="text-dark-bg" />

          {/* Glow ring */}
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: 'rgba(0,229,160,0.3)',
              filter: 'blur(20px)',
            }}
            animate={{ scale: [1, 1.5, 2], opacity: [0.5, 0.3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>

        <motion.h2
          className="text-2xl font-black font-display text-text-primary mb-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Akaunti imeundwa 🎉
        </motion.h2>

        <motion.p
          className="text-lg font-body text-kili-green mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Karibu KilicareGO+
        </motion.p>

        <motion.p
          className="text-sm text-text-muted font-body mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Inakupeleka kwenye ukurasa wa kuingia...
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <Loader2 size={24} className="text-kili-gold animate-spin mx-auto" />
        </motion.div>
      </motion.div>
    </div>
  );
}

// ── Slide variants ────────────────────────────────────
const slideVariants = {
  enter: (dir: number) => ({ 
    x: dir > 0 ? 100 : -100, 
    opacity: 0,
    scale: 0.95,
  }),
  center: { 
    x: 0, 
    opacity: 1,
    scale: 1,
  },
  exit: (dir: number) => ({ 
    x: dir < 0 ? 100 : -100, 
    opacity: 0,
    scale: 0.95,
  }),
};

// ── Main Page ─────────────────────────────────────────
export default function RegisterPage() {
  const { registerAsync: registerUser, isRegistering } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<'TOURIST' | 'LOCAL_GUIDE'>('TOURIST');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | undefined>(undefined);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [microFeedback, setMicroFeedback] = useState<Record<string, string>>({});


  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'TOURIST' },
  });

  const watchPassword = watch('password', '');
  const watchFirstName = watch('first_name', '');
  const watchLastName = watch('last_name', '');
  const watchUsername = watch('username', '');
  const watchEmail = watch('email', '');
  const watchConfirmPassword = watch('confirm_password', '');
  const watchBio = watch('bio', '');
  const watchLocation = watch('location', '');

  // Real-time validation for username/email conflicts
  const [usernameError, setUsernameError] = useState<string | undefined>(undefined);
  const [emailError, setEmailError] = useState<string | undefined>(undefined);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (watchUsername.length >= 3) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/check-username/?username=${watchUsername}`);
          const data = await response.json();
          if (data.exists) {
            setUsernameError('Username imeshatumika. Tumia nyingine.');
            toast.error('Username imeshatumika. Tumia nyingine.');
          } else {
            setUsernameError(undefined);
          }
        } catch (error) {
          // Silent fail, let backend handle on submit
        }
      } else {
        setUsernameError(undefined);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [watchUsername]);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (watchEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(watchEmail)) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/check-email/?email=${watchEmail}`);
          const data = await response.json();
          if (data.exists) {
            setEmailError('Email imeshatumika. Tumia nyingine.');
            toast.error('Email imeshatumika. Tumia nyingine.');
          } else {
            setEmailError(undefined);
          }
        } catch (error) {
          // Silent fail, let backend handle on submit
        }
      } else {
        setEmailError(undefined);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [watchEmail]);

  // ── Micro feedback ──────────────────────────────────
  useEffect(() => {
    const fb: Record<string, string> = {};
    if (watchFirstName.length >= 2) fb.first_name = 'Jina zuri! 👋';
    if (watchLastName.length >= 2) fb.last_name = 'Imekamilika ✓';
    if (watchUsername.length >= 3) fb.username = 'Username inaonekana kuwa ya kipekee 🎯';
    if (watchEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(watchEmail)) {
      fb.email = 'Email sahihi 📧';
    }
    if (
      watchPassword.length >= 8 &&
      /[A-Z]/.test(watchPassword) &&
      /[0-9]/.test(watchPassword) &&
      /[^A-Za-z0-9]/.test(watchPassword)
    ) {
      fb.password = 'Inaonekana unaweka nenosiri salama 🔐';
    }
    if (watchConfirmPassword && watchConfirmPassword === watchPassword) {
      fb.confirm_password = 'Nenosiri zinalingana ✓';
    }
    setMicroFeedback(fb);
  }, [watchFirstName, watchLastName, watchUsername, watchEmail, watchPassword, watchConfirmPassword]);

  // ── Navigation ──────────────────────────────────────
  const validateStep1 = async () => {
    const ok = await trigger([
      'first_name', 'last_name', 'username',
      'email', 'password', 'confirm_password',
    ]);
    if (ok) setStep(2);
  };

  const goStep3 = () => {
    if (!selectedRole) {
      toast.error('Chagua jukumu lako kwanza');
      return;
    }
    setValue('role', selectedRole);
    setStep(3);
  };

  // ── Submit ──────────────────────────────────────────
  const onSubmit = async (data: RegisterInput) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirm_password, ...payload } = data;
    try {
      await registerUser({ ...payload, role: selectedRole, avatar: avatarFile });

      // ✅ ONLY HERE show success after confirmed API success
      setShowSuccess(true);

      // delay AFTER confirmed success
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      // ❌ DO NOT show success on error
      // show error feedback instead

      // Detailed console logging for debugging
      console.log('## Error Type');
      console.log('Console Registration Error');

      console.log('## Error Message');
      if (error instanceof Error) {
        console.log(error.message);

        // Check if it's an Axios/network error
        if ('code' in error) {
          console.log('## Error Code');
          console.log((error as any).code);
        }

        if ('response' in error) {
          console.log('## Status Code');
          console.log((error as any).response?.status);
          console.log('## Response Data');
          console.log((error as any).response?.data);
        }

        if ('config' in error) {
          console.log('## Request URL');
          console.log((error as any).config?.url);
        }
      } else {
        console.log('Unknown error occurred');
        console.log(error);
      }

      console.log('## Next.js version');
      console.log('16.2.4 (Turbopack)');

      // User-friendly error message - parse backend response
      let errorMessage = 'Imeshindikana kujisajili. Tafadhali jaribu tena.';

      if (error instanceof Error) {
        // Check for network/timeout errors
        if (error.message.includes('timeout') || error.message.includes('network') || error.message.includes('ECONNREFUSED')) {
          errorMessage = 'Tatizo la mtandao. Tafadhali angalia connection yako na ujaribu tena.';
        }
        // Check for backend validation errors
        else if ('response' in error) {
          const response = (error as any).response;
          const responseData = response?.data;

          console.log('## Parsing Backend Error');
          console.log(responseData);

          // Check for specific field errors
          if (responseData) {
            if (typeof responseData === 'string') {
              errorMessage = responseData;
            } else if (responseData.detail) {
              errorMessage = responseData.detail;
            } else if (responseData.username) {
              // Handle both string and array
              errorMessage = Array.isArray(responseData.username) ? responseData.username[0] : responseData.username;
            } else if (responseData.email) {
              // Handle both string and array
              errorMessage = Array.isArray(responseData.email) ? responseData.email[0] : responseData.email;
            } else if (responseData.non_field_errors) {
              errorMessage = Array.isArray(responseData.non_field_errors) ? responseData.non_field_errors[0] : responseData.non_field_errors;
            }
          }
        }
        // Check for 409/conflict errors
        else if (error.message.includes('409') || error.message.includes('already exists')) {
          errorMessage = 'Username au email imeshatumika. Tumia nyingine.';
        }
      }

      toast.error(errorMessage);
    }
  };

  // ── Avatar ──────────────────────────────────────────
  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError(null);
    setAvatarUploading(true);

    if (!file.type.startsWith('image/')) {
      setAvatarError('Tafadhali chagua picha tu');
      setAvatarUploading(false);
      toast.error('Tafadhali chagua picha tu');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Picha isiyozidi 5MB');
      setAvatarUploading(false);
      toast.error('Picha lazima iwe chini ya 5MB');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (r) => {
      setAvatarPreview(r.target?.result as string);
      setAvatarUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative min-h-dvh w-full overflow-hidden flex items-center justify-center">
      {/* Background Visual Layer */}
      
      <motion.div
        className="relative z-10 w-full max-w-md md:max-w-lg xl:max-w-2xl mx-4"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, type: 'spring' }}
      >
      {/* Header */}
      <div className="text-center mb-3">
        <motion.div
          className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-2"
          style={{
            background: 'linear-gradient(135deg, #F5A623, #D4891A)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <span className="text-xl font-black text-dark-bg font-display">K</span>
        </motion.div>

        <h1 className="text-2xl md:text-3xl font-black font-display text-text-primary tracking-tight">
          Jisajili{' '}
          <span className="text-gradient-gold">KilicareGO+</span>
        </h1>

        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            className="text-text-muted text-sm mt-1 font-body"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {step === 1 && 'Unda akaunti yako ya utalii'}
            {step === 2 && 'Chagua jukumu lako Tanzania'}
            {step === 3 && 'Maliza wasifu wako'}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Progress */}
      {!showSuccess && (
        <div className="mb-4">
          <ProgressIntelligence current={step} total={3} />
          {/* Step indicators */}
          <div className="flex justify-center gap-3 mt-4">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className={cn(
                  'w-3 h-3 rounded-full',
                  step >= i ? 'bg-kili-gold' : 'bg-dark-border'
                )}
                initial={{ scale: 0.8 }}
                animate={{ scale: step === i ? 1.2 : 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
                style={{
                  boxShadow: step === i ? '0 0 12px rgba(245,166,35,0.6)' : 'none',
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Card ── */}
      <motion.div
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(19,19,26,0.85)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        }}
      >
        {/* Top gradient line */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(245,166,35,0.6), transparent)',
          }}
        />

        <div className="p-6">
          <AnimatePresence mode="wait">

            {/* ══ SUCCESS ══ */}
            {showSuccess && (
              <motion.div key="success">
                <SuccessScreen onRedirect={() => router.push('/login')} />
              </motion.div>
            )}

            {/* ══ STEP 1 ══ */}
            {!showSuccess && step === 1 && (
              <motion.div
                key="step1"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                className="space-y-5"
                style={{ perspective: 1000 }}
              >
                <OnboardingAssistant step={1} />

                <div className="flex items-center gap-2 mb-3">
                  <User size={18} className="text-kili-gold" />
                  <h2 className="text-xl font-bold font-display text-text-primary">
                    Habari yako
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                    <FloatingInput
                      label="Jina la kwanza"
                      error={errors.first_name?.message}
                      microFeedback={microFeedback.first_name}
                      value={watchFirstName}
                      {...register('first_name')}
                    />
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <FloatingInput
                      label="Jina la mwisho"
                      error={errors.last_name?.message}
                      microFeedback={microFeedback.last_name}
                      value={watchLastName}
                      {...register('last_name')}
                    />
                  </motion.div>
                </div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                  <FloatingInput
                    label="Username"
                    error={errors.username?.message || usernameError}
                    microFeedback={usernameError ? undefined : microFeedback.username}
                    value={watchUsername}
                    autoComplete="username"
                    {...register('username')}
                  />
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <FloatingInput
                    label="Barua pepe (Email)"
                    type="email"
                    error={errors.email?.message || emailError}
                    microFeedback={emailError ? undefined : microFeedback.email}
                    value={watchEmail}
                    autoComplete="email"
                    {...register('email')}
                  />
                </motion.div>

                <div className="pt-1">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                  <FloatingInput
                    label="Nenosiri"
                    type={showPassword ? 'text' : 'password'}
                    error={errors.password?.message}
                    microFeedback={microFeedback.password}
                    value={watchPassword}
                    autoComplete="new-password"
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="text-text-muted hover:text-text-primary transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                    {...register('password')}
                  />
                  <AnimatePresence>
                    {watchPassword && (
                      <div className="mt-3">
                        <PasswordStrength password={watchPassword} />
                      </div>
                    )}
                  </AnimatePresence>
                </motion.div>
                </div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <FloatingInput
                    label="Thibitisha Nenosiri"
                    type={showConfirm ? 'text' : 'password'}
                    error={errors.confirm_password?.message}
                    microFeedback={microFeedback.confirm_password}
                    value={watchConfirmPassword}
                    autoComplete="new-password"
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowConfirm((p) => !p)}
                        className="text-text-muted hover:text-text-primary transition-colors"
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                    {...register('confirm_password')}
                  />
                </motion.div>

                <div className="pt-2">
                  <motion.button
                    type="button"
                    onClick={validateStep1}
                    className="w-full h-12 rounded-xl font-display font-bold text-dark-bg text-sm flex items-center justify-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, #F5A623, #D4891A)',
                      boxShadow: '0 4px 20px rgba(245,166,35,0.35)',
                    }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Endelea <ArrowRight size={18} />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* ══ STEP 2 ══ */}
            {!showSuccess && step === 2 && (
              <motion.div
                key="step2"
                custom={2}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                style={{ perspective: 1000 }}
              >
                <OnboardingAssistant step={2} />

                <div className="flex items-center gap-2 mb-4">
                  <Shield size={18} className="text-kili-gold" />
                  <h2 className="text-xl font-bold font-display text-text-primary">
                    Wewe ni nani Tanzania?
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:max-w-2xl md:mx-auto">
                  <RoleCard
                    role="TOURIST"
                    selected={selectedRole === 'TOURIST'}
                    onSelect={() => setSelectedRole('TOURIST')}
                    stepCompleted={step > 2}
                  />
                  <RoleCard
                    role="LOCAL_GUIDE"
                    selected={selectedRole === 'LOCAL_GUIDE'}
                    onSelect={() => setSelectedRole('LOCAL_GUIDE')}
                    stepCompleted={step > 2}
                  />
                </div>

                <div className="flex gap-3">
                  <motion.button
                    type="button"
                    onClick={() => setStep(1)}
                    className="min-w-[100px] h-14 px-6 rounded-xl border border-dark-border text-text-secondary font-body font-medium flex items-center justify-center gap-2 hover:bg-dark-elevated hover:border-kili-gold/50 hover:text-text-primary transition-all duration-200"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ArrowLeft size={16} />
                    Rudi
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={goStep3}
                    className="flex-1 h-12 rounded-xl font-display font-bold text-dark-bg text-sm flex items-center justify-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, #F5A623, #D4891A)',
                      boxShadow: '0 4px 20px rgba(245,166,35,0.35)',
                    }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Endelea <ArrowRight size={18} />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* ══ STEP 3 ══ */}
            {!showSuccess && step === 3 && (
              <motion.div
                key="step3"
                custom={3}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                style={{ perspective: 1000 }}
              >
                <OnboardingAssistant step={3} />

                <div className="flex items-center gap-2 mb-4">
                  <Map size={18} className="text-kili-gold" />
                  <h2 className="text-xl font-bold font-display text-text-primary">
                    Maliza wasifu wako
                  </h2>
                </div>


                {/* Avatar upload */}
                <div className="flex flex-col items-center mb-5">
                  <label className="cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatar}
                      disabled={avatarUploading}
                    />
                    <motion.div
                      className="relative w-24 h-24 rounded-full overflow-hidden"
                      style={{
                        background: avatarPreview
                          ? 'transparent'
                          : 'linear-gradient(135deg, rgba(245,166,35,0.2), rgba(232,69,69,0.2))',
                        border: '2px solid rgba(245,166,35,0.4)',
                        boxShadow: '0 0 20px rgba(245,166,35,0.2)',
                      }}
                      whileHover={{ scale: !avatarUploading ? 1.01 : 1 }}
                      whileTap={{ scale: !avatarUploading ? 0.98 : 1 }}
                    >
                      {avatarUploading ? (
                        <div className="relative w-full h-full flex flex-col items-center justify-center gap-1">
                          <div className="absolute inset-0 rounded-full border-2 border-kili-gold/30 border-t-kili-gold animate-spin" />
                          <Loader2 size={24} className="text-kili-gold animate-spin" />
                          <span className="text-xs text-text-muted font-body">Inapakia...</span>
                        </div>
                      ) : avatarPreview ? (
                        <>
                          <motion.img
                            src={avatarPreview}
                            alt="avatar"
                            className="w-full h-full object-cover"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                            <CheckCircle2 size={24} className="text-kili-green" />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                          <Camera size={24} className="text-kili-gold" />
                          <span className="text-xs text-text-muted font-body">Picha</span>
                        </div>
                      )}

                      {!avatarUploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera size={20} className="text-white" />
                        </div>
                      )}
                    </motion.div>
                  </label>

                  <AnimatePresence>
                    {avatarError && (
                      <motion.p
                        key="avatarErr"
                        className="text-kili-sunset text-xs mt-2 font-body text-center"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                      >
                        {avatarError}
                      </motion.p>
                    )}
                    {avatarPreview && !avatarError && (
                      <motion.p
                        key="avatarOk"
                        className="text-kili-green text-xs mt-2 font-body text-center flex items-center gap-1"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                      >
                        <CheckCircle2 size={10} />
                        ✓ Tayari
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Bio & Location */}
                <div className="space-y-4">
                  <FloatingInput
                    label="Bio yako (si lazima)"
                    value={watchBio}
                    {...register('bio' as keyof RegisterInput)}
                  />
                  <FloatingInput
                    label="Uko wapi? (Mji/Maeneo)"
                    value={watchLocation}
                    {...register('location' as keyof RegisterInput)}
                  />
                </div>

                {/* Role summary */}
                <motion.div
                  className="mt-4 p-3 rounded-xl flex items-center gap-3"
                  style={{
                    background:
                      selectedRole === 'TOURIST'
                        ? 'rgba(74,158,255,0.08)'
                        : 'rgba(245,166,35,0.08)',
                    border: `1px solid ${
                      selectedRole === 'TOURIST'
                        ? 'rgba(74,158,255,0.2)'
                        : 'rgba(245,166,35,0.2)'
                    }`,
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <span className="text-2xl">
                    {selectedRole === 'TOURIST' ? '🧳' : '⭐'}
                  </span>
                  <div>
                    <p
                      className="text-sm font-semibold font-body"
                      style={{
                        color: '#F5A623',
                      }}
                    >
                      {selectedRole === 'TOURIST' ? 'Msafiri' : 'Kiongozi wa Ndani'}
                    </p>
                    <p className="text-xs text-text-muted font-body">
                      Unaweza kubadilisha baadaye kwenye mipangilio
                    </p>
                  </div>
                </motion.div>

                {/* Buttons */}
                <div className="flex gap-3 mt-4">
                  <motion.button
                    type="button"
                    onClick={() => setStep(2)}
                    className="min-w-[90px] h-12 px-5 rounded-xl border border-dark-border text-text-secondary font-body font-medium flex items-center justify-center gap-2 hover:bg-dark-elevated hover:border-kili-gold/50 hover:text-text-primary transition-all duration-200"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ArrowLeft size={16} />
                    Rudi
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={handleSubmit(onSubmit)}
                    disabled={isRegistering}
                    className={cn(
                      'flex-1 h-14 rounded-xl font-display font-bold text-dark-bg text-base',
                      'flex items-center justify-center gap-2',
                      isRegistering && 'opacity-80 cursor-not-allowed',
                    )}
                    style={{
                      background: 'linear-gradient(135deg, #F5A623, #D4891A)',
                      boxShadow: isRegistering
                        ? 'none'
                        : '0 4px 20px rgba(245,166,35,0.35)',
                    }}
                    whileHover={!isRegistering ? { scale: 1.01 } : {}}
                    whileTap={!isRegistering ? { scale: 0.98 } : {}}
                  >
                    <AnimatePresence mode="wait">
                      {isRegistering ? (
                        <motion.div
                          key="loading"
                          className="flex items-center gap-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <Loader2 size={18} className="animate-spin" />
                          <span>Inaunda akaunti...</span>
                        </motion.div>
                      ) : (
                        <motion.span
                          key="text"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          🎉 Unda Akaunti
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>

      {/* Login link */}
      {!showSuccess && (
        <p className="text-center text-text-muted text-xs mt-4 font-body">
          Una akaunti tayari?{' '}
          <Link
            href="/login"
            className="text-kili-gold hover:text-kili-gold-light font-semibold transition-colors"
          >
            Ingia hapa
          </Link>
        </p>
      )}
      </motion.div>
    </div>
  );
}
