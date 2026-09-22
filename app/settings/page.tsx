'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { RequireAuth } from '@/lib/auth/RequireAuth';
import { motion } from 'framer-motion';
import { ArrowLeft, LogOut, User, Shield, Calendar } from 'lucide-react';

function SettingsInner() {
  const { profile, isAdmin, signOut } = useAuth();
  const router = useRouter();

  async function onSignOut() {
    await signOut();
    router.replace('/auth');
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-black text-gray-100 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-25"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.6) 0%, rgba(59,130,246,0) 70%)' }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-25"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.55) 0%, rgba(99,102,241,0) 70%)' }}
        />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 py-6">
        <header className="flex items-center gap-3 mb-6">
          <Link
            href="/"
            className="p-2 rounded-xl bg-white/[0.05] border border-white/[0.12] hover:bg-white/[0.1] transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-lg font-bold tracking-tight">Settings</h1>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl border border-white/[0.12] p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/40">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold">{profile.username}</div>
              <div className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                {isAdmin ? (
                  <>
                    <Shield className="w-3 h-3 text-blue-300" />
                    <span className="text-blue-300 font-semibold">Administrator</span>
                  </>
                ) : (
                  <span>Member</span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <User className="w-4 h-4 text-gray-400" />
                <span>Username</span>
              </div>
              <span className="text-sm font-semibold">{profile.username}</span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Shield className="w-4 h-4 text-gray-400" />
                <span>Role</span>
              </div>
              <span className="text-sm font-semibold">{isAdmin ? 'Admin' : 'User'}</span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>Sync</span>
              </div>
              <span className="text-xs text-emerald-300 font-semibold">Enabled</span>
            </div>
          </div>

          {isAdmin && (
            <Link
              href="/admin"
              className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-blue-500/20 border border-blue-500/40 py-2.5 text-sm font-semibold text-blue-100 hover:bg-blue-500/30 transition"
            >
              <Shield className="w-4 h-4" />
              Open Admin Panel
            </Link>
          )}

          <button
            onClick={onSignOut}
            className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-red-500/15 border border-red-500/40 py-2.5 text-sm font-semibold text-red-200 hover:bg-red-500/25 transition"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </motion.div>

        <p className="text-center text-[11px] text-gray-500 mt-6">
          TNPSC Tracker • Signed in as {profile.username}
        </p>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <RequireAuth>
      <SettingsInner />
    </RequireAuth>
  );
}