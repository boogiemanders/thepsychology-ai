-- Backfill for Q110 (CHC theory most influenced which intelligence test?)
-- Re-keyed from SB5 to Woodcock-Johnson on 2026-05-13.
--
-- This script:
--   1. Previews rows that will change.
--   2. Flips is_correct for WJ-pickers (was false, now true) and SB5-pickers (was true, now false).
--   3. Updates correct_answer on each row so past exam reviews show "WJ" as correct.
--   4. Recalculates exam_history.correct_answers + score for affected exam_result_ids.
--
-- Run with: /usr/local/opt/libpq/bin/psql "$DATABASE_URL" -f scripts/backfill-q110-wj-correct.sql
-- Or paste step-by-step into Supabase SQL Editor.

\echo '=== Step 1: preview rows that will flip ==='

SELECT
  selected_answer,
  is_correct AS current_is_correct,
  CASE
    WHEN selected_answer = 'Woodcock-Johnson Tests of Cognitive Abilities' THEN TRUE
    WHEN selected_answer = 'Stanford-Binet Intelligence Test, 5th Edition' THEN FALSE
  END AS new_is_correct,
  user_id,
  exam_result_id,
  created_at
FROM exam_question_attempts
WHERE exam_type = 'practice'
  AND question_id = '110'
  AND selected_answer IN (
    'Woodcock-Johnson Tests of Cognitive Abilities',
    'Stanford-Binet Intelligence Test, 5th Edition'
  )
ORDER BY selected_answer, created_at DESC;

\echo '=== Step 2: capture affected exam_result_ids for later score recalculation ==='

CREATE TEMP TABLE q110_affected_exams AS
SELECT DISTINCT exam_result_id
FROM exam_question_attempts
WHERE exam_type = 'practice'
  AND question_id = '110'
  AND exam_result_id IS NOT NULL
  AND (
    (selected_answer = 'Woodcock-Johnson Tests of Cognitive Abilities' AND is_correct = FALSE)
    OR
    (selected_answer = 'Stanford-Binet Intelligence Test, 5th Edition' AND is_correct = TRUE)
  );

SELECT COUNT(*) AS affected_exam_result_count FROM q110_affected_exams;

\echo '=== Step 3: flip is_correct for WJ pickers (was false -> true) ==='

UPDATE exam_question_attempts
SET is_correct = TRUE
WHERE exam_type = 'practice'
  AND question_id = '110'
  AND selected_answer = 'Woodcock-Johnson Tests of Cognitive Abilities'
  AND is_correct = FALSE;

\echo '=== Step 4: flip is_correct for SB5 pickers (was true -> false) ==='

UPDATE exam_question_attempts
SET is_correct = FALSE
WHERE exam_type = 'practice'
  AND question_id = '110'
  AND selected_answer = 'Stanford-Binet Intelligence Test, 5th Edition'
  AND is_correct = TRUE;

\echo '=== Step 5: update correct_answer on every Q110 row (so past reviews show WJ) ==='

UPDATE exam_question_attempts
SET correct_answer = 'Woodcock-Johnson Tests of Cognitive Abilities'
WHERE exam_type = 'practice'
  AND question_id = '110'
  AND correct_answer = 'Stanford-Binet Intelligence Test, 5th Edition';

\echo '=== Step 6: recalculate exam_history score for each affected exam_result ==='

-- exam_history doesn't link to exam_result_id directly. It stores
-- correct_answers and score per (user_id, exam_type, created_at).
-- The clean way to fix is to recompute from the per-question rows.
-- We update the most-recent exam_history row per affected exam (joined by
-- user_id + exam_type + created_at proximity to exam_question_attempts).
--
-- Simpler/safer approach: recompute correct_answers from the live
-- exam_question_attempts table for each affected exam_result_id, and update
-- the matching exam_history row by user_id + matching created_at minute.

WITH per_attempt AS (
  SELECT
    eqa.exam_result_id,
    eqa.user_id,
    er.created_at AS attempt_created_at,
    er.exam_type,
    COUNT(*) FILTER (WHERE eqa.is_scored AND eqa.is_correct) AS new_correct,
    COUNT(*) FILTER (WHERE eqa.is_scored) AS new_total
  FROM exam_question_attempts eqa
  JOIN exam_results er ON er.id = eqa.exam_result_id
  WHERE eqa.exam_result_id IN (SELECT exam_result_id FROM q110_affected_exams)
  GROUP BY eqa.exam_result_id, eqa.user_id, er.created_at, er.exam_type
)
UPDATE exam_history h
SET
  correct_answers = pa.new_correct,
  score = CASE WHEN pa.new_total > 0 THEN ROUND((pa.new_correct::numeric / pa.new_total) * 100, 2) ELSE 0 END
FROM per_attempt pa
WHERE h.user_id = pa.user_id
  AND h.exam_type = pa.exam_type
  -- match exam_history row created within 60 seconds of the exam_result
  AND ABS(EXTRACT(EPOCH FROM (h.created_at - pa.attempt_created_at))) < 60;

\echo '=== Step 7: verify ==='

-- These should both return 0 rows after the flips.
SELECT 'WJ_still_wrong' AS check_name, COUNT(*) AS rows
FROM exam_question_attempts
WHERE exam_type = 'practice'
  AND question_id = '110'
  AND selected_answer = 'Woodcock-Johnson Tests of Cognitive Abilities'
  AND is_correct = FALSE
UNION ALL
SELECT 'SB5_still_right',
  COUNT(*)
FROM exam_question_attempts
WHERE exam_type = 'practice'
  AND question_id = '110'
  AND selected_answer = 'Stanford-Binet Intelligence Test, 5th Edition'
  AND is_correct = TRUE
UNION ALL
SELECT 'rows_with_old_correct_answer',
  COUNT(*)
FROM exam_question_attempts
WHERE exam_type = 'practice'
  AND question_id = '110'
  AND correct_answer = 'Stanford-Binet Intelligence Test, 5th Edition';

\echo '=== Done ==='
