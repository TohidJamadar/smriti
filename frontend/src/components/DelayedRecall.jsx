import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * DelayedRecall — Word List Memory Test
 *
 * Clinical use: Episodic memory assessment (hallmark of Alzheimer's).
 * Protocol:
 *   Phase 1 — STUDY    : Words shown for 10s (or until user confirms)
 *   Phase 2 — DISTRACT : 20-second counting-down interference task
 *   Phase 3 — RECALL   : User types every word they remember
 *
 * Scoring: Fraction of target words correctly recalled (case-insensitive).
 * Type: DELAYED_RECALL
 */

const PHASES = { STUDY: 'study', DISTRACT: 'distract', RECALL: 'recall', DONE: 'done' };

const DelayedRecall = ({ question, onAnswer }) => {
  const wordList    = question.wordList || ['apple', 'table', 'penny', 'sunset', 'forest'];
  const studyTime   = question.studyTime   || 10; // seconds to study
  const distractTime= question.distractTime|| 20; // distraction duration

  const [phase,      setPhase]      = useState(PHASES.STUDY);
  const [countdown,  setCountdown]  = useState(studyTime);
  const [input,      setInput]      = useState('');
  const [recalled,   setRecalled]   = useState([]);
  const [submitted,  setSubmitted]  = useState(false);
  const [score,      setScore]      = useState(null);
  const timerRef = useRef(null);

  // ── Phase countdown logic ──────────────────────────────────────────────────
  useEffect(() => {
    if (phase === PHASES.DONE) return;

    const duration = phase === PHASES.STUDY ? studyTime : distractTime;
    setCountdown(duration);

    timerRef.current = setInterval(() => {
      setCountdown(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          if (phase === PHASES.STUDY) {
            setPhase(PHASES.DISTRACT);
          } else if (phase === PHASES.DISTRACT) {
            setPhase(PHASES.RECALL);
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [phase]);

  // ── Recall submission ──────────────────────────────────────────────────────
  const addRecalledWord = () => {
    const w = input.trim().toLowerCase();
    if (!w || recalled.includes(w)) { setInput(''); return; }
    setRecalled(prev => [...prev, w]);
    setInput('');
  };

  const submitRecall = () => {
    const correct = recalled.filter(w => wordList.map(x => x.toLowerCase()).includes(w));
    const pct     = Math.round((correct.length / wordList.length) * 100);
    setScore({ correct: correct.length, total: wordList.length, pct, correctWords: correct });
    setSubmitted(true);
    setPhase(PHASES.DONE);
    // Pass score as string integer — engine maps this to points
    onAnswer(String(correct.length));
  };

  // ── Skip study phase early ─────────────────────────────────────────────────
  const skipStudy = () => {
    clearInterval(timerRef.current);
    setPhase(PHASES.DISTRACT);
  };

  // ── Distraction task: count backwards from 20 ─────────────────────────────
  const distractNumber = Math.max(0, countdown + 1); // shows count-down number

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center animate-fade-in w-full max-w-lg mx-auto">

      {/* ── PHASE: STUDY ──────────────────────────────────────────────────── */}
      {phase === PHASES.STUDY && (
        <div className="w-full text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sm-cyan/10 border border-sm-cyan/20 text-sm-cyan text-xs font-bold uppercase tracking-widest mb-6">
            <Eye size={14} /> Study Phase · {countdown}s remaining
          </div>

          <p className="text-slate-400 text-sm mb-6">
            Memorize these words. You will be asked to recall them later.
          </p>

          <div className="panel rounded-2xl p-6 mb-6">
            <div className="grid grid-cols-2 gap-3">
              {wordList.map((word, i) => (
                <div key={i}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-sm-glass-2 border border-sm-border"
                >
                  <span className="font-mono text-[10px] text-slate-600 w-4">{i + 1}.</span>
                  <span className="text-white font-semibold capitalize">{word}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-sm-cyan rounded-full transition-all duration-1000"
              style={{ width: `${(countdown / studyTime) * 100}%` }}
            />
          </div>

          <button onClick={skipStudy}
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors underline text-xs"
          >
            I've memorized them → skip to next phase
          </button>
        </div>
      )}

      {/* ── PHASE: DISTRACT ────────────────────────────────────────────────── */}
      {phase === PHASES.DISTRACT && (
        <div className="w-full text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sm-amber/10 border border-sm-amber/20 text-sm-amber text-xs font-bold uppercase tracking-widest mb-6">
            <EyeOff size={14} /> Interference Task
          </div>

          <p className="text-slate-400 text-sm mb-8">
            Count backwards from <strong className="text-white">100</strong> by 7s while you wait.
            <br />
            <span className="text-xs text-slate-600">(This tests working memory interference)</span>
          </p>

          {/* Big countdown number */}
          <div className="text-8xl font-black tabular-nums text-sm-amber mb-4"
            style={{ textShadow: '0 0 40px rgba(251,191,36,0.4)' }}
          >
            {countdown}
          </div>
          <p className="text-slate-600 text-xs">seconds until recall begins</p>
        </div>
      )}

      {/* ── PHASE: RECALL ──────────────────────────────────────────────────── */}
      {phase === PHASES.RECALL && !submitted && (
        <div className="w-full">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sm-violet/10 border border-sm-violet/20 text-sm-violet text-xs font-bold uppercase tracking-widest mb-6">
            <AlertCircle size={14} /> Recall Phase — type every word you remember
          </div>

          <div className="flex gap-2 mb-4">
            <input
              autoFocus
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addRecalledWord()}
              placeholder="Type a word and press Enter..."
              className="flex-1 px-4 py-3.5 bg-sm-bg rounded-xl text-white text-sm outline-none placeholder-slate-700 border border-sm-border focus:border-sm-violet transition-colors"
            />
            <button onClick={addRecalledWord}
              className="px-4 py-3 bg-sm-violet text-white rounded-xl font-bold hover:bg-sm-violet-pale transition-colors"
            >
              Add
            </button>
          </div>

          {recalled.length > 0 && (
            <div className="panel rounded-2xl p-4 mb-5">
              <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold mb-3">Recalled ({recalled.length})</p>
              <div className="flex flex-wrap gap-2">
                {recalled.map((w, i) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-sm-violet/10 border border-sm-violet/20 text-sm text-slate-300">
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button onClick={submitRecall}
            className="w-full py-4 btn-violet text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={16} /> Submit Recall
          </button>
        </div>
      )}

      {/* ── PHASE: DONE ────────────────────────────────────────────────────── */}
      {phase === PHASES.DONE && score && (
        <div className="w-full text-center">
          <div className="panel rounded-2xl p-8 mb-6">
            <div className="text-6xl font-black mb-2" style={{
              color: score.pct >= 80 ? '#34d399' : score.pct >= 50 ? '#fbbf24' : '#fb7185',
              textShadow: `0 0 30px currentColor`,
            }}>
              {score.correct}/{score.total}
            </div>
            <p className="text-slate-500 text-sm">words recalled correctly</p>
            <div className="mt-6 text-left">
              <p className="text-xs text-slate-600 uppercase tracking-widest mb-2">Original Word List</p>
              <div className="grid grid-cols-2 gap-2">
                {wordList.map((w, i) => {
                  const hit = score.correctWords.includes(w.toLowerCase());
                  return (
                    <div key={i} className={`px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-2
                      ${hit ? 'bg-sm-green/10 text-sm-green border border-sm-green/20' : 'bg-sm-rose/10 text-sm-rose border border-sm-rose/20'}`}>
                      {hit ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                      {w}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DelayedRecall;
