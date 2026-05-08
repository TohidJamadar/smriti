import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Zap, CheckCircle2, Timer } from 'lucide-react';

/**
 * ReactionTap — Reaction Speed & Selective Attention Component
 *
 * Clinical use: Measures psychomotor speed and selective attention.
 * Protocol: A colored circle appears after a random delay. User must tap only
 *           the TARGET color. Distractors appear occasionally.
 * Scoring:  Score based on average reaction time across rounds:
 *           ≤400ms → full points, ≤700ms → 75%, ≤1100ms → 50%, else → 25%
 * Type: REACTION_TAP
 */

const READY_DELAY_MIN = 1000;
const READY_DELAY_MAX = 3000;

const ReactionTap = ({ question, onAnswer }) => {
  const targetColor       = question.targetColor       || '#22d3ee';
  const distractorColors  = question.distractorColors  || ['#ef4444', '#a3e635'];
  const totalRounds       = question.rounds            || 3;
  const maxPoints         = question.points            || 4;

  const [phase, setPhase]         = useState('intro');    // intro|ready|active|feedback|done
  const [round, setRound]         = useState(0);
  const [currentColor, setCurrentColor] = useState(null);
  const [isTarget, setIsTarget]   = useState(false);
  const [reactionTimes, setReactionTimes] = useState([]);
  const [hits, setHits]           = useState(0);
  const [misses, setMisses]       = useState(0);
  const [lastFeedback, setLastFeedback] = useState(null); // 'hit'|'miss'|'false_tap'
  const [finalScore, setFinalScore] = useState(null);

  const appearTimeRef = useRef(null);
  const delayTimerRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => () => clearTimeout(delayTimerRef.current), []);

  const startRound = useCallback(() => {
    if (round >= totalRounds) return;
    setPhase('ready');
    setLastFeedback(null);

    // Random delay before target/distractor appears
    const delay = READY_DELAY_MIN + Math.random() * (READY_DELAY_MAX - READY_DELAY_MIN);
    delayTimerRef.current = setTimeout(() => {
      // 70% chance of target, 30% chance of distractor
      const showTarget = Math.random() < 0.7;
      const color = showTarget
        ? targetColor
        : distractorColors[Math.floor(Math.random() * distractorColors.length)];
      setCurrentColor(color);
      setIsTarget(showTarget);
      setPhase('active');
      appearTimeRef.current = Date.now();

      // Auto-miss after 2 seconds
      delayTimerRef.current = setTimeout(() => {
        if (showTarget) {
          // Missed the target
          setMisses(m => m + 1);
          setLastFeedback('miss');
        }
        setPhase('feedback');
        setCurrentColor(null);

        setTimeout(() => {
          const nextRound = round + 1;
          setRound(nextRound);
          if (nextRound >= totalRounds) {
            finishGame(reactionTimes, hits + (showTarget ? 0 : 0), misses + (showTarget ? 1 : 0));
          } else {
            startRound();
          }
        }, 800);
      }, 2000);
    }, delay);
  }, [round, totalRounds, targetColor, distractorColors, reactionTimes, hits, misses]);

  const handleTap = () => {
    if (phase !== 'active') {
      // Tapped during ready phase — false start
      if (phase === 'ready') {
        clearTimeout(delayTimerRef.current);
        setLastFeedback('false_tap');
        setPhase('feedback');
        setTimeout(() => {
          const nextRound = round + 1;
          setRound(nextRound);
          if (nextRound >= totalRounds) finishGame(reactionTimes, hits, misses + 1);
          else startRound();
        }, 800);
      }
      return;
    }

    clearTimeout(delayTimerRef.current);
    const rt = Date.now() - appearTimeRef.current;
    setCurrentColor(null);
    setPhase('feedback');

    if (isTarget) {
      setReactionTimes(prev => {
        const updated = [...prev, rt];
        setHits(h => h + 1);
        setLastFeedback('hit');
        return updated;
      });
    } else {
      // Tapped a distractor
      setMisses(m => m + 1);
      setLastFeedback('distractor');
    }

    setTimeout(() => {
      const nextRound = round + 1;
      setRound(nextRound);
      if (nextRound >= totalRounds) {
        finishGame(
          isTarget ? [...reactionTimes, rt] : reactionTimes,
          isTarget ? hits + 1 : hits,
          isTarget ? misses : misses + 1
        );
      } else {
        startRound();
      }
    }, 800);
  };

  const finishGame = (times, finalHits, finalMisses) => {
    setPhase('done');
    const avgRt = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 9999;
    // Score: weighted by accuracy AND speed
    const accuracy = totalRounds > 0 ? finalHits / totalRounds : 0;
    let speedFactor = avgRt <= 400 ? 1 : avgRt <= 700 ? 0.75 : avgRt <= 1100 ? 0.5 : 0.25;
    if (times.length === 0) speedFactor = 0;
    const raw = Math.round(accuracy * speedFactor * maxPoints);
    const score = Math.max(0, Math.min(maxPoints, raw));
    setFinalScore({ score, avgRt: Math.round(avgRt), hits: finalHits, misses: finalMisses });
    onAnswer({ type: 'REACTION_TAP', score, avgRt: Math.round(avgRt) });
  };

  // ─── Color label helper ───────────────────────────────────────────────────
  const colorName = (hex) => {
    const map = {
      '#22d3ee': 'CYAN', '#3b82f6': 'BLUE', '#10b981': 'GREEN',
      '#ef4444': 'RED', '#a3e635': 'LIME', '#f59e0b': 'AMBER',
      '#8b5cf6': 'PURPLE', '#fb7185': 'PINK', '#f97316': 'ORANGE',
    };
    return map[hex] || hex;
  };

  // ─── Feedback messages ────────────────────────────────────────────────────
  const feedbackConfig = {
    hit:         { text: '⚡ Great!',          color: '#10b981' },
    miss:        { text: '⏱ Too slow!',        color: '#f59e0b' },
    distractor:  { text: '✗ Wrong color!',     color: '#ef4444' },
    false_tap:   { text: '⚠ Too early!',       color: '#fb7185' },
  };

  return (
    <div className="flex flex-col items-center animate-fade-in w-full max-w-lg mx-auto select-none">

      {/* Target label */}
      <div className="mb-6 flex items-center gap-3 px-5 py-2.5 rounded-full border"
        style={{ borderColor: targetColor + '55', background: targetColor + '15' }}>
        <Zap size={16} style={{ color: targetColor }} />
        <span className="text-sm font-bold text-slate-200">
          Tap only <span style={{ color: targetColor }}>■ {colorName(targetColor)}</span>
        </span>
      </div>

      {/* Progress pills */}
      <div className="flex gap-2 mb-8">
        {Array.from({ length: totalRounds }).map((_, i) => (
          <div key={i} className="w-8 h-2 rounded-full transition-all duration-300"
            style={{
              background: i < round ? targetColor : 'rgba(255,255,255,0.1)',
              boxShadow: i < round ? `0 0 8px ${targetColor}` : 'none',
            }}
          />
        ))}
      </div>

      {/* ── INTRO ─────────────────────────────────────────────────── */}
      {phase === 'intro' && (
        <div className="text-center space-y-6">
          <p className="text-slate-300 text-base leading-relaxed max-w-sm">
            A colored circle will flash on screen.<br />
            <strong className="text-white">Tap it only</strong> if it matches the target color above.<br />
            Ignore all other colors!
          </p>
          <button
            onClick={() => { setRound(0); startRound(); }}
            className="px-10 py-4 btn-violet text-white font-bold rounded-2xl text-lg flex items-center gap-2 mx-auto"
          >
            <Timer size={20} /> Start
          </button>
        </div>
      )}

      {/* ── READY ─────────────────────────────────────────────────── */}
      {phase === 'ready' && (
        <div className="flex flex-col items-center gap-6">
          <div className="w-40 h-40 rounded-full border-4 border-dashed border-slate-700 flex items-center justify-center animate-pulse">
            <span className="text-slate-500 text-sm font-bold tracking-widest">WAIT...</span>
          </div>
          <p className="text-slate-500 text-xs uppercase tracking-widest">Get ready...</p>
        </div>
      )}

      {/* ── ACTIVE — tap target ────────────────────────────────────── */}
      {phase === 'active' && (
        <button
          onClick={handleTap}
          className="w-44 h-44 rounded-full cursor-pointer transition-transform active:scale-95 hover:scale-105 focus:outline-none"
          style={{
            background: currentColor,
            boxShadow: `0 0 60px ${currentColor}99, 0 0 20px ${currentColor}55`,
            animation: 'bounceIn 0.2s ease-out',
          }}
          aria-label="Tap the target"
        />
      )}

      {/* ── FEEDBACK ──────────────────────────────────────────────── */}
      {phase === 'feedback' && lastFeedback && (
        <div className="flex flex-col items-center gap-4">
          <div className="w-44 h-44 rounded-full border-4 border-dashed flex items-center justify-center"
            style={{ borderColor: feedbackConfig[lastFeedback].color }}>
            <span className="text-xl font-black" style={{ color: feedbackConfig[lastFeedback].color }}>
              {feedbackConfig[lastFeedback].text}
            </span>
          </div>
        </div>
      )}

      {/* ── DONE ──────────────────────────────────────────────────── */}
      {phase === 'done' && finalScore && (
        <div className="w-full panel rounded-2xl p-8 text-center space-y-5">
          <CheckCircle2 size={40} className="mx-auto" style={{ color: targetColor }} />
          <div>
            <div className="text-5xl font-black" style={{ color: targetColor }}>
              {finalScore.score} <span className="text-2xl text-slate-500">/ {maxPoints}</span>
            </div>
            <div className="text-slate-400 text-sm mt-1">Reaction Score</div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div>
              <div className="text-xl font-black text-white">{finalScore.avgRt}ms</div>
              <div className="text-slate-500 text-xs">Avg Speed</div>
            </div>
            <div>
              <div className="text-xl font-black text-green-400">{finalScore.hits}</div>
              <div className="text-slate-500 text-xs">Hits</div>
            </div>
            <div>
              <div className="text-xl font-black text-red-400">{finalScore.misses}</div>
              <div className="text-slate-500 text-xs">Errors</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReactionTap;
