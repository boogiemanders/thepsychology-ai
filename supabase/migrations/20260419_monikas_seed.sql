-- Monikas seed data. Idempotent — safe to re-run.

-- -------------------------------------------------------------------
-- Fallback deck
-- -------------------------------------------------------------------
INSERT INTO monikas_fallback_decks (id, name, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Fallback v1', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO monikas_fallback_deck_cards (fallback_deck_id, text)
SELECT '00000000-0000-0000-0000-000000000001', t
FROM (VALUES
  -- Truth-based social cards
  ('the person who says "we should hang out" and never means it'),
  ('when your Uber driver is way too chatty'),
  ('the fake laugh you do for your boss'),
  ('a type of person everyone here knows'),
  ('a painfully specific social behavior'),
  ('someone overexplaining why they were late'),
  ('the aunt who sends chain emails'),
  ('your friend who only texts "haha"'),
  ('the guy who claims he invented a meme'),
  ('the coworker who replies-all to everything'),
  ('that one friend who is always "five minutes away"'),
  ('someone who says they don''t watch TV'),
  ('a couple that''s clearly about to break up'),
  ('the person overfiling a work complaint'),
  ('a parent posting on Facebook'),
  ('someone pretending to understand wine'),
  ('your cousin who found crypto last week'),
  ('a guy reading a self-help book in public'),
  ('the dog owner who talks like the dog'),
  ('someone who says "no offense, but"'),
  -- Pop culture staples
  ('Beyonce'),
  ('The Rock'),
  ('Oprah'),
  ('Shrek'),
  ('Gandalf'),
  ('Spider-Man'),
  ('Darth Vader'),
  ('Taylor Swift'),
  ('SpongeBob'),
  ('Batman'),
  ('Frodo Baggins'),
  ('Harry Potter'),
  ('Mickey Mouse'),
  ('Snoop Dogg'),
  ('Mr Rogers'),
  -- Everyday objects / concepts
  ('a cactus'),
  ('a traffic cone'),
  ('a microwave'),
  ('a glacier'),
  ('a weighted blanket'),
  ('a toaster'),
  ('a hotel ice machine'),
  ('a vending machine'),
  ('a fire escape'),
  ('a dentist chair'),
  ('a karaoke machine'),
  ('a waterbed'),
  ('a treadmill'),
  ('a hand dryer'),
  ('a revolving door'),
  -- Activities / moments
  ('pretending to understand a stock tip'),
  ('parallel parking in front of strangers'),
  ('walking into the wrong meeting'),
  ('finishing a group project alone'),
  ('texting your ex by accident'),
  ('losing your phone inside your bag'),
  ('being stuck in an elevator'),
  ('trying to quietly unwrap candy'),
  ('sneezing during a quiet moment'),
  ('dropping your food at a restaurant'),
  ('forgetting someone''s name at a reunion'),
  ('laughing at a funeral'),
  ('arriving too early to a party'),
  ('your ringtone going off in a library'),
  ('pretending to be interested in a tour'),
  -- Jobs
  ('a substitute teacher'),
  ('a bouncer'),
  ('a wedding DJ'),
  ('a TSA agent'),
  ('a TV weatherman'),
  ('a sports commentator'),
  ('a chiropractor'),
  ('a food critic'),
  ('a mall Santa'),
  ('a motivational speaker'),
  -- Specific vibes
  ('mild disappointment'),
  ('chaotic confidence'),
  ('quiet rage'),
  ('performative sadness'),
  ('dramatic silence')
) AS v(t)
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------
-- Preset avatars (12)
-- Image paths point to /public/images/monikas/avatars/ — PNGs added later.
-- -------------------------------------------------------------------
INSERT INTO monikas_preset_avatars (name, image_url, sort_order) VALUES
  ('Cat',       '/images/monikas/avatars/cat.png', 0),
  ('Dog',       '/images/monikas/avatars/dog.png', 1),
  ('Fox',       '/images/monikas/avatars/fox.png', 2),
  ('Bear',      '/images/monikas/avatars/bear.png', 3),
  ('Raccoon',   '/images/monikas/avatars/raccoon.png', 4),
  ('Owl',       '/images/monikas/avatars/owl.png', 5),
  ('Penguin',   '/images/monikas/avatars/penguin.png', 6),
  ('Frog',      '/images/monikas/avatars/frog.png', 7),
  ('Octopus',   '/images/monikas/avatars/octopus.png', 8),
  ('Shark',     '/images/monikas/avatars/shark.png', 9),
  ('Robot',     '/images/monikas/avatars/robot.png', 10),
  ('Ghost',     '/images/monikas/avatars/ghost.png', 11)
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------
-- Acting modifiers (20)
-- -------------------------------------------------------------------
INSERT INTO monikas_acting_modifiers (code, label, description, category) VALUES
  ('divorced_magician',    'Divorced magician',        'Like a birthday-party magician whose life fell apart', 'character'),
  ('football_coach',       'Football coach',           'Yelling, clipboard energy, dead serious', 'character'),
  ('church_auntie',        'Church auntie',            'Loud, affectionate, slightly judgmental', 'character'),
  ('spy_hiding',           'Spy hiding something',     'Suspiciously calm, eyes darting', 'character'),
  ('substitute_teacher',   'Substitute teacher on edge','One step from losing it completely', 'character'),
  ('sports_commentator',   'Sports commentator',       'Narrating everything with intensity', 'character'),
  ('movie_trailer',        'Dramatic movie trailer',   'Deep voice, long pauses, big claims', 'character'),
  ('villain',              'Villain',                  'Slow, menacing, too pleased with yourself', 'character'),
  ('serious_professor',    'Serious professor',        'Pedantic, underlining every word', 'character'),
  ('trying_not_to_cry',    'Trying not to cry laughing','About to break completely', 'mood'),
  ('exhausted_parent',     'Exhausted parent',         'Zero energy, every sentence is a sigh', 'character'),
  ('new_age_guru',         'New-age guru',             'Everything is a vibration', 'character'),
  ('weatherman',           'TV weatherman',            'Cheerful, hand-waving, points at nothing', 'impression'),
  ('news_anchor',          'Stern news anchor',        'Formal, clipped, overly serious', 'impression'),
  ('villain_monologue',    'Villain monologue',        'Long pauses, big reveal', 'character'),
  ('royal',                'Royalty',                  'Like you are being watched by cameras', 'character'),
  ('exorcist',             'Exorcist',                 'Low, tense, rhythmic chanting', 'character'),
  ('karaoke_singer',       'Karaoke singer',           'Confident, off-key, emotional', 'character'),
  ('reality_show_host',    'Reality show host',        'Pause for drama, stare into camera', 'character'),
  ('conspiracy_theorist',  'Conspiracy theorist',      'Everything connects, nothing is safe', 'character')
ON CONFLICT (code) DO NOTHING;

-- -------------------------------------------------------------------
-- Recap lines (15, keyed to trigger types)
-- -------------------------------------------------------------------
INSERT INTO monikas_recap_lines (code, label, trigger_type) VALUES
  ('many_skips_1',       'That was somehow worse than the clue.',     'many_skips'),
  ('many_skips_2',       'A bold choice, honestly.',                  'many_skips'),
  ('many_skips_3',       'Speed-running skip key, respect.',           'many_skips'),
  ('zero_guesses_1',     'No one helped. Respect.',                    'zero_guesses'),
  ('zero_guesses_2',     'The room stayed silent for a reason.',       'zero_guesses'),
  ('zero_guesses_3',     'Stunning lack of help from the team.',       'zero_guesses'),
  ('fast_success_1',     'Too easy. Suspicious.',                      'fast_success'),
  ('fast_success_2',     'Somehow, it worked.',                        'fast_success'),
  ('fast_success_3',     'That was unreasonably quick.',               'fast_success'),
  ('total_panic_1',      'That went bad immediately.',                 'total_panic'),
  ('total_panic_2',      'Full chaos. Zero plan.',                     'total_panic'),
  ('obvious_misplay_1',  'A clean and clear mistake.',                 'obvious_misplay'),
  ('obvious_misplay_2',  'We all saw that.',                           'obvious_misplay'),
  ('miracle_comeback_1', 'A miraculous save. Nobody earned it.',       'miracle_comeback'),
  ('miracle_comeback_2', 'Somehow the team carried that.',             'miracle_comeback')
ON CONFLICT (code) DO NOTHING;

-- -------------------------------------------------------------------
-- Card suggestion prompts (20, truth-based)
-- -------------------------------------------------------------------
INSERT INTO monikas_card_suggestion_prompts (text, category, sort_order) VALUES
  ('the person who says "we should hang out" and never means it', 'social', 0),
  ('when your Uber driver is way too chatty', 'social', 1),
  ('that fake laugh you do for your boss', 'social', 2),
  ('a type of person everyone here knows', 'social', 3),
  ('a painfully specific social behavior', 'social', 4),
  ('someone overexplaining why they were late', 'social', 5),
  ('the aunt who sends chain emails', 'family', 6),
  ('a parent posting on Facebook', 'family', 7),
  ('your cousin who found crypto last week', 'family', 8),
  ('the person at the party who corners you about their startup', 'social', 9),
  ('someone pretending to understand wine', 'social', 10),
  ('the friend who is always "five minutes away"', 'social', 11),
  ('someone who says "no offense, but"', 'social', 12),
  ('the coworker who replies-all to everything', 'work', 13),
  ('the boss who says "circle back" too much', 'work', 14),
  ('a Monday morning meeting that should have been an email', 'work', 15),
  ('when someone shares their screen and the desktop is chaos', 'work', 16),
  ('a group chat notification you regret opening', 'social', 17),
  ('the person in your life who sends 14 texts in a row', 'social', 18),
  ('trying to leave a group dinner early without being rude', 'social', 19)
ON CONFLICT DO NOTHING;
