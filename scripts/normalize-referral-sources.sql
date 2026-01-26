-- Normalize Facebook referral source variations to a single value
-- Run this in Supabase SQL Editor or via psql

-- Preview what will be changed (run this first)
SELECT referral_source, COUNT(*) as count
FROM users
WHERE referral_source IS NOT NULL
  AND (
    LOWER(referral_source) LIKE '%facebook%'
    OR LOWER(referral_source) = 'fb'
  )
GROUP BY referral_source
ORDER BY count DESC;

-- Normalize all Facebook variants to "Facebook"
UPDATE users
SET referral_source = 'Facebook'
WHERE referral_source IS NOT NULL
  AND referral_source != 'Facebook'
  AND (
    LOWER(referral_source) LIKE '%facebook%'
    OR LOWER(referral_source) = 'fb'
  );

-- Verify the update
SELECT referral_source, COUNT(*) as count
FROM users
WHERE referral_source IS NOT NULL
GROUP BY referral_source
ORDER BY count DESC;
