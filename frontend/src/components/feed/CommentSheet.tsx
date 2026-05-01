'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Moment, MomentComment } from '@/features/moments/types';
import { KiliAvatar } from '@/components/ui/KiliAvatar';
import { KiliBottomSheet } from '@/components/ui/KiliBottomSheet';
import { useCommentMoment } from '@/features/moments/hooks/useMomentsFeed';
import { momentsService } from '@/services/moments.service';
import { timeAgo } from '@/lib/utils';
import { ContactSkeleton } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/store/auth.store';

interface CommentSheetProps {
  moment: Moment | null;
  isOpen: boolean;
  onClose: () => void;
}

function CommentItem({ comment }: { comment: MomentComment }) {
  return (
    <motion.div
      className="flex gap-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <KiliAvatar
        src={comment.user.profile?.avatar}
        name={comment.user.username}
        size="sm"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-xs font-bold text-text-primary font-body">
            {comment.user.username}
          </span>
          <span className="text-[10px] text-text-muted font-body">
            {timeAgo(comment.created_at)}
          </span>
        </div>
        <p className="text-sm text-text-secondary font-body leading-relaxed break-words">
          {comment.comment}
        </p>
      </div>
    </motion.div>
  );
}

export function CommentSheet({ moment, isOpen, onClose }: CommentSheetProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const commentMutation = useCommentMoment();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['moment', moment?.id, 'comments'],
    queryFn: () => momentsService.getComments(moment!.id),
    enabled: !!moment?.id && isOpen,
  });

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 500);
    } else {
      setText('');
    }
  }, [isOpen]);

  // Auto scroll to bottom on new comment
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [comments.length]);

  const handleSend = () => {
    if (!text.trim() || !moment) return;
    commentMutation.mutate(
      { id: moment.id, comment: text.trim() },
      { onSuccess: () => setText('') },
    );
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <KiliBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={`Maoni ${moment ? `(${moment.comments_count})` : ''}`}
      height="70"
    >
      {/* Comments list */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-5"
        style={{ maxHeight: 'calc(70dvh - 140px)' }}
      >
        {isLoading ? (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <ContactSkeleton key={i} />
            ))}
          </>
        ) : comments.length === 0 ? (
          <EmptyState
            icon="💬"
            title="Hakuna maoni bado"
            subtitle="Kuwa wa kwanza kutoa maoni kwenye moment hii!"
          />
        ) : (
          comments.map((c) => <CommentItem key={c.id} comment={c} />)
        )}
      </div>

      {/* Input bar */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-t border-dark-border flex-shrink-0"
        style={{ background: 'rgba(10,10,15,0.98)' }}
      >
        <KiliAvatar
          src={user?.profile?.avatar}
          name={user?.username ?? ''}
          size="sm"
        />

        <div className="flex-1 flex items-center gap-2 rounded-full border border-dark-border bg-dark-elevated px-4 py-2">
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Andika maoni yako..."
            className="flex-1 bg-transparent text-sm text-text-primary font-body outline-none"
            disabled={commentMutation.isPending}
          />
        </div>

        <motion.button
          onClick={handleSend}
          disabled={!text.trim() || commentMutation.isPending}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-all"
          style={{
            background: text.trim()
              ? 'linear-gradient(135deg, #F5A623, #D4891A)'
              : 'rgba(42,42,58,1)',
          }}
          whileTap={{ scale: 0.9 }}
        >
          {commentMutation.isPending ? (
            <Loader2 size={16} className="animate-spin text-dark-bg" />
          ) : (
            <Send
              size={16}
              className={text.trim() ? 'text-dark-bg' : 'text-text-muted'}
            />
          )}
        </motion.button>
      </div>
    </KiliBottomSheet>
  );
}