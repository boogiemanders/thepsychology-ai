-- Fix: add user-scoped INSERT policies for therapy_sessions and therapy_messages.
-- Without these, the API routes (which authenticate as the user via JWT) cannot write rows
-- even though getSupabaseClient was requested with requireServiceRole=true — passing the user's
-- Authorization header overrides the service_role JWT for RLS context.

drop policy if exists "Users can insert their own therapy sessions" on public.therapy_sessions;
create policy "Users can insert their own therapy sessions"
  on public.therapy_sessions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can insert their own therapy messages" on public.therapy_messages;
create policy "Users can insert their own therapy messages"
  on public.therapy_messages for insert
  with check (auth.uid() = user_id);
