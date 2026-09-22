import { createClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';

export type VerifyAdminResult =
  | { ok: true; userId: string; admin: ReturnType<typeof createAdminClient> }
  | { ok: false; status: number; error: string };

export async function verifyAdmin(req: Request): Promise<VerifyAdminResult> {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace(/^Bearer\s+/i, '');
  if (!token) return { ok: false, status: 401, error: 'Not signed in.' };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) {
    return { ok: false, status: 401, error: 'Invalid session.' };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (!profile || profile.role !== 'admin') {
    return { ok: false, status: 403, error: 'Admin only.' };
  }

  return { ok: true, userId: userData.user.id, admin };
}