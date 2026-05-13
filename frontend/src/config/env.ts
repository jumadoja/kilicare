// Production-safe environment configuration with fallbacks.
// API paths in code mix `/auth/...` (no /api prefix) and `/api/...`; axios baseURL must be the
// backend origin only — no trailing `/api` — or requests hit wrong URLs (Network Error locally).
const getRequiredEnv = (key: string, fallback?: string): string => {
  const value = process.env[key];
  if (!value) {
    if (fallback) {
      if (process.env.NODE_ENV === 'production') {
        console.warn(`⚠️ Environment variable ${key} not found, using fallback: ${fallback}`);
      }
      return fallback;
    }
    throw new Error(`❌ Required environment variable ${key} is missing`);
  }
  return value;
};

export const env = {
  API_BASE_URL: getRequiredEnv(
    'NEXT_PUBLIC_API_URL',
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:8000'
      : 'https://api.kilicare.com'
  ),
  WS_BASE_URL: getRequiredEnv(
    'NEXT_PUBLIC_WS_URL',
    process.env.NODE_ENV === 'development'
      ? 'ws://localhost:8000'
      : 'wss://api.kilicare.com'
  ),
  
  // Optional tokens
  MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '',
  
  // App metadata
  APP_NAME: 'KilicareGO+',
  APP_VERSION: '1.0.0',
  IS_DEV: process.env.NODE_ENV === 'development',
} as const;