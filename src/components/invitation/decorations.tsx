import type { ComponentType } from "react";

import type { OrnamentSet } from "@/lib/templates";

/**
 * Ilustraciones botánicas y adornos de las plantillas. Son SVG originales que
 * toman sus colores de las variables `--inv-orn-*` de cada plantilla.
 */

type DecorationProps = { className?: string };

const PETAL = "var(--inv-orn-petal)";
const PETAL_ALT = "var(--inv-orn-petal-alt)";
const LEAF = "var(--inv-orn-leaf)";
const LEAF_ALT = "var(--inv-orn-leaf-alt)";
const STEM = "var(--inv-orn-stem)";
const CENTER = "var(--inv-orn-center)";

const svgClass = (className?: string) => `inv-deco ${className ?? ""}`;

/** Hoja puntiaguda con nervio central, apuntando a `deg` grados. */
function Leaf({
  x,
  y,
  length,
  deg,
  alt = false,
}: {
  x: number;
  y: number;
  length: number;
  deg: number;
  alt?: boolean;
}) {
  const l = length;
  return (
    <g transform={`translate(${x} ${y}) rotate(${deg})`}>
      <path
        d={`M0 0C${l * 0.25} ${-l * 0.32} ${l * 0.72} ${-l * 0.3} ${l} 0C${l * 0.72} ${l * 0.3} ${l * 0.25} ${l * 0.32} 0 0Z`}
        style={{ fill: alt ? LEAF_ALT : LEAF, stroke: STEM }}
        strokeWidth="0.5"
      />
      <path d={`M1 0L${l * 0.82} 0`} style={{ stroke: STEM }} strokeWidth="0.4" />
    </g>
  );
}

/** Rama de flores secas (estilo paniculata). */
export function DriedFlowers({ className }: DecorationProps) {
  const blossoms: [number, number, number][] = [
    [38, 22, 3.2],
    [30, 30, 2.6],
    [46, 30, 2.8],
    [52, 18, 2.4],
    [24, 18, 2.2],
    [70, 48, 3],
    [78, 40, 2.4],
    [64, 40, 2.2],
    [84, 52, 2.6],
    [16, 56, 2.8],
    [8, 48, 2.2],
    [22, 46, 2.2],
    [60, 78, 2.6],
    [68, 72, 2.2],
    [52, 70, 2],
    [34, 92, 2.4],
    [26, 86, 2],
    [42, 86, 2],
  ];
  return (
    <svg viewBox="0 0 100 220" className={svgClass(className)} aria-hidden fill="none">
      <g style={{ stroke: STEM }} strokeWidth="0.9" strokeLinecap="round">
        <path d="M44 218C44 170 46 120 38 26" />
        <path d="M44 150C52 120 62 90 72 48" />
        <path d="M43 168C34 130 22 100 14 54" />
        <path d="M45 120C52 104 58 92 62 78" />
        <path d="M42 110C38 102 36 96 34 90" />
        <path d="M40 60C34 46 30 38 28 30M40 52C46 44 48 34 50 20M72 48C76 46 80 44 82 52M14 54C12 50 10 50 8 48" />
        <path d="M72 48C70 44 66 42 64 40M72 48C75 44 77 42 78 40M62 78C64 76 66 74 68 72M62 78C58 74 55 72 52 70" />
        <path d="M34 90C30 88 28 87 26 86M34 90C38 88 40 87 42 86M14 54C18 50 20 48 22 46" />
      </g>
      {blossoms.map(([x, y, r], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          {[0, 72, 144, 216, 288].map((deg) => (
            <ellipse
              key={deg}
              cx="0"
              cy={-r * 0.6}
              rx={r * 0.45}
              ry={r * 0.66}
              style={{ fill: PETAL, stroke: STEM }}
              strokeWidth="0.25"
              transform={`rotate(${deg})`}
            />
          ))}
          <circle r={r * 0.34} style={{ fill: CENTER }} />
        </g>
      ))}
    </svg>
  );
}

