import { z } from 'zod'

export const messageSchema = z.object({
  session_id: z.string().uuid(),
  content: z.string().trim().min(1).max(4000),
})

export type MessageInput = z.infer<typeof messageSchema>

export const crisisResponseSchema = z.object({
  crisis: z.literal(true),
  message: z.string(),
  resources: z.array(
    z.object({
      label: z.string(),
      href: z.string(),
    })
  ),
})

export type CrisisResponse = z.infer<typeof crisisResponseSchema>
