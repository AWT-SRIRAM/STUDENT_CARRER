'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { RequireAuth } from '@/lib/auth/RequireAuth';
import { motion } from 'framer-motion';
import { ArrowLeft, LogOut, User, Shield, Cloud, Sparkles, CheckCircle2 } from 'lucide-react';
import FloatingParticlesCanvas from '@/components/FloatingParticlesCanvas';

function SettingsInner() {
  const { profile, isAdmin, signOut } = useAuth();
  const router = useRouter();

  async function onSignOut() {
    await signOut();
    router.replace('/auth');
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-black text-gray-100 relative overflow-hidden flex flex-col justify-between">
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

      <div className="relative z-10 max-w-lg w-full mx-auto px-4 py-8">
        <header className="flex items-center gap-3.5 mb-6">
          <Link
            href="/"
            className="p-2.5 rounded-2xl bg-white/[0.05] border border-white/[0.12] hover:bg-white/[0.1] transition shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Account & Settings</h1>
            <p className="text-xs text-gray-400">Manage your profile and device preferences</p>
          </div>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-2xl border border-white/[0.14] p-6 shadow-2xl relative overflow-hidden"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/40 text-white">
              <User className="w-8 h-8" />
            </div>
            <div>
              <div className="text-xl font-extrabold tracking-tight">{profile.username}</div>
              <div className="text-xs text-gray-400 flex items-center gap-1.5 mt-1">
                {isAdmin ? (
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 font-semibold flex items-center gap-1 text-[10px] uppercase tracking-wider">
                    <Shield className="w-3 h-3 text-blue-300" /> Administrator
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-gray-300 font-medium text-[10px] uppercase tracking-wider">
                    Aspirant Member
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] border border-white/[0.08] px-4 py-3.5">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-gray-300 uppercase tracking-wider">
                <User className="w-4 h-4 text-blue-400" />
                <span>Username</span>
              </div>
              <span className="text-sm font-bold text-white font-mono">{profile.username}</span>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] border border-white/[0.08] px-4 py-3.5">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-gray-300 uppercase tracking-wider">
                <Shield className="w-4 h-4 text-indigo-400" />
                <span>Account Role</span>
              </div>
              <span className="text-sm font-semibold text-white capitalize">{profile.role}</span>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] border border-white/[0.08] px-4 py-3.5">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-gray-300 uppercase tracking-wider">
                <Cloud className="w-4 h-4 text-emerald-400" />
                <span>Cross-Device Cloud Sync</span>
              </div>
              <span className="text-xs text-emerald-300 font-bold flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" /> Active & Synced
              </span>
            </div>
          </div>

          {isAdmin && (
            <Link
              href="/admin"
              className="mt-5 w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 py-3 text-sm font-bold text-white hover:opacity-90 transition shadow-lg shadow-blue-500/30"
            >
              <Shield className="w-4 h-4" />
              Open Admin Control Panel
            </Link>
          )}

          <button
            onClick={onSignOut}
            className="mt-3 w-full flex items-center justify-center gap-2 rounded-2xl bg-red-500/15 border border-red-500/30 py-3 text-sm font-semibold text-red-200 hover:bg-red-500/25 transition"
          >
            <LogOut className="w-4 h-4" />
            Sign out of account
          </button>
        </motion.div>
      </div>

      <footer className="relative z-10 text-center text-xs text-gray-500 py-4">
        TNPSC Group IV Study Tracker • v2.0
      </footer>
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