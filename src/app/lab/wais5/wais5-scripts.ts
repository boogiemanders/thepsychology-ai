// Auto-generated from WAIS-5 Admin & Scoring Manual.
// Per-item examiner scripts and scoring rubric. Read aloud the prompt; pick the
// score that best matches the examinee's response from the rubric.

export type ItemScript = {
  prompt: string
  /** Optional action note (e.g. "Point to the picture") shown subtly above the spoken prompt. */
  stageDirection?: string
  /** Optional stim book image path (under /public). */
  stim?: string
  /** Optional correct multiple-choice answer (1-based) — examiner-only hint. */
  answer?: number
  scoring: { '2': string[]; '1': string[]; '0': string[] }
  corrective?: string | null
}

export type SubtestScripts = Record<string, ItemScript>

export type SampleScript = {
  prompt: string
  onCorrect?: string
  onIncorrect?: string
}

/** A grouped admin script — e.g. Block Design "Item 1" or "Items 5-9". Each
 *  group is either a single line or a Trial 1 / Trial 2 pair. Multi-line text
 *  uses real newlines; parentheticals in the text render as muted stage notes. */
export type ItemGroupScript = {
  label: string
  trial1?: string
  trial2?: string
  single?: string
}

export type SubtestIntro = {
  sample?: SampleScript
  instruction?: string
  notes?: string[]
  itemGroups?: ItemGroupScript[]
}

export const GENERAL_TEST_INTRO =
  "We'll be doing a lot of things today. Some parts may be easy for you, but some may be hard. Some things will have time limits, and some won't. Most people don't answer all the questions right or finish everything. Just try your best."

export const SUBTEST_INTROS: Record<string, SubtestIntro> = {
  similarities: {
    instruction: "I'm going to say two words that are alike in some way. Tell me how they are alike.",
    sample: {
      prompt: 'In what way are TWO and SEVEN alike? How are they the same?',
      onCorrect: "That's right.",
      onIncorrect: "That's not quite right. Two and seven are both numbers.",
    },
    notes: [
      'Score 2, 1, or 0 points. Record responses verbatim.',
      'Reverse: imperfect score on first two items given. Discontinue: 3 consecutive 0s.',
    ],
  },

  blockdesign: {
    instruction: 'Place two blocks in front of the examinee. Pick up one block and say, **See these blocks? They are all alike. On some sides, they are all red** (show red side); **on some sides, all white** (show white side); **and on some sides, half red and half white** (show red-and-white side).',
    notes: [
      'Items 1-4 have two trials each; Items 5-14 have one trial. Time limits vary by item — accurate timing is essential.',
      'Designs on the record form are from the examiner\'s perspective (upside down). Shaded areas = red portions.',
      'If hesitating: "Work as fast as you can, and tell me when you\'re done." If attempting to copy block sides: "Only the tops of the blocks need to be the same."',
      'Stop timing when the design is complete OR the examinee indicates they\'re done OR time expires.',
      'Watch construction carefully — needed for BDn, BDp, BDde, BDre process scores.',
    ],
    itemGroups: [
      {
        label: 'Item 1',
        trial1: 'Say, **Watch me make my blocks look just like this** (point to pictured design). Use two blocks to slowly assemble the model. Leave the model intact.\nSay, **Now you make one like this** (point to pictured design). **Work as fast as you can and tell me when you\'re done. I\'ll tell you when time is up.**\nEnsure the examinee has two more scrambled blocks and say, **Go ahead.** Begin timing.',
        trial2: 'Leave the model intact and say, **Watch me again.** Using the examinee\'s blocks, slowly assemble the design.\nAs you scramble the examinee\'s blocks, say, **Now you try it again and make one like this** (point to pictured design).\nSay, **Go ahead.** Begin timing.',
      },
      {
        label: 'Items 2-3',
        trial1: 'Say, **Watch me make my blocks look just like this** (point to pictured design). Use four blocks to slowly assemble the model. Leave the model intact.\nSay, **Now you make one like this** (point to pictured design). **Work as fast as you can.**\nEnsure the examinee has four more scrambled blocks and say, **Go ahead.** Begin timing.',
        trial2: 'Leave the model intact and say, **Watch me again.** Using the examinee\'s blocks, slowly assemble the design.\nAs you scramble the examinee\'s blocks, say, **Now you try it again and make one like this** (point to pictured design).\nSay, **Go ahead.** Begin timing.',
      },
      {
        label: 'Item 4',
        trial1: 'Say, **Watch me make my blocks look just like this** (point to pictured design). Use four blocks to slowly assemble the model. Leave the model intact.\nSay, **Now you make one like this** (point to pictured design). **Work as fast as you can and tell me when you\'re done. I\'ll tell you when time is up.**\nEnsure the examinee has four more scrambled blocks and say, **Go ahead.** Begin timing.',
        trial2: 'Leave the model intact and say, **Watch me again.** Using the examinee\'s blocks, slowly assemble the design.\nAs you scramble the examinee\'s blocks, say, **Now you try it again and make one like this** (point to pictured design).\nSay, **Go ahead.** Begin timing.',
      },
      {
        label: 'Items 5-9',
        single: 'Ensure the examinee has only four blocks. As you scramble the blocks, say, **Now make one like this** (point to pictured design). **Work as fast as you can. Go ahead.** Begin timing.',
      },
      {
        label: 'Items 10-14',
        single: 'Ensure the examinee has nine blocks. As you scramble the blocks, say, **Now make one like this** (point to pictured design)**, using all nine blocks. Work as fast as you can. Go ahead.** Begin timing.',
      },
    ],
  },

  matrix: {
    instruction: "Look at the picture and pick the option that best completes it.",
    sample: {
      prompt: 'Which one here finishes the picture? (point across response options, then to the question mark)',
      onCorrect: "That's right.",
      onIncorrect: "That's not quite right. The yellow circle is the only one that works going across and down. (Sample A) | The little circle should come next in order. (Sample B)",
    },
    notes: [
      'Two item types: matrix (2x2, 3x3) and serial order (1x6 row). Samples A and B introduce each type.',
      'If asked whether answer works across or down: "The answer should work both across the picture and down."',
      'Score 1 if correct, 0 if incorrect / DK / no response within ~30 sec.',
    ],
  },

  digitsforward: {
    instruction: "Now I'm going to say some numbers, and when I stop, you should say them back to me in the same order. Just say what I say. Listen carefully — I can only say them one time.",
    notes: [
      'Read each trial at 1 digit per second. Drop voice inflection slightly on the last digit.',
      'Administer BOTH trials of every item, even if Trial 1 is correct.',
      'Do not repeat any trial. If asked to repeat: "I can only say them one time. Just take your best guess."',
      'If responds before you finish: present the rest, score the response, then "Wait until I stop before you start."',
      'Discontinue after scores of 0 on BOTH trials of an item.',
    ],
  },

  digitseq: {
    instruction: "Now I'm going to say some numbers, and when I stop, you should say the numbers in order, from smallest to largest.",
    sample: {
      prompt: 'If I say 2 – 3 – 1, what would you say?  (Trial 2: "Let\'s try another: 5 – 2 – 2.")',
      onCorrect: "That's right.  (Trial 2: That's right. You had to say 2 twice.)",
      onIncorrect: 'That\'s not quite right. To say them in order from smallest to largest, you should say 1 – 2 – 3.  (Trial 2 adds: "You may have to say the same number more than once.")',
    },
    notes: [
      'Read each trial at 1 digit per second. Drop voice inflection on the last digit.',
      'Same number may repeat in a trial. If asked: "You may have to say the same number more than once."',
      'Do not repeat any trial. Discontinue after 0 on both trials of an item.',
    ],
  },

  coding: {
    instruction: "Each number 1-9 has its own special mark. Copy the matching mark below each number as fast as you can without making mistakes. Don't skip any.",
    notes: [
      'Time limit: 120 seconds. Use the demonstration items, then the sample items, then start the test items.',
      'No eraser. If they ask about mistakes: "That\'s OK. Cross it out, write your new answer, and keep going."',
      'If skipping or reversing: "Do them in order. Don\'t skip any." If starting early: "Wait until I say \'Go\' to start."',
      'Score with the Coding Scoring Template. 1 point per correctly drawn symbol within the time limit.',
    ],
  },

  vocab: {
    instruction: 'I am going to say some words. Listen carefully and tell me what each word means.',
    notes: [
      'Picture Items (1-3): Point to the picture and say, "What is this?" Score 0 or 1.',
      'Verbal Items (4-24): Read the verbal-items instruction above, then point to each word on the stimulus page. Score 0, 1, or 2.',
      'Reverse: imperfect on first two given. Discontinue: 3 consecutive 0s.',
    ],
  },

  figw: {
    instruction: "Look at the scale. Pick the option that keeps the scale balanced.",
    sample: {
      prompt: 'This scale has one red circle. Which one of these (point across response options) goes here (point to question mark) because it weighs the same?  (Sample A)',
      onCorrect: "That's right.",
      onIncorrect: "That's not quite right. (Then explain why the chosen option is wrong — color, shape, or quantity — and say) Try again.",
    },
    notes: [
      'Time limit: 20 sec for Items 1-16; 30 sec for Items 17-28. A thick black line on the record form flags the change.',
      'Item 20 has a required verbatim instruction (marked **) introducing 3-scale items.',
      'No pencil or paper for the examinee. Finger-tracing on the table is fine.',
      'Score: 1 pt (items 1-16) or 2 pts (items 17-28) for correct within time limit; 0 otherwise.',
    ],
  },

  vpuzzles: {
    instruction: "I'm going to show you a puzzle and some pieces. Pick three pieces that go together to make the puzzle. The pieces have to go next to each other — you can't stack one to cover up part of another.",
    notes: [
      'Time limit: 30 sec per item. Stop timing once 3 options are selected, DK, or time expires.',
      'If asks about order: "You do not have to choose them in order." If picks fewer than 3: "Choose three pieces to make the puzzle."',
      'If asks to flip face-down: "It can\'t be flipped face down." If asks to stack: "It can\'t be stacked to cover up any part of another piece."',
      'If selects >3 or self-corrects unclearly: "Which three pieces did you mean?"',
      'Score 1 if exactly the 3 correct pieces are chosen within time limit; 0 otherwise.',
    ],
  },

  rundigits: {
    instruction: "I'll read a long string of numbers. When I stop, repeat back only the LAST few numbers I said, in the same order.",
    notes: [
      'Read each item at 2 digits per second. Drop voice inflection on the last digit.',
      'Use the Running Digits Scoring Template — aligned over the record form, helps score and apply the discontinue rule.',
      'Recalibration items (after Item 5 and after Item 8) are not scored and don\'t count toward discontinue.',
      'Do not repeat any item. If asked: "I can only say them one time. Just take your best guess."',
      'Discontinue after 2 consecutive imperfect scores.',
    ],
  },

  symsearch: {
    instruction: "Look at the two target symbols. Then look at the search group. If one of the target symbols is in the search group, mark YES. If neither is, mark NO. Work as fast as you can without making mistakes.",
    notes: [
      'Time limit: 120 seconds. Use the demo items, then the sample items, then the test items.',
      'Demo and sample items are on page 5 of the response booklet. Test items begin on page 6.',
      'If marks oddly (not a slash): "Draw one line to make each mark." If marks a target: "Make your marks over here." (point across search group and NO box)',
      'No eraser. If mistakes: "That\'s OK. Cross it out, mark your new answer, and keep going."',
      'If reaches end of page: turn page for them and say "Keep working as fast as you can."',
      'Score with the Symbol Search Scoring Key. Raw = Correct − Incorrect. Track set errors (SSse) and rotation errors (SSre) for process scores.',
    ],
  },

  info: {
    instruction: "I'm going to ask you some questions. Try to answer each one.",
    notes: [
      'Say each question word-for-word. Score 0 or 1.',
      'Reverse: imperfect on first two given. Discontinue: 3 consecutive 0s.',
    ],
  },

  arith: {
    instruction: "I'm going to read you some problems. Listen carefully. You can ask me to read a problem again, but only once.",
    notes: [
      'Time limit: 30 seconds per item. Repetition allowed ONCE per item.',
      'Items 1-19 score 0/1. Items 20-22 score 0/1/2.',
      'Reverse: imperfect on first two given. Discontinue: 3 consecutive 0s.',
    ],
  },

  digitsback: {
    instruction: "Now I'm going to say some numbers, and when I stop, you should say the numbers backward.",
    sample: {
      prompt: 'If I say 3 – 4, what would you say?  (Trial 2: "Let\'s try another: 5 – 1.")',
      onCorrect: "That's right.",
      onIncorrect: "That's not quite right. I said 3 – 4, so to say them backward, you should say 4 – 3.",
    },
    notes: [
      'Read each trial at 1 digit per second. Drop voice on the last digit.',
      'Administer both trials of every item. Do not repeat any trial.',
      'If asked to repeat: "I can only say them one time. Just take your best guess."',
      'Discontinue after 0 on both trials of an item.',
    ],
  },

  symspan: {
    instruction: "I will show you a page with symbols on it. Look carefully and remember the order. Then I will turn the page, and you will point to the symbols you saw in the same order you saw them.",
    sample: {
      prompt: 'Look carefully at the symbols and remember their order from left to right. (Allow 5 sec, then turn to the response page.) Now point to the two symbols I just showed you in the same order you saw them.',
      onCorrect: "That's right. Let's do some more.",
      onIncorrect: "That's not quite right. This was the first symbol and this was the second symbol. Let's try again.",
    },
    notes: [
      'Expose each stimulus page for exactly 5 seconds. Accurate timing is essential.',
      'Stim pages exposed ONE TIME only (except sample, which can repeat until understood).',
      'If asked for another exposure: "I can only show it one time. Just take your best guess."',
      'Items 1-2: single symbol, recognize it. Items 3-23: multiple symbols, identify in correct order.',
      'Discontinue after 3 consecutive imperfect scores.',
    ],
  },

  nsq: {
    instruction: 'Each box has one, two, three, or four squares. When I say "Go," name how many squares are in each box as fast as you can without making mistakes. Start at the first box, go in order, and don\'t skip any.',
    notes: [
      'Time limit: 75 seconds per item. Administer Sample, then Item 1, then Item 2.',
      'If misnames 2 in a row in the same row: point to the second misnamed quantity and say "Keep going from here."',
      'If skips a row or reverses: point to first box in the correct row and "Keep going from here."',
      'If hesitates >5 sec on a single quantity: "Go on to the next one." If hesitates at end of row: "Go on to the next row."',
      'Record each error with a slash mark. SC next to slash for self-corrections (do not count).',
      'Total raw score = sum of completion times across both items. Track NSQe (errors).',
    ],
  },

  comp: {
    instruction: 'I\'m going to ask you some questions. Answer each one as well as you can.',
    notes: [
      'Read each item exactly as written. Score 0, 1, or 2.',
      'Reverse: imperfect on first two given. Discontinue: 3 consecutive 0s.',
    ],
  },

  setrel: {
    instruction: "Look at the circles and the shapes inside them. Pick the option that goes in the missing spot.",
    sample: {
      prompt: 'These are all triangles (sweep finger around triangles in circle). Which one here (point across response options) goes here (point to question mark)?  (Item 1, used as teaching)',
      onCorrect: "That's right.",
      onIncorrect: "This triangle goes here. The others don't because they are not triangles.",
    },
    notes: [
      'If needed, read and point to the words in the circles for the examinee.',
      'If they say the correct answer isn\'t present: "Just pick the best one."',
      'Items 1-4, 5, and 9 are teaching items.',
      'Demo Items A-C are administered immediately before Item 5 for examinees who have not discontinued.',
      'Items 1-22 score 0/1. Items 23-27 score 0/1/2. Discontinue: 3 consecutive imperfect scores.',
    ],
  },

  spadd: {
    instruction: "I'll show you two grids with colored circles. Look at each grid for a few seconds, then combine them in your mind and place chips on the response grid to show the result.",
    notes: [
      'Expose each stimulus page (Grid 1 and Grid 2) for exactly 5 seconds. Stim pages exposed ONE TIME only.',
      'If reorienting: "Look at the grid so you can remember it." If asks for re-exposure: "I can only show it one time. Just take your best guess."',
      'Ages 16-69: Demos A&B, Sample A, Sample B, then Item 6. Ages 70-90 (or suspected ID): Demos A&B, Sample A, then Item 1.',
      'Use 3x3 response grid for Demos / Sample A / Items 1-5. Use 4x4 for Sample B / Items 6-23.',
      'Items 1-11: blue + white chips only. Items 12-23: blue + white + red chips.',
      'If they touch the grid before you record: ask them to wait. If chip placement is ambiguous: "Which one did you mean?"',
      'Record correctly placed chips by CIRCLING the color letter (B/W). Record incorrectly placed by WRITING the letter (B/W/R). All chips must be correct with no extras for the response to be correct.',
    ],
  },

  lns: {
    instruction: "I'm going to say some numbers and letters, and when I stop, you should say the number first, then the letter. For example, if I say C – 1, you should say 1 – C.",
    sample: {
      prompt: 'Now you try. A – 4.  (Sample A — for Items 1-2)',
      onCorrect: "That's right.",
      onIncorrect: "That's not quite right. I said A – 4, so you should say 4 – A. Say the number, then the letter.",
    },
    notes: [
      'Read each trial at 1 number/letter per second. Drop voice on the last element.',
      'Demo A + Sample A teach Items 1-2 (one number + one letter, number first).',
      'Demo B (3 elements, e.g. "2 – B – 1" → "1 – 2 – B") teaches Items 3-10. For these, recall numbers first in ascending order, THEN letters in alphabetical order.',
      'Credit for Items 3-10 is awarded even if letters are recalled BEFORE numbers, as long as both sequences are individually correct.',
      'Items 1-2 are teaching items. The digits 0 and letters O, I, L are excluded to avoid confusion.',
      'Do not repeat any trial. If asked: "I can only say them one time. Just take your best guess."',
    ],
  },
}

