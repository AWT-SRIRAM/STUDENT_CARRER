'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Flame,
  Trophy,
  Target,
  Sparkles,
  Zap,
  Award,
  CheckCircle2,
  TrendingUp,
  Info
} from 'lucide-react';
import { todayISO, daysBetween } from '@/lib/utils';
import AnimatedNumber from './AnimatedNumber';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface StreakCalendarProps {
  darkMode: boolean;
  studyHistory: string[];
  goalHistory: string[];
  liveStreak: number;
  examDate?: string;
  dailyGoal?: number;
}

interface Milestone {
  id: string;
  days: number;
  label: string;
  sub: string;
  icon: string;
  gradient: string;
}

const MILESTONES: Milestone[] = [
  { id: 'spark', days: 3, label: '3-Day Spark', sub: 'Kickstarter', icon: '⚡', gradient: 'from-amber-400 to-yellow-500' },
  { id: 'flame', days: 7, label: '7-Day Flame', sub: '1 Week Unbroken', icon: '🔥', gradient: 'from-orange-500 to-amber-600' },
  { id: 'blaze', days: 14, label: '14-Day Blaze', sub: 'Fortnight Habit', icon: '💥', gradient: 'from-red-500 to-orange-500' },
  { id: 'master', days: 30, label: '30-Day Titan', sub: '1 Month Master', icon: '💎', gradient: 'from-cyan-400 to-blue-600' },
  { id: 'legend', days: 100, label: '100-Day Legend', sub: 'Officer Tier', icon: '👑', gradient: 'from-purple-500 to-amber-400' },
];

