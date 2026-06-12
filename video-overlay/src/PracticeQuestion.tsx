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
} from "./design";
import { QuestionCard } from "./QuestionCard";
import { AnswerReveal } from "./AnswerReveal";
import { EndCard } from "./EndCard";
import { WrongStrike } from "./WrongStrike";
import { TitleBlock } from "./TitleBlock";
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

  // The card covers the window from the first stem cue to the cue that opens
  // the reveal ("The answer is..."), so question + choices + thinking pause
  // all show the full exam-style screen. Located by text match against the
  // transcript, so it survives timing differences between renders.
  const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const cardWindow = useMemo(() => {
    if (!questionStem || cues.length === 0) return null;
    const stemNorm = norm(questionStem);
    const start = cues.find(
      (c) => norm(c.text).length > 0 && stemNorm.startsWith(norm(c.text))
    );
    const end = cues.find((c) => norm(c.text).startsWith("the answer is"));
    if (!start || !end || end.startMs <= start.startMs) return null;
    return { fromMs: start.startMs, toMs: end.startMs };
  }, [cues, questionStem]);

  const cardFrom = cardWindow ? Math.round((cardWindow.fromMs / 1000) * fps) : 0;
  const cardDuration = cardWindow
    ? Math.round(((cardWindow.toMs - cardWindow.fromMs) / 1000) * fps)
    : 0;

  // The reveal re-shows the card for ~3.5s with the correct row highlighted,
  // starting at the "The answer is X" cue. The letter comes from the cue text
  // itself, so it always matches what the avatar says.
  const reveal = useMemo(() => {
    if (!questionStem || cues.length === 0) return null;
    for (const c of cues) {
      const m = norm(c.text).match(/^the answer is ([a-d])\b/);
      if (!m) continue;
      const index = "abcd".indexOf(m[1]);
      return index < choices.length ? { fromMs: c.startMs, index } : null;
    }
    return null;
  }, [cues, questionStem, choices]);

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
    for (let i = cues.length - 1; i >= 0; i--) {
      const t = norm(cues[i].text);
      if (t.includes("thepsychology ai") || t.includes("the psychology dot ai")) {
        return cues[i].startMs;
      }
    }
    return null;
  }, [cues]);

  const endCardFrom =
    endCardFromMs !== null ? Math.round((endCardFromMs / 1000) * fps) : 0;
  const endCardDuration =
    endCardFromMs !== null ? Math.max(1, durationInFrames - endCardFrom) : 0;

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

      // Single verdict.
      const single = c.text.match(/\b([A-D]) (?:is wrong|is incorrect|fails?)\b/);
      if (single) {
        const index = "ABCD".indexOf(single[1]);
        if (index < 0 || index >= choices.length) continue;
        const after = c.text
          .slice(c.text.indexOf(single[0]) + single[0].length)
          .replace(/^[,.:;\s]+/, "");
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
  }, [cues, choices, cardWindow, revealWindow, endCardFromMs]);

  const inWrongStrike = (ms: number) =>
    wrongStrikes.some((s) => ms >= s.fromMs && ms < s.toMs);

  // Script-authored animation cues (diagram / illustration / pullquote).
  // Each fires at the transcript cue containing its trigger phrase and holds
  // until +4.5s or the next overlay window, whichever comes first. Card,
  // reveal, strikes, and end card all outrank these: a trigger inside one of
  // those windows is dropped.
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
    // HeyGen cues run only 2-5 words, so trigger phrases regularly span cue
    // boundaries. Match against the whole word stream and map the first word
    // of the match back to its cue. Occurrences inside another overlay's
    // window are skipped (e.g. the same phrase read aloud inside the card),
    // so the next clean occurrence still fires.
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
        if (!overlayWindows.some((w) => fromMs >= w.fromMs && fromMs < w.toMs))
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
      const fromMs = findTriggerMs(norm(cue.trigger));
      if (fromMs === null) continue;
      const nextWindowMs = Math.min(
        fromMs + ANIMATION_CUE_MAX_MS,
        ...overlayWindows.filter((w) => w.fromMs > fromMs).map((w) => w.fromMs)
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
        if (
          inCardWindow(cue.startMs) ||
          inRevealWindow(cue.startMs) ||
          inWrongStrike(cue.startMs) ||
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
          hideWindows={cueOverlays
            .filter((o) => o.cue.type === "clip" || o.cue.type === "art")
            .map((o) => ({ fromMs: o.fromMs, toMs: o.toMs }))}
        />
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
    </AbsoluteFill>
  );
};
