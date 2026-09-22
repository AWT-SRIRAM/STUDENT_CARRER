"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, ExternalLink, Sparkles, TrendingUp, Info } from 'lucide-react';
import { syllabusData } from '@/data/syllabus';

type PracticeSource = { id: string; unitIds: string[]; name: string; beginner: { name: string; description: string; url: string }; advanced: { name: string; description: string; url: string }; master: { name: string; description: string; url: string } };
type ProgressState = { [key: string]: { stage: number } };

export default function Practice({ darkMode, progress }: { darkMode: boolean; progress: ProgressState }) {
  const [subjects, setSubjects] = useState<PracticeSource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch('/api/practice').then((r) => r.json()).then((d) => setSubjects(d.subjects || [])).catch(() => {}).finally(() => setLoading(false)); }, []);

  const getUnitProgress = (unitIds: string[]) => {
    let total = 0, studied = 0, mastered = 0;
    unitIds.forEach((uid) => {
      const unit = syllabusData.parts.flatMap((p) => p.units).find((u) => u.id === uid);
      if (!unit) return;
      unit.topics.forEach((_, idx) => { total++; const s = progress[`${uid}-${idx}`]; if (s && s.stage >= 1) studied++; if (s && s.stage === 5) mastered++; });
    });
    const pct = total === 0 ? 0 : Math.round((studied / total) * 100);
    const masteredPct = total === 0 ? 0 : Math.round((mastered / total) * 100);
    let level: 'beginner' | 'advanced' | 'master' = 'beginner';
    if (masteredPct >= 90) level = 'master'; else if (pct >= 70) level = 'advanced';
    return { pct, masteredPct, level, studied, total };
  };

  const cardClass = darkMode ? 'bg-gradient-to-br from-white/[0.08] to-white/[0.03] backdrop-blur-xl border border-white/[0.14]' : 'bg-white border border-gray-200 shadow-sm';

  if (loading) return <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading practice sources...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <motion.div whileHover={{ rotate: 8, scale: 1.05 }} className="bg-gradient-to-br from-orange-500 to-red-600 p-2.5 rounded-2xl shadow-lg shadow-orange-500/40"><Zap className="w-6 h-6 text-white" /></motion.div>
        <div>
          <h2 className={`text-xl font-bold tracking-tight ${darkMode ? 'text-gray-100' : ''}`}>Practice Hub</h2>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Powered by minnalvegakanitham.in</p>
        </div>
      </div>

      <div className={`${cardClass} rounded-2xl p-3 flex items-start gap-2`}>
        <Info className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
        <p className={`text-[11px] leading-snug ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>All links open minnalvegakanitham.in in a new tab. Tamil-medium practice questions.</p>
      </div>

      {subjects.length > 0 && (
        <div className={`${cardClass} rounded-2xl p-5`}>
          <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-gray-100' : ''}`}><TrendingUp className="w-4 h-4 text-orange-400" /> Your Practice Readiness</h3>
          <div className="space-y-3">
            {subjects.map((s) => {
              const info = getUnitProgress(s.unitIds);
              return (
                <div key={s.id}>
                  <div className="flex justify-between text-xs mb-1"><span className={`font-medium ${darkMode ? 'text-gray-200' : ''}`}>{s.name}</span><span className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{info.pct}%</span></div>
                  <div className={`w-full rounded-full h-2 overflow-hidden ${darkMode ? 'bg-white/10' : 'bg-gray-100'}`}>
                    <motion.div className={`h-full rounded-full ${info.level === 'master' ? 'bg-gradient-to-r from-amber-400 to-orange-500' : info.level === 'advanced' ? 'bg-gradient-to-r from-orange-500 to-red-600' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`} initial={{ width: 0 }} animate={{ width: `${info.pct}%` }} transition={{ type: 'spring', stiffness: 80, damping: 20 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${darkMode ? 'text-gray-100' : ''}`}><Sparkles className="w-4 h-4 text-orange-400" /> Practice Sources</h3>
        <div className="space-y-3">
          {subjects.map((s) => {
            const info = getUnitProgress(s.unitIds);
            const source = info.level === 'master' ? s.master : info.level === 'advanced' ? s.advanced : s.beginner;
            const levelLabel = info.level === 'master' ? 'Master Level' : info.level === 'advanced' ? 'Advanced' : 'Beginner';
            return (
              <motion.a key={s.id} href={source.url} target="_blank" rel="noopener noreferrer" whileHover={{ y: -4, scale: 1.01 }} whileTap={{ scale: 0.98 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }} className={`${cardClass} rounded-2xl p-4 block group cursor-pointer relative overflow-hidden`}>
                <div className="flex items-start justify-between mb-2 gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border ${info.level === 'master' ? 'bg-amber-500/25 text-amber-200 border-amber-500/40' : info.level === 'advanced' ? 'bg-orange-500/25 text-orange-200 border-orange-500/40' : 'bg-blue-500/25 text-blue-200 border-blue-500/40'}`}>{levelLabel}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border ${darkMode ? 'bg-white/10 text-gray-300 border-white/20' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>{s.name}</span>
                  </div>
                  <ExternalLink className={`w-4 h-4 group-hover:text-orange-400 transition shrink-0 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
                <div className={`text-sm font-bold mb-1 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{source.name}</div>
                <div className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{source.description}</div>
                <div className="flex items-center gap-1.5 text-[11px] text-orange-300 font-medium">You studied {info.studied}/{info.total} topics · Tap to open →</div>
              </motion.a>
            );
          })}
        </div>
      </div>

      {subjects.length === 0 && (<div className={`${cardClass} rounded-2xl p-8 text-center`}><Zap className="w-10 h-10 text-gray-400 mx-auto mb-2" /><p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Couldn't load practice sources.</p></div>)}
    </div>
  );
}