import { useEffect, useRef, type CSSProperties } from "react";
import {
  createTextIntroScene,
  DEFAULT_FONT,
  INTRO_DURATION,
  type TextIntroScene,
} from "./textIntroRenderer";
export interface TextIntroProps {
  /** English A-Z / a-z and spaces. Other characters are excluded. */
  text?: string;
  /** @deprecated Ribbon geometry is predefined; retained for source compatibility. */
  fontFamily?: string;
  /** @deprecated Ribbon geometry is predefined; retained for source compatibility. */
  fontWeight?: number;
  durationMs?: number;
  color?: string;
  backgroundColor?: string;
  replayKey?: string | number;
  onFinished?: () => void;
  reducedMotion?: boolean;
  /** Controlled 0..1 frame position. Disables automatic playback and onFinished. */
  progress?: number;
  className?: string;
  style?: CSSProperties;
}
export default function TextIntro({
  text = "N",
  fontFamily = DEFAULT_FONT,
  fontWeight = 900,
  durationMs = INTRO_DURATION,
  color = "#e50914",
  backgroundColor = "#000000",
  replayKey = 0,
  onFinished,
  reducedMotion = false,
  progress,
  className,
  style,
}: TextIntroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const callbackRef = useRef(onFinished);
  callbackRef.current = onFinished;
  const configRef = useRef({
    text,
    fontFamily,
    fontWeight,
    color,
    backgroundColor,
    reducedMotion,
  });
  configRef.current = {
    text,
    fontFamily,
    fontWeight,
    color,
    backgroundColor,
    reducedMotion,
  };
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const refreshRef = useRef<((rebuild?: boolean) => void) | null>(null);
  const controlled = progress !== undefined;
  useEffect(() => {
    refreshRef.current?.(true);
  }, [color, backgroundColor, reducedMotion]);
  useEffect(() => {
    if (progress !== undefined) refreshRef.current?.();
  }, [progress]);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let width = 0,
      height = 0,
      raf = 0,
      fallbackTimer = 0,
      startedAt = performance.now(),
      elapsed = 0,
      done = false,
      cancelled = false;
    let scene: TextIntroScene | null = null;
    const duration = Number.isFinite(durationMs)
      ? Math.max(500, durationMs)
      : INTRO_DURATION;
    const draw = (rebuild = false) => {
      if (!width || !height) return;
      if (rebuild || !scene)
        scene = createTextIntroScene(width, height, configRef.current);
      scene.draw(
        ctx,
        progressRef.current === undefined
          ? Math.min(1, elapsed / duration)
          : progressRef.current,
      );
    };
    refreshRef.current = draw;
    const resize = (nextWidth: number, nextHeight: number) => {
      width = nextWidth;
      height = nextHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(true);
    };
    const initialRect = canvas.getBoundingClientRect();
    resize(initialRect.width, initialRect.height);
    const observer = new ResizeObserver(([entry]) => {
      resize(entry.contentRect.width, entry.contentRect.height);
    });
    observer.observe(canvas);
    const finish = () => {
      if (done || cancelled || controlled) return;
      done = true;
      callbackRef.current?.();
    };
    const tick = (now: number) => {
      if (cancelled) return;
      elapsed = Math.max(0, now - startedAt);
      draw();
      if (elapsed < duration) raf = requestAnimationFrame(tick);
      else finish();
    };
    const start = () => {
      if (cancelled) return;
      startedAt = performance.now();
      draw(true);
      if (!controlled) {
        raf = requestAnimationFrame(tick);
        // requestAnimationFrame can be suspended in hidden tabs and embedded previews.
        // The stage must still leave the intro after its configured duration.
        fallbackTimer = window.setTimeout(finish, duration + 100);
      }
    };
    // Ribbon geometry has no font-loading dependency.
    start();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(fallbackTimer);
      observer.disconnect();
      refreshRef.current = null;
      scene = null;
    };
  }, [text, fontFamily, fontWeight, durationMs, replayKey, controlled]);
  return (
    <canvas
      ref={canvasRef}
      className={className}
      role="img"
      aria-label={`${text} 텍스트 인트로 애니메이션`}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        background: backgroundColor,
        ...style,
      }}
    />
  );
}
