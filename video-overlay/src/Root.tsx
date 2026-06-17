import "./index.css";
import { CalculateMetadataFunction, Composition, staticFile } from "remotion";
import { Input, ALL_FORMATS, UrlSource } from "mediabunny";
import {
  PracticeQuestion,
  PracticeQuestionProps,
  practiceQuestionSchema,
} from "./PracticeQuestion";
import {
  CredentialBadgePreview,
  credentialPreviewSchema,
} from "./CredentialBadgePreview";

const FPS = 30;

// Duration follows the talking-head mp4 (HeyGen output length varies per
// script), so the composition always matches whatever was last imported.
const calculateMetadata: CalculateMetadataFunction<
  PracticeQuestionProps
> = async ({ props }) => {
  const input = new Input({
    formats: ALL_FORMATS,
    source: new UrlSource(staticFile(props.videoFile), {
      getRetryDelay: () => null,
    }),
  });
  const durationInSeconds = await input.computeDuration();
  return {
    durationInFrames: Math.ceil(durationInSeconds * FPS),
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
    <Composition
      id="PracticeQuestion"
      component={PracticeQuestion}
      fps={FPS}
      width={1080}
      height={1920}
      schema={practiceQuestionSchema}
      defaultProps={{
        videoFile: "input.mp4",
        srtFile: "input.srt",
        captionStyle: "clean" as const,
        captionBottomPercent: 32,
        questionStem:
          "A court mandates that an individual convicted of domestic violence attend therapy as a condition of probation. During the course of treatment, the prosecution subpoenas the therapist's records. In this court-ordered treatment scenario, who holds the therapist-client privilege?",
        choices: [
          "The client retains privilege and can prevent disclosure of therapy records",
          "The therapist holds privilege and decides whether to disclose records",
          "Privilege is typically waived or significantly limited because treatment was court-ordered",
          "The client's defense attorney holds privilege on behalf of the client",
        ],
        animationCues: [
          {
            trigger: "keeps an interest",
            type: "diagram" as const,
            payload: {
              nodes: ["Court", "Therapy", "Records"],
              arrows: [
                [0, 1],
                [1, 2],
              ],
              labels: ["orders", "stays open to"],
            },
          },
        ],
        titleLine1: "Court-Ordered Therapy?",
        titleLine2: "Ethics",
        credential: "",
        disclaimerLine: "",
        hookImage: "",
      }}
      calculateMetadata={calculateMetadata}
    />
    <Composition
      id="CredentialBadgePreview"
      component={CredentialBadgePreview}
      fps={FPS}
      width={1080}
      height={1920}
      durationInFrames={90}
      schema={credentialPreviewSchema}
      defaultProps={{
        credential: "UCLA-trained psychologist",
        titleLine1: "Court-Ordered Therapy?",
        titleLine2: "Ethics",
      }}
    />
    </>
  );
};
