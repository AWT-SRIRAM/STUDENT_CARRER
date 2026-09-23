'use client';

import React, { useEffect, useRef, useState } from 'react';

interface FluidCursorProps {
  darkMode?: boolean;
}

export default function FluidCursor({ darkMode = true }: FluidCursorProps) {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const [isPointerDevice, setIsPointerDevice] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  useEffect(() => {
    // Only enable custom fluid cursor on devices with fine pointer (mouse/trackpad)
    const mediaQuery = window.matchMedia('(pointer: fine)');
    setIsPointerDevice(mediaQuery.matches);

    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsPointerDevice(e.matches);
    };
    mediaQuery.addEventListener('change', handleMediaChange);

    if (!mediaQuery.matches) {
      return () => mediaQuery.removeEventListener('change', handleMediaChange);
    }

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let isVisible = false;

    // Track mouse position & update CSS custom variables on root for card spotlights
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        if (dotRef.current) dotRef.current.style.opacity = '1';
        if (ringRef.current) ringRef.current.style.opacity = '1';
      }

      // Update global CSS variables for reactive spotlight illumination across cards
      document.documentElement.style.setProperty('--mouse-x', `${mouseX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${mouseY}px`);

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      }
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    const handleMouseLeave = () => {
      isVisible = false;
      if (dotRef.current) dotRef.current.style.opacity = '0';
      if (ringRef.current) ringRef.current.style.opacity = '0';
    };

    // Detect clickable element hovers for magnetic expansion
    const handleElementHover = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const interactive = target.closest('button, a, input, [role="button"], .cursor-pointer, .hover-trigger');
      setIsHovered(!!interactive);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousemove', handleElementHover, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);

    // Spring/lerp animation loop for trailing ring
    let animationFrameId: number;
    const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

    const animate = () => {
      // Smooth inertia trailing
      ringX = lerp(ringX, mouseX, 0.18);
      ringY = lerp(ringY, mouseY, 0.18);

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousemove', handleElementHover);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  if (!isPointerDevice) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {/* Dynamic ambient cursor spotlight gradient */}
      <div
        className="fixed top-0 left-0 w-full h-full pointer-events-none transition-opacity duration-300"
        style={{
          background: darkMode
            ? `radial-gradient(450px circle at var(--mouse-x, -500px) var(--mouse-y, -500px), rgba(59, 130, 246, 0.08), rgba(99, 102, 241, 0.03), transparent 75%)`
            : `radial-gradient(400px circle at var(--mouse-x, -500px) var(--mouse-y, -500px), rgba(99, 102, 241, 0.06), rgba(249, 115, 22, 0.02), transparent 75%)`,
        }}
      />

      {/* Trailing fluid magnetic ring */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 -ml-5 -mt-5 rounded-full pointer-events-none opacity-0 will-change-transform transition-opacity duration-300"
        style={{
          width: isHovered ? '46px' : isClicking ? '26px' : '36px',
          height: isHovered ? '46px' : isClicking ? '26px' : '36px',
          border: isHovered
            ? darkMode
              ? '1.5px solid rgba(56, 189, 248, 0.8)'
              : '1.5px solid rgba(79, 70, 229, 0.7)'
            : darkMode
            ? '1.5px solid rgba(147, 197, 253, 0.4)'
            : '1.5px solid rgba(99, 102, 241, 0.4)',
          background: isHovered
            ? darkMode
              ? 'rgba(56, 189, 248, 0.12)'
              : 'rgba(79, 70, 229, 0.08)'
            : 'transparent',
          boxShadow: isHovered
            ? darkMode
              ? '0 0 20px 4px rgba(56, 189, 248, 0.35)'
              : '0 0 16px 3px rgba(99, 102, 241, 0.25)'
            : 'none',
          transition: 'width 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), height 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s ease, border 0.2s ease, box-shadow 0.2s ease',
        }}
      />

      {/* Precise lead dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 -ml-1 -mt-1 w-2 h-2 rounded-full pointer-events-none opacity-0 will-change-transform transition-opacity duration-300"
        style={{
          background: darkMode
            ? isHovered ? '#38bdf8' : '#60a5fa'
            : isHovered ? '#4f46e5' : '#6366f1',
          boxShadow: darkMode
            ? '0 0 8px 2px rgba(96, 165, 250, 0.8)'
            : '0 0 6px 1px rgba(99, 102, 241, 0.6)',
          transform: isClicking ? 'scale(0.6)' : isHovered ? 'scale(1.4)' : 'scale(1)',
          transition: 'transform 0.15s ease',
        }}
      />
    </div>
  );
}
