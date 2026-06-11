import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ACCENT, SITE_BG } from "./QuestionCard";

// Explainer diagram: 2-3 labeled boxes connected by arrows that draw
// themselves left to right while the avatar talks through a relationship
// ("the court keeps an interest in the treatment"). Same dark panel language
// as the question card; sits at chest level so the face stays clear.
//
// arrows are pairs of node indexes; only adjacent left-to-right pairs
// ([0,1], [1,2]) render in this horizontal layout. labels[i] annotates
// arrows[i].
export const ConceptDiagram: React.FC<{
  nodes: string[];
  arrows: [number, number][];
  labels?: (string | undefined)[];
}> = ({ nodes, arrows, labels }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ease = Easing.bezier(0.16, 1, 0.3, 1);

  const t = (startSec: number, durSec: number) =>
    interpolate(frame, [startSec * fps, (startSec + durSec) * fps], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: ease,
    });

  const panel = t(0, 0.35);

  // Boxes settle first (quick sequence), then the arrows draw between them.
  // An arrow never points at a box that is not on screen yet.
  const nodeIn = (i: number) => t(0.15 + i * 0.22, 0.35);
  const arrowIn = (i: number) => t(0.95 + i * 0.5, 0.55);

  // Fixed SVG geometry per arrow cell; the line reveals via dash offset.
  const AW = 168;
  const AH = 44;
  const x1 = 8;
  const x2 = AW - 22;
  const y = AH / 2;
  const lineLen = x2 - x1;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        // Push below screen center to chest level (see WrongStrike): % pads
        // resolve against width (1080), so 52% lands the panel's center
        // around 65% of the 1920 frame height, same as the strike row.
        paddingTop: "52%",
      }}
    >
      <div
        style={{
          backgroundColor: SITE_BG,
          borderRadius: 28,
          width: "92%",
          padding: "56px 44px",
          fontFamily: "Geist, -apple-system, sans-serif",
          boxShadow: "0 12px 48px rgba(0,0,0,0.45)",
          opacity: panel,
          transform: `translateY(${(1 - panel) * 24}px)`,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {nodes.slice(0, 3).map((node, i) => {
          const arrowIdx = arrows.findIndex(
            ([a, b]) => a === i - 1 && b === i
          );
          const np = nodeIn(i);
          const ap = arrowIdx === -1 ? 0 : arrowIn(arrowIdx);
          const label = arrowIdx === -1 ? undefined : labels?.[arrowIdx];
          return (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              {i > 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    margin: "0 6px",
                  }}
                >
                  {label ? (
                    <div
                      style={{
                        fontSize: 26,
                        fontWeight: 400,
                        color: "#a1a1aa",
                        whiteSpace: "nowrap",
                        marginBottom: 2,
                        // Label trails the line draw.
                        opacity: interpolate(ap, [0.5, 1], [0, 1], {
                          extrapolateLeft: "clamp",
                        }),
                      }}
                    >
                      {label}
                    </div>
                  ) : null}
                  {arrowIdx === -1 ? (
                    <div style={{ width: 48 }} />
                  ) : (
                    <svg width={AW} height={AH}>
                      <line
                        x1={x1}
                        y1={y}
                        x2={x2}
                        y2={y}
                        stroke="#71717a"
                        strokeWidth={3.5}
                        strokeDasharray={lineLen}
                        strokeDashoffset={(1 - ap) * lineLen}
                      />
                      <polygon
                        points={`${x2},${y - 9} ${x2 + 14},${y} ${x2},${y + 9}`}
                        fill={ACCENT}
                        // Arrowhead lands once the line reaches it.
                        opacity={interpolate(ap, [0.8, 1], [0, 1], {
                          extrapolateLeft: "clamp",
                        })}
                      />
                    </svg>
                  )}
                </div>
              ) : null}
              <div
                style={{
                  backgroundColor: "#27272a",
                  border: "1px solid #3f3f46",
                  borderRadius: 18,
                  padding: "26px 34px",
                  fontSize: 38,
                  fontWeight: 600,
                  color: "#fafafa",
                  whiteSpace: "nowrap",
                  opacity: np,
                  transform: `translateY(${(1 - np) * 14}px)`,
                }}
              >
                {node}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
