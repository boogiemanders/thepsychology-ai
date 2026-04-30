# Demo Build Spec: Nature Scene + Audio for YC Recording

## Why this matters

Research evidence on what drives VR analgesia:

- Nature acts on **nociception directly** (thalamus, S2, posterior insula). Not just distraction. Steininger et al, Nat Commun 2025.
- **Blue + green** (water + plants) outperforms either alone. Wen et al meta-analysis 2024.
- **Audiovisual** beats visual-only. Nature sounds are functionally necessary, not decorative. Naef et al, Sci Rep 2022.
- Affective content (genuine enjoyment) drives analgesia. Ocean VR: d = 1.60 for pain tolerance increase. Raghuraman et al, Lancet RH Am 2026.

Our current demo: forest with floating orb. We can do better in 2 hours.

## Goal

Replace or augment current scene with an **ocean** scene that has:

1. Visible water (blue) and visible vegetation (green) in same frame
2. Spatial audio: waves, birds, light wind
3. Time of day: warm late afternoon (highest enjoyment ratings in personalization study)
4. Orb still at eye level, breath-driven

## Quest 3 build tasks (Unity)

### Task 1. Skybox + lighting

- Use URP/Lit shader (see memory: project_vr_orb_shader_fix.md, do NOT use URP/Unlit, breaks IL2CPP build)
- Skybox: warm sunset gradient (warm orange to soft blue overhead)
- Directional light: warm 5500K, low angle (45 degrees from horizon)
- Ambient: skybox-based

### Task 2. Ocean

- Free asset: Crest Ocean (Asset Store) OR Unity Standard Water
- Plane scaled to 200x200 at y=0
- Reflection probe at scene center
- Foam intensity low (we want calm not stormy)

### Task 3. Vegetation (the green half)

- Place a small island or coastal cliff with grass/palm tree silhouettes
- Don't model from scratch, use Unity Terrain + free tree pack (Polyhaven or Unity Asset Store)
- Position 30 units in front of player, slightly to the right

### Task 4. Spatial audio (most important)

- 3 audio sources, all 3D spatial blend = 1.0:
  - **Waves:** loop, attached to ocean plane center, falloff 5-50m
  - **Seabirds:** loop, attached to vegetation island, falloff 10-30m
  - **Wind:** loop, attached to player camera (always present), volume 0.3
- Free assets: freesound.org or Pixabay. Filter by "ocean ambient" "seagulls" "ocean wind"
- Mix: waves louder than birds louder than wind

### Task 5. Orb adjustments

- Keep at eye level
- Move it 2 units in front of player so the ocean is visible behind it
- Orb still drives off breath data (HRV target)
- Color shift logic stays unchanged (red high arousal -> green relaxed)

### Task 6. User personalization (stretch)

If extra time: dropdown menu before scene loads. Options: ocean, forest, mountain. Time of day: morning, afternoon, sunset. Even just 2 scene options sells the personalization story for the YC pitch without much extra build time.

## What to capture

After build:

1. Record 30-second in-headset capture. Hold meta button + record video. Output is 1024x1024.
2. Walk through:
   - 5 sec: scene loads, orb sits at eye level, ocean visible, audio plays
   - 5 sec: orb at baseline blue
   - 15 sec: slow breath, orb grows, blue to green
   - 5 sec: orb at relaxed state
3. Rerecord 10 plus times. Pick the take with cleanest color shift.

## Skip if running short on time

- Vegetation island (just blue ocean + sky still works)
- User personalization dropdown
- Don't skip: spatial audio. The audiovisual integration evidence is too strong.

## Estimated time

- Task 1-2: 30 min (skybox + ocean asset import)
- Task 3: 30 min (vegetation)
- Task 4: 30 min (audio sources + free asset download)
- Task 5: 15 min (orb adjustments)
- Recording: 30 min
- Total: ~2 hours

## Don't break

- Photon Fusion multiplayer build is in flight. Branch before this work or stash it. Adding a scene swap should not touch network code, but verify multiplayer still works after the swap.
- Keep URP/Lit only. URP/Unlit breaks IL2CPP builds (memory: project_vr_orb_shader_fix.md).
