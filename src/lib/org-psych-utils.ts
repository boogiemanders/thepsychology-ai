/**
 * Helpers for identifying Organizational Psychology questions by source path.
 */
export function isOrgPsychSource(sourcePath?: string | null): boolean {
  if (!sourcePath) return false
  return sourcePath.includes('2 3 5 6 Organizational Psychology')
}

export function inferIsOrgPsych({
  explicitFlag,
  sourceFile,
  sourceFolder,
}: {
  explicitFlag?: boolean
  sourceFile?: string | null
  sourceFolder?: string | null
}): boolean {
  if (typeof explicitFlag === 'boolean') {
    return explicitFlag
  }

  return (
    isOrgPsychSource(sourceFolder) ||
    isOrgPsychSource(sourceFile) ||
    false
  )
}
