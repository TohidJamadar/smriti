import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  Bot, User, Send, Loader2, CheckCircle2, Brain,
  Star, TrendingUp, AlertCircle, MessageSquare, BarChart3,
} from 'lucide-react';

// ─── Stage 1: Hardcoded question bank ─────────────────────────────────────────
// Questions are asked locally — NO Gemini call during collection.
// Simple Indian English, covers all required cognitive domains.
const QUESTION_BANK = [
  { id: 'q1', domain: 'memory',     text: 'What did you eat for breakfast or lunch today? Please tell me in detail.' },
  { id: 'q2', domain: 'daily',      text: 'Can you tell me what you did yesterday from morning until evening?' },
  { id: 'q3', domain: 'math',       text: 'If you have 20 rupees and you spend 7 rupees on tea, how much money is left with you?' },
  { id: 'q4', domain: 'poem',       text: 'I will say the beginning of a rhyme — please complete it: "Twinkle twinkle little star, how I wonder what you ___"' },
  { id: 'q5', domain: 'procedural', text: 'How do you make a cup of tea? Please tell me the steps, one by one.' },
  { id: 'q6', domain: 'attention',  text: 'I want you to remember three things: Rose, Book, and Clock. Say them back to me now.' },
  { id: 'q7', domain: 'recall',     text: 'Now, without looking back — can you tell me those three things I asked you to remember just a moment ago?' },
  { id: 'q8', domain: 'social',     text: 'Can you tell me the name of a family member or a friend you spoke with recently? What did you talk about?' },
];

const TOTAL_QUESTIONS = QUESTION_BANK.length; // 8

// ─── Stage 2: Evaluation prompt builder ───────────────────────────────────────
function buildEvaluationPrompt(transcript, maxPoints) {
  const transcriptText = transcript
    .map((t, i) => `Q${i + 1} [${t.domain}]: ${t.question}\nAnswer: ${t.answer}`)
    .join('\n\n');

  return `You are an expert clinical neuropsychologist evaluating a cognitive screening interview for potential Alzheimer's disease.

The following is a complete question-answer transcript from a patient (possibly elderly):

${transcriptText}

EVALUATION INSTRUCTIONS:
Analyze EVERY answer carefully. Consider:
1. MEMORY RECALL — quality of episodic and working memory
2. ATTENTION — ability to follow multi-step instructions
3. LANGUAGE — clarity, fluency, sentence coherence
4. REASONING — logical and procedural thinking
5. EXECUTIVE FUNCTION — planning, sequencing, task completion

SCORING (0–${maxPoints} scale):
- ${maxPoints}: All answers complete, clear, and accurate
- ${Math.round(maxPoints * 0.8)}: Mostly accurate with minor gaps
- ${Math.round(maxPoints * 0.6)}: Moderate — some confusion or incomplete answers
- ${Math.round(maxPoints * 0.4)}: Significant gaps — several incomplete or irrelevant answers
- ${Math.round(maxPoints * 0.2)}: Mostly incomplete or incoherent
- 1: Attempted but largely unusable responses
- 0: ONLY if ALL answers were blank or completely nonsensical

IMPORTANT: Be generous with scoring for elderly patients. Give credit for partial answers and clear effort. Never give 0 if the patient gave any genuine attempt.

Return STRICT JSON ONLY — no markdown, no backticks, no explanation outside JSON:

{
  "score": <integer 0-${maxPoints}>,
  "summary": "<2-3 sentence holistic summary of cognitive performance, mentioning specific answers>",
  "strengths": ["<specific strength observed from answers>", "<another strength>"],
  "improvements": ["<specific area needing practice based on answers>"],
  "observations": {
    "memory": "<Excellent|Good|Moderate|Needs Attention — with one-line note>",
    "attention": "<Excellent|Good|Moderate|Needs Attention — with one-line note>",
    "language": "<Excellent|Good|Moderate|Needs Attention — with one-line note>",
    "reasoning": "<Excellent|Good|Moderate|Needs Attention — with one-line note>",
    "executive_function": "<Excellent|Good|Moderate|Needs Attention — with one-line note>"
  }
}`;
}

// ─── Gemini evaluation call ────────────────────────────────────────────────────
async function runFinalEvaluation(transcript, maxPoints) {
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
  const model  = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
    generationConfig: { responseMimeType: 'application/json' },
  });
  const prompt = buildEvaluationPrompt(transcript, maxPoints);
  const result = await model.generateContent(prompt);
  const text   = result.response.text()
    .replace(/```json/gi, '').replace(/```/g, '').trim();
  return JSON.parse(text);
}

