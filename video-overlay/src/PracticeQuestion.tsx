import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from "remotion";
import { Video } from "@remotion/media";
import { parseSrt } from "@remotion/captions";
import type { Caption } from "@remotion/captions";
import { z } from "zod";
import { applySpellingMap } from "./spelling-map";
import { CAPTION_STYLES, CAPTION_STYLE_IDS } from "./caption-styles";
import { QuestionCard } from "./QuestionCard";
import { AnswerReveal } from "./AnswerReveal";
import { EndCard } from "./EndCard";
import { WrongStrike } from "./WrongStrike";

export const practiceQuestionSchema = z.object({
  videoFile: z.string(),
  srtFile: z.string(),
  captionStyle: z.enum(CAPTION_STYLE_IDS),
  // Distance of the caption block from the bottom edge, in % of video height.
  // TikTok UI (caption text, buttons, progress bar) covers roughly the bottom
  // quarter, so stay above ~28.
  captionBottomPercent: z.number().min(0).max(80),
  // The exam question shown as a full-screen card while it is read aloud.
  // Empty stem = no card (non-practice-question videos).
  questionStem: z.string(),
  choices: z.array(z.string()),
});

export type PracticeQuestionProps = z.infer<typeof practiceQuestionSchema>;

const REVEAL_SECONDS = 3.5;

