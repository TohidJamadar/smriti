# AGENTS.md — Smriti / Alzheimer's Detection Platform

> **Purpose**: This document describes all AI agents, diagnostic test modules, and automated scoring systems in the platform. Updated whenever new modules are added.

---

## Platform Overview

| Property | Value |
|---|---|
| **Stack** | React + Vite (frontend), Express + MongoDB (backend) |
| **AI Provider** | Google Gemini (via `@google/generative-ai`) |
| **Key Variable** | `VITE_GEMINI_API_KEY` (frontend), `GEMINI_API_KEY` (backend env) |
| **Key Verification** | `node scripts/check-gemini.js` |

---

## AI Agent: Clinical Neuropsychologist (AIEvaluator) — v3 Two-Stage Architecture

- **Component**: `frontend/src/components/AIEvaluator.jsx`
- **Trigger**: Question type `AI_INTERVIEW`
- **Model**: `gemini-2.5-flash-lite`

### Stage 1 — Interview Collection (No Gemini calls)
- Runs through a hardcoded `QUESTION_BANK` of **8 questions** locally.
- Each question is shown one at a time; user **must submit an answer** before the next question appears.
- Answers are accumulated in `transcriptRef` as `[{ id, domain, question, answer }]`.
- **Zero Gemini calls during questioning** — eliminates premature evaluation entirely.
- User cannot skip questions; blank submissions are rejected.

### Stage 2 — Final AI Evaluation (Single Gemini call)
- Triggered **only after all 8 questions are answered**.
- The full structured transcript is sent to Gemini in **one API call**.
- Gemini evaluates the entire conversation holistically and returns:

```json
{
  "score": 4,
  "summary": "User showed good conversational ability...",
  "strengths": ["Good communication clarity", "..."],
  "improvements": ["Attention consistency can improve", "..."],
  "observations": {
    "memory": "Good — recalled recent events accurately",
    "attention": "Moderate — some inconsistency in multi-step tasks",
    "language": "Strong — clear and coherent sentences",
    "reasoning": "Average — basic math answered correctly",
    "executive_function": "Moderate — procedural steps partially described"
  }
}
```

- **Output**: `{ type: 'AI_GRADED', score, summary, strengths, improvements, observations, transcript }`
- **Score floor**: If ≥ 5 answers given but score = 0, floors to 1.
- **Retries**: Up to 3 retries on 503/429/JSON errors with 2.5s backoff.
- **Fallback**: On total failure, awards 60% completion score with note.
- **Duplicate guard**: `evalCalledRef` prevents double evaluation on re-render.

### Question Bank (8 questions, simple Indian English)
| # | Domain | Question |
|---|---|---|
| 1 | memory | What did you eat for breakfast or lunch today? |
| 2 | daily | Can you tell me what you did yesterday from morning until evening? |
| 3 | math | If you have 20 rupees and spend 7 rupees on tea, how much is left? |
| 4 | poem | Complete: "Twinkle twinkle little star, how I wonder what you ___" |
| 5 | procedural | How do you make a cup of tea? Tell me the steps one by one. |
| 6 | attention | Remember three things: Rose, Book, and Clock. Say them back now. |
| 7 | recall | Now — what were the three things I asked you to remember? |
| 8 | social | Name a family member or friend you spoke with recently. What did you talk about? |

---

## Drawing Evaluation — AI Vision (v2)

Both `DRAWING` and `CLOCK_DRAWING` question types are now **auto-evaluated by Gemini Vision**.

- **`DrawingCanvas.jsx`** (pentagon): On `mouseup`, canvas PNG is sent to `gemini-2.5-flash-lite` vision with elderly-lenient scoring criteria.
- **`ClockDrawing.jsx`** (clock): Same pipeline; prompt includes target time for hand-position assessment.
- **Blank canvas detection**: If < 0.5% of pixels are dark, evaluation is skipped.
- **Answer type**: `{ type: 'DRAWING_GRADED', score, similarity, feedback, strengths, corrections, dataUrl }`
- **Inline result card**: Shows similarity %, score, and AI feedback immediately after drawing.
- **Retries**: 2 retries with 2s backoff; partial score awarded on total failure.
- `needsManualGrading` has been **removed from all question sets** — drawings are now fully auto-scored.

---

## Dashboard Intelligence (v2)

- **Utility**: `frontend/src/utils/dashboardAnalysis.js`
- Exports `generateDashboardNarrative(domainScores, moduleGroups)` and `generateImportantTips(domainScores)`.
- All feedback text is **dynamically generated** using actual score numbers — no hardcoded strings.
- Returns: `{ summary, strengths[], weakAreas[], tips[] }`
- Dashboard "Cognitive Summary" panel shows the full generated paragraph with actual percentages.
- Dashboard "Improvement Tips" panel shows score-conditioned, domain-specific recommendations.

---

## Diagnostic Test Modules

### Module 1 — General Cognitive Baseline (`mindcheck-full`)
| Question | Type | Auto-Scored | Points |
|---|---|---|---|
| Serial 7s (100 - 10) | `MATH_LOGIC` | ✅ | 1 |
| Visual Naming: Cat | `VISUAL_NAMING` | ✅ | 1 |
| **Intersecting Pentagons** | `DRAWING` | ✅ Gemini Vision | 3 |
| Visual Naming: Lion | `VISUAL_NAMING` | ✅ | 2 |
| Audio Dictation | `AUDIO_DICTATION` | ✅ | 3 |

