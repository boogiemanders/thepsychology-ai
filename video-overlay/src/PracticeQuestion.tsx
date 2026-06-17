import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
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
import { applySpellingMap, applySpellingToText } from "./spelling-map";
import { CAPTION_STYLES, CAPTION_STYLE_IDS } from "./caption-styles";
import {
  ACCENT,
  FONT_GEIST,
  PANEL_RADIUS,
  PANEL_SHADOW,
  SITE_BG,
  TEXT_PRIMARY,
  TITLE_TOP_PX,
  CREDENTIAL_TOTAL_S,
} from "./design";
import {
  detectReveal,
  detectFirstWrongMs,
  wrongCallOutIndex,
  choicesListedEndMs,
} from "./wrong-answer-detect";
import { QuestionCard } from "./QuestionCard";
import { AnswerReveal } from "./AnswerReveal";
import { EndCard } from "./EndCard";
import { WrongStrike } from "./WrongStrike";
import { TitleBlock } from "./TitleBlock";
import { CredentialBadge } from "./CredentialBadge";
import { ConceptDiagram } from "./ConceptDiagram";
import { IllustrationCue } from "./IllustrationCue";
import { ClipCue } from "./ClipCue";
import { AnimatedArt } from "./AnimatedArt";

// Script-authored animation moments. Each cue fires at the transcript cue
// where its normalized trigger phrase begins (the phrase may span several
// short HeyGen cues); payload shape depends on type (diagram: {nodes, arrows,
// labels?}, illustration: {image, caption?}, pullquote: {text}, clip:
// {video, caption?} where video is a public-relative mp4 path, art:
// {image, caption?} where image is founder artwork under public/art/).
export const animationCueSchema = z.object({
  trigger: z.string(),
  type: z.enum(["diagram", "illustration", "pullquote", "clip", "art"]),
  payload: z.record(z.string(), z.any()),
});

export type AnimationCue = z.infer<typeof animationCueSchema>;

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
  animationCues: z.array(animationCueSchema).default([]),
  // Persistent TikTok-style title block, top-center. Line 1 = the punchy hook
  // (draft.video_title), line 2 = the EPPP domain label. Empty string = that
  // line is hidden (both empty = no block at all).
  titleLine1: z.string().default(""),
  titleLine2: z.string().default(""),
  // Opening credential hook (e.g. "UCLA-trained psychologist"). Fired
  // automatically as a top-center pill for the first ~2s, then the title takes
  // its place. Not a per-draft animation cue. Empty string = no badge (e.g.
  // pop-culture videos).
  credential: z.string().default(""),
  // Compliance line for medical/clinical content (e.g. medication questions).
  // Empty = no disclaimer. When set, a small pill stays up across the question
  // and payoff beats; the title yields the top spot for that span. Burned into
  // the render, so it survives anywhere the video is reposted.
  disclaimerLine: z.string().default(""),
  // Opening visual-hook image (public-relative path). Rendered as a rounded
  // panel in the upper zone, directly below the two-line title block, from
  // frame 0 until the question card opens (or ~6s if there is no card). Sized
  // and positioned to sit under the title without covering the avatar's face
  // (face is ~screen center). Empty string = nothing renders.
  hookImage: z.string().default(""),
});

export type PracticeQuestionProps = z.infer<typeof practiceQuestionSchema>;

const REVEAL_SECONDS = 3.5;

// Animation cues stay up at most this long when no other overlay cuts them
// short. Long enough to read a 3-node diagram, short enough to stay calm.
const ANIMATION_CUE_MAX_MS = 4500;

