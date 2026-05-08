import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

/**
 * MeshBackground — Animated ambient background
 * New design: Deep space purple-black with 3 animated gradient orbs
 * + dot grid overlay + subtle scan line
 */
const MeshBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">

      {/* ── Base: dot grid ────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-dot-grid opacity-80" />

      {/* ── Orb 1: top-left violet (primary) ──────────────────────── */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: '65vw', height: '65vw',
          top: '-20%', left: '-15%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, rgba(109,40,217,0.08) 40%, transparent 70%)',
          filter: 'blur(2px)',
        }}
        animate={{ scale: [1, 1.06, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ── Orb 2: top-right lime (gaming accent) ─────────────────── */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: '45vw', height: '45vw',
          top: '-10%', right: '-12%',
          background: 'radial-gradient(circle, rgba(163,230,53,0.09) 0%, rgba(132,204,22,0.04) 45%, transparent 70%)',
        }}
        animate={{ scale: [1.05, 1, 1.05], x: [0, 12, 0], y: [0, -8, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ── Orb 3: bottom-center cyan (highlight) ─────────────────── */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: '50vw', height: '50vw',
          bottom: '-20%', left: '25%',
          background: 'radial-gradient(circle, rgba(34,211,238,0.08) 0%, rgba(8,145,178,0.03) 50%, transparent 70%)',
        }}
        animate={{ scale: [1, 1.08, 1], y: [0, 10, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      {/* ── Vignette: darkens edges for depth ─────────────────────── */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(7,6,15,0.7) 100%)',
      }} />

      {/* ── Top horizontal glow line ───────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.5) 40%, rgba(163,230,53,0.3) 60%, transparent)' }}
      />
    </div>
  );
};

export default MeshBackground;
