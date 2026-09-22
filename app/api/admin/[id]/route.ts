import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin/verify';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const check = await verifyAdmin(req);
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  const { id } = await params;

  // Don't let an admin delete themselves by accident.
  if (id === check.userId) {
    return NextResponse.json({ error: 'You cannot delete your own account here.' }, { status: 400 });
  }

  const { error } = await check.admin.auth.admin.deleteUser(id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}