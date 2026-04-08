# SCT/CDS Criteria Crosswalk For BAARS-IV

Saved on 2026-04-08 for the BAARS scorer workflow.

This file stores the SCT/CDS criteria list provided by the user, plus the crosswalk used in the BAARS clinical summary.

## Rating Rule Used In The BAARS Summary

A criterion is treated as supported only when the mapped BAARS-IV current symptom item is rated:

- `3 = Often`
- `4 = Very often`

Only the BAARS-IV current symptoms form includes the SCT items (`q19-q27`). The childhood form does not include this section.

## Criteria List

### Cognitive Disengagement Dimension

1. Excessive or maladaptive daydreaming (task-unrelated thought intrusions during goal-directed activity)
2. Prolonged episodes of blank staring unrelated to absence seizure activity
3. Persistent mental fogginess or clouded sensorium
4. Absorption in internal mentation (frequently "lost in thought" to the exclusion of environmental awareness)
5. Recurrent episodes of cognitive disengagement from the immediate external context ("spacing out" or "zoning out")
6. Frequent loss of cognitive set or train of thought
7. Impaired thought formulation or verbal expression (difficulty organizing and articulating thoughts)
8. Easily confused; difficulty with rapid or accurate comprehension of novel information
9. Slowed cognitive processing speed
10. Frequent retrieval failures during active discourse (e.g., forgetting intended verbalizations mid-conversation)

### Motor Hypoactivity Dimension

11. Diminished spontaneous motor activity; hypoactivity
12. Excessive daytime somnolence not attributable to a primary sleep disorder
13. Chronic fatigue or low energy disproportionate to activity level and not attributable to a medical condition
14. Psychomotor retardation

## BAARS-IV Current Symptoms Crosswalk

| Code | Dimension | Criterion | BAARS item(s) | Coverage | Notes |
| --- | --- | --- | --- | --- | --- |
| CD1 | Cognitive Disengagement | Excessive or maladaptive daydreaming (task-unrelated thought intrusions during goal-directed activity) | `q19` - Prone to daydreaming when I should be concentrating on something or working | Direct | Strong content match |
| CD2 | Cognitive Disengagement | Prolonged episodes of blank staring unrelated to absence seizure activity | None | Not assessed | No BAARS SCT item directly asks about blank staring |
| CD3 | Cognitive Disengagement | Persistent mental fogginess or clouded sensorium | `q23` - Spacey or "in a fog" | Direct | Strong content match |
| CD4 | Cognitive Disengagement | Absorption in internal mentation (frequently "lost in thought" to the exclusion of environmental awareness) | `q19` - Daydreaming during tasks | Partial | Related, but narrower than the full criterion |
| CD5 | Cognitive Disengagement | Recurrent episodes of cognitive disengagement from the immediate external context ("spacing out" or "zoning out") | `q23` - Spacey or "in a fog" | Partial | Related, but the BAARS wording is less specific |
| CD6 | Cognitive Disengagement | Frequent loss of cognitive set or train of thought | None | Not assessed | No direct BAARS SCT item |
| CD7 | Cognitive Disengagement | Impaired thought formulation or verbal expression (difficulty organizing and articulating thoughts) | None | Not assessed | No direct BAARS SCT item |
| CD8 | Cognitive Disengagement | Easily confused; difficulty with rapid or accurate comprehension of novel information | `q21` - Easily confused; `q27` - I don't seem to process information as quickly or as accurately as others | Direct | Criterion is covered across two BAARS items |
| CD9 | Cognitive Disengagement | Slowed cognitive processing speed | `q27` - I don't seem to process information as quickly or as accurately as others | Direct | Strong content match |
| CD10 | Cognitive Disengagement | Frequent retrieval failures during active discourse (e.g., forgetting intended verbalizations mid-conversation) | None | Not assessed | No direct BAARS SCT item |
| MH1 | Motor Hypoactivity | Diminished spontaneous motor activity; hypoactivity | `q25` - Underactive or have less energy than others | Direct | Closest BAARS hypoactivity item |
| MH2 | Motor Hypoactivity | Excessive daytime somnolence not attributable to a primary sleep disorder | `q20` - Have trouble staying alert or awake in boring situations | Partial | Captures sleepiness in a limited context, without ruling out sleep disorders |
| MH3 | Motor Hypoactivity | Chronic fatigue or low energy disproportionate to activity level and not attributable to a medical condition | `q24` - Lethargic, more tired than others; `q25` - Underactive or have less energy than others | Direct | Good symptom overlap, but BAARS does not rule out medical causes |
| MH4 | Motor Hypoactivity | Psychomotor retardation | `q26` - Slow moving | Partial | Related, but narrower and less specific than a full psychomotor retardation assessment |

## Reporting Guardrails

- Use this crosswalk only for the BAARS-IV current symptoms SCT items (`q19-q27`).
- Report direct matches as the strongest SCT/CDS evidence.
- Report partial matches as possible fits, not definitive confirmation.
- State clearly that not-assessed criteria cannot be judged from the BAARS form alone.
