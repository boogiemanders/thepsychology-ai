export interface TourStep {
  id: string
  targetSelector: string
  title: string
  description: string
  placement: 'top' | 'bottom' | 'left' | 'right'
  order: number
}

export const TOPIC_TEACHER_TOUR_STEPS: TourStep[] = [
  {
    id: 'lesson-content',
    targetSelector: '[data-tour="lesson-content"]',
    title: 'Your AI Lesson',
    description: 'This is your personalized lesson. Scroll through to read the content, with examples tailored just for you.',
    placement: 'bottom',
    order: 1,
  },
  {
    id: 'audio-play',
    targetSelector: '[data-tour="audio-play"]',
    title: 'Listen Along',
    description: 'Press play to hear the lesson read aloud. Great for learning on the go!',
    placement: 'bottom',
    order: 2,
  },
  {
    id: 'read-along',
    targetSelector: '[data-tour="read-along"]',
    title: 'Read-Along Mode',
    description: 'Enable this to highlight words as they\'re spoken. Helps with focus and retention.',
    placement: 'bottom',
    order: 3,
  },
  {
    id: 'playback-speed',
    targetSelector: '[data-tour="playback-speed"]',
    title: 'Adjust Speed',
    description: 'Speed up or slow down the audio. 1.75x is recommended for efficient learning.',
    placement: 'bottom',
    order: 4,
  },
  {
    id: 'interests-input',
    targetSelector: '[data-tour="interests-input"]',
    title: 'Personalize Your Lesson',
    description: 'Add your interests (sports, TV shows, hobbies) to get custom examples that make concepts stick.',
    placement: 'bottom',
    order: 5,
  },
  {
    id: 'language-input',
    targetSelector: '[data-tour="language-input"]',
    title: 'Choose Your Language',
    description: 'Prefer learning in another language? Set your preferred language and lessons will be translated for you.',
    placement: 'bottom',
    order: 6,
  },
  {
    id: 'question-input',
    targetSelector: '[data-tour="question-input"]',
    title: 'Ask Questions',
    description: 'Confused about something? Ask follow-up questions and get instant AI explanations.',
    placement: 'top',
    order: 7,
  },
  {
    id: 'quiz-button',
    targetSelector: '[data-tour="quiz-button"]',
    title: 'Test Your Knowledge',
    description: 'Ready to practice? Take a quick quiz to reinforce what you learned.',
    placement: 'top',
    order: 8,
  },
]
