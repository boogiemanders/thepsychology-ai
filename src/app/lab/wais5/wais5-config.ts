// WAIS-5 subtest definitions used by the digital record form.
// Scoring lookup tables (raw -> scaled) are NOT included — clinician
// fills those in by hand from the WAIS-5 Admin & Scoring Manual.

export type ScoreKind = '01' | '012' | '02' | '-'

export type Tag = 'AA' | 'SIG' | 'TRIPLE' | null

export type Item = {
  k: string
  label?: string
  tag?: Tag
  score?: ScoreKind
  // block design
  blocks?: number
  t?: string
  trials?: boolean
  scoreMax?: number
  validScores?: number[]
  // running digits
  recall?: number | 'all'
  string?: string
  sample?: boolean
  // two-trial subtests
  t1?: string
  t2?: string
  sm?: 0 | 1 | 2
  // arithmetic
  correct?: string
}

export type SubtestType =
  | 'verbal'
  | 'mcq'
  | 'mcq3of6'
  | 'twotrial'
  | 'blockdesign'
  | 'rundigits'
  | 'arith'
  | 'timed'

export type Subtest = {
  id: string
  n: number
  name: string
  abbr: string
  max: number
  rules: string
  type: SubtestType
  score?: ScoreKind
  choices?: number
  items?: Item[]
  fields?: string[]
  extras?: string[]
}

const range = (a: number, b: number) => {
  const r: number[] = []
  for (let i = a; i <= b; i++) r.push(i)
  return r
}

