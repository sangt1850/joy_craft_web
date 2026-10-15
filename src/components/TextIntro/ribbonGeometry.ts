import {
  RIBBON_ALPHABET,
  normalizeEnglishText,
  type Point,
  type RibbonFace,
} from "./ribbonAlphabet";
type P = [number, number];
interface FacePlan {
  points: P[];
  polygon?: P[];
  width: number;
  tone: number;
  layer: number;
  start: number;
  duration: number;
  length: number;
  closed: boolean;
  axis?: "up" | "down";
  startCap?: P[];
  endCap?: P[];
  shadow: boolean;
  yScale?: number;
  yOffset?: number;
}
interface GlyphPlan {
  faces: FacePlan[];
}
export interface RibbonWord {
  source: HTMLCanvasElement;
  naturalWidth: number;
  naturalHeight: number;
  render: (progress: number) => HTMLCanvasElement;
}
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const lengthOf = (points: P[]) =>
  points
    .slice(1)
    .reduce(
      (sum, p, i) => sum + Math.hypot(p[0] - points[i][0], p[1] - points[i][1]),
      0,
    );
function partial(points: P[], progress: number, length: number): P[] {
  if (progress >= 1) return points;
  const result: P[] = [points[0]];
  let remaining = length * progress;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1],
      b = points[i],
      len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len < 1e-8) continue;
    if (remaining >= len) {
      result.push(b);
      remaining -= len;
    } else {
      const t = remaining / len;
      result.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      break;
    }
  }
  return result;
}
const area = (points: P[]) =>
  points.reduce((sum, p, i) => {
    const q = points[(i + 1) % points.length];
    return sum + p[0] * q[1] - q[0] * p[1];
  }, 0);
const orient = (points: P[], outer = true): P[] =>
  area(points) > 0 === outer ? points : [...points].reverse();
function outline(points: P[], width: number, closed: boolean, startCap?: P[], endCap?: P[]): P[][] {
  const pts =
    closed &&
    points.length > 2 &&
    Math.hypot(
      points[0][0] - points.at(-1)![0],
      points[0][1] - points.at(-1)![1],
    ) < 1e-5
      ? points.slice(0, -1)
      : points;
  if (pts.length < 2) return [];
  const normals: P[] = [];
  const count = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < count; i++) {
    const a = pts[i],
      b = pts[(i + 1) % pts.length],
      dx = b[0] - a[0],
      dy = b[1] - a[1],
      len = Math.hypot(dx, dy) || 1;
    normals.push([-dy / len, dx / len]);
  }
  const left: P[] = [],
    right: P[] = [];
  for (let i = 0; i < pts.length; i++) {
    const before =
      normals[
        closed ? (i - 1 + normals.length) % normals.length : Math.max(0, i - 1)
      ];
    const after =
      normals[closed ? i % normals.length : Math.min(i, normals.length - 1)];
    let nx = before[0] + after[0],
      ny = before[1] + after[1],
      len = Math.hypot(nx, ny);
    if (len < 1e-5) {
      nx = after[0];
      ny = after[1];
      len = 1;
    }
    nx /= len;
    ny /= len;
    const reach = Math.min(
      width * 0.9,
      (width * 0.5) / Math.max(0.56, nx * after[0] + ny * after[1]),
    );
    left.push([pts[i][0] + nx * reach, pts[i][1] + ny * reach]);
    right.push([pts[i][0] - nx * reach, pts[i][1] - ny * reach]);
  }
  if (!closed) {
    // Adjacent faces use exactly the same two seam vertices, not separate butt caps.
    for (const [i,cap] of [[0,startCap],[pts.length-1,endCap]] as const) {
      if (!cap) continue;
      const near = Math.hypot(cap[0][0]-left[i][0],cap[0][1]-left[i][1]) < Math.hypot(cap[1][0]-left[i][0],cap[1][1]-left[i][1]);
      left[i]=cap[near?0:1];right[i]=cap[near?1:0];
    }
    return [orient([...left, ...right.reverse()])];
  }
  return Math.abs(area(left)) > Math.abs(area(right))
    ? [orient(left), orient(right, false)]
    : [orient(right), orient(left, false)];
}
function clipPolygon(points: P[], axis: "up" | "down", progress: number): P[] {
  const lo = Math.min(...points.map((p) => p[1])),
    hi = Math.max(...points.map((p) => p[1]));
  const edge =
    axis === "down" ? lo + (hi - lo) * progress : hi - (hi - lo) * progress;
  const inside = (p: P) => (axis === "down" ? p[1] <= edge : p[1] >= edge);
  const result: P[] = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[i],
      b = points[(i + 1) % points.length],
      ia = inside(a),
      ib = inside(b);
    if (ia) result.push(a);
    if (ia !== ib) {
      const t = (edge - a[1]) / (b[1] - a[1]);
      result.push([a[0] + (b[0] - a[0]) * t, edge]);
    }
  }
  return result;
}
const rawShape = (plan: FacePlan, progress: number): P[][] =>
  plan.polygon
    ? [
        orient(
          plan.axis && progress < 1
            ? clipPolygon(plan.polygon, plan.axis, progress)
            : plan.polygon,
        ),
      ]
    : outline(
        partial(plan.points, progress, plan.length),
        plan.width,
        plan.closed && progress >= 1,
        plan.startCap,
        progress >= 1 ? plan.endCap : undefined,
      );
