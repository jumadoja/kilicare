// utils/getTokenExpiry.ts

/**
 * Parses a JWT token and returns its expiry timestamp in milliseconds.
 * @param token JWT access token
 * @returns expiry time in milliseconds
 */
export const getTokenExpiry = (token: string): number => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000; // JWT exp is in seconds
  } catch {
    return 0; // treat as expired if invalid
  }
};

/**
 * Checks if a JWT token is expired.
 * @param token JWT access token
 * @returns true if expired, false otherwise
 */
export const isTokenExpired = (token: string): boolean => {
  const expiry = getTokenExpiry(token);
  return Date.now() >= expiry;
};