// One caption chunk. Pops in with a quick scale/fade. Look comes from the
// selected entry in CAPTION_STYLES; position from captionBottomPercent.
const CaptionChunk: React.FC<{
  text: string;
  style: React.CSSProperties;
  bottomPercent: number;
}> = ({ text, style, bottomPercent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = interpolate(frame, [0, 0.15 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center" }}>
      <div
        style={{
          marginBottom: `${bottomPercent}%`,
          maxWidth: "82%",
          opacity: progress,
          transform: `scale(${0.92 + 0.08 * progress})`,
          lineHeight: 1.25,
          textAlign: "center",
          ...style,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

export const PracticeQuestion: React.FC<PracticeQuestionProps> = ({
  videoFile,
  srtFile,
  captionStyle,
  captionBottomPercent,
  questionStem,
  choices,
}) => {
  const { fps, durationInFrames } = useVideoConfig();
  const [captions, setCaptions] = useState<Caption[] | null>(null);
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const [handle] = useState(() => delayRender("Loading SRT captions"));

  const fetchCaptions = useCallback(async () => {
    try {
      const res = await fetch(staticFile(srtFile));
      const text = await res.text();
      const { captions: parsed } = parseSrt({ input: text });
      setCaptions(applySpellingMap(parsed));
      continueRender(handle);
    } catch (e) {
      cancelRender(e);
    }
  }, [srtFile, continueRender, cancelRender, handle]);

  useEffect(() => {
    fetchCaptions();
  }, [fetchCaptions]);

  // Extend each cue until the next one starts so captions do not flicker off
  // during HeyGen's small inter-cue gaps.
  const cues = useMemo(() => {
    if (!captions) return [];
    return captions.map((c, i) => {
      const next = captions[i + 1];
      const endMs = next ? Math.max(c.endMs, next.startMs) : c.endMs;
      return { ...c, endMs };
    });
  }, [captions]);

  // The card covers the window from the first stem cue to the cue that opens
  // the reveal ("The answer is..."), so question + choices + thinking pause
  // all show the full exam-style screen. Located by text match against the
  // transcript, so it survives timing differences between renders.
  const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const cardWindow = useMemo(() => {
    if (!questionStem || cues.length === 0) return null;
    const stemNorm = norm(questionStem);
    const start = cues.find(
      (c) => norm(c.text).length > 0 && stemNorm.startsWith(norm(c.text))
    );
    const end = cues.find((c) => norm(c.text).startsWith("the answer is"));
    if (!start || !end || end.startMs <= start.startMs) return null;
    return { fromMs: start.startMs, toMs: end.startMs };
  }, [cues, questionStem]);

  const cardFrom = cardWindow ? Math.round((cardWindow.fromMs / 1000) * fps) : 0;
  const cardDuration = cardWindow
    ? Math.round(((cardWindow.toMs - cardWindow.fromMs) / 1000) * fps)
    : 0;

  // The reveal re-shows the card for ~3.5s with the correct row highlighted,
  // starting at the "The answer is X" cue. The letter comes from the cue text
  // itself, so it always matches what the avatar says.
  const reveal = useMemo(() => {
    if (!questionStem || cues.length === 0) return null;
    for (const c of cues) {
      const m = norm(c.text).match(/^the answer is ([a-d])\b/);
      if (!m) continue;
      const index = "abcd".indexOf(m[1]);
      return index < choices.length ? { fromMs: c.startMs, index } : null;
    }
    return null;
  }, [cues, questionStem, choices]);

  const revealWindow = useMemo(
    () =>
      reveal
        ? { fromMs: reveal.fromMs, toMs: reveal.fromMs + REVEAL_SECONDS * 1000 }
        : null,
    [reveal]
  );
  const revealFrom = revealWindow
    ? Math.round((revealWindow.fromMs / 1000) * fps)
    : 0;
  const revealDuration = revealWindow
    ? Math.max(
        1,
        Math.min(Math.round(REVEAL_SECONDS * fps), durationInFrames - revealFrom)
      )
    : 0;

  // Final CTA cue: the last cue containing the site URL (spoken or written
  // form). The end card runs from there to the end of the video.
  const endCardFromMs = useMemo(() => {
    for (let i = cues.length - 1; i >= 0; i--) {
      const t = norm(cues[i].text);
      if (t.includes("thepsychology ai") || t.includes("the psychology dot ai")) {
        return cues[i].startMs;
      }
    }
    return null;
  }, [cues]);

  const endCardFrom =
    endCardFromMs !== null ? Math.round((endCardFromMs / 1000) * fps) : 0;
  const endCardDuration =
    endCardFromMs !== null ? Math.max(1, durationInFrames - endCardFrom) : 0;

  const inCardWindow = (ms: number) =>
    cardWindow !== null && ms >= cardWindow.fromMs && ms < cardWindow.toMs;
  const inRevealWindow = (ms: number) =>
    revealWindow !== null && ms >= revealWindow.fromMs && ms < revealWindow.toMs;
  const inEndCardWindow = (ms: number) =>
    endCardFromMs !== null && ms >= endCardFromMs;

  // "X is wrong" explanation cues each get a strike-through moment: the named
  // choice row slides in and gets crossed out for the cue's duration. Card and
  // reveal outrank strikes, so any cue already inside those windows is skipped.
  const wrongStrikes = useMemo(() => {
    if (choices.length === 0) return [];
    const out: { fromMs: number; toMs: number; index: number }[] = [];
    for (const c of cues) {
      const m = c.text.match(/\b([A-D]) is wrong/);
      if (!m) continue;
      const index = "ABCD".indexOf(m[1]);
      if (index >= choices.length) continue;
      const inCard =
        cardWindow !== null &&
        c.startMs >= cardWindow.fromMs &&
        c.startMs < cardWindow.toMs;
      const inReveal =
        revealWindow !== null &&
        c.startMs >= revealWindow.fromMs &&
        c.startMs < revealWindow.toMs;
      if (inCard || inReveal) continue;
      out.push({ fromMs: c.startMs, toMs: c.endMs, index });
    }
    return out;
  }, [cues, choices, cardWindow, revealWindow]);

  const inWrongStrike = (ms: number) =>
    wrongStrikes.some((s) => ms >= s.fromMs && ms < s.toMs);

  // Founder rule: captions show at most 3 words at a time. HeyGen cues run
  // 3-6 words, so split each cue for DISPLAY only, dividing its time span by
  // word share. Overlay windows above keep matching the original cues (their
  // trigger phrases, "The answer is", "exam?", would not survive splitting).
  const MAX_CAPTION_WORDS = 3;
  const captionChunks = useMemo(
    () =>
      cues.flatMap((cue) => {
        const words = cue.text.split(/\s+/).filter(Boolean);
        if (words.length <= MAX_CAPTION_WORDS) return [cue];
        const pieces: typeof cues = [];
        const span = cue.endMs - cue.startMs;
        for (let w = 0; w < words.length; w += MAX_CAPTION_WORDS) {
          const slice = words.slice(w, w + MAX_CAPTION_WORDS);
          pieces.push({
            ...cue,
            text: slice.join(" "),
            startMs: cue.startMs + (span * w) / words.length,
            endMs: cue.startMs + (span * Math.min(w + MAX_CAPTION_WORDS, words.length)) / words.length,
          });
        }
        return pieces;
      }),
    [cues]
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <Video
        src={staticFile(videoFile)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      {captionChunks.map((cue, i) => {
        if (
          inCardWindow(cue.startMs) ||
          inRevealWindow(cue.startMs) ||
          inWrongStrike(cue.startMs) ||
          inEndCardWindow(cue.startMs)
        )
          return null;
        const from = Math.round((cue.startMs / 1000) * fps);
        const duration = Math.max(
          1,
          Math.round(((cue.endMs - cue.startMs) / 1000) * fps)
        );
        return (
          <Sequence key={i} from={from} durationInFrames={duration}>
            <CaptionChunk
              text={cue.text}
              style={CAPTION_STYLES[captionStyle]}
              bottomPercent={captionBottomPercent}
            />
          </Sequence>
        );
      })}
      {wrongStrikes.map((s, i) => (
        <Sequence
          key={`strike-${i}`}
          from={Math.round((s.fromMs / 1000) * fps)}
          durationInFrames={Math.max(
            1,
            Math.round(((s.toMs - s.fromMs) / 1000) * fps)
          )}
        >
          <WrongStrike letter={"ABCD"[s.index]} choice={choices[s.index]} />
        </Sequence>
      ))}
      {cardWindow ? (
        <Sequence from={cardFrom} durationInFrames={cardDuration}>
          <QuestionCard stem={questionStem} choices={choices} />
        </Sequence>
      ) : null}
      {reveal ? (
        <Sequence from={revealFrom} durationInFrames={revealDuration}>
          <AnswerReveal
            stem={questionStem}
            choices={choices}
            correctIndex={reveal.index}
            // No card on screen before the reveal (stem cue not found):
            // play the entrance fade instead of continuing seamlessly.
            animateIn={cardWindow === null}
          />
        </Sequence>
      ) : null}
      {endCardFromMs !== null ? (
        <Sequence from={endCardFrom} durationInFrames={endCardDuration}>
          <EndCard bottomPercent={captionBottomPercent} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