// Apply one fixed transform per glyph at every animation frame.
const shape = (plan: FacePlan, progress: number): P[][] =>
 rawShape(plan, progress).map(contour=>contour.map(([x,y]):P=>[x,y*(plan.yScale??1)+(plan.yOffset??0)]));
function alignGlyph(faces: FacePlan[], letter: string) {
 const points=faces.flatMap(f=>rawShape(f,1).flat());
 const lo=Math.min(...points.map(p=>p[1])),hi=Math.max(...points.map(p=>p[1]));
 const lower=/[a-z]/.test(letter);
 const top=!lower||'bdfhkl'.includes(letter)?0:'ij'.includes(letter)?7:letter==='t'?12:36;
 const bottom=lower&&'gjpqy'.includes(letter)?128:100;
 const scale=(bottom-top)/Math.max(.001,hi-lo);
 for(const f of faces){f.yScale=scale;f.yOffset=top-lo*scale;}
}
function pathOf(contours: P[][]): Path2D {
  const path = new Path2D();
  for (const points of contours) {
    if (points.length < 3) continue;
    path.moveTo(...points[0]);
    for (const p of points.slice(1)) path.lineTo(...p);
    path.closePath();
  }
  return path;
}

/** Join matching stroke ends along a shared miter seam in physical coordinates. */
function joinFaces(faces: FacePlan[]) {
 const ends=faces.flatMap(f=>f.polygon||f.closed?[]:[{f,start:true,p:f.points[0],next:f.points[1]},{f,start:false,p:f.points.at(-1)!,next:f.points.at(-2)!}]);
 for(let i=0;i<ends.length;i++)for(let j=i+1;j<ends.length;j++){
  const a=ends[i],b=ends[j];if(a.f===b.f||Math.hypot(a.p[0]-b.p[0],a.p[1]-b.p[1])>.01)continue;
  const direction=(e:typeof a):P=>{const dx=e.next[0]-e.p[0],dy=e.next[1]-e.p[1],l=Math.hypot(dx,dy);return [dx/l,dy/l];};
  const u=direction(a),v=direction(b),cross=u[0]*v[1]-u[1]*v[0];if(Math.abs(cross)<.001)continue;
  const cap:P[]=[];
  for(const sign of [-1,1]){
   const p:P=[a.p[0]-u[1]*a.f.width*.5*sign,a.p[1]+u[0]*a.f.width*.5*sign];
   const q:P=[b.p[0]+v[1]*b.f.width*.5*sign,b.p[1]-v[0]*b.f.width*.5*sign];
   const t=((q[0]-p[0])*v[1]-(q[1]-p[1])*v[0])/cross;
   cap.push([p[0]+t*u[0],p[1]+t*u[1]]);
  }
  if(cap.some(p=>Math.hypot(p[0]-a.p[0],p[1]-a.p[1])>Math.max(a.f.width,b.f.width)*3))continue;
  if(a.start)a.f.startCap=cap;else a.f.endCap=cap;
  if(b.start)b.f.startCap=cap;else b.f.endCap=cap;
 }
}

