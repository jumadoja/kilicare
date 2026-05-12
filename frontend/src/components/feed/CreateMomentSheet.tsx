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
import { MusicSelector } from '@/components/music/MusicSelector';
import { BackgroundMusic } from '@/services/music.service';

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
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('PUBLIC');
  const [selectedMusic, setSelectedMusic] = useState<BackgroundMusic | null>(null);
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
        background_music: selectedMusic?.id,
      },
      { onSuccess: handleClose },
    );
  };

  const handleClose = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setCaption('');
    setLocation('');
    setVisibility('PUBLIC');
    setSelectedMusic(null);
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
            className="fixed left-0 right-0 top-0 bottom-0 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl md:h-auto md:max-h-[85vh] z-50 rounded-t-3xl md:rounded-2xl flex flex-col overflow-hidden"
            style={{
              background: 'rgba(10,10,15,0.99)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
          >
            {/* Top gradient line */}
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{
                background:
                  'linear-gradient(90deg, rgba(255,255,255,0), rgba(245,166,35,0.5), rgba(232,69,69,0.3), rgba(255,255,255,0))',
              }}
            />

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-dark-border flex-shrink-0">
              <motion.button
                onClick={handleClose}
                className="text-text-muted hover:text-text-primary transition-colors"
                whileTap={{ scale: 0.9 }}
              >
                <X size={20} />
              </motion.button>

              <h2 className="font-bold font-display text-text-primary text-base">
                Shiriki Moment
              </h2>

              <KiliButton
                variant="primary"
                size="sm"
                onClick={handlePost}
                loading={createMutation.isPending}
                disabled={!mediaFile}
              >
                Chapisha
              </KiliButton>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-5">
              {/* Media upload */}
              <div>
                <label className="text-xs font-semibold text-text-muted font-body block mb-2">
                  Chagua Picha au Video
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Image */}
                  <motion.button
                    onClick={() => {
                      if (fileRef.current) {
                        fileRef.current.accept = 'image/*';
                        fileRef.current.click();
                      }
                    }}
                    className="flex flex-col items-center gap-2 p-3 md:p-4 rounded-xl border-2 border-dashed justify-center"
                    style={{ borderColor: 'rgba(245,166,35,0.4)' }}
                    whileHover={{ borderColor: 'rgba(245,166,35,0.8)', scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Camera size={24} className="text-kili-gold w-6 h-6 md:w-6 md:h-6" />
                    <span className="text-xs font-semibold text-kili-gold font-body">
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
                    className="flex flex-col items-center gap-2 p-3 md:p-4 rounded-xl border-2 border-dashed justify-center"
                    style={{ borderColor: 'rgba(74,158,255,0.4)' }}
                    whileHover={{ borderColor: 'rgba(74,158,255,0.8)', scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Video size={24} className="text-kili-blue w-6 h-6 md:w-6 md:h-6" />
                    <span className="text-xs font-semibold text-kili-blue font-body">
                      Video
                    </span>
                  </motion.button>
                </div>
                <p className="text-xs text-text-muted font-body text-center mt-2">
                  Max: Picha 5MB · Video 20MB
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  onChange={handleFile}
                />
              </div>

              {/* Media preview */}
              {mediaPreview && (
                <div className="relative rounded-2xl overflow-hidden aspect-video max-h-48 md:max-h-64 bg-dark-elevated">
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
                  className="w-full bg-dark-elevated border border-dark-border rounded-xl px-3 md:px-4 py-2 md:py-3 text-sm text-text-primary font-body outline-none focus:border-kili-gold resize-none transition-colors"
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
                        'flex-1 flex flex-col items-center gap-1 py-2 md:py-3 rounded-xl border text-xs font-body transition-colors',
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

              {/* Background Music */}
              <MusicSelector
                selectedMusic={selectedMusic}
                onSelect={setSelectedMusic}
              />

              {/* Bottom padding */}
              <div className="h-4" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}