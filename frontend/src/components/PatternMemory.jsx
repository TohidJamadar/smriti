import React, { useState, useEffect, useRef } from 'react';
import { Brain, Eye, CheckCircle2 } from 'lucide-react';

/**
 * PatternMemory — Visual Grid Pattern Memory
 *
 * Enhancements:
 *  - Progressive display time via question.displayTime (default 2500ms)
 *  - Animated SVG countdown ring during memorize phase
 *  - Difficulty label based on pattern size
 *  - Fade-out animation when pattern hides
 */

const PatternMemory = ({ question, onAnswer }) => {
  const displayTime = question.displayTime || 2500; // ms to show the pattern
  const targetPattern = question.targetPattern || [];

  const [phase, setPhase]       = useState('memorize'); // 'memorize' | 'recall'
  const [selected, setSelected] = useState([]);
  const [timeLeft, setTimeLeft] = useState(Math.ceil(displayTime / 1000));
  const [submitted, setSubmitted] = useState(false);

  // Countdown interval during memorize
  useEffect(() => {
    if (phase !== 'memorize') return;

    // Tick down every second
    const ticker = setInterval(() => {
      setTimeLeft(t => Math.max(0, t - 1));
    }, 1000);

    // Hide pattern when displayTime elapses
    const hideTimer = setTimeout(() => {
      clearInterval(ticker);
      setPhase('recall');
    }, displayTime);

    return () => {
      clearInterval(ticker);
      clearTimeout(hideTimer);
    };
  }, [phase, displayTime]);

  const toggleTile = (index) => {
    if (phase !== 'recall' || submitted) return;

    const newSelection = selected.includes(index)
      ? selected.filter(i => i !== index)
      : [...selected, index];

    setSelected(newSelection);
    onAnswer(newSelection.sort().join(','));
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  // Difficulty label
  const difficulty =
    targetPattern.length <= 3 ? { label: 'Easy',   color: '#10b981' } :
    targetPattern.length <= 5 ? { label: 'Medium', color: '#f59e0b' } :
                                 { label: 'Hard',   color: '#ef4444' };

  // SVG countdown ring
  const radius   = 28;
  const circum   = 2 * Math.PI * radius;
  const totalSec = Math.ceil(displayTime / 1000);
  const pct      = timeLeft / totalSec;
  const dashOff  = circum * (1 - pct);
  const ringColor = pct > 0.5 ? '#22d3ee' : pct > 0.25 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center animate-fade-in w-full">

      {/* Difficulty + Phase badge row */}
      <div className="flex items-center gap-3 mb-6">
        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border"
          style={{ color: difficulty.color, borderColor: difficulty.color + '55', background: difficulty.color + '15' }}>
          {difficulty.label}
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-white/10 text-slate-400">
          {targetPattern.length} tiles
        </span>
      </div>

      {/* Phase label + countdown ring */}
      <div className="mb-6 flex items-center gap-4 h-16">
        {phase === 'memorize' ? (
          <>
            <div className="relative flex items-center justify-center">
              <svg width={70} height={70} className="-rotate-90">
                <circle cx={35} cy={35} r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={6} />
                <circle cx={35} cy={35} r={radius} fill="none" stroke={ringColor}
                  strokeWidth={6} strokeLinecap="round"
                  strokeDasharray={circum} strokeDashoffset={dashOff}
                  style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
                />
              </svg>
              <span className="absolute text-base font-black tabular-nums" style={{ color: ringColor }}>
                {timeLeft}s
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Eye size={16} className="text-cyan-400 animate-pulse" />
              <span className="text-cyan-400 font-bold tracking-widest uppercase text-sm animate-pulse">
                Memorize Pattern
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Brain size={16} className="text-violet-400" />
            <span className="text-violet-400 font-bold tracking-widest uppercase text-sm">
              Recall Pattern
            </span>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-3 p-5 rounded-2xl border"
        style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => {
          const isTarget   = phase === 'memorize' && targetPattern.includes(index);
          const isSelected = selected.includes(index);

          return (
            <button
              key={index}
              onClick={() => toggleTile(index)}
              disabled={phase === 'memorize' || submitted}
              className="w-24 h-24 rounded-xl cursor-pointer transition-all duration-300 focus:outline-none"
              style={{
                background: isTarget
                  ? 'linear-gradient(135deg, #22d3ee, #0ea5e9)'
                  : isSelected && phase === 'recall'
                    ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                    : 'rgba(255,255,255,0.05)',
                border: isTarget
                  ? '2px solid rgba(34,211,238,0.6)'
                  : isSelected && phase === 'recall'
                    ? '2px solid rgba(139,92,246,0.6)'
                    : '2px solid rgba(255,255,255,0.08)',
                boxShadow: isTarget
                  ? '0 0 20px rgba(34,211,238,0.5)'
                  : isSelected && phase === 'recall'
                    ? '0 0 20px rgba(139,92,246,0.4)'
                    : 'none',
                transform: isTarget || isSelected ? 'scale(1.04)' : 'scale(1)',
              }}
            />
          );
        })}
      </div>

      {/* Recall submit button */}
      {phase === 'recall' && !submitted && (
        <button
          onClick={handleSubmit}
          className="mt-6 px-8 py-3 btn-violet text-white font-bold rounded-xl flex items-center gap-2 text-sm"
        >
          <CheckCircle2 size={16} /> Confirm Selection
        </button>
      )}

      {submitted && (
        <div className="mt-6 flex items-center gap-2 text-emerald-400 text-sm font-semibold">
          <CheckCircle2 size={18} /> Pattern submitted!
        </div>
      )}
    </div>
  );
};

export default PatternMemory;