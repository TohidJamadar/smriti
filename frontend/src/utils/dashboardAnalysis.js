/**
 * dashboardAnalysis.js
 * Centralized utility that generates dynamic, data-driven narrative feedback
 * for the Smriti dashboard. All text is conditionally generated from actual
 * domain scores — no hardcoded generic sentences.
 *
 * Usage:
 *   import { generateDashboardNarrative } from '../utils/dashboardAnalysis';
 *   const narrative = generateDashboardNarrative(domainScores, moduleGroups);
 */

// ── Thresholds ─────────────────────────────────────────────────────────────────
const T = { STRONG: 75, GOOD: 60, MODERATE: 45, WEAK: 0 };

// ── Domain display names ───────────────────────────────────────────────────────
const DOMAIN_LABELS = {
  Memory:    'memory',
  Attention: 'attention',
  Language:  'language & communication',
  Executive: 'executive function',
  Spatial:   'spatial reasoning',
  Reaction:  'reaction speed',
};

/**
 * Classify a score into a tier label.
 * @param {number} score  0-100
 * @returns {'strong'|'good'|'moderate'|'developing'|'untested'}
 */
function tier(score) {
  if (score === 0)      return 'untested';
  if (score >= T.STRONG) return 'strong';
  if (score >= T.GOOD)   return 'good';
  if (score >= T.MODERATE) return 'moderate';
  return 'developing';
}

/**
 * Build a human-readable score phrase.
 * e.g. "Memory performed strongly at 82%"
 */
function scorePhraseFor(domain, score) {
  const label = DOMAIN_LABELS[domain] || domain.toLowerCase();
  const t = tier(score);
  if (t === 'strong')    return `${label} performed strongly at ${score}%`;
  if (t === 'good')      return `${label} showed good performance at ${score}%`;
  if (t === 'moderate')  return `${label} was moderate at ${score}%`;
  if (t === 'developing') return `${label} scored ${score}% — an area that can benefit from practice`;
  return null;
}

/**
 * Generate an improvement tip specific to a domain and its score.
 */
function tipFor(domain, score) {
  const tips = {
    Memory: [
      `Memory scored ${score}% — try daily word-recall exercises, spaced repetition, and short story retelling to strengthen episodic memory.`,
      `Memory is at ${score}%. Reading a paragraph and summarising it later each day is a simple and effective exercise.`,
    ],
    Attention: [
      `Attention scored ${score}%. Mindfulness breathing (5 minutes daily) and focused reading without distractions can meaningfully improve sustained attention.`,
      `Attention is at ${score}% — consider structured focus sessions (20-minute work blocks) to build concentration stamina.`,
    ],
    Language: [
      `Language ability is at ${score}%. Reading aloud, crossword puzzles, and word-association games are excellent ways to maintain and improve verbal fluency.`,
      `Language scored ${score}%. Engaging in regular conversation, storytelling, or journaling strengthens language networks.`,
    ],
    Executive: [
      `Executive function scored ${score}%. Planning-based activities like cooking from a recipe, organising tasks by priority, and strategic games (chess, sudoku) are highly beneficial.`,
      `Executive function is at ${score}% — practice multi-step planning tasks or try puzzle-solving games that require rule-following.`,
    ],
    Spatial: [
      `Spatial reasoning is at ${score}%. Drawing, jigsaw puzzles, and 3D construction activities engage visuospatial networks effectively.`,
      `Spatial ability scored ${score}%. Navigation exercises (reading a map, memorising directions) and building blocks can sharpen spatial cognition.`,
    ],
    Reaction: [
      `Reaction speed scored ${score}%. Simple hand-eye coordination games, ball-catching drills, or reflex-based apps can improve processing speed over time.`,
      `Reaction time is at ${score}%. Regular light physical activity with coordination components (table tennis, rhythmic clapping) is beneficial.`,
    ],
  };
  const pool = tips[domain] || [`${DOMAIN_LABELS[domain] || domain} scored ${score}% and could benefit from regular cognitive exercise.`];
  // Pick deterministically based on score to keep it consistent per user
  return pool[score % pool.length];
}

/**
 * Generate the overall summary paragraph.
 * Uses actual tested domain names and scores in the text.
 */
