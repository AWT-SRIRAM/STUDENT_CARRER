"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { syllabusData } from '@/data/syllabus';
import AnimatedNumber from '@/components/AnimatedNumber';
import DailyAffairs from '@/components/DailyAffairs';
import Practice from '@/components/Practice';
import PastPapers from '@/components/PastPapers';
import { todayISO, addDays, daysBetween, formatExamDate, safeParse } from '@/lib/utils';
import {
  Flame, Calendar as CalendarIcon, CheckCircle2, Circle, BookOpen,
  Moon, Sun, ChevronRight, Save, HeartPulse, Target, FileText, Trophy,
  Plus, Trash2, CheckSquare, Shuffle, Sparkles, Star, Clock,
  Download, Upload, RotateCcw, Quote, XCircle, Newspaper, Zap, Info
} from 'lucide-react';

type TopicState = { stage: number; notes: string; lastReviewDate: string | null; nextReviewDate: string | null };
type ProgressState = { [key: string]: TopicState };
type MockTest = { id: string; date: string; score: number; total: number; subject: string; reasonLost: string };
type OnboardingData = { completed: boolean; examDate: string; weakZone: 'A' | 'B' | 'C' | 'none'; dailyGoal: number };

const DEFAULT_EXAM_DATE = '2026-12-20';
const REVISION_INTERVALS = [1, 3, 7, 14];
const STAGE_LABELS = ['Learn', 'R1', 'R2', 'R3', 'R4', 'Mastered'];
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};
const stagger = { animate: { transition: { staggerChildren: 0.05 } } };

