import { staticFile } from "remotion";
import { loadFont } from "@remotion/fonts";
import { loadFont as loadInterTitle } from "@remotion/google-fonts/Inter";

// Single source of truth for the overlay design system. Every color, font,
// radius, shadow, and screen position the components use lives here — change
// a value in this file and every video picks it up on the next render.
// Founder-readable explanations: video-overlay/DESIGN.md.

// Same font as thepsychology.ai (Geist Sans, loaded site-wide via next/font);
// the variable woff2 ships in the `geist` npm package and is copied into
// public/fonts/. Loading lives here so any component using FONT_GEIST gets it.
loadFont({
  family: "Geist",
  url: staticFile("fonts/Geist-Variable.woff2"),
});

// --- Brand colors -----------------------------------------------------------

// Site's dark --background. Every dark panel (card, diagram, pullquote...).
export const SITE_BG = "#18181B";
// The one accent color (warm coral, Anthropic-adjacent). Used sparingly:
// correct-answer highlight, ".ai" in the end card, arrowheads.
export const ACCENT = "#d97757";

// --- Typography --------------------------------------------------------------

// Product surfaces (panels, cards, badges). Captions use Inter (caption-styles).
export const FONT_GEIST = "Geist, -apple-system, sans-serif";

// TikTok's own UI font (TikTok Sans, via @remotion/google-fonts). Used only
// for the title block so it reads like text typed in TikTok's text tool.
const { fontFamily: interTitle } = loadInterTitle("normal", {
  weights: ["500", "600", "700"],
  subsets: ["latin"],
});
export const FONT_TIKTOK = `${interTitle}, -apple-system, sans-serif`;

// --- Panel chrome ------------------------------------------------------------

export const PANEL_RADIUS = 28;
export const PANEL_SHADOW = "0 12px 48px rgba(0,0,0,0.45)";

// Founder artwork panel: the hand-drawn art has a white background, so its
// panel leans in — white card instead of dark, dark caption text.
export const ART_PANEL_BG = "#ffffff";
export const ART_CAPTION_COLOR = "#52525b";

// --- Text on dark panels -----------------------------------------------------

export const TEXT_PRIMARY = "#fafafa"; // stems, letters, headline text
export const TEXT_BODY = "#d4d4d8"; // answer-choice body text
export const TEXT_MUTED = "#a1a1aa"; // captions under art, reasons, sublines

// --- Title block (replaces the old domain badge) --------------------------------

// Two-line TikTok-native title top-center, styled like TikTok's text tool:
// bold white line, then a smaller black-on-white label. Position is set by the
// profile-grid thumbnail, not the feed: grid tiles show a 3:4 center crop of
// the 9:16 frame, cutting the top/bottom 240px (founder caught line 1 fully
// cropped out at the old 134). 256 keeps the whole block inside the tile with
// margin, and still clears the feed's top chrome. While a top-zone panel
// (clip/art) is up the title fades out instead of colliding (TitleBlock
// hideWindows) — the panel keeps its founder-approved spot.
export const TITLE_TOP_PX = 272; // 240px tile crop + margin for device variance
export const TITLE_LINE1_SIZE = 62; // bold white line ("NBA Finals - Game 4")
export const TITLE_LINE2_SIZE = 40; // black-on-white label ("Social Psychology")
export const TITLE_SHADOW = "0 1px 4px rgba(0,0,0,0.45)"; // thin, no stroke
export const TITLE_LABEL_BG = "#ffffff";
export const TITLE_LABEL_COLOR = "#111111";
export const TITLE_LABEL_RADIUS = 10;

// --- Captions (see caption-styles.ts for the per-style recipes) ---------------

export const CAPTION_FONT_SIZE = 54; // Inter styles ("clean", "box")
export const CAPTION_FONT_SIZE_UPPER = 58; // uppercase styles ("outline", "yellow")
export const CAPTION_COLOR = "white";
export const CAPTION_YELLOW = "#FFE135"; // the loud "yellow" style only
export const CAPTION_STROKE_COLOR = "black";

// --- Screen positions (9:16 frame, 1080x1920) ---------------------------------

// Distance of the caption block from the bottom edge, in % of video height.
// TikTok UI (caption text, buttons, progress bar) covers roughly the bottom
// quarter, so stay above ~28. Captions never move from this line.
export const CAPTION_BOTTOM_PERCENT = 32;

// Floating top-zone panel (clips, founder art): floats above the speaker's
// head. % padding resolves against width (1080), so 27% = ~292px. The title
// block now overlaps this zone (it moved down for the thumbnail crop), so the
// title fades out while a panel is up rather than the panel moving onto the
// face.
export const TOP_ZONE_PADDING_TOP = "27%";

// Chest-level row (diagram, wrong-answer strike): % padding resolves against
// width, so 52% lands the element's center around 65% of the 1920 frame.
export const CHEST_ZONE_PADDING_TOP = "52%";
