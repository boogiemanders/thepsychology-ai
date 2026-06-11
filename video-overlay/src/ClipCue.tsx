import {
  AbsoluteFill,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Video } from "@remotion/media";
import { SITE_BG } from "./QuestionCard";

// One motion-graphics moment: a short pre-rendered animation clip (HyperFrames
// line art from clips-src/) in the same dark chest-level panel as the concept
// diagram. Clips carry no audio; loop covers cue windows longer than the clip.
export const ClipCue: React.FC<{
  video: string;
  caption?: string;
}> = ({ video, caption }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = interpolate(frame, [0, 0.45 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-start",
        alignItems: "center",
        // This panel is much taller than the diagram's, so center-based
        // placement would ride up over the mouth. Pin the top edge just
        // below the chin instead: % padding resolves against width (1080),
        // so 96% puts the top at ~54% of the 1920 frame, clear of the open
        // mouth even when the head bobs.
        paddingTop: "96%",
      }}
    >
      <div
        style={{
          backgroundColor: SITE_BG,
          borderRadius: 28,
          width: "58%",
          padding: 22,
          fontFamily: "Geist, -apple-system, sans-serif",
          boxShadow: "0 12px 48px rgba(0,0,0,0.45)",
          opacity: progress,
          transform: `translateY(${(1 - progress) * 24}px)`,
        }}
      >
        <Video
          src={staticFile(video)}
          muted
          loop
          style={{ width: "100%", display: "block", borderRadius: 18 }}
        />
        {caption ? (
          <div
            style={{
              fontSize: 30,
              fontWeight: 400,
              color: "#a1a1aa",
              textAlign: "center",
              marginTop: 20,
              marginBottom: 4,
              lineHeight: 1.35,
            }}
          >
            {caption}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
