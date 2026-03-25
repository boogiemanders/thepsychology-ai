# KN Audit Summary

Generated at: 2026-03-25T17:20:48.807Z

## Scope

- Folder audited: `staging/review`
- Question files audited: 127
- Total questions audited: 1226

## Hard Failures

- Missing `kn`: 0
- Invalid `kn` values: 0
- Missing `kn_explanation`: 0

## Review Flags

- Domain conflicts (heuristic): 754
- Lexical conflicts (heuristic): 625
- High-confidence KN mismatches (both heuristics): 559

## By Source

| Source | Files | Questions | Missing KN | Invalid KN | Domain Conflicts | Lexical Conflicts | High-Confidence Issues |
|---|---:|---:|---:|---:|---:|---:|---:|
| AATBS | 12 | 36 | 0 | 0 | 5 | 1 | 0 |
| psychprep | 115 | 1190 | 0 | 0 | 749 | 624 | 559 |

## Top Files To Review

| File | Questions | Total Issues | High-Confidence Issues |
|---|---:|---:|---:|
| `staging/review/psychprep/5 Assessment/5-clinical-tests.json` | 83 | 82 | 68 |
| `staging/review/psychprep/8 Ethics/8-practice-issues.json` | 66 | 62 | 56 |
| `staging/review/psychprep/3 Social Psychology/3-helping-and-hurting.json` | 33 | 31 | 27 |
| `staging/review/psychprep/8 Ethics/8-standards-3-4.json` | 41 | 32 | 26 |
| `staging/review/psychprep/3 Social Psychology/3-group-influences.json` | 26 | 23 | 21 |
| `staging/review/psychprep/2 Learning and Memory/2-memory.json` | 52 | 38 | 14 |
| `staging/review/psychprep/8 Ethics/8-standards-5-6.json` | 27 | 20 | 14 |
| `staging/review/psychprep/3 Social Psychology/3-why-people-do-things.json` | 18 | 17 | 14 |
| `staging/review/psychprep/5 Assessment/5-cognitive-tests.json` | 18 | 17 | 14 |
| `staging/review/psychprep/7 Research and Stats/7-inferential-stats.json` | 18 | 16 | 13 |
| `staging/review/psychprep/8 Ethics/8-standards-1-2.json` | 15 | 13 | 13 |
| `staging/review/psychprep/6 Clinical Interventions/6-prevention-and-consultation.json` | 29 | 14 | 12 |
| `staging/review/psychprep/8 Ethics/8-standards-7-8.json` | 15 | 13 | 12 |
| `staging/review/psychprep/4 Development/4-bonding-and-attachment.json` | 30 | 25 | 11 |
| `staging/review/psychprep/2 Learning and Memory/2-stress-and-emotion.json` | 22 | 17 | 11 |
| `staging/review/psychprep/3 Social Psychology/3-influence.json` | 16 | 15 | 11 |
| `staging/review/psychprep/7 Research and Stats/7-correlation-and-regression.json` | 18 | 15 | 11 |
| `staging/review/psychprep/8 Ethics/8-standards-9-10.json` | 17 | 13 | 11 |
| `staging/review/psychprep/4 Development/4-body-growth.json` | 22 | 20 | 10 |
| `staging/review/psychprep/3 Social Psychology/3-connection.json` | 17 | 12 | 10 |

## Notes

- `Domain conflicts` are heuristic flags, not guaranteed errors. Some question files mix content from multiple EPPP domains.
- `Lexical conflicts` compare the KN description to the question text plus `kn_explanation`. They are useful for catching obviously wrong KNs, but they can still produce false positives.
- `High-confidence KN mismatches` require both a domain conflict and zero keyword overlap. These are the best first-pass cleanup targets.

Detailed findings: `staging/review/reports/kn-audit-details.json`
