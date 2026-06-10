import type { CSSProperties } from "react";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as loadMarker } from "@remotion/google-fonts/PermanentMarker";

const inter = loadInter("normal", { weights: ["800"], subsets: ["latin"] });
const montserrat = loadMontserrat("normal", {
  weights: ["900"],
  subsets: ["latin"],
});
const marker = loadMarker("normal", { weights: ["400"], subsets: ["latin"] });

export const CAPTION_STYLE_IDS = [
  "clean",
  "box",
  "outline",
  "yellow",
  "marker",
] as const;
export type CaptionStyleId = (typeof CAPTION_STYLE_IDS)[number];

// Picked in Remotion Studio (right panel) or via --props. Text stroke uses
// paint-order so the outline sits behind the fill instead of eating it.
const stroke = (width: number): CSSProperties => ({
  WebkitTextStroke: `${width}px black`,
  paintOrder: "stroke fill",
});

export const CAPTION_STYLES: Record<CaptionStyleId, CSSProperties> = {
  // Founder's pick: white Inter, sentence case, no box. A thin stroke plus
  // soft shadow keeps it readable over bright frames (white shirt, lights).
  clean: {
    fontFamily: inter.fontFamily,
    fontWeight: 800,
    fontSize: 54,
    color: "white",
    ...stroke(5),
    textShadow: "0 3px 10px rgba(0,0,0,0.55)",
  },
  // Clean rounded dark box, white Inter. Credible, reads like app UI.
  box: {
    fontFamily: inter.fontFamily,
    fontWeight: 800,
    fontSize: 54,
    color: "white",
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    borderRadius: 18,
    padding: "14px 28px",
    textShadow: "0 2px 8px rgba(0,0,0,0.6)",
  },
  // Classic TikTok: heavy white with black stroke, no box, uppercase.
  outline: {
    fontFamily: montserrat.fontFamily,
    fontWeight: 900,
    fontSize: 58,
    color: "white",
    textTransform: "uppercase",
    letterSpacing: "0.01em",
    ...stroke(10),
    textShadow: "0 4px 12px rgba(0,0,0,0.45)",
  },
  // High-energy yellow with black stroke. Loudest of the set.
  yellow: {
    fontFamily: montserrat.fontFamily,
    fontWeight: 900,
    fontSize: 58,
    color: "#FFE135",
    textTransform: "uppercase",
    letterSpacing: "0.01em",
    ...stroke(10),
    textShadow: "0 4px 12px rgba(0,0,0,0.5)",
  },
  // Handwritten marker, white with soft shadow. Closest to the future
  // hand-drawn lesson aesthetic.
  marker: {
    fontFamily: marker.fontFamily,
    fontWeight: 400,
    fontSize: 56,
    color: "white",
    ...stroke(6),
    textShadow: "0 4px 14px rgba(0,0,0,0.55)",
  },
};
