# Demo Build Spec: Chronic Pain + ACT for YC Recording

## Why this matters

Personal use case: Tamilyn ring finger Zone I FDP repair (jersey finger, 75% of cases). Real patient, real rehab. Demo doubles as proof-of-concept.

Research evidence:

- **EaseVRx** (FDA-cleared 2021, Maddox et al, J Pain Res 2021). Sham-controlled RCT n=179: d=0.40-0.49 vs sham VR. Effects persist 12 months. Six core components: Pain Neuroscience Education, Diaphragmatic Breathing, Biofeedback, Mindfulness, **Cognitive Defusion**, Guided Relaxation.
- **ACT cognitive defusion** targets pain catastrophizing, the #1 mediator of chronic pain disability. Clouds-as-thoughts is the canonical metaphor (Hayes et al). Sullivan PCS items used as thought content.
- **VR-ACT** with sensor-driven adaptation: Kim & Choi, Front Psychiatry 2025. Real-time gamified ACT + biofeedback.
- **StableHandVR** RCT (n=150): hand-tracked VR for hand rehab, +63% voluntary ROM volume vs control. Kinesiophobia is the #1 barrier to rehab adherence.
- **Ocean nature scene**: d=1.60 for pain tolerance (Raghuraman et al, Lancet RH Am 2026). Already built in `Assets/Scenes/OceanNatureScene.unity`.

## Goal

Layer chronic pain + ACT on top of existing OceanNatureScene:

1. Pain neuroscience narrative (60s intro audio)
2. ACT cognitive defusion: thought-clouds drift across sky, dissolve when user approaches them
3. Already done: orb breath pacing + HRV color shift (existing `BreathingPacer` + `HRVEnvironmentController`)
4. Stretch: pre/post pain rating UI

## Tasks

### Task 1: Pain neuroscience narration

- One AudioSource on user camera. 2D (`spatialBlend = 0`). Plays once on scene start.
- Script (~60s, generated via macOS `say -v Samantha`):
  > "Pain is your brain's alarm. It evolved to protect you. In chronic pain, the alarm stays loud after the danger is gone. You cannot shut it off by force. But you can change how you relate to it. In a moment, clouds will drift across the sky. Each one carries a thought. Notice them. Do not argue with them. Just watch them pass. Your breath leads the way. Slow in. Slower out. Six breaths a minute. The orb in front of you grows with your inhale, settles with your exhale. Your body knows the path."
- Audio file: `Assets/Audio/Nature/narration.mp3` (already generated, in staging)

### Task 2: ACT cognitive defusion clouds

- `ACTCloudSpawner` MonoBehaviour. Drop on a GameObject in scene. No inspector wiring needed.
- Spawns sphere-clouds with `TextMeshPro` thought-words. Drift sideways through visual field.
- Eight thought words drawn from PCS (Pain Catastrophizing Scale): "broken", "never end", "afraid", "useless", "stuck", "ruined", "trapped", "alone".
- Defusion mechanic: walk close (or reach toward) cloud → cloud shrinks and disappears. Visualizes "noticing thoughts and letting them go."
- Spawn cadence: every 8-15s. Max 4 visible. Cloud height 5-12m. Drift speed 0.6 m/s. Despawn at 30m.
- Hand grab interaction is a stretch. Proximity dissolve works for demo.

### Task 3: Pre/post pain rating UI (stretch only)

- World-space Canvas, eye level, 1m forward.
- 0-10 numeric pad, big buttons, hand-pinchable.
- Logs to Console + file: timestamp, value.
- Skip if short on time. Use a paper Likert scale during demo recording.

## Time

- Task 1: 15 min (audio already staged, just wire AudioSource in scene)
- Task 2: 45 min (drop script in, run installer menu, tune spawn rate)
- Task 3: 30 min (stretch only)
- Total: ~60 min core, ~90 min with stretch

## Skip if running short

- Task 3 entirely
- Hand grab — proximity dissolve already in `ACTCloudSpawner`. Done.
- Don't skip the narration. The pain neuroscience reframe is the therapeutic anchor.

## Don't break

- Multiplayer build still in flight (Photon Fusion). Branch is `nature-demo`.
- Both `OceanNatureScene.unity` and `NatureScene.unity` should stay in Build Settings.
- `ACTCloudSpawner` is a plain MonoBehaviour. No Fusion dependency. Same code works in single-player and multiplayer mode (only the patient's instance spawns clouds, observer sees them locally).

## Research basis (file refs)

- `/Users/anderschan/thepsychology-ai/content/VR/OE Research/openevidence-vr-protocols-deep-dive.md` (EaseVRx component breakdown, ACT defusion section)
- `/Users/anderschan/thepsychology-ai/content/VR/OE Research/openevidence-vr-hand-rehab-flexor-tendon.md` (Tamilyn Zone I FDP context, kinesiophobia evidence)
- `/Users/anderschan/thepsychology-ai/content/VR/OE Research/openevidence-vr-multimodal-integration.md` (VR-ACT sensor adaptation framework, Kim & Choi 2025)
