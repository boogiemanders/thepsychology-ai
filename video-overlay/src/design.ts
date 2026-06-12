import { staticFile } from "remotion";
import { loadFont } from "@remotion/fonts";
import { loadFont as loadTikTokSans } from "@remotion/google-fonts/TikTokSans";

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
const { fontFamily: tikTokSans } = loadTikTokSans("normal", {
  weights: ["600", "700"],
  subsets: ["latin"],
});
export const FONT_TIKTOK = `${tikTokSans}, -apple-system, sans-serif`;

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

// Two-line TikTok-native title pinned top-center for the whole video, styled
// like TikTok's text tool: bold white line, then a smaller black-on-white
// label. Sized/positioned to sit below TikTok's own top UI (search bar zone).
export const TITLE_TOP_PX = 134; // ~7% of 1920, clear of the app's top chrome
export const TITLE_LINE1_SIZE = 58; // bold white line ("NBA Finals - Game 4")
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

// Floating top-zone panel (clips, founder art): floats between the title
// block above and the speaker's head below. % padding resolves against width
// (1080), so 27% (~292px) clears the persistent title (which ends ~280px)
// while keeping the panel off the face.
export const TOP_ZONE_PADDING_TOP = "27%";

// Chest-level row (diagram, wrong-answer strike): % padding resolves against
// width, so 52% lands the element's center around 65% of the 1920 frame.
export const CHEST_ZONE_PADDING_TOP = "52%";
