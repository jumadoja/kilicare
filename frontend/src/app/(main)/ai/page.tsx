'use client';
import {
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Send, ImageIcon, Mic, MicOff,
  X, Globe, Menu, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useAIChat,
  useAIThreads,
  useProactiveAlerts,
  useVoiceRecording,
} from '@/features/ai/hooks/useAIChat';
import { AIThread, ProactiveAlert } from '@/features/ai/types';
import {
  AIMessageBubble,
  TypingIndicator,
} from '@/components/feed/AIMessageBubble';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppStore } from '@/store/app.store';
import { timeAgo, formatDuration } from '@/lib/format';
import { cn } from '@/lib/utils';

// ── Suggested prompts ─────────────────────────────────
const SUGGESTIONS = [
  { emoji: '🏔️', text: 'Jinsi ya kupanda Kilimanjaro?' },
  { emoji: '🏖️', text: 'Pwani nzuri Zanzibar?' },
  { emoji: '🍖', text: 'Chakula cha Tanzania kitekeleze?' },
  { emoji: '🚕', text: 'Nauli ya taxi Dar es Salaam?' },
  { emoji: '🦁', text: 'Safari Serengeti — gharama na msimu?' },
  { emoji: '🛡️', text: 'Maeneo salama kwa watalii?' },
];

