import crypto from 'crypto';

// Crockford-ish alphabet: no I, O, 0, 1 to avoid transcription errors.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const GROUPS = 5;
const GROUP_LEN = 4;
const CODE_LEN = GROUPS * GROUP_LEN;

export function generateRecoveryCode(): string {
  const bytes = crypto.randomBytes(CODE_LEN);
  let raw = '';
  for (let i = 0; i < CODE_LEN; i++) raw += ALPHABET[bytes[i] % ALPHABET.length];
  return raw.match(new RegExp(`.{${GROUP_LEN}}`, 'g'))!.join('-');
}

function pepper(): string {
  const p = process.env.RECOVERY_PEPPER;
  if (!p) throw new Error('RECOVERY_PEPPER is not set');
  return p;
}

function normalize(code: string): string {
  return code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

export function hashRecoveryCode(code: string): string {
  return crypto.createHmac('sha256', pepper()).update(normalize(code)).digest('hex');
}

export function verifyRecoveryCode(code: string, storedHash: string): boolean {
  const a = Buffer.from(hashRecoveryCode(code), 'hex');
  const b = Buffer.from(storedHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}