export default function TNPSC_Tracker() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'syllabus' | 'daily' | 'practice' | 'mock'>('dashboard');
  const [mockTab, setMockTab] = useState<'logs' | 'papers'>('papers');
  const [progress, setProgress] = useState<ProgressState>({});
  const [streak, setStreak] = useState(0);
  const [lastStudyDate, setLastStudyDate] = useState<string | null>(null);
  const [missedDays, setMissedDays] = useState(0);
  const [sickDaysUsed, setSickDaysUsed] = useState(0);
  const [isSickPromptOpen, setIsSickPromptOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({});
  const [dailyXP, setDailyXP] = useState(0);
  const [todayActions, setTodayActions] = useState(0);
  const [todayTopics, setTodayTopics] = useState<string[]>([]);
  const [todayPlan, setTodayPlan] = useState<string[]>([]);
  const [studyHistory, setStudyHistory] = useState<string[]>([]);
  const [goalHistory, setGoalHistory] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [notesModal, setNotesModal] = useState<{ unitId: string; idx: number; current: string } | null>(null);
  const [notesInput, setNotesInput] = useState('');
  const [celebrateGoal, setCelebrateGoal] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'info' } | null>(null);
  const [lockedTopics, setLockedTopics] = useState<Record<string, boolean>>({});
  const [dailyQuote, setDailyQuote] = useState({ text: 'The expert in anything was once a beginner.', author: 'Helen Hayes' });
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [examDate, setExamDateState] = useState(DEFAULT_EXAM_DATE);
  const [daysLeftDisplay, setDaysLeftDisplay] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardStep, setOnboardStep] = useState(0);
  const [onboardExam, setOnboardExam] = useState(DEFAULT_EXAM_DATE);
  const [onboardWeak, setOnboardWeak] = useState<'A' | 'B' | 'C' | 'none'>('none');
  const [onboardGoal, setOnboardGoal] = useState(3);
  const [onboarding, setOnboarding] = useState<OnboardingData>({ completed: false, examDate: DEFAULT_EXAM_DATE, weakZone: 'none', dailyGoal: 3 });

  useEffect(() => {
    setProgress(safeParse<ProgressState>(localStorage.getItem('tnpsc_progress_v2'), {}));
    setMockTests(safeParse<MockTest[]>(localStorage.getItem('tnpsc_mocks'), []));
    setDarkMode(safeParse<boolean>(localStorage.getItem('tnpsc_dark'), true));
    setSickDaysUsed(safeParse<number>(localStorage.getItem('tnpsc_sick'), 0));
    setStudyHistory(safeParse<string[]>(localStorage.getItem('tnpsc_history'), []));
    setGoalHistory(safeParse<string[]>(localStorage.getItem('tnpsc_goal_history'), []));

    const today = todayISO();
    const savedXPDate = localStorage.getItem('tnpsc_xp_date');
    const savedActionsDate = localStorage.getItem('tnpsc_actions_date');
    const savedTopicsDate = localStorage.getItem('tnpsc_topics_date');

    if (savedXPDate !== today) { setDailyXP(0); localStorage.setItem('tnpsc_xp', '0'); localStorage.setItem('tnpsc_xp_date', today); }
    else setDailyXP(safeParse<number>(localStorage.getItem('tnpsc_xp'), 0));
    if (savedActionsDate !== today) { setTodayActions(0); localStorage.setItem('tnpsc_actions', '0'); localStorage.setItem('tnpsc_actions_date', today); }
    else setTodayActions(safeParse<number>(localStorage.getItem('tnpsc_actions'), 0));
    if (savedTopicsDate !== today) { setTodayTopics([]); localStorage.setItem('tnpsc_topics', '[]'); localStorage.setItem('tnpsc_topics_date', today); }
    else setTodayTopics(safeParse<string[]>(localStorage.getItem('tnpsc_topics'), []));

    const savedStreak = safeParse<number>(localStorage.getItem('tnpsc_streak'), 0);
    setStreak(savedStreak);

    const savedOnboarding = safeParse<OnboardingData | null>(localStorage.getItem('tnpsc_onboarding'), null);
    if (savedOnboarding) {
      setOnboarding(savedOnboarding);
      setOnboardExam(savedOnboarding.examDate);
      setOnboardWeak(savedOnboarding.weakZone);
      setOnboardGoal(savedOnboarding.dailyGoal);
      setExamDateState(savedOnboarding.examDate);
      setDaysLeftDisplay(Math.max(0, Math.ceil((new Date(savedOnboarding.examDate).getTime() - Date.now()) / 86400000)));

      let category = 'learning';
      const daysLeftNow = Math.max(0, Math.ceil((new Date(savedOnboarding.examDate).getTime() - Date.now()) / 86400000));
      if (daysLeftNow < 30) category = 'perseverance';
      else if (savedStreak === 0) category = 'motivational';
      else if (savedStreak >= 10) category = 'success';

      const savedQuoteDate = localStorage.getItem('tnpsc_quote_date');
      const savedQuoteText = localStorage.getItem('tnpsc_quote_text');
      const savedQuoteAuthor = localStorage.getItem('tnpsc_quote_author');
      const shouldFetch = !savedQuoteDate || savedQuoteDate !== today || !savedQuoteText;

      if (shouldFetch) {
        fetch(`/api/quote?category=${category}`)
          .then((res) => res.json())
          .then((data: { quotes?: { text: string; author: string }[] }) => {
            if (data?.quotes?.length) {
              const picked = data.quotes[Math.floor(Math.random() * data.quotes.length)];
              setDailyQuote(picked);
              localStorage.setItem('tnpsc_quote_text', picked.text);
              localStorage.setItem('tnpsc_quote_author', picked.author);
              localStorage.setItem('tnpsc_quote_date', today);
            }
          }).catch(() => {});
      } else if (savedQuoteText) {
        setDailyQuote({ text: savedQuoteText, author: savedQuoteAuthor || 'Unknown' });
      }
    } else setShowOnboarding(true);

    const savedPlan = safeParse<{ date: string; topics: string[] } | null>(localStorage.getItem('tnpsc_today_plan'), null);
    if (savedPlan?.date === today) setTodayPlan(savedPlan.topics || []);

    const savedLastDate = localStorage.getItem('tnpsc_last_date');
    if (savedLastDate) {
      setLastStudyDate(savedLastDate);
      const diff = daysBetween(savedLastDate, today);
      if (diff > 1) {
        const newMissed = diff - 1;
        setMissedDays(newMissed);
        const sickUsed = safeParse<number>(localStorage.getItem('tnpsc_sick'), 0);
        if (newMissed >= 1 && savedStreak > 0 && sickUsed < 7) setIsSickPromptOpen(true);
      } else if (diff === 0) setMissedDays(0);
    }
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const today = todayISO();
      const savedDate = localStorage.getItem('tnpsc_actions_date');
      if (savedDate !== today) {
        setTodayActions(0); setDailyXP(0); setTodayTopics([]);
        localStorage.setItem('tnpsc_actions', '0'); localStorage.setItem('tnpsc_xp', '0'); localStorage.setItem('tnpsc_topics', '[]');
        localStorage.setItem('tnpsc_actions_date', today); localStorage.setItem('tnpsc_xp_date', today); localStorage.setItem('tnpsc_topics_date', today);
      }
      setDaysLeftDisplay(Math.max(0, Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000)));
    }, 60000);
    return () => clearInterval(id);
  }, [examDate]);

  const liveStreak = lastStudyDate && daysBetween(lastStudyDate, todayISO()) > 1 ? 0 : streak;

  const saveProgress = (p: ProgressState) => { setProgress(p); localStorage.setItem('tnpsc_progress_v2', JSON.stringify(p)); };
  const showToast = (msg: string, type: 'success' | 'info' = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 2000); };

  const completeOnboarding = () => {
    const data: OnboardingData = { completed: true, examDate: onboardExam, weakZone: onboardWeak, dailyGoal: onboardGoal };
    setOnboarding(data); setExamDateState(onboardExam);
    setDaysLeftDisplay(Math.max(0, Math.ceil((new Date(onboardExam).getTime() - Date.now()) / 86400000)));
    localStorage.setItem('tnpsc_onboarding', JSON.stringify(data));
    setShowOnboarding(false); localStorage.removeItem('tnpsc_quote_date');
  };

  const trackAction = (key: string) => {
    const today = todayISO();
    if (!todayTopics.includes(key)) {
      const nt = [...todayTopics, key]; setTodayTopics(nt);
      localStorage.setItem('tnpsc_topics', JSON.stringify(nt)); localStorage.setItem('tnpsc_topics_date', today);
      const newActions = todayActions + 1; setTodayActions(newActions);
      localStorage.setItem('tnpsc_actions', newActions.toString()); localStorage.setItem('tnpsc_actions_date', today);
      const goal = onboarding.dailyGoal || 3;
      if (newActions >= goal && !goalHistory.includes(today)) {
        const nh = [...goalHistory, today]; setGoalHistory(nh); localStorage.setItem('tnpsc_goal_history', JSON.stringify(nh));
        setCelebrateGoal(true); setTimeout(() => setCelebrateGoal(false), 2500);
      }
    }
  };

  const advanceStage = (unitId: string, idx: number) => {
    const key = `${unitId}-${idx}`;
    if (lockedTopics[key]) return;
    const today = todayISO();
    const current = progress[key] || { stage: 0, notes: '', lastReviewDate: null, nextReviewDate: null };
    if (current.stage >= 5) { showToast('Already Mastered! ⭐', 'info'); return; }
    if (current.stage >= 1 && current.nextReviewDate && current.nextReviewDate > today) {
      const left = daysBetween(today, current.nextReviewDate);
      showToast(`Next review in ${left}d`, 'info'); return;
    }
    setLockedTopics((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => setLockedTopics((prev) => { const c = { ...prev }; delete c[key]; return c; }), 900);
    const newStage = current.stage + 1;
    let nextDate: string | null = null;
    if (newStage < 5) nextDate = addDays(today, REVISION_INTERVALS[newStage - 1]);
    saveProgress({ ...progress, [key]: { stage: newStage, notes: current.notes, lastReviewDate: today, nextReviewDate: nextDate } });
    showToast(`✓ Advanced to ${STAGE_LABELS[newStage]}`, 'success');
    const xp = current.stage === 0 ? 10 : 5;
    const newXP = dailyXP + xp; setDailyXP(newXP);
    localStorage.setItem('tnpsc_xp', newXP.toString()); localStorage.setItem('tnpsc_xp_date', today);
    if (!studyHistory.includes(today)) { const nh = [...studyHistory, today]; setStudyHistory(nh); localStorage.setItem('tnpsc_history', JSON.stringify(nh)); }
    if (lastStudyDate !== today) {
      const diff = lastStudyDate ? daysBetween(lastStudyDate, today) : 0;
      const ns = (diff === 1 || !lastStudyDate) ? streak + 1 : 1;
      setStreak(ns); localStorage.setItem('tnpsc_streak', ns.toString());
      setLastStudyDate(today); localStorage.setItem('tnpsc_last_date', today); setMissedDays(0);
    }
    trackAction(key);
  };

  const decreaseStage = (unitId: string, idx: number) => {
    const key = `${unitId}-${idx}`;
    const current = progress[key];
    if (!current || current.stage === 0) return;
    const newStage = current.stage - 1;
    let nextDate: string | null = null, lastDate: string | null = null;
    if (newStage === 0) { nextDate = null; lastDate = null; }
    else if (newStage < 5) { nextDate = addDays(todayISO(), REVISION_INTERVALS[newStage - 1]); lastDate = current.lastReviewDate; }
    else { nextDate = null; lastDate = current.lastReviewDate; }
    saveProgress({ ...progress, [key]: { ...current, stage: newStage, lastReviewDate: lastDate, nextReviewDate: nextDate } });
  };

  const markUnitComplete = (unitId: string, totalTopics: number) => {
    let toMark = 0;
    for (let i = 0; i < totalTopics; i++) { const cur = progress[`${unitId}-${i}`]; if (!cur || cur.stage === 0) toMark++; }
    if (toMark === 0) { showToast('Already completed', 'info'); return; }
    if (!confirm(`Mark ${toMark} topics as Learned? Bulk shortcut — does NOT count toward daily goal or streak.`)) return;
    const today = todayISO(); const updated = { ...progress };
    for (let i = 0; i < totalTopics; i++) {
      const key = `${unitId}-${i}`;
      const cur = updated[key] || { stage: 0, notes: '', lastReviewDate: null, nextReviewDate: null };
      if (cur.stage === 0) updated[key] = { stage: 1, notes: cur.notes, lastReviewDate: today, nextReviewDate: addDays(today, 1) };
    }
    saveProgress(updated);
    showToast(`✓ Marked ${toMark} topics (no streak credit)`, 'info');
  };

  const updateNotes = (unitId: string, idx: number, notes: string) => {
    const key = `${unitId}-${idx}`;
    const current = progress[key] || { stage: 0, notes: '', lastReviewDate: null, nextReviewDate: null };
    saveProgress({ ...progress, [key]: { ...current, notes } });
  };
  const openNotesModal = (unitId: string, idx: number, current: string) => { setNotesModal({ unitId, idx, current }); setNotesInput(current); };
  const saveNotesAction = () => { if (notesModal) { updateNotes(notesModal.unitId, notesModal.idx, notesInput); setNotesModal(null); setNotesInput(''); } };

  const handleSickMode = (wasSick: boolean) => {
    const canUseSick = wasSick && missedDays <= (7 - sickDaysUsed);
    if (canUseSick) {
      const nsd = sickDaysUsed + missedDays; setSickDaysUsed(nsd); localStorage.setItem('tnpsc_sick', nsd.toString());
      const yesterday = addDays(todayISO(), -1); setLastStudyDate(yesterday); localStorage.setItem('tnpsc_last_date', yesterday);
      showToast(`Sick days used: ${nsd}/7. Study today to keep the streak.`, 'info');
    } else { setStreak(0); localStorage.setItem('tnpsc_streak', '0'); showToast(wasSick ? 'Not enough sick days — streak reset' : 'Streak reset', 'info'); }
    setMissedDays(0); setIsSickPromptOpen(false);
  };

  const addMockTest = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const fd = new FormData(e.currentTarget);
    const newMock: MockTest = { id: Date.now().toString(), date: (fd.get('date') as string) || '', subject: (fd.get('subject') as string) || '', score: parseInt((fd.get('score') as string) || '0'), total: parseInt((fd.get('total') as string) || '0'), reasonLost: (fd.get('reasonLost') as string) || '' };
    const updated = [newMock, ...mockTests]; setMockTests(updated); localStorage.setItem('tnpsc_mocks', JSON.stringify(updated)); e.currentTarget.reset();
  };
  const deleteMockTest = (id: string) => { const updated = mockTests.filter((t) => t.id !== id); setMockTests(updated); localStorage.setItem('tnpsc_mocks', JSON.stringify(updated)); };

  const addToTodayPlan = (key: string) => { setTodayPlan((prev) => { if (prev.includes(key)) return prev; const np = [...prev, key]; localStorage.setItem('tnpsc_today_plan', JSON.stringify({ date: todayISO(), topics: np })); return np; }); };
  const removeFromTodayPlan = (key: string) => { setTodayPlan((prev) => { const np = prev.filter((k) => k !== key); localStorage.setItem('tnpsc_today_plan', JSON.stringify({ date: todayISO(), topics: np })); return np; }); };
  const shuffleTodayPlan = () => { setTodayPlan((prev) => { if (prev.length < 2) return prev; const sh = [...prev].sort(() => Math.random() - 0.5); localStorage.setItem('tnpsc_today_plan', JSON.stringify({ date: todayISO(), topics: sh })); return sh; }); showToast('🔀 Shuffled', 'info'); };
  const clearTodayPlan = () => { setTodayPlan([]); localStorage.setItem('tnpsc_today_plan', JSON.stringify({ date: todayISO(), topics: [] })); setClearConfirmOpen(false); showToast("✓ Cleared", 'info'); };

  const autoGeneratePlan = () => {
    const unitList: { unit: { id: string; weight: number; topics: string[] }; effectiveWeight: number }[] = [];
    syllabusData.parts.forEach((part) => { part.units.forEach((unit) => { const isWeak = (part as { weakZoneKey: string }).weakZoneKey === onboarding.weakZone; unitList.push({ unit, effectiveWeight: unit.weight + (isWeak ? 3 : 0) }); }); });
    unitList.sort((a, b) => b.effectiveWeight - a.effectiveWeight);
    const picked: string[] = []; const target = onboarding.dailyGoal || 3;
    for (const { unit } of unitList) {
      for (let i = 0; i < unit.topics.length; i++) {
        if (picked.length >= target) break;
        const key = `${unit.id}-${i}`; const state = progress[key];
        if ((!state || state.stage === 0) && !todayPlan.includes(key) && !picked.includes(key)) picked.push(key);
      }
      if (picked.length >= target) break;
    }
    if (picked.length === 0) {
      const allUnlearned: string[] = [];
      syllabusData.parts.forEach((part) => { part.units.forEach((unit) => { unit.topics.forEach((_, idx) => { const key = `${unit.id}-${idx}`; const s = progress[key]; if (!s || s.stage === 0) allUnlearned.push(key); }); }); });
      if (allUnlearned.length === 0) showToast('🎉 All topics learned!', 'info');
      else if (allUnlearned.every((k) => todayPlan.includes(k))) showToast("All unlearned topics already in today's plan", 'info');
      else showToast('Nothing new to add right now', 'info');
      return;
    }
    setTodayPlan((prev) => { const np = [...prev, ...picked]; localStorage.setItem('tnpsc_today_plan', JSON.stringify({ date: todayISO(), topics: np })); return np; });
    showToast(`✨ Added ${picked.length} topics`, 'success');
  };

  const exportData = () => {
    const dailyNotes = safeParse<Record<string, unknown>>(localStorage.getItem('tnpsc_daily_notes'), {});
    const attemptedPapers = safeParse<Record<string, boolean>>(localStorage.getItem('tnpsc_attempted_papers'), {});
    const data = { version: 3, exportedAt: new Date().toISOString(), progress, streak, lastStudyDate, sickDaysUsed, dailyXP, todayActions, todayTopics, todayPlan, studyHistory, goalHistory, mockTests, onboarding, dailyNotes, attemptedPapers };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = `tnpsc-backup-${todayISO()}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      let data: Record<string, unknown>;
      try { data = JSON.parse((evt.target?.result as string) || '{}'); }
      catch { alert('❌ File is not valid JSON.'); e.target.value = ''; return; }
      if (typeof data !== 'object' || data === null) { alert('❌ Backup must be a JSON object.'); e.target.value = ''; return; }
      if (!confirm(`Restore backup from ${data.exportedAt || 'unknown date'}?\n\nThis will overwrite your current data.`)) { e.target.value = ''; return; }
      try {
        if (data.progress) { setProgress(data.progress as ProgressState); localStorage.setItem('tnpsc_progress_v2', JSON.stringify(data.progress)); }
        if (typeof data.streak === 'number') { setStreak(data.streak); localStorage.setItem('tnpsc_streak', String(data.streak)); }
        if (typeof data.lastStudyDate === 'string') { setLastStudyDate(data.lastStudyDate); localStorage.setItem('tnpsc_last_date', data.lastStudyDate); }
        if (typeof data.sickDaysUsed === 'number') { setSickDaysUsed(data.sickDaysUsed); localStorage.setItem('tnpsc_sick', String(data.sickDaysUsed)); }
        if (Array.isArray(data.todayPlan)) { setTodayPlan(data.todayPlan as string[]); localStorage.setItem('tnpsc_today_plan', JSON.stringify({ date: todayISO(), topics: data.todayPlan })); }
        if (Array.isArray(data.studyHistory)) { setStudyHistory(data.studyHistory as string[]); localStorage.setItem('tnpsc_history', JSON.stringify(data.studyHistory)); }
        if (Array.isArray(data.goalHistory)) { setGoalHistory(data.goalHistory as string[]); localStorage.setItem('tnpsc_goal_history', JSON.stringify(data.goalHistory)); }
        if (Array.isArray(data.mockTests)) { setMockTests(data.mockTests as MockTest[]); localStorage.setItem('tnpsc_mocks', JSON.stringify(data.mockTests)); }
        if (data.onboarding) { setOnboarding(data.onboarding as OnboardingData); setExamDateState((data.onboarding as OnboardingData).examDate); localStorage.setItem('tnpsc_onboarding', JSON.stringify(data.onboarding)); }
        if (data.dailyNotes) localStorage.setItem('tnpsc_daily_notes', JSON.stringify(data.dailyNotes));
        if (data.attemptedPapers) localStorage.setItem('tnpsc_attempted_papers', JSON.stringify(data.attemptedPapers));
        alert(`✅ Backup restored (v${data.version || 2}). Refresh the page to see all tabs.`);
      } catch { alert('❌ Restore failed partway.'); }
    };
    reader.readAsText(file); e.target.value = '';
  };

  const totalTopics = useMemo(() => { let t = 0; syllabusData.parts.forEach((p) => p.units.forEach((u) => { t += u.topics.length; })); return t; }, []);
  const masteredCount = useMemo(() => Object.values(progress).filter((s) => s.stage === 5).length, [progress]);
  const totalProgress = totalTopics === 0 ? 0 : Math.round((masteredCount / totalTopics) * 100);

  const dueToday = useMemo(() => {
    const today = todayISO();
    const due: { key: string; unitId: string; idx: number; stage: number; topic: string }[] = [];
    Object.keys(progress).forEach((key) => {
      const s = progress[key];
      if (s.stage >= 1 && s.stage < 5 && s.nextReviewDate && s.nextReviewDate <= today) {
        const [uid, iStr] = key.split('-'); const idx = parseInt(iStr);
        const unit = syllabusData.parts.flatMap((p) => p.units).find((u) => u.id === uid);
        if (unit) due.push({ key, unitId: uid, idx, stage: s.stage, topic: unit.topics[idx] });
      }
    });
    return due;
  }, [progress]);

  const getUnitProgress = (unitId: string, topics: string[]) => {
    let learned = 0, mastered = 0;
    topics.forEach((_, i) => { const s = progress[`${unitId}-${i}`]; if (s) { if (s.stage >= 1) learned++; if (s.stage === 5) mastered++; } });
    return { learned, mastered, total: topics.length };
  };
  const getPartProgress = (partId: string) => {
    const part = syllabusData.parts.find((p) => p.id === partId); if (!part) return 0;
    let learned = 0, total = 0;
    part.units.forEach((u) => { total += u.topics.length; u.topics.forEach((_, i) => { const s = progress[`${u.id}-${i}`]; if (s && s.stage >= 1) learned++; }); });
    return total === 0 ? 0 : Math.round((learned / total) * 100);
  };

  const getStageInfo = (stage: number, nextReviewDate: string | null) => {
    if (stage === 0) return { label: 'Learn', color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/40', due: false, daysLeft: 0 };
    if (stage === 5) return { label: 'Mastered', color: 'text-amber-300', bg: 'bg-amber-500/20 border-amber-500/40', due: false, daysLeft: 0 };
    const today = todayISO();
    const isDue = nextReviewDate !== null && nextReviewDate <= today;
    const daysLeft = nextReviewDate ? daysBetween(today, nextReviewDate) : 0;
    const colorMap: Record<number, string> = { 1: 'text-blue-400', 2: 'text-purple-400', 3: 'text-pink-400', 4: 'text-cyan-400' };
    const bgMap: Record<number, string> = { 1: 'bg-blue-500/20 border-blue-500/40', 2: 'bg-purple-500/20 border-purple-500/40', 3: 'bg-pink-500/20 border-pink-500/40', 4: 'bg-cyan-500/20 border-cyan-500/40' };
    return { label: STAGE_LABELS[stage], color: colorMap[stage] || 'text-gray-400', bg: bgMap[stage] || 'bg-white/10 border-white/20', due: isDue, daysLeft };
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear(); const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: React.ReactNode[] = [];
    for (let i = 0; i < firstDay; i++) days.push(<div key={`e-${i}`} className="h-9 w-9" />);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isStudied = studyHistory.includes(dateStr);
      const isGoal = goalHistory.includes(dateStr);
      const isToday = dateStr === todayISO();
      const isExamDay = dateStr === examDate;
      days.push(
        <motion.div key={d} initial={{ scale: 0, opacity: 0, rotate: -20 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} whileHover={{ scale: 1.2, y: -2 }} transition={{ delay: d * 0.008, type: 'spring', stiffness: 320, damping: 18 }}
          className={`h-9 w-9 flex items-center justify-center rounded-xl text-xs font-bold relative cursor-default
            ${isExamDay ? 'bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-600 text-white shadow-xl shadow-amber-500/60 ring-2 ring-amber-300/50'
              : isGoal ? 'bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/40'
              : isStudied ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30'
              : isToday ? 'border-2 border-orange-500 text-orange-500 bg-orange-500/10'
              : 'text-gray-400 dark:text-gray-500'}`}>
          <span className="relative z-10">{d}</span>
          {(isGoal || (isStudied && !isGoal)) && (
            <motion.span animate={{ scale: [1, 1.25, 1.05, 1.2, 1], rotate: [0, -8, 5, -5, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: d * 0.15 }} className={`absolute ${isGoal ? '-top-1 -right-1 text-xs' : '-top-0.5 -right-0.5 text-[10px]'} z-20`}>🔥</motion.span>
          )}
          {isExamDay && (
            <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-bold tracking-wider px-1 rounded bg-amber-500 text-black z-30 whitespace-nowrap">🎯 EXAM</motion.span>
          )}
        </motion.div>
      );
    }
    return days;
  };

  // ---- DARK MODE: PURE BLACK + BLUE ACCENTS ----
  const bgClass = darkMode
    ? 'bg-black text-gray-100'
    : 'bg-gradient-to-br from-slate-50 via-white to-orange-50/30 text-gray-900';

  const cardClass = darkMode
    ? 'bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl border border-white/[0.12] hover:border-blue-400/40 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300'
    : 'bg-white/70 backdrop-blur-xl border border-gray-200/60 hover:border-orange-200 shadow-sm';

  const inputClass = darkMode
    ? 'bg-white/[0.05] border-white/[0.12] text-white placeholder-gray-500 focus:border-blue-400/60 focus:outline-none focus:ring-2 focus:ring-blue-500/30'
    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400';

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 ${bgClass} relative overflow-hidden`}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {darkMode ? (
          <>
            <motion.div animate={{ x: [0, 60, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }} className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-25" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.6) 0%, rgba(59,130,246,0) 70%)' }} />
            <motion.div animate={{ x: [0, -50, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }} transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }} className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-25" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.55) 0%, rgba(99,102,241,0) 70%)' }} />
            <motion.div animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.25, 1] }} transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }} className="absolute top-1/3 -right-32 w-[400px] h-[400px] rounded-full blur-3xl opacity-20" style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.5) 0%, rgba(6,182,212,0) 70%)' }} />
            <motion.div animate={{ x: [0, -40, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }} transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }} className="absolute bottom-1/4 -left-32 w-[400px] h-[400px] rounded-full blur-3xl opacity-20" style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.45) 0%, rgba(56,189,248,0) 70%)' }} />
          </>
        ) : (
          <>
            <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-20 bg-orange-300" />
            <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-20 bg-red-300" />
          </>
        )}
      </div>

      <div className="relative z-10">
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40, scale: 0.9 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[110] px-5 py-3 rounded-xl shadow-2xl font-semibold text-sm ${toast.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white' : 'bg-gradient-to-r from-orange-500 to-red-600 text-white'}`}>{toast.msg}</motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {clearConfirmOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[70] p-4">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className={`rounded-3xl p-6 max-w-sm w-full shadow-2xl ${darkMode ? 'bg-[#0a0f1a] border border-blue-500/30' : 'bg-white border border-gray-200'}`}>
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg shadow-red-500/30"><Trash2 className="w-7 h-7 text-white" /></div>
                <h2 className="text-lg font-bold text-center mb-2">Clear today's plan?</h2>
                <p className={`text-center text-sm mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Removes all {todayPlan.length} topics.</p>
                <div className="flex gap-3">
                  <motion.button whileTap={{ scale: 0.97 }} onClick={clearTodayPlan} className="flex-1 bg-gradient-to-r from-red-500 to-orange-600 hover:opacity-90 text-white py-3 rounded-xl font-semibold">Yes, clear</motion.button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setClearConfirmOpen(false)} className={`flex-1 py-3 rounded-xl font-semibold ${darkMode ? 'bg-white/10 hover:bg-white/15 text-gray-200' : 'bg-gray-100 hover:bg-gray-200'}`}>Cancel</motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showOnboarding && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[60] p-4">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className={`rounded-3xl p-6 max-w-md w-full shadow-2xl ${darkMode ? 'bg-gradient-to-br from-[#0a0f1a] to-black border border-blue-500/30' : 'bg-white border border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-6">
                  <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }} className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-500/40"><Sparkles className="w-5 h-5 text-white" /></motion.div>
                  <h2 className="text-xl font-bold">Welcome to TNPSC Tracker</h2>
                </div>
                <div className="flex gap-1 mb-6">
                  {[0, 1, 2].map((i) => (<motion.div key={i} animate={{ scaleX: i <= onboardStep ? 1 : 0.5 }} className={`flex-1 h-1 rounded-full ${i <= onboardStep ? 'bg-blue-500' : darkMode ? 'bg-white/10' : 'bg-gray-200'}`} />))}
                </div>
                <AnimatePresence mode="wait">
                  {onboardStep === 0 && (
                    <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <h3 className="font-semibold mb-3">When is your exam?</h3>
                      <input type="date" value={onboardExam} onChange={(e) => setOnboardExam(e.target.value)} className={`w-full p-3 rounded-xl border text-sm ${inputClass}`} />
                      <p className="text-xs text-gray-400 mt-2">Default: 20 Dec 2026 — verify on official notification</p>
                    </motion.div>
                  )}
                  {onboardStep === 1 && (
                    <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <h3 className="font-semibold mb-3">Which part is your weakest?</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {[{ id: 'A', label: 'Part A: General Studies' }, { id: 'B', label: 'Part B: Aptitude' }, { id: 'C', label: 'Part C: Tamil' }, { id: 'none', label: 'No weak zone' }].map((opt) => (
                          <motion.button key={opt.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setOnboardWeak(opt.id as 'A' | 'B' | 'C' | 'none')} className={`p-3 rounded-xl border text-xs font-medium ${onboardWeak === opt.id ? 'bg-blue-500 border-blue-500 text-white' : darkMode ? 'bg-white/5 border-white/15 text-gray-300 hover:bg-white/10' : 'bg-gray-50 border-gray-200'}`}>{opt.label}</motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  {onboardStep === 2 && (
                    <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <h3 className="font-semibold mb-3">Daily goal?</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {[2, 3, 5].map((n) => (<motion.button key={n} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setOnboardGoal(n)} className={`p-4 rounded-xl border font-bold text-lg ${onboardGoal === n ? 'bg-blue-500 border-blue-500 text-white' : darkMode ? 'bg-white/5 border-white/15 text-gray-300 hover:bg-white/10' : 'bg-gray-50 border-gray-200'}`}>{n}</motion.button>))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="flex gap-3 mt-6">
                  {onboardStep > 0 && (<motion.button whileTap={{ scale: 0.97 }} onClick={() => setOnboardStep((s) => s - 1)} className={`flex-1 py-2.5 rounded-xl font-semibold ${darkMode ? 'bg-white/10 hover:bg-white/15 text-gray-200' : 'bg-gray-100 hover:bg-gray-200'}`}>Back</motion.button>)}
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => (onboardStep < 2 ? setOnboardStep((s) => s + 1) : completeOnboarding())} className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2.5 rounded-xl font-semibold hover:opacity-90">{onboardStep < 2 ? 'Next' : 'Start Studying'}</motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {celebrateGoal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center">
              {[...Array(40)].map((_, i) => (<motion.div key={i} initial={{ x: 0, y: 0, scale: 0, opacity: 1 }} animate={{ x: (Math.random() - 0.5) * 900, y: (Math.random() - 0.5) * 900, scale: [0, 1.3, 0.5], opacity: [1, 1, 0], rotate: Math.random() * 720 }} transition={{ duration: 2.2, ease: 'easeOut' }} className={`absolute w-3 h-3 rounded-sm ${['bg-orange-400', 'bg-red-500', 'bg-amber-400', 'bg-yellow-400', 'bg-pink-500'][i % 5]}`} />))}
              <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gradient-to-br from-orange-500 to-red-600 text-white px-8 py-4 rounded-2xl shadow-2xl font-bold text-xl">🔥 Daily Goal Hit!</motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isSickPromptOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className={`rounded-3xl p-6 max-w-sm w-full shadow-2xl ${darkMode ? 'bg-gradient-to-br from-[#0a0f1a] to-black border border-blue-500/30' : 'bg-white border border-gray-200'}`}>
                <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg shadow-red-500/30"><HeartPulse className="w-8 h-8 text-white" /></motion.div>
                <h2 className="text-xl font-bold text-center mb-2">We missed you!</h2>
                <p className={`text-center mb-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>You missed {missedDays} day{missedDays > 1 ? 's' : ''}.</p>
                <p className="text-center text-xs text-amber-400 mb-6">Sick days left: {7 - sickDaysUsed}. Preserves streak — but study today to keep it going.</p>
                <div className="flex gap-3">
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleSickMode(true)} disabled={missedDays > (7 - sickDaysUsed)} className="flex-1 bg-gradient-to-r from-red-500 to-orange-600 hover:opacity-90 text-white py-3 rounded-xl font-semibold disabled:opacity-40">I was sick</motion.button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleSickMode(false)} className={`flex-1 py-3 rounded-xl font-semibold ${darkMode ? 'bg-white/10 hover:bg-white/15 text-gray-200' : 'bg-gray-100 hover:bg-gray-200'}`}>Just away</motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {notesModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className={`rounded-3xl p-6 max-w-md w-full shadow-2xl ${darkMode ? 'bg-gradient-to-br from-[#0a0f1a] to-black border border-blue-500/30' : 'bg-white border border-gray-200'}`}>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-400" /> Quick Notes</h2>
                <textarea value={notesInput} onChange={(e) => setNotesInput(e.target.value)} placeholder="Key points, formulas..." rows={6} className={`w-full p-3 rounded-xl border text-sm ${inputClass}`} autoFocus />
                <div className="flex gap-3 mt-4">
                  <motion.button whileTap={{ scale: 0.97 }} onClick={saveNotesAction} className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2.5 rounded-xl font-semibold hover:opacity-90">Save</motion.button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setNotesModal(null); setNotesInput(''); }} className={`flex-1 py-2.5 rounded-xl font-semibold ${darkMode ? 'bg-white/10 hover:bg-white/15 text-gray-200' : 'bg-gray-100 hover:bg-gray-200'}`}>Cancel</motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <nav className={`sticky top-0 z-40 backdrop-blur-2xl border-b ${darkMode ? 'bg-black/80 border-white/[0.12]' : 'bg-white/70 border-gray-200/60'}`}>
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <motion.button onClick={() => setActiveTab('dashboard')} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex items-center gap-2.5">
              <motion.div whileHover={{ rotate: 5, scale: 1.05 }} className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-500/40"><BookOpen className="w-5 h-5 text-white" /></motion.div>
              <span className="font-bold text-lg hidden sm:block tracking-tight">TNPSC Tracker</span>
            </motion.button>
            <div className="flex items-center gap-2">
              <motion.div key={liveStreak} initial={{ scale: 1.3, rotate: -5 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 15 }} className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500/25 to-red-500/25 border border-orange-500/40 text-orange-300 px-3 py-1.5 rounded-full font-bold text-sm shadow-lg shadow-orange-500/20">
                <motion.div animate={{ scale: [1, 1.2, 1.05, 1.15, 1], rotate: [0, -5, 3, -3, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}><Flame className="w-4 h-4 fill-current" /></motion.div>
                <AnimatedNumber value={liveStreak} />
              </motion.div>
              <div className={`hidden sm:flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full ${darkMode ? 'text-gray-200 bg-white/10' : 'text-gray-600 bg-gray-100'}`}><CalendarIcon className="w-4 h-4" />{daysLeftDisplay}d</div>
              <motion.button whileTap={{ scale: 0.9 }} onClick={exportData} title="Export backup" className={`p-2 rounded-xl transition ${darkMode ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100'}`}><Download className="w-5 h-5" /></motion.button>
              <motion.label whileTap={{ scale: 0.9 }} title="Import backup" className={`p-2 rounded-xl transition cursor-pointer ${darkMode ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100'}`}>
                <Upload className="w-5 h-5" />
                <input type="file" accept=".json" onChange={importData} className="hidden" />
              </motion.label>
              <motion.button whileTap={{ scale: 0.9, rotate: 90 }} onClick={() => { setDarkMode(!darkMode); localStorage.setItem('tnpsc_dark', JSON.stringify(!darkMode)); }} className={`p-2 rounded-xl transition ${darkMode ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100'}`}>
                <AnimatePresence mode="wait">
                  <motion.div key={darkMode ? 'sun' : 'moon'} initial={{ rotate: -90, opacity: 0, scale: 0 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} exit={{ rotate: 90, opacity: 0, scale: 0 }} transition={{ duration: 0.3, type: 'spring', stiffness: 400, damping: 20 }}>
                    {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </motion.div>
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </nav>

        <main className="max-w-5xl mx-auto px-4 py-6 pb-24">
          <div className="flex overflow-x-auto gap-2 mb-6 pb-2">
            {[{ id: 'dashboard' as const, label: 'Dashboard', icon: Target }, { id: 'syllabus' as const, label: 'Syllabus', icon: BookOpen }, { id: 'daily' as const, label: 'Daily Affairs', icon: Newspaper }, { id: 'practice' as const, label: 'Practice', icon: Zap }, { id: 'mock' as const, label: 'Mock Tests', icon: FileText }].map((tab) => (
              <motion.button key={tab.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setActiveTab(tab.id)} className={`relative flex items-center gap-2 px-4 py-2 rounded-full font-medium transition whitespace-nowrap text-sm ${activeTab === tab.id ? 'text-white' : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                {activeTab === tab.id && (<motion.div layoutId="activeTab" className={`absolute inset-0 rounded-full shadow-lg ${darkMode ? 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-blue-500/40' : 'bg-gradient-to-r from-orange-500 to-red-600 shadow-orange-500/40'}`} transition={{ type: 'spring', stiffness: 500, damping: 35, mass: 0.8 }} />)}
                <span className="relative z-10 flex items-center gap-2"><tab.icon className="w-4 h-4" />{tab.label}</span>
              </motion.button>
            ))}
          </div>

          <AnimatePresence mode="popLayout" initial={false}>
            {activeTab === 'dashboard' && (
              <motion.div key="dash" initial="initial" animate="animate" exit="exit" variants={fadeInUp} className="space-y-5">
                <motion.div variants={fadeInUp} className={`${cardClass} p-5 rounded-2xl relative overflow-hidden`}>
                  {darkMode && (<div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-25 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.6) 0%, rgba(59,130,246,0) 70%)' }} />)}
                  <div className="relative flex items-start gap-3">
                    <motion.div animate={{ rotate: [0, -5, 5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}><Quote className={`w-5 h-5 shrink-0 mt-0.5 ${darkMode ? 'text-blue-400' : 'text-orange-500'}`} /></motion.div>
                    <div>
                      <p className={`text-sm italic font-medium ${darkMode ? 'text-gray-100' : ''}`}>"{dailyQuote.text}"</p>
                      <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>— {dailyQuote.author}</p>
                      <p className={`text-[10px] mt-1 uppercase tracking-wider ${darkMode ? 'text-blue-300' : 'text-orange-400'}`}>Quote of the Day</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={fadeInUp} className={`${cardClass} p-3 rounded-2xl flex items-start gap-2`}>
                  <Info className={`w-4 h-4 shrink-0 mt-0.5 ${darkMode ? 'text-blue-300' : 'text-amber-500'}`} />
                  <p className={`text-[11px] leading-snug ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Part C (Tamil) is a qualifying gate — score 40% to have Parts A & B evaluated. Don't neglect Tamil.</p>
                </motion.div>

                <motion.div variants={stagger} initial="initial" animate="animate" className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Mastered', sub: `${totalProgress}%`, color: darkMode ? 'from-blue-500 to-cyan-500' : 'from-indigo-500 to-violet-600' },
                    { label: 'Today', value: `${Math.min(todayActions, onboarding.dailyGoal)}/${onboarding.dailyGoal}`, sub: 'unique topics', color: 'from-emerald-500 to-green-600' },
                    { label: 'Streak', sub: '🔥 days', color: 'from-orange-500 to-red-600' },
                    { label: 'Due Review', sub: 'topics', color: 'from-pink-500 to-rose-600' },
                  ].map((stat, i) => (
                    <motion.div key={i} variants={fadeInUp} whileHover={{ y: -6, scale: 1.02 }} whileTap={{ scale: 0.98 }} className={`${cardClass} p-4 rounded-2xl relative overflow-hidden group`}>
                      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-25 rounded-full blur-2xl -mr-8 -mt-8 group-hover:opacity-40 transition-opacity duration-300`} />
                      <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${stat.color} opacity-70`} />
                      <div className="relative">
                        <div className={`text-xs mb-1 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{stat.label}</div>
                        <div className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                          {stat.label === 'Mastered' && <><AnimatedNumber value={masteredCount} /><span className="text-base">/{totalTopics}</span></>}
                          {stat.label === 'Streak' && <AnimatedNumber value={liveStreak} />}
                          {stat.label === 'Due Review' && <AnimatedNumber value={dueToday.length} />}
                          {stat.label === 'Today' && stat.value}
                        </div>
                        <div className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{stat.sub}</div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {dueToday.length > 0 && (
                  <motion.div variants={fadeInUp} className={`${cardClass} p-5 rounded-2xl border-l-4 border-l-pink-500 relative overflow-hidden`}>
                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2 relative z-10">
                      <motion.div animate={{ rotate: [0, -15, 15, 0] }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}><Clock className="w-5 h-5 text-pink-400" /></motion.div>
                      Due for Revision
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${darkMode ? 'bg-pink-500/25 text-pink-200 border-pink-500/40' : 'bg-pink-500 text-white border-pink-500'}`}><AnimatedNumber value={dueToday.length} /></span>
                    </h3>
                    <div className="space-y-2 relative z-10">
                      {dueToday.slice(0, 5).map((item) => {
                        const si = getStageInfo(item.stage, null);
                        return (
                          <div key={item.key} className={`flex items-center justify-between p-3 rounded-xl ${darkMode ? 'bg-white/[0.06] border border-white/[0.08]' : 'bg-gray-50'}`}>
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm truncate ${darkMode ? 'text-gray-100' : ''}`}>{item.topic}</div>
                              <div className={`text-xs ${si.color} mt-0.5`}>{STAGE_LABELS[item.stage]} → {STAGE_LABELS[item.stage + 1]}</div>
                            </div>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }} onClick={() => advanceStage(item.unitId, item.idx)} className={`ml-3 text-xs px-3 py-1.5 rounded-lg font-semibold border transition ${darkMode ? 'bg-pink-500/25 border-pink-500/50 text-pink-200 hover:bg-pink-500/35' : 'bg-pink-500 border-pink-500 text-white hover:bg-pink-600'}`}>Revise Now</motion.button>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                <motion.div variants={fadeInUp} className={`${cardClass} p-5 rounded-2xl relative overflow-hidden`}>
                  <div className="flex justify-between items-center mb-4 flex-wrap gap-2 relative z-10">
                    <h3 className="text-lg font-bold flex items-center gap-2"><CheckSquare className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-orange-500'}`} /> Today's Plan {todayPlan.length > 0 && <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${darkMode ? 'bg-blue-500/25 text-blue-200 border-blue-500/40' : 'bg-orange-500 text-white border-orange-500'}`}>{todayPlan.length}</span>}</h3>
                    <div className="flex gap-2 flex-wrap">
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={autoGeneratePlan} className="text-xs bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1.5 rounded-full font-semibold shadow-lg shadow-blue-500/30 flex items-center gap-1"><motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.5 }}><Sparkles className="w-3 h-3" /></motion.div>Smart Generate</motion.button>
                      {todayPlan.length > 1 && (<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={shuffleTodayPlan} className="text-xs bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white px-3 py-1.5 rounded-full font-semibold shadow-lg shadow-violet-500/30 flex items-center gap-1"><Shuffle className="w-3 h-3" /> Shuffle</motion.button>)}
                      {todayPlan.length > 0 && (<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setClearConfirmOpen(true)} className={`text-xs px-3 py-1.5 rounded-full font-semibold flex items-center gap-1 border transition ${darkMode ? 'bg-red-500/25 border-red-500/50 text-red-200 hover:bg-red-500/35' : 'bg-red-500 border-red-500 text-white hover:bg-red-600'}`}><XCircle className="w-3 h-3" /> Clear</motion.button>)}
                    </div>
                  </div>
                  {todayPlan.length === 0 ? (
                    <p className={`text-sm text-center py-6 relative z-10 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Click <span className={`font-semibold ${darkMode ? 'text-blue-400' : 'text-orange-500'}`}>✨ Smart Generate</span></p>
                  ) : (
                    <div className="space-y-2 relative z-10">
                      <AnimatePresence>
                        {todayPlan.map((key) => {
                          const [uid, iStr] = key.split('-'); const idx = parseInt(iStr);
                          const unit = syllabusData.parts.flatMap((p) => p.units).find((u) => u.id === uid);
                          const topic = unit?.topics[idx]; const state = progress[key];
                          const stage = state?.stage || 0; const si = getStageInfo(stage, state?.nextReviewDate || null);
                          const isLocked = lockedTopics[key];
                          return (
                            <motion.div key={key} layout initial={{ opacity: 0, scale: 0.9, x: -20 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9, x: 20 }} transition={{ type: 'spring', stiffness: 500, damping: 40 }} className={`flex items-center justify-between p-3 rounded-xl ${darkMode ? 'bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.1]' : 'bg-gray-50'} relative overflow-hidden transition-colors`}>
                              <div className="flex items-center gap-3 flex-1 min-w-0 relative z-10">
                                <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }} onClick={() => advanceStage(uid, idx)} disabled={isLocked}>
                                  {stage === 5 ? <Star className="w-5 h-5 text-amber-300 fill-current" /> : stage >= 1 ? <CheckCircle2 className={`w-5 h-5 ${si.color}`} /> : <Circle className="w-5 h-5 text-gray-400" />}
                                </motion.button>
                                <button onClick={() => advanceStage(uid, idx)} disabled={isLocked} className={`text-sm text-left truncate flex-1 ${stage >= 1 ? 'text-gray-400' : darkMode ? 'text-gray-100' : ''}`}>{topic}</button>
                                <span className={`text-xs px-2 py-0.5 rounded-md border ${si.bg} ${si.color}`}>{si.label}{stage >= 1 && stage < 5 && si.daysLeft !== undefined && <span className="ml-1 opacity-70">{si.due ? '· Due' : `· ${si.daysLeft}d`}</span>}</span>
                              </div>
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => removeFromTodayPlan(key)} className="text-red-400 p-1 ml-2 relative z-10"><Trash2 className="w-4 h-4" /></motion.button>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>

                <motion.div variants={fadeInUp} className={`${cardClass} p-5 rounded-2xl relative overflow-hidden`}>
                  <div className="flex justify-between items-center mb-4 relative z-10">
                    <h3 className="text-lg font-bold flex items-center gap-2"><CalendarIcon className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-purple-500'}`} /> Streak Calendar</h3>
                    <div className="flex gap-1 items-center">
                      <motion.button whileTap={{ scale: 0.85 }} onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100'}`}><ChevronRight className="w-4 h-4 rotate-180" /></motion.button>
                      <span className={`text-xs font-semibold px-2 min-w-[110px] text-center ${darkMode ? 'text-gray-200' : ''}`}>{MONTH_SHORT[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
                      <motion.button whileTap={{ scale: 0.85 }} onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100'}`}><ChevronRight className="w-4 h-4" /></motion.button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center mb-2 relative z-10">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className={`text-xs font-bold py-1 ${darkMode ? 'text-gray-300' : 'text-gray-400'}`}>{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1 place-items-center relative z-10">{renderCalendar()}</div>
                  <div className="flex justify-center gap-4 mt-4 text-xs flex-wrap relative z-10">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500" /><span className={darkMode ? 'text-gray-300' : 'text-gray-500'}>Studied</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-lg bg-gradient-to-br from-orange-500 to-red-600" /><span className={darkMode ? 'text-gray-300' : 'text-gray-500'}>Goal Hit 🔥</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-lg bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-600 ring-2 ring-amber-300/50" /><span className={darkMode ? 'text-gray-300' : 'text-gray-500'}>Exam 🎯</span></div>
                  </div>
                </motion.div>

                <motion.div variants={fadeInUp} className={`${cardClass} p-5 rounded-2xl relative overflow-hidden`}>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 relative z-10"><Trophy className={`w-5 h-5 ${darkMode ? 'text-blue-300' : 'text-amber-500'}`} /> Syllabus</h3>
                  <div className="space-y-4 relative z-10">
                    {syllabusData.parts.map((part, i) => {
                      const pct = getPartProgress(part.id);
                      return (
                        <div key={part.id}>
                          <div className="flex justify-between text-sm mb-1.5">
                            <span className={`font-medium ${darkMode ? 'text-gray-200' : ''}`}>{part.name}</span>
                            <span className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}><AnimatedNumber value={pct} />%</span>
                          </div>
                          <div className={`w-full rounded-full h-2.5 overflow-hidden ${darkMode ? 'bg-white/10' : 'bg-gray-100'}`}>
                            <motion.div className={`h-full rounded-full shadow-lg ${darkMode ? 'bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-600 shadow-blue-500/30' : 'bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 shadow-indigo-500/30'}`} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ type: 'spring', stiffness: 80, damping: 20, delay: i * 0.12 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>

                <motion.div variants={fadeInUp} whileHover={{ scale: 1.01 }} className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-2xl shadow-blue-500/30">
                  <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.3, 0.15] }} transition={{ duration: 6, repeat: Infinity }} className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl -mr-16 -mt-16" />
                  <div className="relative">
                    <h3 className="font-bold text-lg mb-1">Keep going 🚀</h3>
                    <p className="text-blue-100 text-sm">{liveStreak > 0 ? `${liveStreak}-day streak! ${masteredCount} topics mastered.` : 'Start your streak today. Even 1 topic counts.'}</p>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'syllabus' && (
              <motion.div key="syl" initial="initial" animate="animate" exit="exit" variants={fadeInUp} className="space-y-4">
                {syllabusData.parts.map((part) => (
                  <div key={part.id} className={`${cardClass} rounded-2xl overflow-hidden`}>
                    <div className={`p-4 border-b ${darkMode ? 'bg-white/[0.04] border-white/[0.12]' : 'bg-gray-50/50 border-gray-100'}`}><h2 className={`font-bold text-base ${darkMode ? 'text-gray-100' : ''}`}>{part.name}</h2></div>
                    <div className={`divide-y ${darkMode ? 'divide-white/[0.08]' : 'divide-gray-100'}`}>
                      {part.units.map((unit) => {
                        const isExpanded = expandedUnits[unit.id];
                        const { learned, mastered, total } = getUnitProgress(unit.id, unit.topics);
                        const isWeakUnit = (part as { weakZoneKey?: string }).weakZoneKey === onboarding.weakZone;
                        return (
                          <div key={unit.id}>
                            <div className="flex items-center justify-between p-4">
                              <button onClick={() => setExpandedUnits((p) => ({ ...p, [unit.id]: !p[unit.id] }))} className="flex items-center gap-3 flex-1 text-left">
                                <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}><ChevronRight className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-400'}`} /></motion.div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`font-medium text-sm ${darkMode ? 'text-gray-100' : ''}`}>{unit.name}</span>
                                    {isWeakUnit && <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase border ${darkMode ? 'bg-blue-500/25 text-blue-200 border-blue-500/40' : 'bg-orange-500 text-white border-orange-500'}`}>Priority</span>}
                                  </div>
                                </div>
                              </button>
                              <div className="flex items-center gap-2 ml-2">
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }} onClick={() => markUnitComplete(unit.id, total)} className={`text-xs px-2.5 py-1 rounded-lg font-semibold border transition ${darkMode ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40 hover:bg-emerald-500/30' : 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/25'}`}>All</motion.button>
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${darkMode ? 'bg-white/10 text-gray-200' : 'bg-gray-100 text-gray-600'}`}>{mastered > 0 ? `${mastered}⭐` : `${learned}/${total}`}</span>
                              </div>
                            </div>
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                                  <div className={`p-4 pt-0 space-y-2 ${darkMode ? 'bg-black/40' : 'bg-gray-50/50'}`}>
                                    {unit.topics.map((topic, idx) => {
                                      const key = `${unit.id}-${idx}`;
                                      const state = progress[key]; const stage = state?.stage || 0;
                                      const si = getStageInfo(stage, state?.nextReviewDate || null);
                                      const isInPlan = todayPlan.includes(key);
                                      const isLocked = lockedTopics[key];
                                      return (
                                        <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }} className={`p-3 rounded-xl border transition-colors ${si.due ? 'border-pink-500/60 bg-pink-500/15' : darkMode ? 'bg-white/[0.06] border-white/[0.12] hover:bg-white/[0.09]' : 'bg-white border-gray-100'}`}>
                                          <div className="flex items-start gap-3">
                                            <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }} onClick={() => advanceStage(unit.id, idx)} disabled={isLocked} className="mt-0.5">
                                              {stage === 5 ? <Star className="w-5 h-5 text-amber-300 fill-current" /> : stage >= 1 ? <CheckCircle2 className={`w-5 h-5 ${si.color}`} /> : <Circle className="w-5 h-5 text-gray-400" />}
                                            </motion.button>
                                            <div className="flex-1 min-w-0">
                                              <button onClick={() => advanceStage(unit.id, idx)} disabled={isLocked} className={`text-sm text-left block w-full ${stage >= 1 ? 'text-gray-400' : darkMode ? 'text-gray-100' : ''}`}>{topic}</button>
                                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                <button onClick={() => advanceStage(unit.id, idx)} disabled={isLocked} className={`text-xs px-2.5 py-1 rounded-lg font-semibold border transition ${si.bg} ${si.color} ${si.due ? 'animate-pulse' : ''}`}>{si.label}{stage >= 1 && stage < 5 && si.daysLeft !== undefined && <span className="ml-1 opacity-70">{si.due ? '· Due' : `· ${si.daysLeft}d`}</span>}</button>
                                                {stage > 0 && <button onClick={() => decreaseStage(unit.id, idx)} className={`text-xs px-2 py-1 rounded-lg font-semibold border ${darkMode ? 'bg-white/10 border-white/20 text-gray-200 hover:text-white hover:bg-white/20' : 'bg-gray-100 border-gray-200 text-gray-500'}`} title="Undo"><RotateCcw className="w-3 h-3" /></button>}
                                                <button onClick={() => openNotesModal(unit.id, idx, state?.notes || '')} className={`text-xs flex items-center gap-1 px-2 py-1 ${darkMode ? 'text-blue-300 hover:text-blue-200' : 'text-indigo-500 hover:text-indigo-600'}`}><FileText className="w-3 h-3" /> {state?.notes ? 'Note' : '+ Note'}</button>
                                                {isInPlan ? (<button onClick={() => removeFromTodayPlan(key)} className={`text-xs flex items-center gap-1 px-2 py-1 font-medium ${darkMode ? 'text-blue-300' : 'text-orange-500'}`}><CheckCircle2 className="w-3 h-3" /> In Plan</button>) : (<button onClick={() => addToTodayPlan(key)} className={`text-xs flex items-center gap-1 px-2 py-1 ${darkMode ? 'text-emerald-300' : 'text-emerald-600'}`}><Plus className="w-3 h-3" /> Today</button>)}
                                              </div>
                                              {state?.notes && <div className={`mt-2 text-xs p-2.5 rounded-lg border ${darkMode ? 'text-gray-300 bg-black/40 border-white/10' : 'text-gray-600 bg-gray-50 border-gray-100'}`}>📝 {state.notes}</div>}
                                            </div>
                                          </div>
                                        </motion.div>
                                      );
                                    })}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'daily' && (<motion.div key="daily" initial="initial" animate="animate" exit="exit" variants={fadeInUp}><DailyAffairs darkMode={darkMode} /></motion.div>)}
            {activeTab === 'practice' && (<motion.div key="practice" initial="initial" animate="animate" exit="exit" variants={fadeInUp}><Practice darkMode={darkMode} progress={progress} /></motion.div>)}

            {activeTab === 'mock' && (
              <motion.div key="mock" initial="initial" animate="animate" exit="exit" variants={fadeInUp} className="space-y-5">
                <div className="flex gap-2 p-1 rounded-full w-fit" style={{ background: darkMode ? 'rgba(255,255,255,0.08)' : '#f3f4f6' }}>
                  {[{ id: 'papers' as const, label: 'Past Papers', icon: FileText }, { id: 'logs' as const, label: 'My Logs', icon: Save }].map((tab) => (
                    <button key={tab.id} onClick={() => setMockTab(tab.id)} className={`relative flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap ${mockTab === tab.id ? 'text-white' : darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                      {mockTab === tab.id && <motion.div layoutId="mockInnerTab" className={`absolute inset-0 rounded-full shadow-lg ${darkMode ? 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-blue-500/30' : 'bg-gradient-to-r from-orange-500 to-red-600 shadow-orange-500/30'}`} transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
                      <span className="relative z-10 flex items-center gap-1.5"><tab.icon className="w-3 h-3" />{tab.label}</span>
                    </button>
                  ))}
                </div>

                {mockTab === 'papers' && <PastPapers darkMode={darkMode} />}

                {mockTab === 'logs' && (
                  <>
                    <div className={`${cardClass} p-5 rounded-2xl`}>
                      <h3 className={`font-bold text-lg mb-4 ${darkMode ? 'text-gray-100' : ''}`}>Log Mock Test</h3>
                      <form onSubmit={addMockTest} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input name="date" type="date" required className={`p-2.5 rounded-xl border text-sm ${inputClass}`} />
                        <input name="subject" placeholder="Subject" required className={`p-2.5 rounded-xl border text-sm ${inputClass}`} />
                        <input name="score" type="number" placeholder="Score" required className={`p-2.5 rounded-xl border text-sm ${inputClass}`} />
                        <input name="total" type="number" placeholder="Total" required className={`p-2.5 rounded-xl border text-sm ${inputClass}`} />
                        <textarea name="reasonLost" placeholder="Why did I lose marks?" rows={2} className={`md:col-span-2 p-2.5 rounded-xl border text-sm resize-none ${inputClass}`} />
                        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} type="submit" className={`md:col-span-2 text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg ${darkMode ? 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-blue-500/30' : 'bg-gradient-to-r from-orange-500 to-red-600 shadow-orange-500/30'}`}><Save className="w-4 h-4" /> Save Test</motion.button>
                      </form>
                    </div>
                    <div className="space-y-2">
                      {mockTests.length === 0 ? <p className={`text-center py-8 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No mock tests yet.</p> : mockTests.map((test) => (
                        <div key={test.id} className={`${cardClass} p-4 rounded-2xl`}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <div className={`font-bold text-sm ${darkMode ? 'text-gray-100' : ''}`}>{test.subject}</div>
                              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{test.date}</div>
                              {test.reasonLost && <div className={`text-xs mt-2 p-2 rounded-lg italic ${darkMode ? 'bg-black/40 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>💡 {test.reasonLost}</div>}
                            </div>
                            <div className="text-right ml-3">
                              <div className={`text-lg font-bold bg-clip-text text-transparent ${darkMode ? 'bg-gradient-to-r from-blue-400 to-cyan-400' : 'bg-gradient-to-r from-orange-400 to-red-500'}`}>{test.score}/{test.total}</div>
                              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{test.total > 0 ? Math.round((test.score / test.total) * 100) : 0}%</div>
                              <button onClick={() => deleteMockTest(test.id)} className="text-xs text-red-400 hover:text-red-300 mt-1"><Trash2 className="w-3 h-3 inline" /></button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className={`fixed bottom-0 w-full backdrop-blur-2xl border-t p-2 text-center text-xs ${darkMode ? 'bg-black/80 border-white/[0.12] text-gray-300' : 'bg-white/70 border-gray-200/60 text-gray-500'}`}>
          TNPSC Group IV • Exam: {formatExamDate(examDate)}
        </footer>
      </div>
    </div>
  );
}