/** Rama de hojas alargadas. */
export function LeafSprig({ className }: DecorationProps) {
  const leaves = [
    [50, 190, -35],
    [50, 190, 35],
    [50, 160, -40],
    [50, 160, 40],
    [50, 130, -38],
    [50, 130, 38],
    [50, 100, -42],
    [50, 100, 42],
    [50, 72, -36],
    [50, 72, 36],
    [50, 46, -30],
    [50, 46, 30],
  ];
  return (
    <svg viewBox="0 0 100 230" className={svgClass(className)} aria-hidden fill="none">
      <path d="M50 228C52 160 48 90 50 20" style={{ stroke: STEM }} strokeWidth="1.1" strokeLinecap="round" />
      {leaves.map(([x, y, deg], i) => (
        <ellipse
          key={i}
          cx={x}
          cy={y}
          rx="9"
          ry="17"
          style={{ fill: i % 3 === 0 ? LEAF : LEAF_ALT, stroke: STEM }}
          strokeWidth="0.6"
          transform={`rotate(${deg} ${x} ${y + 14}) translate(${deg > 0 ? 9 : -9} 0)`}
        />
      ))}
      <ellipse cx="50" cy="16" rx="7" ry="13" style={{ fill: LEAF_ALT, stroke: STEM }} strokeWidth="0.6" />
    </svg>
  );
}

