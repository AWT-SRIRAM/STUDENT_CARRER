import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateUsername } from '@/lib/auth/username';

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ exists: false });
  }

  const u = validateUsername((body as { username?: unknown }).username);
  if (!u.ok) return NextResponse.json({ exists: false });

  const admin = createAdminClient();
  const { data } = await admin
    .from('profiles')
    .select('id')
    .ilike('username', u.value)
    .maybeSingle();

  return NextResponse.json({ exists: !!data });
}