export const SUBTESTS: Subtest[] = [
  {
    id: 'similarities', n: 1, name: 'Similarities', abbr: 'SI', max: 36,
    rules: 'Start: Sample, then Item 3 (SIG: Sample then Item 9). Reverse if imperfect on first two given. Discontinue: 3 consecutive 0s.',
    type: 'verbal', score: '012',
    items: [
      { k: 'S',  label: 'Two – Seven', tag: 'AA' },
      { k: '1',  label: 'Fork – Spoon' },
      { k: '2',  label: 'Yellow – Green' },
      { k: '3',  label: 'Horse – Tiger', tag: 'AA' },
      { k: '4',  label: 'Piano – Trumpet' },
      { k: '5',  label: 'Carrot – Onion' },
      { k: '6',  label: 'Boat – Truck' },
      { k: '7',  label: 'Nose – Tongue' },
      { k: '8',  label: 'Sticky – Fuzzy' },
      { k: '9',  label: 'Food – Gasoline', tag: 'SIG' },
      { k: '10', label: 'Music – Tides' },
      { k: '11', label: 'Push – Clap' },
      { k: '12', label: 'Painting – Song' },
      { k: '13', label: 'Anchor – Fence' },
      { k: '14', label: 'Wish – Expect' },
      { k: '15', label: 'Always – Never' },
      { k: '16', label: 'Brick – Paragraph' },
      { k: '17', label: 'Option – Imagination' },
      { k: '18', label: 'Enemy – Friend' },
    ],
  },
  {
    id: 'blockdesign', n: 2, name: 'Block Design', abbr: 'BD', max: 66,
    rules: 'Start: Item 4. Reverse if imperfect on first two given. Discontinue: 2 consecutive 0s.',
    type: 'blockdesign',
    items: [
      { k: '1',  blocks: 4, t: '30"',  trials: true,  scoreMax: 2 },
      { k: '2',  blocks: 8, t: '30"',  trials: true,  scoreMax: 2 },
      { k: '3',  blocks: 8, t: '30"',  trials: true,  scoreMax: 2 },
      { k: '4',  blocks: 8, t: '45"',  trials: true,  scoreMax: 2, tag: 'AA' },
      { k: '5',  blocks: 4, t: '45"',  trials: false, scoreMax: 4 },
      { k: '6',  blocks: 4, t: '60"',  trials: false, scoreMax: 4 },
      { k: '7',  blocks: 4, t: '60"',  trials: false, scoreMax: 4 },
      { k: '8',  blocks: 4, t: '60"',  trials: false, scoreMax: 4 },
      { k: '9',  blocks: 4, t: '60"',  trials: false, scoreMax: 7, validScores: [0, 4, 5, 6, 7] },
      { k: '10', blocks: 9, t: '120"', trials: false, scoreMax: 7, validScores: [0, 4, 5, 6, 7] },
      { k: '11', blocks: 9, t: '120"', trials: false, scoreMax: 7, validScores: [0, 4, 5, 6, 7] },
      { k: '12', blocks: 9, t: '120"', trials: false, scoreMax: 7, validScores: [0, 4, 5, 6, 7] },
      { k: '13', blocks: 9, t: '120"', trials: false, scoreMax: 7, validScores: [0, 4, 5, 6, 7] },
      { k: '14', blocks: 9, t: '120"', trials: false, scoreMax: 7, validScores: [0, 4, 5, 6, 7] },
    ],
    extras: ['BDn (No Time Bonus)', 'BDp (Partial)', 'BDde (Dimension Errors)', 'BDre (Rotation Errors)'],
  },
  {
    id: 'matrix', n: 3, name: 'Matrix Reasoning', abbr: 'MR', max: 26,
    rules: 'Start: Samples A&B, then Item 4 (SIG: Samples then Item 12). Discontinue: 3 consecutive 0s.',
    type: 'mcq', choices: 5,
    items: [
      { k: 'SA', tag: 'AA', score: '-' },
      { k: 'SB', score: '-' },
      ...range(1, 26).map((i): Item => ({ k: String(i), tag: i === 4 ? 'AA' : i === 12 ? 'SIG' : null, score: '01' })),
    ],
  },
  {
    id: 'digitsforward', n: 4, name: 'Digits Forward', abbr: 'DF', max: 24,
    rules: 'Start: Item 1. Read 1 digit/sec. Discontinue: scores of 0 on both trials.',
    type: 'twotrial',
    items: [
      { k: '1',  t1: '5-7',                     t2: '3-6',                     sm: 1, tag: 'AA' },
      { k: '2',  t1: '1-5-4',                   t2: '6-2-9',                   sm: 1 },
      { k: '3',  t1: '8-5-2-6',                 t2: '1-6-9-3',                 sm: 1 },
      { k: '4',  t1: '7-8-1-5-2',               t2: '4-3-8-7-5',               sm: 1 },
      { k: '5',  t1: '3-1-6-4-8-9',             t2: '1-9-4-7-6-3',             sm: 1 },
      { k: '6',  t1: '5-3-2-4-8-7',             t2: '7-2-5-8-1-3',             sm: 1 },
      { k: '7',  t1: '3-6-1-7-4-2-8',           t2: '9-8-3-2-7-1-4',           sm: 1 },
      { k: '8',  t1: '4-7-1-3-2-5-6-8',         t2: '8-3-9-2-6-1-4-7',         sm: 1 },
      { k: '9',  t1: '2-7-5-8-6-3-1-9-4',       t2: '5-3-1-7-2-4-6-8-9',       sm: 2 },
      { k: '10', t1: '1-9-6-2-4-7-8-3-7-5',     t2: '7-4-6-9-8-1-5-3-2-6',     sm: 2 },
    ],
    extras: ['LDf'],
  },
  {
    id: 'digitseq', n: 5, name: 'Digit Sequencing', abbr: 'DQ', max: 24,
    rules: 'Start: Sample, then Item 1. Read 1 digit/sec. Discontinue: scores of 0 on both trials.',
    type: 'twotrial',
    items: [
      { k: 'S',  t1: '2-3-1 → 1-2-3',                   t2: '5-2-2 → 2-2-5',                   sm: 0, tag: 'AA' },
      { k: '1',  t1: '1-4 → 1-4',                       t2: '3-2 → 2-3',                       sm: 1 },
      { k: '2',  t1: '3-1-6 → 1-3-6',                   t2: '1-9-4 → 1-4-9',                   sm: 1 },
      { k: '3',  t1: '8-7-9-6 → 6-7-8-9',               t2: '2-8-7-1 → 1-2-7-8',               sm: 1 },
      { k: '4',  t1: '4-6-9-1-7 → 1-4-6-7-9',           t2: '3-8-3-5-8 → 3-3-5-8-8',           sm: 1 },
      { k: '5',  t1: '7-5-4-7-1 → 1-4-5-7-7',           t2: '3-5-3-2-4 → 2-3-3-4-5',           sm: 1 },
      { k: '6',  t1: '2-1-7-9-3-6 → 1-2-3-6-7-9',       t2: '6-2-5-2-3-4 → 2-2-3-4-5-6',       sm: 1 },
      { k: '7',  t1: '8-4-8-5-7-5 → 4-5-5-7-8-8',       t2: '1-9-9-3-3-6 → 1-3-3-6-9-9',       sm: 1 },
      { k: '8',  t1: '7-9-7-6-8-6-2 → 2-6-6-7-7-8-9',   t2: '4-8-2-5-4-5-3 → 2-3-4-4-5-5-8',   sm: 1 },
      { k: '9',  t1: '5-8-7-4-7-5-4-8 → 4-4-5-5-7-7-8-8', t2: '1-2-3-9-6-4-3-6 → 1-2-3-3-4-6-6-9', sm: 2 },
      { k: '10', t1: '5-1-8-1-3-6-1-2-5 → 1-1-1-2-3-5-5-6-8', t2: '9-7-1-4-8-4-2-6-9 → 1-2-4-4-6-7-8-9-9', sm: 2 },
    ],
    extras: ['LDq'],
  },
  {
    id: 'coding', n: 6, name: 'Coding', abbr: 'CD', max: 135,
    rules: 'Time limit: 120 seconds. Use Coding Scoring Template.',
    type: 'timed',
    fields: ['Completion Time (sec)', 'Total Raw Score'],
  },
  {
    id: 'vocab', n: 7, name: 'Vocabulary', abbr: 'VC', max: 45,
    rules: 'Start: Item 4 (SIG: Item 8). Reverse if imperfect on first two given. Discontinue: 3 consecutive 0s.',
    type: 'verbal',
    items: [
      { k: '1',  label: 'Book',     score: '01' },
      { k: '2',  label: 'Airplane', score: '01' },
      { k: '3',  label: 'Basket',   score: '01' },
      { k: '4',  label: 'Banana',   tag: 'AA', score: '012' },
      { k: '5',  label: 'Cat',        score: '012' },
      { k: '6',  label: 'Glove',      score: '012' },
      { k: '7',  label: 'Imitate',    score: '012' },
      { k: '8',  label: 'Curious', tag: 'SIG', score: '012' },
      { k: '9',  label: 'Mend',       score: '012' },
      { k: '10', label: 'Confide',    score: '012' },
      { k: '11', label: 'Transcribe', score: '012' },
      { k: '12', label: 'Serene',     score: '012' },
      { k: '13', label: 'Evolve',     score: '012' },
      { k: '14', label: 'Empathy',    score: '012' },
      { k: '15', label: 'Feasible',   score: '012' },
      { k: '16', label: 'Cultivate',  score: '012' },
      { k: '17', label: 'Acute',      score: '012' },
      { k: '18', label: 'Coagulate',  score: '012' },
      { k: '19', label: 'Decorum',    score: '012' },
      { k: '20', label: 'Pragmatic',  score: '012' },
      { k: '21', label: 'Diatribe',   score: '012' },
      { k: '22', label: 'Palliate',   score: '012' },
      { k: '23', label: 'Taciturn',   score: '012' },
      { k: '24', label: 'Propitious', score: '012' },
    ],
  },
  {
    id: 'figw', n: 8, name: 'Figure Weights', abbr: 'FW', max: 40,
    rules: 'Start: Sample B, then Item 3 (SIG: Sample B then Item 15). Reverse on first two given. Discontinue: 3 consecutive 0s. Before Item 20, say: now look at all three scales.',
    type: 'mcq', choices: 5,
    items: [
      { k: 'SA', tag: 'AA', t: '-', score: '-' },
      { k: 'SB', tag: 'AA', t: '-', score: '-' },
      ...range(1, 16).map((i): Item => ({ k: String(i), t: '20"', tag: i === 3 ? 'AA' : i === 15 ? 'SIG' : null, score: '01' })),
      ...range(17, 28).map((i): Item => ({ k: String(i), t: '30"', tag: i === 20 ? 'TRIPLE' : null, score: '02' })),
    ],
  },
  {
    id: 'vpuzzles', n: 9, name: 'Visual Puzzles', abbr: 'VP', max: 25,
    rules: 'Start: Demo, Sample, then Item 3 (SIG: Demo, Sample, then Item 11). Reverse on first two given. Discontinue: 3 consecutive 0s. Time limit: 30 sec each.',
    type: 'mcq3of6',
    items: [
      { k: 'D', tag: 'AA', score: '-' },
      { k: 'S', score: '-' },
      ...range(1, 25).map((i): Item => ({ k: String(i), tag: i === 3 ? 'AA' : i === 11 ? 'SIG' : null, score: '01' })),
    ],
  },
  {
    id: 'rundigits', n: 10, name: 'Running Digits', abbr: 'RD', max: 49,
    rules: 'Start: Demo B, then Item 3. Read 2 digits/sec. Discontinue: 2 consecutive imperfect.',
    type: 'rundigits',
    items: [
      { k: 'DA', recall: 1, string: '5-7-2', sample: true },
      { k: '1',  recall: 1, string: '3-1-4' },
      { k: '2',  recall: 2, string: '6-5-1-3' },
      { k: 'DB', recall: 3, string: '9-3-2-6-7-8-2-4-5', sample: true, tag: 'AA' },
      { k: '3',  recall: 3, string: '1-5-4-9-6-8-4-3-1' },
      { k: '4',  recall: 4, string: '2-5-4-7-6-8-1-4-2-5-3-8-9' },
      { k: '5',  recall: 4, string: '3-9-4-1-5-8-2-3-6-4-7' },
      { k: 'RA', recall: 4, string: '8-1-2-6', sample: true },
      { k: '6',  recall: 5, string: '5-7-4-9-3-2-1-7-6-8-3-5' },
      { k: '7',  recall: 5, string: '6-3-5-9-8-1-2-6-7-2-9-4-2-8' },
      { k: '8',  recall: 5, string: '4-9-6-7-1-8-9-5-4-7-8-3-6' },
      { k: 'RB', recall: 5, string: '6-7-9-1-3', sample: true },
      { k: '9',  recall: 6, string: '5-7-8-9-3-1-4-5-9-7-2' },
      { k: '10', recall: 'all', string: '9-1-6-8-2-4-9-5-7-1-6-3-4-8' },
    ],
    extras: ['LRd'],
  },
  {
    id: 'symsearch', n: 11, name: 'Symbol Search', abbr: 'SS', max: 60,
    rules: 'Time limit: 120 seconds. Use Symbol Search Scoring Key.',
    type: 'timed',
    fields: [
      'Completion Time (sec)',
      'Number Correct',
      'Number Incorrect',
      'Total Raw Score (Correct − Incorrect)',
      'SSse (Set Errors)',
      'SSre (Rotation Errors)',
    ],
  },
  {
    id: 'info', n: 12, name: 'Information', abbr: 'IN', max: 24,
    rules: 'Start: Item 4 (SIG: Item 7). Reverse on first two given. Discontinue: 3 consecutive 0s.',
    type: 'verbal', score: '01',
    items: [
      { k: '1',  label: 'Monday' },
      { k: '2',  label: 'Dog' },
      { k: '3',  label: 'Square' },
      { k: '4',  label: 'Seconds', tag: 'AA' },
      { k: '5',  label: 'Moon' },
      { k: '6',  label: 'Caterpillar' },
      { k: '7',  label: 'Water', tag: 'SIG' },
      { k: '8',  label: 'Line' },
      { k: '9',  label: 'Bridge' },
      { k: '10', label: 'Airplane' },
      { k: '11', label: 'Taj Mahal' },
      { k: '12', label: 'Olympics' },
      { k: '13', label: 'Gandhi' },
      { k: '14', label: 'Ballet' },
      { k: '15', label: 'Thatcher' },
      { k: '16', label: 'Organ' },
      { k: '17', label: 'Canal' },
      { k: '18', label: 'Language' },
      { k: '19', label: 'War' },
      { k: '20', label: 'Ocean' },
      { k: '21', label: 'Alice' },
      { k: '22', label: 'Senegal' },
      { k: '23', label: 'Quixote' },
      { k: '24', label: 'Circumference' },
    ],
  },
  {
    id: 'arith', n: 13, name: 'Arithmetic', abbr: 'AR', max: 25,
    rules: 'Start: Sample, then Item 4 (SIG: Sample, then Item 7). Reverse on first two given. Discontinue: 3 consecutive 0s. Time limit: 30 sec each. Items 20-22 score 0/1/2.',
    type: 'arith',
    items: [
      { k: '1',  label: 'Apples',  correct: 'Counts to 10', score: '01' },
      { k: '2',  label: 'Birds',   correct: '9',  score: '01' },
      { k: '3',  label: 'Leashes', correct: '2',  score: '01' },
      { k: 'S',  label: 'Grapes',  correct: '3',  sample: true, tag: 'AA', score: '-' },
      { k: '4',  label: 'Hats',    correct: '8',  score: '01' },
      { k: '5',  label: 'Pens',    correct: '5',  score: '01' },
      { k: '6',  label: 'Toys',    correct: '4',  score: '01' },
      { k: '7',  label: 'Flowers', correct: '44', tag: 'SIG', score: '01' },
      { k: '8',  label: 'Pencils', correct: '52', score: '01' },
      { k: '9',  label: 'Trees',   correct: '126', score: '01' },
      { k: '10', label: 'Older',   correct: '17',  score: '01' },
      { k: '11', label: 'Books',   correct: '5',   score: '01' },
      { k: '12', label: 'Tickets', correct: '3',   score: '01' },
      { k: '13', label: 'Gum',     correct: '200', score: '01' },
      { k: '14', label: 'Plants',  correct: '132', score: '01' },
      { k: '15', label: 'Cards',   correct: '38',  score: '01' },
      { k: '16', label: 'Run',     correct: '140', score: '01' },
      { k: '17', label: 'Pool',    correct: '186', score: '01' },
      { k: '18', label: 'Maps',    correct: '600', score: '01' },
      { k: '19', label: 'Hours',   correct: '47',  score: '01' },
      { k: '20', label: 'Laps',    correct: '51',     score: '02' },
      { k: '21', label: 'Boxes',   correct: '23,100', score: '02' },
      { k: '22', label: 'Store',   correct: '12',     score: '02' },
    ],
  },
  {
    id: 'digitsback', n: 14, name: 'Digits Backward', abbr: 'DB', max: 24,
    rules: 'Start: Sample, then Item 1. Read 1 digit/sec. Discontinue: scores of 0 on both trials.',
    type: 'twotrial',
    items: [
      { k: 'S',  t1: '3-4 → 4-3',                     t2: '5-1 → 1-5',                     sm: 0, tag: 'AA' },
      { k: '1',  t1: '1-3 → 3-1',                     t2: '3-7 → 7-3',                     sm: 1 },
      { k: '2',  t1: '8-2 → 2-8',                     t2: '4-6 → 6-4',                     sm: 1 },
      { k: '3',  t1: '4-7-5 → 5-7-4',                 t2: '5-2-8 → 8-2-5',                 sm: 1 },
      { k: '4',  t1: '8-2-7-9 → 9-7-2-8',             t2: '3-8-5-6 → 6-5-8-3',             sm: 1 },
      { k: '5',  t1: '7-4-3-9 → 9-3-4-7',             t2: '4-9-6-3 → 3-6-9-4',             sm: 1 },
      { k: '6',  t1: '3-8-9-1-2 → 2-1-9-8-3',         t2: '6-5-1-4-3 → 3-4-1-5-6',         sm: 1 },
      { k: '7',  t1: '2-4-5-7-8 → 8-7-5-4-2',         t2: '1-5-6-4-7 → 7-4-6-5-1',         sm: 1 },
      { k: '8',  t1: '7-2-1-8-9-6 → 6-9-8-1-2-7',     t2: '5-3-7-4-6-1 → 1-6-4-7-3-5',     sm: 1 },
      { k: '9',  t1: '8-1-4-2-3-5-6 → 6-5-3-2-4-1-8', t2: '4-8-3-9-6-2-7 → 7-2-6-9-3-8-4', sm: 2 },
      { k: '10', t1: '9-4-3-7-2-6-1-8 → 8-1-6-2-7-3-4-9', t2: '7-2-8-1-5-6-4-3 → 3-4-6-5-1-8-2-7', sm: 2 },
    ],
    extras: ['LDb'],
  },
  {
    id: 'symspan', n: 15, name: 'Symbol Span', abbr: 'SSP', max: 44,
    rules: 'Start: Sample, then Item 1. Expose stimulus 5 sec. Discontinue: 3 consecutive imperfect.',
    type: 'verbal',
    items: [
      { k: 'SA', label: 'D – B', tag: 'AA', score: '-' },
      { k: '1',  label: 'A',          score: '01' },
      { k: '2',  label: 'B',          score: '01' },
      { k: '3',  label: 'C – D',          score: '012' },
      { k: '4',  label: 'D – B',          score: '012' },
      { k: '5',  label: 'A – B',          score: '012' },
      { k: '6',  label: 'C – A',          score: '012' },
      { k: '7',  label: 'A – C – B',      score: '012' },
      { k: '8',  label: 'E – B – C',      score: '012' },
      { k: '9',  label: 'C – D – A',      score: '012' },
      { k: '10', label: 'D – E – B',      score: '012' },
      { k: '11', label: 'A – D – E – G',  score: '012' },
      { k: '12', label: 'F – A – B – E',  score: '012' },
      { k: '13', label: 'E – D – F – C',  score: '012' },
      { k: '14', label: 'B – H – A – D',  score: '012' },
      { k: '15', label: 'H – B – F – C',  score: '012' },
      { k: '16', label: 'C – E – G – A – B', score: '012' },
      { k: '17', label: 'B – A – H – J – I', score: '012' },
      { k: '18', label: 'F – H – D – B – G', score: '012' },
      { k: '19', label: 'I – E – F – G – C – D', score: '012' },
      { k: '20', label: 'A – F – H – E – C – D', score: '012' },
      { k: '21', label: 'J – A – G – I – D – C – B', score: '012' },
      { k: '22', label: 'E – N – D – F – A – M – C', score: '012' },
      { k: '23', label: 'I – G – K – J – B – L – H', score: '012' },
    ],
  },
  {
    id: 'nsq', n: 16, name: 'Naming Speed Quantity', abbr: 'NSQ', max: 150,
    rules: 'Time limit: 75 sec per item.',
    type: 'timed',
    fields: [
      'Item 1 Completion Time (sec)',
      'Item 2 Completion Time (sec)',
      'NSQe (Errors)',
      'Total Raw Score (sum of times)',
    ],
  },
  {
    id: 'comp', n: 17, name: 'Comprehension', abbr: 'CO', max: 36,
    rules: 'Start: Item 3 (SIG: Item 8). Reverse on first two given. Discontinue: 3 consecutive 0s.',
    type: 'verbal', score: '012',
    items: [
      { k: '1',  label: 'Watches' },
      { k: '2',  label: 'Clothes' },
      { k: '3',  label: 'Envelope', tag: 'AA' },
      { k: '4',  label: 'Money' },
      { k: '5',  label: 'Foods' },
      { k: '6',  label: 'License' },
      { k: '7',  label: 'History' },
      { k: '8',  label: 'Countries', tag: 'SIG' },
      { k: '9',  label: 'Job' },
      { k: '10', label: 'Outer Space' },
      { k: '11', label: 'Fall' },
      { k: '12', label: 'Animals' },
      { k: '13', label: 'Land' },
      { k: '14', label: 'Teeth' },
      { k: '15', label: 'Winter' },
      { k: '16', label: 'Democracy' },
      { k: '17', label: 'Crime' },
      { k: '18', label: 'Brooks' },
    ],
  },
  {
    id: 'setrel', n: 18, name: 'Set Relations', abbr: 'SR', max: 32,
    rules: 'Start: Item 1 (SIG: Demos A-C, then Item 5). Reverse on first two given. Discontinue: 3 consecutive imperfect.',
    type: 'mcq', choices: 4,
    items: [
      { k: '1',  label: 'triangles',     tag: 'AA', score: '01' },
      { k: '2',  label: 'blue squares',  score: '01' },
      { k: '3',  label: 'red triangles', score: '01' },
      { k: '4',  label: 'yellow',        score: '01' },
      ...range(5, 22).map((i): Item => ({ k: String(i), score: '01' })),
      ...range(23, 27).map((i): Item => ({ k: String(i), score: '012' })),
    ],
  },
  {
    id: 'spadd', n: 19, name: 'Spatial Addition', abbr: 'SA', max: 23,
    rules: 'Ages 16–69: Demos A&B, Sample A, Sample B, then Item 6. Ages 70–90: Demos A&B, Sample A, then Item 1. Reverse on first two given. Discontinue: 3 consecutive 0s.',
    type: 'mcq', choices: 0,
    items: range(1, 23).map((i): Item => ({ k: String(i), score: '01' })),
  },
  {
    id: 'lns', n: 20, name: 'Letter-Number Sequencing', abbr: 'LN', max: 24,
    rules: 'Start: Demo A, Sample A, then Item 1. Read 1 letter/number per sec. Discontinue: scores of 0 on both trials.',
    type: 'twotrial',
    items: [
      { k: '1',  t1: '2-B → 2-B / D-1 → 1-D',         t2: '',                                  sm: 1, tag: 'AA' },
      { k: '2',  t1: 'E-5 → 5-E / 3-A → 3-A',         t2: '',                                  sm: 1 },
      { k: '3',  t1: 'F-E-1 → 1-E-F (or E-F-1)',      t2: '3-Q-7 → 3-7-Q (or Q-3-7)',          sm: 1 },
      { k: '4',  t1: 'Z-8-N → 8-N-Z (or N-Z-8)',      t2: 'M-6-U → 6-M-U (or M-U-6)',          sm: 1 },
      { k: '5',  t1: 'V-1-J-5 → 1-5-J-V',             t2: '7-M-4-K → 4-7-K-M',                 sm: 1 },
      { k: '6',  t1: 'S-9-T-6 → 6-9-S-T',             t2: '5-P-2-N → 2-5-N-P',                 sm: 1 },
      { k: '7',  t1: '8-E-6-F-1 → 1-6-8-E-F',         t2: 'K-4-C-2-S → 2-4-C-K-S',             sm: 1 },
      { k: '8',  t1: '6-N-9-J-2-S → 2-6-9-J-N-S',     t2: 'U-6-H-5-F-3 → 3-5-6-F-H-U',         sm: 1 },
      { k: '9',  t1: 'R-7-V-4-Y-8-F → 4-7-8-F-R-V-Y', t2: '9-X-2-J-3-N-7 → 2-3-7-9-J-N-X',     sm: 2 },
      { k: '10', t1: 'U-1-R-9-X-4-K-3 → 1-3-4-9-K-R-U-X', t2: '7-M-2-T-6-F-9-A → 2-6-7-9-A-F-M-T', sm: 2 },
    ],
    extras: ['LLNs'],
  },
]

