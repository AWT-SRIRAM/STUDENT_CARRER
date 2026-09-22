export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
export const USERNAME_REGEX = /^[A-Za-z0-9]+$/;
export const USERNAME_EMAIL_DOMAIN = 'tnpsc.local';

export type UsernameResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

export function validateUsername(raw: unknown): UsernameResult {
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (!value) return { ok: false, error: 'Username is required.' };
  if (value.length < USERNAME_MIN)
    return { ok: false, error: `Username must be at least ${USERNAME_MIN} characters.` };
  if (value.length > USERNAME_MAX)
    return { ok: false, error: `Username must be ${USERNAME_MAX} characters or less.` };
  if (!USERNAME_REGEX.test(value))
    return { ok: false, error: 'Username can only contain letters and numbers.' };
  return { ok: true, value: value.toLowerCase() };
}

export function usernameToEmail(username: string): string {
  return `${username.toLowerCase()}@${USERNAME_EMAIL_DOMAIN}`;
}