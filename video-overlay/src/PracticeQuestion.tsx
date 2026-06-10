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
  const { fps } = useVideoConfig();
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

  const inCardWindow = (ms: number) =>
    cardWindow !== null && ms >= cardWindow.fromMs && ms < cardWindow.toMs;

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <Video
        src={staticFile(videoFile)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      {cues.map((cue, i) => {
        if (inCardWindow(cue.startMs)) return null;
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
      {cardWindow ? (
        <Sequence from={cardFrom} durationInFrames={cardDuration}>
          <QuestionCard stem={questionStem} choices={choices} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
