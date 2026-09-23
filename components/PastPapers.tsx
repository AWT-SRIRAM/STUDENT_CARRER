"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ExternalLink, CheckCircle2, Filter, Info, Bookmark, Sparkles } from 'lucide-react';
import { safeParse } from '@/lib/utils';
import { notifyDataChanged } from '@/lib/sync/bundle';

type Paper = { year: number; exam: string; questions: number; languages: string[]; sourceUrl: string; source: string; note?: string };

export default function PastPapers({ darkMode }: { darkMode: boolean }) {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [attempted, setAttempted] = useState<Record<string, boolean>>({});
  const [yearFilter, setYearFilter] = useState<number | 'all'>('all');

  useEffect(() => {
    fetch('/api/pyq')
      .then((r) => r.json())
      .then((d) => setPapers(d.papers || []))
      .catch(() => {})
      .finally(() => setLoading(false));

    setAttempted(safeParse<Record<string, boolean>>(localStorage.getItem('tnpsc_attempted_papers'), {}));
  }, []);

  const toggleAttempted = (key: string) => {
    const next = { ...attempted };
    if (next[key]) delete next[key];
    else next[key] = true;
    setAttempted(next);
    localStorage.setItem('tnpsc_attempted_papers', JSON.stringify(next));
    notifyDataChanged();
  };

  const cardClass = darkMode
    ? 'bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/[0.14] hover:border-blue-400/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300'
    : 'bg-white/85 backdrop-blur-xl border border-gray-200/80 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/10 shadow-sm transition-all duration-300';

  const years = Array.from(new Set(papers.map((p) => p.year))).sort((a, b) => b - a);
  const filtered = yearFilter === 'all' ? papers : papers.filter((p) => p.year === yearFilter);
  const attemptedCount = Object.keys(attempted).length;

  if (loading) {
    return (
      <div className="text-center py-16 space-y-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 mx-auto border-3 border-blue-500/30 border-t-blue-500 rounded-full"
        />
        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading question paper vault…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className={`${cardClass} p-5 rounded-3xl relative overflow-hidden flex items-center justify-between flex-wrap gap-4`}>
        <div className="flex items-center gap-3.5">
          <motion.div
            whileHover={{ rotate: 8, scale: 1.05 }}
            className="bg-gradient-to-br from-indigo-500 to-blue-600 p-3 rounded-2xl shadow-xl shadow-indigo-500/40 text-white"
          >
            <FileText className="w-6 h-6" />
          </motion.div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
              Previous Year Papers (PYQ)
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300">
                Official Vault
              </span>
            </h2>
            <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {papers.length} official exam papers · {attemptedCount} attempted
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs px-3 py-1.5 rounded-xl font-semibold border border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
            {Math.round(papers.length > 0 ? (attemptedCount / papers.length) * 100 : 0)}% Completed
          </div>
        </div>
      </div>

      <div className={`${cardClass} rounded-2xl p-3.5 flex items-start gap-2.5`}>
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <p className={`text-xs leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Solving past papers helps identify recurring question patterns in Tamil, General Studies & Aptitude. Mark papers as solved to track your readiness.
        </p>
      </div>

      {/* Year Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
        <Filter className={`w-3.5 h-3.5 shrink-0 mr-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
        <button
          onClick={() => setYearFilter('all')}
          className={`text-xs px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition border ${
            yearFilter === 'all'
              ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/30'
              : darkMode
              ? 'bg-white/[0.04] border-white/10 text-gray-300 hover:bg-white/[0.08]'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
          }`}
        >
          All Years
        </button>
        {years.map((y) => (
          <button
            key={y}
            onClick={() => setYearFilter(y)}
            className={`text-xs px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition border ${
              yearFilter === y
                ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/30'
                : darkMode
                ? 'bg-white/[0.04] border-white/10 text-gray-300 hover:bg-white/[0.08]'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Papers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <AnimatePresence>
          {filtered.map((paper) => {
            const key = `${paper.year}-${paper.exam}`;
            const isAttempted = attempted[key];
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={`${cardClass} rounded-2xl p-4.5 flex flex-col justify-between relative overflow-hidden group`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2.5 py-0.5 rounded-lg">
                        {paper.year}
                      </span>
                      <span className={`text-xs font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                        {paper.exam}
                      </span>
                    </div>

                    {isAttempted && (
                      <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Solved
                      </span>
                    )}
                  </div>

                  <h3 className={`text-sm font-bold mb-1.5 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    Official Question Paper · {paper.questions} Questions
                  </h3>

                  <div className={`flex items-center gap-2.5 text-[11px] flex-wrap ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span>{paper.languages.join(' + ')}</span>
                    <span>•</span>
                    <span>{paper.source}</span>
                  </div>

                  {paper.note && (
                    <div className={`text-[10px] mt-2 italic ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {paper.note}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between">
                  <a
                    href={paper.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition"
                  >
                    Open Official PDF <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    onClick={() => toggleAttempted(key)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-semibold border transition flex items-center gap-1.5 ${
                      isAttempted
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : darkMode
                        ? 'bg-white/10 border-white/15 text-gray-300 hover:bg-white/20'
                        : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isAttempted ? 'fill-current' : ''}`} />
                    {isAttempted ? 'Completed' : 'Mark Solved'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className={`${cardClass} rounded-3xl p-10 text-center space-y-2`}>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            No past papers found for this year.
          </p>
        </div>
      )}
    </div>
  );
}