// ─── Observation domain display map ───────────────────────────────────────────
const OBS_META = {
  memory:            { label: 'Memory Recall',      color: '#8b5cf6' },
  attention:         { label: 'Attention',           color: '#22d3ee' },
  language:          { label: 'Language',            color: '#a3e635' },
  reasoning:         { label: 'Reasoning',           color: '#f59e0b' },
  executive_function:{ label: 'Executive Function',  color: '#fb7185' },
};

// ═════════════════════════════════════════════════════════════════════════════
const AIEvaluator = ({ question, onAnswer }) => {
  const maxPoints = question?.points ?? 5;

  // ── Stage tracking ─────────────────────────────────────────────────────────
  // stage: 'collecting' | 'evaluating' | 'done'
  const [stage,       setStage]       = useState('collecting');
  const [qIndex,      setQIndex]      = useState(0);     // which question we're on
  const [input,       setInput]       = useState('');
  const [isWaiting,   setIsWaiting]   = useState(false); // AI is "typing" first question
  const [evalError,   setEvalError]   = useState('');
  const [richResult,  setRichResult]  = useState(null);

  // Structured transcript: [{ id, domain, question, answer }]
  const transcriptRef  = useRef([]);
  const evalCalledRef  = useRef(false);   // prevent duplicate evaluation
  const messagesEndRef = useRef(null);

  // Current question object
  const currentQ = QUESTION_BANK[qIndex] ?? null;

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [qIndex, stage, isWaiting]);

  // Show brief "AI is typing" delay when first question loads
  useEffect(() => {
    setIsWaiting(true);
    const t = setTimeout(() => setIsWaiting(false), 900);
    return () => clearTimeout(t);
  }, []);

  // ── Submit an answer and advance ───────────────────────────────────────────
  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isWaiting || stage !== 'collecting') return;

    // Save Q+A pair
    transcriptRef.current.push({
      id:       currentQ.id,
      domain:   currentQ.domain,
      question: currentQ.text,
      answer:   trimmed,
    });

    setInput('');
    const next = qIndex + 1;

    if (next >= TOTAL_QUESTIONS) {
      // All questions done — move to evaluation stage
      setStage('evaluating');
      triggerEvaluation();
    } else {
      // Next question — brief typing delay
      setIsWaiting(true);
      setTimeout(() => {
        setQIndex(next);
        setIsWaiting(false);
      }, 700);
    }
  }, [input, isWaiting, stage, qIndex, currentQ]);

  // ── Final Gemini evaluation ────────────────────────────────────────────────
  const triggerEvaluation = useCallback(async () => {
    if (evalCalledRef.current) return;
    evalCalledRef.current = true;
    setEvalError('');

    const transcript = transcriptRef.current;

    // Safety: should not happen, but guard anyway
    if (transcript.length === 0) {
      setEvalError('No answers recorded. Cannot evaluate.');
      setStage('collecting');
      evalCalledRef.current = false;
      return;
    }

    let parsed = null;
    let retries = 3;

    while (retries >= 0) {
      try {
        parsed = await runFinalEvaluation(transcript, maxPoints);
        break;
      } catch (err) {
        if (retries === 0) {
          console.error('Evaluation failed after retries:', err);
          setEvalError(
            'AI evaluation encountered an error. ' +
            'A partial score has been awarded based on interview completion.'
          );
          // Fallback: award 60% for completing the interview
          parsed = {
            score:        Math.round(maxPoints * 0.6),
            summary:      'Interview completed. Detailed AI analysis was temporarily unavailable.',
            strengths:    ['Completed all interview questions', 'Engaged with the assessment'],
            improvements: ['Re-attempt when connectivity is stable'],
            observations: {
              memory:            'Could not be assessed — try again later',
              attention:         'Could not be assessed — try again later',
              language:          'Could not be assessed — try again later',
              reasoning:         'Could not be assessed — try again later',
              executive_function:'Could not be assessed — try again later',
            },
          };
          break;
        }
        const isRetryable =
          err.message?.includes('503') ||
          err.message?.includes('429') ||
          err instanceof SyntaxError;
        if (!isRetryable) {
          retries = 0; // force one more loop for fallback
        } else {
          await new Promise(r => setTimeout(r, 2500));
        }
        retries--;
      }
    }

    if (!parsed) {
      setEvalError('Evaluation failed completely. Please retake the test.');
      setStage('collecting');
      evalCalledRef.current = false;
      return;
    }

    // Validate score
    let finalScore = typeof parsed.score === 'number' ? parsed.score : 0;
    if (finalScore === 0 && transcript.length >= 5) finalScore = 1; // floor
    finalScore = Math.max(0, Math.min(maxPoints, finalScore));

    const finalResult = { ...parsed, score: finalScore };
    setRichResult(finalResult);
    setStage('done');

    // Report to TestEngine
    onAnswer({
      type:         'AI_GRADED',
      score:        finalScore,
      feedback:     parsed.summary,
      summary:      parsed.summary,
      strengths:    parsed.strengths   ?? [],
      improvements: parsed.improvements ?? [],
      observations: parsed.observations ?? {},
      transcript,
    });
  }, [maxPoints, onAnswer]);

  // ── Keyboard enter ─────────────────────────────────────────────────────────
  const handleKey = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const answeredCount = transcriptRef.current.length;
  const progressPct   = Math.round((answeredCount / TOTAL_QUESTIONS) * 100);

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col items-center animate-fade-in w-full max-w-3xl mx-auto">

      {/* ── Stage badge ─────────────────────────────────────────────────── */}
      <div className={`flex items-center gap-2 mb-4 px-4 py-2 rounded-xl border text-sm font-medium ${
        stage === 'done'
          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
          : stage === 'evaluating'
          ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
          : 'text-teal-400 bg-teal-500/10 border-teal-500/20'
      }`}>
        {stage === 'done'
          ? <><CheckCircle2 size={16} /> Interview Complete — Analysis Ready</>
          : stage === 'evaluating'
          ? <><Loader2 size={16} className="animate-spin" /> AI is analysing your responses…</>
          : <><Bot size={16} /> Cognitive Interview · Question {qIndex + 1} of {TOTAL_QUESTIONS}</>
        }
      </div>

      {/* ── Progress bar ────────────────────────────────────────────────── */}
      {stage !== 'done' && (
        <div className="w-full mb-5">
          <div className="flex justify-between text-[10px] text-slate-600 uppercase tracking-widest mb-1.5">
            <span>{answeredCount} answered</span>
            <span>{TOTAL_QUESTIONS - answeredCount} remaining</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPct}%`,
                background: 'linear-gradient(90deg, #8b5cf6, #22d3ee)',
              }}
            />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* STAGE 1 — COLLECTION                                              */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {stage === 'collecting' && (
        <div className="w-full space-y-4">

          {/* Past Q+A pairs */}
          {transcriptRef.current.map((item, i) => (
            <div key={item.id} className="space-y-2">
              {/* AI question (past) */}
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 flex-shrink-0 border border-teal-500/30">
                  <Bot size={14} />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white/5 border border-white/10 text-slate-300 text-sm max-w-[82%] leading-relaxed">
                  <span className="text-[10px] text-slate-600 uppercase tracking-widest block mb-1">
                    Q{i + 1} · {item.domain}
                  </span>
                  {item.question}
                </div>
              </div>
              {/* User answer (past) */}
              <div className="flex gap-3 justify-end">
                <div className="px-4 py-3 rounded-2xl rounded-tr-sm bg-violet-600 text-white text-sm max-w-[82%] leading-relaxed">
                  {item.answer}
                </div>
                <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0 border border-violet-500/30">
                  <User size={14} />
                </div>
              </div>
            </div>
          ))}

          {/* Current question */}
          {currentQ && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 flex-shrink-0 border border-teal-500/30">
                {isWaiting
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Bot size={14} />
                }
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white/5 border border-white/10 text-slate-200 text-base max-w-[82%] leading-relaxed">
                {isWaiting
                  ? <span className="text-slate-500 text-sm italic">Thinking…</span>
                  : <>
                    <span className="text-[10px] text-slate-600 uppercase tracking-widest block mb-1">
                      Q{qIndex + 1} of {TOTAL_QUESTIONS} · {currentQ.domain}
                    </span>
                    {currentQ.text}
                  </>
                }
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />

          {/* Input */}
          {!isWaiting && currentQ && (
            <div className="pt-2">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  autoFocus
                  placeholder="Type your answer here…"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-14 py-4 text-white text-base focus:outline-none focus:border-teal-400/60 focus:ring-1 focus:ring-teal-400/30 transition-colors placeholder-slate-700"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
              <p className="text-[10px] text-slate-600 mt-2 text-center">
                Press Enter or click Send — you must answer before moving on
              </p>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* STAGE 2 — EVALUATING                                              */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {stage === 'evaluating' && (
        <div className="w-full panel rounded-2xl p-8 text-center space-y-5">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <Brain size={30} className="text-amber-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-1">Analysing Your Responses</h3>
              <p className="text-slate-400 text-sm">
                AI is reviewing all {TOTAL_QUESTIONS} questions and your answers…
              </p>
            </div>
            <div className="flex gap-2 mt-2">
              {['Memory', 'Attention', 'Language', 'Reasoning', 'Executive'].map((d, i) => (
                <div key={d} className="flex flex-col items-center gap-1">
                  <div className="w-1.5 h-6 rounded-full bg-white/10 overflow-hidden">
                    <div className="w-full rounded-full bg-amber-400 animate-pulse"
                      style={{ height: '100%', animationDelay: `${i * 0.15}s` }} />
                  </div>
                  <span className="text-[8px] text-slate-600 uppercase">{d.slice(0, 3)}</span>
                </div>
              ))}
            </div>
          </div>
          {evalError && (
            <div className="text-amber-400 text-xs bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2">
              {evalError}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* STAGE 3 — RESULTS                                                 */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {stage === 'done' && richResult && (
        <div className="w-full space-y-4 animate-fade-in">

          {/* Score card */}
          <div className="panel rounded-2xl p-6 flex items-center gap-6">
            <div className="relative flex-shrink-0">
              <svg width={90} height={90} className="-rotate-90">
                <circle cx={45} cy={45} r={36} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={7} />
                <circle cx={45} cy={45} r={36} fill="none" stroke="#8b5cf6"
                  strokeWidth={7} strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 36}
                  strokeDashoffset={2 * Math.PI * 36 * (1 - richResult.score / maxPoints)}
                  style={{ transition: 'stroke-dashoffset 1s ease-out', filter: 'drop-shadow(0 0 6px #8b5cf6)' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-violet-400">{richResult.score}</span>
                <span className="text-[9px] text-slate-500 uppercase">/{maxPoints}</span>
              </div>
            </div>
            <div className="flex-grow">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 size={14} className="text-violet-400" />
                <span className="text-xs font-bold text-white uppercase tracking-widest">Interview Score</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{richResult.summary}</p>
            </div>
          </div>

          {/* Strengths + Improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {richResult.strengths?.length > 0 && (
              <div className="panel rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Star size={14} className="text-amber-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest">Strengths</h3>
                </div>
                <ul className="space-y-2">
                  {richResult.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <CheckCircle2 size={13} className="text-emerald-400 mt-0.5 flex-shrink-0" />{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {richResult.improvements?.length > 0 && (
              <div className="panel rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={14} className="text-cyan-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest">Areas to Nurture</h3>
                </div>
                <ul className="space-y-2">
                  {richResult.improvements.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <AlertCircle size={13} className="text-cyan-400 mt-0.5 flex-shrink-0" />{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Cognitive Observations */}
          {richResult.observations && (
            <div className="panel rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Brain size={14} className="text-violet-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">Cognitive Observations</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(richResult.observations).map(([key, note]) => {
                  const meta = OBS_META[key];
                  if (!meta || !note) return null;
                  return (
                    <div key={key} className="flex items-start gap-3 p-3 rounded-xl"
                      style={{ background: meta.color + '10', border: `1px solid ${meta.color}25` }}>
                      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{ background: meta.color, boxShadow: `0 0 5px ${meta.color}` }} />
                      <div>
                        <div className="text-xs font-bold uppercase tracking-widest mb-0.5"
                          style={{ color: meta.color }}>{meta.label}</div>
                        <div className="text-sm text-slate-300 leading-snug">{note}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Transcript summary */}
          <div className="panel rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={14} className="text-slate-500" />
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">
                Interview Transcript ({transcriptRef.current.length} Q&amp;A pairs)
              </h3>
            </div>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {transcriptRef.current.map((item, i) => (
                <div key={item.id} className="text-xs border-b border-white/05 pb-2">
                  <div className="text-slate-500 mb-0.5">Q{i + 1}: {item.question}</div>
                  <div className="text-slate-300 pl-2">→ {item.answer}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-emerald-400 py-1 text-sm font-semibold">
            <CheckCircle2 size={16} /> Analysis saved — proceed to next step
          </div>
        </div>
      )}
    </div>
  );
};

export default AIEvaluator;