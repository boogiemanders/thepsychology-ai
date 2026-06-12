# Video Overlay Design System

Every color, font, and screen position in the TikTok overlays comes from one
file: `src/design.ts`. Change a value there (or tell Claude, e.g. "make the
accent teal") and every video picks it up on the next render. Nothing is
hard-coded in the components.

## Tokens

| Token | Current value | What it changes | Where you see it |
| --- | --- | --- | --- |
| `SITE_BG` | `#18181B` (near-black) | Background of every dark panel | Question card, reveal, diagram, pullquote, strike row, end card |
| `ACCENT` | `#d97757` (warm coral) | The one brand pop color | Correct-answer bar + letter, ".ai" in end card, badge ring, diagram arrowheads, "pass" in the hook captions |
| `FONT_GEIST` | Geist | Font for all product surfaces | Every panel and card (matches thepsychology.ai) |
| `PANEL_RADIUS` | `28` | Corner roundness of panels | All floating panels |
| `PANEL_SHADOW` | soft black blur | Drop shadow under panels | All floating panels |
| `ART_PANEL_BG` | `#ffffff` | Background of the founder-art panel | White card behind the hand-drawn art |
| `ART_CAPTION_COLOR` | `#52525b` (dark gray) | Caption text on the white art panel | Line under the artwork |
| `TEXT_PRIMARY` | `#fafafa` (white) | Headline/stem text on dark panels | Question stem, choice letters, URL |
| `TEXT_BODY` | `#d4d4d8` (light gray) | Body text on dark panels | Answer-choice text |
| `TEXT_MUTED` | `#a1a1aa` (gray) | Secondary text on dark panels | Clip captions, strike reasons, "EPPP Prep" subline, diagram labels |
| `BADGE_BG` | `SITE_BG` at ~85% | Domain chip background | "ASSESSMENT" style chip at the top |
| `CAPTION_FONT_SIZE` | `54` | Caption size (Inter styles) | "clean" and "box" captions |
| `CAPTION_FONT_SIZE_UPPER` | `58` | Caption size (uppercase styles) | "outline" and "yellow" captions |
| `CAPTION_COLOR` | white | Caption fill color | All caption styles except "yellow" |
| `CAPTION_YELLOW` | `#FFE135` | Loud caption color | "yellow" style only |
| `CAPTION_STROKE_COLOR` | black | Outline around caption letters | Keeps captions readable over bright frames |
| `CAPTION_BOTTOM_PERCENT` | `32` | How far captions sit above the bottom edge | The caption line, the end card |
| `TOP_ZONE_PADDING_TOP` | `7%` | Where the floating top panel starts | Founder art and clips, above the head |
| `CHEST_ZONE_PADDING_TOP` | `52%` | Where chest-level rows land | Diagrams and wrong-answer strikes |

## Typography rules

- **Geist** = product surfaces. Anything that looks like the app (cards,
  panels, badges, end card) uses Geist, same as the website.
- **Inter** = captions. The spoken-word captions use Inter (heavy weight,
  thin black stroke). The louder alternate styles use Montserrat, but
  "clean" Inter is the founder's pick.
- One caption font per video. Never mix caption styles mid-video.

## Layout rules (1080x1920, 9:16)

- **Captions never move.** They live at 32% from the bottom, above the
  TikTok UI (which covers roughly the bottom quarter of the screen).
- **Art floats above the head.** The founder-art / clip panel pins to the
  top zone (7% padding) so it never covers the speaker's face or mouth.
- **Diagrams and strikes sit at chest level** (52% padding) so the face
  stays clear while the avatar talks.
- **TikTok safe zones:** keep content out of the bottom ~28% (UI) and the
  far right edge (like/comment buttons). Everything above respects this.

## Animation principles

- Calm bezier everywhere: `Easing.bezier(0.16, 1, 0.3, 1)`. No bounce,
  no spring, no overshoot.
- One idea on screen at a time. Cues never stack; an earlier panel hands
  off the moment the next one starts.
- Entrances are a quick fade plus a small rise or settle (24px slide or
  2-3% scale). Exits are hard cuts on the cue boundary.
- The founder art gets one extra "living" move: a gentle ~3% vertical bob
  on a slow sine. The artwork itself is never stretched or warped.

## Changing the look

Edit the values in `src/design.ts` and re-render, or just tell Claude what
you want ("make the accent teal", "captions bigger", "panels less round").
One token change updates every video from then on.
