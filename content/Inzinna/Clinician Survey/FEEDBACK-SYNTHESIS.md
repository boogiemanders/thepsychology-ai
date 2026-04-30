# Clinician Survey — Feedback Synthesis & Prioritization

**Inputs:** 7 respondents (P01–P08, no P06), `RAW-RESPONSES.md`, and current portfolio state (Assessment Tools, SimplePractice Notes, ZocDoc→SP, Payroll).

---

## Weighted Prioritization Framework

`Score = 3·Demand + 2·Intensity + 2·Readiness − 2·AdoptionRisk + 1·Moat`

| Dimension | Weight | Scoring 0–3 |
|---|---|---|
| Demand breadth | 3× | 0 = 1 clinician · 1 = 2–3 · 2 = 4–5 · 3 = 6–7 |
| Demand intensity | 2× | 0 = nice · 1 = secondary · 2 = Top-3 · 3 = #1 for ≥1 |
| Build readiness | 2× | 0 = not scoped · 1 = planned · 2 = partial · 3 = ready-to-ship |
| Adoption risk | −2× | 0 = none · 1 = accuracy · 2 = privacy · 3 = dealbreaker |
| Strategic moat | 1× | 0 = commodity · 1 = aligned · 2 = defensible · 3 = unique |

---

## Scored Backlog

| # | Feature | D | I | R | AR | M | Score | Tier |
|---|---|---|---|---|---|---|---|---|
| 1 | After-session note draft (SP Notes, live) | 3 | 3 | 3 | 1 | 2 | **25** | T1 |
| 2 | Supervision prep generator (new Phase 3.9) | 3 | 2 | 2 | 1 | 3 | **22** | T1 |
| 3 | Treatment planning suggestions (sidepanel, live) | 3 | 2 | 3 | 1 | 2 | **23** | T1 |
| 4 | VOB automation + ZocDoc→SP (ready-to-test) | 1 | 3 | 3 | 0 | 2 | **19** | T1 |
| 5 | D&TP auto-filler (Phase 4) | 3 | 2 | 2 | 1 | 2 | **21** | T2 |
| 6 | ADHD-RS school form + discrepancy view | 1 | 2 | 2 | 0 | 2 | **13** | T2 |
| 7 | BAARS + ADHD-RS ring-animation registration | 1 | 1 | 2 | 0 | 2 | **11** | T2 |
| 8 | Session audio + transcription (local whisper) | 2 | 1 | 1 | 2 | 3 | **9** | T3 |
| 9 | Didactics workstream (IFS/EMDR/assessment) | 1 | 3 | 1 | 0 | 1 | **12** | T2/3 |
| 10 | Roleplay practice | 0 | 0 | 0 | 1 | 1 | **−1** | T4 |
| 11 | Live transcription during session | 0 | 0 | 0 | 2 | 1 | **−3** | T4 |
| 12 | Payroll tool | 0 | 0 | 1 | 0 | 2 | **4** | Parallel track |

---

## Respondent-Priority Coverage Matrix

Every Top-3 priority from every respondent must map to a roadmap item. Gaps are flagged.

