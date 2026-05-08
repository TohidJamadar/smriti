import React, { useEffect, useRef } from 'react';

/**
 * ScoreRing — Animated SVG circular progress ring
 * Gaming-inspired score display with glow effect
 *
 * Props: score (0–100), size, strokeWidth, color, label, animated
 */
const ScoreRing = ({
  score = 0,
  size = 120,
  strokeWidth = 8,
  color = '#0ea5e9',
  label = 'Score',
  animated = true,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const cx = size / 2;

  // Color based on score
  const dynamicColor =
    score >= 80 ? '#10b981' :
    score >= 55 ? '#0ea5e9' :
    score >= 30 ? '#f59e0b' : '#ef4444';

  const finalColor = color === '#0ea5e9' ? dynamicColor : color;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <filter id="ringGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* Track */}
        <circle cx={cx} cy={cx} r={radius}
          fill="none" stroke="rgba(255,255,255,0.07)"
          strokeWidth={strokeWidth}
        />
        {/* Filled arc */}
        <circle cx={cx} cy={cx} r={radius}
          fill="none" stroke={finalColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          filter="url(#ringGlow)"
          style={{
            transition: animated ? 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)' : 'none',
          }}
        />
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-black tabular-nums leading-none" style={{
          fontSize: size * 0.22,
          color: finalColor,
          textShadow: `0 0 16px ${finalColor}80`,
        }}>
          {score}%
        </span>
        {label && (
          <span className="text-slate-500 uppercase tracking-widest mt-1" style={{ fontSize: size * 0.09 }}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
};

export default ScoreRing;
