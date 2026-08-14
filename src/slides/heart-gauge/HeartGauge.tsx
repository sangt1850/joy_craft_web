import { useState, useCallback } from "react";
import type { SlideProps } from "../SlideProps";
import { useVibrate } from "../useVibrate";
import { useAudio } from "../useAudio";

interface HeartGaugeData {
  title: string;
  targetCount: number;
  successMessage: string;
  heartColor: string;
  backgroundColor: string;
}

interface FloatingHeart {
  id: number;
  style: React.CSSProperties;
}

export default function HeartGauge({ data, onComplete, isPreview }: SlideProps<HeartGaugeData>) {
  const { title, targetCount, successMessage, heartColor, backgroundColor } = data;
  const vibe = useVibrate();
  const { blip } = useAudio();

  const [count, setCount] = useState(0);
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const [full, setFull] = useState(false);

  const tap = useCallback(() => {
    if (full) return;
    setCount((n) => {
      const next = n + 1;
      vibe(14);
      blip(520 + next * 8, 0.05, "sine", 0.08);
      const id = Date.now() + Math.random();
      const heart: FloatingHeart = {
        id,
        style: {
          position: "absolute", left: "50%", top: "46%",
          fontSize: (16 + Math.random() * 14) + "px",
          color: [heartColor, "#ff8aa3", "#FFD97D"][next % 3],
          ["--hx" as string]: (Math.random() * 120 - 60) + "px",
          animation: "jc-heartfly 1s ease-out forwards",
          pointerEvents: "none",
        },
      };
      setHearts((prev) => [...prev.slice(-11), heart]);
      setTimeout(() => setHearts((prev) => prev.filter((h) => h.id !== id)), 1000);
      if (next >= targetCount) {
        vibe([15, 40, 15, 40, 90]);
        setFull(true);
        if (!isPreview) setTimeout(() => onComplete?.(), 1500);
      }
      return next;
    });
  }, [full, vibe, blip, heartColor, targetCount, isPreview, onComplete]);

  const reset = useCallback(() => { setCount(0); setHearts([]); setFull(false); }, []);
  const pct = Math.min(1, count / targetCount);
  const dashOffset = 590 * (1 - pct);

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", background: `linear-gradient(165deg,${backgroundColor},#ffe4d6)`, padding: "56px 26px 40px", overflow: "hidden" }}>
      <p style={{ fontSize: 20, fontWeight: 800, color: heartColor, textAlign: "center", margin: "0 0 4px" }}>{title}</p>
      <p style={{ fontSize: 13, color: "#c98a9a", margin: "0 0 26px" }}>하트를 연타해서 마음을 가득 채워요</p>

      <div style={{ position: "relative", width: 210, height: 210, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28 }}>
        <svg width="210" height="210" viewBox="0 0 210 210" style={{ position: "absolute", inset: 0 }}>
          <circle cx="105" cy="105" r="94" fill="none" stroke="#f7c9d6" strokeWidth="14" />
          <circle cx="105" cy="105" r="94" fill="none" stroke={heartColor} strokeWidth="14" strokeLinecap="round"
            strokeDasharray="590" transform="rotate(-90 105 105)"
            style={{ strokeDashoffset: dashOffset, transition: "stroke-dashoffset .2s cubic-bezier(.34,1.56,.64,1)" }} />
        </svg>
        <button onClick={tap} style={{ width: 128, height: 128, borderRadius: "50%", border: "none", cursor: "pointer", background: `radial-gradient(circle at 38% 32%,#ff88a3,${heartColor})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 10px 26px ${heartColor}66`, animation: full ? "none" : "jc-beat 1.1s ease-in-out infinite" }}>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="#fff">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>
        <div style={{ position: "absolute", bottom: -2, left: "50%", transform: "translateX(-50%)", fontSize: 15, fontWeight: 800, color: heartColor, background: "#fff", padding: "2px 12px", borderRadius: 20, boxShadow: "0 3px 8px rgba(233,79,106,.2)" }}>{Math.round(pct * 100)}%</div>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {hearts.map((h) => (
            <div key={h.id} style={h.style}>
              <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" style={{ display: "block" }}>
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
          ))}
        </div>
      </div>
      <p style={{ fontSize: 14, color: "#c98a9a", fontWeight: 600 }}>{count} / {targetCount} 탭</p>

      {full && (
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(165deg,${heartColor},#ff7a95)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: 40, textAlign: "center", animation: "jc-fadeup .4s" }}>
          <div style={{ fontSize: 72, animation: "jc-beat .7s ease-in-out infinite" }}>💖</div>
          <p style={{ fontFamily: "'Nanum Pen Script',cursive", fontSize: 34, color: "#fff", lineHeight: 1.3, margin: 0, whiteSpace: "pre-line" }}>{successMessage}</p>
          <button onClick={reset} style={{ padding: "12px 26px", borderRadius: 12, border: "2px solid rgba(255,255,255,.6)", background: "rgba(255,255,255,.15)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>다시 채우기</button>
        </div>
      )}
    </div>
  );
}
