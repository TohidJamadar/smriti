import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Eraser, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * IntersectingPentagons — Inline SVG reference image.
 */
const IntersectingPentagons = () => {
  const pentagonPoints = (cx, cy, r) =>
    Array.from({ length: 5 }, (_, i) => {
      const angle = (2 * Math.PI * i) / 5 - Math.PI / 2;
      return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`;
    }).join(' ');

  const pts1 = pentagonPoints(110, 125, 80);
  const pts2 = pentagonPoints(170, 125, 80);

  return (
    <svg viewBox="0 0 280 250" className="w-56 h-56" aria-label="Two intersecting pentagons — draw this shape">
      <rect width="280" height="250" fill="white" />
      <polygon points={pts1} fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points={pts2} fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
};

// ── Blank-canvas detector ─────────────────────────────────────────────────────
// Returns true if >98% of pixels are white (or near-white) = nothing drawn
function isCanvasBlank(canvas) {
  const ctx  = canvas.getContext('2d');
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let nonWhite = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (r < 240 || g < 240 || b < 240) nonWhite++;
  }
  const total = canvas.width * canvas.height;
  return (nonWhite / total) < 0.005; // less than 0.5% dark pixels = blank
}

// ── Gemini Vision evaluator ───────────────────────────────────────────────────
async function evaluateDrawingWithGemini(canvasDataUrl, referenceDescription, maxPoints) {
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
  const model  = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

  // Strip the data URL prefix to get raw base64
  const base64 = canvasDataUrl.split(',')[1];

  const prompt = `You are evaluating a hand-drawn image submitted by a patient (possibly elderly) as part of a cognitive assessment.

Reference shape: ${referenceDescription}

Evaluate the user's drawing on these criteria and be LENIENT — elderly users may have tremors or imprecise motor control:
1. Shape similarity — does the overall form match the reference?
2. Stroke completeness — are all required lines/shapes present?
3. Proportions — are the sizes and positions roughly correct?
4. Line continuity — are strokes connected and continuous?
5. Missing parts — what key elements are absent?

Scoring guide (max = ${maxPoints} points):
- ${maxPoints} pts: Excellent match, all major elements present
- ${Math.round(maxPoints * 0.75)} pts: Good attempt, minor inaccuracies
- ${Math.round(maxPoints * 0.5)} pts: Recognisable shape, notable errors
- ${Math.round(maxPoints * 0.25)} pts: Partial attempt, significant missing elements
- 1 pt: Minimal attempt, few elements visible

IMPORTANT: Give credit for effort. Even imperfect elderly drawings deserve points if the intent is clear.

Respond ONLY in this exact JSON format — no markdown, no explanation:
{
  "score": <integer 0-${maxPoints}>,
  "similarity": <integer 0-100 representing percentage match>,
  "feedback": "<one encouraging sentence about the drawing quality>",
  "strengths": "<what was drawn well>",
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
const DrawingCanvas = ({ question, onAnswer }) => {
  const canvasRef  = useRef(null);
  const [isDrawing,    setIsDrawing]    = useState(false);
  const [hasDrawn,     setHasDrawn]     = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult,   setEvalResult]   = useState(null); // { score, similarity, feedback, strengths, corrections }
  const [evalError,    setEvalError]    = useState('');

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    ctx.fillStyle   = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth   = 3;
    ctx.lineCap     = 'round';
    ctx.strokeStyle = '#222222';
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect   = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX || e.nativeEvent?.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY || e.nativeEvent?.clientY;
    return { offsetX: clientX - rect.left, offsetY: clientY - rect.top };
  };

  const startDrawing = (e) => {
    const { offsetX, offsetY } = e.nativeEvent || getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    setIsDrawing(true);
    setHasDrawn(true);
    setEvalResult(null);
    setEvalError('');
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = e.nativeEvent || getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const stopDrawing = useCallback(async () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;

    // If canvas is blank, report empty and skip Gemini
    if (isCanvasBlank(canvas)) {
      setHasDrawn(false);
      onAnswer(null);
      return;
    }

    const dataUrl = canvas.toDataURL('image/png');

    // Begin Gemini evaluation
    setIsEvaluating(true);
    setEvalError('');

    const referenceDescription = question.assetType === 'pentagon_svg'
      ? 'Two overlapping regular pentagons side by side, sharing a central intersection region. Each pentagon has 5 equal sides.'
      : (question.referenceDescription || 'A geometric shape as shown in the reference image.');

    let retries = 2;
    while (retries >= 0) {
      try {
        const result = await evaluateDrawingWithGemini(dataUrl, referenceDescription, question.points || 3);
        setEvalResult(result);
        onAnswer({
          type:       'DRAWING_GRADED',
          score:      result.score,
          similarity: result.similarity,
          feedback:   result.feedback,
          strengths:  result.strengths,
          corrections: result.corrections,
          dataUrl,
        });
        break;
      } catch (err) {
        if (retries === 0) {
          console.error('Drawing evaluation failed:', err);
          setEvalError('Auto-evaluation unavailable. Your drawing has been saved for review.');
          // Fallback: save dataUrl without score so at least it persists
          onAnswer({ type: 'DRAWING_GRADED', score: Math.round((question.points || 3) * 0.5), similarity: 50, feedback: 'Drawing saved — evaluated with default partial score.', dataUrl });
        } else {
          await new Promise(r => setTimeout(r, 2000));
        }
        retries--;
      }
    }

    setIsEvaluating(false);
  }, [isDrawing, question, onAnswer]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth   = 3;
    ctx.lineCap     = 'round';
    ctx.strokeStyle = '#222222';
    setHasDrawn(false);
    setEvalResult(null);
    setEvalError('');
    onAnswer(null);
  };

  const renderReference = () => {
    if (question.assetType === 'pentagon_svg') return <IntersectingPentagons />;
    if (question.assetUrl) {
      return (
        <img src={question.assetUrl} alt="Reference" className="w-56 h-56 object-contain opacity-80"
          onError={e => { e.target.style.display = 'none'; }} />
      );
    }
    return null;
  };

  // Similarity colour
  const simColor = evalResult
    ? evalResult.similarity >= 70 ? '#10b981'
    : evalResult.similarity >= 45 ? '#f59e0b'
    : '#ef4444'
    : '#8b5cf6';

  return (
    <div className="flex flex-col items-center gap-6 animate-fade-in w-full">
      <div className="flex flex-col lg:flex-row items-center justify-center gap-10 w-full">

        {/* Reference */}
        <div className="bg-white/80 border border-slate-200 p-6 rounded-2xl flex flex-col items-center shadow-xl">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-4">Reference</h3>
          {renderReference()}
          <p className="text-xs text-slate-400 mt-3 text-center max-w-[14rem]">
            Reproduce this shape as accurately as possible
          </p>
        </div>

        {/* Canvas */}
        <div className="relative group">
          <canvas
            ref={canvasRef}
            width={350} height={350}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="bg-white border border-slate-200 rounded-2xl shadow-xl cursor-crosshair touch-none group-hover:border-slate-300 transition-colors"
          />
          <button onClick={clearCanvas}
            className="absolute -top-4 -right-4 bg-red-50 text-red-500 border border-red-200 p-3 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-md"
            title="Clear Canvas">
            <Eraser size={20} />
          </button>
        </div>
      </div>

      {/* Evaluation status */}
      {isEvaluating && (
        <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm font-medium">
          <Loader2 size={16} className="animate-spin flex-shrink-0" />
          AI is evaluating your drawing...
        </div>
      )}

      {evalError && (
        <div className="flex items-center gap-2 text-amber-400 text-sm px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <AlertCircle size={15} className="flex-shrink-0" /> {evalError}
        </div>
      )}

      {/* Evaluation result card */}
      {evalResult && !isEvaluating && (
        <div className="w-full max-w-lg panel rounded-2xl p-5 space-y-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: simColor }} />
            <span className="text-sm font-bold text-white uppercase tracking-widest">AI Drawing Evaluation</span>
          </div>

          {/* Score + similarity */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-3xl font-black tabular-nums" style={{ color: simColor }}>
                {evalResult.score}<span className="text-lg text-slate-500">/{question.points || 3}</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest">Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black tabular-nums" style={{ color: simColor }}>
                {evalResult.similarity}%
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest">Similarity</div>
            </div>
            <div className="flex-grow">
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${evalResult.similarity}%`, background: simColor }} />
              </div>
            </div>
          </div>

          {/* Feedback text */}
          <p className="text-sm text-slate-300 leading-relaxed">{evalResult.feedback}</p>

          {evalResult.strengths && (
            <div className="flex items-start gap-2 text-xs text-emerald-400">
              <CheckCircle2 size={13} className="mt-0.5 flex-shrink-0" />
              <span>{evalResult.strengths}</span>
            </div>
          )}
          {evalResult.corrections && (
            <div className="flex items-start gap-2 text-xs text-amber-400">
              <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
              <span>{evalResult.corrections}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DrawingCanvas;