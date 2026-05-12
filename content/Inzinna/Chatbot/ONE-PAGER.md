# Inzi — One Pager

## What it is

Inzi is an AI chat assistant for Inzinna Psychological Services. It lives in the corner of the site and answers visitor questions instantly, 24/7.

## Who it's for

**Patients & families:**
- "Do you take my insurance?"
- "How much is a session?"
- "How do I book an intake?"
- "What's the difference between CBT and DBT?"
- "Is one of your clinicians taking new patients?"

**Employers & referral partners:**
- "Do you offer consultation contracts?"
- "Can you do trainings for our team?"
- "Who do I talk to about a partnership?"

When a question needs a human, Inzi routes the visitor to scheduling or a specific clinician via a structured contact form — clinic staff get a notification email and can reply.

## What makes it different

- **Grounded.** Inzi only answers from a clinic-approved knowledge base (Clinic Manual, Employee Handbook, Brand Strategy). No hallucinations, no clinical opinions, no off-script answers. If it doesn't know, it says so.
- **Cited.** Every answer shows where it came from.
- **On-brand.** Voice tuned to the Inzinna brand strategy — direct, warm, no jargon, no marketing fluff.
- **Hands off clinical advice.** Trained to redirect anything clinical to "consult Greg or Bret."

## Where it goes

Embedded on Greg's site as a single script tag (or iframe). Same install as Google Analytics. Lives on every page by default.

## What it tracks

GA4 conversion events for: chat opened, message sent, booking started, booking submitted, clinician message sent, voice call started. Conversions flow into Greg's existing GA4 property automatically.

## What it costs

Inzinna operates and maintains Inzi. Greg's site pays nothing to host (one script tag). Per-conversation OpenAI cost is on the Inzinna side, typically pennies per visitor.

## What it doesn't do (yet)

- Doesn't take payments
- Doesn't access patient records or schedule appointments directly — it captures requests and routes them to staff
- Doesn't give clinical advice
- Doesn't store conversations (only structured contact form submissions)

## Roadmap

- v1 (now): FAQ, knowledge-base Q&A, booking handoff, clinician message handoff, voice
- v1.1: Conversion tracking on Greg's site (GA4)
- v2: Direct calendar integration (book without staff intermediation)
- v3: Employer consultation booking, intake assessment flow

## Status

Working prototype lives at `https://thepsychology.ai/lab/inzinna/chatbot`. Embed bundle for Greg's WP site is the next build step.

## Contact

dranders@drinzinna.com
