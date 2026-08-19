import { useState, useCallback } from "react";
import type { SlideProps } from "../SlideProps";
import { useVibrate } from "../useVibrate";
import { useAudio } from "../useAudio";
import { useSlideTimeout } from "../useSlideTimeout";

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
  const later = useSlideTimeout();

  const [count, setCount] = useState(0);
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const [full, setFull] = useState(false);

  const tap = useCallback(() => {
    if (full) return;
    const next = count + 1;

    vibe(14);
    blip(520 + next * 8, 0.05, "sine", 0.08);

    const id = Date.now() + Math.random();
    const heart: FloatingHeart = {
      id,
      style: {
        position: "absolute", left: "50%", top: "46%",
        fontSize: (16 + Math.random() * 14) + "px",
        color: [heartColor, "#FF6B6B", "#FFE66D"][next % 3],
        ["--hx" as string]: (Math.random() * 120 - 60) + "px",
        animation: "jc-heartfly 1s ease-out forwards",
        pointerEvents: "none",
      },
    };

    setCount(next);
    setHearts((prev) => [...prev.slice(-11), heart]);
    later(() => setHearts((prev) => prev.filter((h) => h.id !== id)), 1000);

    if (next >= targetCount) {
      vibe([15, 40, 15, 40, 90]);
      setFull(true);
      if (!isPreview) later(() => onComplete?.(), 1500);
    }
  }, [full, count, vibe, blip, heartColor, targetCount, isPreview, onComplete, later]);

  const reset = useCallback(() => { setCount(0); setHearts([]); setFull(false); }, []);
  const pct = Math.min(1, count / targetCount);
  const dashOffset = 590 * (1 - pct);

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", background: backgroundColor, fontFamily: "'Space Grotesk', sans-serif", padding: "56px 26px 40px", overflow: "hidden" }}>
      <p style={{ fontSize: 20, fontWeight: 800, color: "#1A1A1A", textAlign: "center", margin: "0 0 4px" }}>{title}</p>
      <p style={{ fontSize: 13, color: "#1A1A1A", margin: "0 0 26px", fontWeight: 700 }}>하트를 연타해서 마음을 가득 채워요</p>

      <div style={{ position: "relative", width: 210, height: 210, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28 }}>
        <svg width="210" height="210" viewBox="0 0 210 210" style={{ position: "absolute", inset: 0 }}>
          <circle cx="105" cy="105" r="94" fill="none" stroke="#1A1A1A" strokeWidth="14" />
          <circle cx="105" cy="105" r="94" fill="none" stroke={heartColor} strokeWidth="14" strokeLinecap="round"
            strokeDasharray="590" transform="rotate(-90 105 105)"
            style={{ strokeDashoffset: dashOffset, transition: "stroke-dashoffset .2s cubic-bezier(.34,1.56,.64,1)" }} />
        </svg>
        <button onClick={tap} style={{ width: 128, height: 128, borderRadius: 8, border: "2px solid #1A1A1A", cursor: "pointer", background: heartColor, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "4px 4px 0 #1A1A1A", animation: full ? "none" : "jc-beat 1.1s ease-in-out infinite" }}>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="#FDF2E9">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>
        <div style={{ position: "absolute", bottom: -2, left: "50%", transform: "translateX(-50%)", fontSize: 15, fontWeight: 800, color: "#1A1A1A", background: "#FFE66D", padding: "2px 12px", borderRadius: 6, border: "2px solid #1A1A1A", boxShadow: "2px 2px 0 #1A1A1A" }}>{Math.round(pct * 100)}%</div>
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
      <p style={{ fontSize: 14, color: "#1A1A1A", fontWeight: 700 }}>{count} / {targetCount} 탭</p>

      {full && (
        <div style={{ position: "absolute", inset: 0, background: heartColor, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: 40, textAlign: "center", animation: "jc-fadeup .4s" }}>
          <div style={{ fontSize: 72, animation: "jc-beat .7s ease-in-out infinite" }}>💖</div>
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700, color: "#1A1A1A", lineHeight: 1.3, margin: 0, whiteSpace: "pre-line" }}>{successMessage}</p>
          <button onClick={reset} style={{ padding: "12px 26px", borderRadius: 8, border: "2px solid #1A1A1A", background: "#FFE66D", color: "#1A1A1A", fontSize: 14, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", cursor: "pointer", boxShadow: "4px 4px 0 #1A1A1A" }}>다시 채우기</button>
        </div>
      )}
    </div>
  );
}
