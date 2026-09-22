"use client";

import { useEffect } from 'react';
import { useMotionValue, useSpring, useTransform, motion } from 'framer-motion';

export default function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const motionVal = useMotionValue(value);
  const spring = useSpring(motionVal, { stiffness: 120, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v));
  useEffect(() => { motionVal.set(value); }, [value, motionVal]);
  return <motion.span className={className}>{display}</motion.span>;
}