import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ACCENT, BADGE_BG, FONT_GEIST, TEXT_PRIMARY } from "./design";

// Small domain chip ("ETHICS") shown top-center while the avatar names the
// question's domain ("...a question on ethics."), until the question card
// takes over. Lives in the top 12% of the frame so it never touches the
// speaker's face. Window detection lives in PracticeQuestion (it owns cues).
export const DomainBadge: React.FC<{ domain: string }> = ({ domain }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = interpolate(frame, [0, 0.4 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          // Chip top at 96px, ~70px tall: fully inside the top 12% (230px).
          top: 96,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: progress,
          transform: `translateY(${(1 - progress) * -14}px)`,
        }}
      >
        <div
          style={{
            border: `4px solid ${ACCENT}`,
            borderRadius: 999,
            backgroundColor: BADGE_BG,
            padding: "14px 38px",
            fontFamily: FONT_GEIST,
            fontWeight: 600,
            fontSize: 34,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: TEXT_PRIMARY,
          }}
        >
          {domain}
        </div>
      </div>
    </AbsoluteFill>
  );
};
