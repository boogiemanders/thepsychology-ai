import fs from 'fs'
import path from 'path'
import { DOMAIN_FOLDER_MAP, DOMAIN_NUMBER_MAP, findTopicFile } from './topic-paths'

/**
 * EPPP Reference Content Loader
 *
 * Loads pre-existing comprehensive reference material from EPPP Guts directory.
 * This content is dense, academic-style material without metaphors or analogies.
 * It serves as source material for generating personalized teaching content.
 */

const EPPP_REFERENCE_DIR = path.join(process.cwd(), 'eppp-reference og')

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

  const filePath = findTopicFile(EPPP_REFERENCE_DIR, topicName, '.md', domainId)

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

  const filePath = findTopicFile(EPPP_REFERENCE_DIR, topicName, '.md', domainId)
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

  return findTopicFile(EPPP_REFERENCE_DIR, topicName, '.md', domainId)
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
