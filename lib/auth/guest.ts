'use client';

export type GuestIdentity = {
  username: string;
  passwordHash: string;
  createdAt: string;
};

const KEY = 'tnpsc_guest';
const UNLOCK_KEY = 'tnpsc_guest_unlocked';

export async function sha256(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function readGuest(): GuestIdentity | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as GuestIdentity) : null;
  } catch {
    return null;
  }
}

export async function writeGuest(username: string, password: string): Promise<GuestIdentity> {
  const g: GuestIdentity = {
    username,
    passwordHash: await sha256(password),
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(KEY, JSON.stringify(g));
  sessionStorage.setItem(UNLOCK_KEY, '1');
  return g;
}

export function clearGuest(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
  sessionStorage.removeItem(UNLOCK_KEY);
}

export function isGuestUnlocked(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(UNLOCK_KEY) === '1';
}

export function unlockGuest(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(UNLOCK_KEY, '1');
}