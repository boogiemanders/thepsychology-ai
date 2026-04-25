import type { VfTrial } from './types'

export const VF_TRIAL_DURATION_MS = 60_000

export interface VfStimulus {
  trial: VfTrial
  prompt: string
  promptLabel: string
  headline: string
  rules: string[]
}

export const VF_STIMULI: Record<VfTrial, VfStimulus> = {
  letter: {
    trial: 'letter',
    prompt: 'M',
    promptLabel: 'Letter M',
    headline: 'Words that start with M',
    rules: [
      'Say as many words as you can that start with the letter M.',
      'No proper nouns (names of people, places, brands).',
      'No numbers.',
      'Different forms of the same root only count once (run, runs, running = one).',
      'You have 60 seconds.',
    ],
  },
  category: {
    trial: 'category',
    prompt: 'Animals',
    promptLabel: 'Category: Animals',
    headline: 'Animals',
    rules: [
      'Say as many animals as you can.',
      'Any animal counts: pets, farm, wild, insects, fish, birds.',
      'Specific breeds count as separate entries (labrador, poodle).',
      'You have 60 seconds.',
    ],
  },
}
