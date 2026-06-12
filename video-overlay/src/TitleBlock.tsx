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

// TikTok-native two-line title, top-center, persistent for the whole video.
// Mirrors TikTok's own text tool so it reads as part of the app: line 1 is
// bold white with a thin shadow (no stroke), line 2 is the text tool's label
// mode (black on a white rounded rectangle). Calm 0.3s fade-in at the start.
// Rendered early in PracticeQuestion's stack, so the question card, reveal,
// and other panels cover it while they are up. Empty lines are skipped.
export const TitleBlock: React.FC<{ line1: string; line2: string }> = ({
  line1,
  line2,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = interpolate(frame, [0, 0.3 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

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
