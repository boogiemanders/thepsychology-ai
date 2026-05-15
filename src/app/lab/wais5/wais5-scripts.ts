// Auto-generated from WAIS-5 Admin & Scoring Manual.
// Per-item examiner scripts and scoring rubric. Read aloud the prompt; pick the
// score that best matches the examinee's response from the rubric.

export type ItemScript = {
  prompt: string
  scoring: { '2': string[]; '1': string[]; '0': string[] }
  corrective?: string | null
}

export type SubtestScripts = Record<string, ItemScript>

export type SampleScript = {
  prompt: string
  onCorrect?: string
  onIncorrect?: string
}

export type SubtestIntro = {
  sample?: SampleScript
  notes?: string[]
}

export const GENERAL_TEST_INTRO =
  "We'll be doing a lot of things today. Some parts may be easy for you, but some may be hard. Some things will have time limits, and some won't. Most people don't answer all the questions right or finish everything. Just try your best."

export const SUBTEST_INTROS: Record<string, SubtestIntro> = {
  similarities: {
    sample: {
      prompt: 'In what way are TWO and SEVEN alike? How are they the same?',
      onCorrect: "That's right.",
      onIncorrect: "That's not quite right. Two and seven are both numbers.",
    },
    notes: ['Score 2, 1, or 0 points. Record responses verbatim.'],
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
  }
} as const

export const SCRIPTS: Record<string, SubtestScripts | undefined> = RAW as unknown as Record<string, SubtestScripts | undefined>
