export type ChangelogEntry = {
  date: string
  title: string
  body: string
  tags?: string[]
}

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    date: '2025-12-25',
    title: 'Recover improvements',
    tags: ['Recover', 'Admin'],
    body: [
      '- Added Recover chat logging (sessions + messages) in Supabase.',
      '- Added Recover admin view with transcript browsing.',
      '- Polished Recover admin layout (rails + tables + transcript sizing).',
    ].join('\n'),
  },
]

export function getLatestChangelogEntry(): ChangelogEntry | null {
  return CHANGELOG_ENTRIES[0] ?? null
}

