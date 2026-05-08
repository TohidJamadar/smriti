import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugin once
gsap.registerPlugin(ScrollTrigger);

/**
 * ParallaxBackground — GSAP multi-layer parallax system
 *
 * Three depth layers move at different scroll speeds:
 *   Layer 0 (far)   → speed 0.08 — large ambient orbs, barely move
 *   Layer 1 (mid)   → speed 0.25 — medium orbs + grid
 *   Layer 2 (near)  → speed 0.45 — bright accent orbs, most movement
 *
 * This creates a convincing depth illusion while keeping the background
 * subtle enough not to distract from content.
 */
const ParallaxBackground = () => {
  const farRef  = useRef(null);
  const midRef  = useRef(null);
  const nearRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // ── Far layer — barely moves (0.08x) ──────────────────────────────
      gsap.to(farRef.current, {
        yPercent: -8,
        ease: 'none',
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.5, // smooth lag
        },
      });

      // ── Mid layer — moderate movement (0.25x) ─────────────────────────
      gsap.to(midRef.current, {
        yPercent: -25,
        ease: 'none',
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
        },
      });

      // ── Near layer — most movement (0.45x) ────────────────────────────
      gsap.to(nearRef.current, {
        yPercent: -45,
        ease: 'none',
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.6,
        },
      });
    });

    return () => ctx.revert(); // clean up all GSAP animations on unmount
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">

      {/* ── Tech grid overlay (static) ───────────────────────────────── */}
      <div className="absolute inset-0 bg-tech-grid opacity-60" />

      {/* ── Far Layer: large ambient orbs ───────────────────────────── */}
      <div ref={farRef} className="absolute inset-0">
        {/* Top-left deep blue sphere */}
        <div className="absolute" style={{
          top: '-15%', left: '-10%',
          width: '70vw', height: '70vw',
          background: 'radial-gradient(circle, rgba(14,165,233,0.06) 0%, transparent 65%)',
          borderRadius: '50%',
        }} />
        {/* Bottom-right purple sphere */}
        <div className="absolute" style={{
          bottom: '-20%', right: '-15%',
          width: '65vw', height: '65vw',
          background: 'radial-gradient(circle, rgba(168,85,247,0.05) 0%, transparent 65%)',
          borderRadius: '50%',
        }} />
      </div>

      {/* ── Mid Layer: medium orbs + teal accent ────────────────────── */}
      <div ref={midRef} className="absolute inset-0">
        {/* Center-top cyan haze */}
        <div className="absolute" style={{
          top: '5%', left: '30%',
          width: '40vw', height: '40vw',
          background: 'radial-gradient(circle, rgba(14,165,233,0.05) 0%, transparent 60%)',
          borderRadius: '50%',
        }} />
        {/* Bottom-left green tint */}
        <div className="absolute" style={{
          bottom: '10%', left: '5%',
          width: '30vw', height: '30vw',
          background: 'radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 60%)',
          borderRadius: '50%',
        }} />
      </div>

      {/* ── Near Layer: bright accent orbs (most visible) ───────────── */}
      <div ref={nearRef} className="absolute inset-0">
        {/* Top-right bright cyan accent */}
        <div className="absolute" style={{
          top: '15%', right: '10%',
          width: '20vw', height: '20vw',
          background: 'radial-gradient(circle, rgba(14,165,233,0.10) 0%, transparent 60%)',
          borderRadius: '50%',
        }} />
        {/* Mid-left purple accent */}
        <div className="absolute" style={{
          top: '45%', left: '3%',
          width: '18vw', height: '18vw',
          background: 'radial-gradient(circle, rgba(168,85,247,0.09) 0%, transparent 60%)',
          borderRadius: '50%',
        }} />
        {/* Bottom-right emerald dot */}
        <div className="absolute" style={{
          bottom: '20%', right: '5%',
          width: '12vw', height: '12vw',
          background: 'radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 60%)',
          borderRadius: '50%',
        }} />
      </div>

      {/* ── Subtle vignette (depth frame) ──────────────────────────── */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at center, transparent 50%, rgba(5,5,10,0.6) 100%)',
      }} />
    </div>
  );
};

export default ParallaxBackground;
