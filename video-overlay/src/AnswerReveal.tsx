import { QuestionPanel } from "./QuestionCard";

// Re-shows the question card while the avatar says "The answer is X": the
// correct row gets the accent treatment, the wrong ones dim. Window and
// letter detection live in PracticeQuestion (it owns the cues).
export const AnswerReveal: React.FC<{
  stem: string;
  choices: string[];
  correctIndex: number;
  // True when no question card preceded the reveal, so the panel still
  // needs its entrance fade instead of continuing seamlessly.
  animateIn?: boolean;
}> = ({ stem, choices, correctIndex, animateIn = false }) => (
  <QuestionPanel
    stem={stem}
    choices={choices}
    highlightIndex={correctIndex}
    animateIn={animateIn}
  />
);
