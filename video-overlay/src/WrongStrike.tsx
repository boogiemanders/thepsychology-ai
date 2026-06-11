import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SITE_BG } from "./QuestionCard";

// Shown while the avatar says "<letter> is wrong": one compact choice row
// (same styling as the question card rows) slides in at the card position,
// then a strike-through sweeps across the text while the row dims to 50%.
// The strike is a second, invisible copy of the row that only paints its
// line-through, revealed left-to-right with an animated clip-path, so it
// follows the text across line wraps.
export const WrongStrike: React.FC<{
  letter: string;
  choice: string;
  // Short why-it's-wrong clause extracted from the transcript (see
  // PracticeQuestion). Rendered dimmed under the struck row, no strike.
  reason?: string;
}> = ({ letter, choice, reason }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ease = Easing.bezier(0.16, 1, 0.3, 1);

  const enter = interpolate(frame, [0, 0.25 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  const strike = interpolate(frame, [0.25 * fps, 0.65 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  // Reason fades in as the strike sweep lands.
  const reasonIn = interpolate(frame, [0.45 * fps, 0.85 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

  const row: React.CSSProperties = {
    display: "flex",
    gap: 22,
    fontSize: 40,
    fontWeight: 400,
    lineHeight: 1.4,
  };

  return (
    // Centered like the question card, but pushed below screen center so the
    // single row sits at chest level instead of across the speaker's eyes
    // (the card is tall enough that centering it clears the face; one row
    // is not).
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        // % padding resolves against width (1080), so 52% pushes the row's
        // center to roughly 65% of the 1920 frame height.
        paddingTop: "52%",
      }}
    >
      <div
        style={{
          backgroundColor: SITE_BG,
          borderRadius: 28,
          width: "92%",
          padding: "40px 48px",
          fontFamily: "Geist, -apple-system, sans-serif",
          boxShadow: "0 12px 48px rgba(0,0,0,0.45)",
          opacity: enter,
          transform: `translateY(${(1 - enter) * 24}px)`,
        }}
      >
        <div style={{ position: "relative", opacity: 1 - 0.5 * strike }}>
          <div style={{ ...row, color: "#d4d4d8" }}>
            <span style={{ fontWeight: 700, color: "#fafafa" }}>
              {letter}.
            </span>
            <span>{choice}</span>
          </div>
          <div
            aria-hidden
            style={{
              ...row,
              position: "absolute",
              inset: 0,
              color: "transparent",
              clipPath: `inset(0 ${(1 - strike) * 100}% 0 0)`,
            }}
          >
            <span
              style={{
                fontWeight: 700,
                textDecorationLine: "line-through",
                textDecorationColor: "#fafafa",
                textDecorationThickness: 4,
              }}
            >
              {letter}.
            </span>
            <span
              style={{
                textDecorationLine: "line-through",
                textDecorationColor: "#fafafa",
                textDecorationThickness: 4,
              }}
            >
              {choice}
            </span>
          </div>
        </div>
        {reason ? (
          <div
            style={{
              marginTop: 18,
              fontSize: 30,
              fontWeight: 400,
              lineHeight: 1.4,
              color: "#a1a1aa",
              opacity: reasonIn,
            }}
          >
            {reason}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