> **Pentagon**: Reference renders as inline SVG (`assetType: 'pentagon_svg'`). Evaluated by Gemini Vision on `mouseup`.

---

### Module 2 — Executive Function (`executive-us-standard`)
| Question | Type | Auto-Scored | Points |
|---|---|---|---|
| Stroop: YELLOW in red ink | `STROOP_TEST` | ✅ | 3 |
| Digit Span Backwards | `DIGIT_SPAN` | ✅ | 4 |
| Stroop: BLUE in green ink | `STROOP_TEST` | ✅ | 3 |

---

### Module 3 — Spatial Dynamics (`spatial-dynamics`)
| Question | Type | Auto-Scored | Points |
|---|---|---|---|
| Pattern Memory Grid | `PATTERN_MEMORY` | ✅ | 5 |

---

### Module 4 — AI Clinical Interview (`ai-semantic`)
| Question | Type | Auto-Scored | Points |
|---|---|---|---|
| Cognitive Interview (8 Qs) | `AI_INTERVIEW` | ✅ Two-stage Gemini | 5 |

---

### Module 5 — Alzheimer's Extended Battery (`alzheimers-extended`)
| Question | Type | Component | Auto-Scored | Points |
|---|---|---|---|---|
| Delayed Word Recall | `DELAYED_RECALL` | `DelayedRecall.jsx` | ✅ | 5 |
| Verbal Fluency — Animals | `FLUENCY_TEST` | `FluencyTest.jsx` | ✅ | 5 |
| Clock Drawing Test | `CLOCK_DRAWING` | `ClockDrawing.jsx` | ✅ Gemini Vision | 3 |

#### DELAYED_RECALL Protocol
1. **Study phase** (10s): Word list displayed
2. **Distraction phase** (20s): Count backwards (interference task)
3. **Recall phase**: Free recall input, scored by word match count
- Scoring: `(wordsRecalled / totalWords) × maxPoints`

#### FLUENCY_TEST Protocol
- Category: Animals | Time: 60 seconds
- Scoring: `min(maxPoints, round((wordCount / 12) × maxPoints))`
- Minimum passing threshold: 5 words

#### CLOCK_DRAWING Protocol
- Target time varies by question set (11:10, 3:00, 7:30, etc.)
- Reference SVG renders the target clock face
- Gemini Vision evaluates circle, numbers, and hand placement
- Scoring: `{ score, similarity%, feedback, strengths, corrections }`

---

## Component Registry

| Component | Question Type(s) | Location |
|---|---|---|
| `VisualNaming`   | `VISUAL_NAMING`, `MATH_LOGIC` | `components/VisualNaming.jsx` |
| `AudioDictation` | `AUDIO_DICTATION`             | `components/AudioDictation.jsx` |
| `DrawingCanvas`  | `DRAWING`                     | `components/DrawingCanvas.jsx` |
| `StroopTask`     | `STROOP_TEST`                 | `components/StroopTask.jsx` |
| `DigitSpan`      | `DIGIT_SPAN`                  | `components/DigitSpan.jsx` |
| `PatternMemory`  | `PATTERN_MEMORY`              | `components/PatternMemory.jsx` |
| `AIEvaluator`    | `AI_INTERVIEW`                | `components/AIEvaluator.jsx` |
| `ClockDrawing`   | `CLOCK_DRAWING`               | `components/ClockDrawing.jsx` |
| `FluencyTest`    | `FLUENCY_TEST`                | `components/FluencyTest.jsx` |
| `DelayedRecall`  | `DELAYED_RECALL`              | `components/DelayedRecall.jsx` |
| `ReactionTap`    | `REACTION_TAP`                | `components/ReactionTap.jsx` |

---

## Scoring Architecture

All scoring in `TestEngine.jsx → calculateScore()`:

| Priority | Type | Method |
|---|---|---|
| 1 | `DRAWING`, `CLOCK_DRAWING` + answer type `DRAWING_GRADED` | Gemini Vision score (`rawUserAnswer.score`) |
| 2 | `DRAWING`, `CLOCK_DRAWING` with no answer | `status: skipped`, 0 pts |
| 3 | `AI_INTERVIEW` + answer type `AI_GRADED` | Gemini evaluation score (`rawUserAnswer.score`) |
| 4 | `REACTION_TAP` | Pre-graded by component |
| 5 | `PATTERN_MEMORY` | Array sorted + string compared |
| 6 | `FLUENCY_TEST` | Word count proportional |
| 7 | `DELAYED_RECALL` | Matched words proportional |
| 8 | All others | String normalisation + exact/partial match |

**Submission lock**: `isSubmittingRef` prevents double-submit on final question.

---

## Security

| Item | Status |
|---|---|
| `backend/.env` in `.gitignore` | ✅ |
| `frontend/.env` in root `.gitignore` | ✅ |
| API key verification script | `node scripts/check-gemini.js` |
| Production recommendation | Proxy Gemini calls through backend — never expose VITE_ keys in deployed builds |
