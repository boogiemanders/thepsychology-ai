"use strict";
(() => {
  // src/data/dsm5-criteria.ts
  var NARRATIVE_FIELDS = [
    "chiefComplaint",
    "presentingProblems",
    "historyOfPresentIllness",
    "recentSymptoms",
    "additionalSymptoms",
    "additionalInfo",
    "manualNotes",
    "rawQA"
  ];
  var TRAUMA_FIELDS = [
    ...NARRATIVE_FIELDS,
    "physicalSexualAbuseHistory",
    "domesticViolenceHistory"
  ];
  var SUBSTANCE_FIELDS = [
    "alcoholUse",
    "drugUse",
    "substanceUseHistory",
    "additionalInfo",
    "rawQA"
  ];
  var FAMILY_AND_HISTORY_FIELDS = [
    "familyPsychiatricHistory",
    "familyMentalEmotionalHistory",
    "priorTreatment",
    "psychiatricHospitalization",
    "additionalInfo",
    "rawQA"
  ];
  var SOCIAL_FIELDS = [
    "relationshipDescription",
    "livingArrangement",
    "maritalStatus",
    "additionalInfo",
    "rawQA"
  ];
  function criterion(id, letter, text, followUpQuestion, options = {}) {
    return {
      id,
      letter,
      number: options.number,
      text,
      followUpQuestion,
      intakeFields: options.intakeFields ?? NARRATIVE_FIELDS,
      keywords: options.keywords,
      phqItem: options.phqItem,
      gadItem: options.gadItem
    };
  }
  var DSM5_DISORDERS = [
    {
      id: "mdd",
      name: "Major Depressive Disorder",
      chapter: "Depressive Disorders",
      icd10Codes: ["F32.0", "F32.1", "F32.2", "F32.3", "F32.4", "F32.5", "F32.9", "F33.0", "F33.1", "F33.2", "F33.3", "F33.9"],
      sourcePages: [308, 317],
      criteria: [
        criterion("mdd.A.1", "A", "Depressed mood most of the day, nearly every day.", "Have they felt down, empty, or hopeless most days for at least two weeks?", {
          number: 1,
          phqItem: 2,
          keywords: ["depressed", "sad", "down", "hopeless", "empty"]
        }),
        criterion("mdd.A.2", "A", "Markedly diminished interest or pleasure in most activities.", "Have they lost interest or pleasure in activities they usually enjoy?", {
          number: 2,
          phqItem: 1,
          keywords: ["anhedonia", "loss of interest", "nothing feels fun", "no motivation", "loss of enjoyment"]
        }),
        criterion("mdd.A.3", "A", "Significant appetite or weight change, or a clear decrease/increase in appetite.", "Any meaningful appetite or weight change during the same period?", {
          number: 3,
          phqItem: 5,
          keywords: ["appetite", "weight loss", "weight gain", "overeating", "not eating"]
        }),
        criterion("mdd.A.4", "A", "Insomnia or hypersomnia nearly every day.", "Has sleep changed substantially, including difficulty sleeping or sleeping too much?", {
          number: 4,
          phqItem: 3,
          keywords: ["insomnia", "hypersomnia", "sleeping too much", "sleep disturbance"]
        }),
        criterion("mdd.A.5", "A", "Psychomotor agitation or retardation observable by others.", "Has anyone noticed they are moving or speaking much faster or slower than usual?", {
          number: 5,
          keywords: ["psychomotor", "slowed down", "restless", "agitated"]
        }),
        criterion("mdd.A.6", "A", "Fatigue or loss of energy nearly every day.", "Have they been tired or low-energy most days during the episode?", {
          number: 6,
          phqItem: 4,
          keywords: ["fatigue", "low energy", "exhausted", "tired all the time"]
        }),
        criterion("mdd.A.7", "A", "Feelings of worthlessness or excessive/inappropriate guilt.", "Are guilt, shame, or worthlessness part of the presentation?", {
          number: 7,
          phqItem: 6,
          keywords: ["worthless", "guilt", "shame", "failure"]
        }),
        criterion("mdd.A.8", "A", "Diminished ability to think, concentrate, or make decisions.", "Have concentration or decision-making become noticeably harder?", {
          number: 8,
          phqItem: 7,
          keywords: ["concentration", "can\u2019t focus", "indecisive", "mind goes blank"]
        }),
        criterion("mdd.A.9", "A", "Recurrent thoughts of death or suicidal ideation/behavior.", "Have there been recurrent thoughts of death, suicidal thoughts, or suicidal behavior?", {
          number: 9,
          phqItem: 9,
          intakeFields: ["suicidalIdeation", "suicideAttemptHistory", "additionalInfo", "rawQA"],
          keywords: ["suicidal", "wish i were dead", "thoughts of death", "kill myself"]
        }),
        criterion("mdd.B", "B", "Symptoms cause clinically significant distress or impairment.", "How much are the symptoms affecting work, school, relationships, or daily functioning?", {
          intakeFields: ["historyOfPresentIllness", "additionalInfo", "rawQA"],
          keywords: ["can\u2019t function", "missed work", "impaired", "struggling at work", "struggling at school"]
        }),
        criterion("mdd.C", "C", "Episode is not better explained by substances or another medical condition.", "Could substances or a medical condition better account for the depressive symptoms?", {
          intakeFields: ["medicalHistory", "alcoholUse", "drugUse", "substanceUseHistory", "rawQA"]
        }),
        criterion("mdd.D", "D", "The episode is not better explained by a schizophrenia-spectrum or other psychotic disorder.", "Are psychotic-spectrum symptoms or disorders a better explanation for this presentation?", {
          intakeFields: ["additionalSymptoms", "additionalInfo", "rawQA"]
        }),
        criterion("mdd.E", "E", "There has never been a manic or hypomanic episode.", "Has there ever been a period of abnormally elevated mood, very low sleep, and unusually increased energy?", {
          intakeFields: [...NARRATIVE_FIELDS, ...FAMILY_AND_HISTORY_FIELDS],
          keywords: ["manic", "hypomanic", "euphoric", "decreased need for sleep", "grandiose"]
        })
      ],
      requiredCounts: [
        { criterion: "A", required: 5, total: 9, mustInclude: ["mdd.A.1", "mdd.A.2"] }
      ],
      durationRequirement: "Same 2-week period",
      exclusions: [
        "Not attributable to substances or another medical condition.",
        "Not better explained by a schizophrenia-spectrum or other psychotic disorder.",
        "No history of mania or hypomania."
      ],
      specifierOptions: ["Single episode", "Recurrent", "Mild", "Moderate", "Severe", "With anxious distress", "In partial remission", "In full remission"],
      ruleOuts: ["Bipolar I disorder", "Bipolar II disorder", "Persistent depressive disorder", "Adjustment disorder"]
    },
    {
      id: "persistent_depressive_disorder",
      name: "Persistent Depressive Disorder",
      chapter: "Depressive Disorders",
      icd10Codes: ["F34.1"],
      sourcePages: [319, 322],
      criteria: [
        criterion("pdd.A", "A", "Depressed mood for most of the day, more days than not, for at least 2 years (1 year in youth).", "Has the low mood been present more days than not for at least two years?", {
          keywords: ["for years", "for a long time", "chronic depression", "always down", "most days"]
        }),
        criterion("pdd.B.1", "B", "Poor appetite or overeating.", "Is appetite chronically low or elevated during the depressed periods?", {
          number: 1,
          keywords: ["poor appetite", "overeating", "not eating", "eating too much"]
        }),
        criterion("pdd.B.2", "B", "Insomnia or hypersomnia.", "Is chronic sleep disturbance part of the picture?", {
          number: 2,
          keywords: ["insomnia", "hypersomnia", "sleep disturbance"]
        }),
        criterion("pdd.B.3", "B", "Low energy or fatigue.", "Has low energy been part of the chronic depressed state?", {
          number: 3,
          keywords: ["low energy", "fatigue", "exhausted"]
        }),
        criterion("pdd.B.4", "B", "Low self-esteem.", "Do they describe persistently low self-worth or low self-esteem?", {
          number: 4,
          keywords: ["low self-esteem", "worthless", "not good enough"]
        }),
        criterion("pdd.B.5", "B", "Poor concentration or difficulty making decisions.", "Is concentration or decision-making chronically impaired?", {
          number: 5,
          keywords: ["poor concentration", "difficulty deciding", "indecisive"]
        }),
        criterion("pdd.B.6", "B", "Feelings of hopelessness.", "Is hopelessness a chronic feature?", {
          number: 6,
          keywords: ["hopeless", "nothing will change"]
        }),
        criterion("pdd.C", "C", "Symptoms have not been absent for more than 2 months at a time during the disturbance.", "Have there been any symptom-free stretches longer than two months?", {
          keywords: ["constant", "never really lifts", "always there"]
        }),
        criterion("pdd.D", "D", "Major depressive episode criteria may be continuously present for 2 years.", "Have there also been stretches where the symptoms met full major depressive episode intensity?", {
          intakeFields: ["historyOfPresentIllness", "additionalInfo", "rawQA"]
        }),
        criterion("pdd.E", "E", "There has never been a manic or hypomanic episode, and cyclothymic disorder criteria have never been met.", "Any history of mania, hypomania, or cycling periods of elevated mood?", {
          intakeFields: [...NARRATIVE_FIELDS, ...FAMILY_AND_HISTORY_FIELDS],
          keywords: ["manic", "hypomanic", "euphoric", "decreased need for sleep"]
        }),
        criterion("pdd.F", "F", "The disturbance is not better explained by a schizophrenia-spectrum or other psychotic disorder.", "Could a psychotic-spectrum condition better explain the chronic symptoms?", {
          intakeFields: ["additionalSymptoms", "additionalInfo", "rawQA"]
        }),
        criterion("pdd.G", "G", "The symptoms are not attributable to substances or another medical condition.", "Could substances or a medical condition better account for the chronic mood symptoms?", {
          intakeFields: ["medicalHistory", "alcoholUse", "drugUse", "substanceUseHistory", "rawQA"]
        }),
        criterion("pdd.H", "H", "Symptoms cause clinically significant distress or impairment.", "How much have the chronic symptoms affected daily functioning over time?", {
          intakeFields: ["historyOfPresentIllness", "additionalInfo", "rawQA"]
        })
      ],
      requiredCounts: [
        { criterion: "B", required: 2, total: 6 }
      ],
      durationRequirement: "At least 2 years in adults",
      exclusions: [
        "No history of mania or hypomania.",
        "Not attributable to substances or another medical condition.",
        "Not better explained by psychotic-spectrum disorders."
      ],
      specifierOptions: ["With pure dysthymic syndrome", "With persistent major depressive episode", "With intermittent major depressive episodes", "Early onset", "Late onset"],
      ruleOuts: ["Major depressive disorder", "Cyclothymic disorder", "Bipolar II disorder"]
    },
    {
      id: "gad",
      name: "Generalized Anxiety Disorder",
      chapter: "Anxiety Disorders",
      icd10Codes: ["F41.1"],
      sourcePages: [392, 395],
      criteria: [
        criterion("gad.A", "A", "Excessive anxiety and worry, occurring more days than not for at least 6 months, about multiple activities or events.", "Has the worry been excessive and present more days than not for at least six months across several life areas?", {
          keywords: ["excessive worry", "worry all the time", "always anxious", "constant worry"]
        }),
        criterion("gad.B", "B", "The person finds it difficult to control the worry.", "Can they turn the worry off, or does it feel hard to control?", {
          gadItem: 2,
          keywords: ["can\u2019t stop worrying", "hard to control worry", "worry spiral"]
        }),
        criterion("gad.C.1", "C", "Restlessness or feeling keyed up/on edge.", "Do they feel on edge, restless, or keyed up much of the time?", {
          number: 1,
          gadItem: 1,
          keywords: ["on edge", "keyed up", "restless"]
        }),
        criterion("gad.C.2", "C", "Being easily fatigued.", "Do they become tired easily from the anxiety or worrying?", {
          number: 2,
          gadItem: 6,
          keywords: ["fatigued", "tired", "drained"]
        }),
        criterion("gad.C.3", "C", "Difficulty concentrating or mind going blank.", "Does worry interfere with concentration or make the mind go blank?", {
          number: 3,
          gadItem: 2,
          keywords: ["concentration", "mind going blank", "can\u2019t focus"]
        }),
        criterion("gad.C.4", "C", "Irritability.", "Has the person been more irritable because of the anxiety?", {
          number: 4,
          gadItem: 6,
          keywords: ["irritable", "snappy"]
        }),
        criterion("gad.C.5", "C", "Muscle tension.", "Is muscle tension, tightness, or physical tension part of the anxiety?", {
          number: 5,
          keywords: ["muscle tension", "tense", "tight shoulders", "tight jaw"]
        }),
        criterion("gad.C.6", "C", "Sleep disturbance.", "Has the anxiety affected sleep?", {
          number: 6,
          gadItem: 7,
          keywords: ["sleep", "can\u2019t sleep", "trouble sleeping"]
        }),
        criterion("gad.D", "D", "Symptoms cause clinically significant distress or impairment.", "How much does the anxiety interfere with daily responsibilities or relationships?", {
          intakeFields: ["historyOfPresentIllness", "additionalInfo", "rawQA"]
        }),
        criterion("gad.E", "E", "The disturbance is not attributable to substances or another medical condition.", "Could substances, medication, or a medical condition better explain the anxiety?", {
          intakeFields: ["medicalHistory", "alcoholUse", "drugUse", "substanceUseHistory", "rawQA"]
        }),
        criterion("gad.F", "F", "The disturbance is not better explained by another mental disorder.", "Is the worry better accounted for by panic, social anxiety, OCD, PTSD, or another disorder?", {
          intakeFields: ["chiefComplaint", "presentingProblems", "additionalSymptoms", "rawQA"]
        })
      ],
      requiredCounts: [
        { criterion: "C", required: 3, total: 6 }
      ],
      durationRequirement: "At least 6 months",
      exclusions: [
        "Not attributable to substances or another medical condition.",
        "Not better explained by another mental disorder."
      ],
      specifierOptions: ["No formal DSM severity specifier", "Consider anxious distress if depressive disorder is also present"],
      ruleOuts: ["Social anxiety disorder", "Panic disorder", "Obsessive-compulsive disorder", "Posttraumatic stress disorder"]
    },
    {
      id: "social_anxiety_disorder",
      name: "Social Anxiety Disorder",
      chapter: "Anxiety Disorders",
      icd10Codes: ["F40.10"],
      sourcePages: [366, 371],
      criteria: [
        criterion("social_anxiety.A", "A", "Marked fear or anxiety about one or more social situations involving possible scrutiny.", "Which social situations trigger fear or anxiety, such as meeting people, being observed, or performing?", {
          keywords: ["social anxiety", "people judging me", "public speaking", "meeting people", "being watched"]
        }),
        criterion("social_anxiety.B", "B", "Fear of acting in a way or showing anxiety symptoms that will be negatively evaluated.", "What do they fear will happen if they appear anxious in social settings?", {
          keywords: ["embarrassed", "humiliated", "judge me", "negative evaluation"]
        }),
        criterion("social_anxiety.C", "C", "Social situations almost always provoke fear or anxiety.", "Do the feared social situations consistently trigger anxiety?", {
          keywords: ["always happens", "every time", "nearly always"]
        }),
        criterion("social_anxiety.D", "D", "Social situations are avoided or endured with intense fear or anxiety.", "Are the situations avoided, or endured with strong fear?", {
          keywords: ["avoid people", "avoid social situations", "endure", "cancel plans"]
        }),
        criterion("social_anxiety.E", "E", "The fear or anxiety is out of proportion to the actual threat and sociocultural context.", "Does the reaction seem clearly stronger than the actual social risk?", {
          intakeFields: ["historyOfPresentIllness", "additionalInfo", "rawQA"]
        }),
        criterion("social_anxiety.F", "F", "The fear, anxiety, or avoidance is persistent, typically lasting 6 months or more.", "How long has the social fear or avoidance been going on?", {
          keywords: ["for years", "for months", "since school", "longstanding"]
        }),
        criterion("social_anxiety.G", "G", "The fear, anxiety, or avoidance causes clinically significant distress or impairment.", "How has the social anxiety affected work, school, friendships, or dating?", {
          intakeFields: ["historyOfPresentIllness", "additionalInfo", "rawQA"]
        }),
        criterion("social_anxiety.H", "H", "The symptoms are not attributable to substances or another medical condition.", "Could substances or a medical condition better explain the social anxiety?", {
          intakeFields: ["medicalHistory", "alcoholUse", "drugUse", "substanceUseHistory", "rawQA"]
        }),
        criterion("social_anxiety.I", "I", "The fear, anxiety, or avoidance is not better explained by another mental disorder.", "Could panic, body-image concerns, autism, or another disorder better explain the presentation?", {
          intakeFields: ["chiefComplaint", "presentingProblems", "additionalSymptoms", "rawQA"]
        }),
        criterion("social_anxiety.J", "J", "If another medical condition is present, the social fear is clearly unrelated or excessive.", "If there is a medical condition, is the social fear clearly excessive beyond that condition?", {
          intakeFields: ["medicalHistory", "additionalInfo", "rawQA"]
        })
      ],
      requiredCounts: [],
      durationRequirement: "Typically 6 months or more",
      exclusions: [
        "Not attributable to substances or another medical condition.",
        "Not better explained by another mental disorder."
      ],
      specifierOptions: ["Performance only"],
      ruleOuts: ["Generalized anxiety disorder", "Panic disorder", "Body dysmorphic disorder", "Autism spectrum disorder"]
    },
    {
      id: "panic_disorder",
      name: "Panic Disorder",
      chapter: "Anxiety Disorders",
      icd10Codes: ["F41.0"],
      sourcePages: [373, 379],
      criteria: [
        criterion("panic.A.1", "A", "Palpitations, pounding heart, or accelerated heart rate during an abrupt surge of fear.", "Do panic episodes include palpitations or a racing heart?", {
          number: 1,
          keywords: ["panic attack", "heart racing", "palpitations", "pounding heart"]
        }),
        criterion("panic.A.2", "A", "Sweating.", "Do panic episodes include sweating?", {
          number: 2,
          keywords: ["sweating", "sweaty"]
        }),
        criterion("panic.A.3", "A", "Trembling or shaking.", "Do panic episodes include shaking or trembling?", {
          number: 3,
          keywords: ["shaking", "trembling", "shaky"]
        }),
        criterion("panic.A.4", "A", "Shortness of breath or smothering sensations.", "Do panic episodes include feeling short of breath or smothered?", {
          number: 4,
          keywords: ["shortness of breath", "can\u2019t breathe", "smothering"]
        }),
        criterion("panic.A.5", "A", "Feelings of choking.", "Do panic episodes include a choking sensation?", {
          number: 5,
          keywords: ["choking"]
        }),
        criterion("panic.A.6", "A", "Chest pain or discomfort.", "Do panic episodes include chest pain or chest tightness?", {
          number: 6,
          keywords: ["chest pain", "chest tightness"]
        }),
        criterion("panic.A.7", "A", "Nausea or abdominal distress.", "Do panic episodes include nausea or stomach distress?", {
          number: 7,
          keywords: ["nausea", "stomach distress", "abdominal distress"]
        }),
        criterion("panic.A.8", "A", "Dizziness, unsteadiness, light-headedness, or faintness.", "Do panic episodes include dizziness or lightheadedness?", {
          number: 8,
          keywords: ["dizzy", "lightheaded", "faint"]
        }),
        criterion("panic.A.9", "A", "Chills or heat sensations.", "Do panic episodes include chills or hot flashes?", {
          number: 9,
          keywords: ["chills", "hot flashes", "heat sensation"]
        }),
        criterion("panic.A.10", "A", "Paresthesias.", "Do panic episodes include numbness or tingling?", {
          number: 10,
          keywords: ["tingling", "numbness", "paresthesia"]
        }),
        criterion("panic.A.11", "A", "Derealization or depersonalization.", "Do panic episodes include feeling unreal, detached, or outside oneself?", {
          number: 11,
          keywords: ["derealization", "depersonalization", "unreal", "outside my body"]
        }),
        criterion("panic.A.12", "A", "Fear of losing control or going crazy.", "During panic, do they fear losing control or going crazy?", {
          number: 12,
          keywords: ["losing control", "going crazy"]
        }),
        criterion("panic.A.13", "A", "Fear of dying.", "During panic, do they fear they might die?", {
          number: 13,
          keywords: ["fear of dying", "thought i was dying"]
        }),
        criterion("panic.B.1", "B", "At least one attack has been followed by persistent concern or worry about additional attacks or their consequences.", "After attacks, do they worry for at least a month about more attacks or their consequences?", {
          number: 1,
          keywords: ["worried about another panic attack", "fear of another attack"]
        }),
        criterion("panic.B.2", "B", "At least one attack has been followed by a significant maladaptive change in behavior related to the attacks.", "Have they changed behavior, routines, or places because of panic attacks?", {
          number: 2,
          keywords: ["avoid driving", "avoid leaving home", "changed behavior because of panic", "avoid exercise because of panic"]
        }),
        criterion("panic.C", "C", "The disturbance is not attributable to substances or another medical condition.", "Could substances or a medical condition better explain the panic symptoms?", {
          intakeFields: ["medicalHistory", "alcoholUse", "drugUse", "substanceUseHistory", "rawQA"]
        }),
        criterion("panic.D", "D", "The disturbance is not better explained by another mental disorder.", "Could the panic be better explained by social anxiety, OCD, PTSD, or separation anxiety?", {
          intakeFields: ["chiefComplaint", "presentingProblems", "additionalSymptoms", "rawQA"]
        })
      ],
      requiredCounts: [
        { criterion: "A", required: 4, total: 13 },
        { criterion: "B", required: 1, total: 2 }
      ],
      durationRequirement: "At least 1 month of concern or behavior change after an attack",
      exclusions: [
        "Not attributable to substances or another medical condition.",
        "Not better explained by another mental disorder."
      ],
      specifierOptions: ["No formal DSM specifier"],
      ruleOuts: ["Panic attacks as a specifier in other disorders", "Social anxiety disorder", "Posttraumatic stress disorder"]
    },
    {
      id: "ptsd",
      name: "Posttraumatic Stress Disorder",
      chapter: "Trauma- and Stressor-Related Disorders",
      icd10Codes: ["F43.10"],
      sourcePages: [454, 467],
      criteria: [
        criterion("ptsd.A", "A", "Exposure to actual or threatened death, serious injury, or sexual violence.", "What trauma exposure occurred: direct experience, witnessing, learning it happened to a close other, or repeated exposure to details?", {
          intakeFields: TRAUMA_FIELDS,
          keywords: ["trauma", "abuse", "assault", "violence", "accident", "witnessed", "sexual assault"]
        }),
        criterion("ptsd.B.1", "B", "Recurrent, involuntary, intrusive memories.", "Are there intrusive memories of the traumatic event?", {
          number: 1,
          intakeFields: TRAUMA_FIELDS,
          keywords: ["intrusive memories", "can\u2019t stop thinking about it", "flashbacks"]
        }),
        criterion("ptsd.B.2", "B", "Recurrent distressing dreams related to the trauma.", "Are there trauma-related nightmares or distressing dreams?", {
          number: 2,
          intakeFields: TRAUMA_FIELDS,
          keywords: ["nightmares", "trauma dreams", "distressing dreams"]
        }),
        criterion("ptsd.B.3", "B", "Dissociative reactions such as flashbacks.", "Are there flashbacks or moments of feeling back in the traumatic event?", {
          number: 3,
          intakeFields: TRAUMA_FIELDS,
          keywords: ["flashback", "felt like it was happening again"]
        }),
        criterion("ptsd.B.4", "B", "Intense psychological distress at reminders.", "Do reminders of the event trigger intense emotional distress?", {
          number: 4,
          intakeFields: TRAUMA_FIELDS,
          keywords: ["triggered", "distress at reminders", "reminders upset"]
        }),
        criterion("ptsd.B.5", "B", "Marked physiological reactions to reminders.", "Do reminders trigger a strong physical reaction?", {
          number: 5,
          intakeFields: TRAUMA_FIELDS,
          keywords: ["physically reacts", "heart racing at reminders", "panic at reminders"]
        }),
        criterion("ptsd.C.1", "C", "Avoidance of trauma-related thoughts, feelings, or memories.", "Are thoughts, memories, or feelings about the trauma avoided?", {
          number: 1,
          intakeFields: TRAUMA_FIELDS,
          keywords: ["avoid thinking about it", "push it away"]
        }),
        criterion("ptsd.C.2", "C", "Avoidance of external reminders.", "Are people, places, conversations, or activities avoided because they remind the person of the trauma?", {
          number: 2,
          intakeFields: TRAUMA_FIELDS,
          keywords: ["avoid reminders", "avoid places", "avoid people"]
        }),
        criterion("ptsd.D.1", "D", "Inability to remember an important aspect of the trauma.", "Is there trauma-related amnesia or fragmented recall?", {
          number: 1,
          intakeFields: TRAUMA_FIELDS,
          keywords: ["can\u2019t remember", "blank spots", "amnesia"]
        }),
        criterion("ptsd.D.2", "D", "Persistent exaggerated negative beliefs or expectations.", "Are there enduring negative beliefs about self, others, or the world since the trauma?", {
          number: 2,
          intakeFields: TRAUMA_FIELDS,
          keywords: ["can\u2019t trust anyone", "world is unsafe", "i am ruined"]
        }),
        criterion("ptsd.D.3", "D", "Persistent distorted blame of self or others.", "Is there persistent self-blame or blame of others related to the trauma?", {
          number: 3,
          intakeFields: TRAUMA_FIELDS,
          keywords: ["my fault", "blame myself", "blame them"]
        }),
        criterion("ptsd.D.4", "D", "Persistent negative emotional state.", "Is there chronic fear, horror, anger, guilt, or shame related to the trauma?", {
          number: 4,
          intakeFields: TRAUMA_FIELDS,
          keywords: ["fear", "horror", "shame", "guilt", "anger"]
        }),
        criterion("ptsd.D.5", "D", "Markedly diminished interest or participation in activities.", "Has the person withdrawn from activities since the trauma?", {
          number: 5,
          intakeFields: TRAUMA_FIELDS,
          keywords: ["withdrawn", "not interested anymore", "stopped doing things"]
        }),
        criterion("ptsd.D.6", "D", "Feelings of detachment or estrangement from others.", "Do they feel detached, numb, or cut off from other people?", {
          number: 6,
          intakeFields: TRAUMA_FIELDS,
          keywords: ["detached", "estranged", "cut off from others", "numb"]
        }),
        criterion("ptsd.D.7", "D", "Persistent inability to experience positive emotions.", "Is there difficulty feeling positive emotions such as happiness or love?", {
          number: 7,
          intakeFields: TRAUMA_FIELDS,
          keywords: ["can\u2019t feel happy", "numb", "unable to feel positive emotions"]
        }),
        criterion("ptsd.E.1", "E", "Irritable behavior or angry outbursts.", "Have there been angry outbursts or increased irritability since the trauma?", {
          number: 1,
          intakeFields: TRAUMA_FIELDS,
          keywords: ["irritable", "angry outbursts", "rage"]
        }),
        criterion("ptsd.E.2", "E", "Reckless or self-destructive behavior.", "Has there been reckless or self-destructive behavior since the trauma?", {
          number: 2,
          intakeFields: TRAUMA_FIELDS,
          keywords: ["reckless", "self-destructive", "dangerous behavior"]
        }),
        criterion("ptsd.E.3", "E", "Hypervigilance.", "Is there hypervigilance or constant scanning for danger?", {
          number: 3,
          intakeFields: TRAUMA_FIELDS,
          keywords: ["hypervigilant", "always on guard", "scan the room"]
        }),
        criterion("ptsd.E.4", "E", "Exaggerated startle response.", "Is there an exaggerated startle response?", {
          number: 4,
          intakeFields: TRAUMA_FIELDS,
          keywords: ["startle", "jumpy"]
        }),
        criterion("ptsd.E.5", "E", "Problems with concentration.", "Has concentration worsened since the trauma?", {
          number: 5,
          intakeFields: TRAUMA_FIELDS,
          keywords: ["concentration", "can\u2019t focus"]
        }),
        criterion("ptsd.E.6", "E", "Sleep disturbance.", "Has trauma-related distress affected sleep?", {
          number: 6,
          intakeFields: TRAUMA_FIELDS,
          keywords: ["sleep disturbance", "can\u2019t sleep", "insomnia", "nightmares"]
        }),
        criterion("ptsd.F", "F", "Duration is more than 1 month.", "How long have the trauma symptoms been present?", {
          intakeFields: TRAUMA_FIELDS
        }),
        criterion("ptsd.G", "G", "Symptoms cause clinically significant distress or impairment.", "How much have the trauma symptoms affected work, relationships, or daily functioning?", {
          intakeFields: ["historyOfPresentIllness", "additionalInfo", "rawQA"]
        }),
        criterion("ptsd.H", "H", "Symptoms are not attributable to substances or another medical condition.", "Could substances or a medical condition better explain the trauma-related symptoms?", {
          intakeFields: ["medicalHistory", "alcoholUse", "drugUse", "substanceUseHistory", "rawQA"]
        })
      ],
      requiredCounts: [
        { criterion: "B", required: 1, total: 5 },
        { criterion: "C", required: 1, total: 2 },
        { criterion: "D", required: 2, total: 7 },
        { criterion: "E", required: 2, total: 6 }
      ],
      durationRequirement: "More than 1 month",
      exclusions: [
        "Symptoms are not attributable to substances or another medical condition."
      ],
      specifierOptions: ["With dissociative symptoms", "With delayed expression"],
      ruleOuts: ["Acute stress disorder", "Adjustment disorder", "Panic disorder", "Major depressive disorder"]
    },
    {
      id: "acute_stress_disorder",
      name: "Acute Stress Disorder",
      chapter: "Trauma- and Stressor-Related Disorders",
      icd10Codes: ["F43.0"],
      sourcePages: [469, 475],
      criteria: [
        criterion("acute_stress.A", "A", "Exposure to actual or threatened death, serious injury, or sexual violation.", "What acute trauma exposure occurred?", {
          intakeFields: TRAUMA_FIELDS,
          keywords: ["trauma", "abuse", "assault", "violence", "accident"]
        }),
        criterion("acute_stress.B.1", "B", "Recurrent, involuntary, and intrusive memories.", "Have there been intrusive memories since the event?", {
          number: 1,
          intakeFields: TRAUMA_FIELDS,
          keywords: ["intrusive memories", "flashback"]
        }),
        criterion("acute_stress.B.2", "B", "Recurrent distressing dreams.", "Have there been trauma-related dreams since the event?", {
          number: 2,
          intakeFields: TRAUMA_FIELDS,
          keywords: ["nightmares", "distressing dreams"]
        }),
        criterion("acute_stress.B.3", "B", "Dissociative reactions such as flashbacks.", "Any flashbacks or feeling as if the event is happening again?", {
          number: 3,
          intakeFields: TRAUMA_FIELDS,
          keywords: ["flashback", "happening again"]
        }),
        criterion("acute_stress.B.4", "B", "Intense or prolonged distress at reminders.", "Do reminders trigger strong emotional distress?", {
          number: 4,
          intakeFields: TRAUMA_FIELDS,
          keywords: ["triggered", "distress at reminders"]
        }),
        criterion("acute_stress.B.5", "B", "Marked physiological reactions to reminders.", "Do reminders trigger strong physical reactions?", {
          number: 5,
          intakeFields: TRAUMA_FIELDS,
          keywords: ["physical reaction", "heart racing at reminders"]
        }),
        criterion("acute_stress.B.6", "B", "Persistent inability to experience positive emotions.", "Since the event, is it hard to feel positive emotions?", {
          number: 6,
          intakeFields: TRAUMA_FIELDS,
          keywords: ["numb", "can\u2019t feel positive emotions"]
        }),
        criterion("acute_stress.B.7", "B", "Altered sense of reality.", "Have there been episodes of feeling dazed, detached, or in a fog?", {
          number: 7,
          intakeFields: TRAUMA_FIELDS,
          keywords: ["dazed", "detached", "foggy", "unreal"]
        }),
        criterion("acute_stress.B.8", "B", "Inability to remember an important aspect of the trauma.", "Is there trauma-related amnesia?", {
          number: 8,
          intakeFields: TRAUMA_FIELDS,
          keywords: ["can\u2019t remember", "amnesia"]
        }),
        criterion("acute_stress.B.9", "B", "Avoidance of distressing memories, thoughts, or feelings.", "Are trauma-related thoughts or feelings being avoided?", {
          number: 9,
          intakeFields: TRAUMA_FIELDS,
          keywords: ["avoid thinking about it", "push it away"]
        }),
        criterion("acute_stress.B.10", "B", "Avoidance of external reminders.", "Are reminders or places associated with the trauma being avoided?", {
          number: 10,
          intakeFields: TRAUMA_FIELDS,
          keywords: ["avoid reminders", "avoid places"]
        }),
        criterion("acute_stress.B.11", "B", "Sleep disturbance.", "Has sleep worsened since the event?", {
          number: 11,
          intakeFields: TRAUMA_FIELDS,
          keywords: ["sleep disturbance", "insomnia", "nightmares"]
        }),
        criterion("acute_stress.B.12", "B", "Irritable behavior or angry outbursts.", "Is there increased irritability or anger since the event?", {
          number: 12,
          intakeFields: TRAUMA_FIELDS,
          keywords: ["irritable", "angry outbursts"]
        }),
        criterion("acute_stress.B.13", "B", "Hypervigilance.", "Is there hypervigilance since the event?", {
          number: 13,
          intakeFields: TRAUMA_FIELDS,
          keywords: ["hypervigilant", "on guard"]
        }),
        criterion("acute_stress.B.14", "B", "Problems with concentration or exaggerated startle.", "Have concentration problems or a strong startle response emerged since the event?", {
          number: 14,
          intakeFields: TRAUMA_FIELDS,
          keywords: ["concentration", "startle", "jumpy"]
        }),
        criterion("acute_stress.C", "C", "Duration is 3 days to 1 month after trauma exposure.", "Did the symptom cluster begin after the event and stay within the 3-day to 1-month window?", {
          intakeFields: TRAUMA_FIELDS
        }),
        criterion("acute_stress.D", "D", "Symptoms cause clinically significant distress or impairment.", "How much have the acute trauma symptoms impaired day-to-day functioning?", {
          intakeFields: ["historyOfPresentIllness", "additionalInfo", "rawQA"]
        }),
        criterion("acute_stress.E", "E", "The disturbance is not attributable to substances, another medical condition, or a brief psychotic disorder.", "Could substances, a medical condition, or brief psychosis better explain the acute symptoms?", {
          intakeFields: ["medicalHistory", "alcoholUse", "drugUse", "substanceUseHistory", "rawQA"]
        })
      ],
      requiredCounts: [
        { criterion: "B", required: 9, total: 14 }
      ],
      durationRequirement: "3 days to 1 month after trauma",
      exclusions: [
        "Not attributable to substances or another medical condition.",
        "Not better explained by brief psychotic disorder."
      ],
      specifierOptions: ["No formal DSM specifier"],
      ruleOuts: ["Posttraumatic stress disorder", "Adjustment disorder", "Brief psychotic disorder"]
    },
    {
      id: "adjustment_disorder",
      name: "Adjustment Disorder",
      chapter: "Trauma- and Stressor-Related Disorders",
      icd10Codes: ["F43.20", "F43.22", "F43.23", "F43.24", "F43.25", "F43.8"],
      sourcePages: [476, 479],
      criteria: [
        criterion("adjustment.A", "A", "Emotional or behavioral symptoms develop in response to an identifiable stressor within 3 months of its onset.", "What stressor preceded the symptoms, and when did it begin?", {
          keywords: ["breakup", "divorce", "job loss", "recent loss", "stress at work", "moved", "financial stress", "caregiver stress"]
        }),
        criterion("adjustment.B.1", "B", "Distress is out of proportion to the severity or intensity of the stressor.", "Does the reaction seem clearly more intense than would normally be expected for the stressor?", {
          number: 1,
          intakeFields: ["historyOfPresentIllness", "additionalInfo", "rawQA"]
        }),
        criterion("adjustment.B.2", "B", "Symptoms cause significant impairment in social, occupational, or other important areas.", "How much is the stress response affecting functioning?", {
          number: 2,
          intakeFields: ["historyOfPresentIllness", "additionalInfo", "rawQA"]
        }),
        criterion("adjustment.C", "C", "The disturbance does not meet criteria for another mental disorder and is not merely an exacerbation of a preexisting condition.", "Do the symptoms fit another disorder more fully than adjustment disorder?", {
          intakeFields: ["chiefComplaint", "presentingProblems", "historyOfPresentIllness", "additionalSymptoms", "rawQA"]
        }),
        criterion("adjustment.D", "D", "Symptoms do not represent normal bereavement and are not better explained by prolonged grief disorder.", "Is this better understood as normative grief or prolonged grief rather than adjustment disorder?", {
          intakeFields: ["chiefComplaint", "presentingProblems", "additionalInfo", "rawQA"]
        }),
        criterion("adjustment.E", "E", "Once the stressor or its consequences end, symptoms do not persist for more than 6 additional months.", "If the stressor has resolved, did symptoms continue beyond six months?", {
          intakeFields: ["historyOfPresentIllness", "additionalInfo", "rawQA"]
        })
      ],
      requiredCounts: [
        { criterion: "B", required: 1, total: 2 }
      ],
      durationRequirement: "Begins within 3 months of the stressor",
      exclusions: [
        "Does not better meet another mental disorder.",
        "Not better explained by normative bereavement or prolonged grief disorder."
      ],
      specifierOptions: ["With depressed mood", "With anxiety", "With mixed anxiety and depressed mood", "With disturbance of conduct", "With mixed disturbance of emotions and conduct", "Unspecified"],
      ruleOuts: ["Major depressive disorder", "Generalized anxiety disorder", "Posttraumatic stress disorder", "Prolonged grief disorder"]
    },
    {
      id: "ocd",
      name: "Obsessive-Compulsive Disorder",
      chapter: "Obsessive-Compulsive and Related Disorders",
      icd10Codes: ["F42.2", "F42.8", "F42.9"],
      sourcePages: [409, 414],
      criteria: [
        criterion("ocd.A.1", "A", "Obsessions are recurrent and persistent thoughts, urges, or images that are intrusive and unwanted.", "Are there intrusive thoughts, urges, or images that feel unwanted and hard to dismiss?", {
          number: 1,
          keywords: ["obsession", "intrusive thoughts", "unwanted thoughts", "mental images"]
        }),
        criterion("ocd.A.2", "A", "The person tries to ignore, suppress, or neutralize obsessions.", "Do they try to suppress, neutralize, or counteract the intrusive thoughts?", {
          number: 2,
          keywords: ["suppress", "neutralize", "cancel it out", "mental ritual"]
        }),
        criterion("ocd.A.3", "A", "Compulsions are repetitive behaviors or mental acts driven by obsessions or rigid rules.", "Are there repetitive behaviors or mental rituals performed to reduce anxiety or prevent harm?", {
          number: 3,
          keywords: ["compulsion", "ritual", "checking", "washing", "counting", "mental ritual"]
        }),
        criterion("ocd.A.4", "A", "The compulsions are aimed at reducing anxiety or preventing a feared event, but are excessive or not realistically connected.", "Do the rituals feel excessive or not realistically connected to what they are trying to prevent?", {
          number: 4,
          keywords: ["excessive checking", "reassurance seeking", "not rational but i still do it"]
        }),
        criterion("ocd.B", "B", "Obsessions or compulsions are time-consuming or cause significant distress or impairment.", "How much time do the obsessions or compulsions take, and how disruptive are they?", {
          intakeFields: ["historyOfPresentIllness", "additionalInfo", "rawQA"]
        }),
        criterion("ocd.C", "C", "The symptoms are not attributable to substances or another medical condition.", "Could substances or a medical condition better explain the obsessional symptoms?", {
          intakeFields: ["medicalHistory", "alcoholUse", "drugUse", "substanceUseHistory", "rawQA"]
        }),
        criterion("ocd.D", "D", "The disturbance is not better explained by another mental disorder.", "Could the symptoms be better explained by GAD, eating disorder concerns, illness anxiety, or another disorder?", {
          intakeFields: ["chiefComplaint", "presentingProblems", "additionalSymptoms", "rawQA"]
        })
      ],
      requiredCounts: [
        { criterion: "A", required: 1, total: 4 }
      ],
      exclusions: [
        "Not attributable to substances or another medical condition.",
        "Not better explained by another mental disorder."
      ],
      specifierOptions: ["With good or fair insight", "With poor insight", "With absent insight/delusional beliefs", "Tic-related"],
      ruleOuts: ["Generalized anxiety disorder", "Eating disorders", "Illness anxiety disorder", "Body dysmorphic disorder"]
    },
    {
      id: "adhd",
      name: "Attention-Deficit/Hyperactivity Disorder",
      chapter: "Neurodevelopmental Disorders",
      icd10Codes: ["F90.0", "F90.1", "F90.2"],
      sourcePages: [167, 172],
      criteria: [
        criterion("adhd.A1.1", "A1", "Often fails to give close attention to details or makes careless mistakes.", "Are there repeated careless mistakes or missed details?", {
          number: 1,
          keywords: ["careless mistakes", "misses details"]
        }),
        criterion("adhd.A1.2", "A1", "Often has difficulty sustaining attention.", "Is sustained attention difficult in work, school, or conversations?", {
          number: 2,
          keywords: ["difficulty paying attention", "can\u2019t sustain attention", "loses focus"]
        }),
        criterion("adhd.A1.3", "A1", "Often does not seem to listen when spoken to directly.", "Do others report that the person seems not to listen?", {
          number: 3,
          keywords: ["doesn\u2019t listen", "zones out"]
        }),
        criterion("adhd.A1.4", "A1", "Often does not follow through on instructions and fails to finish tasks.", "Do they start tasks and fail to finish them?", {
          number: 4,
          keywords: ["doesn\u2019t finish", "fails to follow through"]
        }),
        criterion("adhd.A1.5", "A1", "Often has difficulty organizing tasks and activities.", "Are organizing tasks, time, or materials persistent problems?", {
          number: 5,
          keywords: ["disorganized", "poor time management", "messy"]
        }),
        criterion("adhd.A1.6", "A1", "Often avoids or dislikes tasks requiring sustained mental effort.", "Do they avoid tasks that require sustained concentration?", {
          number: 6,
          keywords: ["avoid paperwork", "avoid sustained effort", "procrastinate"]
        }),
        criterion("adhd.A1.7", "A1", "Often loses things necessary for tasks or activities.", "Is misplacing essential items a frequent problem?", {
          number: 7,
          keywords: ["loses things", "misplaces"]
        }),
        criterion("adhd.A1.8", "A1", "Is often easily distracted by extraneous stimuli.", "Are they easily distracted by noise, thoughts, or other stimuli?", {
          number: 8,
          keywords: ["easily distracted", "distracted by everything"]
        }),
        criterion("adhd.A1.9", "A1", "Is often forgetful in daily activities.", "Is day-to-day forgetfulness persistent and impairing?", {
          number: 9,
          keywords: ["forgetful", "forgets appointments", "forgets tasks"]
        }),
        criterion("adhd.A2.1", "A2", "Often fidgets or taps hands/feet or squirms in seat.", "Is there noticeable fidgeting or restlessness?", {
          number: 1,
          keywords: ["fidget", "restless", "can\u2019t sit still"]
        }),
        criterion("adhd.A2.2", "A2", "Often leaves seat when remaining seated is expected.", "Do they have trouble staying seated when expected?", {
          number: 2,
          keywords: ["gets up", "leaves seat"]
        }),
        criterion("adhd.A2.3", "A2", "Often runs about, climbs, or feels restless.", "Is there frequent physical restlessness or driven activity?", {
          number: 3,
          keywords: ["runs around", "restless", "driven by a motor"]
        }),
        criterion("adhd.A2.4", "A2", "Often unable to play or engage quietly.", "Is quiet leisure difficult?", {
          number: 4,
          keywords: ["can\u2019t relax", "can\u2019t do quiet activities"]
        }),
        criterion("adhd.A2.5", "A2", "Is often on the go or acts as if driven by a motor.", "Do others describe them as always on the go?", {
          number: 5,
          keywords: ["on the go", "driven by a motor"]
        }),
        criterion("adhd.A2.6", "A2", "Often talks excessively.", "Is excessive talking part of the presentation?", {
          number: 6,
          keywords: ["talks excessively", "talks nonstop"]
        }),
        criterion("adhd.A2.7", "A2", "Often blurts out answers before questions are completed.", "Do they impulsively blurt out answers or interrupt?", {
          number: 7,
          keywords: ["blurts out", "answers before"]
        }),
        criterion("adhd.A2.8", "A2", "Often has difficulty waiting their turn.", "Is waiting their turn unusually hard?", {
          number: 8,
          keywords: ["can\u2019t wait turn", "impatient"]
        }),
        criterion("adhd.A2.9", "A2", "Often interrupts or intrudes on others.", "Do they interrupt or intrude on other people regularly?", {
          number: 9,
          keywords: ["interrupts", "intrudes"]
        }),
        criterion("adhd.B", "B", "Several symptoms were present before age 12 years.", "Were multiple symptoms already present in childhood?", {
          intakeFields: ["developmentalHistory", "education", "additionalInfo", "rawQA"],
          keywords: ["since childhood", "as a kid", "elementary school"]
        }),
        criterion("adhd.C", "C", "Several symptoms are present in two or more settings.", "Do the attention or hyperactivity symptoms show up in more than one setting?", {
          intakeFields: ["education", "occupation", "relationshipDescription", "additionalInfo", "rawQA"]
        }),
        criterion("adhd.D", "D", "There is clear evidence that the symptoms interfere with social, academic, or occupational functioning.", "How do the symptoms impair school, work, home, or relationships?", {
          intakeFields: ["education", "occupation", "historyOfPresentIllness", "additionalInfo", "rawQA"]
        }),
        criterion("adhd.E", "E", "The symptoms are not better explained by another mental disorder.", "Could anxiety, trauma, depression, or another condition better explain the attention symptoms?", {
          intakeFields: ["chiefComplaint", "presentingProblems", "additionalSymptoms", "rawQA"]
        })
      ],
      requiredCounts: [
        { criterion: "A1", required: 6, total: 9 },
        { criterion: "A2", required: 6, total: 9 }
      ],
      durationRequirement: "At least 6 months",
      exclusions: [
        "Symptoms present before age 12.",
        "Symptoms present in at least two settings.",
        "Not better explained by another mental disorder."
      ],
      specifierOptions: ["Combined presentation", "Predominantly inattentive presentation", "Predominantly hyperactive/impulsive presentation", "Mild", "Moderate", "Severe"],
      ruleOuts: ["Anxiety disorders", "Trauma-related disorders", "Depressive disorders", "Substance use disorders"]
    },
    {
      id: "bipolar_i",
      name: "Bipolar I Disorder",
      chapter: "Bipolar and Related Disorders",
      icd10Codes: ["F31.0", "F31.1", "F31.2", "F31.3", "F31.4", "F31.5", "F31.6", "F31.7", "F31.9"],
      sourcePages: [254, 265],
      criteria: [
        criterion("bipolar_i.A", "A", "A distinct period of abnormally elevated, expansive, or irritable mood and increased energy/activity lasting at least 1 week or any duration if hospitalization is necessary.", "Has there ever been a distinct period of unusually elevated or irritable mood with much more energy, lasting a week or requiring hospitalization?", {
          intakeFields: [...NARRATIVE_FIELDS, ...FAMILY_AND_HISTORY_FIELDS],
          keywords: ["manic", "euphoric", "high energy", "barely slept", "hospitalized for mania"]
        }),
        criterion("bipolar_i.B.1", "B", "Inflated self-esteem or grandiosity.", "During the elevated period, was there unusual grandiosity or inflated self-confidence?", {
          number: 1,
          intakeFields: [...NARRATIVE_FIELDS, ...FAMILY_AND_HISTORY_FIELDS],
          keywords: ["grandiose", "special powers", "inflated self-esteem"]
        }),
        criterion("bipolar_i.B.2", "B", "Decreased need for sleep.", "During the elevated period, did they need far less sleep without feeling tired?", {
          number: 2,
          intakeFields: [...NARRATIVE_FIELDS, ...FAMILY_AND_HISTORY_FIELDS],
          keywords: ["decreased need for sleep", "slept 2 hours", "didn\u2019t need sleep"]
        }),
        criterion("bipolar_i.B.3", "B", "More talkative than usual or pressure to keep talking.", "During the elevated period, was there pressured or excessive talking?", {
          number: 3,
          intakeFields: [...NARRATIVE_FIELDS, ...FAMILY_AND_HISTORY_FIELDS],
          keywords: ["pressured speech", "talking nonstop", "more talkative"]
        }),
        criterion("bipolar_i.B.4", "B", "Flight of ideas or racing thoughts.", "Were there racing thoughts or flight of ideas?", {
          number: 4,
          intakeFields: [...NARRATIVE_FIELDS, ...FAMILY_AND_HISTORY_FIELDS],
          keywords: ["racing thoughts", "flight of ideas"]
        }),
        criterion("bipolar_i.B.5", "B", "Distractibility.", "Did distractibility increase markedly during the elevated period?", {
          number: 5,
          intakeFields: [...NARRATIVE_FIELDS, ...FAMILY_AND_HISTORY_FIELDS],
          keywords: ["distractible", "can\u2019t stay on one thing"]
        }),
        criterion("bipolar_i.B.6", "B", "Increase in goal-directed activity or psychomotor agitation.", "Was there a major increase in projects, productivity, agitation, or goal-directed activity?", {
          number: 6,
          intakeFields: [...NARRATIVE_FIELDS, ...FAMILY_AND_HISTORY_FIELDS],
          keywords: ["too many projects", "goal-directed", "psychomotor agitation", "driven"]
        }),
        criterion("bipolar_i.B.7", "B", "Excessive involvement in risky or high-consequence activities.", "Did the elevated period involve unusual risk-taking, spending, sexual behavior, or impulsive decisions?", {
          number: 7,
          intakeFields: [...NARRATIVE_FIELDS, ...FAMILY_AND_HISTORY_FIELDS],
          keywords: ["spending spree", "risky sex", "reckless", "impulsive spending"]
        }),
        criterion("bipolar_i.C", "C", "The mood disturbance is severe enough to cause marked impairment, require hospitalization, or include psychotic features.", "Did the period cause major impairment, require hospitalization, or include psychosis?", {
          intakeFields: ["psychiatricHospitalization", "additionalSymptoms", "additionalInfo", "rawQA"],
          keywords: ["hospitalized", "psychosis", "couldn\u2019t function"]
        }),
        criterion("bipolar_i.D", "D", "The episode is not attributable to substances or another medical condition.", "Could substances or a medical condition better explain the elevated mood episode?", {
          intakeFields: ["medicalHistory", "alcoholUse", "drugUse", "substanceUseHistory", "rawQA"]
        })
      ],
      requiredCounts: [
        { criterion: "B", required: 3, total: 7 }
      ],
      durationRequirement: "At least 1 week, or any duration if hospitalization is needed",
      exclusions: [
        "Not attributable to substances or another medical condition."
      ],
      specifierOptions: ["Current or most recent episode manic", "Current or most recent episode hypomanic", "Current or most recent episode depressed", "With psychotic features", "In partial remission", "In full remission"],
      ruleOuts: ["Substance/medication-induced bipolar disorder", "Major depressive disorder", "Bipolar II disorder"]
    },
    {
      id: "bipolar_ii",
      name: "Bipolar II Disorder",
      chapter: "Bipolar and Related Disorders",
      icd10Codes: ["F31.81"],
      sourcePages: [267, 275],
      criteria: [
        criterion("bipolar_ii.A", "A", "At least one hypomanic episode has occurred.", "Has there ever been a 4-day period of unusually elevated or irritable mood with clearly increased energy that others noticed?", {
          intakeFields: [...NARRATIVE_FIELDS, ...FAMILY_AND_HISTORY_FIELDS],
          keywords: ["hypomanic", "elevated mood", "decreased need for sleep", "racing thoughts"]
        }),
        criterion("bipolar_ii.B", "B", "At least one major depressive episode has occurred.", "Has there also been a clear major depressive episode with multiple depressive symptoms?", {
          intakeFields: [...NARRATIVE_FIELDS, "suicidalIdeation", "rawQA"],
          keywords: ["depressed", "anhedonia", "hopeless", "suicidal"]
        }),
        criterion("bipolar_ii.C", "C", "There has never been a manic episode.", "Has there ever been a manic episode severe enough for hospitalization, major impairment, or psychosis?", {
          intakeFields: [...NARRATIVE_FIELDS, "psychiatricHospitalization", "additionalSymptoms", "rawQA"],
          keywords: ["manic", "hospitalized for mania", "psychosis"]
        }),
        criterion("bipolar_ii.D", "D", "The occurrence of the episodes is not better explained by a schizophrenia-spectrum or other psychotic disorder.", "Could psychotic-spectrum disorders better account for the episodes?", {
          intakeFields: ["additionalSymptoms", "additionalInfo", "rawQA"]
        }),
        criterion("bipolar_ii.E", "E", "The symptoms of depression or the unpredictability caused by mood shifts cause clinically significant distress or impairment.", "How much impairment or distress comes from the depressive burden or mood variability?", {
          intakeFields: ["historyOfPresentIllness", "additionalInfo", "rawQA"]
        })
      ],
      requiredCounts: [],
      exclusions: [
        "No lifetime manic episode.",
        "Not better explained by psychotic-spectrum disorders."
      ],
      specifierOptions: ["Current or most recent episode hypomanic", "Current or most recent episode depressed", "With anxious distress", "In partial remission", "In full remission"],
      ruleOuts: ["Major depressive disorder", "Cyclothymic disorder", "Bipolar I disorder"]
    },
    {
      id: "alcohol_use_disorder",
      name: "Alcohol Use Disorder",
      chapter: "Substance-Related and Addictive Disorders",
      icd10Codes: ["F10.10", "F10.20"],
      sourcePages: [764, 772],
      criteria: [
        criterion("alcohol_use.A.1", "A", "Alcohol is often taken in larger amounts or over a longer period than intended.", "Does drinking often go further than planned?", {
          number: 1,
          intakeFields: SUBSTANCE_FIELDS,
          keywords: ["drink more than intended", "can\u2019t stop once i start"]
        }),
        criterion("alcohol_use.A.2", "A", "Persistent desire or unsuccessful efforts to cut down or control use.", "Have there been unsuccessful attempts to cut down or stop drinking?", {
          number: 2,
          intakeFields: SUBSTANCE_FIELDS,
          keywords: ["tried to cut down", "couldn\u2019t stop drinking"]
        }),
        criterion("alcohol_use.A.3", "A", "A great deal of time is spent obtaining, using, or recovering from alcohol.", "Is a lot of time spent drinking or recovering from drinking?", {
          number: 3,
          intakeFields: SUBSTANCE_FIELDS,
          keywords: ["hangover", "recovering from drinking", "whole day drinking"]
        }),
        criterion("alcohol_use.A.4", "A", "Craving or a strong desire to use alcohol.", "Are cravings or strong urges to drink present?", {
          number: 4,
          intakeFields: SUBSTANCE_FIELDS,
          keywords: ["craving", "urge to drink"]
        }),
        criterion("alcohol_use.A.5", "A", "Recurrent use resulting in failure to fulfill major obligations.", "Has alcohol contributed to problems meeting work, school, or home responsibilities?", {
          number: 5,
          intakeFields: ["alcoholUse", "occupation", "education", "additionalInfo", "rawQA"],
          keywords: ["missed work because of drinking", "neglect responsibilities"]
        }),
        criterion("alcohol_use.A.6", "A", "Continued use despite social or interpersonal problems caused by alcohol.", "Has drinking continued despite relationship conflict or social problems?", {
          number: 6,
          intakeFields: ["alcoholUse", "relationshipDescription", "additionalInfo", "rawQA"],
          keywords: ["arguments about drinking", "relationship problems because of alcohol"]
        }),
        criterion("alcohol_use.A.7", "A", "Important activities are given up or reduced because of alcohol use.", "Have activities been reduced because drinking took priority?", {
          number: 7,
          intakeFields: SUBSTANCE_FIELDS,
          keywords: ["stopped activities", "drinking instead of"]
        }),
        criterion("alcohol_use.A.8", "A", "Recurrent use in physically hazardous situations.", "Has alcohol been used in dangerous situations such as driving?", {
          number: 8,
          intakeFields: SUBSTANCE_FIELDS,
          keywords: ["drunk driving", "hazardous use"]
        }),
        criterion("alcohol_use.A.9", "A", "Use continues despite knowing it causes physical or psychological problems.", "Does alcohol use continue despite known health or mental health consequences?", {
          number: 9,
          intakeFields: ["alcoholUse", "medicalHistory", "additionalInfo", "rawQA"],
          keywords: ["still drink even though", "doctor told me to stop drinking"]
        }),
        criterion("alcohol_use.A.10", "A", "Tolerance.", "Has tolerance developed, requiring more alcohol for the same effect?", {
          number: 10,
          intakeFields: SUBSTANCE_FIELDS,
          keywords: ["tolerance", "need more alcohol"]
        }),
        criterion("alcohol_use.A.11", "A", "Withdrawal or use to relieve withdrawal.", "Have there been withdrawal symptoms or drinking to avoid withdrawal?", {
          number: 11,
          intakeFields: SUBSTANCE_FIELDS,
          keywords: ["withdrawal", "shakes", "drink to feel normal"]
        })
      ],
      requiredCounts: [
        { criterion: "A", required: 2, total: 11 }
      ],
      durationRequirement: "Within a 12-month period",
      exclusions: [],
      specifierOptions: ["Mild", "Moderate", "Severe", "In early remission", "In sustained remission"],
      ruleOuts: ["Social drinking without impairment", "Substance-induced symptoms without use disorder"]
    },
    {
      id: "cannabis_use_disorder",
      name: "Cannabis Use Disorder",
      chapter: "Substance-Related and Addictive Disorders",
      icd10Codes: ["F12.10", "F12.20"],
      sourcePages: [790, 797],
      criteria: [
        criterion("cannabis_use.A.1", "A", "Cannabis is often taken in larger amounts or over a longer period than intended.", "Does cannabis use often go further than planned?", {
          number: 1,
          intakeFields: SUBSTANCE_FIELDS,
          keywords: ["use more weed than intended", "can\u2019t stop smoking once i start"]
        }),
        criterion("cannabis_use.A.2", "A", "Persistent desire or unsuccessful efforts to cut down or control use.", "Have there been unsuccessful attempts to cut down or stop cannabis use?", {
          number: 2,
          intakeFields: SUBSTANCE_FIELDS,
          keywords: ["tried to cut down weed", "couldn\u2019t stop cannabis"]
        }),
        criterion("cannabis_use.A.3", "A", "A great deal of time is spent obtaining, using, or recovering from cannabis.", "Is a lot of time spent using cannabis or recovering from it?", {
          number: 3,
          intakeFields: SUBSTANCE_FIELDS,
          keywords: ["all day smoking", "recovering from using"]
        }),
        criterion("cannabis_use.A.4", "A", "Craving or a strong desire to use cannabis.", "Are cravings or strong urges to use cannabis present?", {
          number: 4,
          intakeFields: SUBSTANCE_FIELDS,
          keywords: ["craving weed", "urge to use"]
        }),
        criterion("cannabis_use.A.5", "A", "Recurrent use resulting in failure to fulfill major obligations.", "Has cannabis contributed to problems meeting work, school, or home responsibilities?", {
          number: 5,
          intakeFields: ["drugUse", "occupation", "education", "additionalInfo", "rawQA"],
          keywords: ["missed work because of weed", "neglect responsibilities"]
        }),
        criterion("cannabis_use.A.6", "A", "Continued use despite social or interpersonal problems caused by cannabis.", "Has cannabis use continued despite relationship or social conflict?", {
          number: 6,
          intakeFields: ["drugUse", "relationshipDescription", "additionalInfo", "rawQA"],
          keywords: ["arguments about weed", "relationship problems because of cannabis"]
        }),
        criterion("cannabis_use.A.7", "A", "Important activities are given up or reduced because of cannabis.", "Have activities been reduced because cannabis use took priority?", {
          number: 7,
          intakeFields: SUBSTANCE_FIELDS,
          keywords: ["stopped activities", "weed instead of"]
        }),
        criterion("cannabis_use.A.8", "A", "Recurrent use in physically hazardous situations.", "Has cannabis been used in dangerous situations such as driving?", {
          number: 8,
          intakeFields: SUBSTANCE_FIELDS,
          keywords: ["drive high", "hazardous use"]
        }),
        criterion("cannabis_use.A.9", "A", "Use continues despite knowing it causes physical or psychological problems.", "Does cannabis use continue despite health or mental health consequences?", {
          number: 9,
          intakeFields: ["drugUse", "medicalHistory", "additionalInfo", "rawQA"],
          keywords: ["weed makes anxiety worse", "still use even though"]
        }),
        criterion("cannabis_use.A.10", "A", "Tolerance.", "Has tolerance developed to cannabis?", {
          number: 10,
          intakeFields: SUBSTANCE_FIELDS,
          keywords: ["tolerance", "need more cannabis"]
        }),
        criterion("cannabis_use.A.11", "A", "Withdrawal or use to relieve withdrawal.", "Have there been withdrawal symptoms or using to relieve them?", {
          number: 11,
          intakeFields: SUBSTANCE_FIELDS,
          keywords: ["withdrawal", "irritable without weed", "use to feel normal"]
        })
      ],
      requiredCounts: [
        { criterion: "A", required: 2, total: 11 }
      ],
      durationRequirement: "Within a 12-month period",
      exclusions: [],
      specifierOptions: ["Mild", "Moderate", "Severe", "In early remission", "In sustained remission"],
      ruleOuts: ["Nonproblematic cannabis use", "Substance-induced symptoms without a use disorder"]
    },
    {
      id: "borderline_personality_disorder",
      name: "Borderline Personality Disorder",
      chapter: "Personality Disorders",
      icd10Codes: ["F60.3"],
      sourcePages: [1002, 1005],
      criteria: [
        criterion("borderline.A", "A", "A pervasive pattern of instability in relationships, self-image, affect, and impulsivity beginning by early adulthood and present across contexts.", "Has there been a long-standing cross-situational pattern of instability in identity, relationships, mood, and impulsivity?", {
          intakeFields: [...NARRATIVE_FIELDS, ...SOCIAL_FIELDS]
        }),
        criterion("borderline.B.1", "B", "Frantic efforts to avoid real or imagined abandonment.", "Are there frantic efforts to avoid abandonment or intense reactions to perceived rejection?", {
          number: 1,
          intakeFields: [...NARRATIVE_FIELDS, ...SOCIAL_FIELDS],
          keywords: ["abandonment", "fear of being left", "panic when someone pulls away"]
        }),
        criterion("borderline.B.2", "B", "A pattern of unstable and intense interpersonal relationships alternating between idealization and devaluation.", "Are close relationships intense, unstable, or marked by rapid swings between idealization and devaluation?", {
          number: 2,
          intakeFields: [...NARRATIVE_FIELDS, ...SOCIAL_FIELDS],
          keywords: ["unstable relationships", "idealize", "devalue", "push-pull"]
        }),
        criterion("borderline.B.3", "B", "Identity disturbance with markedly unstable self-image or sense of self.", "Is there a markedly unstable sense of self or identity?", {
          number: 3,
          intakeFields: NARRATIVE_FIELDS,
          keywords: ["don\u2019t know who i am", "identity disturbance", "unstable self-image"]
        }),
        criterion("borderline.B.4", "B", "Impulsivity in at least two potentially self-damaging areas.", "Are there impulsive behaviors in self-damaging areas such as spending, sex, substances, driving, or binge eating?", {
          number: 4,
          intakeFields: [...NARRATIVE_FIELDS, ...SUBSTANCE_FIELDS],
          keywords: ["impulsive spending", "risky sex", "reckless driving", "binge eating", "substance abuse"]
        }),
        criterion("borderline.B.5", "B", "Recurrent suicidal behavior, gestures, threats, or self-mutilation.", "Is there recurrent suicidal behavior, self-harm, or self-mutilation?", {
          number: 5,
          intakeFields: ["suicidalIdeation", "suicideAttemptHistory", "additionalSymptoms", "additionalInfo", "rawQA"],
          keywords: ["self-harm", "cutting", "suicide attempts", "suicidal gestures"]
        }),
        criterion("borderline.B.6", "B", "Affective instability due to marked reactivity of mood.", "Are there rapid, intense mood shifts tied to interpersonal or situational triggers?", {
          number: 6,
          intakeFields: NARRATIVE_FIELDS,
          keywords: ["mood swings", "emotionally reactive", "intense mood changes"]
        }),
        criterion("borderline.B.7", "B", "Chronic feelings of emptiness.", "Are chronic feelings of emptiness present?", {
          number: 7,
          intakeFields: NARRATIVE_FIELDS,
          keywords: ["empty", "void", "chronic emptiness"]
        }),
        criterion("borderline.B.8", "B", "Inappropriate, intense anger or difficulty controlling anger.", "Is anger intense, hard to regulate, or disproportionate?", {
          number: 8,
          intakeFields: NARRATIVE_FIELDS,
          keywords: ["intense anger", "rage", "can\u2019t control anger"]
        }),
        criterion("borderline.B.9", "B", "Transient stress-related paranoid ideation or severe dissociative symptoms.", "Under stress, are there brief paranoid ideas or dissociative symptoms?", {
          number: 9,
          intakeFields: NARRATIVE_FIELDS,
          keywords: ["paranoid when stressed", "dissociation", "stress-related paranoia"]
        })
      ],
      requiredCounts: [
        { criterion: "B", required: 5, total: 9 }
      ],
      exclusions: [
        "Pattern is pervasive and longstanding rather than limited to episodes.",
        "Not better explained by substances or another medical condition."
      ],
      specifierOptions: ["No formal DSM specifier"],
      ruleOuts: ["Bipolar disorders", "Posttraumatic stress disorder", "Substance use disorders"]
    }
  ];
  var DSM5_DISORDER_MAP = Object.fromEntries(
    DSM5_DISORDERS.map((disorder) => [disorder.id, disorder])
  );

  // src/lib/diagnostic-engine.ts
  var FIELD_LABELS = {
    chiefComplaint: "Chief complaint",
    presentingProblems: "Presenting problems",
    historyOfPresentIllness: "History of present illness",
    priorTreatment: "Prior treatment",
    medicalHistory: "Medical history",
    suicidalIdeation: "Suicidal ideation",
    suicideAttemptHistory: "Suicide attempt history",
    homicidalIdeation: "Homicidal ideation",
    psychiatricHospitalization: "Psychiatric hospitalization",
    alcoholUse: "Alcohol use",
    drugUse: "Drug use",
    substanceUseHistory: "Substance use history",
    familyPsychiatricHistory: "Family psychiatric history",
    familyMentalEmotionalHistory: "Family mental/emotional history",
    maritalStatus: "Marital status",
    relationshipDescription: "Relationship description",
    livingArrangement: "Living arrangement",
    education: "Education",
    occupation: "Occupation",
    physicalSexualAbuseHistory: "Physical/sexual abuse history",
    domesticViolenceHistory: "Domestic violence history",
    recentSymptoms: "Recent symptoms",
    additionalSymptoms: "Additional symptoms",
    additionalInfo: "Additional info",
    manualNotes: "Clinician notes",
    rawQA: "Raw intake Q&A",
    combinedSymptoms: "Combined symptoms",
    combinedNarrative: "Combined intake narrative"
  };
  var NEGATIVE_PATTERN = /\b(no|none|denies|denied|not really|never|negative|n\/a)\b/i;
  var SUBSTANCE_POSITIVE_PATTERN = /\b(daily|weekly|weekends|regular|often|frequent|binge|heavy|abuse|misuse|depend|dependent|withdrawal|craving)\b/i;
  var MANIA_PATTERN = /\b(manic|mania|hypomanic|euphoric|grandiose|decreased need for sleep|little sleep|pressured speech|racing thoughts|spending spree|reckless)\b/i;
  var TRAUMA_PATTERN = /\b(trauma|abuse|assault|violence|accident|witnessed|rape|sexual assault)\b/i;
  function normalizeText(value) {
    return value.normalize("NFKC").replace(/[’‘]/g, "'").replace(/[“”]/g, '"').toLowerCase().replace(/\s+/g, " ").trim();
  }
  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  function matchesKeyword(text, keyword) {
    const normalizedKeyword = normalizeText(keyword);
    if (!normalizedKeyword) return false;
    const pattern = escapeRegExp(normalizedKeyword).replace(/\s+/g, "\\s+");
    return new RegExp(`(^|[^a-z0-9])${pattern}($|[^a-z0-9])`, "i").test(text);
  }
  function buildCombinedNarrative(intake) {
    return [
      intake.chiefComplaint,
      intake.presentingProblems,
      intake.historyOfPresentIllness,
      intake.recentSymptoms,
      intake.additionalSymptoms,
      intake.additionalInfo,
      intake.manualNotes,
      intake.priorTreatment,
      intake.medicalHistory,
      intake.suicidalIdeation,
      intake.suicideAttemptHistory,
      intake.homicidalIdeation,
      intake.psychiatricHospitalization,
      intake.alcoholUse,
      intake.drugUse,
      intake.substanceUseHistory,
      intake.familyPsychiatricHistory,
      intake.familyMentalEmotionalHistory,
      intake.relationshipDescription,
      intake.livingArrangement,
      intake.occupation,
      intake.physicalSexualAbuseHistory,
      intake.domesticViolenceHistory,
      ...intake.rawQA.map((pair) => `${pair.question} ${pair.answer}`),
      ...intake.phq9?.items.map((item) => `${item.question} ${item.response}`) ?? [],
      ...intake.gad7?.items.map((item) => `${item.question} ${item.response}`) ?? []
    ].filter(Boolean).join("\n");
  }
  function clipEvidence(value, max = 140) {
    const trimmed = value.replace(/\s+/g, " ").trim();
    return trimmed.length > max ? `${trimmed.slice(0, max - 1)}\u2026` : trimmed;
  }
  function getFieldValues(intake, field) {
    switch (field) {
      case "rawQA":
        return intake.rawQA.map((pair) => `${pair.question}: ${pair.answer}`).filter(Boolean);
      case "combinedSymptoms":
        return [intake.recentSymptoms, intake.additionalSymptoms].filter(Boolean);
      case "combinedNarrative":
        return [buildCombinedNarrative(intake)];
      default: {
        const value = intake[field];
        if (typeof value === "string") return value.trim() ? [value] : [];
        return [];
      }
    }
  }
  function getAssessmentItemEvidence(intake, criterion2) {
    if (criterion2.phqItem && intake.phq9) {
      const item = intake.phq9.items.find((candidate) => candidate.number === criterion2.phqItem);
      if (item) {
        if (item.score > 0) {
          return {
            evidence: [`PHQ-9 item ${item.number}: ${item.response}`],
            sources: [`PHQ-9 item ${item.number}`],
            status: "met"
          };
        }
        return { evidence: [], sources: [`PHQ-9 item ${item.number}`], status: "not_met" };
      }
    }
    if (criterion2.gadItem && intake.gad7) {
      const item = intake.gad7.items.find((candidate) => candidate.number === criterion2.gadItem);
      if (item) {
        if (item.score > 0) {
          return {
            evidence: [`GAD-7 item ${item.number}: ${item.response}`],
            sources: [`GAD-7 item ${item.number}`],
            status: "met"
          };
        }
        return { evidence: [], sources: [`GAD-7 item ${item.number}`], status: "not_met" };
      }
    }
    return { evidence: [], sources: [], status: null };
  }
  function evaluateGenericCriterion(intake, criterion2) {
    const assessmentEvidence = getAssessmentItemEvidence(intake, criterion2);
    const evidence = [...assessmentEvidence.evidence];
    const sources = [...assessmentEvidence.sources];
    const matchedKeywords = [];
    for (const field of criterion2.intakeFields) {
      const values = getFieldValues(intake, field);
      const label = FIELD_LABELS[field] ?? field;
      for (const value of values) {
        const normalized = normalizeText(value);
        if (!normalized) continue;
        const matchingKeywords = (criterion2.keywords ?? []).filter((keyword) => matchesKeyword(normalized, keyword));
        if (matchingKeywords.length > 0) {
          matchedKeywords.push(...matchingKeywords);
          evidence.push(`${label}: ${clipEvidence(value)}`);
          sources.push(label);
          break;
        }
      }
    }
    const uniqueEvidence = Array.from(new Set(evidence)).slice(0, 3);
    const uniqueSources = Array.from(new Set(sources));
    let status = "not_assessed";
    if (assessmentEvidence.status === "met") {
      status = "met";
    } else if (matchedKeywords.length >= 2) {
      status = "met";
    } else if (matchedKeywords.length === 1) {
      status = "likely";
    } else if (assessmentEvidence.status === "not_met") {
      status = "not_met";
    } else {
      const fieldTexts = criterion2.intakeFields.flatMap((field) => getFieldValues(intake, field));
      const nonEmpty = fieldTexts.filter((value) => value.trim());
      if (nonEmpty.length > 0 && nonEmpty.every((value) => NEGATIVE_PATTERN.test(value))) {
        status = "not_met";
      }
    }
    const rationale = status === "met" ? "Direct intake or assessment evidence supports this criterion." : status === "likely" ? "There is partial narrative support, but clinician confirmation is still needed." : status === "not_met" ? "Available assessment or intake responses do not support this criterion." : "The current intake packet does not provide enough evidence to decide this criterion.";
    return {
      criterionId: criterion2.id,
      status,
      evidence: uniqueEvidence,
      sources: uniqueSources,
      rationale,
      followUpQuestion: criterion2.followUpQuestion
    };
  }
  function overrideCriterionEvaluation(disorder, intake, criterion2, evaluation) {
    if (criterion2.id === "mdd.B" && intake.phq9?.difficulty) {
      if (/not difficult at all/i.test(intake.phq9.difficulty)) {
        return { ...evaluation, status: "likely", evidence: [`PHQ-9 difficulty: ${intake.phq9.difficulty}`], sources: ["PHQ-9 impairment"], rationale: "Symptoms are present, but the recorded functional difficulty is limited." };
      }
      return { ...evaluation, status: "met", evidence: [`PHQ-9 difficulty: ${intake.phq9.difficulty}`], sources: ["PHQ-9 impairment"], rationale: "The PHQ-9 functional difficulty item suggests clinically meaningful impairment." };
    }
    if (criterion2.id === "gad.D" && intake.gad7?.difficulty) {
      if (/not difficult at all/i.test(intake.gad7.difficulty)) {
        return { ...evaluation, status: "likely", evidence: [`GAD-7 difficulty: ${intake.gad7.difficulty}`], sources: ["GAD-7 impairment"], rationale: "Anxiety symptoms are present, but the recorded functional difficulty is limited." };
      }
      return { ...evaluation, status: "met", evidence: [`GAD-7 difficulty: ${intake.gad7.difficulty}`], sources: ["GAD-7 impairment"], rationale: "The GAD-7 functional difficulty item suggests clinically meaningful impairment." };
    }
    if (criterion2.id === "mdd.E" || criterion2.id === "pdd.E") {
      const maniaEvidence = buildCombinedNarrative(intake);
      if (MANIA_PATTERN.test(maniaEvidence)) {
        return {
          ...evaluation,
          status: "not_met",
          evidence: ["Intake narrative includes possible manic/hypomanic language."],
          sources: ["Combined intake narrative"],
          rationale: "Possible manic or hypomanic history blocks automatic satisfaction of this exclusion criterion."
        };
      }
      return {
        ...evaluation,
        status: "unclear",
        evidence: [],
        sources: [],
        rationale: "Absence of mania/hypomania usually requires direct clinical review rather than intake inference alone."
      };
    }
    if ((criterion2.id === "bipolar_i.A" || criterion2.id === "bipolar_ii.A") && evaluation.status === "not_assessed") {
      if (/bipolar/i.test(`${intake.familyPsychiatricHistory} ${intake.familyMentalEmotionalHistory}`)) {
        return {
          ...evaluation,
          status: "likely",
          evidence: ["Family history references bipolar spectrum illness."],
          sources: ["Family psychiatric history"],
          rationale: "Family history raises bipolar differential concern, but a lifetime hypomanic/manic history still needs direct confirmation."
        };
      }
    }
    if (criterion2.id === "ptsd.A" || criterion2.id === "acute_stress.A") {
      const traumaText = [
        intake.physicalSexualAbuseHistory,
        intake.domesticViolenceHistory,
        buildCombinedNarrative(intake)
      ].join("\n");
      if (TRAUMA_PATTERN.test(traumaText)) {
        return {
          ...evaluation,
          status: "met",
          evidence: evaluation.evidence.length ? evaluation.evidence : ["Trauma exposure language appears in intake history."],
          sources: evaluation.sources.length ? evaluation.sources : ["Trauma history"],
          rationale: "The intake packet documents trauma exposure relevant to this criterion."
        };
      }
    }
    if ((criterion2.id === "alcohol_use.A.10" || criterion2.id === "alcohol_use.A.11" || criterion2.id === "cannabis_use.A.10" || criterion2.id === "cannabis_use.A.11") && evaluation.status === "not_assessed") {
      return {
        ...evaluation,
        status: "unclear",
        rationale: "Tolerance and withdrawal usually require direct questioning and are not reliably inferred from routine intake data."
      };
    }
    if ((criterion2.id === "mdd.C" || criterion2.id === "gad.E" || criterion2.id === "ptsd.H" || criterion2.id === "acute_stress.E") && evaluation.status === "not_assessed") {
      return {
        ...evaluation,
        status: "unclear",
        rationale: "Substance and medical exclusions generally require clinician review rather than passive intake inference."
      };
    }
    if ((criterion2.id === "alcohol_use.A.1" || criterion2.id === "cannabis_use.A.1") && evaluation.status === "not_assessed") {
      const substanceText = `${intake.alcoholUse} ${intake.drugUse} ${intake.substanceUseHistory}`.trim();
      if (SUBSTANCE_POSITIVE_PATTERN.test(substanceText)) {
        return {
          ...evaluation,
          status: "likely",
          evidence: [clipEvidence(substanceText)],
          sources: ["Substance use history"],
          rationale: "Frequency or intensity language suggests the use pattern may exceed intended or casual use."
        };
      }
    }
    return evaluation;
  }
  function evaluateDisorder(disorder, intake) {
    return disorder.criteria.map((criterion2) => {
      const generic = evaluateGenericCriterion(intake, criterion2);
      return overrideCriterionEvaluation(disorder, intake, criterion2, generic);
    });
  }
  function isPositive(status) {
    return status === "met" || status === "likely";
  }
  function countStatuses(criteria, prefix) {
    return criteria.reduce(
      (acc, evaluation) => {
        if (!evaluation.criterionId.startsWith(prefix)) return acc;
        if (evaluation.status === "met") acc.met += 1;
        if (isPositive(evaluation.status)) acc.positive += 1;
        return acc;
      },
      { met: 0, positive: 0 }
    );
  }
  function determineConfidence(score) {
    if (score >= 11) return "high";
    if (score >= 5) return "moderate";
    return "low";
  }
  function determineMddSpecifier(intake) {
    const score = intake.phq9?.totalScore ?? 0;
    if (!score) return void 0;
    if (score >= 20) return "Severe";
    if (score >= 15) return "Moderately severe";
    if (score >= 10) return "Moderate";
    if (score >= 5) return "Mild";
    return void 0;
  }
  function determineSubstanceSpecifier(positiveCount) {
    if (positiveCount >= 6) return "Severe";
    if (positiveCount >= 4) return "Moderate";
    if (positiveCount >= 2) return "Mild";
    return void 0;
  }
  function summarizeRequirement(disorder, criteria) {
    if (disorder.requiredCounts.length) {
      return disorder.requiredCounts.reduce((sum, item) => sum + item.required, 0);
    }
    return criteria.filter((criterion2) => !criterion2.criterionId.match(/\.\d+$/)).length || criteria.length;
  }
  function scoreDisorder(disorder, intake, criteria) {
    const positiveCount = criteria.filter((criterion2) => isPositive(criterion2.status)).length;
    const metCount = criteria.filter((criterion2) => criterion2.status === "met").length;
    const combinedNarrative = buildCombinedNarrative(intake);
    switch (disorder.id) {
      case "mdd": {
        const countA = countStatuses(criteria, "mdd.A.");
        const hasCore = isPositive(criteria.find((criterion2) => criterion2.criterionId === "mdd.A.1")?.status ?? "not_assessed") || isPositive(criteria.find((criterion2) => criterion2.criterionId === "mdd.A.2")?.status ?? "not_assessed");
        const phq = intake.phq9?.totalScore ?? 0;
        const score = countA.met * 2 + countA.positive + (hasCore ? 2 : 0) + Math.floor(phq / 5);
        const reason = phq ? `PHQ-9 ${phq}/27 with ${countA.positive} depressive symptom criteria supported.` : `${countA.positive} depressive symptom criteria are supported by intake text.`;
        const confidence = phq >= 15 && countA.positive >= 5 && hasCore ? "high" : phq >= 10 || countA.positive >= 4 ? "moderate" : "low";
        return { confidence, reason, score, suggestedSpecifier: determineMddSpecifier(intake) };
      }
      case "gad": {
        const countC = countStatuses(criteria, "gad.C.");
        const gad = intake.gad7?.totalScore ?? 0;
        const score = countC.met * 2 + countC.positive + Math.floor(gad / 5);
        const reason = gad ? `GAD-7 ${gad}/21 with ${countC.positive} core anxiety criteria supported.` : `${countC.positive} core anxiety criteria are supported by intake text.`;
        const confidence = gad >= 15 && countC.positive >= 3 ? "high" : gad >= 10 || countC.positive >= 3 ? "moderate" : "low";
        return { confidence, reason, score, suggestedSpecifier: void 0 };
      }
      case "ptsd": {
        const b = countStatuses(criteria, "ptsd.B.");
        const c = countStatuses(criteria, "ptsd.C.");
        const d = countStatuses(criteria, "ptsd.D.");
        const e = countStatuses(criteria, "ptsd.E.");
        const trauma = criteria.find((criterion2) => criterion2.criterionId === "ptsd.A")?.status;
        const traumaScore = isPositive(trauma ?? "not_assessed") ? 3 : 0;
        const score = traumaScore + b.positive + c.positive + d.positive + e.positive;
        const confidence = trauma === "met" && b.positive >= 1 && c.positive >= 1 && d.positive >= 2 && e.positive >= 2 ? "high" : traumaScore > 0 && score >= 5 ? "moderate" : "low";
        return {
          confidence,
          score,
          reason: traumaScore ? `Trauma exposure is documented with ${b.positive + c.positive + d.positive + e.positive} PTSD symptom criteria supported.` : "PTSD remains a differential only if trauma exposure is later confirmed.",
          suggestedSpecifier: void 0
        };
      }
      case "acute_stress_disorder": {
        const b = countStatuses(criteria, "acute_stress.B.");
        const trauma = criteria.find((criterion2) => criterion2.criterionId === "acute_stress.A")?.status;
        const score = (isPositive(trauma ?? "not_assessed") ? 3 : 0) + b.positive;
        const confidence = trauma === "met" && b.positive >= 9 ? "high" : trauma && isPositive(trauma) && b.positive >= 5 ? "moderate" : "low";
        return {
          confidence,
          score,
          reason: isPositive(trauma ?? "not_assessed") ? `Acute trauma exposure is documented with ${b.positive} acute stress symptoms supported.` : "Acute stress disorder depends on recent trauma exposure and symptom timing.",
          suggestedSpecifier: void 0
        };
      }
      case "panic_disorder": {
        const attackSymptoms = countStatuses(criteria, "panic.A.");
        const aftermath = countStatuses(criteria, "panic.B.");
        const score = attackSymptoms.positive + aftermath.positive * 2;
        return {
          confidence: attackSymptoms.positive >= 4 && aftermath.positive >= 1 ? "moderate" : attackSymptoms.positive >= 3 ? "low" : "low",
          score,
          reason: attackSymptoms.positive ? `${attackSymptoms.positive} panic attack symptoms are supported by intake text.` : "No strong panic-attack language is present in the intake packet.",
          suggestedSpecifier: void 0
        };
      }
      case "social_anxiety_disorder": {
        const score = positiveCount;
        return {
          confidence: positiveCount >= 5 ? "moderate" : "low",
          score,
          reason: positiveCount ? `${positiveCount} social anxiety criteria are supported by narrative intake text.` : "Only minimal social-anxiety evidence appears in the intake packet.",
          suggestedSpecifier: void 0
        };
      }
      case "ocd": {
        const score = positiveCount;
        return {
          confidence: positiveCount >= 4 ? "moderate" : "low",
          score,
          reason: positiveCount ? `${positiveCount} obsession/compulsion criteria are supported by intake text.` : "Only limited obsession/compulsion evidence appears in the intake packet.",
          suggestedSpecifier: void 0
        };
      }
      case "adjustment_disorder": {
        const score = positiveCount + (/\b(breakup|divorce|job loss|recent loss|stress|moved|financial)\b/i.test(combinedNarrative) ? 2 : 0);
        return {
          confidence: score >= 5 ? "moderate" : "low",
          score,
          reason: /\b(breakup|divorce|job loss|recent loss|stress|moved|financial)\b/i.test(combinedNarrative) ? "Intake text describes an identifiable stressor with emotional impact." : "Adjustment disorder depends on clarifying the temporal link to a stressor.",
          suggestedSpecifier: /\b(anxious|worry|panic)\b/i.test(combinedNarrative) ? "With anxiety" : /\b(sad|depressed|hopeless)\b/i.test(combinedNarrative) ? "With depressed mood" : void 0
        };
      }
      case "adhd": {
        const inattentive = countStatuses(criteria, "adhd.A1.");
        const hyper = countStatuses(criteria, "adhd.A2.");
        const score = inattentive.positive + hyper.positive + (criteria.find((criterion2) => criterion2.criterionId === "adhd.B")?.status === "met" ? 2 : 0);
        let suggestedSpecifier;
        if (inattentive.positive >= 6 && hyper.positive >= 6) suggestedSpecifier = "Combined presentation";
        else if (inattentive.positive >= 6) suggestedSpecifier = "Predominantly inattentive presentation";
        else if (hyper.positive >= 6) suggestedSpecifier = "Predominantly hyperactive/impulsive presentation";
        return {
          confidence: (inattentive.positive >= 6 || hyper.positive >= 6) && score >= 8 ? "moderate" : "low",
          score,
          reason: score ? `${inattentive.positive} inattentive and ${hyper.positive} hyperactive/impulsive criteria have supporting narrative evidence.` : "ADHD remains a differential only if childhood onset and cross-setting symptoms are later confirmed.",
          suggestedSpecifier
        };
      }
      case "bipolar_i": {
        const maniaSymptoms = countStatuses(criteria, "bipolar_i.B.");
        const manicEpisode = criteria.find((criterion2) => criterion2.criterionId === "bipolar_i.A")?.status;
        const hospitalization = criteria.find((criterion2) => criterion2.criterionId === "bipolar_i.C")?.status;
        const familyBipolar = /\bbipolar\b/i.test(`${intake.familyPsychiatricHistory} ${intake.familyMentalEmotionalHistory}`);
        const score = maniaSymptoms.positive + (isPositive(manicEpisode ?? "not_assessed") ? 3 : 0) + (isPositive(hospitalization ?? "not_assessed") ? 2 : 0) + (familyBipolar ? 1 : 0);
        return {
          confidence: isPositive(manicEpisode ?? "not_assessed") && maniaSymptoms.positive >= 3 ? "moderate" : familyBipolar && (intake.phq9?.totalScore ?? 0) >= 10 ? "low" : "low",
          score,
          reason: score ? "Possible manic-spectrum history or family bipolar history warrants bipolar I review." : "No strong manic-spectrum evidence appears in the intake packet.",
          suggestedSpecifier: void 0
        };
      }
      case "bipolar_ii": {
        const familyBipolar = /\bbipolar\b/i.test(`${intake.familyPsychiatricHistory} ${intake.familyMentalEmotionalHistory}`);
        const score = positiveCount + (familyBipolar ? 1 : 0) + ((intake.phq9?.totalScore ?? 0) >= 10 ? 2 : 0);
        return {
          confidence: criteria.find((criterion2) => criterion2.criterionId === "bipolar_ii.A")?.status === "met" && criteria.find((criterion2) => criterion2.criterionId === "bipolar_ii.B")?.status === "met" ? "moderate" : familyBipolar && (intake.phq9?.totalScore ?? 0) >= 10 ? "low" : "low",
          score,
          reason: score ? "Depressive burden with possible hypomanic history or family bipolar history warrants bipolar II review." : "No strong bipolar II evidence appears in the intake packet.",
          suggestedSpecifier: void 0
        };
      }
      case "alcohol_use_disorder": {
        const score = positiveCount + (SUBSTANCE_POSITIVE_PATTERN.test(intake.alcoholUse) ? 2 : 0);
        return {
          confidence: positiveCount >= 4 ? "moderate" : positiveCount >= 2 ? "low" : "low",
          score,
          reason: intake.alcoholUse.trim() ? `Alcohol history suggests ${positiveCount} alcohol-use criteria may be present.` : "No meaningful alcohol-use narrative is present in the intake packet.",
          suggestedSpecifier: determineSubstanceSpecifier(criteria.filter((criterion2) => isPositive(criterion2.status)).length)
        };
      }
      case "cannabis_use_disorder": {
        const score = positiveCount + (SUBSTANCE_POSITIVE_PATTERN.test(intake.drugUse) || /\b(cannabis|marijuana|weed|thc)\b/i.test(intake.drugUse) ? 2 : 0);
        return {
          confidence: positiveCount >= 4 ? "moderate" : positiveCount >= 2 ? "low" : "low",
          score,
          reason: `${positiveCount} cannabis-use criteria have supporting narrative evidence.`,
          suggestedSpecifier: determineSubstanceSpecifier(criteria.filter((criterion2) => isPositive(criterion2.status)).length)
        };
      }
      case "borderline_personality_disorder": {
        const score = positiveCount + (/self-harm|cutting|abandonment|unstable relationship|empty|rage/i.test(combinedNarrative) ? 2 : 0);
        return {
          confidence: positiveCount >= 5 ? "moderate" : positiveCount >= 3 ? "low" : "low",
          score,
          reason: positiveCount ? `${positiveCount} borderline personality features have narrative support and warrant structured review.` : "No strong borderline personality feature cluster appears in the intake packet.",
          suggestedSpecifier: void 0
        };
      }
      default:
        return {
          confidence: determineConfidence(metCount * 2 + positiveCount),
          reason: `${positiveCount} criteria have narrative or assessment support.`,
          score: metCount * 2 + positiveCount,
          suggestedSpecifier: void 0
        };
    }
  }
  function getDiagnosticSuggestions(intake) {
    return DSM5_DISORDERS.map((disorder) => {
      const criteria = evaluateDisorder(disorder, intake);
      const scoring = scoreDisorder(disorder, intake, criteria);
      return {
        disorderId: disorder.id,
        disorderName: disorder.name,
        code: disorder.icd10Codes[0] ?? "",
        confidence: scoring.confidence,
        reason: scoring.reason,
        score: scoring.score,
        criteria,
        metCount: criteria.filter((criterion2) => criterion2.status === "met").length,
        likelyCount: criteria.filter((criterion2) => criterion2.status === "likely").length,
        unresolvedCount: criteria.filter((criterion2) => criterion2.status === "unclear" || criterion2.status === "not_assessed").length,
        requiredCount: summarizeRequirement(disorder, criteria),
        suggestedSpecifier: scoring.suggestedSpecifier,
        ruleOuts: disorder.ruleOuts
      };
    }).sort((a, b) => b.score - a.score || b.metCount - a.metCount || a.disorderName.localeCompare(b.disorderName));
  }
  function findSuggestion(suggestions, disorderId) {
    return suggestions.find((suggestion) => suggestion.disorderId === disorderId);
  }
  function getOverride(workspace, disorderId, criterionId) {
    return workspace?.overrides.find((override) => override.disorderId === disorderId && override.criterionId === criterionId);
  }
  function getEffectiveCriterionStatus(workspace, disorderId, evaluation) {
    return getOverride(workspace, disorderId, evaluation.criterionId)?.status ?? evaluation.status;
  }
  function getDisorderNotes(workspace, disorderId) {
    return workspace?.disorderNotes.find((entry) => entry.disorderId === disorderId)?.notes ?? "";
  }
  function buildCriteriaSummary(disorder, criteria, workspace) {
    if (disorder.requiredCounts.length === 0) {
      const met = criteria.filter((criterion2) => getEffectiveCriterionStatus(workspace, disorder.id, criterion2) === "met").length;
      const likely = criteria.filter((criterion2) => getEffectiveCriterionStatus(workspace, disorder.id, criterion2) === "likely").length;
      return [`${met} criteria marked met and ${likely} marked likely after clinician review.`];
    }
    return disorder.requiredCounts.map((requirement) => {
      const relevant = criteria.filter((criterion2) => criterion2.criterionId.startsWith(`${disorder.id}.${requirement.criterion}`) || criterion2.criterionId.startsWith(requirement.criterion));
      const positive = relevant.filter((criterion2) => isPositive(getEffectiveCriterionStatus(workspace, disorder.id, criterion2))).length;
      const mustIncludeMet = requirement.mustInclude ? requirement.mustInclude.some((criterionId) => isPositive(getEffectiveCriterionStatus(workspace, disorder.id, criteria.find((criterion2) => criterion2.criterionId === criterionId) ?? {
        criterionId,
        status: "not_assessed",
        evidence: [],
        sources: [],
        rationale: "",
        followUpQuestion: ""
      }))) : true;
      return `${requirement.criterion}: ${positive}/${requirement.total} met or likely${requirement.mustInclude ? `; core requirement ${mustIncludeMet ? "present" : "not yet confirmed"}` : ""}.`;
    });
  }
  function buildEvidenceSummary(disorderId, criteria, workspace) {
    return criteria.filter((criterion2) => isPositive(getEffectiveCriterionStatus(workspace, disorderId, criterion2))).slice(0, 6).map((criterion2) => {
      const detail = criterion2.evidence[0] ?? criterion2.rationale;
      return `${criterion2.criterionId}: ${detail}`;
    });
  }
  function buildDiagnosticImpressions(intake, suggestions, workspace) {
    const selectedIds = workspace?.pinnedDisorderIds.length ? workspace.pinnedDisorderIds : workspace?.activeDisorderId ? [workspace.activeDisorderId] : [];
    if (!selectedIds.length) return [];
    return selectedIds.map((disorderId) => {
      const suggestion = findSuggestion(suggestions, disorderId);
      const disorder = DSM5_DISORDER_MAP[disorderId];
      if (!suggestion || !disorder) return null;
      const name = suggestion.suggestedSpecifier ? `${suggestion.disorderName} \u2014 ${suggestion.suggestedSpecifier}` : suggestion.disorderName;
      return {
        disorderId,
        code: suggestion.code,
        name,
        confidence: suggestion.confidence,
        criteriaEvidence: buildEvidenceSummary(disorderId, suggestion.criteria, workspace),
        criteriaSummary: buildCriteriaSummary(disorder, suggestion.criteria, workspace),
        ruleOuts: suggestion.ruleOuts,
        clinicianNotes: getDisorderNotes(workspace, disorderId) || void 0
      };
    }).filter((impression) => impression !== null);
  }
  function getAvailableDiagnosisOptions(workspace) {
    const pinned = new Set(workspace?.pinnedDisorderIds ?? []);
    return DSM5_DISORDERS.filter((disorder) => !pinned.has(disorder.id));
  }

  // src/lib/clinical-knowledge.ts
  var INDEX_PATH = "assets/clinical-knowledge/index.json";
  var indexCache = {};
  function normalizeTerm(term) {
    return term.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
  }
  function tokenize(query) {
    return normalizeTerm(query).split(" ").filter((term) => term.length >= 3);
  }
  async function loadJson(path) {
    const url = chrome.runtime.getURL(path);
    const resp = await fetch(url, { cache: "no-store" });
    if (!resp.ok) {
      throw new Error(`Failed to load ${path}: ${resp.status}`);
    }
    return resp.json();
  }
  function loadClinicalKnowledgeIndex() {
    indexCache.promise ??= loadJson(INDEX_PATH);
    return indexCache.promise;
  }
  function scoreChunk(tokens, chunk) {
    if (!tokens.length) return 0;
    const haystack = normalizeTerm(
      [chunk.heading, chunk.preview, chunk.tags.join(" "), chunk.text.slice(0, 1500)].join(" ")
    );
    let score = 0;
    for (const token of tokens) {
      if (!haystack.includes(token)) continue;
      score += 1;
      if (chunk.heading && normalizeTerm(chunk.heading).includes(token)) score += 2;
      if (chunk.tags.some((tag) => normalizeTerm(tag).includes(token))) score += 2;
      if (normalizeTerm(chunk.preview).includes(token)) score += 1;
    }
    return score;
  }
  function scoreIndexEntry(tokens, entry) {
    const chunkScore = scoreChunk(tokens, { ...entry.chunk, text: "" });
    const resourceHaystack = normalizeTerm(
      `${entry.resourceTitle} ${entry.resourceModality}`
    );
    let score = chunkScore;
    for (const token of tokens) {
      if (resourceHaystack.includes(token)) score += 2;
    }
    return score;
  }
  async function searchClinicalKnowledge(query, options = {}) {
    const index = await loadClinicalKnowledgeIndex();
    const tokens = tokenize(query);
    if (!tokens.length) return [];
    const resourceIds = options.resourceIds?.length ? options.resourceIds : null;
    const results = [];
    for (const entry of index.entries) {
      if (resourceIds && !resourceIds.includes(entry.resourceId)) continue;
      const chunk = { ...entry.chunk, text: "" };
      const score = scoreIndexEntry(tokens, entry);
      if (score <= 0) continue;
      results.push({
        resourceId: entry.resourceId,
        resourceTitle: entry.resourceTitle,
        chunk,
        score
      });
    }
    return results.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.chunk.pageStart - b.chunk.pageStart;
    }).slice(0, options.limit ?? 8);
  }

  // src/lib/clinical-guidance.ts
  var guidanceCache = /* @__PURE__ */ new Map();
  var RESOURCE_IDS = {
    caseFormulationCbt: "case-formulation-approach-cbt",
    behavioralCbt: "behavioral-interventions-cbt-2e",
    dbtAdult: "dbt-skills-training-handouts-worksheets-2e",
    dbtAdolescent: "dbt-skills-manual-adolescents",
    mi: "motivational-interviewing-helping-people-change-and-grow",
    psychoanalytic: "psychoanalytic-case-formulation",
    pdm: "psychodynamic-diagnostic-manual-pdm-3",
    asam: "asam-principles-of-addiction-medicine-7e"
  };
  function normalizeText2(value) {
    return value.toLowerCase().replace(/\s+/g, " ").trim();
  }
  function clip(value, max = 120) {
    const normalized = value.replace(/\s+/g, " ").trim();
    if (normalized.length <= max) return normalized;
    return `${normalized.slice(0, max - 1).trimEnd()}...`;
  }
  function firstNonEmpty(...values) {
    for (const value of values) {
      const trimmed = value?.trim();
      if (trimmed) return trimmed;
    }
    return "";
  }
  function joinList(items) {
    if (items.length === 0) return "";
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
  }
  function unique(items) {
    return Array.from(
      new Set(
        items.map((item) => item.trim()).filter(Boolean)
      )
    );
  }
  function splitGoals(raw) {
    return unique(
      raw.split(/\n|;|•/).map((part) => part.trim().replace(/^[\d\-*,.\s]+/, "")).filter(Boolean)
    );
  }
  function parseAge(dob) {
    if (!dob.trim()) return null;
    const date = new Date(dob);
    if (Number.isNaN(date.getTime())) return null;
    const now = /* @__PURE__ */ new Date();
    let age = now.getFullYear() - date.getFullYear();
    const birthdayPassed = now.getMonth() > date.getMonth() || now.getMonth() === date.getMonth() && now.getDate() >= date.getDate();
    if (!birthdayPassed) age -= 1;
    return age >= 0 ? age : null;
  }
  function hasAny(text, patterns) {
    return patterns.some((pattern) => pattern.test(text));
  }
  function pickFactors(values, max = 3) {
    return values.map((value) => clip(value ?? "")).filter(Boolean).slice(0, max);
  }
  function buildProfile(intake, diagnosticImpressions) {
    const diagnosisText = normalizeText2(
      diagnosticImpressions.map((impression) => `${impression.name} ${impression.disorderId}`).join(" ")
    );
    const narrativeText = normalizeText2(
      [
        intake.chiefComplaint,
        intake.presentingProblems,
        intake.historyOfPresentIllness,
        intake.recentSymptoms,
        intake.additionalSymptoms,
        intake.additionalInfo,
        intake.manualNotes,
        intake.suicidalIdeation,
        intake.suicideAttemptHistory,
        intake.alcoholUse,
        intake.drugUse,
        intake.substanceUseHistory,
        intake.physicalSexualAbuseHistory,
        intake.domesticViolenceHistory,
        intake.troubleSleeping,
        intake.relationshipDescription
      ].join(" ")
    );
    const age = parseAge(intake.dob);
    const hasDepression = /depress|mdd|persistent depressive/.test(diagnosisText) || /depress|hopeless|sad|anhedonia|low mood/.test(narrativeText) || (intake.phq9?.totalScore ?? 0) >= 10;
    const hasAnxiety = /anxiety|gad|panic|ocd|ptsd|stress/.test(diagnosisText) || /anxious|worry|panic|obsess|compuls|on edge|stress/.test(narrativeText) || (intake.gad7?.totalScore ?? 0) >= 10;
    const hasTrauma = /ptsd|acute stress|trauma/.test(diagnosisText) || hasAny(narrativeText, [/trauma/, /abuse/, /assault/, /violence/, /sexual assault/]);
    const hasSubstance = /alcohol|cannabis|substance|addict|opioid|use disorder/.test(diagnosisText) || hasAny(narrativeText, [/alcohol/, /drug/, /substance/, /cannabis/, /opioid/, /craving/, /withdrawal/]);
    const hasPersonality = /personality|borderline|narciss|avoidant|dependent|ocpd|antisocial/.test(diagnosisText);
    const hasSelfHarmRisk = hasAny(narrativeText, [/suicid/, /self-harm/, /cutting/, /overdose/]) || /borderline/.test(diagnosisText);
    const hasEmotionDysregulation = hasSelfHarmRisk || /emotion regulation|mood swings|labile|anger|impulsive/.test(narrativeText);
    const hasInterpersonalStrain = hasAny(narrativeText, [/relationship/, /conflict/, /attachment/, /interpersonal/]);
    const hasSleepIssue = /sleep|insomnia|hypersomnia/.test(normalizeText2(`${intake.troubleSleeping} ${intake.additionalSymptoms}`));
    const severeSymptoms = (intake.phq9?.totalScore ?? 0) >= 15 || (intake.gad7?.totalScore ?? 0) >= 15;
    const needsMedicalCoordination = Boolean(
      intake.primaryCarePhysician.trim() || intake.prescribingMD.trim() || intake.medications.trim()
    );
    return {
      diagnoses: unique(diagnosticImpressions.map((impression) => impression.name)).slice(0, 3),
      primaryConcern: clip(
        firstNonEmpty(
          intake.chiefComplaint,
          intake.presentingProblems,
          intake.historyOfPresentIllness,
          intake.manualNotes,
          intake.additionalSymptoms
        ),
        150
      ),
      patientGoals: splitGoals(intake.counselingGoals).slice(0, 3),
      predisposingFactors: unique([
        ...pickFactors([intake.familyPsychiatricHistory, intake.familyMentalEmotionalHistory], 2),
        ...pickFactors([intake.physicalSexualAbuseHistory, intake.domesticViolenceHistory], 1),
        ...pickFactors([intake.developmentalHistory, intake.medicalHistory], 1)
      ]).slice(0, 4),
      precipitatingFactors: unique([
        ...pickFactors([intake.chiefComplaint, intake.presentingProblems, intake.historyOfPresentIllness], 2),
        ...pickFactors([intake.recentSymptoms, intake.additionalSymptoms], 1)
      ]).slice(0, 4),
      perpetuatingFactors: unique([
        ...pickFactors([intake.troubleSleeping], 1),
        ...pickFactors([intake.alcoholUse, intake.drugUse, intake.substanceUseHistory], 1),
        ...pickFactors([intake.relationshipDescription, intake.occupation], 1),
        ...pickFactors([
          intake.phq9?.difficulty ? `Depression-related impairment: ${intake.phq9.difficulty}` : "",
          intake.gad7?.difficulty ? `Anxiety-related impairment: ${intake.gad7.difficulty}` : ""
        ], 1)
      ]).slice(0, 4),
      protectiveFactors: unique([
        ...pickFactors([intake.counselingGoals ? `Stated treatment goals: ${intake.counselingGoals}` : ""], 1),
        ...pickFactors([intake.livingArrangement, intake.relationshipDescription], 1),
        ...pickFactors([intake.priorTreatment ? `Prior treatment engagement: ${intake.priorTreatment}` : ""], 1),
        ...pickFactors([
          needsMedicalCoordination ? `Existing medical contacts: ${firstNonEmpty(intake.primaryCarePhysician, intake.prescribingMD, intake.medications)}` : ""
        ], 1)
      ]).slice(0, 4),
      severeSymptoms,
      hasDepression,
      hasAnxiety,
      hasTrauma,
      hasSubstance,
      hasPersonality,
      hasSelfHarmRisk,
      hasEmotionDysregulation,
      hasInterpersonalStrain,
      hasSleepIssue,
      hasAdolescentPresentation: age !== null && age <= 19,
      needsMedicalCoordination
    };
  }
  function selectResourceIds(profile) {
    const ids = /* @__PURE__ */ new Set([
      RESOURCE_IDS.caseFormulationCbt,
      RESOURCE_IDS.behavioralCbt
    ]);
    if (profile.hasEmotionDysregulation || profile.hasSelfHarmRisk || profile.hasAdolescentPresentation) {
      ids.add(RESOURCE_IDS.dbtAdult);
      ids.add(RESOURCE_IDS.dbtAdolescent);
    }
    if (profile.hasSubstance) {
      ids.add(RESOURCE_IDS.mi);
      ids.add(RESOURCE_IDS.asam);
    }
    if (profile.hasPersonality || profile.hasTrauma || profile.hasInterpersonalStrain) {
      ids.add(RESOURCE_IDS.psychoanalytic);
      ids.add(RESOURCE_IDS.pdm);
    }
    return Array.from(ids);
  }
  function buildQueries(profile) {
    const diagnosisClause = profile.diagnoses.length ? profile.diagnoses.join(" ") : [profile.hasDepression ? "depression" : "", profile.hasAnxiety ? "anxiety" : "", profile.hasSubstance ? "substance use" : ""].filter(Boolean).join(" ");
    const queries = unique([
      `case formulation ${diagnosisClause} ${profile.primaryConcern}`.trim(),
      `treatment plan interventions ${diagnosisClause} ${profile.patientGoals.join(" ")}`.trim(),
      profile.hasSubstance ? "motivational interviewing relapse prevention ambivalence substance use" : "",
      profile.hasEmotionDysregulation || profile.hasSelfHarmRisk ? "dbt distress tolerance emotion regulation chain analysis safety planning" : "",
      profile.hasTrauma || profile.hasPersonality || profile.hasInterpersonalStrain ? "psychodynamic formulation attachment personality functioning relationship patterns" : ""
    ]);
    return queries.slice(0, 5);
  }
  function dedupeReferences(results) {
    const seen = /* @__PURE__ */ new Set();
    const references = [];
    for (const result of results) {
      const key = `${result.resourceId}:${result.chunk.pageStart}`;
      if (seen.has(key)) continue;
      seen.add(key);
      references.push({
        resourceId: result.resourceId,
        resourceTitle: result.resourceTitle,
        pageStart: result.chunk.pageStart,
        heading: result.chunk.heading,
        preview: result.chunk.preview,
        score: result.score
      });
      if (references.length >= 6) break;
    }
    return references;
  }
  function recommendModalities(profile) {
    const modalities = ["CBT case formulation"];
    if (profile.hasDepression || profile.hasAnxiety) {
      modalities.push("Behavioral CBT");
    }
    if (profile.hasEmotionDysregulation || profile.hasSelfHarmRisk || profile.hasAdolescentPresentation) {
      modalities.push("DBT skills");
    }
    if (profile.hasSubstance) {
      modalities.push("Motivational interviewing");
      modalities.push("ASAM-informed addiction planning");
    }
    if (profile.hasPersonality || profile.hasTrauma || profile.hasInterpersonalStrain) {
      modalities.push("Psychodynamic formulation");
    }
    return unique(modalities).slice(0, 4);
  }
  function buildFormulation(profile, modalities) {
    const sentences = [];
    if (profile.diagnoses.length) {
      sentences.push(`Working diagnostic focus currently centers on ${joinList(profile.diagnoses)}.`);
    } else if (profile.primaryConcern) {
      sentences.push(`Current presentation is organized around ${profile.primaryConcern.replace(/[.]+$/, "")}.`);
    }
    if (profile.predisposingFactors.length) {
      sentences.push(`Predisposing factors include ${joinList(profile.predisposingFactors)}.`);
    }
    if (profile.precipitatingFactors.length) {
      sentences.push(`Precipitating factors include ${joinList(profile.precipitatingFactors)}.`);
    }
    if (profile.perpetuatingFactors.length) {
      sentences.push(`Perpetuating factors likely include ${joinList(profile.perpetuatingFactors)}.`);
    }
    if (profile.protectiveFactors.length) {
      sentences.push(`Protective factors include ${joinList(profile.protectiveFactors)}.`);
    } else {
      sentences.push("Protective factors need direct clarification during follow-up.");
    }
    sentences.push(`Initial formulation and treatment planning are best anchored in ${joinList(modalities)}.`);
    return sentences.join(" ");
  }
  function buildGoals(profile) {
    const goals = [...profile.patientGoals];
    if (!goals.length) {
      goals.push("Clarify the symptom pattern and improve day-to-day functioning.");
    }
    if (profile.hasDepression || profile.hasAnxiety) {
      goals.push("Reduce mood and anxiety symptom burden while restoring routine functioning.");
    }
    if (profile.hasSelfHarmRisk || profile.hasEmotionDysregulation) {
      goals.push("Increase safety, distress tolerance, and use of non-harm coping responses.");
    }
    if (profile.hasTrauma) {
      goals.push("Strengthen grounding, stabilization, and trauma-informed coping.");
    }
    if (profile.hasSubstance) {
      goals.push("Reduce substance-related harm and strengthen relapse-prevention planning.");
    }
    if (profile.hasInterpersonalStrain || profile.hasPersonality) {
      goals.push("Improve interpersonal stability and reflective capacity in relationships.");
    }
    return unique(goals).slice(0, 5);
  }
  function buildInterventions(profile) {
    const interventions = [
      "Complete diagnostic clarification, timeline review, and measurement-based monitoring at follow-up visits."
    ];
    if (profile.hasDepression) {
      interventions.push("Use behavioral activation and routine-building to increase reinforcement and daily structure.");
    }
    if (profile.hasAnxiety) {
      interventions.push("Use CBT skills to target worry, avoidance, and graduated behavioral practice.");
    }
    if (profile.hasEmotionDysregulation || profile.hasSelfHarmRisk) {
      interventions.push("Teach DBT distress-tolerance and emotion-regulation skills, and use chain analysis for high-risk behaviors.");
    }
    if (profile.hasSubstance) {
      interventions.push("Use motivational interviewing to explore ambivalence, strengthen change talk, and build relapse-prevention steps.");
      interventions.push("Review ASAM-informed level-of-care, withdrawal-risk, and recovery-support needs.");
    }
    if (profile.hasTrauma) {
      interventions.push("Prioritize stabilization, grounding, and pacing before deeper trauma processing.");
    }
    if (profile.hasPersonality || profile.hasInterpersonalStrain) {
      interventions.push("Track recurrent relational patterns, attachment themes, and therapy-interfering behaviors in treatment.");
    }
    if (profile.hasSleepIssue) {
      interventions.push("Address sleep disruption with behavioral sleep-routine interventions and symptom monitoring.");
    }
    return unique(interventions).slice(0, 6);
  }
  function buildFrequency(profile) {
    if (profile.hasSelfHarmRisk || profile.hasSubstance || profile.severeSymptoms) {
      return "Recommend weekly psychotherapy initially, with higher-contact follow-up or higher level of care if risk, withdrawal, or impairment escalates.";
    }
    return "Recommend weekly psychotherapy initially, then adjust frequency based on symptom change and functional improvement.";
  }
  function buildReferrals(intake, profile) {
    const referrals = [];
    if (profile.needsMedicalCoordination) {
      const medicalContact = firstNonEmpty(intake.primaryCarePhysician, intake.prescribingMD);
      referrals.push(
        medicalContact ? `Coordinate with existing medical prescriber/PCP: ${medicalContact}.` : "Coordinate with PCP and any current prescriber as clinically indicated."
      );
    }
    if (profile.hasSubstance) {
      referrals.push("Consider SUD specialty services, medication evaluation, or higher level of care if withdrawal risk or relapse severity warrants.");
    }
    if (profile.hasSelfHarmRisk) {
      referrals.push("Escalate to crisis resources, safety planning, or higher level of care if suicidal risk increases.");
    }
    return referrals.join(" ");
  }
  function buildPlan(profile) {
    const steps = [
      "review the diagnostic timeline and current impairment",
      profile.hasSelfHarmRisk ? "update safety planning" : "",
      profile.hasSubstance ? "assess motivation, use pattern, and relapse risk" : "",
      profile.hasEmotionDysregulation ? "introduce one concrete DBT coping skill for between-session use" : "",
      profile.hasDepression || profile.hasAnxiety ? "assign one behavioral practice or symptom-monitoring task" : "",
      "finalize measurable treatment goals"
    ].filter(Boolean);
    return `Next session: ${steps.join(", ")}.`;
  }
  async function computeGuidance(intake, diagnosticImpressions) {
    const profile = buildProfile(intake, diagnosticImpressions);
    const resourceIds = selectResourceIds(profile);
    const queries = buildQueries(profile);
    const searchResults = (await Promise.all(
      queries.map(
        (query) => searchClinicalKnowledge(query, {
          limit: 4,
          resourceIds
        })
      )
    )).flat().sort((a, b) => b.score - a.score);
    const modalities = recommendModalities(profile);
    return {
      modalities,
      formulation: buildFormulation(profile, modalities),
      goals: buildGoals(profile),
      interventions: buildInterventions(profile),
      frequency: buildFrequency(profile),
      referrals: buildReferrals(intake, profile),
      plan: buildPlan(profile),
      references: dedupeReferences(searchResults),
      queries
    };
  }
  function buildCacheKey(intake, diagnosticImpressions) {
    return JSON.stringify({
      clientId: intake.clientId,
      capturedAt: intake.capturedAt,
      chiefComplaint: intake.chiefComplaint,
      presentingProblems: intake.presentingProblems,
      counselingGoals: intake.counselingGoals,
      manualNotes: intake.manualNotes,
      phq9: intake.phq9?.totalScore ?? null,
      gad7: intake.gad7?.totalScore ?? null,
      diagnoses: diagnosticImpressions.map((impression) => `${impression.disorderId}:${impression.name}`)
    });
  }
  async function buildClinicalGuidance(intake, diagnosticImpressions = []) {
    const key = buildCacheKey(intake, diagnosticImpressions);
    if (!guidanceCache.has(key)) {
      guidanceCache.set(key, computeGuidance(intake, diagnosticImpressions));
    }
    return guidanceCache.get(key);
  }

  // src/lib/types.ts
  var EMPTY_INTAKE = {
    fullName: "",
    firstName: "",
    lastName: "",
    sex: "",
    genderIdentity: "",
    dob: "",
    phone: "",
    email: "",
    address: { street: "", city: "", state: "", zip: "", country: "", raw: "" },
    race: "",
    ethnicity: "",
    emergencyContact: "",
    insuranceCompany: "",
    memberId: "",
    groupNumber: "",
    chiefComplaint: "",
    counselingGoals: "",
    presentingProblems: "",
    historyOfPresentIllness: "",
    priorTreatment: "",
    medications: "",
    prescribingMD: "",
    primaryCarePhysician: "",
    medicalHistory: "",
    allergies: "",
    surgeries: "",
    troubleSleeping: "",
    developmentalHistory: "",
    tbiLoc: "",
    suicidalIdeation: "",
    suicideAttemptHistory: "",
    homicidalIdeation: "",
    psychiatricHospitalization: "",
    alcoholUse: "",
    drugUse: "",
    substanceUseHistory: "",
    familyPsychiatricHistory: "",
    familyMentalEmotionalHistory: "",
    maritalStatus: "",
    relationshipDescription: "",
    livingArrangement: "",
    education: "",
    occupation: "",
    physicalSexualAbuseHistory: "",
    domesticViolenceHistory: "",
    gad7: null,
    phq9: null,
    recentSymptoms: "",
    additionalSymptoms: "",
    additionalInfo: "",
    manualNotes: "",
    formTitle: "",
    formDate: "",
    signedBy: "",
    signedAt: "",
    rawQA: [],
    capturedAt: "",
    clientId: ""
  };
  var DEFAULT_NOTE_STATUS = {
    intakeCaptured: false,
    noteGenerated: false,
    noteReviewed: false,
    noteSubmitted: false
  };
  var EMPTY_PROGRESS_NOTE = {
    clientName: "",
    sessionDate: "",
    sessionType: "",
    cptCode: "",
    duration: "",
    chiefComplaint: "",
    presentingComplaint: "",
    mentalStatusExam: {
      appearance: "",
      behavior: "",
      speech: "",
      mood: "",
      affect: "",
      thoughtProcess: "",
      thoughtContent: "",
      perceptions: "",
      cognition: "",
      insight: "",
      judgment: ""
    },
    diagnosticImpressions: [],
    clinicalFormulation: "",
    treatmentPlan: {
      goals: [],
      interventions: [],
      frequency: "",
      referrals: ""
    },
    plan: "",
    generatedAt: "",
    status: { ...DEFAULT_NOTE_STATUS }
  };
  var EMPTY_DIAGNOSTIC_WORKSPACE = {
    pinnedDisorderIds: [],
    activeDisorderId: null,
    overrides: [],
    disorderNotes: [],
    finalizedImpressions: [],
    updatedAt: ""
  };
  var DEFAULT_PREFERENCES = {
    providerFirstName: "Anders",
    providerLastName: "Chan",
    defaultLocation: "Video Office",
    firstVisitCPT: "90791",
    followUpCPT: "90837"
  };

  // src/lib/note-draft.ts
  function firstNonEmpty2(...values) {
    for (const value of values) {
      const trimmed = value?.trim();
      if (trimmed) return trimmed;
    }
    return "";
  }
  function splitGoals2(raw) {
    return raw.split(/\n|;|•/).map((part) => part.trim().replace(/^[\d\-*,.\s]+/, "")).filter(Boolean);
  }
  function summarizeAssessments(intake) {
    const parts = [];
    if (intake.phq9) {
      parts.push(`PHQ-9 ${intake.phq9.totalScore}/27 (${intake.phq9.severity || "severity not parsed"})`);
    }
    if (intake.gad7) {
      parts.push(`GAD-7 ${intake.gad7.totalScore}/21 (${intake.gad7.severity || "severity not parsed"})`);
    }
    return parts;
  }
  function summarizeRisk(intake) {
    const parts = [];
    if (intake.suicidalIdeation.trim()) parts.push(`SI: ${intake.suicidalIdeation.trim()}`);
    if (intake.homicidalIdeation.trim()) parts.push(`HI: ${intake.homicidalIdeation.trim()}`);
    if (intake.suicideAttemptHistory.trim()) parts.push(`Suicide attempt history: ${intake.suicideAttemptHistory.trim()}`);
    if (intake.psychiatricHospitalization.trim()) parts.push(`Psych hospitalization: ${intake.psychiatricHospitalization.trim()}`);
    return parts;
  }
  function buildPresentingComplaint(intake) {
    const sections = [
      firstNonEmpty2(intake.chiefComplaint, intake.presentingProblems),
      intake.historyOfPresentIllness.trim(),
      intake.manualNotes.trim(),
      intake.additionalSymptoms.trim(),
      intake.recentSymptoms.trim()
    ].filter(Boolean);
    const assessmentSummary = summarizeAssessments(intake);
    if (assessmentSummary.length) {
      sections.push(`Screening results: ${assessmentSummary.join("; ")}.`);
    }
    return sections.join("\n\n");
  }
  function buildFallbackClinicalFormulation(intake) {
    const parts = [];
    const chiefComplaint = firstNonEmpty2(
      intake.chiefComplaint,
      intake.presentingProblems,
      intake.historyOfPresentIllness,
      intake.manualNotes
    );
    if (chiefComplaint) {
      parts.push(`Patient presents for intake reporting ${chiefComplaint.replace(/[.]+$/, "")}.`);
    }
    const history = [];
    if (intake.priorTreatment.trim()) history.push(`prior treatment: ${intake.priorTreatment.trim()}`);
    if (intake.medications.trim()) history.push(`medications: ${intake.medications.trim()}`);
    if (intake.medicalHistory.trim()) history.push(`medical history: ${intake.medicalHistory.trim()}`);
    if (intake.familyPsychiatricHistory.trim()) history.push(`family psychiatric history: ${intake.familyPsychiatricHistory.trim()}`);
    if (intake.physicalSexualAbuseHistory.trim()) history.push(`trauma history: ${intake.physicalSexualAbuseHistory.trim()}`);
    if (intake.domesticViolenceHistory.trim()) history.push(`domestic violence history: ${intake.domesticViolenceHistory.trim()}`);
    if (history.length) {
      parts.push(`Relevant history includes ${history.join("; ")}.`);
    }
    const riskSummary = summarizeRisk(intake);
    if (riskSummary.length) {
      parts.push(`Risk-related intake responses: ${riskSummary.join("; ")}.`);
    }
    const contextualFactors = [];
    if (intake.livingArrangement.trim()) contextualFactors.push(`living situation: ${intake.livingArrangement.trim()}`);
    if (intake.relationshipDescription.trim()) contextualFactors.push(`relationship context: ${intake.relationshipDescription.trim()}`);
    if (intake.occupation.trim()) contextualFactors.push(`occupation: ${intake.occupation.trim()}`);
    if (intake.counselingGoals.trim()) contextualFactors.push(`treatment goals: ${intake.counselingGoals.trim()}`);
    if (contextualFactors.length) {
      parts.push(`Contextual factors include ${contextualFactors.join("; ")}.`);
    }
    return parts.join(" ");
  }
  function buildInterventions2(intake) {
    const interventions = [
      "Complete diagnostic assessment and clarify symptom timeline.",
      "Review risk, protective factors, and prior treatment response."
    ];
    if (intake.phq9) {
      interventions.push("Track depressive symptoms with PHQ-9 over follow-up visits.");
    }
    if (intake.gad7) {
      interventions.push("Track anxiety symptoms with GAD-7 over follow-up visits.");
    }
    if (intake.counselingGoals.trim()) {
      interventions.push("Align treatment planning with the patient-stated counseling goals.");
    }
    return interventions;
  }
  async function buildDraftNote(intake, prefs, diagnosticImpressions = []) {
    const clientName = firstNonEmpty2(
      intake.fullName,
      `${intake.firstName} ${intake.lastName}`.trim()
    );
    const goals = splitGoals2(intake.counselingGoals);
    const sessionDate = firstNonEmpty2(
      intake.formDate,
      intake.capturedAt ? new Date(intake.capturedAt).toLocaleDateString("en-US") : ""
    );
    const guidance = await buildClinicalGuidance(intake, diagnosticImpressions);
    const mergedGoals = Array.from(
      /* @__PURE__ */ new Set([
        ...goals.length ? goals : ["Clarify presenting concerns and establish treatment goals."],
        ...guidance.goals
      ])
    ).slice(0, 5);
    const mergedInterventions = Array.from(
      /* @__PURE__ */ new Set([
        ...buildInterventions2(intake),
        ...guidance.interventions
      ])
    ).slice(0, 6);
    return {
      ...EMPTY_PROGRESS_NOTE,
      clientName,
      sessionDate,
      sessionType: "Initial Clinical Evaluation",
      cptCode: prefs.firstVisitCPT,
      chiefComplaint: firstNonEmpty2(
        intake.chiefComplaint,
        intake.presentingProblems,
        intake.historyOfPresentIllness,
        intake.manualNotes
      ),
      presentingComplaint: buildPresentingComplaint(intake),
      diagnosticImpressions,
      clinicalFormulation: guidance.formulation || buildFallbackClinicalFormulation(intake),
      treatmentPlan: {
        goals: mergedGoals,
        interventions: mergedInterventions,
        frequency: guidance.frequency || "To be determined after intake evaluation.",
        referrals: guidance.referrals || (intake.primaryCarePhysician.trim() ? `Coordinate with PCP as needed: ${intake.primaryCarePhysician.trim()}.` : "")
      },
      plan: guidance.plan || "Complete the intake evaluation, finalize diagnostic impressions, and establish the initial treatment plan.",
      generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      status: {
        intakeCaptured: true,
        noteGenerated: true,
        noteReviewed: false,
        noteSubmitted: false
      }
    };
  }

  // src/lib/intake-augmentation.ts
  var OCCUPATION_PATTERN = /\b(software engineer|engineer|developer|teacher|student|manager|analyst|nurse|doctor|physician|therapist|consultant|designer|lawyer|attorney|accountant|entrepreneur|founder|product manager|project manager)\b/i;
  function normalizeWhitespace(value) {
    return value.replace(/\s+/g, " ").trim();
  }
  function splitLines(notes) {
    return notes.split(/\n+/).map((line) => normalizeWhitespace(line)).filter(Boolean);
  }
  function unique2(values) {
    const seen = /* @__PURE__ */ new Set();
    const output = [];
    for (const value of values) {
      const key = value.toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      output.push(value);
    }
    return output;
  }
  function collectMatchingLines(lines, pattern, limit = 4) {
    return unique2(lines.filter((line) => pattern.test(line))).slice(0, limit);
  }
  function joinLines(lines) {
    return unique2(lines).join("\n");
  }
  function extractHeaderName(lines) {
    for (const line of lines.slice(0, 4)) {
      const match = line.match(/^(?:\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})$/);
      if (!match) continue;
      const fullName = match[1].trim();
      const [firstName, ...rest] = fullName.split(/\s+/);
      return {
        fullName,
        firstName,
        lastName: rest.join(" ")
      };
    }
    return {};
  }
  function extractSex(notes) {
    const match = notes.match(/\b(?:\d{1,2}\s*(?:yo|year old)[-\s]*)?(male|female|man|woman)\b/i);
    if (!match) return {};
    const normalized = /female|woman/i.test(match[1]) ? "female" : "male";
    return {
      sex: normalized,
      genderIdentity: normalized
    };
  }
  function extractOccupation(lines) {
    const lineMatch = lines.find((line) => OCCUPATION_PATTERN.test(line));
    if (!lineMatch) return {};
    const phraseMatch = lineMatch.match(OCCUPATION_PATTERN);
    const occupation = normalizeWhitespace(phraseMatch?.[1] ?? lineMatch).replace(/[.]+$/, "");
    return occupation ? { occupation } : {};
  }
  function extractSurgeries(lines) {
    const surgeries = joinLines(
      collectMatchingLines(lines, /\b(surger(?:y|ies)|acl|labrum|meniscus|rotator cuff)\b/i, 3)
    );
    return surgeries ? { surgeries } : {};
  }
  function extractMedicalHistory(lines) {
    const medicalHistory = joinLines(
      collectMatchingLines(
        lines,
        /\b(ankle|snowboard|foot|walk|pain|injur|stomach|nausea|queasy|abdominal|head|foggy|fogginess|acl|labrum)\b/i,
        6
      )
    );
    return medicalHistory ? { medicalHistory } : {};
  }
  function extractSleep(lines) {
    const troubleSleeping = joinLines(
      collectMatchingLines(lines, /\b(insomnia|trouble falling asleep|hard to fall asleep|sleep disturbance|sleep was fine|nightmares?)\b/i, 4)
    );
    return troubleSleeping ? { troubleSleeping } : {};
  }
  function extractTbi(lines) {
    const tbiLoc = joinLines(
      collectMatchingLines(lines, /\b(head|loc|loss of consciousness|concussion|conscious the whole time|didn.?t hit head|foggy|fogginess)\b/i, 4)
    );
    return tbiLoc ? { tbiLoc } : {};
  }
  function extractPriorTreatment(lines) {
    const priorTreatment = joinLines(
      collectMatchingLines(lines, /\b(took med|medication|therap|coaching|2018)\b/i, 4)
    );
    return priorTreatment ? { priorTreatment } : {};
  }
  function extractCounselingGoals(lines) {
    const counselingGoals = joinLines(
      collectMatchingLines(lines, /\b(want to|want better|meet regularly|more actionable|cope|cbt|dynamic|act)\b/i, 6)
    );
    return counselingGoals ? { counselingGoals } : {};
  }
  function extractRecentSymptoms(lines) {
    const recentSymptoms = joinLines(
      collectMatchingLines(
        lines,
        /\b(anxious|anxiety|insomnia|stomach pain|queasy|nausea|flashback|dissociation|foggy|fogginess|trouble concentrating|sleep disturbance|hopelessness|shock)\b/i,
        8
      )
    );
    return recentSymptoms ? { recentSymptoms } : {};
  }
  function extractChiefComplaint(notes) {
    const parts = [];
    if (/\b(plane|airplane|flight).*(crash|accident)|hit fire truck|emergency exit\b/i.test(notes)) {
      parts.push("Trauma-related anxiety after airplane accident");
    } else if (/\b(accident|trauma)\b/i.test(notes)) {
      parts.push("Trauma-related symptoms after recent accident");
    }
    if (/\b(anxiety|anxious|overwhelmed|uneasiness|worry)\b/i.test(notes)) {
      parts.push("Anxiety and excessive worry");
    }
    if (/\b(insomnia|trouble falling asleep|sleep disturbance)\b/i.test(notes)) {
      parts.push("Sleep disturbance");
    }
    if (/\b(nausea|queasy|stomach pain|abdominal)\b/i.test(notes)) {
      parts.push("Nausea and stomach discomfort");
    }
    if (/\b(dissociation|foggy|fogginess|trouble concentrating|concentrating)\b/i.test(notes)) {
      parts.push("Concentration problems and fogginess");
    }
    if (/\b(hopelessness|hopeless)\b/i.test(notes)) {
      parts.push("Hopelessness");
    }
    const chiefComplaint = parts.join("; ");
    return chiefComplaint ? { chiefComplaint } : {};
  }
  function deriveIntakeFromManualNotes(notes) {
    const trimmedNotes = notes.trim();
    if (!trimmedNotes) return {};
    const lines = splitLines(trimmedNotes);
    return {
      ...extractHeaderName(lines),
      ...extractSex(trimmedNotes),
      ...extractOccupation(lines),
      ...extractChiefComplaint(trimmedNotes),
      ...extractSurgeries(lines),
      ...extractMedicalHistory(lines),
      ...extractSleep(lines),
      ...extractTbi(lines),
      ...extractPriorTreatment(lines),
      ...extractCounselingGoals(lines),
      ...extractRecentSymptoms(lines)
    };
  }
  function pickString(primary, fallback) {
    return primary.trim() || fallback?.trim() || "";
  }
  function augmentIntakeWithManualNotes(intake) {
    if (!intake.manualNotes.trim()) return intake;
    const derived = deriveIntakeFromManualNotes(intake.manualNotes);
    return {
      ...intake,
      fullName: pickString(intake.fullName, derived.fullName),
      firstName: pickString(intake.firstName, derived.firstName),
      lastName: pickString(intake.lastName, derived.lastName),
      sex: pickString(intake.sex, derived.sex),
      genderIdentity: pickString(intake.genderIdentity, derived.genderIdentity),
      chiefComplaint: pickString(intake.chiefComplaint, derived.chiefComplaint),
      counselingGoals: pickString(intake.counselingGoals, derived.counselingGoals),
      priorTreatment: pickString(intake.priorTreatment, derived.priorTreatment),
      medicalHistory: pickString(intake.medicalHistory, derived.medicalHistory),
      surgeries: pickString(intake.surgeries, derived.surgeries),
      troubleSleeping: pickString(intake.troubleSleeping, derived.troubleSleeping),
      tbiLoc: pickString(intake.tbiLoc, derived.tbiLoc),
      occupation: pickString(intake.occupation, derived.occupation),
      recentSymptoms: pickString(intake.recentSymptoms, derived.recentSymptoms)
    };
  }

  // src/lib/storage.ts
  var INTAKE_KEY = "spn_intake";
  var NOTE_KEY = "spn_note";
  var DIAGNOSTIC_WORKSPACE_KEY = "spn_diagnostic_workspace";
  var PREFS_KEY = "spn_preferences";
  function normalizeIntake(intake) {
    return {
      ...EMPTY_INTAKE,
      ...intake,
      address: {
        ...EMPTY_INTAKE.address,
        ...intake?.address ?? {}
      },
      rawQA: Array.isArray(intake?.rawQA) ? intake.rawQA : [],
      gad7: intake?.gad7 ?? null,
      phq9: intake?.phq9 ?? null
    };
  }
  function normalizeDiagnosticImpression(impression) {
    return {
      disorderId: impression?.disorderId ?? "",
      code: impression?.code ?? "",
      name: impression?.name ?? "",
      confidence: impression?.confidence ?? "low",
      criteriaEvidence: Array.isArray(impression?.criteriaEvidence) ? impression.criteriaEvidence : [],
      criteriaSummary: Array.isArray(impression?.criteriaSummary) ? impression.criteriaSummary : [],
      ruleOuts: Array.isArray(impression?.ruleOuts) ? impression.ruleOuts : [],
      clinicianNotes: impression?.clinicianNotes?.trim() ?? ""
    };
  }
  function normalizeNote(note) {
    const treatmentPlan = note?.treatmentPlan;
    return {
      ...EMPTY_PROGRESS_NOTE,
      ...note,
      mentalStatusExam: {
        ...EMPTY_PROGRESS_NOTE.mentalStatusExam,
        ...note?.mentalStatusExam ?? {}
      },
      treatmentPlan: {
        ...EMPTY_PROGRESS_NOTE.treatmentPlan,
        ...treatmentPlan ?? {},
        goals: Array.isArray(treatmentPlan?.goals) ? treatmentPlan.goals : [],
        interventions: Array.isArray(treatmentPlan?.interventions) ? treatmentPlan.interventions : []
      },
      diagnosticImpressions: Array.isArray(note?.diagnosticImpressions) ? note.diagnosticImpressions.map((impression) => normalizeDiagnosticImpression(impression)) : [],
      status: {
        ...EMPTY_PROGRESS_NOTE.status,
        ...note?.status ?? {}
      }
    };
  }
  function normalizeDiagnosticWorkspace(workspace) {
    return {
      ...EMPTY_DIAGNOSTIC_WORKSPACE,
      ...workspace,
      pinnedDisorderIds: Array.isArray(workspace?.pinnedDisorderIds) ? workspace.pinnedDisorderIds : [],
      activeDisorderId: workspace?.activeDisorderId ?? null,
      overrides: Array.isArray(workspace?.overrides) ? workspace.overrides.map((override) => ({
        disorderId: override?.disorderId ?? "",
        criterionId: override?.criterionId ?? "",
        status: override?.status ?? "not_assessed",
        notes: override?.notes?.trim() ?? "",
        updatedAt: override?.updatedAt ?? ""
      })) : [],
      disorderNotes: Array.isArray(workspace?.disorderNotes) ? workspace.disorderNotes.map((entry) => ({
        disorderId: entry?.disorderId ?? "",
        notes: entry?.notes?.trim() ?? ""
      })) : [],
      finalizedImpressions: Array.isArray(workspace?.finalizedImpressions) ? workspace.finalizedImpressions.map((impression) => normalizeDiagnosticImpression(impression)) : []
    };
  }
  async function getStoredIntake() {
    const result = await chrome.storage.session.get(INTAKE_KEY);
    const intake = result[INTAKE_KEY];
    return intake ? normalizeIntake(intake) : null;
  }
  async function getIntake() {
    const intake = await getStoredIntake();
    return intake ? augmentIntakeWithManualNotes(intake) : null;
  }
  async function saveNote(note) {
    await chrome.storage.session.set({ [NOTE_KEY]: normalizeNote(note) });
  }
  async function getNote() {
    const result = await chrome.storage.session.get(NOTE_KEY);
    const note = result[NOTE_KEY];
    return note ? normalizeNote(note) : null;
  }
  async function saveDiagnosticWorkspace(workspace) {
    await chrome.storage.session.set({
      [DIAGNOSTIC_WORKSPACE_KEY]: normalizeDiagnosticWorkspace(workspace)
    });
  }
  async function getDiagnosticWorkspace() {
    const result = await chrome.storage.session.get(DIAGNOSTIC_WORKSPACE_KEY);
    const workspace = result[DIAGNOSTIC_WORKSPACE_KEY];
    return workspace ? normalizeDiagnosticWorkspace(workspace) : null;
  }
  function normalizePreferences(prefs) {
    return {
      ...DEFAULT_PREFERENCES,
      ...prefs,
      providerFirstName: prefs?.providerFirstName?.trim() || DEFAULT_PREFERENCES.providerFirstName,
      providerLastName: prefs?.providerLastName?.trim() || DEFAULT_PREFERENCES.providerLastName,
      defaultLocation: prefs?.defaultLocation?.trim() || DEFAULT_PREFERENCES.defaultLocation,
      firstVisitCPT: prefs?.firstVisitCPT?.trim() || DEFAULT_PREFERENCES.firstVisitCPT,
      followUpCPT: prefs?.followUpCPT?.trim() || DEFAULT_PREFERENCES.followUpCPT
    };
  }
  async function getPreferences() {
    const result = await chrome.storage.local.get(PREFS_KEY);
    return normalizePreferences(result[PREFS_KEY]);
  }

  // src/sidepanel/sidepanel.ts
  function formatDate(iso) {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }
  function escapeHtml(value) {
    return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
  }
  function statusLabel(status) {
    switch (status) {
      case "met":
        return "Met";
      case "likely":
        return "Likely";
      case "unclear":
        return "Unclear";
      case "not_assessed":
        return "Not assessed";
      case "not_met":
        return "Not met";
    }
  }
  function buildWorkspaceBase(workspace) {
    return workspace ? {
      ...workspace,
      pinnedDisorderIds: [...workspace.pinnedDisorderIds],
      overrides: [...workspace.overrides],
      disorderNotes: [...workspace.disorderNotes],
      finalizedImpressions: [...workspace.finalizedImpressions]
    } : {
      ...EMPTY_DIAGNOSTIC_WORKSPACE
    };
  }
  function resolveActiveDisorderId(workspace, suggestionIds) {
    if (workspace?.activeDisorderId && suggestionIds.includes(workspace.activeDisorderId)) {
      return workspace.activeDisorderId;
    }
    if (workspace?.pinnedDisorderIds.length) {
      const pinned = workspace.pinnedDisorderIds.find((id) => suggestionIds.includes(id));
      if (pinned) return pinned;
    }
    return suggestionIds[0] ?? null;
  }
  async function updateWorkspace(mutator) {
    const current = buildWorkspaceBase(await getDiagnosticWorkspace());
    const next = mutator(current);
    const normalized = {
      ...next,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await saveDiagnosticWorkspace(normalized);
    return normalized;
  }
  function buildScoreCards(intake) {
    const cards = [
      intake.phq9 ? `
        <div class="score-card">
          <div class="score-label">PHQ-9</div>
          <div class="score-value">${intake.phq9.totalScore}/27</div>
          <div class="score-subtext">${escapeHtml(intake.phq9.severity || "Severity unavailable")}</div>
          <div class="score-subtext">${escapeHtml(intake.phq9.difficulty || "No impairment note captured")}</div>
        </div>
      ` : `
        <div class="score-card">
          <div class="score-label">PHQ-9</div>
          <div class="score-value">Not captured</div>
          <div class="score-subtext">No PHQ-9 assessment in session storage.</div>
        </div>
      `,
      intake.gad7 ? `
        <div class="score-card">
          <div class="score-label">GAD-7</div>
          <div class="score-value">${intake.gad7.totalScore}/21</div>
          <div class="score-subtext">${escapeHtml(intake.gad7.severity || "Severity unavailable")}</div>
          <div class="score-subtext">${escapeHtml(intake.gad7.difficulty || "No impairment note captured")}</div>
        </div>
      ` : `
        <div class="score-card">
          <div class="score-label">GAD-7</div>
          <div class="score-value">Not captured</div>
          <div class="score-subtext">No GAD-7 assessment in session storage.</div>
        </div>
      `
    ];
    return cards.join("");
  }
  function renderPinnedTabs(workspace, activeDisorderId) {
    if (!workspace?.pinnedDisorderIds.length) {
      return '<div class="empty-copy">Pin diagnoses from the ranked list to keep them in active review tabs.</div>';
    }
    return workspace.pinnedDisorderIds.map((disorderId) => {
      const disorder = DSM5_DISORDER_MAP[disorderId];
      if (!disorder) return "";
      return `
        <button class="tab ${activeDisorderId === disorderId ? "active" : ""}" data-action="activate-tab" data-disorder-id="${disorderId}">
          ${escapeHtml(disorder.name)}
        </button>
      `;
    }).join("");
  }
  function renderSuggestionList(intake, workspace, activeDisorderId) {
    const suggestions = getDiagnosticSuggestions(intake);
    return suggestions.map((suggestion) => {
      const pinned = workspace?.pinnedDisorderIds.includes(suggestion.disorderId) ?? false;
      const isActive = suggestion.disorderId === activeDisorderId;
      return `
        <article class="suggestion-card">
          <div class="suggestion-top">
            <div>
              <div class="suggestion-name">${escapeHtml(suggestion.disorderName)}</div>
              <div class="suggestion-meta">${escapeHtml(suggestion.code)} \xB7 ${suggestion.metCount} met \xB7 ${suggestion.likelyCount} likely \xB7 ${suggestion.requiredCount} required</div>
            </div>
            <span class="pill ${suggestion.confidence}">${suggestion.confidence.toUpperCase()}</span>
          </div>
          <div class="suggestion-reason">${escapeHtml(suggestion.reason)}</div>
          <div class="suggestion-actions">
            <button class="button ${pinned ? "secondary" : "primary"}" data-action="${pinned ? "unpin" : "pin"}" data-disorder-id="${suggestion.disorderId}">
              ${pinned ? "Unpin" : "Pin diagnosis"}
            </button>
            <button class="button ghost" data-action="review" data-disorder-id="${suggestion.disorderId}">
              ${isActive ? "Reviewing" : "Review"}
            </button>
          </div>
        </article>
      `;
    }).join("");
  }
  function renderCriterionCard(disorderId, evaluation, workspace) {
    const status = getEffectiveCriterionStatus(workspace, disorderId, evaluation);
    const override = getOverride(workspace, disorderId, evaluation.criterionId);
    const criterionId = evaluation.criterionId.replace(`${disorderId}.`, "");
    const evidence = evaluation.evidence.length ? evaluation.evidence.map((item) => `<div>${escapeHtml(item)}</div>`).join("") : "<div>No direct intake evidence yet.</div>";
    return `
    <article class="criterion-card">
      <div class="criterion-top">
        <div class="criterion-id">${escapeHtml(criterionId)}</div>
        <span class="pill status ${status}">${statusLabel(status)}</span>
      </div>
      <div class="criterion-text">${escapeHtml(DSM5_DISORDER_MAP[disorderId].criteria.find((criterion2) => criterion2.id === evaluation.criterionId)?.text ?? "")}</div>
      <div class="criterion-evidence"><strong>Evidence:</strong> ${evidence}</div>
      <div class="criterion-rationale"><strong>Engine note:</strong> ${escapeHtml(evaluation.rationale)}</div>
      <div class="criterion-followup"><strong>Follow-up:</strong> ${escapeHtml(evaluation.followUpQuestion)}</div>
      <div class="criterion-controls">
        <select
          class="status-select"
          data-role="criterion-status"
          data-disorder-id="${disorderId}"
          data-criterion-id="${evaluation.criterionId}"
          data-auto-status="${evaluation.status}"
        >
          ${["met", "likely", "unclear", "not_assessed", "not_met"].map((candidate) => `<option value="${candidate}" ${candidate === status ? "selected" : ""}>${statusLabel(candidate)}</option>`).join("")}
        </select>
        <textarea
          class="criterion-note"
          data-role="criterion-note"
          data-disorder-id="${disorderId}"
          data-criterion-id="${evaluation.criterionId}"
          data-auto-status="${evaluation.status}"
          placeholder="Optional override note"
        >${escapeHtml(override?.notes ?? "")}</textarea>
      </div>
    </article>
  `;
  }
  function renderActiveReview(intake, workspace, activeDisorderId) {
    if (!activeDisorderId) {
      return '<div class="empty-copy">No diagnosis selected for checklist review.</div>';
    }
    const suggestion = findSuggestion(getDiagnosticSuggestions(intake), activeDisorderId);
    const disorder = suggestion ? DSM5_DISORDER_MAP[suggestion.disorderId] : null;
    if (!suggestion || !disorder) {
      return '<div class="empty-copy">The selected diagnosis is no longer available.</div>';
    }
    const unresolved = suggestion.criteria.filter((criterion2) => {
      const status = getEffectiveCriterionStatus(workspace, activeDisorderId, criterion2);
      return status === "unclear" || status === "not_assessed";
    }).slice(0, 5);
    let lastLetter = "";
    const criteriaMarkup = suggestion.criteria.map((evaluation) => {
      const definition = disorder.criteria.find((criterion2) => criterion2.id === evaluation.criterionId);
      const nextLetter = definition?.letter ?? "";
      const groupHeading = nextLetter !== lastLetter ? `<div class="criterion-group">${escapeHtml(nextLetter)}</div>` : "";
      lastLetter = nextLetter;
      return `${groupHeading}${renderCriterionCard(activeDisorderId, evaluation, workspace)}`;
    }).join("");
    const disorderNotes = getDisorderNotes(workspace, activeDisorderId);
    return `
    <div class="review-header">
      <div>
        <h3 class="review-title">${escapeHtml(suggestion.suggestedSpecifier ? `${suggestion.disorderName} \u2014 ${suggestion.suggestedSpecifier}` : suggestion.disorderName)}</h3>
        <div class="review-subtitle">${escapeHtml(suggestion.code)} \xB7 ${escapeHtml(suggestion.reason)}</div>
      </div>
      <span class="pill ${suggestion.confidence}">${suggestion.confidence.toUpperCase()}</span>
    </div>
    ${unresolved.length ? `
      <div class="criterion-followup">
        <strong>Unresolved prompts:</strong>
        <ul>
          ${unresolved.map((criterion2) => `<li>${escapeHtml(criterion2.followUpQuestion)}</li>`).join("")}
        </ul>
      </div>
    ` : ""}
    <div class="criteria-list">${criteriaMarkup}</div>
    <div class="diagnosis-notes-wrap">
      <label class="criterion-evidence"><strong>Clinician notes</strong></label>
      <textarea
        class="diagnosis-notes"
        data-role="diagnosis-notes"
        data-disorder-id="${activeDisorderId}"
        placeholder="Summary note, rule-outs, or interview takeaways"
      >${escapeHtml(disorderNotes)}</textarea>
    </div>
  `;
  }
  function renderGeneratedSummary(workspace) {
    if (!workspace?.finalizedImpressions.length) {
      return '<div class="empty-copy">No diagnostic summary generated yet.</div>';
    }
    return workspace.finalizedImpressions.map((impression) => `
      <article class="summary-card">
        <h3>${escapeHtml(impression.name)}</h3>
        <p>${escapeHtml(impression.code)} \xB7 ${escapeHtml(impression.confidence.toUpperCase())}</p>
        ${impression.criteriaSummary.length ? `<ul>${impression.criteriaSummary.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
        ${impression.criteriaEvidence.length ? `<ul>${impression.criteriaEvidence.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
        ${impression.clinicianNotes ? `<p>${escapeHtml(impression.clinicianNotes)}</p>` : ""}
      </article>
    `).join("");
  }
  function renderGuidance(guidance) {
    if (!guidance) {
      return '<div class="empty-copy">No formulation or treatment-plan support generated yet.</div>';
    }
    const modalityPills = guidance.modalities.length ? `<div class="pill-row">${guidance.modalities.map((modality) => `<span class="pill low">${escapeHtml(modality)}</span>`).join("")}</div>` : "";
    const references = guidance.references.length ? `
      <div class="reference-list">
        ${guidance.references.map((reference) => `
          <article class="reference-card">
            <div class="reference-title">${escapeHtml(reference.resourceTitle)}</div>
            <div class="reference-meta">p. ${reference.pageStart}${reference.heading ? ` \xB7 ${escapeHtml(reference.heading)}` : ""}</div>
            <div class="reference-preview">${escapeHtml(reference.preview)}</div>
          </article>
        `).join("")}
      </div>
    ` : '<div class="empty-copy">No corpus matches were found for the current intake and diagnostic picture.</div>';
    return `
    ${modalityPills}
    <article class="knowledge-block">
      <h3>Working Formulation</h3>
      <p>${escapeHtml(guidance.formulation)}</p>
    </article>
    <article class="knowledge-block">
      <h3>Suggested Goals</h3>
      <ul>${guidance.goals.map((goal) => `<li>${escapeHtml(goal)}</li>`).join("")}</ul>
    </article>
    <article class="knowledge-block">
      <h3>Suggested Interventions</h3>
      <ul>${guidance.interventions.map((intervention) => `<li>${escapeHtml(intervention)}</li>`).join("")}</ul>
    </article>
    <article class="knowledge-block">
      <h3>Scheduling / Coordination</h3>
      <p><strong>Frequency:</strong> ${escapeHtml(guidance.frequency)}</p>
      <p><strong>Referrals:</strong> ${escapeHtml(guidance.referrals || "No immediate referral recommendation pulled from the current intake.")}</p>
      <p><strong>Next step:</strong> ${escapeHtml(guidance.plan)}</p>
    </article>
    <article class="knowledge-block">
      <h3>Knowledge Matches</h3>
      ${references}
    </article>
  `;
  }
  async function persistCriterionOverride(disorderId, criterionId, selectedStatus, autoStatus, notes) {
    await updateWorkspace((workspace) => {
      const trimmedNotes = notes.trim();
      const nextOverrides = workspace.overrides.filter((override) => !(override.disorderId === disorderId && override.criterionId === criterionId));
      if (selectedStatus !== autoStatus || trimmedNotes) {
        nextOverrides.push({
          disorderId,
          criterionId,
          status: selectedStatus,
          notes: trimmedNotes,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
      return {
        ...workspace,
        overrides: nextOverrides
      };
    });
  }
  async function persistDisorderNotes(disorderId, notes) {
    await updateWorkspace((workspace) => {
      const trimmedNotes = notes.trim();
      const next = workspace.disorderNotes.filter((entry) => entry.disorderId !== disorderId);
      if (trimmedNotes) {
        next.push({ disorderId, notes: trimmedNotes });
      }
      return {
        ...workspace,
        disorderNotes: next
      };
    });
  }
  async function pinDiagnosis(disorderId) {
    await updateWorkspace((workspace) => ({
      ...workspace,
      pinnedDisorderIds: workspace.pinnedDisorderIds.includes(disorderId) ? workspace.pinnedDisorderIds : [...workspace.pinnedDisorderIds, disorderId],
      activeDisorderId: disorderId
    }));
  }
  async function unpinDiagnosis(disorderId) {
    await updateWorkspace((workspace) => {
      const pinnedDisorderIds = workspace.pinnedDisorderIds.filter((id) => id !== disorderId);
      return {
        ...workspace,
        pinnedDisorderIds,
        activeDisorderId: workspace.activeDisorderId === disorderId ? pinnedDisorderIds[0] ?? null : workspace.activeDisorderId
      };
    });
  }
  async function setActiveDiagnosis(disorderId) {
    await updateWorkspace((workspace) => ({
      ...workspace,
      activeDisorderId: disorderId
    }));
  }
  function mergeDiagnosticImpressionsIntoNote(note, intake, impressions) {
    return getPreferences().then(async (prefs) => {
      const generated = await buildDraftNote(intake, prefs, impressions);
      if (!note) {
        return generated;
      }
      return {
        ...generated,
        mentalStatusExam: note.mentalStatusExam,
        duration: note.duration || generated.duration,
        sessionType: note.sessionType || generated.sessionType,
        cptCode: note.cptCode || generated.cptCode,
        status: {
          ...note.status,
          intakeCaptured: true,
          noteGenerated: true
        },
        generatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    });
  }
  async function generateSummary(writeToNote) {
    const intake = await getIntake();
    if (!intake) return;
    const workspace = buildWorkspaceBase(await getDiagnosticWorkspace());
    const suggestions = getDiagnosticSuggestions(intake);
    const activeDisorderId = resolveActiveDisorderId(workspace, suggestions.map((suggestion) => suggestion.disorderId));
    if (!workspace.pinnedDisorderIds.length && activeDisorderId) {
      workspace.activeDisorderId = activeDisorderId;
    }
    const impressions = buildDiagnosticImpressions(intake, suggestions, workspace);
    const nextWorkspace = await updateWorkspace((current) => ({
      ...current,
      activeDisorderId: current.activeDisorderId ?? activeDisorderId,
      finalizedImpressions: impressions
    }));
    if (writeToNote) {
      const currentNote = await getNote();
      const nextNote = await mergeDiagnosticImpressionsIntoNote(currentNote, intake, impressions);
      await saveNote(nextNote);
    }
    const statusEl = document.getElementById("summary-status");
    if (statusEl) {
      const verb = writeToNote ? "Summary written to note draft" : "Diagnostic summary generated";
      statusEl.textContent = `${verb} \xB7 ${nextWorkspace.finalizedImpressions.length} diagnoses`;
    }
    await render();
  }
  async function render() {
    const intake = await getIntake();
    const workspace = await getDiagnosticWorkspace();
    const emptyState = document.getElementById("empty-state");
    const content = document.getElementById("content");
    if (!intake) {
      emptyState.hidden = false;
      content.hidden = true;
      return;
    }
    emptyState.hidden = true;
    content.hidden = false;
    const suggestions = getDiagnosticSuggestions(intake);
    const activeDisorderId = resolveActiveDisorderId(workspace, suggestions.map((suggestion) => suggestion.disorderId));
    const draftImpressions = workspace?.finalizedImpressions.length ? workspace.finalizedImpressions : buildDiagnosticImpressions(intake, suggestions, buildWorkspaceBase(workspace));
    const guidance = await buildClinicalGuidance(intake, draftImpressions);
    document.getElementById("patient-name").textContent = intake.fullName || `${intake.firstName} ${intake.lastName}`.trim() || "Client";
    document.getElementById("patient-meta").textContent = [`Client ${intake.clientId || "unknown"}`, intake.capturedAt ? `Captured ${formatDate(intake.capturedAt)}` : ""].filter(Boolean).join(" \xB7 ");
    document.getElementById("score-grid").innerHTML = buildScoreCards(intake);
    document.getElementById("pinned-tabs").innerHTML = renderPinnedTabs(workspace, activeDisorderId);
    document.getElementById("suggestion-list").innerHTML = renderSuggestionList(intake, workspace, activeDisorderId);
    document.getElementById("active-review").innerHTML = renderActiveReview(intake, workspace, activeDisorderId);
    document.getElementById("generated-summary").innerHTML = renderGeneratedSummary(workspace);
    document.getElementById("knowledge-guidance").innerHTML = renderGuidance(guidance);
    const summaryStatus = document.getElementById("summary-status");
    summaryStatus.textContent = workspace?.finalizedImpressions.length ? `Most recent summary includes ${workspace.finalizedImpressions.length} pinned diagnoses.` : "Generate a summary to push finalized diagnostic impressions into the note draft.";
    const guidanceStatus = document.getElementById("guidance-status");
    guidanceStatus.textContent = workspace?.finalizedImpressions.length ? `Knowledge support is using the finalized diagnostic summary and current intake evidence.` : "Knowledge support is using provisional intake-driven diagnoses until a summary is finalized.";
    const addSelect = document.getElementById("add-diagnosis-select");
    const options = getAvailableDiagnosisOptions(workspace);
    addSelect.innerHTML = options.length ? options.map((disorder) => `<option value="${disorder.id}">${escapeHtml(disorder.name)}</option>`).join("") : '<option value="">All 15 diagnoses are already pinned.</option>';
    addSelect.disabled = options.length === 0;
    document.getElementById("btn-add-diagnosis").disabled = options.length === 0;
  }
  document.addEventListener("click", async (event) => {
    const target = event.target;
    if (!target) return;
    const actionTarget = target.closest("[data-action]");
    const action = actionTarget?.dataset.action;
    const disorderId = actionTarget?.dataset.disorderId;
    if (action === "pin" && disorderId) {
      await pinDiagnosis(disorderId);
      await render();
      return;
    }
    if (action === "unpin" && disorderId) {
      await unpinDiagnosis(disorderId);
      await render();
      return;
    }
    if ((action === "review" || action === "activate-tab") && disorderId) {
      await setActiveDiagnosis(disorderId);
      await render();
      return;
    }
  });
  document.addEventListener("change", async (event) => {
    const target = event.target;
    if (!target) return;
    if (target.id === "add-diagnosis-select") return;
    if (target instanceof HTMLSelectElement && target.dataset.role === "criterion-status") {
      const disorderId = target.dataset.disorderId;
      const criterionId = target.dataset.criterionId;
      const autoStatus = target.dataset.autoStatus;
      if (!disorderId || !criterionId || !autoStatus) return;
      const noteEl = document.querySelector(`textarea[data-role="criterion-note"][data-disorder-id="${disorderId}"][data-criterion-id="${criterionId}"]`);
      await persistCriterionOverride(
        disorderId,
        criterionId,
        target.value,
        autoStatus,
        noteEl?.value ?? ""
      );
      await render();
      return;
    }
    if (target instanceof HTMLTextAreaElement && target.dataset.role === "diagnosis-notes") {
      const disorderId = target.dataset.disorderId;
      if (!disorderId) return;
      await persistDisorderNotes(disorderId, target.value);
      return;
    }
  });
  document.addEventListener("blur", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLTextAreaElement)) return;
    if (target.dataset.role === "criterion-note") {
      const disorderId = target.dataset.disorderId;
      const criterionId = target.dataset.criterionId;
      const autoStatus = target.dataset.autoStatus;
      if (!disorderId || !criterionId || !autoStatus) return;
      const statusEl = document.querySelector(`select[data-role="criterion-status"][data-disorder-id="${disorderId}"][data-criterion-id="${criterionId}"]`);
      await persistCriterionOverride(
        disorderId,
        criterionId,
        statusEl?.value ?? autoStatus,
        autoStatus,
        target.value
      );
      return;
    }
    if (target.dataset.role === "diagnosis-notes") {
      const disorderId = target.dataset.disorderId;
      if (!disorderId) return;
      await persistDisorderNotes(disorderId, target.value);
    }
  }, true);
  document.getElementById("btn-refresh")?.addEventListener("click", () => {
    render();
  });
  document.getElementById("btn-add-diagnosis")?.addEventListener("click", async () => {
    const select = document.getElementById("add-diagnosis-select");
    if (!select.value) return;
    await pinDiagnosis(select.value);
    await render();
  });
  document.getElementById("btn-generate-summary")?.addEventListener("click", async () => {
    await generateSummary(false);
  });
  document.getElementById("btn-write-note")?.addEventListener("click", async () => {
    await generateSummary(true);
  });
  chrome.storage.onChanged.addListener(() => render());
  render();
})();
//# sourceMappingURL=sidepanel.js.map
