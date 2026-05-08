import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Eraser, Clock, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * ClockDrawing — Clock Drawing Test (CDT) with AI auto-evaluation
 *
 * Enhancements v2:
 *  - Gemini Vision evaluates clock face against target time
 *  - Blank-canvas detection
 *  - Inline evaluation result card
 *  - DRAWING_GRADED answer type (no longer needsManualGrading)
 */

const ClockReference = ({ targetTime }) => {
  const [hours, minutes] = (targetTime || '11:10').split(':').map(Number);
  const minuteAngle = (minutes / 60) * 360;
  const hourAngle   = ((hours % 12) / 12) * 360 + (minutes / 60) * 30;

  const toXY = (angle, length, cx = 100, cy = 100) => {
    const rad = (angle - 90) * (Math.PI / 180);
    return { x: (cx + length * Math.cos(rad)).toFixed(1), y: (cy + length * Math.sin(rad)).toFixed(1) };
  };

  const hTip = toXY(hourAngle, 48);
  const mTip = toXY(minuteAngle, 65);

  return (
    <svg viewBox="0 0 200 200" className="w-48 h-48" aria-label={`Clock showing ${targetTime}`}>
      <circle cx="100" cy="100" r="95" fill="white" stroke="#1a1a1a" strokeWidth="3" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * 360; const out = toXY(a, 85); const inn = toXY(a, 74);
        return <line key={i} x1={inn.x} y1={inn.y} x2={out.x} y2={out.y} stroke="#333" strokeWidth={i % 3 === 0 ? 3 : 1.5} strokeLinecap="round" />;
      })}
      {[12,1,2,3,4,5,6,7,8,9,10,11].map((n, i) => {
        const p = toXY((i / 12) * 360, 62);
        return <text key={n} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="bold" fill="#222">{n}</text>;
      })}
      <line x1="100" y1="100" x2={hTip.x} y2={hTip.y} stroke="#1a1a1a" strokeWidth="5" strokeLinecap="round" />
      <line x1="100" y1="100" x2={mTip.x} y2={mTip.y} stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" />
      <circle cx="100" cy="100" r="4" fill="#1a1a1a" />
    </svg>
  );
};

function isCanvasBlank(canvas) {
  const ctx  = canvas.getContext('2d');
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let nonWhite = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] < 240 || data[i+1] < 240 || data[i+2] < 240) nonWhite++;
  }
  return (nonWhite / (canvas.width * canvas.height)) < 0.005;
}

async function evaluateClockWithGemini(canvasDataUrl, targetTime, maxPoints) {
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
  const model  = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
  const base64 = canvasDataUrl.split(',')[1];

  const prompt = `You are evaluating a clock drawing submitted by a patient (possibly elderly) as part of a cognitive screening test.

Target time to draw: ${targetTime}

Evaluate the clock drawing with LENIENCY — elderly patients may have tremors or imprecise motor control:
1. Circle completeness — is a roughly circular face present?
2. Number placement — are the 12 numbers present and roughly in correct positions?
3. Hand presence — are two hands drawn?
4. Correct time — does the hour hand point near the ${targetTime.split(':')[0]} position, and the minute hand near the ${targetTime.split(':')[1] === '00' ? '12' : Math.round(parseInt(targetTime.split(':')[1]) / 5)} position?
5. Overall organisation — is the clock recognisable?

Scoring (max = ${maxPoints}):
- ${maxPoints} pts: Circle, all 12 numbers visible, hands correctly indicate ${targetTime}
- ${Math.round(maxPoints * 0.75)} pts: Good attempt — circle + most numbers + hands drawn (time may be slightly off)
- ${Math.round(maxPoints * 0.5)} pts: Circle present, some numbers, hands present but time incorrect
- ${Math.round(maxPoints * 0.25)} pts: Partial attempt — some elements visible
- 1 pt: Minimal drawing — clock intent is present but incomplete

Be generous — give credit for clear effort and intent.

Respond ONLY in this JSON format (no markdown):
{
  "score": <integer 0-${maxPoints}>,
  "similarity": <integer 0-100 representing how well the clock matches the target>,
  "feedback": "<one encouraging sentence about the drawing>",
  "strengths": "<what was drawn correctly>",
  "corrections": "<what could be improved, stated gently>"
}`;

  const result = await model.generateContent([
    prompt,
    { inlineData: { mimeType: 'image/png', data: base64 } },
  ]);

  let text = result.response.text().replace(/```json/gi, '').replace(/```/g, '').trim();
  return JSON.parse(text);
}

