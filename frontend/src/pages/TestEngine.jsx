import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

// ── All module components ─────────────────────────────────────────────────────
import VisualNaming   from '../components/VisualNaming';
import AudioDictation from '../components/AudioDictation';
import DrawingCanvas  from '../components/DrawingCanvas';
import StroopTask     from '../components/StroopTask';
import DigitSpan      from '../components/DigitSpan';
import PatternMemory  from '../components/PatternMemory';
import AIEvaluator    from '../components/AIEvaluator';
import ClockDrawing   from '../components/ClockDrawing';
import FluencyTest    from '../components/FluencyTest';
import DelayedRecall  from '../components/DelayedRecall';
import ReactionTap    from '../components/ReactionTap';

import { Activity, ChevronRight, X, CheckCircle2, XCircle, MinusCircle, Clock, Target, Award } from 'lucide-react';

// ── Framer Motion variants ────────────────────────────────────────────────────
const slideVariants = {
  enter:  { opacity: 0, x: 48  },
  center: { opacity: 1, x: 0   },
  exit:   { opacity: 0, x: -48 },
};

// ── Personalized feedback generator ──────────────────────────────────────────
function generateFeedback(pct, testId) {
  const domainFeedback = {
    'mindcheck-full': [
      { min: 80, text: 'Excellent general cognitive performance. Visual recognition, logic, and memory all tested strong.' },
      { min: 60, text: 'Good overall performance. Some areas like auditory recall can be strengthened with practice.' },
      { min: 0,  text: 'There is room to improve in visual recognition and logical reasoning. Consistent practice helps.' },
    ],
    'executive-us-standard': [
      { min: 80, text: 'Strong executive function. Inhibitory control and working memory are well-maintained.' },
      { min: 60, text: 'Moderate executive function. Consider attention-based exercises to sharpen response inhibition.' },
      { min: 0,  text: 'Executive function needs attention. Stroop tasks and digit-span exercises can be very beneficial.' },
    ],
    'spatial-dynamics': [
      { min: 80, text: 'Excellent spatial memory and reaction speed. Pattern recognition is a clear cognitive strength.' },
      { min: 60, text: 'Good spatial ability. Reaction speed is moderate — can improve with regular brain training.' },
      { min: 0,  text: 'Spatial processing and reaction speed can be improved. Try memory and coordination exercises.' },
    ],
    'ai-semantic': [
      { min: 80, text: 'Strong communication and memory recall throughout the conversation.' },
      { min: 60, text: 'Generally clear responses. Attention consistency was moderate across the interview.' },
      { min: 0,  text: 'Some difficulty maintaining focus during the interview. Regular conversational engagement helps.' },
    ],
    'alzheimers-extended': [
      { min: 80, text: 'Good episodic memory and verbal fluency. These are encouraging results for the extended battery.' },
      { min: 60, text: 'Mixed results. Delayed recall was the stronger area. Verbal fluency practice is recommended.' },
      { min: 0,  text: 'Results indicate some challenges in episodic memory and fluency. Follow up with a clinician.' },
    ],
  };

  const tiers = domainFeedback[testId] || [
    { min: 80, text: 'Strong performance overall.' },
    { min: 60, text: 'Good performance with some areas to improve.' },
    { min: 0,  text: 'Keep practicing — consistent effort leads to improvement.' },
  ];

  return tiers.find(t => pct >= t.min)?.text || tiers[tiers.length - 1].text;
}

// ── Score label helper ────────────────────────────────────────────────────────
function scoreLabel(pct) {
  if (pct >= 90) return { text: 'Outstanding',  color: '#10b981' };
  if (pct >= 75) return { text: 'Strong',        color: '#34d399' };
  if (pct >= 60) return { text: 'Moderate',      color: '#f59e0b' };
  if (pct >= 40) return { text: 'Developing',    color: '#fb923c' };
  return                { text: 'Needs Practice', color: '#ef4444' };
}

