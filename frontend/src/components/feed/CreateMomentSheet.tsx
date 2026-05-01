'use client';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Camera, Video, MapPin,
  Globe, Users, Lock, Loader2,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCreateMoment } from '@/features/moments/hooks/useMomentsFeed';
import { useLocation } from '@/hooks/useLocation';
import { KiliButton } from '@/components/ui/KiliButton';
import { Visibility } from '@/features/moments/types';
import { cn } from '@/lib/utils';

interface CreateMomentSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const VISIBILITY_CONFIG: {
  value: Visibility;
  label: string;
  icon: React.ReactNode;
  desc: string;
}[] = [
  {
    value: 'PUBLIC',
    label: 'Umma',
    icon: <Globe size={14} />,
    desc: 'Wote wanaweza kuona',
  },
  {
    value: 'FOLLOWERS',
    label: 'Wafuasi',
    icon: <Users size={14} />,
    desc: 'Wanaokufuata tu',
  },
  {
    value: 'PRIVATE',
    label: 'Faragha',
    icon: <Lock size={14} />,
    desc: 'Wewe peke yako',
  },
];

export function CreateMomentSheet({ isOpen, onClose }: CreateMomentSheetProps) {
  const [step, setStep] = useState<'media' | 'details'>('media');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('PUBLIC');
  const fileRef = useRef<HTMLInputElement>(null);
  const createMutation = useCreateMoment();
  const { latitude, longitude } = useLocation();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size
    const maxSize = file.type.startsWith('video/') ? 20 : 5;
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`Faili ni kubwa sana. Max: ${maxSize}MB`);
      return;
    }

    const isVid = file.type.startsWith('video/');
    setMediaType(isVid ? 'video' : 'image');
    setMediaFile(file);

    const reader = new FileReader();
    reader.onload = (r) => {
      setMediaPreview(r.target?.result as string);
      setStep('details');
    };
    reader.readAsDataURL(file);
  };

  const handlePost = () => {
    if (!mediaFile) return;
    createMutation.mutate(
      {
        media: mediaFile,
        media_type: mediaType,
        caption: caption.trim() || undefined,
        location: location.trim() || undefined,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        visibility,
      },
      { onSuccess: handleClose },
    );
  };

  const handleClose = () => {
    setStep('media');
    setMediaFile(null);
    setMediaPreview(null);
    setCaption('');
    setLocation('');
    setVisibility('PUBLIC');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed inset-x-0 top-12 bottom-0 z-50 rounded-t-3xl flex flex-col overflow-hidden"
            style={{
              background: 'rgba(10,10,15,0.99)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
          >
            {/* Top gradient line */}
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(245,166,35,0.5), rgba(232,69,69,0.3), transparent)',
              }}
            />

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-dark-border flex-shrink-0">
              <motion.button
                onClick={
                  step === 'details'
                    ? () => setStep('media')
                    : handleClose
                }
                className="text-text-muted hover:text-text-primary transition-colors"
                whileTap={{ scale: 0.9 }}
              >
                {step === 'details' ? (
                  <span className="text-sm font-body">← Rudi</span>
                ) : (
                  <X size={20} />
                )}
              </motion.button>

              <h2 className="font-bold font-display text-text-primary text-base">
                {step === 'media' ? 'Chagua Media' : 'Maelezo ya Moment'}
              </h2>

              {step === 'details' ? (
                <KiliButton
                  variant="primary"
                  size="sm"
                  onClick={handlePost}
                  loading={createMutation.isPending}
                  disabled={!mediaFile}
                >
                  Chapisha
                </KiliButton>
              ) : (
                <div className="w-16" />
              )}
            </div>

            <AnimatePresence mode="wait">
              {/* ── Step 1: Media selection ── */}
              {step === 'media' && (
                <motion.div
                  key="media"
                  className="flex-1 flex flex-col items-center justify-center p-6 gap-6"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="text-center">
                    <p className="text-lg font-bold font-display text-text-primary mb-2">
                      Shiriki Moment Yako 📸
                    </p>
                    <p className="text-sm text-text-muted font-body">
                      Chagua picha au video kutoka kwenye simu yako
                    </p>
                  </div>

                  <div className="flex gap-4">
                    {/* Image */}
                    <motion.button
                      onClick={() => {
                        if (fileRef.current) {
                          fileRef.current.accept = 'image/*';
                          fileRef.current.click();
                        }
                      }}
                      className="flex flex-col items-center gap-3 w-36 h-36 rounded-2xl border-2 border-dashed justify-center"
                      style={{ borderColor: 'rgba(245,166,35,0.4)' }}
                      whileHover={{ borderColor: 'rgba(245,166,35,0.8)', scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(245,166,35,0.1)' }}
                      >
                        <Camera size={26} className="text-kili-gold" />
                      </div>
                      <span className="text-sm font-semibold text-kili-gold font-body">
                        Picha
                      </span>
                    </motion.button>

                    {/* Video */}
                    <motion.button
                      onClick={() => {
                        if (fileRef.current) {
                          fileRef.current.accept = 'video/*';
                          fileRef.current.click();
                        }
                      }}
                      className="flex flex-col items-center gap-3 w-36 h-36 rounded-2xl border-2 border-dashed justify-center"
                      style={{ borderColor: 'rgba(74,158,255,0.4)' }}
                      whileHover={{ borderColor: 'rgba(74,158,255,0.8)', scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(74,158,255,0.1)' }}
                      >
                        <Video size={26} className="text-kili-blue" />
                      </div>
                      <span className="text-sm font-semibold text-kili-blue font-body">
                        Video
                      </span>
                    </motion.button>
                  </div>

                  <p className="text-xs text-text-muted font-body text-center">
                    Picha: max 5MB · Video: max 20MB
                  </p>

                  <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    onChange={handleFile}
                  />
                </motion.div>
              )}

              {/* ── Step 2: Details ── */}
              {step === 'details' && (
                <motion.div
                  key="details"
                  className="flex-1 overflow-y-auto p-5 space-y-5"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25 }}
                >
                  {/* Media preview */}
                  {mediaPreview && (
                    <div className="relative rounded-2xl overflow-hidden aspect-video max-h-56 bg-dark-elevated">
                      {mediaType === 'video' ? (
                        <video
                          src={mediaPreview}
                          className="w-full h-full object-cover"
                          muted
                          autoPlay
                          loop
                        />
                      ) : (
                        <img
                          src={mediaPreview}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute top-2 right-2">
                        <span
                          className="text-xs font-bold text-white px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(0,0,0,0.6)' }}
                        >
                          {mediaType === 'video' ? '🎬 Video' : '📷 Picha'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Caption */}
                  <div>
                    <label className="text-xs font-semibold text-text-muted font-body block mb-2">
                      Maelezo (si lazima)
                    </label>
                    <textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Elezea moment yako... #Tanzania #Safari #Kilimanjaro"
                      maxLength={300}
                      rows={3}
                      className="w-full bg-dark-elevated border border-dark-border rounded-xl px-4 py-3 text-sm text-text-primary font-body outline-none focus:border-kili-gold resize-none transition-colors"
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-text-muted font-body">
                        Hashtags zinaonekana kwa rangi ya dhahabu
                      </span>
                      <span className="text-xs text-text-muted font-mono">
                        {caption.length}/300
                      </span>
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="text-xs font-semibold text-text-muted font-body block mb-2">
                      Mahali (si lazima)
                    </label>
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-dark-border bg-dark-elevated">
                      <MapPin size={16} className="text-kili-gold flex-shrink-0" />
                      <input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Dar es Salaam, Zanzibar, Kilimanjaro..."
                        className="flex-1 bg-transparent text-sm text-text-primary font-body outline-none"
                      />
                      {latitude && !location && (
                        <button
                          onClick={() => setLocation('Mahali pangu')}
                          className="text-xs text-kili-gold font-semibold font-body"
                        >
                          Tumia GPS
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Visibility */}
                  <div>
                    <label className="text-xs font-semibold text-text-muted font-body block mb-2">
                      Nani anaweza kuona?
                    </label>
                    <div className="flex gap-2">
                      {VISIBILITY_CONFIG.map((opt) => (
                        <motion.button
                          key={opt.value}
                          onClick={() => setVisibility(opt.value)}
                          className={cn(
                            'flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-body transition-colors',
                            visibility === opt.value
                              ? 'text-kili-gold'
                              : 'text-text-muted',
                          )}
                          style={{
                            background:
                              visibility === opt.value
                                ? 'rgba(245,166,35,0.08)'
                                : 'rgba(28,28,39,0.5)',
                            borderColor:
                              visibility === opt.value
                                ? 'rgba(245,166,35,0.4)'
                                : 'rgba(42,42,58,0.8)',
                          }}
                          whileTap={{ scale: 0.96 }}
                        >
                          {visibility === opt.value ? (
                            <CheckCircle2 size={16} className="text-kili-gold" />
                          ) : (
                            opt.icon
                          )}
                          <span className="font-semibold">{opt.label}</span>
                          <span className="text-[9px] text-center leading-tight">
                            {opt.desc}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Bottom padding */}
                  <div className="h-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}