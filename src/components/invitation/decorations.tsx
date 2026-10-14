/**
 * Ilustraciones botánicas de la plantilla Champagne Clásico.
 * Cada plantilla (Etapa 4) puede traer sus propias decoraciones.
 */

type DecorationProps = { className?: string };

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
    <svg viewBox="0 0 100 220" className={`inv-deco ${className ?? ""}`} aria-hidden fill="none">
      <g stroke="#a88e6c" strokeWidth="0.9" strokeLinecap="round">
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
              fill="#dcc7a2"
              stroke="#b09470"
              strokeWidth="0.25"
              transform={`rotate(${deg})`}
            />
          ))}
          <circle r={r * 0.34} fill="#a8865a" />
        </g>
      ))}
    </svg>
  );
}

/** Rama de hojas tipo eucalipto. */
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
    <svg viewBox="0 0 100 230" className={`inv-deco ${className ?? ""}`} aria-hidden fill="none">
      <path d="M50 228C52 160 48 90 50 20" stroke="#b7a587" strokeWidth="1.1" strokeLinecap="round" />
      {leaves.map(([x, y, deg], i) => (
        <ellipse
          key={i}
          cx={x}
          cy={y}
          rx="9"
          ry="17"
          fill={i % 3 === 0 ? "#d8ccb4" : "#e5dac6"}
          stroke="#b7a587"
          strokeWidth="0.6"
          transform={`rotate(${deg} ${x} ${y + 14}) translate(${deg > 0 ? 9 : -9} 0)`}
        />
      ))}
      <ellipse cx="50" cy="16" rx="7" ry="13" fill="#e5dac6" stroke="#b7a587" strokeWidth="0.6" />
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
