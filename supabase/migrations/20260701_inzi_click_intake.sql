-- Interim HIPAA posture: the Inzi intake is click-only while BAAs are pending.
-- Callback requests store a phone number and a preset topic, nothing else,
-- so name/email must be allowed to be null. The columns stay for the planned
-- revert to full free-text intake once OpenAI/AWS/Neon BAAs are signed.

alter table inzi_messages alter column patient_name drop not null;
alter table inzi_messages alter column patient_email drop not null;
