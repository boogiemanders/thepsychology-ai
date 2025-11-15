import fs from 'fs'
import path from 'path'

/**
 * EPPP Reference Content Loader
 *
 * Loads pre-existing comprehensive reference material from EPPP Guts directory.
 * This content is dense, academic-style material without metaphors or analogies.
 * It serves as source material for generating personalized teaching content.
 */

const EPPP_REFERENCE_DIR = path.join(process.cwd(), 'eppp-reference')

/**
 * Domain folder name mapping
 * Maps domain IDs to their folder names in eppp-reference/
 */
const DOMAIN_FOLDER_MAP: Record<string, string> = {
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

/**
 * Domain number extraction for file matching
 * Maps domain IDs to their numeric prefix in file names
 */
const DOMAIN_NUMBER_MAP: Record<string, string[]> = {
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
  '3-5-6': ['2', '3', '5', '6'], // Multi-domain topics
}

/**
 * Normalizes topic names for file matching
 * Handles differences between display names and file names:
 * - Converts "/" to "-"
 * - Converts "–" (en-dash) to "-" (hyphen)
 * - Removes "..." ellipsis
 * - Standardizes spacing
 */
function normalizeTopicName(topicName: string): string {
  return topicName
    .replace(/\//g, '-')           // Convert slash to hyphen
    .replace(/–/g, '-')            // Convert en-dash to hyphen
    .replace(/…/g, '')             // Remove ellipsis
    .replace(/\.\.\./g, '')        // Remove triple dots
    .replace(/\s+/g, ' ')          // Normalize whitespace
    .trim()
}

/**
 * Finds the file path for a given topic in a domain folder
 * Handles variations in file naming and multi-domain files
 */
function findTopicFile(domainFolder: string, topicName: string, domainNumbers: string[]): string | null {
  const folderPath = path.join(EPPP_REFERENCE_DIR, domainFolder)

  if (!fs.existsSync(folderPath)) {
    console.error(`Domain folder not found: ${folderPath}`)
    return null
  }

  const normalizedTopic = normalizeTopicName(topicName)
  const files = fs.readdirSync(folderPath)

  // Try to find exact match with domain number prefix
  for (const domainNum of domainNumbers) {
    const expectedFileName = `${domainNum} ${normalizedTopic}.md`
    const exactMatch = files.find(f => normalizeTopicName(f) === normalizeTopicName(expectedFileName))
    if (exactMatch) {
      return path.join(folderPath, exactMatch)
    }
  }

  // Fallback: Try fuzzy match (contains the topic name)
  const fuzzyMatch = files.find(file => {
    const normalizedFile = normalizeTopicName(file)
    return normalizedFile.includes(normalizedTopic) || normalizedTopic.includes(normalizedFile.replace('.md', ''))
  })

  if (fuzzyMatch) {
    return path.join(folderPath, fuzzyMatch)
  }

  console.error(`Topic file not found: ${topicName} in ${domainFolder}`)
  console.error(`Available files:`, files)
  return null
}

/**
 * Loads reference content for a given topic and domain
 *
 * @param topicName - The name of the topic (e.g., "Brain Regions/Functions – Cerebral Cortex")
 * @param domainId - The domain ID (e.g., "1", "3-social", "3-5-6")
 * @returns The raw markdown content from the reference file, or null if not found
 */
export function loadReferenceContent(topicName: string, domainId: string): string | null {
  const domainFolder = DOMAIN_FOLDER_MAP[domainId]
  const domainNumbers = DOMAIN_NUMBER_MAP[domainId]

  if (!domainFolder || !domainNumbers) {
    console.error(`Unknown domain ID: ${domainId}`)
    return null
  }

  const filePath = findTopicFile(domainFolder, topicName, domainNumbers)

  if (!filePath) {
    return null
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return content
  } catch (error) {
    console.error(`Error reading reference file ${filePath}:`, error)
    return null
  }
}

/**
 * Checks if reference content exists for a given topic
 *
 * @param topicName - The name of the topic
 * @param domainId - The domain ID
 * @returns True if the reference file exists, false otherwise
 */
export function referenceContentExists(topicName: string, domainId: string): boolean {
  const domainFolder = DOMAIN_FOLDER_MAP[domainId]
  const domainNumbers = DOMAIN_NUMBER_MAP[domainId]

  if (!domainFolder || !domainNumbers) {
    return false
  }

  const filePath = findTopicFile(domainFolder, topicName, domainNumbers)
  return filePath !== null && fs.existsSync(filePath)
}

/**
 * Gets the file path for a reference content file
 * Useful for debugging and logging
 */
export function getReferenceFilePath(topicName: string, domainId: string): string | null {
  const domainFolder = DOMAIN_FOLDER_MAP[domainId]
  const domainNumbers = DOMAIN_NUMBER_MAP[domainId]

  if (!domainFolder || !domainNumbers) {
    return null
  }

  return findTopicFile(domainFolder, topicName, domainNumbers)
}

/**
 * Lists all available reference files in a domain
 * Useful for debugging and verification
 */
export function listReferenceFiles(domainId: string): string[] {
  const domainFolder = DOMAIN_FOLDER_MAP[domainId]

  if (!domainFolder) {
    return []
  }

  const folderPath = path.join(EPPP_REFERENCE_DIR, domainFolder)

  if (!fs.existsSync(folderPath)) {
    return []
  }

  return fs.readdirSync(folderPath).filter(f => f.endsWith('.md'))
}
