import type { Metadata } from 'next'
import { ChatbotShell } from './chat-view'

export const metadata: Metadata = {
  title: 'DIPS Assistant | Inzinna Lab',
  description: 'Internal chatbot that answers staff questions from the DIPS Clinic Manual and Employee Handbook.',
}

const SAMPLE_QUESTIONS = [
  'What CPT code for a 45-minute session?',
  'What is the NY Child Abuse Hotline?',
  'How much paid sick leave do I get?',
  'How do I book a new Zocdoc lead?',
  "What's our cancellation policy?",
  'Can I use ChatGPT with client info?',
]

export default function ChatbotPage() {
  return <ChatbotShell sampleQuestions={SAMPLE_QUESTIONS} />
}
