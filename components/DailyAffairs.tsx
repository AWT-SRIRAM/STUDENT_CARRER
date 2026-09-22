"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, RefreshCw, Calendar, ExternalLink, BookOpen, Trash2, ChevronRight } from 'lucide-react';
import { todayISO, formatDisplayDate, safeParse } from '@/lib/utils';

type NewsItem = { category: string; date: string; title: string; url: string };
type SavedNotes = { [isoDate: string]: NewsItem[] };

const CATEGORY_COLORS: Record<string, string> = {
  'Important Days': 'bg-amber-500/25 text-amber-200 border-amber-500/40',
  'Science and Technology News': 'bg-indigo-500/25 text-indigo-200 border-indigo-500/40',
  'Economy News': 'bg-emerald-500/25 text-emerald-200 border-emerald-500/40',
  'National News': 'bg-blue-500/25 text-blue-200 border-blue-500/40',
  'Tamil Nadu News': 'bg-orange-500/25 text-orange-200 border-orange-500/40',
  'Personalities, Awards and Events': 'bg-purple-500/25 text-purple-200 border-purple-500/40',
  'Reports and Indices': 'bg-cyan-500/25 text-cyan-200 border-cyan-500/40',
  "States News": 'bg-pink-500/25 text-pink-200 border-pink-500/40',
  'Miscellaneous News': 'bg-gray-500/25 text-gray-200 border-gray-500/40',
  'TNPSC Bits': 'bg-red-500/25 text-red-200 border-red-500/40',
  'International News': 'bg-teal-500/25 text-teal-200 border-teal-500/40',
  'Current Affairs': 'bg-orange-500/25 text-orange-200 border-orange-500/40',
};

