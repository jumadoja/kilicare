/**
 * Cookie Utilities
 * Helper functions for reading cookies (for auth state verification)
 * 
 * NOTE: HttpOnly cookies CANNOT be read by JavaScript.
 * This utility is ONLY for non-HttpOnly cookies (CSRF, etc.)
 */

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

/**
 * Check if any auth cookies exist (indirect check)
 * Since HttpOnly cookies can't be read, we check for presence of CSRF token
 * as a proxy for cookie functionality
 */
export function hasAuthCookies(): boolean {
  // Indirect check: if CSRF cookie exists, cookies are working
  return getCookie('csrftoken') !== null || getCookie('csrf_token') !== null;
}
