# Code Review Notes

Hi! Thanks for taking a look. Here's context to make your review easier.

## What This Is

A Next.js 15 web app for EPPP exam preparation (psychology licensing exam).
Features AI-powered practice exams, progress tracking, and a coaching chat.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes (serverless on Vercel)
- **Database**: Supabase (PostgreSQL + Auth + Row-Level Security)
- **Payments**: Stripe (webhooks, customer portal)
- **AI**: OpenAI API for exam generation and coaching chat
- **Notifications**: Resend (email), Slack webhooks

## What I'd Love Feedback On

### Architecture (given your infra background)
- API route patterns in `src/app/api/`
- Auth flow in `src/context/auth-context.tsx`
- Database schema in `supabase/migrations/`

### Code Quality
- TypeScript usage and type safety
- Error handling patterns
- Any anti-patterns you spot

### General
- Would you feel confident onboarding to this codebase?
- Anything that screams "junior mistake"?

## Key Files to Start With

| Area | Path |
|------|------|
| Auth context | `src/context/auth-context.tsx` |
| API patterns | `src/app/api/stripe/webhook/route.ts` |
| DB schema | `supabase/migrations/` |
| Config | `next.config.mjs` |

## Not Looking For

- UI/design feedback (not my focus)
- Exam content review (that's domain-specific)

## Context

This is a side project I built with AI assistance. First production Next.js app.
Any feedback appreciated - no need to be gentle!