export default function DailyAffairs({ darkMode }: { darkMode: boolean }) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saved, setSaved] = useState<SavedNotes>({});
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [activeView, setActiveView] = useState<'news' | 'notes'>('news');

  useEffect(() => { setSaved(safeParse<SavedNotes>(localStorage.getItem('tnpsc_daily_notes'), {})); }, []);
  const persistSaved = (next: SavedNotes) => { setSaved(next); localStorage.setItem('tnpsc_daily_notes', JSON.stringify(next)); };

  const fetchNews = async () => {
    try {
      const res = await fetch('/api/current-affairs');
      const data = await res.json();
      setItems(data.items || []);
      if (data.items?.length) {
        localStorage.setItem('tnpsc_ca_cache', JSON.stringify(data.items));
        localStorage.setItem('tnpsc_ca_date', todayISO());
        const today = todayISO();
        const currentSaved = safeParse<SavedNotes>(localStorage.getItem('tnpsc_daily_notes'), {});
        const existing = currentSaved[today] || [];
        const newItems = data.items.filter((item: NewsItem) => !existing.some((e) => e.title === item.title));
        if (newItems.length > 0) { persistSaved({ ...currentSaved, [today]: [...existing, ...newItems] }); setExpandedDates((prev) => ({ ...prev, [today]: true })); }
      }
    } catch { setItems(safeParse<NewsItem[]>(localStorage.getItem('tnpsc_ca_cache'), [])); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => {
    const cachedDate = localStorage.getItem('tnpsc_ca_date');
    const cached = localStorage.getItem('tnpsc_ca_cache');
    if (cachedDate === todayISO() && cached) { setItems(safeParse<NewsItem[]>(cached, [])); setLoading(false); }
    else fetchNews();
  }, []);

  const today = todayISO();
  const removeNote = (iso: string, title: string) => { const next = { ...saved }; next[iso] = next[iso].filter((n) => n.title !== title); if (next[iso].length === 0) delete next[iso]; persistSaved(next); };

  const cardClass = darkMode ? 'bg-gradient-to-br from-white/[0.08] to-white/[0.03] backdrop-blur-xl border border-white/[0.14]' : 'bg-white border border-gray-200 shadow-sm';
  const sortedDates = Object.keys(saved).sort().reverse();
  const totalNotes = Object.values(saved).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <motion.div whileHover={{ rotate: 8, scale: 1.05 }} className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-blue-500/40"><Newspaper className="w-6 h-6 text-white" /></motion.div>
          <div>
            <h2 className={`text-xl font-bold tracking-tight ${darkMode ? 'text-gray-100' : ''}`}>Daily Affairs</h2>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{activeView === 'news' ? "Today's news · Auto-saved to notes" : `${totalNotes} notes across ${sortedDates.length} days`}</p>
          </div>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { setRefreshing(true); fetchNews(); }} disabled={refreshing || activeView === 'notes'} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold border transition ${darkMode ? 'bg-white/10 border-white/20 hover:bg-white/15 text-gray-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-600'} ${activeView === 'notes' ? 'opacity-40 cursor-not-allowed' : ''}`}>
          <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />{refreshing ? 'Loading...' : 'Refresh'}
        </motion.button>
      </div>

      <div className="flex gap-2 p-1 rounded-full w-fit" style={{ background: darkMode ? 'rgba(255,255,255,0.08)' : '#f3f4f6' }}>
        {[{ id: 'news' as const, label: "Today's News", icon: Newspaper }, { id: 'notes' as const, label: `My Notes ${totalNotes > 0 ? `(${totalNotes})` : ''}`, icon: BookOpen }].map((view) => (
          <button key={view.id} onClick={() => setActiveView(view.id)} className={`relative flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap ${activeView === view.id ? 'text-white' : darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
            {activeView === view.id && (<motion.div layoutId="daViewTab" className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-600 rounded-full shadow-lg shadow-orange-500/40" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />)}
            <span className="relative z-10 flex items-center gap-1.5"><view.icon className="w-3 h-3" />{view.label}</span>
          </button>
        ))}
      </div>

      {activeView === 'news' && (
        <>
          {loading && (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{[...Array(6)].map((_, i) => <div key={i} className={`${cardClass} rounded-2xl p-4 animate-pulse h-36`} />)}</div>)}
          {!loading && items.length === 0 && (<div className={`${cardClass} rounded-2xl p-8 text-center`}><BookOpen className="w-10 h-10 text-gray-400 mx-auto mb-2" /><p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Couldn't load current affairs. Tap Refresh.</p></div>)}
          {!loading && items.length > 0 && (
            <motion.div initial="initial" animate="animate" variants={{ animate: { transition: { staggerChildren: 0.04 } } }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((item, i) => {
                const badgeClass = CATEGORY_COLORS[item.category] || 'bg-orange-500/25 text-orange-200 border-orange-500/40';
                return (
                  <motion.div key={i} variants={{ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }} whileHover={{ y: -4, scale: 1.01 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }} className={`${cardClass} rounded-2xl p-4 relative overflow-hidden group`}>
                    <div className="flex items-start justify-between mb-2 gap-2"><span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border ${badgeClass} truncate max-w-[70%]`}>{item.category}</span></div>
                    <div className={`flex items-center gap-1.5 text-[11px] mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}><Calendar className="w-3 h-3" />{item.date}</div>
                    <h3 className={`text-sm font-semibold leading-snug line-clamp-3 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{item.title}</h3>
                    {item.url && (<a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-[11px] text-orange-300 hover:text-orange-200 font-medium">Read full <ExternalLink className="w-3 h-3" /></a>)}
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {!loading && sortedDates.length > 0 && (
            <div className={`${cardClass} rounded-2xl overflow-hidden mt-6`}>
              <div className={`p-4 border-b ${darkMode ? 'bg-white/[0.04] border-white/[0.12]' : 'bg-gray-50/50 border-gray-100'}`}>
                <h3 className={`font-bold text-base flex items-center gap-2 ${darkMode ? 'text-gray-100' : ''}`}><BookOpen className="w-4 h-4 text-orange-400" /> Saved Notes</h3>
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Auto-saved day by day · {totalNotes} total</p>
              </div>
              <div className={`divide-y ${darkMode ? 'divide-white/[0.08]' : 'divide-gray-100'}`}>
                {sortedDates.slice(0, 5).map((iso) => (
                  <div key={iso} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{formatDisplayDate(iso)}</span>
                      <span className="text-[10px] bg-orange-500/25 text-orange-200 border border-orange-500/40 px-2 py-0.5 rounded-full font-semibold">{saved[iso].length} items</span>
                    </div>
                    <div className="space-y-1.5">
                      {saved[iso].slice(0, 3).map((note, i) => (<div key={i} className="flex items-start gap-2"><span className="text-[10px] text-orange-400 mt-0.5">•</span><p className={`text-xs leading-snug ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{note.title}</p></div>))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {activeView === 'notes' && (
        <>
          {sortedDates.length === 0 ? (<div className={`${cardClass} rounded-2xl p-8 text-center`}><BookOpen className="w-10 h-10 text-gray-400 mx-auto mb-2" /><p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No notes yet.</p></div>) : (
            <div className="space-y-3">
              {sortedDates.map((iso) => {
                const isExpanded = expandedDates[iso] !== false;
                const notesForDate = saved[iso];
                return (
                  <motion.div key={iso} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`${cardClass} rounded-2xl overflow-hidden`}>
                    <button onClick={() => setExpandedDates((prev) => ({ ...prev, [iso]: !isExpanded }))} className={`w-full flex items-center justify-between p-4 transition ${darkMode ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50'}`}>
                      <div className="flex items-center gap-3">
                        <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}><ChevronRight className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} /></motion.div>
                        <div className="text-left">
                          <div className={`font-bold text-sm ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{formatDisplayDate(iso)}</div>
                          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{notesForDate.length} item{notesForDate.length > 1 ? 's' : ''}</div>
                        </div>
                      </div>
                      <span className="text-xs bg-orange-500/25 text-orange-200 border border-orange-500/40 px-2.5 py-1 rounded-full font-semibold">{notesForDate.length}</span>
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                          <div className={`p-4 pt-0 space-y-2 ${darkMode ? 'bg-black/30' : 'bg-gray-50/50'}`}>
                            {notesForDate.map((note) => {
                              const badgeClass = CATEGORY_COLORS[note.category] || 'bg-orange-500/25 text-orange-200 border-orange-500/40';
                              return (
                                <div key={note.title} className={`p-3 rounded-xl flex items-start gap-3 ${darkMode ? 'bg-white/[0.06] border border-white/[0.08]' : 'bg-white border border-gray-100'}`}>
                                  <div className="flex-1 min-w-0">
                                    <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ${badgeClass} inline-block mb-1.5`}>{note.category}</span>
                                    <p className={`text-sm leading-snug ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{note.title}</p>
                                  </div>
                                  <button onClick={() => removeNote(iso, note.title)} className="text-red-400 hover:text-red-300 p-1 shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}