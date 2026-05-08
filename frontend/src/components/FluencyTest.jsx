import React, { useState, useEffect, useRef } from 'react';
import { Timer, Plus, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { validateAnimal } from '../utils/animalDictionary';

/**
 * FluencyTest — Categorical Verbal Fluency with Animal Validation
 *
 * Clinical use: Frontal lobe / semantic memory assessment.
 * Enhancements:
 *  - Animal name validation (exact, fuzzy/typo, invalid)
 *  - Per-word status badges (✓ valid, ⚠ typo accepted, ✗ not an animal)
 *  - Only valid + typo-corrected words counted toward score
 *  - Feedback message per submission
 */

const FluencyTest = ({ question, onAnswer }) => {
  const timeLimit      = question.timeLimit   || 60;
  const category       = question.category    || 'animals';
  const categoryLabel  = question.categoryLabel || 'Animals';

  const [words,    setWords]    = useState([]); // { text, status, suggestion }
  const [input,    setInput]    = useState('');
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [started,  setStarted]  = useState(false);
  const [finished, setFinished] = useState(false);
  const [feedback, setFeedback] = useState(null); // { text, type: 'success'|'warn'|'error' }

  const inputRef = useRef(null);
  const timerRef = useRef(null);

  // Countdown logic
  useEffect(() => {
    if (!started || finished) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          endTest();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [started, finished]);

  const endTest = () => {
    setFinished(true);
    clearInterval(timerRef.current);
    setWords(prev => {
      const validCount = prev.filter(w => w.status === 'valid' || w.status === 'typo').length;
      onAnswer(String(validCount));
      return prev;
    });
  };

  const startTest = () => {
    setStarted(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const showFeedback = (text, type) => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 2000);
  };

  const addWord = () => {
    const raw = input.trim().toLowerCase();
    if (!raw) return;

    // Duplicate check
    if (words.some(w => w.text === raw || w.suggestion === raw)) {
      showFeedback('Already listed!', 'error');
      setInput('');
      return;
    }

    const result = validateAnimal(raw);

    if (result.status === 'valid') {
      const entry = { text: raw, status: 'valid', suggestion: null };
      setWords(prev => {
        const next = [...prev, entry];
        onAnswer(String(next.filter(w => w.status === 'valid' || w.status === 'typo').length));
        return next;
      });
      showFeedback(`✓ "${raw}" — correct animal!`, 'success');

    } else if (result.status === 'typo') {
      const entry = { text: raw, status: 'typo', suggestion: result.suggestion };
      setWords(prev => {
        const next = [...prev, entry];
        onAnswer(String(next.filter(w => w.status === 'valid' || w.status === 'typo').length));
        return next;
      });
      showFeedback(`⚠ Accepted — did you mean "${result.suggestion}"?`, 'warn');

    } else {
      // Not an animal — add to list as invalid for display, don't count
      const entry = { text: raw, status: 'invalid', suggestion: null };
      setWords(prev => [...prev, entry]);
      showFeedback(`✗ "${raw}" is not an animal name.`, 'error');
    }

    setInput('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addWord();
    }
  };

  // Timer ring
  const pct      = timeLeft / timeLimit;
  const radius   = 44;
  const circum   = 2 * Math.PI * radius;
  const dashOff  = circum * (1 - pct);
  const timerColor = pct > 0.5 ? '#10b981' : pct > 0.25 ? '#f59e0b' : '#ef4444';

  const validCount = words.filter(w => w.status === 'valid' || w.status === 'typo').length;

  // Badge styles
  const badgeStyle = {
    valid:   { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)', color: '#34d399' },
    typo:    { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', color: '#fbbf24' },
    invalid: { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  color: '#f87171' },
  };
  const badgeIcon = { valid: <CheckCircle2 size={11} />, typo: <AlertTriangle size={11} />, invalid: <XCircle size={11} /> };

  return (
    <div className="flex flex-col items-center animate-fade-in w-full max-w-xl mx-auto">

      {/* Category label */}
      <div className="mb-6 text-center">
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sm-violet/10 border border-sm-violet/20 text-sm font-bold text-slate-300">
          <span className="text-slate-500 font-normal">Category:</span>
          {categoryLabel}
        </span>
      </div>

      {/* Timer ring */}
      <div className="relative flex items-center justify-center mb-6">
        <svg width="120" height="120" className="-rotate-90">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
          <circle cx="60" cy="60" r={radius} fill="none" stroke={timerColor}
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circum} strokeDashoffset={dashOff}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-3xl font-black tabular-nums" style={{ color: timerColor }}>
            {timeLeft}
          </span>
          <span className="text-[9px] text-slate-600 uppercase tracking-widest">seconds</span>
        </div>
      </div>

      {/* Valid count badge */}
      {started && (
        <div className="mb-4 text-center">
          <span className="text-xs text-slate-500 uppercase tracking-widest">Valid animals: </span>
          <span className="text-sm font-black text-emerald-400 tabular-nums">{validCount}</span>
        </div>
      )}

      {/* Start / Active / Done states */}
      {!started && (
        <button onClick={startTest}
          className="px-8 py-4 btn-violet text-white font-bold rounded-2xl text-base flex items-center gap-2 mb-6">
          <Timer size={18} /> Start Timer
        </button>
      )}

      {started && !finished && (
        <div className="w-full space-y-3 mb-4">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={`Type an animal name...`}
              className="flex-1 px-4 py-3.5 bg-sm-bg rounded-xl text-white text-base outline-none placeholder-slate-700 border border-sm-border focus:border-sm-violet transition-colors"
            />
            <button onClick={addWord}
              className="px-4 py-3 btn-violet text-white rounded-xl font-bold">
              <Plus size={20} />
            </button>
          </div>

          {/* Inline feedback */}
          {feedback && (
            <div className={`text-sm text-center px-4 py-2 rounded-xl font-medium transition-all animate-fade-in ${
              feedback.type === 'success' ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' :
              feedback.type === 'warn'    ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20' :
                                            'text-red-400 bg-red-500/10 border border-red-500/20'
            }`}>
              {feedback.text}
            </div>
          )}
        </div>
      )}

      {finished && (
        <div className="flex items-center gap-2 text-emerald-400 mb-4 text-sm font-semibold">
          <CheckCircle2 size={20} /> Time's up! {validCount} valid animals recorded.
        </div>
      )}

      {/* Word list with status badges */}
      {words.length > 0 && (
        <div className="w-full panel rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Your Answers</span>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-emerald-400 font-bold">{words.filter(w => w.status === 'valid').length} valid</span>
              <span className="text-amber-400 font-bold">{words.filter(w => w.status === 'typo').length} typos</span>
              <span className="text-red-400 font-bold">{words.filter(w => w.status === 'invalid').length} invalid</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {words.map((w, i) => {
              const s = badgeStyle[w.status];
              return (
                <span key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
                  {badgeIcon[w.status]}
                  {w.text}
                  {w.status === 'typo' && w.suggestion && (
                    <span className="text-slate-500 font-normal">≈ {w.suggestion}</span>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FluencyTest;
