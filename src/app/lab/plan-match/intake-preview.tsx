'use client'

import { useState } from 'react'

const FOCUS_OPTIONS = [
  'Anxiety',
  'Depression',
  'Trauma / PTSD',
  'Relationships',
  'ADHD',
  'Grief',
  'Self-esteem',
  'Work / career',
  'Identity',
  'Life transitions',
]

const MODALITY_OPTIONS = [
  'CBT',
  'IFS',
  'EMDR',
  'Psychodynamic',
  'ACT',
  'Somatic',
  'DBT',
  'Mindfulness',
  'Not sure yet',
]

const CULTURAL_OPTIONS = [
  'LGBTQ+ affirming',
  'BIPOC clinician',
  'Neurodivergent-affirming',
  'Faith-based',
  'Non-religious',
]

const LANGUAGE_OPTIONS = [
  'English',
  'Spanish',
  'Mandarin',
  'Cantonese',
  'Korean',
  'Vietnamese',
  'Tagalog',
  'Arabic',
  'Russian',
  'French',
]

const SCHEDULE_OPTIONS = [
  'Weekday mornings',
  'Weekday daytime',
  'Weekday evenings',
  'Weekends',
]

const GENDER_OPTIONS = ['No preference', 'Woman', 'Man', 'Non-binary']
const AGE_OPTIONS = ['No preference', '20s–30s', '30s–40s', '40s–50s', '50s+']

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-[12px] rounded-full px-3 py-1.5 border transition-colors duration-150 cursor-pointer ${
        selected
          ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
          : 'text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
      }`}
    >
      {children}
    </button>
  )
}

function SegButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 text-[13px] px-3 py-2 transition-colors duration-150 cursor-pointer ${
        selected
          ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
          : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
      }`}
    >
      {children}
    </button>
  )
}

function toggleIn(arr: string[], val: string) {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]
}

type QuestionProps = {
  n: number
  label: string
  children: React.ReactNode
}

function Question({ n, label, children }: QuestionProps) {
  return (
    <li className="grid grid-cols-[32px_1fr] gap-x-4">
      <span className="font-mono text-[10px] text-zinc-300 dark:text-zinc-600 pt-[3px]">
        {String(n).padStart(2, '0')}
      </span>
      <div>
        <p className="text-[15px] font-medium text-zinc-900 dark:text-zinc-100 mb-4">
          {label}
        </p>
        {children}
      </div>
    </li>
  )
}

export function IntakePreview() {
  const [focus, setFocus] = useState<string[]>([])
  const [modalities, setModalities] = useState<string[]>([])
  const [story, setStory] = useState('')
  const [structure, setStructure] = useState('')
  const [warmth, setWarmth] = useState('')
  const [cultural, setCultural] = useState<string[]>([])
  const [languages, setLanguages] = useState<string[]>([])
  const [schedule, setSchedule] = useState<string[]>([])
  const [telehealth, setTelehealth] = useState(true)
  const [gender, setGender] = useState('')
  const [ageRange, setAgeRange] = useState('')

  const segWrap =
    'flex rounded-md border border-zinc-200 dark:border-zinc-800 overflow-hidden divide-x divide-zinc-200 dark:divide-zinc-800'

  return (
    <ol className="space-y-14">
      <Question n={1} label="What are you working on?">
        <div className="flex flex-wrap gap-1.5">
          {FOCUS_OPTIONS.map((o) => (
            <Chip
              key={o}
              selected={focus.includes(o)}
              onClick={() => setFocus(toggleIn(focus, o))}
            >
              {o}
            </Chip>
          ))}
        </div>
      </Question>

      <Question n={2} label="Any therapy approach you’re drawn to?">
        <div className="flex flex-wrap gap-1.5">
          {MODALITY_OPTIONS.map((o) => (
            <Chip
              key={o}
              selected={modalities.includes(o)}
              onClick={() => setModalities(toggleIn(modalities, o))}
            >
              {o}
            </Chip>
          ))}
        </div>
      </Question>

      <Question n={3} label="In your own words, what brings you here?">
        <textarea
          value={story}
          onChange={(e) => setStory(e.target.value)}
          rows={4}
          placeholder="Totally optional. A sentence or a paragraph."
          className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-shadow duration-150 resize-none"
        />
      </Question>

      <Question n={4} label="Any style preference?">
        <div className="space-y-2.5">
          <div className={segWrap}>
            <SegButton selected={structure === 'structured'} onClick={() => setStructure('structured')}>
              Structured
            </SegButton>
            <SegButton selected={structure === 'either'} onClick={() => setStructure('either')}>
              Either
            </SegButton>
            <SegButton selected={structure === 'open'} onClick={() => setStructure('open')}>
              Open
            </SegButton>
          </div>
          <div className={segWrap}>
            <SegButton selected={warmth === 'warm'} onClick={() => setWarmth('warm')}>
              Warm
            </SegButton>
            <SegButton selected={warmth === 'either'} onClick={() => setWarmth('either')}>
              Either
            </SegButton>
            <SegButton selected={warmth === 'direct'} onClick={() => setWarmth('direct')}>
              Direct
            </SegButton>
          </div>
        </div>
      </Question>

      <Question n={5} label="Anything about them that matters to you?">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {CULTURAL_OPTIONS.map((o) => (
              <Chip
                key={o}
                selected={cultural.includes(o)}
                onClick={() => setCultural(toggleIn(cultural, o))}
              >
                {o}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {LANGUAGE_OPTIONS.map((o) => (
              <Chip
                key={o}
                selected={languages.includes(o)}
                onClick={() => setLanguages(toggleIn(languages, o))}
              >
                {o}
              </Chip>
            ))}
          </div>
        </div>
      </Question>

      <Question n={6} label="When can you meet?">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {SCHEDULE_OPTIONS.map((o) => (
              <Chip
                key={o}
                selected={schedule.includes(o)}
                onClick={() => setSchedule(toggleIn(schedule, o))}
              >
                {o}
              </Chip>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-zinc-500 dark:text-zinc-400">
              Open to telehealth?
            </span>
            <button
              type="button"
              onClick={() => setTelehealth(!telehealth)}
              className={`text-[12px] px-3 py-1 rounded-full border transition-colors duration-150 cursor-pointer ${
                telehealth
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                  : 'text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
              }`}
            >
              {telehealth ? 'Yes' : 'No'}
            </button>
          </div>
        </div>
      </Question>

      <Question n={7} label="Any other preferences?">
        <div className="grid sm:grid-cols-2 gap-4">
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-[13px] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-shadow duration-150"
          >
            <option value="">Gender preference</option>
            {GENDER_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <select
            value={ageRange}
            onChange={(e) => setAgeRange(e.target.value)}
            className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-[13px] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-shadow duration-150"
          >
            <option value="">Age range</option>
            {AGE_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      </Question>

      <li className="grid grid-cols-[32px_1fr] gap-x-4 pt-2">
        <span />
        <div>
          <button
            type="button"
            disabled
            className="w-full rounded-md bg-zinc-100 dark:bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
          >
            Show my matches — coming soon
          </button>
          <p className="mt-3 text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed">
            Preview only. Nothing saves yet.
          </p>
        </div>
      </li>
    </ol>
  )
}
