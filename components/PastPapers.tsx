"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ExternalLink, CheckCircle2, Filter, Info, Bookmark } from 'lucide-react';
import { safeParse } from '@/lib/utils';

type Paper = { year: number; exam: string; questions: number; languages: string[]; sourceUrl: string; source: string; note?: string };

export default function PastPapers({ darkMode }: { darkMode: boolean }) {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [attempted, setAttempted] = useState<Record<string, boolean>>({});
  const [yearFilter, setYearFilter] = useState<number | 'all'>('all');

  useEffect(() => {
    fetch('/api/pyq').then((r) => r.json()).then((d) => setPapers(d.papers || [])).catch(() => {}).finally(() => setLoading(false));
    setAttempted(safeParse<Record<string, boolean>>(localStorage.getItem('tnpsc_attempted_papers'), {}));
  }, []);

  const toggleAttempted = (key: string) => { const next = { ...attempted }; if (next[key]) delete next[key]; else next[key] = true; setAttempted(next); localStorage.setItem('tnpsc_attempted_papers', JSON.stringify(next)); };

  const cardClass = darkMode ? 'bg-gradient-to-br from-white/[0.08] to-white/[0.03] backdrop-blur-xl border border-white/[0.14]' : 'bg-white border border-gray-200 shadow-sm';
  const years = Array.from(new Set(papers.map((p) => p.year))).sort((a, b) => b - a);
  const filtered = yearFilter === 'all' ? papers : papers.filter((p) => p.year === yearFilter);
  const attemptedCount = Object.keys(attempted).length;

  if (loading) return <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading past papers...</p>;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/40"><FileText className="w-6 h-6 text-white" /></div>
        <div>
          <h2 className={`text-xl font-bold tracking-tight ${darkMode ? 'text-gray-100' : ''}`}>Previous Year Papers</h2>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{papers.length} papers · {attemptedCount} attempted</p>
        </div>
      </div>

      <div className={`${cardClass} rounded-2xl p-3 flex items-start gap-2`}>
        <Info className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
        <p className={`text-[11px] leading-snug ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Links open Google search for that year's paper, or an aggregator page with many years.</p>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className={`w-3.5 h-3.5 shrink-0 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
        <button onClick={() => setYearFilter('all')} className={`text-xs px-3 py-1 rounded-full font-semibold whitespace-nowrap transition ${yearFilter === 'all' ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/30' : darkMode ? 'bg-white/10 text-gray-300 hover:bg-white/15' : 'bg-gray-100 text-gray-600'}`}>All</button>
        {years.map((y) => (<button key={y} onClick={() => setYearFilter(y)} className={`text-xs px-3 py-1 rounded-full font-semibold whitespace-nowrap transition ${yearFilter === y ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/30' : darkMode ? 'bg-white/10 text-gray-300 hover:bg-white/15' : 'bg-gray-100 text-gray-600'}`}>{y}</button>))}
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {filtered.map((paper) => {
            const key = `${paper.year}-${paper.exam}`;
            const isAttempted = attempted[key];
            return (
              <motion.div key={key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }} className={`${cardClass} rounded-2xl p-4 relative overflow-hidden`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-xs font-bold bg-orange-500/30 text-orange-200 border border-orange-500/40 px-2 py-0.5 rounded-md">{paper.year}</span>
                      <span className={`text-xs font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{paper.exam}</span>
                      {isAttempted && (<span className="text-[10px] font-bold bg-emerald-500/25 text-emerald-200 border border-emerald-500/40 px-1.5 py-0.5 rounded flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Attempted</span>)}
                    </div>
                    <div className={`text-sm font-semibold mb-1 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Full Paper · {paper.questions} Questions</div>
                    <div className={`flex items-center gap-3 text-[11px] flex-wrap ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}><span>{paper.languages.join(' + ')}</span><span>·</span><span>{paper.source}</span></div>
                    {paper.note && <div className={`text-[10px] mt-2 italic ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{paper.note}</div>}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <a href={paper.sourceUrl} target="_blank" rel="noopener noreferrer" className={`text-[10px] transition flex items-center gap-1 justify-end ${darkMode ? 'text-gray-400 hover:text-orange-300' : 'text-gray-500 hover:text-orange-400'}`}>Open <ExternalLink className="w-3 h-3" /></a>
                    <button onClick={() => toggleAttempted(key)} className={`text-[10px] px-2 py-1 rounded-md font-semibold border transition flex items-center gap-1 justify-end ${isAttempted ? 'bg-emerald-500/25 border-emerald-500/40 text-emerald-200' : darkMode ? 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/15' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}><Bookmark className="w-3 h-3" />{isAttempted ? 'Done' : 'Mark'}</button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (<div className={`${cardClass} rounded-2xl p-8 text-center`}><p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No papers for this year.</p></div>)}
    </div>
  );
}