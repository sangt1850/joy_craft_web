import { useState, useRef, useEffect, useCallback } from "react";
import type { SlideProps } from "../SlideProps";
import { useVibrate } from "../useVibrate";
import { useSlideTimeout } from "../useSlideTimeout";

interface ScratchData {
  prizeEmoji: string;
  prizeText: string;
  prompt: string;
  backgroundColor: string;
  accentColor: string;
}

export default function ScratchLottery({ data, onComplete, isPreview }: SlideProps<ScratchData>) {
  const { prizeEmoji, prizeText, prompt, backgroundColor, accentColor } = data;
  const vibe = useVibrate();
  const later = useSlideTimeout();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawingRef = useRef(false);
  const doneRef = useRef(false);

  const [revealed, setRevealed] = useState(false);
  const [ratio, setRatio] = useState(0);
  const [showHint, setShowHint] = useState(true);

  const initCanvas = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const parent = c.parentElement;
    if (!parent) return;
    const w = parent.clientWidth, h = parent.clientHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = w * dpr; c.height = h * dpr;
    c.style.width = w + "px"; c.style.height = h + "px";
    const ctx = c.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#cfd3da"); g.addColorStop(0.5, "#aab0b8"); g.addColorStop(1, "#c6cad2");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(255,255,255,.35)";
    for (let i = -h; i < w; i += 26) { ctx.fillRect(i, 0, 8, h); }
    ctx.fillStyle = "#7c828c"; ctx.textAlign = "center";
    ctx.font = "700 30px Pretendard"; ctx.fillText("🪙", w / 2, h / 2 - 6);
    ctx.font = "600 15px Pretendard"; ctx.fillText("여기를 긁어보세요", w / 2, h / 2 + 30);
    ctx.globalCompositeOperation = "destination-out";
    ctxRef.current = ctx;
    doneRef.current = false;
  }, []);

  useEffect(() => {
    const timer = setTimeout(initCanvas, 50);
    return () => clearTimeout(timer);
  }, [initCanvas]);

  const getPos = (e: React.PointerEvent, c: HTMLCanvasElement) => {
    const r = c.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const scratch = useCallback((e: React.PointerEvent) => {
    const ctx = ctxRef.current, c = canvasRef.current;
    if (!ctx || !c || doneRef.current) return;
    const { x, y } = getPos(e, c);
    ctx.beginPath(); ctx.arc(x, y, 24, 0, Math.PI * 2); ctx.fill();
    setShowHint(false);
    // check ratio
    const img = ctx.getImageData(0, 0, c.width, c.height).data;
    let clear = 0; const N = 22, cw = c.width, ch = c.height;
    for (let gx = 0; gx < N; gx++) for (let gy = 0; gy < N; gy++) {
      const px = Math.floor((gx + 0.5) / N * cw), py = Math.floor((gy + 0.5) / N * ch);
      if (img[(py * cw + px) * 4 + 3] < 128) clear++;
    }
    const r = clear / (N * N);
    setRatio(r);
    if (r > 0.55 && !doneRef.current) {
      doneRef.current = true;
      vibe([12, 40, 80]);
      setRevealed(true);
      if (!isPreview) later(() => onComplete?.(), 1500);
    }
  }, [vibe, isPreview, onComplete, later]);

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", background: `linear-gradient(165deg,${backgroundColor},#3d2c52)`, padding: "60px 26px 34px" }}>
      <p style={{ fontSize: 19, fontWeight: 700, color: "#fff", textAlign: "center", margin: "0 0 6px" }}>🎫 오늘의 행운 복권</p>
      <p style={{ fontSize: 13, color: accentColor, margin: "0 0 26px" }}>{prompt}</p>

      <div style={{ position: "relative", width: 300, height: 360, borderRadius: 22, overflow: "hidden", boxShadow: "0 14px 34px rgba(0,0,0,.3)" }}>
        {/* 상품 내용 (아래) */}
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, background: "linear-gradient(150deg,#fff3d6,#ffe0e6)", padding: 26, textAlign: "center" }}>
          <div style={{ fontSize: 64 }}>{prizeEmoji}</div>
          <p style={{ fontSize: 24, fontWeight: 900, color: "#E94F6A", lineHeight: 1.35, margin: 0, whiteSpace: "pre-line" }}>{prizeText}</p>
        </div>
        {/* 긁기 canvas */}
        <canvas
          ref={canvasRef}
          onPointerDown={(e) => { drawingRef.current = true; try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} scratch(e); }}
          onPointerMove={(e) => { if (drawingRef.current) scratch(e); }}
          onPointerUp={() => { drawingRef.current = false; }}
          onPointerLeave={() => { drawingRef.current = false; }}
          style={{ position: "absolute", inset: 0, touchAction: "none", cursor: "grab", opacity: revealed ? 0 : 1, pointerEvents: revealed ? "none" : "auto", transition: "opacity .55s ease" }}
        />
        {/* 힌트 */}
        {showHint && !revealed && (
          <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", fontSize: 30, animation: "jc-hintwiggle 1.3s ease-in-out infinite", pointerEvents: "none" }}>👆</div>
        )}
      </div>

      <p style={{ fontSize: 13, color: revealed ? "#FFD97D" : accentColor, margin: "22px 0 0", fontWeight: 600, minHeight: 20 }}>
        {revealed ? "🎉 당첨을 확인했어요!" : ratio > 0 ? `${Math.round(ratio * 100)}% 긁는 중...` : "긁어서 복권을 확인하세요"}
      </p>
    </div>
  );
}