// ─────────────────────────────────────────────────────────────────────────────
const TestEngine = () => {
  const { testId }        = useParams();
  const [currentIndex,   setCurrentIndex]   = useState(0);
  const [answers,        setAnswers]        = useState({});
  const [isFinished,     setIsFinished]     = useState(false);
  const [finalScore,     setFinalScore]     = useState(0);
  const [maxScore,       setMaxScore]       = useState(0);
  const [testDatabase,   setTestDatabase]   = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [direction,      setDirection]      = useState(1);   // 1 = forward
  const [startTime,      setStartTime]      = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [breakdown,      setBreakdown]      = useState([]);  // per-question results
  const timerRef        = useRef(null);
  const isSubmittingRef = useRef(false); // submission lock — not state to avoid re-renders

  // Fetch test data
  useEffect(() => {
    let baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
    fetch(`${baseUrl}/api/tests`)
      .then(res => res.json())
      .then(data => { setTestDatabase(data); setLoading(false); })
      .catch(err => { console.error('Failed to fetch tests:', err); setLoading(false); });
  }, []);

  // Start elapsed timer on first render
  useEffect(() => {
    setStartTime(Date.now());
    timerRef.current = setInterval(() => {
      setElapsedSeconds(s => s + 1);
    }, 1000);
    return () => {
      clearInterval(timerRef.current);
      window.speechSynthesis.cancel();
    };
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-2 border-sm-violet/20 border-t-sm-violet rounded-full animate-spin mx-auto" />
        <p className="font-mono text-[10px] text-slate-600 tracking-widest uppercase animate-pulse">Loading module...</p>
      </div>
    </div>
  );

  const activeTest = testDatabase.find(t => t.id === testId);
  if (!activeTest) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-2xl font-medium text-slate-400">Module not found.</p>
    </div>
  );

  const question       = activeTest.questions[currentIndex];
  const isLastQuestion = currentIndex === activeTest.questions.length - 1;
  const progressPct    = ((currentIndex + 1) / activeTest.questions.length) * 100;

  const handleAnswer = (answerData) => {
    setAnswers(prev => ({ ...prev, [question.id]: answerData }));
  };

  // ── Scoring ───────────────────────────────────────────────────────────
  const calculateScore = () => {
    let total = 0;
    let max   = 0;
    const bd  = [];

    activeTest.questions.forEach(q => {
      const rawUserAnswer = answers[q.id];
      let earned = 0;
      let status = 'skipped';
      let userDisplay    = '(skipped)';
      let correctDisplay = q.correctAnswer || '—';

      // Legacy guard (needsManualGrading no longer used but kept as safety net)
      if (q.needsManualGrading) {
        bd.push({ q, earned: 0, status: 'manual', userDisplay: '(requires manual review)', correctDisplay: 'Manual' });
        return;
      }

      max += q.points;

      // 1. DRAWING / CLOCK_DRAWING — graded by Gemini Vision
      if ((q.type === 'DRAWING' || q.type === 'CLOCK_DRAWING') && rawUserAnswer?.type === 'DRAWING_GRADED') {
        earned = Math.max(0, Math.min(q.points, rawUserAnswer.score ?? 0));
        const sim = rawUserAnswer.similarity ?? 0;
        status = sim >= 70 ? 'correct' : sim >= 40 ? 'partial' : 'wrong';
        userDisplay    = `${sim}% similarity — "${(rawUserAnswer.feedback || '').slice(0, 60)}${rawUserAnswer.feedback?.length > 60 ? '...' : ''}"`;
        correctDisplay = `Max: ${q.points} pts (AI-evaluated)`;
        total += earned;
        bd.push({ q, earned, status, userDisplay, correctDisplay });
        return;
      }

      // Drawing question with no answer submitted yet
      if (q.type === 'DRAWING' || q.type === 'CLOCK_DRAWING') {
        bd.push({ q, earned: 0, status: 'skipped', userDisplay: '(no drawing submitted)', correctDisplay: `Max: ${q.points}` });
        return;
      }

      // 2. AI_INTERVIEW — pre-graded by Gemini
      if (q.type === 'AI_INTERVIEW' && rawUserAnswer?.type === 'AI_GRADED') {
        earned = Math.max(0, Math.min(q.points, rawUserAnswer.score ?? 0));
        status = earned >= q.points * 0.6 ? 'correct' : 'partial';
        userDisplay    = `AI Score: ${earned}/${q.points}`;
        correctDisplay = `Max: ${q.points}`;
        total += earned;
        bd.push({ q, earned, status, userDisplay, correctDisplay });
        return;
      }

      // 3. REACTION_TAP — pre-graded by component
      if (q.type === 'REACTION_TAP' && rawUserAnswer?.type === 'REACTION_TAP') {
        earned = Math.max(0, Math.min(q.points, rawUserAnswer.score ?? 0));
        status = earned >= q.points * 0.5 ? 'correct' : earned > 0 ? 'partial' : 'wrong';
        userDisplay    = `${rawUserAnswer.avgRt ?? '?'}ms avg reaction`;
        correctDisplay = `Max: ${q.points} pts`;
        total += earned;
        bd.push({ q, earned, status, userDisplay, correctDisplay });
        return;
      }

      // 4. PATTERN_MEMORY
      if (q.type === 'PATTERN_MEMORY') {
        const correctStr = (q.targetPattern || []).slice().sort().join(',');
        userDisplay = rawUserAnswer || '(none)';
        if ((rawUserAnswer || '').toString() === correctStr) {
          earned = q.points; status = 'correct';
        } else if (rawUserAnswer) {
          status = 'wrong';
        }
        correctDisplay = `Pattern: ${correctStr}`;
        if (status === 'correct') total += earned;
        else total += (q.penalty || 0);
        bd.push({ q, earned: status === 'correct' ? earned : (q.penalty || 0), status, userDisplay, correctDisplay });
        return;
      }

      // 5. FLUENCY_TEST
      if (q.type === 'FLUENCY_TEST') {
        const count  = parseInt(rawUserAnswer || '0', 10);
        earned       = Math.min(q.points, Math.round((count / (q.targetWords || 12)) * q.points));
        earned       = Math.max(0, earned);
        status       = count >= (q.minWords || 5) ? 'correct' : count > 0 ? 'partial' : 'wrong';
        userDisplay  = `${count} valid animals named`;
        correctDisplay = `Target: ${q.targetWords || 12}+ animals`;
        total += earned;
        bd.push({ q, earned, status, userDisplay, correctDisplay });
        return;
      }

      // 6. DELAYED_RECALL
      if (q.type === 'DELAYED_RECALL') {
        const recalled = parseInt(rawUserAnswer || '0', 10);
        const listLen  = (q.wordList || []).length || 5;
        earned         = Math.round((recalled / listLen) * q.points);
        earned         = Math.max(0, earned);
        status         = recalled >= Math.ceil(listLen * 0.6) ? 'correct' : recalled > 0 ? 'partial' : 'wrong';
        userDisplay    = `${recalled}/${listLen} words recalled`;
        correctDisplay = `All ${listLen} words`;
        total += earned;
        bd.push({ q, earned, status, userDisplay, correctDisplay });
        return;
      }

      // 7. Standard text comparison
      const cleanUser    = (rawUserAnswer || '').toString().toLowerCase().replace(/[.,!?]/g, '').replace(/\s+/g, ' ').trim();
      const cleanCorrect = (q.correctAnswer || '').toLowerCase().replace(/[.,!?]/g, '').replace(/\s+/g, ' ').trim();
      userDisplay = cleanUser || '(skipped)';

      if (!cleanUser) {
        bd.push({ q, earned: 0, status: 'skipped', userDisplay, correctDisplay });
        return;
      }

      let isCorrect = false;
      if (q.type === 'VISUAL_NAMING' && cleanUser.includes(cleanCorrect)) isCorrect = true;
      else if (cleanUser === cleanCorrect) isCorrect = true;

      if (isCorrect) { earned = q.points; status = 'correct'; total += earned; }
      else { status = 'wrong'; total += (q.penalty || 0); }

      bd.push({ q, earned: isCorrect ? earned : (q.penalty || 0), status, userDisplay, correctDisplay });
    });

    const finalTotal = Math.max(0, total);
    setFinalScore(finalTotal);
    setMaxScore(max);
    setBreakdown(bd);
    clearInterval(timerRef.current);
    return { calculatedScore: finalTotal, calculatedMax: max };
  };

  // ── Handle next / submit (with submission lock) ────────────────────────────
  const handleNext = async () => {
    if (isSubmittingRef.current) return; // prevent double-submit
    window.speechSynthesis.cancel();
    if (isLastQuestion) {
      isSubmittingRef.current = true;
      const { calculatedScore, calculatedMax } = calculateScore();
      setIsFinished(true);

      try {
        let baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
        const user  = JSON.parse(localStorage.getItem('user'));
        await fetch(`${baseUrl}/api/tests/results`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
          body: JSON.stringify({ testId, finalScore: calculatedScore, maxScore: calculatedMax, answers }),
        });
      } catch (err) {
        console.error('Failed to save score:', err);
      }
    } else {
      setDirection(1);
      setCurrentIndex(currentIndex + 1);
    }
  };

  // ── Dynamic component renderer ────────────────────────────────────────────
  const renderQuestionComponent = () => {
    switch (question.type) {
      case 'VISUAL_NAMING':
      case 'MATH_LOGIC':      return <VisualNaming   question={question} onAnswer={handleAnswer} />;
      case 'AUDIO_DICTATION': return <AudioDictation question={question} onAnswer={handleAnswer} />;
      case 'DRAWING':         return <DrawingCanvas  question={question} onAnswer={handleAnswer} />;
      case 'STROOP_TEST':     return <StroopTask     question={question} onAnswer={handleAnswer} />;
      case 'DIGIT_SPAN':      return <DigitSpan      question={question} onAnswer={handleAnswer} />;
      case 'PATTERN_MEMORY':  return <PatternMemory  question={question} onAnswer={handleAnswer} />;
      case 'AI_INTERVIEW':    return <AIEvaluator    question={question} onAnswer={handleAnswer} />;
      case 'CLOCK_DRAWING':   return <ClockDrawing   question={question} onAnswer={handleAnswer} />;
      case 'FLUENCY_TEST':    return <FluencyTest    question={question} onAnswer={handleAnswer} />;
      case 'DELAYED_RECALL':  return <DelayedRecall  question={question} onAnswer={handleAnswer} />;
      case 'REACTION_TAP':    return <ReactionTap    question={question} onAnswer={handleAnswer} />;
      default: return <p className="text-gray-400">Unknown module type: {question.type}</p>;
    }
  };

  // ── Format elapsed time ───────────────────────────────────────────────────
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60), s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // ────────────────────────────────────────────────────────────────────────────
  // RESULTS SCREEN
  // ────────────────────────────────────────────────────────────────────────────
  if (isFinished) {
    const pct    = maxScore > 0 ? Math.round((finalScore / maxScore) * 100) : 0;
    const label  = scoreLabel(pct);
    const fbText = generateFeedback(pct, testId);

    const correctCount  = breakdown.filter(b => b.status === 'correct').length;
    const wrongCount    = breakdown.filter(b => b.status === 'wrong').length;
    const skippedCount  = breakdown.filter(b => b.status === 'skipped').length;
    const partialCount  = breakdown.filter(b => b.status === 'partial').length;

    const statusConfig = {
      correct: { icon: <CheckCircle2 size={16} />, color: '#10b981', label: 'Correct' },
      wrong:   { icon: <XCircle      size={16} />, color: '#ef4444', label: 'Incorrect' },
      partial: { icon: <Activity     size={16} />, color: '#f59e0b', label: 'Partial' },
      skipped: { icon: <MinusCircle  size={16} />, color: '#6b7280', label: 'Skipped' },
      manual:  { icon: <Clock        size={16} />, color: '#8b5cf6', label: 'Manual Review' },
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="min-h-screen w-full px-4 md:px-8 py-12 font-sans text-slate-200"
      >
        <div className="max-w-3xl mx-auto space-y-5">

          {/* Score card */}
          <div className="panel rounded-3xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-5"
              style={{ background: label.color + '20', border: `1px solid ${label.color}40` }}>
              <Award size={32} style={{ color: label.color }} />
            </div>
            <h1 className="text-3xl font-black text-white mb-1">Evaluation Complete</h1>
            <p className="text-slate-500 text-sm mb-6">{activeTest.title}</p>

            {/* Score gauge */}
            <div className="relative inline-flex items-center justify-center mb-6">
              <svg width={160} height={160} className="-rotate-90">
                <circle cx={80} cy={80} r={64} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
                <circle cx={80} cy={80} r={64} fill="none" stroke={label.color}
                  strokeWidth={10} strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 64}
                  strokeDashoffset={2 * Math.PI * 64 * (1 - pct / 100)}
                  style={{ transition: 'stroke-dashoffset 1.2s ease-out', filter: `drop-shadow(0 0 8px ${label.color})` }}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-black tabular-nums" style={{ color: label.color }}>{pct}%</span>
                <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">{label.text}</span>
              </div>
            </div>

            <div className="text-lg font-bold text-white mb-1">
              {finalScore} <span className="text-slate-500 font-normal">/ {maxScore} points</span>
            </div>
            <div className="text-sm text-slate-500">
              <Clock size={12} className="inline mr-1" /> Time taken: {formatTime(elapsedSeconds)}
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { n: correctCount,  label: 'Correct',  color: '#10b981' },
              { n: partialCount,  label: 'Partial',  color: '#f59e0b' },
              { n: wrongCount,    label: 'Wrong',    color: '#ef4444' },
              { n: skippedCount,  label: 'Skipped',  color: '#6b7280' },
            ].map(({ n, label, color }) => (
              <div key={label} className="panel rounded-2xl p-4 text-center">
                <div className="text-2xl font-black tabular-nums" style={{ color }}>{n}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* Personalized feedback */}
          <div className="panel rounded-2xl p-5 flex items-start gap-3">
            <Target size={18} className="text-violet-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-slate-300 leading-relaxed">{fbText}</p>
          </div>

          {/* Per-question breakdown */}
          <div className="panel rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/07 flex items-center gap-2">
              <Activity size={15} className="text-cyan-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-widest">Question Breakdown</h2>
            </div>
            <div className="divide-y divide-white/05">
              {breakdown.map((item, i) => {
                const sc = statusConfig[item.status];
                return (
                  <div key={i} className="px-5 py-4 flex items-start gap-4">
                    {/* Status icon */}
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: sc.color + '18', color: sc.color }}>
                      {sc.icon}
                    </div>
                    {/* Question info */}
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-medium text-slate-200 mb-1 leading-snug">
                        Q{i + 1}: {item.q.instruction || item.q.type}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>Your answer: <span className="text-slate-300 font-medium">{item.userDisplay}</span></span>
                        {item.correctDisplay !== '—' && (
                          <span>Expected: <span className="text-slate-300 font-medium">{item.correctDisplay}</span></span>
                        )}
                      </div>
                    </div>
                    {/* Points */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-black tabular-nums" style={{ color: sc.color }}>
                        {item.earned > 0 ? `+${item.earned}` : item.earned}
                      </div>
                      <div className="text-[10px] text-slate-600">pts</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action */}
          <div className="flex justify-center pt-2">
            <Link to="/dashboard"
              className="inline-flex items-center gap-2 btn-violet text-white px-10 py-4 rounded-2xl font-bold text-base transition-all">
              View My Dashboard <ChevronRight size={20} />
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // TEST SCREEN
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[90vh] w-full bg-transparent text-slate-200 p-4 md:p-8 flex flex-col items-center justify-center font-sans relative z-10">
      <div className="w-full max-w-4xl bg-white/3 backdrop-blur-2xl border border-white/08 rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col min-h-[72vh]">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-white/07 bg-black/20">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/08 rounded-lg">
              <X size={20} />
            </Link>
            <div className="h-5 w-px bg-white/10" />
            <span className="text-slate-300 font-medium text-sm tracking-wide">{activeTest.title}</span>
          </div>

          {/* Progress pill */}
          <div className="flex items-center gap-2">
            <Clock size={13} className="text-slate-500" />
            <span className="font-mono text-xs text-slate-500 tabular-nums">{formatTime(elapsedSeconds)}</span>
            <div className="h-4 w-px bg-white/10 mx-1" />
            <span className="text-xs font-semibold text-slate-400">
              {currentIndex + 1} <span className="text-slate-600">/ {activeTest.questions.length}</span>
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-white/05 w-full">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #8b5cf6, #22d3ee)' }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        {/* Question content with slide animation */}
        <div className="flex-grow p-6 md:p-10 flex flex-col justify-center relative overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={question.id}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="w-full flex flex-col items-center"
            >
              <h2 className="text-2xl md:text-3xl font-semibold text-white mb-10 text-center tracking-tight leading-snug max-w-2xl">
                {question.instruction}
              </h2>
              <div className="w-full max-w-2xl mx-auto flex justify-center">
                {renderQuestionComponent()}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-white/07 bg-black/20 flex justify-between items-center">
          {/* Dot indicators */}
          <div className="flex gap-1.5">
            {activeTest.questions.map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                style={{
                  background: i < currentIndex ? '#8b5cf6' : i === currentIndex ? '#22d3ee' : 'rgba(255,255,255,0.12)',
                  boxShadow: i === currentIndex ? '0 0 6px #22d3ee' : 'none',
                  width: i === currentIndex ? '20px' : '6px',
                }}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 btn-violet text-white px-8 py-3 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 text-sm"
          >
            {isLastQuestion ? 'Submit & See Results' : 'Continue'} <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestEngine;