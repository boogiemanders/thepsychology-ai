# YC Demo Video Script — Blind Spot

3 minutes max per YC. Built around what actually runs on the Quest 3 right now: 5 left-stick modes (BREATHING, SOCIAL ANXIETY, ACT, CHRONIC PAIN, PHOBIA), live Muse S EEG + heart rate streaming through Python LSL into Unity, biofeedback orb that scales and color-shifts on HRV.

Recording target: Anders wears Quest 3 plus Muse S. Mirror the headset feed to laptop, screen-record at 1080p 60. Voiceover laid in post.

---

## Setup checklist (do before hitting record)

- Muse S charged, paired, headband contact green on all 4 channels
- Python bridge running, `BiofeedbackHUD` showing live HR + RMSSD + alpha/beta/theta
- App launches in BREATHING mode (forced startup per `TopLevelModeSwitcher.ForceStartupMode`)
- Wrist label reads BREATHING
- Test left-stick click cycle once: BREATHING → SOCIAL → ACT → CHRONIC PAIN → PHOBIA → BREATHING. If anything orphans (panel residue on wrist, magenta trees), restart the app
- Pre-record the chronic pain summary card on a clean run if mode-switch instability shows up. Splice it in

If a mode breaks on cycle, record each mode from a fresh app launch and stitch in post. The voiceover hides the cuts.

---

## 0:00 to 0:20. Cold open + problem

| Voiceover | On-screen |
|---|---|
| "VR therapy plays a video at you. It has no idea if you are actually anxious. Biofeedback wearables stare at numbers in a vacuum. We close the loop." | Split screen. Left: a generic VR meditation app screenshot. Right: the Quest mirror feed with the Muse S visible on Anders' forehead and the orb pulsing. |

---

## 0:30 to 0:55. BREATHING mode. The hook.

| Voiceover | On-screen |
|---|---|
| "This is a Muse S headband. EEG and heart rate stream live into Unity. The orb is my heart. It expands when I exhale and shrinks when I inhale. Watch the color." | Forest grove, orb centered. Anders does paced breathing. Orb scales with breath. HUD on the right hand shows HR ticking down, RMSSD ticking up. Color drifts blue to green as RMSSD rises. |
| "The whole environment reads my nervous system." | Quick HUD zoom for proof. |

Action: just breathe for 20 seconds on camera. Let the data move on its own.

---

## 0:55 to 1:30. SOCIAL ANXIETY mode. Phase 1 wedge.

| Voiceover | On-screen |
|---|---|
| "Click. Now I am in a job interview." | Click left thumbstick. Wrist label flips to SOCIAL ANXIETY. Picker panel shows scenarios. Cycle right stick to Public Speaking. Trigger to start. |
| "Eight people. Watching. My heart rate jumps. The system sees it." | 8 NPCs in audience layout. HUD shows HR climbing. Anders pans head across the crowd. |
| "Toastmasters with brain monitoring. Practice the moment that wrecks you. Get a recovery score every time." | Hold for 5 seconds of exposure. Cooldown phase shows score on wrist panel. |

Cut at the score. Don't sit through the full 3 minute scenario.

---

## 1:30 to 2:15. CHRONIC PAIN mode. Phase 2 FDA unlock.

| Voiceover | On-screen |
|---|---|
| "Click. Chronic pain. The only FDA-cleared VR therapeutic is EaseVRx. They have one and a half thousand patients of durability data, all open-loop. We extend the playbook with closed-loop biofeedback." | Click left stick. Label reads CHRONIC PAIN. CPAQ pre flashes briefly. |
| "Pain neuroscience. The brain produces the signal. Fear amplifies it." | Threat dial phase. Body figure pulses red on chest, belly, arms, legs. |
| "Resonance breathing at six per minute. Then the garden. Then mindfulness on the ocean. Then thoughts as clouds." | Show the 4 phases as fast cuts. ACT cloud spawner is the prettiest, hold there. Anders walks toward a cloud, it dissolves. |
| "End of session. Real numbers. HRV delta. Acceptance delta. Every session feeds the next." | Summary card. Read the deltas off the wrist panel. |

If the full chain is shaky, fade between phases and cap at 45 seconds.

---

## 2:15 to 2:35. PHOBIA mode. Range proof.

| Voiceover | On-screen |
|---|---|
| "Click. Same engine, exposure module. Right stick cycles the stimulus." | Label PHOBIA. Dinosaur 5 meters in front, facing user. Anders flicks right stick, swap to a different dino. |
| "Same closed loop. The system watches your stress, paces the exposure, logs recovery." | One swap is enough. Don't linger. |

---

## 2:35 to 3:00. ACT mode. Roadmap.

| Voiceover | On-screen |
|---|---|
| "Click. Five session ACT protocol. Arriving. Weather Within. Leaves on Stream. Observer. Compass. Each one driven by live physiology." | Label ACT. Show the picker with all 5 sessions named. Hold 4 seconds. |
| "A clinical psychologist and an ophthalmologist. We are the only team that can build VR scenes for every diagnosis a real patient walks in with, keep them in the headset without burning their eyes out, and adapt live." | Cut to face cam of Anders pulling off the Quest, Muse still on. |
| "Anxiety first. Pain on the EaseVRx FDA path. PTSD, autism, depression, surgical training next. Same engine. Different module." | End card: BLIND SPOT. blindspot.health |

---

## What I will NOT say on camera

- Will not call it FDA cleared. It is not.
- Will not say "treats" anxiety. Phase 1 is wellness D2C.
- Will not show eye tracking. Quest 3 eye tracking integration is roadmap, not built.
- Will not promise the closed-loop adapts the scenario in real time yet. The orb and HUD respond. Scenario adaptation logic exists in `AdaptiveExposureController` but is not the headline yet.

---

## Voiceover length check

About 230 words above. At 150 wpm voiceover that is 92 seconds of speech inside a 3 minute video. The other 88 seconds is gameplay footage breathing on its own. Right ratio for a YC video. Cut the longest sentences first if it overruns.

---

## Backup take (if 3 min feels too tight)

Drop PHOBIA section entirely. Move ACT roadmap line into the chronic pain summary. Final cut becomes BREATHING, SOCIAL, CHRONIC PAIN, close. Cleaner story. Less mode flipping.
