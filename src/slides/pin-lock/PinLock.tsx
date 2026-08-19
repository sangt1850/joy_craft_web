import { useState, useCallback } from "react";
import type { SlideProps } from "../SlideProps";
import { useVibrate } from "../useVibrate";
import { useSlideTimeout } from "../useSlideTimeout";

interface PinLockData {
  question: string;
  answer: string;
  hint: string;
  hintAfter: number;
  successMessage: string;
  backgroundColor: string;
  accentColor: string;
}

export default function PinLock({ data, onComplete, isPreview }: SlideProps<PinLockData>) {
  const { question, answer, hint, hintAfter, successMessage, backgroundColor, accentColor } = data;
  const vibe = useVibrate();
  const later = useSlideTimeout();

  const [pin, setPin] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [shake, setShake] = useState(false);

  const check = useCallback((p: string) => {
    const ans = answer.replace(/\s/g, "");
    if (p === ans) {
      vibe([12, 40, 12, 40, 70]);
      setUnlocked(true);
      if (!isPreview) later(() => onComplete?.(), 1200);
    } else {
      vibe(70);
      setAttempts((a) => a + 1);
      setShake(true);
      later(() => { setShake(false); setPin(""); }, 460);
    }
  }, [answer, isPreview, onComplete, vibe, later]);

  const pressKey = useCallback((d: string) => {
    if (unlocked || pin.length >= 4) return;
    const next = pin + d;

    vibe(8);
    setPin(next);
    if (next.length === 4) later(() => check(next), 180);
  }, [unlocked, pin, vibe, check, later]);

  const del = useCallback(() => {
    if (!unlocked) setPin((p) => p.slice(0, -1));
  }, [unlocked]);

  const escape = useCallback(() => {
    vibe(20);
    setUnlocked(true);
    if (!isPreview) later(() => onComplete?.(), 1200);
  }, [isPreview, onComplete, vibe, later]);

  const showHint = attempts >= hintAfter && !unlocked;
  const showEscape = attempts >= hintAfter * 2 && !unlocked;

  const keyBase: React.CSSProperties = {
    height: 58, borderRadius: 8, border: "2px solid #1A1A1A",
    background: "#FDF2E9", color: "#1A1A1A",
    fontSize: 24, fontWeight: 700, cursor: "pointer",
    fontFamily: "'Space Grotesk', sans-serif",
    boxShadow: "3px 3px 0 #1A1A1A",
  };

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", background: backgroundColor, fontFamily: "'Space Grotesk', sans-serif", color: "#FDF2E9", padding: "64px 26px 30px" }}>
      <p style={{ fontSize: 19, fontWeight: 700, textAlign: "center", lineHeight: 1.45, margin: "0 0 26px" }}>{question}</p>

      <div style={{ animation: shake ? "jc-shake .45s" : "none", marginBottom: 18 }}>
        <svg width="92" height="106" viewBox="0 0 92 106" fill="none">
          <path d="M26 44 V31 a20 20 0 0 1 40 0 V44" stroke={accentColor} strokeWidth="9" strokeLinecap="round" />
          <rect x="16" y="44" width="60" height="54" rx="8" fill={accentColor} stroke="#1A1A1A" strokeWidth="2" />
          <circle cx="46" cy="66" r="7" fill="#1A1A1A" />
          <rect x="43" y="70" width="6" height="16" rx="3" fill="#1A1A1A" />
        </svg>
      </div>

      <div style={{ display: "flex", gap: 14, marginBottom: 22 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{
            width: 15, height: 15, borderRadius: 4,
            background: i < pin.length ? accentColor : "transparent",
            border: `2px solid ${i < pin.length ? "#1A1A1A" : "#555"}`,
            transition: "all .15s",
          }} />
        ))}
      </div>

      <div style={{ minHeight: 24, marginBottom: 14, textAlign: "center" }}>
        {showHint && (
          <p style={{ fontSize: 13, color: "#FFE66D", fontWeight: 700, margin: 0, animation: "jc-fadeup .3s", background: "#1A1A1A", border: "2px solid #FFE66D", borderRadius: 6, padding: "4px 12px", display: "inline-block" }}>💡 {hint}</p>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,72px)", gap: 12, marginTop: "auto" }}>
        {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((label, i) => {
          if (label === "") return <div key={i} />;
          if (label === "⌫") return (
            <button key={i} style={{ ...keyBase, fontSize: 22, background: "#FF6B6B", color: "#1A1A1A" }} onClick={del}>⌫</button>
          );
          return <button key={i} style={keyBase} onClick={() => pressKey(label)}>{label}</button>;
        })}
      </div>

      <div style={{ minHeight: 44, marginTop: 12 }}>
        {showEscape && (
          <button onClick={escape} style={{ background: "none", border: "2px solid #555", borderRadius: 8, color: "#888", fontSize: 13, fontWeight: 700, cursor: "pointer", padding: "8px 16px" }}>
            그냥 열어보기
          </button>
        )}
      </div>

      {unlocked && (
        <div style={{ position: "absolute", inset: 0, background: "#1A1A1A", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22, animation: "jc-fadeup .4s" }}>
          <div style={{ animation: "jc-pop .5s" }}>
            <svg width="100" height="112" viewBox="0 0 92 106" fill="none">
              <path d="M26 44 V31 a20 20 0 0 1 40 0 V51" stroke={accentColor} strokeWidth="9" strokeLinecap="round" />
              <rect x="16" y="44" width="60" height="54" rx="8" fill={accentColor} stroke="#1A1A1A" strokeWidth="2" />
              <circle cx="46" cy="66" r="7" fill="#1A1A1A" />
              <rect x="43" y="70" width="6" height="16" rx="3" fill="#1A1A1A" />
            </svg>
          </div>
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700, color: "#FDF2E9", margin: 0, textAlign: "center" }}>{successMessage}</p>
          <div style={{ fontSize: 13, color: "#1A1A1A", fontWeight: 700, background: "#4ECDC4", padding: "6px 18px", borderRadius: 6, border: "2px solid #1A1A1A", boxShadow: "3px 3px 0 #1A1A1A" }}>✓ 잠금 해제됨 · 다음 페이지로</div>
        </div>
      )}
    </div>
  );
}
