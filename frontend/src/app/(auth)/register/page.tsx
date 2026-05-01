'use client';
import { useState, useEffect, useRef, memo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Loader2, ArrowLeft,
  ArrowRight, User, Map, Camera,
  CheckCircle2, Shield, Star, Compass,
  Sparkles, Heart, Zap, Trophy, Lock, MapPin,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { useFocusManagement } from '@/hooks/useFocusManagement';
import { registerSchema, RegisterInput } from '@/lib/validators';
import { cn } from '@/lib/utils';
import { KiliInput } from '@/components/ui/KiliInput';

// ── AI Onboarding Assistant ────────────────────────────
const OnboardingAssistant = memo(function OnboardingAssistant({ step }: { step: number }) {
  const messages = {
    1: 'Habari mimi ni AsKkiliCare,👋 Nitakusaidia kukupa maelezo mafupi kujaza taarifa zako',
    2: 'Chagua jukumu lako - utapata experiences zinakufaa',
    3: 'Weka picha yako ili watu wakutambue kwa urahisi',
  };

  return (
    <div
      className="mb-4 p-3 rounded-xl flex items-start gap-3"
      style={{
        background: 'rgba(245,166,35,0.08)',
        border: '1px solid rgba(245,166,35,0.2)',
      }}
    >
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(245,166,35,0.2)' }}>
        <Sparkles size={16} className="text-kili-gold" />
      </div>
      <div>
        <p className="text-sm font-body text-text-primary">{messages[step as keyof typeof messages]}</p>
      </div>
    </div>
  );
});

// ── Progress Bar ─────────────────────────────────────
const ProgressIntelligence = memo(function ProgressIntelligence({
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
        <div className="flex items-center gap-2">
          <span className="text-sm font-body font-semibold text-kili-gold">
            Hatua ya {current} kati ya {total}
          </span>
          <span className="text-lg">
            {achievements[current as keyof typeof achievements].icon}
          </span>
        </div>
        <span className="text-xs font-body text-text-muted">
          {Math.round(progress)}%
        </span>
      </div>

      <div
        className="relative h-2 rounded-full overflow-hidden"
        style={{ background: 'rgba(42,42,58,1)' }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-300 ease"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #F5A623, #00E5A0)',
            boxShadow: '0 0 20px rgba(245,166,35,0.4)',
          }}
        />
      </div>

      <p className="text-xs text-kili-green mt-2 font-body text-center">
        {achievements[current as keyof typeof achievements].text}
      </p>
    </div>
  );
});