// One caption chunk. Pops in with a quick scale/fade. Look comes from the
// selected entry in CAPTION_STYLES; position from captionBottomPercent.
// accentPass paints the stakes word "pass" in the accent color (only enabled
// for chunks in the opening seconds, where "pass the exam" is the hook).
const CaptionChunk: React.FC<{
  text: string;
  style: React.CSSProperties;
  bottomPercent: number;
  accentPass?: boolean;
}> = ({ text, style, bottomPercent, accentPass = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = interpolate(frame, [0, 0.15 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Split keeps the matched word (capture group), so the accent span drops in
  // without disturbing spacing. Text stroke/shadow inherit from the parent.
  const content = accentPass
    ? text.split(/(\bpass\b)/i).map((part, i) =>
        /^pass$/i.test(part) ? (
          <span key={i} style={{ color: ACCENT }}>
            {part}
          </span>
        ) : (
          part
        )
      )
    : text;

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
        {content}
      </div>
    </AbsoluteFill>
  );
};

// Pullquote animation cue: one key sentence, large, on the dark panel, with
// the quote marks carrying the accent. Chest-level like the diagram.
const PullQuote: React.FC<{ text: string }> = ({ text }) => {
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
        justifyContent: "center",
        alignItems: "center",
        paddingTop: "48%",
      }}
    >
      <div
        style={{
          backgroundColor: SITE_BG,
          borderRadius: PANEL_RADIUS,
          width: "88%",
          padding: "52px 56px",
          fontFamily: FONT_GEIST,
          fontSize: 46,
          fontWeight: 500,
          lineHeight: 1.45,
          color: TEXT_PRIMARY,
          boxShadow: PANEL_SHADOW,
          opacity: progress,
          transform: `translateY(${(1 - progress) * 24}px)`,
        }}
      >
        <span style={{ color: ACCENT }}>“</span>
        {text}
        <span style={{ color: ACCENT }}>”</span>
      </div>
    </AbsoluteFill>
  );
};

// Compliance line for medical/clinical content: a small persistent pill at the
// title position, shown across the question and payoff beats (driven by the
// disclaimerLine prop). Sits exactly where the title would be; the title is
// hidden for the same window so the two never stack. Small and muted on a
// translucent dark pill so it reads over the footage without stealing the shot.
const DisclaimerLine: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = interpolate(frame, [0, 0.3 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: TITLE_TOP_PX,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: progress,
        }}
      >
        <div
          style={{
            fontFamily: FONT_GEIST,
            fontSize: 30,
            fontWeight: 500,
            color: "#fafafa",
            backgroundColor: "rgba(24,24,27,0.72)",
            padding: "9px 22px",
            borderRadius: 999,
            textShadow: "0 1px 3px rgba(0,0,0,0.5)",
          }}
        >
          {text}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Opening visual-hook image: a rounded photo panel in the upper zone, sitting