const RAW = {
  "similarities": {
    "1": {
      "prompt": "In what way are a FORK and a SPOON alike?",
      "scoring": {
        "2": [
          "Eating (utensils, tools); Utensils",
          "Things you eat with; Used to eat",
          "Silverware",
          "Deliver food to your mouth"
        ],
        "1": [
          "Eating; Eat (Q)",
          "Used to pick up food (Q)",
          "Have handles (Q) (On, Put them on) the table"
        ],
        "0": [
          "Long; Pointy",
          "Made of (plastic, metal, silver)"
        ]
      },
      "corrective": null
    },
    "2": {
      "prompt": "In what way are YELLOW and GREEN alike?",
      "scoring": {
        "2": [
          "Colors",
          "Make another color; [Any response with the word color]",
          "Colors of (leaves, grass, rainbow)",
          "On the color (spectrum, wheel)",
          "Hues"
        ],
        "1": [
          "Shades (Q)",
          "Light(s); Lighter; On a (traffic, stop) light (Q)",
          "In the rainbow (Q)",
          "Bright (Q)"
        ],
        "0": [
          "Red; Black; [Names another color without saying “color”]"
        ]
      },
      "corrective": null
    },
    "3": {
      "prompt": "In what way are a HORSE and a TIGER alike?",
      "scoring": {
        "2": [
          "Animals; Mammals",
          "Quadrupeds"
        ],
        "1": [
          "Living things; Alive (Q)",
          "Have (four legs, tails, eyes); [Names shared physical feature(s)] (Q)",
          "Run fast (Q)",
          "Strong (Q)"
        ],
        "0": [
          "Wild; Found in (nature, the wild) (Q)",
          "Have manes",
          "Ride them",
          "See them at the (zoo, circus) (Q)",
          "Tigers eat horses"
        ]
      },
      "corrective": "A horse and a tiger are both animals."
    },
    "4": {
      "prompt": "In what way are a PIANO and a TRUMPET alike?",
      "scoring": {
        "2": [
          "Musical instruments; Instruments",
          "Musical; (Make, Play) music"
        ],
        "1": [
          "Music; [Vague reference to music] (Q)",
          "Use notes; [Names technical aspect of music] (Q) (Used in, Part of) (orchestras, bands, symphonies) (Q)",
          "Play them (Q)"
        ],
        "0": [
          "Make (sounds, noise) (Q)",
          "Have keys (Q)",
          "You use your (fingers, hands) on them (Q)"
        ]
      },
      "corrective": "A piano and a trumpet are both musical instruments."
    },
    "5": {
      "prompt": "In what way are a CARROT and an ONION alike?",
      "scoring": {
        "2": [
          "Vegetables; Veggies",
          "Root vegetables; Roots"
        ],
        "1": [
          "Produce (Q)",
          "Food (Q)",
          "Cook them",
          "Make soup; Part of a salad (In, From) the ground (Q)",
          "To eat; Edible (Q)",
          "Taste (good, bad)",
          "Grow; Grown"
        ],
        "0": [
          "Good (Q)",
          "Layers"
        ]
      },
      "corrective": null
    },
    "6": {
      "prompt": "In what way are a BOAT and a TRUCK alike?",
      "scoring": {
        "2": [
          "Transportation; Transport (people, things)",
          "Vehicles; Conveyances (Means, Modes) of (travel, traveling); For (travel, traveling)",
          "Way of getting from one place to another (Take, Carry) you (places, somewhere)"
        ],
        "1": [
          "Ride in them (Q)",
          "Move; Mobile (Q)",
          "Go places (Q)",
          "Carry (people, things) (Q) (Drive, Steer, Operate) them (Q)",
          "Used for (pleasure, recreation) (Q)"
        ],
        "0": [
          "Automobiles; Vessels (Q)",
          "Have (motors, engines, seats, a steering wheel) (Q)",
          "Sit in them",
          "Machines; Mechanical (Q) (Run on, Require) fuel (Q)",
          "Boat is for the sea, and truck is for the street"
        ]
      },
      "corrective": null
    },
    "7": {
      "prompt": "In what way are a NOSE and a TONGUE alike?",
      "scoring": {
        "2": [
          "Senses; (Used for, Part of) senses",
          "Sensory (receptors, parts, points) (Sensory, Perception) organs",
          "Help you taste things"
        ],
        "1": [
          "Facial (parts, features) (Q) (Parts of, On) your head (Q)",
          "Body parts; Parts of the body (Q)",
          "Organs (Q)"
        ],
        "0": [
          "Face; Head (Q)",
          "Help you breathe and eat",
          "Can breathe through nose and mouth",
          "Body [no further elaboration] (Q)",
          "Provide body with smell and taste (Q)"
        ]
      },
      "corrective": null
    },
    "8": {
      "prompt": "In what way are STICKY and FUZZY alike?",
      "scoring": {
        "2": [
          "Textures",
          "Sensations; Sensory feelings",
          "Sense of touch; Tactile",
          "Surfaces; (Features, Conditions,",
          "Descriptions) of a surface",
          "Ways (objects, things, surfaces) feel",
          "Feelings; Things you feel",
          "Characteristics of a situation"
        ],
        "1": [
          "Touch them (Q)",
          "Require contact between two things (Q)"
        ],
        "0": [
          "(Part, One) of the five senses (Q) (Stick, Cling, Bind) to things (Q)",
          "Part of an object",
          "Messy; Gross; Aggravating",
          "How (toys, dolls, objects) are (Q)",
          "[Refers to hook-and-loop fastener material that is sticky and fuzzy]"
        ]
      },
      "corrective": null
    },
    "9": {
      "prompt": "In what way are FOOD and GASOLINE alike?",
      "scoring": {
        "2": [
          "Energy; Power; Energize; (Forms,",
          "Types, Kinds, Sources) of energy",
          "Fuel; Forms of fuel",
          "Consumables; Are consumed",
          "Resources; (Products, Sources) from the Earth"
        ],
        "1": [
          "Keep (you, something) going;",
          "(Make, Help) you (go, move, get started) (Q)",
          "Organic(s); Made of carbon (Q)",
          "Consumer goods; Commodities (Q)",
          "Essential for functioning (Q)",
          "Needed; Necessary; Necessities;",
          "Essentials (Q)",
          "Need to run (Q)",
          "Fill up on them (Q)"
        ],
        "0": [
          "(Buy, Pay for) them (Q) (Come from, In) the ground (Q)",
          "For cooking; Use gas to (heat, cook) food",
          "Toxic; Poisonous",
          "Use them; Use them daily (Q)",
          "Need to (exist, survive, live) (Q)",
          "For trips",
          "Odors; You can smell them"
        ]
      },
      "corrective": null
    },
    "10": {
      "prompt": "In what way are MUSIC and TIDES alike?",
      "scoring": {
        "2": [
          "Rhythmic; Have rhythm",
          "Have a (pace, beat, tempo)",
          "Peak and fade; Ebb and flow;",
          "Wax and wane",
          "Move in cycles (Have, Are) waves; Wavy",
          "Have (highs and lows, ups and downs)"
        ],
        "1": [
          "Follow a pattern (Q)",
          "Always changing (Q)",
          "Affect (moods, feelings, emotions) (Q)",
          "Flow (Q)",
          "Soothing; Relaxing; Calming (Q)",
          "Move; Have (movement, motion) (Q)"
        ],
        "0": [
          "Make (sounds, noise); You hear them;",
          "Loud (Q)",
          "Music of waves; Waves sound like music",
          "Things that come in; Come in and out (Q)",
          "Have (harmony, melody)",
          "Artistic"
        ]
      },
      "corrective": null
    },
    "11": {
      "prompt": "In what way are PUSH and CLAP alike?",
      "scoring": {
        "2": [
          "(Actions, Movements) that need (contact, force) (Need, Use) your (hands, arms)",
          "Involve (exertion, things coming together, applying pressure)",
          "Press with (force, energy)",
          "Actions that (oppose, go against something, involve resistance)",
          "Expressions of (emotion, enthusiasm)",
          "Motivating; Get (attention, someone to do something)"
        ],
        "1": [
          "Actions; You do them (Q)",
          "Involve your body (Q)",
          "Force; Energy (Q)",
          "Movements; Motions (Q)",
          "Happens (at a concert, in a crowd) (Q)"
        ],
        "0": [
          "Hands; Arms (Q)",
          "Make (sound, noise) (Q)",
          "Push hands together to clap",
          "Feelings; Emotions; Excited (Q)",
          "Attacks",
          "Clap when you’re happy, push when you’re angry"
        ]
      },
      "corrective": null
    },
    "12": {
      "prompt": "In what way are a PAINTING and a SONG alike?",
      "scoring": {
        "2": [
          "(Works, Expressions, Pieces, Forms) of art",
          "Creative works",
          "Art; Artistic",
          "Artistic (creations, presentations)"
        ],
        "1": [
          "Expressions; Forms of expression;",
          "Express ideas (Q)",
          "Creative (Q)",
          "Composed; Creations of humans;",
          "Human-made (Q)",
          "Form (pictures, images) in your mind (Q)",
          "Represent something (Q)",
          "Meaningful; (Stir, Evoke,",
          "Express) feelings"
        ],
        "0": [
          "Make you (happy, sad, tranquil, relax);",
          "Pleasing (Q)",
          "Beautiful; Pretty (Q)",
          "People like them; Nice (Describe, Say) something;",
          "Tell a story (Q)",
          "Entertaining; Hobbies (Q)",
          "On paper"
        ]
      },
      "corrective": null
    },
    "13": {
      "prompt": "In what way are an ANCHOR and a FENCE alike?",
      "scoring": {
        "2": [
          "(Hold, Keep, Control, Secure) something",
          "Fix (something, someone) in (place, an area); Keep things fixed in (place, an area)",
          "Restraining devices (Restrict, Limit) (mobility, movement, things)",
          "Set (boundaries, limits); Only let you go so far",
          "For (safety, security)"
        ],
        "1": [
          "Stops things; Keeps things from going (Q)",
          "Containing; Contain something;",
          "Confine (Q)",
          "Boundaries; Borders; Perimeters;",
          "Limits (Q)",
          "Protect things; For protection;",
          "Protective devices (Q)"
        ],
        "0": [
          "Stationary objects; Are fixed in place (Q)",
          "Stability; Keep things stable (Q)",
          "Barriers (Q) (Need to be, Are) grounded (Q)",
          "Made of (metal, wood); [Names shared physical feature]"
        ]
      },
      "corrective": null
    },
    "14": {
      "prompt": "In what way are WISH and EXPECT alike?",
      "scoring": {
        "2": [
          "Forms of anticipation; Things you anticipate",
          "Involve things that have not yet happened",
          "Not (factual, certain); Uncertain; Have an unknown (ending, outcome)",
          "Things that (could, may, could not, may not) happen",
          "Future events; Have to do with the future",
          "Forecasting"
        ],
        "1": [
          "(Something, Things) you want to happen (Q)",
          "Forms of thought; Ways to think about things (Q)",
          "Looking forward to something",
          "Involve (getting, obtaining, receiving) something (Q)",
          "Hopes; Desires; Wants; Dreams",
          "Feelings",
          "Things that will happen in the future"
        ],
        "0": [
          "Outcomes (Q)",
          "If you wish for something, you expect it; You expect your wish to come true",
          "Expectations (Q)",
          "Disappointments"
        ]
      },
      "corrective": null
    },
    "15": {
      "prompt": "In what way are ALWAYS and NEVER alike?",
      "scoring": {
        "2": [
          "Extremes; Extremes of (time, frequency)",
          "Absolute(s)",
          "All-encompassing; All-inclusive",
          "Definite; Definitive (expressions, times) (Ends, Sides) of a (spectrum, continuum)"
        ],
        "1": [
          "Eternal things (Q)",
          "Final; Forever (Q)",
          "Time; Time (measurements, frames) (Q)",
          "Frequency",
          "Certainties (Q)",
          "Spectrum; On a continuum;",
          "Continuous (Q)",
          "Things that do not change;",
          "Constants; Permanent (Q)"
        ],
        "0": [
          "When things happen (Q)",
          "Things you have to do; Reactions",
          "Decisions; Choices",
          "Finite",
          "Possibilities; Probabilities;",
          "(Seldom, Not) true; False (Q)",
          "Things you say; Answers; Promises"
        ]
      },
      "corrective": null
    },
    "16": {
      "prompt": "In what way are a BRICK and a PARAGRAPH alike?",
      "scoring": {
        "2": [
          "Building (components, parts)",
          "Used to (make, create, construct) something; Build something",
          "Blocks",
          "Parts of (a whole, something bigger);",
          "Part of something",
          "Foundation; Base"
        ],
        "1": [
          "Building(s); Construction; [Vague reference to building] (Q)",
          "Structure; Used to shape into something (Q) (Start, Begin, Complete) something;",
          "Beginning; Ending",
          "Put together (Q)",
          "Made by humans; Creations (Q)",
          "Layers; Stackable; Stack up",
          "Hold something together"
        ],
        "0": [
          "Big; Long; Rectangles; Have a form;",
          "[Refers to shape or size] (Q)",
          "Chunks; Heavy; Weighty",
          "Divider; Separator; Boundaries;",
          "Make space",
          "Can be (red, read) (Q)",
          "Solid; Strong; Hard",
          "Meaningful; Hurt you",
          "Defined; Have (lines, outlines)",
          "Finite"
        ]
      },
      "corrective": null
    },
    "17": {
      "prompt": "In what way are OPTION and IMAGINATION alike?",
      "scoring": {
        "2": [
          "Potential; Possibilities;",
          "Probable; Likely",
          "Freedom; Free will",
          "Bounds; Limits"
        ],
        "1": [
          "Involved when thinking ahead; Used when (deciding, choosing) (Q)",
          "Things you select from a (wider, larger) (set, range) (Go before, Precede) (actions, doing something) (Q)",
          "Affect (outcomes, conclusions)",
          "Creativity"
        ],
        "0": [
          "Things you choose; Choices;",
          "Alternatives; [Vague reference to choices or decisions] (Q) (Involve, Related to) thinking; Things to consider (Q)",
          "Action; Effort",
          "Opportunity",
          "Related to the future (Q)",
          "Infinite; Limitless",
          "Everyone has them; Always available to someone",
          "If you have more imagination, you have more options"
        ]
      },
      "corrective": null
    },
    "18": {
      "prompt": "In what way are an ENEMY and a FRIEND alike?",
      "scoring": {
        "2": [
          "Relationships at the extremes of (closeness, intimacy, feeling)",
          "Relationships that stir strong feelings",
          "People who strongly (influence, affect) your life",
          "People you have strong feelings for"
        ],
        "1": [
          "Relationships (Q)",
          "Extremes (Q) (Associations, Interactions) between people (Q) (Classifications, Categories) of people",
          "Ways of (judging, perceiving, describing) people",
          "People who (influence, affect) your life (Q)",
          "People you have feelings for (Q)",
          "Feelings you have for (someone, people)",
          "People (who react to you, you react to)"
        ],
        "0": [
          "People you (know, have contact with, deal with) (Q)",
          "Individuals; Humans (Q)",
          "People have them",
          "One you (like, trust), and one you don’t (like, trust)",
          "You should (keep them close, know them well) (Q)",
          "Acquaintances",
          "Human nature",
          "“Frenemy;” Same person; An enemy can be a friend; A friend can be an enemy"
        ]
      },
      "corrective": null
    }
  },
  "blockdesign": {
    "1":  { "prompt": "", "stim": "stim1/p005.png", "scoring": { "2": [], "1": [], "0": [] }, "corrective": null },
    "2":  { "prompt": "", "stim": "stim1/p006.png", "scoring": { "2": [], "1": [], "0": [] }, "corrective": null },
    "3":  { "prompt": "", "stim": "stim1/p007.png", "scoring": { "2": [], "1": [], "0": [] }, "corrective": null },
    "4":  { "prompt": "", "stim": "stim1/p008.png", "scoring": { "2": [], "1": [], "0": [] }, "corrective": null },
    "5":  { "prompt": "", "stim": "stim1/p009.png", "scoring": { "2": [], "1": [], "0": [] }, "corrective": null },
    "6":  { "prompt": "", "stim": "stim1/p010.png", "scoring": { "2": [], "1": [], "0": [] }, "corrective": null },
    "7":  { "prompt": "", "stim": "stim1/p011.png", "scoring": { "2": [], "1": [], "0": [] }, "corrective": null },
    "8":  { "prompt": "", "stim": "stim1/p012.png", "scoring": { "2": [], "1": [], "0": [] }, "corrective": null },
    "9":  { "prompt": "", "stim": "stim1/p013.png", "scoring": { "2": [], "1": [], "0": [] }, "corrective": null },
    "10": { "prompt": "", "stim": "stim1/p014.png", "scoring": { "2": [], "1": [], "0": [] }, "corrective": null },
    "11": { "prompt": "", "stim": "stim1/p015.png", "scoring": { "2": [], "1": [], "0": [] }, "corrective": null },
    "12": { "prompt": "", "stim": "stim1/p016.png", "scoring": { "2": [], "1": [], "0": [] }, "corrective": null },
    "13": { "prompt": "", "stim": "stim1/p017.png", "scoring": { "2": [], "1": [], "0": [] }, "corrective": null },
    "14": { "prompt": "", "stim": "stim1/p018.png", "scoring": { "2": [], "1": [], "0": [] }, "corrective": null }
  },
  "matrix": {
    "SA": { "prompt": "Which one here finishes the picture?", "stim": "stim1/p020.png", "answer": 5, "scoring": { "2": [], "1": [], "0": [] }, "corrective": null },
    "SB": { "prompt": "Which one here finishes the picture?", "stim": "stim1/p021.png", "answer": 4, "scoring": { "2": [], "1": [], "0": [] }, "corrective": null },
    "1":  { "prompt": "Which one here finishes the picture?", "stim": "stim1/p022.png", "answer": 1, "scoring": { "2": [], "1": [], "0": [] }, "corrective": null },
    "2":  { "prompt": "Which one here finishes the picture?", "stim": "stim1/p023.png", "answer": 3, "scoring": { "2": [], "1": [], "0": [] }, "corrective": null },
    "3":  { "prompt": "Which one here finishes the picture?", "stim": "stim1/p024.png", "answer": 2, "scoring": { "2": [], "1": [], "0": [] }, "corrective": null },
    "4":  { "prompt": "Which one here finishes the picture?", "stim": "stim1/p025.png", "answer": 5, "scoring": { "2": [], "1": [], "0": [] }, "corrective": null },
    "5":  { "prompt": "Which one here finishes the picture?", "stim": "stim1/p026.png", "answer": 3, "scoring": { "2": [], "1": [], "0": [] }, "corrective": null },
    "6":  { "prompt": "Which one here finishes the picture?", "stim": "stim1/p027.png", "answer": 4, "scoring": { "2": [], "1": [], "0": [] }, "corrective": null },
    "7":  { "prompt": "Which one here finishes the picture?", "stim": "stim1/p028.png", "answer": 4, "scoring": { "2": [], "1": [], "0": [] }, "corrective": null },
    "8":  { "prompt": "Which one here finishes the picture?", "stim": "stim1/p029.png", "answer": 3, "scoring": { "2": [], "1": [], "0": [] }, "corrective": null },
    "9":  { "prompt": "Which one here finishes the picture?", "stim": "stim1/p030.png", "answer": 1, "scoring": { "2": [], "1": [], "0": [] }, "corrective": null },
    "10": { "prompt": "Which one here finishes the picture?", "stim": "stim1/p031.png", "answer": 5, "scoring": { "2": [], "1": [], "0": [] }, "corrective": null },
    "11": { "prompt": "Which one here finishes the picture?", "stim": "stim1/p032.png", "answer": 2, "scoring": { "2": [], "1": [], "0": [] }, "corrective": null },
    "12": { "prompt": "Which one here finishes the picture?", "stim": "stim1/p033.png", "answer": 1, "scoring": { "2": [], "1": [], "0": [] }, "corrective": null },
    "13": { "prompt": "Which one here finishes the picture?", "stim": "stim1/p034.png", "answer": 2, "scoring": { "2": [], "1": [], "0": [] }, "corrective": null },
    "14": { "prompt": "Which one here finishes the picture?", "stim": "stim1/p035.png", "answer": 5, "scoring": { "2": [], "1": [], "0": [] }, "corrective": null },
    "15": { "prompt": "Which one here finishes the picture?", "stim": "stim1/p036.png", "answer": 4, "scoring": { "2": [], "1": [], "0": [] }, "corrective": null },
    "16": { "prompt": "Which one here finishes the picture?", "stim": "stim1/p037.png", "answer": 1, "scoring": { "2": [], "1": [], "0": [] }, "corrective": null },
    "17": { "prompt": "Which one here finishes the picture?", "stim": "stim1/p038.png", "answer": 3, "scoring": { "2": [], "1": [], "0": [] }, "corrective": null },
    "18": { "prompt": "Which one here finishes the picture?", "stim": "stim1/p039.png", "answer": 2, "scoring": { "2": [], "1": [], "0": [] }, "corrective": null },
    "19": { "prompt": "Which one here finishes the picture?", "stim": "stim1/p040.png", "answer": 1, "scoring": { "2": [], "1": [], "0": [] }, "corrective": null },
    "20": { "prompt": "Which one here finishes the picture?", "stim": "stim1/p041.png", "answer": 5, "scoring": { "2": [], "1": [], "0": [] }, "corrective": null },
    "21": { "prompt": "Which one here finishes the picture?", "stim": "stim1/p042.png", "answer": 1, "scoring": { "2": [], "1": [], "0": [] }, "corrective": null },
    "22": { "prompt": "Which one here finishes the picture?", "stim": "stim1/p043.png", "answer": 3, "scoring": { "2": [], "1": [], "0": [] }, "corrective": null },
    "23": { "prompt": "Which one here finishes the picture?", "stim": "stim1/p044.png", "answer": 2, "scoring": { "2": [], "1": [], "0": [] }, "corrective": null },
    "24": { "prompt": "Which one here finishes the picture?", "stim": "stim1/p045.png", "answer": 4, "scoring": { "2": [], "1": [], "0": [] }, "corrective": null },
    "25": { "prompt": "Which one here finishes the picture?", "stim": "stim1/p046.png", "answer": 5, "scoring": { "2": [], "1": [], "0": [] }, "corrective": null },
    "26": { "prompt": "Which one here finishes the picture?", "stim": "stim1/p047.png", "answer": 3, "scoring": { "2": [], "1": [], "0": [] }, "corrective": null }
  },
  "vocab": {
    "1": {
      "prompt": "What is this?",
      "stageDirection": "Point to the picture in the stimulus book.",
      "stim": "stim1/p049.png",
      "scoring": {
        "2": [],
        "1": ["Book"],
        "0": ["Reader (Q)", "Read it (Q)", "Story (Q)"]
      },
      "corrective": null
    },
    "2": {
      "prompt": "What is this?",
      "stageDirection": "Point to the picture in the stimulus book.",
      "stim": "stim1/p050.png",
      "scoring": {
        "2": [],
        "1": ["Airplane; Plane", "Aircraft", "Jet"],
        "0": ["Fly; Flies; Flyer (Q)", "Ride it (Q)", "Takes you places (Q)"]
      },
      "corrective": null
    },
    "3": {
      "prompt": "What is this?",
      "stageDirection": "Point to the picture in the stimulus book.",
      "stim": "stim1/p051.png",
      "scoring": {
        "2": [],
        "1": ["Basket"],
        "0": ["Container (Q)", "Holder; Holds things (Q)", "(Carry, Put) things in it (Q)"]
      },
      "corrective": null
    },
    "4": {
      "prompt": "BANANA. What is a banana?",
      "scoring": {
        "2": [
          "Fruit",
          "Plantain"
        ],
        "1": [
          "Food; Eat it (Q)",
          "Healthy; Nutritious; Good for you (Q)",
          "Curved and sweet; Crescent shaped and soft inside; [Names two or more attributes]",
          "Grows on trees (Q) (Yellow, Green, Purple, Brown) (peel, rind, skin)",
          "Peel it"
        ],
        "0": [
          "Tastes good; Sweet (Q)",
          "Full of potassium; Starchy (Q)",
          "Has a (peel, skin, rind); Curved;",
          "Sweet; [Names one attribute] (Q)",
          "Tropical (Q)",
          "Yellow; Green; Purple; Brown (Q)",
          "For monkeys",
          "Banana (bread, pudding)"
        ]
      },
      "corrective": "A banana is a type of fruit."
    },
    "5": {
      "prompt": "CAT. What is a cat?",
      "scoring": {
        "2": [
          "Animal; Mammal",
          "Kitty; Kitten",
          "Feline"
        ],
        "1": [
          "Creature (Q)",
          "Pet; Domesticated (Q)",
          "Purrs and (chases mice, hunts);",
          "[Names two definitive behaviors] (Q) (Soft, Furry) with (whiskers, four legs, claws); [Names two or more attributes] (Q)",
          "Lion; Tiger; Leopard (Q) (Purrs, Meows, Chases mice) and has (whiskers, soft fur, four legs);",
          "[Names one definitive behavior and one attribute] (Q)"
        ],
        "0": [
          "Nocturnal; Purrs; Meows; Chases mice; Hunts; [Names one definitive behavior] (Q)",
          "[Demonstrates cat behavior] (Q)",
          "Soft; Whiskers; Four legs; Claws;",
          "[Names one attribute] (Q)",
          "[Names fictional cat]"
        ]
      },
      "corrective": "A cat is a type of animal."
    },
    "6": {
      "prompt": "GLOVE. What is a glove?",
      "scoring": {
        "2": [
          "(Put, Wear, Goes) on (hand, fingers)",
          "Protects hand; Keeps hand from getting (cold, dirty, germs);",
          "Keeps hand warm",
          "Covering for (hand, fingers) (Clothes, Garment) for hands"
        ],
        "1": [
          "Wear it; Put it on (Q)",
          "Protection; Keeps you warm; [No reference to hand or fingers] (Q)",
          "Mitten; Mitt (Q)",
          "Catch with it (Q)",
          "Covering (Q)",
          "Clothing; Garment (Q)",
          "For (hand, fingers) (Q)"
        ],
        "0": [
          "[Demonstrates putting on glove;",
          "Points to hand] (Q)",
          "For (winter, the cold) (Q)",
          "For baseball (Q)",
          "Made of (leather, cotton, plastic, latex) (Q)",
          "Accessory (Q)",
          "Come in pairs; Match"
        ]
      },
      "corrective": null
    },
    "7": {
      "prompt": "IMITATE. What does imitate mean?",
      "scoring": {
        "2": [
          "Copy; Duplicate; Replicate; Reproduce (Make, Do) something the same way as someone else (Pretend to be, Act like) (someone, something)",
          "Copycat; Ape; Mimic; Mock",
          "Emulate; (Mirror, Match) (someone, something)",
          "Follow as a (pattern, model)"
        ],
        "1": [
          "Repeat; (Say, Do) something again (Q)",
          "Reenact; To act again (Q)",
          "Follow (Q)",
          "Make fun of"
        ],
        "0": [
          "(Say, Do) something (Q)",
          "To act out (Q)",
          "Pretend; Make believe (Q)",
          "Same"
        ]
      },
      "corrective": null
    },
    "8": {
      "prompt": "Figure Weights",
      "scoring": {
        "2": [],
        "1": [],
        "0": []
      },
      "corrective": null
    },
    "9": {
      "prompt": "MEND. What does mend mean?",
      "scoring": {
        "2": [
          "Repair; Fix; Make (whole, usable) again",
          "Heal; Cure",
          "Improve; Make better; Reform (Put, Sew) something back together;",
          "Sew up (holes, a rip); Patch",
          "Correct; Make right"
        ],
        "1": [
          "(Put, Bring, Glue) together;",
          "Combine (Q)",
          "Feel better (Q)",
          "Sew; Stitch; Darn (Q)",
          "Bring friends together;",
          "[Refers to mending fences] (Q)"
        ],
        "0": [
          "Create; Make (Q)",
          "Change (Q)"
        ]
      },
      "corrective": null
    },
    "10": {
      "prompt": "CONFIDE. What does confide mean?",
      "scoring": {
        "2": [
          "Trust; Entrust (Tell, Share) something (private, confidential, you don’t want repeated) (Tell, Share) in (confidence, secrecy, secret) (Tell someone, Share) a secret(s)"
        ],
        "1": [
          "Tell; Tell someone (Q)",
          "Have (confidence, belief); Belief in oneself; [Defines confidence] (Q)",
          "Confess; Admit (Q)",
          "Share (Q)",
          "Talk to someone; Express;",
          "Communicate (Q)",
          "Disclose; Divulge (Q)"
        ],
        "0": [
          "Secret; It’s confidential (Q)",
          "Seek (guidance, support, comfort) (Q)",
          "Ask for (help, advice) (Q)",
          "Hide; Keep something to yourself"
        ]
      },
      "corrective": null
    },
    "11": {
      "prompt": "TRANSCRIBE. What does transcribe mean?",
      "scoring": {
        "2": [
          "Make a written copy; Copy down",
          "Translate; Write out in another language",
          "Write; Record (Transfer, Put) speech into written form",
          "Rewrite",
          "Take (shorthand, dictation, notes)"
        ],
        "1": [
          "Copy; Duplicate (Q)",
          "Writing; Document (Q)",
          "Interpret (Q)",
          "Transfer (Q)",
          "Transform; Change (Q)",
          "Decode; Decipher (Q)"
        ],
        "0": [
          "Read out loud (Q)",
          "Have another meaning (Q)",
          "Tell a story",
          "Move (Q)",
          "Explain; Make understandable (Q)"
        ]
      },
      "corrective": null
    },
    "12": {
      "prompt": "SERENE. What does serene mean?",
      "scoring": {
        "2": [
          "Peaceful; Calm; Tranquil; Placid",
          "Free from (disturbance, agitation, noise)",
          "Quiet; Still; Restful"
        ],
        "1": [
          "Happy; Content (Q)",
          "Pleasant (Q)",
          "Smooth",
          "Mellow; Relaxed (Q)",
          "Soothing; Comforting (Q)"
        ],
        "0": [
          "Feeling (Q)",
          "Perfect",
          "Beautiful; Breathtaking (Q)",
          "Clean"
        ]
      },
      "corrective": null
    },
    "13": {
      "prompt": "EVOLVE. What does evolve mean?",
      "scoring": {
        "2": [
          "(Change, Grow, Transform) into something better",
          "Change and (grow, progress) over time",
          "Develop",
          "Adapt",
          "Biological (change, transformation) in living things to (ensure survival, fit environment)",
          "Transformation of simple life forms to more complex ones"
        ],
        "1": [
          "Change and grow (Q)",
          "Change; Change over time;",
          "[No implication of directional change] (Q)",
          "Progress; Advance; Move (ahead, forward) (Q)",
          "Transform; Go from one stage to (another, the next) (Q)",
          "Metamorphosis; Turn into something else (Q)",
          "Grow; Growth; Mature (Q)",
          "Improve; Get better (Q)"
        ],
        "0": [
          "Something that happens over time (Q)",
          "Create; Bring forth; Beginning of something (Q)",
          "Become; Come (about, out of something) (Q)",
          "Expand; Get bigger"
        ]
      },
      "corrective": null
    },
    "14": {
      "prompt": "EMPATHY. What is empathy?",
      "scoring": {
        "2": [
          "Ability to (share, understand, relate to) another’s (experiences, feelings)",
          "Able to place yourself in another’s position",
          "Feel what another is feeling (Walking, Put yourself) in someone else’s shoes"
        ],
        "1": [
          "Compassion; Sympathy;",
          "Pity (Q)",
          "Feel (bad, sorry, sorrow) for someone (Q)",
          "Caring; Concern; Feel for another (Q)",
          "Understand; Relate to (Q)"
        ],
        "0": [
          "Sad; Sadness; Sorrow (Q)",
          "Sorry; Show remorse",
          "Feeling; Emotion (Q)"
        ]
      },
      "corrective": null
    },
    "15": {
      "prompt": "FEASIBLE. What does feasible mean?",
      "scoring": {
        "2": [
          "Possible; Doable; (Able to, Can) be done",
          "Achievable; Attainable; Practicable;",
          "Workable; Capable of being done",
          "Realistic; Can be accomplished",
          "Reasonable; Probable; Likely;",
          "Something could happen"
        ],
        "1": [
          "Acceptable; Alright (Q)",
          "Adequate; Good enough (Q)",
          "Reachable; Accessible",
          "Believable; Credible; Plausible (Q)",
          "Logical; Makes sense (Q)"
        ],
        "0": [
          "Affordable (Q)",
          "Fair; Useful",
          "Easy (Q)",
          "Understandable; Relevant"
        ]
      },
      "corrective": null
    },
    "16": {
      "prompt": "CULTIVATE. What does cultivate mean?",
      "scoring": {
        "2": [
          "Grow; Care for; Raise; Tend",
          "Nurture; Nourish (Plow, Till) soil to (plant, farm)",
          "To culture (pearls, bacteria) (Prepare, Work on) land to raise crops;",
          "Harvest",
          "Encourage; Develop; Promote growth",
          "Build relationships"
        ],
        "1": [
          "Plow; Till; Turn soil; Prepare land (Q)",
          "To plant (Q)",
          "Teach; Inform",
          "Farming; Gardening; Work on a farm (Q)",
          "Gather; Collect; Bring together (Q)",
          "Improve; Make better"
        ],
        "0": [
          "Create; To produce; Bring about (Q)",
          "Prepare (Q) (Put, Mix, Work) together",
          "Crops; Plants; Food (Q)",
          "Dig (Q)",
          "Culture (Q)"
        ]
      },
      "corrective": null
    },
    "17": {
      "prompt": "ACUTE. What does acute mean?",
      "scoring": {
        "2": [
          "Sharp; Keen; Sensitive",
          "Severe; Intense (Sudden, Rapid) onset with short duration",
          "Lasting a short time",
          "Opposite of (chronic, obtuse)",
          "Less than 90 degrees; [Names angle size under 90°]",
          "Critical; Urgent; Very serious;",
          "Need immediate attention",
          "Ending in a sharp point"
        ],
        "1": [
          "Sudden; Rapid; Quick (Q)",
          "Short; Brief (Q)",
          "Painful (Q)",
          "Strong (Q)",
          "Observant; Aware",
          "Angle; Triangle (Q)",
          "Serious; Important (Q)",
          "Immediate; Right now (Q)",
          "Specific; Precise; Accurate; Pinpoint",
          "To the point"
        ],
        "0": [
          "Acute (appendicitis, illness) (Q)",
          "Sick; Illness (Q)",
          "Bad",
          "Small; Narrow (Q)",
          "In (math, geometry) (Q)"
        ]
      },
      "corrective": null
    },
    "18": {
      "prompt": "COAGULATE. What does coagulate mean?",
      "scoring": {
        "2": [
          "Clot; Clotting",
          "Thicken; Harden",
          "Blood coming together to (stop bleeding, form a scab)",
          "Clump; Curdle",
          "Congeal; Jell; Gel; Solidify; Liquid changing to more solid state (Gather, Come, Stick) together into a (thick mass, group)"
        ],
        "1": [
          "(Clog, Build) up (Q)",
          "Stop (blood flow, bleeding) (Q)",
          "Condense (Q)",
          "Change form (Q) (Gather, Come, Stick, Bring, Join, Put) together (Q) (Form, Bond, Bunch) together (Q)",
          "Combine; Mix (Q)"
        ],
        "0": [
          "Blood (Q)",
          "Stop (Q)",
          "Separate",
          "Change (Q)",
          "To dry up (Q)"
        ]
      },
      "corrective": null
    },
    "19": {
      "prompt": "DECORUM. What is decorum?",
      "scoring": {
        "2": [
          "(Proper, Polite, Respectful) behavior",
          "Manners; Way you should (act, behave)",
          "Orderliness; Fit certain set of rules",
          "Etiquette; Socially acceptable behavior",
          "Decency; Propriety",
          "Politeness; Civility"
        ],
        "1": [
          "Proper (Q)",
          "Demeanor; Behavior;",
          "How one behaves (Q)",
          "Rules (Q)",
          "Dignity; Class; High position in society (Q)",
          "Poise (Q)"
        ],
        "0": [
          "Attitude (Q)",
          "Quiet; Subdued (Q)",
          "Appearance (Q)",
          "Fancy"
        ]
      },
      "corrective": null
    },
    "20": {
      "prompt": "PRAGMATIC. What does pragmatic mean?",
      "scoring": {
        "2": [
          "Sensible; Down to earth",
          "Uses (common sense, good judgment)",
          "Practical",
          "Matter-of-fact; Realistic"
        ],
        "1": [
          "Reasonable; Logical; Rational (Q)",
          "Based on (what works, facts) (Q)",
          "Useful",
          "Objective; See both sides of an issue (Q)",
          "Methodical; Systematic; Step-by-step"
        ],
        "0": [
          "Thoughtful; Thinks something (out, through) (Q)",
          "Careful",
          "Set in their ways",
          "Problem solver (Q)",
          "Problems; Problematic",
          "Difficult; Hard to solve",
          "Smart"
        ]
      },
      "corrective": null
    },
    "21": {
      "prompt": "DIATRIBE. What is a diatribe?",
      "scoring": {
        "2": [
          "Tirade; Rant; Harangue",
          "Verbal (browbeating, attack) (Angry, Bitter, Critical) (speech, piece of writing)"
        ],
        "1": [
          "Rave; Talk loudly; Shouting (Q)",
          "Upset and going on and on (Q)",
          "Complaint; Fussing at someone",
          "Long-winded talk; Long (speech, piece of writing); Monologue (Q)",
          "Emotional speech (Q)",
          "Criticism"
        ],
        "0": [
          "Temper tantrum; Throw a fit (Q)",
          "Talk; Speech; Conversation (Q)",
          "Going on and on (Q)",
          "Argument; Angry disagreement (Q)",
          "Soapbox (Q)",
          "Story; Manifesto"
        ]
      },
      "corrective": null
    },
    "22": {
      "prompt": "PALLIATE. What does palliate mean?",
      "scoring": {
        "2": [
          "Decrease (pain, symptoms, suffering)",
          "Alleviate; Soothe; Relieve; Ease",
          "Reduce (intensity, severity)",
          "Cover by excuses and apologies",
          "Make more comfortable"
        ],
        "1": [
          "Reduce; Decrease (Q)",
          "Calm; Calm down (Q)",
          "Make better; Smooth over (Q)"
        ],
        "0": [
          "Care for (Q)",
          "Help (Q)",
          "Palliative care (Q)",
          "Cure; Heal"
        ]
      },
      "corrective": null
    },
    "23": {
      "prompt": "TACITURN. What does taciturn mean?",
      "scoring": {
        "2": [
          "Disinclined to talk; Reluctant to speak",
          "Quiet; Silent",
          "Laconic; Tight-lipped;",
          "Reticent; Reserved",
          "Not talkative; Doesn’t talk a lot"
        ],
        "1": [
          "Inhibited; Introverted (Q)",
          "Bashful; Shy (Q)",
          "Unsocial (Q)",
          "Blunt; Brief"
        ],
        "0": [
          "Stern; Solemn; Serious (Q)",
          "Grumpy; Moody (Q)",
          "Stubborn",
          "Peaceful; Calm (Q)",
          "Melancholy"
        ]
      },
      "corrective": null
    },
    "24": {
      "prompt": "PROPITIOUS. What does propitious mean?",
      "scoring": {
        "2": [
          "Favorable; Advantageous",
          "Encouraging",
          "Promising; Auspicious; Hopeful",
          "Likely to have good (results, outcome);",
          "Leads to success"
        ],
        "1": [
          "Fortunate; Lucky (Q)",
          "Beneficial; Useful; Helpful (Q)",
          "Positively timed (Q)",
          "Comforting"
        ],
        "0": [
          "Good (Q)",
          "Significant occasion",
          "Forward looking",
          "You pity (someone, something)"
        ]
      },
      "corrective": null
    }
  },
  "info": {
    "12": {
      "prompt": "In what country were the first Olympic Games?",
      "scoring": {
        "2": [],
        "1": [
          "Greece",
          "Ancient Greece"
        ],
        "0": [
          "Athens (Q)",
          "[Names any other city]",
          "[Names any other country]"
        ]
      },
      "corrective": null
    },
    "1": {
      "prompt": "What day comes right after Monday?",
      "scoring": {
        "2": [],
        "1": [
          "Tuesday"
        ],
        "0": [
          "Yesterday; Today; Tomorrow (Q)*",
          "Halloween; My birthday; Election",
          "Day; [Names a holiday or special occasion] (Q)*",
          "October 16th; [Names a date corresponding with the day after",
          "Monday] (Q)*",
          "[Names any other day of the week]"
        ]
      },
      "corrective": "What day of the week is that?"
    },
    "2": {
      "prompt": "Name a kind of dog.",
      "scoring": {
        "2": [],
        "1": [
          "Chihuahua; Lab; Poodle;",
          "[Names a purebred dog breed]",
          "Hound; Retriever; Spaniel; Terrier;",
          "[Names a dog type]",
          "Labradoodle; Puggle; Cockapoo;",
          "Borador; [Names a crossbreed dog]",
          "Lab mix; Beagle-Spaniel mix; Cross between a Shepherd and a Husky;",
          "[Names at least one breed as part of a mix]",
          "Dingo"
        ],
        "0": [
          "Puppy (Q)*",
          "Mutt (Q)*",
          "Wolfdog; Coydog; Dogote;",
          "[Names a hybrid of dog and another canid] (Q)*",
          "Wolf; Coyote; Jackal; Fox (Q)",
          "Pet; Domesticated; Stray; Wild;",
          "Feral (Q)*",
          "Seeing-eye dog; Therapy dog;",
          "(Police, K-9) dog; Guard dog;",
          "[Names a dog’s job] (Q)* (Plush, Stuffed) dog;",
          "(Hot, Corn) dog (Q)*"
        ]
      },
      "corrective": "Name a breed of dog."
    },
    "3": {
      "prompt": "How many sides does a square have?",
      "scoring": {
        "2": [],
        "1": [
          "Four",
          "[Physically indicates four]"
        ],
        "0": [
          "[Verbally or physically indicates any other number]"
        ]
      },
      "corrective": null
    },
    "4": {
      "prompt": "How many seconds are there in one minute?",
      "scoring": {
        "2": [],
        "1": [
          "60",
          "[Physically indicates 60]"
        ],
        "0": [
          "[Names any other number]"
        ]
      },
      "corrective": "There are 60 seconds in one minute."
    },
    "5": {
      "prompt": "What is the shape of the full moon?",
      "scoring": {
        "2": [],
        "1": [
          "Round",
          "Circle; Circular",
          "An “O”",
          "Sphere; Spherical; Ball; Orb; Globe",
          "[Gestures in circular motion]"
        ],
        "0": [
          "[Names or indicates any other shape]"
        ]
      },
      "corrective": "The shape of the full moon is round."
    },
    "6": {
      "prompt": "What can a caterpillar change into?",
      "scoring": {
        "2": [],
        "1": [
          "Butterfly; Moth; Sawfly",
          "Pupa; Chrysalis"
        ],
        "0": [
          "Cocoon; (Go, Put themselves) into a cocoon (Q)",
          "Bug; Insect (Q)",
          "Morph; Go through metamorphosis;",
          "Transform; Metamorphose (Q)",
          "Ant; Bird; Lizard",
          "Larva (Q)",
          "Pupate (Q)",
          "[Refers to the end of life cycle] (Q)*",
          "A grown-up (Q)",
          "Silk"
        ]
      },
      "corrective": "What else can a caterpillar change into?"
    },
    "7": {
      "prompt": "What is water made of?",
      "scoring": {
        "2": [],
        "1": [
          "H2O",
          "Two hydrogen atoms and one oxygen atom",
          "Hydrogen and oxygen"
        ],
        "0": [
          "Hydrogen (Q)",
          "Molecules; Atoms (Q)",
          "Liquid; Fluid (Q)",
          "Minerals (Hydrogen, Oxygen) and (nitrogen,",
          "[names any incorrect element])",
          "[Names any incorrect molecule]",
          "Oxygen; O2 (Q)",
          "Condensation; Moisture; Vapor;",
          "Steam (Q)",
          "Precipitation; Ice; Snow; Fog; Rain (Q)",
          "Lakes; Streams; Oceans"
        ]
      },
      "corrective": null
    },
    "8": {
      "prompt": "What imaginary line divides the Earth into northern and southern halves?",
      "scoring": {
        "2": [],
        "1": [
          "Equator"
        ],
        "0": [
          "Hemisphere(s) (Q)",
          "Longitude",
          "Horizon; Horizontal",
          "Continental divide",
          "Prime meridian; Meridian"
        ]
      },
      "corrective": null
    },
    "9": {
      "prompt": "In what city is the Golden Gate Bridge?",
      "scoring": {
        "2": [],
        "1": [
          "San Francisco",
          "Sausalito"
        ],
        "0": [
          "California (Q)",
          "Marin County (Q)",
          "New York; Los Angeles; Oakland;",
          "San Diego; [Names any other city]"
        ]
      },
      "corrective": null
    },
    "10": {
      "prompt": "Who invented and flew the first airplane?",
      "scoring": {
        "2": [],
        "1": [
          "The Wright Brothers;",
          "Orville and Wilbur Wright",
          "Orville Wright; Wilbur Wright",
          "Wright; The Wrights"
        ],
        "0": [
          "Orville; Wilbur (Q)",
          "Kitty Hawk (Q)",
          "Charles Lindbergh; Amelia Earhart;",
          "[Names a famous aviator]",
          "Otto Lilienthal; Jean-Pierre Blanchard;",
          "Montgolfier brothers; Leonardo da",
          "Vinci (Q)"
        ]
      },
      "corrective": null
    },
    "11": {
      "prompt": "In what country is the original Taj Mahal?",
      "scoring": {
        "2": [],
        "1": [
          "India"
        ],
        "0": [
          "Agra (Q)",
          "Uttar Pradesh (Q)",
          "Dubai; [Names any other city]",
          "Asia (Q)",
          "China; United States; France; Egypt;",
          "[Names any other country]"
        ]
      },
      "corrective": null
    },
    "13": {
      "prompt": "Who was Mahatma Gandhi?",
      "scoring": {
        "2": [],
        "1": [
          "An Indian leader who promoted (nonviolent civil disobedience, peaceful resistance)",
          "Indian (activist, civil rights leader, revolutionist, politician)",
          "Indian (philosopher, leader)",
          "Fasted for Indian freedom",
          "(Fought for, Won) independence of India",
          "(Peaceful, Antiwar) person from India; Indian pacifist",
          "Spiritual leader in India; Indian holy man"
        ],
        "0": [
          "Activist (Q)",
          "Philosopher; Leader (Q)",
          "From India; Indian (Q)",
          "Indian prime minister; (Ruler, Head) of India",
          "He (fasted, restricted his eating, didn't eat)",
          "Holy man; Religious leader (Q)",
          "Peace advocate (Q)"
        ]
      },
      "corrective": null
    },
    "14": {
      "prompt": "Name the move in ballet in which a dancer completes a full turn on one foot.",
      "scoring": {
        "2": [],
        "1": [
          "Pirouette"
        ],
        "0": [
          "Piqué",
          "Spin; Twirl; 360",
          "Arabesque; Plié; Axel; [Names any other ballet or dance move]"
        ]
      },
      "corrective": null
    },
    "15": {
      "prompt": "Who was Margaret Thatcher?",
      "scoring": {
        "2": [],
        "1": [
          "(Leader, Prime Minister) of (the United Kingdom, the U.K.,",
          "Britain, Great Britain, England)",
          "First female Prime Minister of Britain",
          "British (politician, leader)"
        ],
        "0": [
          "British; English; From (the U.K.,",
          "Great Britain, England) (Q)",
          "Leader (Q)",
          "President of the (United Kingdom,",
          "U.K.)",
          "Queen of (England, Britain, the U.K.)",
          "Activist for (women’s, civil) rights",
          "Iron Lady (Q)",
          "Author; Writer",
          "First Lady",
          "Canadian senator; German leader;",
          "[Names any other nationality]",
          "Sewed the American flag"
        ]
      },
      "corrective": null
    },
    "16": {
      "prompt": "What is the largest organ of the human body?",
      "scoring": {
        "2": [],
        "1": [
          "Skin; Epidermis"
        ],
        "0": [
          "[Names any other organ]"
        ]
      },
      "corrective": null
    },
    "17": {
      "prompt": "What canal connects the Mediterranean Sea with the Red Sea?",
      "scoring": {
        "2": [],
        "1": [
          "Suez Canal"
        ],
        "0": [
          "Panama Canal; Erie Canal;",
          "[Names another canal]",
          "Nile River; [Names any other body of water]"
        ]
      },
      "corrective": null
    },
    "18": {
      "prompt": "What language has the most native speakers?",
      "scoring": {
        "2": [],
        "1": [
          "Mandarin Chinese; Mandarin",
          "Chinese"
        ],
        "0": [
          "China (Q)",
          "English; Spanish; Cantonese;",
          "[Names any other language]"
        ]
      },
      "corrective": null
    },
    "19": {
      "prompt": "Who wrote War and Peace?",
      "scoring": {
        "2": [],
        "1": [
          "Tolstoy; (Leo, Lev) Tolstoy"
        ],
        "0": [
          "Leo; Lev (Q)",
          "Dostoevsky; [Names any other writer]"
        ]
      },
      "corrective": null
    },
    "20": {
      "prompt": "Where is the deepest part of the Earth’s oceans?",
      "scoring": {
        "2": [],
        "1": [
          "Mariana(s) Trench; Mariana(s)",
          "Challenger Deep; Challenger"
        ],
        "0": [
          "Trench; Deep (Q)",
          "Tonga Trench; Horizon Deep;",
          "[Names any other trench or deep]",
          "Pacific; The Pacific Ocean (Q) (Atlantic, Indian) Ocean; Dead Sea;",
          "[Names any other body of water]"
        ]
      },
      "corrective": null
    },
    "21": {
      "prompt": "Who wrote Alice’s Adventures in Wonderland?",
      "scoring": {
        "2": [],
        "1": [
          "Carroll; Lewis Carroll",
          "Dodgson; Lutwidge Dodgson",
          "Charles Dodgson;",
          "Charles Lutwidge Dodgson"
        ],
        "0": [
          "Lewis (Q)",
          "Disney; Walt Disney",
          "C. S. Lewis; [Names any other author]"
        ]
      },
      "corrective": null
    },
    "22": {
      "prompt": "What is the capital of Senegal?",
      "scoring": {
        "2": [],
        "1": [
          "Dakar"
        ],
        "0": [
          "[Names a continent, country, or any other city]"
        ]
      },
      "corrective": null
    },
    "23": {
      "prompt": "Who wrote Don Quixote?",
      "scoring": {
        "2": [],
        "1": [
          "Cervantes; Miguel de Cervantes"
        ],
        "0": [
          "Miguel (Q)",
          "Dumas; [Names any other writer]"
        ]
      },
      "corrective": null
    },
    "24": {
      "prompt": "What is the circumference of the Earth at the equator?",
      "scoring": {
        "2": [],
        "1": [
          "24,901 miles",
          "[Any response ranging from 19,921 to",
          "29,881 miles]",
          "40,075 kilometers",
          "[Any response ranging from 32,060 to",
          "48,090 kilometers]"
        ],
        "0": [
          "[Any response ranging from 19,921 to",
          "29,881] (Q)*",
          "2πr; πd (Q)**",
          "[Any response less than 19,921 miles or greater than 29,881 miles]",
          "[Any response ranging from 32,060 to",
          "48,090] (Q)*",
          "Pi; π; πr2 (Q)",
          "[Any response less than 32,060 kilometers or greater than",
          "48,090 kilometers]"
        ]
      },
      "corrective": "Yes, but what is the answer in miles or kilometers?"
    }
  },
  "arith": {
    "14": {
      "prompt": "Digits Backward",
      "scoring": {
        "2": [],
        "1": [],
        "0": []
      },
      "corrective": "Let’s try another: 5 – 1."
    }
  },
  "comp": {
    "1": {
      "prompt": "Why do people wear watches?",
      "scoring": {
        "2": [
          "General Concept: To tell or know the time; To keep track of time; To stay on schedule;",
          "For valid contemporary purposes other than telling time",
          "To tell time; To know how (late, early) it is",
          "To be (on time, punctual);",
          "So you aren’t (late, early)",
          "For (scheduling, planning)",
          "To time things",
          "Tracking steps; Taking pulse",
          "Send texts; Take phone calls;",
          "Access apps"
        ],
        "1": [
          "General Concept: For fashion or aesthetics; Vague reference to health, communication, or another valid contemporary purpose",
          "To stay in touch (Q)",
          "It’s (jewelry, an accessory)",
          "To stay healthy (Q)",
          "To look fashionable"
        ],
        "0": [
          "General Concept: Not related to telling time, aesthetics, or another valid contemporary purpose",
          "They are status symbols (Q)",
          "They are heavy"
        ]
      },
      "corrective": null
    },
    "2": {
      "prompt": "Why do people wash clothes?",
      "scoring": {
        "2": [
          "General Concept: To get them clean; To remove dirt or germs; For cleanliness, sanitation, or hygiene",
          "To (get, make) them clean",
          "To (get out, remove) (dirt, soil, stains)",
          "For (hygiene, health reasons);",
          "To be sanitary",
          "To remove germs",
          "To have a clean (shirt, [names specific article of clothing])"
        ],
        "1": [
          "General Concept: So they are not dirty or smelly; To maintain outward appearance or attractiveness",
          "They’re dirty; So they aren’t dirty (Q)",
          "So they smell better; So they don’t stink (Q)",
          "So we aren’t (dirty, smelly) (Q)",
          "To be socially acceptable",
          "So they look good"
        ],
        "0": [
          "General Concept: No reference to cleanliness or attractiveness",
          "To do laundry (Q)",
          "It’s (washday, the weekend)",
          "To have something to wear (Q)",
          "It’s (good, right)"
        ]
      },
      "corrective": null
    },
    "3": {
      "prompt": "\u0007What should you do if you find an envelope that is sealed, addressed,",
      "scoring": {
        "2": [
          "General Concept: Recognition that the letter should be put into the mail immediately (Mail, Post, Send) it",
          "Give it to my (postal, mail) carrier (Drop, Put) it in the mailbox",
          "Return it to the post office"
        ],
        "1": [
          "General Concept: Recognition that the letter is someone else’s property, but method of handling it is indirect or vague",
          "Deliver it (Q)",
          "Try to find the owner (Q)",
          "Give it to a police officer",
          "Mail it back to the person who sent it; Return it to the (person, address, sender) (Q)"
        ],
        "0": [
          "General Concept: No idea of what to do with the letter or that the letter is the property of someone else",
          "Leave it alone; Don’t touch it (Q)*",
          "Give it to a (parent, grown-up)",
          "It could be (contaminated, dangerous) (Q)*",
          "Open it find an envelope that is sealed, addressed, and has a new stamp on it? should mail it immediately."
        ]
      },
      "corrective": "If you find an envelope that is sealed, addressed, and has a new stamp on it, you"
    },
    "4": {
      "prompt": "What is money used for?",
      "scoring": {
        "2": [
          "General Concept: To purchase goods or services; Currency or legal tender to buy things;",
          "For two or more specific expenses or items",
          "Purchasing; Buying; Paying;",
          "To pay for things",
          "To pay for (bills, expenses, [provides another general term for expenses]) (To pay for, For) (food and clothing,",
          "[names two or more specific expenses or items]) (Represent, Quantify, Show) the (value, worth) of something",
          "To (barter, trade, exchange) for things",
          "Commercial exchange",
          "Legal tender for debts",
          "A response reflecting at least two of the general concepts listed."
        ],
        "1": [
          "General Concept: To invest or save for the future; For a specific expense or item; To spend or shop with (To pay for, For) (rent, games, clothing, apps, [names one specific expense or item]) (Q)",
          "To (obtain, get) things (Q)",
          "Support (the family, charity) (Q)",
          "To spend; For shopping (Q)",
          "Currency; Legal tender (Q)",
          "To (invest, save) (Q)",
          "A response reflecting only one of the general concepts listed."
        ],
        "0": [
          "General Concept: Use of money not related to purchasing material goods, saving, or investing",
          "Cash (Q)",
          "To be (rich, wealthy, popular)",
          "To collect (Q)",
          "To play with",
          "§5. Tell me some reasons why many foods need to be cooked.",
          "General Concept: To destroy microorganisms; To avoid illness or food poisoning; To make food safe for consumption",
          "To (kill, destroy) (bacteria, microorganisms)",
          "Because of germs",
          "So they’re safe to eat; So they’re not (harmful, dangerous)",
          "So you don’t get (sick, food poisoning, salmonella)",
          "Prevent (disease, allergic reactions)",
          "To (purify, sanitize) them",
          "General Concept: To improve flavor or taste; So food is more appetizing (Improves, Releases, Brings out) the flavor",
          "Makes them more (appetizing, palatable)",
          "Cooking combines the flavors of foods",
          "Make them taste (better, good)",
          "General Concept: To aid digestion (Permits, Eases) digestion",
          "So they’re easier to (eat, consume, chew)",
          "Helps break down the food",
          "General Concept: To improve nutritional value",
          "So it’s more nutritious",
          "So you can absorb the (vitamins, nutrients) better",
          "To release the nutrients",
          "To (reduce, get rid of) fat",
          "General Concept: To improve texture; To make them more tender",
          "Improves the texture",
          "To make them softer; So they aren’t too (solid, hard) to eat",
          "To tenderize it; Cooking makes (meat, vegetables) tender",
          "General Concept: For culture-specific reasons; Tradition or custom",
          "To conform to (custom, culture)",
          "It’s traditionally prepared that way",
          "General Concept: Vague reference to health, rawness, or edibility; Trivial reason for cooking food",
          "They’re raw; Can’t eat them raw (Q)",
          "They’re frozen (Q)",
          "Prevent spoilage; Preserves them;",
          "Keeps them fresh (Q)",
          "To mix them together",
          "It’s healthier (Q)",
          "So they’re edible; So you can eat them (Q)",
          "So they’re hot (Q)",
          "Recipe tells you to"
        ]
      },
      "corrective": "Money is used to pay for things you need and want."
    },
    "5": {
      "prompt": "Tell me some reasons why many foods need to be cooked.",
      "scoring": {
        "2": [
          "Response reflecting at least two of the general concepts below.",
          "GC: To destroy microorganisms / avoid illness / make safe to eat — To (kill, destroy) bacteria; Because of germs; So you don't get (sick, food poisoning); Prevent (disease, allergic reactions)",
          "GC: To improve flavor or taste — (Improves, Releases, Brings out) the flavor; Makes them more (appetizing, palatable); Combines the flavors; Make them taste better",
          "GC: To aid digestion — Eases digestion; Easier to (eat, consume, chew); Helps break down the food",
          "GC: To improve nutritional value — More nutritious; Absorb the (vitamins, nutrients) better; Release the nutrients",
          "GC: To improve texture / tenderize — Improves texture; Makes them softer; Tenderize it",
          "GC: For culture-specific or traditional reasons — To conform to (custom, culture); Traditionally prepared that way"
        ],
        "1": [
          "Response reflecting only one of the general concepts above."
        ],
        "0": [
          "GC: Vague reference to health, rawness, or edibility / trivial reason",
          "They're raw; Can't eat them raw (Q)",
          "They're frozen (Q)",
          "Prevent spoilage; Preserves them; Keeps them fresh (Q)",
          "To mix them together",
          "It's healthier (Q)",
          "So they're edible; So you can eat them (Q)",
          "So they're hot (Q)",
          "Recipe tells you to"
        ]
      },
      "corrective": null
    },
    "6": {
      "prompt": "Why do people in some professions need a license to do their job?",
      "scoring": {
        "2": [
          "General Concept: To ensure qualifications, adequate training, or competency; To set standards for practice within a profession; To control the quality of services",
          "To prove they’re (trained, qualified, certified)",
          "To (set, maintain, provide) standards for (practice, the job)",
          "To (regulate, monitor, control) the quality of services",
          "So you know that they know what they’re doing and they (won’t cause harm to anyone, will do it right)",
          "So we can (trust, have faith in) their services",
          "To protect against (deceptive practices, unethical behavior)",
          "So you know they have the knowledge and experience",
          "So you know they are (competent, proficient, skilled)"
        ],
        "1": [
          "General Concept: Vague reference to protection or knowledge without reference to ensuring qualifications, training, or standards of practice",
          "To protect (us, the public) from (harm, danger) (Q)",
          "Protects people against (quacks, crooks, getting ripped off) (Q)",
          "So you know they (know what they’re doing, can do the job) (Q)",
          "So you know they (went to school, passed a test) for their job (Q)",
          "So they’re (responsible, accountable) for their work (Q)",
          "So you know they have (knowledge, experience) (Q)",
          "So you know they are (registered, legitimate) (Q)",
          "So they (have permission, are allowed) to do the job",
          "So not just anyone tries to do the job",
          "The job could be dangerous",
          "So the job is done (right, well)"
        ],
        "0": [
          "General Concept: A vague or incidental reason for licensing of professional services",
          "To show they’re professionals (Q)",
          "Make it legal; It’s the law;",
          "Because they have to",
          "So you can (drive, get a driver’s license,",
          "[refers to driver’s license])",
          "Human lives are at stake;",
          "So no one gets killed (Q)",
          "For money; So they can make more money",
          "So you can (work, do your job)"
        ]
      },
      "corrective": null
    },
    "7": {
      "prompt": "Why is it important to study history?",
      "scoring": {
        "2": [
          "General Concept: Recognition of the ability to learn from the past in order to affect the present or the future, with an explicit connection between the past and the present or future",
          "Lessons from the past can be applied to the (present, future)",
          "So you don’t repeat it; So you don’t make the same mistake twice; So bad things don’t happen again",
          "To learn from past (failures, successes)",
          "What happened in the past affects the (present, future)",
          "To use that knowledge for the future;",
          "So we can build a better future",
          "To (know, understand) where we (are, came from) and where we are going",
          "A response reflecting at least two of the general concepts listed.",
          "A response reflecting at least two of the general concepts listed.",
          "A response reflecting at least two of the general concepts listed."
        ],
        "1": [
          "General Concept: To understand where we came from or where we are going, with no explicit connection between the past and the present or future; To promote understanding of ourselves, our traditions, and our government",
          "History repeats itself; To keep from reinventing the wheel (Q)",
          "To learn how we have (developed, changed) over time (Q)",
          "To learn from (it, the past) (Q)",
          "To get a sense of tradition",
          "To prepare for the future (Q)",
          "To know where we (came from, are going) (Q)",
          "To understand (who we are, what is happening today) (Q)",
          "To know your (roots, heritage, family, ancestors)",
          "A response reflecting only one of the general concepts listed.",
          "A response reflecting only one of the general concepts listed.",
          "A response reflecting only one of the general concepts listed."
        ],
        "0": [
          "General Concept: Refers to knowing historical details or refers to a vague or trivial reason for studying history",
          "To learn about (it, the past) (Q)",
          "To (advance, promote) knowledge;",
          "To pass it on (Q)",
          "To know your past (Q)",
          "For school",
          "To understand (who people were, what people thought) back then (Q)",
          "To understand how decisions were made (Q)",
          "[Describes a specific historical event or topic]",
          "§8. \u0007Tell me some reasons why it’s important for a country to have good relationships with other countries.",
          "General Concept: To maintain or form alliances, maintain peace, or prevent war; For humanity’s common good",
          "To maintain alliances",
          "To have countries on our side if we go to war",
          "To prevent war; To avoid conflict",
          "So they won’t fight each other",
          "For national security; For the country’s (defense, protection)",
          "To keep the peace; For world peace",
          "For (the common good, goodwill)",
          "So the world will be a better place",
          "General Concept: To facilitate exchange of cultural ideas, information, or customs (non‑tangible exchange)",
          "To (learn about, understand) other cultures",
          "To gain cultural awareness",
          "To share information about each other’s way of life",
          "General Concept: To exchange assistance or supplies in times of crisis",
          "For help in (emergency, crisis) situations",
          "For help if there is (a pandemic, famine, a flood, an earthquake)",
          "For help when natural disasters hit",
          "General Concept: To facilitate trade or commerce; To share resources, technology, or scientific information",
          "To encourage (trade, commerce);",
          "So we can trade with them",
          "For (financial help, money) if it’s needed",
          "To help each other economically;",
          "For the economy",
          "To exchange goods and services;",
          "For (imports, exports)",
          "So we can (utilize, share) natural resources",
          "To exchange technology",
          "To share (medical, scientific) information",
          "General Concept: Vague or trivial reason for having relationships with other countries or restatement of the question",
          "To help each other in (hard times, times of need) (Q)",
          "To share (ideas, information) (Q)",
          "We may need something in the future (Q)",
          "We may need (oil, water,",
          "[names specific item]) (Q)",
          "To help us (Q)",
          "To permit (world travel, tourism, immigration) (Q)",
          "Foreign relations are important;",
          "Countries need each other",
          "To communicate better",
          "§9. Tell me some reasons why it’s important to enjoy your job.",
          "General Concept: To give meaning or purpose to your life, to increase self-satisfaction or fulfillment, or to improve the quality of your life",
          "To give your life meaning; To get a sense of purpose",
          "For self-fulfillment; So your life is satisfying",
          "So you never have to work a day in your life",
          "To have a sense of (accomplishment, self-satisfaction)",
          "To improve the quality of your life; So that your life is (easier, more enjoyable)",
          "General Concept: To enhance or maintain your emotional, physical, or social well‑being",
          "For your (emotional, physical, mental) health",
          "You’ll have (a positive attitude, better morale)",
          "It keeps your stress level down;",
          "Reduces stress",
          "So you don’t get sick; You’ll be healthier; You’ll live longer",
          "For your well-being",
          "So that you’re (more content, happy)",
          "So you’re not (depressed, frustrated, miserable)",
          "It can improve your (personal life, relationships)",
          "General Concept: To improve the quality or productivity of your work, to increase longevity on the job, or to improve your interactions at work",
          "You’ll perform better; So you do a good job",
          "You’ll (be more successful, get promoted)",
          "So you don’t get (tired, bored) of your job",
          "You’ll get along with (coworkers, employees); You’ll be (better with, nicer to) customers",
          "You’ll (be more productive, get more work done)",
          "You’ll have more (motivation, dedication); You’ll try harder;",
          "You’ll want to go to work",
          "For longevity on the job; You’ll stay at the job longer; So you don’t (quit, get fired)",
          "So you don’t get burned out",
          "General Concept: Superficial reasons for enjoying your job, reasons for working rather than reasons for enjoying your job, or a restatement of the question",
          "You spend a lot of (time, your life) at work (Q)",
          "So (the day goes faster, time passes quickly) (Q)",
          "Helps you get up in the morning (Q)",
          "You have to work (Q)",
          "So you (have fun with, like, don’t hate) what you’re doing (Q)",
          "You’ll get paid",
          "You’ll meet people",
          "§10. Tell me some reasons why some people think we should explore outer space.",
          "General Concept: To locate more natural resources or other places for humans to live",
          "To search for (new, more, natural) resources",
          "To find things that will benefit (the Earth, humans)",
          "For possible colonization",
          "To search for another place for us to live",
          "Earth is getting overcrowded",
          "General Concept: To better understand Earth or the historical, present, or future impact of the universe on our planet (refers to our planet or Earth)",
          "To see how events in the universe affect Earth",
          "To understand our planet’s (future, past); To better understand our world",
          "To learn how our (solar system, universe) affects our planet",
          "To study how Earth (was created, evolved); To understand the origins of our planet",
          "General Concept: To advance or promote science or technology; For research; To make new discoveries",
          "To promote science; To increase scientific knowledge",
          "For research; To make new (discoveries, breakthroughs)",
          "To keep up with other countries’ (research, science, discoveries)",
          "Technological advancement",
          "To (learn about weather, discover cures for diseases); [Describes specific example of research]",
          "General Concept: To search for other forms of life or possible threats to our planet",
          "To see if there’s life out there",
          "To determine if there are alien life forms; To see if we are alone",
          "To protect our planet from (danger, crisis)",
          "To prevent (meteors, asteroids, comets) from hitting Earth",
          "General Concept: Exploration of the unknown is human nature; Humans are adventurous or curious",
          "Exploring the unknown is (fulfilling, satisfying)",
          "Humans seek answers about the unknown",
          "To satisfy our curiosity; Our curiosity;",
          "We’re curious",
          "Exploration is in our nature",
          "Humans are adventurous; Our sense of adventure",
          "General Concept: Vague reason for exploring outer space or restatement of the question",
          "To (see, know, discover) what’s out there (Q)",
          "Curiosity; Curious; Adventure (Q)",
          "To (gain knowledge, learn more);",
          "To know more about the (planets, galaxy) (Q)",
          "It’s a waste of (money, time, energy);",
          "I don’t think we should explore space (Q)",
          "To see what’s beyond our planet;",
          "To explore (new places, other planets) (Q)",
          "To explore the unknown; It’s the final frontier (Q)",
          "To plan for the future (Q)",
          "It’s interesting; Exploration is exciting (Q)"
        ]
      },
      "corrective": null
    },
    "8": {
      "prompt": "Tell me some reasons why it's important for a country to have good relationships with other countries.",
      "scoring": {
        "2": [
          "Response reflecting at least two of the general concepts below.",
          "GC: To maintain alliances / keep peace / prevent war / for humanity's common good — To maintain alliances; To prevent war; For national security; To keep the peace; For world peace; For the common good",
          "GC: To exchange cultural ideas, information, or customs — To learn about other cultures; To gain cultural awareness; Share information about each other's way of life",
          "GC: To exchange assistance or supplies in times of crisis — For help in emergency; For help in pandemic / famine / flood / earthquake; For help when natural disasters hit",
          "GC: To facilitate trade or commerce; share resources, technology, scientific info — To encourage trade; For financial help; To help each other economically; Exchange goods and services; Imports/exports; Share natural resources; Exchange technology; Share medical/scientific info"
        ],
        "1": [
          "Response reflecting only one of the general concepts above."
        ],
        "0": [
          "GC: Vague or trivial reason; restatement of the question",
          "To help each other in hard times (Q)",
          "To share (ideas, information) (Q)",
          "We may need something in the future (Q)",
          "We may need (oil, water, [names specific item]) (Q)",
          "To help us (Q)",
          "To permit (world travel, tourism, immigration) (Q)",
          "Foreign relations are important; Countries need each other",
          "To communicate better"
        ]
      },
      "corrective": null
    },
    "9": {
      "prompt": "Tell me some reasons why it's important to enjoy your job.",
      "scoring": {
        "2": [
          "Response reflecting at least two of the general concepts below.",
          "GC: To give meaning/purpose to your life, increase self-satisfaction, improve quality of life — Sense of purpose; Self-fulfillment; Sense of accomplishment; Quality of life",
          "GC: To enhance or maintain emotional, physical, or social well-being — For your (emotional, physical, mental) health; Positive attitude; Reduce stress; Live longer; So you're not (depressed, frustrated, miserable)",
          "GC: To improve work quality/productivity, longevity, or interactions at work — Perform better; Be more successful; Don't get bored; Get along with coworkers; More productive; More motivation; Stay at the job longer; Don't burn out"
        ],
        "1": [
          "Response reflecting only one of the general concepts above."
        ],
        "0": [
          "GC: Superficial reasons, reasons for working rather than enjoying, restatement",
          "You spend a lot of time at work (Q)",
          "So the day goes faster (Q)",
          "Helps you get up in the morning (Q)",
          "You have to work (Q)",
          "So you (have fun with, like, don't hate) what you're doing (Q)",
          "You'll get paid",
          "You'll meet people"
        ]
      },
      "corrective": null
    },
    "10": {
      "prompt": "Tell me some reasons why some people think we should explore outer space.",
      "scoring": {
        "2": [
          "Response reflecting at least two of the general concepts below.",
          "GC: To locate more natural resources or places to live — Search for resources; Possible colonization; Earth is overcrowded; Another place to live",
          "GC: To better understand Earth — How events in the universe affect Earth; Understand our planet's past/future; How our solar system affects our planet",
          "GC: To advance or promote science or technology, research, new discoveries — Promote science; Research; New discoveries; Technological advancement; Learn about weather; Discover cures for diseases",
          "GC: To search for other life or possible threats — To see if there's life out there; To determine alien life; To protect our planet from danger; Prevent meteors/asteroids from hitting Earth"
        ],
        "1": [
          "Response reflecting only one of the general concepts above."
        ],
        "0": [
          "GC: Vague or trivial reason for exploring space",
          "It's interesting (Q)",
          "To learn (Q)",
          "To go somewhere new",
          "Because it's there"
        ]
      },
      "corrective": null
    },
    "11": {
      "prompt": "What does this saying mean? “Fall seven times, stand up eight.”",
      "scoring": {
        "2": [
          "General Concept: Don’t be defeated by failure; Keep trying in spite of failure; Keep trying until you succeed; [Response clearly refers to persevering despite failure or negative occurrences, or perseverance until success is met]",
          "Don’t be discouraged by failure; Don’t let failure (get, knock) you down",
          "Keep trying until you reach your goals",
          "Learn from your mistakes (and keep trying, and don’t give up, until you get it right)",
          "Even if bad things happen, you can still recover",
          "If at first you don’t succeed, try, try again; If you fail, try again",
          "You don’t fail until you quit trying",
          "Be (persistent, resilient) despite (mistakes, setbacks); Persevere",
          "Never accept defeat"
        ],
        "1": [
          "General Concept: Learn from your mistakes; Never give up; Keep trying; [Response refers to persistence, with no clear reference to experience of failure or success]",
          "Don’t (be, feel) defeated (Q)",
          "Learn from your mistakes (Q)",
          "Don’t (give up, quit) (Q)",
          "If something gets you down, keep trying (Q)",
          "Be persistent (Q)",
          "Never stop trying (Q)",
          "Try, try again (Q)"
        ],
        "0": [
          "General Concept: A related proverb; Incorrect or literal interpretation of the proverb; No recognition that the statement is a proverb; A distortion of the meaning of the proverb at a very specific or personal level",
          "Think positively; You will always succeed in the end (Q)",
          "Turn the other cheek; [Provides an unrelated proverb] (Q)",
          "Keep getting back up (Q)",
          "Get back up if you are down",
          "Hang in there; Keep your chin up;",
          "[Provides a related proverb] (Q)",
          "If (you fall, something knocks you down) stand (back up, up again);",
          "[Provides any literal interpretation]"
        ]
      },
      "corrective": null
    },
    "12": {
      "prompt": "Why do people think it’s important to save endangered animals?",
      "scoring": {
        "2": [
          "General Concept: Reference to the interdependence of life forms or the importance of each species to the ecosystem",
          "Every (species, animal) contributes to the (ecosystem, ecology)",
          "All animals serve a purpose (for each other, in the ecosystem)",
          "If (animals, species) die out it may (cause a chain reaction, affect other species)",
          "To maintain (nature’s balance, the circle of life, the life cycle)",
          "It is important to the food chain"
        ],
        "1": [
          "General Concept: Vague reference to importance of animals without clear reference to interdependence of life forms; Reference to extinction, preservation, or maintenance of biodiversity",
          "So they don’t become extinct (Q)",
          "So they don’t (disappear, die out, die off ); So we don’t lose them (Q)",
          "To maintain (biodiversity, different forms of life) (Q)",
          "To (protect, save) them (Q)",
          "Once they’re gone, they’re gone",
          "They contribute to (the environment, the Earth, evolution) (Q)",
          "Every animal (is here for a reason, serves a purpose) (Q)",
          "To keep them around for future generations (Q)",
          "So they continue to reproduce"
        ],
        "0": [
          "General Concept: Vague or no understanding of extinction or the value of endangered animals",
          "All life is important (Q)",
          "It’s our responsibility (Q)",
          "[Provides reference to religious figure assigning duty to protect animals] (Q)",
          "They deserve to live; Animals have a right to be here",
          "We learn from animals",
          "We don’t want them to (die, be hurt); [Provides vague reference to extinction] (Q)",
          "It’s a natural process (Q)",
          "Because we won’t have any animals",
          "Some animals might carry diseases",
          "It’s not"
        ]
      },
      "corrective": null
    },
    "13": {
      "prompt": "Why does land in the city cost more than land in the country?",
      "scoring": {
        "2": [
          "General Concept: Clear reference to the principle of supply and demand; [Response must clearly indicate both limited supply and increased demand in the city or the opposite situation in the country]",
          "Supply and demand",
          "Less land in the city and more people living there; More land in the country and less people living there",
          "Population is higher in the city but there’s less land available",
          "Less land in the city and more demand for it",
          "Not enough land for those who want it",
          "Not enough land in the city and it’s harder to get",
          "Population density is (higher in the city, lower in the country)"
        ],
        "1": [
          "General Concept: Reference only to limited supply or to increased demand in the city or the opposite situation in the country, or mention of two or more types of conveniences located in the city (e.g., transportation, utilities, streets, businesses, medical or emergency services) (More demand for, Harder to get) land in the city; Fewer people want land in the country (Q)",
          "More people want to live in the city (Q)",
          "It’s more convenient to live in the city; (Better accessibility, Closer) to amenities",
          "Less land in the city; More land in the country (Q)",
          "More (people, populated, crowded) in the city; Less crowded in the country (Q)",
          "City has better roads and sewage;",
          "[Refers to two or more types of conveniences]"
        ],
        "0": [
          "General Concept: Little or no understanding of the economic law of supply and demand, or mention of one convenience located in the city",
          "It’s been (developed, built up) (Q)",
          "There’s more to do in the city;",
          "Everything is located in the city (Q)",
          "Closer to (highways, hospitals); Better utilities; More opportunities; [Refers to one specific convenience] (Q)",
          "Higher taxes",
          "It’s more valuable; Buildings cost more in the city (Q)",
          "Closer to (work, stores, [refers to specific place(s)]) (Q)",
          "City has more (traffic, congestion, crime, [mentions negative aspect of the city])"
        ]
      },
      "corrective": null
    },
    "14": {
      "prompt": "What does this saying mean? “If you can’t bite, don’t show your teeth.”",
      "scoring": {
        "2": [
          "General Concept: Don’t make empty threats if you lack courage to follow through with action; Don’t express hostility if you cannot follow through with action; [Response must clearly indicate threat, intimidation, aggression, or anger]",
          "Don’t make (false, idle) threats",
          "Don’t act tough if you aren’t",
          "Don’t (pick, provoke) a fight if you lack the courage to follow through",
          "Don’t (make a threat, show anger, intimidate someone) if you can’t back it up",
          "Don’t bluff if you aren’t going to follow through on the threat"
        ],
        "1": [
          "General Concept: Don’t say you’re going to do something if you’re not going to follow through; Don’t make promises you can’t keep; Make sure you have the courage to back up your words; [Response does not clearly indicate threat, intimidation, aggression, or anger]",
          "Don’t bluff; Don’t pretend you’re going to do something you’re not (Q)",
          "Have the courage to back up your words (Q)",
          "Don’t (brag, talk smack) if you’re scared to do anything about it (Q)",
          "Don’t say something if you can’t (prove it, back it up, win the argument) (Q)",
          "If you can’t put up, shut up (Q)",
          "Don’t say you are going to do something if you can’t do it (Q)",
          "Don’t talk the talk if you can’t walk the walk; [Provides an equivalent proverb] (Q)",
          "Don’t get off of the porch if you can’t play with the big dogs (Q)",
          "Don’t start something you can’t finish",
          "Actions speak louder than words"
        ],
        "0": [
          "General Concept: A related proverb; Incorrect or literal interpretation of the proverb; No recognition that the statement is a proverb; A distortion of the meaning of the proverb at a very specific or personal level",
          "Put your money where your mouth is;",
          "Don’t bite off more than you can chew; Practice what you preach;",
          "[Provides a related proverb] (Q)",
          "If you don’t have teeth, you can’t bite;",
          "[Provides any literal interpretation]",
          "Say what you mean, mean what you say (Q)",
          "If you don’t have anything (nice, important) to say, don’t say anything at all",
          "If you can’t do it right, don’t do it at all"
        ]
      },
      "corrective": null
    },
    "15": {
      "prompt": "What does this saying mean? “One frost does not make a winter.”",
      "scoring": {
        "2": [
          "General Concept: The abstract idea that a generalization cannot be based on one specific instance; Reference to a neutral generalization, or to both a positive and negative generalization",
          "Don’t generalize from a single instance",
          "Don’t make predictions from a single occurrence",
          "One instance doesn’t make it a rule",
          "One glimpse doesn’t give you the whole picture; One shred of evidence doesn’t mean it’s true",
          "One mistake doesn’t mean complete failure and one success doesn’t mean victory",
          "Just because something happened once doesn’t mean it will keep happening",
          "Just because there’s a hint of something, you can’t assume it will happen",
          "Don’t jump to conclusions; Don’t read too much into things",
          "You can’t judge the whole from an individual part"
        ],
        "1": [
          "General Concept: A positive or negative generalization only; A related but not quite equivalent generalization",
          "Don’t generalize (Q)",
          "Don’t blow things out of proportion;",
          "Don’t make a big deal out of nothing (Q)",
          "One success doesn’t mean complete success; Winning once doesn’t mean you’ll win all the time",
          "Don’t (exaggerate, overreact) (Q)",
          "One mistake doesn’t ruin your life;",
          "One bad thing doesn’t mean (failure, everything’s bad)",
          "Don’t (dwell, ruminate) on one aspect of something"
        ],
        "0": [
          "General Concept: A related proverb; Incorrect or literal interpretation of the proverb; No recognition that the statement is a proverb; A distortion of the meaning of the proverb at a very specific or personal level",
          "You can’t judge a book by its cover;",
          "Don’t sweat the small stuff;",
          "[Provides a related proverb] (Q)",
          "It’s just the beginning of something",
          "Just because it’s cold doesn’t mean it’s winter yet; [Provides any literal interpretation]",
          "Don’t believe everything you see;",
          "Things aren’t always what they seem (Q)",
          "Don’t count your chickens before they hatch; [Provides an unrelated proverb]"
        ]
      },
      "corrective": null
    },
    "16": {
      "prompt": "Why is freedom of the press important in a democracy?",
      "scoring": {
        "2": [
          "General Concept: Recognition of the press’ role in providing the public with information independent of government supervision; So the press can voice opinions without fear of the government",
          "So citizens have an outlet to criticize the government openly",
          "Part of checks and balances against government’s power",
          "Allows the press to express their opinions without fear of government (retaliation, punishment)",
          "So the government doesn’t control the media; So people don’t just hear what the government wants us to",
          "To expose abuse of government power",
          "Gives people a means to question (authority, the government)",
          "Keeps the public informed of the government’s actions",
          "Keeps the government honest;",
          "So leaders don’t keep secrets from the public"
        ],
        "1": [
          "General Concept: Recognition of the value of the press as a source of differing opinions, the facts, the truth, or information regarding the democratic process",
          "So news isn’t censored; Otherwise things would be censored (Q)",
          "So people can trust what’s in the news (Q)",
          "People have the right to know the truth; To get the truth out (Q)",
          "So people can get all the facts (Q)",
          "To expose abuse of power (Q)",
          "So the public gets different (views, opinions); So people hear all sides of the story (Q)",
          "So the public can get information to (make a decision, vote)"
        ],
        "0": [
          "General Concept: Reference to freedom of speech only; Reference to the value of the press as a source of information; No recognition of the press as a source of information for the evaluation of government",
          "Keeps people informed (Q)",
          "So people know what’s happening in the (country, world) (Q)",
          "People have a right to free speech",
          "Without freedom of speech, there would be no democracy",
          "People are free to publish what they want",
          "The public (wouldn’t know what’s going on, has a right to know) (Q)",
          "So that all voices are heard (Q)",
          "To express (ideas, thoughts, opinions) freely; So people can say what they think"
        ]
      },
      "corrective": null
    },
    "17": {
      "prompt": "Why are there limits on trying someone twice for the same crime?",
      "scoring": {
        "2": [
          "General Concept: Recognition that it provides protection from or acts as a safeguard against a corrupt legal system",
          "To protect people from being (abused, harassed) by the courts",
          "So people are not tried over and over until the desired verdict is found",
          "So people are not tried over and over until they are found (guilty, innocent)",
          "To keep the legal system from being (corrupt, unfair, unjust, malicious)",
          "It forces the (legal system, prosecution) to have (a good case, enough evidence) before going to trial"
        ],
        "1": [
          "General Concept: Recognition that it violates the right to a fair trial, constitutes double jeopardy or unfair suffering by the accused, would be detrimental to the court system’s resources or public perception, or could result in aspects of the case being compromised",
          "So people are not tried (over and over, indefinitely) (Q)",
          "To prevent the court from being used for personal vendettas (Q)",
          "So people don’t have to suffer through (a trial, jail) twice (Q)",
          "People could change their stories",
          "Evidence could be (lost, compromised, made up)",
          "Potential jurors could be influenced",
          "It is double jeopardy (Q)",
          "It violates the person’s due process (Q)",
          "The court’s decision should be final;",
          "Multiple trials make people question the court’s authority",
          "To limit the number of court cases; So the court is not backed up with cases",
          "To keep the legal system from wasting (time, money)"
        ],
        "0": [
          "General Concept: Vague reference to law, constitutional rights, or protection of the accused; Indication that people only need to be found guilty or innocent one time",
          "The court should only have one opportunity to try someone (Q)",
          "To protect (the accused’s, criminals’, people’s) rights (Q)",
          "It’s in the (Constitution,",
          "Bill of Rights) (Q)",
          "It’s (the law, unfair, unjust)",
          "They should’ve learned the first time around",
          "The case is settled",
          "No one should pay for the same mistake twice; They’ve already been punished (Q)",
          "People only need to be proven (guilty, innocent) once (Q)",
          "People are innocent until proven guilty",
          "So they don’t add years to the sentence;",
          "So they aren’t in jail longer"
        ]
      },
      "corrective": null
    }
  }
} as const

export const SCRIPTS: Record<string, SubtestScripts | undefined> = RAW as unknown as Record<string, SubtestScripts | undefined>
