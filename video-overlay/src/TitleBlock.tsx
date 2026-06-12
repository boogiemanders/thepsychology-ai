import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  FONT_TIKTOK,
  TITLE_LABEL_BG,
  TITLE_LABEL_COLOR,
  TITLE_LABEL_RADIUS,
  TITLE_LINE1_SIZE,
  TITLE_LINE2_SIZE,
  TITLE_SHADOW,
  TITLE_TOP_PX,
} from "./design";

// TikTok-native two-line title, top-center. Mirrors TikTok's own text tool so
// it reads as part of the app: line 1 is bold white with a thin shadow (no
// stroke), line 2 is the text tool's label mode (black on a white rounded
// rectangle). Calm 0.3s fade-in at the start. Rendered early in
// PracticeQuestion's stack, so the question card, reveal, and other panels
// cover it while they are up. Empty lines are skipped.
//
// hideWindows: the title sits in the top zone (moved down for the profile-grid
// thumbnail crop), the same zone the clip/art panels float in. During those
// cue windows the title fades out and returns after — reads like a timed
// TikTok text overlay instead of text colliding with a panel.
const HIDE_FADE_MS = 250;

export const TitleBlock: React.FC<{
  line1: string;
  line2: string;
  hideWindows?: Array<{ fromMs: number; toMs: number }>;
}> = ({ line1, line2, hideWindows = [] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = interpolate(frame, [0, 0.3 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // 0 = fully shown, 1 = fully hidden. Fades out just before a window opens
  // and back in right after it closes; overlapping windows take the max.
  const ms = (frame / fps) * 1000;
  let hidden = 0;
  for (const w of hideWindows) {
    const fadeOut = interpolate(ms, [w.fromMs - HIDE_FADE_MS, w.fromMs], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const fadeIn = interpolate(ms, [w.toMs, w.toMs + HIDE_FADE_MS], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    hidden = Math.max(hidden, Math.min(fadeOut, fadeIn));
  }
  const progress = entrance * (1 - hidden);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: TITLE_TOP_PX,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: progress,
        }}
      >
        {line1 ? (
          <div
            style={{
              fontFamily: FONT_TIKTOK,
              fontWeight: 600,
              fontSize: TITLE_LINE1_SIZE,
              color: "#fff",
              textShadow: TITLE_SHADOW,
              textAlign: "center",
              maxWidth: "90%",
              lineHeight: 1.15,
              // Balanced wrap keeps a two-line title from leaving one orphan
              // word on the second line.
              textWrap: "balance",
            }}
          >
            {line1}
          </div>
        ) : null}
        {line2 ? (
          <div
            style={{
              fontFamily: FONT_TIKTOK,
              fontWeight: 500,
              fontSize: TITLE_LINE2_SIZE,
              color: TITLE_LABEL_COLOR,
              backgroundColor: TITLE_LABEL_BG,
              borderRadius: TITLE_LABEL_RADIUS,
              padding: "6px 18px",
              marginTop: line1 ? 14 : 0,
              textAlign: "center",
              maxWidth: "84%",
            }}
          >
            {line2}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