// ─────────────────────────────────────────────────────────────────────────────
const ClockDrawing = ({ question, onAnswer }) => {
  const canvasRef  = useRef(null);
  const [isDrawing,    setIsDrawing]    = useState(false);
  const [hasDrawn,     setHasDrawn]     = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult,   setEvalResult]   = useState(null);
  const [evalError,    setEvalError]    = useState('');
  const targetTime = question.targetTime || '11:10';

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Faint guide circle
    ctx.beginPath();
    ctx.arc(175, 175, 155, 0, Math.PI * 2);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineWidth = 3;
    ctx.lineCap   = 'round';
    ctx.strokeStyle = '#1e293b';
  }, []);

  const startDrawing = ({ nativeEvent }) => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(nativeEvent.offsetX, nativeEvent.offsetY);
    setIsDrawing(true);
    setHasDrawn(true);
    setEvalResult(null);
    setEvalError('');
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(nativeEvent.offsetX, nativeEvent.offsetY);
    ctx.stroke();
  };

  const stopDrawing = useCallback(async () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (isCanvasBlank(canvas)) {
      setHasDrawn(false);
      onAnswer(null);
      return;
    }

    const dataUrl = canvas.toDataURL('image/png');
    setIsEvaluating(true);
    setEvalError('');

    let retries = 2;
    while (retries >= 0) {
      try {
        const result = await evaluateClockWithGemini(dataUrl, targetTime, question.points || 3);
        setEvalResult(result);
        onAnswer({
          type:        'DRAWING_GRADED',
          score:       result.score,
          similarity:  result.similarity,
          feedback:    result.feedback,
          strengths:   result.strengths,
          corrections: result.corrections,
          dataUrl,
        });
        break;
      } catch (err) {
        if (retries === 0) {
          console.error('Clock evaluation failed:', err);
          setEvalError('Auto-evaluation unavailable. Your drawing has been saved.');
          onAnswer({ type: 'DRAWING_GRADED', score: Math.round((question.points || 3) * 0.5), similarity: 50, feedback: 'Drawing saved with default partial score.', dataUrl });
        } else {
          await new Promise(r => setTimeout(r, 2000));
        }
        retries--;
      }
    }
    setIsEvaluating(false);
  }, [isDrawing, question, targetTime, onAnswer]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.arc(175, 175, 155, 0, Math.PI * 2);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    setHasDrawn(false);
    setEvalResult(null);
    setEvalError('');
    onAnswer(null);
  };

  const simColor = evalResult
    ? evalResult.similarity >= 70 ? '#10b981'
    : evalResult.similarity >= 45 ? '#f59e0b'
    : '#ef4444'
    : '#22d3ee';

  return (
    <div className="flex flex-col items-center gap-6 animate-fade-in w-full">
      <div className="flex flex-col lg:flex-row items-center justify-center gap-10 w-full">

        {/* Reference */}
        <div className="bg-white/80 border border-slate-200 p-6 rounded-2xl flex flex-col items-center shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-slate-400" />
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-widest">Target Time</h3>
          </div>
          <ClockReference targetTime={targetTime} />
          <p className="text-xs text-slate-500 mt-3 text-center font-mono font-bold text-lg">{targetTime}</p>
          <p className="text-xs text-slate-400 mt-1 text-center max-w-[14rem]">Draw this clock face on the canvas →</p>
        </div>

        {/* Canvas */}
        <div className="relative group">
          <canvas
            ref={canvasRef} width={350} height={350}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="bg-white border border-slate-200 rounded-2xl shadow-xl cursor-crosshair touch-none"
          />
          <button onClick={clearCanvas}
            className="absolute -top-4 -right-4 bg-red-50 text-red-500 border border-red-200 p-3 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-md"
            title="Clear Canvas">
            <Eraser size={20} />
          </button>
        </div>
      </div>

      {/* Evaluating indicator */}
      {isEvaluating && (
        <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm font-medium">
          <Loader2 size={16} className="animate-spin flex-shrink-0" />
          AI is evaluating your clock drawing...
        </div>
      )}

      {evalError && (
        <div className="flex items-center gap-2 text-amber-400 text-sm px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <AlertCircle size={15} className="flex-shrink-0" /> {evalError}
        </div>
      )}

      {/* Evaluation result */}
      {evalResult && !isEvaluating && (
        <div className="w-full max-w-lg panel rounded-2xl p-5 space-y-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: simColor }} />
            <span className="text-sm font-bold text-white uppercase tracking-widest">AI Clock Evaluation</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-3xl font-black tabular-nums" style={{ color: simColor }}>
                {evalResult.score}<span className="text-lg text-slate-500">/{question.points || 3}</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest">Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black tabular-nums" style={{ color: simColor }}>{evalResult.similarity}%</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest">Accuracy</div>
            </div>
            <div className="flex-grow">
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${evalResult.similarity}%`, background: simColor }} />
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">{evalResult.feedback}</p>
          {evalResult.strengths && (
            <div className="flex items-start gap-2 text-xs text-emerald-400">
              <CheckCircle2 size={13} className="mt-0.5 flex-shrink-0" /><span>{evalResult.strengths}</span>
            </div>
          )}
          {evalResult.corrections && (
            <div className="flex items-start gap-2 text-xs text-amber-400">
              <AlertCircle size={13} className="mt-0.5 flex-shrink-0" /><span>{evalResult.corrections}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClockDrawing;
