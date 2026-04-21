import type { Metadata } from 'next'
import { JoinClient } from './JoinClient'

export const metadata: Metadata = {
  title: 'Join | Monikas',
  description: 'Join a Monikas party game.',
}

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  return <JoinClient code={code.toUpperCase()} />
}
