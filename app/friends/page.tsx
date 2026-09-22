'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
import { ArrowLeft, Search, UserPlus, Check, X, Users, Loader2, Clock } from 'lucide-react';

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

  const cardClass =
    'rounded-2xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl border border-white/[0.12] p-4';

  return (
    <div className="min-h-screen bg-black text-gray-100 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-25"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.6) 0%, rgba(59,130,246,0) 70%)' }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-25"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.55) 0%, rgba(99,102,241,0) 70%)' }}
        />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6 space-y-5">
        <header className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl bg-white/[0.05] border border-white/[0.12] hover:bg-white/[0.1] transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold tracking-tight">Friends</h1>
            <p className="text-xs text-gray-400">Signed in as {profile.username.toUpperCase()}</p>
          </div>
        </header>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-xl border border-red-500/40 bg-red-500/15 px-3 py-2.5 text-xs text-red-100"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search */}
        <section className={cardClass}>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-300" />
            Find people
          </h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search username (min 3 chars)"
              className="w-full rounded-xl bg-white/[0.05] border border-white/[0.12] text-white placeholder-gray-500 focus:border-blue-400/60 focus:outline-none focus:ring-2 focus:ring-blue-500/30 pl-10 pr-3 py-2.5 text-sm transition"
            />
          </div>

          {searching && (
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
              <Loader2 className="w-3 h-3 animate-spin" /> Searching…
            </div>
          )}

          {!searching && results.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {results.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2.5"
                >
                  <span className="text-sm font-medium">{r.username}</span>
                  {existingIds.has(r.id) ? (
                    <span className="text-xs text-gray-500">Added</span>
                  ) : (
                    <button
                      onClick={() => onAdd(r.id)}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-500 hover:bg-blue-600 transition flex items-center gap-1"
                    >
                      <UserPlus className="w-3 h-3" /> Add
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {!searching && query.trim().length >= 3 && results.length === 0 && (
            <p className="mt-3 text-xs text-gray-500">No matches.</p>
          )}
        </section>

        {/* Incoming requests */}
        {incoming.length > 0 && (
          <section className={cardClass}>
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-300" />
              Requests
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-200 border border-emerald-500/40 font-semibold">
                {incoming.length}
              </span>
            </h2>
            <ul className="space-y-1.5">
              {incoming.map((e) => (
                <li
                  key={e.friendshipId}
                  className="flex items-center justify-between rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2.5"
                >
                  <span className="text-sm font-medium">{e.username}</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => onRespond(e.friendshipId, true)}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 transition flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Accept
                    </button>
                    <button
                      onClick={() => onRespond(e.friendshipId, false)}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 transition flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Decline
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Your FRIENDS */}
        <section className={cardClass}>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-300" />
            Your friends
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 border border-white/20 font-semibold">
              {accepted.length}
            </span>
          </h2>
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Loader2 className="w-3 h-3 animate-spin" /> Loading…
            </div>
          ) : accepted.length === 0 ? (
            <p className="text-xs text-gray-500">No friends yet. Search above to add someone.</p>
          ) : (
            <ul className="space-y-1.5">
              {accepted.map((e) => (
                <li
                  key={e.friendshipId}
                  className="flex items-center justify-between rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2.5"
                >
                  <span className="text-sm font-medium">{e.username}</span>
                  <button
                    onClick={() => onRemove(e.friendshipId)}
                    className="text-xs text-red-300 hover:text-red-200 font-medium transition"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Outgoing pending */}
        {outgoing.length > 0 && (
          <section className={cardClass}>
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-300" />
              Sent requests
            </h2>
            <ul className="space-y-1.5">
              {outgoing.map((e) => (
                <li
                  key={e.friendshipId}
                  className="flex items-center justify-between rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2.5"
                >
                  <span className="text-sm font-medium">{e.username}</span>
                  <button
                    onClick={() => onRemove(e.friendshipId)}
                    className="text-xs text-gray-400 hover:text-gray-200 font-medium transition"
                  >
                    Cancel
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
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