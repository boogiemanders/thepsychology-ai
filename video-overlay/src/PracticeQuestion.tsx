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
import { applySpellingMap } from "./spelling-map";

export type PracticeQuestionProps = {
  videoFile: string;
  srtFile: string;
};

// One caption chunk. Pops in with a quick scale/fade; sits in the lower third
// but above TikTok's UI safe zone (bottom ~20% is covered by captions/buttons).
const CaptionChunk: React.FC<{ text: string }> = ({ text }) => {
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
          marginBottom: "26%",
          maxWidth: "82%",
          opacity: progress,
          transform: `scale(${0.92 + 0.08 * progress})`,
          backgroundColor: "rgba(0, 0, 0, 0.55)",
          borderRadius: 18,
          padding: "14px 28px",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          fontSize: 54,
          fontWeight: 800,
          lineHeight: 1.25,
          color: "white",
          textAlign: "center",
          textShadow: "0 2px 8px rgba(0,0,0,0.6)",
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

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <Video
        src={staticFile(videoFile)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      {cues.map((cue, i) => {
        const from = Math.round((cue.startMs / 1000) * fps);
        const duration = Math.max(
          1,
          Math.round(((cue.endMs - cue.startMs) / 1000) * fps)
        );
        return (
          <Sequence key={i} from={from} durationInFrames={duration}>
            <CaptionChunk text={cue.text} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
