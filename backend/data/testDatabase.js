/**
 * testDatabase.js
 * Each module now has a `questionSets` array (5 unique sets).
 * The server picks one randomly per API call and returns it as `questions`.
 * Existing `questions` field kept for backwards compatibility.
 *
 * NEW in this version:
 *  - 5 question sets per module
 *  - Progressive difficulty for PATTERN_MEMORY (displayTime decreases)
 *  - REACTION_TAP question type for spatial module
 *  - Extended FLUENCY_TEST, DELAYED_RECALL, STROOP, DIGIT_SPAN variety
 */

// ─── MODULE 1: General Cognitive Baseline — 5 sets ──────────────────────────
const mindcheckSets = [
  // Set A
  [
    { id: 'q1a', type: 'MATH_LOGIC', instruction: 'Start at 100 and subtract 7. What is the result?', correctAnswer: '93', points: 1, penalty: 0 },
    { id: 'q2a', type: 'VISUAL_NAMING', instruction: 'Identify this animal.', assetUrl: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=687&auto=format&fit=crop', correctAnswer: 'cat', points: 1, penalty: -1 },
    { id: 'q3a', type: 'DRAWING', instruction: 'Replicate the intersecting pentagons exactly as shown.', assetType: 'pentagon_svg', aiGraded: true, points: 3 },
    { id: 'q4a', type: 'VISUAL_NAMING', instruction: 'Identify this animal.', assetUrl: 'https://images.unsplash.com/photo-1614027164847-1b28cfe1df60?auto=format&fit=crop&w=600&q=80', correctAnswer: 'lion', points: 2, penalty: -1 },
    { id: 'q5a', type: 'AUDIO_DICTATION', instruction: 'Listen carefully and type exactly what you hear.', spokenText: 'The quick brown fox jumps over the lazy dog.', correctAnswer: 'the quick brown fox jumps over the lazy dog', points: 3, penalty: -1 },
  ],
  // Set B
  [
    { id: 'q1b', type: 'MATH_LOGIC', instruction: 'Start at 50 and add 13. What is the result?', correctAnswer: '63', points: 1, penalty: 0 },
    { id: 'q2b', type: 'VISUAL_NAMING', instruction: 'What bird is shown in this image?', assetUrl: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?auto=format&fit=crop&w=600&q=80', correctAnswer: 'parrot', points: 1, penalty: -1 },
    { id: 'q3b', type: 'DRAWING', instruction: 'Replicate the intersecting pentagons exactly as shown.', assetType: 'pentagon_svg', aiGraded: true, points: 3 },
    { id: 'q4b', type: 'VISUAL_NAMING', instruction: 'Identify this animal.', assetUrl: 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=600&q=80', correctAnswer: 'fox', points: 2, penalty: -1 },
    { id: 'q5b', type: 'AUDIO_DICTATION', instruction: 'Listen carefully and type exactly what you hear.', spokenText: 'A rolling stone gathers no moss.', correctAnswer: 'a rolling stone gathers no moss', points: 3, penalty: -1 },
  ],
  // Set C
  [
    { id: 'q1c', type: 'MATH_LOGIC', instruction: 'What is 15 multiplied by 4?', correctAnswer: '60', points: 1, penalty: 0 },
    { id: 'q2c', type: 'VISUAL_NAMING', instruction: 'Name this large animal.', assetUrl: 'https://images.unsplash.com/photo-1567608285969-48e4bbe0d399?auto=format&fit=crop&w=600&q=80', correctAnswer: 'elephant', points: 1, penalty: -1 },
    { id: 'q3c', type: 'DRAWING', instruction: 'Replicate the intersecting pentagons exactly as shown.', assetType: 'pentagon_svg', aiGraded: true, points: 3 },
    { id: 'q4c', type: 'VISUAL_NAMING', instruction: 'Identify this animal.', assetUrl: 'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?auto=format&fit=crop&w=600&q=80', correctAnswer: 'turtle', points: 2, penalty: -1 },
    { id: 'q5c', type: 'AUDIO_DICTATION', instruction: 'Listen carefully and type exactly what you hear.', spokenText: 'She sells sea shells by the sea shore.', correctAnswer: 'she sells sea shells by the sea shore', points: 3, penalty: -1 },
  ],
  // Set D
  [
    { id: 'q1d', type: 'MATH_LOGIC', instruction: 'Start at 200 and subtract 75. What is the result?', correctAnswer: '125', points: 1, penalty: 0 },
    { id: 'q2d', type: 'VISUAL_NAMING', instruction: 'What animal is this?', assetUrl: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?auto=format&fit=crop&w=600&q=80', correctAnswer: 'rabbit', points: 1, penalty: -1 },
    { id: 'q3d', type: 'DRAWING', instruction: 'Replicate the intersecting pentagons exactly as shown.', assetType: 'pentagon_svg', aiGraded: true, points: 3 },
    { id: 'q4d', type: 'VISUAL_NAMING', instruction: 'Identify this large animal.', assetUrl: 'https://images.unsplash.com/photo-1525382455947-f319bc05fb35?auto=format&fit=crop&w=600&q=80', correctAnswer: 'giraffe', points: 2, penalty: -1 },
    { id: 'q5d', type: 'AUDIO_DICTATION', instruction: 'Listen carefully and type exactly what you hear.', spokenText: 'Time and tide wait for no man.', correctAnswer: 'time and tide wait for no man', points: 3, penalty: -1 },
  ],
  // Set E
  [
    { id: 'q1e', type: 'MATH_LOGIC', instruction: 'What is 9 squared?', correctAnswer: '81', points: 1, penalty: 0 },
    { id: 'q2e', type: 'VISUAL_NAMING', instruction: 'Identify this black and white animal.', assetUrl: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?auto=format&fit=crop&w=600&q=80', correctAnswer: 'panda', points: 1, penalty: -1 },
    { id: 'q3e', type: 'DRAWING', instruction: 'Replicate the intersecting pentagons exactly as shown.', assetType: 'pentagon_svg', aiGraded: true, points: 3 },
    { id: 'q4e', type: 'VISUAL_NAMING', instruction: 'What striped animal is this?', assetUrl: 'https://images.unsplash.com/photo-1551969014-7d2c4cddf0b6?auto=format&fit=crop&w=600&q=80', correctAnswer: 'zebra', points: 2, penalty: -1 },
    { id: 'q5e', type: 'AUDIO_DICTATION', instruction: 'Listen carefully and type exactly what you hear.', spokenText: 'Practice makes a man perfect.', correctAnswer: 'practice makes a man perfect', points: 3, penalty: -1 },
  ],
];

// ─── MODULE 2: Executive Function — 5 sets ──────────────────────────────────
const executiveSets = [
  // Set A
  [
    { id: 'e1a', type: 'STROOP_TEST', instruction: 'Type the COLOR of the ink, NOT the word.', wordText: 'YELLOW', hexColor: '#EF4444', correctAnswer: 'red', points: 3, penalty: -2 },
    { id: 'e2a', type: 'DIGIT_SPAN', instruction: 'Listen to the digits. Type them BACKWARDS.', spokenText: '2, 4, 7, 9', correctAnswer: '9742', points: 4, penalty: -1 },
    { id: 'e3a', type: 'STROOP_TEST', instruction: 'Type the COLOR of the ink, NOT the word.', wordText: 'BLUE', hexColor: '#A3E635', correctAnswer: 'green', points: 3, penalty: -2 },
  ],
  // Set B
  [
    { id: 'e1b', type: 'STROOP_TEST', instruction: 'Type the COLOR of the ink, NOT the word.', wordText: 'GREEN', hexColor: '#F59E0B', correctAnswer: 'yellow', points: 3, penalty: -2 },
    { id: 'e2b', type: 'DIGIT_SPAN', instruction: 'Listen to the digits. Type them BACKWARDS.', spokenText: '3, 8, 1, 5', correctAnswer: '5183', points: 4, penalty: -1 },
    { id: 'e3b', type: 'STROOP_TEST', instruction: 'Type the COLOR of the ink, NOT the word.', wordText: 'RED', hexColor: '#22D3EE', correctAnswer: 'cyan', points: 3, penalty: -2 },
  ],
  // Set C
  [
    { id: 'e1c', type: 'STROOP_TEST', instruction: 'Type the COLOR of the ink, NOT the word.', wordText: 'PURPLE', hexColor: '#10B981', correctAnswer: 'green', points: 3, penalty: -2 },
    { id: 'e2c', type: 'DIGIT_SPAN', instruction: 'Listen to the digits. Type them BACKWARDS.', spokenText: '6, 2, 9, 4, 1', correctAnswer: '14926', points: 4, penalty: -1 },
    { id: 'e3c', type: 'STROOP_TEST', instruction: 'Type the COLOR of the ink, NOT the word.', wordText: 'ORANGE', hexColor: '#8B5CF6', correctAnswer: 'purple', points: 3, penalty: -2 },
  ],
  // Set D
  [
    { id: 'e1d', type: 'STROOP_TEST', instruction: 'Type the COLOR of the ink, NOT the word.', wordText: 'BLACK', hexColor: '#FB7185', correctAnswer: 'pink', points: 3, penalty: -2 },
    { id: 'e2d', type: 'DIGIT_SPAN', instruction: 'Listen to the digits. Type them BACKWARDS.', spokenText: '7, 3, 5, 2', correctAnswer: '2537', points: 4, penalty: -1 },
    { id: 'e3d', type: 'STROOP_TEST', instruction: 'Type the COLOR of the ink, NOT the word.', wordText: 'WHITE', hexColor: '#F97316', correctAnswer: 'orange', points: 3, penalty: -2 },
  ],
  // Set E
  [
    { id: 'e1e', type: 'STROOP_TEST', instruction: 'Type the COLOR of the ink, NOT the word.', wordText: 'CYAN', hexColor: '#EF4444', correctAnswer: 'red', points: 3, penalty: -2 },
    { id: 'e2e', type: 'DIGIT_SPAN', instruction: 'Listen to the digits. Type them BACKWARDS.', spokenText: '4, 1, 8, 6, 3', correctAnswer: '36814', points: 4, penalty: -1 },
    { id: 'e3e', type: 'STROOP_TEST', instruction: 'Type the COLOR of the ink, NOT the word.', wordText: 'PINK', hexColor: '#A3E635', correctAnswer: 'green', points: 3, penalty: -2 },
  ],
];

// ─── MODULE 3: Spatial & Reaction Dynamics — 5 sets ─────────────────────────
// Progressive difficulty: displayTime decreases each PATTERN_MEMORY question (8→7→6s)
const spatialSets = [
  // Set A
  [
    { id: 's1a', type: 'PATTERN_MEMORY', instruction: 'Memorize the glowing tiles. Recall the pattern when they hide.', targetPattern: [0, 4, 6, 8], displayTime: 8000, points: 3, penalty: -1 },
    { id: 's2a', type: 'REACTION_TAP', instruction: 'A target will appear — tap it as fast as you can!', targetColor: '#22d3ee', distractorColors: ['#ef4444', '#a3e635'], rounds: 3, points: 4, penalty: 0 },
    { id: 's3a', type: 'PATTERN_MEMORY', instruction: 'A harder pattern! Memorize and recall it.', targetPattern: [1, 3, 5, 7, 8], displayTime: 7000, points: 4, penalty: -1 },
    { id: 's4a', type: 'REACTION_TAP', instruction: 'Tap only the BLUE target — ignore all other colors!', targetColor: '#3b82f6', distractorColors: ['#ef4444', '#f59e0b', '#10b981'], rounds: 4, points: 5, penalty: 0 },
    { id: 's5a', type: 'PATTERN_MEMORY', instruction: 'Expert level! Memorize this complex pattern.', targetPattern: [0, 2, 4, 6, 7, 8], displayTime: 6000, points: 5, penalty: -2 },
  ],
  // Set B
  [
    { id: 's1b', type: 'PATTERN_MEMORY', instruction: 'Memorize the glowing tiles. Recall the pattern when they hide.', targetPattern: [2, 3, 6, 7], displayTime: 8000, points: 3, penalty: -1 },
    { id: 's2b', type: 'REACTION_TAP', instruction: 'A target will appear — tap it as fast as you can!', targetColor: '#a3e635', distractorColors: ['#8b5cf6', '#fb7185'], rounds: 3, points: 4, penalty: 0 },
    { id: 's3b', type: 'PATTERN_MEMORY', instruction: 'A harder pattern! Memorize and recall it.', targetPattern: [0, 1, 4, 5, 8], displayTime: 7000, points: 4, penalty: -1 },
    { id: 's4b', type: 'REACTION_TAP', instruction: 'Tap only the GREEN target — ignore all other colors!', targetColor: '#10b981', distractorColors: ['#ef4444', '#8b5cf6', '#fb7185'], rounds: 4, points: 5, penalty: 0 },
    { id: 's5b', type: 'PATTERN_MEMORY', instruction: 'Expert level! Memorize this complex pattern.', targetPattern: [1, 2, 3, 5, 6, 7], displayTime: 6000, points: 5, penalty: -2 },
  ],
  // Set C
  [
    { id: 's1c', type: 'PATTERN_MEMORY', instruction: 'Memorize the glowing tiles. Recall the pattern when they hide.', targetPattern: [1, 5, 7, 8], displayTime: 8000, points: 3, penalty: -1 },
    { id: 's2c', type: 'REACTION_TAP', instruction: 'A target will appear — tap it as fast as you can!', targetColor: '#fb7185', distractorColors: ['#22d3ee', '#a3e635'], rounds: 3, points: 4, penalty: 0 },
    { id: 's3c', type: 'PATTERN_MEMORY', instruction: 'A harder pattern! Memorize and recall it.', targetPattern: [0, 2, 5, 6, 8], displayTime: 7000, points: 4, penalty: -1 },
    { id: 's4c', type: 'REACTION_TAP', instruction: 'Tap only the PINK target — ignore all other colors!', targetColor: '#fb7185', distractorColors: ['#3b82f6', '#22d3ee', '#10b981'], rounds: 4, points: 5, penalty: 0 },
    { id: 's5c', type: 'PATTERN_MEMORY', instruction: 'Expert level! Memorize this complex pattern.', targetPattern: [0, 1, 3, 5, 7, 8], displayTime: 6000, points: 5, penalty: -2 },
  ],
  // Set D
  [
    { id: 's1d', type: 'PATTERN_MEMORY', instruction: 'Memorize the glowing tiles. Recall the pattern when they hide.', targetPattern: [0, 2, 5, 7], displayTime: 8000, points: 3, penalty: -1 },
    { id: 's2d', type: 'REACTION_TAP', instruction: 'A target will appear — tap it as fast as you can!', targetColor: '#8b5cf6', distractorColors: ['#ef4444', '#f59e0b'], rounds: 3, points: 4, penalty: 0 },
    { id: 's3d', type: 'PATTERN_MEMORY', instruction: 'A harder pattern! Memorize and recall it.', targetPattern: [1, 2, 4, 6, 7], displayTime: 7000, points: 4, penalty: -1 },
    { id: 's4d', type: 'REACTION_TAP', instruction: 'Tap only the PURPLE target — ignore all other colors!', targetColor: '#8b5cf6', distractorColors: ['#ef4444', '#22d3ee', '#a3e635'], rounds: 4, points: 5, penalty: 0 },
    { id: 's5d', type: 'PATTERN_MEMORY', instruction: 'Expert level! Memorize this complex pattern.', targetPattern: [0, 3, 4, 5, 6, 8], displayTime: 6000, points: 5, penalty: -2 },
  ],
  // Set E
  [
    { id: 's1e', type: 'PATTERN_MEMORY', instruction: 'Memorize the glowing tiles. Recall the pattern when they hide.', targetPattern: [3, 4, 5, 8], displayTime: 8000, points: 3, penalty: -1 },
    { id: 's2e', type: 'REACTION_TAP', instruction: 'A target will appear — tap it as fast as you can!', targetColor: '#f59e0b', distractorColors: ['#8b5cf6', '#22d3ee'], rounds: 3, points: 4, penalty: 0 },
    { id: 's3e', type: 'PATTERN_MEMORY', instruction: 'A harder pattern! Memorize and recall it.', targetPattern: [0, 1, 3, 5, 8], displayTime: 7000, points: 4, penalty: -1 },
    { id: 's4e', type: 'REACTION_TAP', instruction: 'Tap only the AMBER target — ignore all other colors!', targetColor: '#f59e0b', distractorColors: ['#ef4444', '#8b5cf6', '#fb7185'], rounds: 4, points: 5, penalty: 0 },
    { id: 's5e', type: 'PATTERN_MEMORY', instruction: 'Expert level! Memorize this complex pattern.', targetPattern: [1, 2, 4, 5, 7, 8], displayTime: 6000, points: 5, penalty: -2 },
  ],
];

// ─── MODULE 4: AI Clinical Interview ─────────────────────────────────────────
// Only one type but kept in sets format for consistency
const aiSets = [
  [{ id: 'ai1', type: 'AI_INTERVIEW', instruction: 'A clinical AI will have a conversation with you to assess cognitive function.', points: 5, needsManualGrading: false }],
  [{ id: 'ai2', type: 'AI_INTERVIEW', instruction: 'A clinical AI will conduct a personalized cognitive conversation.', points: 5, needsManualGrading: false }],
  [{ id: 'ai3', type: 'AI_INTERVIEW', instruction: 'An AI clinical assistant will ask you a series of cognitive questions.', points: 5, needsManualGrading: false }],
  [{ id: 'ai4', type: 'AI_INTERVIEW', instruction: 'A brief AI-guided cognitive interview will now begin.', points: 5, needsManualGrading: false }],
  [{ id: 'ai5', type: 'AI_INTERVIEW', instruction: 'Participate in an AI-guided memory and cognition conversation.', points: 5, needsManualGrading: false }],
];

// ─── MODULE 5: Alzheimer's Extended Battery — 5 sets ─────────────────────────
const alzheimersExtSets = [
  // Set A
  [
    { id: 'ae1a', type: 'DELAYED_RECALL', instruction: 'Study these words carefully. You will recall them after a short delay.', wordList: ['apple', 'table', 'penny', 'sunset', 'forest'], studyTime: 10, distractTime: 20, points: 5, penalty: 0 },
    { id: 'ae2a', type: 'FLUENCY_TEST', instruction: 'Name as many ANIMALS as you can in 60 seconds. Press Enter after each one.', category: 'animals', categoryLabel: 'Animals', timeLimit: 60, targetWords: 12, minWords: 5, points: 5, penalty: 0 },
    { id: 'ae3a', type: 'CLOCK_DRAWING', instruction: 'Draw a clock face showing 11:10. Include the circle, all 12 numbers, and both hands.', targetTime: '11:10', aiGraded: true, points: 3 },
  ],
  // Set B
  [
    { id: 'ae1b', type: 'DELAYED_RECALL', instruction: 'Study these words carefully. You will recall them after a short delay.', wordList: ['river', 'candle', 'window', 'garden', 'bridge'], studyTime: 10, distractTime: 20, points: 5, penalty: 0 },
    { id: 'ae2b', type: 'FLUENCY_TEST', instruction: 'Name as many ANIMALS as you can in 60 seconds. Press Enter after each one.', category: 'animals', categoryLabel: 'Animals', timeLimit: 60, targetWords: 12, minWords: 5, points: 5, penalty: 0 },
    { id: 'ae3b', type: 'CLOCK_DRAWING', instruction: 'Draw a clock face showing 3:00. Include the circle, all 12 numbers, and both hands.', targetTime: '3:00', aiGraded: true, points: 3 },
  ],
  // Set C
  [
    { id: 'ae1c', type: 'DELAYED_RECALL', instruction: 'Study these words carefully. You will recall them after a short delay.', wordList: ['silver', 'doctor', 'market', 'morning', 'cloud'], studyTime: 10, distractTime: 20, points: 5, penalty: 0 },
    { id: 'ae2c', type: 'FLUENCY_TEST', instruction: 'Name as many ANIMALS as you can in 60 seconds. Press Enter after each one.', category: 'animals', categoryLabel: 'Animals', timeLimit: 60, targetWords: 12, minWords: 5, points: 5, penalty: 0 },
    { id: 'ae3c', type: 'CLOCK_DRAWING', instruction: 'Draw a clock face showing 7:30. Include the circle, all 12 numbers, and both hands.', targetTime: '7:30', aiGraded: true, points: 3 },
  ],
  // Set D
  [
    { id: 'ae1d', type: 'DELAYED_RECALL', instruction: 'Study these words carefully. You will recall them after a short delay.', wordList: ['yellow', 'hammer', 'street', 'music', 'flower'], studyTime: 10, distractTime: 20, points: 5, penalty: 0 },
    { id: 'ae2d', type: 'FLUENCY_TEST', instruction: 'Name as many ANIMALS as you can in 60 seconds. Press Enter after each one.', category: 'animals', categoryLabel: 'Animals', timeLimit: 60, targetWords: 12, minWords: 5, points: 5, penalty: 0 },
    { id: 'ae3d', type: 'CLOCK_DRAWING', instruction: 'Draw a clock face showing 2:45. Include the circle, all 12 numbers, and both hands.', targetTime: '2:45', aiGraded: true, points: 3 },
  ],
  // Set E
  [
    { id: 'ae1e', type: 'DELAYED_RECALL', instruction: 'Study these words carefully. You will recall them after a short delay.', wordList: ['butter', 'school', 'copper', 'valley', 'anchor'], studyTime: 10, distractTime: 20, points: 5, penalty: 0 },
    { id: 'ae2e', type: 'FLUENCY_TEST', instruction: 'Name as many ANIMALS as you can in 60 seconds. Press Enter after each one.', category: 'animals', categoryLabel: 'Animals', timeLimit: 60, targetWords: 12, minWords: 5, points: 5, penalty: 0 },
    { id: 'ae3e', type: 'CLOCK_DRAWING', instruction: 'Draw a clock face showing 9:15. Include the circle, all 12 numbers, and both hands.', targetTime: '9:15', aiGraded: true, points: 3 },
  ],
];

// ─── Exported database ───────────────────────────────────────────────────────
export const testDatabase = [
  {
    id: 'mindcheck-full',
    title: 'General Cognitive Baseline',
    description: 'A comprehensive assessment of visual, auditory, logical, and motor skills.',
    color: 'bg-blue-500',
    questionSets: mindcheckSets,
    questions: mindcheckSets[0], // default fallback
  },
  {
    id: 'executive-us-standard',
    title: 'US Standard Executive Function',
    description: 'Modeled after WAIS. Tests inhibitory control and auditory working memory.',
    color: 'bg-purple-500',
    questionSets: executiveSets,
    questions: executiveSets[0],
  },
  {
    id: 'spatial-dynamics',
    title: 'Spatial & Reaction Dynamics',
    description: 'Evaluates visuospatial memory, pattern recall, and reaction speed with progressive difficulty.',
    color: 'bg-emerald-500',
    questionSets: spatialSets,
    questions: spatialSets[0],
  },
  {
    id: 'ai-semantic',
    title: 'Dynamic AI Clinical Interview',
    description: 'A real-time conversation with an AI neuropsychologist evaluating cognitive function across multiple domains.',
    color: 'bg-cyan-600',
    questionSets: aiSets,
    questions: aiSets[0],
  },
  {
    id: 'alzheimers-extended',
    title: "Alzheimer's Extended Battery",
    description: 'Advanced diagnostic suite targeting episodic memory, semantic fluency, and visuospatial ability.',
    color: 'bg-rose-600',
    questionSets: alzheimersExtSets,
    questions: alzheimersExtSets[0],
  },
];
