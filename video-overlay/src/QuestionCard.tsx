import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/fonts";

// Same font as thepsychology.ai (Geist Sans, loaded site-wide via next/font);
// the variable woff2 ships in the `geist` npm package and is copied into
// public/fonts/. Background matches the site's dark --background (#18181B).
loadFont({
  family: "Geist",
  url: staticFile("fonts/Geist-Variable.woff2"),
});

export const SITE_BG = "#18181B";

const LETTERS = ["A", "B", "C", "D", "E"] as const;

// Full-screen card shown while the avatar reads the question: the whole stem
// and every choice visible at once, like the exam-generator UI.
export const QuestionCard: React.FC<{
  stem: string;
  choices: string[];
}> = ({ stem, choices }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = interpolate(frame, [0, 0.25 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Content-sized panel over the video, not a full-screen takeover: the
  // HeyGen footage stays visible above and below the card.
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: progress,
      }}
    >
      <div
        style={{
          backgroundColor: SITE_BG,
          borderRadius: 28,
          width: "92%",
          padding: "56px 48px",
          fontFamily: "Geist, -apple-system, sans-serif",
          color: "#fafafa",
          boxShadow: "0 12px 48px rgba(0,0,0,0.45)",
        }}
      >
      <div
        style={{
          fontSize: 46,
          fontWeight: 600,
          lineHeight: 1.45,
          marginBottom: 64,
          transform: `translateY(${(1 - progress) * 24}px)`,
        }}
      >
        {stem}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 36,
          transform: `translateY(${(1 - progress) * 36}px)`,
        }}
      >
        {choices.map((choice, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 22,
              fontSize: 40,
              fontWeight: 400,
              lineHeight: 1.4,
              color: "#d4d4d8",
            }}
          >
            <span style={{ fontWeight: 700, color: "#fafafa" }}>
              {LETTERS[i]}.
            </span>
            <span>{choice}</span>
          </div>
        ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
