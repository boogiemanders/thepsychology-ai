import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  FONT_GEIST,
  PANEL_SHADOW,
  SITE_BG,
  TEXT_PRIMARY,
  CREDENTIAL_TOP_PX,
  CREDENTIAL_IN_S,
  CREDENTIAL_OUT_START_S,
  CREDENTIAL_TOTAL_S,
} from "./design";

// Opening credential hook. A single calm pill, top-center, that fades in for
// the first ~2s of every exam/strategy render and then steps aside so the
// title takes the same spot. Not a per-draft cue: the pipeline passes one
// `credential` string and this fires automatically (empty string = no badge,
// e.g. pop-culture videos). Sits in the title's top zone (TITLE/CREDENTIAL_TOP
// = 272px) so it survives the 3:4 profile-grid thumbnail crop. The first word
// (the institution) carries the accent so the credential reads at a glance.
export const CredentialBadge: React.FC<{
  text: string;
  accentColor?: string;
  pillBg?: string;
  textColor?: string;
}> = ({
  text,
  accentColor = "#6E9452", // founder palette #4 (forest green); coral rejected 6/15
  pillBg = SITE_BG,
  textColor = TEXT_PRIMARY,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const ease = Easing.bezier(0.16, 1, 0.3, 1);
  const fadeIn = interpolate(frame, [0, CREDENTIAL_IN_S * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  const fadeOut = interpolate(
    frame,
    [CREDENTIAL_OUT_START_S * fps, CREDENTIAL_TOTAL_S * fps],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }
  );
  const opacity = Math.min(fadeIn, fadeOut);

  // Accent the leading word(s) up to the first hyphen/space group so "UCLA"
  // pops; the rest stays white. Falls back to plain text if there's no split.
  const m = text.match(/^(\S+?)(\b[\s-].*)$/);
  const head = m ? m[1] : text;
  const tail = m ? m[2] : "";

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: CREDENTIAL_TOP_PX,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity,
          transform: `translateY(${(1 - fadeIn) * 22}px)`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            backgroundColor: pillBg,
            borderRadius: 999,
            padding: "20px 38px",
            boxShadow: PANEL_SHADOW,
            fontFamily: FONT_GEIST,
            fontSize: 46,
            fontWeight: 600,
            lineHeight: 1.1,
            color: textColor,
            maxWidth: "92%",
            whiteSpace: "nowrap",
          }}
        >
          {/* Small accent dot reads as a verified/credential mark without an
              emoji or a borrowed institutional logo. */}
          <span
            style={{
              width: 16,
              height: 16,
              borderRadius: 999,
              backgroundColor: accentColor,
              flexShrink: 0,
            }}
          />
          <span>
            <span style={{ color: accentColor }}>{head}</span>
            {tail}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
