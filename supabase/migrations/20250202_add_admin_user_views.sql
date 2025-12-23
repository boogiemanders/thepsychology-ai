-- Admin-only views to join user identity onto analytics tables

CREATE OR REPLACE VIEW public.admin_question_feedback AS
SELECT
  f.*,
  u.email,
  u.full_name
FROM public.question_feedback f
LEFT JOIN public.users u
  ON u.id = f.user_id;

REVOKE ALL ON public.admin_question_feedback FROM PUBLIC;
GRANT SELECT ON public.admin_question_feedback TO service_role;

CREATE OR REPLACE VIEW public.admin_review_queue AS
SELECT
  r.*,
  u.email,
  u.full_name
FROM public.review_queue r
LEFT JOIN public.users u
  ON u.id = r.user_id;

REVOKE ALL ON public.admin_review_queue FROM PUBLIC;
GRANT SELECT ON public.admin_review_queue TO service_role;

