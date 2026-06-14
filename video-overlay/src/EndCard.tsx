import {
  Img,
  AbsoluteFill,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ACCENT, FONT_GEIST, SITE_BG, TEXT_MUTED, TEXT_PRIMARY } from "./design";

// Full-frame branded sign-off for the final seconds of every video. A takeover
// (not a lower-third) on purpose: it guarantees the avatar's slack resting face
// is never the closing image. Fires on a fixed last-N-seconds window (see
// endCardFromMs in PracticeQuestion), NOT a spoken-URL caption that HeyGen
// often mis-transcribes (e.g. "thepsychoology.ai").
export const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ease = Easing.bezier(0.16, 1, 0.3, 1);

  // The dark cover snaps in fast so the resting frame is hidden almost
  // immediately; the brand and subline settle just after.
  const cover = interpolate(frame, [0, 0.25 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  const progress = interpolate(frame, [0.1 * fps, 0.7 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  // Subline trails the URL slightly so the brand lands first.
  const subProgress = interpolate(frame, [0.3 * fps, 0.9 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: SITE_BG,
        opacity: cover,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: FONT_GEIST,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: progress,
          transform: `translateY(${(1 - progress) * 28}px)`,
        }}
      >
        {/* Full bunny-with-glasses logo: white silhouette, reads against the
            dark cover. */}
        <Img
          src={staticFile("logo.png")}
          style={{ width: 150, height: 232, objectFit: "contain", marginBottom: 30 }}
        />
        <div style={{ fontSize: 74, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.2, textAlign: "center" }}>
          thepsychology<span style={{ color: ACCENT }}>.ai</span>
        </div>
        <div
          style={{
            fontSize: 34,
            fontWeight: 400,
            color: TEXT_MUTED,
            marginTop: 18,
            opacity: subProgress,
          }}
        >
          EPPP Prep
        </div>
      </div>
    </AbsoluteFill>
  );
};
