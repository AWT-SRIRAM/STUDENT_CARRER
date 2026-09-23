"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ExternalLink, Sparkles, TrendingUp, Info, HelpCircle, CheckCircle2 } from 'lucide-react';
import { syllabusData } from '@/data/syllabus';
import PracticeQuiz from '@/components/PracticeQuiz';
import AnimatedProgressBar from '@/components/AnimatedProgressBar';

type PracticeSource = {
  id: string;
  unitIds: string[];
  name: string;
  beginner: { name: string; description: string; url: string };
  advanced: { name: string; description: string; url: string };
  master: { name: string; description: string; url: string };
};
type ProgressState = { [key: string]: { stage: number } };

export default function Practice({ darkMode, progress }: { darkMode: boolean; progress: ProgressState }) {
  const [subjects, setSubjects] = useState<PracticeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [selectedTopicsForQuiz, setSelectedTopicsForQuiz] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/practice')
      .then((r) => r.json())
      .then((d) => setSubjects(d.subjects || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getUnitProgress = (unitIds: string[]) => {
    let total = 0, studied = 0, mastered = 0;
    unitIds.forEach((uid) => {
      const unit = syllabusData.parts.flatMap((p) => p.units).find((u) => u.id === uid);
      if (!unit) return;
      unit.topics.forEach((_, idx) => {
        total++;
        const s = progress[`${uid}-${idx}`];
        if (s && s.stage >= 1) studied++;
        if (s && s.stage === 5) mastered++;
      });
    });
    const pct = total === 0 ? 0 : Math.round((studied / total) * 100);
    const masteredPct = total === 0 ? 0 : Math.round((mastered / total) * 100);
    let level: 'beginner' | 'advanced' | 'master' = 'beginner';
    if (masteredPct >= 90) level = 'master';
    else if (pct >= 70) level = 'advanced';
    return { pct, masteredPct, level, studied, total };
  };

  const startAIQuizForUnit = (unitIds: string[]) => {
    const topics: string[] = [];
    unitIds.forEach((uid) => {
      const unit = syllabusData.parts.flatMap((p) => p.units).find((u) => u.id === uid);
      if (unit) topics.push(...unit.topics.slice(0, 3));
    });
    setSelectedTopicsForQuiz(topics.slice(0, 5));
    setQuizModalOpen(true);
  };

  const cardClass = darkMode
    ? 'bg-gradient-to-br from-white/[0.08] to-white/[0.03] backdrop-blur-xl border border-white/[0.14] text-gray-100'
    : 'bg-white/90 backdrop-blur-xl border border-indigo-100/90 text-gray-900 shadow-sm';

  if (loading) return <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading practice sources...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <motion.div whileHover={{ rotate: 8, scale: 1.05 }} className="bg-gradient-to-br from-orange-500 to-red-600 p-2.5 rounded-2xl shadow-lg shadow-orange-500/40">
            <Zap className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h2 className={`text-xl font-bold tracking-tight ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Practice Hub</h2>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>TNPSC Group IV Question Sets & AI Mock Quizzes</p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            const allTopics = syllabusData.parts[0].units[0].topics.slice(0, 5);
            setSelectedTopicsForQuiz(allTopics);
            setQuizModalOpen(true);
          }}
          className="text-xs bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white px-4 py-2 rounded-full font-bold shadow-lg shadow-emerald-500/30 flex items-center gap-1.5"
        >
          <Sparkles className="w-4 h-4" /> Launch Instant AI Quiz
        </motion.button>
      </div>

      <div className={`${cardClass} rounded-2xl p-3 flex items-start gap-2.5`}>
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className={`text-[11px] leading-snug ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Practice question sources are curated with Tamil-medium and English-medium materials. Click any module to test your readiness or launch an AI generator.
        </p>
      </div>

      {subjects.length > 0 && (
        <div className={`${cardClass} rounded-2xl p-5`}>
          <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            <TrendingUp className="w-4 h-4 text-orange-400" /> Your Practice Readiness
          </h3>
          <div className="space-y-4">
            {subjects.map((s) => {
              const info = getUnitProgress(s.unitIds);
              return (
                <div key={s.id} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className={darkMode ? 'text-gray-200' : 'text-gray-800'}>{s.name}</span>
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>{info.pct}% ({info.studied}/{info.total} topics)</span>
                  </div>
                  <AnimatedProgressBar
                    value={info.pct}
                    height="h-2.5"
                    colorVariant={info.level === 'master' ? 'orange-amber' : info.level === 'advanced' ? 'purple-pink' : 'cyan-blue'}
                    darkMode={darkMode}
                    showTipGlow={true}
                    showStripes={true}
                    showShimmer={true}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
          <Sparkles className="w-4 h-4 text-orange-400" /> Practice Modules & Source Links
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {subjects.map((s) => {
            const info = getUnitProgress(s.unitIds);
            const source = info.level === 'master' ? s.master : info.level === 'advanced' ? s.advanced : s.beginner;
            const levelLabel = info.level === 'master' ? 'Master Level' : info.level === 'advanced' ? 'Advanced' : 'Beginner';
            return (
              <motion.div
                key={s.id}
                whileHover={{ y: -4, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={`${cardClass} rounded-2xl p-4 flex flex-col justify-between group relative overflow-hidden`}
              >
                <div>
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border ${
                        info.level === 'master'
                          ? 'bg-amber-500/25 text-amber-300 border-amber-500/40'
                          : info.level === 'advanced'
                          ? 'bg-orange-500/25 text-orange-300 border-orange-500/40'
                          : 'bg-blue-500/25 text-blue-300 border-blue-500/40'
                      }`}>
                        {levelLabel}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border ${
                        darkMode ? 'bg-white/10 text-gray-300 border-white/20' : 'bg-gray-100 text-gray-700 border-gray-200'
                      }`}>
                        {s.name}
                      </span>
                    </div>
                  </div>
                  <div className={`text-sm font-bold mb-1 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    {source.name}
                  </div>
                  <div className={`text-xs mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {source.description}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex-1 text-xs py-1.5 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition ${
                      darkMode ? 'bg-white/10 hover:bg-white/15 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }`}
                  >
                    <span>Practice Online</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => startAIQuizForUnit(s.unitIds)}
                    className="text-xs py-1.5 px-3 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90 flex items-center gap-1 shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> AI Quiz
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {subjects.length === 0 && (
        <div className={`${cardClass} rounded-2xl p-8 text-center`}>
          <Zap className="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Couldn't load practice sources.</p>
        </div>
      )}

      <AnimatePresence>
        {quizModalOpen && (
          <PracticeQuiz
            topics={selectedTopicsForQuiz}
            darkMode={darkMode}
            onClose={() => setQuizModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}