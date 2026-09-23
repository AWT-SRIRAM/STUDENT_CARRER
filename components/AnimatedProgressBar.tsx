"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedProgressBarProps {
  value: number; // 0 to 100
  height?: string; // e.g. 'h-3' | 'h-2.5' | 'h-4'
  colorVariant?: 'blue-indigo' | 'cyan-blue' | 'emerald-teal' | 'orange-amber' | 'purple-pink' | 'violet-purple' | 'auto';
  showTipGlow?: boolean;
  showStripes?: boolean;
  showShimmer?: boolean;
  darkMode?: boolean;
  delay?: number;
  className?: string;
}

export default function AnimatedProgressBar({
  value,
  height = 'h-3',
  colorVariant = 'auto',
  showTipGlow = true,
  showStripes = true,
  showShimmer = true,
  darkMode = true,
  delay = 0,
  className = '',
}: AnimatedProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  // Determine gradient based on variant or automatic scale
  const getGradient = () => {
    if (colorVariant === 'auto') {
      if (clampedValue >= 80) return 'from-emerald-400 via-teal-400 to-cyan-500 shadow-emerald-500/40 text-emerald-400';
      if (clampedValue >= 50) return 'from-blue-500 via-indigo-500 to-cyan-400 shadow-blue-500/40 text-cyan-400';
      if (clampedValue >= 25) return 'from-amber-400 via-orange-500 to-red-500 shadow-orange-500/40 text-amber-400';
      return 'from-indigo-500 via-purple-500 to-pink-500 shadow-indigo-500/40 text-indigo-400';
    }

    switch (colorVariant) {
      case 'cyan-blue':
        return 'from-cyan-400 via-blue-500 to-indigo-600 shadow-cyan-500/40 text-cyan-300';
      case 'emerald-teal':
        return 'from-emerald-400 via-teal-500 to-green-500 shadow-emerald-500/40 text-emerald-300';
      case 'orange-amber':
        return 'from-amber-400 via-orange-500 to-red-500 shadow-orange-500/40 text-amber-300';
      case 'purple-pink':
        return 'from-purple-500 via-pink-500 to-rose-500 shadow-pink-500/40 text-pink-300';
      case 'violet-purple':
        return 'from-indigo-500 via-violet-500 to-purple-600 shadow-purple-500/40 text-violet-300';
      case 'blue-indigo':
      default:
        return 'from-blue-500 via-indigo-500 to-cyan-400 shadow-blue-500/40 text-blue-300';
    }
  };

  const gradientClass = getGradient();

  return (
    <div
      className={`w-full ${height} rounded-full overflow-hidden relative ${
        darkMode
          ? 'bg-white/[0.08] shadow-inner shadow-black/60 border border-white/[0.06]'
          : 'bg-indigo-50/80 shadow-inner shadow-indigo-200/50 border border-indigo-100/60'
      } ${className}`}
    >
      {/* Dynamic Animated Fill Bar */}
      <motion.div
        className={`h-full rounded-full bg-gradient-to-r ${gradientClass} relative overflow-hidden shadow-lg`}
        initial={{ width: 0 }}
        animate={{ width: `${clampedValue}%` }}
        transition={{
          type: 'spring',
          stiffness: 70,
          damping: 18,
          mass: 0.8,
          delay: delay,
        }}
      >
        {/* Animated fluid diagonal stripes */}
        {showStripes && <div className="absolute inset-0 progress-stripes opacity-40 pointer-events-none" />}

        {/* Shimmer light sweep beam */}
        {showShimmer && <div className="absolute inset-0 animate-shimmer pointer-events-none" />}

        {/* Top glossy 3D glass highlight */}
        <div className="absolute top-0 left-0 right-0 h-[35%] bg-gradient-to-b from-white/30 to-transparent rounded-t-full pointer-events-none" />

        {/* Leading edge radiant spark flare */}
        {showTipGlow && clampedValue > 2 && (
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-full rounded-full bg-white animate-tip-glow pointer-events-none"
            style={{
              filter: 'blur(1px)',
            }}
          />
        )}
      </motion.div>
    </div>
  );
}