function buildSummary(tested, strengths, weakAreas, avg) {
  const testedCount = tested.length;
  if (testedCount === 0) {
    return 'No cognitive domains have been assessed yet. Complete at least one test module to generate your personalised cognitive summary.';
  }

  const strongNames = strengths.map(([d]) => DOMAIN_LABELS[d] || d.toLowerCase());
  const weakNames   = weakAreas.map(([d]) => DOMAIN_LABELS[d] || d.toLowerCase());

  let summary = '';

  // Opening sentence — mention overall average
  if (avg >= T.STRONG) {
    summary += `Overall cognitive performance is strong, with an average domain score of ${avg}% across ${testedCount} assessed area${testedCount > 1 ? 's' : ''}. `;
  } else if (avg >= T.GOOD) {
    summary += `Cognitive performance is generally good at an average of ${avg}% across ${testedCount} assessed area${testedCount > 1 ? 's' : ''}. `;
  } else if (avg >= T.MODERATE) {
    summary += `Cognitive performance is moderate with an average of ${avg}% across ${testedCount} assessed area${testedCount > 1 ? 's' : ''}. `;
  } else {
    summary += `Cognitive performance averages ${avg}% across ${testedCount} assessed area${testedCount > 1 ? 's' : ''}. `;
  }

  // Middle — mention strengths
  if (strongNames.length > 0) {
    if (strongNames.length === 1) {
      summary += `${capitalise(strongNames[0])} is a clear cognitive strength. `;
    } else {
      const last = strongNames.pop();
      summary += `${capitalise(strongNames.join(', '))} and ${last} are clear cognitive strengths. `;
    }
  }

  // Closing — mention weak areas or encourage
  if (weakNames.length > 0) {
    if (weakNames.length === 1) {
      summary += `${capitalise(weakNames[0])} shows the most room for growth and would benefit from targeted practice.`;
    } else {
      const last = [...weakNames].pop();
      summary += `${capitalise(weakNames.slice(0, -1).join(', '))} and ${last} show the most room for growth through consistent practice.`;
    }
  } else if (testedCount > 0) {
    summary += 'All assessed domains are performing at a satisfactory level — keep maintaining these healthy cognitive habits.';
  }

  return summary;
}

function capitalise(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ── Main export ────────────────────────────────────────────────────────────────

/**
 * generateDashboardNarrative
 * @param {Object} domainScores  e.g. { Memory: 72, Attention: 45, ... }
 * @param {Object} moduleGroups  e.g. { 'mindcheck-full': [...results] }
 * @returns {{ summary: string, strengths: string[], weakAreas: string[], tips: string[] }}
 */
export function generateDashboardNarrative(domainScores, moduleGroups) {
  // Only consider domains that have been actually tested (score > 0)
  const tested    = Object.entries(domainScores).filter(([, v]) => v > 0);
  const strengths = tested.filter(([, v]) => v >= T.STRONG);   // ≥ 75%
  const good      = tested.filter(([, v]) => v >= T.GOOD && v < T.STRONG);
  const weakAreas = tested.filter(([, v]) => v < T.MODERATE);  // < 45%
  const developing = tested.filter(([, v]) => v >= T.MODERATE && v < T.GOOD);

  const avg = tested.length
    ? Math.round(tested.reduce((s, [, v]) => s + v, 0) / tested.length)
    : 0;

  // ── Summary paragraph ───────────────────────────────────────────────────
  const summary = buildSummary(tested, strengths, weakAreas, avg);

  // ── Strength strings ────────────────────────────────────────────────────
  const strengthStrings = strengths.map(([d, v]) => {
    const label = DOMAIN_LABELS[d] || d;
    return `${capitalise(label)} is a strong area at ${v}% — this is an excellent result worth maintaining.`;
  });

  // Add "good" domains as moderate strengths if no strong ones
  if (strengthStrings.length === 0 && good.length > 0) {
    good.slice(0, 2).forEach(([d, v]) => {
      strengthStrings.push(`${capitalise(DOMAIN_LABELS[d] || d)} shows good performance at ${v}%.`);
    });
  }

  // ── Weak area descriptions ──────────────────────────────────────────────
  const weakAreaStrings = weakAreas.map(([d, v]) => {
    const label = DOMAIN_LABELS[d] || d;
    return `${capitalise(label)} scored ${v}% — focused practice in this area is recommended.`;
  });

  // Include developing areas as mild notices
  developing.slice(0, 2).forEach(([d, v]) => {
    weakAreaStrings.push(`${capitalise(DOMAIN_LABELS[d] || d)} is moderate at ${v}% — room for improvement exists.`);
  });

  // ── Specific improvement tips ───────────────────────────────────────────
  // Prioritise weak first, then developing
  const tipDomains = [
    ...weakAreas,
    ...developing,
    ...good, // give tips for good too if nothing else
  ].slice(0, 3);

  const tips = tipDomains.map(([d, v]) => tipFor(d, v));

  // Fallback if nothing to tip
  if (tips.length === 0 && strengths.length > 0) {
    tips.push('All tested cognitive domains are performing well. Continue with regular mental and physical activity to maintain these results.');
  }

  return { summary, strengths: strengthStrings, weakAreas: weakAreaStrings, tips };
}

/**
 * generateImportantTips
 * Lightweight version — returns 2-3 bullet tips for the dashboard tips panel.
 * @param {Object} domainScores
 * @returns {string[]}
 */
export function generateImportantTips(domainScores) {
  const tested = Object.entries(domainScores).filter(([, v]) => v > 0);
  if (!tested.length) return ['Complete your first test module to unlock personalised improvement tips.'];

  const sorted = [...tested].sort((a, b) => a[1] - b[1]); // ascending — weakest first
  return sorted.slice(0, 3).map(([d, v]) => tipFor(d, v));
}