export const PRIMARY_INDEXES = ['VCI', 'VSI', 'FRI', 'WMI', 'PSI', 'FSIQ'] as const
export const ANCILLARY_INDEXES = [
  'VECI', 'VRI', 'EVSI', 'EFI', 'QRI', 'EWMI', 'VWMI',
  'AWMI-R', 'AWMI-M', 'EPSI', 'MRPSI', 'NVI', 'NMI', 'GAI', 'CPI',
] as const
export const PAIRWISE_COMPARISONS: Array<[string, string]> = [
  ['VCI', 'VSI'], ['VCI', 'FRI'], ['VCI', 'WMI'], ['VCI', 'PSI'],
  ['VSI', 'FRI'], ['VSI', 'WMI'], ['VSI', 'PSI'],
  ['FRI', 'WMI'], ['FRI', 'PSI'], ['WMI', 'PSI'],
  ['Similarities', 'Vocabulary'],
  ['Block Design', 'Visual Puzzles'],
  ['Matrix Reasoning', 'Figure Weights'],
  ['Digit Sequencing', 'Running Digits'],
  ['Coding', 'Symbol Search'],
]

// Ancillary pairwise comparisons (composite + subtest level)
export const ANCILLARY_PAIRWISE_COMPARISONS: Array<[string, string]> = [
  ['VECI', 'EFI'],
  ['WMI', 'VWMI'],
  ['AWMI-R', 'AWMI-M'],
  ['GAI', 'FSIQ'],
  ['GAI', 'CPI'],
  ['FW', 'AR'],
  ['SSP', 'SA'],
  ['DF', 'RD'],
  ['SS', 'NSQ'],
]