| Respondent | Priority | Maps to |
|---|---|---|
| P01 #1 | Trainings & education | Didactics workstream (T2/3) |
| P01 #2 | Peer/group support | **GAP** — not in software roadmap; defer to Inzinna operations |
| P01 #3 | Logistical expectations | **GAP** — operations, not tool |
| P02 #1 | VOB automation | ZocDoc→SP + VOB extension (T1) |
| P02 #2 | Simplified billing | Covered by ZocDoc→SP extension (T1) |
| P02 #3 | Localizing information | SP Notes knowledge corpus (already live) |
| P03 #1 | Reduced admin load | SP Notes ICE auto-fill + SOAP draft (T1) |
| P03 #2 | Individual supervision | Supervision prep generator (T1) |
| P03 #3 | Training | Didactics workstream (T2/3) |
| P04 #1 | Specialized modality training | Didactics workstream (T2/3) |
| P04 #2 | Reduced admin time | SP Notes (T1) |
| P04 #3 | Personalized client materials | **GAP** — add to T3 as "client-facing worksheet/letter generator" |
| P05 #1 | Assessment staffing | **GAP** — operations, not tool |
| P05 #2 | Expanded assessment library | Assessment Tools (BAARS live, ADHD-RS in flight, T2) |
| P05 #3 | Remote assessment adaptation | BAARS/ADHD-RS lab-site integration (T2) |
| P07 #1 | Schedule consistency | **GAP** — consider scheduling assistant in future |
| P07 #2 | Complex case support | Diagnostic workspace + clinical guidance (already live) |
| P07 #3 | Earlier sessions | **GAP** — scheduling, not tool |
| P08 #1 | Learn to do assessments | Didactics Module 3 + BAARS/ADHD-RS tools |
| P08 #2 | Supervision eligibility info | **GAP** — operations info document, not tool |
| P08 #3 | Build caseload | **GAP** — operations, not tool |

**Gap summary:** Personalized client-material generator is a credible T3 software addition. The remaining gaps are operations (scheduling, caseload building, supervision eligibility) — flag to Inzinna leadership, not the tool roadmap.

---

## Barrier → Mitigation Map

| Barrier (≥3 clinicians) | Mitigation | Where enforced |
|---|---|---|
| AI accuracy skepticism (6/7) | Source traceability on every suggestion | SP Notes sidepanel + note-draft UI |
| Technical / UI difficulties (5/7) | Error boundaries, graceful degradation, "report a problem" button | Extension codebase |
| Algorithmic bias (5/7) | Model card + bias-audit note in extension settings | Extension docs + `PRIVACY-MODEL.md` |
| Data privacy (4/7) | Local-only Ollama, HIPAA checklist, no telemetry | `HIPAA-CHECKLIST.md`, `PRIVACY-MODEL.md` |
| Ethics (4/7) | Environmental-impact disclosure (local model = low cost), anonymized-only training, opt-in | `PRIVACY-MODEL.md` |
| Therapeutic relationship impact (3/7) | "Complement, not replace" framing in all copy | Extension copy + README |
| Preference for human-only supervision (3/7) | Supervision prep is clinician-facing only; nothing pushed to supervisor without opt-in | `PRIVACY-MODEL.md` |

---

## Dealbreaker → Design Response

| Dealbreaker | Respondents | Design response |
|---|---|---|
| Supervisor sees follow/ignore suggestions | P01, P03, P05 | No telemetry. Any accept/reject stays local only. Document in privacy model and README. |
| AI feedback reviewed in supervision | P01, P05 | Supervision prep generated on clinician demand only; no auto-share; clinician controls whether to bring output into supervision. |
| AI flags high-risk to supervisor | P03 | If this is ever added, it must be per-clinician opt-in with prior consent for specific flag types. |
| Anonymized cases train future AI | P03 | Keep off by default. Anonymized training is opt-in only and documented in MEMO/Section-10 terms. |

---

## Positioning Anchor

Highest-Likert value prop: **"Help identify blind spots" (4.14/5)** and **"Complement human supervision" (4.00/5)**. All extension copy should lead with these. Do NOT lead with "timely feedback when supervisor unavailable" (3.29/5) — the lowest-rated framing.

---

## Pilot Plan

- **Pilots:** P07 (most enthusiastic, already uses AI note-taker) and P08 ("I have no concerns," eager early-career).
- **Duration:** ~2 weeks, 5–10 real sessions.
- **Check-in:** 20 min at end, plus re-administer the Likert portion.
- **Target lift:** ≥0.5 points on "Worth the time investment" and "Trust clinical accuracy" for these two.
- **Outreach draft:** see `pilot-outreach-P07-P08.md` in this folder.
