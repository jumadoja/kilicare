import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  InfiniteData,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { momentsService } from '@/services/moments.service';
import { Moment, PaginatedMoments, FeedItemDTO } from '@/features/moments/types';
import { useAuthStore } from '@/store/auth.store';

// ── Feed ─────────────────────────────────────────────
export function useMomentsFeed() {
  const authStatus = useAuthStore((state) => state.authStatus);
  const user = useAuthStore((state) => state.user);
  
  return useInfiniteQuery({
    queryKey: ['moments', 'feed'],
    queryFn: ({ pageParam = 1 }) =>
      momentsService.getFeed(pageParam as number),
    getNextPageParam: (last: PaginatedMoments) =>
      last.next ? extractPage(last.next) : undefined,
    initialPageParam: 1,
    staleTime: 1000 * 60 * 2,
    
    // CRITICAL FIX: Only enable query when auth is ready
    enabled: authStatus === 'authenticated' && !!user,
    
    // Prevent refetching on window focus if auth isn't ready
    refetchOnWindowFocus: authStatus === 'authenticated',
  });
}

function extractPage(url: string): number {
  const match = url.match(/page=(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
}

// ── Like (optimistic) ─────────────────────────────────
export function useLikeMoment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => momentsService.likeMoment(id),

    onMutate: async (momentId) => {
      await qc.cancelQueries({ queryKey: ['moments', 'feed'] });
      const previous = qc.getQueryData<InfiniteData<PaginatedMoments>>([
        'moments',
        'feed',
      ]);

      qc.setQueryData<InfiniteData<PaginatedMoments>>(
        ['moments', 'feed'],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              results: page.results.map((feedItem) => {
                // Handle FeedItemDTO structure
                const moment = feedItem.moment;
                if (moment.id === momentId) {
                  return {
                    ...feedItem,
                    moment: {
                      ...moment,
                      is_liked: !moment.is_liked,
                      likes_count: moment.is_liked
                        ? moment.likes_count - 1
                        : moment.likes_count + 1,
                    }
                  };
                }
                return feedItem;
              }),
            })),
          };
        },
      );

      return { previous };
    },

    onError: (_, __, ctx) => {
      if (ctx?.previous)
        qc.setQueryData(['moments', 'feed'], ctx.previous);
      toast.error('Imeshindwa. Jaribu tena.');
    },

    onSettled: () =>
      qc.invalidateQueries({ queryKey: ['moments', 'feed'] }),
  });
}

// ── Save ──────────────────────────────────────────────
export function useSaveMoment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => momentsService.saveMoment(id),
    onMutate: async (momentId) => {
      await qc.cancelQueries({ queryKey: ['moments', 'feed'] });
      const previous = qc.getQueryData(['moments', 'feed']);
      qc.setQueryData<InfiniteData<PaginatedMoments>>(
        ['moments', 'feed'],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              results: page.results.map((feedItem) => {
                // Handle FeedItemDTO structure
                const moment = feedItem.moment;
                if (moment.id === momentId) {
                  return {
                    ...feedItem,
                    moment: {
                      ...moment,
                      is_saved: !moment.is_saved
                    }
                  };
                }
                return feedItem;
              }),
            })),
          };
        },
      );
      return { previous };
    },
    onError: (_, __, ctx) => {
      if (ctx?.previous) qc.setQueryData(['moments', 'feed'], ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['moments', 'saved'] }),
  });
}

// ── Comment ───────────────────────────────────────────
export function useCommentMoment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: number; comment: string }) =>
      momentsService.commentMoment(id, comment),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['moment', id, 'comments'] });
      // Increment comments_count optimistically
      qc.setQueryData<InfiniteData<PaginatedMoments>>(
        ['moments', 'feed'],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              results: page.results.map((feedItem) => {
                // Handle FeedItemDTO structure
                const moment = feedItem.moment;
                if (moment.id === id) {
                  return {
                    ...feedItem,
                    moment: {
                      ...moment,
                      comments_count: moment.comments_count + 1
                    }
                  };
                }
                return feedItem;
              }),
            })),
          };
        },
      );
    },
    onError: () => toast.error('Imeshindwa kutuma maoni.'),
  });
}

// ── Create ────────────────────────────────────────────
export function useCreateMoment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: momentsService.createMoment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['moments', 'feed'] });
      toast.success('Moment imeshirikiwa! 🎉');
    },
    onError: () => toast.error('Imeshindika kushiriki. Jaribu tena.'),
  });
}

// ── Follow ────────────────────────────────────────────
export function useFollowUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => momentsService.followUser(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['moments', 'feed'] });
      toast.success('Umefuata mtumiaji!');
    },
    onError: () => toast.error('Imeshindika kufuata. Jaribu tena.'),
  });
}

export function useUnfollowUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => momentsService.unfollowUser(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['moments', 'feed'] });
      toast.success('Umefuta ufuataji.');
    },
    onError: () => toast.error('Imeshindika kufuta ufuataji. Jaribu tena.'),
  });
}