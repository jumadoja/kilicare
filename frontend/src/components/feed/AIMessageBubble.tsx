'use client';
import { motion } from 'framer-motion';
import { AIMessage } from '@/features/ai/types';
import { timeAgo } from '@/lib/utils';
import { cn } from '@/lib/utils';

// ── Simple Markdown Parser ────────────────────────────
function parseMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    if (!line && i > 0) {
      elements.push(<br key={`br-${i}`} />);
      return;
    }

    // H3
    if (line.startsWith('### ')) {
      elements.push(
        <p key={i} className="font-bold text-text-primary text-sm mt-2 mb-1">
          {parseBold(line.slice(4))}
        </p>,
      );
      return;
    }
    // H2
    if (line.startsWith('## ')) {
      elements.push(
        <p key={i} className="font-bold text-kili-gold text-sm mt-2 mb-1">
          {parseBold(line.slice(3))}
        </p>,
      );
      return;
    }
    // Bullet
    if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <div key={i} className="flex gap-2 items-start my-0.5">
          <span className="text-kili-gold text-xs mt-1 flex-shrink-0">•</span>
          <span className="text-sm text-text-secondary leading-relaxed">
            {parseBold(line.slice(2))}
          </span>
        </div>,
      );
      return;
    }
    // Numbered list
    const numbered = line.match(/^(\d+)\.\s(.+)/);
    if (numbered) {
      elements.push(
        <div key={i} className="flex gap-2 items-start my-0.5">
          <span className="text-kili-gold text-xs font-mono mt-1 flex-shrink-0 w-4">
            {numbered[1]}.
          </span>
          <span className="text-sm text-text-secondary leading-relaxed">
            {parseBold(numbered[2])}
          </span>
        </div>,
      );
      return;
    }
    // Code block indicator
    if (line.startsWith('```')) {
      elements.push(
        <div
          key={i}
          className="rounded-lg px-3 py-1 my-1"
          style={{
            background: 'rgba(0,0,0,0.3)',
            borderLeft: '2px solid #F5A623',
          }}
        >
          <code className="text-xs font-mono text-kili-gold">...</code>
        </div>,
      );
      return;
    }
    // Normal text
    if (line) {
      elements.push(
        <p key={i} className="text-sm text-text-secondary leading-relaxed">
          {parseBold(line)}
        </p>,
      );
    }
  });

  return <>{elements}</>;
}

function parseBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-text-primary">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className="font-mono text-kili-gold text-xs px-1 py-0.5 rounded"
          style={{ background: 'rgba(245,166,35,0.1)' }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

// ── Typing dots ───────────────────────────────────────
export function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 px-4">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-extrabold font-display text-dark-bg"
        style={{ background: 'linear-gradient(135deg, #F5A623, #E84545)' }}
      >
        K
      </div>
      <motion.div
        className="px-4 py-3 rounded-2xl rounded-bl-sm"
        style={{
          background: 'rgba(28,28,39,0.9)',
          border: '1px solid rgba(42,42,58,0.8)',
        }}
        initial={{ opacity: 0, y: 8, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <div className="flex gap-1.5 items-center h-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-text-muted"
              animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ── AI Bubble ─────────────────────────────────────────
interface AIBubbleProps {
  message: AIMessage;
  streamedText?: string;
  isStreaming?: boolean;
}

export function AIMessageBubble({ message, streamedText, isStreaming }: AIBubbleProps) {
  const isAI = message.role === 'assistant';
  const displayContent = isStreaming ? (streamedText ?? '') : message.content;

  if (isAI) {
    return (
      <motion.div
        className="flex items-end gap-2 px-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* AI Avatar */}
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-extrabold font-display text-dark-bg"
          style={{
            background: 'linear-gradient(135deg, #F5A623, #E84545)',
            flexShrink: 0,
          }}
        >
          K
        </div>

        <div className="max-w-[82%] space-y-1">
          {/* Image if user sent */}
          {message.image_url && (
            <div className="rounded-xl overflow-hidden max-w-[220px] mb-2">
              <img
                src={message.image_url}
                alt="Picha iliyotumwa"
                className="w-full object-cover"
              />
            </div>
          )}

          {/* Bubble */}
          <div
            className="px-4 py-3 rounded-2xl rounded-bl-sm"
            style={{
              background: 'rgba(28,28,39,0.9)',
              border: '1px solid rgba(42,42,58,0.8)',
            }}
          >
            {parseMarkdown(displayContent)}
            {/* Blinking cursor while streaming */}
            {isStreaming && (
              <motion.span
                className="inline-block w-0.5 h-4 bg-kili-gold ml-0.5 align-middle"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.7, repeat: Infinity }}
              />
            )}
          </div>

          <p className="text-[10px] text-text-disabled ml-1 font-body">
            {timeAgo(message.timestamp)}
          </p>
        </div>
      </motion.div>
    );
  }

  // User bubble
  return (
    <motion.div
      className="flex items-end gap-2 px-4 flex-row-reverse"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-[82%] space-y-1">
        {message.image_url && (
          <div className="rounded-xl overflow-hidden max-w-[220px] mb-2 ml-auto">
            <img
              src={message.image_url}
              alt="Picha iliyotumwa"
              className="w-full object-cover"
            />
          </div>
        )}

        <div
          className="px-4 py-3 rounded-2xl rounded-br-sm"
          style={{
            background: 'rgba(245,166,35,0.12)',
            border: '1px solid rgba(245,166,35,0.25)',
          }}
        >
          <p className="text-sm text-text-primary leading-relaxed">
            {message.content}
          </p>
        </div>

        <p className="text-[10px] text-text-disabled text-right mr-1 font-body">
          {timeAgo(message.timestamp)}
        </p>
      </div>
    </motion.div>
  );
}