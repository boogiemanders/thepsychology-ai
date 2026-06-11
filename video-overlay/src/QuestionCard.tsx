import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/fonts";

// Same font as thepsychology.ai (Geist Sans, loaded site-wide via next/font);
// the variable woff2 ships in the `geist` npm package and is copied into
// public/fonts/. Background matches the site's dark --background (#18181B).
loadFont({
  family: "Geist",
  url: staticFile("fonts/Geist-Variable.woff2"),
});

export const SITE_BG = "#18181B";
// The one accent color (warm coral, Anthropic-adjacent). Used sparingly:
// the correct-answer highlight and the ".ai" in the end card.
export const ACCENT = "#d97757";

const LETTERS = ["A", "B", "C", "D", "E"] as const;

// Shared panel for QuestionCard and AnswerReveal: whole stem and every choice
// visible at once, like the exam-generator UI. With highlightIndex set, that
// choice gets the accent treatment and the others dim, easing in over ~0.4s.
export const QuestionPanel: React.FC<{
  stem: string;
  choices: string[];
  highlightIndex?: number;
  // Skip the entrance fade when the panel continues seamlessly from a card
  // that is already on screen (question -> reveal hand-off).
  animateIn?: boolean;
}> = ({ stem, choices, highlightIndex, animateIn = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = animateIn
    ? interpolate(frame, [0, 0.25 * fps], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      })
    : 1;

  // Highlight glides in just after the panel settles. Same calm bezier,
  // no bounce: the accent bar fades in while the wrong answers recede.
  const highlight =
    highlightIndex === undefined
      ? 0
      : interpolate(frame, [0.1 * fps, 0.5 * fps], [0, 1], {
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
        {choices.map((choice, i) => {
          const isCorrect = i === highlightIndex;
          const rowOpacity =
            highlightIndex === undefined || isCorrect
              ? 1
              : interpolate(highlight, [0, 1], [1, 0.35]);
          return (
            <div
              key={i}
              style={{
                position: "relative",
                display: "flex",
                gap: 22,
                fontSize: 40,
                fontWeight: 400,
                lineHeight: 1.4,
                color: "#d4d4d8",
                opacity: rowOpacity,
              }}
            >
              {isCorrect ? (
                // Accent bar sits in the panel's left padding so the text
                // stays exactly where it was on the question card.
                <div
                  style={{
                    position: "absolute",
                    left: -28,
                    top: 4,
                    bottom: 4,
                    width: 7,
                    borderRadius: 4,
                    backgroundColor: ACCENT,
                    opacity: highlight,
                  }}
                />
              ) : null}
              <span
                style={{
                  fontWeight: 700,
                  color: isCorrect
                    ? interpolateColors(highlight, [0, 1], ["#fafafa", ACCENT])
                    : "#fafafa",
                }}
              >
                {LETTERS[i]}.
              </span>
              <span
                style={
                  isCorrect
                    ? {
                        color: interpolateColors(
                          highlight,
                          [0, 1],
                          ["#d4d4d8", "#fafafa"]
                        ),
                      }
                    : undefined
                }
              >
                {choice}
              </span>
            </div>
          );
        })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Full-screen card shown while the avatar reads the question.
export const QuestionCard: React.FC<{
  stem: string;
  choices: string[];
}> = ({ stem, choices }) => <QuestionPanel stem={stem} choices={choices} />;
