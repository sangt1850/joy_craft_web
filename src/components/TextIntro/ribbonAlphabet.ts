/** Independent ribbon faces. Coordinates are relative to each glyph's width and cap height. */
export type Point = readonly [number, number];
export interface RibbonFace {
  points: readonly Point[];
  tone: number;
  layer: number;
  thickness?: number;
  closed?: boolean;
  polygon?: readonly Point[];
  revealAxis?: "up" | "down";
}
export interface RibbonGlyph {
  width: number;
  faces: readonly RibbonFace[];
}
const face = (
  points: readonly Point[],
  tone = 1,
  layer = 0,
  extras: Partial<RibbonFace> = {},
): RibbonFace => ({ points, tone, layer, ...extras });
const glyph = (width: number, ...faces: RibbonFace[]): RibbonGlyph => ({
  width,
  faces,
});
const arc = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  from: number,
  to: number,
): Point[] =>
  Array.from({ length: 57 }, (_, i) => {
    const a = ((from + ((to - from) * i) / 56) * Math.PI) / 180;
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
  });
const bezier = (a: Point, b: Point, c: Point, d: Point): Point[] =>
  Array.from({ length: 25 }, (_, i) => {
    const t = i / 24,
      u = 1 - t;
    return [
      u * u * u * a[0] +
        3 * u * u * t * b[0] +
        3 * u * t * t * c[0] +
        t * t * t * d[0],
      u * u * u * a[1] +
        3 * u * u * t * b[1] +
        3 * u * t * t * c[1] +
        t * t * t * d[1],
    ];
  });
const oval = (top = 0, bottom = 1) =>
  face(arc(0.5, (top + bottom) / 2, 0.38, (bottom - top) / 2, -90, 270), 1, 0, {
    closed: true,
  });
const bowl = (top: number, bottom: number, tone = 1, layer = 1) =>
  face(
    [
      [0.13, top],
      ...bezier([0.13, top], [1.16, top], [1.16, bottom], [0.13, bottom]).slice(
        1,
      ),
    ],
    tone,
    layer,
  );
