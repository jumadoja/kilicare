export const env = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000',
  WS_BASE_URL: process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8000',
  MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '',
  APP_NAME: 'KilicareGO+',
  APP_VERSION: '1.0.0',
  IS_DEV: process.env.NODE_ENV === 'development',
} as const;