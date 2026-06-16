import { AbsoluteFill } from "remotion";
import { z } from "zod";
import { CredentialBadge } from "./CredentialBadge";
import { TitleBlock } from "./TitleBlock";
import { CREDENTIAL_TOTAL_S } from "./design";

export const credentialPreviewSchema = z.object({
  credential: z.string(),
  titleLine1: z.string(),
  titleLine2: z.string(),
  accentColor: z.string().optional(),
  pillBg: z.string().optional(),
  textColor: z.string().optional(),
});

// Studio-only preview of the opening credential pill, on a neutral video-tone
// gradient (a real avatar frame reads the same — the pill is opaque with its
// own shadow). The title fades in right as the badge leaves, so the founder can
// judge both the look and the credential -> title handoff without a HeyGen mp4.
export const CredentialBadgePreview: React.FC<
  z.infer<typeof credentialPreviewSchema>
> = ({ credential, titleLine1, titleLine2, accentColor, pillBg, textColor }) => {
  return (
    <AbsoluteFill
      style={{ background: "linear-gradient(160deg, #3f3f46 0%, #18181b 72%)" }}
    >
      <TitleBlock
        line1={titleLine1}
        line2={titleLine2}
        hideWindows={[{ fromMs: 0, toMs: CREDENTIAL_TOTAL_S * 1000 }]}
      />
      <CredentialBadge
        text={credential}
        accentColor={accentColor}
        pillBg={pillBg}
        textColor={textColor}
      />
    </AbsoluteFill>
  );
};
