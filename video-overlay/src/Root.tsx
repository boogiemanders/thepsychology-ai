import "./index.css";
import { CalculateMetadataFunction, Composition, staticFile } from "remotion";
import { Input, ALL_FORMATS, UrlSource } from "mediabunny";
import {
  PracticeQuestion,
  PracticeQuestionProps,
  practiceQuestionSchema,
} from "./PracticeQuestion";

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
        captionStyle: "box" as const,
        captionBottomPercent: 32,
      }}
      calculateMetadata={calculateMetadata}
    />
  );
};
