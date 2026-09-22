import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateUsername } from '@/lib/auth/username';
import {
  generateRecoveryCode,
  hashRecoveryCode,
  verifyRecoveryCode,
} from '@/lib/auth/recovery';

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const b = body as {
    username?: unknown;
    recoveryCode?: unknown;
    newPassword?: unknown;
  };

  const u = validateUsername(b.username);
  if (!u.ok) return NextResponse.json({ error: u.error }, { status: 400 });
  const username = u.value;

  const recoveryCode = typeof b.recoveryCode === 'string' ? b.recoveryCode : '';
  const newPassword = typeof b.newPassword === 'string' ? b.newPassword : '';

  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('profiles')
    .select('id, recovery_code_hash')
    .eq('username', username)
    .maybeSingle();

  const invalid = NextResponse.json(
    { error: 'Invalid username or recovery code.' },
    { status: 401 },
  );
  if (!profile) return invalid;
  if (!verifyRecoveryCode(recoveryCode, profile.recovery_code_hash)) return invalid;

  const { error: pwErr } = await admin.auth.admin.updateUserById(profile.id, {
    password: newPassword,
  });
  if (pwErr) {
    return NextResponse.json({ error: 'Could not update password.' }, { status: 500 });
  }

  const newRecoveryCode = generateRecoveryCode();
  await admin
    .from('profiles')
    .update({ recovery_code_hash: hashRecoveryCode(newRecoveryCode) })
    .eq('id', profile.id);

  return NextResponse.json({ ok: true, recoveryCode: newRecoveryCode });
}