import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ACCENT } from "./QuestionCard";

export type HookCue = { text: string; startMs: number; endMs: number };

// Large opening title for the spoken hook line ("Is it possible to pass the
// psychology licensure exam?"). Replaces the chunked captions for those cues:
// the full line accumulates word by word, each word fading in on a schedule
// derived from the cue timings (words spread evenly inside their cue, since
// the SRT has no word-level timing). The trailing question mark takes the
// accent color. Sits in the caption zone, just much bigger.
export const HookTitle: React.FC<{
  cues: HookCue[];
  windowStartMs: number;
  bottomPercent: number;
}> = ({ cues, windowStartMs, bottomPercent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = windowStartMs + (frame / fps) * 1000;

  const words: { text: string; startMs: number }[] = [];
  for (const cue of cues) {
    const parts = cue.text.split(/\s+/).filter(Boolean);
    const slot = (cue.endMs - cue.startMs) / Math.max(1, parts.length);
    parts.forEach((text, i) => {
      words.push({ text, startMs: cue.startMs + i * slot });
    });
  }

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center" }}>
      <div
        style={{
          marginBottom: `${bottomPercent}%`,
          maxWidth: "86%",
          textAlign: "center",
          fontFamily: "Geist, -apple-system, sans-serif",
          fontSize: 72,
          fontWeight: 700,
          lineHeight: 1.25,
          color: "white",
          WebkitTextStroke: "5px black",
          paintOrder: "stroke fill",
          textShadow: "0 3px 10px rgba(0,0,0,0.55)",
        }}
      >
        {words.map((word, i) => {
          const progress = interpolate(
            ms,
            [word.startMs, word.startMs + 250],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }
          );
          // Trailing "?" gets the accent color (the hook is a question).
          const m = word.text.match(/^(.*?)(\?+)$/);
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                opacity: progress,
                transform: `translateY(${(1 - progress) * 10}px)`,
                marginRight: i < words.length - 1 ? "0.28em" : 0,
              }}
            >
              {m ? (
                <>
                  {m[1]}
                  <span style={{ color: ACCENT }}>{m[2]}</span>
                </>
              ) : (
                word.text
              )}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
