import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import type { SlideProps } from "../SlideProps";
import { useVibrate } from "../useVibrate";
import { useSlideComplete } from "../useSlideComplete";

interface Slice { label: string; detail: string; weight: number; color: string; }

interface RouletteData {
  title: string;
  slices: string | Slice[];
  backgroundColor: string;
  accentColor: string;
}

function lum(hex: string) {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function pt(deg: number, r: number): [number, number] {
  const rad = deg * Math.PI / 180;
  return [+(r * Math.sin(rad)).toFixed(2), +(-r * Math.cos(rad)).toFixed(2)];
}

export default function Roulette({ data, onComplete, isPreview }: SlideProps<RouletteData>) {
  const { title, backgroundColor, accentColor } = data;
  const vibe = useVibrate();
  const complete = useSlideComplete(onComplete, isPreview);
  const spinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
  }, []);

  const slices = useMemo<Slice[]>(() => {
    if (Array.isArray(data.slices)) return data.slices;
    try { return JSON.parse(data.slices as string); } catch { return []; }
  }, [data.slices]);

  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);

  const wheelSlices = useMemo(() => {
    const n = slices.length;
    if (!n) return [];
    const seg = 360 / n;
    return slices.map((s, i) => {
      const a0 = i * seg, a1 = (i + 1) * seg, mid = a0 + seg / 2;
      const [x0, y0] = pt(a0, 100), [x1, y1] = pt(a1, 100), [lx, ly] = pt(mid, 62);
      let rot = mid; if (mid > 90 && mid < 270) rot += 180;
      return { ...s, path: `M0 0 L${x0} ${y0} A100 100 0 0 1 ${x1} ${y1} Z`, lx, ly, rot, textColor: lum(s.color) > 0.62 ? "#1A1A1A" : "#FDF2E9" };
    });
  }, [slices]);

  const spin = useCallback(() => {
    if (spinning || result !== null || !slices.length) return;
    const total = slices.reduce((a, x) => a + (x.weight || 1), 0);
    let r = Math.random() * total, idx = 0;
    for (let i = 0; i < slices.length; i++) { r -= (slices[i].weight || 1); if (r <= 0) { idx = i; break; } }
    const n = slices.length, seg = 360 / n, mid = idx * seg + seg / 2;
    const target = angle + 5 * 360 + (((360 - mid) % 360) - (angle % 360) + 720) % 360;
    vibe(20);
    setSpinning(true);
    setAngle(target);
    if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    spinTimerRef.current = setTimeout(() => {
      vibe([12, 40, 12, 40, 90]);
      setSpinning(false);
      setResult(idx);
    }, 4500);
  }, [spinning, result, slices, angle, vibe]);

  const reset = useCallback(() => setResult(null), []);
  const rs = result !== null ? slices[result] : null;

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", background: backgroundColor, fontFamily: "'Space Grotesk', sans-serif", padding: "60px 24px 32px" }}>
      <p style={{ fontSize: 20, fontWeight: 800, color: "#1A1A1A", textAlign: "center", lineHeight: 1.4, margin: "0 0 30px", whiteSpace: "pre-line" }}>{title}</p>

      <div style={{ position: "relative", width: 288, height: 288, marginBottom: 34 }}>
        <div style={{ position: "absolute", top: -6, left: "50%", transform: "translateX(-50%)", zIndex: 5 }}>
          <svg width="30" height="34" viewBox="0 0 30 34"><path d="M15 32 L2 6 a13 13 0 0 1 26 0 Z" fill="#FF6B6B" stroke="#1A1A1A" strokeWidth="2" /><circle cx="15" cy="12" r="4" fill="#FDF2E9" /></svg>
        </div>
        <svg width="288" height="288" viewBox="-110 -110 220 220" style={{ transformOrigin: "50% 50%", transform: `rotate(${angle}deg)`, transition: spinning ? "transform 4.5s cubic-bezier(0.15,0.9,0.2,1)" : "none" }}>
          {wheelSlices.map((s, i) => (
            <path key={i} d={s.path} fill={s.color} stroke="#1A1A1A" strokeWidth="2" />
          ))}
          {wheelSlices.map((s, i) => (
            <text key={i} x={s.lx} y={s.ly} transform={`rotate(${s.rot.toFixed(2)} ${s.lx} ${s.ly})`} fill={s.textColor} fontSize="9" fontWeight="700" textAnchor="middle" dominantBaseline="middle" fontFamily="'Space Grotesk', sans-serif">{s.label}</text>
          ))}
          <circle cx="0" cy="0" r="20" fill="#FDF2E9" stroke="#1A1A1A" strokeWidth="2" />
          <circle cx="0" cy="0" r="8" fill={accentColor} stroke="#1A1A1A" strokeWidth="2" />
        </svg>
      </div>

      <button onClick={spin} disabled={spinning || result !== null} style={{ padding: "17px 52px", borderRadius: 8, border: "2px solid #1A1A1A", background: (spinning || result !== null) ? "#ccc" : accentColor, color: "#1A1A1A", fontSize: 18, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", cursor: (spinning || result !== null) ? "default" : "pointer", boxShadow: (spinning || result !== null) ? "2px 2px 0 #1A1A1A" : "4px 4px 0 #1A1A1A", animation: (spinning || result !== null) ? "none" : "jc-spinhint 1.6s ease-in-out infinite", transition: "background .2s" }}>
        {spinning ? "돌리는 중..." : "돌리기"}
      </button>

      {result !== null && rs && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(26,26,26,.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 30, animation: "jc-fadeup .3s" }}>
          <div style={{ background: "#FDF2E9", borderRadius: 8, padding: "34px 28px", textAlign: "center", width: "100%", maxWidth: 290, animation: "jc-pop .45s", border: "2px solid #1A1A1A", boxShadow: "8px 8px 0 #1A1A1A" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", background: "#FFE66D", display: "inline-block", padding: "4px 12px", borderRadius: 6, border: "2px solid #1A1A1A", boxShadow: "2px 2px 0 #1A1A1A", letterSpacing: ".05em", marginBottom: 10 }}>🎉 오늘의 코스는</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: "#1A1A1A", marginBottom: 12 }}>{rs.label}</div>
            <p style={{ fontSize: 15, color: "#1A1A1A", lineHeight: 1.55, margin: "0 0 22px", fontWeight: 600 }}>{rs.detail}</p>
            <button onClick={complete} style={{ display: "block", width: "100%", padding: "14px 0", borderRadius: 8, border: "2px solid #1A1A1A", background: accentColor, color: "#1A1A1A", fontSize: 16, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", cursor: "pointer", marginBottom: 10, boxShadow: "4px 4px 0 #1A1A1A" }}>다음으로 →</button>
            <button onClick={reset} style={{ background: "none", border: "2px solid #1A1A1A", borderRadius: 8, color: "#1A1A1A", fontSize: 14, fontWeight: 700, cursor: "pointer", padding: "6px 16px" }}>다시 돌리기</button>
          </div>
        </div>
      )}
    </div>
  );
}
