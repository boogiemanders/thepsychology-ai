import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  ART_CAPTION_COLOR,
  ART_PANEL_BG,
  FONT_GEIST,
  PANEL_RADIUS,
  PANEL_SHADOW,
  TOP_ZONE_PADDING_TOP,
} from "./design";

// Founder's hand-drawn artwork (public/art/*.png) in the floating top-zone
// panel — same placement as ClipCue. The drawings ship on white paper, so the
// panel leans in: white card, subtle shadow, dark caption. Living motion is
// a one-time calm fade/scale-in plus a gentle vertical bob on a slow sine
// (deterministic per frame, so renders are reproducible). The art itself is
// never distorted — the whole panel moves as one.
export const AnimatedArt: React.FC<{
  image: string;
  caption?: string;
}> = ({ image, caption }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = interpolate(frame, [0, 0.7 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // ~3% vertical bob, one cycle every 2s. Starts at 0 so it blends with the
  // entrance; % translate resolves against the panel's own height.
  const bob = Math.sin((frame / fps) * Math.PI) * 1.5;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-start",
        alignItems: "center",
        paddingTop: TOP_ZONE_PADDING_TOP,
      }}
    >
      <div
        style={{
          backgroundColor: ART_PANEL_BG,
          borderRadius: PANEL_RADIUS,
          width: "50%",
          padding: 22,
          fontFamily: FONT_GEIST,
          boxShadow: PANEL_SHADOW,
          opacity: progress,
          transform: `translateY(${bob}%) scale(${0.97 + 0.03 * progress})`,
        }}
      >
        <Img
          src={staticFile(image)}
          style={{ width: "100%", display: "block", borderRadius: 18 }}
        />
        {caption ? (
          <div
            style={{
              fontSize: 30,
              fontWeight: 400,
              color: ART_CAPTION_COLOR,
              textAlign: "center",
              marginTop: 18,
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