function Rose({ x, y, r, turn = 0 }: { x: number; y: number; r: number; turn?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${turn})`}>
      {[0, 72, 144, 216, 288].map((deg) => (
        <ellipse
          key={deg}
          cx="0"
          cy={-r * 0.48}
          rx={r * 0.6}
          ry={r * 0.56}
          transform={`rotate(${deg})`}
          style={{ fill: PETAL_ALT, stroke: STEM }}
          strokeWidth="0.5"
        />
      ))}
      {[36, 108, 180, 252, 324].map((deg) => (
        <ellipse
          key={deg}
          cx="0"
          cy={-r * 0.28}
          rx={r * 0.42}
          ry={r * 0.38}
          transform={`rotate(${deg})`}
          style={{ fill: PETAL, stroke: STEM }}
          strokeWidth="0.45"
        />
      ))}
      <path
        d={`M${-r * 0.3} ${r * 0.06}C${-r * 0.32} ${-r * 0.32} ${r * 0.32} ${-r * 0.34} ${r * 0.3} ${r * 0.02}C${r * 0.28} ${r * 0.3} ${-r * 0.18} ${r * 0.32} ${-r * 0.15} ${r * 0.02}C${-r * 0.13} ${-r * 0.15} ${r * 0.13} ${-r * 0.15} ${r * 0.1} ${r * 0.05}`}
        fill="none"
        style={{ stroke: CENTER }}
        strokeWidth="0.8"
        strokeLinecap="round"
      />
    </g>
  );
}

/** Ramo de tres rosas con hojas. */
export function RoseCluster({ className }: DecorationProps) {
  return (
    <svg viewBox="0 0 120 210" className={svgClass(className)} aria-hidden fill="none">
      <g style={{ stroke: STEM }} strokeWidth="1" strokeLinecap="round">
        <path d="M58 208C58 160 56 110 52 62" />
        <path d="M57 150C64 128 72 108 80 92" />
        <path d="M56 172C48 148 40 126 34 106" />
        <path d="M53 96C60 84 66 70 72 56" />
      </g>
      <Leaf x={57} y={186} length={26} deg={-148} />
      <Leaf x={58} y={168} length={24} deg={-28} alt />
      <Leaf x={55} y={132} length={20} deg={-158} alt />
      <Leaf x={66} y={124} length={20} deg={-48} />
      <Leaf x={44} y={134} length={18} deg={-128} />
      <Leaf x={54} y={98} length={18} deg={-12} alt />
      <Leaf x={40} y={116} length={14} deg={-170} />
      <Rose x={34} y={100} r={11} turn={-20} />
      <Rose x={80} y={88} r={14} turn={18} />
      <Rose x={72} y={52} r={7} turn={40} />
      <Rose x={50} y={52} r={19} />
    </svg>
  );
}

const BREATH_TIPS: [number, number][] = [
  [46, 22],
  [30, 34],
  [62, 32],
  [20, 54],
  [76, 50],
  [36, 58],
  [58, 60],
  [12, 82],
  [86, 78],
  [26, 90],
  [70, 92],
  [42, 98],
  [56, 106],
  [18, 118],
  [80, 116],
];
const FLORETS: [number, number, number][] = [
  [0, 0, 2.3],
  [-3.2, 2.2, 1.8],
  [3.1, 2.6, 1.9],
  [0.6, -3.1, 1.6],
  [-2.6, -2.2, 1.3],
];

/** Paniculata: muchas florecitas blancas en tallos finos. */
export function BabysBreath({ className }: DecorationProps) {
  return (
    <svg viewBox="0 0 100 220" className={svgClass(className)} aria-hidden fill="none">
      <g style={{ stroke: STEM }} strokeWidth="0.7" strokeLinecap="round">
        <path d="M48 218C48 170 48 110 46 26" />
        {BREATH_TIPS.map(([x, y], i) => {
          const sy = Math.min(200, y + 34);
          return <path key={i} d={`M47.5 ${sy}Q${(x + 47) / 2} ${(y + sy) / 2 + 6} ${x} ${y}`} />;
        })}
      </g>
      {BREATH_TIPS.map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          {FLORETS.map(([dx, dy, r], j) => (
            <circle key={j} cx={dx} cy={dy} r={r} style={{ fill: PETAL, stroke: PETAL_ALT }} strokeWidth="0.35" />
          ))}
          <circle r="0.7" style={{ fill: CENTER }} />
        </g>
      ))}
    </svg>
  );
}

const EUCALYPTUS_LEAVES: [number, number, number, boolean][] = [
  [41, 186, 12, false],
  [61, 168, 12, true],
  [40, 148, 11, true],
  [62, 130, 11, false],
  [43, 112, 10, false],
  [61, 95, 9, true],
  [45, 78, 8.5, true],
  [60, 62, 7.5, false],
  [48, 47, 6.5, false],
  [58, 34, 5.5, true],
];

/** Rama de eucalipto de hoja redonda. */
export function EucalyptusBranch({ className }: DecorationProps) {
  return (
    <svg viewBox="0 0 100 220" className={svgClass(className)} aria-hidden fill="none">
      <path
        d="M52 218C50 170 54 120 52 70C51 50 54 36 55 22"
        style={{ stroke: STEM }}
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      {EUCALYPTUS_LEAVES.map(([x, y, r, alt], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r} style={{ fill: alt ? LEAF_ALT : LEAF, stroke: STEM }} strokeWidth="0.6" />
          <path d={`M52 ${y + r * 0.4}L${x} ${y}`} style={{ stroke: STEM }} strokeWidth="0.45" />
        </g>
      ))}
    </svg>
  );
}

type Feather = { d: string; stem: string };

/** Pluma de pampa: tallo curvo con plumas a ambos lados, más anchas en el centro. */
function pampasPlume(base: [number, number], tip: [number, number], bend: number, width: number): Feather {
  const [bx, by] = base;
  const [tx, ty] = tip;
  const point = (t: number): [number, number] => [
    bx + (tx - bx) * t + Math.sin(t * Math.PI) * bend,
    by + (ty - by) * t,
  ];
  const strokes: string[] = [];
  for (let i = 0; i <= 26; i++) {
    const t = 0.38 + (i / 26) * 0.62;
    const [px, py] = point(t);
    const [qx, qy] = point(Math.min(1, t + 0.02));
    const len = Math.hypot(qx - px, qy - py) || 1;
    const dx = (qx - px) / len;
    const dy = (qy - py) / len;
    const reach = width * Math.sin(((t - 0.38) / 0.62) * Math.PI) + 1.5;
    for (const side of [1, -1]) {
      const ex = px - dy * reach * side + dx * reach * 0.7;
      const ey = py + dx * reach * side + dy * reach * 0.7;
      strokes.push(`M${px.toFixed(1)} ${py.toFixed(1)}L${ex.toFixed(1)} ${ey.toFixed(1)}`);
    }
  }
  const [mx, my] = point(0.5);
  return { d: strokes.join(""), stem: `M${bx} ${by}Q${mx.toFixed(1)} ${my.toFixed(1)} ${tx} ${ty}` };
}

const PAMPAS = [
  pampasPlume([52, 238], [36, 20], -10, 9),
  pampasPlume([54, 238], [80, 48], 8, 8),
  pampasPlume([50, 238], [14, 78], -6, 7),
];

/** Plumas de pampa (estilo boho). */
export function Pampas({ className }: DecorationProps) {
  return (
    <svg viewBox="0 0 100 240" className={svgClass(className)} aria-hidden fill="none" strokeLinecap="round">
      {PAMPAS.map((plume, i) => (
        <g key={i}>
          <path d={plume.d} style={{ stroke: i === 1 ? PETAL_ALT : PETAL }} strokeWidth="1" />
          <path d={plume.stem} style={{ stroke: STEM }} strokeWidth="0.9" />
        </g>
      ))}
    </svg>
  );
}

const FAN_RAYS = Array.from({ length: 11 }, (_, i) => -75 + i * 15);

/** Abanico art déco con rayos y arcos concéntricos. */
export function DecoFan({ className }: DecorationProps) {
  const arc = (r: number) => `M${60 - r} 104A${r} ${r} 0 0 1 ${60 + r} 104`;
  return (
    <svg viewBox="0 0 120 112" className={svgClass(className)} aria-hidden fill="none">
      <path d={`${arc(26)}Z`} style={{ fill: PETAL, stroke: STEM }} strokeWidth="0.8" />
      <g style={{ stroke: STEM }} strokeWidth="0.8">
        {FAN_RAYS.map((deg) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <path
              key={deg}
              d={`M${(60 + 26 * Math.sin(rad)).toFixed(1)} ${(104 - 26 * Math.cos(rad)).toFixed(1)}L${(60 + 56 * Math.sin(rad)).toFixed(1)} ${(104 - 56 * Math.cos(rad)).toFixed(1)}`}
            />
          );
        })}
        <path d={arc(40)} />
        <path d={arc(56)} />
        <path d={arc(60)} strokeWidth="1.4" />
        <path d="M2 104H118M10 109H110" />
      </g>
      {FAN_RAYS.map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <circle
            key={deg}
            cx={60 + 66 * Math.sin(rad)}
            cy={104 - 66 * Math.cos(rad)}
            r="1.6"
            style={{ fill: CENTER }}
          />
        );
      })}
      <path d="M60 12l5 6-5 6-5-6Z" style={{ fill: CENTER }} />
    </svg>
  );
}

const LAUREL_PAIRS: [number, number, number][] = [
  [50, 196, 20],
  [50, 172, 19],
  [51, 148, 18],
  [52, 124, 17],
  [53, 101, 15],
  [54, 79, 13],
  [55, 58, 11],
  [56, 40, 9],
];

/** Rama de laurel en línea dorada. */
export function Laurel({ className }: DecorationProps) {
  return (
    <svg viewBox="0 0 100 220" className={svgClass(className)} aria-hidden fill="none">
      <path d="M48 218C49 160 52 90 57 24" style={{ stroke: STEM }} strokeWidth="1" strokeLinecap="round" />
      {LAUREL_PAIRS.map(([x, y, length], i) => (
        <g key={i}>
          <Leaf x={x} y={y} length={length} deg={-128} alt={i % 2 === 0} />
          <Leaf x={x} y={y - 6} length={length} deg={-52} alt={i % 2 === 1} />
        </g>
      ))}
      <Leaf x={57} y={26} length={10} deg={-88} />
    </svg>
  );
}

/** Lazo de satén. */
export function SatinBow({ className }: DecorationProps) {
  return (
    <svg viewBox="0 0 140 124" className={svgClass(className)} aria-hidden fill="none">
      <g style={{ fill: PETAL, stroke: STEM }} strokeWidth="0.8" strokeLinejoin="round">
        <path d="M66 60C56 82 48 100 36 120L50 114L56 122C64 100 70 80 72 62Z" />
        <path d="M74 60C84 82 92 100 104 120L90 114L84 122C76 100 70 80 68 62Z" />
        <path d="M70 52C52 18 12 16 12 44C12 70 46 70 70 58Z" />
        <path d="M70 52C88 18 128 16 128 44C128 70 94 70 70 58Z" />
      </g>
      <g style={{ stroke: PETAL_ALT }} strokeWidth="1.4" strokeLinecap="round" opacity="0.9">
        <path d="M60 50C46 34 28 32 22 42" />
        <path d="M80 50C94 34 112 32 118 42" />
      </g>
      <g style={{ stroke: STEM }} strokeWidth="0.5" opacity="0.6">
        <path d="M66 56C50 52 32 54 20 50M74 56C90 52 108 54 120 50" />
      </g>
      <ellipse cx="70" cy="55" rx="9" ry="8.5" style={{ fill: PETAL_ALT, stroke: STEM }} strokeWidth="0.8" />
    </svg>
  );
}

/** Corazón pequeño para marcar el día en el calendario. */
export function HeartMark({ className }: DecorationProps) {
  return (
    <svg viewBox="0 0 24 22" className={className} aria-hidden>
      <path
        d="M12 21s-8.5-5.3-10.6-10.2C-.2 7 2.2 2.4 6.3 2c2.4-.2 4.4 1.2 5.7 3.1C13.3 3.2 15.3 1.8 17.7 2c4.1.4 6.5 5 4.9 8.8C20.5 15.7 12 21 12 21Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Flourish({ className }: DecorationProps) {
  return (
    <svg viewBox="0 0 120 16" className={className} aria-hidden fill="none">
      <path d="M2 8h44M74 8h44" stroke="currentColor" strokeWidth="0.8" />
      <path d="M60 2c-4 3-4 9 0 12 4-3 4-9 0-12Z" fill="currentColor" opacity="0.7" />
      <circle cx="50" cy="8" r="1.4" fill="currentColor" />
      <circle cx="70" cy="8" r="1.4" fill="currentColor" />
    </svg>
  );
}

/** Ilustración principal y secundaria de cada juego de adornos. */
const ORNAMENTS: Record<OrnamentSet, [ComponentType<DecorationProps>, ComponentType<DecorationProps>] | null> = {
  "dried-flowers": [DriedFlowers, LeafSprig],
  roses: [RoseCluster, LeafSprig],
  "baby-breath": [BabysBreath, BabysBreath],
  eucalyptus: [EucalyptusBranch, LeafSprig],
  pampas: [Pampas, DriedFlowers],
  "art-deco": [DecoFan, DecoFan],
  laurel: [Laurel, Laurel],
  satin: [SatinBow, BabysBreath],
  none: null,
};

/** El adorno de la plantilla: `primary` (flores) o `secondary` (ramita). */
export function Ornament({
  set,
  variant = "primary",
  className,
}: {
  set: OrnamentSet;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  const pair = ORNAMENTS[set];
  if (!pair) return null;
  const Art = pair[variant === "primary" ? 0 : 1];
  return <Art className={className} />;
}
