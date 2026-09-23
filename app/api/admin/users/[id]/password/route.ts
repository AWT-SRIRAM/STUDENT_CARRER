import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/verify';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const check = await verifyAdmin(req);
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  const { id } = await params;

  let body: { password?: string };
  try {
    body = (await req.json()) as { password?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const password = body.password?.trim();
  if (!password || password.length < 6) {
    return NextResponse.json(
      { error: 'Password must be at least 6 characters long.' },
      { status: 400 },
    );
  }

  const { error } = await check.admin.auth.admin.updateUserById(id, {
    password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
