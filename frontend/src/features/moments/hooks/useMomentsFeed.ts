import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  InfiniteData,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { momentsService } from '@/services/moments.service';
import { Moment, PaginatedMoments } from '@/features/moments/types';

// ── Feed ─────────────────────────────────────────────
export function useMomentsFeed() {
  return useInfiniteQuery({
    queryKey: ['moments', 'feed'],
    queryFn: ({ pageParam = 1 }) =>
      momentsService.getFeed(pageParam as number),
    getNextPageParam: (last: PaginatedMoments) =>
      last.next ? extractPage(last.next) : undefined,
    initialPageParam: 1,
    staleTime: 1000 * 60 * 2,
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
              results: page.results.map((m) =>
                m.id === momentId
                  ? {
                      ...m,
                      is_liked: !m.is_liked,
                      likes_count: m.is_liked
                        ? m.likes_count - 1
                        : m.likes_count + 1,
                    }
                  : m,
              ),
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
              results: page.results.map((m) =>
                m.id === momentId ? { ...m, is_saved: !m.is_saved } : m,
              ),
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
              results: page.results.map((m) =>
                m.id === id
                  ? { ...m, comments_count: m.comments_count + 1 }
                  : m,
              ),
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
    onError: () => toast.error('Imeshindwa kushiriki. Jaribu tena.'),
  });
}