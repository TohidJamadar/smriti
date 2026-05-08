/**
 * useScrollAnimation.js — Shared Framer Motion variants
 * ──────────────────────────────────────────────────────
 * Centralized animation config used across all pages.
 * Import what you need: fadeUp, staggerContainer, staggerItem, etc.
 */

// ── Viewport config ────────────────────────────────────────────────────────
export const VIEWPORT_CONFIG = { once: true, margin: '-80px' };

// ── Fade up (slide + opacity) ──────────────────────────────────────────────
export const fadeUp = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22,1,0.36,1] } },
};

// ── Fade in only ───────────────────────────────────────────────────────────
export const fadeIn = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
};

// ── Slide from left ────────────────────────────────────────────────────────
export const slideLeft = {
  hidden:  { opacity: 0, x: -36 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.22,1,0.36,1] } },
};

// ── Slide from right ───────────────────────────────────────────────────────
export const slideRight = {
  hidden:  { opacity: 0, x: 36 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.22,1,0.36,1] } },
};

// ── Stagger container ──────────────────────────────────────────────────────
export const staggerContainer = (delay = 0.1) => ({
  hidden:  {},
  visible: { transition: { staggerChildren: delay, delayChildren: 0.05 } },
});

// ── Stagger child item ─────────────────────────────────────────────────────
export const staggerItem = {
  hidden:  { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22,1,0.36,1] } },
};

// ── Scale in (cards / modals) ──────────────────────────────────────────────
export const scaleIn = {
  hidden:  { opacity: 0, scale: 0.93 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22,1,0.36,1] } },
};

// ── Continuous float animation ─────────────────────────────────────────────
export const floatAnimation = {
  y: [0, -9, 0],
  transition: { duration: 4.5, repeat: Infinity, ease: 'easeInOut' },
};

// ── Pulse glow (accents) ───────────────────────────────────────────────────
export const pulseGlow = {
  opacity: [0.55, 1, 0.55],
  scale:   [1, 1.05, 1],
  transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
};