// directly below the two-line title block. Part of the opening hook (e.g. the
// pop-culture moment the question is about), so it shows from frame 0 until the
// question card opens. The panel is a fixed-height window cropping the image
// (objectFit: cover), positioned high enough that the avatar's face — around
// screen center — stays clear. Calm fade-in, no other motion.
const HOOK_IMAGE_TOP_PX = 490; // well below the two-line title (title at 272, ~2 lines), so the full title stays visible above with margin
const HOOK_IMAGE_WIDTH_PCT = 60; // % of the 1080 frame
const HOOK_IMAGE_HEIGHT_PX = 440; // crop window height, shrunk so the lower start still clears the avatar's face (~screen center)
const HookImage: React.FC<{ image: string }> = ({ image }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: HOOK_IMAGE_TOP_PX,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: progress,
        }}
      >
        <div
          style={{
            width: `${HOOK_IMAGE_WIDTH_PCT}%`,
            height: HOOK_IMAGE_HEIGHT_PX,
            borderRadius: PANEL_RADIUS,
            overflow: "hidden",
            boxShadow: PANEL_SHADOW,
            transform: `scale(${0.98 + 0.02 * progress})`,
          }}
        >
          <Img
            src={staticFile(image)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              // Anchor the crop on the subject (Ariana sits lower-center of the
              // source, the crowd fills the top), so the cover crop keeps her in
              // view instead of showing only the audience.
              objectPosition: "center 55%",
              display: "block",
            }}
          />
        </div>
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
  // Schema default covers parsed props; the `?? []` covers raw props passed
  // straight to the component (Remotion hands the component the input shape).
  animationCues = [],
  titleLine1 = "",
  titleLine2 = "",
  credential = "",
  disclaimerLine = "",
  hookImage = "",
}) => {
  // Card/strike text is parsed from the spoken script, so phonetic spellings
  // ("ways four", "E triple P") must map back to written forms on screen.
  questionStem = applySpellingToText(questionStem);
  choices = choices.map(applySpellingToText);
  const { fps, durationInFrames } = useVideoConfig();
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

  // Shared transcript normalizer (lowercase, collapse punctuation to spaces).
  const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

  // The reveal ("The answer is X") is detected first because both the card
  // window and the wrong-answer strikes need the correct-answer letter: the
  // broadened "named" call-out pattern (e.g. "A is the success and failure
  // bias") must never fire on the correct row.
  const reveal = useMemo(
    () => detectReveal(cues, norm, choices.length),
    [cues, choices]
  );

  // The card covers the window from the first stem cue until the explanation
  // begins: the EARLIER of the first wrong-answer call-out and the answer
  // reveal ("The answer is..."). Ending at the first wrong-answer cue (rather
  // than holding the static card all the way to the reveal) hands the
  // wrong-answer beat to the cross-out strikes, captions, and payoff
  // animations the founder wants there (2026-06-16). Wrong-answer detection is
  // shared with wrongStrikes below (wrong-answer-detect.ts), so it also fires
  // on concept-named call-outs, not just "<L> is wrong". Located by text match
  // against the transcript, so it survives timing differences.
  const cardWindow = useMemo(() => {
    if (!questionStem || cues.length === 0) return null;
    const stemNorm = norm(questionStem);
    const start = cues.find(
      (c) => norm(c.text).length > 0 && stemNorm.startsWith(norm(c.text))
    );
    if (!start) return null;
    const firstWrongMs = detectFirstWrongMs(cues, norm, reveal);
    const answer = cues.find((c) => norm(c.text).startsWith("the answer is"));
    const ends = [firstWrongMs, answer?.startMs]
      .filter((ms): ms is number => typeof ms === "number")
      .filter((ms) => ms > start.startMs);
    if (ends.length === 0) return null;
    return { fromMs: start.startMs, toMs: Math.min(...ends) };
  }, [cues, questionStem, reveal]);

  const cardFrom = cardWindow ? Math.round((cardWindow.fromMs / 1000) * fps) : 0;
  const cardDuration = cardWindow
    ? Math.round(((cardWindow.toMs - cardWindow.fromMs) / 1000) * fps)
    : 0;

  // The reveal re-shows the card for ~3.5s with the correct row highlighted,
  // starting at the "The answer is X" cue (detected above). The letter comes
  // from the cue text itself, so it always matches what the avatar says.
  const revealWindow = useMemo(
    () =>
      reveal
        ? { fromMs: reveal.fromMs, toMs: reveal.fromMs + REVEAL_SECONDS * 1000 }
        : null,
    [reveal]
  );
  const revealFrom = revealWindow
    ? Math.round((revealWindow.fromMs / 1000) * fps)
    : 0;
  const revealDuration = revealWindow
    ? Math.max(
        1,
        Math.min(Math.round(REVEAL_SECONDS * fps), durationInFrames - revealFrom)
      )
    : 0;

  // Final CTA cue: the last cue containing the site URL (spoken or written
  // form). The end card runs from there to the end of the video.
  const endCardFromMs = useMemo(() => {
    let detected: number | null = null;
    for (let i = cues.length - 1; i >= 0; i--) {
      const t = norm(cues[i].text);
      if (
        t.includes("thepsychology ai") ||
        t.includes("thepsychology.ai") ||
        t.includes("the psychology dot ai")
      ) {
        detected = cues[i].startMs;
        break;
      }
    }
    // Founder 2026-06-16: the end card must ALWAYS take over the ending, even
    // when ASR mangles the URL past the spelling map. Cover at least the last
    // ~3.2s so a stray closing caption never shows instead of the card.
    const durationMs = (durationInFrames / fps) * 1000;
    const minFrom = Math.max(0, durationMs - 3200);
    return detected !== null ? Math.min(detected, minFrom) : minFrom;
  }, [cues, durationInFrames, fps]);

  const endCardFrom =
    endCardFromMs !== null ? Math.round((endCardFromMs / 1000) * fps) : 0;
  const endCardDuration =
    endCardFromMs !== null ? Math.max(1, durationInFrames - endCardFrom) : 0;

  // Where the closing CTA begins ("Comment PASS...", "Follow for..."). Used to
  // close the disclaimer band on videos whose CTA is not the site URL, so they
  // have no end card to bound it. First cue that opens with "comment"/"follow".
  const ctaFromMs = useMemo(() => {
    for (const c of cues) {
      if (/^(comment|follow)\b/.test(norm(c.text))) return c.startMs;
    }
    return null;
  }, [cues]);

  // The medical/clinical disclaimer band: up from the question through the
  // payoff explanation, closing as the end card / CTA opens (the closing beat
  // is not a medical claim). Falls back to the whole video if the question card
  // was not detected, so a compliance line never silently fails to show.
  const disclaimerWindow = useMemo(() => {
    if (!disclaimerLine) return null;
    // Founder (2026-06-16): the hook title plays first, then the compliance pill
    // comes up a few seconds in and holds to the end (medical content).
    const durationMs = (durationInFrames / fps) * 1000;
    return { fromMs: Math.min(3500, durationMs), toMs: durationMs };
  }, [disclaimerLine, cardWindow, endCardFromMs, ctaFromMs, durationInFrames, fps]);

  // Opening hook image: up from frame 0 until the question card opens (the card
  // takes over the screen there). With no card, hold ~6s — long enough to read
  // the hook, short enough to clear before the explanation. Capped at the video
  // length so a very short clip never asks for frames past the end.
  const hookImageWindow = useMemo(() => {
    if (!hookImage) return null;
    const durationMs = (durationInFrames / fps) * 1000;
    const toMs = cardWindow ? cardWindow.fromMs : Math.min(6000, durationMs);
    return toMs > 0 ? { fromMs: 0, toMs } : null;
  }, [hookImage, cardWindow, durationInFrames, fps]);

  const inCardWindow = (ms: number) =>
    cardWindow !== null && ms >= cardWindow.fromMs && ms < cardWindow.toMs;
  const inRevealWindow = (ms: number) =>
    revealWindow !== null && ms >= revealWindow.fromMs && ms < revealWindow.toMs;
  const inEndCardWindow = (ms: number) =>
    endCardFromMs !== null && ms >= endCardFromMs;

  // Elimination cues each get a strike-through moment: the named choice row
  // slides in and gets crossed out while the avatar explains why it is wrong.
  // Card and reveal outrank strikes, so any cue inside those windows is
  // skipped. The scripts phrase eliminations many ways, so detection covers a
  // conservative, deterministic set:
  //   single  "<L> is wrong" / "<L> is incorrect" / "<L> fails"
  //           ("So A is wrong" is covered — the letter is still a word match)
  //   pair    "<L> and <L> are wrong/incorrect" / "... fail" / "... lag"
  //   pair    "<L> and <L> are <phrase>" only when that phrase reads as a
  //           ruling-out (ELIMINATIVE below). If unsure we skip: the reveal
  //           already dimmed the wrong rows, so a missed strike is harmless.
  //
  // Each strike also carries a short reason chip: the clause spoken right
  // after the verdict. HeyGen cues run only 2-5 words, so the clause keeps
  // absorbing following cues until the sentence ends or 9 words are in hand,
  // then clamps to 9 whole words ("..." only when something was cut). The
  // strike holds for the whole clause so it stays up while the reason is read.
  const wrongStrikes = useMemo(() => {
    if (choices.length === 0) return [];
    type Strike = { fromMs: number; toMs: number; index: number; reason?: string };
    const out: Strike[] = [];

    // Lower bound for the broadened named call-out: the end of the choices
    // listing, so a choice row ("A, self-serving bias.") never reads as a
    // verdict. Shared with the card window via wrong-answer-detect.ts.
    const choicesEndMs = choicesListedEndMs(cues, norm);

    // Words that mark a choice as ruled out. Only used to confirm the
    // "<L> and <L> are <phrase>" pattern, which names two choices without an
    // explicit "wrong/fail/lag" verb (e.g. "A and B are fixed batteries that
    // must stay standardized"). Conservative on purpose.
    const ELIMINATIVE =
      /\b(wrong|incorrect|fails?|lags?|trap|rigid|fixed|standardi[sz]ed|must (?:stay|remain|be)|not|never|cannot|can'?t|only|too|less|fall short|falls short|lacks?|ineffective|counterproductive|wors[et])\b/i;

    // Why-it's-wrong clause spoken after `afterText`, absorbing following short
    // cues until the sentence ends or 9 words land. Returns the clause and the
    // end of the last cue it consumed (so the strike spans the explanation).
    const clauseFrom = (afterText: string, startIdx: number) => {
      let words = afterText.split(/\s+/).filter(Boolean);
      let lastIdx = startIdx;
      for (
        let j = startIdx + 1;
        words.length < 9 &&
        j < cues.length &&
        !/[.;!?]$/.test(words[words.length - 1] ?? "");
        j++
      ) {
        words = words.concat(cues[j].text.split(/\s+/).filter(Boolean));
        lastIdx = j;
      }
      const clamped = words.length > 9;
      const reason = clamped
        ? `${words.slice(0, 9).join(" ").replace(/[,;:]$/, "")}...`
        : words.join(" ");
      // Drop a leading verdict verb so the chip reads as the explanation only.
      const display = reason.replace(/^(are (?:wrong|incorrect)|fails?|lags?|are)\b[,.:;\s]*/i, "");
      return { reason: display || undefined, clauseEndMs: cues[lastIdx].endMs };
    };

    for (let i = 0; i < cues.length; i++) {
      const c = cues[i];
      const inCard =
        cardWindow !== null &&
        c.startMs >= cardWindow.fromMs &&
        c.startMs < cardWindow.toMs;
      const inReveal =
        revealWindow !== null &&
        c.startMs >= revealWindow.fromMs &&
        c.startMs < revealWindow.toMs;
      if (inCard || inReveal) continue;

      // Pair first: "<L> and <L>" + an eliminative verdict.
      const pair = c.text.match(/\b([A-D]) and ([A-D])\b/);
      if (pair) {
        const i1 = "ABCD".indexOf(pair[1]);
        const i2 = "ABCD".indexOf(pair[2]);
        const after = c.text
          .slice(c.text.indexOf(pair[0]) + pair[0].length)
          .replace(/^[,.:;\s]+/, "");
        const { reason, clauseEndMs } = clauseFrom(after, i);
        const explicit = /^(?:are (?:wrong|incorrect)|fails?|lags?)\b/i.test(after);
        const ruledOut = /^are\b/i.test(after) && ELIMINATIVE.test(after + " " + (reason ?? ""));
        if (
          (explicit || ruledOut) &&
          i1 >= 0 &&
          i2 >= 0 &&
          i1 !== i2 &&
          i1 < choices.length &&
          i2 < choices.length
        ) {
          // Two sequential windows so the strikes never stack: first letter
          // holds the first half of the clause, second letter the rest.
          const mid = Math.round((c.startMs + clauseEndMs) / 2);
          out.push({ fromMs: c.startMs, toMs: mid, index: i1, reason });
          out.push({ fromMs: mid, toMs: clauseEndMs, index: i2, reason });
          continue;
        }
      }

      // Single verdict: explicit "<L> is wrong/incorrect/fails" OR a named
      // call-out "<L> <verb> ..." (e.g. "A is the success and failure bias")
      // that is not the correct answer and sits in the explanation region.
      // Shared with the card window so both agree on what counts as a verdict.
      const index = wrongCallOutIndex(c, norm, choicesEndMs, reveal?.index ?? null);
      if (index >= 0 && index < choices.length) {
        // Reason = the clause after the letter (and any leading verdict verb,
        // dropped inside clauseFrom). For a named call-out the whole sentence
        // after the letter is the reason ("is the success and failure bias...").
        const after = c.text
          .replace(/^\s*[A-D][,.:;\s]+/, "")
          .replace(/^[A-D]\b[,.:;\s]*/, "");
        const { reason, clauseEndMs } = clauseFrom(after, i);
        out.push({ fromMs: c.startMs, toMs: clauseEndMs, index, reason });
      }
    }

    // Strikes never overlap: clamp each to the next strike's start (and to the
    // end card if one is set) so the windows play back to back.
    out.sort((a, b) => a.fromMs - b.fromMs);
    for (let i = 0; i < out.length; i++) {
      if (i < out.length - 1) out[i].toMs = Math.min(out[i].toMs, out[i + 1].fromMs);
      if (endCardFromMs !== null) out[i].toMs = Math.min(out[i].toMs, endCardFromMs);
    }
    return out.filter((s) => s.toMs > s.fromMs);
  }, [cues, choices, cardWindow, revealWindow, endCardFromMs, reveal]);

  // Script-authored animation cues (diagram / illustration / pullquote).
  // Each fires at the transcript cue containing its trigger phrase and holds
  // until +4.5s or the next overlay window, whichever comes first. Card,
  // strikes, and end card outrank these (a trigger inside one is skipped). The
  // reveal is the exception: explanation visuals are usually triggered on a
  // payoff phrase the avatar says during the ~3.5s answer card, so rather than
  // drop them they slide to start the moment the reveal clears.
  const cueOverlays = useMemo(() => {
    if (animationCues.length === 0 || cues.length === 0) return [];
    const overlayWindows: { fromMs: number; toMs: number }[] = [
      ...(cardWindow ? [cardWindow] : []),
      ...(revealWindow ? [revealWindow] : []),
      ...wrongStrikes.map((s) => ({ fromMs: s.fromMs, toMs: s.toMs })),
      ...(endCardFromMs !== null
        ? [{ fromMs: endCardFromMs, toMs: Infinity }]
        : []),
    ];
    // Block windows skip a trigger occurrence outright (the card/strike/end
    // card own the screen there); the reveal is handled by deferral below, so
    // it is NOT a block window.
    const blockWindows = overlayWindows.filter((w) => w !== revealWindow);
    // HeyGen cues run only 2-5 words, so trigger phrases regularly span cue
    // boundaries. Match against the whole word stream and map the first word
    // of the match back to its cue. Occurrences inside a block window are
    // skipped (e.g. the same phrase read aloud inside the card), so the next
    // clean occurrence still fires.
    const words: { word: string; cueIndex: number }[] = [];
    cues.forEach((c, cueIndex) => {
      for (const word of norm(c.text).split(" ")) {
        if (word) words.push({ word, cueIndex });
      }
    });
    const findTriggerMs = (trigger: string): number | null => {
      const target = trigger.split(" ").filter(Boolean);
      if (target.length === 0) return null;
      for (let i = 0; i + target.length <= words.length; i++) {
        if (!target.every((w, j) => words[i + j].word === w)) continue;
        const fromMs = cues[words[i].cueIndex].startMs;
        if (!blockWindows.some((w) => fromMs >= w.fromMs && fromMs < w.toMs))
          return fromMs;
      }
      return null;
    };
    const out: { fromMs: number; toMs: number; cue: AnimationCue }[] = [];
    for (const cue of animationCues) {
      // Malformed payloads are skipped, never rendered half-broken.
      if (cue.type === "diagram" && !Array.isArray(cue.payload.nodes)) continue;
      if (cue.type === "illustration" && typeof cue.payload.image !== "string")
        continue;
      if (cue.type === "art" && typeof cue.payload.image !== "string")
        continue;
      if (cue.type === "pullquote" && typeof cue.payload.text !== "string")
        continue;
      if (cue.type === "clip" && typeof cue.payload.video !== "string")
        continue;
      // The trigger is authored from the spoken (phonetic) script, but cue
      // text comes from the de-phoneticized ASR captions ("M-A-O-I" spoken ->
      // "MAOI" transcribed). Normalize the trigger through the same spelling
      // map so phonetic acronyms still match (a no-op for plain triggers).
      let fromMs = findTriggerMs(norm(applySpellingToText(cue.trigger)));
      if (fromMs === null) continue;
      // Trigger landed during the answer reveal: slide it to the reveal's end
      // so the explanation visual plays right after the answer card clears
      // (instead of being swallowed by the reveal).
      if (
        revealWindow &&
        fromMs >= revealWindow.fromMs &&
        fromMs < revealWindow.toMs
      ) {
        fromMs = revealWindow.toMs;
      }
      const nextWindowMs = Math.min(
        fromMs + ANIMATION_CUE_MAX_MS,
        ...overlayWindows
          .filter((w) => w.fromMs > fromMs)
          .map((w) => w.fromMs)
      );
      out.push({ fromMs, toMs: nextWindowMs, cue });
    }
    // Animation cues never stack: an earlier cue hands the panel off the
    // moment the next one starts.
    out.sort((a, b) => a.fromMs - b.fromMs);
    for (let i = 0; i < out.length - 1; i++) {
      out[i].toMs = Math.min(out[i].toMs, out[i + 1].fromMs);
    }
    return out.filter((o) => o.toMs > o.fromMs);
  }, [animationCues, cues, cardWindow, revealWindow, wrongStrikes, endCardFromMs]);

  // Founder rule: captions show at most 3 words at a time. HeyGen cues run
  // 3-6 words, so split each cue for DISPLAY only, dividing its time span by
  // word share. Overlay windows above keep matching the original cues (their
  // trigger phrases, "The answer is", "exam?", would not survive splitting).
  const MAX_CAPTION_WORDS = 3;
  const captionChunks = useMemo(
    () =>
      cues.flatMap((cue) => {
        const words = cue.text.split(/\s+/).filter(Boolean);
        if (words.length <= MAX_CAPTION_WORDS) return [cue];
        const pieces: typeof cues = [];
        const span = cue.endMs - cue.startMs;
        for (let w = 0; w < words.length; w += MAX_CAPTION_WORDS) {
          const slice = words.slice(w, w + MAX_CAPTION_WORDS);
          pieces.push({
            ...cue,
            text: slice.join(" "),
            startMs: cue.startMs + (span * w) / words.length,
            endMs: cue.startMs + (span * Math.min(w + MAX_CAPTION_WORDS, words.length)) / words.length,
          });
        }
        return pieces;
      }),
    [cues]
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <Video
        src={staticFile(videoFile)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      {captionChunks.map((cue, i) => {
        // Captions stay up through the wrong-answer beat (founder 2026-06-16:
        // "the caption should be there when the explanation is happening").
        // The strike sits chest-level and the caption lower-third, so they do
        // not collide. The full card and the answer reveal still own the
        // screen, and the end card takes over the close.
        if (
          inCardWindow(cue.startMs) ||
          inRevealWindow(cue.startMs) ||
          inEndCardWindow(cue.startMs)
        )
          return null;
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
              // Stakes-word accent only in the opening hook ("...possible to
              // pass...") — later mentions of "pass" stay plain.
              accentPass={cue.startMs < 10000}
            />
          </Sequence>
        );
      })}
      {titleLine1 || titleLine2 ? (
        // No Sequence: shown whenever nothing covers it. Sits here in the
        // stack so cards, reveals, strikes, and panels all cover it while up.
        // Clip/art panels float in the same top zone the title now occupies
        // (thumbnail crop pushed it down), so the title fades out for those
        // windows instead of colliding.
        <TitleBlock
          line1={titleLine1}
          line2={titleLine2}
          hideWindows={[
            ...cueOverlays
              .filter((o) => o.cue.type === "clip" || o.cue.type === "art")
              .map((o) => ({ fromMs: o.fromMs, toMs: o.toMs })),
            // The card and reveal panels start above the lowered title, so the
            // title steps aside for those too (founder: title clashed with the
            // question card).
            ...(cardWindow ? [cardWindow] : []),
            ...(revealWindow ? [revealWindow] : []),
            // The opening credential badge sits in the title's spot for the
            // first ~2s; the title fades in right as the badge leaves.
            ...(credential ? [{ fromMs: 0, toMs: CREDENTIAL_TOTAL_S * 1000 }] : []),
            // The disclaimer pill takes the title's spot while it is up.
            ...(disclaimerWindow ? [disclaimerWindow] : []),
          ]}
        />
      ) : null}
      {credential ? (
        <Sequence
          from={0}
          durationInFrames={Math.round(CREDENTIAL_TOTAL_S * fps)}
        >
          <CredentialBadge text={credential} />
        </Sequence>
      ) : null}
      {hookImageWindow ? (
        // Below the title in the stack so the card/reveal/strikes still cover it
        // once it ends; it only owns the upper zone during the opening hook.
        <Sequence
          from={Math.round((hookImageWindow.fromMs / 1000) * fps)}
          durationInFrames={Math.max(
            1,
            Math.round(((hookImageWindow.toMs - hookImageWindow.fromMs) / 1000) * fps)
          )}
        >
          <HookImage image={hookImage} />
        </Sequence>
      ) : null}
      {cueOverlays.map((o, i) => (
        <Sequence
          key={`anim-${i}`}
          from={Math.round((o.fromMs / 1000) * fps)}
          durationInFrames={Math.max(
            1,
            Math.round(((o.toMs - o.fromMs) / 1000) * fps)
          )}
        >
          {o.cue.type === "diagram" ? (
            <ConceptDiagram
              nodes={(o.cue.payload.nodes as string[]).slice(0, 3)}
              arrows={(o.cue.payload.arrows as [number, number][]) ?? []}
              labels={o.cue.payload.labels as string[] | undefined}
            />
          ) : o.cue.type === "illustration" ? (
            <IllustrationCue
              image={o.cue.payload.image as string}
              caption={o.cue.payload.caption as string | undefined}
            />
          ) : o.cue.type === "clip" ? (
            <ClipCue
              video={o.cue.payload.video as string}
              caption={o.cue.payload.caption as string | undefined}
            />
          ) : o.cue.type === "art" ? (
            <AnimatedArt
              image={o.cue.payload.image as string}
              caption={o.cue.payload.caption as string | undefined}
            />
          ) : (
            <PullQuote text={o.cue.payload.text as string} />
          )}
        </Sequence>
      ))}
      {wrongStrikes.map((s, i) => (
        <Sequence
          key={`strike-${i}`}
          from={Math.round((s.fromMs / 1000) * fps)}
          durationInFrames={Math.max(
            1,
            Math.round(((s.toMs - s.fromMs) / 1000) * fps)
          )}
        >
          <WrongStrike
            letter={"ABCD"[s.index]}
            choice={choices[s.index]}
            reason={s.reason}
          />
        </Sequence>
      ))}
      {cardWindow ? (
        <Sequence from={cardFrom} durationInFrames={cardDuration}>
          <QuestionCard stem={questionStem} choices={choices} />
        </Sequence>
      ) : null}
      {reveal ? (
        <Sequence from={revealFrom} durationInFrames={revealDuration}>
          <AnswerReveal
            stem={questionStem}
            choices={choices}
            correctIndex={reveal.index}
            // No card on screen before the reveal (stem cue not found):
            // play the entrance fade instead of continuing seamlessly.
            animateIn={cardWindow === null}
          />
        </Sequence>
      ) : null}
      {endCardFromMs !== null ? (
        <Sequence from={endCardFrom} durationInFrames={endCardDuration}>
          <EndCard bottomPercent={captionBottomPercent} />
        </Sequence>
      ) : null}
      {disclaimerWindow ? (
        // Last in the stack so the compliance line sits above every panel.
        <Sequence
          from={Math.round((disclaimerWindow.fromMs / 1000) * fps)}
          durationInFrames={Math.max(
            1,
            Math.round(((disclaimerWindow.toMs - disclaimerWindow.fromMs) / 1000) * fps)
          )}
        >
          <DisclaimerLine text={disclaimerLine} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
