import React from 'react';
import { motion } from 'framer-motion';

/**
 * AnimatedButton — Reusable glowing button
 *
 * Variants: 'primary' (cyan), 'secondary' (ghost), 'purple' (gradient)
 * Props: children, variant, size, disabled, loading, onClick, className, type
 */
const VARIANTS = {
  primary: {
    base: 'bg-jb-cyan hover:bg-jb-cyan-light text-white',
    glow: '0 0 20px rgba(14,165,233,0.45)',
    glowHover: '0 0 32px rgba(14,165,233,0.65), 0 0 64px rgba(14,165,233,0.2)',
  },
  purple: {
    base: 'bg-gradient-to-r from-jb-cyan to-jb-purple text-white',
    glow: '0 0 20px rgba(168,85,247,0.35)',
    glowHover: '0 0 32px rgba(168,85,247,0.6), 0 0 64px rgba(168,85,247,0.2)',
  },
  secondary: {
    base: 'bg-transparent border border-jb-border hover:border-jb-cyan/50 text-slate-300 hover:text-white',
    glow: 'none',
    glowHover: '0 0 16px rgba(14,165,233,0.15)',
  },
  danger: {
    base: 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20',
    glow: 'none',
    glowHover: '0 0 16px rgba(239,68,68,0.2)',
  },
};

const SIZES = {
  sm:  'px-4 py-2 text-xs rounded-xl',
  md:  'px-5 py-3 text-sm rounded-xl',
  lg:  'px-7 py-4 text-sm rounded-2xl',
  xl:  'px-8 py-4 text-base rounded-2xl',
};

const AnimatedButton = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  type = 'button',
  fullWidth = false,
}) => {
  const v = VARIANTS[variant] ?? VARIANTS.primary;

  return (
    <motion.button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      whileHover={!disabled && !loading ? {
        scale: 1.03,
        boxShadow: v.glowHover,
      } : {}}
      whileTap={!disabled && !loading ? { scale: 0.97 } : {}}
      initial={{ boxShadow: v.glow }}
      className={`
        relative inline-flex items-center justify-center gap-2 font-semibold
        transition-colors duration-200 overflow-hidden
        disabled:opacity-50 disabled:cursor-not-allowed
        ${SIZES[size]} ${v.base}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {/* Shimmer sweep */}
      <span className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none">
        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </span>

      {loading ? (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        children
      )}
    </motion.button>
  );
};

export default AnimatedButton;