// ── Floating Input - DEPRECATED: Use KiliInput instead ──

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

  if (!password) return null;

  return (
    <div className="mt-2 space-y-4">
      {/* Strength bars */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex-1 h-1.5 rounded-full transition-all duration-300 ease"
            style={{ 
              background: i <= score ? colors[score - 1] : '#2A2A3A',
              transform: i <= score ? 'scaleX(1)' : 'scaleX(0.3)',
              transformOrigin: 'left',
            }}
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
          <span
            className="text-xs font-semibold font-body flex items-center gap-1"
            style={{ color: colors[score - 1] }}
          >
            {isMax && <Sparkles size={12} className="animate-pulse" />}
            {labels[score - 1]}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Role Card ─────────────────────────────────────────
const RoleCard = memo(function RoleCard({
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
    <div
      onClick={onSelect}
      className="relative cursor-pointer rounded-xl p-4 md:p-5 w-full min-h-[120px] md:min-h-[140px] transition-all duration-200 ease"
      style={{
        background: selected ? config.gradient : 'rgba(28,28,39,0.5)',
        border: `1px solid ${selected ? config.border : 'rgba(42,42,58,0.8)'}`,
        boxShadow: selected ? config.glow : 'none',
        transform: selected ? 'scale(1.01)' : 'scale(1)',
      }}
    >
      {/* Check icon */}
      {selected && (
        <div className="absolute top-3 right-3">
          <CheckCircle2 size={20} style={{ color: config.color }} />
        </div>
      )}

      {/* Content container with max-width to prevent text spreading */}
      <div className="w-full">
        {/* Icon box */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all duration-200 ease"
          style={{
            background: selected ? config.gradient : 'rgba(42,42,58,0.5)',
            border: `1px solid ${selected ? config.border : 'transparent'}`,
            color: config.color,
          }}
        >
          {config.icon}
        </div>

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
        <div className="space-y-4 mb-4">
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
        {selected && (
          <p className="mt-3 text-xs text-kili-green font-body text-center flex items-center justify-center gap-1">
            <Heart size={10} />
            {config.feedback}
          </p>
        )}
      </div>
    </div>
  );
});

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
      <div className="text-center py-12 relative z-10">
        {/* Icon */}
        <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full mb-6"
          style={{
            background: 'linear-gradient(135deg, #00E5A0, #00C47A)',
            boxShadow: '0 0 40px rgba(0,229,160,0.4)',
          }}
        >
          <CheckCircle2 size={48} className="text-dark-bg" />
        </div>

        <h2 className="text-2xl font-black font-display text-text-primary mb-3">
          Akaunti imeundwa 🎉
        </h2>

        <p className="text-lg font-body text-kili-green mb-4">
          Karibu KilicareGO+
        </p>

        <p className="text-sm text-text-muted font-body mb-8">
          Inakupeleka kwenye ukurasa wa kuingia...
        </p>

        <div>
          <Loader2 size={24} className="text-kili-gold animate-spin mx-auto" />
        </div>
      </div>
    </div>
  );
}

// ── Slide variants ────────────────────────────────────
// Removed - using simple CSS transitions instead

// ── Main Page ─────────────────────────────────────────
export default function RegisterPage() {
  const { registerAsync: registerUser, isRegistering } = useAuth();
  const router = useRouter();

  const { saveFormState, clearFormState, handleSuccess, isRestored } = useFormPersistence<Partial<RegisterInput>>({
    formKey: 'register',
    initialValues: {},
    storageType: 'sessionStorage',
    clearOnSuccess: true,
    onRestore: (data) => {
      // Restore form fields only if empty
      Object.entries(data).forEach(([key, value]) => {
        if (value) {
          const input = document.querySelector(`input[name="${key}"]`) as HTMLInputElement;
          if (input && !input.value) {
            setValue(key as keyof RegisterInput, value as string);
          }
        }
      });
    },
  });

  const { focusOnError } = useFocusManagement({
    autoFocusSelector: 'input[name="first_name"]',
    enableFocusOnError: true,
  }) as { focusOnError: () => void };

  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<'TOURIST' | 'LOCAL_GUIDE'>('TOURIST');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | undefined>(undefined);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');
  const [bioValue, setBioValue] = useState('');
  const [locationValue, setLocationValue] = useState('');


  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'TOURIST' },
  });

  // Focus on first error when validation fails
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      focusOnError();
    }
  }, [errors, focusOnError]);

  // ── Navigation ──────────────────────────────────────
  const validateStep1 = async () => {
    const ok = await trigger([
      'first_name', 'last_name', 'username',
      'email', 'password', 'confirm_password',
    ]);
    if (ok) {
      // Save form state only on step change
      saveFormState(getValues());
      setStep(2);
    }
  };

  const goStep3 = () => {
    if (!selectedRole) {
      toast.error('Chagua jukumu lako kwanza');
      return;
    }
    setValue('role', selectedRole);
    // Save form state only on step change
    saveFormState(getValues());
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
      
      // Clear form state on success
      handleSuccess();

      // delay AFTER confirmed success
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      // ❌ DO NOT show success on error
      // show error feedback instead

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
    <div className="relative min-h-[var(--app-height)] w-full overflow-hidden flex items-center justify-center safe-container">
      {/* Background Visual Layer */}
      
      <div className="relative z-10 w-full max-w-md md:max-w-lg lg:max-w-xl mx-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-black font-display text-text-primary tracking-tight mb-2">
          Kilicare<span className="text-gradient-gold">+</span>
        </h1>
        <p className="text-sm font-body" style={{ color: '#F5A623' }}>
          Jiunge na Kilicare+ kugundua Tanzania
        </p>
      </div>


      {/* Progress */}
      {!showSuccess && (
        <div className="mb-4">
          <ProgressIntelligence current={step} total={3} />
        </div>
      )}

      {/* ── Card ── */}
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
            background:
              'linear-gradient(90deg, transparent, rgba(245,166,35,0.8), rgba(0,229,160,0.6), transparent)',
          }}
        />

        <div className="p-6">

            {/* ══ SUCCESS ══ */}
            {showSuccess && (
              <div>
                <SuccessScreen onRedirect={() => router.push('/login')} />
              </div>
            )}

            {/* ══ STEP 1 ══ */}
            {!showSuccess && step === 1 && (
              <div className="space-y-4">
                <OnboardingAssistant step={1} />

                <div className="flex items-center gap-2 mb-4">
                  <User size={20} className="text-kili-gold" />
                  <h2 className="text-2xl font-bold font-display text-text-primary">
                    Habari yako
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <KiliInput
                      {...register('first_name')}
                      label="Jina la kwanza"
                      error={errors.first_name?.message}
                      autoComplete="given-name"
                    />
                  </div>
                  <div>
                    <KiliInput
                      {...register('last_name')}
                      label="Jina la mwisho"
                      error={errors.last_name?.message}
                      autoComplete="family-name"
                    />
                  </div>
                </div>

                <div>
                  <KiliInput
                    {...register('username')}
                    label="Username"
                    error={errors.username?.message}
                    autoComplete="username"
                  />
                </div>

                <div>
                  <KiliInput
                    {...register('email')}
                    label="Barua pepe (Email)"
                    type="email"
                    error={errors.email?.message}
                    autoComplete="email"
                  />
                </div>

                <div className="pt-1">
                  <div>
                    <KiliInput
                      {...register('password')}
                      label="Nenosiri"
                      type="password"
                      error={errors.password?.message}
                      showPasswordToggle
                      autoComplete="new-password"
                      value={passwordValue}
                      onChange={(e) => {
                        setPasswordValue(e.target.value);
                      }}
                    />
                    {passwordValue && (
                      <div className="mt-3">
                        <PasswordStrength password={passwordValue} />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <KiliInput
                    {...register('confirm_password')}
                    label="Thibitisha Nenosiri"
                    type="password"
                    error={errors.confirm_password?.message}
                    showPasswordToggle
                    autoComplete="new-password"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={validateStep1}
                    className="w-full h-12 rounded-xl font-display font-bold text-dark-bg text-sm flex items-center justify-center gap-2 transition-transform duration-150 ease hover:scale-[1.01] active:scale-[0.98]"
                    style={{
                      background: 'linear-gradient(135deg, #F5A623, #D4891A)',
                      boxShadow: '0 4px 20px rgba(245,166,35,0.35)',
                    }}
                  >
                    Endelea <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* ══ STEP 2 ══ */}
            {!showSuccess && step === 2 && (
              <div>
                <OnboardingAssistant step={2} />

                <div className="flex items-center gap-2 mb-5">
                  <Shield size={20} className="text-kili-gold" />
                  <h2 className="text-2xl font-bold font-display text-text-primary">
                    Wewe ni nani Tanzania?
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
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
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="min-w-[100px] h-12 px-6 rounded-xl border border-dark-border text-text-secondary font-body font-medium flex items-center justify-center gap-2 hover:bg-dark-elevated hover:border-kili-gold/50 hover:text-text-primary transition-all duration-200 transition-transform duration-150 ease hover:scale-[1.01] active:scale-[0.98]"
                  >
                    <ArrowLeft size={16} />
                    Rudi
                  </button>

                  <button
                    type="button"
                    onClick={goStep3}
                    className="flex-1 h-12 rounded-xl font-display font-bold text-dark-bg text-sm flex items-center justify-center gap-2 transition-transform duration-150 ease hover:scale-[1.01] active:scale-[0.98]"
                    style={{
                      background: 'linear-gradient(135deg, #F5A623, #D4891A)',
                      boxShadow: '0 4px 20px rgba(245,166,35,0.35)',
                    }}
                  >
                    Endelea <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* ══ STEP 3 ══ */}
            {!showSuccess && step === 3 && (
              <div>
                <OnboardingAssistant step={3} />

                <div className="flex items-center gap-2 mb-5">
                  <Map size={20} className="text-kili-gold" />
                  <h2 className="text-2xl font-bold font-display text-text-primary">
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
                    <div
                      className="relative w-24 h-24 rounded-full overflow-hidden transition-transform duration-150 ease"
                      style={{
                        background: avatarPreview
                          ? 'transparent'
                          : 'linear-gradient(135deg, rgba(245,166,35,0.2), rgba(232,69,69,0.2))',
                        border: '2px solid rgba(245,166,35,0.4)',
                        boxShadow: '0 0 20px rgba(245,166,35,0.2)',
                      }}
                    >
                      {avatarUploading ? (
                        <div className="relative w-full h-full flex flex-col items-center justify-center gap-1">
                          <div className="absolute inset-0 rounded-full border-2 border-kili-gold/30 border-t-kili-gold animate-spin" />
                          <Loader2 size={24} className="text-kili-gold animate-spin" />
                          <span className="text-xs text-text-muted font-body">Inapakia...</span>
                        </div>
                      ) : avatarPreview ? (
                        <>
                          <img
                            src={avatarPreview}
                            alt="avatar"
                            className="w-full h-full object-cover"
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
                    </div>
                  </label>

                  {avatarError && (
                    <p className="text-kili-sunset text-xs mt-2 font-body text-center">
                      {avatarError}
                    </p>
                  )}
                  {avatarPreview && !avatarError && (
                    <p className="text-kili-green text-xs mt-2 font-body text-center flex items-center gap-1">
                      <CheckCircle2 size={10} />
                      ✓ Tayari
                    </p>
                  )}
                </div>

                {/* Bio & Location */}
                <div className="space-y-4">
                  <KiliInput
                    {...register('bio' as keyof RegisterInput)}
                    label="Bio yako (si lazima)"
                    value={bioValue}
                    onChange={(e) => setBioValue(e.target.value)}
                  />
                  <KiliInput
                    {...register('location' as keyof RegisterInput)}
                    label="Uko wapi? (Mji/Maeneo)"
                    value={locationValue}
                    onChange={(e) => setLocationValue(e.target.value)}
                  />
                </div>

                {/* Role summary */}
                <div
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
                </div>

                {/* Buttons */}
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                  <div className="flex gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="min-w-[90px] h-12 px-5 rounded-xl border border-dark-border text-text-secondary font-body font-medium flex items-center justify-center gap-2 hover:bg-dark-elevated hover:border-kili-gold/50 hover:text-text-primary transition-all duration-200 transition-transform duration-150 ease hover:scale-[1.01] active:scale-[0.98]"
                    >
                      <ArrowLeft size={16} />
                      Rudi
                    </button>

                    <button
                      type="submit"
                      disabled={isRegistering}
                      className="flex-1 h-12 rounded-xl font-display font-bold text-dark-bg text-sm transition-transform duration-150 ease hover:scale-[1.01] active:scale-[0.98]"
                      style={{
                        background: 'linear-gradient(135deg, #F5A623, #D4891A)',
                        boxShadow: isRegistering
                          ? 'none'
                          : '0 4px 20px rgba(245,166,35,0.35)',
                      }}
                    >
                      {isRegistering ? (
                        <div className="flex items-center gap-2">
                          <Loader2 size={18} className="animate-spin" />
                          <span>Inaunda akaunti...</span>
                        </div>
                      ) : (
                        <span>🎉 Unda Akaunti</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>

          {/* Login link inside card */}
          {!showSuccess && (
            <div className="mt-6 pt-4 border-t border-dark-border text-center">
              <p className="text-text-muted text-sm font-body">
                Una akaunti tayari?{' '}
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-kili-gold hover:text-kili-gold-light font-semibold transition-all duration-200 hover:underline hover:underline-offset-4"
                >
                  Ingia hapa
                  <span>→</span>
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
