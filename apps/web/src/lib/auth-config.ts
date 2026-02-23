/** Shared auth configuration for API routes */

export const BCRYPT_ROUNDS = 12;
export const PASSWORD_MIN_LENGTH = 8;
export const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim().toLowerCase());
}
