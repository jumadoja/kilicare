import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('sw-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'sasa hivi';
  if (mins < 60) return `dakika ${mins} zilizopita`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `saa ${hrs} zilizopita`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `siku ${days} zilizopita`;
  return new Date(dateStr).toLocaleDateString('sw-TZ');
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function extractHashtags(text: string): string[] {
  return (text.match(/#\w+/g) ?? []).slice(0, 5);
}

export function mediaUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${process.env.NEXT_PUBLIC_API_URL!}${path}`;
}

export function getBlurDataUrl(color = '#13131A'): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8'><rect width='8' height='8' fill='${color}'/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max);
}