// Process-level pairwise comparisons
export const PROCESS_PAIRWISE_COMPARISONS: Array<[string, string]> = [
  ['BD', 'BDn'],
  ['BD', 'BDp'],
  ['DQ', 'DF'],
  ['DQ', 'DB'],
  ['DF', 'DB'],
  ['DQ', 'LN'],
]

// Process scores eligible for raw -> base rate conversion
export const PROCESS_SCORES_BASE_RATE = [
  { id: 'LDq', label: 'Longest Digit Sequence (LDq)' },
  { id: 'LRd', label: 'Longest Running Digits (LRd)' },
  { id: 'LDf', label: 'Longest Digits Forward (LDf)' },
  { id: 'LDb', label: 'Longest Digits Backward (LDb)' },
  { id: 'LLNs', label: 'Longest Letter-Number Sequence (LLNs)' },
  { id: 'BDde', label: 'Block Design Dimension Errors (BDde)' },
  { id: 'BDre', label: 'Block Design Rotation Errors (BDre)' },
  { id: 'SSse', label: 'Symbol Search Set Errors (SSse)' },
  { id: 'SSre', label: 'Symbol Search Rotation Errors (SSre)' },
  { id: 'NSQe', label: 'Naming Speed Quantity Errors (NSQe)' },
] as const

// Process-level discrepancy comparisons
export const DISCREPANCY_COMPARISONS: Array<[string, string]> = [
  ['LDq', 'LDf'],
  ['LDq', 'LDb'],
  ['LDf', 'LDb'],
  ['LDq', 'LLNs'],
]

// Subtests that comprise composite groups (for auto-mean helpers)
export const PRIMARY_SUBTESTS_10 = [
  'similarities', 'vocab', 'blockdesign', 'vpuzzles', 'matrix',
  'figw', 'digitseq', 'rundigits', 'coding', 'symsearch',
]
export const FSIQ_SUBTESTS_7 = [
  'similarities', 'vocab', 'blockdesign', 'matrix', 'figw',
  'digitseq', 'coding',
]
