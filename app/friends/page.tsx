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
import { ArrowLeft, Search, UserPlus, Check, X, Users, Loader2, Clock, UserCheck, ShieldAlert } from 'lucide-react';
import FloatingParticlesCanvas from '@/components/FloatingParticlesCanvas';

function FriendsInner() {
  const { user, profile } = useAuth();

  const [entries, setEntries] = useState<FriendEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ id: string; username: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

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
  const friends = entries.filter((e) => e.status === 'accepted');

  async function onSend(targetId: string) {
    setBusyId(targetId);
    setError(null);
    try {
      await sendFriendRequest(user!.id, targetId);
      setQuery('');
      setResults([]);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send request.');
    } finally {
      setBusyId(null);
    }
  }

  async function onRespond(friendshipId: string, accept: boolean) {
    setBusyId(friendshipId);
    setError(null);
    try {
      await respondToRequest(friendshipId, accept);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to respond.');
    } finally {
      setBusyId(null);
    }
  }

  async function onRemove(friendshipId: string, name: string) {
    if (!confirm(`Remove ${name} from your friends?`)) return;
    setBusyId(friendshipId);
    setError(null);
    try {
      await removeFriend(friendshipId);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove.');
    } finally {
      setBusyId(null);
    }
  }

  const cardClass =
    'rounded-3xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-2xl border border-white/[0.14] p-5 shadow-2xl relative overflow-hidden';

  return (
    <div className="min-h-screen bg-black text-gray-100 relative overflow-hidden">
      <FloatingParticlesCanvas darkMode={true} />

      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.6) 0%, rgba(59,130,246,0) 70%)' }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.55) 0%, rgba(99,102,241,0) 70%)' }}
        />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 space-y-6">
        <header className="flex items-center gap-3.5">
          <Link
            href="/"
            className="p-2.5 rounded-2xl bg-white/[0.05] border border-white/[0.12] hover:bg-white/[0.1] transition shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" /> Study Friends
            </h1>
            <p className="text-xs text-gray-400">Connect with fellow TNPSC Group IV aspirants</p>
          </div>
        </header>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-red-500/40 bg-red-500/15 px-4 py-3 text-xs text-red-200 flex items-center gap-2"
          >
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Find Friends Search */}
        <section className={cardClass}>
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300 mb-3 flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-400" /> Find Friends
          </h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by username (min 3 chars)…"
              className="w-full pl-9 pr-4 py-3 rounded-2xl border bg-white/[0.05] border-white/[0.12] text-white placeholder-gray-500 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition"
            />
            {searching && (
              <Loader2 className="w-4 h-4 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-400" />
            )}
          </div>

          {results.length > 0 && (
            <motion.ul
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 divide-y divide-white/[0.08] rounded-2xl bg-black/40 border border-white/[0.08] overflow-hidden"
            >
              {results.map((r) => {
                const existing = entries.find((e) => e.userId === r.id);
                return (
                  <li
                    key={r.id}
                    className="flex items-center justify-between px-4 py-3 text-sm hover:bg-white/[0.03] transition"
                  >
                    <span className="font-semibold text-white">{r.username}</span>
                    {existing ? (
                      <span className="text-[11px] text-gray-400 font-medium capitalize">
                        {existing.status}
                      </span>
                    ) : (
                      <button
                        onClick={() => onSend(r.id)}
                        disabled={busyId === r.id}
                        className="px-3 py-1.5 rounded-xl bg-blue-500/20 border border-blue-500/40 text-xs font-bold text-blue-300 hover:bg-blue-500/30 disabled:opacity-50 flex items-center gap-1.5 transition shadow-sm"
                      >
                        {busyId === r.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <UserPlus className="w-3 h-3" />
                        )}
                        Add
                      </button>
                    )}
                  </li>
                );
              })}
            </motion.ul>
          )}
        </section>

        {/* Incoming Requests */}
        {incoming.length > 0 && (
          <section className={cardClass}>
            <h2 className="text-sm font-bold uppercase tracking-wider text-blue-300 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" /> Incoming Requests ({incoming.length})
            </h2>
            <ul className="space-y-2">
              {incoming.map((req) => (
                <li
                  key={req.friendshipId}
                  className="flex items-center justify-between rounded-2xl bg-white/[0.04] border border-white/[0.08] px-4 py-3"
                >
                  <span className="text-sm font-semibold text-white">{req.username}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onRespond(req.friendshipId, true)}
                      disabled={busyId === req.friendshipId}
                      className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 transition disabled:opacity-50"
                      title="Accept"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onRespond(req.friendshipId, false)}
                      disabled={busyId === req.friendshipId}
                      className="p-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 transition disabled:opacity-50"
                      title="Decline"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Outgoing Pending Requests */}
        {outgoing.length > 0 && (
          <section className={cardClass}>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" /> Pending Outgoing ({outgoing.length})
            </h2>
            <ul className="space-y-2">
              {outgoing.map((req) => (
                <li
                  key={req.friendshipId}
                  className="flex items-center justify-between rounded-2xl bg-white/[0.04] border border-white/[0.08] px-4 py-3 text-sm text-gray-300"
                >
                  <span className="font-medium">{req.username}</span>
                  <span className="text-[11px] text-gray-500 font-mono">Waiting response</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Friends List */}
        <section className={cardClass}>
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300 mb-3 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400" /> Your Friends ({friends.length})
          </h2>
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-gray-400 py-4">
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" /> Loading friends…
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-6 text-xs text-gray-500 space-y-1">
              <p>No friends added yet.</p>
              <p>Search a username above to connect with other aspirants!</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {friends.map((f) => (
                <li
                  key={f.friendshipId}
                  className="flex items-center justify-between rounded-2xl bg-white/[0.04] border border-white/[0.08] px-4 py-3"
                >
                  <span className="text-sm font-bold text-white">{f.username}</span>
                  <button
                    onClick={() => onRemove(f.friendshipId, f.username)}
                    disabled={busyId === f.friendshipId}
                    className="text-xs text-red-400 hover:text-red-300 px-2.5 py-1 rounded-xl hover:bg-red-500/10 transition disabled:opacity-50"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
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