/** Layout and paint the independent faces. No font raster masks or per-pixel reveal tables. */
export function createRibbonWord(text: string, color: string): RibbonWord {
  const cleaned = normalizeEnglishText(text);
  const glyphs: GlyphPlan[] = [];
  let cursor = 0;
  for (const letter of cleaned) {
    if (letter === " ") {
      cursor += 36;
      continue;
    }
    const definition = RIBBON_ALPHABET[letter];
    if (!definition) continue;
    const convert = (p: Point): P => [
      cursor + p[0] * definition.width * 100,
      p[1] * 100,
    ];
    const faces: FacePlan[] = definition.faces.map((f: RibbonFace) => {
      const points = f.points.map(convert);
      return {
        points,
        polygon: f.polygon?.map(convert),
        width: f.thickness ?? 14,
        tone: /[a-z]/.test(letter) ? 1 : f.tone,
        shadow: /[A-Z]/.test(letter) && definition.faces.length > 1,
        layer: f.layer,
        start: 0,
        duration: 0,
        length: lengthOf(points),
        closed: !!f.closed,
        axis: f.revealAxis,
      };
    });
    joinFaces(faces);
    alignGlyph(faces,letter);
    const total = faces.reduce((sum, f) => sum + f.length, 0);
    let start = 0;
    for (const f of faces) {
      f.start = start;
      f.duration = f.length / total;
      start += f.duration;
    }
    glyphs.push({ faces });
    cursor += definition.width * 100 + 18;
  }
  const all = glyphs.flatMap((g) => g.faces.flatMap((f) => shape(f, 1).flat()));
  const minX = all.length ? Math.min(...all.map((p) => p[0])) : 0,
    maxX = all.length ? Math.max(...all.map((p) => p[0])) : 1;
  const minY = 0,
    maxY = /[gjpqy]/.test(cleaned) ? 128 : 100;
  const naturalWidth = maxX - minX,
    naturalHeight = maxY - minY;
  const scale = Math.min(
    6,
    1400 / Math.max(1, naturalWidth),
    600 / Math.max(1, naturalHeight),
  );
  const source = document.createElement("canvas");
  source.width = Math.ceil(naturalWidth * scale) + 6;
  source.height = Math.ceil(naturalHeight * scale) + 6;
  const frame = document.createElement("canvas");
  frame.width = source.width;
  frame.height = source.height;
  const ctx = frame.getContext("2d")!;
  const probe = document.createElement("canvas");
  probe.width = probe.height = 1;
  const pc = probe.getContext("2d")!;
  pc.fillStyle = "#e50914";
  pc.fillStyle = color;
  pc.fillRect(0, 0, 1, 1);
  const rgb = pc.getImageData(0, 0, 1, 1).data;
  const tones = new Map<number, string>();
  for (const glyph of glyphs)
    for (const f of glyph.faces)
      tones.set(
        f.tone,
        `rgb(${Math.round(rgb[0] * f.tone)},${Math.round(rgb[1] * f.tone)},${Math.round(rgb[2] * f.tone)})`,
      );
  const duration = glyphs.length === 1 ? 1 : 0.66;
  const stagger = glyphs.length < 2 ? 0 : (1 - duration) / (glyphs.length - 1);
  const render = (progress: number): HTMLCanvasElement => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, frame.width, frame.height);
    ctx.setTransform(scale, 0, 0, scale, 3 - minX * scale, 3 - minY * scale);
    glyphs.forEach((glyph, i) => {
      const glyphProgress = clamp((progress - i * stagger) / duration);
      const painted = new Path2D();
      let hasPaint = false;
      const faces = glyph.faces
        .map((f) => ({ f, p: clamp((glyphProgress - f.start) / f.duration) }))
        .sort((a, b) => a.f.layer - b.f.layer);
      for (const { f, p } of faces) {
        if (p <= 0.00001) continue;
        const current = pathOf(shape(f, p));
        const fill = tones.get(f.tone)!;
        if (hasPaint && f.shadow) {
          // Cast the front face's shadow only onto already visible rear faces.
          ctx.save();
          ctx.clip(painted);
          ctx.shadowColor = "rgba(0,0,0,.62)";
          ctx.shadowBlur = 3.3 * scale;
          ctx.shadowOffsetX = 1.1 * scale;
          ctx.shadowOffsetY = 1.6 * scale;
          ctx.fillStyle = fill;
          ctx.fill(current);
          ctx.restore();
        }
        ctx.fillStyle = fill;
        ctx.fill(current);
        painted.addPath(current);
        hasPaint = true;
      }
    });
    return frame;
  };
  source.getContext("2d")!.drawImage(render(1), 0, 0);
  return { source, naturalWidth, naturalHeight, render };
}
