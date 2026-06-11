import {
  Img,
  AbsoluteFill,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ACCENT, SITE_BG } from "./QuestionCard";

// Lower-third CTA shown from the final "thepsychology.ai" cue to the end of
// the video. The founder is still talking, so this is not a takeover: the
// panel sits exactly where the chunked captions live and replaces them.
export const EndCard: React.FC<{ bottomPercent: number }> = ({
  bottomPercent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const ease = Easing.bezier(0.16, 1, 0.3, 1);
  const progress = interpolate(frame, [0, 0.6 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  // Subline trails the URL slightly so the brand lands first.
  const subProgress = interpolate(frame, [0.2 * fps, 0.8 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center" }}>
      <div
        style={{
          marginBottom: `${bottomPercent}%`,
          backgroundColor: SITE_BG,
          borderRadius: 24,
          padding: "40px 64px",
          textAlign: "center",
          fontFamily: "Geist, -apple-system, sans-serif",
          boxShadow: "0 12px 48px rgba(0,0,0,0.45)",
          opacity: progress,
          transform: `translateY(${(1 - progress) * 32}px)`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 22,
          }}
        >
          {/* Hand-drawn glasses logo. Brown ink needs a light tile to read on
              the dark panel; warm off-white keeps it in the house palette. */}
          <div
            style={{
              backgroundColor: "#f5efe7",
              borderRadius: 16,
              padding: "10px 12px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Img src={staticFile("logo.png")} style={{ width: 72, height: 36, objectFit: "contain" }} />
          </div>
          <div
            style={{
              fontSize: 58,
              fontWeight: 700,
              color: "#fafafa",
              lineHeight: 1.2,
            }}
          >
            thepsychology<span style={{ color: ACCENT }}>.ai</span>
          </div>
        </div>
        <div
          style={{
            fontSize: 30,
            fontWeight: 400,
            color: "#a1a1aa",
            marginTop: 14,
            opacity: subProgress,
          }}
        >
          Free EPPP practice questions
        </div>
      </div>
    </AbsoluteFill>
  );
};
