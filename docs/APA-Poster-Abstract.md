# An AI-Powered Adaptive Learning Platform for EPPP Examination Preparation: Integrating Evidence-Based Study Techniques with Wellness Support

## Authors

[Author Name(s) and Affiliations to be added]

---

## Abstract

The Examination for Professional Practice in Psychology (EPPP) presents significant challenges for psychology graduates, with pass rates varying substantially across programs. This poster presents an innovative AI-powered adaptive learning platform designed to help students prepare for the EPPP while addressing the psychological wellness challenges inherent in intensive exam preparation. The platform integrates multiple evidence-based learning modalities including adaptive practice examinations, AI-generated interactive lessons, micro-learning quizzes with spaced repetition, and a wellness intervention system (Recover) that provides psychology-based micro-interventions when students show signs of burnout. The system collects comprehensive learning analytics across all 12 EPPP domains and 81 topics, enabling research on study behaviors, knowledge retention patterns, and the relationship between wellness practices and academic performance. Preliminary data collection capabilities include detailed question-level telemetry (time spent, answer changes, revisitation patterns), topic mastery tracking, study session engagement metrics, and research demographic data with IRB-compliant consent management. This platform represents a novel approach to professional licensure examination preparation that prioritizes both learning outcomes and student wellbeing.

**Keywords:** EPPP, examination preparation, adaptive learning, artificial intelligence, wellness, psychology education, learning analytics

---

## Introduction and Background

### The EPPP Challenge

The Examination for Professional Practice in Psychology (EPPP) is a standardized licensing examination required for psychologists in the United States and Canada. The exam covers eight major content domains representing the breadth of psychological knowledge required for independent practice:

1. Biological Bases of Behavior
2. Cognitive-Affective Bases of Behavior
3. Social and Cultural Bases of Behavior
4. Growth and Lifespan Development
5. Assessment and Diagnosis
6. Treatment, Intervention, Prevention, and Supervision
7. Research Methods and Statistics
8. Ethical, Legal, and Professional Issues

### Current Gaps in Preparation Resources

Traditional EPPP preparation methods often rely on passive study techniques such as reading and reviewing material. Research in educational psychology demonstrates that active learning strategies, spaced repetition, and adaptive feedback significantly improve knowledge retention and exam performance (Dunlosky et al., 2013; Roediger & Butler, 2011). Additionally, the intensive nature of exam preparation is associated with increased stress, anxiety, and burnout among graduate students (El-Ghoroury et al., 2012), yet few preparation resources integrate wellness support.

### Purpose

This project addresses these gaps by developing an AI-powered adaptive learning platform that combines:
- Evidence-based active learning techniques
- Personalized, adaptive content delivery
- Comprehensive learning analytics
- Integrated wellness interventions

---

## Platform Features

### 1. Practice Examinations

The platform offers two examination formats that simulate actual EPPP testing conditions:

**Diagnostic Exams**
- 71 questions (~1 hour duration)
- Identifies knowledge gaps across all domains
- Generates personalized study recommendations

**Full Practice Exams**
- 225 questions (4 hours 15 minutes)
- Realistic examination simulation
- Two modes:
  - *Study Mode*: Immediate feedback with explanations
  - *Test Mode*: Timed conditions, results revealed at completion

**Question-Level Features**
- Text highlighting and strikethrough annotations
- Question flagging for later review
- Pause/resume functionality
- Keyboard navigation shortcuts for accessibility

### 2. Topic Teacher: AI-Powered Interactive Lessons

Interactive lessons are available for all 81 topics across the 12 EPPP domains:

- **AI-Generated Content**: Lessons generated using Claude AI (Anthropic) tailored to EPPP content specifications
- **Interactive Chat**: Real-time conversation with AI for deeper exploration of concepts
- **Text-to-Speech**: Audio playback with read-along highlighting
- **Performance-Linked Highlighting**: Visual indicators showing:
  - Sections with recent correct answers (green)
  - Sections with recent incorrect answers (red)
  - Sections showing improvement (yellow)

### 3. Quizzer: Micro-Learning System

Short, focused quizzes designed for active recall and spaced repetition:

- **Format**: 10 questions per quiz (8 scored, 2 experimental unscored)
- **Timing**: 68 seconds per question
- **Feedback**: Immediate explanations for each answer
- **Adaptive Review**: "Lock-In Drill" feature focuses on previously missed questions
- **Gamification**: Visual celebrations for high scores to reinforce positive learning experiences

### 4. Recover: Wellness Integration

A unique feature addressing the psychological challenges of intensive exam preparation:

**Micro-Interventions**
- Guided breathing exercises
- Mindfulness-based stress reduction techniques
- Psychology-informed coping strategies

**AI Chatbot Support**
- Conversational support for study-related stress
- Evidence-based recommendations
- Safety monitoring with harm detection alerts

**Adaptive Triggering**
- Automatically suggests intervention after 3+ consecutive incorrect answers
- Recognizes patterns indicating frustration or burnout

### 5. Dashboard and Progress Tracking

A central hub providing comprehensive visibility into study progress:

- Domain-by-domain progress visualization
- Study streak tracking and daily goals
- Exam date countdown
- AI-generated priority focus areas
- Performance charts and trend analysis

---

## Data Collection and Research Potential

### Learning Analytics Collected

The platform collects comprehensive data to support research on EPPP preparation effectiveness:

**Question-Level Telemetry**
| Metric | Description |
|--------|-------------|
| Time Spent | Milliseconds spent on each question |
| Visit Count | Number of times question was accessed |
| Answer Changes | Frequency of answer modifications |
| Change Direction | Whether changes improved or worsened answers |
| Highlighting Usage | Text annotation behaviors |
| Flagging Behavior | Questions marked for review |

