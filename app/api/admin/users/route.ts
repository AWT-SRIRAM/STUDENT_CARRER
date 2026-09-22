import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/verify';

export async function GET(req: Request) {
  const check = await verifyAdmin(req);
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  const { data, error } = await check.admin
    .from('profiles')
    .select('id, username, role, created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users: data ?? [] });
}