// ── Alert banner ──────────────────────────────────────
function AlertBanner({
  alert,
  onDismiss,
}: {
  alert: ProactiveAlert;
  onDismiss: () => void;
}) {
  const config = {
    weather: {
      bg: 'rgba(74,158,255,0.1)',
      border: 'rgba(74,158,255,0.3)',
      icon: '🌤️',
    },
    event: {
      bg: 'rgba(245,166,35,0.1)',
      border: 'rgba(245,166,35,0.3)',
      icon: '📅',
    },
    security: {
      bg: 'rgba(232,69,69,0.1)',
      border: 'rgba(232,69,69,0.3)',
      icon: '🔐',
    },
  }[alert.alert_type];

  return (
    <motion.div
      className="mx-4 mb-2 px-4 py-3 rounded-xl flex items-start gap-3 flex-shrink-0"
      style={{ background: config.bg, border: `1px solid ${config.border}` }}
      initial={{ opacity: 0, y: -10, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -10, height: 0 }}
    >
      <span className="text-base">{config.icon}</span>
      <p className="text-xs text-text-secondary font-body flex-1 leading-relaxed">
        {alert.message}
      </p>
      <button
        onClick={onDismiss}
        className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

// ── Thread sidebar ────────────────────────────────────
function ThreadSidebar({
  threads,
  activeId,
  onSelect,
  onNew,
  onClose,
}: {
  threads: AIThread[];
  activeId?: string;
  onSelect: (t: AIThread) => void;
  onNew: () => void;
  onClose?: () => void;
}) {
  return (
    <div
      className="flex flex-col h-full"
      style={{
        background: 'rgba(10,10,15,0.98)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-dark-border flex-shrink-0 pt-safe">
        <h2 className="font-bold font-display text-text-primary text-sm">
          Mazungumzo
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* New chat */}
      <div className="px-3 py-3 flex-shrink-0">
        <motion.button
          onClick={onNew}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold font-body text-kili-gold"
          style={{
            background: 'rgba(245,166,35,0.08)',
            border: '1px solid rgba(245,166,35,0.2)',
          }}
          whileHover={{ background: 'rgba(245,166,35,0.14)' }}
          whileTap={{ scale: 0.97 }}
        >
          <Plus size={16} />
          Mazungumzo Mapya
        </motion.button>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto px-3 space-y-1 pb-4">
        {threads.length === 0 ? (
          <p className="text-xs text-text-muted text-center py-10 font-body leading-relaxed">
            Bado hakuna mazungumzo.
            <br />
            Anza mazungumzo mapya! 🤖
          </p>
        ) : (
          threads.map((thread) => (
            <motion.button
              key={thread.id}
              onClick={() => {
                onSelect(thread);
                onClose?.();
              }}
              className={cn(
                'w-full text-left px-3 py-3 rounded-xl transition-all',
                activeId === thread.id
                  ? 'bg-dark-elevated border border-dark-border-light'
                  : 'hover:bg-dark-surface',
              )}
              whileTap={{ scale: 0.98 }}
            >
              <p className="text-xs font-semibold text-text-primary font-body truncate mb-0.5">
                {thread.title || 'Mazungumzo mapya'}
              </p>
              <p className="text-[10px] text-text-muted font-body">
                {timeAgo(thread.updated_at)}
              </p>
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────
export default function AIPage() {
  const { locale, setLocale } = useAppStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<number>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    threadId,
    isStreaming,
    streamedText,
    isSending,
    sendMessage,
    loadThread,
    newChat,
  } = useAIChat();

  const {
    isRecording,
    duration,
    isTranscribing,
    startRecording,
    stopRecording,
    transcribe,
  } = useVoiceRecording();

  const { data: threads = [] } = useAIThreads();
  const { data: alerts = [] } = useProactiveAlerts();

  const visibleAlerts = alerts.filter((a) => !dismissedAlerts.has(a.id)).slice(0, 2);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming, streamedText]);

  // Auto-grow textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [inputText]);

  // Image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Picha ni kubwa sana. Max 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (r) => {
      const b64 = r.target?.result as string;
      setImagePreview(b64);
      setImageBase64(b64);
    };
    reader.readAsDataURL(file);
  };

  // Voice
  const handleVoice = useCallback(async () => {
    if (isRecording) {
      const blob = await stopRecording();
      const result = await transcribe(blob, threadId);
      setInputText(result.user_text);
      setTimeout(() => textareaRef.current?.focus(), 100);
    } else {
      await startRecording();
    }
  }, [isRecording, stopRecording, startRecording, transcribe, threadId]);

  // Send
  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text && !imageBase64) return;
    if (isSending || isStreaming) return;

    sendMessage({
      message: text || '(Picha imetumwa)',
      image: imageBase64 ?? undefined,
    });

    setInputText('');
    setImagePreview(null);
    setImageBase64(null);
  }, [inputText, imageBase64, isSending, isStreaming, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isEmpty = messages.length === 0 && !isStreaming;
  const canSend = (!!inputText.trim() || !!imageBase64) && !isSending && !isStreaming;

  return (
    <div className="flex h-dvh bg-dark-bg overflow-hidden">

      {/* ── Desktop: Thread sidebar ── */}
      <div className="hidden md:block w-72 flex-shrink-0">
        <ThreadSidebar
          threads={threads}
          activeId={threadId}
          onSelect={loadThread}
          onNew={newChat}
        />
      </div>

      {/* ── Mobile: Thread sidebar overlay ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              className="fixed left-0 top-0 bottom-0 z-50 w-72 md:hidden"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <ThreadSidebar
                threads={threads}
                activeId={threadId}
                onSelect={loadThread}
                onNew={newChat}
                onClose={() => setSidebarOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Chat area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-b border-dark-border flex-shrink-0 pt-safe"
          style={{
            background: 'rgba(10,10,15,0.95)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-text-muted hover:text-text-primary transition-colors"
          >
            <Menu size={20} />
          </button>

          {/* AI brand */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-extrabold text-dark-bg font-display flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #F5A623, #E84545)' }}
          >
            K
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm font-display text-text-primary">
              KilicareGO AI
            </p>
            <p className="text-[10px] text-kili-green font-body">
              ● Online · Msaidizi wa Tanzania
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Language toggle */}
            <motion.button
              onClick={() => setLocale(locale === 'en' ? 'sw' : 'en')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-body text-text-secondary"
              style={{
                background: 'rgba(42,42,58,0.8)',
                border: '1px solid rgba(42,42,58,1)',
              }}
              whileTap={{ scale: 0.94 }}
            >
              <Globe size={12} />
              {locale === 'en' ? '🇬🇧 EN' : '🇹🇿 SW'}
            </motion.button>

            {/* New chat */}
            {messages.length > 0 && (
              <motion.button
                onClick={newChat}
                className="text-text-muted hover:text-text-primary transition-colors"
                whileTap={{ scale: 0.9 }}
                title="Mazungumzo mapya"
              >
                <RefreshCw size={18} />
              </motion.button>
            )}
          </div>
        </div>

        {/* Proactive alerts */}
        <AnimatePresence>
          {visibleAlerts.map((alert) => (
            <AlertBanner
              key={alert.id}
              alert={alert}
              onDismiss={() =>
                setDismissedAlerts((prev) => new Set([...prev, alert.id]))
              }
            />
          ))}
        </AnimatePresence>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 min-h-0">
          {isEmpty ? (
            /* ── Welcome / Empty state ── */
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <motion.div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-extrabold text-dark-bg font-display mb-6"
                style={{
                  background: 'linear-gradient(135deg, #F5A623, #E84545)',
                  boxShadow: '0 0 50px rgba(245,166,35,0.35)',
                }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                K
              </motion.div>

              <motion.h2
                className="text-xl font-bold font-display text-text-primary mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Habari! Mimi ni KilicareGO AI 🌍
              </motion.h2>

              <motion.p
                className="text-text-muted text-sm font-body mb-8 max-w-xs leading-relaxed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Msaidizi wako wa utalii Tanzania. Niulize chochote kuhusu
                safari, chakula, usalama, au maeneo mazuri zaidi!
              </motion.p>

              {/* Suggestion chips */}
              <motion.div
                className="grid grid-cols-2 gap-2 w-full max-w-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {SUGGESTIONS.map((s, i) => (
                  <motion.button
                    key={s.text}
                    onClick={() => {
                      setInputText(s.text);
                      setTimeout(() => textareaRef.current?.focus(), 100);
                    }}
                    className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-left"
                    style={{
                      background: 'rgba(28,28,39,0.8)',
                      border: '1px solid rgba(42,42,58,0.8)',
                    }}
                    whileHover={{
                      borderColor: 'rgba(245,166,35,0.3)',
                      scale: 1.01,
                    }}
                    whileTap={{ scale: 0.97 }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                  >
                    <span className="text-base flex-shrink-0">{s.emoji}</span>
                    <span className="text-xs text-text-secondary font-body leading-tight">
                      {s.text}
                    </span>
                  </motion.button>
                ))}
              </motion.div>
            </div>
          ) : (
            /* ── Messages ── */
            <>
              {messages.map((msg, i) => {
                const isLastAI =
                  msg.role === 'assistant' && i === messages.length - 1;
                return (
                  <AIMessageBubble
                    key={msg.id ?? i}
                    message={msg}
                    isStreaming={isLastAI && isStreaming}
                    streamedText={isLastAI && isStreaming ? streamedText : undefined}
                  />
                );
              })}

              {/* Typing indicator */}
              <AnimatePresence>
                {isSending && !isStreaming && <TypingIndicator />}
              </AnimatePresence>
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Input area ── */}
        <div
          className="flex-shrink-0 border-t border-dark-border pb-safe"
          style={{ background: 'rgba(10,10,15,0.97)' }}
        >
          {/* Image preview */}
          <AnimatePresence>
            {imagePreview && (
              <motion.div
                className="flex items-center gap-3 px-4 pt-3"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-dark-border flex-shrink-0">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => { setImagePreview(null); setImageBase64(null); }}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center"
                  >
                    <X size={10} className="text-white" />
                  </button>
                </div>
                <p className="text-xs text-text-muted font-body">
                  Picha iko tayari kutumwa na ujumbe wako
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recording indicator */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                className="flex items-center gap-3 px-4 pt-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="w-2.5 h-2.5 rounded-full bg-kili-sunset flex-shrink-0"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
                <span className="text-xs font-mono text-kili-sunset font-semibold">
                  REC {formatDuration(duration)}
                </span>
                <span className="text-xs text-text-muted font-body">
                  Gusa 🎤 kusimamisha na kutuma
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-2 px-4 py-3">
            {/* Image attach button */}
            <motion.button
              onClick={() => fileRef.current?.click()}
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'rgba(28,28,39,0.8)',
                border: '1px solid rgba(42,42,58,0.8)',
              }}
              whileTap={{ scale: 0.88 }}
            >
              <ImageIcon size={18} className="text-text-muted" />
            </motion.button>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            {/* Text input */}
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                locale === 'sw'
                  ? 'Uliza swali lako la Tanzania...'
                  : 'Ask anything about Tanzania...'
              }
              rows={1}
              disabled={isStreaming || isSending}
              className="flex-1 bg-dark-elevated border border-dark-border rounded-xl px-4 py-2.5 text-sm text-text-primary font-body outline-none focus:border-kili-gold resize-none transition-colors disabled:opacity-60"
              style={{ maxHeight: '120px', minHeight: '44px' }}
            />

            {/* Voice button */}
            <motion.button
              onClick={handleVoice}
              disabled={isTranscribing || isStreaming || isSending}
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-all',
                isRecording && 'animate-pulse',
              )}
              style={{
                background: isRecording
                  ? 'rgba(232,69,69,0.2)'
                  : 'rgba(28,28,39,0.8)',
                border: `1px solid ${isRecording ? 'rgba(232,69,69,0.5)' : 'rgba(42,42,58,0.8)'}`,
              }}
              whileTap={{ scale: 0.88 }}
            >
              {isTranscribing ? (
                <LoadingSpinner size="sm" />
              ) : isRecording ? (
                <MicOff size={18} className="text-kili-sunset" />
              ) : (
                <Mic size={18} className="text-text-muted" />
              )}
            </motion.button>

            {/* Send button */}
            <motion.button
              onClick={handleSend}
              disabled={!canSend}
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-all"
              style={{
                background: canSend
                  ? 'linear-gradient(135deg, #F5A623, #D4891A)'
                  : 'rgba(42,42,58,0.8)',
                boxShadow: canSend ? '0 0 14px rgba(245,166,35,0.3)' : 'none',
              }}
              whileTap={{ scale: 0.88 }}
            >
              {isSending || isStreaming ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Send
                  size={16}
                  className={canSend ? 'text-dark-bg' : 'text-text-muted'}
                  style={{ strokeWidth: 2.5 }}
                />
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}