"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, XCircle, RefreshCw, Sparkles, Award, AlertCircle } from 'lucide-react';
import { getSupabase } from '@/lib/supabase/client';

type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

type Props = {
  topics: string[];
  darkMode: boolean;
  onClose: () => void;
};

export default function PracticeQuiz({ topics, darkMode, onClose }: Props) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [quizStarted, setQuizStarted] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);
  const [source, setSource] = useState<'groq' | 'gemini' | 'none'>('none');

  const startQuiz = (count: number = questionCount) => {
    setQuizStarted(true);
    loadQuiz(count);
  };

  const loadQuiz = async (count: number = questionCount) => {
    setLoading(true);
    setError(null);
    setQuestions([]);
    setCurrent(0);
    setSelected(null);
    setAnswers([]);
    setFinished(false);

    try {
      const supabase = getSupabase();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setError('Sign in to use practice quizzes.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ topics, count }),
      });

      if (res.status === 401) {
        setError('Sign in to use practice quizzes.');
        return;
      }
      if (res.status === 429) {
        setError('Slow down — try again in a minute.');
        return;
      }

      const data = await res.json();

      if (!data.questions || data.questions.length === 0) {
        setError("Couldn't generate quiz right now. Try again in a moment.");
      } else {
        setQuestions(data.questions);
        setSource(data.source || 'none');
      }
    } catch {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setAnswers((prev) => [...prev, idx]);
  };

  const handleNext = () => {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      setSelected(null);
    } else {
      setFinished(true);
    }
  };

  const score = answers.reduce((acc, ans, i) => acc + (ans === questions[i]?.correctIndex ? 1 : 0), 0);

  const cardClass = darkMode
    ? 'bg-gradient-to-br from-[#0a0f1a] to-black border border-blue-500/30'
    : 'bg-white border border-gray-200';

  const optionClass = (idx: number) => {
    const base = 'w-full text-left p-3.5 rounded-xl border-2 font-medium text-sm transition-all';
    if (selected === null) {
      return `${base} ${darkMode ? 'bg-white/[0.06] border-white/[0.12] text-gray-100 hover:border-blue-400/60 hover:bg-white/[0.1]' : 'bg-gray-50 border-gray-200 text-gray-900 hover:border-blue-400 hover:bg-blue-50'}`;
    }
    const isCorrect = idx === questions[current].correctIndex;
    const isSelected = idx === selected;
    if (isCorrect) return `${base} bg-emerald-500/20 border-emerald-500/60 text-emerald-100`;
    if (isSelected && !isCorrect) return `${base} bg-red-500/20 border-red-500/60 text-red-100`;
    return `${base} ${darkMode ? 'bg-white/[0.03] border-white/[0.08] text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-400'}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[80] p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className={`rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden ${cardClass}`}
      >
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${darkMode ? 'border-white/[0.1]' : 'border-gray-100'}`}>
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-1.5 rounded-lg">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className={`font-bold text-sm ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Practice Quiz</h3>
              <p className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {!quizStarted ? 'Setup Quiz' : loading ? 'Generating...' : finished ? 'Complete!' : `Question ${current + 1} of ${questions.length}`}
                {source !== 'none' && !loading && quizStarted && (
                  <span className="ml-2 opacity-70">via {source === 'groq' ? 'Groq' : 'Gemini'}</span>
                )}
              </p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className={`p-2 rounded-lg transition ${darkMode ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <X className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Body */}
        <div className="p-5">
          {/* Step 1: Ask user how many questions to generate */}
          {!quizStarted && (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <h4 className={`text-base font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  How many questions would you like?
                </h4>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Select how many multiple-choice questions to generate for this session.
                </p>
              </div>

              {/* Quick Choice Buttons */}
              <div className="grid grid-cols-5 gap-2">
                {[3, 5, 10, 15, 20].map((num) => (
                  <button
                    key={num}
                    onClick={() => setQuestionCount(num)}
                    className={`py-2.5 rounded-xl font-bold text-sm border transition ${
                      questionCount === num
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-blue-400 shadow-md shadow-blue-500/25'
                        : darkMode
                        ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                        : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {num} Qs
                  </button>
                ))}
              </div>

              {/* Number Stepper Control */}
              <div className={`p-3 rounded-2xl border flex items-center justify-between ${
                darkMode ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-gray-50 border-gray-200'
              }`}>
                <span className={`text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Custom Question Count:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuestionCount((c) => Math.max(3, c - 1))}
                    className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center border ${
                      darkMode ? 'bg-white/5 border-white/10 text-gray-200 hover:bg-white/10' : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    -
                  </button>
                  <span className={`w-8 text-center font-bold text-sm ${darkMode ? 'text-blue-400' : 'text-indigo-600'}`}>
                    {questionCount}
                  </span>
                  <button
                    onClick={() => setQuestionCount((c) => Math.min(25, c + 1))}
                    className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center border ${
                      darkMode ? 'bg-white/5 border-white/10 text-gray-200 hover:bg-white/10' : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Selected Topics Preview */}
              <div className="space-y-1.5">
                <span className={`text-[11px] font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Covered Topics ({topics.length}):
                </span>
                <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                  {topics.map((t, i) => (
                    <div
                      key={i}
                      className={`text-xs px-2.5 py-1 rounded-lg truncate border ${
                        darkMode ? 'bg-white/5 border-white/5 text-gray-300' : 'bg-indigo-50/50 border-indigo-100 text-indigo-900'
                      }`}
                    >
                      • {t}
                    </div>
                  ))}
                </div>
              </div>

              {/* Start Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => startQuiz(questionCount)}
                className="w-full bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Start AI Quiz ({questionCount} Questions)
              </motion.button>
            </div>
          )}
          {loading && (
            <div className="text-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="w-10 h-10 mx-auto mb-4 border-4 border-blue-500/30 border-t-blue-500 rounded-full"
              />
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Generating questions...</p>
              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>This usually takes 2-5 seconds</p>
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-8">
              <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
              <p className={`text-sm mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{error}</p>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => loadQuiz()}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="w-4 h-4" /> Try Again
              </motion.button>
            </div>
          )}

          {!loading && !error && !finished && questions[current] && (
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <p className={`text-base font-semibold leading-snug mb-5 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  {questions[current].question}
                </p>
                <div className="space-y-2.5">
                  {questions[current].options.map((opt, i) => (
                    <motion.button
                      key={i}
                      whileHover={selected === null ? { scale: 1.01 } : {}}
                      whileTap={selected === null ? { scale: 0.99 } : {}}
                      onClick={() => handleSelect(i)}
                      disabled={selected !== null}
                      className={optionClass(i)}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          selected !== null && i === questions[current].correctIndex
                            ? 'bg-emerald-500 text-white'
                            : selected === i && i !== questions[current].correctIndex
                              ? 'bg-red-500 text-white'
                              : darkMode ? 'bg-white/10 text-gray-300' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="flex-1">{opt}</span>
                        {selected !== null && i === questions[current].correctIndex && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        )}
                        {selected === i && i !== questions[current].correctIndex && (
                          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>

                {selected !== null && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 overflow-hidden"
                  >
                    <div className={`p-3 rounded-xl text-xs leading-snug ${
                      selected === questions[current].correctIndex
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-100'
                        : 'bg-amber-500/15 border border-amber-500/30 text-amber-100'
                    }`}>
                      <strong className="block mb-1">
                        {selected === questions[current].correctIndex ? '✓ Correct!' : '✗ Not quite.'}
                      </strong>
                      {questions[current].explanation}
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleNext}
                      className="w-full mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-semibold"
                    >
                      {current < questions.length - 1 ? 'Next Question →' : 'See Results'}
                    </motion.button>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          )}

          {finished && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  score >= questions.length * 0.8 ? 'bg-gradient-to-br from-emerald-500 to-green-600'
                  : score >= questions.length * 0.5 ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                  : 'bg-gradient-to-br from-red-500 to-rose-600'
                }`}
              >
                <Award className="w-10 h-10 text-white" />
              </motion.div>
              <h3 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                {score}/{questions.length}
              </h3>
              <p className={`text-sm mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {score === questions.length ? '🎉 Perfect score!'
                  : score >= questions.length * 0.8 ? '🔥 Great work!'
                  : score >= questions.length * 0.5 ? '👍 Good effort — keep practicing'
                  : '📚 Review and try again'}
              </p>
              <div className="flex gap-2.5 flex-wrap">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => startQuiz(questionCount)}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry ({questionCount} Qs)
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setQuizStarted(false)}
                  className={`flex-1 py-3 rounded-xl font-semibold text-xs border transition ${
                    darkMode ? 'bg-white/10 border-white/15 text-gray-200 hover:bg-white/20' : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Change Settings
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onClose}
                  className={`px-4 py-3 rounded-xl font-semibold text-xs border transition ${
                    darkMode ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Done
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}