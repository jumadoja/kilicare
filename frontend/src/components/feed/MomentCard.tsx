'use client';
import {
  useRef,
  useEffect,
  useState,
  useCallback,
  memo,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Volume2,
  VolumeX,
  MapPin,
  BadgeCheck,
  Eye,
  Plus,
  MoreVertical,
} from 'lucide-react';
import { Moment } from '@/features/moments/types';
import { KiliAvatar } from '@/components/ui/KiliAvatar';
import { KiliBadge } from '@/components/ui/KiliBadge';
import { useLikeMoment, useSaveMoment } from '@/features/moments/hooks/useMomentsFeed';
import { mediaUrl, formatCount, extractHashtags, timeAgo } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MomentCardProps {
  moment: Moment;
  isActive: boolean;
  onCommentOpen: (moment: Moment) => void;
}

// ── Heart burst ───────────────────────────────────────
function HeartBurst({ x, y, onDone }: { x: number; y: number; onDone: () => void }) {
  return (
    <motion.div
      className="fixed pointer-events-none z-[100]"
      style={{ left: x - 50, top: y - 50 }}
      initial={{ scale: 0, opacity: 1 }}
      animate={{ scale: 3, opacity: 0 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      onAnimationComplete={onDone}
    >
      <Heart
        size={100}
        className="fill-kili-sunset text-kili-sunset"
        style={{ filter: 'drop-shadow(0 0 20px rgba(232,69,69,0.8))' }}
      />
    </motion.div>
  );
}

// ── Caption ───────────────────────────────────────────
function Caption({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 120;
  const shown = expanded || !isLong ? text : text.slice(0, 120);

  return (
    <p
      className="text-white text-sm font-body leading-relaxed"
      style={{ textShadow: '0 1px 8px rgba(0,0,0,0.9)' }}
    >
      {shown}
      {isLong && !expanded && '...'}
      {isLong && (
        <button
          className="text-kili-gold ml-1 text-xs font-semibold"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? ' haba' : ' zaidi'}
        </button>
      )}
    </p>
  );
}

// ── Action button ─────────────────────────────────────
function ActionBtn({
  icon,
  label,
  onClick,
  active = false,
  activeColor,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  activeColor?: string;
}) {
  return (
    <motion.button
      className="flex flex-col items-center gap-1.5"
      onClick={onClick}
      whileTap={{ scale: 0.82 }}
    >
      <motion.div
        className="w-11 h-11 rounded-full flex items-center justify-center"
        style={{
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(12px)',
          border: active
            ? `1px solid ${activeColor ?? 'rgba(255,255,255,0.3)'}`
            : '1px solid rgba(255,255,255,0.1)',
        }}
        animate={active ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        {icon}
      </motion.div>
      <span
        className="text-xs font-semibold font-mono"
        style={{
          color: active ? (activeColor ?? '#fff') : 'rgba(255,255,255,0.9)',
          textShadow: '0 1px 4px rgba(0,0,0,0.8)',
        }}
      >
        {label}
      </span>
    </motion.button>
  );
}

// ── Main component ────────────────────────────────────
export const MomentCard = memo(function MomentCard({
  moment,
  isActive,
  onCommentOpen,
}: MomentCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const tapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(moment.is_liked);
  const [likesCount, setLikesCount] = useState(moment.likes_count);
  const [isSaved, setIsSaved] = useState(moment.is_saved);
  const [isFollowing, setIsFollowing] = useState(false);
  const [heartBursts, setHeartBursts] = useState<
    { id: number; x: number; y: number }[]
  >([]);
  const { user } = useAuthStore();
  const likeMutation = useLikeMoment();
  const saveMutation = useSaveMoment();

  // ── Video control ──────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.play().catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isActive]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted]);

  // ── Like ──────────────────────────────────────────
  const triggerLike = useCallback(
    (x: number, y: number) => {
      // Heart burst animation
      const burst = { id: Date.now(), x, y };
      setHeartBursts((prev: { id: number; x: number; y: number }[]) => [...prev, burst]);

      if (!isLiked) {
        setIsLiked(true);
        setLikesCount((n: number) => n + 1);
        likeMutation.mutate(moment.id);
      }
    },
    [isLiked, moment.id, likeMutation],
  );

  const handleLikeTap = useCallback(() => {
    setIsLiked((prev: boolean) => {
      const next = !prev;
      setLikesCount((n: number) => (next ? n + 1 : n - 1));
      return next;
    });
    likeMutation.mutate(moment.id);
  }, [moment.id, likeMutation]);

  // ── Double tap detection ──────────────────────────
  const handleCardTap = useCallback(
    (e: React.MouseEvent) => {
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
        tapTimerRef.current = null;
        triggerLike(e.clientX, e.clientY);
      } else {
        tapTimerRef.current = setTimeout(() => {
          tapTimerRef.current = null;
        }, 300);
      }
    },
    [triggerLike],
  );

  // Cleanup tap timer on unmount
  useEffect(() => {
    return () => {
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    };
  }, []);

  // ── Save ──────────────────────────────────────────
  const handleSave = useCallback(() => {
    setIsSaved((prev) => !prev);
    saveMutation.mutate(moment.id);
  }, [moment.id, saveMutation]);

  // ── Share ─────────────────────────────────────────
  const handleShare = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/moment/${moment.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `KilicareGO+ | ${moment.posted_by.username}`,
          text: moment.caption ?? '',
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Kiungo kimekopwa! 📋');
      }
      // Track share
    } catch {
      /* user cancelled share */
    }
  }, [moment]);

  const hashtags = extractHashtags(moment.caption ?? '');
  const isOwnMoment = user?.id === moment.posted_by.id;

  return (
    <div
      className="relative w-full bg-dark-bg overflow-hidden"
      style={{ height: '100svh' }}
    >
      {/* ── Heart bursts ── */}
      {heartBursts.map((b: { id: number; x: number; y: number }) => (
        <HeartBurst
          key={b.id}
          x={b.x}
          y={b.y}
          onDone={() =>
            setHeartBursts((prev: { id: number; x: number; y: number }[]) => prev.filter((h: { id: number; x: number; y: number }) => h.id !== b.id))
          }
        />
      ))}

      {/* ── Media layer ── */}
      <div className="absolute inset-0" onClick={handleCardTap}>
        {moment.media_type === 'video' ? (
          <video
            ref={videoRef}
            src={mediaUrl(moment.media)}
            className="w-full h-full object-cover"
            loop
            muted={isMuted}
            playsInline
            autoPlay={isActive}
            preload="metadata"
          />
        ) : (
          <Image
            src={mediaUrl(moment.media)}
            alt={moment.caption ?? 'Moment'}
            fill
            className="object-cover"
            priority={isActive}
            sizes="100vw"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMTMxMzFBIi8+PC9zdmc+"
          />
        )}

        {/* Gradient overlays */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 28%, transparent 52%, rgba(0,0,0,0.9) 100%)',
          }}
        />
      </div>

      {/* ── Top bar ── */}
      <div className="absolute top-0 left-0 right-0 pt-12 px-4 z-10 flex items-center justify-between">
        {/* User info */}
        <div className="flex items-center gap-2.5">
          <KiliAvatar
            src={moment.posted_by.profile?.avatar}
            name={moment.posted_by.username}
            size="sm"
            trustScore={moment.posted_by.passport_trust_score}
            onClick={() => {}}
          />
          <div>
            <div className="flex items-center gap-1">
              <span
                className="text-white font-bold text-sm font-body"
                style={{ textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}
              >
                {moment.posted_by.username}
              </span>
              {moment.is_verified && (
                <BadgeCheck size={13} className="text-kili-blue" />
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <KiliBadge
                variant={
                  moment.posted_by.role as
                    | 'TOURIST'
                    | 'LOCAL_GUIDE'
                    | 'ADMIN'
                }
                size="xs"
              />
              <span className="text-white/50 text-[10px] font-body">
                {timeAgo(moment.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Follow + mute */}
        <div className="flex items-center gap-2">
          {!isOwnMoment && (
            <motion.button
              className="px-3 py-1 rounded-full text-xs font-semibold font-body text-white border"
              style={{
                borderColor: isFollowing
                  ? 'rgba(255,255,255,0.3)'
                  : 'rgba(245,166,35,0.8)',
                background: isFollowing
                  ? 'rgba(255,255,255,0.1)'
                  : 'rgba(245,166,35,0.2)',
                backdropFilter: 'blur(10px)',
              }}
              onClick={() => setIsFollowing((f) => !f)}
              whileTap={{ scale: 0.93 }}
            >
              {isFollowing ? 'Unafuata' : '+ Fuata'}
            </motion.button>
          )}

          {moment.media_type === 'video' && (
            <motion.button
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}
              onClick={() => setIsMuted((m) => !m)}
              whileTap={{ scale: 0.9 }}
            >
              {isMuted
                ? <VolumeX size={14} className="text-white" />
                : <Volume2 size={14} className="text-white" />
              }
            </motion.button>
          )}
        </div>
      </div>

      {/* ── Bottom overlay ── */}
      <div
        className="absolute z-10 left-0 right-16 px-4 pb-6"
        style={{ bottom: '72px' }}
      >
        {/* Caption */}
        {moment.caption && <Caption text={moment.caption} />}

        {/* Location */}
        {moment.location && (
          <div className="flex items-center gap-1.5 mt-2">
            <MapPin size={12} className="text-kili-gold flex-shrink-0" />
            <span
              className="text-white/70 text-xs font-body"
              style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
            >
              {moment.location}
            </span>
          </div>
        )}

        {/* Hashtags */}
        {hashtags.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {hashtags.map((tag) => (
              <span
                key={tag}
                className="text-kili-gold text-xs font-semibold font-body"
                style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Views */}
        <div className="flex items-center gap-1 mt-2">
          <Eye size={11} className="text-white/40" />
          <span className="text-white/40 text-[10px] font-mono">
            {formatCount(moment.views)}
          </span>
        </div>
      </div>

      {/* ── Right action sidebar ── */}
      <div
        className="absolute right-3 z-10 flex flex-col gap-5 items-center"
        style={{ bottom: '80px' }}
      >
        {/* Like */}
        <ActionBtn
          icon={
            <motion.div
              animate={isLiked ? { scale: [1, 1.35, 0.9, 1.15, 1] } : {}}
              transition={{ duration: 0.4 }}
            >
              <Heart
                size={26}
                className={cn(
                  'transition-all duration-200',
                  isLiked
                    ? 'fill-kili-sunset text-kili-sunset'
                    : 'text-white fill-transparent stroke-white',
                )}
                style={{ strokeWidth: 1.5 }}
              />
            </motion.div>
          }
          label={formatCount(likesCount)}
          onClick={handleLikeTap}
          active={isLiked}
          activeColor="#E84545"
        />

        {/* Comment */}
        <ActionBtn
          icon={
            <MessageCircle size={26} className="text-white" style={{ strokeWidth: 1.5 }} />
          }
          label={formatCount(moment.comments_count)}
          onClick={() => onCommentOpen(moment)}
        />

        {/* Save */}
        <ActionBtn
          icon={
            <Bookmark
              size={26}
              className={cn(
                'transition-all duration-200',
                isSaved
                  ? 'fill-kili-gold text-kili-gold'
                  : 'text-white fill-transparent stroke-white',
              )}
              style={{ strokeWidth: 1.5 }}
            />
          }
          label={isSaved ? 'Saved' : 'Save'}
          onClick={handleSave}
          active={isSaved}
          activeColor="#F5A623"
        />

        {/* Share */}
        <ActionBtn
          icon={<Share2 size={24} className="text-white" style={{ strokeWidth: 1.5 }} />}
          label={formatCount(moment.shares)}
          onClick={handleShare}
        />

        {/* Creator avatar */}
        <motion.div
          className="mt-2"
          whileTap={{ scale: 0.9 }}
        >
          <div
            className="rounded-full overflow-hidden"
            style={{
              border: '2px solid #F5A623',
              boxShadow: '0 0 10px rgba(245,166,35,0.4)',
            }}
          >
            <KiliAvatar
              src={moment.posted_by.profile?.avatar}
              name={moment.posted_by.username}
              size="sm"
            />
          </div>
        </motion.div>
      </div>

      {/* ── Featured badge ── */}
      {moment.is_featured && (
        <div className="absolute top-24 left-4 z-10">
          <KiliBadge variant="featured" size="sm" />
        </div>
      )}

      {/* ── Trending badge ── */}
      {moment.trending_score > 70 && !moment.is_featured && (
        <div className="absolute top-24 left-4 z-10">
          <KiliBadge variant="trending" size="sm" />
        </div>
      )}
    </div>
  );
});