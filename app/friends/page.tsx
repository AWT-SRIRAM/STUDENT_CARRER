'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthProvider';
import { RequireAuth } from '@/lib/auth/RequireAuth';
import {
  listFriendships,
  removeFriend,
  respondToRequest,
  searchUsers,
  sendFriendRequest,
  type FriendEntry,
} from '@/lib/friends/api';

function FriendsInner() {
  const { user, profile } = useAuth();

  const [entries, setEntries] = useState<FriendEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ id: string; username: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      setEntries(await listFriendships(user.id));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load friends.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user || query.trim().length < 3) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const r = await searchUsers(query, user.id);
        if (!cancelled) setResults(r);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, user]);

  if (!user || !profile) return null;

  const incoming = entries.filter((e) => e.status === 'pending' && e.incoming);
  const outgoing = entries.filter((e) => e.status === 'pending' && !e.incoming);
  const accepted = entries.filter((e) => e.status === 'accepted');

  const existingIds = new Set(entries.map((e) => e.userId));

  async function onAdd(targetId: string) {
    if (!user) return;
    try {
      await sendFriendRequest(user.id, targetId);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send request.');
    }
  }

  async function onRespond(id: string, accept: boolean) {
    try {
      await respondToRequest(id, accept);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not respond.');
    }
  }

  async function onRemove(id: string) {
    try {
      await removeFriend(id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove.');
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-8 px-4 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Friends</h1>
          <p className="text-xs text-gray-500">Signed in as {profile.username}</p>
        </div>
        <Link href="/" className="text-sm underline">
          Back
        </Link>
      </header>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-gray-700">Find people</h2>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username (min 3 chars)"
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
        {searching && <p className="text-xs text-gray-500">Searching…</p>}
        <ul className="divide-y divide-gray-100 rounded border border-gray-200">
          {results.map((r) => (
            <li key={r.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <span>{r.username}</span>
              {existingIds.has(r.id) ? (
                <span className="text-xs text-gray-400">already added</span>
              ) : (
                <button
                  onClick={() => onAdd(r.id)}
                  className="rounded border border-gray-300 px-2 py-1 text-xs"
                >
                  Add
                </button>
              )}
            </li>
          ))}
          {!searching && query.trim().length >= 3 && results.length === 0 && (
            <li className="px-3 py-2 text-xs text-gray-500">No matches.</li>
          )}
        </ul>
      </section>

      {incoming.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-gray-700">Requests</h2>
          <ul className="divide-y divide-gray-100 rounded border border-gray-200">
            {incoming.map((e) => (
              <li key={e.friendshipId} className="flex items-center justify-between px-3 py-2 text-sm">
                <span>{e.username}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => onRespond(e.friendshipId, true)}
                    className="rounded bg-gray-900 px-2 py-1 text-xs text-white"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => onRespond(e.friendshipId, false)}
                    className="rounded border border-gray-300 px-2 py-1 text-xs"
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-gray-700">Your friends</h2>
        {loading ? (
          <p className="text-xs text-gray-500">Loading…</p>
        ) : accepted.length === 0 ? (
          <p className="text-xs text-gray-500">No friends yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded border border-gray-200">
            {accepted.map((e) => (
              <li key={e.friendshipId} className="flex items-center justify-between px-3 py-2 text-sm">
                <span>{e.username}</span>
                <button
                  onClick={() => onRemove(e.friendshipId)}
                  className="text-xs text-red-600 underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {outgoing.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-gray-700">Pending (sent)</h2>
          <ul className="divide-y divide-gray-100 rounded border border-gray-200">
            {outgoing.map((e) => (
              <li key={e.friendshipId} className="flex items-center justify-between px-3 py-2 text-sm">
                <span>{e.username}</span>
                <button
                  onClick={() => onRemove(e.friendshipId)}
                  className="text-xs text-gray-500 underline"
                >
                  Cancel
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default function FriendsPage() {
  return (
    <RequireAuth>
      <FriendsInner />
    </RequireAuth>
  );
}