export default function StreakCalendar({
  darkMode,
  studyHistory,
  goalHistory,
  liveStreak,
  examDate,
  dailyGoal = 3,
}: StreakCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date());
  const [hoveredDay, setHoveredDay] = useState<{
    dateStr: string;
    dayNum: number;
    isStudied: boolean;
    isGoal: boolean;
    isToday: boolean;
    isExamDay: boolean;
    isFuture: boolean;
  } | null>(null);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // Monthly stats calculations
  const monthlyStats = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let studiedCount = 0;
    let goalCount = 0;
    const today = todayISO();
    const isCurrentMonth = today.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`);
    const maxDaysToCount = isCurrentMonth ? new Date().getDate() : daysInMonth;

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if (studyHistory.includes(dateStr)) studiedCount++;
      if (goalHistory.includes(dateStr)) goalCount++;
    }

    const consistencyRate = maxDaysToCount > 0 ? Math.min(100, Math.round((studiedCount / maxDaysToCount) * 100)) : 0;

    return {
      studiedCount,
      goalCount,
      daysInMonth,
      consistencyRate,
      isCurrentMonth,
    };
  }, [year, month, studyHistory, goalHistory]);

  // Next milestone calculation
  const nextMilestone = useMemo(() => {
    return MILESTONES.find((m) => m.days > liveStreak) || MILESTONES[MILESTONES.length - 1];
  }, [liveStreak]);

  const prevMilestoneDays = useMemo(() => {
    const prev = [...MILESTONES].reverse().find((m) => m.days <= liveStreak);
    return prev ? prev.days : 0;
  }, [liveStreak]);

  const milestoneProgress = useMemo(() => {
    if (liveStreak >= nextMilestone.days && nextMilestone.days === 100) return 100;
    const range = nextMilestone.days - prevMilestoneDays;
    const current = Math.max(0, liveStreak - prevMilestoneDays);
    return range > 0 ? Math.min(100, Math.round((current / range) * 100)) : 0;
  }, [liveStreak, nextMilestone, prevMilestoneDays]);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handleJumpToToday = () => {
    setCurrentMonth(new Date());
  };

  // Render Day Cells
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = todayISO();
    const cells = [];

    // Empty offset slots
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ type: 'empty' as const, key: `empty-${i}` });
    }

    // Day slots
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isStudied = studyHistory.includes(dateStr);
      const isGoal = goalHistory.includes(dateStr);
      const isToday = dateStr === today;
      const isExamDay = examDate ? dateStr === examDate : false;
      const isFuture = dateStr > today;

      cells.push({
        type: 'day' as const,
        key: `day-${d}`,
        dayNum: d,
        dateStr,
        isStudied,
        isGoal,
        isToday,
        isExamDay,
        isFuture,
      });
    }

    return cells;
  }, [year, month, studyHistory, goalHistory, examDate]);

  return (
    <div className="space-y-4">
      {/* Top Banner: Streak Highlights & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 via-red-500 to-amber-500 flex items-center justify-center shadow-md text-white">
            <Flame className="w-5 h-5 fill-amber-200 text-amber-200" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                Streak Calendar
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/40 text-orange-400 flex items-center gap-1 shadow-sm">
                <Flame className="w-3 h-3 fill-current" />
                <AnimatedNumber value={liveStreak} /> Days Active
              </span>
            </div>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Consistency is the single biggest factor in clearing TNPSC
            </p>
          </div>
        </div>

        {/* Month Navigation & Today Pill */}
        <div className="flex items-center gap-1.5 self-end sm:self-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleJumpToToday}
            className={`text-xs px-2.5 py-1.5 rounded-xl font-semibold border transition ${
              darkMode
                ? 'bg-white/5 border-white/10 hover:bg-white/10 text-blue-300'
                : 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100 text-indigo-700'
            }`}
          >
            Today
          </motion.button>
          <div className="flex items-center gap-1 bg-black/20 dark:bg-white/5 p-1 rounded-xl border border-white/10">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.85 }}
              onClick={handlePrevMonth}
              className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>
            <span className={`text-xs font-bold px-2 min-w-[100px] text-center ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              {MONTH_SHORT[month]} {year}
            </span>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.85 }}
              onClick={handleNextMonth}
              className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Monthly Performance Consistency Bar */}
      <div className={`p-3.5 rounded-2xl border relative overflow-hidden ${
        darkMode ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-indigo-50/40 border-indigo-100'
      }`}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="space-y-0.5">
            <span className={`text-[11px] font-medium flex items-center gap-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <CalendarIcon className="w-3 h-3 text-blue-400" /> Days Studied
            </span>
            <div className={`text-base font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              <AnimatedNumber value={monthlyStats.studiedCount} />
              <span className="text-xs font-normal opacity-60">/{monthlyStats.daysInMonth}d</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className={`text-[11px] font-medium flex items-center gap-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <Target className="w-3 h-3 text-red-400" /> Goals Crushed
            </span>
            <div className={`text-base font-bold text-orange-400`}>
              <AnimatedNumber value={monthlyStats.goalCount} />
              <span className="text-xs font-normal opacity-60"> days</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className={`text-[11px] font-medium flex items-center gap-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <TrendingUp className="w-3 h-3 text-emerald-400" /> Monthly Consistency
            </span>
            <div className="text-base font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              <AnimatedNumber value={monthlyStats.consistencyRate} />%
            </div>
          </div>

          <div className="space-y-0.5">
            <span className={`text-[11px] font-medium flex items-center gap-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <Award className="w-3 h-3 text-amber-400" /> Next Milestone
            </span>
            <div className="text-xs font-bold text-amber-300 flex items-center gap-1 truncate">
              <span>{nextMilestone.icon}</span>
              <span>{nextMilestone.label}</span>
            </div>
          </div>
        </div>

        {/* Mini progress bar towards next milestone */}
        <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center gap-3">
          <div className="flex-1 bg-black/30 dark:bg-white/10 rounded-full h-2 overflow-hidden relative">
            <div
              style={{ width: `${milestoneProgress}%` }}
              className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-300 rounded-full transition-all duration-500"
            />
          </div>
          <span className={`text-[10px] font-semibold whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {liveStreak >= nextMilestone.days
              ? '🎉 Milestone Achieved!'
              : `${nextMilestone.days - liveStreak}d to ${nextMilestone.label}`}
          </span>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {WEEKDAYS.map((day, i) => (
          <div
            key={day}
            className={`text-[11px] font-bold py-1 uppercase tracking-wider ${
              i === 0 || i === 6
                ? darkMode ? 'text-amber-400/80' : 'text-amber-600'
                : darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid - Clean, steady colored day boxes without jumping animations */}
      <div className="grid grid-cols-7 gap-1.5 place-items-stretch relative">
        {calendarCells.map((cell) => {
          if (cell.type === 'empty') {
            return <div key={cell.key} className="h-10 sm:h-11 rounded-xl opacity-0" />;
          }

          const { dayNum, dateStr, isStudied, isGoal, isToday, isExamDay, isFuture } = cell;

          return (
            <div
              key={cell.key}
              onMouseEnter={() => setHoveredDay(cell)}
              onMouseLeave={() => setHoveredDay(null)}
              className={`h-10 sm:h-11 rounded-xl text-xs font-bold relative flex items-center justify-center cursor-pointer select-none transition-all duration-150 hover:brightness-110 ${
                isExamDay
                  ? 'bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-600 text-white shadow-md ring-2 ring-amber-300/80'
                  : isGoal
                  ? 'bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-sm ring-1 ring-orange-400/50'
                  : isStudied
                  ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm'
                  : isToday
                  ? darkMode
                    ? 'border-2 border-cyan-400 text-cyan-300 bg-cyan-500/15'
                    : 'border-2 border-indigo-600 text-indigo-700 bg-indigo-50'
                  : isFuture
                  ? darkMode
                    ? 'bg-white/[0.02] border border-white/[0.04] text-gray-500 opacity-40'
                    : 'bg-gray-50 border border-gray-100 text-gray-400 opacity-50'
                  : darkMode
                  ? 'bg-white/[0.05] border border-white/[0.08] text-gray-300 hover:bg-white/[0.1]'
                  : 'bg-gray-50 border border-gray-100 text-gray-700 hover:bg-indigo-50/50'
              }`}
            >
              <span>{dayNum}</span>

              {/* Clean Exam target tag */}
              {isExamDay && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[7px] font-black tracking-widest px-1 rounded bg-amber-300 text-black uppercase whitespace-nowrap shadow-xs">
                  EXAM
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Interactive Tooltip Card for Hovered Day */}
      <AnimatePresence>
        {hoveredDay && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`p-3 rounded-xl border shadow-xl flex items-center justify-between text-xs backdrop-blur-md ${
              darkMode
                ? 'bg-[#0b1329]/90 border-blue-500/30 text-gray-200'
                : 'bg-white/95 border-indigo-100 text-gray-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                  hoveredDay.isGoal
                    ? 'bg-gradient-to-br from-orange-500 to-red-600 text-white shadow'
                    : hoveredDay.isStudied
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                    : hoveredDay.isToday
                    ? 'bg-cyan-500 text-white'
                    : 'bg-gray-200 dark:bg-white/10 text-gray-500'
                }`}
              >
                {hoveredDay.dayNum}
              </div>
              <div>
                <div className="font-semibold">{hoveredDay.dateStr}</div>
                <div className="text-[11px] opacity-75">
                  {hoveredDay.isExamDay
                    ? '🎯 TNPSC Exam Target Day'
                    : hoveredDay.isGoal
                    ? `🔥 Daily Goal Achieved (${dailyGoal}+ Topics Crushed)`
                    : hoveredDay.isStudied
                    ? '✓ Study Session Logged & Streak Preserved'
                    : hoveredDay.isToday
                    ? '⚡ Today: Advance your topics to keep the streak going!'
                    : hoveredDay.isFuture
                    ? '📅 Upcoming Schedule Day'
                    : 'No study session recorded'}
                </div>
              </div>
            </div>

            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                hoveredDay.isGoal
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : hoveredDay.isStudied
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : hoveredDay.isToday
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
              }`}
            >
              {hoveredDay.isGoal ? 'Goal Crushed' : hoveredDay.isStudied ? 'Studied' : hoveredDay.isToday ? 'Today' : 'Rest'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend & Milestone Badges Row */}
      <div className="pt-2 border-t border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Visual Legend */}
        <div className="flex items-center gap-3.5 flex-wrap justify-center">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-md bg-gradient-to-br from-amber-500 to-orange-500 shadow-xs" />
            <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Studied</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-md bg-gradient-to-br from-orange-500 to-red-600 shadow-xs flex items-center justify-center text-[7px] text-white">
              🔥
            </div>
            <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Goal Crushed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-md border-2 border-cyan-400 bg-cyan-400/20" />
            <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Today</span>
          </div>
          {examDate && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-md bg-gradient-to-br from-amber-400 to-orange-600 ring-1 ring-amber-300" />
              <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Exam 🎯</span>
            </div>
          )}
        </div>

        {/* Active Milestone Tier Preview */}
        <div className="flex items-center gap-1.5">
          <span className={`text-[11px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tiers:</span>
          {MILESTONES.map((m) => {
            const isUnlocked = liveStreak >= m.days;
            return (
              <div
                key={m.id}
                title={`${m.label}: ${m.days} days required (${isUnlocked ? 'Unlocked' : 'Locked'})`}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition ${
                  isUnlocked
                    ? `bg-gradient-to-r ${m.gradient} text-white shadow-sm border-white/20`
                    : darkMode
                    ? 'bg-white/[0.03] border-white/[0.08] text-gray-500 opacity-50'
                    : 'bg-gray-100 border-gray-200 text-gray-400 opacity-60'
                }`}
              >
                <span>{m.icon}</span>
                <span>{m.days}d</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
