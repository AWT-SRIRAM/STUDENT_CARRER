"use client";

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Newspaper, RefreshCw, Calendar, ExternalLink, BookOpen, Trash2,
  ChevronRight, Search, Sparkles, Filter, Bookmark, Check
} from 'lucide-react';
import { todayISO, formatDisplayDate, safeParse } from '@/lib/utils';
import { notifyDataChanged } from '@/lib/sync/bundle';

type NewsItem = { category: string; date: string; title: string; url: string };
type SavedNotes = { [isoDate: string]: NewsItem[] };

const CATEGORY_COLORS: Record<string, string> = {
  'Important Days': 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  'Science and Technology News': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
  'Economy News': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  'National News': 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  'Tamil Nadu News': 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  'Personalities, Awards and Events': 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  'Reports and Indices': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  'States News': 'bg-pink-500/20 text-pink-300 border-pink-500/40',
  'Miscellaneous News': 'bg-gray-500/20 text-gray-300 border-gray-500/40',
  'TNPSC Bits': 'bg-red-500/20 text-red-300 border-red-500/40',
  'International News': 'bg-teal-500/20 text-teal-300 border-teal-500/40',
  'Current Affairs': 'bg-blue-500/20 text-blue-300 border-blue-500/40',
};

export default function DailyAffairs({ darkMode }: { darkMode: boolean }) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saved, setSaved] = useState<SavedNotes>({});
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [activeView, setActiveView] = useState<'news' | 'notes'>('news');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [bookmarkedTitles, setBookmarkedTitles] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadedNotes = safeParse<SavedNotes>(localStorage.getItem('tnpsc_daily_notes'), {});
    setSaved(loadedNotes);
    const map: Record<string, boolean> = {};
    Object.values(loadedNotes).forEach((arr) => {
      arr.forEach((n) => { map[n.title] = true; });
    });
    setBookmarkedTitles(map);
  }, []);

  const persistSaved = (next: SavedNotes) => {
    setSaved(next);
    localStorage.setItem('tnpsc_daily_notes', JSON.stringify(next));
    notifyDataChanged();
  };

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
        if (newItems.length > 0) {
          persistSaved({ ...currentSaved, [today]: [...existing, ...newItems] });
          setExpandedDates((prev) => ({ ...prev, [today]: true }));
        }
      }
    } catch {
      setItems(safeParse<NewsItem[]>(localStorage.getItem('tnpsc_ca_cache'), []));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const cachedDate = localStorage.getItem('tnpsc_ca_date');
    const cached = localStorage.getItem('tnpsc_ca_cache');
    if (cachedDate === todayISO() && cached) {
      setItems(safeParse<NewsItem[]>(cached, []));
      setLoading(false);
    } else {
      fetchNews();
    }
  }, []);

  const today = todayISO();

  const removeNote = (iso: string, title: string) => {
    const next = { ...saved };
    next[iso] = next[iso].filter((n) => n.title !== title);
    if (next[iso].length === 0) delete next[iso];
    persistSaved(next);
    setBookmarkedTitles((prev) => {
      const copy = { ...prev };
      delete copy[title];
      return copy;
    });
  };

  const toggleBookmark = (item: NewsItem) => {
    const currentSaved = { ...saved };
    const todayList = currentSaved[today] || [];
    const isAlreadySaved = todayList.some((e) => e.title === item.title);

    if (isAlreadySaved) {
      removeNote(today, item.title);
    } else {
      currentSaved[today] = [item, ...todayList];
      persistSaved(currentSaved);
      setBookmarkedTitles((prev) => ({ ...prev, [item.title]: true }));
    }
  };

  const categories = useMemo(() => {
    const cats = new Set<string>();
    items.forEach((item) => {
      if (item.category) cats.add(item.category);
    });
    return ['All', ...Array.from(cats)];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  const cardClass = darkMode
    ? 'bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/[0.14] hover:border-blue-400/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300'
    : 'bg-white/85 backdrop-blur-xl border border-gray-200/80 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/10 shadow-sm transition-all duration-300';

  const sortedDates = Object.keys(saved).sort().reverse();
  const totalNotes = Object.values(saved).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`${cardClass} p-5 rounded-3xl relative overflow-hidden`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.08 }}
              className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl shadow-xl shadow-blue-500/40 text-white"
            >
              <Newspaper className="w-6 h-6" />
            </motion.div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
                Daily Affairs & Exam Notes
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300">
                  Live
                </span>
              </h2>
              <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {activeView === 'news'
                  ? "Today's top TNPSC news summaries · Auto-saved to notes"
                  : `${totalNotes} notes bookmarked across ${sortedDates.length} days`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setRefreshing(true);
                fetchNews();
              }}
              disabled={refreshing || activeView === 'notes'}
              className={`flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl font-semibold border transition shadow-sm ${
                darkMode
                  ? 'bg-white/10 border-white/20 hover:bg-white/15 text-gray-200'
                  : 'bg-white border-gray-200 hover:bg-gray-100 text-gray-700'
              } ${activeView === 'notes' ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
              {refreshing ? 'Fetching…' : 'Refresh News'}
            </motion.button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex gap-2 p-1.5 rounded-2xl w-fit mt-5 border border-white/10 bg-white/[0.04]">
          {[
            { id: 'news' as const, label: "Today's Feed", icon: Newspaper, count: items.length },
            { id: 'notes' as const, label: 'Saved Notes', icon: BookOpen, count: totalNotes },
          ].map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                activeView === view.id
                  ? 'text-white'
                  : darkMode
                  ? 'text-gray-300 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {activeView === view.id && (
                <motion.div
                  layoutId="daViewTab"
                  className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <view.icon className="w-3.5 h-3.5" />
                {view.label}
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                  {view.count}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {activeView === 'news' && (
        <div className="space-y-4">
          {/* Search & Category Filter Bar */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search headlines, keywords, or topics…"
                className={`w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border transition ${
                  darkMode
                    ? 'bg-white/[0.05] border-white/10 text-white placeholder-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                }`}
              />
            </div>

            {/* Category Chips Carousel */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {categories.slice(0, 6).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-[11px] font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap transition border ${
                    selectedCategory === cat
                      ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/25'
                      : darkMode
                      ? 'bg-white/[0.04] border-white/10 text-gray-300 hover:bg-white/[0.08]'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* News Items Grid */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`${cardClass} rounded-2xl p-5 animate-pulse h-40 space-y-3`}>
                  <div className="w-1/3 h-4 bg-white/10 rounded" />
                  <div className="w-3/4 h-5 bg-white/10 rounded" />
                  <div className="w-1/2 h-3 bg-white/10 rounded" />
                </div>
              ))}
            </div>
          )}

          {!loading && filteredItems.length === 0 && (
            <div className={`${cardClass} rounded-3xl p-10 text-center space-y-3`}>
              <BookOpen className="w-12 h-12 text-blue-400 mx-auto opacity-70" />
              <h3 className="text-base font-bold">No news items found</h3>
              <p className={`text-xs max-w-sm mx-auto ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {searchQuery ? 'Try adjusting your search query.' : 'Tap Refresh to check for latest updates.'}
              </p>
            </div>
          )}

          {!loading && filteredItems.length > 0 && (
            <motion.div
              initial="initial"
              animate="animate"
              variants={{ animate: { transition: { staggerChildren: 0.04 } } }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5"
            >
              {filteredItems.map((item, i) => {
                const badgeClass =
                  CATEGORY_COLORS[item.category] ||
                  'bg-blue-500/20 text-blue-300 border-blue-500/40';
                const isBookmarked = bookmarkedTitles[item.title];

                return (
                  <motion.div
                    key={i}
                    variants={{ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } }}
                    whileHover={{ y: -5, scale: 1.01 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className={`${cardClass} rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border ${badgeClass} truncate max-w-[75%]`}
                        >
                          {item.category}
                        </span>

                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={() => toggleBookmark(item)}
                          title={isBookmarked ? 'Bookmarked' : 'Save to notes'}
                          className={`p-1.5 rounded-lg transition ${
                            isBookmarked
                              ? 'text-amber-400 bg-amber-400/15'
                              : 'text-gray-400 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                        </motion.button>
                      </div>

                      <div className={`flex items-center gap-1.5 text-[11px] mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <Calendar className="w-3 h-3 text-blue-400" />
                        {item.date}
                      </div>

                      <h3
                        className={`text-sm font-semibold leading-snug line-clamp-3 ${
                          darkMode ? 'text-gray-100 group-hover:text-blue-300' : 'text-gray-900 group-hover:text-blue-600'
                        } transition-colors`}
                      >
                        {item.title}
                      </h3>
                    </div>

                    {item.url && (
                      <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-medium transition"
                        >
                          Read full article <ExternalLink className="w-3 h-3" />
                        </a>
                        <span className="text-[10px] text-gray-500 font-mono">TNPSC</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      )}

      {activeView === 'notes' && (
        <div className="space-y-4">
          {sortedDates.length === 0 ? (
            <div className={`${cardClass} rounded-3xl p-10 text-center space-y-3`}>
              <BookOpen className="w-12 h-12 text-blue-400 mx-auto opacity-70" />
              <h3 className="text-base font-bold">No saved notes yet</h3>
              <p className={`text-xs max-w-sm mx-auto ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Switch to Today's Feed and bookmark important news items to save them for revision.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedDates.map((iso) => {
                const isExpanded = expandedDates[iso] !== false;
                const notesForDate = saved[iso];
                return (
                  <motion.div
                    key={iso}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`${cardClass} rounded-2xl overflow-hidden`}
                  >
                    <button
                      onClick={() => setExpandedDates((prev) => ({ ...prev, [iso]: !isExpanded }))}
                      className={`w-full flex items-center justify-between p-4 transition ${
                        darkMode ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <motion.div
                          animate={{ rotate: isExpanded ? 90 : 0 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        >
                          <ChevronRight className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        </motion.div>
                        <div className="text-left">
                          <div className={`font-bold text-sm ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                            {formatDisplayDate(iso)}
                          </div>
                          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {notesForDate.length} item{notesForDate.length > 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/40 px-3 py-1 rounded-full font-semibold">
                        {notesForDate.length} items
                      </span>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className={`p-4 pt-0 space-y-2.5 ${darkMode ? 'bg-black/30' : 'bg-gray-50/50'}`}>
                            {notesForDate.map((note) => {
                              const badgeClass =
                                CATEGORY_COLORS[note.category] ||
                                'bg-blue-500/20 text-blue-300 border-blue-500/40';
                              return (
                                <div
                                  key={note.title}
                                  className={`p-3.5 rounded-xl flex items-start gap-3 ${
                                    darkMode
                                      ? 'bg-white/[0.05] border border-white/[0.08]'
                                      : 'bg-white border border-gray-100 shadow-sm'
                                  }`}
                                >
                                  <div className="flex-1 min-w-0">
                                    <span
                                      className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border ${badgeClass} inline-block mb-1.5`}
                                    >
                                      {note.category}
                                    </span>
                                    <p className={`text-sm leading-snug font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                      {note.title}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => removeNote(iso, note.title)}
                                    className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/15 shrink-0 transition"
                                    title="Delete note"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
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
        </div>
      )}
    </div>
  );
}