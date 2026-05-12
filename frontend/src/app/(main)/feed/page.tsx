'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMomentsFeed } from '@/features/moments/hooks/useMomentsFeed';
import { useAppStore } from '@/store/app.store';
import { useAuthStore } from '@/store/auth.store';
import { MomentCard } from '@/components/feed/MomentCard';
import { CommentSheet } from '@/components/feed/CommentSheet';
import { CreateMomentSheet } from '@/components/feed/CreateMomentSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loader2, RefreshCw, WifiOff, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from '@/components/ui/ErrorBoundaryWrapper';

export default function FeedPage() {
  // === ALL HOOKS MUST BE DECLARED FIRST ===
  const router = useRouter();
  const authStatus = useAuthStore((state) => state.authStatus);
const authLoading = useAuthStore((state) => state.isLoading);
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  } = useMomentsFeed();

  const [selectedMoment, setSelectedMoment] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [commentMoment, setCommentMoment] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const { isOnline } = useAppStore();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastMomentRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate all moments for scroll detection - extract moments from FeedItemDTO
  const allMoments = data?.pages.flatMap(page => 
    (page.results || []).map(feedItem => feedItem.moment).filter(Boolean)
  ) || [];

  // === STABLE CALLBACKS ===
  const handleAuthRedirect = useCallback(() => {
    router.push('/login');
  }, [router]);

  // === AUTH GUARD EFFECT ===
  useEffect(() => {
    // Only redirect if auth is complete and user is unauthenticated
    if (!authLoading && authStatus === 'unauthenticated') {
      handleAuthRedirect();
    }
  }, [authLoading, authStatus, handleAuthRedirect]);

  // === INFINITE SCROLL LOGIC ===
  useEffect(() => {
    if (authStatus !== 'authenticated') return;
    
    const lastMoment = lastMomentRef.current;
    if (!lastMoment || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(lastMoment);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [authStatus, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // === SCROLL SNAP DETECTION ===
  useEffect(() => {
    if (authStatus !== 'authenticated') return;
    
    const container = containerRef.current;
    if (!container) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = container.scrollTop;
          const h = container.clientHeight;
          const idx = Math.round(scrollTop / h);
          setActiveIndex(Math.min(idx, allMoments.length - 1));
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [authStatus, allMoments.length]);

  // === LOAD MORE TRIGGER ===
  useEffect(() => {
    if (authStatus !== 'authenticated') return;
    
    const el = loadMoreRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [authStatus, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ── Scroll snap — detect active index ──────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = container.scrollTop;
          const h = container.clientHeight;
          const idx = Math.round(scrollTop / h);
          setActiveIndex(Math.min(idx, allMoments.length - 1));
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [allMoments.length]);

  // ── Infinite scroll ─────────────────────────────────
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // === CONDITIONAL RENDERING (AFTER ALL HOOKS) ===
  if (authStatus !== 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-kili-gold animate-spin" />
          <p className="text-text-muted text-sm font-body">Inakagua authentication...</p>
        </div>
      </div>
    );
  }

  // ── Loading ─────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="h-dvh overflow-hidden flex items-center justify-center bg-dark-bg">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-kili-gold animate-spin" />
          <p className="text-text-muted text-sm font-body">Inapakia feed...</p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────
  if (error) {
    return (
      <div className="h-dvh flex items-center justify-center bg-dark-bg">
        <EmptyState
          icon="⚠️"
          title="Imeshindwa kupakia"
          subtitle={
            !isOnline
              ? 'Huna mtandao. Unganisha na ujaribu tena.'
              : 'Hitilafu imetokea. Angalia mtandao wako.'
          }
          actionLabel="Jaribu Tena"
          onAction={() => refetch()}
        />
      </div>
    );
  }

  // ── Empty ────────────────────────────────────────────
  if (allMoments.length === 0) {
    return (
      <div className="h-dvh flex items-center justify-center bg-dark-bg">
        <EmptyState
          icon="📸"
          title="Feed iko tupu"
          subtitle="Fuata watu wengine au shiriki moment yako ya kwanza ili kuanza!"
          actionLabel="Shiriki Moment"
          onAction={() => setIsCreateOpen(true)}
        />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="relative bg-dark-bg overflow-hidden" style={{ height: '100dvh' }}>

        {/* ── Offline banner ── */}
        <AnimatePresence>
          {!isOnline && (
            <motion.div
              className="absolute top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 py-2"
              style={{ background: 'rgba(232,69,69,0.9)' }}
              initial={{ y: -40 }}
              animate={{ y: 0 }}
              exit={{ y: -40 }}
            >
              <WifiOff size={14} className="text-white" />
              <span className="text-white text-xs font-semibold font-body">
                Huna mtandao
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Snap scroll container ── */}
        <div
          ref={containerRef}
          className="h-full overflow-y-scroll"
          style={{
            scrollSnapType: 'y mandatory',
            scrollBehavior: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {allMoments.map((moment, index) => (
            <div
              key={moment?.id || index}
              style={{
                height: '100dvh',
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
                flexShrink: 0,
              }}
            >
              <MomentCard
                moment={moment}
                isActive={activeIndex === index}
                onCommentOpen={setCommentMoment}
              />
            </div>
          ))}

          {/* Load more trigger */}
          <div ref={loadMoreRef} style={{ height: '4px' }} />

          {/* Loading next page */}
          {isFetchingNextPage && (
            <div
              className="flex items-center justify-center bg-dark-bg"
              style={{ height: '100dvh', scrollSnapAlign: 'start' }}
            >
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Loader2 size={36} className="text-kili-gold" />
                </motion.div>
                <p className="text-text-muted text-sm font-body">
                  Inapakia zaidi...
                </p>
              </div>
            </div>
          )}

          {/* End of feed */}
          {!hasNextPage && allMoments.length > 0 && (
            <div
              className="flex items-center justify-center bg-dark-bg"
              style={{ height: '100dvh', scrollSnapAlign: 'start' }}
            >
              <div className="text-center px-8">
                <p className="text-4xl mb-4">🇹🇿</p>
                <p className="font-bold font-display text-text-primary text-lg mb-2">
                  Umefika mwisho!
                </p>
                <p className="text-text-muted text-sm font-body mb-6">
                  Fuata watu zaidi kupata maudhui mapya
                </p>
                <motion.button
                  onClick={() => refetch()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl mx-auto font-semibold text-sm font-body"
                  style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)', color: '#F5A623' }}
                  whileTap={{ scale: 0.97 }}
                >
                  <RefreshCw size={16} />
                  Onyesha Upya
                </motion.button>
              </div>
            </div>
          )}
        </div>

        {/* ── Create Moment FAB ── */}
        <motion.button
          className="fixed bottom-24 left-4 z-40 w-13 h-13 rounded-full flex items-center justify-center"
          style={{
            width: '52px',
            height: '52px',
            background: 'linear-gradient(135deg, #F5A623, #D4891A)',
            boxShadow: '0 0 24px rgba(245,166,35,0.45), 0 4px 12px rgba(0,0,0,0.3)',
          }}
          onClick={() => setIsCreateOpen(true)}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.8, type: 'spring', stiffness: 300 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.88 }}
        >
          <Plus size={24} className="text-dark-bg" strokeWidth={2.5} />
        </motion.button>

        {/* ── Comment Sheet ── */}
        <CommentSheet
          moment={commentMoment}
          isOpen={!!commentMoment}
          onClose={() => setCommentMoment(null)}
        />

        {/* ── Create Moment Sheet ── */}
        <CreateMomentSheet
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
        />
      </div>
    </ErrorBoundary>
  );
}