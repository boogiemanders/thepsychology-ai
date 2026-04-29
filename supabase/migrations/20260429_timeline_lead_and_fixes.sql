-- Add explicit lead (DRI) column to timeline_projects.
-- Previously the UI treated contributors[0] as lead, which is fragile when
-- contributors get reordered through the picker.

ALTER TABLE timeline_projects
  ADD COLUMN IF NOT EXISTS lead text;

-- Backfill lead from existing contributors (Postgres arrays are 1-indexed).
UPDATE timeline_projects
SET lead = contributors[1]
WHERE lead IS NULL
  AND array_length(contributors, 1) >= 1;

-- Drop the orphan "TM" initial from project 02 contributors. TM is not a
-- registered collaborator. If TM was the lead, fall back to the next contributor.
UPDATE timeline_projects
SET contributors = array_remove(contributors, 'TM'),
    lead = CASE
      WHEN lead = 'TM' THEN (array_remove(contributors, 'TM'))[1]
      ELSE lead
    END
WHERE 'TM' = ANY(contributors);

-- Fix project 07 (Outreach + Partnership Development) phase overlap.
-- The "Foundation" build phase and the "Soft outreach" test phase both ran
-- 0.111 to 0.222, stacking on top of each other in the timeline view.
-- Foundation now ends at 0.111, soft outreach picks up from there.
UPDATE timeline_projects
SET phases = '[
  {"end":0.111,"kind":"build","label":"Foundation: branding, lists, materials","start":0},
  {"end":0.222,"kind":"test","label":"Soft outreach","start":0.111},
  {"end":0.444,"kind":"build","label":"Full outreach + pipeline","start":0.222},
  {"end":0.667,"kind":"rollout","label":"Proposals + conversion","start":0.444},
  {"end":0.889,"kind":"rollout","label":"Contract acquisition","start":0.667},
  {"end":1,"kind":"build","label":"Consolidation + 2027 plan","start":0.889}
]'::jsonb
WHERE timeline_key = 'inzinna-leadership' AND num = '07';
