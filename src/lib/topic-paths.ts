import fs from 'fs'
import path from 'path'

export const DOMAIN_FOLDER_MAP: Record<string, string> = {
  '1': '1 Biological Bases of Behavior : Physiological Psychology and Psychopharmacology',
  '2': '2 Cognitive-Affective Bases : Learning and Memory',
  '3-social': '3 Social Psychology',
  '3-cultural': '3 Cultural',
  '4': '4 Growth & Lifespan Development',
  '5-assessment': '5 Assessment',
  '5-diagnosis': '5 Diagnosis : Psychopathology',
  '5-test': '5 Test Construction',
  '6': '6 Treatment, Intervention, and Prevention : Clinical Psychology',
  '7': '7 Research Methods & Statistics',
  '8': '8 Ethical : Legal : Professional Issues',
  '3-5-6': '2 3 5 6 Organizational Psychology',
}

export const DOMAIN_NUMBER_MAP: Record<string, string[]> = {
  '1': ['1'],
  '2': ['2'],
  '3-social': ['3'],
  '3-cultural': ['3'],
  '4': ['4'],
  '5-assessment': ['5'],
  '5-diagnosis': ['5'],
  '5-test': ['5'],
  '6': ['6'],
  '7': ['7'],
  '8': ['8'],
  '3-5-6': ['2', '3', '5', '6'],
}

export function normalizeTopicName(topicName: string): string {
  return topicName
    .replace(/\//g, '-')
    .replace(/–/g, '-')
    .replace(/…/g, '')
    .replace(/\.\.\./g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function getSearchDomainIds(preferredDomainId?: string | null): string[] {
  if (preferredDomainId && DOMAIN_FOLDER_MAP[preferredDomainId]) {
    return [preferredDomainId]
  }
  return Object.keys(DOMAIN_FOLDER_MAP)
}

/**
 * Finds the file path for a topic within a base directory.
 * Automatically handles domain folder lookups and common filename variations.
 */
export function findTopicFile(
  baseDir: string,
  topicName: string,
  extension: string,
  domainId?: string | null
): string | null {
  const normalizedTopic = normalizeTopicName(topicName)
  const searchDomains = getSearchDomainIds(domainId)

  for (const domainKey of searchDomains) {
    const domainFolder = DOMAIN_FOLDER_MAP[domainKey]
    const domainNumbers = DOMAIN_NUMBER_MAP[domainKey]

    if (!domainFolder || !domainNumbers) {
      continue
    }

    const folderPath = path.join(baseDir, domainFolder)
    if (!fs.existsSync(folderPath)) {
      continue
    }

    const files = fs.readdirSync(folderPath).filter((file) => file.toLowerCase().endsWith(extension.toLowerCase()))

    for (const domainNumber of domainNumbers) {
      const expectedName = `${domainNumber} ${normalizedTopic}${extension}`
      const exactMatch = files.find(
        (file) => normalizeTopicName(file) === normalizeTopicName(expectedName)
      )
      if (exactMatch) {
        return path.join(folderPath, exactMatch)
      }
    }

    const fuzzyMatch = files.find((file) => {
      const normalizedFile = normalizeTopicName(file.replace(extension, ''))
      return (
        normalizedFile.includes(normalizedTopic) ||
        normalizedTopic.includes(normalizedFile)
      )
    })

    if (fuzzyMatch) {
      return path.join(folderPath, fuzzyMatch)
    }
  }

  return null
}
