'use client';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface TrustScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  animate?: boolean;
}

export function TrustScoreRing({
  score,
  size = 80,
  strokeWidth = 6,
  showLabel = true,
  animate: shouldAnimate = true,
}: TrustScoreRingProps) {
  const [current, setCurrent] = useState(shouldAnimate ? 0 : score);
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const id = `trust-${Math.random().toString(36).slice(2, 7)}`;

  useEffect(() => {
    if (!shouldAnimate) return;
    const timer = setTimeout(() => setCurrent(score), 200);
    return () => clearTimeout(timer);
  }, [score, shouldAnimate]);

  const getColor = (s: number) => {
    if (s >= 86) return `url(#rainbow-${id})`;
    if (s >= 61) return `url(#goldSunset-${id})`;
    if (s >= 31) return '#F5A623';
    return '#4A4A5A';
  };

  const getLabel = (s: number) => {
    if (s >= 86) return { text: 'Bora', color: '#F5A623' };
    if (s >= 61) return { text: 'Nzuri', color: '#F5A623' };
    if (s >= 31) return { text: 'Wastani', color: '#FFB84D' };
    return { text: 'Chini', color: '#8B8BA7' };
  };

  const offset = circumference * (1 - current / 100);
  const label = getLabel(score);

  return (
    <div className="relative inline-flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={`goldSunset-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F5A623" />
            <stop offset="100%" stopColor="#E84545" />
          </linearGradient>
          <linearGradient id={`rainbow-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F5A623" />
            <stop offset="33%" stopColor="#E84545" />
            <stop offset="66%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#4A9EFF" />
          </linearGradient>
        </defs>

        {/* Track */}
        <circle
          cx={center} cy={center} r={radius}
          fill="none"
          stroke="rgba(42,42,58,0.8)"
          strokeWidth={strokeWidth}
        />

        {/* Progress */}
        <motion.circle
          cx={center} cy={center} r={radius}
          fill="none"
          stroke={getColor(score)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          transform={`rotate(-90 ${center} ${center})`}
        />

        {/* Score text */}
        <text
          x={center} y={center}
          textAnchor="middle"
          dominantBaseline="central"
          className="font-mono font-bold"
          style={{
            fill: '#F8F8FF',
            fontSize: size * 0.22,
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          {current}
        </text>
      </svg>

      {showLabel && (
        <motion.span
          className="text-xs font-semibold font-body"
          style={{ color: label.color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {label.text}
        </motion.span>
      )}
    </div>
  );
}