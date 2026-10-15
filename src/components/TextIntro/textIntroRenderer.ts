import { createRibbonWord } from "./ribbonGeometry";
import { normalizeEnglishText } from "./ribbonAlphabet";
/** Every English letter is assembled from independently shaded ribbon faces. */
export const INTRO_DURATION = 5000;
export const DEFAULT_FONT = '"Arial Black", Impact, "Noto Sans KR", sans-serif';
export interface TextSceneOptions {
  text: string;
  color: string;
  backgroundColor: string;
  fontFamily: string;
  fontWeight: number;
  reducedMotion: boolean;
}
interface Strip {
  x: number;
  width: number;
  top: number;
  bottom: number;
  seed: number;
}
export interface TextIntroScene {
  draw: (ctx: CanvasRenderingContext2D, progress: number) => void;
}
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const phase = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const smooth = (v: number) => v * v * (3 - 2 * v);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const random = (i: number) => {
  const n = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
};
const palette = [
  "#e50914",
  "#ff2929",
  "#ff663e",
  "#ffc27e",
  "#ffe2cb",
  "#f46aa1",
  "#b761de",
  "#5d64ed",
  "#2088ff",
  "#0bc2ef",
];

export function createTextIntroScene(
  width: number,
  height: number,
  options: TextSceneOptions,
): TextIntroScene {
  const text = normalizeEnglishText(options.text);
  const clear = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = options.backgroundColor;
    ctx.fillRect(0, 0, width, height);
  };
  if (!text) return { draw: clear };
  const word = createRibbonWord(text, options.color);
  const source = word.source;
  const ink = source.getContext("2d")!;
  const displayScale = Math.min(
    (width * 0.76) / word.naturalWidth,
    (height * 0.36) / word.naturalHeight,
  );
  const displayWidth = word.naturalWidth * displayScale;
  const displayHeight = word.naturalHeight * displayScale;
  const pixels = ink.getImageData(0, 0, source.width, source.height).data;
  const strips: Strip[] = [];
  const step = Math.max(1, Math.ceil(source.width / 180));
  for (let x = 0; x < source.width; x += step) {
    let top = source.height,
      bottom = -1;
    const end = Math.min(source.width, x + step);
    for (let y = 0; y < source.height; y++)
      for (let xx = x; xx < end; xx++) {
        if (pixels[(y * source.width + xx) * 4 + 3] > 24) {
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
          break;
        }
      }
    if (bottom >= top)
      strips.push({
        x,
        width: end - x,
        top,
        bottom: bottom + 1,
        seed: random(x),
      });
  }
  // Surfaces are solid and unstriped; only fold boundaries carry depth shadows.

  return {
    draw(ctx, progress) {
      clear(ctx);
      const p = Number.isFinite(progress) ? clamp(progress) : 0;
      if (p < 0.07 || p >= 1) return;
      ctx.save();
      if (options.reducedMotion) {
        ctx.globalAlpha =
          smooth(phase(p, 0.07, 0.23)) * (1 - smooth(phase(p, 0.78, 0.98)));
        ctx.drawImage(
          source,
          (width - displayWidth) / 2,
          (height - displayHeight) / 2,
          displayWidth,
          displayHeight,
        );
        ctx.restore();
        return;
      }
      const zoom = 1 + smooth(phase(p, 0.43, 0.64)) * 0.6;
      const dw = displayWidth * zoom,
        dh = displayHeight * zoom;
      const leftX = (width - dw) / 2,
        topY = (height - dh) / 2;
      // Draw the whole glyph texture once before decomposition. Rendering adjacent
      // cropped strips here would introduce sampling seams inside otherwise solid text.
      if (p <= 0.54) {
        // Unfold each independent face; keep its depth and overlap after completion.
        const drawn = phase(p, 0.14, 0.275);
        ctx.drawImage(
          drawn < 1 ? word.render(drawn) : source,
          leftX,
          topY,
          dw,
          dh,
        );
        ctx.restore();
        return;
      }
      const unravel = smooth(phase(p, 0.54, 0.73));
      const spread = smooth(phase(p, 0.7, 0.88));
      const fade = 1 - smooth(phase(p, 0.88, 0.995));
      for (let i = 0; i < strips.length; i++) {
        const strip = strips[i];
        const u = (strip.x + strip.width * 0.5) / source.width;
        const originalX = leftX + (strip.x / source.width) * dw;
        const originalY = topY + (strip.top / source.height) * dh;
        const originalH = ((strip.bottom - strip.top) / source.height) * dh;
        const originalW = (strip.width / source.width) * dw;
        const bundleX =
          width / 2 + (u - 0.5) * Math.min(width * 0.16, displayWidth * 0.5);
        const expandedX = width / 2 + (u - 0.5) * width * 1.7;
        const x = mix(originalX, mix(bundleX, expandedX, spread), unravel);
        const y = mix(originalY, -height * 0.15, unravel);
        const h = mix(originalH, height * 1.3, unravel);
        const w = mix(
          originalW,
          Math.max(0.6, (0.6 + strip.seed * 2) * Math.min(1.5, width / 960)),
          unravel,
        );
        const away = (random(i + 950) - 0.5) * width * phase(p, 0.88, 1) * 0.4;
        ctx.save();
        // Only the decomposition phase draws individual slices.
        ctx.globalAlpha = fade * (1 - smooth(phase(p, 0.57, 0.74)));
        ctx.drawImage(
          source,
          strip.x,
          strip.top,
          strip.width,
          strip.bottom - strip.top,
          x + away,
          y,
          Math.max(w, 0.5) + 0.2,
          h,
        );
        ctx.restore();
        const light = smooth(phase(p, 0.565, 0.745)) * fade;
        if (light > 0) {
          const color =
            palette[
              Math.min(palette.length - 1, Math.floor(u * palette.length))
            ];
          ctx.fillStyle = p < 0.66 ? options.color : color;
          ctx.globalAlpha = light * (0.35 + strip.seed * 0.65);
          ctx.fillRect(x + away, y, w, h);
          ctx.globalAlpha *= 0.12;
          ctx.fillRect(x + away - w * 2, y, w * 5, h);
          if (strip.seed > 0.83) {
            ctx.globalAlpha = light * 0.38;
            ctx.fillStyle = "#ffe6de";
            ctx.fillRect(x + away, y, Math.max(0.3, w * 0.25), h);
          }
        }
      }
      ctx.restore();
    },
  };
}
