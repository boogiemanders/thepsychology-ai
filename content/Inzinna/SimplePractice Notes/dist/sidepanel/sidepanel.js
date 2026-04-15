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
          phqItem: 8,
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
          keywords: ["concentration", "can", ", ", ", "]
        }),
        criterion("mdd.A.9", "A", "Recurrent thoughts of death or suicidal ideation/behavior.", "Have there been recurrent thoughts of death, suicidal thoughts, or suicidal behavior?", {
          number: 9,
          phqItem: 9,
          intakeFields: ["suicidalIdeation", "suicideAttemptHistory", "additionalInfo", "rawQA"],
          keywords: ["suicidal", "wish i were dead", "thoughts of death", "kill myself"]
        }),
        criterion("mdd.B", "B", "Symptoms cause clinically significant distress or impairment.", "How much are the symptoms affecting work, school, relationships, or daily functioning?", {
          intakeFields: ["historyOfPresentIllness", "additionalInfo", "rawQA"],
          keywords: ["can", ", ", ", ", ", ", ", "]
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
          keywords: ["can", ", ", ", "]
        }),
        criterion("gad.C.1", "C", "Restlessness or feeling keyed up/on edge.", "Do they feel on edge, restless, or keyed up much of the time?", {
          number: 1,
          gadItem: 1,
          keywords: ["on edge", "keyed up", "restless"]
        }),
        criterion("gad.C.2", "C", "Being easily fatigued.", "Do they become tired easily from the anxiety or worrying?", {
          number: 2,
          keywords: ["fatigued", "tired", "drained"]
        }),
        criterion("gad.C.3", "C", "Difficulty concentrating or mind going blank.", "Does worry interfere with concentration or make the mind go blank?", {
          number: 3,
          keywords: ["concentration", "mind going blank", "can\u2019t focus"]
        }),
        criterion("gad.C.4", "C", "Irritability.", "Has the person been more irritable because of the anxiety?", {
          number: 4,
          gadItem: 6,
          // GAD-7 item 6: "Becoming easily annoyed or irritable"
          keywords: ["irritable", "snappy"]
        }),
        criterion("gad.C.5", "C", "Muscle tension.", "Is muscle tension, tightness, or physical tension part of the anxiety?", {
          number: 5,
          keywords: ["muscle tension", "tense", "tight shoulders", "tight jaw"]
        }),
        criterion("gad.C.6", "C", "Sleep disturbance.", "Has the anxiety affected sleep?", {
          number: 6,
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
          keywords: ["shortness of breath", "can", ", "]
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
          keywords: ["intrusive memories", "can", ", "]
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
          keywords: ["can", ", ", ", "]
        }),
        criterion("ptsd.D.2", "D", "Persistent exaggerated negative beliefs or expectations.", "Are there enduring negative beliefs about self, others, or the world since the trauma?", {
          number: 2,
          intakeFields: TRAUMA_FIELDS,
          keywords: ["can", ", ", ", "]
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
          keywords: ["can", ", ", ", "]
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
          keywords: ["concentration", "can"]
        }),
        criterion("ptsd.E.6", "E", "Sleep disturbance.", "Has trauma-related distress affected sleep?", {
          number: 6,
          intakeFields: TRAUMA_FIELDS,
          keywords: ["sleep disturbance", "can", ", ", ", "]
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
          keywords: ["numb", "can"]
        }),
        criterion("acute_stress.B.7", "B", "Altered sense of reality.", "Have there been episodes of feeling dazed, detached, or in a fog?", {
          number: 7,
          intakeFields: TRAUMA_FIELDS,
          keywords: ["dazed", "detached", "foggy", "unreal"]
        }),
        criterion("acute_stress.B.8", "B", "Inability to remember an important aspect of the trauma.", "Is there trauma-related amnesia?", {
          number: 8,
          intakeFields: TRAUMA_FIELDS,
          keywords: ["can", ", "]
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
          keywords: ["difficulty paying attention", "can", ", "]
        }),
        criterion("adhd.A1.3", "A1", "Often does not seem to listen when spoken to directly.", "Do others report that the person seems not to listen?", {
          number: 3,
          keywords: ["doesn", ", "]
        }),
        criterion("adhd.A1.4", "A1", "Often does not follow through on instructions and fails to finish tasks.", "Do they start tasks and fail to finish them?", {
          number: 4,
          keywords: ["doesn", ", "]
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
          keywords: ["fidget", "restless", "can"]
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
          keywords: ["can", ", ", "t do quiet activities"]
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
          keywords: ["can", ", "]
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
      requiredCountAdjustments: [
        {
          minAge: 17,
          note: "For adolescents age 17 and older and adults, five symptoms are required in either domain.",
          requiredCounts: [
            { criterion: "A1", required: 5, total: 9 },
            { criterion: "A2", required: 5, total: 9 }
          ]
        }
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
          keywords: ["decreased need for sleep", "slept 2 hours", "didn"]
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
          keywords: ["distractible", "can"]
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
          keywords: ["hospitalized", "psychosis", "couldn"]
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
          keywords: ["drink more than intended", "can"]
        }),
        criterion("alcohol_use.A.2", "A", "Persistent desire or unsuccessful efforts to cut down or control use.", "Have there been unsuccessful attempts to cut down or stop drinking?", {
          number: 2,
          intakeFields: SUBSTANCE_FIELDS,
          keywords: ["tried to cut down", "couldn"]
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
          keywords: ["use more weed than intended", "can"]
        }),
        criterion("cannabis_use.A.2", "A", "Persistent desire or unsuccessful efforts to cut down or control use.", "Have there been unsuccessful attempts to cut down or stop cannabis use?", {
          number: 2,
          intakeFields: SUBSTANCE_FIELDS,
          keywords: ["tried to cut down weed", "couldn"]
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
          keywords: ["don", ", ", ", "]
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
          keywords: ["intense anger", "rage", "can"]
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

  // src/data/dsm5-criteria-v2.ts
  var DSM5_DIAGNOSES_V2 = [
    {
      "id": "intellectual-developmental-disorder-intellectual-disability",
      "name": "Intellectual Developmental Disorder (Intellectual Disability)",
      "chapter": "Neurodevelopmental Disorders",
      "sourcePdfPages": [
        134,
        142
      ],
      "criteriaText": "Intellectual developmental disorder (intellectual disability) is a disorder with onset\nduring the developmental period that includes both intellectual and adaptive\nfunctioning deficits in conceptual, social, and practical domains. The following three\ncriteria must be met:\nA. Deficits in intellectual functions, such as reasoning, problem solving, planning,\nabstract thinking, judgment, academic learning, and learning from experience,\nconfirmed by both clinical assessment and individualized, standardized\nintelligence testing.\nB. Deficits in adaptive functioning that result in failure to meet developmental and\nsociocultural standards for personal independence and social responsibility.\nWithout ongoing support, the adaptive deficits limit functioning in one or more\nactivities of daily life, such as communication, social participation, and\nindependent living, across multiple environments, such as home, school, work,\nand community.\nC. Onset of intellectual and adaptive deficits during the developmental period.\n\nNote: The term intellectual developmental disorder is used to clarify its relationship\nwith the WHO ICD-11 classification system, which uses the term Disorders of\nIntellectual Development. The equivalent term intellectual disability is placed in\nparentheses for continued use. The medical and research literature use both terms,\nwhile intellectual disability is the term in common use by educational and other\nprofessions, advocacy groups, and the lay public. In the United States, Public Law\n111-256 (Rosa\u2019s Law) changed all references to \u201Cmental retardation\u201D in federal laws\nto \u201Cintellectual disability.\u201D\nSpecify current severity (see Table 1):\nF70 Mild\nF71 Moderate\nF72 Severe\nF73 Profound\n\nTABLE 1 Severity levels for intellectual developmental disorder (intellectual\ndisability)\nSeverity\nlevel       Conceptual domain                   Social domain                       Practical domain\n\nMild        For preschool children, there may be Compared with typically developing The individual may function age-\nno obvious conceptual differences.     age-mates, the individual is           appropriately in personal care.\nFor school-age children and adults,    immature in social interactions.       Individuals need some support\nthere are difficulties in learning     For example, there may be              with complex daily living tasks in\nacademic skills involving reading,     difficulty in accurately perceiving    comparison to peers. In adulthood,\nwriting, arithmetic, time, or          peers\u2019 social cues.                    supports typically involve grocery\nmoney, with support needed in one      Communication, conversation, and       shopping, transportation, home\nor more areas to meet age-related      language are more concrete or          and child-care organizing,\nexpectations. In adults, abstract      immature than expected for age.        nutritious food preparation, and\nthinking, executive function (i.e.,    There may be difficulties              banking and money management.\nplanning, strategizing, priority       regulating emotion and behavior in     Recreational skills resemble those\nsetting, and cognitive flexibility),   age-appropriate fashion; these         of age-mates, although judgment\nand short-term memory, as well as      difficulties are noticed by peers in   related to well-being and\nfunctional use of academic skills      social situations. There is limited    organization around recreation\n(e.g., reading, money                  understanding of risk in social        requires support. In adulthood,\nmanagement), are impaired. There       situations; social judgment is         competitive employment is often\nis a somewhat concrete approach        immature for age, and the person       seen in jobs that do not emphasize\nto problems and solutions              is at risk of being manipulated by     conceptual skills. Individuals\ncompared with age-mates.               others (gullibility).                  generally need support to make\nhealth care decisions and legal\ndecisions, and to learn to perform\na skilled vocation competently.\nSupport is typically needed to raise\na family.\n\n40    All through development, the           The individual shows marked            The individual can care for personal\nindividual\u2019s conceptual skills lag     differences from peers in social       needs involving eating, dressing,\nModerate markedly behind those of peers.         and communicative behavior             elimination, and hygiene as an\nFor preschoolers, language and         across development. Spoken             adult, although an extended period\npreacademic skills develop slowly.     language is typically a primary        of teaching and time is needed for\nFor school-age children, progress      tool for social communication but      the individual to become\nin reading, writing, mathematics,      is much less complex than that of      independent in these areas, and\nand understanding of time and          peers. Capacity for relationships is   reminders may be needed.\nmoney occurs slowly across the         evident in ties to family and          Similarly, participation in all\nschool years and is markedly           friends, and the individual may        household tasks can be achieved\nlimited compared with that of          have successful friendships across     by adulthood, although an\npeers. For adults, academic skill      life and sometimes romantic            extended period of teaching is\ndevelopment is typically at an         relations in adulthood. However,       needed, and ongoing supports will\nelementary level, and support is       individuals may not perceive or        typically occur for adult-level\nrequired for all use of academic       interpret social cues accurately.      performance. Independent\nskills in work and personal life.      Social judgment and decision-          employment in jobs that require\nOngoing assistance on a daily          making abilities are limited, and      limited conceptual and\nbasis is needed to complete            caretakers must assist the person      communication skills can be\nconceptual tasks of day-to-day life,   with life decisions. Friendships       achieved, but considerable support\nand others may take over these         with typically developing peers are from coworkers, supervisors, and\nresponsibilities fully for the         often affected by communication        others is needed to manage social\nindividual.                            or social limitations. Significant     expectations, job complexities, and\nsocial and communicative support       ancillary responsibilities such as\nis needed in work settings for         scheduling, transportation, health\nsuccess.                               benefits, and money management.\nA variety of recreational skills can\nbe developed. These typically\nrequire additional supports and\nlearning opportunities over an\nextended period of time.\nMaladaptive behavior is present in\na significant minority and causes\nsocial problems.\n\nAttainment of conceptual skills is    Spoken language is quite limited in The individual requires support for\nSevere      limited. The individual generally     terms of vocabulary and grammar.    all activities of daily living,\nhas little understanding of written   Speech may be single words or       including meals, dressing, bathing,\nlanguage or of concepts involving     phrases and may be supplemented     and elimination. The individual\nnumbers, quantity, time, and          through augmentative means.         requires supervision at all times.\nmoney. Caretakers provide             Speech and communication are           The individual cannot make\nextensive supports for problem        focused on the here and now            responsible decisions regarding\nsolving throughout life.              within everyday events. Language       well-being of self or others. In\nis used for social communication       adulthood, participation in tasks at\nmore than for explication.             home, recreation, and work\nIndividuals understand simple          requires ongoing support and\nspeech and gestural                    assistance. Skill acquisition in all\ncommunication. Relationships           domains involves long-term\nwith family members and familiar       teaching and ongoing support.\nothers are a source of pleasure and    Maladaptive behavior, including\nhelp.                                  self-injury, is present in a\nsignificant minority.\nProfound   Conceptual skills generally involve The individual has very limited       The individual is dependent on others\nthe physical world rather than      understanding of symbolic             for all aspects of daily physical\nsymbolic processes. The individual  communication in speech or            care, health, and safety, although\nmay use objects in goal-directed    gesture. He or she may understand     he or she may be able to\nfashion for self-care, work, and    some simple instructions or           participate in some of these\nrecreation. Certain visuospatial    gestures. The individual expresses    activities as well. Individuals\nskills, such as matching and        his or her own desires and            without severe physical\nsorting based on physical           emotions largely through              impairments may assist with some\ncharacteristics, may be acquired.   nonverbal, nonsymbolic                daily work tasks at home, like\nHowever, co-occurring motor and     communication. The individual         carrying dishes to the table. Simple\nsensory impairments may prevent     enjoys relationships with well-       actions with objects may be the\nfunctional use of objects.          known family members,                 basis of participation in some\ncaretakers, and familiar others, and vocational activities with high\ninitiates and responds to social      levels of ongoing support.\ninteractions through gestural and     Recreational activities may\nemotional cues. Co-occurring          involve, for example, enjoyment in\nsensory and physical impairments      listening to music, watching\nmay prevent many social               movies, going out for walks, or\nactivities.                           participating in water activities, all\nwith the support of others. Co-\noccurring physical and sensory\nimpairments are frequent barriers\nto participation (beyond watching)\nin home, recreational, and\nvocational activities. Maladaptive\nbehavior is present in a significant\nminority."
    },
    {
      "id": "language-disorder",
      "name": "Language Disorder",
      "chapter": "Neurodevelopmental Disorders",
      "icd10Code": "F80.2",
      "sourcePdfPages": [
        143,
        145
      ],
      "criteriaText": "A. Persistent difficulties in the acquisition and use of language across modalities\n(i.e., spoken, written, sign language, or other) due to deficits in comprehension\nor production that include the following:\n1. Reduced vocabulary (word knowledge and use).\n2. Limited sentence structure (ability to put words and word endings together to\nform sentences based on the rules of grammar and morphology).\n3. Impairments in discourse (ability to use vocabulary and connect sentences to\nexplain or describe a topic or series of events or have a conversation).\nB. Language abilities are substantially and quantifiably below those expected for\nage, resulting in functional limitations in effective communication, social\nparticipation, academic achievement, or occupational performance, individually\nor in any combination.\nC. Onset of symptoms is in the early developmental period.\nD. The difficulties are not attributable to hearing or other sensory impairment, motor\ndysfunction, or another medical or neurological condition and are not better\nexplained by intellectual developmental disorder (intellectual disability) or global\ndevelopmental delay."
    },
    {
      "id": "speech-sound-disorder",
      "name": "Speech Sound Disorder",
      "chapter": "Neurodevelopmental Disorders",
      "icd10Code": "F80.0",
      "sourcePdfPages": [
        146,
        148
      ],
      "criteriaText": "A. Persistent difficulty with speech sound production that interferes with speech\nintelligibility or prevents verbal communication of messages.\nB. The disturbance causes limitations in effective communication that interfere with\nsocial participation, academic achievement, or occupational performance,\nindividually or in any combination.\nC. Onset of symptoms is in the early developmental period.\nD. The difficulties are not attributable to congenital or acquired conditions, such as\ncerebral palsy, cleft palate, deafness or hearing loss, traumatic brain injury, or\nother medical or neurological conditions."
    },
    {
      "id": "childhood-onset-fluency-disorder-stuttering",
      "name": "Childhood-Onset Fluency Disorder (Stuttering)",
      "chapter": "Neurodevelopmental Disorders",
      "icd10Code": "F80.81",
      "sourcePdfPages": [
        149,
        150
      ],
      "criteriaText": "A. Disturbances in the normal fluency and time patterning of speech that are\ninappropriate for the individual\u2019s age and language skills, persist over time, and\nare characterized by frequent and marked occurrences of one (or more) of the\nfollowing:\n1. Sound and syllable repetitions.\n2. Sound prolongations of consonants as well as vowels.\n\n3.   Broken words (e.g., pauses within a word).\n4.   Audible or silent blocking (filled or unfilled pauses in speech).\n5.   Circumlocutions (word substitutions to avoid problematic words).\n6.   Words produced with an excess of physical tension.\n7.   Monosyllabic whole-word repetitions (e.g., \u201CI-I-I-I see him\u201D).\nB. The disturbance causes anxiety about speaking or limitations in effective\ncommunication, social participation, or academic or occupational performance,\nindividually or in any combination.\nC. The onset of symptoms is in the early developmental period. (Note: Later-onset\ncases are diagnosed as F98.5 adult-onset fluency disorder.)\nD. The disturbance is not attributable to a speech-motor or sensory deficit,\ndysfluency associated with neurological insult (e.g., stroke, tumor, trauma), or\nanother medical condition and is not better explained by another mental\ndisorder."
    },
    {
      "id": "social-pragmatic-communication-disorder",
      "name": "Social (Pragmatic) Communication Disorder",
      "chapter": "Neurodevelopmental Disorders",
      "icd10Code": "F80.82",
      "sourcePdfPages": [
        151,
        153
      ],
      "criteriaText": "A. Persistent difficulties in the social use of verbal and nonverbal communication as\nmanifested by all of the following:\n1. Deficits in using communication for social purposes, such as greeting and\nsharing information, in a manner that is appropriate for the social context.\n2. Impairment of the ability to change communication to match context or the\nneeds of the listener, such as speaking differently in a classroom than on a\nplayground, talking differently to a child than to an adult, and avoiding use of\noverly formal language.\n3. Difficulties following rules for conversation and storytelling, such as taking\nturns in conversation, rephrasing when misunderstood, and knowing how to\nuse verbal and nonverbal signals to regulate interaction.\n4. Difficulties understanding what is not explicitly stated (e.g., making\ninferences) and nonliteral or ambiguous meanings of language (e.g., idioms,\nhumor, metaphors, multiple meanings that depend on the context for\ninterpretation).\nB. The deficits result in functional limitations in effective communication, social\nparticipation, social relationships, academic achievement, or occupational\nperformance, individually or in combination.\nC. The onset of the symptoms is in the early developmental period (but deficits may\nnot become fully manifest until social communication demands exceed limited\ncapacities).\nD. The symptoms are not attributable to another medical or neurological condition\nor to low abilities in the domains of word structure and grammar, and are not\nbetter explained by autism spectrum disorder, intellectual developmental\ndisorder (intellectual disability), global developmental delay, or another mental\ndisorder."
    },
    {
      "id": "autism-spectrum-disorder",
      "name": "Autism Spectrum Disorder",
      "chapter": "Neurodevelopmental Disorders",
      "icd10Code": "F84.0",
      "sourcePdfPages": [
        154,
        167
      ],
      "criteriaText": "A. Persistent deficits in social communication and social interaction across multiple\ncontexts, as manifested by all of the following, currently or by history (examples\nare illustrative, not exhaustive; see text):\n1. Deficits in social-emotional reciprocity, ranging, for example, from abnormal\nsocial approach and failure of normal back-and-forth conversation; to reduced\nsharing of interests, emotions, or affect; to failure to initiate or respond to\nsocial interactions.\n2. Deficits in nonverbal communicative behaviors used for social interaction,\nranging, for example, from poorly integrated verbal and nonverbal\ncommunication; to abnormalities in eye contact and body language or deficits\nin understanding and use of gestures; to a total lack of facial expressions and\nnonverbal communication.\n3. Deficits in developing, maintaining, and understanding relationships, ranging,\nfor example, from difficulties adjusting behavior to suit various social contexts;\nto difficulties in sharing imaginative play or in making friends; to absence of\ninterest in peers.\nB. Restricted, repetitive patterns of behavior, interests, or activities, as manifested\nby at least two of the following, currently or by history (examples are illustrative,\nnot exhaustive; see text):\n1. Stereotyped or repetitive motor movements, use of objects, or speech (e.g.,\nsimple motor stereotypies, lining up toys or flipping objects, echolalia,\nidiosyncratic phrases).\n\n2. Insistence on sameness, inflexible adherence to routines, or ritualized\npatterns of verbal or nonverbal behavior (e.g., extreme distress at small\nchanges, difficulties with transitions, rigid thinking patterns, greeting rituals,\nneed to take same route or eat same food every day).\n3. Highly restricted, fixated interests that are abnormal in intensity or focus (e.g.,\nstrong attachment to or preoccupation with unusual objects, excessively\ncircumscribed or perseverative interests).\n4. Hyper- or hyporeactivity to sensory input or unusual interest in sensory\naspects of the environment (e.g., apparent indifference to pain/temperature,\nadverse response to specific sounds or textures, excessive smelling or\ntouching of objects, visual fascination with lights or movement).\nC. Symptoms must be present in the early developmental period (but may not\nbecome fully manifest until social demands exceed limited capacities, or may be\nmasked by learned strategies in later life).\nD. Symptoms cause clinically significant impairment in social, occupational, or other\nimportant areas of current functioning.\nE. These disturbances are not better explained by intellectual developmental\ndisorder (intellectual disability) or global developmental delay. Intellectual\ndevelopmental disorder and autism spectrum disorder frequently co-occur; to\nmake comorbid diagnoses of autism spectrum disorder and intellectual\ndevelopmental disorder, social communication should be below that expected for\ngeneral developmental level.\nNote: Individuals with a well-established DSM-IV diagnosis of autistic disorder,\nAsperger\u2019s disorder, or pervasive developmental disorder not otherwise specified\nshould be given the diagnosis of autism spectrum disorder. Individuals who have\nmarked deficits in social communication, but whose symptoms do not otherwise\nmeet criteria for autism spectrum disorder, should be evaluated for social\n(pragmatic) communication disorder.\nSpecify current severity based on social communication impairments and restricted,\nrepetitive patterns of behavior (see Table 2):\nRequiring very substantial support\nRequiring substantial support\nRequiring support\nSpecify if:\nWith or without accompanying intellectual impairment\nWith or without accompanying language impairment\nSpecify if:\nAssociated with a known genetic or other medical condition or\nenvironmental factor (Coding note: Use additional code to identify the\nassociated genetic or other medical condition.)\nAssociated with a neurodevelopmental, mental, or behavioral problem\nSpecify if:\nWith catatonia (refer to the criteria for catatonia associated with another mental\ndisorder, p. 135, for definition) (Coding note: Use additional code F06.1\ncatatonia associated with autism spectrum disorder to indicate the presence of\nthe comorbid catatonia.)\n\nTABLE 2 Severity levels for autism spectrum disorder (examples of level of\nsupport needs)\nSeverity level                Social communication                                Restricted, repetitive behaviors\n\nLevel 3                       Severe deficits in verbal and nonverbal social      Inflexibility of behavior, extreme difficulty\n\u201CRequiring very substantial     communication skills cause severe impairments        coping with change, or other\nsupport\u201D                      in functioning, very limited initiation of social    restricted/repetitive behaviors markedly\ninteractions, and minimal response to social         interfere with functioning in all spheres.\novertures from others. For example, a person         Great distress/difficulty changing focus or\nwith few words of intelligible speech who rarely action.\ninitiates interaction and, when he or she does,\nmakes unusual approaches to meet needs only\nand responds to only very direct social\napproaches.\nLevel 2                       Marked deficits in verbal and nonverbal social     Inflexibility of behavior, difficulty coping\n\u201CRequiring substantial         communication skills; social impairments             with change, or other restricted/repetitive\nsupport\u201D                     apparent even with supports in place; limited        behaviors appear frequently enough to be\ninitiation of social interactions; and reduced or    obvious to the casual observer and\nabnormal responses to social overtures from          interfere with functioning in a variety of\nothers. For example, a person who speaks             contexts. Distress and/or difficulty\nsimple sentences, whose interaction is limited to changing focus or action.\nnarrow special interests, and who has markedly\nodd nonverbal communication.\nLevel 1                 Without supports in place, deficits in social        Inflexibility of behavior causes significant\n\u201CRequiring support\u201D      communication cause noticeable impairments.            interference with functioning in one or\nDifficulty initiating social interactions, and clear more contexts. Difficulty switching\nexamples of atypical or unsuccessful responses         between activities. Problems of\nto social overtures of others. May appear to           organization and planning hamper\nhave decreased interest in social interactions.        independence.\nFor example, a person who is able to speak in\nfull sentences and engages in communication\nbut whose to-and-fro conversation with others\nfails, and whose attempts to make friends are\nodd and typically unsuccessful."
    },
    {
      "id": "attention-deficit-hyperactivity-disorder",
      "name": "Attention-Deficit/Hyperactivity Disorder",
      "chapter": "Neurodevelopmental Disorders",
      "sourcePdfPages": [
        168,
        177
      ],
      "criteriaText": "A. A persistent pattern of inattention and/or hyperactivity-impulsivity that interferes\nwith functioning or development, as characterized by (1) and/or (2):\n1. Inattention: Six (or more) of the following symptoms have persisted for at\nleast 6 months to a degree that is inconsistent with developmental level and\nthat negatively impacts directly on social and academic/occupational\nactivities:\nNote: The symptoms are not solely a manifestation of oppositional behavior,\ndefiance, hostility, or failure to understand tasks or instructions. For older\nadolescents and adults (age 17 and older), at least five symptoms are\nrequired.\na. Often fails to give close attention to details or makes careless mistakes in\nschoolwork, at work, or during other activities (e.g., overlooks or misses\ndetails, work is inaccurate).\nb. Often has difficulty sustaining attention in tasks or play activities (e.g., has\ndifficulty remaining focused during lectures, conversations, or lengthy\nreading).\nc. Often does not seem to listen when spoken to directly (e.g., mind seems\nelsewhere, even in the absence of any obvious distraction).\nd. Often does not follow through on instructions and fails to finish\nschoolwork, chores, or duties in the workplace (e.g., starts tasks but\nquickly loses focus and is easily sidetracked).\ne. Often has difficulty organizing tasks and activities (e.g., difficulty managing\nsequential tasks; difficulty keeping materials and belongings in order;\nmessy, disorganized work; has poor time management; fails to meet\ndeadlines).\nf. Often avoids, dislikes, or is reluctant to engage in tasks that require\nsustained mental effort (e.g., schoolwork or homework; for older\nadolescents and adults, preparing reports, completing forms, reviewing\nlengthy papers).\ng. Often loses things necessary for tasks or activities (e.g., school materials,\npencils, books, tools, wallets, keys, paperwork, eyeglasses, mobile\ntelephones).\n\nh. Is often easily distracted by extraneous stimuli (for older adolescents and\nadults, may include unrelated thoughts).\ni. Is often forgetful in daily activities (e.g., doing chores, running errands; for\nolder adolescents and adults, returning calls, paying bills, keeping\nappointments).\n2. Hyperactivity and impulsivity: Six (or more) of the following symptoms\nhave persisted for at least 6 months to a degree that is inconsistent with\ndevelopmental level and that negatively impacts directly on social and\nacademic/occupational activities:\nNote: The symptoms are not solely a manifestation of oppositional behavior,\ndefiance, hostility, or a failure to understand tasks or instructions. For older\nadolescents and adults (age 17 and older), at least five symptoms are\nrequired.\na. Often fidgets with or taps hands or feet or squirms in seat.\nb. Often leaves seat in situations when remaining seated is expected (e.g.,\nleaves his or her place in the classroom, in the office or other workplace,\nor in other situations that require remaining in place).\nc. Often runs about or climbs in situations where it is inappropriate. (Note: In\nadolescents or adults, may be limited to feeling restless.)\nd. Often unable to play or engage in leisure activities quietly.\ne. Is often \u201Con the go,\u201D acting as if \u201Cdriven by a motor\u201D (e.g., is unable to be or\nuncomfortable being still for extended time, as in restaurants, meetings;\nmay be experienced by others as being restless or difficult to keep up\nwith).\nf. Often talks excessively.\ng. Often blurts out an answer before a question has been completed (e.g.,\ncompletes people\u2019s sentences; cannot wait for turn in conversation).\nh. Often has difficulty waiting his or her turn (e.g., while waiting in line).\ni. Often interrupts or intrudes on others (e.g., butts into conversations,\ngames, or activities; may start using other people\u2019s things without asking\nor receiving permission; for adolescents and adults, may intrude into or\ntake over what others are doing).\nB. Several inattentive or hyperactive-impulsive symptoms were present prior to age\n12 years.\nC. Several inattentive or hyperactive-impulsive symptoms are present in two or\nmore settings (e.g., at home, school, or work; with friends or relatives; in other\nactivities).\nD. There is clear evidence that the symptoms interfere with, or reduce the quality of,\nsocial, academic, or occupational functioning.\nE. The symptoms do not occur exclusively during the course of schizophrenia or\nanother psychotic disorder and are not better explained by another mental\ndisorder (e.g., mood disorder, anxiety disorder, dissociative disorder, personality\ndisorder, substance intoxication or withdrawal).\nSpecify whether:\nF90.2 Combined presentation: If both Criterion A1 (inattention) and Criterion\nA2 (hyperactivity-impulsivity) are met for the past 6 months.\nF90.0 Predominantly inattentive presentation: If Criterion A1 (inattention) is\nmet but Criterion A2 (hyperactivity-impulsivity) is not met for the past 6 months.\nF90.1 Predominantly hyperactive/impulsive presentation: If Criterion A2\n(hyperactivity-impulsivity) is met and Criterion A1 (inattention) is not met for the\npast 6 months.\nSpecify if:\nIn partial remission: When full criteria were previously met, fewer than the full\ncriteria have been met for the past 6 months, and the symptoms still result in\nimpairment in social, academic, or occupational functioning.\n\nSpecify current severity:\nMild: Few, if any, symptoms in excess of those required to make the diagnosis\nare present, and symptoms result in no more than minor impairments in social or\noccupational functioning.\nModerate: Symptoms or functional impairment between \u201Cmild\u201D and \u201Csevere\u201D are\npresent.\nSevere: Many symptoms in excess of those required to make the diagnosis, or\nseveral symptoms that are particularly severe, are present, or the symptoms\nresult in marked impairment in social or occupational functioning."
    },
    {
      "id": "specific-learning-disorder",
      "name": "Specific Learning Disorder",
      "chapter": "Neurodevelopmental Disorders",
      "sourcePdfPages": [
        178,
        188
      ],
      "criteriaText": "A. Difficulties learning and using academic skills, as indicated by the presence of at\nleast one of the following symptoms that have persisted for at least 6 months,\ndespite the provision of interventions that target those difficulties:\n1. Inaccurate or slow and effortful word reading (e.g., reads single words aloud\nincorrectly or slowly and hesitantly, frequently guesses words, has difficulty\nsounding out words).\n2. Difficulty understanding the meaning of what is read (e.g., may read text\naccurately but not understand the sequence, relationships, inferences, or\ndeeper meanings of what is read).\n3. Difficulties with spelling (e.g., may add, omit, or substitute vowels or\nconsonants).\n\n4. Difficulties with written expression (e.g., makes multiple grammatical or\npunctuation errors within sentences; employs poor paragraph organization;\nwritten expression of ideas lacks clarity).\n5. Difficulties mastering number sense, number facts, or calculation (e.g., has\npoor understanding of numbers, their magnitude, and relationships; counts on\nfingers to add single-digit numbers instead of recalling the math fact as peers\ndo; gets lost in the midst of arithmetic computation and may switch\nprocedures).\n6. Difficulties with mathematical reasoning (e.g., has severe difficulty applying\nmathematical concepts, facts, or procedures to solve quantitative problems).\nB. The affected academic skills are substantially and quantifiably below those\nexpected for the individual\u2019s chronological age, and cause significant\ninterference with academic or occupational performance, or with activities of\ndaily living, as confirmed by individually administered standardized achievement\nmeasures and comprehensive clinical assessment. For individuals age 17 years\nand older, a documented history of impairing learning difficulties may be\nsubstituted for the standardized assessment.\nC. The learning difficulties begin during school-age years but may not become fully\nmanifest until the demands for those affected academic skills exceed the\nindividual\u2019s limited capacities (e.g., as in timed tests, reading or writing lengthy\ncomplex reports for a tight deadline, excessively heavy academic loads).\nD. The learning difficulties are not better accounted for by intellectual disabilities,\nuncorrected visual or auditory acuity, other mental or neurological disorders,\npsychosocial adversity, lack of proficiency in the language of academic\ninstruction, or inadequate educational instruction.\nNote: The four diagnostic criteria are to be met based on a clinical synthesis of the\nindividual\u2019s history (developmental, medical, family, educational), school reports, and\npsychoeducational assessment.\nCoding note: Specify all academic domains and subskills that are impaired. When\nmore than one domain is impaired, each one should be coded individually according\nto the following specifiers.\nSpecify if:\nF81.0 With impairment in reading:\nWord reading accuracy\nReading rate or fluency\nReading comprehension\n\nNote: Dyslexia is an alternative term used to refer to a pattern of learning\ndifficulties characterized by problems with accurate or fluent word recognition,\npoor decoding, and poor spelling abilities. If dyslexia is used to specify this\nparticular pattern of difficulties, it is important also to specify any additional\ndifficulties that are present, such as difficulties with reading comprehension or\nmath reasoning.\nF81.81 With impairment in written expression:\nSpelling accuracy\nGrammar and punctuation accuracy\nClarity or organization of written expression\nF81.2 With impairment in mathematics:\nNumber sense\nMemorization of arithmetic facts\nAccurate or fluent calculation\nAccurate math reasoning\nNote: Dyscalculia is an alternative term used to refer to a pattern of difficulties\ncharacterized by problems processing numerical information, learning\narithmetic facts, and performing accurate or fluent calculations. If dyscalculia is\nused to specify this particular pattern of mathematic difficulties, it is important\nalso to specify any additional difficulties that are present, such as difficulties\nwith math reasoning or word reasoning accuracy.\nSpecify current severity:\nMild: Some difficulties learning skills in one or two academic domains, but of\nmild enough severity that the individual may be able to compensate or function\nwell when provided with appropriate accommodations or support services,\nespecially during the school years.\nModerate: Marked difficulties learning skills in one or more academic domains,\nso that the individual is unlikely to become proficient without some intervals of\nintensive and specialized teaching during the school years. Some\naccommodations or supportive services at least part of the day at school, in the\nworkplace, or at home may be needed to complete activities accurately and\nefficiently.\nSevere: Severe difficulties learning skills, affecting several academic domains,\nso that the individual is unlikely to learn those skills without ongoing intensive\nindividualized and specialized teaching for most of the school years. Even with\nan array of appropriate accommodations or services at home, at school, or in the\nworkplace, the individual may not be able to complete all activities efficiently."
    },
    {
      "id": "developmental-coordination-disorder",
      "name": "Developmental Coordination Disorder",
      "chapter": "Neurodevelopmental Disorders",
      "icd10Code": "F82",
      "sourcePdfPages": [
        189,
        192
      ],
      "criteriaText": "A. The acquisition and execution of coordinated motor skills is substantially below\nthat expected given the individual\u2019s chronological age and opportunity for skill\nlearning and use. Difficulties are manifested as clumsiness (e.g., dropping or\nbumping into\n\nobjects) as well as slowness and inaccuracy of performance of motor skills (e.g.,\ncatching an object, using scissors or cutlery, handwriting, riding a bike, or\nparticipating in sports).\nB. The motor skills deficit in Criterion A significantly and persistently interferes with\nactivities of daily living appropriate to chronological age (e.g., self-care and self-\nmaintenance) and impacts academic/school productivity, prevocational and\nvocational activities, leisure, and play.\nC. Onset of symptoms is in the early developmental period.\nD. The motor skills deficits are not better explained by intellectual developmental\ndisorder (intellectual disability) or visual impairment and are not attributable to a\nneurological condition affecting movement (e.g., cerebral palsy, muscular\ndystrophy, degenerative disorder)."
    },
    {
      "id": "stereotypic-movement-disorder",
      "name": "Stereotypic Movement Disorder",
      "chapter": "Neurodevelopmental Disorders",
      "icd10Code": "F98.4",
      "sourcePdfPages": [
        193,
        197
      ],
      "criteriaText": "A. Repetitive, seemingly driven, and apparently purposeless motor behavior (e.g.,\nhand shaking or waving, body rocking, head banging, self-biting, hitting own\nbody).\nB. The repetitive motor behavior interferes with social, academic, or other activities\nand may result in self-injury.\nC. Onset is in the early developmental period.\nD. The repetitive motor behavior is not attributable to the physiological effects of a\nsubstance or neurological condition and is not better explained by another\nneurodevelopmental or mental disorder (e.g., trichotillomania [hair-pulling\ndisorder], obsessive-compulsive disorder).\nSpecify if:\nWith self-injurious behavior (or behavior that would result in an injury if\npreventive measures were not used)\nWithout self-injurious behavior\nSpecify if:\nAssociated with a known genetic or other medical condition,\nneurodevelopmental disorder, or environmental factor (e.g., Lesch-Nyhan\nsyndrome, intellectual developmental disorder [intellectual disability], intrauterine\nalcohol exposure)\nCoding note: Use additional code to identify the associated genetic or other\nmedical condition, neurodevelopmental disorder, or environmental factor.\nSpecify current severity:\nMild: Symptoms are easily suppressed by sensory stimulus or distraction.\nModerate: Symptoms require explicit protective measures and behavioral\nmodification.\nSevere: Continuous monitoring and protective measures are required to prevent\nserious injury."
    },
    {
      "id": "tourettes-disorder",
      "name": "Tourette\u2019s Disorder",
      "chapter": "Neurodevelopmental Disorders",
      "icd10Code": "F95.2",
      "sourcePdfPages": [
        198,
        211
      ],
      "sharedSectionTitle": "Tic Disorders",
      "criteriaText": "Note: A tic is a sudden, rapid, recurrent, nonrhythmic motor movement or\nvocalization.\nA. Both multiple motor and one or more vocal tics have been present at\nsome time during the illness, although not necessarily concurrently.\nB. The tics may wax and wane in frequency but have persisted for more than 1 year\nsince first tic onset.\nC. Onset is before age 18 years.\nD. The disturbance is not attributable to the physiological effects of a substance\n(e.g., cocaine) or another medical condition (e.g., Huntington\u2019s disease, postviral\nencephalitis)."
    },
    {
      "id": "persistent-chronic-motor-or-vocal-tic-disorder",
      "name": "Persistent (Chronic) Motor or Vocal Tic Disorder",
      "chapter": "Neurodevelopmental Disorders",
      "icd10Code": "F95.1",
      "sourcePdfPages": [
        198,
        211
      ],
      "sharedSectionTitle": "Tic Disorders",
      "criteriaText": "Note: A tic is a sudden, rapid, recurrent, nonrhythmic motor movement or\nvocalization.\nA. Single or multiple motor or vocal tics have been present during the\nillness, but not both motor and vocal.\nB. The tics may wax and wane in frequency but have persisted for more than 1 year\nsince first tic onset.\nC. Onset is before age 18 years.\nD. The disturbance is not attributable to the physiological effects of a substance\n(e.g., cocaine) or another medical condition (e.g., Huntington\u2019s disease, postviral\nencephalitis).\nE. Criteria have never been met for Tourette\u2019s disorder.\nSpecify if:\nWith motor tics only\nWith vocal tics only"
    },
    {
      "id": "provisional-tic-disorder",
      "name": "Provisional Tic Disorder",
      "chapter": "Neurodevelopmental Disorders",
      "icd10Code": "F95.0",
      "sourcePdfPages": [
        198,
        211
      ],
      "sharedSectionTitle": "Tic Disorders",
      "criteriaText": "Note: A tic is a sudden, rapid, recurrent, nonrhythmic motor movement or\nvocalization.\nA. Single or multiple motor and/or vocal tics.\nB. The tics have been present for less than 1 year since first tic onset.\nC. Onset is before age 18 years.\nD. The disturbance is not attributable to the physiological effects of a substance\n(e.g., cocaine) or another medical condition (e.g., Huntington\u2019s disease, postviral\nencephalitis).\nE. Criteria have never been met for Tourette\u2019s disorder or persistent (chronic) motor\nor vocal tic disorder."
    },
    {
      "id": "delusional-disorder",
      "name": "Delusional Disorder",
      "chapter": "Schizophrenia Spectrum and Other Psychotic Disorders",
      "icd10Code": "F22",
      "sourcePdfPages": [
        212,
        216
      ],
      "criteriaText": "A. The presence of one (or more) delusions with a duration of 1 month or longer.\nB. Criterion A for schizophrenia has never been met.\nNote: Hallucinations, if present, are not prominent and are related to the\ndelusional theme (e.g., the sensation of being infested with insects associated\nwith delusions of infestation).\n\nC. Apart from the impact of the delusion(s) or its ramifications, functioning is not\nmarkedly impaired, and behavior is not obviously bizarre or odd.\nD. If manic or major depressive episodes have occurred, these have been brief\nrelative to the duration of the delusional periods.\nE. The disturbance is not attributable to the physiological effects of a substance or\nanother medical condition and is not better explained by another mental\ndisorder, such as body dysmorphic disorder or obsessive-compulsive disorder.\nSpecify whether:\nErotomanic type: This subtype applies when the central theme of the delusion\nis that another person is in love with the individual.\nGrandiose type: This subtype applies when the central theme of the delusion is\nthe conviction of having some great (but unrecognized) talent or insight or having\nmade some important discovery.\nJealous type: This subtype applies when the central theme of the individual\u2019s\ndelusion is that his or her spouse or lover is unfaithful.\nPersecutory type: This subtype applies when the central theme of the delusion\ninvolves the individual\u2019s belief that he or she is being conspired against, cheated,\nspied on, followed, poisoned or drugged, maliciously maligned, harassed, or\nobstructed in the pursuit of long-term goals.\nSomatic type: This subtype applies when the central theme of the delusion\ninvolves bodily functions or sensations.\nMixed type: This subtype applies when no one delusional theme predominates.\nUnspecified type: This subtype applies when the dominant delusional belief\ncannot be clearly determined or is not described in the specific types (e.g.,\nreferential delusions without a prominent persecutory or grandiose component).\nSpecify if:\nWith bizarre content: Delusions are deemed bizarre if they are clearly\nimplausible, not understandable, and not derived from ordinary life experiences\n(e.g., an individual\u2019s belief that a stranger has removed his or her internal organs\nand replaced them with someone else\u2019s organs without leaving any wounds or\nscars).\nSpecify if:\nThe following course specifiers are only to be used after a 1-year duration of the\ndisorder:\nFirst episode, currently in acute episode: First manifestation of the disorder\nmeeting the defining diagnostic symptom and time criteria. An acute episode is a\ntime period in which the symptom criteria are fulfilled.\nFirst episode, currently in partial remission: Partial remission is a time period\nduring which an improvement after a previous episode is maintained and in\nwhich the defining criteria of the disorder are only partially fulfilled.\nFirst episode, currently in full remission: Full remission is a period of time\nafter a previous episode during which no disorder-specific symptoms are\npresent.\nMultiple episodes, currently in acute episode\nMultiple episodes, currently in partial remission\nMultiple episodes, currently in full remission\nContinuous: Symptoms fulfilling the diagnostic symptom criteria of the disorder\nare remaining for the majority of the illness course, with subthreshold symptom\nperiods being very brief relative to the overall course.\nUnspecified\nSpecify current severity:\nSeverity is rated by a quantitative assessment of the primary symptoms of\npsychosis, including delusions, hallucinations, disorganized speech, abnormal\npsychomotor\n\nbehavior, and negative symptoms. Each of these symptoms may be rated for its\ncurrent severity (most severe in the last 7 days) on a 5-point scale ranging from\n0 (not present) to 4 (present and severe). (See Clinician-Rated Dimensions of\nPsychosis Symptom Severity in the chapter \u201CAssessment Measures.\u201D)\nNote: Diagnosis of delusional disorder can be made without using this severity\nspecifier."
    },
    {
      "id": "brief-psychotic-disorder",
      "name": "Brief Psychotic Disorder",
      "chapter": "Schizophrenia Spectrum and Other Psychotic Disorders",
      "icd10Code": "F23",
      "sourcePdfPages": [
        217,
        219
      ],
      "criteriaText": "A. Presence of one (or more) of the following symptoms. At least one of these must\nbe (1), (2), or (3):\n1.   Delusions.\n2.   Hallucinations.\n3.   Disorganized speech (e.g., frequent derailment or incoherence).\n4.   Grossly disorganized or catatonic behavior.\nNote: Do not include a symptom if it is a culturally sanctioned response.\nB. Duration of an episode of the disturbance is at least 1 day but less than 1 month,\nwith eventual full return to premorbid level of functioning.\n\nC. The disturbance is not better explained by major depressive or bipolar disorder\nwith psychotic features or another psychotic disorder such as schizophrenia or\ncatatonia, and is not attributable to the physiological effects of a substance (e.g.,\na drug of abuse, a medication) or another medical condition.\nSpecify if:\nWith marked stressor(s) (brief reactive psychosis): If symptoms occur in\nresponse to events that, singly or together, would be markedly stressful to\nalmost anyone in similar circumstances in the individual\u2019s culture.\nWithout marked stressor(s): If symptoms do not occur in response to events\nthat, singly or together, would be markedly stressful to almost anyone in similar\ncircumstances in the individual\u2019s culture.\nWith peripartum onset: If onset is during pregnancy or within 4 weeks\npostpartum.\nSpecify if:\nWith catatonia (refer to the criteria for catatonia associated with another mental\ndisorder, p. 135, for definition).\nCoding note: Use additional code F06.1 catatonia associated with brief\npsychotic disorder to indicate the presence of the comorbid catatonia.\nSpecify current severity:\nSeverity is rated by a quantitative assessment of the primary symptoms of\npsychosis, including delusions, hallucinations, disorganized speech, abnormal\npsychomotor behavior, and negative symptoms. Each of these symptoms may\nbe rated for its current severity (most severe in the last 7 days) on a 5-point\nscale ranging from 0 (not present) to 4 (present and severe). (See Clinician-\nRated Dimensions of Psychosis Symptom Severity in the chapter \u201CAssessment\nMeasures.\u201D)\nNote: Diagnosis of brief psychotic disorder can be made without using this\nseverity specifier."
    },
    {
      "id": "schizophreniform-disorder",
      "name": "Schizophreniform Disorder",
      "chapter": "Schizophrenia Spectrum and Other Psychotic Disorders",
      "icd10Code": "F20.81",
      "sourcePdfPages": [
        220,
        222
      ],
      "criteriaText": "A. Two (or more) of the following, each present for a significant portion of time\nduring a 1-month period (or less if successfully treated). At least one of these\nmust be (1), (2), or (3):\n1.   Delusions.\n2.   Hallucinations.\n3.   Disorganized speech (e.g., frequent derailment or incoherence).\n4.   Grossly disorganized or catatonic behavior.\n5.   Negative symptoms (i.e., diminished emotional expression or avolition).\nB. An episode of the disorder lasts at least 1 month but less than 6 months. When\nthe diagnosis must be made without waiting for recovery, it should be qualified\nas \u201Cprovisional.\u201D\nC. Schizoaffective disorder and depressive or bipolar disorder with psychotic\nfeatures have been ruled out because either 1) no major depressive or manic\nepisodes have occurred concurrently with the active-phase symptoms, or 2) if\nmood episodes have occurred during active-phase symptoms, they have been\npresent for a minority of the total duration of the active and residual periods of\nthe illness.\nD. The disturbance is not attributable to the physiological effects of a substance\n(e.g., a drug of abuse, a medication) or another medical condition.\nSpecify if:\nWith good prognostic features: This specifier requires the presence of at least\ntwo of the following features: onset of prominent psychotic symptoms within 4\nweeks of the first noticeable change in usual behavior or functioning; confusion\nor perplexity; good premorbid social and occupational functioning; and absence\nof blunted or flat affect.\nWithout good prognostic features: This specifier is applied if two or more of\nthe above features have not been present.\nSpecify if:\nWith catatonia (refer to the criteria for catatonia associated with another mental\ndisorder, p. 135, for definition).\n\nCoding note: Use additional code F06.1 catatonia associated with\nschizophreniform disorder to indicate the presence of the comorbid catatonia.\nSpecify current severity:\nSeverity is rated by a quantitative assessment of the primary symptoms of\npsychosis, including delusions, hallucinations, disorganized speech, abnormal\npsychomotor behavior, and negative symptoms. Each of these symptoms may\nbe rated for its current severity (most severe in the last 7 days) on a 5-point\nscale ranging from 0 (not present) to 4 (present and severe). (See Clinician-\nRated Dimensions of Psychosis Symptom Severity in the chapter \u201CAssessment\nMeasures.\u201D)\nNote: Diagnosis of schizophreniform disorder can be made without using this\nseverity specifier.\n\nNote: For additional information on Associated Features, Development and Course\n(age-related factors), Culture-Related Diagnostic Issues, Sex- and Gender-Related\nDiagnostic Issues, Differential Diagnosis, and Comorbidity, see the corresponding\nsections in Schizophrenia."
    },
    {
      "id": "schizophrenia",
      "name": "Schizophrenia",
      "chapter": "Schizophrenia Spectrum and Other Psychotic Disorders",
      "icd10Code": "F20.9",
      "sourcePdfPages": [
        223,
        231
      ],
      "criteriaText": "A. Two (or more) of the following, each present for a significant portion of time\nduring a 1-month period (or less if successfully treated). At least one of these\nmust be (1), (2), or (3):\n1. Delusions.\n2. Hallucinations.\n3. Disorganized speech (e.g., frequent derailment or incoherence).\n\n4. Grossly disorganized or catatonic behavior.\n5. Negative symptoms (i.e., diminished emotional expression or avolition).\nB. For a significant portion of the time since the onset of the disturbance, level of\nfunctioning in one or more major areas, such as work, interpersonal relations, or\nself-care, is markedly below the level achieved prior to the onset (or when the\nonset is in childhood or adolescence, there is failure to achieve expected level of\ninterpersonal, academic, or occupational functioning).\nC. Continuous signs of the disturbance persist for at least 6 months. This 6-month\nperiod must include at least 1 month of symptoms (or less if successfully treated)\nthat meet Criterion A (i.e., active-phase symptoms) and may include periods of\nprodromal or residual symptoms. During these prodromal or residual periods, the\nsigns of the disturbance may be manifested by only negative symptoms or by\ntwo or more symptoms listed in Criterion A present in an attenuated form (e.g.,\nodd beliefs, unusual perceptual experiences).\nD. Schizoaffective disorder and depressive or bipolar disorder with psychotic\nfeatures have been ruled out because either 1) no major depressive or manic\nepisodes have occurred concurrently with the active-phase symptoms, or 2) if\nmood episodes have occurred during active-phase symptoms, they have been\npresent for a minority of the total duration of the active and residual periods of\nthe illness.\nE. The disturbance is not attributable to the physiological effects of a substance\n(e.g., a drug of abuse, a medication) or another medical condition.\nF. If there is a history of autism spectrum disorder or a communication disorder of\nchildhood onset, the additional diagnosis of schizophrenia is made only if\nprominent delusions or hallucinations, in addition to the other required symptoms\nof schizophrenia, are also present for at least 1 month (or less if successfully\ntreated).\nSpecify if:\nThe following course specifiers are only to be used after a 1-year duration of the\ndisorder and if they are not in contradiction to the diagnostic course criteria.\nFirst episode, currently in acute episode: First manifestation of the disorder\nmeeting the defining diagnostic symptom and time criteria. An acute episode is a\ntime period in which the symptom criteria are fulfilled.\nFirst episode, currently in partial remission: Partial remission is a period of\ntime during which an improvement after a previous episode is maintained and in\nwhich the defining criteria of the disorder are only partially fulfilled.\nFirst episode, currently in full remission: Full remission is a period of time\nafter a previous episode during which no disorder-specific symptoms are\npresent.\nMultiple episodes, currently in acute episode: Multiple episodes may be\ndetermined after a minimum of two episodes (i.e., after a first episode, a\nremission and a minimum of one relapse).\nMultiple episodes, currently in partial remission\nMultiple episodes, currently in full remission\nContinuous: Symptoms fulfilling the diagnostic symptom criteria of the disorder\nare remaining for the majority of the illness course, with subthreshold symptom\nperiods being very brief relative to the overall course.\nUnspecified\nSpecify if:\nWith catatonia (refer to the criteria for catatonia associated with another mental\ndisorder, p. 135, for definition).\nCoding note: Use additional code F06.1 catatonia associated with\nschizophrenia to indicate the presence of the comorbid catatonia.\n\nSpecify current severity:\nSeverity is rated by a quantitative assessment of the primary symptoms of\npsychosis, including delusions, hallucinations, disorganized speech, abnormal\npsychomotor behavior, and negative symptoms. Each of these symptoms may\nbe rated for its current severity (most severe in the last 7 days) on a 5-point\nscale ranging from 0 (not present) to 4 (present and severe). (See Clinician-\nRated Dimensions of Psychosis Symptom Severity in the chapter \u201CAssessment\nMeasures.\u201D)\nNote: Diagnosis of schizophrenia can be made without using this severity\nspecifier."
    },
    {
      "id": "schizoaffective-disorder",
      "name": "Schizoaffective Disorder",
      "chapter": "Schizophrenia Spectrum and Other Psychotic Disorders",
      "sourcePdfPages": [
        232,
        237
      ],
      "criteriaText": "A. An uninterrupted period of illness during which there is a major mood episode\n(major depressive or manic) concurrent with Criterion A of schizophrenia.\nNote: The major depressive episode must include Criterion A1: Depressed\nmood.\nB. Delusions or hallucinations for 2 or more weeks in the absence of a major mood\nepisode (depressive or manic) during the lifetime duration of the illness.\nC. Symptoms that meet criteria for a major mood episode are present for the\nmajority of the total duration of the active and residual portions of the illness.\nD. The disturbance is not attributable to the effects of a substance (e.g., a drug of\nabuse, a medication) or another medical condition.\nSpecify whether:\nF25.0 Bipolar type: This subtype applies if a manic episode is part of the\npresentation. Major depressive episodes may also occur.\nF25.1 Depressive type: This subtype applies if only major depressive episodes\nare part of the presentation.\nSpecify if:\nWith catatonia (refer to the criteria for catatonia associated with another mental\ndisorder, p. 135, for definition).\nCoding note: Use additional code F06.1 catatonia associated with\nschizoaffective disorder to indicate the presence of the comorbid catatonia.\nSpecify if:\nThe following course specifiers are only to be used after a 1-year duration of the\ndisorder and if they are not in contradiction to the diagnostic course criteria.\n\nFirst episode, currently in acute episode: First manifestation of the disorder\nmeeting the defining diagnostic symptom and time criteria. An acute episode is a\ntime period in which the symptom criteria are fulfilled.\nFirst episode, currently in partial remission: Partial remission is a time period\nduring which an improvement after a previous episode is maintained and in\nwhich the defining criteria of the disorder are only partially fulfilled.\nFirst episode, currently in full remission: Full remission is a period of time\nafter a previous episode during which no disorder-specific symptoms are\npresent.\nMultiple episodes, currently in acute episode: Multiple episodes may be\ndetermined after a minimum of two episodes (i.e., after a first episode, a\nremission and a minimum of one relapse).\nMultiple episodes, currently in partial remission\nMultiple episodes, currently in full remission\nContinuous: Symptoms fulfilling the diagnostic symptom criteria of the disorder\nare remaining for the majority of the illness course, with subthreshold symptom\nperiods being very brief relative to the overall course.\nUnspecified\nSpecify current severity:\nSeverity is rated by a quantitative assessment of the primary symptoms of\npsychosis, including delusions, hallucinations, disorganized speech, abnormal\npsychomotor behavior, and negative symptoms. Each of these symptoms may\nbe rated for its current severity (most severe in the last 7 days) on a 5-point\nscale ranging from 0 (not present) to 4 (present and severe). (See Clinician-\nRated Dimensions of Psychosis Symptom Severity in the chapter \u201CAssessment\nMeasures.\u201D)\nNote: Diagnosis of schizoaffective disorder can be made without using this\nseverity specifier."
    },
    {
      "id": "substance-medication-induced-psychotic-disorder",
      "name": "Substance/Medication-Induced Psychotic Disorder",
      "chapter": "Schizophrenia Spectrum and Other Psychotic Disorders",
      "sourcePdfPages": [
        238,
        243
      ],
      "criteriaText": "A. Presence of one or both of the following symptoms:\n1. Delusions.\n2. Hallucinations.\nB. There is evidence from the history, physical examination, or laboratory findings\nof both (1) and (2):\n1. The symptoms in Criterion A developed during or soon after substance\nintoxication or withdrawal or after exposure to or withdrawal from a\nmedication.\n2. The involved substance/medication is capable of producing the symptoms in\nCriterion A.\nC. The disturbance is not better explained by a psychotic disorder that is not\nsubstance/medication-induced. Such evidence of an independent psychotic\ndisorder could include the following:\nThe symptoms preceded the onset of the substance/medication use; the\nsymptoms persist for a substantial period of time (e.g., about 1 month) after\nthe cessation of acute withdrawal or severe intoxication; or there is other\nevidence of an independent non-substance/medication-induced psychotic\ndisorder (e.g., a history of recurrent non-substance/medication-related\nepisodes).\nD. The disturbance does not occur exclusively during the course of a delirium.\nE. The disturbance causes clinically significant distress or impairment in social,\noccupational, or other important areas of functioning.\nNote: This diagnosis should be made instead of a diagnosis of substance\nintoxication or substance withdrawal only when the symptoms in Criterion A\npredominate in the clinical picture and when they are sufficiently severe to warrant\nclinical attention.\nCoding note: The ICD-10-CM codes for the [specific substance/medication]-induced\npsychotic disorders are indicated in the table below. Note that the ICD-10-CM code\ndepends on whether or not there is a comorbid substance use disorder present for\nthe same class of substance. In any case, an additional separate diagnosis of a\nsubstance use disorder is not given. If a mild substance use disorder is comorbid\nwith the substance-induced psychotic disorder, the 4th position character is \u201C1,\u201D and\nthe clinician should record \u201Cmild [substance] use disorder\u201D before the substance-\ninduced psychotic disorder (e.g., \u201Cmild cocaine use disorder with cocaine-induced\npsychotic disorder\u201D). If a moderate or severe substance use disorder is comorbid\nwith the substance-induced psychotic disorder, the 4th position character is \u201C2,\u201D and\nthe clinician should record \u201Cmoderate [substance] use disorder\u201D or \u201Csevere\n[substance] use disorder,\u201D depending on the severity of the comorbid substance use\ndisorder. If there is no comorbid substance use disorder (e.g., after a one-time heavy\nuse of the substance), then the 4th position character is \u201C9,\u201D and the clinician should\nrecord only the substance-induced psychotic disorder.\n\nICD-10-CM\nWith mild use    With moderate or     Without use\ndisorder      severe use disorder    disorder\n\nAlcohol                                  F10.159            F10.259           F10.959\nCannabis                                 F12.159            F12.259           F12.959\nPhencyclidine                            F16.159            F16.259           F16.959\nOther hallucinogen                       F16.159            F16.259           F16.959\nInhalant                                 F18.159            F18.259           F18.959\nSedative, hypnotic, or anxiolytic        F13.159            F13.259           F13.959\nAmphetamine-type substance (or other     F15.159            F15.259           F15.959\nstimulant)\nCocaine                                  F14.159            F14.259           F14.959\nOther (or unknown) substance             F19.159            F19.259           F19.959\n\nSpecify (see Table 1 in the chapter \u201CSubstance-Related and Addictive Disorders,\u201D\nwhich indicates whether \u201Cwith onset during intoxication\u201D and/or \u201Cwith onset during\nwithdrawal\u201D applies to a given substance class; or specify \u201Cwith onset after\nmedication use\u201D):\nWith onset during intoxication: If criteria are met for intoxication with the\nsubstance and the symptoms develop during intoxication.\nWith onset during withdrawal: If criteria are met for withdrawal from the\nsubstance and the symptoms develop during, or shortly after, withdrawal.\nWith onset after medication use: If symptoms developed at initiation of\nmedication, with a change in use of medication, or during withdrawal of\nmedication.\nSpecify current severity:\nSeverity is rated by a quantitative assessment of the primary symptoms of\npsychosis, including delusions, hallucinations, abnormal psychomotor behavior,\nand negative symptoms. Each of these symptoms may be rated for its current\nseverity (most severe in the last 7 days) on a 5-point scale ranging from 0 (not\npresent) to 4 (present and severe). (See Clinician-Rated Dimensions of\nPsychosis Symptom Severity in the chapter \u201CAssessment Measures.\u201D)\nNote: Diagnosis of substance/medication-induced psychotic disorder can be\nmade without using this severity specifier."
    },
    {
      "id": "psychotic-disorder-due-to-another-medical-condition",
      "name": "Psychotic Disorder Due to Another Medical Condition",
      "chapter": "Schizophrenia Spectrum and Other Psychotic Disorders",
      "sourcePdfPages": [
        244,
        249
      ],
      "criteriaText": "A. Prominent hallucinations or delusions.\nB. There is evidence from the history, physical examination, or laboratory findings\nthat the disturbance is the direct pathophysiological consequence of another\nmedical condition.\nC. The disturbance is not better explained by another mental disorder.\nD. The disturbance does not occur exclusively during the course of a delirium.\nE. The disturbance causes clinically significant distress or impairment in social,\noccupational, or other important areas of functioning.\nSpecify whether:\nCode based on predominant symptom:\nF06.2 With delusions: If delusions are the predominant symptom.\nF06.0 With hallucinations: If hallucinations are the predominant symptom.\nCoding note: Include the name of the other medical condition in the name of the\nmental disorder (e.g., F06.2 psychotic disorder due to malignant lung neoplasm, with\ndelusions). The other medical condition should be coded and listed separately\nimmediately before the psychotic disorder due to the medical condition (e.g., C34.90\nmalignant lung neoplasm; F06.2 psychotic disorder due to malignant lung neoplasm,\nwith delusions).\nSpecify current severity:\nSeverity is rated by a quantitative assessment of the primary symptoms of\npsychosis, including delusions, hallucinations, abnormal psychomotor behavior,\nand negative symptoms. Each of these symptoms may be rated for its current\nseverity (most severe in the last 7 days) on a 5-point scale ranging from 0 (not\npresent) to 4 (present and severe). (See Clinician-Rated Dimensions of\nPsychosis Symptom Severity in the chapter \u201CAssessment Measures.\u201D)\nNote: Diagnosis of psychotic disorder due to another medical condition can be\nmade without using this severity specifier."
    },
    {
      "id": "catatonic-disorder-due-to-another-medical-condition",
      "name": "Catatonic Disorder Due to Another Medical Condition",
      "chapter": "Schizophrenia Spectrum and Other Psychotic Disorders",
      "icd10Code": "F06.1",
      "sourcePdfPages": [
        250,
        254
      ],
      "criteriaText": "A. The clinical picture is dominated by three (or more) of the following symptoms:\n1.   Stupor (i.e., no psychomotor activity; not actively relating to environment).\n2.   Catalepsy (i.e., passive induction of a posture held against gravity).\n3.   Waxy flexibility (i.e., slight, even resistance to positioning by examiner).\n4.   Mutism (i.e., no, or very little, verbal response [Note: not applicable if there is\nan established aphasia]).\n5.   Negativism (i.e., opposition or no response to instructions or external stimuli).\n6.   Posturing (i.e., spontaneous and active maintenance of a posture against\ngravity).\n7.   Mannerism (i.e., odd, circumstantial caricature of normal actions).\n8.   Stereotypy (i.e., repetitive, abnormally frequent, non-goal-directed\nmovements).\n9.    Agitation, not influenced by external stimuli.\n10.    Grimacing.\n11.    Echolalia (i.e., mimicking another\u2019s speech).\n12.    Echopraxia (i.e., mimicking another\u2019s movements).\nB. There is evidence from the history, physical examination, or laboratory findings\nthat the disturbance is the direct pathophysiological consequence of another\nmedical condition.\nC. The disturbance is not better explained by another mental disorder (e.g., a manic\nepisode).\nD. The disturbance does not occur exclusively during the course of a delirium.\n\nE. The disturbance causes clinically significant distress or impairment in social,\noccupational, or other important areas of functioning.\nCoding note: Include the name of the medical condition in the name of the mental\ndisorder (e.g., F06.1 catatonic disorder due to hepatic encephalopathy). The other\nmedical condition should be coded and listed separately immediately before the\ncatatonic disorder due to the medical condition (e.g., K72.90 hepatic\nencephalopathy; F06.1 catatonic disorder due to hepatic encephalopathy)."
    },
    {
      "id": "bipolar-i-disorder",
      "name": "Bipolar I Disorder",
      "chapter": "Bipolar and Related Disorders",
      "sourcePdfPages": [
        255,
        267
      ],
      "criteriaText": "For a diagnosis of bipolar I disorder, it is necessary to meet the following criteria for\na manic episode. The manic episode may have been preceded by and may be\nfollowed by hypomanic or major depressive episodes.\n\nManic Episode\nA. A distinct period of abnormally and persistently elevated, expansive, or irritable\nmood and abnormally and persistently increased activity or energy, lasting at\nleast 1 week and present most of the day, nearly every day (or any duration if\nhospitalization is necessary).\nB. During the period of mood disturbance and increased energy or activity, three (or\nmore) of the following symptoms (four if the mood is only irritable) are present to\na significant degree and represent a noticeable change from usual behavior:\n1. Inflated self-esteem or grandiosity.\n2. Decreased need for sleep (e.g., feels rested after only 3 hours of sleep).\n3. More talkative than usual or pressure to keep talking.\n4. Flight of ideas or subjective experience that thoughts are racing.\n5. Distractibility (i.e., attention too easily drawn to unimportant or irrelevant\nexternal stimuli), as reported or observed.\n6. Increase in goal-directed activity (either socially, at work or school, or\nsexually) or psychomotor agitation (i.e., purposeless non-goal-directed\nactivity).\n7. Excessive involvement in activities that have a high potential for painful\nconsequences (e.g., engaging in unrestrained buying sprees, sexual\nindiscretions, or foolish business investments).\nC. The mood disturbance is sufficiently severe to cause marked impairment in\nsocial or occupational functioning or to necessitate hospitalization to prevent\nharm to self or others, or there are psychotic features.\nD. The episode is not attributable to the physiological effects of a substance (e.g., a\ndrug of abuse, a medication, other treatment) or another medical condition.\nNote: A full manic episode that emerges during antidepressant treatment (e.g.,\nmedication, electroconvulsive therapy) but persists at a fully syndromal level\nbeyond the physiological effect of that treatment is sufficient evidence for a\nmanic episode and, therefore, a bipolar I diagnosis.\nNote: Criteria A\u2013D constitute a manic episode. At least one lifetime manic episode is\nrequired for the diagnosis of bipolar I disorder.\nHypomanic Episode\nA. A distinct period of abnormally and persistently elevated, expansive, or irritable\nmood and abnormally and persistently increased activity or energy, lasting at\nleast 4 consecutive days and present most of the day, nearly every day.\nB. During the period of mood disturbance and increased energy and activity, three\n(or more) of the following symptoms (four if the mood is only irritable) have\npersisted, represent a noticeable change from usual behavior, and have been\npresent to a significant degree:\n1. Inflated self-esteem or grandiosity.\n2. Decreased need for sleep (e.g., feels rested after only 3 hours of sleep).\n3. More talkative than usual or pressure to keep talking.\n4. Flight of ideas or subjective experience that thoughts are racing.\n5. Distractibility (i.e., attention too easily drawn to unimportant or irrelevant\nexternal stimuli), as reported or observed.\n6. Increase in goal-directed activity (either socially, at work or school, or\nsexually) or psychomotor agitation.\n7. Excessive involvement in activities that have a high potential for painful\nconsequences (e.g., engaging in unrestrained buying sprees, sexual\nindiscretions, or foolish business investments).\n\nC. The episode is associated with an unequivocal change in functioning that is\nuncharacteristic of the individual when not symptomatic.\nD. The disturbance in mood and the change in functioning are observable by\nothers.\nE. The episode is not severe enough to cause marked impairment in social or\noccupational functioning or to necessitate hospitalization. If there are psychotic\nfeatures, the episode is, by definition, manic.\nF. The episode is not attributable to the physiological effects of a substance (e.g., a\ndrug of abuse, a medication, other treatment) or another medical condition.\nNote: A full hypomanic episode that emerges during antidepressant treatment\n(e.g., medication, electroconvulsive therapy) but persists at a fully syndromal\nlevel beyond the physiological effect of that treatment is sufficient evidence for a\nhypomanic episode diagnosis. However, caution is indicated so that one or two\nsymptoms (particularly increased irritability, edginess, or agitation following\nantidepressant use) are not taken as sufficient for diagnosis of a hypomanic\nepisode, nor necessarily indicative of a bipolar diathesis.\nNote: Criteria A\u2013F constitute a hypomanic episode. Hypomanic episodes are\ncommon in bipolar I disorder but are not required for the diagnosis of bipolar I\ndisorder.\nMajor Depressive Episode\nA. Five (or more) of the following symptoms have been present during the same 2-\nweek period and represent a change from previous functioning; at least one of\nthe symptoms is either (1) depressed mood or (2) loss of interest or pleasure.\nNote: Do not include symptoms that are clearly attributable to another medical\ncondition.\n1. Depressed mood most of the day, nearly every day, as indicated by either\nsubjective report (e.g., feels sad, empty, or hopeless) or observation made by\nothers (e.g., appears tearful). (Note: In children and adolescents, can be\nirritable mood.)\n2. Markedly diminished interest or pleasure in all, or almost all, activities most of\nthe day, nearly every day (as indicated by either subjective account or\nobservation).\n3. Significant weight loss when not dieting or weight gain (e.g., a change of\nmore than 5% of body weight in a month), or decrease or increase in appetite\nnearly every day. (Note: In children, consider failure to make expected weight\ngain.)\n4. Insomnia or hypersomnia nearly every day.\n5. Psychomotor agitation or retardation nearly every day (observable by others,\nnot merely subjective feelings of restlessness or being slowed down).\n6. Fatigue or loss of energy nearly every day.\n7. Feelings of worthlessness or excessive or inappropriate guilt (which may be\ndelusional) nearly every day (not merely self-reproach or guilt about being\nsick).\n8. Diminished ability to think or concentrate, or indecisiveness, nearly every day\n(either by subjective account or as observed by others).\n9. Recurrent thoughts of death (not just fear of dying), recurrent suicidal ideation\nwithout a specific plan, or a suicide attempt or a specific plan for committing\nsuicide.\nB. The symptoms cause clinically significant distress or impairment in social,\noccupational, or other important areas of functioning.\nC. The episode is not attributable to the physiological effects of a substance or\nanother medical condition.\nNote: Criteria A\u2013C constitute a major depressive episode. Major depressive\nepisodes are common in bipolar I disorder but are not required for the diagnosis of\nbipolar I disorder.\n\nNote: Responses to a significant loss (e.g., bereavement, financial ruin, losses from\na natural disaster, a serious medical illness or disability) may include the feelings of\nintense sadness, rumination about the loss, insomnia, poor appetite, and weight loss\nnoted in Criterion A, which may resemble a depressive episode. Although such\nsymptoms may be understandable or considered appropriate to the loss, the\npresence of a major depressive episode in addition to the normal response to a\nsignificant loss should also be carefully considered. This decision inevitably requires\nthe exercise of clinical judgment based on the individual\u2019s history and the cultural\nnorms for the expression of distress in the context of loss.1\nBipolar I Disorder\nA. Criteria have been met for at least one manic episode (Criteria A\u2013D under\n\u201CManic Episode\u201D above).\nB. At least one manic episode is not better explained by schizoaffective disorder\nand is not superimposed on schizophrenia, schizophreniform disorder,\ndelusional disorder, or other specified or unspecified schizophrenia spectrum\nand other psychotic disorder."
    },
    {
      "id": "bipolar-ii-disorder",
      "name": "Bipolar II Disorder",
      "chapter": "Bipolar and Related Disorders",
      "icd10Code": "F31.81",
      "sourcePdfPages": [
        268,
        278
      ],
      "criteriaText": "For a diagnosis of bipolar II disorder, it is necessary to meet the following criteria for\na current or past hypomanic episode and the following criteria for a current or past\nmajor depressive episode:\nHypomanic Episode\nA. A distinct period of abnormally and persistently elevated, expansive, or irritable\nmood and abnormally and persistently increased activity or energy, lasting at\nleast 4 consecutive days and present most of the day, nearly every day.\nB. During the period of mood disturbance and increased energy and activity, three\n(or more) of the following symptoms have persisted (four if the mood is only\nirritable), represent a noticeable change from usual behavior, and have been\npresent to a significant degree:\n1.   Inflated self-esteem or grandiosity.\n2.   Decreased need for sleep (e.g., feels rested after only 3 hours of sleep).\n3.   More talkative than usual or pressure to keep talking.\n4.   Flight of ideas or subjective experience that thoughts are racing.\n\n5. Distractibility (i.e., attention too easily drawn to unimportant or irrelevant\nexternal stimuli), as reported or observed.\n6. Increase in goal-directed activity (either socially, at work or school, or\nsexually) or psychomotor agitation.\n7. Excessive involvement in activities that have a high potential for painful\nconsequences (e.g., engaging in unrestrained buying sprees, sexual\nindiscretions, or foolish business investments).\nC. The episode is associated with an unequivocal change in functioning that is\nuncharacteristic of the individual when not symptomatic.\nD. The disturbance in mood and the change in functioning are observable by\nothers.\nE. The episode is not severe enough to cause marked impairment in social or\noccupational functioning or to necessitate hospitalization. If there are psychotic\nfeatures, the episode is, by definition, manic.\nF. The episode is not attributable to the physiological effects of a substance (e.g., a\ndrug of abuse, a medication, other treatment) or another medical condition.\nNote: A full hypomanic episode that emerges during antidepressant treatment\n(e.g., medication, electroconvulsive therapy) but persists at a fully syndromal\nlevel beyond the physiological effect of that treatment is sufficient evidence for a\nhypomanic episode diagnosis. However, caution is indicated so that one or two\nsymptoms (particularly increased irritability, edginess, or agitation following\nantidepressant use) are not taken as sufficient for diagnosis of a hypomanic\nepisode, nor necessarily indicative of a bipolar diathesis.\nMajor Depressive Episode\nA. Five (or more) of the following symptoms have been present during the same 2-\nweek period and represent a change from previous functioning; at least one of\nthe symptoms is either (1) depressed mood or (2) loss of interest or pleasure.\nNote: Do not include symptoms that are clearly attributable to a medical\ncondition.\n1. Depressed mood most of the day, nearly every day, as indicated by either\nsubjective report (e.g., feels sad, empty, or hopeless) or observation made by\nothers (e.g., appears tearful). (Note: In children and adolescents, can be\nirritable mood.)\n2. Markedly diminished interest or pleasure in all, or almost all, activities most of\nthe day, nearly every day (as indicated by either subjective account or\nobservation).\n3. Significant weight loss when not dieting or weight gain (e.g., a change of\nmore than 5% of body weight in a month), or decrease or increase in appetite\nnearly every day. (Note: In children, consider failure to make expected weight\ngain.)\n4.   Insomnia or hypersomnia nearly every day.\n5.   Psychomotor agitation or retardation nearly every day (observable by others,\nnot merely subjective feelings of restlessness or being slowed down).\n6.   Fatigue or loss of energy nearly every day.\n7.   Feelings of worthlessness or excessive or inappropriate guilt (which may be\ndelusional) nearly every day (not merely self-reproach or guilt about being\nsick).\n8.   Diminished ability to think or concentrate, or indecisiveness, nearly every day\n(either by subjective account or as observed by others).\n9.   Recurrent thoughts of death (not just fear of dying), recurrent suicidal ideation\nwithout a specific plan, or a suicide attempt or a specific plan for committing\nsuicide.\nB. The symptoms cause clinically significant distress or impairment in social,\noccupational, or other important areas of functioning.\nC. The episode is not attributable to the physiological effects of a substance or\nanother medical condition.\nNote: Criteria A\u2013C constitute a major depressive episode.\n\nNote: Responses to a significant loss (e.g., bereavement, financial ruin, losses from\na natural disaster, a serious medical illness or disability) may include the feelings of\nintense sadness, rumination about the loss, insomnia, poor appetite, and weight loss\nnoted in Criterion A, which may resemble a depressive episode. Although such\nsymptoms may be understandable or considered appropriate to the loss, the\npresence of a major depressive episode in addition to the normal response to a\nsignificant loss should be carefully considered. This decision inevitably requires the\nexercise of clinical judgment based on the individual\u2019s history and the cultural norms\nfor the expression of distress in the context of loss.1\nBipolar II Disorder\nA. Criteria have been met for at least one hypomanic episode (Criteria A\u2013F under\n\u201CHypomanic Episode\u201D above) and at least one major depressive episode (Criteria\nA\u2013C under \u201CMajor Depressive Episode\u201D above).\nB. There has never been a manic episode.\nC. At least one hypomanic episode and at least one major depressive episode are\nnot better explained by schizoaffective disorder and are not superimposed on\nschizophrenia, schizophreniform disorder, delusional disorder, or other specified\nor unspecified schizophrenia spectrum and other psychotic disorder.\nD. The symptoms of depression or the unpredictability caused by frequent\nalternation between periods of depression and hypomania causes clinically\nsignificant distress or impairment in social, occupational, or other important\nareas of functioning."
    },
    {
      "id": "cyclothymic-disorder",
      "name": "Cyclothymic Disorder",
      "chapter": "Bipolar and Related Disorders",
      "icd10Code": "F34.0",
      "sourcePdfPages": [
        279,
        281
      ],
      "criteriaText": "A. For at least 2 years (at least 1 year in children and adolescents) there have been\nnumerous periods with hypomanic symptoms that do not meet criteria for a\nhypomanic episode and numerous periods with depressive symptoms that do\nnot meet criteria for a major depressive episode.\nB. During the above 2-year period (1 year in children and adolescents), Criterion A\nsymptoms have been present for at least half the time and the individual has not\nbeen without the symptoms for more than 2 months at a time.\nC. Criteria for a major depressive, manic, or hypomanic episode have never been\nmet.\nD. The symptoms in Criterion A are not better explained by schizoaffective disorder,\nschizophrenia, schizophreniform disorder, delusional disorder, or other specified\nor unspecified schizophrenia spectrum and other psychotic disorder.\nE. The symptoms are not attributable to the physiological effects of a substance\n(e.g., a drug of abuse, a medication) or another medical condition (e.g.,\nhyperthyroidism).\n\nF. The symptoms cause clinically significant distress or impairment in social,\noccupational, or other important areas of functioning.\nSpecify if:\nWith anxious distress (see pp. 169\u2013170)"
    },
    {
      "id": "substance-medication-induced-bipolar-and-related-disorder",
      "name": "Substance/Medication-Induced Bipolar and Related Disorder",
      "chapter": "Bipolar and Related Disorders",
      "sourcePdfPages": [
        282,
        286
      ],
      "criteriaText": "A. A prominent and persistent disturbance in mood that predominates in the clinical\npicture and is characterized by abnormally elevated, expansive, or irritable mood\nand abnormally increased activity or energy.\nB. There is evidence from the history, physical examination, or laboratory findings\nof both (1) and (2):\n1. The symptoms in Criterion A developed during or soon after substance\nintoxication or withdrawal or after exposure to or withdrawal from a\nmedication.\n2. The involved substance/medication is capable of producing the symptoms in\nCriterion A.\nC. The disturbance is not better explained by a bipolar or related disorder that is not\nsubstance/medication-induced. Such evidence of an independent bipolar or\nrelated disorder could include the following:\nThe symptoms precede the onset of the substance/medication use; the\nsymptoms persist for a substantial period of time (e.g., about 1 month) after\nthe cessation of acute withdrawal or severe intoxication; or there is other\nevidence    suggesting     the    existence    of   an    independent      non-\nsubstance/medication-induced bipolar and related disorder (e.g., a history of\nrecurrent non-substance/medication-related episodes).\nD. The disturbance does not occur exclusively during the course of a delirium.\nE. The disturbance causes clinically significant distress or impairment in social,\noccupational, or other important areas of functioning.\nNote: This diagnosis should be made instead of a diagnosis of substance\nintoxication or substance withdrawal only when the symptoms in Criterion A\npredominate in the clinical picture and when they are sufficiently severe to warrant\nclinical attention.\nCoding note: The ICD-10-CM codes for the [specific substance/medication]-induced\nbipolar and related disorders are indicated in the table below. Note that the ICD-10-\nCM code depends on whether or not there is a comorbid substance use disorder\npresent for the same class of substance. In any case, an additional separate\ndiagnosis of a substance use disorder is not given. If a mild substance use disorder\nis comorbid with the substance-induced bipolar and related disorder, the 4th position\ncharacter is \u201C1,\u201D and the clinician should record \u201Cmild [substance] use disorder\u201D\nbefore the substance-induced bipolar and related disorder (e.g., \u201Cmild cocaine use\ndisorder with cocaine-induced bipolar and related disorder\u201D). If a moderate or severe\nsubstance use disorder is comorbid with the substance-induced bipolar and related\ndisorder, the 4th position character is \u201C2,\u201D and the clinician should record \u201Cmoderate\n[substance] use disorder\u201D or \u201Csevere [substance] use disorder,\u201D depending on the\nseverity of the comorbid substance use disorder. If there is no comorbid substance\nuse disorder (e.g., after a one-time heavy use of the substance), then the 4th\nposition character is \u201C9,\u201D and the clinician should record only the substance-induced\nbipolar and related disorder.\n\nICD-10-CM\nWith mild use    With moderate or     Without use\ndisorder      severe use disorder    disorder\nAlcohol                                    F10.14             F10.24            F10.94\nPhencyclidine                              F16.14             F16.24            F16.94\nOther hallucinogen                         F16.14             F16.24            F16.94\nSedative, hypnotic, or anxiolytic          F13.14             F13.24            F13.94\nAmphetamine-type substance (or other       F15.14             F15.24            F15.94\nstimulant)\nCocaine                                    F14.14             F14.24            F14.94\nOther (or unknown) substance               F19.14             F19.24            F19.94\n\nSpecify (see Table 1 in the chapter \u201CSubstance-Related and Addictive Disorders,\u201D\nwhich indicates whether \u201Cwith onset during intoxication\u201D and/or \u201Cwith onset during\nwithdrawal\u201D applies to a given substance class; or specify \u201Cwith onset after\nmedication use\u201D):\nWith onset during intoxication: If criteria are met for intoxication with the\nsubstance and the symptoms develop during intoxication.\nWith onset during withdrawal: If criteria are met for withdrawal from the\nsubstance and the symptoms develop during, or shortly after, withdrawal.\nWith onset after medication use: If symptoms developed at initiation of\nmedication, with a change in use of medication, or during withdrawal of\nmedication."
    },
    {
      "id": "bipolar-and-related-disorder-due-to-another-medical-condition",
      "name": "Bipolar and Related Disorder Due to Another Medical Condition",
      "chapter": "Bipolar and Related Disorders",
      "sourcePdfPages": [
        287,
        302
      ],
      "criteriaText": "A. A prominent and persistent disturbance in mood that predominates in the clinical\npicture and is characterized by abnormally elevated, expansive, or irritable mood\nand abnormally increased activity or energy.\nB. There is evidence from the history, physical examination, or laboratory findings\nthat the disturbance is the direct pathophysiological consequence of another\nmedical condition.\nC. The disturbance is not better explained by another mental disorder.\nD. The disturbance does not occur exclusively during the course of a delirium.\nE. The disturbance causes clinically significant distress or impairment in social,\noccupational, or other important areas of functioning, or necessitates\nhospitalization to prevent harm to self or others, or there are psychotic features.\nCoding note: The ICD-10-CM code depends on the specifier (see below).\nSpecify if:\nF06.33 With manic features: Full criteria are not met for a manic or hypomanic\nepisode.\nF06.33 With manic- or hypomanic-like episode: Full criteria are met except\nCriterion D for a manic episode or except Criterion F for a hypomanic episode.\nF06.34 With mixed features: Symptoms of depression are also present but do\nnot predominate in the clinical picture.\nCoding note: Include the name of the other medical condition in the name of the\nmental disorder (e.g., F06.33 bipolar disorder due to hyperthyroidism, with manic\nfeatures). The other medical condition should also be coded and listed separately\nimmediately before the bipolar and related disorder due to the medical condition\n(e.g., E05.90 hyperthyroidism; F06.33 bipolar disorder due to hyperthyroidism, with\nmanic features)."
    },
    {
      "id": "disruptive-mood-dysregulation-disorder",
      "name": "Disruptive Mood Dysregulation Disorder",
      "chapter": "Depressive Disorders",
      "icd10Code": "F34.81",
      "sourcePdfPages": [
        303,
        308
      ],
      "criteriaText": "A. Severe recurrent temper outbursts manifested verbally (e.g., verbal rages)\nand/or behaviorally (e.g., physical aggression toward people or property) that are\ngrossly out of proportion in intensity or duration to the situation or provocation.\nB. The temper outbursts are inconsistent with developmental level.\nC. The temper outbursts occur, on average, three or more times per week.\nD. The mood between temper outbursts is persistently irritable or angry most of the\nday, nearly every day, and is observable by others (e.g., parents, teachers,\npeers).\nE. Criteria A\u2013D have been present for 12 or more months. Throughout that time,\nthe individual has not had a period lasting 3 or more consecutive months without\nall of the symptoms in Criteria A\u2013D.\nF. Criteria A and D are present in at least two of three settings (i.e., at home, at\nschool, with peers) and are severe in at least one of these.\nG. The diagnosis should not be made for the first time before age 6 years or after\nage 18 years.\nH. By history or observation, the age at onset of Criteria A\u2013E is before 10 years.\nI. There has never been a distinct period lasting more than 1 day during which the\nfull symptom criteria, except duration, for a manic or hypomanic episode have\nbeen met.\nNote: Developmentally appropriate mood elevation, such as occurs in the\ncontext of a highly positive event or its anticipation, should not be considered as\na symptom of mania or hypomania.\nJ. The behaviors do not occur exclusively during an episode of major depressive\ndisorder and are not better explained by another mental disorder (e.g., autism\nspectrum disorder, posttraumatic stress disorder, separation anxiety disorder,\npersistent depressive disorder).\nNote: This diagnosis cannot coexist with oppositional defiant disorder,\nintermittent explosive disorder, or bipolar disorder, though it can coexist with\nothers, including major depressive disorder, attention-deficit/hyperactivity\ndisorder, conduct disorder, and substance use disorders. Individuals whose\nsymptoms meet criteria for both disruptive mood dysregulation disorder and\noppositional defiant disorder should only be given the diagnosis of disruptive\nmood dysregulation disorder. If an individual has ever experienced a manic or\nhypomanic episode, the diagnosis of disruptive mood dysregulation disorder\nshould not be assigned.\nK. The symptoms are not attributable to the physiological effects of a substance or\nanother medical or neurological condition."
    },
    {
      "id": "major-depressive-disorder",
      "name": "Major Depressive Disorder",
      "chapter": "Depressive Disorders",
      "sourcePdfPages": [
        309,
        319
      ],
      "criteriaText": "A. Five (or more) of the following symptoms have been present during the same 2-\nweek period and represent a change from previous functioning; at least one of\nthe symptoms is either (1) depressed mood or (2) loss of interest or pleasure.\nNote: Do not include symptoms that are clearly attributable to another medical\ncondition.\n1. Depressed mood most of the day, nearly every day, as indicated by either\nsubjective report (e.g., feels sad, empty, hopeless) or observation made by\nothers (e.g., appears tearful). (Note: In children and adolescents, can be\nirritable mood.)\n2. Markedly diminished interest or pleasure in all, or almost all, activities most of\nthe day, nearly every day (as indicated by either subjective account or\nobservation).\n3. Significant weight loss when not dieting or weight gain (e.g., a change of\nmore than 5% of body weight in a month), or decrease or increase in appetite\nnearly every day. (Note: In children, consider failure to make expected weight\ngain.)\n4. Insomnia or hypersomnia nearly every day.\n5. Psychomotor agitation or retardation nearly every day (observable by others,\nnot merely subjective feelings of restlessness or being slowed down).\n6. Fatigue or loss of energy nearly every day.\n7. Feelings of worthlessness or excessive or inappropriate guilt (which may be\ndelusional) nearly every day (not merely self-reproach or guilt about being\nsick).\n8. Diminished ability to think or concentrate, or indecisiveness, nearly every day\n(either by subjective account or as observed by others).\n9. Recurrent thoughts of death (not just fear of dying), recurrent suicidal ideation\nwithout a specific plan, or a suicide attempt or a specific plan for committing\nsuicide.\nB. The symptoms cause clinically significant distress or impairment in social,\noccupational, or other important areas of functioning.\nC. The episode is not attributable to the physiological effects of a substance or\nanother medical condition.\nNote: Criteria A\u2013C represent a major depressive episode.\nNote: Responses to a significant loss (e.g., bereavement, financial ruin, losses\nfrom a natural disaster, a serious medical illness or disability) may include the\nfeelings of intense sadness, rumination about the loss, insomnia, poor appetite,\nand weight loss noted in Criterion A, which may resemble a depressive episode.\nAlthough such symptoms may be understandable or considered appropriate to\nthe loss, the presence of a major depressive episode in addition to the normal\nresponse to a significant loss should also be carefully considered. This decision\ninevitably requires the exercise of clinical judgment based on the individual\u2019s\nhistory and the cultural norms for the expression of distress in the context of\nloss.1\nD. At least one major depressive episode is not better explained by schizoaffective\ndisorder and is not superimposed on schizophrenia, schizophreniform disorder,\ndelusional disorder, or other specified and unspecified schizophrenia spectrum\nand other psychotic disorders.\nE. There has never been a manic episode or a hypomanic episode.\nNote: This exclusion does not apply if all of the manic-like or hypomanic-like\nepisodes are substance-induced or are attributable to the physiological effects of\nanother medical condition."
    },
    {
      "id": "persistent-depressive-disorder",
      "name": "Persistent Depressive Disorder",
      "chapter": "Depressive Disorders",
      "icd10Code": "F34.1",
      "sourcePdfPages": [
        320,
        324
      ],
      "criteriaText": "This disorder represents a consolidation of DSM-IV-defined chronic major\ndepressive disorder and dysthymic disorder.\nA. Depressed mood for most of the day, for more days than not, as indicated by\neither subjective account or observation by others, for at least 2 years.\nNote: In children and adolescents, mood can be irritable and duration must be at\nleast 1 year.\nB. Presence, while depressed, of two (or more) of the following:\n1.   Poor appetite or overeating.\n2.   Insomnia or hypersomnia.\n3.   Low energy or fatigue.\n4.   Low self-esteem.\n5.   Poor concentration or difficulty making decisions.\n6.   Feelings of hopelessness.\nC. During the 2-year period (1 year for children or adolescents) of the disturbance,\nthe individual has never been without the symptoms in Criteria A and B for more\nthan 2 months at a time.\nD. Criteria for a major depressive disorder may be continuously present for 2 years.\nE. There has never been a manic episode or a hypomanic episode.\nF. The disturbance is not better explained by a persistent schizoaffective disorder,\nschizophrenia, delusional disorder, or other specified or unspecified\nschizophrenia spectrum and other psychotic disorder.\nG. The symptoms are not attributable to the physiological effects of a substance\n(e.g., a drug of abuse, a medication) or another medical condition (e.g.,\nhypothyroidism).\nH. The symptoms cause clinically significant distress or impairment in social,\noccupational, or other important areas of functioning.\nNote: If criteria are sufficient for a diagnosis of a major depressive episode at any\ntime during the 2-year period of depressed mood, then a separate diagnosis of major\ndepression should be made in addition to the diagnosis of persistent depressive\ndisorder along with the relevant specifier (e.g., with intermittent major depressive\nepisodes, with current episode).\nSpecify if:\nWith anxious distress (pp. 210\u2013211)\nWith atypical features (p. 212)\nSpecify if:\nIn partial remission (p. 214)\nIn full remission (p. 214)\nSpecify if:\nEarly onset: If onset is before age 21 years.\nLate onset: If onset is at age 21 years or older.\nSpecify if (for most recent 2 years of persistent depressive disorder):\nWith pure dysthymic syndrome: Full criteria for a major depressive episode\nhave not been met in at least the preceding 2 years.\nWith persistent major depressive episode: Full criteria for a major depressive\nepisode have been met throughout the preceding 2-year period.\n\nWith intermittent major depressive episodes, with current episode: Full\ncriteria for a major depressive episode are currently met, but there have been\nperiods of at least 8 weeks in at least the preceding 2 years with symptoms\nbelow the threshold for a full major depressive episode.\nWith intermittent major depressive episodes, without current episode: Full\ncriteria for a major depressive episode are not currently met, but there has been\none or more major depressive episodes in at least the preceding 2 years.\nSpecify current severity:\nMild (p. 214)\nModerate (p. 214)\nSevere (p. 214)"
    },
    {
      "id": "premenstrual-dysphoric-disorder",
      "name": "Premenstrual Dysphoric Disorder",
      "chapter": "Depressive Disorders",
      "icd10Code": "F32.81",
      "sourcePdfPages": [
        325,
        329
      ],
      "criteriaText": "A. In the majority of menstrual cycles, at least five symptoms must be present in the\nfinal week before the onset of menses, start to improve within a few days after\nthe onset of menses, and become minimal or absent in the week postmenses.\nB. One (or more) of the following symptoms must be present:\n1. Marked affective lability (e.g., mood swings; feeling suddenly sad or tearful, or\nincreased sensitivity to rejection).\n2. Marked irritability or anger or increased interpersonal conflicts.\n3. Marked depressed mood, feelings of hopelessness, or self-deprecating\nthoughts.\n4. Marked anxiety, tension, and/or feelings of being keyed up or on edge.\nC. One (or more) of the following symptoms must additionally be present, to reach a\ntotal of five symptoms when combined with symptoms from Criterion B above.\n1. Decreased interest in usual activities (e.g., work, school, friends, hobbies).\n2. Subjective difficulty in concentration.\n3. Lethargy, easy fatigability, or marked lack of energy.\n4. Marked change in appetite; overeating; or specific food cravings.\n5. Hypersomnia or insomnia.\n6. A sense of being overwhelmed or out of control.\n7. Physical symptoms such as breast tenderness or swelling, joint or muscle\npain, a sensation of \u201Cbloating,\u201D or weight gain.\nNote: The symptoms in Criteria A\u2013C must have been met for most menstrual\ncycles that occurred in the preceding year.\nD. The symptoms cause clinically significant distress or interference with work,\nschool, usual social activities, or relationships with others (e.g., avoidance of\nsocial activities; decreased productivity and efficiency at work, school, or home).\nE. The disturbance is not merely an exacerbation of the symptoms of another\ndisorder, such as major depressive disorder, panic disorder, persistent\ndepressive disorder, or a personality disorder (although it may co-occur with any\nof these disorders).\nF. Criterion A should be confirmed by prospective daily ratings during at least two\nsymptomatic cycles. (Note: The diagnosis may be made provisionally prior to\nthis confirmation.)\nG. The symptoms are not attributable to the physiological effects of a substance\n(e.g., a drug of abuse, a medication, other treatment) or another medical\ncondition (e.g., hyperthyroidism)."
    },
    {
      "id": "substance-medication-induced-depressive-disorder",
      "name": "Substance/Medication-Induced Depressive Disorder",
      "chapter": "Depressive Disorders",
      "sourcePdfPages": [
        330,
        335
      ],
      "criteriaText": "A. A prominent and persistent disturbance in mood that predominates in the clinical\npicture and is characterized by depressed mood or markedly diminished interest\nor pleasure in all, or almost all, activities.\nB. There is evidence from the history, physical examination, or laboratory findings\nof both (1) and (2):\n1. The symptoms in Criterion A developed during or soon after substance\nintoxication or withdrawal or after exposure to or withdrawal from a\nmedication.\n2. The involved substance/medication is capable of producing the symptoms in\nCriterion A.\nC. The disturbance is not better explained by a depressive disorder that is not\nsubstance/medication-induced. Such evidence of an independent depressive\ndisorder could include the following:\nThe symptoms preceded the onset of the substance/medication use; the\nsymptoms persist for a substantial period of time (e.g., about 1 month) after the\ncessation of acute withdrawal or severe intoxication; or there is other evidence\nsuggesting the existence of an independent non-substance/medication-induced\ndepressive disorder (e.g., a history of recurrent non-substance/medication-\nrelated episodes).\nD. The disturbance does not occur exclusively during the course of a delirium.\nE. The disturbance causes clinically significant distress or impairment in social,\noccupational, or other important areas of functioning.\nNote: This diagnosis should be made instead of a diagnosis of substance\nintoxication or substance withdrawal only when the symptoms in Criterion A\npredominate in the clinical picture and when they are sufficiently severe to warrant\nclinical attention.\nCoding note: The ICD-10-CM codes for the [specific substance/medication]-induced\ndepressive disorders are indicated in the table below. Note that the ICD-10-CM code\ndepends on whether or not there is a comorbid substance use disorder present for\nthe same class of substance. In any case, an additional separate diagnosis of a\nsubstance use disorder is not given. If a mild substance use disorder is comorbid\nwith the substance-induced depressive disorder, the 4th position character is \u201C1,\u201D\nand the clinician should record \u201Cmild [substance] use disorder\u201D before the substance-\ninduced depressive disorder (e.g., \u201Cmild cocaine use disorder with cocaine-induced\ndepressive disorder\u201D). If a moderate or severe substance use disorder is comorbid\nwith the substance-induced depressive disorder, the 4th position character is \u201C2,\u201D\nand the clinician should record \u201Cmoderate [substance] use disorder\u201D or \u201Csevere\n[substance] use disorder,\u201D depending on the severity of the comorbid substance use\ndisorder. If there is no comorbid substance use disorder (e.g., after a one-time heavy\nuse of the substance), then the 4th position character is \u201C9,\u201D and the clinician should\nrecord only the substance-induced depressive disorder.\n\nICD-10-CM\nWith moderate or\nWith mild use      severe use      Without use\ndisorder          disorder        disorder\nAlcohol                                   F10.14           F10.24           F10.94\nPhencyclidine                             F16.14           F16.24           F16.94\nOther hallucinogen                        F16.14           F16.24           F16.94\nInhalant                                  F18.14           F18.24           F18.94\nOpioid                                    F11.14           F11.24           F11.94\nSedative, hypnotic, or anxiolytic         F13.14           F13.24           F13.94\nAmphetamine-type substance (or other      F15.14           F15.24           F15.94\nstimulant)\nCocaine                                   F14.14           F14.24           F14.94\nOther (or unknown) substance              F19.14           F19.24           F19.94\n\nSpecify (see Table 1 in the chapter \u201CSubstance-Related and Addictive Disorders,\u201D\nwhich indicates whether \u201Cwith onset during intoxication\u201D and/or \u201Cwith onset during\nwithdrawal\u201D applies to a given substance class; or specify \u201Cwith onset after\nmedication use\u201D):\nWith onset during intoxication: If criteria are met for intoxication with the\nsubstance and the symptoms develop during intoxication.\nWith onset during withdrawal: If criteria are met for withdrawal from the\nsubstance and the symptoms develop during, or shortly after, withdrawal.\nWith onset after medication use: If symptoms developed at initiation of\nmedication, with a change in use of medication, or during withdrawal of\nmedication."
    },
    {
      "id": "depressive-disorder-due-to-another-medical-condition",
      "name": "Depressive Disorder Due to Another Medical Condition",
      "chapter": "Depressive Disorders",
      "sourcePdfPages": [
        336,
        351
      ],
      "criteriaText": "A. A prominent and persistent disturbance in mood that predominates in the clinical\npicture and is characterized by depressed mood or markedly diminished interest\nor pleasure in all, or almost all, activities.\nB. There is evidence from the history, physical examination, or laboratory findings\nthat the disturbance is the direct pathophysiological consequence of another\nmedical condition.\nC. The disturbance is not better explained by another mental disorder (e.g.,\nadjustment disorder, with depressed mood, in which the stressor is a serious\nmedical condition).\nD. The disturbance does not occur exclusively during the course of a delirium.\nE. The disturbance causes clinically significant distress or impairment in social,\noccupational, or other important areas of functioning.\nCoding note: The ICD-10-CM code depends on the specifier (see below).\nSpecify if:\nF06.31 With depressive features: Full criteria are not met for a major\ndepressive episode.\nF06.32 With major depressive\u2013like episode: Full criteria are met (except\nCriterion C) for a major depressive episode.\nF06.34 With mixed features: Symptoms of mania or hypomania are also\npresent but do not predominate in the clinical picture.\nCoding note: Include the name of the other medical condition in the name of the\nmental disorder (e.g., F06.31 depressive disorder due to hypothyroidism, with\ndepressive features). The other medical condition should also be coded and listed\nseparately immediately before the depressive disorder due to the medical condition\n(e.g., E03.9 hypothyroidism; F06.31 depressive disorder due to hypothyroidism,\nwith depressive features)."
    },
    {
      "id": "separation-anxiety-disorder",
      "name": "Separation Anxiety Disorder",
      "chapter": "Anxiety Disorders",
      "icd10Code": "F93.0",
      "sourcePdfPages": [
        352,
        357
      ],
      "criteriaText": "A. Developmentally inappropriate and excessive fear or anxiety concerning\nseparation from those to whom the individual is attached, as evidenced by at\nleast three of the following:\n1. Recurrent excessive distress when anticipating or experiencing separation\nfrom home or from major attachment figures.\n2. Persistent and excessive worry about losing major attachment figures or\nabout possible harm to them, such as illness, injury, disasters, or death.\n3. Persistent and excessive worry about experiencing an untoward event (e.g.,\ngetting lost, being kidnapped, having an accident, becoming ill) that causes\nseparation from a major attachment figure.\n4. Persistent reluctance or refusal to go out, away from home, to school, to\nwork, or elsewhere because of fear of separation.\n5. Persistent and excessive fear of or reluctance about being alone or without\nmajor attachment figures at home or in other settings.\n6. Persistent reluctance or refusal to sleep away from home or to go to sleep\nwithout being near a major attachment figure.\n7. Repeated nightmares involving the theme of separation.\n8. Repeated complaints of physical symptoms (e.g., headaches, stomachaches,\nnausea, vomiting) when separation from major attachment figures occurs or\nis anticipated.\nB. The fear, anxiety, or avoidance is persistent, lasting at least 4 weeks in children\nand adolescents and typically 6 months or more in adults.\nC. The disturbance causes clinically significant distress or impairment in social,\nacademic, occupational, or other important areas of functioning.\nD. The disturbance is not better explained by another mental disorder, such as\nrefusing to leave home because of excessive resistance to change in autism\nspectrum disorder; delusions or hallucinations concerning separation in\npsychotic disorders; refusal to go outside without a trusted companion in\nagoraphobia; worries about ill health or other harm befalling significant others in\ngeneralized anxiety disorder; or concerns about having an illness in illness\nanxiety disorder."
    },
    {
      "id": "selective-mutism",
      "name": "Selective Mutism",
      "chapter": "Anxiety Disorders",
      "icd10Code": "F94.0",
      "sourcePdfPages": [
        358,
        360
      ],
      "criteriaText": "A. Consistent failure to speak in specific social situations in which there is an\nexpectation for speaking (e.g., at school) despite speaking in other situations.\nB. The disturbance interferes with educational or occupational achievement or with\nsocial communication.\nC. The duration of the disturbance is at least 1 month (not limited to the first month\nof school).\nD. The failure to speak is not attributable to a lack of knowledge of, or comfort with,\nthe spoken language required in the social situation.\nE. The disturbance is not better explained by a communication disorder (e.g.,\nchildhood-onset fluency disorder) and does not occur exclusively during the\ncourse of autism spectrum disorder, schizophrenia, or another psychotic\ndisorder."
    },
    {
      "id": "specific-phobia",
      "name": "Specific Phobia",
      "chapter": "Anxiety Disorders",
      "sourcePdfPages": [
        361,
        366
      ],
      "criteriaText": "A. Marked fear or anxiety about a specific object or situation (e.g., flying, heights,\nanimals, receiving an injection, seeing blood).\nNote: In children, the fear or anxiety may be expressed by crying, tantrums,\nfreezing, or clinging.\nB. The phobic object or situation almost always provokes immediate fear or anxiety.\nC. The phobic object or situation is actively avoided or endured with intense fear or\nanxiety.\nD. The fear or anxiety is out of proportion to the actual danger posed by the specific\nobject or situation and to the sociocultural context.\nE. The fear, anxiety, or avoidance is persistent, typically lasting for 6 months or\nmore.\nF. The fear, anxiety, or avoidance causes clinically significant distress or\nimpairment in social, occupational, or other important areas of functioning.\nG. The disturbance is not better explained by the symptoms of another mental\ndisorder, including fear, anxiety, and avoidance of situations associated with\npanic-like symptoms or other incapacitating symptoms (as in agoraphobia);\nobjects or situations related to obsessions (as in obsessive-compulsive\ndisorder); reminders of traumatic events (as in posttraumatic stress disorder);\nseparation from home or attachment figures (as in separation anxiety disorder);\nor social situations (as in social anxiety disorder).\nSpecify if:\nCode based on the phobic stimulus:\nF40.218 Animal (e.g., spiders, insects, dogs).\nF40.228 Natural environment (e.g., heights, storms, water).\nF40.23x Blood-injection-injury (e.g., needles, invasive medical procedures).\n\nCoding note: Select specific ICD-10-CM code as follows: F40.230 fear of\nblood; F40.231 fear of injections and transfusions; F40.232 fear of other\nmedical care; or F40.233 fear of injury.\nF40.248 Situational (e.g., airplanes, elevators, enclosed places).\nF40.298 Other (e.g., situations that may lead to choking or vomiting; in children,\ne.g., loud sounds or costumed characters).\nCoding note: When more than one phobic stimulus is present, code all ICD-10-CM\ncodes that apply (e.g., for fear of snakes and flying, F40.218 specific phobia, animal,\nand F40.248 specific phobia, situational)."
    },
    {
      "id": "social-anxiety-disorder",
      "name": "Social Anxiety Disorder",
      "chapter": "Anxiety Disorders",
      "icd10Code": "F40.10",
      "sourcePdfPages": [
        367,
        373
      ],
      "criteriaText": "A. Marked fear or anxiety about one or more social situations in which the individual\nis exposed to possible scrutiny by others. Examples include social interactions\n(e.g., having a conversation, meeting unfamiliar people), being observed (e.g.,\neating or drinking), and performing in front of others (e.g., giving a speech).\nNote: In children, the anxiety must occur in peer settings and not just during\ninteractions with adults.\nB. The individual fears that he or she will act in a way or show anxiety symptoms\nthat will be negatively evaluated (i.e., will be humiliating or embarrassing; will\nlead to rejection or offend others).\nC. The social situations almost always provoke fear or anxiety.\nNote: In children, the fear or anxiety may be expressed by crying, tantrums,\nfreezing, clinging, shrinking, or failing to speak in social situations.\nD. The social situations are avoided or endured with intense fear or anxiety.\nE. The fear or anxiety is out of proportion to the actual threat posed by the social\nsituation and to the sociocultural context.\n\nF. The fear, anxiety, or avoidance is persistent, typically lasting for 6 months or\nmore.\nG. The fear, anxiety, or avoidance causes clinically significant distress or\nimpairment in social, occupational, or other important areas of functioning.\nH. The fear, anxiety, or avoidance is not attributable to the physiological effects of a\nsubstance (e.g., a drug of abuse, a medication) or another medical condition.\nI. The fear, anxiety, or avoidance is not better explained by the symptoms of\nanother mental disorder, such as panic disorder, body dysmorphic disorder, or\nautism spectrum disorder.\nJ. If another medical condition (e.g., Parkinson\u2019s disease, obesity, disfigurement\nfrom burns or injury) is present, the fear, anxiety, or avoidance is clearly\nunrelated or is excessive.\nSpecify if:\nPerformance only: If the fear is restricted to speaking or performing in public."
    },
    {
      "id": "panic-disorder",
      "name": "Panic Disorder",
      "chapter": "Anxiety Disorders",
      "icd10Code": "F41.0",
      "sourcePdfPages": [
        374,
        386
      ],
      "criteriaText": "A. Recurrent unexpected panic attacks. A panic attack is an abrupt surge of intense\nfear or intense discomfort that reaches a peak within minutes, and during which\ntime four (or more) of the following symptoms occur:\nNote: The abrupt surge can occur from a calm state or an anxious state.\n1. Palpitations, pounding heart, or accelerated heart rate.\n2.   Sweating.\n3.   Trembling or shaking.\n4.   Sensations of shortness of breath or smothering.\n5.   Feelings of choking.\n6.   Chest pain or discomfort.\n7.   Nausea or abdominal distress.\n8.   Feeling dizzy, unsteady, light-headed, or faint.\n9.   Chills or heat sensations.\n\n10. Paresthesias (numbness or tingling sensations).\n11. Derealization (feelings of unreality) or depersonalization (being detached from\noneself).\n12. Fear of losing control or \u201Cgoing crazy.\u201D\n13. Fear of dying.\nNote: Culture-specific symptoms (e.g., tinnitus, neck soreness, headache,\nuncontrollable screaming or crying) may be seen. Such symptoms should not\ncount as one of the four required symptoms.\nB. At least one of the attacks has been followed by 1 month (or more) of one or\nboth of the following:\n1. Persistent concern or worry about additional panic attacks or their\nconsequences (e.g., losing control, having a heart attack, \u201Cgoing crazy\u201D).\n2. A significant maladaptive change in behavior related to the attacks (e.g.,\nbehaviors designed to avoid having panic attacks, such as avoidance of\nexercise or unfamiliar situations).\nC. The disturbance is not attributable to the physiological effects of a substance\n(e.g., a drug of abuse, a medication) or another medical condition (e.g.,\nhyperthyroidism, cardiopulmonary disorders).\nD. The disturbance is not better explained by another mental disorder (e.g., the\npanic attacks do not occur only in response to feared social situations, as in\nsocial anxiety disorder; in response to circumscribed phobic objects or situations,\nas in specific phobia; in response to obsessions, as in obsessive-compulsive\ndisorder; in response to reminders of traumatic events, as in posttraumatic stress\ndisorder; or in response to separation from attachment figures, as in separation\nanxiety disorder)."
    },
    {
      "id": "agoraphobia",
      "name": "Agoraphobia",
      "chapter": "Anxiety Disorders",
      "icd10Code": "F40.00",
      "sourcePdfPages": [
        387,
        392
      ],
      "criteriaText": "A. Marked fear or anxiety about two (or more) of the following five situations:\n1.   Using public transportation (e.g., automobiles, buses, trains, ships, planes).\n2.   Being in open spaces (e.g., parking lots, marketplaces, bridges).\n3.   Being in enclosed places (e.g., shops, theaters, cinemas).\n4.   Standing in line or being in a crowd.\n5.   Being outside of the home alone.\nB. The individual fears or avoids these situations because of thoughts that escape\nmight be difficult or help might not be available in the event of developing panic-\nlike symptoms or other incapacitating or embarrassing symptoms (e.g., fear of\nfalling in the elderly; fear of incontinence).\nC. The agoraphobic situations almost always provoke fear or anxiety.\nD. The agoraphobic situations are actively avoided, require the presence of a\ncompanion, or are endured with intense fear or anxiety.\nE. The fear or anxiety is out of proportion to the actual danger posed by the\nagoraphobic situations and to the sociocultural context.\nF. The fear, anxiety, or avoidance is persistent, typically lasting for 6 months or\nmore.\nG. The fear, anxiety, or avoidance causes clinically significant distress or\nimpairment in social, occupational, or other important areas of functioning.\nH. If another medical condition (e.g., inflammatory bowel disease, Parkinson\u2019s\ndisease) is present, the fear, anxiety, or avoidance is clearly excessive.\nI. The fear, anxiety, or avoidance is not better explained by the symptoms of\nanother mental disorder\u2014for example, the symptoms are not confined to specific\nphobia, situational type; do not involve only social situations (as in social anxiety\ndisorder); and are not related exclusively to obsessions (as in obsessive-\ncompulsive disorder), perceived defects or flaws in physical appearance (as in\nbody dysmorphic disorder), reminders of traumatic events (as in posttraumatic\nstress disorder), or fear of separation (as in separation anxiety disorder).\nNote: Agoraphobia is diagnosed irrespective of the presence of panic disorder. If an\nindividual\u2019s presentation meets criteria for panic disorder and agoraphobia, both\ndiagnoses should be assigned."
    },
    {
      "id": "generalized-anxiety-disorder",
      "name": "Generalized Anxiety Disorder",
      "chapter": "Anxiety Disorders",
      "icd10Code": "F41.1",
      "sourcePdfPages": [
        393,
        397
      ],
      "criteriaText": "A. Excessive anxiety and worry (apprehensive expectation), occurring more days\nthan not for at least 6 months, about a number of events or activities (such as\nwork or school performance).\nB. The individual finds it difficult to control the worry.\nC. The anxiety and worry are associated with three (or more) of the following six\nsymptoms (with at least some symptoms having been present for more days\nthan not for the past 6 months):\nNote: Only one item is required in children.\n1.   Restlessness or feeling keyed up or on edge.\n2.   Being easily fatigued.\n3.   Difficulty concentrating or mind going blank.\n4.   Irritability.\n5.   Muscle tension.\n6.   Sleep disturbance (difficulty falling or staying asleep, or restless, unsatisfying\nsleep).\nD. The anxiety, worry, or physical symptoms cause clinically significant distress or\nimpairment in social, occupational, or other important areas of functioning.\n\nE. The disturbance is not attributable to the physiological effects of a substance\n(e.g., a drug of abuse, a medication) or another medical condition (e.g.,\nhyperthyroidism).\nF. The disturbance is not better explained by another mental disorder (e.g., anxiety\nor worry about having panic attacks in panic disorder, negative evaluation in\nsocial anxiety disorder, contamination or other obsessions in obsessive-\ncompulsive disorder, separation from attachment figures in separation anxiety\ndisorder, reminders of traumatic events in posttraumatic stress disorder, gaining\nweight in anorexia nervosa, physical complaints in somatic symptom disorder,\nperceived appearance flaws in body dysmorphic disorder, having a serious\nillness in illness anxiety disorder, or the content of delusional beliefs in\nschizophrenia or delusional disorder)."
    },
    {
      "id": "substance-medication-induced-anxiety-disorder",
      "name": "Substance/Medication-Induced Anxiety Disorder",
      "chapter": "Anxiety Disorders",
      "sourcePdfPages": [
        398,
        401
      ],
      "criteriaText": "A. Panic attacks or anxiety is predominant in the clinical picture.\nB. There is evidence from the history, physical examination, or laboratory findings\nof both (1) and (2):\n1. The symptoms in Criterion A developed during or soon after substance\nintoxication or withdrawal or after exposure to or withdrawal from a\nmedication.\n2. The involved substance/medication is capable of producing the symptoms in\nCriterion A.\nC. The disturbance is not better explained by an anxiety disorder that is not\nsubstance/medication-induced. Such evidence of an independent anxiety\ndisorder could include the following:\nThe symptoms precede the onset of the substance/medication use; the\nsymptoms persist for a substantial period of time (e.g., about 1 month) after\nthe cessation of acute withdrawal or severe intoxication; or there is other\nevidence     suggesting      the    existence of    an    independent     non-\nsubstance/medication-induced anxiety disorder (e.g., a history of recurrent\nnon-substance/medication-related episodes).\nD. The disturbance does not occur exclusively during the course of a delirium.\nE. The disturbance causes clinically significant distress or impairment in social,\noccupational, or other important areas of functioning.\nNote: This diagnosis should be made instead of a diagnosis of substance\nintoxication or substance withdrawal only when the symptoms in Criterion A\npredominate in the clinical picture and they are sufficiently severe to warrant clinical\nattention.\nCoding note: The ICD-10-CM codes for the [specific substance/medication]-induced\nanxiety disorders are indicated in the table below. Note that the ICD-10-CM code\ndepends on whether or not there is a comorbid substance use disorder present for\nthe same class of substance. In any case, an additional separate diagnosis of a\nsubstance use disorder is not given. If a mild substance use disorder is comorbid\nwith the substance-induced anxiety disorder, the 4th position character is \u201C1,\u201D and\nthe clinician should record \u201Cmild [substance] use disorder\u201D before the substance-\ninduced anxiety disorder (e.g., \u201Cmild cocaine use disorder with cocaine-induced\nanxiety disorder\u201D). If a moderate or severe substance use disorder is comorbid with\nthe substance-induced anxiety disorder, the 4th position character is \u201C2,\u201D and the\nclinician should record \u201Cmoderate [substance] use disorder\u201D or \u201Csevere [substance]\nuse disorder,\u201D depending on the severity of the comorbid substance use disorder. If\nthere is no comorbid substance use disorder (e.g., after a one-time heavy use of the\nsubstance), then the 4th position character is \u201C9,\u201D and the clinician should record\nonly the substance-induced anxiety disorder.\n\nICD-10-CM\nWith mild use    With moderate or     Without use\ndisorder      severe use disorder    disorder\nAlcohol                                   F10.180            F10.280           F10.980\nCaffeine                                    NA                 NA              F15.980\nCannabis                                  F12.180            F12.280           F12.980\nPhencyclidine                             F16.180            F16.280           F16.980\nOther hallucinogen                        F16.180            F16.280           F16.980\nInhalant                                  F18.180            F18.280           F18.980\nOpioid                                    F11.188            F11.288           F11.988\nSedative, hypnotic, or anxiolytic         F13.180            F13.280           F13.980\nAmphetamine-type substance (or other      F15.180            F15.280           F15.980\nstimulant)\nCocaine                                   F14.180            F14.280           F14.980\nOther (or unknown) substance              F19.180            F19.280           F19.980\n\nSpecify (see Table 1 in the chapter \u201CSubstance-Related and Addictive Disorders,\u201D\nwhich indicates whether \u201Cwith onset during intoxication\u201D and/or \u201Cwith onset during\nwithdrawal\u201D applies to a given substance class; or specify \u201Cwith onset after\nmedication use\u201D):\nWith onset during intoxication: If criteria are met for intoxication with the\nsubstance and the symptoms develop during intoxication.\nWith onset during withdrawal: If criteria are met for withdrawal from the\nsubstance and the symptoms develop during, or shortly after, withdrawal.\nWith onset after medication use: If symptoms developed at initiation of\nmedication, with a change in use of medication, or during withdrawal of\nmedication."
    },
    {
      "id": "anxiety-disorder-due-to-another-medical-condition",
      "name": "Anxiety Disorder Due to Another Medical Condition",
      "chapter": "Anxiety Disorders",
      "icd10Code": "F06.4",
      "sourcePdfPages": [
        402,
        409
      ],
      "criteriaText": "A. Panic attacks or anxiety is predominant in the clinical picture.\nB. There is evidence from the history, physical examination, or laboratory findings\nthat the disturbance is the direct pathophysiological consequence of another\nmedical condition.\nC. The disturbance is not better explained by another mental disorder.\nD. The disturbance does not occur exclusively during the course of a delirium.\nE. The disturbance causes clinically significant distress or impairment in social,\noccupational, or other important areas of functioning.\nCoding note: Include the name of the other medical condition within the name of the\nmental disorder (e.g., F06.4 anxiety disorder due to pheochromocytoma). The other\n\nmedical condition should be coded and listed separately immediately before the\nanxiety disorder due to the medical condition (e.g., D35.00 pheochromocytoma;\nF06.4 anxiety disorder due to pheochromocytoma)."
    },
    {
      "id": "obsessive-compulsive-disorder",
      "name": "Obsessive-Compulsive Disorder",
      "chapter": "Obsessive-Compulsive and Related Disorders",
      "icd10Code": "F42.2",
      "sourcePdfPages": [
        410,
        417
      ],
      "criteriaText": "A. Presence of obsessions, compulsions, or both:\nObsessions are defined by (1) and (2):\n1. Recurrent and persistent thoughts, urges, or images that are experienced, at\nsome time during the disturbance, as intrusive and unwanted, and that in\nmost individuals cause marked anxiety or distress.\n2. The individual attempts to ignore or suppress such thoughts, urges, or\nimages, or to neutralize them with some other thought or action (i.e., by\nperforming a compulsion).\nCompulsions are defined by (1) and (2):\n1. Repetitive behaviors (e.g., hand washing, ordering, checking) or mental acts\n(e.g., praying, counting, repeating words silently) that the individual feels\ndriven to perform in response to an obsession or according to rules that must\nbe applied rigidly.\n2. The behaviors or mental acts are aimed at preventing or reducing anxiety or\ndistress, or preventing some dreaded event or situation; however, these\nbehaviors or mental acts are not connected in a realistic way with what they\nare designed to neutralize or prevent, or are clearly excessive.\nNote: Young children may not be able to articulate the aims of these\nbehaviors or mental acts.\nB. The obsessions or compulsions are time-consuming (e.g., take more than 1 hour\nper day) or cause clinically significant distress or impairment in social,\noccupational, or other important areas of functioning.\nC. The obsessive-compulsive symptoms are not attributable to the physiological\neffects of a substance (e.g., a drug of abuse, a medication) or another medical\ncondition.\nD. The disturbance is not better explained by the symptoms of another mental\ndisorder (e.g., excessive worries, as in generalized anxiety disorder;\npreoccupation with appearance, as in body dysmorphic disorder; difficulty\ndiscarding or parting with possessions, as in hoarding disorder; hair pulling, as in\ntrichotillomania [hair-pulling disorder]; skin picking, as in excoriation [skin-\npicking] disorder; stereotypies, as in stereotypic movement disorder; ritualized\neating behavior, as in eating disorders; preoccupation with substances or\ngambling, as in substance-related and addictive disorders; preoccupation with\nhaving an illness, as in illness anxiety disorder; sexual urges or fantasies, as in\nparaphilic disorders; impulses, as in disruptive, impulse-control, and conduct\ndisorders; guilty ruminations, as in major depressive disorder; thought insertion\nor delusional preoccupations, as in schizophrenia spectrum and other psychotic\ndisorders; or repetitive patterns of behavior, as in autism spectrum disorder).\n\nSpecify if:\nWith good or fair insight: The individual recognizes that obsessive-compulsive\ndisorder beliefs are definitely or probably not true or that they may or may not be\ntrue.\nWith poor insight: The individual thinks obsessive-compulsive disorder beliefs\nare probably true.\nWith absent insight/delusional beliefs: The individual is completely convinced\nthat obsessive-compulsive disorder beliefs are true.\nSpecify if:\nTic-related: The individual has a current or past history of a tic disorder."
    },
    {
      "id": "body-dysmorphic-disorder",
      "name": "Body Dysmorphic Disorder",
      "chapter": "Obsessive-Compulsive and Related Disorders",
      "icd10Code": "F45.22",
      "sourcePdfPages": [
        418,
        424
      ],
      "criteriaText": "A. Preoccupation with one or more perceived defects or flaws in physical\nappearance that are not observable or appear slight to others.\nB. At some point during the course of the disorder, the individual has performed\nrepetitive behaviors (e.g., mirror checking, excessive grooming, skin picking,\nreassurance seeking) or mental acts (e.g., comparing his or her appearance with\nthat of others) in response to the appearance concerns.\nC. The preoccupation causes clinically significant distress or impairment in social,\noccupational, or other important areas of functioning.\n\nD. The appearance preoccupation is not better explained by concerns with body fat\nor weight in an individual whose symptoms meet diagnostic criteria for an eating\ndisorder.\nSpecify if:\nWith muscle dysmorphia: The individual is preoccupied with the idea that his\nor her body build is too small or insufficiently muscular. This specifier is used\neven if the individual is preoccupied with other body areas, which is often the\ncase.\nSpecify if:\nIndicate degree of insight regarding body dysmorphic disorder beliefs (e.g., \u201CI look\nugly\u201D or \u201CI look deformed\u201D).\nWith good or fair insight: The individual recognizes that the body dysmorphic\ndisorder beliefs are definitely or probably not true or that they may or may not be\ntrue.\nWith poor insight: The individual thinks that the body dysmorphic disorder\nbeliefs are probably true.\nWith absent insight/delusional beliefs: The individual is completely convinced\nthat the body dysmorphic disorder beliefs are true."
    },
    {
      "id": "hoarding-disorder",
      "name": "Hoarding Disorder",
      "chapter": "Obsessive-Compulsive and Related Disorders",
      "icd10Code": "F42.3",
      "sourcePdfPages": [
        425,
        429
      ],
      "criteriaText": "A. Persistent difficulty discarding or parting with possessions, regardless of their\nactual value.\nB. This difficulty is due to a perceived need to save the items and to distress\nassociated with discarding them.\nC. The difficulty discarding possessions results in the accumulation of possessions\nthat congest and clutter active living areas and substantially compromises their\nintended use. If living areas are uncluttered, it is only because of the\ninterventions of third parties (e.g., family members, cleaners, authorities).\nD. The hoarding causes clinically significant distress or impairment in social,\noccupational, or other important areas of functioning (including maintaining a\nsafe environment for self and others).\nE. The hoarding is not attributable to another medical condition (e.g., brain injury,\ncerebrovascular disease, Prader-Willi syndrome).\nF. The hoarding is not better explained by the symptoms of another mental disorder\n(e.g., obsessions in obsessive-compulsive disorder, decreased energy in major\ndepressive disorder, delusions in schizophrenia or another psychotic disorder,\ncognitive deficits in major neurocognitive disorder, restricted interests in autism\nspectrum disorder).\nSpecify if:\nWith excessive acquisition: If difficulty discarding possessions is accompanied\nby excessive acquisition of items that are not needed or for which there is no\navailable space.\nSpecify if:\nWith good or fair insight: The individual recognizes that hoarding-related\nbeliefs and behaviors (pertaining to difficulty discarding items, clutter, or\nexcessive acquisition) are problematic.\nWith poor insight: The individual is mostly convinced that hoarding-related\nbeliefs and behaviors (pertaining to difficulty discarding items, clutter, or\nexcessive acquisition) are not problematic despite evidence to the contrary.\nWith absent insight/delusional beliefs: The individual is completely convinced\nthat hoarding-related beliefs and behaviors (pertaining to difficulty discarding\nitems, clutter, or excessive acquisition) are not problematic despite evidence to\nthe contrary."
    },
    {
      "id": "trichotillomania-hair-pulling-disorder",
      "name": "Trichotillomania (Hair-Pulling Disorder)",
      "chapter": "Obsessive-Compulsive and Related Disorders",
      "icd10Code": "F63.3",
      "sourcePdfPages": [
        430,
        432
      ],
      "criteriaText": "A. Recurrent pulling out of one\u2019s hair, resulting in hair loss.\nB. Repeated attempts to decrease or stop hair pulling.\nC. The hair pulling causes clinically significant distress or impairment in social,\noccupational, or other important areas of functioning.\nD. The hair pulling or hair loss is not attributable to another medical condition (e.g.,\na dermatological condition).\nE. The hair pulling is not better explained by the symptoms of another mental\ndisorder (e.g., attempts to improve a perceived defect or flaw in appearance in\nbody dysmorphic disorder)."
    },
    {
      "id": "excoriation-skin-picking-disorder",
      "name": "Excoriation (Skin-Picking) Disorder",
      "chapter": "Obsessive-Compulsive and Related Disorders",
      "icd10Code": "F42.4",
      "sourcePdfPages": [
        433,
        436
      ],
      "criteriaText": "A. Recurrent skin picking resulting in skin lesions.\nB. Repeated attempts to decrease or stop skin picking.\nC. The skin picking causes clinically significant distress or impairment in social,\noccupational, or other important areas of functioning.\nD. The skin picking is not attributable to the physiological effects of a substance\n(e.g., cocaine) or another medical condition (e.g., scabies).\nE. The skin picking is not better explained by symptoms of another mental disorder\n(e.g., delusions or tactile hallucinations in a psychotic disorder, attempts to\nimprove a perceived defect or flaw in appearance in body dysmorphic disorder,\nstereotypies in stereotypic movement disorder, or intention to harm oneself in\nnonsuicidal self-injury)."
    },
    {
      "id": "obsessive-compulsive-and-related-disorder-due-to-another-medical-condition",
      "name": "Obsessive-Compulsive and Related Disorder Due to Another Medical Condition",
      "chapter": "Obsessive-Compulsive and Related Disorders",
      "icd10Code": "F06.8",
      "sourcePdfPages": [
        441,
        447
      ],
      "criteriaText": "A. Obsessions, compulsions, preoccupations with appearance, hoarding, skin\npicking, hair pulling, other body-focused repetitive behaviors, or other symptoms\ncharacteristic of obsessive-compulsive and related disorder predominate in the\nclinical picture.\nB. There is evidence from the history, physical examination, or laboratory findings\nthat the disturbance is the direct pathophysiological consequence of another\nmedical condition.\nC. The disturbance is not better explained by another mental disorder.\nD. The disturbance does not occur exclusively during the course of a delirium.\nE. The disturbance causes clinically significant distress or impairment in social,\noccupational, or other important areas of functioning.\nSpecify if:\nWith obsessive-compulsive disorder\u2013like symptoms: If obsessive-\ncompulsive disorder\u2013like symptoms predominate in the clinical presentation.\nWith appearance preoccupations: If preoccupation with perceived appearance\ndefects or flaws predominates in the clinical presentation.\nWith hoarding symptoms: If hoarding predominates in the clinical presentation.\nWith hair-pulling symptoms: If hair pulling predominates in the clinical\npresentation.\nWith skin-picking symptoms: If skin picking predominates in the clinical\npresentation.\nCoding note: Include the name of the other medical condition in the name of the\nmental disorder (e.g., F06.8 obsessive-compulsive and related disorder due to\ncerebral infarction). The other medical condition should be coded and listed\nseparately immediately before the obsessive-compulsive and related disorder due\nto the medical condition (e.g., I69.398 cerebral infarction; F06.8 obsessive-\ncompulsive and related disorder due to cerebral infarction)."
    },
    {
      "id": "reactive-attachment-disorder",
      "name": "Reactive Attachment Disorder",
      "chapter": "Trauma- and Stressor-Related Disorders",
      "icd10Code": "F94.1",
      "sourcePdfPages": [
        448,
        451
      ],
      "criteriaText": "A. A consistent pattern of inhibited, emotionally withdrawn behavior toward adult\ncaregivers, manifested by both of the following:\n1. The child rarely or minimally seeks comfort when distressed.\n2. The child rarely or minimally responds to comfort when distressed.\nB. A persistent social and emotional disturbance characterized by at least two of\nthe following:\n1. Minimal social and emotional responsiveness to others.\n2. Limited positive affect.\n\n3. Episodes of unexplained irritability, sadness, or fearfulness that are evident\neven during nonthreatening interactions with adult caregivers.\nC. The child has experienced a pattern of extremes of insufficient care as\nevidenced by at least one of the following:\n1. Social neglect or deprivation in the form of persistent lack of having basic\nemotional needs for comfort, stimulation, and affection met by caregiving\nadults.\n2. Repeated changes of primary caregivers that limit opportunities to form stable\nattachments (e.g., frequent changes in foster care).\n3. Rearing in unusual settings that severely limit opportunities to form selective\nattachments (e.g., institutions with high child-to-caregiver ratios).\nD. The care in Criterion C is presumed to be responsible for the disturbed behavior\nin Criterion A (e.g., the disturbances in Criterion A began following the lack of\nadequate care in Criterion C).\nE. The criteria are not met for autism spectrum disorder.\nF. The disturbance is evident before age 5 years.\nG. The child has a developmental age of at least 9 months.\nSpecify if:\nPersistent: The disorder has been present for more than 12 months.\nSpecify current severity:\nReactive attachment disorder is specified as severe when a child exhibits all\nsymptoms of the disorder, with each symptom manifesting at relatively high\nlevels."
    },
    {
      "id": "disinhibited-social-engagement-disorder",
      "name": "Disinhibited Social Engagement Disorder",
      "chapter": "Trauma- and Stressor-Related Disorders",
      "icd10Code": "F94.2",
      "sourcePdfPages": [
        452,
        454
      ],
      "criteriaText": "A. A pattern of behavior in which a child actively approaches and interacts with\nunfamiliar adults and exhibits at least two of the following:\n1. Reduced or absent reticence in approaching and interacting with unfamiliar\nadults.\n2. Overly familiar verbal or physical behavior (that is not consistent with\nculturally sanctioned and with age-appropriate social boundaries).\n\n3. Diminished or absent checking back with adult caregiver after venturing\naway, even in unfamiliar settings.\n4. Willingness to go off with an unfamiliar adult with minimal or no hesitation.\nB. The behaviors in Criterion A are not limited to impulsivity (as in attention-\ndeficit/hyperactivity disorder) but include socially disinhibited behavior.\nC. The child has experienced a pattern of extremes of insufficient care as\nevidenced by at least one of the following:\n1. Social neglect or deprivation in the form of persistent lack of having basic\nemotional needs for comfort, stimulation, and affection met by caregiving\nadults.\n2. Repeated changes of primary caregivers that limit opportunities to form stable\nattachments (e.g., frequent changes in foster care).\n3. Rearing in unusual settings that severely limit opportunities to form selective\nattachments (e.g., institutions with high child-to-caregiver ratios).\nD. The care in Criterion C is presumed to be responsible for the disturbed behavior\nin Criterion A (e.g., the disturbances in Criterion A began following the\npathogenic care in Criterion C).\nE. The child has a developmental age of at least 9 months.\nSpecify if:\nPersistent: The disorder has been present for more than 12 months.\nSpecify current severity:\nDisinhibited social engagement disorder is specified as severe when the child\nexhibits all symptoms of the disorder, with each symptom manifesting at\nrelatively high levels."
    },
    {
      "id": "posttraumatic-stress-disorder-in-individuals-older-than-6-years",
      "name": "Posttraumatic Stress Disorder in Individuals Older Than 6 Years",
      "chapter": "Trauma- and Stressor-Related Disorders",
      "sourcePdfPages": [
        455,
        469
      ],
      "sharedSectionTitle": "Posttraumatic Stress Disorder",
      "criteriaText": "Note: The following criteria apply to adults, adolescents, and children older than 6\nyears. For children 6 years and younger, see corresponding criteria below.\nA. Exposure to actual or threatened death, serious injury, or sexual violence in one\n(or more) of the following ways:\n1. Directly experiencing the traumatic event(s).\n2. Witnessing, in person, the event(s) as it occurred to others.\n3. Learning that the traumatic event(s) occurred to a close family member or\nclose friend. In cases of actual or threatened death of a family member or\nfriend, the event(s) must have been violent or accidental.\n4. Experiencing repeated or extreme exposure to aversive details of the\ntraumatic event(s) (e.g., first responders collecting human remains; police\nofficers repeatedly exposed to details of child abuse).\nNote: Criterion A4 does not apply to exposure through electronic media,\ntelevision, movies, or pictures, unless this exposure is work related.\nB. Presence of one (or more) of the following intrusion symptoms associated with\nthe traumatic event(s), beginning after the traumatic event(s) occurred:\n1. Recurrent, involuntary, and intrusive distressing memories of the traumatic\nevent(s).\nNote: In children older than 6 years, repetitive play may occur in which\nthemes or aspects of the traumatic event(s) are expressed.\n\n2. Recurrent distressing dreams in which the content and/or affect of the dream\nare related to the traumatic event(s).\nNote: In children, there may be frightening dreams without recognizable\ncontent.\n3. Dissociative reactions (e.g., flashbacks) in which the individual feels or acts\nas if the traumatic event(s) were recurring. (Such reactions may occur on a\ncontinuum, with the most extreme expression being a complete loss of\nawareness of present surroundings.)\nNote: In children, trauma-specific reenactment may occur in play.\n4. Intense or prolonged psychological distress at exposure to internal or external\ncues that symbolize or resemble an aspect of the traumatic event(s).\n5. Marked physiological reactions to internal or external cues that symbolize or\nresemble an aspect of the traumatic event(s).\nC. Persistent avoidance of stimuli associated with the traumatic event(s), beginning\nafter the traumatic event(s) occurred, as evidenced by one or both of the\nfollowing:\n1. Avoidance of or efforts to avoid distressing memories, thoughts, or feelings\nabout or closely associated with the traumatic event(s).\n2. Avoidance of or efforts to avoid external reminders (people, places,\nconversations, activities, objects, situations) that arouse distressing\nmemories, thoughts, or feelings about or closely associated with the traumatic\nevent(s).\nD. Negative alterations in cognitions and mood associated with the traumatic\nevent(s), beginning or worsening after the traumatic event(s) occurred, as\nevidenced by two (or more) of the following:\n1. Inability to remember an important aspect of the traumatic event(s) (typically\ndue to dissociative amnesia and not to other factors such as head injury,\nalcohol, or drugs).\n2. Persistent and exaggerated negative beliefs or expectations about oneself,\nothers, or the world (e.g., \u201CI am bad,\u201D \u201CNo one can be trusted,\u201D \u201CThe world is\ncompletely dangerous,\u201D \u201CMy whole nervous system is permanently ruined\u201D).\n3. Persistent, distorted cognitions about the cause or consequences of the\ntraumatic event(s) that lead the individual to blame himself/herself or others.\n4. Persistent negative emotional state (e.g., fear, horror, anger, guilt, or shame).\n5. Markedly diminished interest or participation in significant activities.\n6. Feelings of detachment or estrangement from others.\n7. Persistent inability to experience positive emotions (e.g., inability to\nexperience happiness, satisfaction, or loving feelings).\nE. Marked alterations in arousal and reactivity associated with the traumatic\nevent(s), beginning or worsening after the traumatic event(s) occurred, as\nevidenced by two (or more) of the following:\n1. Irritable behavior and angry outbursts (with little or no provocation) typically\nexpressed as verbal or physical aggression toward people or objects.\n2. Reckless or self-destructive behavior.\n3. Hypervigilance.\n4. Exaggerated startle response.\n5. Problems with concentration.\n6. Sleep disturbance (e.g., difficulty falling or staying asleep or restless sleep).\nF. Duration of the disturbance (Criteria B, C, D, and E) is more than 1 month.\nG. The disturbance causes clinically significant distress or impairment in social,\noccupational, or other important areas of functioning.\n\nH. The disturbance is not attributable to the physiological effects of a substance\n(e.g., medication, alcohol) or another medical condition.\nSpecify whether:\nWith dissociative symptoms: The individual\u2019s symptoms meet the criteria for\nposttraumatic stress disorder, and in addition, in response to the stressor, the\nindividual experiences persistent or recurrent symptoms of either of the\nfollowing:\n1. Depersonalization: Persistent or recurrent experiences of feeling detached\nfrom, and as if one were an outside observer of, one\u2019s mental processes or\nbody (e.g., feeling as though one were in a dream; feeling a sense of unreality\nof self or body or of time moving slowly).\n2. Derealization: Persistent or recurrent experiences of unreality of surroundings\n(e.g., the world around the individual is experienced as unreal, dreamlike,\ndistant, or distorted).\nNote: To use this subtype, the dissociative symptoms must not be attributable to\nthe physiological effects of a substance (e.g., blackouts, behavior during alcohol\nintoxication) or another medical condition (e.g., complex partial seizures).\nSpecify if:\nWith delayed expression: If the full diagnostic criteria are not met until at least\n6 months after the event (although the onset and expression of some symptoms\nmay be immediate)."
    },
    {
      "id": "posttraumatic-stress-disorder-in-children-6-years-and-younger",
      "name": "Posttraumatic Stress Disorder in Children 6 Years and Younger",
      "chapter": "Trauma- and Stressor-Related Disorders",
      "sourcePdfPages": [
        455,
        469
      ],
      "sharedSectionTitle": "Posttraumatic Stress Disorder",
      "criteriaText": "A. In children 6 years and younger, exposure to actual or threatened death, serious\ninjury, or sexual violence in one (or more) of the following ways:\n1. Directly experiencing the traumatic event(s).\n2. Witnessing, in person, the event(s) as it occurred to others, especially primary\ncaregivers.\n3. Learning that the traumatic event(s) occurred to a parent or caregiving figure.\nB. Presence of one (or more) of the following intrusion symptoms associated with\nthe traumatic event(s), beginning after the traumatic event(s) occurred:\n1. Recurrent, involuntary, and intrusive distressing memories of the traumatic\nevent(s).\nNote: Spontaneous and intrusive memories may not necessarily appear\ndistressing and may be expressed as play reenactment.\n2. Recurrent distressing dreams in which the content and/or affect of the dream\nare related to the traumatic event(s).\nNote: It may not be possible to ascertain that the frightening content is\nrelated to the traumatic event.\n3. Dissociative reactions (e.g., flashbacks) in which the child feels or acts as if\nthe traumatic event(s) were recurring. (Such reactions may occur on a\ncontinuum, with the most extreme expression being a complete loss of\nawareness of present surroundings.) Such trauma-specific reenactment may\noccur in play.\n4. Intense or prolonged psychological distress at exposure to internal or external\ncues that symbolize or resemble an aspect of the traumatic event(s).\n5. Marked physiological reactions to reminders of the traumatic event(s).\nC. One (or more) of the following symptoms, representing either persistent\navoidance of stimuli associated with the traumatic event(s) or negative\nalterations in cognitions and\n\nmood associated with the traumatic event(s), must be present, beginning after\nthe event(s) or worsening after the event(s):\nPersistent Avoidance of Stimuli\n1. Avoidance of or efforts to avoid activities, places, or physical reminders that\narouse recollections of the traumatic event(s).\n2. Avoidance of or efforts to avoid people, conversations, or interpersonal\nsituations that arouse recollections of the traumatic event(s).\nNegative Alterations in Cognitions\n3. Substantially increased frequency of negative emotional states (e.g., fear,\nguilt, sadness, shame, confusion).\n4. Markedly diminished interest or participation in significant activities, including\nconstriction of play.\n5. Socially withdrawn behavior.\n6. Persistent reduction in expression of positive emotions.\nD. Alterations in arousal and reactivity associated with the traumatic event(s),\nbeginning or worsening after the traumatic event(s) occurred, as evidenced by\ntwo (or more) of the following:\n1. Irritable behavior and angry outbursts (with little or no provocation) typically\nexpressed as verbal or physical aggression toward people or objects\n(including extreme temper tantrums).\n2. Hypervigilance.\n3. Exaggerated startle response.\n4. Problems with concentration.\n5. Sleep disturbance (e.g., difficulty falling or staying asleep or restless sleep).\nE. The duration of the disturbance is more than 1 month.\nF. The disturbance causes clinically significant distress or impairment in\nrelationships with parents, siblings, peers, or other caregivers or with school\nbehavior.\nG. The disturbance is not attributable to the physiological effects of a substance\n(e.g., medication or alcohol) or another medical condition.\nSpecify whether:\nWith dissociative symptoms: The individual\u2019s symptoms meet the criteria for\nposttraumatic stress disorder, and the individual experiences persistent or\nrecurrent symptoms of either of the following:\n1. Depersonalization: Persistent or recurrent experiences of feeling detached\nfrom, and as if one were an outside observer of, one\u2019s mental processes or\nbody (e.g., feeling as though one were in a dream; feeling a sense of unreality\nof self or body or of time moving slowly).\n2. Derealization: Persistent or recurrent experiences of unreality of surroundings\n(e.g., the world around the individual is experienced as unreal, dreamlike,\ndistant, or distorted).\nNote: To use this subtype, the dissociative symptoms must not be attributable to\nthe physiological effects of a substance (e.g., blackouts) or another medical\ncondition (e.g., complex partial seizures).\nSpecify if:\nWith delayed expression: If the full diagnostic criteria are not met until at least\n6 months after the event (although the onset and expression of some symptoms\nmay be immediate)."
    },
    {
      "id": "acute-stress-disorder",
      "name": "Acute Stress Disorder",
      "chapter": "Trauma- and Stressor-Related Disorders",
      "icd10Code": "F43.0",
      "sourcePdfPages": [
        470,
        476
      ],
      "criteriaText": "A. Exposure to actual or threatened death, serious injury, or sexual violence in one\n(or more) of the following ways:\n1. Directly experiencing the traumatic event(s).\n2. Witnessing, in person, the event(s) as it occurred to others.\n\n3. Learning that the event(s) occurred to a close family member or close friend.\nNote: In cases of actual or threatened death of a family member or friend, the\nevent(s) must have been violent or accidental.\n4. Experiencing repeated or extreme exposure to aversive details of the\ntraumatic event(s) (e.g., first responders collecting human remains, police\nofficers repeatedly exposed to details of child abuse).\nNote: This does not apply to exposure through electronic media, television,\nmovies, or pictures, unless this exposure is work related.\nB. Presence of nine (or more) of the following symptoms from any of the five\ncategories of intrusion, negative mood, dissociation, avoidance, and arousal,\nbeginning or worsening after the traumatic event(s) occurred:\nIntrusion Symptoms\n1. Recurrent, involuntary, and intrusive distressing memories of the traumatic\nevent(s). Note: In children, repetitive play may occur in which themes or\naspects of the traumatic event(s) are expressed.\n2. Recurrent distressing dreams in which the content and/or affect of the dream\nare related to the event(s). Note: In children, there may be frightening dreams\nwithout recognizable content.\n3. Dissociative reactions (e.g., flashbacks) in which the individual feels or acts\nas if the traumatic event(s) were recurring. (Such reactions may occur on a\ncontinuum, with the most extreme expression being a complete loss of\nawareness of present surroundings.) Note: In children, trauma-specific\nreenactment may occur in play.\n4. Intense or prolonged psychological distress or marked physiological reactions\nin response to internal or external cues that symbolize or resemble an aspect\nof the traumatic event(s).\nNegative Mood\n5. Persistent inability to experience positive emotions (e.g., inability to\nexperience happiness, satisfaction, or loving feelings).\nDissociative Symptoms\n6. An altered sense of the reality of one\u2019s surroundings or oneself (e.g., seeing\noneself from another\u2019s perspective, being in a daze, time slowing).\n7. Inability to remember an important aspect of the traumatic event(s) (typically\ndue to dissociative amnesia and not to other factors such as head injury,\nalcohol, or drugs).\nAvoidance Symptoms\n8. Efforts to avoid distressing memories, thoughts, or feelings about or closely\nassociated with the traumatic event(s).\n9. Efforts to avoid external reminders (people, places, conversations, activities,\nobjects, situations) that arouse distressing memories, thoughts, or feelings\nabout or closely associated with the traumatic event(s).\nArousal Symptoms\n10. Sleep disturbance (e.g., difficulty falling or staying asleep, restless sleep).\n11. Irritable behavior and angry outbursts (with little or no provocation), typically\nexpressed as verbal or physical aggression toward people or objects.\n12. Hypervigilance.\n13. Problems with concentration.\n14. Exaggerated startle response.\n\nC. Duration of the disturbance (symptoms in Criterion B) is 3 days to 1 month after\ntrauma exposure.\nNote: Symptoms typically begin immediately after the trauma, but persistence\nfor at least 3 days and up to a month is needed to meet disorder criteria.\nD. The disturbance causes clinically significant distress or impairment in social,\noccupational, or other important areas of functioning.\nE. The disturbance is not attributable to the physiological effects of a substance\n(e.g., medication or alcohol) or another medical condition (e.g., mild traumatic\nbrain injury) and is not better explained by brief psychotic disorder."
    },
    {
      "id": "adjustment-disorders",
      "name": "Adjustment Disorders",
      "chapter": "Trauma- and Stressor-Related Disorders",
      "sourcePdfPages": [
        477,
        480
      ],
      "criteriaText": "A. The development of emotional or behavioral symptoms in response to an\nidentifiable stressor(s) occurring within 3 months of the onset of the stressor(s).\nB. These symptoms or behaviors are clinically significant, as evidenced by one or\nboth of the following:\n1. Marked distress that is out of proportion to the severity or intensity of the\nstressor, taking into account the external context and the cultural factors that\nmight influence symptom severity and presentation.\n2. Significant impairment in social, occupational, or other important areas of\nfunctioning.\nC. The stress-related disturbance does not meet the criteria for another mental\ndisorder and is not merely an exacerbation of a preexisting mental disorder.\nD. The symptoms do not represent normal bereavement and are not better\nexplained by prolonged grief disorder.\nE. Once the stressor or its consequences have terminated, the symptoms do not\npersist for more than an additional 6 months.\nSpecify whether:\nF43.21 With depressed mood: Low mood, tearfulness, or feelings of\nhopelessness are predominant.\nF43.22 With anxiety: Nervousness, worry, jitteriness, or separation anxiety is\npredominant.\nF43.23 With mixed anxiety and depressed mood: A combination of\ndepression and anxiety is predominant.\nF43.24 With disturbance of conduct: Disturbance of conduct is predominant.\nF43.25 With mixed disturbance of emotions and conduct: Both emotional\nsymptoms (e.g., depression, anxiety) and a disturbance of conduct are\npredominant.\nF43.20 Unspecified: For maladaptive reactions that are not classifiable as one\nof the specific subtypes of adjustment disorder.\n\nSpecify if:\nAcute: This specifier can be used to indicate persistence of symptoms for less\nthan 6 months.\nPersistent (chronic): This specifier can be used to indicate persistence of\nsymptoms for 6 months or longer. By definition, symptoms cannot persist for\nmore than 6 months after the termination of the stressor or its consequences.\nThe persistent specifier therefore applies when the duration of the disturbance is\nlonger than 6 months in response to a chronic stressor or to a stressor that has\nenduring consequences."
    },
    {
      "id": "prolonged-grief-disorder",
      "name": "Prolonged Grief Disorder",
      "chapter": "Trauma- and Stressor-Related Disorders",
      "icd10Code": "F43.8",
      "sourcePdfPages": [
        481,
        491
      ],
      "criteriaText": "A. The death, at least 12 months ago, of a person who was close to the bereaved\nindividual (for children and adolescents, at least 6 months ago).\n\nB. Since the death, the development of a persistent grief response characterized by\none or both of the following symptoms, which have been present most days to a\nclinically significant degree. In addition, the symptom(s) has occurred nearly\nevery day for at least the last month:\n1. Intense yearning/longing for the deceased person.\n2. Preoccupation with thoughts or memories of the deceased person (in children\nand adolescents, preoccupation may focus on the circumstances of the\ndeath).\nC. Since the death, at least three of the following symptoms have been present\nmost days to a clinically significant degree. In addition, the symptoms have\noccurred nearly every day for at least the last month:\n1. Identity disruption (e.g., feeling as though part of oneself has died) since the\ndeath.\n2. Marked sense of disbelief about the death.\n3. Avoidance of reminders that the person is dead (in children and adolescents,\nmay be characterized by efforts to avoid reminders).\n4. Intense emotional pain (e.g., anger, bitterness, sorrow) related to the death.\n5. Difficulty reintegrating into one\u2019s relationships and activities after the death\n(e.g., problems engaging with friends, pursuing interests, or planning for the\nfuture).\n6. Emotional numbness (absence or marked reduction of emotional experience)\nas a result of the death.\n7. Feeling that life is meaningless as a result of the death.\n8. Intense loneliness as a result of the death.\nD. The disturbance causes clinically significant distress or impairment in social,\noccupational, or other important areas of functioning.\nE. The duration and severity of the bereavement reaction clearly exceed expected\nsocial, cultural, or religious norms for the individual\u2019s culture and context.\nF. The symptoms are not better explained by another mental disorder, such as\nmajor depressive disorder or posttraumatic stress disorder, and are not\nattributable to the physiological effects of a substance (e.g., medication, alcohol)\nor another medical condition."
    },
    {
      "id": "dissociative-identity-disorder",
      "name": "Dissociative Identity Disorder",
      "chapter": "Dissociative Disorders",
      "icd10Code": "F44.81",
      "sourcePdfPages": [
        492,
        500
      ],
      "criteriaText": "A. Disruption of identity characterized by two or more distinct personality states,\nwhich may be described in some cultures as an experience of possession. The\ndisruption in identity involves marked discontinuity in sense of self and sense of\nagency, accompanied by related alterations in affect, behavior, consciousness,\nmemory, perception, cognition, and/or sensory-motor functioning. These signs\nand symptoms may be observed by others or reported by the individual.\nB.   Recurrent gaps in the recall of everyday events, important personal information,\nand/or traumatic events that are inconsistent with ordinary forgetting.\nC.   The symptoms cause clinically significant distress or impairment in social,\noccupational, or other important areas of functioning.\nD.   The disturbance is not a normal part of a broadly accepted cultural or religious\npractice.\nNote: In children, the symptoms are not better explained by imaginary playmates\nor other fantasy play.\nE.   The symptoms are not attributable to the physiological effects of a substance\n(e.g., blackouts or chaotic behavior during alcohol intoxication) or another\nmedical condition (e.g., complex partial seizures)."
    },
    {
      "id": "dissociative-amnesia",
      "name": "Dissociative Amnesia",
      "chapter": "Dissociative Disorders",
      "icd10Code": "F44.0",
      "sourcePdfPages": [
        501,
        507
      ],
      "criteriaText": "A. An inability to recall important autobiographical information, usually of a\ntraumatic or stressful nature, that is inconsistent with ordinary forgetting.\nNote: Dissociative amnesia most often consists of localized or selective amnesia\nfor a specific event or events; or generalized amnesia for identity and life history.\nB. The symptoms cause clinically significant distress or impairment in social,\noccupational, or other important areas of functioning.\nC. The disturbance is not attributable to the physiological effects of a substance\n(e.g., alcohol or other drug of abuse, a medication) or a neurological or other\nmedical condition (e.g., partial complex seizures, transient global amnesia,\nsequelae of a closed head injury/traumatic brain injury, other neurological\ncondition).\nD. The disturbance is not better explained by dissociative identity disorder,\nposttraumatic stress disorder, acute stress disorder, somatic symptom disorder,\nor major or mild neurocognitive disorder.\nCoding note: The code for dissociative amnesia without dissociative fugue is F44.0.\nThe code for dissociative amnesia with dissociative fugue is F44.1.\nSpecify if:\nF44.1 With dissociative fugue: Apparently purposeful travel or bewildered\nwandering that is associated with amnesia for identity or for other important\nautobiographical information."
    },
    {
      "id": "depersonalization-derealization-disorder",
      "name": "Depersonalization/Derealization Disorder",
      "chapter": "Dissociative Disorders",
      "icd10Code": "F48.1",
      "sourcePdfPages": [
        508,
        517
      ],
      "criteriaText": "A. The presence of persistent or recurrent experiences of depersonalization,\nderealization, or both:\n1. Depersonalization: Experiences of unreality, detachment, or being an\noutside observer with respect to one\u2019s thoughts, feelings, sensations, body, or\nactions (e.g., perceptual alterations, distorted sense of time, unreal or absent\nself, emotional and/or physical numbing).\n2. Derealization: Experiences of unreality or detachment with respect to\nsurroundings (e.g., individuals or objects are experienced as unreal,\ndreamlike, foggy, lifeless, or visually distorted).\nB. During the depersonalization or derealization experiences, reality testing remains\nintact.\nC. The symptoms cause clinically significant distress or impairment in social,\noccupational, or other important areas of functioning.\nD. The disturbance is not attributable to the physiological effects of a substance\n(e.g., a drug of abuse, medication) or another medical condition (e.g., seizures).\nE. The disturbance is not better explained by another mental disorder, such as\nschizophrenia, panic disorder, major depressive disorder, acute stress disorder,\nposttraumatic stress disorder, or another dissociative disorder."
    },
    {
      "id": "somatic-symptom-disorder",
      "name": "Somatic Symptom Disorder",
      "chapter": "Somatic Symptom and Related Disorders",
      "icd10Code": "F45.1",
      "sourcePdfPages": [
        518,
        524
      ],
      "criteriaText": "A. One or more somatic symptoms that are distressing or result in significant\ndisruption of daily life.\nB. Excessive thoughts, feelings, or behaviors related to the somatic symptoms or\nassociated health concerns as manifested by at least one of the following:\n1. Disproportionate and persistent thoughts about the seriousness of one\u2019s\nsymptoms.\n2. Persistently high level of anxiety about health or symptoms.\n3. Excessive time and energy devoted to these symptoms or health concerns.\nC. Although any one somatic symptom may not be continuously present, the state\nof being symptomatic is persistent (typically more than 6 months).\nSpecify if:\nWith predominant pain (previously pain disorder): This specifier is for\nindividuals whose somatic symptoms predominantly involve pain.\nSpecify if:\nPersistent: A persistent course is characterized by severe symptoms, marked\nimpairment, and long duration (more than 6 months).\nSpecify current severity:\nMild: Only one of the symptoms specified in Criterion B is fulfilled.\nModerate: Two or more of the symptoms specified in Criterion B are fulfilled.\nSevere: Two or more of the symptoms specified in Criterion B are fulfilled, plus\nthere are multiple somatic complaints (or one very severe somatic symptom)."
    },
    {
      "id": "illness-anxiety-disorder",
      "name": "Illness Anxiety Disorder",
      "chapter": "Somatic Symptom and Related Disorders",
      "icd10Code": "F45.21",
      "sourcePdfPages": [
        525,
        528
      ],
      "criteriaText": "A. Preoccupation with having or acquiring a serious illness.\nB. Somatic symptoms are not present or, if present, are only mild in intensity. If\nanother medical condition is present or there is a high risk for developing a\nmedical condition (e.g., strong family history is present), the preoccupation is\nclearly excessive or disproportionate.\nC. There is a high level of anxiety about health, and the individual is easily alarmed\nabout personal health status.\nD. The individual performs excessive health-related behaviors (e.g., repeatedly\nchecks his or her body for signs of illness) or exhibits maladaptive avoidance\n(e.g., avoids doctor appointments and hospitals).\nE. Illness preoccupation has been present for at least 6 months, but the specific\nillness that is feared may change over that period of time.\nF. The illness-related preoccupation is not better explained by another mental\ndisorder, such as somatic symptom disorder, panic disorder, generalized anxiety\ndisorder, body dysmorphic disorder, obsessive-compulsive disorder, or\ndelusional disorder, somatic type.\nSpecify whether:\nCare-seeking type: Medical care, including physician visits or undergoing tests\nand procedures, is frequently used.\nCare-avoidant type: Medical care is rarely used."
    },
    {
      "id": "functional-neurological-symptom-disorder-conversion-disorder",
      "name": "Functional Neurological Symptom Disorder (Conversion Disorder)",
      "chapter": "Somatic Symptom and Related Disorders",
      "sourcePdfPages": [
        529,
        533
      ],
      "criteriaText": "A. One or more symptoms of altered voluntary motor or sensory function.\nB. Clinical findings provide evidence of incompatibility between the symptom and\nrecognized neurological or medical conditions.\nC. The symptom or deficit is not better explained by another medical or mental\ndisorder.\nD. The symptom or deficit causes clinically significant distress or impairment in\nsocial, occupational, or other important areas of functioning or warrants medical\nevaluation.\nCoding note: The ICD-10-CM code depends on the symptom type (see below).\nSpecify symptom type:\nF44.4 With weakness or paralysis\nF44.4 With abnormal movement (e.g., tremor, dystonia, myoclonus, gait\ndisorder)\nF44.4 With swallowing symptoms\nF44.4 With speech symptom (e.g., dysphonia, slurred speech)\nF44.5 With attacks or seizures\nF44.6 With anesthesia or sensory loss\nF44.6 With special sensory symptom (e.g., visual, olfactory, or hearing\ndisturbance)\nF44.7 With mixed symptoms\nSpecify if:\nAcute episode: Symptoms present for less than 6 months.\nPersistent: Symptoms occurring for 6 months or more.\n\nSpecify if:\nWith psychological stressor (specify stressor)\nWithout psychological stressor"
    },
    {
      "id": "psychological-factors-affecting-other-medical-conditions",
      "name": "Psychological Factors Affecting Other Medical Conditions",
      "chapter": "Somatic Symptom and Related Disorders",
      "icd10Code": "F54",
      "sourcePdfPages": [
        534,
        537
      ],
      "criteriaText": "A. A medical symptom or condition (other than a mental disorder) is present.\nB. Psychological or behavioral factors adversely affect the medical condition in one\nof the following ways:\n1. The factors have influenced the course of the medical condition as shown by\na close temporal association between the psychological factors and the\ndevelopment or exacerbation of, or delayed recovery from, the medical\ncondition.\n2. The factors interfere with the treatment of the medical condition (e.g., poor\nadherence).\n3. The factors constitute additional well-established health risks for the\nindividual.\n\n4. The factors influence the underlying pathophysiology, precipitating or\nexacerbating symptoms or necessitating medical attention.\nC. The psychological and behavioral factors in Criterion B are not better explained\nby another mental disorder (e.g., panic disorder, major depressive disorder,\nposttraumatic stress disorder).\nSpecify current severity:\nMild: Increases medical risk (e.g., inconsistent adherence with antihypertension\ntreatment).\nModerate: Aggravates underlying medical condition (e.g., anxiety aggravating\nasthma).\nSevere: Results in medical hospitalization or emergency room visit.\nExtreme: Results in severe, life-threatening risk (e.g., ignoring heart attack\nsymptoms)."
    },
    {
      "id": "factitious-disorder-imposed-on-self",
      "name": "Factitious Disorder Imposed on Self",
      "chapter": "Somatic Symptom and Related Disorders",
      "icd10Code": "F68.10",
      "sourcePdfPages": [
        538,
        543
      ],
      "sharedSectionTitle": "Factitious Disorder",
      "criteriaText": "A. Falsification of physical or psychological signs or symptoms, or induction of\ninjury or disease, associated with identified deception.\nB. The individual presents himself or herself to others as ill, impaired, or injured.\nC. The deceptive behavior is evident even in the absence of obvious external\nrewards.\nD. The behavior is not better explained by another mental disorder, such as\ndelusional disorder or another psychotic disorder.\nSpecify:\nSingle episode\nRecurrent episodes (two or more events of falsification of illness and/or\ninduction of injury)"
    },
    {
      "id": "factitious-disorder-imposed-on-another-previously-factitious-disorder-by-proxy",
      "name": "Factitious Disorder Imposed on Another (Previously Factitious Disorder by Proxy)",
      "chapter": "Somatic Symptom and Related Disorders",
      "icd10Code": "F68.A",
      "sourcePdfPages": [
        538,
        543
      ],
      "sharedSectionTitle": "Factitious Disorder",
      "criteriaText": "A. Falsification of physical or psychological signs or symptoms, or induction of\ninjury or disease, in another, associated with identified deception.\nB. The individual presents another individual (victim) to others as ill, impaired, or\ninjured.\nC. The deceptive behavior is evident even in the absence of obvious external\nrewards.\nD. The behavior is not better explained by another mental disorder, such as\ndelusional disorder or another psychotic disorder.\nNote: The perpetrator, not the victim, receives this diagnosis.\nSpecify:\nSingle episode\nRecurrent episodes (two or more events of falsification of illness and/or\ninduction of injury)"
    },
    {
      "id": "pica",
      "name": "Pica",
      "chapter": "Feeding and Eating Disorders",
      "sourcePdfPages": [
        544,
        546
      ],
      "criteriaText": "A. Persistent eating of nonnutritive, nonfood substances over a period of at least 1\nmonth.\nB. The eating of nonnutritive, nonfood substances is inappropriate to the\ndevelopmental level of the individual.\nC. The eating behavior is not part of a culturally supported or socially normative\npractice.\nD. If the eating behavior occurs in the context of another mental disorder (e.g.,\nintellectual developmental disorder [intellectual disability], autism spectrum\ndisorder, schizophrenia) or medical condition (including pregnancy), it is\nsufficiently severe to warrant additional clinical attention.\n\nCoding note: The ICD-10-CM codes for pica are F98.3 in children and F50.89 in\nadults.\nSpecify if:\nIn remission: After full criteria for pica were previously met, the criteria have not\nbeen met for a sustained period of time."
    },
    {
      "id": "rumination-disorder",
      "name": "Rumination Disorder",
      "chapter": "Feeding and Eating Disorders",
      "icd10Code": "F98.21",
      "sourcePdfPages": [
        547,
        549
      ],
      "criteriaText": "A. Repeated regurgitation of food over a period of at least 1 month. Regurgitated\nfood may be re-chewed, re-swallowed, or spit out.\nB. The repeated regurgitation is not attributable to an associated gastrointestinal or\nother medical condition (e.g., gastroesophageal reflux, pyloric stenosis).\nC. The eating disturbance does not occur exclusively during the course of anorexia\nnervosa, bulimia nervosa, binge-eating disorder, or avoidant/restrictive food\nintake disorder.\nD. If the symptoms occur in the context of another mental disorder (e.g., intellectual\ndevelopmental disorder [intellectual disability] or another neurodevelopmental\ndisorder), they are sufficiently severe to warrant additional clinical attention.\nSpecify if:\nIn remission: After full criteria for rumination disorder were previously met, the\ncriteria have not been met for a sustained period of time."
    },
    {
      "id": "avoidant-restrictive-food-intake-disorder",
      "name": "Avoidant/Restrictive Food Intake Disorder",
      "chapter": "Feeding and Eating Disorders",
      "icd10Code": "F50.82",
      "sourcePdfPages": [
        550,
        555
      ],
      "criteriaText": "A. An eating or feeding disturbance (e.g., apparent lack of interest in eating or food;\navoidance based on the sensory characteristics of food; concern about aversive\nconsequences of eating) associated with one (or more) of the following:\n1. Significant weight loss (or failure to achieve expected weight gain or faltering\ngrowth in children).\n2. Significant nutritional deficiency.\n3. Dependence on enteral feeding or oral nutritional supplements.\n4. Marked interference with psychosocial functioning.\nB. The disturbance is not better explained by lack of available food or by an\nassociated culturally sanctioned practice.\nC. The eating disturbance does not occur exclusively during the course of anorexia\nnervosa or bulimia nervosa, and there is no evidence of a disturbance in the way\nin which one\u2019s body weight or shape is experienced.\nD. The eating disturbance is not attributable to a concurrent medical condition or\nnot better explained by another mental disorder. When the eating disturbance\noccurs in the context of another condition or disorder, the severity of the eating\ndisturbance exceeds that routinely associated with the condition or disorder and\nwarrants additional clinical attention.\nSpecify if:\nIn remission: After full criteria for avoidant/restrictive food intake disorder were\npreviously met, the criteria have not been met for a sustained period of time."
    },
    {
      "id": "anorexia-nervosa",
      "name": "Anorexia Nervosa",
      "chapter": "Feeding and Eating Disorders",
      "sourcePdfPages": [
        556,
        563
      ],
      "criteriaText": "A. Restriction of energy intake relative to requirements, leading to a significantly low\nbody weight in the context of age, sex, developmental trajectory, and physical\nhealth. Significantly low weight is defined as a weight that is less than minimally\nnormal or, for children and adolescents, less than that minimally expected.\nB. Intense fear of gaining weight or of becoming fat, or persistent behavior that\ninterferes with weight gain, even though at a significantly low weight.\nC. Disturbance in the way in which one\u2019s body weight or shape is experienced,\nundue influence of body weight or shape on self-evaluation, or persistent lack of\nrecognition of the seriousness of the current low body weight.\nCoding note: The ICD-10-CM code depends on the subtype (see below).\nSpecify whether:\nF50.01 Restricting type: During the last 3 months, the individual has not\nengaged in recurrent episodes of binge-eating or purging behavior (i.e., self-\ninduced vomiting or the misuse of laxatives, diuretics, or enemas). This subtype\ndescribes presentations in which weight loss is accomplished primarily through\ndieting, fasting, and/or excessive exercise.\nF50.02 Binge-eating/purging type: During the last 3 months, the individual has\nengaged in recurrent episodes of binge-eating or purging behavior (i.e., self-\ninduced vomiting or the misuse of laxatives, diuretics, or enemas).\nSpecify if:\nIn partial remission: After full criteria for anorexia nervosa were previously met,\nCriterion A (low body weight) has not been met for a sustained period, but either\nCriterion B (intense fear of gaining weight or becoming fat or behavior that\ninterferes with weight gain) or Criterion C (disturbances in self-perception of\nweight and shape) is still met.\nIn full remission: After full criteria for anorexia nervosa were previously met,\nnone of the criteria have been met for a sustained period of time.\nSpecify current severity:\nThe minimum level of severity is based, for adults, on current body mass index (BMI)\n(see below) or, for children and adolescents, on BMI percentile. The ranges below\nare derived from World Health Organization categories for thinness in adults; for\nchildren and adolescents, corresponding BMI percentiles should be used. The level\nof severity may be increased to reflect clinical symptoms, the degree of functional\ndisability, and the need for supervision.\nMild: BMI \u2265 17 kg/m2.\nModerate: BMI 16\u201316.99 kg/m2.\nSevere: BMI 15\u201315.99 kg/m2.\nExtreme: BMI < 15 kg/m2."
    },
    {
      "id": "bulimia-nervosa",
      "name": "Bulimia Nervosa",
      "chapter": "Feeding and Eating Disorders",
      "icd10Code": "F50.2",
      "sourcePdfPages": [
        564,
        569
      ],
      "criteriaText": "A. Recurrent episodes of binge eating. An episode of binge eating is characterized\nby both of the following:\n1. Eating, in a discrete period of time (e.g., within any 2-hour period), an amount\nof food that is definitely larger than what most individuals would eat in a\nsimilar period of time under similar circumstances.\n2. A sense of lack of control over eating during the episode (e.g., a feeling that\none cannot stop eating or control what or how much one is eating).\nB. Recurrent inappropriate compensatory behaviors in order to prevent weight gain,\nsuch as self-induced vomiting; misuse of laxatives, diuretics, or other\nmedications; fasting; or excessive exercise.\nC. The binge eating and inappropriate compensatory behaviors both occur, on\naverage, at least once a week for 3 months.\nD. Self-evaluation is unduly influenced by body shape and weight.\nE. The disturbance does not occur exclusively during episodes of anorexia nervosa.\n\nSpecify if:\nIn partial remission: After full criteria for bulimia nervosa were previously met,\nsome, but not all, of the criteria have been met for a sustained period of time.\nIn full remission: After full criteria for bulimia nervosa were previously met,\nnone of the criteria have been met for a sustained period of time.\nSpecify current severity:\nThe minimum level of severity is based on the frequency of inappropriate\ncompensatory behaviors (see below). The level of severity may be increased to\nreflect other symptoms and the degree of functional disability.\nMild: An average of 1\u20133 episodes of inappropriate compensatory behaviors per\nweek.\nModerate: An average of 4\u20137 episodes of inappropriate compensatory\nbehaviors per week.\nSevere: An average of 8\u201313 episodes of inappropriate compensatory behaviors\nper week.\nExtreme: An average of 14 or more episodes of inappropriate compensatory\nbehaviors per week."
    },
    {
      "id": "binge-eating-disorder",
      "name": "Binge-Eating Disorder",
      "chapter": "Feeding and Eating Disorders",
      "icd10Code": "F50.81",
      "sourcePdfPages": [
        570,
        576
      ],
      "criteriaText": "A. Recurrent episodes of binge eating. An episode of binge eating is characterized\nby both of the following:\n1. Eating, in a discrete period of time (e.g., within any 2-hour period), an amount\nof food that is definitely larger than what most people would eat in a similar\nperiod of time under similar circumstances.\n2. A sense of lack of control over eating during the episode (e.g., a feeling that\none cannot stop eating or control what or how much one is eating).\nB. The binge-eating episodes are associated with three (or more) of the following:\n1. Eating much more rapidly than normal.\n2. Eating until feeling uncomfortably full.\n\n3. Eating large amounts of food when not feeling physically hungry.\n4. Eating alone because of feeling embarrassed by how much one is eating.\n5. Feeling disgusted with oneself, depressed, or very guilty afterward.\nC. Marked distress regarding binge eating is present.\nD. The binge eating occurs, on average, at least once a week for 3 months.\nE. The binge eating is not associated with the recurrent use of inappropriate\ncompensatory behavior as in bulimia nervosa and does not occur exclusively\nduring the course of bulimia nervosa or anorexia nervosa.\nSpecify if:\nIn partial remission: After full criteria for binge-eating disorder were previously\nmet, binge eating occurs at an average frequency of less than one episode per\nweek for a sustained period of time.\nIn full remission: After full criteria for binge-eating disorder were previously met,\nnone of the criteria have been met for a sustained period of time.\nSpecify current severity:\nThe minimum level of severity is based on the frequency of episodes of binge eating\n(see below). The level of severity may be increased to reflect other symptoms and\nthe degree of functional disability.\nMild: 1\u20133 binge-eating episodes per week.\nModerate: 4\u20137 binge-eating episodes per week.\nSevere: 8\u201313 binge-eating episodes per week.\nExtreme: 14 or more binge-eating episodes per week."
    },
    {
      "id": "enuresis",
      "name": "Enuresis",
      "chapter": "Elimination Disorders",
      "icd10Code": "F98.0",
      "sourcePdfPages": [
        577,
        580
      ],
      "criteriaText": "A. Repeated voiding of urine into bed or clothes, whether involuntary or intentional.\nB. The behavior is clinically significant as manifested by either a frequency of at\nleast twice a week for at least 3 consecutive months or the presence of clinically\nsignificant distress or impairment in social, academic (occupational), or other\nimportant areas of functioning.\nC. Chronological age is at least 5 years (or equivalent developmental level).\nD. The behavior is not attributable to the physiological effects of a substance (e.g.,\na diuretic, an antipsychotic medication) or another medical condition (e.g.,\ndiabetes, spina bifida, a seizure disorder).\nSpecify whether:\nNocturnal only: Passage of urine only during nighttime sleep.\nDiurnal only: Passage of urine during waking hours.\nNocturnal and diurnal: A combination of the two subtypes above."
    },
    {
      "id": "encopresis",
      "name": "Encopresis",
      "chapter": "Elimination Disorders",
      "icd10Code": "F98.1",
      "sourcePdfPages": [
        581,
        589
      ],
      "criteriaText": "A. Repeated passage of feces into inappropriate places (e.g., clothing, floor),\nwhether involuntary or intentional.\nB. At least one such event occurs each month for at least 3 months.\nC. Chronological age is at least 4 years (or equivalent developmental level).\nD. The behavior is not attributable to the physiological effects of a substance (e.g.,\nlaxatives) or another medical condition except through a mechanism involving\nconstipation.\nSpecify whether:\nWith constipation and overflow incontinence: There is evidence of\nconstipation on physical examination or by history.\nWithout constipation and overflow incontinence: There is no evidence of\nconstipation on physical examination or by history."
    },
    {
      "id": "insomnia-disorder",
      "name": "Insomnia Disorder",
      "chapter": "Sleep-Wake Disorders",
      "icd10Code": "F51.01",
      "sourcePdfPages": [
        590,
        598
      ],
      "criteriaText": "A. A predominant complaint of dissatisfaction with sleep quantity or quality,\nassociated with one (or more) of the following symptoms:\n1. Difficulty initiating sleep. (In children, this may manifest as difficulty initiating\nsleep without caregiver intervention.)\n2. Difficulty maintaining sleep, characterized by frequent awakenings or\nproblems returning to sleep after awakenings. (In children, this may manifest\nas difficulty returning to sleep without caregiver intervention.)\n3. Early-morning awakening with inability to return to sleep.\nB. The sleep disturbance causes clinically significant distress or impairment in\nsocial, occupational, educational, academic, behavioral, or other important areas\nof functioning.\nC. The sleep difficulty occurs at least 3 nights per week.\n\nD. The sleep difficulty is present for at least 3 months.\nE. The sleep difficulty occurs despite adequate opportunity for sleep.\nF. The insomnia is not better explained by and does not occur exclusively during\nthe course of another sleep-wake disorder (e.g., narcolepsy, a breathing-related\nsleep disorder, a circadian rhythm sleep-wake disorder, a parasomnia).\nG. The insomnia is not attributable to the physiological effects of a substance (e.g.,\na drug of abuse, a medication).\nH. Coexisting mental disorders and medical conditions do not adequately explain\nthe predominant complaint of insomnia.\nSpecify if:\nWith mental disorder, including substance use disorders\nWith medical condition\nWith another sleep disorder\nCoding note: The code F51.01 applies to all three specifiers. Code also the\nrelevant associated mental disorder, medical condition, or other sleep disorder\nimmediately after the code for insomnia disorder in order to indicate the\nassociation.\nSpecify if:\nEpisodic: Symptoms last at least 1 month but less than 3 months.\nPersistent: Symptoms last 3 months or longer.\nRecurrent: Two (or more) episodes within the space of 1 year.\nNote: Acute and short-term insomnia (i.e., symptoms lasting less than 3 months but\notherwise meeting all criteria with regard to frequency, intensity, distress, and/or\nimpairment) should be coded as an other specified insomnia disorder.\n\nNote: The diagnosis of insomnia disorder is given whether it occurs as an independent\ncondition or is comorbid with another mental disorder (e.g., major depressive disorder),\nmedical condition (e.g., pain), or another sleep disorder (e.g., a breathing-related sleep\ndisorder). For instance, insomnia may develop its own course with some anxiety and\ndepressive features without those features meeting criteria for any one mental disorder.\nInsomnia may also manifest as a clinical feature of a more predominant mental disorder.\nPersistent insomnia is a risk factor for depression, anxiety disorders, and alcohol use\ndisorder and is a common residual symptom after treatment for these conditions. When\ninsomnia is comorbid with a mental disorder, treatment may need to target both\nconditions. Given these different courses, it is often impossible to establish the precise\nnature of the relationship between these clinical entities, and this relationship may\nchange over time. Therefore, in the presence of insomnia and a comorbid disorder, it is\nnot necessary to make a causal attribution between the two conditions. Rather, the\ndiagnosis of insomnia disorder is made with concurrent specification of the comorbid\nconditions. A concurrent insomnia diagnosis should only be considered when the\ninsomnia is sufficiently severe to warrant independent clinical attention; otherwise, no\nseparate diagnosis is necessary."
    },
    {
      "id": "hypersomnolence-disorder",
      "name": "Hypersomnolence Disorder",
      "chapter": "Sleep-Wake Disorders",
      "icd10Code": "F51.11",
      "sourcePdfPages": [
        599,
        603
      ],
      "criteriaText": "A. Self-reported excessive sleepiness (hypersomnolence) despite a main sleep\nperiod lasting at least 7 hours, with at least one of the following symptoms:\n1. Recurrent periods of sleep or lapses into sleep within the same day.\n2. A prolonged main sleep episode of more than 9 hours per day that is\nnonrestorative (i.e., unrefreshing).\n3. Difficulty being fully awake after abrupt awakening.\nB. The hypersomnolence occurs at least three times per week, for at least 3\nmonths.\nC. The hypersomnolence is accompanied by significant distress or impairment in\ncognitive, social, occupational, or other important areas of functioning.\nD. The hypersomnolence is not better explained by and does not occur exclusively\nduring the course of another sleep disorder (e.g., narcolepsy, breathing-related\nsleep disorder, circadian rhythm sleep-wake disorder, or a parasomnia).\nE. The hypersomnolence is not attributable to the physiological effects of a\nsubstance (e.g., a drug of abuse, a medication).\nF. Coexisting mental and medical disorders do not adequately explain the\npredominant complaint of hypersomnolence.\nSpecify if:\nWith mental disorder, including substance use disorders\nWith medical condition\nWith another sleep disorder\nCoding note: The code F51.11 applies to all three specifiers. Code also the\nrelevant associated mental disorder, medical condition, or other sleep disorder\nimmediately after the code for hypersomnolence disorder in order to indicate the\nassociation.\nSpecify if:\nAcute: Duration of less than 1 month.\nSubacute: Duration of 1\u20133 months.\nPersistent: Duration of more than 3 months.\n\nSpecify current severity:\nSpecify severity based on degree of difficulty maintaining daytime alertness as\nmanifested by the occurrence of multiple attacks of irresistible sleepiness within any\ngiven day occurring, for example, while sedentary, driving, visiting with friends, or\nworking.\nMild: Difficulty maintaining daytime alertness 1\u20132 days/week.\nModerate: Difficulty maintaining daytime alertness 3\u20134 days/week.\nSevere: Difficulty maintaining daytime alertness 5\u20137 days/week."
    },
    {
      "id": "narcolepsy",
      "name": "Narcolepsy",
      "chapter": "Sleep-Wake Disorders",
      "sourcePdfPages": [
        604,
        612
      ],
      "criteriaText": "A. Recurrent periods of an irrepressible need to sleep, lapsing into sleep, or\nnapping occurring within the same day. These must have been occurring at least\nthree times per week over the past 3 months.\nB. The presence of at least one of the following:\n1. Episodes of cataplexy, defined as either (a) or (b), occurring at least a few\ntimes per month:\na. In individuals with long-standing disease, brief (seconds to minutes)\nepisodes of sudden bilateral loss of muscle tone with maintained\nconsciousness that are precipitated by laughter or joking.\nb. In children or in individuals within 6 months of onset, spontaneous\ngrimaces or jaw-opening episodes with tongue thrusting or a global\nhypotonia, without any obvious emotional triggers.\n2. Hypocretin deficiency, as measured using cerebrospinal fluid (CSF)\nhypocretin-1 immunoreactivity values (less than or equal to one-third of\nvalues obtained in healthy subjects tested using the same assay, or less than\nor equal to 110 pg/mL). Low CSF levels of hypocretin-1 must not be observed\nin the context of acute brain injury, inflammation, or infection.\n3. Nocturnal sleep polysomnography showing rapid eye movement (REM) sleep\nlatency less than or equal to 15 minutes, or a multiple sleep latency test\nshowing a mean sleep latency less than or equal to 8 minutes and two or\nmore sleep-onset REM periods.\nSpecify whether:\nG47.411 Narcolepsy with cataplexy or hypocretin deficiency (type 1):\nCriterion B1 (episodes of cataplexy) or Criterion B2 (low CSF hypocretin-1\nlevels) is met.\nG47.419 Narcolepsy without cataplexy and either without hypocretin\ndeficiency or hypocretin unmeasured (type 2): Criterion B3 (positive\npolysomnography/multiple sleep latency test) is met, but Criterion B1 is not met\n(i.e., no cataplexy is present) and Criterion B2 is not met (i.e., CSF hypocretin-1\nlevels are not low or have not been measured).\nG47.421 Narcolepsy with cataplexy or hypocretin deficiency due to a\nmedical condition\nG47.429 Narcolepsy without cataplexy and without hypocretin deficiency\ndue to a medical condition\nCoding note: For the subtype narcolepsy with cataplexy or hypocretin deficiency\ndue to a medical condition and the subtype narcolepsy without cataplexy and without\nhypocretin deficiency due to a medical condition, code first the underlying medical\ncondition (e.g., G71.11 myotonic dystrophy; G47.429 narcolepsy without cataplexy\nand without hypocretin deficiency due to myotonic dystrophy).\nSpecify current severity:\nMild: Need for naps only once or twice per day. Sleep disturbance, if present, is\nmild. Cataplexy, when present, is infrequent (occurring less than once per week).\nModerate: Need for multiple naps daily. Sleep may be moderately disturbed.\nCataplexy, when present, occurs daily or every few days.\n\nSevere: Nearly constant sleepiness and, often, highly disturbed nocturnal sleep\n(which may include excessive body movement and vivid dreams). Cataplexy,\nwhen present, is drug-resistant, with multiple attacks daily."
    },
    {
      "id": "obstructive-sleep-apnea-hypopnea",
      "name": "Obstructive Sleep Apnea Hypopnea",
      "chapter": "Sleep-Wake Disorders",
      "icd10Code": "G47.33",
      "sourcePdfPages": [
        613,
        619
      ],
      "criteriaText": "A. Either (1) or (2):\n1. Evidence by polysomnography of at least five obstructive apneas or\nhypopneas per hour of sleep and either of the following sleep symptoms:\na. Nocturnal breathing disturbances: snoring, snorting/gasping, or breathing\npauses during sleep.\nb. Daytime sleepiness, fatigue, or unrefreshing sleep despite sufficient\nopportunities to sleep that is not better explained by another mental\ndisorder (including a sleep disorder) and is not attributable to another\nmedical condition.\n2. Evidence by polysomnography of 15 or more obstructive apneas and/or\nhypopneas per hour of sleep regardless of accompanying symptoms.\nSpecify current severity:\nMild: Apnea hypopnea index is less than 15.\nModerate: Apnea hypopnea index is 15\u201330.\nSevere: Apnea hypopnea index is greater than 30."
    },
    {
      "id": "central-sleep-apnea",
      "name": "Central Sleep Apnea",
      "chapter": "Sleep-Wake Disorders",
      "sourcePdfPages": [
        620,
        624
      ],
      "criteriaText": "A. Evidence by polysomnography of five or more central apneas per hour of sleep.\nB. The disorder is not better explained by another current sleep disorder.\nSpecify whether:\nG47.31 Idiopathic central sleep apnea: Characterized by repeated episodes of\napneas and hypopneas during sleep caused by variability in respiratory effort but\nwithout evidence of airway obstruction.\nR06.3 Cheyne-Stokes breathing: A pattern of periodic crescendo-decrescendo\nvariation in tidal volume that results in central apneas and hypopneas at a\nfrequency of at least five events per hour, accompanied by frequent arousal.\nG47.37 Central sleep apnea comorbid with opioid use: The pathogenesis of\nthis subtype is attributed to the effects of opioids on the respiratory rhythm\ngenerators in the medulla as well as the differential effects on hypoxic versus\nhypercapnic respiratory drive.\nCoding note (for G47.37 code only): When an opioid use disorder is present, first\ncode the opioid use disorder: F11.10 mild opioid use disorder or F11.20 moderate\nor severe opioid use disorder; then code G47.37 central sleep apnea comorbid with\nopioid use. When an opioid use disorder is not present (e.g., after a one-time heavy\nuse of the substance), code only G47.37 central sleep apnea comorbid with opioid\nuse.\n\nSpecify current severity:\nSeverity of central sleep apnea is graded according to the frequency of the\nbreathing disturbances as well as the extent of associated oxygen desaturation\nand sleep fragmentation that occur as a consequence of repetitive respiratory\ndisturbances."
    },
    {
      "id": "sleep-related-hypoventilation",
      "name": "Sleep-Related Hypoventilation",
      "chapter": "Sleep-Wake Disorders",
      "sourcePdfPages": [
        625,
        629
      ],
      "criteriaText": "A. Polysomnograpy demonstrates episodes of decreased respiration associated\nwith elevated CO2 levels. (Note: In the absence of objective measurement of\nCO2, persistent low levels of hemoglobin oxygen saturation unassociated with\napneic/hypopneic events may indicate hypoventilation.)\nB. The disturbance is not better explained by another current sleep disorder.\nSpecify whether:\nG47.34 Idiopathic hypoventilation: This subtype is not attributable to any\nreadily identified condition.\nG47.35 Congenital central alveolar hypoventilation: This subtype is a rare\ncongenital disorder in which the individual typically presents in the perinatal\nperiod with shallow breathing, or cyanosis and apnea during sleep.\nG47.36 Comorbid sleep-related hypoventilation: This subtype occurs as a\nconsequence of a medical condition, such as a pulmonary disorder (e.g.,\ninterstitial lung disease, chronic obstructive pulmonary disease) or a\nneuromuscular or chest wall disorder (e.g., muscular dystrophies, postpolio\nsyndrome, cervical spinal cord injury, kyphoscoliosis), or medications (e.g.,\nbenzodiazepines, opiates). It also occurs with obesity (obesity hypoventilation\ndisorder), where it reflects a combination of increased work of breathing due to\nreduced chest wall compliance and ventilation-perfusion mismatch and variably\nreduced ventilatory drive. Such individuals usually are characterized by body\nmass index of greater than 30 and hypercapnia during wakefulness (with a pCO2\nof greater than 45), without other evidence of hypoventilation.\n\nSpecify current severity:\nSeverity is graded according to the degree of hypoxemia and hypercarbia\npresent during sleep and evidence of end organ impairment due to these\nabnormalities (e.g., right-sided heart failure). The presence of blood gas\nabnormalities during wakefulness is an indicator of greater severity."
    },
    {
      "id": "circadian-rhythm-sleep-wake-disorders",
      "name": "Circadian Rhythm Sleep-Wake Disorders",
      "chapter": "Sleep-Wake Disorders",
      "sourcePdfPages": [
        630,
        639
      ],
      "criteriaText": "A. A persistent or recurrent pattern of sleep disruption that is primarily due to an\nalteration of the circadian system or to a misalignment between the endogenous\ncircadian rhythm and the sleep-wake schedule required by an individual\u2019s\nphysical environment or social or professional schedule.\nB. The sleep disruption leads to excessive sleepiness or insomnia, or both.\nC. The sleep disturbance causes clinically significant distress or impairment in\nsocial, occupational, and other important areas of functioning.\nSpecify whether:\nG47.21 Delayed sleep phase type: A pattern of delayed sleep onset and\nawakening times, with an inability to fall asleep and awaken at a desired or\nconventionally acceptable earlier time.\nSpecify if:\nFamilial: A family history of delayed sleep phase is present.\nSpecify if:\nOverlapping with non-24-hour sleep-wake type: Delayed sleep\nphase type may overlap with another circadian rhythm sleep-wake\ndisorder, non-24-hour sleep-wake type.\nG47.22 Advanced sleep phase type: A pattern of advanced sleep onset and\nawakening times, with an inability to remain awake or asleep until the desired or\nconventionally acceptable later sleep or wake times.\nSpecify if:\nFamilial: A family history of advanced sleep phase is present.\nG47.23 Irregular sleep-wake type: A temporally disorganized sleep-wake\npattern, such that the timing of sleep and wake periods is variable throughout the\n24-hour period.\n\nG47.24 Non-24-hour sleep-wake type: A pattern of sleep-wake cycles that is\nnot synchronized to the 24-hour environment, with a consistent daily drift (usually\nto later and later times) of sleep onset and wake times.\nG47.26 Shift work type: Insomnia during the major sleep period and/or\nexcessive sleepiness (including inadvertent sleep) during the major awake\nperiod associated with a shift work schedule (i.e., requiring unconventional work\nhours).\nG47.20 Unspecified type\nSpecify if:\nEpisodic: Symptoms last at least 1 month but less than 3 months.\nPersistent: Symptoms last 3 months or longer.\nRecurrent: Two or more episodes occur within the space of 1 year.\n\nDelayed Sleep Phase Type"
    },
    {
      "id": "non-rapid-eye-movement-sleep-arousal-disorders",
      "name": "Non\u2013Rapid Eye Movement Sleep Arousal Disorders",
      "chapter": "Sleep-Wake Disorders",
      "sourcePdfPages": [
        640,
        645
      ],
      "criteriaText": "A. Recurrent episodes of incomplete awakening from sleep, usually occurring\nduring the first third of the major sleep episode, accompanied by either one of\nthe following:\n1. Sleepwalking: Repeated episodes of rising from bed during sleep and\nwalking about. While sleepwalking, the individual has a blank, staring face; is\nrelatively unresponsive to the efforts of others to communicate with him or\nher; and can be awakened only with great difficulty.\n2. Sleep terrors: Recurrent episodes of abrupt terror arousals from sleep,\nusually beginning with a panicky scream. There is intense fear and signs of\nautonomic arousal, such as mydriasis, tachycardia, rapid breathing, and\nsweating, during each episode. There is relative unresponsiveness to efforts\nof others to comfort the individual during the episodes.\nB. No or little (e.g., only a single visual scene) dream imagery is recalled.\nC. Amnesia for the episodes is present.\nD. The episodes cause clinically significant distress or impairment in social,\noccupational, or other important areas of functioning.\nE. The disturbance is not attributable to the physiological effects of a substance\n(e.g., a drug of abuse, a medication).\nF. Coexisting mental disorders and medical conditions do not explain the episodes\nof sleepwalking or sleep terrors.\nSpecify whether:\nF51.3 Sleepwalking type\nSpecify if:\nWith sleep-related eating\nWith sleep-related sexual behavior (sexsomnia)\nF51.4 Sleep terror type"
    },
    {
      "id": "nightmare-disorder",
      "name": "Nightmare Disorder",
      "chapter": "Sleep-Wake Disorders",
      "icd10Code": "F51.5",
      "sourcePdfPages": [
        646,
        651
      ],
      "criteriaText": "A. Repeated occurrences of extended, extremely dysphoric, and well-remembered\ndreams that usually involve efforts to avoid threats to survival, security, or\nphysical integrity and that generally occur during the second half of the major\nsleep episode.\nB. On awakening from the dysphoric dreams, the individual rapidly becomes\noriented and alert.\nC. The sleep disturbance causes clinically significant distress or impairment in\nsocial, occupational, or other important areas of functioning.\nD. The nightmare symptoms are not attributable to the physiological effects of a\nsubstance (e.g., a drug of abuse, a medication).\nE. Coexisting mental disorders and medical conditions do not adequately explain\nthe predominant complaint of dysphoric dreams.\nSpecify if:\nDuring sleep onset\nSpecify if:\nWith mental disorder, including substance use disorders\nWith medical condition\nWith another sleep disorder\nCoding note: The code F51.5 applies to all three specifiers. Code also the\nrelevant associated mental disorder, medical condition, or other sleep disorder\nimmediately after the code for nightmare disorder in order to indicate the\nassociation.\nSpecify if:\nAcute: Duration of period of nightmares is 1 month or less.\nSubacute: Duration of period of nightmares is greater than 1 month but less\nthan 6 months.\nPersistent: Duration of period of nightmares is 6 months or greater.\nSpecify current severity:\nSeverity can be rated by the frequency with which the nightmares occur:\nMild: Less than one episode per week on average.\nModerate: One or more episodes per week but less than nightly.\nSevere: Episodes nightly."
    },
    {
      "id": "rapid-eye-movement-sleep-behavior-disorder",
      "name": "Rapid Eye Movement Sleep Behavior Disorder",
      "chapter": "Sleep-Wake Disorders",
      "icd10Code": "G47.52",
      "sourcePdfPages": [
        652,
        655
      ],
      "criteriaText": "A. Repeated episodes of arousal during sleep associated with vocalization and/or\ncomplex motor behaviors.\nB. These behaviors arise during rapid eye movement (REM) sleep and therefore\nusually occur more than 90 minutes after sleep onset, are more frequent during\nthe later portions of the sleep period, and uncommonly occur during daytime\nnaps.\nC. Upon awakening from these episodes, the individual is completely awake, alert,\nand not confused or disoriented.\nD. Either of the following:\n1. REM sleep without atonia on polysomnographic recording.\n2. A history suggestive of REM sleep behavior disorder and an established\nsynucleinopathy diagnosis (e.g., Parkinson\u2019s disease, multiple system\natrophy).\nE. The behaviors cause clinically significant distress or impairment in social,\noccupational, or other important areas of functioning (which may include injury to\nself or the bed partner).\nF. The disturbance is not attributable to the physiological effects of a substance\n(e.g., a drug of abuse, a medication) or another medical condition.\nG. Coexisting mental disorders and medical conditions do not explain the episodes."
    },
    {
      "id": "restless-legs-syndrome",
      "name": "Restless Legs Syndrome",
      "chapter": "Sleep-Wake Disorders",
      "icd10Code": "G25.81",
      "sourcePdfPages": [
        656,
        659
      ],
      "criteriaText": "A. An urge to move the legs, usually accompanied by or in response to\nuncomfortable and unpleasant sensations in the legs, characterized by all of the\nfollowing:\n1. The urge to move the legs begins or worsens during periods of rest or\ninactivity.\n2. The urge to move the legs is partially or totally relieved by movement.\n\n3. The urge to move the legs is worse in the evening or at night than during the\nday, or occurs only in the evening or at night.\nB. The symptoms in Criterion A occur at least three times per week and have\npersisted for at least 3 months.\nC. The symptoms in Criterion A are accompanied by significant distress or\nimpairment in social, occupational, educational, academic, behavioral, or other\nimportant areas of functioning.\nD. The symptoms in Criterion A are not attributable to another mental disorder or\nmedical condition (e.g., arthritis, leg edema, peripheral ischemia, leg cramps)\nand are not better explained by a behavioral condition (e.g., positional\ndiscomfort, habitual foot tapping).\nE. The symptoms are not attributable to the physiological effects of a drug of abuse\nor medication (e.g., akathisia)."
    },
    {
      "id": "substance-medication-induced-sleep-disorder",
      "name": "Substance/Medication-Induced Sleep Disorder",
      "chapter": "Sleep-Wake Disorders",
      "sourcePdfPages": [
        660,
        672
      ],
      "criteriaText": "A. A prominent and severe disturbance in sleep.\nB. There is evidence from the history, physical examination, or laboratory findings\nof both (1) and (2):\n1. The symptoms in Criterion A developed during or soon after substance\nintoxication or withdrawal or after exposure to or withdrawal from a\nmedication.\n2. The involved substance/medication is capable of producing the symptoms in\nCriterion A.\nC. The disturbance is not better explained by a sleep disorder that is not\nsubstance/medication-induced. Such evidence of an independent sleep disorder\ncould include the following:\nThe symptoms precede the onset of the substance/medication use; the\nsymptoms persist for a substantial period of time (e.g., about 1 month) after\nthe cessation of acute withdrawal or severe intoxication; or there is other\nevidence     suggesting    the    existence     of   an   independent     non-\nsubstance/medication-induced sleep disorder (e.g., a history of recurrent non-\nsubstance/medication-related episodes).\nD. The disturbance does not occur exclusively during the course of a delirium.\nE. The disturbance causes clinically significant distress or impairment in social,\noccupational, or other important areas of functioning.\nNote: This diagnosis should be made instead of a diagnosis of substance\nintoxication or substance withdrawal only when the symptoms in Criterion A\npredominate in the clinical picture and when they are sufficiently severe to warrant\nclinical attention.\nCoding note: The ICD-10-CM codes for the [specific substance/medication]-induced\nsleep disorders are indicated in the table below. Note that the ICD-10-CM code\ndepends on whether or not there is a comorbid substance use disorder present for\nthe same class of substance. In any case, an additional separate diagnosis of a\nsubstance use disorder is not given. If a mild substance use disorder is comorbid\nwith the substance-induced sleep disorder, the 4th position character is \u201C1,\u201D and the\nclinician should record \u201Cmild [substance] use disorder\u201D before the substance-induced\nsleep disorder (e.g., \u201Cmild cocaine use disorder with cocaine-induced sleep\ndisorder\u201D). If a moderate or severe substance use disorder is comorbid with the\nsubstance-induced sleep disorder, the 4th position character is \u201C2,\u201D and the clinician\nshould record \u201Cmoderate [substance] use disorder\u201D or \u201Csevere [substance] use\ndisorder,\u201D depending on the severity of the comorbid substance use disorder. If there\nis no comorbid substance use disorder (e.g., after a one-time heavy use of the\nsubstance), then the 4th position character is \u201C9,\u201D and the clinician should record\nonly the substance-induced sleep disorder.\nThere are two exceptions to this coding convention as it applies to caffeine- and\ntobacco-induced sleep disorders. Because caffeine use disorder is not an official\nDSM-5 category,\n\nthere is only a single ICD-10-CM code for caffeine-induced sleep disorder: F15.982.\nMoreover, because ICD-10-CM assumes that tobacco-induced sleep disorder can\nonly occur in the context of moderate or severe tobacco use disorder, the ICD-10-\nCM code for tobacco-induced sleep disorder is F17.208.\n\nICD-10-CM\nWith mild use    With moderate or     Without use\ndisorder      severe use disorder    disorder\nAlcohol                                   F10.182            F10.282           F10.982\nCaffeine                                    NA                 NA              F15.982\nCannabis                                  F12.188            F12.288           F12.988\nOpioid                                    F11.182            F11.282           F11.982\nSedative, hypnotic, or anxiolytic         F13.182            F13.282           F13.982\nAmphetamine-type substance (or other      F15.182            F15.282           F15.982\nstimulant)\nCocaine                                   F14.182            F14.282           F14.982\nTobacco                                     NA               F17.208             NA\nOther (or unknown) substance              F19.182            F19.282           F19.982\n\nSpecify whether:\nInsomnia type: Characterized by difficulty falling asleep or maintaining sleep,\nfrequent nocturnal awakenings, or nonrestorative sleep.\nDaytime sleepiness type: Characterized by predominant complaint of\nexcessive sleepiness/fatigue during waking hours or, less commonly, a long\nsleep period.\nParasomnia type: Characterized by abnormal behavioral events during sleep.\nMixed type: Characterized by a substance/medication-induced sleep problem\ncharacterized by multiple types of sleep symptoms, but no symptom clearly\npredominates.\nSpecify (see Table 1 in the chapter \u201CSubstance-Related and Addictive Disorders,\u201D\nwhich indicates whether \u201Cwith onset during intoxication\u201D and/or \u201Cwith onset during\nwithdrawal\u201D applies to a given substance class; or specify \u201Cwith onset after\nmedication use\u201D):\nWith onset during intoxication: If criteria are met for intoxication with the\nsubstance and the symptoms develop during the intoxication.\nWith onset during withdrawal: If criteria are met for withdrawal from the\nsubstance and the symptoms develop during, or shortly after, withdrawal.\nWith onset after medication use: If symptoms developed at initiation of\nmedication, with a change in use of medication, or during withdrawal of\nmedication."
    },
    {
      "id": "delayed-ejaculation",
      "name": "Delayed Ejaculation",
      "chapter": "Sexual Dysfunctions",
      "icd10Code": "F52.32",
      "sourcePdfPages": [
        673,
        676
      ],
      "criteriaText": "A. Either of the following symptoms must be experienced on almost all or all\noccasions (approximately 75%\u2013100%) of partnered sexual activity (in identified\nsituational contexts or, if generalized, in all contexts), and without the individual\ndesiring delay:\n1. Marked delay in ejaculation.\n2. Marked infrequency or absence of ejaculation.\nB. The symptoms in Criterion A have persisted for a minimum duration of\napproximately 6 months.\nC. The symptoms in Criterion A cause clinically significant distress in the individual.\nD. The sexual dysfunction is not better explained by a nonsexual mental disorder or\nas a consequence of severe relationship distress or other significant stressors\nand is not attributable to the effects of a substance/medication or another\nmedical condition.\nSpecify whether:\nLifelong: The disturbance has been present since the individual became\nsexually active.\nAcquired: The disturbance began after a period of relatively normal sexual\nfunction.\n\nSpecify whether:\nGeneralized: Not limited to certain types of stimulation, situations, or partners.\nSituational: Only occurs with certain types of stimulation, situations, or partners.\nSpecify current severity:\nMild: Evidence of mild distress over the symptoms in Criterion A.\nModerate: Evidence of moderate distress over the symptoms in Criterion A.\nSevere: Evidence of severe or extreme distress over the symptoms in Criterion\nA."
    },
    {
      "id": "erectile-disorder",
      "name": "Erectile Disorder",
      "chapter": "Sexual Dysfunctions",
      "icd10Code": "F52.21",
      "sourcePdfPages": [
        677,
        681
      ],
      "criteriaText": "A. At least one of the three following symptoms must be experienced on almost all\nor all (approximately 75%\u2013100%) occasions of sexual activity (in identified\nsituational contexts or, if generalized, in all contexts):\n1. Marked difficulty in obtaining an erection during sexual activity.\n2. Marked difficulty in maintaining an erection until the completion of sexual\nactivity.\n3. Marked decrease in erectile rigidity.\nB. The symptoms in Criterion A have persisted for a minimum duration of\napproximately 6 months.\nC. The symptoms in Criterion A cause clinically significant distress in the individual.\n\nD. The sexual dysfunction is not better explained by a nonsexual mental disorder or\nas a consequence of severe relationship distress or other significant stressors\nand is not attributable to the effects of a substance/medication or another\nmedical condition.\nSpecify whether:\nLifelong: The disturbance has been present since the individual became\nsexually active.\nAcquired: The disturbance began after a period of relatively normal sexual\nfunction.\nSpecify whether:\nGeneralized: Not limited to certain types of stimulation, situations, or partners.\nSituational: Only occurs with certain types of stimulation, situations, or partners.\nSpecify current severity:\nMild: Evidence of mild distress over the symptoms in Criterion A.\nModerate: Evidence of moderate distress over the symptoms in Criterion A.\nSevere: Evidence of severe or extreme distress over the symptoms in Criterion\nA."
    },
    {
      "id": "female-orgasmic-disorder",
      "name": "Female Orgasmic Disorder",
      "chapter": "Sexual Dysfunctions",
      "icd10Code": "F52.31",
      "sourcePdfPages": [
        682,
        685
      ],
      "criteriaText": "A. Presence of either of the following symptoms and experienced on almost all or\nall (approximately 75%\u2013100%) occasions of sexual activity (in identified\nsituational contexts or, if generalized, in all contexts):\n1. Marked delay in, marked infrequency of, or absence of orgasm.\n2. Markedly reduced intensity of orgasmic sensations.\nB. The symptoms in Criterion A have persisted for a minimum duration of\napproximately 6 months.\nC. The symptoms in Criterion A cause clinically significant distress in the individual.\nD. The sexual dysfunction is not better explained by a nonsexual mental disorder or\nas a consequence of severe relationship distress (e.g., partner violence) or other\nsignificant stressors and is not attributable to the effects of a\nsubstance/medication or another medical condition.\nSpecify whether:\nLifelong: The disturbance has been present since the individual became\nsexually active.\nAcquired: The disturbance began after a period of relatively normal sexual\nfunction.\n\nSpecify whether:\nGeneralized: Not limited to certain types of stimulation, situations, or partners.\nSituational: Only occurs with certain types of stimulation, situations, or partners.\nSpecify if:\nNever experienced an orgasm under any situation.\nSpecify current severity:\nMild: Evidence of mild distress over the symptoms in Criterion A.\nModerate: Evidence of moderate distress over the symptoms in Criterion A.\nSevere: Evidence of severe or extreme distress over the symptoms in Criterion\nA."
    },
    {
      "id": "female-sexual-interest-arousal-disorder",
      "name": "Female Sexual Interest/Arousal Disorder",
      "chapter": "Sexual Dysfunctions",
      "icd10Code": "F52.22",
      "sourcePdfPages": [
        686,
        690
      ],
      "criteriaText": "A. Lack of, or significantly reduced, sexual interest/arousal, as manifested by at\nleast three of the following:\n1. Absent/reduced interest in sexual activity.\n2. Absent/reduced sexual/erotic thoughts or fantasies.\n3. No/reduced initiation of sexual activity, and typically unreceptive to a partner\u2019s\nattempts to initiate.\n4. Absent/reduced sexual excitement/pleasure during sexual activity in almost\nall or all (approximately 75%\u2013100%) sexual encounters (in identified\nsituational contexts or, if generalized, in all contexts).\n5. Absent/reduced sexual interest/arousal in response to any internal or external\nsexual/erotic cues (e.g., written, verbal, visual).\n6. Absent/reduced genital or nongenital sensations during sexual activity in\nalmost all or all (approximately 75%\u2013100%) sexual encounters (in identified\nsituational contexts or, if generalized, in all contexts).\nB. The symptoms in Criterion A have persisted for a minimum duration of\napproximately 6 months.\nC. The symptoms in Criterion A cause clinically significant distress in the individual.\nD. The sexual dysfunction is not better explained by a nonsexual mental disorder or\nas a consequence of severe relationship distress (e.g., partner violence) or other\nsignificant stressors and is not attributable to the effects of a\nsubstance/medication or another medical condition.\nSpecify whether:\nLifelong: The disturbance has been present since the individual became\nsexually active.\nAcquired: The disturbance began after a period of relatively normal sexual\nfunction.\nSpecify whether:\nGeneralized: Not limited to certain types of stimulation, situations, or partners.\nSituational: Only occurs with certain types of stimulation, situations, or partners.\nSpecify current severity:\nMild: Evidence of mild distress over the symptoms in Criterion A.\nModerate: Evidence of moderate distress over the symptoms in Criterion A.\nSevere: Evidence of severe or extreme distress over the symptoms in Criterion\nA."
    },
    {
      "id": "genito-pelvic-pain-penetration-disorder",
      "name": "Genito-Pelvic Pain/Penetration Disorder",
      "chapter": "Sexual Dysfunctions",
      "icd10Code": "F52.6",
      "sourcePdfPages": [
        691,
        696
      ],
      "criteriaText": "A. Persistent or recurrent difficulties with one (or more) of the following:\n1. Vaginal penetration during intercourse.\n2. Marked vulvovaginal or pelvic pain during vaginal intercourse or penetration\nattempts.\n3. Marked fear or anxiety about vulvovaginal or pelvic pain in anticipation of,\nduring, or as a result of vaginal penetration.\n4. Marked tensing or tightening of the pelvic floor muscles during attempted\nvaginal penetration.\nB. The symptoms in Criterion A have persisted for a minimum duration of\napproximately 6 months.\nC. The symptoms in Criterion A cause clinically significant distress in the individual.\nD. The sexual dysfunction is not better explained by a nonsexual mental disorder or\nas a consequence of a severe relationship distress (e.g., partner violence) or\nother significant stressors and is not attributable to the effects of a\nsubstance/medication or another medical condition.\n\nSpecify whether:\nLifelong: The disturbance has been present since the individual became\nsexually active.\nAcquired: The disturbance began after a period of relatively normal sexual\nfunction.\nSpecify current severity:\nMild: Evidence of mild distress over the symptoms in Criterion A.\nModerate: Evidence of moderate distress over the symptoms in Criterion A.\nSevere: Evidence of severe or extreme distress over the symptoms in Criterion\nA."
    },
    {
      "id": "male-hypoactive-sexual-desire-disorder",
      "name": "Male Hypoactive Sexual Desire Disorder",
      "chapter": "Sexual Dysfunctions",
      "icd10Code": "F52.0",
      "sourcePdfPages": [
        697,
        700
      ],
      "criteriaText": "A. Persistently or recurrently deficient (or absent) sexual/erotic thoughts or\nfantasies and desire for sexual activity. The judgment of deficiency is made by\nthe clinician, taking into account factors that affect sexual functioning, such as\nage and general and sociocultural contexts of the individual\u2019s life.\nB. The symptoms in Criterion A have persisted for a minimum duration of\napproximately 6 months.\nC. The symptoms in Criterion A cause clinically significant distress in the individual.\nD. The sexual dysfunction is not better explained by a nonsexual mental disorder or\nas a consequence of severe relationship distress or other significant stressors\nand is not attributable to the effects of a substance/medication or another\nmedical condition.\nSpecify whether:\nLifelong: The disturbance has been present since the individual became\nsexually active.\nAcquired: The disturbance began after a period of relatively normal sexual\nfunction.\n\nSpecify whether:\nGeneralized: Not limited to certain types of stimulation, situations, or partners.\nSituational: Only occurs with certain types of stimulation, situations, or partners.\nSpecify current severity:\nMild: Evidence of mild distress over the symptoms in Criterion A.\nModerate: Evidence of moderate distress over the symptoms in Criterion A.\nSevere: Evidence of severe or extreme distress over the symptoms in Criterion\nA."
    },
    {
      "id": "premature-early-ejaculation",
      "name": "Premature (Early) Ejaculation",
      "chapter": "Sexual Dysfunctions",
      "icd10Code": "F52.4",
      "sourcePdfPages": [
        701,
        704
      ],
      "criteriaText": "A. A persistent or recurrent pattern of ejaculation occurring during partnered sexual\nactivity within approximately 1 minute following vaginal penetration and before\nthe individual wishes it.\n\nNote: Although the diagnosis of premature (early) ejaculation may be applied to\nindividuals engaged in nonvaginal sexual activities, specific duration criteria have\nnot been established for these activities.\nB. The symptom in Criterion A must have been present for at least 6 months and\nmust be experienced on almost all or all (approximately 75%\u2013100%) occasions\nof sexual activity (in identified situational contexts or, if generalized, in all\ncontexts).\nC. The symptom in Criterion A causes clinically significant distress in the individual.\nD. The sexual dysfunction is not better explained by a nonsexual mental disorder or\nas a consequence of severe relationship distress or other significant stressors\nand is not attributable to the effects of a substance/medication or another\nmedical condition.\nSpecify whether:\nLifelong: The disturbance has been present since the individual became\nsexually active.\nAcquired: The disturbance began after a period of relatively normal sexual\nfunction.\nSpecify whether:\nGeneralized: Not limited to certain types of stimulation, situations, or partners.\nSituational: Only occurs with certain types of stimulation, situations, or partners.\nSpecify current severity:\nMild: Ejaculation occurring within approximately 30 seconds to 1 minute of\nvaginal penetration.\nModerate: Ejaculation occurring within approximately 15\u201330 seconds of vaginal\npenetration.\nSevere: Ejaculation occurring prior to sexual activity, at the start of sexual\nactivity, or within approximately 15 seconds of vaginal penetration."
    },
    {
      "id": "substance-medication-induced-sexual-dysfunction",
      "name": "Substance/Medication-Induced Sexual Dysfunction",
      "chapter": "Sexual Dysfunctions",
      "sourcePdfPages": [
        705,
        713
      ],
      "criteriaText": "A. A clinically significant disturbance in sexual function is predominant in the clinical\npicture.\nB. There is evidence from the history, physical examination, or laboratory findings\nof both (1) and (2):\n\n1. The symptoms in Criterion A developed during or soon after substance\nintoxication or withdrawal or after exposure to or withdrawal from a\nmedication.\n2. The involved substance/medication is capable of producing the symptoms in\nCriterion A.\nC. The disturbance is not better explained by a sexual dysfunction that is not\nsubstance/medication-induced. Such evidence of an independent sexual\ndysfunction could include the following:\nThe symptoms precede the onset of the substance/medication use; the\nsymptoms persist for a substantial period of time (e.g., about 1 month) after\nthe cessation of acute withdrawal or severe intoxication; or there is other\nevidence    suggesting     the     existence  of   an     independent   non-\nsubstance/medication-induced sexual dysfunction (e.g., a history of recurrent\nnon-substance/medication-related episodes).\nD. The disturbance does not occur exclusively during the course of a delirium.\nE. The disturbance causes clinically significant distress in the individual.\nNote: This diagnosis should be made instead of a diagnosis of substance\nintoxication or substance withdrawal only when the symptoms in Criterion A\npredominate in the clinical picture and are sufficiently severe to warrant clinical\nattention.\nCoding note: The ICD-10-CM codes for the [specific substance/medication]-induced\nsexual dysfunctions are indicated in the table below. Note that the ICD-10-CM code\ndepends on whether or not there is a comorbid substance use disorder present for\nthe same class of substance. In any case, an additional separate diagnosis of a\nsubstance use disorder is not given. If a mild substance use disorder is comorbid\nwith the substance-induced sexual dysfunction, the 4th position character is \u201C1,\u201D and\nthe clinician should record \u201Cmild [substance] use disorder\u201D before the substance-\ninduced sexual dysfunction (e.g., \u201Cmild cocaine use disorder with cocaine-induced\nsexual dysfunction\u201D). If a moderate or severe substance use disorder is comorbid\nwith the substance-induced sexual dysfunction, the 4th position character is \u201C2,\u201D and\nthe clinician should record \u201Cmoderate [substance] use disorder\u201D or \u201Csevere\n[substance] use disorder,\u201D depending on the severity of the comorbid substance use\ndisorder. If there is no comorbid substance use disorder (e.g., after a one-time heavy\nuse of the substance), then the 4th position character is \u201C9,\u201D and the clinician should\nrecord only the substance-induced sexual dysfunction.\n\nICD-10-CM\nWith mild use    With moderate or     Without use\ndisorder      severe use disorder    disorder\nAlcohol                                   F10.181            F10.281           F10.981\nOpioid                                    F11.181            F11.281           F11.981\nSedative, hypnotic, or anxiolytic         F13.181            F13.281           F13.981\nAmphetamine-type substance (or other      F15.181            F15.281           F15.981\nstimulant)\nCocaine                                   F14.181            F14.281           F14.981\nOther (or unknown) substance              F19.181            F19.281           F19.981\n\nSpecify (see Table 1 in the chapter \u201CSubstance-Related and Addictive Disorders,\u201D\nwhich indicates whether \u201Cwith onset during intoxication\u201D and/or \u201Cwith onset during\nwithdrawal\u201D applies to a given substance class; or specify \u201Cwith onset after\nmedication use\u201D):\nWith onset during intoxication: If criteria are met for intoxication with the\nsubstance and the symptoms develop during intoxication.\nWith onset during withdrawal: If criteria are met for withdrawal from the\nsubstance and the symptoms develop during, or shortly after, withdrawal.\nWith onset after medication use: If symptoms developed at initiation of\nmedication, with a change in use of medication, or during withdrawal of\nmedication.\nSpecify current severity:\nMild: Occurs on 25%\u201350% of occasions of sexual activity.\nModerate: Occurs on 50%\u201375% of occasions of sexual activity.\nSevere: Occurs on 75% or more of occasions of sexual activity."
    },
    {
      "id": "gender-dysphoria-in-children",
      "name": "Gender Dysphoria in Children",
      "chapter": "Gender Dysphoria",
      "icd10Code": "F64.2",
      "sourcePdfPages": [
        714,
        727
      ],
      "sharedSectionTitle": "Gender Dysphoria",
      "criteriaText": "A. A marked incongruence between one\u2019s experienced/expressed gender and\nassigned gender, of at least 6 months\u2019 duration, as manifested by at least six of\nthe following (one of which must be Criterion A1):\n1. A strong desire to be of the other gender or an insistence that one is the other\ngender (or some alternative gender different from one\u2019s assigned gender).\n2. In boys (assigned gender), a strong preference for cross-dressing or\nsimulating female attire; or in girls (assigned gender), a strong preference for\nwearing only typical masculine clothing and a strong resistance to the\nwearing of typical feminine clothing.\n3. A strong preference for cross-gender roles in make-believe play or fantasy\nplay.\n4. A strong preference for the toys, games, or activities stereotypically used or\nengaged in by the other gender.\n5. A strong preference for playmates of the other gender.\n6. In boys (assigned gender), a strong rejection of typically masculine toys,\ngames, and activities and a strong avoidance of rough-and-tumble play; or in\ngirls (assigned gender), a strong rejection of typically feminine toys, games,\nand activities.\n7. A strong dislike of one\u2019s sexual anatomy.\n8. A strong desire for the primary and/or secondary sex characteristics that\nmatch one\u2019s experienced gender.\nB. The condition is associated with clinically significant distress or impairment in\nsocial, school, or other important areas of functioning.\nSpecify if:\nWith a disorder/difference of sex development (e.g., a congenital\nadrenogenital disorder such as E25.0 congenital adrenal hyperplasia or E34.50\nandrogen insensitivity syndrome).\nCoding note: Code the disorder/difference of sex development as well as\ngender dysphoria."
    },
    {
      "id": "gender-dysphoria-in-adolescents-and-adults",
      "name": "Gender Dysphoria in Adolescents and Adults",
      "chapter": "Gender Dysphoria",
      "icd10Code": "F64.0",
      "sourcePdfPages": [
        714,
        727
      ],
      "sharedSectionTitle": "Gender Dysphoria",
      "criteriaText": "A. A marked incongruence between one\u2019s experienced/expressed gender\nand assigned gender, of at least 6 months\u2019 duration, as manifested by at least\ntwo of the following:\n1. A marked incongruence between one\u2019s experienced/expressed gender and\nprimary and/or secondary sex characteristics (or in young adolescents, the\nanticipated secondary sex characteristics).\n\n2. A strong desire to be rid of one\u2019s primary and/or secondary sex\ncharacteristics because of a marked incongruence with one\u2019s\nexperienced/expressed gender (or in young adolescents, a desire to prevent\nthe development of the anticipated secondary sex characteristics).\n3. A strong desire for the primary and/or secondary sex characteristics of the\nother gender.\n4. A strong desire to be of the other gender (or some alternative gender different\nfrom one\u2019s assigned gender).\n5. A strong desire to be treated as the other gender (or some alternative gender\ndifferent from one\u2019s assigned gender).\n6. A strong conviction that one has the typical feelings and reactions of the other\ngender (or some alternative gender different from one\u2019s assigned gender).\nB. The condition is associated with clinically significant distress or impairment in\nsocial, occupational, or other important areas of functioning.\nSpecify if:\nWith a disorder/difference of sex development (e.g., a congenital\nadrenogenital disorder such as E25.0 congenital adrenal hyperplasia or E34.50\nandrogen insensitivity syndrome).\nCoding note: Code the disorder/difference of sex development as well as\ngender dysphoria.\nSpecify if:\nPosttransition: The individual has transitioned to full-time living in the\nexperienced gender (with or without legalization of gender change) and has\nundergone (or is preparing to have) at least one gender-affirming medical\nprocedure or treatment regimen\u2014namely, regular gender-affirming hormone\ntreatment or gender reassignment surgery confirming the experienced gender\n(e.g., breast augmentation surgery and/or vulvovaginoplasty in an individual\nassigned male at birth; transmasculine chest surgery and/or phalloplasty or\nmetoidioplasty in an individual assigned female at birth)."
    },
    {
      "id": "oppositional-defiant-disorder",
      "name": "Oppositional Defiant Disorder",
      "chapter": "Disruptive, Impulse-Control, and Conduct Disorders",
      "icd10Code": "F91.3",
      "sourcePdfPages": [
        728,
        733
      ],
      "criteriaText": "A. A pattern of angry/irritable mood, argumentative/defiant behavior, or\nvindictiveness lasting at least 6 months as evidenced by at least four symptoms\nfrom any of the following categories, and exhibited during interaction with at least\none individual who is not a sibling.\nAngry/Irritable Mood\n1. Often loses temper.\n2. Is often touchy or easily annoyed.\n3. Is often angry and resentful.\nArgumentative/Defiant Behavior\n4. Often argues with authority figures or, for children and adolescents, with\nadults.\n5. Often actively defies or refuses to comply with requests from authority figures\nor with rules.\n6. Often deliberately annoys others.\n7. Often blames others for his or her mistakes or misbehavior.\nVindictiveness\n8. Has been spiteful or vindictive at least twice within the past 6 months.\nNote: The persistence and frequency of these behaviors should be used to\ndistinguish a behavior that is within normal limits from a behavior that is\nsymptomatic. For children younger than 5 years, the behavior should occur on\nmost days for a period of at least 6 months unless otherwise noted (Criterion\nA8). For individuals 5 years or older, the behavior should occur at least once\nper week for at least 6 months, unless otherwise noted (Criterion A8). While\nthese frequency criteria provide guidance on a minimal level of frequency to\ndefine symptoms, other factors should also be considered, such as whether the\nfrequency and intensity of the behaviors are outside a range that is normative\nfor the individual\u2019s developmental level, gender, and culture.\nB. The disturbance in behavior is associated with distress in the individual or others\nin his or her immediate social context (e.g., family, peer group, work colleagues),\nor it impacts negatively on social, educational, occupational, or other important\nareas of functioning.\n\nC. The behaviors do not occur exclusively during the course of a psychotic,\nsubstance use, depressive, or bipolar disorder. Also, the criteria are not met for\ndisruptive mood dysregulation disorder.\nSpecify current severity:\nMild: Symptoms are confined to only one setting (e.g., at home, at school, at\nwork, with peers).\nModerate: Some symptoms are present in at least two settings.\nSevere: Some symptoms are present in three or more settings."
    },
    {
      "id": "intermittent-explosive-disorder",
      "name": "Intermittent Explosive Disorder",
      "chapter": "Disruptive, Impulse-Control, and Conduct Disorders",
      "icd10Code": "F63.81",
      "sourcePdfPages": [
        734,
        737
      ],
      "criteriaText": "A. Recurrent behavioral outbursts representing a failure to control aggressive\nimpulses as manifested by either of the following:\n1. Verbal aggression (e.g., temper tantrums, tirades, verbal arguments or fights)\nor physical aggression toward property, animals, or other individuals,\noccurring twice weekly, on average, for a period of 3 months. The physical\naggression does not result in damage or destruction of property and does not\nresult in physical injury to animals or other individuals.\n2. Three behavioral outbursts involving damage or destruction of property\nand/or physical assault involving physical injury against animals or other\nindividuals occurring within a 12-month period.\nB. The magnitude of aggressiveness expressed during the recurrent outbursts is\ngrossly out of proportion to the provocation or to any precipitating psychosocial\nstressors.\nC. The recurrent aggressive outbursts are not premeditated (i.e., they are impulsive\nand/or anger-based) and are not committed to achieve some tangible objective\n(e.g., money, power, intimidation).\nD. The recurrent aggressive outbursts cause either marked distress in the individual\nor impairment in occupational or interpersonal functioning, or are associated with\nfinancial or legal consequences.\nE. Chronological age is at least 6 years (or equivalent developmental level).\nF. The recurrent aggressive outbursts are not better explained by another mental\ndisorder (e.g., major depressive disorder, bipolar disorder, disruptive mood\ndysregulation disorder, a psychotic disorder, antisocial personality disorder,\nborderline personality disorder) and are not attributable to another medical\ncondition (e.g., head trauma, Alzheimer\u2019s disease) or to the physiological effects\nof a substance (e.g., a drug of abuse, a medication). For children ages 6\u201318\nyears, aggressive behavior that occurs as part of an adjustment disorder should\nnot be considered for this diagnosis.\nNote: This diagnosis can be made in addition to the diagnosis of attention-\ndeficit/hyperactivity disorder, conduct disorder, oppositional defiant disorder, or\nautism spectrum disorder when recurrent impulsive aggressive outbursts are in\nexcess of those usually seen in these disorders and warrant independent clinical\nattention."
    },
    {
      "id": "conduct-disorder",
      "name": "Conduct Disorder",
      "chapter": "Disruptive, Impulse-Control, and Conduct Disorders",
      "sourcePdfPages": [
        738,
        746
      ],
      "criteriaText": "A. A repetitive and persistent pattern of behavior in which the basic rights of others\nor major age-appropriate societal norms or rules are violated, as manifested by\nthe presence of at least three of the following 15 criteria in the past 12 months\nfrom any of the categories below, with at least one criterion present in the past 6\nmonths:\n\nAggression to People and Animals\n1. Often bullies, threatens, or intimidates others.\n2. Often initiates physical fights.\n3. Has used a weapon that can cause serious physical harm to others (e.g., a\nbat, brick, broken bottle, knife, gun).\n4. Has been physically cruel to people.\n5. Has been physically cruel to animals.\n6. Has stolen while confronting a victim (e.g., mugging, purse snatching,\nextortion, armed robbery).\n7. Has forced someone into sexual activity.\nDestruction of Property\n8. Has deliberately engaged in fire setting with the intention of causing serious\ndamage.\n9. Has deliberately destroyed others\u2019 property (other than by fire setting).\nDeceitfulness or Theft\n10. Has broken into someone else\u2019s house, building, or car.\n11. Often lies to obtain goods or favors or to avoid obligations (i.e., \u201Ccons\u201D\nothers).\n12. Has stolen items of nontrivial value without confronting a victim (e.g.,\nshoplifting, but without breaking and entering; forgery).\nSerious Violations of Rules\n13. Often stays out at night despite parental prohibitions, beginning before age 13\nyears.\n14. Has run away from home overnight at least twice while living in the parental\nor parental surrogate home, or once without returning for a lengthy period.\n15. Is often truant from school, beginning before age 13 years.\nB. The disturbance in behavior causes clinically significant impairment in social,\nacademic, or occupational functioning.\nC. If the individual is age 18 years or older, criteria are not met for antisocial\npersonality disorder.\nSpecify whether:\nF91.1 Childhood-onset type: Individuals show at least one symptom\ncharacteristic of conduct disorder prior to age 10 years.\nF91.2 Adolescent-onset type: Individuals show no symptom characteristic of\nconduct disorder prior to age 10 years.\nF91.9 Unspecified onset: Criteria for a diagnosis of conduct disorder are met,\nbut there is not enough information available to determine whether the onset of\nthe first symptom was before or after age 10 years.\nSpecify if:\nWith limited prosocial emotions: To qualify for this specifier, an individual\nmust have displayed at least two of the following characteristics persistently over\nat least 12 months and in multiple relationships and settings. These\ncharacteristics reflect the individual\u2019s typical pattern of interpersonal and\nemotional functioning over this period and not just occasional occurrences in\nsome situations. Thus, to assess the criteria for the specifier, multiple information\nsources are necessary. In addition to the individual\u2019s self-report, it is necessary\nto consider reports by others who have known the individual for extended\nperiods of time (e.g., parents, teachers, co-workers, extended family members,\npeers).\n\nLack of remorse or guilt: Does not feel bad or guilty when he or she does\nsomething wrong (exclude remorse when expressed only when caught and/or\nfacing punishment). The individual shows a general lack of concern about the\nnegative consequences of his or her actions. For example, the individual is not\nremorseful after hurting someone or does not care about the consequences of\nbreaking rules.\nCallous\u2014lack of empathy: Disregards and is unconcerned about the feelings\nof others. The individual is described as cold and uncaring. The individual\nappears more concerned about the effects of his or her actions on himself or\nherself, rather than their effects on others, even when they result in substantial\nharm to others.\nUnconcerned about performance: Does not show concern about\npoor/problematic performance at school, at work, or in other important\nactivities. The individual does not put forth the effort necessary to perform well,\neven when expectations are clear, and typically blames others for his or her\npoor performance.\nShallow or deficient affect: Does not express feelings or show emotions to\nothers, except in ways that seem shallow, insincere, or superficial (e.g.,\nactions contradict the emotion displayed; can turn emotions \u201Con\u201D or \u201Coff\u201D\nquickly) or when emotional expressions are used for gain (e.g., emotions\ndisplayed to manipulate or intimidate others).\nSpecify current severity:\nMild: Few if any conduct problems in excess of those required to make the\ndiagnosis are present, and conduct problems cause relatively minor harm to\nothers (e.g., lying, truancy, staying out after dark without permission, other rule\nbreaking).\nModerate: The number of conduct problems and the effect on others are\nintermediate between those specified in \u201Cmild\u201D and those in \u201Csevere\u201D (e.g.,\nstealing without confronting a victim, vandalism).\nSevere: Many conduct problems in excess of those required to make the\ndiagnosis are present, or conduct problems cause considerable harm to others\n(e.g., forced sex, physical cruelty, use of a weapon, stealing while confronting a\nvictim, breaking and entering)."
    },
    {
      "id": "pyromania",
      "name": "Pyromania",
      "chapter": "Disruptive, Impulse-Control, and Conduct Disorders",
      "icd10Code": "F63.1",
      "sourcePdfPages": [
        747,
        748
      ],
      "criteriaText": "A. Deliberate and purposeful fire setting on more than one occasion.\nB. Tension or affective arousal before the act.\nC. Fascination with, interest in, curiosity about, or attraction to fire and its situational\ncontexts (e.g., paraphernalia, uses, consequences).\nD. Pleasure, gratification, or relief when setting fires or when witnessing or\nparticipating in their aftermath.\nE. The fire setting is not done for monetary gain, as an expression of sociopolitical\nideology, to conceal criminal activity, to express anger or vengeance, to improve\none\u2019s living circumstances, in response to a delusion or hallucination, or as a\nresult of impaired judgment (e.g., in major neurocognitive disorder, intellectual\ndevelopmental disorder [intellectual disability], substance intoxication).\nF. The fire setting is not better explained by conduct disorder, a manic episode, or\nantisocial personality disorder."
    },
    {
      "id": "kleptomania",
      "name": "Kleptomania",
      "chapter": "Disruptive, Impulse-Control, and Conduct Disorders",
      "icd10Code": "F63.2",
      "sourcePdfPages": [
        749,
        764
      ],
      "criteriaText": "A. Recurrent failure to resist impulses to steal objects that are not needed for\npersonal use or for their monetary value.\nB. Increasing sense of tension immediately before committing the theft.\nC. Pleasure, gratification, or relief at the time of committing the theft.\nD. The stealing is not committed to express anger or vengeance and is not in\nresponse to a delusion or a hallucination.\nE. The stealing is not better explained by conduct disorder, a manic episode, or\nantisocial personality disorder."
    },
    {
      "id": "alcohol-use-disorder",
      "name": "Alcohol Use Disorder",
      "chapter": "Substance-Related and Addictive Disorders",
      "sourcePdfPages": [
        765,
        774
      ],
      "criteriaText": "A. A problematic pattern of alcohol use leading to clinically significant impairment or\ndistress, as manifested by at least two of the following, occurring within a 12-\nmonth period:\n1. Alcohol is often taken in larger amounts or over a longer period than was\nintended.\n2. There is a persistent desire or unsuccessful efforts to cut down or control\nalcohol use.\n3. A great deal of time is spent in activities necessary to obtain alcohol, use\nalcohol, or recover from its effects.\n4. Craving, or a strong desire or urge to use alcohol.\n5. Recurrent alcohol use resulting in a failure to fulfill major role obligations at\nwork, school, or home.\n6. Continued alcohol use despite having persistent or recurrent social or\ninterpersonal problems caused or exacerbated by the effects of alcohol.\n7. Important social, occupational, or recreational activities are given up or\nreduced because of alcohol use.\n8. Recurrent alcohol use in situations in which it is physically hazardous.\n\n9. Alcohol use is continued despite knowledge of having a persistent or\nrecurrent physical or psychological problem that is likely to have been caused\nor exacerbated by alcohol.\n10. Tolerance, as defined by either of the following:\na. A need for markedly increased amounts of alcohol to achieve intoxication\nor desired effect.\nb. A markedly diminished effect with continued use of the same amount of\nalcohol.\n11. Withdrawal, as manifested by either of the following:\na. The characteristic withdrawal syndrome for alcohol (refer to Criteria A and\nB of the criteria set for alcohol withdrawal).\nb. Alcohol (or a closely related substance, such as a benzodiazepine) is\ntaken to relieve or avoid withdrawal symptoms.\nSpecify if:\nIn early remission: After full criteria for alcohol use disorder were previously\nmet, none of the criteria for alcohol use disorder have been met for at least 3\nmonths but for less than 12 months (with the exception that Criterion A4,\n\u201CCraving, or a strong desire or urge to use alcohol,\u201D may be met).\nIn sustained remission: After full criteria for alcohol use disorder were\npreviously met, none of the criteria for alcohol use disorder have been met at\nany time during a period of 12 months or longer (with the exception that Criterion\nA4, \u201CCraving, or a strong desire or urge to use alcohol,\u201D may be met).\nSpecify if:\nIn a controlled environment: This additional specifier is used if the individual is\nin an environment where access to alcohol is restricted.\nCode based on current severity/remission: If an alcohol intoxication, alcohol\nwithdrawal, or another alcohol-induced mental disorder is also present, do not use\nthe codes below for alcohol use disorder. Instead, the comorbid alcohol use disorder\nis indicated in the 4th character of the alcohol-induced disorder code (see the coding\nnote for alcohol intoxication, alcohol withdrawal, or a specific alcohol-induced mental\ndisorder). For example, if there is comorbid alcohol intoxication and alcohol use\ndisorder, only the alcohol intoxication code is given, with the 4th character indicating\nwhether the comorbid alcohol use disorder is mild, moderate, or severe: F10.129 for\nmild alcohol use disorder with alcohol intoxication or F10.229 for a moderate or\nsevere alcohol use disorder with alcohol intoxication.\nSpecify current severity/remission:\nF10.10 Mild: Presence of 2\u20133 symptoms.\nF10.11 Mild, In early remission\nF10.11 Mild, In sustained remission\nF10.20 Moderate: Presence of 4\u20135 symptoms.\nF10.21 Moderate, In early remission\nF10.21 Moderate, In sustained remission\nF10.20 Severe: Presence of 6 or more symptoms.\nF10.21 Severe, In early remission\nF10.21 Severe, In sustained remission"
    },
    {
      "id": "alcohol-intoxication",
      "name": "Alcohol Intoxication",
      "chapter": "Substance-Related and Addictive Disorders",
      "sourcePdfPages": [
        775,
        778
      ],
      "criteriaText": "A. Recent ingestion of alcohol.\nB. Clinically significant problematic behavioral or psychological changes (e.g.,\ninappropriate sexual or aggressive behavior, mood lability, impaired judgment)\nthat developed during, or shortly after, alcohol ingestion.\nC. One (or more) of the following signs or symptoms developing during, or shortly\nafter, alcohol use:\n1.   Slurred speech.\n2.   Incoordination.\n3.   Unsteady gait.\n4.   Nystagmus.\n5.   Impairment in attention or memory.\n6.   Stupor or coma.\nD. The signs or symptoms are not attributable to another medical condition and are\nnot better explained by another mental disorder, including intoxication with\nanother substance.\nCoding note: The ICD-10-CM code depends on whether there is a comorbid alcohol\nuse disorder. If a mild alcohol use disorder is comorbid, the ICD-10-CM code is\nF10.120, and if a moderate or severe alcohol use disorder is comorbid, the ICD-10-\nCM code is F10.220. If there is no comorbid alcohol use disorder, then the ICD-10-\nCM code is F10.920."
    },
    {
      "id": "alcohol-withdrawal",
      "name": "Alcohol Withdrawal",
      "chapter": "Substance-Related and Addictive Disorders",
      "sourcePdfPages": [
        779,
        783
      ],
      "criteriaText": "A. Cessation of (or reduction in) alcohol use that has been heavy and prolonged.\nB. Two (or more) of the following, developing within several hours to a few days\nafter the cessation of (or reduction in) alcohol use described in Criterion A:\n1.   Autonomic hyperactivity (e.g., sweating or pulse rate greater than 100 bpm).\n2.   Increased hand tremor.\n3.   Insomnia.\n4.   Nausea or vomiting.\n5.   Transient visual, tactile, or auditory hallucinations or illusions.\n6.   Psychomotor agitation.\n7.   Anxiety.\n8.   Generalized tonic-clonic seizures.\nC. The signs or symptoms in Criterion B cause clinically significant distress or\nimpairment in social, occupational, or other important areas of functioning.\n\nD. The signs or symptoms are not attributable to another medical condition and are\nnot better explained by another mental disorder, including intoxication or\nwithdrawal from another substance.\nSpecify if:\nWith perceptual disturbances: This specifier applies in the rare instance when\nhallucinations (usually visual or tactile) occur with intact reality testing, or\nauditory, visual, or tactile illusions occur in the absence of a delirium.\nCoding note: The ICD-10-CM code depends on whether or not there is a comorbid\nalcohol use disorder and whether or not there are perceptual disturbances.\nFor alcohol withdrawal, without perceptual disturbances: If a mild alcohol\nuse disorder is comorbid, the ICD-10-CM code is F10.130, and if a moderate or\nsevere alcohol use disorder is comorbid, the ICD-10-CM code is F10.230. If\nthere is no comorbid alcohol use disorder, then the ICD-10-CM code is F10.930.\nFor alcohol withdrawal, with perceptual disturbances: If a mild alcohol use\ndisorder is comorbid, the ICD-10-CM code is F10.132, and if a moderate or\nsevere alcohol use disorder is comorbid, the ICD-10-CM code is F10.232. If\nthere is no comorbid alcohol use disorder, then the ICD-10-CM code is F10.932."
    },
    {
      "id": "caffeine-intoxication",
      "name": "Caffeine Intoxication",
      "chapter": "Substance-Related and Addictive Disorders",
      "icd10Code": "F15.920",
      "sourcePdfPages": [
        784,
        786
      ],
      "criteriaText": "A. Recent consumption of caffeine (typically a high dose well in excess of 250 mg).\nB. Five (or more) of the following signs or symptoms developing during, or shortly\nafter, caffeine use:\n1.   Restlessness.\n2.   Nervousness.\n3.   Excitement.\n4.   Insomnia.\n5.   Flushed face.\n6.   Diuresis.\n7.   Gastrointestinal disturbance.\n8.   Muscle twitching.\n9.   Rambling flow of thought and speech.\n10.   Tachycardia or cardiac arrhythmia.\n11.   Periods of inexhaustibility.\n12.   Psychomotor agitation.\nC. The signs or symptoms in Criterion B cause clinically significant distress or\nimpairment in social, occupational, or other important areas of functioning.\nD. The signs or symptoms are not attributable to another medical condition and are\nnot better explained by another mental disorder, including intoxication with\nanother substance."
    },
    {
      "id": "caffeine-withdrawal",
      "name": "Caffeine Withdrawal",
      "chapter": "Substance-Related and Addictive Disorders",
      "icd10Code": "F15.93",
      "sourcePdfPages": [
        787,
        790
      ],
      "criteriaText": "A. Prolonged daily use of caffeine.\nB. Abrupt cessation of or reduction in caffeine use, followed within 24 hours by\nthree (or more) of the following signs or symptoms:\n1.   Headache.\n2.   Marked fatigue or drowsiness.\n3.   Dysphoric mood, depressed mood, or irritability.\n4.   Difficulty concentrating.\n5.   Flu-like symptoms (nausea, vomiting, or muscle pain/stiffness).\n\nC. The signs or symptoms in Criterion B cause clinically significant distress or\nimpairment in social, occupational, or other important areas of functioning.\nD. The signs or symptoms are not associated with the physiological effects of\nanother medical condition (e.g., migraine, viral illness) and are not better\nexplained by another mental disorder, including intoxication or withdrawal from\nanother substance."
    },
    {
      "id": "cannabis-use-disorder",
      "name": "Cannabis Use Disorder",
      "chapter": "Substance-Related and Addictive Disorders",
      "sourcePdfPages": [
        791,
        799
      ],
      "criteriaText": "A. A problematic pattern of cannabis use leading to clinically significant impairment\nor distress, as manifested by at least two of the following, occurring within a 12-\nmonth period:\n1. Cannabis is often taken in larger amounts or over a longer period than was\nintended.\n2. There is a persistent desire or unsuccessful efforts to cut down or control\ncannabis use.\n3. A great deal of time is spent in activities necessary to obtain cannabis, use\ncannabis, or recover from its effects.\n4. Craving, or a strong desire or urge to use cannabis.\n5. Recurrent cannabis use resulting in a failure to fulfill major role obligations at\nwork, school, or home.\n6. Continued cannabis use despite having persistent or recurrent social or\ninterpersonal problems caused or exacerbated by the effects of cannabis.\n7. Important social, occupational, or recreational activities are given up or\nreduced because of cannabis use.\n8. Recurrent cannabis use in situations in which it is physically hazardous.\n9. Cannabis use is continued despite knowledge of having a persistent or\nrecurrent physical or psychological problem that is likely to have been caused\nor exacerbated by cannabis.\n10. Tolerance, as defined by either of the following:\na. A need for markedly increased amounts of cannabis to achieve\nintoxication or desired effect.\nb. Markedly diminished effect with continued use of the same amount of\ncannabis.\n11. Withdrawal, as manifested by either of the following:\na. The characteristic withdrawal syndrome for cannabis (refer to Criteria A\nand B of the criteria set for cannabis withdrawal).\nb. Cannabis (or a closely related substance) is taken to relieve or avoid\nwithdrawal symptoms.\nSpecify if:\nIn early remission: After full criteria for cannabis use disorder were previously\nmet, none of the criteria for cannabis use disorder have been met for at least 3\nmonths but\n\nfor less than 12 months (with the exception that Criterion A4, \u201CCraving, or a\nstrong desire or urge to use cannabis,\u201D may be met).\nIn sustained remission: After full criteria for cannabis use disorder were\npreviously met, none of the criteria for cannabis use disorder have been met at\nany time during a period of 12 months or longer (with the exception that Criterion\nA4, \u201CCraving, or a strong desire or urge to use cannabis,\u201D may be present).\nSpecify if:\nIn a controlled environment: This additional specifier is used if the individual is\nin an environment where access to cannabis is restricted.\nCode based on current severity/remission: If a cannabis intoxication, cannabis\nwithdrawal, or another cannabis-induced mental disorder is also present, do not use\nthe codes below for cannabis use disorder. Instead, the comorbid cannabis use\ndisorder is indicated in the 4th character of the cannabis-induced disorder code (see\nthe coding note for cannabis intoxication, cannabis withdrawal, or a specific\ncannabis-induced mental disorder). For example, if there is comorbid cannabis-\ninduced anxiety disorder and cannabis use disorder, only the cannabis-induced\nanxiety disorder code is given, with the 4th character indicating whether the\ncomorbid cannabis use disorder is mild, moderate, or severe: F12.180 for mild\ncannabis use disorder with cannabis-induced anxiety disorder or F12.280 for a\nmoderate or severe cannabis use disorder with cannabis-induced anxiety disorder.\nSpecify current severity/remission:\nF12.10 Mild: Presence of 2\u20133 symptoms.\nF12.11 Mild, In early remission\nF12.11 Mild, In sustained remission\nF12.20 Moderate: Presence of 4\u20135 symptoms.\nF12.21 Moderate, In early remission\nF12.21 Moderate, In sustained remission\nF12.20 Severe: Presence of 6 or more symptoms.\nF12.21 Severe, In early remission\nF12.21 Severe, In sustained remission"
    },
    {
      "id": "cannabis-intoxication",
      "name": "Cannabis Intoxication",
      "chapter": "Substance-Related and Addictive Disorders",
      "sourcePdfPages": [
        800,
        802
      ],
      "criteriaText": "A. Recent use of cannabis.\nB. Clinically significant problematic behavioral or psychological changes (e.g.,\nimpaired motor coordination, euphoria, anxiety, sensation of slowed time,\nimpaired judgment, social withdrawal) that developed during, or shortly after,\ncannabis use.\nC. Two (or more) of the following signs or symptoms developing within 2 hours of\ncannabis use:\n1.   Conjunctival injection.\n2.   Increased appetite.\n3.   Dry mouth.\n4.   Tachycardia.\nD. The signs or symptoms are not attributable to another medical condition and are\nnot better explained by another mental disorder, including intoxication with\nanother substance.\nSpecify if:\nWith perceptual disturbances: Hallucinations with intact reality testing or\nauditory, visual, or tactile illusions occur in the absence of a delirium.\nCoding note: The ICD-10-CM code depends on whether or not there is a comorbid\ncannabis use disorder and whether or not there are perceptual disturbances.\n\nFor cannabis intoxication, without perceptual disturbances: If a mild\ncannabis use disorder is comorbid, the ICD-10-CM code is F12.120, and if a\nmoderate or severe cannabis use disorder is comorbid, the ICD-10-CM code is\nF12.220. If there is no comorbid cannabis use disorder, then the ICD-10-CM\ncode is F12.920.\nFor cannabis intoxication, with perceptual disturbances: If a mild cannabis\nuse disorder is comorbid, the ICD-10-CM code is F12.122, and if a moderate or\nsevere cannabis use disorder is comorbid, the ICD-10-CM code is F12.222. If\nthere is no comorbid cannabis use disorder, then the ICD-10-CM code is\nF12.922."
    },
    {
      "id": "cannabis-withdrawal",
      "name": "Cannabis Withdrawal",
      "chapter": "Substance-Related and Addictive Disorders",
      "sourcePdfPages": [
        803,
        805
      ],
      "criteriaText": "A. Cessation of cannabis use that has been heavy and prolonged (i.e., usually daily\nor almost daily use over a period of at least a few months).\nB. Three (or more) of the following signs and symptoms develop within\napproximately 1 week after Criterion A:\n1.   Irritability, anger, or aggression.\n2.   Nervousness or anxiety.\n3.   Sleep difficulty (e.g., insomnia, disturbing dreams).\n4.   Decreased appetite or weight loss.\n5.   Restlessness.\n6.   Depressed mood.\n7.   At least one of the following physical symptoms causing significant\ndiscomfort: abdominal pain, shakiness/tremors, sweating, fever, chills, or\nheadache.\nC. The signs or symptoms in Criterion B cause clinically significant distress or\nimpairment in social, occupational, or other important areas of functioning.\nD. The signs or symptoms are not attributable to another medical condition and are\nnot better explained by another mental disorder, including intoxication or\nwithdrawal from another substance.\nCoding note: The ICD-10-CM code depends on whether or not there is a comorbid\ncannabis use disorder. If a mild cannabis use disorder is comorbid, the ICD-10-CM\ncode is F12.13, and if a moderate or severe cannabis use disorder is comorbid, the\nICD-10-CM code is F12.23. For cannabis withdrawal occurring in the absence of a\ncannabis use disorder (e.g., in a patient taking cannabis solely under appropriate\nmedical supervision), the ICD-10-CM code is F12.93."
    },
    {
      "id": "phencyclidine-use-disorder",
      "name": "Phencyclidine Use Disorder",
      "chapter": "Substance-Related and Addictive Disorders",
      "sourcePdfPages": [
        806,
        809
      ],
      "criteriaText": "A. A pattern of phencyclidine (or a pharmacologically similar substance) use\nleading to clinically significant impairment or distress, as manifested by at least\ntwo of the following, occurring within a 12-month period:\n1. Phencyclidine is often taken in larger amounts or over a longer period than\nwas intended.\n2. There is a persistent desire or unsuccessful efforts to cut down or control\nphencyclidine use.\n3. A great deal of time is spent in activities necessary to obtain phencyclidine,\nuse the phencyclidine, or recover from its effects.\n4. Craving, or a strong desire or urge to use phencyclidine.\n5. Recurrent phencyclidine use resulting in a failure to fulfill major role\nobligations at work, school, or home (e.g., repeated absences from work or\npoor work performance related to phencyclidine use; phencyclidine-related\nabsences, suspensions, or expulsions from school; neglect of children or\nhousehold).\n6. Continued phencyclidine use despite having persistent or recurrent social or\ninterpersonal problems caused or exacerbated by the effects of the\nphencyclidine (e.g., arguments with a spouse about consequences of\nintoxication; physical fights).\n7. Important social, occupational, or recreational activities are given up or\nreduced because of phencyclidine use.\n8. Recurrent phencyclidine use in situations in which it is physically hazardous\n(e.g., driving an automobile or operating a machine when impaired by a\nphencyclidine).\n9. Phencyclidine use is continued despite knowledge of having a persistent or\nrecurrent physical or psychological problem that is likely to have been caused\nor exacerbated by the phencyclidine.\n10. Tolerance, as defined by either of the following:\na. A need for markedly increased amounts of the phencyclidine to achieve\nintoxication or desired effect.\n\nb. A markedly diminished effect with continued use of the same amount of\nthe phencyclidine.\nNote: Withdrawal symptoms and signs are not established for phencyclidines, and\nso this criterion does not apply. (Withdrawal from phencyclidines has been reported\nin animals but not documented in human users.)\nSpecify if:\nIn early remission: After full criteria for phencyclidine use disorder were\npreviously met, none of the criteria for phencyclidine use disorder have been met\nfor at least 3 months but for less than 12 months (with the exception that\nCriterion A4, \u201CCraving, or a strong desire or urge to use the phencyclidine,\u201D may\nbe met).\nIn sustained remission: After full criteria for phencyclidine use disorder were\npreviously met, none of the criteria for phencyclidine use disorder have been met\nat any time during a period of 12 months or longer (with the exception that\nCriterion A4, \u201CCraving, or a strong desire or urge to use the phencyclidine,\u201D may\nbe met).\nSpecify if:\nIn a controlled environment: This additional specifier is used if the individual is\nin an environment where access to phencyclidines is restricted.\nCode based on current severity/remission: If a phencyclidine intoxication or\nanother phencyclidine-induced mental disorder is also present, do not use the codes\nbelow for phencyclidine use disorder. Instead, the comorbid phencyclidine use\ndisorder is indicated in the 4th character of the phencyclidine-induced disorder code\n(see the coding note for phencyclidine intoxication or a specific phencyclidine-\ninduced mental disorder). For example, if there is comorbid phencyclidine-induced\npsychotic disorder, only the phencyclidine-induced psychotic disorder code is given,\nwith the 4th character indicating whether the comorbid phencyclidine use disorder is\nmild, moderate, or severe: F16.159 for mild phencyclidine use disorder with\nphencyclidine-induced psychotic disorder or F16.259 for a moderate or severe\nphencyclidine use disorder with phencyclidine-induced psychotic disorder.\nSpecify current severity/remission:\nF16.10 Mild: Presence of 2\u20133 symptoms.\nF16.11 Mild, In early remission\nF16.11 Mild, In sustained remission\nF16.20 Moderate: Presence of 4\u20135 symptoms.\nF16.21 Moderate, In early remission\nF16.21 Moderate, In sustained remission\nF16.20 Severe: Presence of 6 or more symptoms.\nF16.21 Severe, In early remission\nF16.21 Severe, In sustained remission"
    },
    {
      "id": "other-hallucinogen-use-disorder",
      "name": "Other Hallucinogen Use Disorder",
      "chapter": "Substance-Related and Addictive Disorders",
      "sourcePdfPages": [
        810,
        814
      ],
      "criteriaText": "A. A problematic pattern of hallucinogen (other than phencyclidine) use leading to\nclinically significant impairment or distress, as manifested by at least two of the\nfollowing, occurring within a 12-month period:\n1. The hallucinogen is often taken in larger amounts or over a longer period than\nwas intended.\n2. There is a persistent desire or unsuccessful efforts to cut down or control\nhallucinogen use.\n3. A great deal of time is spent in activities necessary to obtain the hallucinogen,\nuse the hallucinogen, or recover from its effects.\n4. Craving, or a strong desire or urge to use the hallucinogen.\n5. Recurrent hallucinogen use resulting in a failure to fulfill major role obligations\nat work, school, or home (e.g., repeated absences from work or poor work\nperformance related to hallucinogen use; hallucinogen-related absences,\nsuspensions, or expulsions from school; neglect of children or household).\n6. Continued hallucinogen use despite having persistent or recurrent social or\ninterpersonal problems caused or exacerbated by the effects of the\nhallucinogen (e.g., arguments with a spouse about consequences of\nintoxication; physical fights).\n\n7. Important social, occupational, or recreational activities are given up or\nreduced because of hallucinogen use.\n8. Recurrent hallucinogen use in situations in which it is physically hazardous\n(e.g., driving an automobile or operating a machine when impaired by the\nhallucinogen).\n9. Hallucinogen use is continued despite knowledge of having a persistent or\nrecurrent physical or psychological problem that is likely to have been caused\nor exacerbated by the hallucinogen.\n10. Tolerance, as defined by either of the following:\na. A need for markedly increased amounts of the hallucinogen to achieve\nintoxication or desired effect.\nb. A markedly diminished effect with continued use of the same amount of\nthe hallucinogen.\nNote: Withdrawal symptoms and signs are not established for hallucinogens, and so\nthis criterion does not apply.\nSpecify the particular hallucinogen.\nSpecify if:\nIn early remission: After full criteria for other hallucinogen use disorder were\npreviously met, none of the criteria for other hallucinogen use disorder have\nbeen met for at least 3 months but for less than 12 months (with the exception\nthat Criterion A4, \u201CCraving, or a strong desire or urge to use the hallucinogen,\u201D\nmay be met).\nIn sustained remission: After full criteria for other hallucinogen use disorder\nwere previously met, none of the criteria for other hallucinogen use disorder\nhave been met at any time during a period of 12 months or longer (with the\nexception that Criterion A4, \u201CCraving, or a strong desire or urge to use the\nhallucinogen,\u201D may be met).\nSpecify if:\nIn a controlled environment: This additional specifier is used if the individual is\nin an environment where access to hallucinogens is restricted.\nCode based on current severity/remission: If a hallucinogen intoxication or\nanother hallucinogen-induced mental disorder is also present, do not use the codes\nbelow for hallucinogen use disorder. Instead, the comorbid hallucinogen use\ndisorder is indicated in the 4th character of the hallucinogen-induced disorder code\n(see the coding note for hallucinogen intoxication or specific hallucinogen-induced\nmental disorder). For example, if there is comorbid hallucinogen-induced psychotic\ndisorder and hallucinogen use disorder, only the hallucinogen-induced psychotic\ndisorder code is given, with the 4th character indicating whether the comorbid\nhallucinogen use disorder is mild, moderate, or severe: F16.159 for mild\nhallucinogen use disorder with hallucinogen-induced psychotic disorder or F16.259\nfor a moderate or severe hallucinogen use disorder with hallucinogen-induced\npsychotic disorder.\nSpecify current severity/remission:\nF16.10 Mild: Presence of 2\u20133 symptoms.\nF16.11 Mild, In early remission\nF16.11 Mild, In sustained remission\nF16.20 Moderate: Presence of 4\u20135 symptoms.\nF16.21 Moderate, In early remission\nF16.21 Moderate, In sustained remission\nF16.20 Severe: Presence of 6 or more symptoms.\nF16.21 Severe, In early remission\nF16.21 Severe, In sustained remission"
    },
    {
      "id": "phencyclidine-intoxication",
      "name": "Phencyclidine Intoxication",
      "chapter": "Substance-Related and Addictive Disorders",
      "sourcePdfPages": [
        815,
        817
      ],
      "criteriaText": "A. Recent use of phencyclidine (or a pharmacologically similar substance).\nB. Clinically significant problematic behavioral changes (e.g., belligerence,\nassaultiveness, impulsiveness, unpredictability, psychomotor agitation, impaired\njudgment) that developed during, or shortly after, phencyclidine use.\n\nC. Within 1 hour, two (or more) of the following signs or symptoms:\nNote: When the drug is smoked, \u201Csnorted,\u201D or used intravenously, the onset may\nbe particularly rapid.\n1.   Vertical or horizontal nystagmus.\n2.   Hypertension or tachycardia.\n3.   Numbness or diminished responsiveness to pain.\n4.   Ataxia.\n5.   Dysarthria.\n6.   Muscle rigidity.\n7.   Seizures or coma.\n8.   Hyperacusis.\nD. The signs or symptoms are not attributable to another medical condition and are\nnot better explained by another mental disorder, including intoxication with\nanother substance.\nCoding note: The ICD-10-CM code depends on whether there is a comorbid\nphencyclidine use disorder. If a mild phencyclidine use disorder is comorbid, the\nICD-10-CM code is F16.120, and if a moderate or severe phencyclidine use disorder\nis comorbid, the ICD-10-CM code is F16.220. If there is no comorbid phencyclidine\nuse disorder, then the ICD-10-CM code is F16.920.\n\nNote: In addition to the section \u201CFunctional Consequences of Phencyclidine\nIntoxication,\u201D see the corresponding section in Phencyclidine Use Disorder."
    },
    {
      "id": "other-hallucinogen-intoxication",
      "name": "Other Hallucinogen Intoxication",
      "chapter": "Substance-Related and Addictive Disorders",
      "sourcePdfPages": [
        818,
        819
      ],
      "criteriaText": "A. Recent use of a hallucinogen (other than phencyclidine).\nB. Clinically significant problematic behavioral or psychological changes (e.g.,\nmarked anxiety or depression, ideas of reference, fear of \u201Closing one\u2019s mind,\u201D\nparanoid ideation, impaired judgment) that developed during, or shortly after,\nhallucinogen use.\nC. Perceptual changes occurring in a state of full wakefulness and alertness (e.g.,\nsubjective intensification of perceptions, depersonalization, derealization,\nillusions, hallucinations, synesthesias) that developed during, or shortly after,\nhallucinogen use.\nD. Two (or more) of the following signs developing during, or shortly after,\nhallucinogen use:\n1.   Pupillary dilation.\n2.   Tachycardia.\n3.   Sweating.\n4.   Palpitations.\n5.   Blurring of vision.\n6.   Tremors.\n7.   Incoordination.\nE. The signs or symptoms are not attributable to another medical condition and are\nnot better explained by another mental disorder, including intoxication with\nanother substance.\n\nCoding note: The ICD-10-CM code depends on whether there is a comorbid\nhallucinogen use disorder. If a mild hallucinogen use disorder is comorbid, the ICD-\n10-CM code is F16.120, and if a moderate or severe hallucinogen use disorder is\ncomorbid, the ICD-10-CM code is F16.220. If there is no comorbid hallucinogen use\ndisorder, then the ICD-10-CM code is F16.920.\n\nNote: For information on Associated Features and Culture-Related Diagnostic Issues,\nsee the corresponding sections in Other Hallucinogen Use Disorder."
    },
    {
      "id": "hallucinogen-persisting-perception-disorder",
      "name": "Hallucinogen Persisting Perception Disorder",
      "chapter": "Substance-Related and Addictive Disorders",
      "icd10Code": "F16.983",
      "sourcePdfPages": [
        820,
        822
      ],
      "criteriaText": "A. Following cessation of use of a hallucinogen, the reexperiencing of one or more\nof the perceptual symptoms that were experienced while intoxicated with the\nhallucinogen (e.g., geometric hallucinations, false perceptions of movement in\nthe peripheral visual fields, flashes of color, intensified colors, trails of images of\nmoving objects, positive afterimages, halos around objects, macropsia and\nmicropsia).\nB. The symptoms in Criterion A cause clinically significant distress or impairment in\nsocial, occupational, or other important areas of functioning.\nC. The symptoms are not attributable to another medical condition (e.g., anatomical\nlesions and infections of the brain, visual epilepsies) and are not better explained\nby another mental disorder (e.g., delirium, major neurocognitive disorder,\nschizophrenia) or hypnopompic hallucinations."
    },
    {
      "id": "inhalant-use-disorder",
      "name": "Inhalant Use Disorder",
      "chapter": "Substance-Related and Addictive Disorders",
      "sourcePdfPages": [
        823,
        828
      ],
      "criteriaText": "A. A problematic pattern of use of a hydrocarbon-based inhalant substance leading\nto clinically significant impairment or distress, as manifested by at least two of\nthe following, occurring within a 12-month period:\n1. The inhalant substance is often taken in larger amounts or over a longer\nperiod than was intended.\n2. There is a persistent desire or unsuccessful efforts to cut down or control use\nof the inhalant substance.\n3. A great deal of time is spent in activities necessary to obtain the inhalant\nsubstance, use it, or recover from its effects.\n4. Craving, or a strong desire or urge to use the inhalant substance.\n5. Recurrent use of the inhalant substance resulting in a failure to fulfill major\nrole obligations at work, school, or home.\n6. Continued use of the inhalant substance despite having persistent or\nrecurrent social or interpersonal problems caused or exacerbated by the\neffects of its use.\n7. Important social, occupational, or recreational activities are given up or\nreduced because of use of the inhalant substance.\n8. Recurrent use of the inhalant substance in situations in which it is physically\nhazardous.\n9. Use of the inhalant substance is continued despite knowledge of having a\npersistent or recurrent physical or psychological problem that is likely to have\nbeen caused or exacerbated by the substance.\n10. Tolerance, as defined by either of the following:\na. A need for markedly increased amounts of the inhalant substance to\nachieve intoxication or desired effect.\nb. A markedly diminished effect with continued use of the same amount of\nthe inhalant substance.\n\nSpecify the particular inhalant: When possible, the particular substance involved\nshould be named (e.g., \u201Csolvent use disorder\u201D).\nSpecify if:\nIn early remission: After full criteria for inhalant use disorder were previously\nmet, none of the criteria for inhalant use disorder have been met for at least 3\nmonths but for less than 12 months (with the exception that Criterion A4,\n\u201CCraving, or a strong desire or urge to use the inhalant substance,\u201D may be met).\nIn sustained remission: After full criteria for inhalant use disorder were\npreviously met, none of the criteria for inhalant use disorder have been met at\nany time during a period of 12 months or longer (with the exception that Criterion\nA4, \u201CCraving, or a strong desire or urge to use the inhalant substance,\u201D may be\nmet).\nSpecify if:\nIn a controlled environment: This additional specifier is used if the individual is\nin an environment where access to inhalant substances is restricted.\nCode based on current severity/remission: If an inhalant intoxication or another\ninhalant-induced mental disorder is also present, do not use the codes below for\ninhalant use disorder. Instead, the comorbid inhalant use disorder is indicated in the\n4th character of the inhalant-induced disorder code (see the coding note for inhalant\nintoxication or a specific inhalant-induced mental disorder). For example, if there is\ncomorbid inhalant-induced depressive disorder and inhalant use disorder, only the\ninhalant-induced depressive disorder code is given, with the 4th character indicating\nwhether the comorbid inhalant use disorder is mild, moderate, or severe: F18.14 for\nmild inhalant use disorder with inhalant-induced depressive disorder or F18.24 for a\nmoderate or severe inhalant use disorder with inhalant-induced depressive disorder.\nSpecify current severity/remission:\nF18.10 Mild: Presence of 2\u20133 symptoms.\nF18.11 Mild, In early remission\nF18.11 Mild, In sustained remission\nF18.20 Moderate: Presence of 4\u20135 symptoms.\nF18.21 Moderate, In early remission\nF18.21 Moderate, In sustained remission\nF18.20 Severe: Presence of 6 or more symptoms.\nF18.21 Severe, In early remission\nF18.21 Severe, In sustained remission"
    },
    {
      "id": "inhalant-intoxication",
      "name": "Inhalant Intoxication",
      "chapter": "Substance-Related and Addictive Disorders",
      "sourcePdfPages": [
        829,
        831
      ],
      "criteriaText": "A. Recent intended or unintended short-term, high-dose exposure to inhalant\nsubstances, including volatile hydrocarbons such as toluene or gasoline.\nB. Clinically significant problematic behavioral or psychological changes (e.g.,\nbelligerence, assaultiveness, apathy, impaired judgment) that developed during,\nor shortly after, exposure to inhalants.\nC. Two (or more) of the following signs or symptoms developing during, or shortly\nafter, inhalant use or exposure:\n1. Dizziness.\n2. Nystagmus.\n3. Incoordination.\n\n4.   Slurred speech.\n5.   Unsteady gait.\n6.   Lethargy.\n7.   Depressed reflexes.\n8.   Psychomotor retardation.\n9.   Tremor.\n10.   Generalized muscle weakness.\n11.   Blurred vision or diplopia.\n12.   Stupor or coma.\n13.   Euphoria.\nD. The signs or symptoms are not attributable to another medical condition and are\nnot better explained by another mental disorder, including intoxication with\nanother substance.\nCoding note: The ICD-10-CM code depends on whether there is a comorbid\ninhalant use disorder. If a mild inhalant use disorder is comorbid, the ICD-10-CM\ncode is F18.120, and if a moderate or severe inhalant use disorder is comorbid, the\nICD-10-CM code is F18.220. If there is no comorbid inhalant use disorder, then the\nICD-10-CM code is F18.920.\nNote: For information on Development and Course, Risk and Prognostic Factors,"
    },
    {
      "id": "opioid-use-disorder",
      "name": "Opioid Use Disorder",
      "chapter": "Substance-Related and Addictive Disorders",
      "sourcePdfPages": [
        832,
        840
      ],
      "criteriaText": "A. A problematic pattern of opioid use leading to clinically significant impairment or\ndistress, as manifested by at least two of the following, occurring within a 12-\nmonth period:\n1. Opioids are often taken in larger amounts or over a longer period than was\nintended.\n2. There is a persistent desire or unsuccessful efforts to cut down or control\nopioid use.\n3. A great deal of time is spent in activities necessary to obtain the opioid, use\nthe opioid, or recover from its effects.\n4. Craving, or a strong desire or urge to use opioids.\n5. Recurrent opioid use resulting in a failure to fulfill major role obligations at\nwork, school, or home.\n6. Continued opioid use despite having persistent or recurrent social or\ninterpersonal problems caused or exacerbated by the effects of opioids.\n7. Important social, occupational, or recreational activities are given up or\nreduced because of opioid use.\n\n8. Recurrent opioid use in situations in which it is physically hazardous.\n9. Continued opioid use despite knowledge of having a persistent or recurrent\nphysical or psychological problem that is likely to have been caused or\nexacerbated by the substance.\n10. Tolerance, as defined by either of the following:\na. A need for markedly increased amounts of opioids to achieve intoxication\nor desired effect.\nb. A markedly diminished effect with continued use of the same amount of\nan opioid.\nNote: This criterion is not considered to be met for those taking opioids solely\nunder appropriate medical supervision.\n11. Withdrawal, as manifested by either of the following:\na. The characteristic opioid withdrawal syndrome (refer to Criteria A and B of\nthe criteria set for opioid withdrawal).\nb. Opioids (or a closely related substance) are taken to relieve or avoid\nwithdrawal symptoms.\nNote: This criterion is not considered to be met for those individuals taking\nopioids solely under appropriate medical supervision.\nSpecify if:\nIn early remission: After full criteria for opioid use disorder were previously met,\nnone of the criteria for opioid use disorder have been met for at least 3 months\nbut for less than 12 months (with the exception that Criterion A4, \u201CCraving, or a\nstrong desire or urge to use opioids,\u201D may be met).\nIn sustained remission: After full criteria for opioid use disorder were previously\nmet, none of the criteria for opioid use disorder have been met at any time during\na period of 12 months or longer (with the exception that Criterion A4, \u201CCraving, or\na strong desire or urge to use opioids,\u201D may be met).\nSpecify if:\nOn maintenance therapy: This additional specifier is used if the individual is\ntaking a prescribed agonist medication such as methadone or buprenorphine\nand none of the criteria for opioid use disorder have been met for that class of\nmedication (except tolerance to, or withdrawal from, the agonist). This category\nalso applies to those individuals being maintained on a partial agonist, an\nagonist/antagonist, or a full antagonist such as oral naltrexone or depot\nnaltrexone.\nIn a controlled environment: This additional specifier is used if the individual is\nin an environment where access to opioids is restricted.\nCode based on current severity/remission: If an opioid intoxication, opioid\nwithdrawal, or another opioid-induced mental disorder is also present, do not use the\ncodes below for opioid use disorder. Instead, the comorbid opioid use disorder is\nindicated in the 4th character of the opioid-induced disorder code (see the coding\nnote for opioid intoxication, opioid withdrawal, or a specific opioid-induced mental\ndisorder). For example, if there is comorbid opioid-induced depressive disorder and\nopioid use disorder, only the opioid-induced depressive disorder code is given, with\nthe 4th character indicating whether the comorbid opioid use disorder is mild,\nmoderate, or severe: F11.14 for mild opioid use disorder with opioid-induced\ndepressive disorder or F11.24 for a moderate or severe opioid use disorder with\nopioid-induced depressive disorder.\nSpecify current severity/remission:\nF11.10 Mild: Presence of 2\u20133 symptoms.\nF11.11 Mild, In early remission\nF11.11 Mild, In sustained remission\n\nF11.20 Moderate: Presence of 4\u20135 symptoms.\nF11.21 Moderate, In early remission\nF11.21 Moderate, In sustained remission\nF11.20 Severe: Presence of 6 or more symptoms.\nF11.21 Severe, In early remission\nF11.21 Severe, In sustained remission"
    },
    {
      "id": "opioid-intoxication",
      "name": "Opioid Intoxication",
      "chapter": "Substance-Related and Addictive Disorders",
      "sourcePdfPages": [
        841,
        842
      ],
      "criteriaText": "A. Recent use of an opioid.\nB. Clinically significant problematic behavioral or psychological changes (e.g., initial\neuphoria followed by apathy, dysphoria, psychomotor agitation or retardation,\nimpaired judgment) that developed during, or shortly after, opioid use.\nC. Pupillary constriction (or pupillary dilation due to anoxia from severe overdose)\nand one (or more) of the following signs or symptoms developing during, or\nshortly after, opioid use:\n1. Drowsiness or coma.\n2. Slurred speech.\n3. Impairment in attention or memory.\nD. The signs or symptoms are not attributable to another medical condition and are\nnot better explained by another mental disorder, including intoxication with\nanother substance.\nSpecify if:\nWith perceptual disturbances: This specifier may be noted in the rare instance\nin which hallucinations with intact reality testing or auditory, visual, or tactile\nillusions occur in the absence of a delirium.\n\nCoding note: The ICD-10-CM code depends on whether or not there is a comorbid\nopioid use disorder and whether or not there are perceptual disturbances.\nFor opioid intoxication, without perceptual disturbances: If a mild opioid use\ndisorder is comorbid, the ICD-10-CM code is F11.120, and if a moderate or\nsevere opioid use disorder is comorbid, the ICD-10-CM code is F11.220. If there\nis no comorbid opioid use disorder, then the ICD-10-CM code is F11.920.\nFor opioid intoxication, with perceptual disturbances: If a mild opioid use\ndisorder is comorbid, the ICD-10-CM code is F11.122, and if a moderate or\nsevere opioid use disorder is comorbid, the ICD-10-CM code is F11.222. If there\nis no comorbid opioid use disorder, then the ICD-10-CM code is F11.922."
    },
    {
      "id": "opioid-withdrawal",
      "name": "Opioid Withdrawal",
      "chapter": "Substance-Related and Addictive Disorders",
      "sourcePdfPages": [
        843,
        845
      ],
      "criteriaText": "A. Presence of either of the following:\n1. Cessation of (or reduction in) opioid use that has been heavy and prolonged\n(i.e., several weeks or longer).\n2. Administration of an opioid antagonist after a period of opioid use.\nB. Three (or more) of the following developing within minutes to several days after\nCriterion A:\n1.   Dysphoric mood.\n2.   Nausea or vomiting.\n3.   Muscle aches.\n4.   Lacrimation or rhinorrhea.\n5.   Pupillary dilation, piloerection, or sweating.\n6.   Diarrhea.\n7.   Yawning.\n8.   Fever.\n9.   Insomnia.\nC. The signs or symptoms in Criterion B cause clinically significant distress or\nimpairment in social, occupational, or other important areas of functioning.\nD. The signs or symptoms are not attributable to another medical condition and are\nnot better explained by another mental disorder, including intoxication or\nwithdrawal from another substance.\nCoding note: The ICD-10-CM code depends on whether or not there is a comorbid\nopioid use disorder. If a mild opioid use disorder is comorbid, the ICD-10-CM code is\nF11.13, and if a moderate or severe opioid use disorder is comorbid, the ICD-10-CM\ncode is F11.23. For opioid withdrawal occurring in the absence of an opioid use\ndisorder (e.g., in a patient taking opioids solely under appropriate medical\nsupervision), the ICD-10-CM code is F11.93."
    },
    {
      "id": "sedative-hypnotic-or-anxiolytic-use-disorder",
      "name": "Sedative, Hypnotic, or Anxiolytic Use Disorder",
      "chapter": "Substance-Related and Addictive Disorders",
      "sourcePdfPages": [
        846,
        853
      ],
      "criteriaText": "A. A problematic pattern of sedative, hypnotic, or anxiolytic use leading to clinically\nsignificant impairment or distress, as manifested by at least two of the following,\noccurring within a 12-month period:\n1. Sedatives, hypnotics, or anxiolytics are often taken in larger amounts or over\na longer period than was intended.\n2. There is a persistent desire or unsuccessful efforts to cut down or control\nsedative, hypnotic, or anxiolytic use.\n3. A great deal of time is spent in activities necessary to obtain the sedative,\nhypnotic, or anxiolytic; use the sedative, hypnotic, or anxiolytic; or recover\nfrom its effects.\n4. Craving, or a strong desire or urge to use the sedative, hypnotic, or anxiolytic.\n5. Recurrent sedative, hypnotic, or anxiolytic use resulting in a failure to fulfill\nmajor role obligations at work, school, or home (e.g., repeated absences from\nwork or poor work performance related to sedative, hypnotic, or anxiolytic\nuse; sedative-, hypnotic-, or anxiolytic-related absences, suspensions, or\nexpulsions from school; neglect of children or household).\n6. Continued sedative, hypnotic, or anxiolytic use despite having persistent or\nrecurrent social or interpersonal problems caused or exacerbated by the\neffects of sedatives, hypnotics, or anxiolytics (e.g., arguments with a spouse\nabout consequences of intoxication; physical fights).\n7. Important social, occupational, or recreational activities are given up or\nreduced because of sedative, hypnotic, or anxiolytic use.\n8. Recurrent sedative, hypnotic, or anxiolytic use in situations in which it is\nphysically hazardous (e.g., driving an automobile or operating a machine\nwhen impaired by sedative, hypnotic, or anxiolytic use).\n9. Sedative, hypnotic, or anxiolytic use is continued despite knowledge of having\na persistent or recurrent physical or psychological problem that is likely to\nhave been caused or exacerbated by the sedative, hypnotic, or anxiolytic.\n10. Tolerance, as defined by either of the following:\na. A need for markedly increased amounts of the sedative, hypnotic, or\nanxiolytic to achieve intoxication or desired effect.\nb. A markedly diminished effect with continued use of the same amount of\nthe sedative, hypnotic, or anxiolytic.\n\nNote: This criterion is not considered to be met for individuals taking\nsedatives, hypnotics, or anxiolytics under medical supervision.\n11. Withdrawal, as manifested by either of the following:\na. The characteristic withdrawal syndrome for sedatives, hypnotics, or\nanxiolytics (refer to Criteria A and B of the criteria set for sedative,\nhypnotic, or anxiolytic withdrawal).\nb. Sedatives, hypnotics, or anxiolytics (or a closely related substance, such\nas alcohol) are taken to relieve or avoid withdrawal symptoms.\nNote: This criterion is not considered to be met for individuals taking\nsedatives, hypnotics, or anxiolytics under medical supervision.\nSpecify if:\nIn early remission: After full criteria for sedative, hypnotic, or anxiolytic use\ndisorder were previously met, none of the criteria for sedative, hypnotic, or\nanxiolytic use disorder have been met for at least 3 months but for less than 12\nmonths (with the exception that Criterion A4, \u201CCraving, or a strong desire or urge\nto use the sedative, hypnotic, or anxiolytic,\u201D may be met).\nIn sustained remission: After full criteria for sedative, hypnotic, or anxiolytic\nuse disorder were previously met, none of the criteria for sedative, hypnotic, or\nanxiolytic use disorder have been met at any time during a period of 12 months\nor longer (with the exception that Criterion A4, \u201CCraving, or a strong desire or\nurge to use the sedative, hypnotic, or anxiolytic,\u201D may be met).\nSpecify if:\nIn a controlled environment: This additional specifier is used if the individual is\nin an environment where access to sedatives, hypnotics, or anxiolytics is\nrestricted.\nCode based on current severity/remission: If a sedative, hypnotic, or anxiolytic\nintoxication; sedative, hypnotic, or anxiolytic withdrawal; or another sedative-,\nhypnotic-, or anxiolytic-induced mental disorder is also present, do not use the codes\nbelow for sedative, hypnotic, or anxiolytic use disorder. Instead, the comorbid\nsedative, hypnotic, or anxiolytic use disorder is indicated in the 4th character of the\nsedative-, hypnotic-, or anxiolytic-induced disorder (see the coding note for sedative,\nhypnotic, or anxiolytic intoxication; sedative, hypnotic, or anxiolytic withdrawal; or\nspecific sedative-, hypnotic-, or anxiolytic-induced mental disorder). For example, if\nthere is comorbid sedative-, hypnotic-, or anxiolytic-induced depressive disorder and\nsedative, hypnotic, or anxiolytic use disorder, only the sedative-, hypnotic-, or\nanxiolytic-induced depressive disorder code is given, with the 4th character\nindicating whether the comorbid sedative, hypnotic, or anxiolytic use disorder is mild,\nmoderate, or severe: F13.14 for mild sedative, hypnotic, or anxiolytic use disorder\nwith sedative-, hypnotic-, or anxiolytic-induced depressive disorder or F13.24 for a\nmoderate or severe sedative, hypnotic, or anxiolytic use disorder with sedative-,\nhypnotic-, or anxiolytic-induced depressive disorder.\nSpecify current severity/remission:\nF13.10 Mild: Presence of 2\u20133 symptoms.\nF13.11 Mild, In early remission\nF13.11 Mild, In sustained remission\nF13.20 Moderate: Presence of 4\u20135 symptoms.\nF13.21 Moderate, In early remission\nF13.21 Moderate, In sustained remission\nF13.20 Severe: Presence of 6 or more symptoms.\nF13.21 Severe, In early remission\nF13.21 Severe, In sustained remission"
    },
    {
      "id": "sedative-hypnotic-or-anxiolytic-intoxication",
      "name": "Sedative, Hypnotic, or Anxiolytic Intoxication",
      "chapter": "Substance-Related and Addictive Disorders",
      "sourcePdfPages": [
        854,
        856
      ],
      "criteriaText": "A. Recent use of a sedative, hypnotic, or anxiolytic.\nB. Clinically significant maladaptive behavioral or psychological changes (e.g.,\ninappropriate sexual or aggressive behavior, mood lability, impaired judgment)\nthat developed during, or shortly after, sedative, hypnotic, or anxiolytic use.\n\nC. One (or more) of the following signs or symptoms developing during, or shortly\nafter, sedative, hypnotic, or anxiolytic use:\n1.   Slurred speech.\n2.   Incoordination.\n3.   Unsteady gait.\n4.   Nystagmus.\n5.   Impairment in cognition (e.g., attention, memory).\n6.   Stupor or coma.\nD. The signs or symptoms are not attributable to another medical condition and are\nnot better explained by another mental disorder, including intoxication with\nanother substance.\nCoding note: The ICD-10-CM code depends on whether there is a comorbid\nsedative, hypnotic, or anxiolytic use disorder. If a mild sedative, hypnotic, or\nanxiolytic use disorder is comorbid, the ICD-10-CM code is F13.120, and if a\nmoderate or severe sedative, hypnotic, or anxiolytic use disorder is comorbid, the\nICD-10-CM code is F13.220. If there is no comorbid sedative, hypnotic, or anxiolytic\nuse disorder, then the ICD-10-CM code is F13.920.\n\nNote: For information on Development and Course; Risk and Prognostic Factors;"
    },
    {
      "id": "sedative-hypnotic-or-anxiolytic-withdrawal",
      "name": "Sedative, Hypnotic, or Anxiolytic Withdrawal",
      "chapter": "Substance-Related and Addictive Disorders",
      "sourcePdfPages": [
        857,
        860
      ],
      "criteriaText": "A. Cessation of (or reduction in) sedative, hypnotic, or anxiolytic use that has been\nprolonged.\nB. Two (or more) of the following, developing within several hours to a few days\nafter the cessation of (or reduction in) sedative, hypnotic, or anxiolytic use\ndescribed in Criterion A:\n1. Autonomic hyperactivity (e.g., sweating or pulse rate greater than 100 bpm).\n2. Hand tremor.\n\n3.   Insomnia.\n4.   Nausea or vomiting.\n5.   Transient visual, tactile, or auditory hallucinations or illusions.\n6.   Psychomotor agitation.\n7.   Anxiety.\n8.   Grand mal seizures.\nC. The signs or symptoms in Criterion B cause clinically significant distress or\nimpairment in social, occupational, or other important areas of functioning.\nD. The signs or symptoms are not attributable to another medical condition and are\nnot better explained by another mental disorder, including intoxication or\nwithdrawal from another substance.\nSpecify if:\nWith perceptual disturbances: This specifier may be noted when\nhallucinations with intact reality testing or auditory, visual, or tactile illusions\noccur in the absence of a delirium.\nCoding note: The ICD-10-CM code depends on whether or not there is a comorbid\nsedative, hypnotic, or anxiolytic use disorder and whether or not there are perceptual\ndisturbances.\nFor sedative, hypnotic, or anxiolytic withdrawal, without perceptual\ndisturbances: If a mild sedative, hypnotic, or anxiolytic use disorder is\ncomorbid, the ICD-10-CM code is F13.130, and if a moderate or severe\nsedative, hypnotic, or anxiolytic use disorder is comorbid, the ICD-10-CM code is\nF13.230. If there is no comorbid sedative, hypnotic, or anxiolytic use disorder\n(e.g., in a patient taking sedatives, hypnotics, or anxiolytics solely under\nappropriate medical supervision), then the ICD-10-CM code is F13.930.\nFor sedative, hypnotic, or anxiolytic withdrawal, with perceptual\ndisturbances: If a mild sedative, hypnotic, or anxiolytic use disorder is\ncomorbid, the ICD-10-CM code is F13.132, and if a moderate or severe\nsedative, hypnotic, or anxiolytic use disorder is comorbid, the ICD-10-CM code is\nF13.232. If there is no comorbid sedative, hypnotic, or anxiolytic use disorder\n(e.g., in a patient taking sedatives, hypnotics, or anxiolytics solely under\nappropriate medical supervision), then the ICD-10-CM code is F13.932.\n\nNote: For information on Development and Course; Risk and Prognostic Factors;"
    },
    {
      "id": "stimulant-use-disorder",
      "name": "Stimulant Use Disorder",
      "chapter": "Substance-Related and Addictive Disorders",
      "sourcePdfPages": [
        861,
        870
      ],
      "criteriaText": "A. A pattern of amphetamine-type substance, cocaine, or other stimulant use\nleading to clinically significant impairment or distress, as manifested by at least\ntwo of the following, occurring within a 12-month period:\n1. The stimulant is often taken in larger amounts or over a longer period than\nwas intended.\n2. There is a persistent desire or unsuccessful efforts to cut down or control\nstimulant use.\n3. A great deal of time is spent in activities necessary to obtain the stimulant,\nuse the stimulant, or recover from its effects.\n4. Craving, or a strong desire or urge to use the stimulant.\n5. Recurrent stimulant use resulting in a failure to fulfill major role obligations at\nwork, school, or home.\n6. Continued stimulant use despite having persistent or recurrent social or\ninterpersonal problems caused or exacerbated by the effects of the stimulant.\n7. Important social, occupational, or recreational activities are given up or\nreduced because of stimulant use.\n\n8. Recurrent stimulant use in situations in which it is physically hazardous.\n9. Stimulant use is continued despite knowledge of having a persistent or\nrecurrent physical or psychological problem that is likely to have been caused\nor exacerbated by the stimulant.\n10. Tolerance, as defined by either of the following:\na. A need for markedly increased amounts of the stimulant to achieve\nintoxication or desired effect.\nb. A markedly diminished effect with continued use of the same amount of\nthe stimulant.\nNote: This criterion is not considered to be met for those taking stimulant\nmedications solely under appropriate medical supervision, such as\nmedications for attention-deficit/hyperactivity disorder or narcolepsy.\n11. Withdrawal, as manifested by either of the following:\na. The characteristic withdrawal syndrome for the stimulant (refer to Criteria\nA and B of the criteria set for stimulant withdrawal).\nb. The stimulant (or a closely related substance) is taken to relieve or avoid\nwithdrawal symptoms.\nNote: This criterion is not considered to be met for those taking stimulant\nmedications solely under appropriate medical supervision, such as\nmedications for attention-deficit/hyperactivity disorder or narcolepsy.\nSpecify if:\nIn early remission: After full criteria for stimulant use disorder were previously\nmet, none of the criteria for stimulant use disorder have been met for at least 3\nmonths but for less than 12 months (with the exception that Criterion A4,\n\u201CCraving, or a strong desire or urge to use the stimulant,\u201D may be met).\nIn sustained remission: After full criteria for stimulant use disorder were\npreviously met, none of the criteria for stimulant use disorder have been met at\nany time during a period of 12 months or longer (with the exception that Criterion\nA4, \u201CCraving, or a strong desire or urge to use the stimulant,\u201D may be met).\nSpecify if:\nIn a controlled environment: This additional specifier is used if the individual is\nin an environment where access to stimulants is restricted.\nCode based on current severity/remission: If an amphetamine-type substance\nintoxication, amphetamine-type substance withdrawal, or amphetamine-type\nsubstance-induced mental disorder is also present, do not use the codes below for\namphetamine-type substance use disorder. Instead, the comorbid amphetamine-\ntype substance use disorder is indicated in the 4th character of the amphetamine-\ntype substance-induced disorder code (see the coding note for amphetamine-type\nsubstance intoxication, amphetamine-type substance withdrawal, or a specific\namphetamine-type substance-induced mental disorder). For example, if there is\ncomorbid amphetamine-induced depressive disorder and amphetamine use\ndisorder, only the amphetamine-induced depressive disorder code is given, with the\n4th character indicating whether the comorbid amphetamine use disorder is mild,\nmoderate, or severe: F15.14 for mild amphetamine use disorder with amphetamine-\ninduced depressive disorder or F15.24 for a moderate or severe amphetamine use\ndisorder with amphetamine-induced depressive disorder. (The instructions for\namphetamine-type substance also apply to other or unspecified stimulant\nintoxication, other or unspecified stimulant withdrawal, and other or unspecified\nstimulant-induced mental disorder.) Similarly, if there is comorbid cocaine-induced\ndepressive disorder and cocaine use disorder, only the cocaine-induced depressive\ndisorder code is given, with the 4th character indicating whether the comorbid\ncocaine use disorder is mild, moderate,\n\nor severe: F14.14 for a mild cocaine use disorder with cocaine-induced depressive\ndisorder or F14.24 for a moderate or severe cocaine use disorder with cocaine-\ninduced depressive disorder.\nSpecify current severity/remission:\nMild: Presence of 2\u20133 symptoms.\nF15.10 Amphetamine-type substance\nF14.10 Cocaine\nF15.10 Other or unspecified stimulant\nMild, In early remission\nF15.11 Amphetamine-type substance\nF14.11 Cocaine\nF15.11 Other or unspecified stimulant\nMild, In sustained remission\nF15.11 Amphetamine-type substance\nF14.11 Cocaine\nF15.11 Other or unspecified stimulant\nModerate: Presence of 4\u20135 symptoms.\nF15.20 Amphetamine-type substance\nF14.20 Cocaine\nF15.20 Other or unspecified stimulant\nModerate, In early remission\nF15.21 Amphetamine-type substance\nF14.21 Cocaine\nF15.21 Other or unspecified stimulant\nModerate, In sustained remission\nF15.21 Amphetamine-type substance\nF14.21 Cocaine\nF15.21 Other or unspecified stimulant\nSevere: Presence of 6 or more symptoms.\nF15.20 Amphetamine-type substance\nF14.20 Cocaine\nF15.20 Other or unspecified stimulant\nSevere, In early remission\nF15.21 Amphetamine-type substance\nF14.21 Cocaine\nF15.21 Other or unspecified stimulant\nSevere, In sustained remission\nF15.21 Amphetamine-type substance\nF14.21 Cocaine\nF15.21 Other or unspecified stimulant"
    },
    {
      "id": "stimulant-intoxication",
      "name": "Stimulant Intoxication",
      "chapter": "Substance-Related and Addictive Disorders",
      "sourcePdfPages": [
        871,
        873
      ],
      "criteriaText": "A. Recent use of an amphetamine-type substance, cocaine, or other stimulant.\nB. Clinically significant problematic behavioral or psychological changes (e.g.,\neuphoria or affective blunting; changes in sociability; hypervigilance;\ninterpersonal sensitivity; anxiety, tension, or anger; stereotyped behaviors;\nimpaired judgment) that developed during, or shortly after, use of a stimulant.\nC. Two (or more) of the following signs or symptoms, developing during, or shortly\nafter, stimulant use:\n1. Tachycardia or bradycardia.\n2. Pupillary dilation.\n3. Elevated or lowered blood pressure.\n4. Perspiration or chills.\n5. Nausea or vomiting.\n6. Evidence of weight loss.\n7. Psychomotor agitation or retardation.\n8. Muscular weakness, respiratory depression, chest                  pain,   or   cardiac\narrhythmias.\n9. Confusion, seizures, dyskinesias, dystonias, or coma.\nD. The signs or symptoms are not attributable to another medical condition and are\nnot better explained by another mental disorder, including intoxication with\nanother substance.\n\nSpecify the particular intoxicant (i.e., amphetamine-type substance, cocaine, or\nother stimulant).\nSpecify if:\nWith perceptual disturbances: This specifier may be noted when\nhallucinations with intact reality testing or auditory, visual, or tactile illusions\noccur in the absence of a delirium.\nCoding note: The ICD-10-CM code depends on whether the stimulant is an\namphetamine-type substance, cocaine, or other stimulant; whether there is a\ncomorbid amphetamine-type substance, cocaine, or other stimulant use disorder;\nand whether or not there are perceptual disturbances.\nFor amphetamine-type substance, cocaine, or other stimulant intoxication,\nwithout perceptual disturbances: If a mild amphetamine-type substance or\nother stimulant use disorder is comorbid, the ICD-10-CM code is F15.120, and if\na moderate or severe amphetamine-type substance or other stimulant use\ndisorder is comorbid, the ICD-10-CM code is F15.220. If there is no comorbid\namphetamine-type substance or other stimulant use disorder, then the ICD-10-\nCM code is F15.920. Similarly, if a mild cocaine use disorder is comorbid, the\nICD-10-CM code is F14.120, and if a moderate or severe cocaine use disorder is\ncomorbid, the ICD-10-CM code is F14.220. If there is no comorbid cocaine use\ndisorder, then the ICD-10-CM code is F14.920.\nFor amphetamine-type substance, cocaine, or other stimulant intoxication,\nwith perceptual disturbances: If a mild amphetamine-type substance or other\nstimulant use disorder is comorbid, the ICD-10-CM code is F15.122, and if a\nmoderate or severe amphetamine-type substance or other stimulant use\ndisorder is comorbid, the ICD-10-CM code is F15.222. If there is no comorbid\namphetamine-type substance or other stimulant use disorder, then the ICD-10-\nCM code is F15.922. Similarly, if a mild cocaine use disorder is comorbid, the\nICD-10-CM code is F14.122, and if a moderate or severe cocaine use disorder is\ncomorbid, the ICD-10-CM code is F14.222. If there is no comorbid cocaine use\ndisorder, then the ICD-10-CM code is F14.922."
    },
    {
      "id": "stimulant-withdrawal",
      "name": "Stimulant Withdrawal",
      "chapter": "Substance-Related and Addictive Disorders",
      "sourcePdfPages": [
        874,
        876
      ],
      "criteriaText": "A. Cessation of (or reduction in) prolonged amphetamine-type substance, cocaine,\nor other stimulant use.\nB. Dysphoric mood and two (or more) of the following physiological changes,\ndeveloping within a few hours to several days after Criterion A:\n1.   Fatigue.\n2.   Vivid, unpleasant dreams.\n3.   Insomnia or hypersomnia.\n4.   Increased appetite.\n5.   Psychomotor retardation or agitation.\nC. The signs or symptoms in Criterion B cause clinically significant distress or\nimpairment in social, occupational, or other important areas of functioning.\nD. The signs or symptoms are not attributable to another medical condition and are\nnot better explained by another mental disorder, including intoxication or\nwithdrawal from another substance.\nSpecify the particular substance that causes the withdrawal syndrome (i.e.,\namphetamine-type substance, cocaine, or other stimulant).\nCoding note: The ICD-10-CM code depends on whether the stimulant is an\namphetamine-type substance, cocaine, or other stimulant and on whether or not\nthere is a comorbid amphetamine-type substance, cocaine, or other stimulant use\ndisorder. If mild amphetamine-type substance or other stimulant use disorder is\ncomorbid, the ICD-10-CM code is F15.13. If moderate or severe amphetamine-type\nsubstance or other stimulant use disorder is comorbid, the ICD-10-CM code is\nF15.23. For amphetamine-type substance or other stimulant withdrawal occurring in\nthe absence of amphetamine-type substance or other stimulant use disorder (e.g., in\na patient taking amphetamine solely under appropriate medical supervision), the\nICD-10-CM code is F15.93. If mild cocaine use disorder is comorbid, the ICD-10-CM\ncode is F14.13. If moderate or severe cocaine use disorder is comorbid, the ICD-10-\nCM code is F14.23. For cocaine withdrawal occurring in the absence of a cocaine\nuse disorder, the ICD-10-CM code is F14.93."
    },
    {
      "id": "tobacco-use-disorder",
      "name": "Tobacco Use Disorder",
      "chapter": "Substance-Related and Addictive Disorders",
      "sourcePdfPages": [
        877,
        881
      ],
      "criteriaText": "A. A problematic pattern of tobacco use leading to clinically significant impairment\nor distress, as manifested by at least two of the following, occurring within a 12-\nmonth period:\n1. Tobacco is often taken in larger amounts or over a longer period than was\nintended.\n2. There is a persistent desire or unsuccessful efforts to cut down or control\ntobacco use.\n3. A great deal of time is spent in activities necessary to obtain or use tobacco.\n4. Craving, or a strong desire or urge to use tobacco.\n5. Recurrent tobacco use resulting in a failure to fulfill major role obligations at\nwork, school, or home (e.g., interference with work).\n6. Continued tobacco use despite having persistent or recurrent social or\ninterpersonal problems caused or exacerbated by the effects of tobacco (e.g.,\narguments with others about tobacco use).\n7. Important social, occupational, or recreational activities are given up or\nreduced because of tobacco use.\n8. Recurrent tobacco use in situations in which it is physically hazardous (e.g.,\nsmoking in bed).\n9. Tobacco use is continued despite knowledge of having a persistent or\nrecurrent physical or psychological problem that is likely to have been caused\nor exacerbated by tobacco.\n10. Tolerance, as defined by either of the following:\na. A need for markedly increased amounts of tobacco to achieve the desired\neffect.\nb. A markedly diminished effect with continued use of the same amount of\ntobacco.\n11. Withdrawal, as manifested by either of the following:\na. The characteristic withdrawal syndrome for tobacco (refer to Criteria A\nand B of the criteria set for tobacco withdrawal).\nb. Tobacco (or a closely related substance, such as nicotine) is taken to\nrelieve or avoid withdrawal symptoms.\nSpecify if:\n\nIn early remission: After full criteria for tobacco use disorder were previously\nmet, none of the criteria for tobacco use disorder have been met for at least 3\nmonths but for less than 12 months (with the exception that Criterion A4,\n\u201CCraving, or a strong desire or urge to use tobacco,\u201D may be met).\nIn sustained remission: After full criteria for tobacco use disorder were\npreviously met, none of the criteria for tobacco use disorder have been met at\nany time during a period of 12 months or longer (with the exception that Criterion\nA4, \u201CCraving, or a strong desire or urge to use tobacco,\u201D may be met).\nSpecify if:\nOn maintenance therapy: The individual is taking a long-term maintenance\nmedication, such as nicotine replacement medication, and no criteria for tobacco\nuse disorder have been met for that class of medication (except tolerance to, or\nwithdrawal from, the nicotine replacement medication).\nIn a controlled environment: This additional specifier is used if the individual is\nin an environment where access to tobacco is restricted.\nCode based on current severity/remission: If a tobacco withdrawal or tobacco-\ninduced sleep disorder is also present, do not use the codes below for tobacco use\ndisorder. Instead, the comorbid tobacco use disorder is indicated in the 4th character\nof the tobacco-induced disorder code (see the coding note for tobacco withdrawal or\ntobacco-induced sleep disorder). For example, if there is comorbid tobacco-induced\nsleep disorder and tobacco use disorder, only the tobacco-induced sleep disorder\ncode is given, with the 4th character indicating whether the comorbid tobacco use\ndisorder is moderate or severe: F17.208 for moderate or severe tobacco use\ndisorder with tobacco-induced sleep disorder. It is not permissible to code a\ncomorbid mild tobacco use disorder with a tobacco-induced sleep disorder.\nSpecify current severity/remission:\nZ72.0 Mild: Presence of 2\u20133 symptoms.\nF17.200 Moderate: Presence of 4\u20135 symptoms.\nF17.201 Moderate, In early remission\nF17.201 Moderate, In sustained remission\nF17.200 Severe: Presence of 6 or more symptoms.\nF17.201 Severe, In early remission\nF17.201 Severe, In sustained remission"
    },
    {
      "id": "tobacco-withdrawal",
      "name": "Tobacco Withdrawal",
      "chapter": "Substance-Related and Addictive Disorders",
      "icd10Code": "F17.203",
      "sourcePdfPages": [
        882,
        884
      ],
      "criteriaText": "A. Daily use of tobacco for at least several weeks.\nB. Abrupt cessation of tobacco use, or reduction in the amount of tobacco used,\nfollowed within 24 hours by four (or more) of the following signs or symptoms:\n1.   Irritability, frustration, or anger.\n2.   Anxiety.\n3.   Difficulty concentrating.\n4.   Increased appetite.\n5.   Restlessness.\n6.   Depressed mood.\n7.   Insomnia.\n\nC. The signs or symptoms in Criterion B cause clinically significant distress or\nimpairment in social, occupational, or other important areas of functioning.\nD. The signs or symptoms are not attributed to another medical condition and are\nnot better explained by another mental disorder, including intoxication or\nwithdrawal from another substance.\nCoding note: The ICD-10-CM code for tobacco withdrawal is F17.203. Note that the\nICD-10-CM code indicates the comorbid presence of a moderate or severe tobacco\nuse disorder, reflecting the fact that tobacco withdrawal can only occur in the\npresence of a moderate or severe tobacco use disorder."
    },
    {
      "id": "other-or-unknown-substance-use-disorder",
      "name": "Other (or Unknown) Substance Use Disorder",
      "chapter": "Substance-Related and Addictive Disorders",
      "sourcePdfPages": [
        885,
        889
      ],
      "criteriaText": "A. A problematic pattern of use of an intoxicating substance not able to be\nclassified within the alcohol; caffeine; cannabis; hallucinogen (phencyclidine and\nothers); inhalant; opioid; sedative, hypnotic, or anxiolytic; stimulant; or tobacco\ncategories and leading to clinically significant impairment or distress, as\nmanifested by at least two of the following, occurring within a 12-month period:\n1. The substance is often taken in larger amounts or over a longer period than\nwas intended.\n2. There is a persistent desire or unsuccessful efforts to cut down or control use\nof the substance.\n3. A great deal of time is spent in activities necessary to obtain the substance,\nuse the substance, or recover from its effects.\n4. Craving, or a strong desire or urge to use the substance.\n5. Recurrent use of the substance resulting in a failure to fulfill major role\nobligations at work, school, or home.\n6. Continued use of the substance despite having persistent or recurrent social\nor interpersonal problems caused or exacerbated by the effects of its use.\n7. Important social, occupational, or recreational activities are given up or\nreduced because of use of the substance.\n8. Recurrent use of the substance in situations in which it is physically\nhazardous.\n9. Use of the substance is continued despite knowledge of having a persistent\nor recurrent physical or psychological problem that is likely to have been\ncaused or exacerbated by the substance.\n10. Tolerance, as defined by either of the following:\na. A need for markedly increased amounts of the substance to achieve\nintoxication or desired effect.\nb. A markedly diminished effect with continued use of the same amount of\nthe substance.\n11. Withdrawal, as manifested by either of the following:\na. The characteristic withdrawal syndrome for other (or unknown) substance\n(refer to Criteria A and B of the criteria sets for other [or unknown]\nsubstance withdrawal).\n\nb. The substance (or a closely related substance) is taken to relieve or avoid\nwithdrawal symptoms.\nSpecify if:\nIn early remission: After full criteria for other (or unknown) substance use\ndisorder were previously met, none of the criteria for other (or unknown)\nsubstance use disorder have been met for at least 3 months but for less than 12\nmonths (with the exception that Criterion A4, \u201CCraving, or a strong desire or urge\nto use the substance,\u201D may be met).\nIn sustained remission: After full criteria for other (or unknown) substance use\ndisorder were previously met, none of the criteria for other (or unknown)\nsubstance use disorder have been met at any time during a period of 12 months\nor longer (with the exception that Criterion A4, \u201CCraving, or a strong desire or\nurge to use the substance,\u201D may be met).\nSpecify if:\nIn a controlled environment: This additional specifier is used if the individual is\nin an environment where access to the substance is restricted.\nCode based on current severity/remission: If an other (or unknown) substance\nintoxication, other (or unknown) substance withdrawal, or other (or unknown)\nsubstance\u2013induced mental disorder is present, do not use the codes below for other\n(or unknown) substance use disorder. Instead, the comorbid other (or unknown)\nsubstance use disorder is indicated in the 4th character of the other (or unknown)\nsubstance\u2013induced disorder code (see the coding note for other [or unknown]\nsubstance intoxication, other [or unknown] substance withdrawal, or specific other\n[or unknown] substance\u2013induced mental disorder). For example, if there is comorbid\nother (or unknown) substance\u2013induced depressive disorder and other (or unknown)\nsubstance use disorder, only the other (or unknown) substance\u2013induced depressive\ndisorder code is given, with the 4th character indicating whether the comorbid other\n(or unknown) substance use disorder is mild, moderate, or severe: F19.14 for other\n(or unknown) substance use disorder with other (or unknown) substance\u2013induced\ndepressive disorder or F19.24 for a moderate or severe other (or unknown)\nsubstance use disorder with other (or unknown) substance\u2013induced depressive\ndisorder.\nSpecify current severity/remission:\nF19.10 Mild: Presence of 2\u20133 symptoms.\nF19.11 Mild, In early remission\nF19.11 Mild, In sustained remission\nF19.20 Moderate: Presence of 4\u20135 symptoms.\nF19.21 Moderate, In early remission\nF19.21 Moderate, In sustained remission\nF19.20 Severe: Presence of 6 or more symptoms.\nF19.21 Severe, In early remission\nF19.21 Severe, In sustained remission"
    },
    {
      "id": "other-or-unknown-substance-intoxication",
      "name": "Other (or Unknown) Substance Intoxication",
      "chapter": "Substance-Related and Addictive Disorders",
      "sourcePdfPages": [
        890,
        892
      ],
      "criteriaText": "A. The development of a reversible substance-specific syndrome attributable to\nrecent ingestion of (or exposure to) a substance that is not listed elsewhere or is\nunknown.\nB. Clinically significant problematic behavioral or psychological changes that are\nattributable to the effect of the substance on the central nervous system (e.g.,\nimpaired motor coordination, psychomotor agitation or retardation, euphoria,\nanxiety, belligerence, mood lability, cognitive impairment, impaired judgment,\nsocial withdrawal) and develop during, or shortly after, use of the substance.\nC. The signs or symptoms are not attributable to another medical condition and are\nnot better explained by another mental disorder, including intoxication with\nanother substance.\nSpecify if:\nWith perceptual disturbances: This specifier may be noted when\nhallucinations with intact reality testing or auditory, visual, or tactile illusions\noccur in the absence of a delirium.\nCoding note: The ICD-10-CM code depends on whether there is a comorbid other\n(or unknown) substance use disorder involving the same substance and whether or\nnot there are perceptual disturbances.\nFor other (or unknown) substance intoxication, without perceptual\ndisturbances: If a mild other (or unknown) substance use disorder is comorbid,\nthe ICD-10-CM code is F19.120, and if a moderate or severe other (or unknown)\nsubstance use disorder is comorbid, the ICD-10-CM code is F19.220. If there is\nno comorbid other (or unknown) substance use disorder, then the ICD-10-CM\ncode is F19.920.\nFor other (or unknown) substance intoxication, with perceptual\ndisturbances: If a mild other (or unknown) substance use disorder is comorbid,\nthe ICD-10-CM code is F19.122, and if a moderate or severe other (or unknown)\nsubstance use disorder is comorbid, the ICD-10-CM code is F19.222. If there is\nno comorbid other (or unknown) substance use disorder, then the ICD-10-CM\ncode is F19.922.\n\nNote: For information on Risk and Prognostic Factors, Culture-Related Diagnostic\nIssues, and Diagnostic Markers, see the corresponding sections in Other (or Unknown)\nSubstance Use Disorder."
    },
    {
      "id": "other-or-unknown-substance-withdrawal",
      "name": "Other (or Unknown) Substance Withdrawal",
      "chapter": "Substance-Related and Addictive Disorders",
      "sourcePdfPages": [
        893,
        895
      ],
      "criteriaText": "A. Cessation of (or reduction in) use of a substance that has been heavy and\nprolonged.\nB. The development of a substance-specific syndrome shortly after the cessation of\n(or reduction in) substance use.\nC. The substance-specific syndrome causes clinically significant distress or\nimpairment in social, occupational, or other important areas of functioning.\nD. The symptoms are not attributable to another medical condition and are not\nbetter explained by another mental disorder, including withdrawal from another\nsubstance.\nE. The substance involved cannot be classified under any of the other substance\ncategories (alcohol; caffeine; cannabis; opioids; sedatives, hypnotics, or\nanxiolytics; stimulants; or tobacco) or is unknown.\nSpecify if:\nWith perceptual disturbances: This specifier may be noted when\nhallucinations with intact reality testing or auditory, visual, or tactile illusions\noccur in the absence of a delirium.\nCoding note: The ICD-10-CM code depends on whether or not there is a comorbid\nother (or unknown) substance use disorder and whether or not there are perceptual\ndisturbances.\nFor other (or unknown) substance withdrawal, without perceptual\ndisturbances: If a mild other (or unknown) substance use disorder is comorbid,\nthe ICD-10-CM code is F19.130, and if a moderate or severe other (or unknown)\nsubstance use disorder is comorbid, the ICD-10-CM code is F19.230. If there is\nno comorbid other (or unknown) substance use disorder (e.g., in a patient taking\nan other [or unknown] substance solely under appropriate medical supervision),\nthen the ICD-10-CM code is F19.930.\nFor other (or unknown) substance withdrawal, with perceptual\ndisturbances: If a mild other (or unknown) substance use disorder is comorbid,\nthe ICD-10-CM code is\n\nF19.132, and if a moderate or severe other (or unknown) substance use disorder\nis comorbid, the ICD-10-CM code is F19.232. If there is no comorbid other (or\nunknown) substance use disorder (e.g., in a patient taking an other [or unknown]\nsubstance solely under appropriate medical supervision), then the ICD-10-CM\ncode is F19.932.\n\nNote: For information on Risk and Prognostic Factors and Diagnostic Markers, see the\ncorresponding sections in Other (or Unknown) Substance Use Disorder."
    },
    {
      "id": "gambling-disorder",
      "name": "Gambling Disorder",
      "chapter": "Substance-Related and Addictive Disorders",
      "icd10Code": "F63.0",
      "sourcePdfPages": [
        896,
        906
      ],
      "criteriaText": "A. Persistent and recurrent problematic gambling behavior leading to clinically\nsignificant impairment or distress, as indicated by the individual exhibiting four\n(or more) of the following in a 12-month period:\n1. Needs to gamble with increasing amounts of money in order to achieve the\ndesired excitement.\n2. Is restless or irritable when attempting to cut down or stop gambling.\n3. Has made repeated unsuccessful efforts to control, cut back, or stop\ngambling.\n4. Is often preoccupied with gambling (e.g., having persistent thoughts of\nreliving past gambling experiences, handicapping or planning the next\nventure, thinking of ways to get money with which to gamble).\n5.   Often gambles when feeling distressed (e.g., helpless, guilty, anxious,\ndepressed).\n6.   After losing money gambling, often returns another day to get even (\u201Cchasing\u201D\none\u2019s losses).\n7.   Lies to conceal the extent of involvement with gambling.\n8.   Has jeopardized or lost a significant relationship, job, or educational or career\nopportunity because of gambling.\n9.   Relies on others to provide money to relieve desperate financial situations\ncaused by gambling.\nB. The gambling behavior is not better explained by a manic episode.\nSpecify if:\nEpisodic: Meeting diagnostic criteria at more than one time point, with\nsymptoms subsiding between periods of gambling disorder for at least several\nmonths.\nPersistent: Experiencing continuous symptoms, to meet diagnostic criteria for\nmultiple years.\nSpecify if:\nIn early remission: After full criteria for gambling disorder were previously met,\nnone of the criteria for gambling disorder have been met for at least 3 months\nbut for less than 12 months.\nIn sustained remission: After full criteria for gambling disorder were previously\nmet, none of the criteria for gambling disorder have been met during a period of\n12 months or longer.\nSpecify current severity:\nMild: 4\u20135 criteria met.\nModerate: 6\u20137 criteria met.\nSevere: 8\u20139 criteria met.\n\nNote: Although some behavioral conditions that do not involve ingestion of substances\nhave similarities to substance-related disorders, only one disorder\u2014gambling disorder\u2014\nhas sufficient data to be included in this section."
    },
    {
      "id": "delirium",
      "name": "Delirium",
      "chapter": "Neurocognitive Disorders",
      "sourcePdfPages": [
        907,
        915
      ],
      "criteriaText": "A. A disturbance in attention (i.e., reduced ability to direct, focus, sustain, and shift\nattention) accompanied by reduced awareness of the environment.\nB. The disturbance develops over a short period of time (usually hours to a few\ndays), represents a change from baseline attention and awareness, and tends to\nfluctuate in severity during the course of a day.\nC. An additional disturbance in cognition (e.g., memory deficit, disorientation,\nlanguage, visuospatial ability, or perception).\nD. The disturbances in Criteria A and C are not better explained by another\npreexisting, established, or evolving neurocognitive disorder and do not occur in\nthe context of a severely reduced level of arousal, such as coma.\nE. There is evidence from the history, physical examination, or laboratory findings\nthat the disturbance is a direct physiological consequence of another medical\ncondition, substance intoxication or withdrawal (i.e., due to a drug of abuse or to\na medication), or exposure to a toxin, or is due to multiple etiologies.\nSpecify if:\nAcute: Lasting a few hours or days.\nPersistent: Lasting weeks or months.\nSpecify if:\nHyperactive: The individual has a hyperactive level of psychomotor activity that\nmay be accompanied by mood lability, agitation, and/or refusal to cooperate with\nmedical care.\nHypoactive: The individual has a hypoactive level of psychomotor activity that\nmay be accompanied by sluggishness and lethargy that approaches stupor.\nMixed level of activity: The individual has a normal level of psychomotor\nactivity even though attention and awareness are disturbed. Also includes\nindividuals whose activity level rapidly fluctuates.\nSpecify whether:\nSubstance intoxication delirium: This diagnosis should be made instead of\nsubstance intoxication when the symptoms in Criteria A and C predominate in\nthe clinical picture and when they are sufficiently severe to warrant clinical\nattention.\nCoding note: The ICD-10-CM codes for the [specific substance] intoxication\ndelirium are indicated in the table below. Note that the ICD-10-CM code\ndepends on whether or not there is a comorbid substance use disorder\npresent for the same class of substance. If a mild substance use disorder is\ncomorbid with the substance intoxication delirium, the 4th position character is\n\u201C1,\u201D and the clinician should record \u201Cmild [substance] use disorder\u201D before the\nsubstance intoxication delirium (e.g., \u201Cmild cocaine use disorder with cocaine\nintoxication delirium\u201D). If a moderate or severe substance use disorder is\ncomorbid with the substance intoxication delirium, the 4th position character is\n\u201C2,\u201D and the clinician should record \u201Cmoderate [substance] use disorder\u201D or\n\u201Csevere [substance] use disorder,\u201D depending on the severity of the comorbid\nsubstance use disorder. If there is no comorbid substance use disorder (e.g.,\nafter a one-time heavy use of the substance), then the 4th position character is\n\u201C9,\u201D and the clinician should record only the substance intoxication delirium.\n\nICD-10-CM\nWith moderate or\nWith mild use      severe use      Without use\nSubstance intoxication delirium      disorder          disorder        disorder\nAlcohol                               F10.121           F10.221         F10.921\nCannabis                              F12.121           F12.221         F12.921\nPhencyclidine                         F16.121           F16.221         F16.921\nOther hallucinogen                    F16.121           F16.221         F16.921\nInhalant                                  F18.121           F18.221         F18.921\nOpioid                                    F11.121           F11.221         F11.921\nSedative, hypnotic, or anxiolytic         F13.121           F13.221         F13.921\nAmphetamine-type substance (or other      F15.121           F15.221         F15.921\nstimulant)\nCocaine                                   F14.121           F14.221         F14.921\nOther (or unknown) substance              F19.121           F19.221         F19.921\n\nSubstance withdrawal delirium: This diagnosis should be made instead of\nsubstance withdrawal when the symptoms in Criteria A and C predominate in the\nclinical picture and when they are sufficiently severe to warrant clinical attention.\nCoding note: The ICD-10-CM codes for the [specific substance] withdrawal\ndelirium are indicated in the table below. Note that the ICD-10-CM code\ndepends on whether or not there is a comorbid substance use disorder\npresent for the same class of substance. If a mild substance use disorder is\ncomorbid with the substance withdrawal delirium, the 4th position character is\n\u201C1,\u201D and the clinician should record \u201Cmild [substance] use disorder\u201D before the\nsubstance withdrawal delirium (e.g., \u201Cmild alcohol use disorder with alcohol\nwithdrawal delirium\u201D). If a moderate or severe substance use disorder is\ncomorbid with the substance withdrawal delirium, the 4th position character is\n\u201C2,\u201D and the clinician should record \u201Cmoderate [substance] use disorder\u201D or\n\u201Csevere [substance] use disorder,\u201D depending on the severity of the comorbid\nsubstance use disorder. If there is no comorbid substance use disorder (e.g.,\nafter regular use of an anxiolytic substance taken as prescribed), then the 4th\nposition character is \u201C9,\u201D and the clinician should record only the substance\nwithdrawal delirium.\n\nICD-10-CM\nWith moderate or\nWith mild use      severe use      Without use\nSubstance withdrawal delirium            disorder          disorder        disorder\nAlcohol                                   F10.131           F10.231         F10.931\nOpioid                                    F11.188           F11.288         F11.988\nSedative, hypnotic, or anxiolytic         F13.131           F13.231         F13.931\nOther (or unknown) substance              F19.131           F19.231         F19.931\n\nMedication-induced delirium: This diagnosis applies when the symptoms in\nCriteria A and C arise as a side effect of a medication taken as prescribed.\nCode [specific medication]\u2013induced delirium: F11.921 opioid taken as\nprescribed (or F11.988 if during withdrawal from opioid taken as prescribed);\nF12.921 pharmaceutical cannabis receptor agonist taken as prescribed;\nF13.921 sedative, hypnotic, or anxiolytic taken as prescribed (or F13.931 if\nduring withdrawal from sedative, hypnotic, or anxiolytic taken as prescribed);\nF15.921 amphetamine-type substance or other stimulant taken as prescribed;\nF16.921 ketamine or other hallucinogen taken as prescribed or for medical\nreasons; F19.921 for medications that do not fit into any of the classes (e.g.,\ndexamethasone) and in cases in which a substance is judged to be an\netiological factor but the specific class of substance is unknown (or F19.931 if\nduring withdrawal from medications that do not fit into any of the classes,\ntaken as prescribed).\nF05 Delirium due to another medical condition: There is evidence from the\nhistory, physical examination, or laboratory findings that the disturbance is\nattributable to the physiological consequences of another medical condition.\nCoding note: Include the name of the other medical condition in the name of\nthe delirium (e.g., F05 delirium due to hepatic encephalopathy). The other\nmedical condition should also be coded and listed separately immediately\nbefore the delirium due to another medical condition (e.g., K72.90 hepatic\nencephalopathy; F05 delirium due to hepatic encephalopathy).\nF05 Delirium due to multiple etiologies: There is evidence from the history,\nphysical examination, or laboratory findings that the delirium has more than one\netiology (e.g., more than one etiological medical condition; another medical\ncondition plus substance intoxication or medication side effect).\nCoding note: Use multiple separate codes reflecting specific delirium\netiologies (e.g., K72.90 hepatic encephalopathy; F05 delirium due to hepatic\nfailure; F10.231 alcohol withdrawal delirium). Note that the etiological medical\ncondition both appears as a separate code that precedes the delirium code\nand is substituted into the delirium due to another medical condition rubric."
    },
    {
      "id": "major-neurocognitive-disorder",
      "name": "Major Neurocognitive Disorder",
      "chapter": "Neurocognitive Disorders",
      "sourcePdfPages": [
        916,
        916
      ],
      "criteriaText": "A. Evidence of significant cognitive decline from a previous level of performance in\none or more cognitive domains (complex attention, executive function, learning\nand memory, language, perceptual-motor, or social cognition) based on:\n1. Concern of the individual, a knowledgeable informant, or the clinician that\nthere has been a significant decline in cognitive function; and\n2. A substantial impairment in cognitive performance, preferably documented by\nstandardized neuropsychological testing or, in its absence, another quantified\nclinical assessment.\nB. The cognitive deficits interfere with independence in everyday activities (i.e., at a\nminimum, requiring assistance with complex instrumental activities of daily living\nsuch as paying bills or managing medications).\nC. The cognitive deficits do not occur exclusively in the context of a delirium.\nD. The cognitive deficits are not better explained by another mental disorder (e.g.,\nmajor depressive disorder, schizophrenia).\nSpecify whether due to:\nNote: Each subtype listed has specific diagnostic criteria and corresponding text,\nwhich follow the general discussion of major and mild neurocognitive disorders.\nAlzheimer\u2019s disease\nFrontotemporal degeneration\nLewy body disease\nVascular disease\nTraumatic brain injury\nSubstance/medication use\nHIV infection\nPrion disease\nParkinson\u2019s disease\nHuntington\u2019s disease\nAnother medical condition\nMultiple etiologies\nUnspecified etiology\nCoding note: Code based on medical or substance etiology. In most cases of major\nneurocognitive disorder, there is need for an additional code for the etiological\nmedical condition, which must immediately precede the diagnostic code for major\nneurocognitive disorder, as noted in the coding table on pp. 682\u2013683."
    },
    {
      "id": "mild-neurocognitive-disorder",
      "name": "Mild Neurocognitive Disorder",
      "chapter": "Neurocognitive Disorders",
      "sourcePdfPages": [
        917,
        927
      ],
      "criteriaText": "A. Evidence of modest cognitive decline from a previous level of performance in\none or more cognitive domains (complex attention, executive function, learning\nand memory, language, perceptual-motor, or social cognition) based on:\n1. Concern of the individual, a knowledgeable informant, or the clinician that\nthere has been a mild decline in cognitive function; and\n2. A modest impairment in cognitive performance, preferably documented by\nstandardized neuropsychological testing or, in its absence, another quantified\nclinical assessment.\nB. The cognitive deficits do not interfere with capacity for independence in everyday\nactivities (i.e., complex instrumental activities of daily living such as paying bills\nor managing medications are preserved, but greater effort, compensatory\nstrategies, or accommodation may be required).\nC. The cognitive deficits do not occur exclusively in the context of a delirium.\nD. The cognitive deficits are not better explained by another mental disorder (e.g.,\nmajor depressive disorder, schizophrenia).\n\nSpecify whether due to:\nNote: Each subtype listed has specific diagnostic criteria and corresponding text,\nwhich follow the general discussion of major and mild neurocognitive disorders.\nAlzheimer\u2019s disease\nFrontotemporal degeneration\nLewy body disease\nVascular disease\nTraumatic brain injury\nSubstance/medication use\nHIV infection\nPrion disease\nParkinson\u2019s disease\nHuntington\u2019s disease\nAnother medical condition\nMultiple etiologies\nUnspecified etiology\nCoding note: For mild neurocognitive disorder due to any of the medical etiologies\nlisted above, code G31.84. Do not use additional codes for the presumed etiological\nmedical conditions. For substance/medication-induced mild neurocognitive disorder,\ncode based on type of substance; see \u201CSubstance/Medication-Induced Major or Mild\nNeurocognitive Disorder.\u201D For unspecified mild neurocognitive disorder, code R41.9.\nSpecify (behavioral disturbance cannot be coded but should still be recorded):\nWithout behavioral disturbance: If the cognitive disturbance is not\naccompanied by any clinically significant behavioral disturbance.\nWith behavioral disturbance (specify disturbance): If the cognitive disturbance\nis accompanied by a clinically significant behavioral disturbance (e.g., psychotic\nsymptoms, mood disturbance, agitation, apathy, or other behavioral symptoms).\nCoding note: Use additional code(s) to indicate clinically significant psychiatric\nsymptoms due to the same medical condition causing the mild neurocognitive\ndisorder (e.g., F06.2 psychotic disorder due to traumatic brain injury, with\ndelusions; F06.32 depressive disorder due to HIV disease, with major\ndepressive\u2013like episode). Note: Mental disorders due to another medical\ncondition are included with disorders with which they share phenomenology\n(e.g., for depressive disorders due to another medical condition, see the chapter\n\u201CDepressive Disorders\u201D)."
    },
    {
      "id": "major-or-mild-neurocognitive-disorder-due-to-alzheimers-disease",
      "name": "Major or Mild Neurocognitive Disorder Due to Alzheimer\u2019s Disease",
      "chapter": "Neurocognitive Disorders",
      "sourcePdfPages": [
        928,
        934
      ],
      "criteriaText": "A. The criteria are met for major or mild neurocognitive disorder.\nB. There is insidious onset and gradual progression of impairment in one or more\ncognitive domains (for major neurocognitive disorder, at least two domains must\nbe impaired).\nC. Criteria are met for either probable or possible Alzheimer\u2019s disease as follows:\nFor major neurocognitive disorder:\nProbable Alzheimer\u2019s disease is diagnosed if either of the following is present;\notherwise, possible Alzheimer\u2019s disease should be diagnosed.\n1. Evidence of a causative Alzheimer\u2019s disease genetic mutation from family\nhistory or genetic testing.\n2. All three of the following are present:\na. Clear evidence of decline in memory and learning and at least one other\ncognitive domain (based on detailed history or serial neuropsychological\ntesting).\nb. Steadily progressive, gradual decline in cognition, without extended\nplateaus.\nc. No evidence of mixed etiology (i.e., absence of other neurodegenerative\nor cerebrovascular disease, or another neurological, mental, or systemic\ndisease or condition likely contributing to cognitive decline).\nFor mild neurocognitive disorder:\nProbable Alzheimer\u2019s disease is diagnosed if there is evidence of a causative\nAlzheimer\u2019s disease genetic mutation from either genetic testing or family history.\nPossible Alzheimer\u2019s disease is diagnosed if there is no evidence of a\ncausative Alzheimer\u2019s disease genetic mutation from either genetic testing or\nfamily history, and all three of the following are present:\n1. Clear evidence of decline in memory and learning.\n2. Steadily progressive, gradual decline in cognition, without extended plateaus.\n3. No evidence of mixed etiology (i.e., absence of other neurodegenerative or\ncerebrovascular disease, or another neurological or systemic disease or\ncondition likely contributing to cognitive decline).\nD. The disturbance is not better explained by cerebrovascular disease, another\nneurodegenerative disease, the effects of a substance, or another mental,\nneurological, or systemic disorder.\nCoding note (see coding table on pp. 682\u2013683):\nFor major neurocognitive disorder due to probable or possible Alzheimer\u2019s disease,\nwith behavioral disturbance, code first G30.9 Alzheimer\u2019s disease, followed by\nF02.81. For major neurocognitive disorder due to probable or possible Alzheimer\u2019s\ndisease, without behavioral disturbance, code first G30.9 Alzheimer\u2019s disease,\nfollowed by F02.80.\n\nNote: The severity specifiers \u201Cmild,\u201D \u201Cmoderate,\u201D and \u201Csevere\u201D cannot be coded for\nmajor neurocognitive disorder but should still be recorded.\nFor mild neurocognitive disorder due to Alzheimer\u2019s disease, code G31.84. (Note:\nDo not use the additional code for Alzheimer\u2019s disease. \u201CWith behavioral\ndisturbance\u201D and \u201Cwithout behavioral disturbance\u201D cannot be coded but should still\nbe recorded.)\nFor major or mild neurocognitive disorder due to Alzheimer\u2019s disease: Use additional\ncode(s) to indicate clinically significant psychiatric symptoms due to Alzheimer\u2019s\ndisease (e.g., F06.2 psychotic disorder due to Alzheimer\u2019s disease, with delusions;\nF06.32 depressive disorder due to Alzheimer\u2019s disease, with major depressive\u2013like\nepisode)."
    },
    {
      "id": "major-or-mild-frontotemporal-neurocognitive-disorder",
      "name": "Major or Mild Frontotemporal Neurocognitive Disorder",
      "chapter": "Neurocognitive Disorders",
      "sourcePdfPages": [
        935,
        938
      ],
      "criteriaText": "A. The criteria are met for major or mild neurocognitive disorder.\nB. The disturbance has insidious onset and gradual progression.\nC. Either (1) or (2):\n1. Behavioral variant:\na. Three or more of the following behavioral symptoms:\ni. Behavioral disinhibition.\nii. Apathy or inertia.\niii. Loss of sympathy or empathy.\n\niv. Perseverative, stereotyped or compulsive/ritualistic behavior.\nv. Hyperorality and dietary changes.\nb. Prominent decline in social cognition and/or executive abilities.\n2. Language variant:\na. Prominent decline in language ability, in the form of speech production,\nword finding, object naming, grammar, or word comprehension.\nD. Relative sparing of learning and memory and perceptual-motor function.\nE. The disturbance is not better explained by cerebrovascular disease, another\nneurodegenerative disease, the effects of a substance, or another mental,\nneurological, or systemic disorder.\nProbable frontotemporal neurocognitive disorder is diagnosed if either of the\nfollowing is present; otherwise, possible frontotemporal neurocognitive disorder\nshould be diagnosed:\n1. Evidence of a causative frontotemporal neurocognitive disorder genetic mutation,\nfrom either family history or genetic testing.\n2. Evidence of disproportionate frontal and/or temporal lobe involvement from\nneuroimaging.\nPossible frontotemporal neurocognitive disorder is diagnosed if there is no\nevidence of a genetic mutation, and neuroimaging has not been performed.\nCoding note (see coding table on pp. 682\u2013683):\nFor major neurocognitive disorder due to probable or possible frontotemporal\ndegeneration, with behavioral disturbance, code first G31.09 frontotemporal\ndegeneration, followed by F02.81. For major neurocognitive disorder due to probable\nor possible frontotemporal degeneration, without behavioral disturbance, code first\nG31.09 frontotemporal degeneration, followed by F02.80.\nNote: The severity specifiers \u201Cmild,\u201D \u201Cmoderate,\u201D and \u201Csevere\u201D cannot be coded for\nmajor neurocognitive disorder but should still be recorded.\nFor mild neurocognitive disorder due to frontotemporal degeneration, code G31.84.\n(Note: Do not use the additional code for frontotemporal degeneration. \u201CWith\nbehavioral disturbance\u201D and \u201Cwithout behavioral disturbance\u201D cannot be coded but\nshould still be recorded.)\nFor major or mild frontotemporal neurocognitive disorder: Use additional code(s) to\nindicate clinically significant psychiatric symptoms due to frontotemporal\ndegeneration (e.g., F06.33 bipolar and related disorder due to frontotemporal\ndegeneration, with manic features; F07.0 personality change due to frontotemporal\ndegeneration, disinhibited type)."
    },
    {
      "id": "major-or-mild-neurocognitive-disorder-with-lewy-bodies",
      "name": "Major or Mild Neurocognitive Disorder With Lewy Bodies",
      "chapter": "Neurocognitive Disorders",
      "sourcePdfPages": [
        939,
        942
      ],
      "criteriaText": "A. The criteria are met for major or mild neurocognitive disorder.\nB. The disorder has an insidious onset and gradual progression.\nC. The disorder meets a combination of core diagnostic features and suggestive"
    },
    {
      "id": "major-or-mild-vascular-neurocognitive-disorder",
      "name": "Major or Mild Vascular Neurocognitive Disorder",
      "chapter": "Neurocognitive Disorders",
      "sourcePdfPages": [
        943,
        947
      ],
      "criteriaText": "A. The criteria are met for major or mild neurocognitive disorder.\nB. The clinical features are consistent with a vascular etiology, as suggested by\neither of the following:\n1. Onset of the cognitive deficits is temporally related to one or more\ncerebrovascular events.\n2. Evidence for decline is prominent in complex attention (including processing\nspeed) and frontal-executive function.\n\nC. There is evidence of the presence of cerebrovascular disease from history,\nphysical examination, and/or neuroimaging considered sufficient to account for\nthe neurocognitive deficits.\nD. The symptoms are not better explained by another brain disease or systemic\ndisorder.\nProbable vascular neurocognitive disorder is diagnosed if one of the following is\npresent; otherwise possible vascular neurocognitive disorder should be\ndiagnosed:\n1. Clinical criteria are supported by neuroimaging evidence of significant\nparenchymal injury attributed to cerebrovascular disease (neuroimaging-\nsupported).\n2. The neurocognitive syndrome is temporally related to one or more documented\ncerebrovascular events.\n3. Both clinical and genetic (e.g., cerebral autosomal dominant arteriopathy with\nsubcortical infarcts and leukoencephalopathy) evidence of cerebrovascular\ndisease is present.\nPossible vascular neurocognitive disorder is diagnosed if the clinical criteria are\nmet but neuroimaging is not available and the temporal relationship of the\nneurocognitive syndrome with one or more cerebrovascular events is not\nestablished.\nCoding note (see coding table on pp. 682\u2013683):\nFor major neurocognitive disorder probably or possibly due to vascular disease, with\nbehavioral disturbance, code F01.51.\nFor major neurocognitive disorder probably or possibly due to vascular disease,\nwithout behavioral disturbance, code F01.50.\nAn additional medical code for the vascular disease is not used.\nNote: The severity specifiers \u201Cmild,\u201D \u201Cmoderate,\u201D and \u201Csevere\u201D cannot be coded for\nmajor neurocognitive disorder but should still be recorded.\nFor mild vascular neurocognitive disorder, code G31.84. (Note: Do not use an\nadditional code for the vascular disease. \u201CWith behavioral disturbance\u201D and \u201Cwithout\nbehavioral disturbance\u201D cannot be coded but should still be recorded.)\nFor major or mild vascular neurocognitive disorder: Use additional code(s) to\nindicate clinically significant psychiatric symptoms due to the cerebrovascular\ndisease (e.g., F06.31 depressive disorder due to cerebrovascular disease, with\ndepressive features)."
    },
    {
      "id": "major-or-mild-neurocognitive-disorder-due-to-traumatic-brain-injury",
      "name": "Major or Mild Neurocognitive Disorder Due to Traumatic Brain Injury",
      "chapter": "Neurocognitive Disorders",
      "sourcePdfPages": [
        948,
        954
      ],
      "criteriaText": "A. The criteria are met for major or mild neurocognitive disorder.\nB. There is evidence of a traumatic brain injury\u2014that is, an impact to the head or\nother mechanisms of rapid movement or displacement of the brain within the\nskull, with one or more of the following:\n1.   Loss of consciousness.\n2.   Posttraumatic amnesia.\n3.   Disorientation and confusion.\n4.   Neurological signs (e.g., neuroimaging demonstrating injury; visual field cuts;\nanosmia; hemiparesis; hemisensory loss; cortical blindness; aphasia; apraxia;\nweakness;\n\nloss of balance; other sensory loss that cannot be accounted for by peripheral\nor other causes).\nC. The neurocognitive disorder presents immediately after the occurrence of the\ntraumatic brain injury or immediately after recovery of consciousness and\npersists past the acute post-injury period.\nCoding note (see coding table on pp. 682\u2013683):\nFor major neurocognitive disorder due to traumatic brain injury, with behavioral\ndisturbance: code first S06.2X9S diffuse traumatic brain injury with loss of\nconsciousness of unspecified duration, sequela; followed by F02.81 major\nneurocognitive disorder due to traumatic brain injury, with behavioral disturbance.\nFor major neurocognitive disorder due to traumatic brain injury, without behavioral\ndisturbance: code first S06.2X9S diffuse traumatic brain injury with loss of\nconsciousness of unspecified duration, sequela; followed by F02.80 major\nneurocognitive disorder due to traumatic brain injury, without behavioral disturbance.\nNote: The severity specifiers \u201Cmild,\u201D \u201Cmoderate,\u201D and \u201Csevere\u201D cannot be coded for\nmajor neurocognitive disorder but should still be recorded.\nFor mild neurocognitive disorder due to traumatic brain injury, code G31.84. (Note:\nDo not use the additional code for traumatic brain injury. \u201CWith behavioral\ndisturbance\u201D and \u201Cwithout behavioral disturbance\u201D cannot be coded but should still\nbe recorded.)\nFor major or mild neurocognitive disorder due to traumatic brain injury: Use\nadditional code(s) to indicate clinically significant psychiatric symptoms due to the\ntraumatic brain injury (e.g., F06.34 bipolar and related disorder due to traumatic\nbrain injury, with mixed features; F07.0 personality change due to traumatic brain\ninjury, apathetic type)."
    },
    {
      "id": "substance-medication-induced-major-or-mild-neurocognitive-disorder",
      "name": "Substance/Medication-Induced Major or Mild Neurocognitive Disorder",
      "chapter": "Neurocognitive Disorders",
      "sourcePdfPages": [
        955,
        960
      ],
      "criteriaText": "A. The criteria are met for major or mild neurocognitive disorder.\nB. The neurocognitive impairments do not occur exclusively during the course of a\ndelirium and persist beyond the usual duration of intoxication and acute\nwithdrawal.\nC. The involved substance or medication and duration and extent of use are\ncapable of producing the neurocognitive impairment.\nD. The temporal course of the neurocognitive deficits is consistent with the timing of\nsubstance or medication use and abstinence (e.g., the deficits remain stable or\nimprove after a period of abstinence).\nE. The neurocognitive disorder is not attributable to another medical condition or is\nnot better explained by another mental disorder.\nCoding note (see also coding table on pp. 682\u2013683): The ICD-10-CM codes for\nthe [specific substance/medication]-induced neurocognitive disorders are indicated\nin the table below. Note that the ICD-10-CM code depends on whether or not there\nis a comorbid substance use disorder present for the same class of substance. In\nany case, an additional separate diagnosis of a substance use disorder is not given.\nSubstance-induced major neurocognitive disorder: If a mild substance use\ndisorder is comorbid with the substance-induced major neurocognitive disorder, the\n4th position character is \u201C1,\u201D and the clinician should record \u201Cmild [substance] use\ndisorder\u201D before the substance-induced major neurocognitive disorder (e.g., \u201Cmild\ninhalant use disorder with inhalant-induced major neurocognitive disorder\u201D). For\nalcohol and sedative, hypnotic, or anxiolytic substances, a mild substance use\ndisorder is insufficient to cause a substance-induced major neurocognitive disorder;\nthus, there are no available ICD-10-CM codes for this combination. If a moderate or\nsevere substance use disorder is comorbid with the substance-induced major\nneurocognitive disorder, the 4th position character is \u201C2,\u201D and the clinician should\nrecord \u201Cmoderate [substance] use disorder\u201D or \u201Csevere [substance] use disorder,\u201D\ndepending on the severity of the comorbid substance use disorder. If there is no\ncomorbid substance use disorder, then the 4th position character is \u201C9,\u201D and the\nclinician should record only the substance-induced major neurocognitive disorder.\n\nSubstance-induced mild neurocognitive disorder: If a mild substance use\ndisorder is comorbid with the substance-induced mild neurocognitive disorder, the\n4th position character is \u201C1,\u201D and the clinician should record \u201Cmild [substance] use\ndisorder\u201D before the substance-induced mild neurocognitive disorder (e.g., \u201Cmild\ncocaine use disorder with cocaine-induced mild neurocognitive disorder\u201D). If a\nmoderate or severe substance use disorder is comorbid with the substance-induced\nmild neurocognitive disorder, the 4th position character is \u201C2,\u201D and the clinician\nshould record \u201Cmoderate [substance] use disorder\u201D or \u201Csevere [substance] use\ndisorder,\u201D depending on the severity of the comorbid substance use disorder. If there\nis no comorbid substance use disorder, then the 4th position character is \u201C9,\u201D and the\nclinician should record only the substance-induced mild neurocognitive disorder.\nThe severity specifiers \u201Cmild,\u201D \u201Cmoderate,\u201D and \u201Csevere\u201D (for major neurocognitive\ndisorder) and the accompanying symptom specifiers \u201Cwith behavioral disturbance\u201D\nand \u201Cwithout behavioral disturbance\u201D (for major or mild neurocognitive disorder)\ncannot be coded but should still be recorded.\n\nICD-10-CM\nWith mild use    With moderate or     Without use\ndisorder      severe use disorder    disorder\nSubstance-induced major neurocognitive disorder (NCD)\nAlcohol (major NCD), nonamnestic-                NA                   F10.27            F10.97\nconfabulatory type\nAlcohol (major NCD), amnestic-                   NA                   F10.26            F10.96\nconfabulatory type\nInhalant (major NCD)                          F18.17                  F18.27            F18.97\nSedative, hypnotic, or anxiolytic (major            NA                F13.27            F13.97\nNCD)\nOther (or unknown) substance (major NCD)           F19.17             F19.27            F19.97\nSubstance-induced mild neurocognitive disorder (NCD)\nAlcohol (mild NCD)                            F10.188                F10.288           F10.988\nInhalant (mild NCD)                               F18.188            F18.288           F18.988\nSedative, hypnotic, or anxiolytic (mild NCD)      F13.188            F13.288           F13.988\nAmphetamine-type substance (or other              F15.188            F15.288           F15.988\nstimulant) (mild NCD)\nCocaine (mild NCD)                                F14.188            F14.288           F14.988\nOther (or unknown) substance (mild NCD)           F19.188            F19.288           F19.988\nSpecify if:\nPersistent: Neurocognitive impairment continues to be significant after an\nextended period of abstinence."
    },
    {
      "id": "major-or-mild-neurocognitive-disorder-due-to-hiv-infection",
      "name": "Major or Mild Neurocognitive Disorder Due to HIV Infection",
      "chapter": "Neurocognitive Disorders",
      "sourcePdfPages": [
        961,
        964
      ],
      "criteriaText": "A. The criteria are met for major or mild neurocognitive disorder.\nB. There is documented infection with human immunodeficiency virus (HIV).\nC. The neurocognitive disorder is not better explained by non-HIV conditions,\nincluding secondary brain diseases such as progressive multifocal\nleukoencephalopathy or cryptococcal meningitis.\nD. The neurocognitive disorder is not attributable to another medical condition and\nis not better explained by a mental disorder.\nCoding note (see coding table on pp. 682\u2013683):\nFor major neurocognitive disorder due to HIV infection, with behavioral disturbance,\ncode first B20 HIV infection, followed by F02.81 major neurocognitive disorder due\nto HIV infection, with behavioral disturbance.\nFor major neurocognitive disorder due to HIV infection, without behavioral\ndisturbance, code first B20 HIV infection, followed by F02.80 major neurocognitive\ndisorder due to HIV infection, without behavioral disturbance.\nNote: The severity specifiers \u201Cmild,\u201D \u201Cmoderate,\u201D and \u201Csevere\u201D cannot be coded for\nmajor neurocognitive disorder but should still be recorded.\nFor mild neurocognitive disorder due to HIV infection, code G31.84. (Note: Do not\nuse the additional code for HIV infection. \u201CWith behavioral disturbance\u201D and \u201Cwithout\nbehavioral disturbance\u201D cannot be coded but should still be recorded.)\n\nFor major or mild neurocognitive disorder due to HIV infection: Use additional\ncode(s) to indicate clinically significant psychiatric symptoms due to HIV infection\n(e.g., F06.34 bipolar and related disorder due to HIV infection, with mixed features;\nF07.0 personality change due to traumatic brain injury, apathetic type)."
    },
    {
      "id": "major-or-mild-neurocognitive-disorder-due-to-prion-disease",
      "name": "Major or Mild Neurocognitive Disorder Due to Prion Disease",
      "chapter": "Neurocognitive Disorders",
      "sourcePdfPages": [
        965,
        967
      ],
      "criteriaText": "A. The criteria are met for major or mild neurocognitive disorder.\nB. There is insidious onset, and rapid progression of impairment is common.\nC. There are motor features of prion disease, such as myoclonus or ataxia, or\nbiomarker evidence.\nD. The neurocognitive disorder is not attributable to another medical condition and\nis not better explained by another mental disorder.\nCoding note (see coding table on pp. 682\u2013683):\nFor major neurocognitive disorder due to prion disease, with behavioral disturbance,\ncode first A81.9 prion disease, followed by F02.81 major neurocognitive disorder\ndue to prion disease, with behavioral disturbance.\nFor major neurocognitive disorder due to prion disease, without behavioral\ndisturbance, code first A81.9 prion disease, followed by F02.80 major neurocognitive\ndisorder due to prion disease, without behavioral disturbance.\nNote: The severity specifiers \u201Cmild,\u201D \u201Cmoderate,\u201D and \u201Csevere\u201D cannot be coded for\nmajor neurocognitive disorder but should still be recorded.\nFor mild neurocognitive disorder due to prion disease, code G31.84. (Note: Do not\nuse the additional code for prion disease. \u201CWith behavioral disturbance\u201D and \u201Cwithout\nbehavioral disturbance\u201D cannot be coded but should still be recorded.)\nFor major or mild neurocognitive disorder due to prion disease: Use additional\ncode(s) to indicate clinically significant psychiatric symptoms due to prion disease\n(e.g., F06.2 psychotic disorder due to prion disease, with delusions; F06.32\ndepressive disorder due to prion disease with major depressive\u2013like episode)."
    },
    {
      "id": "major-or-mild-neurocognitive-disorder-due-to-parkinsons-disease",
      "name": "Major or Mild Neurocognitive Disorder Due to Parkinson\u2019s Disease",
      "chapter": "Neurocognitive Disorders",
      "sourcePdfPages": [
        968,
        971
      ],
      "criteriaText": "A.  The criteria are met for major or mild neurocognitive disorder.\nB.  The disturbance occurs in the setting of established Parkinson\u2019s disease.\nC.  There is insidious onset and gradual progression of impairment.\nD.  The neurocognitive disorder is not attributable to another medical condition and\nis not better explained by another mental disorder.\nMajor or mild neurocognitive disorder probably due to Parkinson\u2019s disease\nshould be diagnosed if 1 and 2 are both met. Major or mild neurocognitive\ndisorder possibly due to Parkinson\u2019s disease should be diagnosed if 1 or 2 is\nmet:\n1. There is no evidence of mixed etiology (i.e., absence of other neurodegenerative\nor cerebrovascular disease or another neurological, mental, or systemic disease\nor condition likely contributing to cognitive decline).\n2. The Parkinson\u2019s disease clearly precedes the onset of the neurocognitive\ndisorder.\nCoding note (see coding table on pp. 682\u2013683):\nFor major neurocognitive disorder probably or possibly due to Parkinson\u2019s disease,\nwith behavioral disturbance, code first G20 Parkinson\u2019s disease, followed by F02.81.\nFor major neurocognitive disorder probably or possibly due to Parkinson\u2019s disease,\nwithout behavioral disturbance, code first G20 Parkinson\u2019s disease, followed by\nF02.80.\nNote: The severity specifiers \u201Cmild,\u201D \u201Cmoderate,\u201D and \u201Csevere\u201D cannot be coded for\nmajor neurocognitive disorder but should still be recorded.\n\nFor mild neurocognitive disorder due to Parkinson\u2019s disease, code G31.84. (Note:\nDo not use the additional code for Parkinson\u2019s disease. \u201CWith behavioral\ndisturbance\u201D and \u201Cwithout behavioral disturbance\u201D cannot be coded but should still\nbe recorded.)\nFor major or mild neurocognitive disorder due to Parkinson\u2019s disease: Use additional\ncode(s) to indicate clinically significant psychiatric symptoms due to Parkinson\u2019s\ndisease (e.g., F06.0 psychotic disorder due to Parkinson\u2019s disease, with\nhallucinations; F06.31 depressive disorder due to Parkinson\u2019s disease, with\ndepressive features; F07.0 personality change due to traumatic brain injury,\napathetic type)."
    },
    {
      "id": "major-or-mild-neurocognitive-disorder-due-to-huntingtons-disease",
      "name": "Major or Mild Neurocognitive Disorder Due to Huntington\u2019s Disease",
      "chapter": "Neurocognitive Disorders",
      "sourcePdfPages": [
        972,
        974
      ],
      "criteriaText": "A. The criteria are met for major or mild neurocognitive disorder.\nB. There is insidious onset and gradual progression.\nC. There is clinically established Huntington\u2019s disease, or risk for Huntington\u2019s\ndisease based on family history or genetic testing.\nD. The neurocognitive disorder is not attributable to another medical condition and\nis not better explained by another mental disorder.\nCoding note (see coding table on pp. 682\u2013683):\nFor major neurocognitive disorder due to Huntington\u2019s disease, with behavioral\ndisturbance, code first G10 Huntington\u2019s disease, followed by F02.81 major\nneurocognitive disorder due to Huntington\u2019s disease, with behavioral disturbance.\nFor major neurocognitive disorder due to Huntington\u2019s disease, without behavioral\ndisturbance, code first G10 Huntington\u2019s disease, followed by F02.80 major\nneurocognitive disorder due to Huntington\u2019s disease, without behavioral disturbance.\nNote: The severity specifiers \u201Cmild,\u201D \u201Cmoderate,\u201D and \u201Csevere\u201D cannot be coded for\nmajor neurocognitive disorder but should still be recorded.\n\nFor mild neurocognitive disorder due to Huntington\u2019s disease, code G31.84. (Note:\nDo not use the additional code for Huntington\u2019s disease. \u201CWith behavioral\ndisturbance\u201D and \u201Cwithout behavioral disturbance\u201D cannot be coded but should still\nbe recorded.)\nFor major or mild neurocognitive disorder due to Huntington\u2019s disease: Use\nadditional code(s) to indicate clinically significant psychiatric symptoms due to\nHuntington\u2019s disease (e.g., F06.31 depressive disorder due to Huntington\u2019s disease\nwith depressive features; F06.4 anxiety disorder due to Huntington\u2019s disease)."
    },
    {
      "id": "major-or-mild-neurocognitive-disorder-due-to-another-medical-condition",
      "name": "Major or Mild Neurocognitive Disorder Due to Another Medical Condition",
      "chapter": "Neurocognitive Disorders",
      "sourcePdfPages": [
        975,
        976
      ],
      "criteriaText": "A. The criteria are met for major or mild neurocognitive disorder.\nB. There is evidence from the history, physical examination, or laboratory findings\nthat the neurocognitive disorder is the pathophysiological consequence of\nanother medical condition (e.g., multiple sclerosis).\nC. The cognitive deficits are not better explained by another mental disorder (e.g.,\nmajor depressive disorder) or another specific neurocognitive disorder (e.g.,\nmajor neurocognitive disorder due to Alzheimer\u2019s disease).\nCoding note (see coding table on pp. 682\u2013683):\nFor major neurocognitive disorder due to another medical condition, with behavioral\ndisturbance, code first the other medical condition, followed by the major\nneurocognitive disorder due to another medical condition, with behavioral\ndisturbance (e.g., G35 multiple sclerosis, F02.81 major neurocognitive disorder due\nto multiple sclerosis, with behavioral disturbance).\nFor major neurocognitive disorder due to another medical condition, without\nbehavioral disturbance, code first the other medical condition, followed by the major\nneurocognitive disorder due to another medical condition, without behavioral\ndisturbance (e.g., G35 multiple sclerosis, F02.80 major neurocognitive disorder due\nto multiple sclerosis, without behavioral disturbance).\nNote: The severity specifiers \u201Cmild,\u201D \u201Cmoderate,\u201D and \u201Csevere\u201D cannot be coded for\nmajor neurocognitive disorder but should still be recorded.\n\nFor mild neurocognitive disorder due to another medical condition, code G31.84.\n(Note: Do not use the additional code for the other medical condition. \u201CWith\nbehavioral disturbance\u201D and \u201Cwithout behavioral disturbance\u201D cannot be coded but\nshould still be recorded.)\nFor major or mild neurocognitive disorder due to another medical condition: Use\nadditional code(s) to indicate clinically significant psychiatric symptoms due to\nanother medical condition (e.g., F06.32 depressive disorder due to multiple\nsclerosis, with major depressive\u2013like episode)."
    },
    {
      "id": "major-or-mild-neurocognitive-disorder-due-to-multiple-etiologies",
      "name": "Major or Mild Neurocognitive Disorder Due to Multiple Etiologies",
      "chapter": "Neurocognitive Disorders",
      "sourcePdfPages": [
        977,
        984
      ],
      "criteriaText": "A. The criteria are met for major or mild neurocognitive disorder.\nB. There is evidence from the history, physical examination, or laboratory findings\nthat the neurocognitive disorder is the pathophysiological consequence of more\nthan one etiological process, excluding substances (e.g., neurocognitive disorder\ndue to Alzheimer\u2019s disease with subsequent development of vascular\nneurocognitive disorder).\nNote: Refer to the diagnostic criteria for the various neurocognitive disorders\ndue to specific medical conditions for guidance on establishing the particular\netiologies.\nC. The cognitive deficits are not better explained by another mental disorder and do\nnot occur exclusively during the course of a delirium.\nCoding note (see coding table on pp. 682\u2013683):\nFor major neurocognitive disorder due to multiple etiologies, code first all of the\netiological medical conditions (with the exception of vascular disease, which is not\ncoded), followed by either F02.81 for major neurocognitive disorder due to multiple\netiologies, with behavioral disturbance; or F02.80 for major neurocognitive disorder\ndue to multiple etiologies, without behavioral disturbance.\nIf vascular disease is among the multiple etiological medical conditions, code next\neither F01.51 for major vascular neurocognitive disorder, with behavioral\ndisturbance; or F01.50 for major vascular neurocognitive disorder, without behavioral\ndisturbance. Note: The severity specifiers \u201Cmild,\u201D \u201Cmoderate,\u201D and \u201Csevere\u201D cannot be\ncoded for major neurocognitive disorder but should still be recorded.\nFor example, for a presentation of major neurocognitive disorder, moderate, with a\nbehavioral disturbance, that is judged to be due to Alzheimer\u2019s disease, vascular\ndisease, and HIV infection, and in which heavy chronic alcohol use is judged to be a\ncontributing factor, code the following: G30.9 Alzheimer\u2019s disease, B20 HIV\ninfection; F02.81 major neurocognitive disorder due to Alzheimer\u2019s disease and HIV\ninfection, moderate, with behavioral disturbance; F01.51 major vascular\nneurocognitive disorder, moderate, with behavioral disturbance; and F10.27 severe\nalcohol use disorder with alcohol-induced major neurocognitive disorder, moderate,\nnonamnestic-confabulatory type.\nFor mild neurocognitive disorder due to multiple etiologies, code G31.84. (Note: Do\nnot use the additional codes for the etiologies. \u201CWith behavioral disturbance\u201D and\n\u201Cwithout behavioral disturbance\u201D cannot be coded but should still be recorded.)\nFor major or mild neurocognitive disorder due to multiple etiologies: Use additional\ncode(s) to indicate clinically significant psychiatric symptoms due to the various\netiologies (e.g., F06.2 psychotic disorder due to Alzheimer\u2019s disease, with delusions;\nF06.31 depressive disorder due to cerebrovascular disease, with depressive\nfeatures).\n\nThis category is included to cover the clinical presentation of a neurocognitive disorder (NCD)\nfor which there is evidence that multiple medical conditions have played a probable role in the\ndevelopment of the NCD. In addition to evidence indicative of the presence of multiple medical\nconditions that are known to cause NCD (i.e., findings from the history and physical\nexamination, and laboratory findings), it may be helpful to refer to the diagnostic criteria and text\nfor the various medical etiologies (e.g., NCD due to Parkinson\u2019s disease) for more information\non establishing the etiological connection for that particular medical condition.\n\nUnspecified Neurocognitive Disorder\nR41.9\n\nThis category applies to presentations in which symptoms characteristic of a\nneurocognitive disorder that cause clinically significant distress or impairment in\nsocial, occupational, or other important areas of functioning predominate but do not\nmeet the full criteria for any of the disorders in the neurocognitive disorders\ndiagnostic class. The unspecified neurocognitive disorder category is used in\nsituations in which the precise etiology cannot be determined with sufficient certainty\nto make an etiological attribution.\nCoding note: For unspecified major or mild neurocognitive disorder, code R41.9.\n(Note: Do not use additional codes for any presumed etiological medical conditions.\n\u201CWith behavioral disturbance\u201D and \u201Cwithout behavioral disturbance\u201D cannot be coded\nbut should still be recorded.)\n\nPersonality Disorders\n\nThis chapter begins with a general definition of personality disorder that applies to each of\nthe 10 specific personality disorders. A personality disorder is an enduring pattern of inner\nexperience and behavior that deviates markedly from the norms and expectations of the\nindividual\u2019s culture, is pervasive and inflexible, has an onset in adolescence or early adulthood,\nis stable over time, and leads to distress or impairment.\nWith any ongoing review process, especially one of this complexity, different viewpoints\nemerge, and an effort was made to accommodate them. Thus, personality disorders are included\nin both Sections II and III. The material in Section II represents an update of text associated with\nthe same criteria found in DSM-5 (which were carried over from DSM-IV-TR), whereas Section\nIII includes the proposed model for personality disorder diagnosis and conceptualization\ndeveloped by the DSM-5 Personality and Personality Disorders Work Group. As this field\nevolves, it is hoped that both versions will serve clinical practice and research initiatives,\nrespectively.\nThe following personality disorders are included in this chapter.\n\nParanoid personality disorder is a pattern of distrust and suspiciousness such that others\u2019 motives are interpreted as\nmalevolent.\nSchizoid personality disorder is a pattern of detachment from social relationships and a restricted range of emotional\nexpression.\nSchizotypal personality disorder is a pattern of acute discomfort in close relationships, cognitive or perceptual distortions,\nand eccentricities of behavior.\nAntisocial personality disorder is a pattern of disregard for, and violation of, the rights of others, criminality, impulsivity,\nand a failure to learn from experience.\nBorderline personality disorder is a pattern of instability in interpersonal relationships, self-image, and affects, and\nmarked impulsivity.\nHistrionic personality disorder is a pattern of excessive emotionality and attention seeking.\nNarcissistic personality disorder is a pattern of grandiosity, need for admiration, and lack of empathy.\nAvoidant personality disorder is a pattern of social inhibition, feelings of inadequacy, and hypersensitivity to negative\nevaluation.\nDependent personality disorder is a pattern of submissive and clinging behavior related to an excessive need to be taken\ncare of.\nObsessive-compulsive personality disorder is a pattern of preoccupation with orderliness, perfectionism, and control.\nPersonality change due to another medical condition is a persistent personality disturbance that is judged to be the direct\npathophysiological consequence of another medical condition (e.g., frontal lobe lesion).\nOther specified personality disorder is a category provided for two situations: 1) the individual\u2019s personality pattern meets\n\nthe general criteria for a personality disorder, and traits of several different personality disorders are present, but the criteria\nfor any specific personality disorder are not met; or 2) the individual\u2019s personality pattern meets the general criteria for a\npersonality disorder, but the individual is considered to have a personality disorder that is not included in the DSM-5\nclassification (e.g., passive-aggressive personality disorder). Unspecified personality disorder is for presentations in which\nsymptoms characteristic of a personality disorder are present but there is insufficient information to make a more specific\ndiagnosis.\n\nThe personality disorders are grouped into three clusters based on descriptive similarities.\nCluster A includes paranoid, schizoid, and schizotypal personality disorders. Individuals with\nthese disorders often appear odd or eccentric. Cluster B includes antisocial, borderline, histrionic,\nand narcissistic personality disorders. Individuals with these disorders often appear dramatic,\nemotional, or erratic. Cluster C includes avoidant, dependent, and obsessive-compulsive\npersonality disorders. Individuals with these disorders often appear anxious or fearful. It should\nbe noted that this clustering system, although useful in some research and educational situations,\nhas serious limitations and has not been consistently validated. For instance, two or more\ndisorders from different clusters, or traits from several of them, can often co-occur and vary in\nintensity and pervasiveness.\nA review of epidemiological studies from several countries found a median prevalence of\n3.6% for disorders in Cluster A, 4.5% for Cluster B, 2.8% for Cluster C, and 10.5% for any\npersonality disorder. Prevalence appears to vary across countries and by ethnicity, raising\nquestions about true cross-cultural variation and about the impact of diverse definitions and\ndiagnostic instruments on prevalence assessments.\n\nDimensional Models for Personality Disorders\nThe diagnostic approach used in this manual represents the categorical perspective that\npersonality disorders are qualitatively distinct clinical syndromes. An alternative to the\ncategorical approach is the dimensional perspective that personality disorders represent\nmaladaptive variants of personality traits that merge imperceptibly into normality and into one\nanother. See Section III for a full description of a dimensional model for personality disorders.\nThe DSM-5 personality disorder clusters (i.e., odd-eccentric, dramatic-emotional, and anxious-\nfearful) may also be viewed as dimensions representing spectra of personality dysfunction on a\ncontinuum with other mental disorders. The alternative dimensional models have much in\ncommon and together appear to cover the important areas of personality dysfunction. Their\nintegration, clinical utility, and relationship with the personality disorder diagnostic categories\nand various aspects of personality dysfunction continue to be under active investigation. This\nincludes research on whether the dimensional model can clarify the cross-cultural prevalence\nvariations seen with the categorical model.\n\nGeneral Personality Disorder\nCriteria\n\nA. An enduring pattern of inner experience and behavior that deviates markedly\nfrom the expectations of the individual\u2019s culture. This pattern is manifested in two\n(or more) of the following areas:\n1. Cognition (i.e., ways of perceiving and interpreting self, other people, and\nevents).\n2. Affectivity (i.e., the range, intensity, lability, and appropriateness of emotional\nresponse).\n3. Interpersonal functioning.\n4. Impulse control.\n\nB. The enduring pattern is inflexible and pervasive across a broad range of\npersonal and social situations.\nC. The enduring pattern leads to clinically significant distress or impairment in\nsocial, occupational, or other important areas of functioning.\nD. The pattern is stable and of long duration, and its onset can be traced back at\nleast to adolescence or early adulthood.\nE. The enduring pattern is not better explained as a manifestation or consequence\nof another mental disorder.\nF. The enduring pattern is not attributable to the physiological effects of a\nsubstance (e.g., a drug of abuse, a medication) or another medical condition\n(e.g., head trauma)."
    },
    {
      "id": "paranoid-personality-disorder",
      "name": "Paranoid Personality Disorder",
      "chapter": "Personality Disorders",
      "icd10Code": "F60.0",
      "sourcePdfPages": [
        985,
        989
      ],
      "criteriaText": "A. A pervasive distrust and suspiciousness of others such that their motives are\ninterpreted as malevolent, beginning by early adulthood and present in a variety\nof contexts, as indicated by four (or more) of the following:\n\n1. Suspects, without sufficient basis, that others are exploiting, harming, or\ndeceiving him or her.\n2. Is preoccupied with unjustified doubts about the loyalty or trustworthiness of\nfriends or associates.\n3. Is reluctant to confide in others because of unwarranted fear that the\ninformation will be used maliciously against him or her.\n4. Reads hidden demeaning or threatening meanings into benign remarks or\nevents.\n5. Persistently bears grudges (i.e., is unforgiving of insults, injuries, or slights).\n6. Perceives attacks on his or her character or reputation that are not apparent\nto others and is quick to react angrily or to counterattack.\n7. Has recurrent suspicions, without justification, regarding fidelity of spouse or\nsexual partner.\nB. Does not occur exclusively during the course of schizophrenia, a bipolar disorder\nor depressive disorder with psychotic features, or another psychotic disorder and\nis not attributable to the physiological effects of another medical condition.\nNote: If criteria are met prior to the onset of schizophrenia, add \u201Cpremorbid,\u201D i.e.,\n\u201Cparanoid personality disorder (premorbid).\u201D"
    },
    {
      "id": "schizoid-personality-disorder",
      "name": "Schizoid Personality Disorder",
      "chapter": "Personality Disorders",
      "icd10Code": "F60.1",
      "sourcePdfPages": [
        990,
        992
      ],
      "criteriaText": "A. A pervasive pattern of detachment from social relationships and a restricted\nrange of expression of emotions in interpersonal settings, beginning by early\nadulthood and present in a variety of contexts, as indicated by four (or more) of\nthe following:\n1. Neither desires nor enjoys close relationships, including being part of a\nfamily.\n2. Almost always chooses solitary activities.\n3. Has little, if any, interest in having sexual experiences with another person.\n4. Takes pleasure in few, if any, activities.\n5. Lacks close friends or confidants other than first-degree relatives.\n\n6. Appears indifferent to the praise or criticism of others.\n7. Shows emotional coldness, detachment, or flattened affectivity.\nB. Does not occur exclusively during the course of schizophrenia, a bipolar disorder\nor depressive disorder with psychotic features, another psychotic disorder, or\nautism spectrum disorder and is not attributable to the physiological effects of\nanother medical condition.\nNote: If criteria are met prior to the onset of schizophrenia, add \u201Cpremorbid,\u201D i.e.,\n\u201Cschizoid personality disorder (premorbid).\u201D"
    },
    {
      "id": "schizotypal-personality-disorder",
      "name": "Schizotypal Personality Disorder",
      "chapter": "Personality Disorders",
      "icd10Code": "F21",
      "sourcePdfPages": [
        993,
        997
      ],
      "criteriaText": "A. A pervasive pattern of social and interpersonal deficits marked by acute\ndiscomfort with, and reduced capacity for, close relationships as well as by\ncognitive or perceptual distortions and eccentricities of behavior, beginning by\nearly adulthood and present in a variety of contexts, as indicated by five (or\nmore) of the following:\n1. Ideas of reference (excluding delusions of reference).\n2. Odd beliefs or magical thinking that influences behavior and is inconsistent\nwith subcultural norms (e.g., superstitiousness, belief in clairvoyance,\ntelepathy, or \u201Csixth sense\u201D; in children and adolescents, bizarre fantasies or\npreoccupations).\n3. Unusual perceptual experiences, including bodily illusions.\n4. Odd thinking and speech (e.g., vague, circumstantial, metaphorical,\noverelaborate, or stereotyped).\n5. Suspiciousness or paranoid ideation.\n6. Inappropriate or constricted affect.\n\n7. Behavior or appearance that is odd, eccentric, or peculiar.\n8. Lack of close friends or confidants other than first-degree relatives.\n9. Excessive social anxiety that does not diminish with familiarity and tends to\nbe associated with paranoid fears rather than negative judgments about self.\nB. Does not occur exclusively during the course of schizophrenia, a bipolar disorder\nor depressive disorder with psychotic features, another psychotic disorder, or\nautism spectrum disorder.\nNote: If criteria are met prior to the onset of schizophrenia, add \u201Cpremorbid,\u201D e.g.,\n\u201Cschizotypal personality disorder (premorbid).\u201D"
    },
    {
      "id": "antisocial-personality-disorder",
      "name": "Antisocial Personality Disorder",
      "chapter": "Personality Disorders",
      "icd10Code": "F60.2",
      "sourcePdfPages": [
        998,
        1002
      ],
      "criteriaText": "A. A pervasive pattern of disregard for and violation of the rights of others,\noccurring since age 15 years, as indicated by three (or more) of the following:\n1. Failure to conform to social norms with respect to lawful behaviors, as\nindicated by repeatedly performing acts that are grounds for arrest.\n2. Deceitfulness, as indicated by repeated lying, use of aliases, or conning\nothers for personal profit or pleasure.\n3. Impulsivity or failure to plan ahead.\n4. Irritability and aggressiveness, as indicated by repeated physical fights or\nassaults.\n5. Reckless disregard for safety of self or others.\n6. Consistent irresponsibility, as indicated by repeated failure to sustain\nconsistent work behavior or honor financial obligations.\n7. Lack of remorse, as indicated by being indifferent to or rationalizing having\nhurt, mistreated, or stolen from another.\nB. The individual is at least age 18 years.\nC. There is evidence of conduct disorder with onset before age 15 years.\nD. The occurrence of antisocial behavior is not exclusively during the course of\nschizophrenia or bipolar disorder."
    },
    {
      "id": "borderline-personality-disorder",
      "name": "Borderline Personality Disorder",
      "chapter": "Personality Disorders",
      "icd10Code": "F60.3",
      "sourcePdfPages": [
        1003,
        1008
      ],
      "criteriaText": "A pervasive pattern of instability of interpersonal relationships, self-image, and\naffects, and marked impulsivity, beginning by early adulthood and present in a\nvariety of contexts, as indicated by five (or more) of the following:\n1. Frantic efforts to avoid real or imagined abandonment. (Note: Do not include\nsuicidal or self-mutilating behavior covered in Criterion 5.)\n2. A pattern of unstable and intense interpersonal relationships characterized by\nalternating between extremes of idealization and devaluation.\n3. Identity disturbance: markedly and persistently unstable self-image or sense of\nself.\n4. Impulsivity in at least two areas that are potentially self-damaging (e.g.,\nspending, sex, substance abuse, reckless driving, binge eating). (Note: Do not\ninclude suicidal or self-mutilating behavior covered in Criterion 5.)\n5. Recurrent suicidal behavior, gestures, or threats, or self-mutilating behavior.\n\n6. Affective instability due to a marked reactivity of mood (e.g., intense episodic\ndysphoria, irritability, or anxiety usually lasting a few hours and only rarely more\nthan a few days).\n7. Chronic feelings of emptiness.\n8. Inappropriate, intense anger or difficulty controlling anger (e.g., frequent displays\nof temper, constant anger, recurrent physical fights).\n9. Transient, stress-related paranoid ideation or severe dissociative symptoms."
    },
    {
      "id": "histrionic-personality-disorder",
      "name": "Histrionic Personality Disorder",
      "chapter": "Personality Disorders",
      "icd10Code": "F60.4",
      "sourcePdfPages": [
        1009,
        1012
      ],
      "criteriaText": "A pervasive pattern of excessive emotionality and attention seeking, beginning by\nearly adulthood and present in a variety of contexts, as indicated by five (or more) of\nthe following:\n1. Is uncomfortable in situations in which he or she is not the center of attention.\n2. Interaction with others is often characterized by inappropriate sexually seductive\nor provocative behavior.\n3. Displays rapidly shifting and shallow expression of emotions.\n4. Consistently uses physical appearance to draw attention to self.\n5. Has a style of speech that is excessively impressionistic and lacking in detail.\n6. Shows self-dramatization, theatricality, and exaggerated expression of emotion.\n7. Is suggestible (i.e., easily influenced by others or circumstances).\n8. Considers relationships to be more intimate than they actually are."
    },
    {
      "id": "narcissistic-personality-disorder",
      "name": "Narcissistic Personality Disorder",
      "chapter": "Personality Disorders",
      "icd10Code": "F60.81",
      "sourcePdfPages": [
        1013,
        1016
      ],
      "criteriaText": "A pervasive pattern of grandiosity (in fantasy or behavior), need for admiration, and\nlack of empathy, beginning by early adulthood and present in a variety of contexts,\nas indicated by five (or more) of the following:\n1. Has a grandiose sense of self-importance (e.g., exaggerates achievements and\ntalents, expects to be recognized as superior without commensurate\nachievements).\n2. Is preoccupied with fantasies of unlimited success, power, brilliance, beauty, or\nideal love.\n3. Believes that he or she is \u201Cspecial\u201D and unique and can only be understood by, or\nshould associate with, other special or high-status people (or institutions).\n4. Requires excessive admiration.\n5. Has a sense of entitlement (i.e., unreasonable expectations of especially\nfavorable treatment or automatic compliance with his or her expectations).\n6. Is interpersonally exploitative (i.e., takes advantage of others to achieve his or\nher own ends).\n7. Lacks empathy: is unwilling to recognize or identify with the feelings and needs\nof others.\n8. Is often envious of others or believes that others are envious of him or her.\n9. Shows arrogant, haughty behaviors or attitudes."
    },
    {
      "id": "avoidant-personality-disorder",
      "name": "Avoidant Personality Disorder",
      "chapter": "Personality Disorders",
      "icd10Code": "F60.6",
      "sourcePdfPages": [
        1017,
        1020
      ],
      "criteriaText": "A pervasive pattern of social inhibition, feelings of inadequacy, and hypersensitivity\nto negative evaluation, beginning by early adulthood and present in a variety of\ncontexts, as indicated by four (or more) of the following:\n1. Avoids occupational activities that involve significant interpersonal contact\nbecause of fears of criticism, disapproval, or rejection.\n2. Is unwilling to get involved with people unless certain of being liked.\n\n3. Shows restraint within intimate relationships because of the fear of being shamed\nor ridiculed.\n4. Is preoccupied with being criticized or rejected in social situations.\n5. Is inhibited in new interpersonal situations because of feelings of inadequacy.\n6. Views self as socially inept, personally unappealing, or inferior to others.\n7. Is unusually reluctant to take personal risks or to engage in any new activities\nbecause they may prove embarrassing."
    },
    {
      "id": "obsessive-compulsive-personality-disorder",
      "name": "Obsessive-Compulsive Personality Disorder",
      "chapter": "Personality Disorders",
      "icd10Code": "F60.5",
      "sourcePdfPages": [
        1026,
        1029
      ],
      "criteriaText": "A pervasive pattern of preoccupation with orderliness, perfectionism, and mental and\ninterpersonal control, at the expense of flexibility, openness, and efficiency,\nbeginning by early adulthood and present in a variety of contexts, as indicated by\nfour (or more) of the following:\n1. Is preoccupied with details, rules, lists, order, organization, or schedules to the\nextent that the major point of the activity is lost.\n2. Shows perfectionism that interferes with task completion (e.g., is unable to\ncomplete a project because his or her own overly strict standards are not met).\n3. Is excessively devoted to work and productivity to the exclusion of leisure\nactivities and friendships (not accounted for by obvious economic necessity).\n4. Is overconscientious, scrupulous, and inflexible about matters of morality, ethics,\nor values (not accounted for by cultural or religious identification).\n\n5. Is unable to discard worn-out or worthless objects even when they have no\nsentimental value.\n6. Is reluctant to delegate tasks or to work with others unless they submit to exactly\nhis or her way of doing things.\n7. Adopts a miserly spending style toward both self and others; money is viewed as\nsomething to be hoarded for future catastrophes.\n8. Shows rigidity and stubbornness."
    },
    {
      "id": "personality-change-due-to-another-medical-condition",
      "name": "Personality Change Due to Another Medical Condition",
      "chapter": "Personality Disorders",
      "icd10Code": "F07.0",
      "sourcePdfPages": [
        1030,
        1036
      ],
      "criteriaText": "A. A persistent personality disturbance that represents a change from the\nindividual\u2019s previous characteristic personality pattern.\nNote: In children, the disturbance involves a marked deviation from normal\ndevelopment or a significant change in the child\u2019s usual behavior patterns, lasting\nat least 1 year.\n\nB. There is evidence from the history, physical examination, or laboratory findings\nthat the disturbance is the direct pathophysiological consequence of another\nmedical condition.\nC. The disturbance is not better explained by another mental disorder (including\nanother mental disorder due to another medical condition).\nD. The disturbance does not occur exclusively during the course of a delirium.\nE. The disturbance causes clinically significant distress or impairment in social,\noccupational, or other important areas of functioning.\nSpecify whether:\nLabile type: If the predominant feature is affective lability.\nDisinhibited type: If the predominant feature is poor impulse control as\nevidenced by sexual indiscretions, etc.\nAggressive type: If the predominant feature is aggressive behavior.\nApathetic type: If the predominant feature is marked apathy and indifference.\nParanoid type: If the predominant feature is suspiciousness or paranoid\nideation.\nOther type: If the presentation is not characterized by any of the above"
    },
    {
      "id": "voyeuristic-disorder",
      "name": "Voyeuristic Disorder",
      "chapter": "Paraphilic Disorders",
      "icd10Code": "F65.3",
      "sourcePdfPages": [
        1037,
        1039
      ],
      "criteriaText": "A. Over a period of at least 6 months, recurrent and intense sexual arousal from\nobserving an unsuspecting person who is naked, in the process of disrobing, or\nengaging in sexual activity, as manifested by fantasies, urges, or behaviors.\nB. The individual has acted on these sexual urges with a nonconsenting person, or\nthe sexual urges or fantasies cause clinically significant distress or impairment in\nsocial, occupational, or other important areas of functioning.\nC. The individual experiencing the arousal and/or acting on the urges is at least 18\nyears of age.\nSpecify if:\nIn a controlled environment: This specifier is primarily applicable to individuals\nliving in institutional or other settings where opportunities to engage in\nvoyeuristic behavior are restricted.\nIn full remission: The individual has not acted on the urges with a\nnonconsenting person, and there has been no distress or impairment in social,\noccupational, or other areas of functioning, for at least 5 years while in an\nuncontrolled environment."
    },
    {
      "id": "exhibitionistic-disorder",
      "name": "Exhibitionistic Disorder",
      "chapter": "Paraphilic Disorders",
      "icd10Code": "F65.2",
      "sourcePdfPages": [
        1040,
        1043
      ],
      "criteriaText": "A. Over a period of at least 6 months, recurrent and intense sexual arousal from the\nexposure of one\u2019s genitals to an unsuspecting person, as manifested by\nfantasies, urges, or behaviors.\nB. The individual has acted on these sexual urges with a nonconsenting person, or\nthe sexual urges or fantasies cause clinically significant distress or impairment in\nsocial, occupational, or other important areas of functioning.\nSpecify whether:\nSexually aroused by exposing genitals to prepubertal children\nSexually aroused by exposing genitals to physically mature individuals\nSexually aroused by exposing genitals to prepubertal children and to\nphysically mature individuals\nSpecify if:\nIn a controlled environment: This specifier is primarily applicable to individuals\nliving in institutional or other settings where opportunities to expose one\u2019s\ngenitals are restricted.\nIn full remission: The individual has not acted on the urges with a\nnonconsenting person, and there has been no distress or impairment in social,\noccupational, or other areas of functioning, for at least 5 years while in an\nuncontrolled environment."
    },
    {
      "id": "frotteuristic-disorder",
      "name": "Frotteuristic Disorder",
      "chapter": "Paraphilic Disorders",
      "icd10Code": "F65.81",
      "sourcePdfPages": [
        1044,
        1046
      ],
      "criteriaText": "A. Over a period of at least 6 months, recurrent and intense sexual arousal from\ntouching or rubbing against a nonconsenting person, as manifested by fantasies,\nurges, or behaviors.\nB. The individual has acted on these sexual urges with a nonconsenting person, or\nthe sexual urges or fantasies cause clinically significant distress or impairment in\nsocial, occupational, or other important areas of functioning.\n\nSpecify if:\nIn a controlled environment: This specifier is primarily applicable to individuals\nliving in institutional or other settings where opportunities to touch or rub against\na nonconsenting person are restricted.\nIn full remission: The individual has not acted on the urges with a\nnonconsenting person, and there has been no distress or impairment in social,\noccupational, or other areas of functioning, for at least 5 years while in an\nuncontrolled environment."
    },
    {
      "id": "sexual-masochism-disorder",
      "name": "Sexual Masochism Disorder",
      "chapter": "Paraphilic Disorders",
      "icd10Code": "F65.51",
      "sourcePdfPages": [
        1047,
        1048
      ],
      "criteriaText": "A. Over a period of at least 6 months, recurrent and intense sexual arousal from the\nact of being humiliated, beaten, bound, or otherwise made to suffer, as\nmanifested by fantasies, urges, or behaviors.\nB. The fantasies, sexual urges, or behaviors cause clinically significant distress or\nimpairment in social, occupational, or other important areas of functioning.\nSpecify if:\nWith asphyxiophilia: If the individual engages in the practice of achieving\nsexual arousal related to restriction of breathing.\nSpecify if:\nIn a controlled environment: This specifier is primarily applicable to individuals\nliving in institutional or other settings where opportunities to engage in\nmasochistic sexual behaviors are restricted.\nIn full remission: There has been no distress or impairment in social,\noccupational, or other areas of functioning for at least 5 years while in an\nuncontrolled environment."
    },
    {
      "id": "sexual-sadism-disorder",
      "name": "Sexual Sadism Disorder",
      "chapter": "Paraphilic Disorders",
      "icd10Code": "F65.52",
      "sourcePdfPages": [
        1049,
        1051
      ],
      "criteriaText": "A. Over a period of at least 6 months, recurrent and intense sexual arousal from the\nphysical or psychological suffering of another person, as manifested by\nfantasies, urges, or behaviors.\nB. The individual has acted on these sexual urges with a nonconsenting person, or\nthe sexual urges or fantasies cause clinically significant distress or impairment in\nsocial, occupational, or other important areas of functioning.\nSpecify if:\nIn a controlled environment: This specifier is primarily applicable to individuals\nliving in institutional or other settings where opportunities to engage in sadistic\nsexual behaviors are restricted.\nIn full remission: The individual has not acted on the urges with a\nnonconsenting person, and there has been no distress or impairment in social,\noccupational, or other areas of functioning, for at least 5 years while in an\nuncontrolled environment."
    },
    {
      "id": "pedophilic-disorder",
      "name": "Pedophilic Disorder",
      "chapter": "Paraphilic Disorders",
      "icd10Code": "F65.4",
      "sourcePdfPages": [
        1052,
        1056
      ],
      "criteriaText": "A. Over a period of at least 6 months, recurrent, intense sexually arousing\nfantasies, sexual urges, or behaviors involving sexual activity with a\nprepubescent child or children (generally age 13 years or younger).\nB. The individual has acted on these sexual urges, or the sexual urges or fantasies\ncause marked distress or interpersonal difficulty.\n\nC. The individual is at least age 16 years and at least 5 years older than the child or\nchildren in Criterion A.\nNote: Do not include an individual in late adolescence involved in an ongoing\nsexual relationship with a 12- or 13-year-old.\nSpecify whether:\nExclusive type (attracted only to children)\nNonexclusive type\nSpecify if:\nSexually attracted to males\nSexually attracted to females\nSexually attracted to both\nSpecify if:\nLimited to incest"
    },
    {
      "id": "fetishistic-disorder",
      "name": "Fetishistic Disorder",
      "chapter": "Paraphilic Disorders",
      "icd10Code": "F65.0",
      "sourcePdfPages": [
        1057,
        1058
      ],
      "criteriaText": "A. Over a period of at least 6 months, recurrent and intense sexual arousal from\neither the use of nonliving objects or a highly specific focus on nongenital body\npart(s), as manifested by fantasies, urges, or behaviors.\nB. The fantasies, sexual urges, or behaviors cause clinically significant distress or\nimpairment in social, occupational, or other important areas of functioning.\nC. The fetish objects are not limited to articles of clothing used in cross-dressing (as\nin transvestic disorder) or devices specifically designed for the purpose of tactile\ngenital stimulation (e.g., vibrator).\nSpecify:\nBody part(s)\nNonliving object(s)\nOther\nSpecify if:\nIn a controlled environment: This specifier is primarily applicable to individuals\nliving in institutional or other settings where opportunities to engage in fetishistic\nbehaviors are restricted.\nIn full remission: There has been no distress or impairment in social,\noccupational, or other areas of functioning for at least 5 years while in an\nuncontrolled environment."
    },
    {
      "id": "transvestic-disorder",
      "name": "Transvestic Disorder",
      "chapter": "Paraphilic Disorders",
      "icd10Code": "F65.1",
      "sourcePdfPages": [
        1059,
        1104
      ],
      "criteriaText": "A. Over a period of at least 6 months, recurrent and intense sexual arousal from\ncross-dressing, as manifested by fantasies, urges, or behaviors.\nB. The fantasies, sexual urges, or behaviors cause clinically significant distress or\nimpairment in social, occupational, or other important areas of functioning.\nSpecify if:\nWith fetishism: If sexually aroused by fabrics, materials, or garments.\nWith autogynephilia: If sexually aroused by thoughts or images of self as a\nwoman.\nSpecify if:\nIn a controlled environment: This specifier is primarily applicable to individuals\nliving in institutional or other settings where opportunities to cross-dress are\nrestricted.\nIn full remission: There has been no distress or impairment in social,\noccupational, or other areas of functioning for at least 5 years while in an\nuncontrolled environment."
    }
  ];
  var DSM5_DIAGNOSES_V2_MAP = Object.fromEntries(
    DSM5_DIAGNOSES_V2.map((diagnosis) => [diagnosis.id, diagnosis])
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
    overviewClinicalNote: "Overview clinical note",
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
      intake.overviewClinicalNote,
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
      ...intake.rawQA.map((pair) => pair.answer).filter(Boolean),
      ...intake.phq9?.items.map((item) => `${item.question} ${item.response}`) ?? [],
      ...intake.gad7?.items.map((item) => `${item.question} ${item.response}`) ?? [],
      ...intake.dass21?.items.map((item) => `${item.question} ${item.response}`) ?? []
    ].filter(Boolean).join("\n");
  }
  function clipEvidence(value, max = 140) {
    const trimmed = value.replace(/\s+/g, " ").trim();
    return trimmed.length > max ? `${trimmed.slice(0, max - 1)}\u2026` : trimmed;
  }
  function splitEvidenceFragments(value) {
    return value.replace(/\r/g, "\n").split(/(?:\n+|(?<=[.!?])\s+|[;•]+(?:\s+|$))/).map((fragment) => fragment.replace(/\s+/g, " ").trim()).filter(Boolean);
  }
  function extractBestEvidenceSentence(value, keywords) {
    const fragments = splitEvidenceFragments(value);
    if (!fragments.length) return clipEvidence(value, 180);
    const match = fragments.find((fragment) => {
      const normalized = normalizeText(fragment);
      return keywords.some((keyword) => matchesKeyword(normalized, keyword));
    });
    return clipEvidence(match ?? fragments[0], 180);
  }
  function joinList(items) {
    if (items.length === 0) return "";
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
  }
  function lowerCaseFirst(value) {
    if (!value) return value;
    return value.charAt(0).toLowerCase() + value.slice(1);
  }
  function getFieldValues(intake, field) {
    switch (field) {
      case "rawQA":
        return intake.rawQA.map((pair) => pair.answer).filter((answer) => answer.trim().length > 0);
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
            evidence: [
              clipEvidence(
                `PHQ-9 item ${item.number} endorsed "${item.question.replace(/[.]+$/, "")}" as ${item.response.replace(/[.]+$/, "")}.`,
                180
              )
            ],
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
            evidence: [
              clipEvidence(
                `GAD-7 item ${item.number} endorsed "${item.question.replace(/[.]+$/, "")}" as ${item.response.replace(/[.]+$/, "")}.`,
                180
              )
            ],
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
          evidence.push(extractBestEvidenceSentence(value, matchingKeywords));
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
        return { ...evaluation, status: "likely", evidence: [`PHQ-9 functional difficulty was rated "${intake.phq9.difficulty.replace(/[.]+$/, "")}".`], sources: ["PHQ-9 impairment"], rationale: "Symptoms are present, but the recorded functional difficulty is limited." };
      }
      return { ...evaluation, status: "met", evidence: [`PHQ-9 functional difficulty was rated "${intake.phq9.difficulty.replace(/[.]+$/, "")}".`], sources: ["PHQ-9 impairment"], rationale: "The PHQ-9 functional difficulty item suggests clinically meaningful impairment." };
    }
    if (criterion2.id === "gad.D" && intake.gad7?.difficulty) {
      if (/not difficult at all/i.test(intake.gad7.difficulty)) {
        return { ...evaluation, status: "likely", evidence: [`GAD-7 functional difficulty was rated "${intake.gad7.difficulty.replace(/[.]+$/, "")}".`], sources: ["GAD-7 impairment"], rationale: "Anxiety symptoms are present, but the recorded functional difficulty is limited." };
      }
      return { ...evaluation, status: "met", evidence: [`GAD-7 functional difficulty was rated "${intake.gad7.difficulty.replace(/[.]+$/, "")}".`], sources: ["GAD-7 impairment"], rationale: "The GAD-7 functional difficulty item suggests clinically meaningful impairment." };
    }
    if (criterion2.id === "mdd.E" || criterion2.id === "pdd.E") {
      const maniaEvidence = buildCombinedNarrative(intake);
      if (MANIA_PATTERN.test(maniaEvidence)) {
        return {
          ...evaluation,
          status: "not_met",
          evidence: ["The intake narrative includes possible manic or hypomanic language."],
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
      const traumaFields = [
        intake.physicalSexualAbuseHistory,
        intake.domesticViolenceHistory
      ].filter((value) => value.trim() && !NEGATIVE_PATTERN.test(value));
      const traumaText = traumaFields.length > 0 ? traumaFields.join("\n") : buildCombinedNarrative(intake);
      if (traumaFields.length > 0 && TRAUMA_PATTERN.test(traumaText)) {
        return {
          ...evaluation,
          status: "met",
          evidence: evaluation.evidence.length ? evaluation.evidence : [`${traumaFields[0].slice(0, 140).trim()}`],
          sources: evaluation.sources.length ? evaluation.sources : ["Trauma history"],
          rationale: "The intake packet documents trauma exposure relevant to this criterion."
        };
      }
      if (TRAUMA_PATTERN.test(buildCombinedNarrative(intake))) {
        return {
          ...evaluation,
          status: "likely",
          evidence: evaluation.evidence.length ? evaluation.evidence : ["Possible trauma-related language appears in the intake narrative."],
          sources: evaluation.sources.length ? evaluation.sources : ["Combined intake narrative"],
          rationale: "The broader intake narrative contains trauma-related language, but the specific trauma history fields are empty or denied. Clinician confirmation needed."
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
          evidence: [extractBestEvidenceSentence(substanceText, ["daily", "weekly", "weekends", "regular", "often", "frequent", "binge", "heavy", "abuse", "misuse", "depend", "dependent", "withdrawal", "craving"])],
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
    return Array.from(
      new Set(
        criteria.filter((criterion2) => isPositive(getEffectiveCriterionStatus(workspace, disorderId, criterion2))).flatMap((criterion2) => criterion2.evidence.length ? [criterion2.evidence[0]] : [])
      )
    ).slice(0, 6);
  }
  function getCriterionDefinition(disorderId, criterionId) {
    return DSM5_DISORDER_MAP[disorderId]?.criteria.find((criterion2) => criterion2.id === criterionId);
  }
  function summarizePositiveCriterionTexts(disorderId, criteria, workspace, prefix, limit = 5) {
    return criteria.filter((criterion2) => isPositive(getEffectiveCriterionStatus(workspace, disorderId, criterion2))).filter((criterion2) => criterion2.criterionId.startsWith(prefix)).map((criterion2) => getCriterionDefinition(disorderId, criterion2.criterionId)?.text ?? "").map((text) => lowerCaseFirst(text.replace(/[.]+$/, ""))).filter(Boolean).slice(0, limit);
  }
  function buildDiagnosticReasoning(intake, suggestion, workspace) {
    const criteria = suggestion.criteria;
    switch (suggestion.disorderId) {
      case "mdd": {
        const symptoms = summarizePositiveCriterionTexts("mdd", criteria, workspace, "mdd.A.");
        const impairment = criteria.find((criterion2) => criterion2.criterionId === "mdd.B");
        const substanceMedical = criteria.find((criterion2) => criterion2.criterionId === "mdd.C");
        const bipolarExclusion = criteria.find((criterion2) => criterion2.criterionId === "mdd.E");
        const parts = [
          `MDD is the leading working diagnosis because the intake supports ${joinList(symptoms.length ? symptoms : ["multiple depressive symptoms"])}${intake.phq9 ? ` and PHQ-9 ${intake.phq9.totalScore}/27` : ""}.`
        ];
        if (impairment && isPositive(getEffectiveCriterionStatus(workspace, "mdd", impairment))) {
          parts.push("The presentation also includes clinically meaningful distress or functional impairment.");
        }
        if (substanceMedical && getEffectiveCriterionStatus(workspace, "mdd", substanceMedical) === "unclear" || bipolarExclusion && getEffectiveCriterionStatus(workspace, "mdd", bipolarExclusion) === "unclear") {
          parts.push("Substance, medical, and bipolar-spectrum exclusions still need direct follow-up before the diagnosis is treated as fully confirmed.");
        }
        return parts.join(" ");
      }
      case "ptsd": {
        const trauma = criteria.find((criterion2) => criterion2.criterionId === "ptsd.A");
        const intrusion = countStatuses(criteria.map((criterion2) => ({
          ...criterion2,
          status: getEffectiveCriterionStatus(workspace, "ptsd", criterion2)
        })), "ptsd.B.");
        const avoidance = countStatuses(criteria.map((criterion2) => ({
          ...criterion2,
          status: getEffectiveCriterionStatus(workspace, "ptsd", criterion2)
        })), "ptsd.C.");
        const mood = countStatuses(criteria.map((criterion2) => ({
          ...criterion2,
          status: getEffectiveCriterionStatus(workspace, "ptsd", criterion2)
        })), "ptsd.D.");
        const arousal = countStatuses(criteria.map((criterion2) => ({
          ...criterion2,
          status: getEffectiveCriterionStatus(workspace, "ptsd", criterion2)
        })), "ptsd.E.");
        const fullySupported = trauma && isPositive(getEffectiveCriterionStatus(workspace, "ptsd", trauma)) && intrusion.positive >= 1 && avoidance.positive >= 1 && mood.positive >= 2 && arousal.positive >= 2;
        const parts = [
          fullySupported ? "PTSD is supported because trauma exposure is documented and the intake contains intrusion, avoidance, negative mood/cognition, and arousal symptoms across the required clusters." : `PTSD remains provisional because trauma exposure is documented, but the current intake only supports ${intrusion.positive} intrusion, ${avoidance.positive} avoidance, ${mood.positive} negative mood/cognition, and ${arousal.positive} arousal criteria from the required cluster pattern.`
        ];
        parts.push("Duration, functional impact, and rule-outs should be confirmed directly in follow-up.");
        return parts.join(" ");
      }
      case "gad": {
        const symptoms = summarizePositiveCriterionTexts("gad", criteria, workspace, "gad.C.");
        const parts = [
          `GAD is being considered because the intake supports ${joinList(symptoms.length ? symptoms : ["multiple anxiety symptoms"])}${intake.gad7 ? ` and GAD-7 ${intake.gad7.totalScore}/21` : ""}.`
        ];
        const impairment = criteria.find((criterion2) => criterion2.criterionId === "gad.D");
        if (impairment && isPositive(getEffectiveCriterionStatus(workspace, "gad", impairment))) {
          parts.push("The presentation also appears to create clinically meaningful impairment.");
        }
        return parts.join(" ");
      }
      default: {
        const supportedCriteria = summarizePositiveCriterionTexts(
          suggestion.disorderId,
          criteria,
          workspace,
          `${suggestion.disorderId}.`,
          4
        );
        const parts = [
          `${suggestion.disorderName} is under consideration because the intake supports ${joinList(supportedCriteria.length ? supportedCriteria : ["multiple relevant criteria"])}.`
        ];
        return parts.join(" ");
      }
    }
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
        diagnosticReasoning: buildDiagnosticReasoning(intake, suggestion, workspace),
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
    cssrs: null,
    dass21: null,
    recentSymptoms: "",
    additionalSymptoms: "",
    additionalInfo: "",
    manualNotes: "",
    overviewClinicalNote: "",
    spSoapNote: "",
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
  var DEFAULT_MSE_CHECKLIST = {
    appearance: ["well-groomed", "casually dressed", "appropriate hygiene"],
    behavior: ["cooperative", "good eye contact", "psychomotor normal"],
    speech: ["normal rate", "normal volume", "coherent"],
    mood: "",
    affect: ["congruent", "full range"],
    thoughtProcess: ["linear", "goal-directed"],
    thoughtContent: ["no SI", "no HI", "no delusions"],
    perceptions: ["no hallucinations"],
    cognition: ["alert", "oriented x4", "intact memory"],
    insight: "good",
    judgment: "good",
    updatedAt: ""
  };
  var EMPTY_TREATMENT_PLAN = {
    clientId: "",
    diagnoses: [],
    presentingProblem: "",
    clientStrengths: "",
    clientRisks: "",
    goals: [],
    interventions: [],
    treatmentType: "",
    estimatedLength: "",
    medicalNecessity: [],
    treatmentFrequency: "",
    dateAssigned: "",
    capturedAt: "",
    sourceUrl: ""
  };
  var EMPTY_SESSION_TRANSCRIPT = {
    apptId: "",
    entries: [],
    updatedAt: ""
  };
  var EMPTY_SOAP_DRAFT = {
    apptId: "",
    clientName: "",
    sessionDate: "",
    cptCode: "90837",
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
    sessionNotes: "",
    transcript: "",
    treatmentPlanId: "",
    generatedAt: "",
    editedAt: "",
    status: "draft",
    generationMethod: ""
  };
  var EMPTY_SESSION_NOTES = {
    apptId: "",
    notes: "",
    updatedAt: ""
  };
  var DEFAULT_PREFERENCES = {
    providerFirstName: "Anders",
    providerLastName: "Chan",
    defaultLocation: "Video Office",
    firstVisitCPT: "90791",
    followUpCPT: "90837",
    llmProvider: "ollama",
    ollamaModel: "llama3.2:3b",
    ollamaEndpoint: "http://localhost:11434",
    openaiApiKey: "",
    openaiModel: "gpt-4o-mini",
    autoGenerateOnSessionEnd: true
  };

  // src/lib/intake-augmentation.ts
  var OCCUPATION_PATTERN = /\b(software engineer|engineer|developer|teacher|student|manager|analyst|nurse|doctor|physician|therapist|consultant|designer|lawyer|attorney|accountant|entrepreneur|founder|product manager|project manager)\b/i;
  function normalizeWhitespace(value) {
    return value.replace(/\s+/g, " ").trim();
  }
  function splitLines(notes) {
    return notes.split(/\n+/).map((line) => normalizeWhitespace(line)).filter(Boolean);
  }
  function unique(values) {
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
    return unique(lines.filter((line) => pattern.test(line))).slice(0, limit);
  }
  function joinLines(lines) {
    return unique(lines).join("\n");
  }
  function collectTopicLines(lines, patterns, limit = 4) {
    return unique(
      lines.filter((line) => patterns.some((pattern) => pattern.test(line)))
    ).slice(0, limit);
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
      collectMatchingLines(
        lines,
        /\b(surger(?:y|ies)|appendectomy|tonsillectomy|c-section|cesarean|acl|labrum|meniscus|rotator cuff|shoulder surgery|knee surgery|back surgery|hip surgery)\b/i,
        4
      )
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
      collectMatchingLines(lines, /\b(want to|want better|meet regularly|more actionable|cope|cbt|dynamic|act|drink less|stop drinking|move forward|anger management|exercise|breathe|breathing)\b/i, 6)
    );
    return counselingGoals ? { counselingGoals } : {};
  }
  function extractRecentSymptoms(lines) {
    const recentSymptoms = joinLines(
      collectMatchingLines(
        lines,
        /\b(anxious|anxiety|insomnia|stomach pain|queasy|nausea|flashback|dissociation|foggy|fogginess|trouble concentrating|sleep disturbance|hopelessness|shock|anger|angry|irritable|yell(?:ed|ing)?|jealous|defensive|relationship stress|attachment)\b/i,
        10
      )
    );
    return recentSymptoms ? { recentSymptoms } : {};
  }
  function extractRelationshipDescription(lines) {
    const relationshipDescription = joinLines(
      collectTopicLines(
        lines,
        [
          /\b(girlfriend|boyfriend|partner|wife|husband|spouse|ex\b|relationship|dating|marriage|engage(?:d|ment)?|breakup|divorce|attachment|jealous)\b/i
        ],
        5
      )
    );
    return relationshipDescription ? { relationshipDescription } : {};
  }
  function extractSubstanceUse(lines) {
    const alcoholLines = collectTopicLines(
      lines,
      [
        /\b(alcohol|drink(?:ing)?|drank|beer|wine|liquor|vodka|tequila|patron|soju)\b/i,
        /\bstop drinking\b/i,
        /\bdrink less\b/i
      ],
      4
    );
    const drugLines = collectTopicLines(
      lines,
      [
        /\b(weed|marijuana|cannabis|joint|blunt|thc|vape|nicotine|cigarette|cocaine|crack|meth|adderall|xanax|opioid|pill|mushroom|mushrooms|shroom|lsd)\b/i
      ],
      4
    );
    const substanceUseHistory = joinLines([...alcoholLines, ...drugLines]);
    return {
      alcoholUse: joinLines(alcoholLines),
      drugUse: joinLines(drugLines),
      substanceUseHistory
    };
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
      ...extractRecentSymptoms(lines),
      ...extractRelationshipDescription(lines),
      ...extractSubstanceUse(lines)
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
      recentSymptoms: pickString(intake.recentSymptoms, derived.recentSymptoms),
      relationshipDescription: pickString(intake.relationshipDescription, derived.relationshipDescription),
      alcoholUse: pickString(intake.alcoholUse, derived.alcoholUse),
      drugUse: pickString(intake.drugUse, derived.drugUse),
      substanceUseHistory: pickString(intake.substanceUseHistory, derived.substanceUseHistory)
    };
  }

  // src/lib/storage.ts
  var INTAKE_KEY = "spn_intake";
  var NOTE_KEY = "spn_note";
  var DIAGNOSTIC_WORKSPACE_KEY = "spn_diagnostic_workspace";
  var PREFS_KEY = "spn_preferences";
  var SESSION_NOTES_KEY = "spn_session_notes";
  var TREATMENT_PLAN_KEY = "spn_treatment_plan";
  var SOAP_DRAFT_KEY = "spn_soap_draft";
  var TRANSCRIPT_KEY = "spn_transcript";
  var MSE_CHECKLIST_KEY = "spn_mse_checklist";
  var DEID_MAPPING_KEY = "spn_deid_mapping";
  var SUPERVISION_PREP_KEY = "spn_supervision_prep";
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
      phq9: intake?.phq9 ?? null,
      cssrs: intake?.cssrs ?? null,
      dass21: intake?.dass21 ?? null
    };
  }
  function normalizeDiagnosticImpression(impression) {
    return {
      disorderId: impression?.disorderId ?? "",
      code: impression?.code ?? "",
      name: impression?.name ?? "",
      confidence: impression?.confidence ?? "low",
      diagnosticReasoning: impression?.diagnosticReasoning?.trim() ?? "",
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
  function normalizeSoapDraft(draft) {
    return {
      ...EMPTY_SOAP_DRAFT,
      ...draft,
      sessionNotes: draft?.sessionNotes?.trim() ?? "",
      transcript: draft?.transcript?.trim() ?? "",
      subjective: draft?.subjective?.trim() ?? "",
      objective: draft?.objective?.trim() ?? "",
      assessment: draft?.assessment?.trim() ?? "",
      plan: draft?.plan?.trim() ?? "",
      generatedAt: draft?.generatedAt ?? "",
      editedAt: draft?.editedAt ?? draft?.generatedAt ?? "",
      status: draft?.status ?? "draft"
    };
  }
  function normalizeTranscriptEntry(entry) {
    return {
      speaker: entry?.speaker ?? "unknown",
      text: entry?.text?.trim() ?? "",
      timestamp: entry?.timestamp ?? ""
    };
  }
  function normalizeTranscript(transcript) {
    return {
      ...EMPTY_SESSION_TRANSCRIPT,
      ...transcript,
      entries: Array.isArray(transcript?.entries) ? transcript.entries.map((entry) => normalizeTranscriptEntry(entry)).filter((entry) => entry.text) : []
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
      followUpCPT: prefs?.followUpCPT?.trim() || DEFAULT_PREFERENCES.followUpCPT,
      llmProvider: prefs?.llmProvider || DEFAULT_PREFERENCES.llmProvider,
      openaiApiKey: prefs?.openaiApiKey?.trim() || "",
      openaiModel: prefs?.openaiModel?.trim() || DEFAULT_PREFERENCES.openaiModel
    };
  }
  async function getPreferences() {
    const result = await chrome.storage.local.get(PREFS_KEY);
    return normalizePreferences(result[PREFS_KEY]);
  }
  async function getTreatmentPlan() {
    const result = await chrome.storage.session.get(TREATMENT_PLAN_KEY);
    const plan = result[TREATMENT_PLAN_KEY];
    return plan ? { ...EMPTY_TREATMENT_PLAN, ...plan } : null;
  }
  async function saveSoapDraft(draft) {
    await chrome.storage.session.set({ [SOAP_DRAFT_KEY]: normalizeSoapDraft(draft) });
  }
  async function getSoapDraft() {
    const result = await chrome.storage.session.get(SOAP_DRAFT_KEY);
    const draft = result[SOAP_DRAFT_KEY];
    return draft ? normalizeSoapDraft(draft) : null;
  }
  async function getTranscript(apptId) {
    const result = await chrome.storage.session.get(TRANSCRIPT_KEY);
    const transcript = result[TRANSCRIPT_KEY];
    if (!transcript || transcript.apptId !== apptId) return null;
    return normalizeTranscript(transcript);
  }
  async function getSessionNotes(apptId) {
    const result = await chrome.storage.session.get(SESSION_NOTES_KEY);
    const notes = result[SESSION_NOTES_KEY];
    if (!notes || notes.apptId !== apptId) return null;
    return { ...EMPTY_SESSION_NOTES, ...notes };
  }
  async function getMseChecklist() {
    const result = await chrome.storage.session.get(MSE_CHECKLIST_KEY);
    const checklist = result[MSE_CHECKLIST_KEY];
    return checklist ? { ...DEFAULT_MSE_CHECKLIST, ...checklist } : null;
  }
  async function saveSupervisionPrep(prep) {
    await chrome.storage.session.set({ [SUPERVISION_PREP_KEY]: prep });
  }
  async function getSupervisionPrep() {
    const result = await chrome.storage.session.get(SUPERVISION_PREP_KEY);
    return result[SUPERVISION_PREP_KEY] ?? null;
  }
  var REFERENCE_LIBRARY_KEY = "spn_reference_library";
  async function getReferenceLibrary() {
    const result = await chrome.storage.local.get(REFERENCE_LIBRARY_KEY);
    const files = result[REFERENCE_LIBRARY_KEY];
    return Array.isArray(files) ? files : [];
  }
  async function clearAll() {
    await chrome.storage.session.remove([
      INTAKE_KEY,
      NOTE_KEY,
      DIAGNOSTIC_WORKSPACE_KEY,
      SESSION_NOTES_KEY,
      TREATMENT_PLAN_KEY,
      SOAP_DRAFT_KEY,
      TRANSCRIPT_KEY,
      MSE_CHECKLIST_KEY,
      DEID_MAPPING_KEY,
      SUPERVISION_PREP_KEY
    ]);
  }

  // src/lib/clinical-knowledge.ts
  var INDEX_PATH = "assets/clinical-knowledge/index.json";
  var manifestCache = {};
  var indexCache = {};
  var resourceCache = /* @__PURE__ */ new Map();
  function normalizeTerm(term) {
    return term.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
  }
  function tokenize(query) {
    return normalizeTerm(query).split(" ").filter((term) => term.length >= 3);
  }
  async function loadJson(path) {
    if (!chrome.runtime?.id) {
      delete manifestCache.promise;
      delete indexCache.promise;
      resourceCache.clear();
      throw new Error("Extension context invalidated \u2014 reload the page to retry");
    }
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
  function chunkMarkdown(file) {
    const lines = file.content.split("\n");
    const entries = [];
    let currentHeading = file.filename.replace(/\.[^.]+$/, "");
    let currentText = [];
    let chunkIndex = 0;
    function flushChunk() {
      const text = currentText.join("\n").trim();
      if (!text) return;
      const preview = text.slice(0, 200);
      const tags = normalizeTerm(currentHeading).split(" ").filter((w) => w.length >= 3);
      entries.push({
        resourceId: file.id,
        resourceTitle: file.filename,
        resourceModality: "user-upload",
        chunk: {
          id: `${file.id}-c${chunkIndex}`,
          pageStart: chunkIndex,
          pageEnd: chunkIndex,
          heading: currentHeading,
          preview,
          tags,
          estimatedTokens: Math.ceil(text.length / 4)
        }
      });
      chunkIndex++;
    }
    for (const line of lines) {
      const headingMatch = line.match(/^#{1,3}\s+(.+)/);
      if (headingMatch) {
        flushChunk();
        currentHeading = headingMatch[1].trim();
        currentText = [];
      } else {
        currentText.push(line);
      }
    }
    flushChunk();
    return entries;
  }
  async function getUserUploadEntries() {
    try {
      const files = await getReferenceLibrary();
      return files.flatMap((file) => chunkMarkdown(file));
    } catch {
      return [];
    }
  }
  async function searchClinicalKnowledge(query, options = {}) {
    const tokens = tokenize(query);
    if (!tokens.length) return [];
    const resourceIds = options.resourceIds?.length ? options.resourceIds : null;
    const results = [];
    try {
      const index = await loadClinicalKnowledgeIndex();
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
    } catch {
    }
    const userEntries = await getUserUploadEntries();
    for (const entry of userEntries) {
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
  function joinList2(items) {
    if (items.length === 0) return "";
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
  }
  function unique2(items) {
    return Array.from(
      new Set(
        items.map((item) => item.trim()).filter(Boolean)
      )
    );
  }
  function splitGoals(raw) {
    return unique2(
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
  function normalizeGenderLabel(raw) {
    const lower = raw.trim().toLowerCase();
    if (/\b(male|man|boy)\b/.test(lower)) return "male";
    if (/\b(female|woman|girl)\b/.test(lower)) return "female";
    if (/\b(non-?binary|genderqueer|genderfluid)\b/.test(lower)) return "non-binary";
    return "";
  }
  function buildEthnicityLabel(ethnicity, race) {
    const eth = ethnicity.trim();
    const r = race.trim();
    if (/^yes$/i.test(eth)) return r ? `${r} Hispanic/Latino` : "Hispanic/Latino";
    if (/^no$/i.test(eth)) return r;
    return eth || r;
  }
  function buildOccupationContext(occupation) {
    const trimmed = occupation.trim();
    if (!trimmed) return "";
    if (/unemployed|not working|out of work/i.test(trimmed)) return "currently unemployed";
    const cleaned = trimmed.replace(/^(a|an)\s+/i, "").replace(/[.]+$/, "").trim();
    if (cleaned.length > 3 && cleaned.length < 60) return `with stable employment as a ${cleaned.toLowerCase()}`;
    return "with stable employment";
  }
  function buildSubstanceContext(alcohol, drug, history) {
    const negative = /^(no|none|n\/a|na|denied|denies|negative)$/i;
    const parts = [alcohol, drug, history].map((v) => v.trim()).filter((v) => v && !negative.test(v));
    if (!parts.length) return "";
    return unique2(parts).slice(0, 2).join("; ");
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
    const hasSexualHealthConcern = /sexual dysfunction|erectile|sex therap|libido|orgasm|premature ejaculation|vaginismus|dyspareunia/.test(narrativeText) || /sexual dysfunction|erectile|sex therap/.test(diagnosisText);
    const severeSymptoms = (intake.phq9?.totalScore ?? 0) >= 15 || (intake.gad7?.totalScore ?? 0) >= 15;
    const needsMedicalCoordination = Boolean(
      intake.primaryCarePhysician.trim() || intake.prescribingMD.trim() || intake.medications.trim()
    );
    return {
      diagnoses: unique2(diagnosticImpressions.map((impression) => impression.name)).slice(0, 3),
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
      predisposingFactors: unique2([
        ...pickFactors([intake.familyPsychiatricHistory, intake.familyMentalEmotionalHistory], 2),
        ...pickFactors([intake.physicalSexualAbuseHistory, intake.domesticViolenceHistory], 1),
        ...pickFactors([intake.developmentalHistory, intake.medicalHistory], 1)
      ]).slice(0, 4),
      precipitatingFactors: unique2([
        ...pickFactors([intake.chiefComplaint, intake.presentingProblems, intake.historyOfPresentIllness], 2),
        ...pickFactors([intake.recentSymptoms, intake.additionalSymptoms], 1)
      ]).slice(0, 4),
      perpetuatingFactors: unique2([
        ...pickFactors([intake.troubleSleeping], 1),
        ...pickFactors([intake.alcoholUse, intake.drugUse, intake.substanceUseHistory], 1),
        ...pickFactors([intake.relationshipDescription, intake.occupation], 1),
        ...pickFactors([
          intake.phq9?.difficulty ? `Depression-related impairment: ${intake.phq9.difficulty}` : "",
          intake.gad7?.difficulty ? `Anxiety-related impairment: ${intake.gad7.difficulty}` : ""
        ], 1)
      ]).slice(0, 4),
      protectiveFactors: unique2([
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
      hasSexualHealthConcern,
      hasAdolescentPresentation: age !== null && age <= 19,
      needsMedicalCoordination,
      // Demographics for biopsychosocial narrative
      clientName: firstNonEmpty(intake.firstName, intake.fullName) || "Patient",
      age,
      genderLabel: normalizeGenderLabel(firstNonEmpty(intake.genderIdentity, intake.sex)),
      ethnicityLabel: buildEthnicityLabel(intake.ethnicity, intake.race),
      occupationContext: buildOccupationContext(intake.occupation),
      relationshipContext: clip(intake.relationshipDescription.trim(), 80),
      livingContext: intake.livingArrangement.trim().toLowerCase(),
      hasMedicalIssues: Boolean(
        intake.medicalHistory.trim() && !/^(none|no|denied|denies|n\/a|na)$/i.test(intake.medicalHistory.trim())
      ),
      medicationContext: intake.medications.trim() && !/^(none|no|denied|denies|n\/a|na)$/i.test(intake.medications.trim()) ? clip(intake.medications.trim(), 80) : "",
      substanceContext: buildSubstanceContext(intake.alcoholUse, intake.drugUse, intake.substanceUseHistory),
      phq9Score: intake.phq9?.totalScore ?? null,
      gad7Score: intake.gad7?.totalScore ?? null
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
    const queries = unique2([
      `treatment plan interventions ${diagnosisClause} ${profile.patientGoals.join(" ")}`.trim(),
      profile.hasSubstance ? "motivational interviewing relapse prevention ambivalence substance use" : "",
      profile.hasEmotionDysregulation || profile.hasSelfHarmRisk ? "dbt distress tolerance emotion regulation chain analysis safety planning" : "",
      profile.hasTrauma || profile.hasPersonality || profile.hasInterpersonalStrain ? "psychodynamic formulation attachment personality functioning relationship patterns" : ""
    ]);
    return queries.slice(0, 5);
  }
  function buildFormulationQueries(profile, diagnosticImpressions) {
    const diagnosisClause = diagnosticImpressions.length ? diagnosticImpressions.map((impression) => impression.name).join(" ") : profile.diagnoses.join(" ");
    const queries = [
      `case formulation ${diagnosisClause} mechanisms precipitants origins treatment planning`.trim(),
      "elements of a case formulation symptoms problems mechanisms precipitants origins",
      "using the formulation to develop a treatment plan diagnosis goals"
    ];
    if (profile.hasPersonality || profile.hasTrauma || profile.hasInterpersonalStrain) {
      queries.push("psychodynamic formulation attachment defenses personality functioning relationship patterns");
      queries.push("case formulation psychodynamic trauma personality disrupted safety defenses coping");
    }
    return unique2(queries).slice(0, 5);
  }
  function selectFormulationResourceIds(profile) {
    const ids = [RESOURCE_IDS.caseFormulationCbt];
    if (profile.hasPersonality || profile.hasTrauma || profile.hasInterpersonalStrain) {
      ids.push(RESOURCE_IDS.psychoanalytic);
      ids.push(RESOURCE_IDS.pdm);
    }
    return ids;
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
      if (references.length >= 5) break;
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
    if (profile.hasSexualHealthConcern) {
      modalities.push("Sex therapy (sensate focus, psychoeducation)");
    }
    return unique2(modalities).slice(0, 4);
  }
  function buildProblemList(profile) {
    const problems = [];
    if (profile.hasDepression) problems.push("depressed mood and reduced interest/pleasure");
    if (profile.hasAnxiety) problems.push("anxiety, worry, and physiological tension");
    if (profile.hasTrauma) problems.push("trauma-related symptoms and cue sensitivity");
    if (profile.hasSleepIssue) problems.push("sleep disruption");
    if (profile.hasInterpersonalStrain) problems.push("interpersonal strain");
    if (profile.hasSubstance) problems.push("substance-related coping or harm");
    if (profile.primaryConcern) problems.push(profile.primaryConcern.replace(/[.]+$/, ""));
    return unique2(problems).slice(0, 5);
  }
  function inferPronoun(genderLabel) {
    if (genderLabel === "male") return { subject: "he", possessive: "his" };
    if (genderLabel === "female") return { subject: "she", possessive: "her" };
    return { subject: "they", possessive: "their" };
  }
  function summarizePresentingConcern(profile) {
    const symptoms = [];
    if (profile.hasAnxiety) symptoms.push("anxiety");
    if (profile.hasDepression) symptoms.push("depression");
    if (profile.hasTrauma) symptoms.push("trauma-related distress");
    if (profile.hasSubstance) symptoms.push("substance use concerns");
    if (profile.hasEmotionDysregulation) symptoms.push("difficulty managing emotions");
    if (!symptoms.length && profile.primaryConcern) {
      return profile.primaryConcern.replace(/[.]+$/, "").toLowerCase();
    }
    return symptoms.length ? `symptoms of ${joinList2(symptoms)}` : "presenting concerns";
  }
  function normalizeRelationshipForNarrative(raw) {
    if (!raw) return "";
    return raw.replace(/^(Girlfriend|Boyfriend|Partner|Spouse|Wife|Husband)/i, (m) => m.toLowerCase()).replace(/,\s*/, " of ").trim();
  }
  function buildOpeningSentence(profile) {
    const parts = [profile.clientName];
    parts.push("is a");
    const descriptors = [];
    if (profile.age) descriptors.push(`${profile.age}-year-old`);
    if (profile.ethnicityLabel) descriptors.push(profile.ethnicityLabel);
    if (profile.genderLabel) descriptors.push(profile.genderLabel);
    if (descriptors.length) {
      parts.push(descriptors.join(" "));
    } else {
      parts.push("patient");
    }
    const context = [];
    if (profile.occupationContext) context.push(profile.occupationContext);
    const relNarrative = normalizeRelationshipForNarrative(profile.relationshipContext);
    if (relNarrative) context.push(`${relNarrative}`);
    if (context.length) parts.push(context.join(" and "));
    const concern = summarizePresentingConcern(profile);
    const precipitant = profile.primaryConcern.match(/(?:following|after|relating to|due to)\s+(.+)/i)?.[1]?.replace(/[.]+$/, "");
    if (precipitant) {
      parts.push(`who presents with ${concern} relating to ${precipitant.toLowerCase()}`);
    } else if (profile.precipitatingFactors.length) {
      parts.push(`who presents with ${concern} relating to ${clip(profile.precipitatingFactors[0], 80).toLowerCase().replace(/[.]+$/, "")}`);
    } else {
      parts.push(`who presents with ${concern}`);
    }
    return `${parts.join(" ")}.`;
  }
  function buildBiologicalParagraph(profile) {
    const { possessive } = inferPronoun(profile.genderLabel);
    const capPossessive = possessive.charAt(0).toUpperCase() + possessive.slice(1);
    const lines = [];
    if (profile.hasMedicalIssues) {
      lines.push(`${profile.clientName} has a history of medical issues that may be playing a role.`);
    } else {
      lines.push(`${profile.clientName} has no major medical issues reported.`);
    }
    if (profile.medicationContext) {
      lines.push(`Current medications include ${profile.medicationContext}.`);
    }
    const somatic = [];
    if (profile.hasSleepIssue) somatic.push("trouble sleeping");
    if (profile.hasDepression) somatic.push("low energy");
    if (profile.hasAnxiety) somatic.push("physical tension");
    if (somatic.length) {
      lines.push(`${capPossessive} body is showing signs of stress: ${joinList2(somatic)}.`);
    }
    return lines.join(" ");
  }
  function buildPsychologicalParagraphs(profile, diagnosticImpressions) {
    const { subject } = inferPronoun(profile.genderLabel);
    const capSubject = subject.charAt(0).toUpperCase() + subject.slice(1);
    const paragraphs = [];
    const problemList = buildProblemList(profile);
    if (problemList.length) {
      const scores = [];
      if (profile.phq9Score !== null) scores.push(`PHQ-9: ${profile.phq9Score}`);
      if (profile.gad7Score !== null) scores.push(`GAD-7: ${profile.gad7Score}`);
      const scoreNote = scores.length ? ` (in clinical interview, ${scores.join(", and ")})` : "";
      paragraphs.push(`${capSubject} reported ${joinList2(problemList)}${scoreNote}.`);
    }
    if (profile.hasDepression && profile.hasAnxiety) {
      paragraphs.push("From a CBT lens, catastrophic interpretations and somatic vigilance may be maintaining anxiety, while behavioral withdrawal reinforces low mood.");
    } else if (profile.hasDepression) {
      paragraphs.push("From a CBT lens, doing less and pulling away from daily routines reinforces the low mood over time.");
    } else if (profile.hasAnxiety) {
      paragraphs.push("From a CBT lens, avoiding the things that cause worry gives short-term relief but makes the anxiety stronger over time.");
    } else {
      paragraphs.push("From a CBT lens, avoidance and withdrawal patterns may be keeping the current problems in place.");
    }
    if (profile.hasTrauma) {
      const traumaLines = [
        "From a trauma-focused view, avoiding reminders of what happened may feel safer in the short term but keeps the fear response active."
      ];
      if (profile.hasEmotionDysregulation || profile.hasSelfHarmRisk) {
        traumaLines.push(`${capSubject} may also struggle to handle strong feelings, which can lead to risky or impulsive ways of coping when stress gets too high.`);
      }
      paragraphs.push(traumaLines.join(" "));
    } else if (profile.hasEmotionDysregulation || profile.hasSelfHarmRisk) {
      paragraphs.push(`${capSubject} may also struggle to handle strong feelings, which can lead to risky or impulsive ways of coping when stress gets too high.`);
    }
    if (profile.hasTrauma && (profile.hasPersonality || profile.hasInterpersonalStrain)) {
      paragraphs.push(`From a psychodynamic view, the trauma can change ${profile.clientName}'s earlier sense of safety and control, overwhelming coping strategies that used to work. Relationship patterns may reflect old ways of protecting against feeling helpless or unsafe.`);
    } else if (profile.hasTrauma) {
      paragraphs.push(`From a psychodynamic view, the trauma can change ${profile.clientName}'s earlier sense of safety and control, overwhelming coping strategies that used to work.`);
    } else if (profile.hasPersonality || profile.hasInterpersonalStrain) {
      paragraphs.push(`From a psychodynamic view, repeating patterns in relationships, like expecting rejection or needing constant reassurance, may trace back to earlier experiences that shaped how ${subject} relates to others.`);
    }
    return paragraphs;
  }
  function buildSocialParagraph(profile) {
    const lines = [];
    const strengths = [];
    if (profile.occupationContext && profile.occupationContext !== "currently unemployed") {
      strengths.push("employment");
    }
    const relNarrative = normalizeRelationshipForNarrative(profile.relationshipContext);
    if (relNarrative) strengths.push(`a relationship (${relNarrative})`);
    if (profile.livingContext && !/alone/i.test(profile.livingContext)) {
      strengths.push(`housing (${profile.livingContext})`);
    }
    if (strengths.length) {
      lines.push(`On the social side, ${profile.clientName} has some important supports in place: ${joinList2(strengths)}.`);
    } else {
      lines.push(`Social supports are limited and should be explored more in follow-up.`);
    }
    if (profile.hasDepression || profile.hasInterpersonalStrain) {
      lines.push(`However, pulling away from people and activities is a concern that could weaken these supports over time.`);
    }
    return lines.join(" ");
  }
  function buildFormulation(profile, modalities, diagnosticImpressions) {
    const paragraphs = [];
    paragraphs.push(buildOpeningSentence(profile));
    paragraphs.push(buildBiologicalParagraph(profile));
    paragraphs.push(...buildPsychologicalParagraphs(profile, diagnosticImpressions));
    paragraphs.push(buildSocialParagraph(profile));
    if (profile.hasSubstance && profile.substanceContext) {
      const isVague = /^(yes|y)$/i.test(profile.substanceContext.trim());
      if (isVague) {
        paragraphs.push(`${profile.clientName} reported substance use in the intake form, which could be a way of coping with distress and raise the risk that symptoms stick around longer. More assessment for type of substances is needed.`);
      } else {
        paragraphs.push(`${profile.clientName} reported substance use (${profile.substanceContext}), which could be a way of coping with distress and raise the risk that symptoms stick around longer.`);
      }
    } else if (profile.hasSubstance) {
      paragraphs.push(`${profile.clientName} reported substance use in the intake form, which could be a way of coping with distress and raise the risk that symptoms stick around longer. More assessment for type of substances is needed.`);
    }
    paragraphs.push(`Treatment can start with ${joinList2(modalities)}.`);
    return paragraphs.join("\n\n");
  }
  function buildGoals(profile) {
    const goals = [];
    const objectives = [];
    if (profile.hasTrauma && profile.hasAnxiety) {
      goals.push("Reduce anxiety symptoms related to trauma");
    } else if (profile.hasAnxiety) {
      goals.push("Reduce anxiety symptoms and worry");
    } else if (profile.hasTrauma) {
      goals.push("Process trauma-related distress and restore safety");
    }
    if (profile.hasDepression) {
      goals.push("Improve mood and energy");
    }
    if (profile.hasAnxiety || profile.hasTrauma) {
      goals.push("Decrease avoidance and increase functioning");
    }
    if (profile.hasSubstance) {
      goals.push("Address substance use as coping");
    }
    if (profile.hasEmotionDysregulation || profile.hasSelfHarmRisk) {
      goals.push("Strengthen distress tolerance and reduce self-harm risk");
    }
    if (profile.hasInterpersonalStrain || profile.hasPersonality) {
      goals.push("Improve relational stability and reflective capacity");
    }
    for (const g of profile.patientGoals) {
      if (!goals.some((existing) => existing.toLowerCase().includes(g.toLowerCase().slice(0, 20)))) {
        goals.push(g);
      }
    }
    if (!goals.length) {
      goals.push("Clarify the symptom pattern and restore baseline functioning");
    }
    goals.push("Restore baseline functioning");
    objectives.push("Identify and track triggers (week 1-2)");
    if (profile.hasDepression) {
      objectives.push("Increase 2-3 pleasurable or meaningful activities weekly");
    }
    if (profile.hasAnxiety || profile.hasTrauma) {
      objectives.push("Learn 2 grounding skills");
    }
    if (profile.hasAnxiety || profile.hasDepression) {
      objectives.push("Begin cognitive restructuring of unhelpful thought patterns");
    }
    if (profile.hasSubstance) {
      objectives.push("Explore substance use patterns and motivation for change");
    }
    if (profile.hasEmotionDysregulation || profile.hasSelfHarmRisk) {
      objectives.push("Practice one distress tolerance skill between sessions");
    }
    if (profile.hasInterpersonalStrain || profile.hasPersonality) {
      objectives.push("Identify one recurring relational pattern to explore");
    }
    objectives.push("Finalize measurable treatment goals (session 2-3)");
    const lines = [];
    lines.push("Goals:");
    for (const g of unique2(goals).slice(0, 6)) {
      lines.push(`  ${g}`);
    }
    lines.push("");
    lines.push("Objectives:");
    for (const o of unique2(objectives).slice(0, 6)) {
      lines.push(`  ${o}`);
    }
    return lines.join("\n");
  }
  function buildInterventions(profile) {
    const domains = [];
    let domainNum = 0;
    if (profile.hasTrauma) {
      const items = [];
      items.push("Trauma-focused CBT");
      items.push("Psychoeducation on trauma response");
      items.push("Gradual exposure to trauma-related cues (as appropriate)");
      if (profile.hasAnxiety) {
        items.push("Grounding and stabilization before deeper processing");
      }
      domains.push({ title: "Trauma + Anxiety Focus", items });
    }
    if (profile.hasDepression) {
      const items = [];
      items.push("Behavioral activation (increase engagement, reduce withdrawal)");
      items.push("Monitor sleep and appetite");
      if (profile.hasSleepIssue) {
        items.push("Behavioral sleep-routine interventions");
      }
      domains.push({ title: "Depression Interventions", items });
    }
    if (profile.hasAnxiety) {
      const items = [];
      items.push("CBT for anxiety (cognitive restructuring, interoceptive awareness)");
      items.push("Teach grounding and distress tolerance (DBT-informed skills)");
      domains.push({ title: "Anxiety / Somatic Symptoms", items });
    }
    if (profile.hasEmotionDysregulation || profile.hasSelfHarmRisk) {
      const items = [];
      items.push("DBT distress-tolerance and emotion-regulation skills");
      items.push("Chain analysis for high-risk behaviors");
      if (profile.hasSelfHarmRisk) {
        items.push("Safety planning and crisis resource review");
      }
      domains.push({ title: "Emotion Regulation / Safety", items });
    }
    if (profile.hasSubstance) {
      const items = [];
      items.push("Motivational Interviewing to explore ambivalence and function of use");
      items.push("Harm reduction vs abstinence planning based on readiness");
      items.push("Review ASAM dimensions for level of care adjustment");
      domains.push({ title: "Substance Use", items });
    }
    if (profile.hasPersonality || profile.hasTrauma || profile.hasInterpersonalStrain) {
      const items = [];
      if (profile.hasTrauma) {
        items.push("Explore meaning of trauma (control, vulnerability)");
      }
      items.push("Assess emotional avoidance patterns");
      if (profile.hasInterpersonalStrain || profile.hasPersonality) {
        items.push("Track recurrent relational patterns and attachment themes");
      }
      domains.push({ title: "Psychodynamic / Insight Work", items });
    }
    if (profile.hasSexualHealthConcern) {
      const items = [];
      items.push("Comprehensive sexual health assessment (medical, psychological, relational factors)");
      items.push("Psychoeducation on sexual response cycle and contributing factors");
      items.push("Sensate focus exercises to reduce performance anxiety");
      items.push("Cognitive restructuring of maladaptive beliefs about sexual performance");
      if (profile.hasAnxiety) {
        items.push("Address performance anxiety and anticipatory avoidance");
      }
      if (profile.hasInterpersonalStrain) {
        items.push("Couples communication skills around intimacy");
      }
      items.push("Coordinate with medical provider to rule out physiological contributors");
      domains.push({ title: "Sexual Health", items });
    }
    if (profile.needsMedicalCoordination || profile.severeSymptoms) {
      const items = [];
      items.push("Consider consulting with a psychiatrist if symptoms persist or worsen");
      if (profile.hasSleepIssue) {
        items.push("Sleep support if insomnia emerges");
      }
      if (profile.hasSubstance) {
        items.push("Medication evaluation for co-occurring substance use");
      }
      domains.push({ title: "Medication Evaluation", items });
    }
    if (!domains.length) {
      domains.push({
        title: "Assessment and Monitoring",
        items: [
          "Complete diagnostic clarification and timeline review",
          "Measurement-based monitoring at follow-up visits"
        ]
      });
    }
    const lines = [];
    for (const domain of domains) {
      domainNum++;
      lines.push(`${domainNum}. ${domain.title}`);
      for (const item of domain.items) {
        lines.push(`   ${item}`);
      }
      lines.push("");
    }
    return lines.join("\n").trim();
  }
  function buildFrequency(profile) {
    const lines = [];
    if (profile.hasSelfHarmRisk || profile.severeSymptoms) {
      lines.push("Frequency: Weekly outpatient therapy (consider twice weekly if risk escalates)");
    } else {
      lines.push("Frequency: Weekly outpatient therapy");
    }
    lines.push("");
    lines.push("Monitoring:");
    const monitors = [];
    if (profile.hasDepression || profile.hasAnxiety) {
      monitors.push("PHQ-9 / GAD-7 every 2-4 weeks");
    }
    if (profile.hasSubstance) {
      monitors.push("Substance use tracking");
    }
    if (profile.hasSelfHarmRisk) {
      monitors.push("Safety plan review each session");
    }
    if (!monitors.length) {
      monitors.push("Symptom and functioning check-in each session");
    }
    for (const m of monitors) {
      lines.push(`  ${m}`);
    }
    lines.push("");
    lines.push("Reassessment:");
    const reassess = [];
    if (profile.hasTrauma) {
      reassess.push("Evaluate PTSD criteria next session and after 1 month");
    }
    if (profile.hasSubstance) {
      reassess.push("Reassess ASAM dimensions for level of care adjustment");
    }
    if (profile.diagnoses.length) {
      const dxList = profile.diagnoses.slice(0, 3).join(", ");
      reassess.push(`Review diagnostic accuracy for ${dxList} after 4-6 sessions`);
    }
    if (!reassess.length) {
      reassess.push("Re-evaluate diagnostic impressions after 4-6 sessions");
    }
    for (const r of reassess) {
      lines.push(`  ${r}`);
    }
    lines.push("");
    lines.push("Referral:");
    if (profile.needsMedicalCoordination || profile.severeSymptoms) {
      lines.push("  Psychiatry if symptoms persist or escalate");
    } else {
      lines.push("  Psychiatry if symptoms escalate");
    }
    if (profile.hasSubstance) {
      lines.push("  SUD specialty services if relapse severity warrants");
    }
    lines.push("");
    lines.push("Safety:");
    if (profile.hasSelfHarmRisk) {
      lines.push("  Continue monitoring SI/HI each session: update safety plan as needed");
    } else {
      lines.push("  Continue monitoring SI (currently denied)");
    }
    return lines.join("\n");
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
    const goals = [];
    const objectives = [];
    if (profile.hasTrauma && profile.hasAnxiety) {
      goals.push("Reduce anxiety symptoms related to trauma");
    } else if (profile.hasAnxiety) {
      goals.push("Reduce anxiety and worry");
    }
    if (profile.hasDepression) {
      goals.push("Improve mood and energy");
    }
    if (profile.hasAnxiety || profile.hasTrauma) {
      goals.push("Decrease avoidance and increase functioning");
    }
    if (profile.hasSubstance) {
      goals.push("Address substance use as coping");
    }
    if (profile.hasSelfHarmRisk || profile.hasEmotionDysregulation) {
      goals.push("Strengthen distress tolerance and safety");
    }
    if (!goals.length) {
      goals.push("Clarify symptom pattern and restore functioning");
    }
    goals.push("Restore baseline functioning");
    objectives.push("Review diagnostic timeline and current impairment (session 1-2)");
    if (profile.hasSelfHarmRisk) {
      objectives.push("Update safety plan (each session)");
    }
    if (profile.hasSubstance) {
      objectives.push("Assess motivation, use pattern, and relapse risk (session 1-2)");
    }
    if (profile.hasEmotionDysregulation) {
      objectives.push("Introduce one DBT coping skill for between-session use (session 2)");
    }
    if (profile.hasDepression || profile.hasAnxiety) {
      objectives.push("Assign one behavioral practice or symptom-monitoring task (session 2)");
    }
    objectives.push("Finalize measurable treatment goals (session 2-3)");
    const lines = [];
    lines.push("Goals:");
    for (const g of unique2(goals).slice(0, 6)) {
      lines.push(`  ${g}`);
    }
    lines.push("");
    lines.push("Objectives:");
    for (const o of unique2(objectives).slice(0, 6)) {
      lines.push(`  ${o}`);
    }
    return lines.join("\n");
  }
  async function computeGuidance(intake, diagnosticImpressions) {
    const profile = buildProfile(intake, diagnosticImpressions);
    const resourceIds = selectResourceIds(profile);
    const treatmentQueries = buildQueries(profile);
    const formulationQueries = buildFormulationQueries(profile, diagnosticImpressions);
    const [formulationResults, treatmentResults] = await Promise.all([
      Promise.all(
        formulationQueries.map(
          (query) => searchClinicalKnowledge(query, {
            limit: 3,
            resourceIds: selectFormulationResourceIds(profile)
          })
        )
      ).then((results) => results.flat()),
      Promise.all(
        treatmentQueries.map(
          (query) => searchClinicalKnowledge(query, {
            limit: 4,
            resourceIds
          })
        )
      ).then((results) => results.flat())
    ]);
    const searchResults = [...formulationResults, ...treatmentResults].sort((a, b) => b.score - a.score);
    const modalities = recommendModalities(profile);
    return {
      modalities,
      formulation: buildFormulation(profile, modalities, diagnosticImpressions),
      goals: buildGoals(profile),
      interventions: buildInterventions(profile),
      frequency: buildFrequency(profile),
      referrals: buildReferrals(intake, profile),
      plan: buildPlan(profile),
      references: dedupeReferences(searchResults),
      queries: [...formulationQueries, ...treatmentQueries]
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
      diagnoses: diagnosticImpressions.map((impression) => ({
        id: impression.disorderId,
        name: impression.name,
        confidence: impression.confidence,
        reasoning: impression.diagnosticReasoning ?? "",
        evidence: impression.criteriaEvidence,
        notes: impression.clinicianNotes ?? ""
      }))
    });
  }
  async function buildClinicalGuidance(intake, diagnosticImpressions = []) {
    const key = buildCacheKey(intake, diagnosticImpressions);
    if (!guidanceCache.has(key)) {
      guidanceCache.set(key, computeGuidance(intake, diagnosticImpressions));
    }
    return guidanceCache.get(key);
  }

  // src/lib/deidentify.ts
  function buildPhiPatterns(intake) {
    const patterns = [];
    let dateCounter = 0;
    function addIfPresent(value, token) {
      const trimmed = value?.trim();
      if (!trimmed || trimmed.length < 2) return;
      if (/^(no|none|n\/a|na|denied|denies|negative|yes|y)$/i.test(trimmed)) return;
      patterns.push({ pattern: trimmed, token });
    }
    const fullName = [intake.firstName, intake.lastName].filter(Boolean).join(" ").trim();
    if (fullName) addIfPresent(fullName, "[CLIENT_1]");
    if (intake.fullName && intake.fullName !== fullName) addIfPresent(intake.fullName, "[CLIENT_1]");
    if (intake.firstName && intake.firstName.length >= 2) addIfPresent(intake.firstName, "[CLIENT_FIRST]");
    if (intake.lastName && intake.lastName.length >= 2) addIfPresent(intake.lastName, "[CLIENT_LAST]");
    if (intake.dob) {
      addIfPresent(intake.dob, "[DOB_1]");
      const dobDate = new Date(intake.dob);
      if (!Number.isNaN(dobDate.getTime())) {
        const isoDate = dobDate.toISOString().split("T")[0];
        addIfPresent(isoDate, "[DOB_1]");
        const mmddyyyy = `${String(dobDate.getMonth() + 1).padStart(2, "0")}/${String(dobDate.getDate()).padStart(2, "0")}/${dobDate.getFullYear()}`;
        addIfPresent(mmddyyyy, "[DOB_1]");
      }
    }
    if (intake.address.raw) addIfPresent(intake.address.raw, "[LOCATION_1]");
    if (intake.address.street) addIfPresent(intake.address.street, "[LOCATION_STREET]");
    if (intake.address.city && intake.address.city.length >= 3) addIfPresent(intake.address.city, "[LOCATION_CITY]");
    if (intake.address.zip) addIfPresent(intake.address.zip, "[LOCATION_ZIP]");
    if (intake.phone) addIfPresent(intake.phone, "[PHONE_STRIPPED]");
    if (intake.email) addIfPresent(intake.email, "[EMAIL_STRIPPED]");
    if (intake.emergencyContact) addIfPresent(intake.emergencyContact, "[EMERGENCY_CONTACT_STRIPPED]");
    if (intake.insuranceCompany) addIfPresent(intake.insuranceCompany, "[INSURANCE_STRIPPED]");
    if (intake.memberId) addIfPresent(intake.memberId, "[MRN_STRIPPED]");
    if (intake.groupNumber) addIfPresent(intake.groupNumber, "[GROUP_STRIPPED]");
    if (intake.occupation && intake.occupation.length > 20) {
      addIfPresent(intake.occupation, "[EMPLOYER_1]");
    }
    if (intake.signedBy) addIfPresent(intake.signedBy, "[PROVIDER_1]");
    if (intake.formDate) {
      dateCounter++;
      addIfPresent(intake.formDate, `[DATE_${dateCounter}]`);
    }
    if (intake.signedAt) {
      dateCounter++;
      addIfPresent(intake.signedAt, `[DATE_${dateCounter}]`);
    }
    if (intake.clientId) addIfPresent(intake.clientId, "[CLIENT_ID_STRIPPED]");
    if (intake.prescribingMD) addIfPresent(intake.prescribingMD, "[PROVIDER_MD]");
    if (intake.primaryCarePhysician) addIfPresent(intake.primaryCarePhysician, "[PROVIDER_PCP]");
    patterns.sort((a, b) => b.pattern.length - a.pattern.length);
    return patterns;
  }
  var DATE_PATTERN = /\b(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}|\w+ \d{1,2},?\s*\d{4})\b/g;
  var PHONE_PATTERN = /\b(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})\b/g;
  var EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  var SSN_PATTERN = /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g;
  function deidentify(text, intake) {
    if (!text) return { sanitized: "", mapping: {} };
    const mapping = {};
    let sanitized = text;
    if (intake) {
      const patterns = buildPhiPatterns(intake);
      for (const { pattern, token } of patterns) {
        const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(escaped, "gi");
        if (regex.test(sanitized)) {
          if (!token.includes("STRIPPED")) {
            mapping[token] = pattern;
          }
          sanitized = sanitized.replace(regex, token);
        }
      }
    }
    let dateCounter = Object.keys(mapping).filter((k) => k.startsWith("[DATE_")).length;
    sanitized = sanitized.replace(DATE_PATTERN, (match) => {
      if (match.startsWith("[")) return match;
      dateCounter++;
      const token = `[DATE_${dateCounter}]`;
      mapping[token] = match;
      return token;
    });
    sanitized = sanitized.replace(PHONE_PATTERN, "[PHONE_STRIPPED]");
    sanitized = sanitized.replace(EMAIL_PATTERN, "[EMAIL_STRIPPED]");
    sanitized = sanitized.replace(SSN_PATTERN, "[SSN_STRIPPED]");
    sanitized = sanitized.replace(/\[PHONE_STRIPPED\]/g, "").replace(/\[EMAIL_STRIPPED\]/g, "").replace(/\[SSN_STRIPPED\]/g, "").replace(/\[MRN_STRIPPED\]/g, "").replace(/\[GROUP_STRIPPED\]/g, "").replace(/\[INSURANCE_STRIPPED\]/g, "").replace(/\[EMERGENCY_CONTACT_STRIPPED\]/g, "").replace(/\[CLIENT_ID_STRIPPED\]/g, "").replace(/\s{2,}/g, " ").trim();
    return { sanitized, mapping };
  }
  function reidentify(text, mapping) {
    if (!text || !Object.keys(mapping).length) return text;
    let result = text;
    const tokens = Object.keys(mapping).sort((a, b) => b.length - a.length);
    for (const token of tokens) {
      const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      result = result.replace(new RegExp(escaped, "g"), mapping[token]);
    }
    return result;
  }
  async function saveDeidentifyMapping(mapping) {
    await chrome.storage.session.set({ spn_deid_mapping: mapping });
  }

  // src/lib/openai-client.ts
  var OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
  var GENERATE_TIMEOUT_MS = 12e4;
  async function checkOpenAIHealth(apiKey) {
    if (!apiKey) return false;
    try {
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(5e3)
      });
      return res.ok;
    } catch {
      return false;
    }
  }
  async function generateOpenAICompletion(prompt, system, model, apiKey) {
    const messages = [
      { role: "system", content: system },
      { role: "user", content: prompt }
    ];
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GENERATE_TIMEOUT_MS);
    try {
      const res = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.2,
          max_tokens: 4096,
          stream: true
        }),
        signal: controller.signal
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`OpenAI returned ${res.status}: ${text.slice(0, 200)}`);
      }
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body from OpenAI");
      const decoder = new TextDecoder();
      let fullResponse = "";
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") return fullResponse;
          try {
            const chunk = JSON.parse(data);
            const content = chunk.choices?.[0]?.delta?.content;
            if (content) fullResponse += content;
          } catch {
          }
        }
      }
      return fullResponse;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  async function generateOpenAICompletionSync(prompt, system, model, apiKey) {
    const messages = [
      { role: "system", content: system },
      { role: "user", content: prompt }
    ];
    const res = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
        max_tokens: 4096
      }),
      signal: AbortSignal.timeout(GENERATE_TIMEOUT_MS)
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`OpenAI returned ${res.status}: ${text.slice(0, 200)}`);
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("OpenAI returned empty response");
    if (data.usage) {
      console.log("[SPN] OpenAI usage:", data.usage);
    }
    return content;
  }

  // src/lib/diagnostic-llm.ts
  var DEFAULT_MODEL = "gpt-4o-mini";
  var DEFAULT_MAX_CRITERIA_CHARS = 4e3;
  var PICK_SYSTEM = `You are a licensed clinical psychologist doing DSM-5-TR differential diagnosis from an intake packet.

You will receive:
1. Patient intake + SimplePractice AI note content (de-identified; names and dates replaced with tokens).
2. A roster of 161 DSM-5-TR disorders (id, name, chapter, ICD-10 code).

Pick 3-5 disorders that best fit this presentation. Return strict JSON only:

{
  "candidates": [
    { "disorderId": "<exact id from roster>", "confidence": "high" | "moderate" | "low", "reasoning": "<one sentence>" }
  ]
}

Hard rules:
- Only use disorderIds that appear in the roster. No inventions.
- Do NOT diagnose from a single symptom. Require a coherent clinical pattern.
- Cap at 5 candidates. Prefer fewer strong picks over many weak ones.
- If the intake suggests a medical workup is still relevant (sexual, somatic, neurologic), you may still list the disorder \u2014 note rule-outs in the reasoning.
- If trauma-related symptoms are present but trauma exposure is not clearly documented, do NOT include PTSD.
- Respond with JSON only. No prose outside the JSON. No markdown fences.`;
  var MATCH_SYSTEM = `You are a licensed clinical psychologist doing DSM-5-TR criterion-by-criterion evaluation.

You will receive:
1. Patient intake + AI note content (de-identified).
2. A short list of candidate disorders, each with verbatim DSM-5-TR criteria text.

For each disorder, evaluate each lettered criterion (A, B, C, \u2026) and return strict JSON only:

{
  "results": [
    {
      "disorderId": "<id>",
      "confidence": "high" | "moderate" | "low",
      "reasoning": "<2-3 sentences synthesizing the evidence>",
      "criteriaEval": [
        {
          "letter": "A",
          "criterionText": "<short paraphrase or first sentence of the criterion, <= 160 chars>",
          "status": "met" | "likely" | "unclear" | "not_met",
          "evidence": "<one sentence from intake, <= 200 chars, or 'No evidence in intake'>"
        }
      ],
      "ruleOuts": ["<differential 1>", "<differential 2>"]
    }
  ]
}

Status rules:
- "met": direct intake or assessment evidence clearly satisfies the criterion.
- "likely": partial or inferred evidence; needs clinician confirmation.
- "unclear": intake is silent; a direct question is needed.
- "not_met": intake contradicts, denies, or fails a required threshold.

Do NOT hallucinate durations or thresholds. If the DSM criterion requires "6 months or more" and the intake says "4 months", mark the duration criterion "not_met" (or "unclear" if duration is not stated).

Confidence calibration:
- "high" requires the majority of required criteria rated "met" with supporting evidence.
- "moderate" requires most criteria met or likely with minor gaps.
- "low" is appropriate when trauma exposure, duration, or functional impairment is unclear.

Respond with JSON only. No prose outside the JSON. No markdown fences.`;
  function formatAssessment(label, assessment, maxScore) {
    if (!assessment) return null;
    const score = maxScore ? `${assessment.totalScore}/${maxScore}` : `${assessment.totalScore}`;
    const sev = assessment.severity ? ` (${assessment.severity})` : "";
    const diff = assessment.difficulty ? `, impairment: ${assessment.difficulty}` : "";
    return `${label}: ${score}${sev}${diff}`;
  }
  function buildIntakeNarrative(intake) {
    const parts = [];
    const age = intake.age;
    if (age) parts.push(`Age: ${age}`);
    if (intake.sex) parts.push(`Sex: ${intake.sex}`);
    if (intake.genderIdentity) parts.push(`Gender identity: ${intake.genderIdentity}`);
    if (intake.chiefComplaint) parts.push(`Chief complaint: ${intake.chiefComplaint}`);
    if (intake.presentingProblems) parts.push(`Presenting problems: ${intake.presentingProblems}`);
    if (intake.historyOfPresentIllness) parts.push(`HPI: ${intake.historyOfPresentIllness}`);
    if (intake.medicalHistory) parts.push(`Medical history: ${intake.medicalHistory}`);
    if (intake.priorTreatment) parts.push(`Prior mental-health treatment: ${intake.priorTreatment}`);
    if (intake.counselingGoals) parts.push(`Counseling goals: ${intake.counselingGoals}`);
    if (intake.suicidalIdeation) parts.push(`SI: ${intake.suicidalIdeation}`);
    if (intake.suicideAttemptHistory) parts.push(`Suicide attempt history: ${intake.suicideAttemptHistory}`);
    if (intake.homicidalIdeation) parts.push(`HI: ${intake.homicidalIdeation}`);
    if (intake.psychiatricHospitalization) parts.push(`Psychiatric hospitalization: ${intake.psychiatricHospitalization}`);
    if (intake.alcoholUse) parts.push(`Alcohol use: ${intake.alcoholUse}`);
    if (intake.drugUse) parts.push(`Drug use: ${intake.drugUse}`);
    if (intake.substanceUseHistory) parts.push(`Substance use history: ${intake.substanceUseHistory}`);
    if (intake.familyPsychiatricHistory) parts.push(`Family psychiatric history: ${intake.familyPsychiatricHistory}`);
    if (intake.familyMentalEmotionalHistory) parts.push(`Family mental/emotional history: ${intake.familyMentalEmotionalHistory}`);
    if (intake.maritalStatus) parts.push(`Marital status: ${intake.maritalStatus}`);
    if (intake.relationshipDescription) parts.push(`Relationship: ${intake.relationshipDescription}`);
    if (intake.livingArrangement) parts.push(`Living arrangement: ${intake.livingArrangement}`);
    if (intake.education) parts.push(`Education: ${intake.education}`);
    if (intake.occupation) parts.push(`Occupation: ${intake.occupation}`);
    if (intake.physicalSexualAbuseHistory) parts.push(`Physical/sexual abuse history: ${intake.physicalSexualAbuseHistory}`);
    if (intake.domesticViolenceHistory) parts.push(`Domestic violence history: ${intake.domesticViolenceHistory}`);
    if (intake.recentSymptoms) parts.push(`Recent symptoms: ${intake.recentSymptoms}`);
    if (intake.additionalSymptoms) parts.push(`Additional symptoms: ${intake.additionalSymptoms}`);
    if (intake.additionalInfo) parts.push(`Additional info / MSE: ${intake.additionalInfo}`);
    if (intake.overviewClinicalNote) parts.push(`Overview clinical note: ${intake.overviewClinicalNote}`);
    if (intake.manualNotes) parts.push(`Clinician manual notes: ${intake.manualNotes}`);
    const phq = formatAssessment("PHQ-9", intake.phq9, 27);
    if (phq) parts.push(phq);
    const gad = formatAssessment("GAD-7", intake.gad7, 21);
    if (gad) parts.push(gad);
    const cssrs = formatAssessment("C-SSRS", intake.cssrs);
    if (cssrs) parts.push(cssrs);
    const dass21 = formatAssessment("DASS-21", intake.dass21, 63);
    if (dass21) parts.push(dass21);
    if (intake.phq9?.items?.length) {
      const items = intake.phq9.items.filter((item) => item.score > 0).map((item) => `  - item ${item.number}: ${item.question.trim()} \u2014 ${item.response}`);
      if (items.length) parts.push(`PHQ-9 endorsed items:
${items.join("\n")}`);
    }
    if (intake.gad7?.items?.length) {
      const items = intake.gad7.items.filter((item) => item.score > 0).map((item) => `  - item ${item.number}: ${item.question.trim()} \u2014 ${item.response}`);
      if (items.length) parts.push(`GAD-7 endorsed items:
${items.join("\n")}`);
    }
    if (intake.rawQA?.length) {
      const bits = intake.rawQA.filter((p) => p.answer?.trim()).map((p) => `  - ${p.question}: ${p.answer}`);
      if (bits.length) parts.push(`Raw intake Q&A:
${bits.join("\n")}`);
    }
    return parts.join("\n");
  }
  function buildDisorderRoster() {
    return DSM5_DIAGNOSES_V2.map((d) => {
      const icd = d.icd10Code ? ` | ${d.icd10Code}` : "";
      return `- ${d.id} | ${d.name} | ${d.chapter}${icd}`;
    }).join("\n");
  }
  function clipCriteria(text, max) {
    if (text.length <= max) return text;
    return `${text.slice(0, max).trimEnd()}
... [truncated]`;
  }
  function extractJson(raw) {
    const stripped = raw.replace(/^```(?:json)?\s*/m, "").replace(/\s*```\s*$/m, "").trim();
    try {
      return JSON.parse(stripped);
    } catch {
      const match = stripped.match(/\{[\s\S]*\}/);
      if (!match) return null;
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
  }
  function sanitizeConfidence(value) {
    if (value === "high" || value === "moderate" || value === "low") return value;
    return "low";
  }
  function sanitizeStatus(value) {
    if (value === "met" || value === "likely" || value === "unclear" || value === "not_met") return value;
    return "unclear";
  }
  async function getLLMDiagnosticSuggestions(intake, opts) {
    if (!opts.apiKey) throw new Error("OpenAI API key is required");
    const model = opts.model || DEFAULT_MODEL;
    const maxCriteriaChars = opts.maxCriteriaChars ?? DEFAULT_MAX_CRITERIA_CHARS;
    const progress = opts.onProgress ?? (() => {
    });
    const narrative = buildIntakeNarrative(intake);
    const { sanitized, mapping } = deidentify(narrative, intake);
    progress("Pass 1: picking candidate disorders...");
    const roster = buildDisorderRoster();
    const pickUser = `=== PATIENT INTAKE (de-identified) ===
${sanitized}

=== DSM-5-TR DISORDER ROSTER (${DSM5_DIAGNOSES_V2.length} entries) ===
${roster}

Return JSON with 3-5 candidate disorderIds from the roster above.`;
    const pickRaw = await generateOpenAICompletionSync(pickUser, PICK_SYSTEM, model, opts.apiKey);
    const pickJson = extractJson(pickRaw);
    const candidates = (pickJson?.candidates ?? []).filter(
      (c) => typeof c?.disorderId === "string" && c.disorderId.length > 0
    );
    if (!candidates.length) {
      throw new Error(`Pass 1 returned no candidates. Raw output: ${pickRaw.slice(0, 300)}`);
    }
    const candidateEntries = candidates.map((c) => {
      const disorder = DSM5_DIAGNOSES_V2.find((d) => d.id === c.disorderId);
      return disorder ? { candidate: c, disorder } : null;
    }).filter((x) => x !== null);
    if (!candidateEntries.length) {
      throw new Error(`Pass 1 returned candidates but none matched the v2 roster: ${candidates.map((c) => c.disorderId).join(", ")}`);
    }
    progress(`Pass 1 got ${candidateEntries.length} matched candidates: ${candidateEntries.map((e) => e.disorder.id).join(", ")}`);
    const disordersSection = candidateEntries.map(
      (e) => `=== ${e.disorder.id} \u2014 ${e.disorder.name}${e.disorder.icd10Code ? " (" + e.disorder.icd10Code + ")" : ""} ===
${clipCriteria(e.disorder.criteriaText, maxCriteriaChars)}`
    ).join("\n\n");
    const matchUser = `=== PATIENT INTAKE (de-identified) ===
${sanitized}

=== CANDIDATE DISORDERS WITH DSM-5-TR CRITERIA ===
${disordersSection}

Evaluate each disorder criterion-by-criterion. Return JSON matching the schema in the system prompt.`;
    progress("Pass 2: evaluating criteria...");
    const matchRaw = await generateOpenAICompletionSync(matchUser, MATCH_SYSTEM, model, opts.apiKey);
    const matchJson = extractJson(matchRaw);
    const rawResults = matchJson?.results ?? [];
    if (!rawResults.length) {
      throw new Error(`Pass 2 returned no results. Raw output: ${matchRaw.slice(0, 300)}`);
    }
    const suggestions = [];
    for (const r of rawResults) {
      if (!r.disorderId) continue;
      const entry = candidateEntries.find((e) => e.disorder.id === r.disorderId);
      if (!entry) continue;
      const criteriaEval = (r.criteriaEval ?? []).map((c) => ({
        letter: typeof c.letter === "string" ? c.letter : "",
        criterionText: reidentify(typeof c.criterionText === "string" ? c.criterionText : "", mapping),
        status: sanitizeStatus(c.status),
        evidence: reidentify(typeof c.evidence === "string" ? c.evidence : "", mapping)
      }));
      suggestions.push({
        disorderId: r.disorderId,
        disorderName: entry.disorder.name,
        code: entry.disorder.icd10Code,
        chapter: entry.disorder.chapter,
        confidence: sanitizeConfidence(r.confidence),
        reasoning: reidentify(typeof r.reasoning === "string" ? r.reasoning : "", mapping),
        criteriaEval,
        ruleOuts: Array.isArray(r.ruleOuts) ? r.ruleOuts.filter((x) => typeof x === "string") : []
      });
    }
    if (!suggestions.length) {
      throw new Error("Pass 2 returned results but none could be mapped to candidates");
    }
    progress(`Done: ${suggestions.length} suggestions`);
    return suggestions;
  }

  // src/lib/ollama-client.ts
  var DEFAULT_ENDPOINT = "http://localhost:11434";
  var GENERATE_TIMEOUT_MS2 = 3e5;
  function buildOllamaErrorMessage(status, endpoint, details = "") {
    if (status === 403) {
      return [
        `Ollama blocked this Chrome extension at ${endpoint}.`,
        "Allow browser-extension origins by setting",
        "OLLAMA_ORIGINS=chrome-extension://*,moz-extension://*,safari-web-extension://*",
        "and restart Ollama."
      ].join(" ");
    }
    if (status === null) {
      return `Could not reach Ollama at ${endpoint}. Make sure Ollama is running and listening on that URL.`;
    }
    const suffix = details ? ` ${details}` : "";
    return `Ollama returned ${status} at ${endpoint}.${suffix}`.trim();
  }
  async function diagnoseOllamaEndpoint(endpoint = DEFAULT_ENDPOINT) {
    try {
      const res = await fetch(`${endpoint}/api/tags`, { signal: AbortSignal.timeout(5e3) });
      if (res.ok) {
        return { ok: true, status: res.status };
      }
      const text = await res.text().catch(() => "");
      return {
        ok: false,
        status: res.status,
        error: buildOllamaErrorMessage(res.status, endpoint, text.slice(0, 200))
      };
    } catch {
      return {
        ok: false,
        status: null,
        error: buildOllamaErrorMessage(null, endpoint)
      };
    }
  }
  async function checkOllamaHealth(endpoint = DEFAULT_ENDPOINT) {
    const diagnostic = await diagnoseOllamaEndpoint(endpoint);
    return diagnostic.ok;
  }
  async function generateCompletion(prompt, system, model, endpoint = DEFAULT_ENDPOINT) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GENERATE_TIMEOUT_MS2);
    try {
      const res = await fetch(`${endpoint}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          prompt,
          system,
          stream: true,
          options: {
            temperature: 0.2,
            num_predict: 4096,
            num_ctx: 16384
          }
        }),
        signal: controller.signal
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(buildOllamaErrorMessage(res.status, endpoint, text.slice(0, 200)));
      }
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body from Ollama");
      const decoder = new TextDecoder();
      let fullResponse = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        for (const line of text.split("\n")) {
          if (!line.trim()) continue;
          try {
            const chunk = JSON.parse(line);
            fullResponse += chunk.response;
            if (chunk.done) return fullResponse;
          } catch {
          }
        }
      }
      return fullResponse;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // src/lib/supervision-prompt.ts
  var MAX_TRANSCRIPT_WORDS = 4e3;
  var MAX_TOTAL_PROMPT_CHARS = 36e3;
  var SYSTEM_PROMPT = `You are a clinical supervision preparation assistant for a licensed psychologist. Generate a supervision prep agenda from session data and clinical context.

OUTPUT FORMAT: Return a valid JSON object with exactly four string keys:
{"caseSummary":"...","discussionQuestions":"...","blindSpotFlags":"...","modalityPrompts":"..."}

Do NOT wrap the JSON in markdown code fences. Return ONLY the raw JSON object.

SECTION REQUIREMENTS:

caseSummary: A 3-5 sentence anonymized case summary. Use "Client" instead of the client's name. Include presenting problems, active diagnoses, treatment modality, and current phase of treatment. Ground every sentence in data from the intake, treatment plan, or session content.

discussionQuestions: 3-5 questions for supervision discussion. Each question MUST cite a specific observation from the session transcript or session notes. Frame as open-ended clinical questions (e.g., "Client reported X during session \u2014 how might this inform..."). Questions should surface decision points, clinical dilemmas, or areas where the clinician wants input.

blindSpotFlags: 2-4 potential blind spots or areas the clinician may not be considering. Each blind spot MUST reference a specific data point from the intake, diagnoses, treatment plan, MSE, or transcript. Frame as considerations, not conclusions (e.g., "Client's history of X combined with current presentation of Y may warrant consideration of...").

modalityPrompts: 2-3 modality-specific prompts tied to the active treatment modalities listed in the treatment plan. Each prompt should connect the session content to a specific technique or framework from that modality (e.g., for CBT: "Client's automatic thought about X could be examined using a thought record..."). If no treatment modalities are specified, generate prompts based on evidence-based approaches relevant to the active diagnoses.

STYLE RULES:
- Frame everything as questions or considerations, NOT recommendations.
- This is a thinking aid to help the clinician prepare for supervision. Not a substitute for clinical supervision.
- Use "Client" throughout \u2014 never use the client's actual name.
- Be specific and grounded in session data \u2014 avoid generic supervision questions.
- Use plain clinical language, not academic or literary prose.`;
  function buildSupervisionPrompt(transcript, sessionNotes, intake, diagnosticImpressions, treatmentPlan, mseChecklist, prefs) {
    const sections = [];
    if (intake) {
      const contextLines = [];
      const name = [intake.firstName, intake.lastName].filter(Boolean).join(" ") || intake.fullName || "Client";
      contextLines.push(`Client: ${name}`);
      if (intake.dob) contextLines.push(`DOB: ${intake.dob}`);
      if (intake.sex) contextLines.push(`Sex: ${intake.sex}`);
      if (intake.genderIdentity) contextLines.push(`Gender identity: ${intake.genderIdentity}`);
      if (intake.race || intake.ethnicity) contextLines.push(`Race/ethnicity: ${[intake.race, intake.ethnicity].filter(Boolean).join(", ")}`);
      if (intake.occupation) contextLines.push(`Occupation: ${intake.occupation}`);
      if (intake.livingArrangement) contextLines.push(`Living arrangement: ${intake.livingArrangement}`);
      if (intake.maritalStatus) contextLines.push(`Marital status: ${intake.maritalStatus}`);
      if (intake.medications) contextLines.push(`Current medications: ${intake.medications}`);
      if (intake.chiefComplaint) contextLines.push(`Chief complaint (from intake): ${intake.chiefComplaint}`);
      if (intake.suicidalIdeation) contextLines.push(`SI history: ${intake.suicidalIdeation}`);
      if (intake.homicidalIdeation) contextLines.push(`HI history: ${intake.homicidalIdeation}`);
      if (intake.substanceUseHistory) contextLines.push(`Substance use: ${intake.substanceUseHistory}`);
      if (intake.medicalHistory) contextLines.push(`Medical history: ${intake.medicalHistory}`);
      if (intake.surgeries) contextLines.push(`Surgeries: ${intake.surgeries}`);
      if (intake.tbiLoc) contextLines.push(`TBI/LOC: ${intake.tbiLoc}`);
      if (contextLines.length > 1) {
        sections.push(`=== PATIENT CONTEXT ===
${contextLines.join("\n")}`);
      }
    }
    if (diagnosticImpressions.length > 0) {
      const diagLines = diagnosticImpressions.map((d) => {
        const parts = [`${d.code} ${d.name} (${d.confidence} confidence)`];
        if (d.diagnosticReasoning) parts.push(`  Reasoning: ${d.diagnosticReasoning}`);
        return parts.join("\n");
      });
      sections.push(`=== ACTIVE DIAGNOSES ===
${diagLines.join("\n")}`);
    }
    if (treatmentPlan && treatmentPlan.goals.length > 0) {
      const tpLines = [];
      if (treatmentPlan.treatmentFrequency) tpLines.push(`Frequency: ${treatmentPlan.treatmentFrequency}`);
      if (treatmentPlan.treatmentType) tpLines.push(`Type: ${treatmentPlan.treatmentType}`);
      for (const goal of treatmentPlan.goals) {
        tpLines.push(`Goal ${goal.goalNumber}: ${goal.goal} (Status: ${goal.status || "active"})`);
        for (const obj of goal.objectives) {
          tpLines.push(`  ${obj.id}: ${obj.objective}`);
        }
      }
      if (treatmentPlan.interventions.length > 0) {
        tpLines.push(`Interventions: ${treatmentPlan.interventions.join("; ")}`);
      }
      sections.push(`=== TREATMENT PLAN ===
${tpLines.join("\n")}`);
    }
    if (mseChecklist) {
      const mseLines = [];
      const fmt = (label, values) => {
        if (values.length > 0) mseLines.push(`${label}: ${values.join(", ")}`);
      };
      fmt("Appearance", mseChecklist.appearance);
      fmt("Behavior", mseChecklist.behavior);
      fmt("Speech", mseChecklist.speech);
      if (mseChecklist.mood) mseLines.push(`Mood (client's words): "${mseChecklist.mood}"`);
      fmt("Affect", mseChecklist.affect);
      fmt("Thought process", mseChecklist.thoughtProcess);
      fmt("Thought content", mseChecklist.thoughtContent);
      fmt("Perceptions", mseChecklist.perceptions);
      fmt("Cognition", mseChecklist.cognition);
      if (mseChecklist.insight) mseLines.push(`Insight: ${mseChecklist.insight}`);
      if (mseChecklist.judgment) mseLines.push(`Judgment: ${mseChecklist.judgment}`);
      sections.push(`=== MSE CHECKLIST (clinician observations) ===
${mseLines.join("\n")}`);
    }
    const trimmedNotes = sessionNotes.trim();
    if (trimmedNotes) {
      sections.push(`=== CLINICIAN SESSION NOTES ===
${trimmedNotes}`);
    }
    if (transcript && transcript.entries.length > 0) {
      const transcriptText = formatTranscript(transcript, prefs);
      sections.push(`=== SESSION TRANSCRIPT ===
${transcriptText}`);
    }
    const providerName = [prefs.providerFirstName, prefs.providerLastName].filter(Boolean).join(" ") || "Clinician";
    sections.push(
      `=== INSTRUCTIONS ===
Generate a supervision prep agenda for this session. The treating clinician is ${providerName}. Use "Client" instead of the client's name in all output. Each discussion question must reference specific session content. Each blind spot must cite a data point. Return ONLY valid JSON with keys: caseSummary, discussionQuestions, blindSpotFlags, modalityPrompts.`
    );
    let userPrompt = sections.join("\n\n");
    if (userPrompt.length > MAX_TOTAL_PROMPT_CHARS) {
      const transcriptIdx = sections.findIndex((s) => s.startsWith("=== SESSION TRANSCRIPT"));
      if (transcriptIdx >= 0) {
        sections[transcriptIdx] = "=== SESSION TRANSCRIPT ===\n[Transcript omitted \u2014 too large for context window. Supervision prep generated from session notes, MSE, and clinical context only.]";
        userPrompt = sections.join("\n\n");
      }
    }
    return {
      system: SYSTEM_PROMPT,
      user: userPrompt
    };
  }
  function formatTranscript(transcript, prefs) {
    const providerName = [prefs.providerFirstName, prefs.providerLastName].filter(Boolean).join(" ") || "Clinician";
    const allLines = transcript.entries.map((entry) => {
      const speaker = entry.speaker === "clinician" ? providerName : "Client";
      return `${speaker}: ${entry.text}`;
    });
    const totalWords = allLines.reduce((sum, line) => sum + line.split(/\s+/).length, 0);
    if (totalWords <= MAX_TRANSCRIPT_WORDS) {
      return allLines.join("\n");
    }
    const keepStart = Math.floor(allLines.length * 0.2);
    const keepEnd = Math.floor(allLines.length * 0.3);
    const startLines = allLines.slice(0, keepStart);
    const endLines = allLines.slice(-keepEnd);
    const skipped = allLines.length - keepStart - keepEnd;
    return [
      ...startLines,
      `
[... ${skipped} transcript lines omitted for length \u2014 focus on opening context above and session content below ...]
`,
      ...endLines
    ].join("\n");
  }

  // src/lib/supervision-generator.ts
  function getErrorMessage(err) {
    if (err instanceof Error) return err.message;
    return String(err);
  }
  function ensureArray(value) {
    if (Array.isArray(value)) return value.map(String);
    if (typeof value === "string") {
      return value.split(/\n/).map((line) => line.replace(/^[-*•\d.)\s]+/, "").trim()).filter(Boolean);
    }
    return [];
  }
  function parseJsonResponse(raw) {
    try {
      const obj = JSON.parse(raw);
      if (obj.caseSummary) {
        return {
          caseSummary: String(obj.caseSummary),
          discussionQuestions: ensureArray(obj.discussionQuestions),
          blindSpotFlags: ensureArray(obj.blindSpotFlags),
          modalityPrompts: ensureArray(obj.modalityPrompts)
        };
      }
    } catch {
    }
    const fenceMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (fenceMatch) {
      try {
        const obj = JSON.parse(fenceMatch[1]);
        if (obj.caseSummary) {
          return {
            caseSummary: String(obj.caseSummary),
            discussionQuestions: ensureArray(obj.discussionQuestions),
            blindSpotFlags: ensureArray(obj.blindSpotFlags),
            modalityPrompts: ensureArray(obj.modalityPrompts)
          };
        }
      } catch {
      }
    }
    return null;
  }
  function extractSections(raw) {
    const summaryMatch = raw.match(
      /(?:^|\n)\s*(?:Case Summary|CASE SUMMARY)[:\s]*\n?([\s\S]*?)(?=\n\s*(?:Discussion Questions|DISCUSSION QUESTIONS)[:\s]|\n\s*$)/i
    );
    const questionsMatch = raw.match(
      /(?:^|\n)\s*(?:Discussion Questions|DISCUSSION QUESTIONS)[:\s]*\n?([\s\S]*?)(?=\n\s*(?:Blind Spot Flags|BLIND SPOT FLAGS|Blind Spots)[:\s]|\n\s*$)/i
    );
    const blindSpotsMatch = raw.match(
      /(?:^|\n)\s*(?:Blind Spot Flags|BLIND SPOT FLAGS|Blind Spots)[:\s]*\n?([\s\S]*?)(?=\n\s*(?:Modality Prompts|MODALITY PROMPTS)[:\s]|\n\s*$)/i
    );
    const modalityMatch = raw.match(
      /(?:^|\n)\s*(?:Modality Prompts|MODALITY PROMPTS)[:\s]*\n?([\s\S]*?)$/i
    );
    if (summaryMatch) {
      return {
        caseSummary: summaryMatch[1].trim(),
        discussionQuestions: ensureArray(questionsMatch?.[1] ?? ""),
        blindSpotFlags: ensureArray(blindSpotsMatch?.[1] ?? ""),
        modalityPrompts: ensureArray(modalityMatch?.[1] ?? "")
      };
    }
    return null;
  }
  function buildPrepFromSections(sections, method = "llm") {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    return {
      caseSummary: sections.caseSummary,
      discussionQuestions: sections.discussionQuestions,
      blindSpotFlags: sections.blindSpotFlags,
      modalityPrompts: sections.modalityPrompts,
      generatedAt: now,
      generationMethod: method
    };
  }
  async function generateWithOpenAI(sessionNotes, transcript, treatmentPlan, intake, diagnosticImpressions, mseChecklist, prefs) {
    const model = prefs.openaiModel || "gpt-4o-mini";
    const { system, user } = buildSupervisionPrompt(
      transcript,
      sessionNotes,
      intake,
      diagnosticImpressions,
      treatmentPlan,
      mseChecklist,
      prefs
    );
    const { sanitized: sanitizedUser, mapping: userMapping } = deidentify(user, intake);
    const { sanitized: sanitizedSystem, mapping: systemMapping } = deidentify(system, intake);
    const fullMapping = { ...systemMapping, ...userMapping };
    await saveDeidentifyMapping(fullMapping);
    console.log("[SPN] Generating supervision prep with OpenAI (de-identified)...", {
      model,
      originalLength: user.length,
      sanitizedLength: sanitizedUser.length,
      tokensReplaced: Object.keys(fullMapping).length
    });
    const raw = await generateOpenAICompletion(sanitizedUser, sanitizedSystem, model, prefs.openaiApiKey);
    const reidentified = reidentify(raw, fullMapping);
    const parsed = parseJsonResponse(reidentified);
    if (!parsed) {
      console.warn("[SPN] Failed to parse OpenAI supervision response as JSON, attempting section extraction");
      const extracted = extractSections(reidentified);
      if (!extracted) return null;
      return buildPrepFromSections(extracted, "openai");
    }
    return buildPrepFromSections(parsed, "openai");
  }
  async function generateWithLLM(sessionNotes, transcript, treatmentPlan, intake, diagnosticImpressions, mseChecklist, prefs, model, endpoint) {
    const { system, user } = buildSupervisionPrompt(
      transcript,
      sessionNotes,
      intake,
      diagnosticImpressions,
      treatmentPlan,
      mseChecklist,
      prefs
    );
    console.log("[SPN] Generating supervision prep with Ollama...", { model, promptLength: user.length });
    const raw = await generateCompletion(user, system, model, endpoint);
    const parsed = parseJsonResponse(raw);
    if (!parsed) {
      console.warn("[SPN] Failed to parse LLM supervision response as JSON, attempting section extraction");
      const extracted = extractSections(raw);
      if (!extracted) return null;
      return buildPrepFromSections(extracted);
    }
    return buildPrepFromSections(parsed);
  }
  function buildRuleBasedPrep(sessionNotes, transcript, treatmentPlan, intake, diagnosticImpressions, mseChecklist) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const diagNames = diagnosticImpressions.map((d) => `${d.name} (${d.code})`).join(", ");
    const chiefComplaint = intake?.chiefComplaint || "";
    const notesSnippet = sessionNotes.slice(0, 300).trim();
    const summaryParts = [];
    if (diagNames) summaryParts.push(`Diagnoses: ${diagNames}.`);
    if (chiefComplaint) summaryParts.push(`Chief complaint: ${chiefComplaint}.`);
    if (notesSnippet) summaryParts.push(`Session notes excerpt: "${notesSnippet}..."`);
    const caseSummary = summaryParts.join(" ") || "No clinical data available for case summary.";
    const discussionQuestions = [];
    discussionQuestions.push("What treatment goals should be prioritized at this stage?");
    const hasSI = intake?.suicidalIdeation?.toLowerCase().includes("yes") || intake?.suicideAttemptHistory?.toLowerCase().includes("yes") || sessionNotes.toLowerCase().includes("suicidal") || sessionNotes.toLowerCase().includes("safety plan");
    if (hasSI) {
      discussionQuestions.push("How should safety planning be addressed given the client's SI history?");
    }
    const hasSubstanceUse = intake?.alcoholUse && !["none", "no", "never", "n/a", ""].includes(intake.alcoholUse.toLowerCase().trim()) || intake?.drugUse && !["none", "no", "never", "n/a", ""].includes(intake.drugUse.toLowerCase().trim()) || intake?.substanceUseHistory && !["none", "no", "never", "n/a", ""].includes(intake.substanceUseHistory.toLowerCase().trim());
    if (hasSubstanceUse) {
      discussionQuestions.push("What role is substance use playing in the clinical presentation?");
    }
    const hasTrauma = intake?.physicalSexualAbuseHistory?.toLowerCase().includes("yes") || intake?.domesticViolenceHistory?.toLowerCase().includes("yes") || sessionNotes.toLowerCase().includes("trauma");
    if (hasTrauma) {
      discussionQuestions.push("How should trauma history be integrated into the treatment approach?");
    }
    if (intake?.medications && intake.medications.toLowerCase() !== "none") {
      discussionQuestions.push("Are current medications adequately addressing symptoms? Is a prescriber consultation warranted?");
    }
    if (discussionQuestions.length < 3) {
      discussionQuestions.push("What therapeutic alliance factors should be monitored?");
    }
    if (discussionQuestions.length < 3) {
      discussionQuestions.push("Are there cultural or contextual factors influencing the presentation?");
    }
    const blindSpotFlags = [];
    if (intake?.phq9 && intake.phq9.totalScore >= 10 && !sessionNotes.toLowerCase().includes("depress")) {
      blindSpotFlags.push(
        `PHQ-9 score of ${intake.phq9.totalScore} (${intake.phq9.severity}) suggests depression, but session notes do not appear to address depressive symptoms.`
      );
    }
    if (intake?.gad7 && intake.gad7.totalScore >= 10 && !sessionNotes.toLowerCase().includes("anxi")) {
      blindSpotFlags.push(
        `GAD-7 score of ${intake.gad7.totalScore} (${intake.gad7.severity}) suggests anxiety, but session notes do not appear to address anxiety symptoms.`
      );
    }
    if (treatmentPlan?.goals) {
      for (const goal of treatmentPlan.goals) {
        const goalKeywords = goal.goal.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
        const addressed = goalKeywords.some((kw) => sessionNotes.toLowerCase().includes(kw));
        if (!addressed && goal.goal) {
          blindSpotFlags.push(
            `Treatment plan goal "${goal.goal.slice(0, 80)}" has no session notes addressing progress.`
          );
          break;
        }
      }
    }
    if (blindSpotFlags.length === 0) {
      blindSpotFlags.push("Review session for potential countertransference or unaddressed client concerns.");
      blindSpotFlags.push("Consider whether cultural factors are being adequately explored.");
    }
    const modalityPrompts = [];
    const diagLower = diagnosticImpressions.map((d) => d.name.toLowerCase()).join(" ");
    if (diagLower.includes("depress") || diagLower.includes("mdd")) {
      modalityPrompts.push("CBT: What cognitive distortions were identified? How is behavioral activation progressing?");
      modalityPrompts.push("What is the client's current activity level and engagement in pleasurable activities?");
    }
    if (diagLower.includes("ptsd") || diagLower.includes("trauma") || diagLower.includes("stress")) {
      modalityPrompts.push("Is the client ready for trauma processing, or is stabilization still needed?");
      modalityPrompts.push("What grounding or coping strategies have been established for distress tolerance?");
    }
    if (diagLower.includes("anxiety") || diagLower.includes("gad") || diagLower.includes("panic") || diagLower.includes("phobia")) {
      modalityPrompts.push("What exposure hierarchy has been developed? What avoidance patterns remain?");
      modalityPrompts.push("How is the client responding to relaxation training or cognitive restructuring?");
    }
    if (diagLower.includes("adhd") || diagLower.includes("attention")) {
      modalityPrompts.push("What executive functioning strategies have been implemented? How is the client managing organization and time?");
    }
    if (diagLower.includes("substance") || diagLower.includes("alcohol") || diagLower.includes("cannabis")) {
      modalityPrompts.push("What stage of change is the client in? Are motivational interviewing techniques appropriate?");
    }
    if (diagLower.includes("bipolar")) {
      modalityPrompts.push("Is mood charting being used? How is medication adherence?");
    }
    if (diagLower.includes("personality") || diagLower.includes("borderline")) {
      modalityPrompts.push("DBT: What distress tolerance skills have been taught? How is emotional regulation progressing?");
    }
    if (modalityPrompts.length === 0) {
      modalityPrompts.push("What therapeutic modality is being used and how is the client responding?");
      modalityPrompts.push("What interventions were most effective this session?");
    }
    return {
      caseSummary,
      discussionQuestions,
      blindSpotFlags,
      modalityPrompts,
      generatedAt: now,
      generationMethod: "rule-based"
    };
  }
  async function generateSupervisionPrep(sessionNotes, transcript, treatmentPlan, intake, diagnosticImpressions, mseChecklist, prefs) {
    const provider = prefs.llmProvider || "ollama";
    if (provider === "openai" && prefs.openaiApiKey) {
      const healthy2 = await checkOpenAIHealth(prefs.openaiApiKey);
      if (healthy2) {
        try {
          const prep = await generateWithOpenAI(
            sessionNotes,
            transcript,
            treatmentPlan,
            intake,
            diagnosticImpressions,
            mseChecklist,
            prefs
          );
          if (prep) return prep;
        } catch (err) {
          console.info("[SPN] OpenAI supervision generation failed, falling back:", getErrorMessage(err));
        }
      }
    }
    const endpoint = prefs.ollamaEndpoint || "http://localhost:11434";
    const model = prefs.ollamaModel || "llama3.1:8b";
    const healthy = await checkOllamaHealth(endpoint);
    if (healthy) {
      try {
        const prep = await generateWithLLM(
          sessionNotes,
          transcript,
          treatmentPlan,
          intake,
          diagnosticImpressions,
          mseChecklist,
          prefs,
          model,
          endpoint
        );
        if (prep) return prep;
      } catch (err) {
        const message = getErrorMessage(err);
        if (!message.includes("Ollama blocked this Chrome extension")) {
          console.info("[SPN] Ollama supervision generation fell back to rule-based:", message);
        }
      }
    }
    return buildRuleBasedPrep(sessionNotes, transcript, treatmentPlan, intake, diagnosticImpressions, mseChecklist);
  }

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
    if (intake.cssrs) {
      parts.push(`C-SSRS ${intake.cssrs.totalScore} yes (${intake.cssrs.severity || "summary not parsed"})`);
    }
    if (intake.dass21) {
      parts.push(`DASS-21 ${intake.dass21.totalScore} (${intake.dass21.severity || "summary not parsed"})`);
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
      intake.overviewClinicalNote.trim(),
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
      intake.overviewClinicalNote,
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
    const guidanceGoalLines = guidance.goals.split("\n").map((l) => l.trim()).filter((l) => l && !l.endsWith(":"));
    const mergedGoals = Array.from(
      /* @__PURE__ */ new Set([
        ...goals.length ? goals : ["Clarify presenting concerns and establish treatment goals."],
        ...guidanceGoalLines
      ])
    ).slice(0, 5);
    const guidanceInterventionLines = guidance.interventions.split("\n").map((l) => l.replace(/^\d+\.\s*/, "").trim()).filter((l) => l && !l.endsWith(":"));
    const mergedInterventions = Array.from(
      /* @__PURE__ */ new Set([
        ...buildInterventions2(intake),
        ...guidanceInterventionLines
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
        intake.overviewClinicalNote,
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

  // src/lib/soap-builder.ts
  var LOW_SIGNAL_LINES = /* @__PURE__ */ new Set([
    "common sense",
    "straight",
    "least homophobic",
    "tiktok"
  ]);
  function normalizeWhitespace2(value) {
    return value.replace(/\s+/g, " ").trim();
  }
  function splitLines2(value) {
    return value.replace(/\r\n/g, "\n").split(/\n+/).map((line) => sanitizeLine(line)).filter(Boolean);
  }
  function sanitizeLine(value) {
    return normalizeWhitespace2(value).replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/\b(\d+)x\s*\/?\s*week\b/gi, "$1 times per week").replace(/\b(\d+)x\b/gi, "$1 times").replace(/\b2x\b/gi, "twice").replace(/\b3x\b/gi, "3 times").replace(/\b4x\b/gi, "4 times").replace(/\b5x\b/gi, "5 times").replace(/\b6x\b/gi, "6 times").replace(/\bstriipper\b/gi, "stripper").replace(/\broofied\b/gi, "was drugged").replace(/\bAldo\b/g, "Also");
  }
  function unique3(values) {
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
  function firstNonEmpty3(...values) {
    for (const value of values) {
      const trimmed = value?.trim();
      if (trimmed) return trimmed;
    }
    return "";
  }
  function sentence(value) {
    const trimmed = normalizeWhitespace2(value).replace(/[.]+$/, "");
    return trimmed ? `${trimmed}.` : "";
  }
  function joinSentences(values) {
    return values.map((value) => sentence(value)).filter(Boolean).join(" ");
  }
  function formatList(values, conjunction = "and") {
    const cleaned = unique3(values.map((value) => normalizeWhitespace2(value)).filter(Boolean));
    if (!cleaned.length) return "";
    if (cleaned.length === 1) return cleaned[0];
    if (cleaned.length === 2) return `${cleaned[0]} ${conjunction} ${cleaned[1]}`;
    return `${cleaned.slice(0, -1).join(", ")}, ${conjunction} ${cleaned[cleaned.length - 1]}`;
  }
  function buildTranscriptText(transcript) {
    if (!transcript?.entries.length) return "";
    return transcript.entries.map((entry) => `${entry.speaker}: ${entry.text}`).join("\n");
  }
  function includesPattern(lines, pattern) {
    return lines.some((line) => pattern.test(line));
  }
  function extractQuotedPhrases(lines) {
    const phrases = [];
    for (const line of lines) {
      const matches = line.matchAll(/"([^"]{3,})"/g);
      for (const match of matches) {
        const phrase = normalizeWhitespace2(match[1]);
        if (phrase) phrases.push(phrase);
      }
    }
    return unique3(phrases);
  }
  function extractMoneySpent(lines) {
    for (const line of lines) {
      if (!/\bspent\b/i.test(line)) continue;
      const match = line.match(/\$?\s?(\d[\d,]*)/);
      if (!match) continue;
      const digits = match[1].replace(/,/g, "");
      const amount = Number.parseInt(digits, 10);
      if (!Number.isFinite(amount)) continue;
      return `$${amount.toLocaleString("en-US")}`;
    }
    return "";
  }
  function extractAbortionsCount(lines) {
    for (const line of lines) {
      const match = line.match(/\b(\d+)\s+abortions?\b/i);
      if (match) return match[1];
    }
    return "";
  }
  function lowerFirst(value) {
    if (!value) return value;
    return value.charAt(0).toLowerCase() + value.slice(1);
  }
  function formatGoalLabel(goal) {
    const raw = normalizeWhitespace2(goal.goal).replace(/[.]+$/, "");
    const simplified = raw.replace(/^reduce frequency and intensity of\s+/i, "reduce ").replace(/\bweekly\s+/i, "").replace(/^increase insight into how\s+/i, "increase insight into how ");
    return `Goal to ${lowerFirst(simplified)}`;
  }
  function formatAssessmentStatus(value) {
    const normalized = value.trim().toLowerCase();
    if (normalized === "limited progress noted") return "Limited progress";
    if (normalized === "some progress noted") return "Some progress";
    if (normalized === "good progress noted") return "Good progress";
    if (normalized === "progress remains under review") return "Progress remains under review";
    return value.trim() || "Progress remains under review";
  }
  function summarizeInterventions(interventions) {
    const cleaned = interventions.map((item) => item.replace(/\s+/g, " ").trim()).filter(Boolean);
    if (!cleaned.length) return "";
    const short = cleaned.map((item) => item.match(/\(([^)]+)\)/)?.[1]?.trim() ?? "");
    if (short.every(Boolean)) {
      return formatList(short);
    }
    return formatList(cleaned);
  }
  function hasClinicalKeyword(line) {
    return /\b(anxiety|anxious|anger|angry|fight|fights|argument|arguing|yell|yelled|yelling|job|partner|girlfriend|boyfriend|relationship|conflict|drink|drinking|alcohol|cannabis|marijuana|weed|roofied|drugged|bar|breathe|breathing|lifting|cycling|exercise|anger management|session|mse|affect|speech|thought|oriented|guilt|sad|miss|panic|fear|trigger)\b/i.test(line);
  }
  function isLowSignalLine(line) {
    const normalized = normalizeWhitespace2(line).toLowerCase();
    if (!normalized) return true;
    if (LOW_SIGNAL_LINES.has(normalized)) return true;
    if (/^[a-z]+(?:\s+[a-z]+)?$/i.test(normalized) && normalized.split(" ").length <= 2 && !hasClinicalKeyword(normalized)) {
      return true;
    }
    return normalized.split(" ").length < 3 && !hasClinicalKeyword(normalized);
  }
  function analyzeSessionNotes(lines) {
    const signals = {
      relationshipConflict: [],
      anxiety: [],
      substance: [],
      coping: [],
      support: [],
      objective: [],
      directQuotes: [],
      attachment: []
    };
    for (const rawLine of lines) {
      const line = sanitizeLine(rawLine);
      if (!line || isLowSignalLine(line)) continue;
      if ((line.match(/"/g) ?? []).length >= 2) {
        signals.directQuotes.push(line);
      }
      if (/\b(yell(?:ed|ing)?|fight|fights|argument|arguing|called? .*job|job .*times|meeting up|guy|girlfriend|boyfriend|partner|relationship|conflict|guilty|loser|dirty snake)\b/i.test(line)) {
        signals.relationshipConflict.push(line);
      }
      if (/\b(anxiety|anxious|panic|fear|trigger|spiky|distress|worry)\b/i.test(line)) {
        signals.anxiety.push(line);
      }
      if (/\b(drink|drinking|alcohol|bar|drugged|cannabis|marijuana|weed|joint|substance)\b/i.test(line)) {
        signals.substance.push(line);
      }
      if (/\b(breathe|breathing|cycling|lifting|exercise|class|anger management|track|log|journal|pause)\b/i.test(line)) {
        signals.coping.push(line);
      }
      if (/\b(contact|referral|Andrea|Grimshaw)\b/i.test(line)) {
        signals.support.push(line);
      }
      if (/\b(mse|appearance|affect|speech|behavior|thought|oriented|a&o|observed|presented|engaged|tearful|guarded|calm)\b/i.test(line)) {
        signals.objective.push(line);
      }
      if (/\b(miss her|miss him|miss them|birthday|valentine|tatted|tattoo|abortions?)\b/i.test(line)) {
        signals.attachment.push(line);
      }
    }
    return {
      relationshipConflict: unique3(signals.relationshipConflict),
      anxiety: unique3(signals.anxiety),
      substance: unique3(signals.substance),
      coping: unique3(signals.coping),
      support: unique3(signals.support),
      objective: unique3(signals.objective),
      directQuotes: unique3(signals.directQuotes),
      attachment: unique3(signals.attachment)
    };
  }
  function extractFrequency(lines) {
    for (const line of lines) {
      const match = line.match(/\b(twice|\d+\s+times?)\s+per\s+week\b/i);
      if (match) {
        const raw = match[0].toLowerCase();
        if (raw === "1 time per week" || raw === "1 times per week") return "once per week";
        if (raw === "2 times per week") return "twice per week";
        return raw;
      }
    }
    for (const line of lines) {
      const match = line.match(/\b(\d+)\s+times?\b/i);
      if (match) return `${match[1]} times`;
    }
    return "";
  }
  function extractCallCount(lines) {
    for (const line of lines) {
      const match = line.match(/\bcalled?.*job\s+(\d+)\s+times\b/i) ?? line.match(/\bcalled?.*job.*?(\d+)\s+times\b/i);
      if (match) return match[1];
    }
    return "";
  }
  function summarizeSubjective(lines, signals, transcript, intake) {
    const sentences = [];
    const clientTranscriptLines = transcript?.entries.filter((entry) => entry.speaker === "client").map((entry) => sanitizeLine(entry.text)).filter((line) => line && !isLowSignalLine(line)) ?? [];
    const conflictSource = unique3([
      ...signals.relationshipConflict,
      ...clientTranscriptLines.filter((line) => /\b(fight|argument|partner|girlfriend|boyfriend|relationship|job)\b/i.test(line))
    ]);
    const quotedPhrases = extractQuotedPhrases(lines);
    const moneySpent = extractMoneySpent(lines);
    const abortionsCount = extractAbortionsCount(lines);
    const hasTattooHistory = includesPattern(lines, /\b(tatted|tattoo)\b/i);
    const hasHazyMemory = includesPattern(lines, /\b(hazy memory|blurred memory|don't remember|memory)\b/i);
    const hasBasement = includesPattern(lines, /\bbasement\b/i);
    const hasSeparatedFromFriends = includesPattern(lines, /\bseparated from (his |her |their )?friends|away from (his |her |their )?friends\b/i);
    const hasTouching = includesPattern(lines, /\b(man touching|guy touching|someone touching|touched him|touched me)\b/i);
    const hasVideoFear = includesPattern(lines, /\bvideo\b/i);
    const hasOthersKnowFear = includesPattern(lines, /\bothers know|people know|know about this|people saw\b/i);
    const wantsToMoveForward = includesPattern(lines, /\bmove forward|moving forward|move on\b/i);
    const wantsLessDrinking = includesPattern(lines, /\bstop drinking|drink less|reduce drinking\b/i);
    const wantsExercise = includesPattern(lines, /\bcycle|cycling|lift|lifting|weights?\b/i);
    const keepMouthShut = includesPattern(lines, /\bkeep (my|his) mouth shut|shut your mouth\b/i);
    if (conflictSource.length) {
      const frequency = extractFrequency(conflictSource);
      if (frequency && signals.relationshipConflict.some((line) => /\bcalled?.*job\b/i.test(line))) {
        sentences.push(`Client reported ongoing conflict with partner, including yelling or arguments about ${frequency} and repeated calls to partner's workplace while upset`);
      } else if (frequency) {
        sentences.push(`Client reported ongoing conflict with partner, including yelling or arguments about ${frequency}`);
      } else {
        sentences.push("Client reported ongoing conflict and strain in the relationship");
      }
      if (keepMouthShut) {
        sentences.push("Client stated that even when he plans to keep his mouth shut, he often loses control, then yells, criticizes, and becomes defensive");
      } else if (signals.directQuotes.length) {
        sentences.push("Client described repeated criticism, accusations, and hurtful exchanges during arguments with partner");
      }
      if (quotedPhrases.length) {
        const quotedPreview = quotedPhrases.slice(0, 5).map((phrase) => `"${phrase}"`).join(", ");
        sentences.push(`Client identified triggers including statements such as ${quotedPreview}`);
      }
    }
    if (signals.anxiety.length) {
      if (signals.relationshipConflict.some((line) => /\bguy|meeting up\b/i.test(line))) {
        sentences.push("Client described strong anxiety and jealousy related to partner contact with another man");
      } else {
        sentences.push("Client described high anxiety during the week");
      }
    }
    if (moneySpent) {
      sentences.push(`Client shared that he spent ${moneySpent} on Valentine's Day and did not feel that the effort was reciprocated`);
    }
    if (hasTattooHistory || abortionsCount) {
      const historyParts = [];
      if (hasTattooHistory) historyParts.push("he has her name tattooed multiple times on his body");
      if (abortionsCount) historyParts.push(`they had ${abortionsCount} abortions together`);
      sentences.push(`Client also shared that ${formatList(historyParts)}`);
    }
    if (signals.substance.length) {
      if (signals.substance.some((line) => /\bdrugged|bar\b/i.test(line))) {
        if (hasHazyMemory || hasBasement || hasSeparatedFromFriends || hasTouching) {
          const incidentParts = [];
          if (hasHazyMemory) incidentParts.push("about 20 minutes of hazy memory");
          if (hasBasement) incidentParts.push("being in a basement");
          if (hasSeparatedFromFriends) incidentParts.push("being separated from friends");
          if (hasTouching) incidentParts.push("a man touching him");
          sentences.push(`Client also reported a recent incident in which he believes he was drugged at a bar, with ${formatList(incidentParts)}`);
        } else {
          sentences.push("Client also reported a recent incident in which he believes he was drugged at a bar");
        }
        if (hasVideoFear || hasOthersKnowFear) {
          sentences.push("Client shared anxiety that there may be a video of the incident or that others may know about it");
        }
      } else {
        sentences.push("Client also discussed ongoing alcohol and substance-use concerns");
      }
    }
    if (signals.attachment.length) {
      sentences.push("Client expressed ongoing hurt, attachment, and difficulty letting go of the relationship");
    }
    if (wantsToMoveForward || wantsLessDrinking || wantsExercise) {
      const changeGoals = [];
      if (wantsToMoveForward) changeGoals.push("move forward");
      if (wantsLessDrinking) changeGoals.push("drink less");
      if (wantsExercise) changeGoals.push("focus more on cycling and lifting weights");
      if (changeGoals.length) {
        sentences.push(`Client also stated that he wants to ${formatList(changeGoals)}`);
      }
    }
    if (!sentences.length) {
      const fallback = [
        firstNonEmpty3(intake?.chiefComplaint, intake?.presentingProblems),
        intake?.historyOfPresentIllness ?? ""
      ].map((value) => sentence(value)).filter(Boolean);
      return fallback.join(" ") || "Client discussed current symptoms and stressors during session.";
    }
    return joinSentences(sentences);
  }
  function summarizeObjective(lines, signals, intake) {
    const sentences = [];
    const hasAttachmentMarkers = signals.attachment.length > 0 || includesPattern(lines, /\b(tatted|tattoo|abortions?|valentine)\b/i);
    const wantsLessDrinking = includesPattern(lines, /\bstop drinking|drink less|reduce drinking\b/i);
    const wantsExercise = includesPattern(lines, /\bcycle|cycling|lift|lifting|weights?\b/i);
    if (signals.objective.length) {
      sentences.push(...signals.objective.slice(0, 2));
    } else {
      const reflectedThemes = [];
      if (signals.anxiety.length) reflectedThemes.push("anxiety");
      if (signals.relationshipConflict.length) {
        reflectedThemes.push("anger");
        reflectedThemes.push("jealousy");
        reflectedThemes.push("relationship stress");
      }
      if (hasAttachmentMarkers) reflectedThemes.push("attachment");
      if (signals.substance.length) reflectedThemes.push("alcohol-related risk");
      if (reflectedThemes.length) {
        sentences.push(`Session focused on ${formatList(reflectedThemes)}`);
      } else {
        sentences.push("Session focused on current symptoms and recent stressors");
      }
    }
    if (signals.coping.length) {
      const copingLabels = [];
      if (signals.coping.some((line) => /\bcycling|lifting|exercise|class\b/i.test(line))) {
        copingLabels.push("exercise");
      }
      if (signals.coping.some((line) => /\bbreathe|breathing\b/i.test(line))) {
        copingLabels.push("breathing skills");
      }
      if (signals.coping.some((line) => /\banger management\b/i.test(line))) {
        copingLabels.push("anger-management work");
      }
      if (copingLabels.length) {
        sentences.push(`Client identified ${formatList(copingLabels)} as coping efforts`);
      }
    }
    if (signals.relationshipConflict.some((line) => /\bcalled?.*job\b/i.test(line))) {
      sentences.push("Session notes suggest poor impulse control during relationship distress");
    }
    if (wantsLessDrinking || wantsExercise) {
      if (wantsLessDrinking && wantsExercise) {
        sentences.push("Clinician reflected client's stated desire to drink less and increase exercise");
      } else if (wantsLessDrinking) {
        sentences.push("Clinician reflected client's stated desire to drink less");
      } else if (wantsExercise) {
        sentences.push("Clinician reflected client's stated desire to increase exercise");
      }
    }
    if (signals.objective.length === 0) {
      sentences.push("No formal MSE findings or rating scales were documented in the session notes");
    }
    const measurementLines = [];
    if (signals.objective.some((line) => /\bphq\b/i.test(line)) && intake?.phq9) {
      measurementLines.push(`PHQ-9 previously captured at ${intake.phq9.totalScore}/27 (${intake.phq9.severity})`);
    }
    if (signals.objective.some((line) => /\bgad\b/i.test(line)) && intake?.gad7) {
      measurementLines.push(`GAD-7 previously captured at ${intake.gad7.totalScore}/21 (${intake.gad7.severity})`);
    }
    return joinSentences([...sentences, ...measurementLines]);
  }
  function inferGoalFocus(goal) {
    const text = `${goal.goal} ${goal.objectives.map((objective) => objective.objective).join(" ")}`.toLowerCase();
    if (/\b(alcohol|cannabis|marijuana|weed|substance|impulsivity)\b/.test(text)) return "substance";
    if (/\b(verbal|fight|argument|conflict|partner|communication|anger)\b/.test(text)) return "conflict";
    if (/\b(anxiety|panic|fear|worry)\b/.test(text)) return "anxiety";
    if (/\b(mood|depression|sadness|irritability)\b/.test(text)) return "mood";
    return "general";
  }
  function statusFromGoal(goal, focus, signals) {
    const improvementSource = [
      ...signals.relationshipConflict,
      ...signals.anxiety,
      ...signals.substance,
      ...signals.coping
    ].join(" ").toLowerCase();
    if (/\b(better|improved|less|fewer|calmer|stopped|reduced)\b/.test(improvementSource)) {
      return "Some progress noted";
    }
    if (focus === "conflict" && signals.relationshipConflict.length) return "Limited progress noted";
    if (focus === "substance" && (signals.substance.length || signals.relationshipConflict.some((line) => /\bcalled?.*job\b/i.test(line)))) {
      return "Limited progress noted";
    }
    if ((focus === "anxiety" || focus === "mood") && signals.anxiety.length) return "Limited progress noted";
    const existing = goal.status.trim().toLowerCase();
    if (existing === "no improvement") return "Limited progress noted";
    if (existing === "some improvement") return "Some progress noted";
    if (existing === "significant improvement") return "Good progress noted";
    if (goal.status.trim()) return sentence(goal.status).replace(/[.]$/, "");
    return "Progress remains under review";
  }
  function evidenceForGoal(goal, focus, signals) {
    switch (focus) {
      case "conflict":
        if (signals.relationshipConflict.length) {
          const frequency = extractFrequency(signals.relationshipConflict);
          const callCount = extractCallCount(signals.relationshipConflict);
          if (frequency && callCount) {
            return `Client continues to report yelling or verbal conflict about ${frequency}, along with repeated calls to partner's workplace (${callCount} times) while upset`;
          }
          if (frequency) {
            return `Client continues to report yelling or verbal conflict about ${frequency}`;
          }
          return "Client continues to report jealousy, arguments, and difficulty slowing down during relationship stress";
        }
        return "Relationship stress remains a focus of treatment";
      case "substance":
        if (signals.substance.length) {
          const mentionsStoppingAlcohol = signals.substance.some((line) => /\bstop drinking\b/i.test(line));
          const barRisk = signals.substance.some((line) => /\bdrugged|bar\b/i.test(line));
          const impulsiveConflict = signals.relationshipConflict.some((line) => /\bcalled?.*job\b/i.test(line));
          if (barRisk && impulsiveConflict) {
            return "Session included alcohol-related risk and ongoing impulsive behavior during conflict; insight into how substance use may worsen mood and reactions remains limited";
          }
          if (signals.substance.some((line) => /\bdrugged|bar\b/i.test(line))) {
            return mentionsStoppingAlcohol ? "Session included alcohol-related risk, including being drugged at a bar, and the need to reduce drinking remained part of the discussion" : "Session included alcohol-related risk, including discussion of being drugged while at a bar";
          }
          return "The link between alcohol or cannabis use, mood, and conflict still needs more work";
        }
        if (signals.relationshipConflict.some((line) => /\bcalled?.*job\b/i.test(line))) {
          return "Ongoing impulsive behavior during conflict suggests that insight into triggers and worsening factors is still limited";
        }
        if (/\b(alcohol|cannabis|marijuana|weed|substance)\b/i.test(goal.goal)) {
          return "No clear update on alcohol or cannabis tracking was documented this session, and this treatment need remains active";
        }
        return "The link between substance use, mood, and conflict continues to need review";
      case "anxiety":
        if (signals.anxiety.length) {
          return "Anxiety remains elevated in the context of current stressors";
        }
        return "Anxiety symptoms continue to need monitoring";
      case "mood":
        if (signals.anxiety.length || signals.relationshipConflict.length) {
          return "Mood symptoms remain tied to ongoing relationship stress and emotional reactivity";
        }
        return "Mood symptoms continue to need monitoring";
      default:
        return "Current session content was reviewed in relation to this treatment goal";
    }
  }
  function summarizeAssessment(lines, signals, treatmentPlan, diagnosticImpressions, intake) {
    const parts = [];
    const wantsToMoveForward = includesPattern(lines, /\bmove forward|moving forward|move on\b/i);
    const hasNoAttachmentStatement = includesPattern(lines, /\bno attachment|have no attachment\b/i);
    const hasGoodManIdentity = includesPattern(lines, /\bgood man\b/i) && includesPattern(lines, /\bpoint of view\b/i);
    const hasAttachmentHistory = signals.attachment.length > 0 || includesPattern(lines, /\b(tatted|tattoo|abortions?|valentine)\b/i);
    const hasFrustrationMarkers = includesPattern(lines, /\b(frustrat|angry|hurt|got nothing)\b/i) || Boolean(extractMoneySpent(lines));
    const hasBarRisk = includesPattern(lines, /\bdrugged|bar\b/i);
    const hasBarAnxiety = includesPattern(lines, /\bvideo\b/i) || includesPattern(lines, /\bothers know|people know|know about this|people saw\b/i);
    const wantsLessDrinking = includesPattern(lines, /\bstop drinking|drink less|reduce drinking\b/i);
    const wantsExercise = includesPattern(lines, /\bcycle|cycling|lift|lifting|weights?\b/i);
    if (treatmentPlan?.goals.length) {
      for (const goal of treatmentPlan.goals) {
        const focus = inferGoalFocus(goal);
        const status = statusFromGoal(goal, focus, signals);
        const goalParts = [`${formatGoalLabel(goal)}: ${formatAssessmentStatus(status)}.`];
        if (focus === "conflict") {
          if (signals.relationshipConflict.length) {
            goalParts.push("Client continues to report frequent conflict, emotional reactivity, and repeated contact attempts during distress.");
          } else {
            goalParts.push(`${sentence(evidenceForGoal(goal, focus, signals))}`);
          }
          if ((wantsToMoveForward || hasNoAttachmentStatement) && signals.relationshipConflict.some((line) => /\bcalled?.*job\b/i.test(line))) {
            goalParts.push("Clinician reflected client's frustration and highlighted the mismatch between client's stated wish to move on and have no attachment and his current behavior, including repeated calls, anger about partner seeing another man, and ongoing preoccupation with the relationship.");
          } else if (hasFrustrationMarkers) {
            goalParts.push("Clinician reflected client's frustration with the ongoing relationship dynamic.");
          }
          if (hasGoodManIdentity) {
            goalParts.push(`Clinician also reflected that client's identity as a "good man" appears strongly tied to her point of view, which may be reinforcing reactivity and difficulty disengaging.`);
          }
          if (hasAttachmentHistory) {
            goalParts.push("Clinician validated the difficulty of breaking away from the relationship given the attachment and shared history.");
          }
        } else if (focus === "substance") {
          if (hasBarRisk && hasBarAnxiety) {
            goalParts.push("Session included alcohol-related risk and anxiety related to the recent bar incident.");
          } else if (hasBarRisk) {
            goalParts.push("Session included alcohol-related risk.");
          } else {
            goalParts.push(`${sentence(evidenceForGoal(goal, focus, signals))}`);
          }
          let insightSentence = "Insight into how alcohol use may worsen judgment, impulsivity, emotional reactivity, and vulnerability remains limited";
          if (wantsLessDrinking || wantsExercise) {
            const selfCareParts = [];
            if (wantsLessDrinking) selfCareParts.push("reduce drinking");
            if (wantsExercise) selfCareParts.push("improve self-care through exercise");
            insightSentence += `, though client did express desire to ${formatList(selfCareParts)}`;
          }
          goalParts.push(sentence(insightSentence));
        } else {
          goalParts.push(sentence(evidenceForGoal(goal, focus, signals)));
        }
        parts.push(goalParts.join(" "));
      }
    }
    const diagnosisSummary = diagnosticImpressions.length ? diagnosticImpressions.map((impression) => `${impression.name}${impression.code ? ` (${impression.code})` : ""}`).join(", ") : treatmentPlan?.diagnoses.length ? treatmentPlan.diagnoses.map((diagnosis) => `${diagnosis.description}${diagnosis.code ? ` (${diagnosis.code})` : ""}`).join(", ") : "";
    if (diagnosisSummary) {
      parts.push(`Current presentation remains consistent with working diagnoses of ${diagnosisSummary}.`);
    } else if (firstNonEmpty3(intake?.chiefComplaint, intake?.presentingProblems)) {
      parts.push(`Clinical focus remains on ${firstNonEmpty3(intake?.chiefComplaint, intake?.presentingProblems)}.`);
    }
    return parts.join("\n\n") || "Assessment should be updated in relation to the treatment plan and current session themes.";
  }
  function summarizePlan(lines, signals, treatmentPlan) {
    const planItems = [];
    const wantsLessDrinking = includesPattern(lines, /\bstop drinking|drink less|reduce drinking\b/i);
    const wantsExercise = includesPattern(lines, /\bcycle|cycling|lift|lifting|weights?\b/i);
    if (treatmentPlan?.treatmentFrequency) {
      planItems.push(`Continue ${treatmentPlan.treatmentFrequency} psychotherapy`);
    } else {
      planItems.push("Continue psychotherapy as scheduled");
    }
    const objectiveText = treatmentPlan?.goals.flatMap((goal) => goal.objectives).map((objective) => objective.objective.toLowerCase()) ?? [];
    if (objectiveText.some((text) => /chain analysis/.test(text)) || signals.relationshipConflict.length) {
      planItems.push("Review recent conflicts with chain analysis");
    }
    if (objectiveText.some((text) => /distress tolerance|practice/.test(text)) || signals.coping.length) {
      if (signals.relationshipConflict.some((line) => /\bcalled?.*job\b/i.test(line))) {
        planItems.push("Practice pause, breathing, and distress-tolerance skills before calling or confronting partner when upset");
      } else {
        planItems.push("Practice pause, breathing, and distress-tolerance skills during conflict");
      }
    }
    if (objectiveText.some((text) => /track|log|cannabis|alcohol/.test(text)) || signals.substance.length) {
      planItems.push("Track alcohol and cannabis use, mood, irritability, and conflict episodes between sessions");
    }
    if (wantsLessDrinking || wantsExercise) {
      const healthierCoping = [];
      if (includesPattern(lines, /\bcycle|cycling\b/i)) healthierCoping.push("cycling");
      if (includesPattern(lines, /\blift|lifting|weights?\b/i)) healthierCoping.push("lifting");
      if (wantsLessDrinking && healthierCoping.length) {
        planItems.push(`Support reduction in alcohol use and reinforce ${formatList(healthierCoping)} as healthier coping strategies`);
      } else if (wantsLessDrinking) {
        planItems.push("Support reduction in alcohol use as a treatment goal");
      } else if (healthierCoping.length) {
        planItems.push(`Reinforce ${formatList(healthierCoping)} as healthier coping strategies`);
      }
    }
    if (signals.coping.some((line) => /\banger management\b/i.test(line))) {
      planItems.push("Continue anger-management work");
    }
    if (signals.support.length) {
      planItems.push("Review referral or support contact options as clinically indicated");
    }
    if (treatmentPlan?.interventions.length) {
      const summarizedInterventions = summarizeInterventions(treatmentPlan.interventions);
      if (summarizedInterventions) {
        planItems.push(`Continue ${summarizedInterventions} interventions`);
      }
    }
    return joinSentences(unique3(planItems));
  }
  function extractTreatmentPlanId(treatmentPlan) {
    const sourceUrl = treatmentPlan?.sourceUrl ?? "";
    const match = sourceUrl.match(/diagnosis_treatment_plans\/([^/?#]+)/);
    return match?.[1] ?? "";
  }
  function buildSoapDraft(sessionNotes, transcript, treatmentPlan, intake, diagnosticImpressions, prefs, meta = {}) {
    const sessionLines = splitLines2(sessionNotes);
    const transcriptLines = transcript?.entries.map((entry) => sanitizeLine(entry.text)).filter((line) => line && !isLowSignalLine(line)) ?? [];
    const allLines = [...sessionLines, ...transcriptLines];
    const signals = analyzeSessionNotes(allLines);
    const transcriptText = buildTranscriptText(transcript);
    const clientName = firstNonEmpty3(
      meta.clientName,
      intake?.fullName,
      `${intake?.firstName ?? ""} ${intake?.lastName ?? ""}`.trim(),
      "Client"
    );
    const sessionDate = firstNonEmpty3(
      meta.sessionDate,
      intake?.formDate,
      (/* @__PURE__ */ new Date()).toLocaleDateString("en-US")
    );
    const now = (/* @__PURE__ */ new Date()).toISOString();
    return {
      ...EMPTY_SOAP_DRAFT,
      apptId: meta.apptId ?? "",
      clientName,
      sessionDate,
      cptCode: prefs.followUpCPT || "90837",
      subjective: summarizeSubjective(allLines, signals, transcript, intake),
      objective: summarizeObjective(allLines, signals, intake),
      assessment: summarizeAssessment(allLines, signals, treatmentPlan, diagnosticImpressions, intake),
      plan: summarizePlan(allLines, signals, treatmentPlan),
      sessionNotes: sessionNotes.trim(),
      transcript: transcriptText,
      treatmentPlanId: extractTreatmentPlanId(treatmentPlan),
      generatedAt: now,
      editedAt: now,
      status: "draft"
    };
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
  var activePanel = "diagnostics";
  var llmSuggestions = null;
  var llmStatus = "";
  var llmGenerating = false;
  async function getActiveTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab ?? null;
  }
  async function getActiveTabId() {
    const tab = await getActiveTab();
    return tab?.id ?? null;
  }
  function sendTabMessage(tabId, message) {
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          resolve(null);
          return;
        }
        resolve(response ?? null);
      });
    });
  }
  async function detectApptContext() {
    const tab = await getActiveTab();
    if (!tab?.url) return { isAppt: false, apptId: "" };
    try {
      const url = new URL(tab.url);
      const videoMatch = url.pathname.match(/\/appt-([a-f0-9]+)\/room/);
      if (videoMatch) return { isAppt: true, apptId: videoMatch[1] };
      const apptMatch = url.pathname.match(/\/appointments\/(\d+)/);
      if (apptMatch) return { isAppt: true, apptId: apptMatch[1] };
    } catch {
    }
    return { isAppt: false, apptId: "" };
  }
  function escapeHtml(value) {
    return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
  }
  function deduplicateTranscript(entries) {
    if (entries.length === 0) return [];
    const norm = (t) => t.toLowerCase().replace(/[.,!?;:]+$/, "").trim();
    const result = [];
    let cur = entries[0];
    for (let i = 1; i < entries.length; i++) {
      const e = entries[i];
      if (e.speaker === cur.speaker && norm(e.text).startsWith(norm(cur.text))) {
        cur = e;
      } else {
        result.push(cur);
        cur = e;
      }
    }
    result.push(cur);
    return result;
  }
  function renderTranscriptEntries(entries) {
    if (!entries.length) return '<div class="empty-copy">No captions captured yet.</div>';
    return entries.map((e) => {
      const label = e.speaker === "clinician" ? "Clinician" : e.speaker === "client" ? "Client" : "Unknown";
      const time = e.timestamp ? formatDate(e.timestamp) : "";
      return `<div class="transcript-entry ${e.speaker}">
      <span class="transcript-speaker">${label}</span>${time ? `<span class="transcript-time">${escapeHtml(time)}</span>` : ""}
      <div class="transcript-text">${escapeHtml(e.text)}</div>
    </div>`;
    }).join("");
  }
  function formatTranscriptForClipboard(entries) {
    return entries.map((e) => {
      const speaker = e.speaker === "clinician" ? "Clinician" : e.speaker === "client" ? "Client" : "Unknown";
      const time = e.timestamp ? ` [${formatDate(e.timestamp)}]` : "";
      return `${speaker}${time}: ${e.text}`;
    }).join("\n\n");
  }
  function firstNonEmpty4(...values) {
    for (const value of values) {
      const trimmed = value?.trim();
      if (trimmed) return trimmed;
    }
    return "";
  }
  function buildTreatmentPlanReference(plan) {
    if (!plan) {
      return 'No treatment plan captured yet. Open the client treatment plan page and click "Capture Treatment Plan" first.';
    }
    const sections = [];
    if (plan.diagnoses.length) {
      sections.push(`Dx: ${plan.diagnoses.map((entry) => `${entry.description}${entry.code ? ` (${entry.code})` : ""}`).join(", ")}`);
    }
    if (plan.presentingProblem) {
      sections.push(`Presenting problem: ${plan.presentingProblem}`);
    }
    if (plan.goals.length) {
      sections.push(plan.goals.map((goal) => {
        const objectives = goal.objectives.length ? `
${goal.objectives.map((objective) => `  - ${objective.id}: ${objective.objective}`).join("\n")}` : "";
        return `Goal ${goal.goalNumber}: ${goal.goal}${objectives}`;
      }).join("\n\n"));
    }
    if (plan.interventions.length) {
      sections.push(`Interventions: ${plan.interventions.join(", ")}`);
    }
    if (plan.treatmentFrequency) {
      sections.push(`Frequency: ${plan.treatmentFrequency}`);
    }
    return sections.join("\n\n");
  }
  function buildSessionNotesReference(notes) {
    return notes.trim() || "No session notes saved for this appointment yet.";
  }
  function buildOverviewNoteReference(note) {
    return note.trim() || 'No overview clinical note captured yet. Open the client overview page and click "Capture Overview Prep".';
  }
  function setSoapTextareaValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
  }
  function readSoapDraftFromFields(existing) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    return {
      ...existing ?? {
        apptId: "",
        clientName: "",
        sessionDate: "",
        cptCode: "90837",
        subjective: "",
        objective: "",
        assessment: "",
        plan: "",
        sessionNotes: "",
        transcript: "",
        treatmentPlanId: "",
        generatedAt: now,
        editedAt: now,
        status: "draft"
      },
      subjective: document.getElementById("soap-subjective")?.value.trim() ?? "",
      objective: document.getElementById("soap-objective")?.value.trim() ?? "",
      assessment: document.getElementById("soap-assessment")?.value.trim() ?? "",
      plan: document.getElementById("soap-plan")?.value.trim() ?? "",
      editedAt: now,
      status: "draft"
    };
  }
  function setSoapStatus(message) {
    const el = document.getElementById("soap-status");
    if (el) el.textContent = message;
  }
  function clearDiagnosticUi() {
    const setHtml = (id, html) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = html;
    };
    const setText = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };
    setHtml("score-grid", '<div class="empty-copy">No intake captured yet.</div>');
    setText("overview-note-reference", buildOverviewNoteReference(""));
    setHtml("pinned-tabs", '<div class="empty-copy">Capture intake first to review diagnoses.</div>');
    setHtml("suggestion-list", '<div class="empty-copy">Capture intake first to see diagnostic suggestions.</div>');
    setHtml("active-review", '<div class="empty-copy">Capture intake first to review diagnostic criteria.</div>');
    setHtml("generated-summary", '<div class="empty-copy">No diagnostic summary generated yet.</div>');
    setText("summary-status", "Capture intake first to generate a diagnostic summary.");
    setHtml("knowledge-guidance", '<div class="empty-copy">No formulation or treatment-plan support generated yet.</div>');
    setText("guidance-status", "Capture intake first to generate formulation and treatment guidance.");
    const searchInput = document.getElementById("diagnosis-search");
    if (searchInput) {
      searchInput.value = "";
      searchInput.disabled = true;
      searchInput.placeholder = "Capture intake first.";
    }
    setText("supervision-case-summary", "");
    setHtml("supervision-discussion-questions", "");
    setHtml("supervision-blind-spot-flags", "");
    setHtml("supervision-modality-prompts", "");
    setText("supervision-status", 'Click "Generate Supervision Prep" to create a supervision agenda from current session data.');
  }
  function switchPanel(panel) {
    activePanel = panel;
    const panels = ["soap", "diagnostics", "treatment-plan", "transcript", "supervision"];
    for (const p of panels) {
      const panelEl = document.getElementById(`${p}-panel`);
      const tabEl = document.getElementById(`tab-${p}`);
      if (panelEl) panelEl.hidden = p !== panel;
      tabEl?.classList.toggle("active", p === panel);
    }
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
      `,
      intake.cssrs ? `
        <div class="score-card">
          <div class="score-label">C-SSRS</div>
          <div class="score-value">${intake.cssrs.totalScore} yes</div>
          <div class="score-subtext">${escapeHtml(intake.cssrs.severity || "Summary unavailable")}</div>
          <div class="score-subtext">${escapeHtml(intake.cssrs.difficulty || "No C-SSRS detail captured")}</div>
        </div>
      ` : `
        <div class="score-card">
          <div class="score-label">C-SSRS</div>
          <div class="score-value">Not captured</div>
          <div class="score-subtext">No C-SSRS assessment in session storage.</div>
        </div>
      `,
      intake.dass21 ? `
        <div class="score-card">
          <div class="score-label">DASS-21</div>
          <div class="score-value">${intake.dass21.totalScore}</div>
          <div class="score-subtext">${escapeHtml(intake.dass21.severity || "Summary unavailable")}</div>
          <div class="score-subtext">${escapeHtml(intake.dass21.difficulty || "No DASS detail captured")}</div>
        </div>
      ` : `
        <div class="score-card">
          <div class="score-label">DASS-21</div>
          <div class="score-value">Not captured</div>
          <div class="score-subtext">No DASS-21 assessment in session storage.</div>
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
      const v2 = !disorder ? DSM5_DIAGNOSES_V2.find((d) => d.id === disorderId) : null;
      const name = disorder?.name ?? v2?.name;
      if (!name) return "";
      return `
        <button class="tab ${activeDisorderId === disorderId ? "active" : ""}" data-action="activate-tab" data-disorder-id="${disorderId}">
          ${escapeHtml(name)}
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
  function statusPillLabel(status) {
    switch (status) {
      case "met":
        return "Met";
      case "likely":
        return "Likely";
      case "unclear":
        return "Unclear";
      case "not_met":
        return "Not met";
    }
  }
  function renderLLMSuggestionList(workspace) {
    if (llmGenerating) {
      return '<div class="empty-copy">Generating \u2014 pass 1 picks candidates, pass 2 evaluates DSM-5-TR criteria. Takes ~30s.</div>';
    }
    if (!llmSuggestions) {
      return '<div class="empty-copy">Click Generate to run the two-pass RAG diagnostic suggester.</div>';
    }
    if (!llmSuggestions.length) {
      return '<div class="empty-copy">LLM returned no candidates \u2014 check console.</div>';
    }
    return llmSuggestions.map((suggestion) => {
      const pinned = workspace?.pinnedDisorderIds.includes(suggestion.disorderId) ?? false;
      const code = suggestion.code ? ` \xB7 ${escapeHtml(suggestion.code)}` : "";
      const ruleOuts = suggestion.ruleOuts.length ? `<div class="suggestion-meta"><strong>Rule-outs:</strong> ${escapeHtml(suggestion.ruleOuts.join("; "))}</div>` : "";
      const criteriaRows = suggestion.criteriaEval.map(
        (c) => `
            <div class="criterion-row">
              <span class="criterion-letter">${escapeHtml(c.letter || "?")}</span>
              <span class="pill status ${c.status}">${statusPillLabel(c.status)}</span>
              <span class="criterion-text">${escapeHtml(c.criterionText)}</span>
              ${c.evidence ? `<div class="criterion-evidence-inline"><em>${escapeHtml(c.evidence)}</em></div>` : ""}
            </div>
          `
      ).join("");
      return `
        <article class="suggestion-card">
          <div class="suggestion-top">
            <div>
              <div class="suggestion-name">${escapeHtml(suggestion.disorderName)}</div>
              <div class="suggestion-meta">${escapeHtml(suggestion.chapter)}${code}</div>
            </div>
            <span class="pill ${suggestion.confidence}">${suggestion.confidence.toUpperCase()}</span>
          </div>
          <div class="suggestion-reason">${escapeHtml(suggestion.reasoning)}</div>
          ${ruleOuts}
          <details class="llm-criteria-details">
            <summary>Criterion-by-criterion (${suggestion.criteriaEval.length})</summary>
            ${criteriaRows}
          </details>
          <div class="suggestion-actions">
            <button class="button ${pinned ? "secondary" : "primary"}" data-action="${pinned ? "unpin" : "pin"}" data-disorder-id="${suggestion.disorderId}">
              ${pinned ? "Unpin" : "Pin diagnosis"}
            </button>
          </div>
        </article>
      `;
    }).join("");
  }
  async function generateLLMSuggestions() {
    if (llmGenerating) return;
    const intake = await getIntake();
    if (!intake) {
      llmStatus = "Capture intake first.";
      await render();
      return;
    }
    const prefs = await getPreferences();
    if (!prefs.openaiApiKey) {
      llmStatus = "No OpenAI API key in settings \u2014 open the popup and paste one.";
      await render();
      return;
    }
    llmGenerating = true;
    llmStatus = "Calling OpenAI (pass 1 of 2)...";
    await render();
    try {
      const started = Date.now();
      const suggestions = await getLLMDiagnosticSuggestions(intake, {
        apiKey: prefs.openaiApiKey,
        model: prefs.openaiModel || "gpt-4o-mini",
        onProgress: (msg) => {
          llmStatus = msg;
          void render();
        }
      });
      const elapsed = ((Date.now() - started) / 1e3).toFixed(1);
      llmSuggestions = suggestions;
      llmStatus = `${suggestions.length} suggestions in ${elapsed}s.`;
    } catch (err) {
      console.error("[SPN] LLM diagnostic failed:", err);
      llmStatus = `Failed: ${err instanceof Error ? err.message : String(err)}`;
      llmSuggestions = null;
    } finally {
      llmGenerating = false;
      await render();
    }
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
    if (!disorder) {
      const v2 = DSM5_DIAGNOSES_V2.find((d) => d.id === activeDisorderId);
      if (!v2) return '<div class="empty-copy">The selected diagnosis is no longer available.</div>';
      const code = v2.icd10Code ? ` (${v2.icd10Code})` : "";
      return `
      <div class="criterion-group">${escapeHtml(v2.name)}${code}</div>
      <div class="diagnosis-notes" style="white-space:pre-wrap;font-size:12px;margin-top:8px;padding:10px;background:var(--neutral-bg);border-radius:6px;">${escapeHtml(v2.criteriaText)}</div>
    `;
    }
    if (!suggestion) {
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
        ${impression.diagnosticReasoning ? `<p>${escapeHtml(impression.diagnosticReasoning)}</p>` : ""}
        ${impression.criteriaEvidence.length ? `
          <div class="criterion-evidence"><strong>Supporting sentences</strong></div>
          <ul>${impression.criteriaEvidence.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        ` : ""}
        ${impression.criteriaSummary.length ? `
          <div class="criterion-evidence"><strong>Criteria snapshot</strong></div>
          <ul>${impression.criteriaSummary.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        ` : ""}
        ${impression.ruleOuts.length ? `
          <div class="criterion-evidence"><strong>Rule-outs / follow-up</strong></div>
          <ul>${impression.ruleOuts.slice(0, 4).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        ` : ""}
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
      <h3>Diagnostic Formulation</h3>
      <p>${escapeHtml(guidance.formulation)}</p>
    </article>
    <article class="knowledge-block">
      <h3>Suggested Goals</h3>
      <pre style="white-space:pre-wrap;font-family:inherit;">${escapeHtml(guidance.goals)}</pre>
    </article>
    <article class="knowledge-block">
      <h3>Suggested Interventions</h3>
      <pre style="white-space:pre-wrap;font-family:inherit;">${escapeHtml(guidance.interventions)}</pre>
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
  async function regenerateSoapDraftFromSavedNotes() {
    const apptCtx = await detectApptContext();
    if (!apptCtx.isAppt) {
      setSoapStatus("Open an appointment page first.");
      return;
    }
    const treatmentPlan = await getTreatmentPlan();
    if (!treatmentPlan) {
      setSoapStatus("Capture a treatment plan first on the client treatment plan page.");
      return;
    }
    const sessionNotes = (await getSessionNotes(apptCtx.apptId))?.notes ?? "";
    if (!sessionNotes.trim()) {
      setSoapStatus("Save session notes first from the popup or video room notes panel.");
      return;
    }
    const intake = await getIntake();
    const note = await getNote();
    const workspace = await getDiagnosticWorkspace();
    const transcript = await getTranscript(apptCtx.apptId);
    const prefs = await getPreferences();
    const diagnosticImpressions = workspace?.finalizedImpressions?.length ? workspace.finalizedImpressions : note?.diagnosticImpressions ?? [];
    const draft = buildSoapDraft(
      sessionNotes,
      transcript,
      treatmentPlan,
      intake,
      diagnosticImpressions,
      prefs,
      { apptId: apptCtx.apptId }
    );
    await saveSoapDraft(draft);
    activePanel = "soap";
    setSoapStatus("SOAP draft generated from saved session notes.");
    await render();
  }
  async function saveSoapDraftFromPanel() {
    const existing = await getSoapDraft();
    const next = readSoapDraftFromFields(existing);
    if (!next.subjective && !next.objective && !next.assessment && !next.plan) {
      setSoapStatus("SOAP draft is empty. Generate it first or add content before saving.");
      return null;
    }
    await saveSoapDraft(next);
    setSoapStatus("SOAP draft saved.");
    return next;
  }
  async function fillSoapDraftIntoPage() {
    const draft = await saveSoapDraftFromPanel();
    if (!draft) return;
    const tabId = await getActiveTabId();
    if (!tabId) {
      setSoapStatus("No active appointment tab found.");
      return;
    }
    const response = await sendTabMessage(tabId, {
      type: "SPN_FILL_SOAP_DRAFT",
      draft
    });
    if (response?.ok) {
      setSoapStatus(`Filled ${response.filled ?? 0} SOAP fields in SimplePractice.`);
      return;
    }
    setSoapStatus(response?.error ?? "Unable to fill the SOAP form. Open the progress note tab first.");
  }
  function renderSupervisionPrep(prep) {
    const caseSummaryEl = document.getElementById("supervision-case-summary");
    const questionsEl = document.getElementById("supervision-discussion-questions");
    const blindSpotsEl = document.getElementById("supervision-blind-spot-flags");
    const modalityEl = document.getElementById("supervision-modality-prompts");
    const statusEl = document.getElementById("supervision-status");
    if (!prep) {
      if (caseSummaryEl) caseSummaryEl.textContent = "";
      if (questionsEl) questionsEl.innerHTML = "";
      if (blindSpotsEl) blindSpotsEl.innerHTML = "";
      if (modalityEl) modalityEl.innerHTML = "";
      if (statusEl) statusEl.textContent = 'Click "Generate Supervision Prep" to create a supervision agenda from current session data.';
      return;
    }
    if (caseSummaryEl) caseSummaryEl.textContent = prep.caseSummary || "No case summary generated.";
    if (questionsEl) questionsEl.innerHTML = renderBulletList(prep.discussionQuestions);
    if (blindSpotsEl) blindSpotsEl.innerHTML = renderBulletList(prep.blindSpotFlags);
    if (modalityEl) modalityEl.innerHTML = renderBulletList(prep.modalityPrompts);
    if (statusEl) statusEl.textContent = `Generated ${formatDate(prep.generatedAt)} (${prep.generationMethod})`;
  }
  function renderBulletList(items) {
    if (!items?.length) return '<div class="empty-copy">None generated.</div>';
    return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
  }
  async function generateAndSaveSupervisionPrep() {
    const statusEl = document.getElementById("supervision-status");
    if (statusEl) statusEl.textContent = "Generating supervision prep...";
    const intake = await getIntake();
    const workspace = await getDiagnosticWorkspace();
    const treatmentPlan = await getTreatmentPlan();
    const prefs = await getPreferences();
    const apptCtx = await detectApptContext();
    const soapDraft = await getSoapDraft();
    const sessionNotes = apptCtx.isAppt ? (await getSessionNotes(apptCtx.apptId))?.notes ?? soapDraft?.sessionNotes ?? "" : soapDraft?.sessionNotes ?? "";
    const transcript = apptCtx.isAppt ? await getTranscript(apptCtx.apptId) : null;
    const mseChecklist = await getMseChecklist();
    const diagnosticImpressions = workspace?.finalizedImpressions ?? [];
    try {
      const prep = await generateSupervisionPrep(
        sessionNotes,
        transcript,
        treatmentPlan,
        intake,
        diagnosticImpressions,
        mseChecklist,
        prefs
      );
      await saveSupervisionPrep(prep);
      renderSupervisionPrep(prep);
    } catch (err) {
      if (statusEl) statusEl.textContent = `Generation failed: ${err instanceof Error ? err.message : String(err)}`;
    }
  }
  async function copySupervisionToClipboard() {
    const prep = await getSupervisionPrep();
    if (!prep) return;
    const lines = [];
    if (prep.caseSummary) {
      lines.push("CASE SUMMARY", prep.caseSummary, "");
    }
    if (prep.discussionQuestions.length) {
      lines.push("DISCUSSION QUESTIONS");
      prep.discussionQuestions.forEach((q, i) => lines.push(`${i + 1}. ${q}`));
      lines.push("");
    }
    if (prep.blindSpotFlags.length) {
      lines.push("BLIND SPOT FLAGS");
      prep.blindSpotFlags.forEach((f, i) => lines.push(`${i + 1}. ${f}`));
      lines.push("");
    }
    if (prep.modalityPrompts.length) {
      lines.push("MODALITY PROMPTS");
      prep.modalityPrompts.forEach((p, i) => lines.push(`${i + 1}. ${p}`));
    }
    await navigator.clipboard.writeText(lines.join("\n"));
    const btn = document.getElementById("btn-copy-supervision");
    if (btn) {
      const original = btn.textContent;
      btn.textContent = "Copied!";
      setTimeout(() => {
        btn.textContent = original;
      }, 1500);
    }
  }
  async function render() {
    const intake = await getIntake();
    let workspace = await getDiagnosticWorkspace();
    const soapDraft = await getSoapDraft();
    const treatmentPlan = await getTreatmentPlan();
    const apptCtx = await detectApptContext();
    const sessionNotes = apptCtx.isAppt ? (await getSessionNotes(apptCtx.apptId))?.notes ?? soapDraft?.sessionNotes ?? "" : soapDraft?.sessionNotes ?? "";
    const transcript = apptCtx.isAppt ? await getTranscript(apptCtx.apptId) : null;
    const emptyState = document.getElementById("empty-state");
    const content = document.getElementById("content");
    const diagnosticsTab = document.getElementById("tab-diagnostics");
    const treatmentPlanTab = document.getElementById("tab-treatment-plan");
    const hasSoapContext = !!soapDraft || !!treatmentPlan || !!sessionNotes || !!transcript;
    if (!intake && !hasSoapContext) {
      clearDiagnosticUi();
      emptyState.hidden = false;
      content.hidden = true;
      return;
    }
    emptyState.hidden = true;
    content.hidden = false;
    document.getElementById("patient-name").textContent = firstNonEmpty4(
      intake?.fullName,
      `${intake?.firstName ?? ""} ${intake?.lastName ?? ""}`.trim(),
      soapDraft?.clientName,
      apptCtx.isAppt ? "Current Appointment" : "Client"
    );
    document.getElementById("patient-meta").textContent = [
      intake?.clientId ? `Client ${intake.clientId}` : "",
      soapDraft?.sessionDate ? `Session ${soapDraft.sessionDate}` : "",
      treatmentPlan?.capturedAt ? `Plan ${formatDate(treatmentPlan.capturedAt)}` : ""
    ].filter(Boolean).join(" \xB7 ");
    setSoapTextareaValue("soap-subjective", soapDraft?.subjective ?? "");
    setSoapTextareaValue("soap-objective", soapDraft?.objective ?? "");
    setSoapTextareaValue("soap-assessment", soapDraft?.assessment ?? "");
    setSoapTextareaValue("soap-plan", soapDraft?.plan ?? "");
    const treatmentPlanReference = buildTreatmentPlanReference(treatmentPlan);
    document.getElementById("soap-treatment-plan").textContent = treatmentPlanReference;
    const treatmentPlanRef = document.getElementById("treatment-plan-reference");
    if (treatmentPlanRef) {
      treatmentPlanRef.textContent = treatmentPlanReference;
    }
    document.getElementById("soap-session-notes").textContent = buildSessionNotesReference(sessionNotes);
    const overviewNoteRef = document.getElementById("overview-note-reference");
    if (overviewNoteRef) {
      overviewNoteRef.textContent = buildOverviewNoteReference(intake?.overviewClinicalNote ?? "");
    }
    if (!soapDraft) {
      if (!treatmentPlan) {
        setSoapStatus("Capture a treatment plan first, then generate a SOAP draft from session notes.");
      } else if (!sessionNotes.trim()) {
        setSoapStatus("No session notes saved for this appointment yet.");
      } else {
        setSoapStatus('SOAP draft not generated yet. Click "Regenerate SOAP" to build one from the saved session notes and treatment plan.');
      }
    } else {
      setSoapStatus(`Draft updated ${formatDate(soapDraft.editedAt || soapDraft.generatedAt)}`);
    }
    const transcriptEntriesEl = document.getElementById("transcript-entries");
    const transcriptCountEl = document.getElementById("transcript-count");
    const transcriptStatusEl = document.getElementById("transcript-status");
    if (transcriptEntriesEl && transcriptCountEl && transcriptStatusEl) {
      if (!transcript || transcript.entries.length === 0) {
        transcriptEntriesEl.innerHTML = '<div class="empty-copy">No captions captured yet. Start a video session with captions enabled.</div>';
        transcriptCountEl.textContent = "";
        transcriptStatusEl.textContent = apptCtx.isAppt ? "Listening for captions\u2026" : "Open a video appointment to capture transcript.";
      } else {
        const deduped = deduplicateTranscript(transcript.entries);
        transcriptEntriesEl.innerHTML = renderTranscriptEntries(deduped);
        transcriptCountEl.textContent = `${deduped.length} entries`;
        transcriptStatusEl.textContent = `Last updated ${formatDate(transcript.updatedAt)} \xB7 ${transcript.entries.length} raw \u2192 ${deduped.length} deduped`;
      }
    }
    const supervisionPrep = await getSupervisionPrep();
    renderSupervisionPrep(supervisionPrep);
    if (!intake) {
      clearDiagnosticUi();
      if (diagnosticsTab) diagnosticsTab.disabled = true;
      if (treatmentPlanTab) treatmentPlanTab.disabled = false;
      if (activePanel === "diagnostics") {
        switchPanel(treatmentPlan ? "treatment-plan" : "soap");
      } else {
        switchPanel(activePanel);
      }
      return;
    }
    if (diagnosticsTab) diagnosticsTab.disabled = false;
    if (treatmentPlanTab) treatmentPlanTab.disabled = false;
    const suggestions = getDiagnosticSuggestions(intake);
    const staleFinalizedImpressions = workspace?.finalizedImpressions.length ? workspace.finalizedImpressions.some((impression) => !(impression.diagnosticReasoning ?? "").trim()) : false;
    if (staleFinalizedImpressions) {
      workspace = await updateWorkspace((current) => ({
        ...current,
        finalizedImpressions: buildDiagnosticImpressions(intake, suggestions, current)
      }));
    }
    const activeDisorderId = resolveActiveDisorderId(workspace, suggestions.map((suggestion) => suggestion.disorderId));
    const draftImpressions = workspace?.finalizedImpressions.length ? workspace.finalizedImpressions : buildDiagnosticImpressions(intake, suggestions, buildWorkspaceBase(workspace));
    const guidance = await buildClinicalGuidance(intake, draftImpressions);
    document.getElementById("score-grid").innerHTML = buildScoreCards(intake);
    document.getElementById("pinned-tabs").innerHTML = renderPinnedTabs(workspace, activeDisorderId);
    document.getElementById("suggestion-list").innerHTML = renderSuggestionList(intake, workspace, activeDisorderId);
    document.getElementById("llm-suggestion-list").innerHTML = renderLLMSuggestionList(workspace);
    const llmStatusEl = document.getElementById("llm-suggestion-status");
    if (llmStatusEl) llmStatusEl.textContent = llmStatus;
    const llmGenBtn = document.getElementById("btn-generate-llm-suggestions");
    if (llmGenBtn) {
      llmGenBtn.disabled = llmGenerating;
      llmGenBtn.textContent = llmGenerating ? "Generating\u2026" : llmSuggestions ? "Regenerate" : "Generate";
    }
    document.getElementById("active-review").innerHTML = renderActiveReview(intake, workspace, activeDisorderId);
    document.getElementById("generated-summary").innerHTML = renderGeneratedSummary(workspace);
    document.getElementById("knowledge-guidance").innerHTML = renderGuidance(guidance);
    const summaryStatus = document.getElementById("summary-status");
    summaryStatus.textContent = workspace?.finalizedImpressions.length ? `Most recent summary includes ${workspace.finalizedImpressions.length} pinned diagnoses.` : "Generate a summary to push finalized diagnostic impressions into the note draft.";
    const guidanceStatus = document.getElementById("guidance-status");
    guidanceStatus.textContent = workspace?.finalizedImpressions.length ? `Knowledge support is using the finalized diagnostic summary and current intake evidence.` : "Knowledge support is using provisional intake-driven diagnoses until a summary is finalized.";
    const searchInput = document.getElementById("diagnosis-search");
    const availableOptions = getAvailableDiagnosisOptions(workspace);
    searchInput.disabled = false;
    searchInput.placeholder = availableOptions.length ? "Search diagnoses by name or ICD code..." : "All diagnoses are already pinned.";
    switchPanel(activePanel);
  }
  document.addEventListener("click", async (event) => {
    const target = event.target;
    if (!target) return;
    const actionTarget = target.closest("[data-action]");
    const action = actionTarget?.dataset.action;
    const disorderId = actionTarget?.dataset.disorderId;
    if (action === "generate-llm-suggestions") {
      await generateLLMSuggestions();
      return;
    }
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
  document.getElementById("btn-new-patient")?.addEventListener("click", async () => {
    if (!confirm("Clear all captured data for a new patient?")) return;
    await clearAll();
    activePanel = "diagnostics";
    await render();
  });
  function buildSearchableDiagnoses() {
    const seen = /* @__PURE__ */ new Set();
    const items = [];
    for (const d of DSM5_DISORDERS) {
      seen.add(d.id);
      items.push({ id: d.id, name: d.name, chapter: d.chapter, codes: d.icd10Codes, hasDetailedCriteria: true });
    }
    for (const d of DSM5_DIAGNOSES_V2) {
      if (seen.has(d.id)) continue;
      seen.add(d.id);
      items.push({ id: d.id, name: d.name, chapter: d.chapter, codes: d.icd10Code ? [d.icd10Code] : [], hasDetailedCriteria: false });
    }
    return items;
  }
  var ALL_DIAGNOSES = buildSearchableDiagnoses();
  function getSuggestedDiagnosisIds(intake) {
    const corpus = [
      intake.chiefComplaint,
      intake.presentingProblems,
      intake.historyOfPresentIllness,
      intake.counselingGoals,
      intake.recentSymptoms,
      intake.additionalSymptoms,
      intake.additionalInfo,
      intake.manualNotes,
      intake.overviewClinicalNote,
      intake.spSoapNote,
      ...(intake.rawQA ?? []).map((qa) => `${qa.question} ${qa.answer}`)
    ].join(" ").toLowerCase();
    if (!corpus.trim()) return /* @__PURE__ */ new Set();
    const ids = /* @__PURE__ */ new Set();
    for (const disorder of DSM5_DISORDERS) {
      const nameWords = disorder.name.toLowerCase().split(/\s+/);
      if (nameWords.some((w) => w.length > 3 && corpus.includes(w))) {
        ids.add(disorder.id);
        continue;
      }
      const hasKeywordMatch = disorder.criteria.some(
        (c) => c.keywords?.some((kw) => corpus.includes(kw.toLowerCase()))
      );
      if (hasKeywordMatch) ids.add(disorder.id);
    }
    for (const d of DSM5_DIAGNOSES_V2) {
      if (ids.has(d.id)) continue;
      const nameWords = d.name.toLowerCase().split(/[\s()/-]+/);
      if (nameWords.some((w) => w.length > 4 && corpus.includes(w))) {
        ids.add(d.id);
      }
    }
    return ids;
  }
  (function initDiagnosisSearch() {
    const searchInput = document.getElementById("diagnosis-search");
    const dropdown = document.getElementById("diagnosis-dropdown");
    let activeIndex = -1;
    let currentItems = [];
    function showDropdown(items, intake) {
      currentItems = items;
      activeIndex = -1;
      if (items.length === 0) {
        dropdown.innerHTML = '<div class="diagnosis-dropdown-empty">No matches found.</div>';
        dropdown.classList.remove("hidden");
        return;
      }
      const suggestedIds = intake ? getSuggestedDiagnosisIds(intake) : /* @__PURE__ */ new Set();
      dropdown.innerHTML = items.slice(0, 30).map((d, i) => {
        const codes = d.codes.slice(0, 3).join(", ");
        const suggested = suggestedIds.has(d.id) ? '<span class="dx-suggested">suggested</span>' : "";
        const detailed = d.hasDetailedCriteria ? "" : '<span class="dx-code"> (criteria only)</span>';
        return `<div class="diagnosis-dropdown-item${i === activeIndex ? " active" : ""}" data-index="${i}" data-id="${d.id}"><span class="dx-name">${escapeHtml(d.name)}</span><span class="dx-code">${codes}</span>` + suggested + detailed + `</div>`;
      }).join("");
      dropdown.classList.remove("hidden");
    }
    function hideDropdown() {
      dropdown.classList.add("hidden");
      activeIndex = -1;
    }
    async function selectItem(id) {
      searchInput.value = "";
      hideDropdown();
      await pinDiagnosis(id);
      await render();
    }
    searchInput.addEventListener("input", async () => {
      const query = searchInput.value.trim().toLowerCase();
      const workspace = await getDiagnosticWorkspace();
      const pinned = new Set(workspace?.pinnedDisorderIds ?? []);
      const intake = await getIntake();
      const available = ALL_DIAGNOSES.filter((d) => !pinned.has(d.id));
      if (!query) {
        const suggestedIds = intake ? getSuggestedDiagnosisIds(intake) : /* @__PURE__ */ new Set();
        const suggested = available.filter((d) => suggestedIds.has(d.id));
        if (suggested.length) {
          showDropdown(suggested, intake);
        } else {
          showDropdown(available.slice(0, 15), intake);
        }
        return;
      }
      const filtered = available.filter((d) => {
        const nameMatch = d.name.toLowerCase().includes(query);
        const codeMatch = d.codes.some((c) => c.toLowerCase().includes(query));
        const chapterMatch = d.chapter.toLowerCase().includes(query);
        return nameMatch || codeMatch || chapterMatch;
      });
      showDropdown(filtered, intake);
    });
    searchInput.addEventListener("focus", () => {
      searchInput.dispatchEvent(new Event("input"));
    });
    searchInput.addEventListener("keydown", (e) => {
      if (dropdown.classList.contains("hidden")) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        activeIndex = Math.min(activeIndex + 1, currentItems.length - 1);
        updateActiveItem();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        activeIndex = Math.max(activeIndex - 1, 0);
        updateActiveItem();
      } else if (e.key === "Enter" && activeIndex >= 0 && currentItems[activeIndex]) {
        e.preventDefault();
        selectItem(currentItems[activeIndex].id);
      } else if (e.key === "Escape") {
        hideDropdown();
      }
    });
    function updateActiveItem() {
      dropdown.querySelectorAll(".diagnosis-dropdown-item").forEach((el, i) => {
        el.classList.toggle("active", i === activeIndex);
        if (i === activeIndex) el.scrollIntoView({ block: "nearest" });
      });
    }
    dropdown.addEventListener("click", (e) => {
      const item = e.target.closest(".diagnosis-dropdown-item");
      if (item?.dataset.id) selectItem(item.dataset.id);
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".diagnosis-search-wrap")) {
        hideDropdown();
      }
    });
  })();
  document.getElementById("btn-generate-summary")?.addEventListener("click", async () => {
    await generateSummary(false);
  });
  document.getElementById("btn-write-note")?.addEventListener("click", async () => {
    await generateSummary(true);
  });
  document.getElementById("tab-soap")?.addEventListener("click", () => {
    switchPanel("soap");
  });
  document.getElementById("tab-diagnostics")?.addEventListener("click", () => {
    const tab = document.getElementById("tab-diagnostics");
    if (tab?.disabled) return;
    switchPanel("diagnostics");
  });
  document.getElementById("tab-treatment-plan")?.addEventListener("click", () => {
    const tab = document.getElementById("tab-treatment-plan");
    if (tab?.disabled) return;
    switchPanel("treatment-plan");
  });
  document.getElementById("tab-transcript")?.addEventListener("click", () => {
    switchPanel("transcript");
  });
  document.getElementById("btn-copy-transcript")?.addEventListener("click", async () => {
    const apptCtx = await detectApptContext();
    const transcript = apptCtx.isAppt ? await getTranscript(apptCtx.apptId) : null;
    if (!transcript || transcript.entries.length === 0) return;
    const deduped = deduplicateTranscript(transcript.entries);
    const text = formatTranscriptForClipboard(deduped);
    await navigator.clipboard.writeText(text);
    const btn = document.getElementById("btn-copy-transcript");
    if (btn) {
      const original = btn.textContent;
      btn.textContent = "Copied!";
      setTimeout(() => {
        btn.textContent = original;
      }, 1500);
    }
  });
  document.getElementById("btn-refresh-transcript")?.addEventListener("click", () => {
    render();
  });
  document.getElementById("btn-generate-soap")?.addEventListener("click", async () => {
    await regenerateSoapDraftFromSavedNotes();
  });
  document.getElementById("btn-save-soap")?.addEventListener("click", async () => {
    const saved = await saveSoapDraftFromPanel();
    if (saved) {
      await render();
    }
  });
  document.getElementById("btn-fill-soap")?.addEventListener("click", async () => {
    await fillSoapDraftIntoPage();
  });
  document.getElementById("tab-supervision")?.addEventListener("click", () => {
    switchPanel("supervision");
  });
  document.getElementById("btn-generate-supervision")?.addEventListener("click", async () => {
    await generateAndSaveSupervisionPrep();
  });
  document.getElementById("btn-copy-supervision")?.addEventListener("click", async () => {
    await copySupervisionToClipboard();
  });
  chrome.storage.onChanged.addListener(() => render());
  render();
})();
//# sourceMappingURL=sidepanel.js.map
