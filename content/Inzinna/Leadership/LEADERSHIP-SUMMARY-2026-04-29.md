# Inzinna Build Summary. Week of April 16-29, 2026

> For leadership meeting, April 29, 2026

## The short version

Four big things since last meeting, plus one new ask.

1. **JustWorks Payroll Autofill is done.** Shipping to Carlos today. He can install it locally and start filling JustWorks time cards from the SimplePractice payroll CSV without waiting on the Chrome Web Store.
2. **Leadership Timeline is online** at `/lab/inzinna/timeline`. Every leadership project laid out month by month. Click-to-edit, templates for new entries, and Google Calendar sync wired up.
3. **Inzi consumer chatbot prototype** is live on the lab site. Patient-facing chat assistant with welcome, self-assessment, results, clinician matching, gentle crisis handoff, human handoff, and saved conversations. Three visual variations (Safe, Expressive, Experimental) and a Tweaks panel to flip between them in real time.
4. **Brand Strategy is now in the knowledge base.** Extracted the December 2025 brand strategy PDF (Complete Health / AuthorityInsite), chunked it, embedded it. The internal staff bot (DIPS Assistant) now answers brand questions with citations alongside Clinic Manual + Employee Handbook.
5. **New blocker: we need a Dun & Bradstreet (D-U-N-S) number for Inzinna.** Google now requires a verified D-U-N-S match number to publish under an organization account on the Chrome Web Store. Free to request, but takes about 30 days. We should start the request today so it doesn't bottleneck plugin shipping later.

The chatbot and brand work run on the same Supabase RAG backend. 178 chunks total: 99 Clinic Manual, 67 Employee Handbook, 12 Brand Strategy.

---

## 1. Inzi consumer chatbot prototype

**Where it lives:** `/lab/inzinna/chatbot`

**What's in it:**

- **Full Inzinna design system.** Pulled tokens, atoms, panel CSS, and launcher CSS from the AuthorityInsite handoff. Brain icon animates (gentle breathing, halo on "thinking"). Three panel variations: Safe (cream + navy), Expressive (cream + peach with hand-drawn squiggles), Experimental (dark navy with periwinkle orbs).
- **Ten conversation states** wired up: welcome, user typing, bot typing, quick-reply chips, self-assessment in progress, assessment results, clinician booking card, gentle crisis handoff, human handoff to care coordinator, saved conversation history.
- **Real backdrop.** Static homepage screenshot fills the whole viewport behind the floating chat panel. Looks like a real on-page widget on drinzinna.com.
- **Tweaks panel** (top left). Flip variation, launcher style, accent color (Royal, Peach, Plum, Mint), light/dark, open/closed, jump to any of the 10 demo states.
- **Real Live Q&A mode.** Type anything in the composer or pick "Live Q&A (real KB)" from the state dropdown. The composer hits the same RAG backend the staff bot uses. Bot answers with markdown formatting (numbered lists render as numbered cards, bullets get royal dots) and inline citation badges color-coded by source.
- **Real Inzinna therapists.** The booking demo card shows Dr. Karen Terry (PsyD), pulled from drinzinna.com/our-therapists. Full 11-therapist roster is exported in code for future matching work.

**Source citations:**
- Inline `[N]` markers in the answer render as small colored circles (royal = Manual, plum = Handbook, terra = Brand).
- Source pills below the bubble show the same numbered circles plus the chunk title.
- Numbers line up: pill #1 is what the answer cites as `[1]`.

**Where it lives in code:**
- Page route: `src/app/lab/inzinna/chatbot/`
- Files: `page.tsx`, `inzi-app.tsx`, `inzi-panel.tsx`, `inzi-cards.tsx`, `inzi-icons.tsx`, `inzi-launcher.tsx`, `inzi-tweaks.tsx`, `inzi-data.ts`, `inzi.css`
- Brand assets: `public/inzinna/`

## 2. Brand Strategy in the knowledge base

**What changed:**

- Extracted text from the December 2025 brand strategy PDF (Complete Health / AuthorityInsite).
- Wrote a curated `Inzinna-Brand-Strategy.md` with anchored sections: Brand Belief, Brand Promise, Brand Persona, Brand Essence, Brand Anthem, Brand Story Points, Consumer + Therapist Positioning, Strategic Framework, Category Context, Brand Identity, Voice & Tone Guidelines.
- Extended the chunker to ingest brand strategy as a third document type. 12 brand chunks generated.
- Re-embedded all 178 chunks into Supabase via OpenAI text-embedding-3-small.
- Updated the chatbot system prompt to bake in the Clear-Eyed Guide voice (grounded, direct, human, no hype, no marketing fluff).

**What this means in practice:** ask "what does Inzinna stand for" or "what's the brand voice" and the staff assistant answers from the strategy doc with citations. Voice rules apply to every answer, ops or brand.

## 3. DIPS Assistant relocated

**Where it lives now:** `/lab/inzinna/dips-assistant`

The internal staff bot moved to its own route to make room for the consumer-facing Inzi prototype at `/lab/inzinna/chatbot`. Same UI, same `/api/chatbot` API, same Supabase `kb_chunks` table. Nothing was lost. All 178 chunks still answer there.

---

## Try it in the meeting

Open `/lab/inzinna/chatbot`, type any of these into the composer to trigger Live Q&A:

### Brand strategy
- What does Inzinna stand for?
- What's the brand persona and voice?
- Why does Inzinna take insurance?
- Who is our consumer positioning aimed at?

### Clinic Manual (operations)
- What CPT code do I use for a 45-minute session?
- What's our cancellation policy?
- How do I book a new Zocdoc lead?
- What's the NY Child Abuse Hotline?
- Can I use ChatGPT with client info?
- What's our telehealth policy?

### Employee Handbook (HR)
- How much paid sick leave do I get?
- What's the 401k match?
- What's the Paid Family Leave policy?
- Jury duty leave?

### Should fail gracefully (proves it doesn't make stuff up)
- What's the weather in Tokyo? (returns "I don't have that in the manual")
- Should I use EMDR with this client? (clinical opinion, defers to Greg or Bret)

---

## What's still open

- **Chrome Web Store submission** for the three plugins. Same blockers as April 15: need Workspace + HIPAA BAA + access to inzinna.com to host the privacy policy.
- **Dun & Bradstreet (D-U-N-S) number for Inzinna.** Google now requires a verified D-U-N-S match number to publish under an organization account on the Chrome Web Store / Google Play. Free to request from Dun & Bradstreet, takes about 30 days to get issued. Need to start that request now so it's ready when the Workspace and BAA come through.
- **Inzi consumer chatbot is a prototype, not a product.** No real backend on the assessment flows or clinician booking yet. Live Q&A works because it shares the staff bot's RAG, but the patient-facing flows (PHQ-9 / GAD-7 screener, real clinician matching, real crisis hotline integration) need design and clinical sign-off before any patient sees it.
- **Brand identity decisions** (drop "Dr.", retain "Inzinna" master brand, soften "Psychological Services") are in the KB but not yet applied across products. The internal assistant is still titled "DIPS Assistant." Easy rename when leadership greenlights.
