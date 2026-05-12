// Production-safe environment configuration with fallbacks
const getRequiredEnv = (key: string, fallback?: string): string => {
  const value = process.env[key];
  if (!value) {
    if (fallback) {
      console.warn(`⚠️ Environment variable ${key} not found, using fallback: ${fallback}`);
      return fallback;
    }
    throw new Error(`❌ Required environment variable ${key} is missing`);
  }
  return value;
};

export const env = {
  // Required production URLs with safe fallbacks for development
  API_BASE_URL: getRequiredEnv(
    'NEXT_PUBLIC_API_URL', 
    process.env.NODE_ENV === 'development' ? 'http://localhost:8000/api' : 'https://api.kilicare.com/api'
  ),
  WS_BASE_URL: getRequiredEnv(
    'NEXT_PUBLIC_WS_URL',
    process.env.NODE_ENV === 'development' ? 'ws://localhost:8000/ws' : 'wss://api.kilicare.com/ws'
  ),
  
  // Optional tokens
  MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '',
  
  // App metadata
  APP_NAME: 'KilicareGO+',
  APP_VERSION: '1.0.0',
  IS_DEV: process.env.NODE_ENV === 'development',
} as const;