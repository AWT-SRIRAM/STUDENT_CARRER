'use client';

import { getSupabase } from '@/lib/supabase/client';

export type FriendStatus = 'pending' | 'accepted' | 'blocked';

export type FriendEntry = {
  friendshipId: string;
  userId: string;
  username: string;
  status: FriendStatus;
  incoming: boolean;
};

export async function searchUsers(query: string, selfId: string) {
  const q = query.trim().toLowerCase();
  if (q.length < 3) return [];
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username')
    .ilike('username', `%${q}%`)
    .neq('id', selfId)
    .limit(10);
  if (error) throw error;
  return (data ?? []) as { id: string; username: string }[];
}

export async function sendFriendRequest(selfId: string, otherId: string) {
  const supabase = getSupabase();
  const { error } = await supabase.from('friendships').insert({
    requester_id: selfId,
    addressee_id: otherId,
    status: 'pending',
  });
  if (error && error.code !== '23505') throw error;
}

export async function respondToRequest(friendshipId: string, accept: boolean) {
  const supabase = getSupabase();
  if (accept) {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
    if (error) throw error;
  }
}

export async function removeFriend(friendshipId: string) {
  const supabase = getSupabase();
  const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
  if (error) throw error;
}

type FriendshipRow = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendStatus;
};

export async function listFriendships(selfId: string): Promise<FriendEntry[]> {
  const supabase = getSupabase();

  const { data: rows, error } = await supabase
    .from('friendships')
    .select('id, requester_id, addressee_id, status')
    .or(`requester_id.eq.${selfId},addressee_id.eq.${selfId}`);

  if (error) throw error;
  const list = (rows ?? []) as FriendshipRow[];
  if (list.length === 0) return [];

  const otherIds = Array.from(
    new Set(
      list.map((r) => (r.requester_id === selfId ? r.addressee_id : r.requester_id)),
    ),
  );

  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('id, username')
    .in('id', otherIds);
  if (pErr) throw pErr;

  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.username as string]));

  return list.map((r) => {
    const incoming = r.addressee_id === selfId;
    const otherId = incoming ? r.requester_id : r.addressee_id;
    return {
      friendshipId: r.id,
      userId: otherId,
      username: nameById.get(otherId) ?? 'unknown',
      status: r.status,
      incoming,
    };
  });
}