const sCurve = (top = 0, bottom = 1): Point[] => {
  const raw = [
    ...bezier([0.86, 0.09], [0.1, -0.19], [-0.1, 0.36], [0.49, 0.49]),
    ...bezier([0.49, 0.49], [1.13, 0.63], [0.87, 1.19], [0.12, 0.88]).slice(1),
  ];
  return raw.map(([x, y]) => [x, top + y * (bottom - top)]);
};
const lowerOval = () => oval(0.36, 1);
export const RIBBON_ALPHABET: Record<string, RibbonGlyph> = {
  A: glyph(
    0.68,
    face(
      [
        [0.06, 1],
        [0.5, 0],
      ],
      0.69,
      0,
    ),
    face(
      [
        [0.5, 0],
        [0.94, 1],
      ],
      1,
      2,
    ),
    face(
      [
        [0.24, 0.64],
        [0.76, 0.64],
      ],
      0.9,
      1,
    ),
  ),
  B: glyph(
    0.62,
    face(
      [
        [0.13, 1],
        [0.13, 0],
      ],
      0.66,
      0,
    ),
    bowl(0, 0.49, 1, 2),
    bowl(0.49, 1, 0.86, 1),
  ),
  C: glyph(0.66, face(arc(0.5, 0.5, 0.39, 0.5, -42, -318))),
  D: glyph(
    0.65,
    face(
      [
        [0.13, 1],
        [0.13, 0],
      ],
      0.65,
      0,
    ),
    bowl(0, 1, 1, 1),
  ),
  E: glyph(
    0.54,
    face(
      [
        [0.13, 1],
        [0.13, 0],
      ],
      0.65,
      0,
    ),
    face(
      [
        [0.13, 0],
        [1, 0],
      ],
      1,
      1,
    ),
    face(
      [
        [0.13, 0.49],
        [0.87, 0.49],
      ],
      0.93,
      2,
    ),
    face(
      [
        [0.13, 1],
        [1, 1],
      ],
      1,
      3,
    ),
  ),
  F: glyph(
    0.53,
    face(
      [
        [0.13, 1],
        [0.13, 0],
      ],
      0.65,
      0,
    ),
    face(
      [
        [0.13, 0],
        [1, 0],
      ],
      1,
      1,
    ),
    face(
      [
        [0.13, 0.48],
        [0.88, 0.48],
      ],
      0.95,
      2,
    ),
  ),
  G: glyph(
    0.68,
    face(arc(0.5, 0.5, 0.39, 0.5, -42, -318), 1, 1),
    face(
      [
        [0.5 + 0.39 * Math.cos(42 * Math.PI / 180), 0.5 + 0.5 * Math.sin(42 * Math.PI / 180)],
        [0.5 + 0.39 * Math.cos(42 * Math.PI / 180), 0.52],
      ],
      0.65,
      0,
    ),
    face(
      [
        [0.5 + 0.39 * Math.cos(42 * Math.PI / 180), 0.52],
        [0.55, 0.52],
      ],
      0.92,
      2,
    ),
  ),
  H: glyph(
    0.65,
    face(
      [
        [0.11, 1],
        [0.11, 0],
      ],
      0.66,
      0,
    ),
    face(
      [
        [0.11, 0.5],
        [0.89, 0.5],
      ],
      1,
      2,
    ),
    face(
      [
        [0.89, 1],
        [0.89, 0],
      ],
      0.66,
      1,
    ),
  ),
  I: glyph(
    0.28,
    face([
      [0.5, 1],
      [0.5, 0],
    ]),
  ),
  J: glyph(
    0.53,
    face([
      ...bezier([0.85, 0], [0.85, 0.15], [0.85, 0.55], [0.85, 0.73]),
      ...bezier([0.85, 0.73], [0.85, 1.12], [0.2, 1.13], [0.06, 0.83]).slice(1),
    ]),
  ),
  K: glyph(
    0.63,
    face(
      [
        [0.12, 1],
        [0.12, 0],
      ],
      0.64,
      0,
    ),
    face(
      [
        [0.15, 0.56],
        [0.94, 0],
      ],
      1,
      2,
    ),
    face(
      [
        [0.47, 0.4],
        [0.98, 1],
      ],
      0.83,
      1,
    ),
  ),
  L: glyph(
    0.52,
    face(
      [
        [0.13, 0],
        [0.13, 1],
      ],
      0.65,
      0,
    ),
    face(
      [
        [0.13, 1],
        [1, 1],
      ],
      1,
      1,
    ),
  ),
  M: glyph(
    0.82,
    face(
      [
        [0.09, 1],
        [0.09, 0],
      ],
      0.64,
      0,
    ),
    face(
      [
        [0.09, 0],
        [0.5, 0.65],
      ],
      1,
      3,
    ),
    face(
      [
        [0.5, 0.65],
        [0.91, 0],
      ],
      0.76,
      2,
    ),
    face(
      [
        [0.91, 0],
        [0.91, 1],
      ],
      0.62,
      1,
    ),
  ),
  // Three distinct planes, not a single path. The diagonal stays IN FRONT of both stems.
  N: glyph(
    0.56,
    face(
      [
        [0.16, 1],
        [0.16, 0],
      ],
      0.64,
      0,
      {
        polygon: [
          [0, 0],
          [0.32, 0],
          [0.32, 0.98],
          [0, 1],
        ],
        revealAxis: "up",
      },
    ),
    face(
      [
        [0.16, 0],
        [0.84, 1],
      ],
      1,
      2,
      {
        polygon: [
          [0, 0],
          [0.32, 0],
          [1, 1],
          [0.68, 0.98],
        ],
        revealAxis: "down",
      },
    ),
    face(
      [
        [0.84, 1],
        [0.84, 0],
      ],
      0.64,
      1,
      {
        polygon: [
          [0.68, 0],
          [1, 0],
          [1, 1],
          [0.68, 0.98],
        ],
        revealAxis: "up",
      },
    ),
  ),
  O: glyph(0.69, oval()),
  P: glyph(
    0.61,
    face(
      [
        [0.13, 1],
        [0.13, 0],
      ],
      0.64,
      0,
    ),
    bowl(0, 0.52, 1, 1),
  ),
  Q: glyph(
    0.7,
    oval(),
    face(
      [
        [0.57, 0.74],
        [1.01, 1.09],
      ],
      0.88,
      1,
    ),
  ),
  R: glyph(
    0.65,
    face(
      [
        [0.13, 1],
        [0.13, 0],
      ],
      0.64,
      0,
    ),
    bowl(0, 0.51, 1, 2),
    face(
      [
        [0.46, 0.51],
        [0.98, 1],
      ],
      0.78,
      1,
    ),
  ),
  S: glyph(0.62, face(sCurve())),
  T: glyph(
    0.64,
    face(
      [
        [0, 0],
        [1, 0],
      ],
      1,
      1,
    ),
    face(
      [
        [0.5, 0],
        [0.5, 1],
      ],
      0.65,
      0,
    ),
  ),
  U: glyph(
    0.65,
    face([
      [0.1, 0],
      [0.1, 0.69],
      ...bezier([0.1, 0.69], [0.1, 1.12], [0.9, 1.12], [0.9, 0.69]).slice(1),
      [0.9, 0],
    ]),
  ),
  V: glyph(
    0.66,
    face(
      [
        [0.06, 0],
        [0.5, 1],
      ],
      1,
      1,
    ),
    face(
      [
        [0.5, 1],
        [0.94, 0],
      ],
      0.66,
      0,
    ),
  ),
  W: glyph(
    0.91,
    face(
      [
        [0.06, 0],
        [0.27, 1],
      ],
      0.68,
      0,
    ),
    face(
      [
        [0.27, 1],
        [0.5, 0.11],
      ],
      1,
      3,
    ),
    face(
      [
        [0.5, 0.11],
        [0.73, 1],
      ],
      0.67,
      1,
    ),
    face(
      [
        [0.73, 1],
        [0.94, 0],
      ],
      1,
      2,
    ),
  ),
  X: glyph(
    0.65,
    face(
      [
        [0.05, 0],
        [0.95, 1],
      ],
      1,
      1,
    ),
    face(
      [
        [0.95, 0],
        [0.05, 1],
      ],
      0.65,
      0,
    ),
  ),
  Y: glyph(
    0.65,
    face(
      [
        [0.04, 0],
        [0.5, 0.51],
      ],
      1,
      2,
    ),
    face(
      [
        [0.5, 0.51],
        [0.96, 0],
      ],
      0.67,
      1,
    ),
    face(
      [
        [0.5, 0.51],
        [0.5, 1],
      ],
      0.75,
      0,
    ),
  ),
  Z: glyph(
    0.6,
    face(
      [
        [0, 0],
        [1, 0],
      ],
      0.66,
      0,
    ),
    face(
      [
        [1, 0],
        [0, 1],
      ],
      1,
      2,
    ),
    face(
      [
        [0, 1],
        [1, 1],
      ],
      0.68,
      1,
    ),
  ),
  a: glyph(
    0.54,
    lowerOval(),
    face(
      [
        [0.9, 0.36],
        [0.9, 1],
      ],
      0.72,
      1,
    ),
  ),
  b: glyph(
    0.55,
    face(
      [
        [0.12, 0],
        [0.12, 1],
      ],
      0.66,
      0,
    ),
    face(arc(0.5, 0.68, 0.38, 0.32, -180, 180), 1, 1, { closed: true }),
  ),
  c: glyph(0.51, face(arc(0.5, 0.68, 0.38, 0.32, -42, -318))),
  d: glyph(
    0.55,
    lowerOval(),
    face(
      [
        [0.88, 0],
        [0.88, 1],
      ],
      0.7,
      1,
    ),
  ),
  e: glyph(
    0.54,
    face(
      [
        [0.11, 0.68],
        [0.89, 0.68],
      ],
      0.76,
      0,
    ),
    face(arc(0.5, 0.68, 0.38, 0.32, 0, -318), 1, 1),
  ),
  f: glyph(
    0.38,
    face(
      [
        ...bezier([0.96, 0.02], [0.36, -0.06], [0.35, 0.08], [0.35, 0.3]),
        [0.35, 1],
      ],
      0.77,
      0,
    ),
    face(
      [
        [0.02, 0.38],
        [0.96, 0.38],
      ],
      1,
      1,
    ),
  ),
  g: glyph(
    0.55,
    lowerOval(),
    face(
      [
        [0.9, 0.36],
        [0.9, 1],
        ...bezier([0.9, 1], [0.9, 1.29], [0.4, 1.33], [0.12, 1.17]).slice(1),
      ],
      0.74,
      1,
    ),
  ),
  h: glyph(
    0.54,
    face(
      [
        [0.12, 0],
        [0.12, 1],
      ],
      0.66,
      0,
    ),
    face(
      [
        [0.12, 0.63],
        ...bezier([0.12, 0.63], [0.15, 0.27], [0.89, 0.26], [0.89, 0.61]).slice(
          1,
        ),
        [0.89, 1],
      ],
      1,
      1,
    ),
  ),
  i: glyph(
    0.22,
    face(
      [
        [0.5, 0.07],
        [0.5, 0.19],
      ],
      1,
      1,
      { thickness: 14 },
    ),
    face(
      [
        [0.5, 0.36],
        [0.5, 1],
      ],
      0.85,
      0,
      { thickness: 14 },
    ),
  ),
  j: glyph(
    0.27,
    face(
      [
        [0.76, 0.07],
        [0.76, 0.19],
      ],
      1,
      1,
      { thickness: 14 },
    ),
    face(
      [
        [0.76, 0.36],
        [0.76, 1.09],
        ...bezier([0.76, 1.09], [0.76, 1.29], [0.12, 1.29], [0, 1.23]).slice(1),
      ],
      0.86,
      0,
    ),
  ),
  k: glyph(
    0.51,
    face(
      [
        [0.12, 0],
        [0.12, 1],
      ],
      0.65,
      0,
    ),
    face(
      [
        [0.14, 0.75],
        [0.96, 0.36],
      ],
      1,
      2,
    ),
    face(
      [
        [0.48, 0.59],
        [0.98, 1],
      ],
      0.8,
      1,
    ),
  ),
  l: glyph(
    0.24,
    face([
      [0.5, 0],
      [0.5, 1],
    ]),
  ),
  m: glyph(
    0.86,
    face(
      [
        [0.08, 0.36],
        [0.08, 1],
      ],
      0.65,
      0,
    ),
    face(
      [
        [0.08, 0.6],
        ...bezier([0.08, 0.6], [0.08, 0.26], [0.49, 0.26], [0.49, 0.6]).slice(
          1,
        ),
        [0.49, 1],
      ],
      1,
      2,
    ),
    face(
      [
        [0.49, 0.6],
        ...bezier([0.49, 0.6], [0.49, 0.26], [0.91, 0.26], [0.91, 0.6]).slice(
          1,
        ),
        [0.91, 1],
      ],
      0.79,
      1,
    ),
  ),
  n: glyph(
    0.55,
    face(
      [
        [0.12, 0.36],
        [0.12, 1],
      ],
      0.65,
      0,
    ),
    face(
      [
        [0.12, 0.6],
        ...bezier([0.12, 0.6], [0.12, 0.26], [0.89, 0.26], [0.89, 0.6]).slice(
          1,
        ),
        [0.89, 1],
      ],
      1,
      1,
    ),
  ),
  o: glyph(0.55, lowerOval()),
  p: glyph(
    0.55,
    face(
      [
        [0.12, 1.28],
        [0.12, 0.36],
      ],
      0.65,
      0,
    ),
    face(arc(0.5, 0.68, 0.38, 0.32, -180, 180), 1, 1, { closed: true }),
  ),
  q: glyph(
    0.55,
    lowerOval(),
    face(
      [
        [0.88, 0.36],
        [0.88, 1.28],
      ],
      0.7,
      1,
    ),
  ),
  r: glyph(
    0.4,
    face(
      [
        [0.16, 0.36],
        [0.16, 1],
      ],
      0.65,
      0,
    ),
    face(
      [
        [0.16, 0.61],
        ...bezier([0.16, 0.61], [0.2, 0.37], [0.54, 0.28], [0.99, 0.4]).slice(
          1,
        ),
      ],
      1,
      1,
    ),
  ),
  s: glyph(0.49, face(sCurve(0.36, 1))),
  t: glyph(
    0.37,
    face(
      [
        [0.42, 0.12],
        [0.42, 0.82],
        ...bezier([0.42, 0.82], [0.42, 1.02], [0.7, 1.05], [1, 0.97]).slice(1),
      ],
      0.74,
      0,
    ),
    face(
      [
        [0.02, 0.39],
        [0.95, 0.39],
      ],
      1,
      1,
    ),
  ),
  u: glyph(
    0.55,
    face(
      [
        [0.11, 0.36],
        [0.11, 0.77],
        ...bezier([0.11, 0.77], [0.11, 1.13], [0.89, 1.05], [0.89, 0.76]).slice(
          1,
        ),
      ],
      1,
      0,
    ),
    face(
      [
        [0.89, 0.36],
        [0.89, 1],
      ],
      0.7,
      1,
    ),
  ),
  v: glyph(
    0.52,
    face(
      [
        [0.06, 0.36],
        [0.5, 1],
      ],
      1,
      1,
    ),
    face(
      [
        [0.5, 1],
        [0.94, 0.36],
      ],
      0.67,
      0,
    ),
  ),
  w: glyph(
    0.76,
    face(
      [
        [0.06, 0.36],
        [0.27, 1],
      ],
      0.68,
      0,
    ),
    face(
      [
        [0.27, 1],
        [0.5, 0.43],
      ],
      1,
      3,
    ),
    face(
      [
        [0.5, 0.43],
        [0.73, 1],
      ],
      0.67,
      1,
    ),
    face(
      [
        [0.73, 1],
        [0.94, 0.36],
      ],
      1,
      2,
    ),
  ),
  x: glyph(
    0.51,
    face(
      [
        [0.07, 0.36],
        [0.93, 1],
      ],
      1,
      1,
    ),
    face(
      [
        [0.93, 0.36],
        [0.07, 1],
      ],
      0.66,
      0,
    ),
  ),
  y: glyph(
    0.52,
    face(
      [
        [0.06, 0.36],
        [0.51, 1],
      ],
      1,
      1,
    ),
    face(
      [
        [0.94, 0.36],
        [0.51, 1],
        [0.25, 1.28],
      ],
      0.68,
      0,
    ),
  ),
  z: glyph(
    0.47,
    face(
      [
        [0.02, 0.36],
        [0.98, 0.36],
      ],
      0.66,
      0,
    ),
    face(
      [
        [0.98, 0.36],
        [0.02, 1],
      ],
      1,
      2,
    ),
    face(
      [
        [0.02, 1],
        [0.98, 1],
      ],
      0.69,
      1,
    ),
  ),
};
// Flat lowercase; multi-face capitals retain independent depths and clear rear-plane tones.
for (const [letter, definition] of Object.entries(RIBBON_ALPHABET)) {
  RIBBON_ALPHABET[letter] = {...definition, faces: definition.faces.map(f => ({...f,
    tone: /[a-z]/.test(letter) ? 1 : definition.faces.length > 1 && f.tone < 1 ? Math.max(.54, f.tone * .88) : f.tone,
  }))};
}
export const normalizeEnglishText = (text: string): string =>
  text
    .replace(/[^A-Za-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
