// Utility helpers for deriving topic/domain metadata from question source files

export interface TopicSourceMeta {
  topicName: string
  sectionName: string
  domainId: string | null
}

const SOURCE_FOLDER_TO_DOMAIN_ID: Record<string, string> = {
  '1 Biological Bases of Behavior : Physiological Psychology and Psychopharmacology': '1',
  '2 Cognitive-Affective Bases : Learning and Memory': '2',
  '3 Social Psychology': '3-social',
  '3 Cultural': '3-cultural',
  '4 Growth & Lifespan Development': '4',
  '4 Growth  : Lifespan Development': '4',
  '5 Assessment': '5-assessment',
  '5 Diagnosis : Psychopathology': '5-diagnosis',
  '5 Diagnosis  : Psychopathology': '5-diagnosis',
  '5 Test Construction': '5-test',
  '6 Treatment : Intervention': '6',
  '6 Treatment, Intervention, and Prevention : Clinical Psychology': '6',
  '7 Research Methods & Statistics': '7',
  '7 Research Methods : Statistics': '7',
  '8 Ethical : Legal : Professional Issues': '8',
  '8 Ethical  : Legal  : Professional Issues': '8',
  '2 3 5 6 Organizational Psychology': '3-5-6',
}

const LEADING_PREFIX_REGEX = /^[\d\s.:,-]+/

const removeFileExtension = (name: string) => name.replace(/\.[^.]+$/i, '')

const cleanTopicName = (fileName: string): string => {
  const noExt = removeFileExtension(fileName)
  return noExt.replace(LEADING_PREFIX_REGEX, '').trim()
}

const normalizePathSeparators = (input: string) => input.replace(/\\/g, '/')

const getDomainIdFromFolder = (folderName?: string): string | null => {
  if (!folderName) return null
  if (SOURCE_FOLDER_TO_DOMAIN_ID[folderName]) {
    return SOURCE_FOLDER_TO_DOMAIN_ID[folderName]
  }

  const trimmed = folderName.trim()
  if (!trimmed) return null

  const prefixMatch = trimmed.match(/^(\d+)/)
  if (prefixMatch) {
    const prefix = prefixMatch[1]
    switch (prefix) {
      case '1':
        return '1'
      case '2':
        return '2'
      case '3':
        if (trimmed.toLowerCase().includes('cultural')) return '3-cultural'
        if (trimmed.toLowerCase().includes('organizational')) return '3-5-6'
        return '3-social'
      case '4':
        return '4'
      case '5':
        if (trimmed.toLowerCase().includes('assessment')) return '5-assessment'
        if (trimmed.toLowerCase().includes('diagnosis')) return '5-diagnosis'
        if (trimmed.toLowerCase().includes('test')) return '5-test'
        return '5-assessment'
      case '6':
        return '6'
      case '7':
        return '7'
      case '8':
        return '8'
      default:
        return null
    }
  }

  return null
}

export function deriveTopicMetaFromSourceFile(sourceFile?: string | null): TopicSourceMeta | null {
  if (!sourceFile) return null
  const normalizedPath = normalizePathSeparators(sourceFile)
  const parts = normalizedPath.split('/')
  if (parts.length === 0) return null

  const fileName = parts.pop()
  if (!fileName) return null

  const folderName = parts.pop()
  const topicName = cleanTopicName(fileName)
  if (!topicName) return null

  return {
    topicName,
    sectionName: topicName,
    domainId: getDomainIdFromFolder(folderName),
  }
}
