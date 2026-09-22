import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateUsername, usernameToEmail } from '@/lib/auth/username';
import { generateRecoveryCode, hashRecoveryCode } from '@/lib/auth/recovery';

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const b = body as { username?: unknown; password?: unknown };
  const u = validateUsername(b.username);
  if (!u.ok) return NextResponse.json({ error: u.error }, { status: 400 });
  const username = u.value;

  const password = typeof b.password === 'string' ? b.password : '';
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Case-insensitive duplicate check.
  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .ilike('username', username)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: 'That username is taken.' }, { status: 409 });
  }

  const email = usernameToEmail(username);

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createErr || !created?.user) {
    return NextResponse.json(
      { error: createErr?.message ?? 'Could not create account.' },
      { status: 500 },
    );
  }

  // Recovery code still generated silently (column is not-null). Never shown.
  const recoveryCodeHash = hashRecoveryCode(generateRecoveryCode());

  const { error: profileErr } = await admin.from('profiles').insert({
    id: created.user.id,
    username, // ← original case preserved
    recovery_code_hash: recoveryCodeHash,
  });

  if (profileErr) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: 'Could not create profile.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, username });
}