import { useState, useMemo, useCallback } from "react";
import type { SlideProps } from "../SlideProps";
import { useVibrate } from "../useVibrate";
import { useAudio } from "../useAudio";
import { useSlideTimeout } from "../useSlideTimeout";

interface Balloon { x: number; y: number; color: string; emoji: string; }
interface BurstParticle { id: string; style: React.CSSProperties; }

interface BalloonPopData {
  successMessage: string;
  balloons: string | Balloon[];
  backgroundColor: string;
}

export default function BalloonPop({ data, onComplete, isPreview }: SlideProps<BalloonPopData>) {
  const { successMessage, backgroundColor } = data;
  const vibe = useVibrate();
  const { blip } = useAudio();
  const later = useSlideTimeout();

  const balloons = useMemo<Balloon[]>(() => {
    if (Array.isArray(data.balloons)) return data.balloons;
    try { return JSON.parse(data.balloons as string); } catch { return []; }
  }, [data.balloons]);

  const [popped, setPopped] = useState<number[]>([]);
  const [particles, setParticles] = useState<BurstParticle[]>([]);
  const [clear, setClear] = useState(false);

  const pop = useCallback((i: number) => {
    if (popped.includes(i)) return;
    vibe(24);
    blip(180 + Math.random() * 80, 0.09, "triangle", 0.16);
    const b = balloons[i];
    const burst: BurstParticle[] = Array.from({ length: 8 }, (_, k) => {
      const ang = (k / 8) * Math.PI * 2, d = 30 + Math.random() * 20;
      return {
        id: Date.now() + "_" + k,
        style: {
          position: "absolute" as const,
          left: `calc(${b.x}% + 30px)`, top: `calc(${b.y}% + 30px)`,
          width: 8, height: 8, borderRadius: "50%", background: b.color,
          ["--tx" as string]: Math.cos(ang) * d + "px",
          ["--ty" as string]: Math.sin(ang) * d + "px",
          animation: "jc-confburst .5s ease-out forwards", pointerEvents: "none" as const,
        },
      };
    });
    const nextPopped = [...popped, i];
    setPopped(nextPopped);
    setParticles((prev) => [...prev, ...burst]);
    if (nextPopped.length >= balloons.length) {
      vibe([15, 40, 15, 40, 90]);
      later(() => {
        setClear(true);
        if (!isPreview) later(() => onComplete?.(), 1000);
      }, 350);
    }
  }, [popped, balloons, vibe, blip, isPreview, onComplete, later]);

  const reset = useCallback(() => { setPopped([]); setParticles([]); setClear(false); }, []);

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", background: `linear-gradient(180deg,${backgroundColor},#d4ecff)`, padding: "52px 22px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#3a7ec0", background: "#fff", padding: "6px 14px", borderRadius: 20, boxShadow: "0 2px 6px rgba(0,0,0,.06)" }}>{popped.length} / {balloons.length}</span>
        <span style={{ fontSize: 13, color: "#6a9ac8" }}>풍선을 모두 터뜨려요</span>
      </div>
      <div style={{ position: "relative", flex: 1 }}>
        {balloons.map((b, i) => {
          const isPopped = popped.includes(i);
          return (
            <button key={i} onClick={() => pop(i)} style={{ position: "absolute", left: b.x + "%", top: b.y + "%", width: 60, height: 76, padding: 0, border: "none", background: "none", cursor: isPopped ? "default" : "pointer", transform: `scale(${0.85 + (i % 3) * 0.1})`, transformOrigin: "center", animation: isPopped ? "jc-popscale .35s ease-out forwards" : `jc-float2 ${2 + (i % 3) * 0.4}s ease-in-out ${i * 0.2}s infinite`, pointerEvents: isPopped ? "none" : "auto" }}>
              <svg width="60" height="76" viewBox="0 0 60 76">
                <ellipse cx="30" cy="30" rx="26" ry="30" fill={b.color} />
                <ellipse cx="22" cy="20" rx="7" ry="10" fill="rgba(255,255,255,.4)" />
                <path d="M30 60 L26 68 L34 68 Z" fill={b.color} />
                <path d="M30 68 q6 8 0 16" stroke="#9ab" strokeWidth="1.5" fill="none" />
              </svg>
              <span style={{ position: "absolute", top: 20, left: 0, right: 0, textAlign: "center", fontSize: 20, pointerEvents: "none" }}>{b.emoji}</span>
            </button>
          );
        })}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {particles.map((p) => <div key={p.id} style={p.style} />)}
        </div>
      </div>

      {clear && (
        <div style={{ position: "absolute", inset: 0, zIndex: 10, background: "linear-gradient(165deg,#E94F6A,#ff9a5c)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: 40, textAlign: "center", animation: "jc-fadeup .4s" }}>
          <div style={{ fontSize: 66, animation: "jc-pop .5s" }}>🎊</div>
          <p style={{ whiteSpace: "pre-line", fontFamily: "'Nanum Pen Script',cursive", fontSize: 32, color: "#fff", lineHeight: 1.35, margin: 0 }}>{successMessage}</p>
          <button onClick={reset} style={{ padding: "12px 26px", borderRadius: 12, border: "2px solid rgba(255,255,255,.6)", background: "rgba(255,255,255,.15)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>다시 터뜨리기</button>
        </div>
      )}
    </div>
  );
}
