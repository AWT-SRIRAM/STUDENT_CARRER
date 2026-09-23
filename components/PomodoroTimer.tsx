"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, Clock, CheckCircle, Flame } from 'lucide-react';
import AnimatedProgressBar from '@/components/AnimatedProgressBar';

interface PomodoroTimerProps {
  darkMode: boolean;
  onSessionComplete?: (minutes: number) => void;
}

export default function PomodoroTimer({ darkMode, onSessionComplete }: PomodoroTimerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'study' | 'break'>('study');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [completedSessions, setCompletedSessions] = useState(0);

  const initialTime = mode === 'study' ? 25 * 60 : 5 * 60;
  const progressPct = ((initialTime - timeLeft) / initialTime) * 100;

  // Sound synthesis using Web Audio API
  const playBeep = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(mode === 'study' ? 587.33 : 880, ctx.currentTime); // D5 or A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch {
      // Audio context might be restricted before interaction
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      setIsRunning(false);
      playBeep();
      if (mode === 'study') {
        setCompletedSessions((c) => c + 1);
        if (onSessionComplete) onSessionComplete(25);
        setMode('break');
        setTimeLeft(5 * 60);
      } else {
        setMode('study');
        setTimeLeft(25 * 60);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, mode]);

  const toggleRunning = () => setIsRunning((r) => !r);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'study' ? 25 * 60 : 5 * 60);
  };

  const switchMode = (newMode: 'study' | 'break') => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(newMode === 'study' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const cardClass = darkMode
    ? 'bg-[#0b1329]/90 border border-blue-500/30 text-white shadow-2xl backdrop-blur-2xl'
    : 'bg-white/95 border border-indigo-100 text-gray-900 shadow-2xl backdrop-blur-2xl';

  return (
    <>
      {/* Floating launcher badge */}
      <motion.button
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-14 right-4 z-40 flex items-center gap-2 px-3.5 py-2 rounded-full font-bold text-xs shadow-xl transition-all ${
          isRunning
            ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white animate-flame'
            : darkMode
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/30'
            : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-indigo-500/30'
        }`}
      >
        <Clock className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
        <span>{isRunning ? formatTime(timeLeft) : 'Focus Timer'}</span>
        {completedSessions > 0 && (
          <span className="bg-white/25 px-1.5 py-0.2 rounded-full text-[10px]">
            {completedSessions}🔥
          </span>
        )}
      </motion.button>

      {/* Modal Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className={`rounded-3xl p-6 max-w-sm w-full relative overflow-hidden ${cardClass}`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Background gradient blur */}
              <div
                className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none ${
                  mode === 'study' ? 'bg-blue-500' : 'bg-emerald-500'
                }`}
              />

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-2 rounded-xl ${
                      mode === 'study'
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                        : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Focus Pomodoro</h3>
                    <p className="text-[10px] opacity-70">TNPSC Study Routine</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`p-1.5 rounded-lg transition ${
                      darkMode ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                    }`}
                    title={soundEnabled ? 'Mute' : 'Enable sound'}
                  >
                    {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
                      darkMode ? 'bg-white/10 hover:bg-white/15' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Mode toggles */}
              <div
                className={`grid grid-cols-2 gap-1 p-1 rounded-2xl mb-6 ${
                  darkMode ? 'bg-black/40 border border-white/10' : 'bg-gray-100'
                }`}
              >
                <button
                  onClick={() => switchMode('study')}
                  className={`py-1.5 rounded-xl text-xs font-semibold transition ${
                    mode === 'study'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                      : darkMode
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  25m Focus
                </button>
                <button
                  onClick={() => switchMode('break')}
                  className={`py-1.5 rounded-xl text-xs font-semibold transition ${
                    mode === 'break'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                      : darkMode
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  5m Break
                </button>
              </div>

              {/* Circular / Large timer display */}
              <div className="text-center py-4 relative">
                <div className="text-5xl font-black tracking-tight font-mono mb-2">
                  {formatTime(timeLeft)}
                </div>
                <div className="flex items-center justify-center gap-1 text-xs opacity-75">
                  <span>{mode === 'study' ? '🎯 High-Retention Deep Study' : '☕ Refresh & Hydrate'}</span>
                </div>

                {/* High-fidelity Animated Progress bar */}
                <div className="mt-6">
                  <AnimatedProgressBar
                    value={progressPct}
                    height="h-3"
                    colorVariant={mode === 'study' ? 'blue-indigo' : 'emerald-teal'}
                    darkMode={darkMode}
                    showTipGlow={true}
                    showStripes={true}
                    showShimmer={true}
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="flex gap-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={toggleRunning}
                  className={`flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg ${
                    isRunning
                      ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30'
                      : mode === 'study'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white shadow-blue-500/30'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white shadow-emerald-500/30'
                  }`}
                >
                  {isRunning ? (
                    <>
                      <Pause className="w-4 h-4" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" /> Start Focus
                    </>
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetTimer}
                  className={`p-3 rounded-2xl font-semibold border transition ${
                    darkMode
                      ? 'bg-white/5 border-white/15 hover:bg-white/10 text-gray-300'
                      : 'bg-gray-100 border-gray-200 hover:bg-gray-200 text-gray-700'
                  }`}
                  title="Reset"
                >
                  <RotateCcw className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Stats Footer */}
              {completedSessions > 0 && (
                <div
                  className={`mt-4 pt-3 border-t flex items-center justify-between text-xs ${
                    darkMode ? 'border-white/10 text-gray-400' : 'border-gray-100 text-gray-500'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Completed: {completedSessions}
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-orange-400">
                    <Flame className="w-3.5 h-3.5" /> +{completedSessions * 25} XP
                  </span>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