**Topic Mastery Tracking**
- Accuracy metrics per topic and subsection
- Attempt counts and improvement trajectories
- Last attempted timestamps for spaced repetition optimization

**Study Session Data**
- Feature usage duration (Topic Teacher, Quizzer, Recover, etc.)
- Page navigation patterns
- Session frequency and timing preferences

**Wellness Data**
- Recover session engagement
- Chat interaction patterns (with consent)
- Correlation between wellness interventions and subsequent performance

### Research Demographics (Consent-Based)

With explicit user consent, the platform collects research-relevant demographic information:

- Graduate program and degree type (PhD, PsyD, EdD)
- Graduation year
- Clinical experience settings (hospital, community mental health, private practice, etc.)
- Self-assessed exam readiness
- Previous exam attempts
- Weekly study hours
- Age range, gender, ethnicity
- First-generation graduate student status

### Privacy and Consent Framework

- **Granular Consent Management**: Separate toggles for personal tracking, AI insights, research contribution, and marketing
- **Immutable Audit Logs**: All consent changes recorded with timestamps
- **Anonymized Research IDs**: Separate identifiers for research exports
- **IRB-Ready**: Data export tracking with protocol number fields

---

## Theoretical Framework

### Evidence-Based Learning Principles

The platform design is grounded in established educational psychology research:

1. **Testing Effect**: Active retrieval through quizzes enhances long-term retention (Roediger & Karpicke, 2006)

2. **Spaced Repetition**: Review queue system optimizes memory consolidation intervals (Cepeda et al., 2006)

3. **Elaborative Interrogation**: AI chat encourages deeper processing through explanation requests (Dunlosky et al., 2013)

4. **Immediate Feedback**: Study mode provides instant corrective information (Hattie & Timperley, 2007)

5. **Self-Regulated Learning**: Dashboard enables metacognitive monitoring and goal setting (Zimmerman, 2002)

### Wellness Integration Rationale

Graduate student mental health research demonstrates:
- High rates of anxiety and depression during licensure preparation (Hyun et al., 2006)
- Burnout negatively impacts cognitive performance (Maslach & Leiter, 2016)
- Brief mindfulness interventions improve attention and reduce stress (Chiesa et al., 2011)

The Recover feature addresses these concerns through targeted, accessible interventions.

---

## Research Questions

The platform's data collection capabilities enable investigation of several research questions:

1. **Learning Outcomes**: How do different study modalities (lessons vs. quizzes vs. practice exams) predict EPPP performance?

2. **Engagement Patterns**: What study behaviors (session length, frequency, time of day) are associated with knowledge retention?

3. **Wellness Impact**: Do students who engage with Recover interventions show different performance trajectories than those who do not?

4. **Adaptive Learning**: How does personalized content recommendation affect study efficiency and domain mastery?

5. **Demographic Factors**: Are there differences in study behaviors or outcomes across program types, experience levels, or demographic groups?

---

## Discussion and Implications

### Contributions to Psychology Education

This platform represents an advancement in professional examination preparation by:

1. **Integrating Wellness**: Acknowledging and addressing the psychological demands of intensive exam preparation
2. **Leveraging AI**: Using artificial intelligence to personalize content and provide scalable interactive support
3. **Enabling Research**: Creating infrastructure for studying EPPP preparation effectiveness at scale
4. **Applying Learning Science**: Translating educational psychology research into practical study tools

### Future Directions

- Longitudinal tracking of actual EPPP outcomes
- Randomized controlled trials of specific features
- Expansion to other professional licensure examinations
- Integration with graduate program curricula

### Limitations

- Self-selected user population
- Reliance on self-reported demographic data
- Inability to control for external study resources
- Platform adoption and engagement variability

---

## References

Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006). Distributed practice in verbal recall tasks: A review and quantitative synthesis. *Psychological Bulletin, 132*(3), 354-380.

Chiesa, A., Calati, R., & Serretti, A. (2011). Does mindfulness training improve cognitive abilities? A systematic review of neuropsychological findings. *Clinical Psychology Review, 31*(3), 449-464.

Dunlosky, J., Rawson, K. A., Marsh, E. J., Nathan, M. J., & Willingham, D. T. (2013). Improving students' learning with effective learning techniques: Promising directions from cognitive and educational psychology. *Psychological Science in the Public Interest, 14*(1), 4-58.

El-Ghoroury, N. H., Galper, D. I., Sawaqdeh, A., & Bufka, L. F. (2012). Stress, coping, and barriers to wellness among psychology graduate students. *Training and Education in Professional Psychology, 6*(2), 122-134.

Hattie, J., & Timperley, H. (2007). The power of feedback. *Review of Educational Research, 77*(1), 81-112.

Hyun, J. K., Quinn, B. C., Madon, T., & Lustig, S. (2006). Graduate student mental health: Needs assessment and utilization of counseling services. *Journal of College Student Development, 47*(3), 247-266.

Maslach, C., & Leiter, M. P. (2016). Understanding the burnout experience: Recent research and its implications for psychiatry. *World Psychiatry, 15*(2), 103-111.

Roediger, H. L., & Butler, A. C. (2011). The critical role of retrieval practice in long-term retention. *Trends in Cognitive Sciences, 15*(1), 20-27.

Roediger, H. L., & Karpicke, J. D. (2006). Test-enhanced learning: Taking memory tests improves long-term retention. *Psychological Science, 17*(3), 249-255.

Zimmerman, B. J. (2002). Becoming a self-regulated learner: An overview. *Theory Into Practice, 41*(2), 64-70.

---

## Contact Information

[Contact details to be added]

---

*Poster prepared for [Conference Name, Year]*

*Correspondence concerning this poster should be addressed to [Author Contact Information]*
