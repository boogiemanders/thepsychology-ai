export interface TourStep {
  id: string
  targetSelector: string
  title: string
  description: string
  placement: 'top' | 'bottom' | 'left' | 'right'
  order: number
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'practice',
    targetSelector: '[data-tour="practice-card"]',
    title: 'Practice Exams',
    description: 'Take diagnostic and practice exams to assess your knowledge and identify areas for improvement.',
    placement: 'right',
    order: 1,
  },
  {
    id: 'prioritize',
    targetSelector: '[data-tour="prioritize-card"]',
    title: 'Prioritize',
    description: 'After taking exams, see personalized recommendations based on your weak areas.',
    placement: 'right',
    order: 2,
  },
  {
    id: 'study',
    targetSelector: '[data-tour="study-card"]',
    title: 'Study Lessons',
    description: 'Browse all 83 EPPP topics with AI tutoring and audio explanations.',
    placement: 'left',
    order: 3,
  },
  {
    id: 'recover',
    targetSelector: '[data-tour="recover-card"]',
    title: 'Recover',
    description: 'Take a break and reduce burnout with guided relaxation exercises.',
    placement: 'right',
    order: 4,
  },
  {
    id: 'exam-date',
    targetSelector: '[data-tour="exam-date-card"]',
    title: 'Set Your Exam Date',
    description: 'Set your target EPPP date to track your countdown and pace your studying.',
    placement: 'left',
    order: 5,
  },
  {
    id: 'study-streak',
    targetSelector: '[data-tour="study-streak-card"]',
    title: 'Study Streak',
    description: 'Track your consecutive study days and build momentum!',
    placement: 'left',
    order: 6,
  },
  {
    id: 'daily-goal',
    targetSelector: '[data-tour="daily-goal-card"]',
    title: 'Daily Goals',
    description: 'Set daily study goals to build consistency.',
    placement: 'left',
    order: 7,
  },
]
