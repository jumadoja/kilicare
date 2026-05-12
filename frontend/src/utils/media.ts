/**
 * Media URL Construction Utility
 * 
 * Production-grade media URL handling that works across all environments.
 * Backend returns relative paths, frontend constructs absolute URLs.
 */

import { env } from '@/config/env';

/**
 * Construct full media URL from relative path
 * 
 * @param relativePath - Relative path from backend (e.g., "/media/images/moment.jpg")
 * @returns Full absolute URL for frontend consumption
 */
export function constructMediaUrl(relativePath: string): string {
  // Ensure path starts with /media/
  if (!relativePath.startsWith('/media/')) {
    console.warn('⚠️ Media path should start with /media/:', relativePath);
  }
  
  // Remove leading slash to avoid double slashes
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  
  // Construct full URL using environment variable
  return `${env.API_BASE_URL}/${cleanPath}`;
}

/**
 * Normalize media URL from backend relative path
 * 
 * @param mediaUrl - Relative path from backend (e.g., "/media/images/moment.jpg")
 * @returns Properly constructed absolute URL
 */
export function normalizeMediaUrl(mediaUrl: string | null | undefined): string | null {
  if (!mediaUrl) return null;
  
  // Backend now only returns relative paths starting with /media/
  if (mediaUrl.startsWith('/media/')) {
    return constructMediaUrl(mediaUrl);
  }
  
  // Handle any other relative paths
  return constructMediaUrl(mediaUrl.startsWith('/') ? mediaUrl : `/${mediaUrl}`);
}

/**
 * Get avatar URL with fallback handling
 * 
 * @param avatarPath - Avatar path from backend
 * @returns Full avatar URL or null
 */
export function getAvatarUrl(avatarPath: string | null | undefined): string | null {
  if (!avatarPath) return null;
  return normalizeMediaUrl(avatarPath);
}

/**
 * Get moment media URL with fallback handling
 * 
 * @param mediaPath - Media path from backend
 * @returns Full media URL or null
 */
export function getMomentMediaUrl(mediaPath: string | null | undefined): string | null {
  if (!mediaPath) return null;
  return normalizeMediaUrl(mediaPath);
}

/**
 * Environment detection for debugging
 */
export function getMediaEnvironment(): {
  apiBaseUrl: string;
  isProduction: boolean;
  isDevelopment: boolean;
} {
  const apiBaseUrl = env.API_BASE_URL;
  const isProduction = apiBaseUrl.includes('https://') && !apiBaseUrl.includes('localhost');
  const isDevelopment = apiBaseUrl.includes('localhost') || apiBaseUrl.includes('127.0.0.1');
  
  return {
    apiBaseUrl,
    isProduction,
    isDevelopment
  };
}
