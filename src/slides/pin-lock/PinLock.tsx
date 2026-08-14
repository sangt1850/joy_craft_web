import { useState, useCallback } from "react";
import type { SlideProps } from "../SlideProps";
import { useVibrate } from "../useVibrate";

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

  const [pin, setPin] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [shake, setShake] = useState(false);

  const check = useCallback((p: string) => {
    const ans = answer.replace(/\s/g, "");
    if (p === ans) {
      vibe([12, 40, 12, 40, 70]);
      setUnlocked(true);
      if (!isPreview) setTimeout(() => onComplete?.(), 1200);
    } else {
      vibe(70);
      setAttempts((a) => a + 1);
      setShake(true);
      setTimeout(() => { setShake(false); setPin(""); }, 460);
    }
  }, [answer, isPreview, onComplete, vibe]);

  const pressKey = useCallback((d: string) => {
    if (unlocked) return;
    setPin((prev) => {
      if (prev.length >= 4) return prev;
      const next = prev + d;
      vibe(8);
      if (next.length === 4) setTimeout(() => check(next), 180);
      return next;
    });
  }, [unlocked, vibe, check]);

  const del = useCallback(() => {
    if (!unlocked) setPin((p) => p.slice(0, -1));
  }, [unlocked]);

  const escape = useCallback(() => {
    vibe(20);
    setUnlocked(true);
    if (!isPreview) setTimeout(() => onComplete?.(), 1200);
  }, [isPreview, onComplete, vibe]);

  const showHint = attempts >= hintAfter && !unlocked;
  const showEscape = attempts >= hintAfter * 2 && !unlocked;

  const keyBase: React.CSSProperties = {
    height: 58, borderRadius: 18, border: "none",
    background: "rgba(255,255,255,.09)", color: "#fff",
    fontSize: 24, fontWeight: 600, cursor: "pointer",
  };

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", background: `linear-gradient(165deg,${backgroundColor},#2a1e46)`, color: "#fff", padding: "64px 26px 30px" }}>
      <p style={{ fontSize: 19, fontWeight: 700, textAlign: "center", lineHeight: 1.45, margin: "0 0 26px" }}>{question}</p>

      <div style={{ animation: shake ? "jc-shake .45s" : "none", marginBottom: 18 }}>
        <svg width="92" height="106" viewBox="0 0 92 106" fill="none">
          <path d="M26 44 V31 a20 20 0 0 1 40 0 V44" stroke={accentColor} strokeWidth="9" strokeLinecap="round" />
          <rect x="16" y="44" width="60" height="54" rx="12" fill={accentColor} />
          <circle cx="46" cy="66" r="7" fill={backgroundColor} />
          <rect x="43" y="70" width="6" height="16" rx="3" fill={backgroundColor} />
        </svg>
      </div>

      <div style={{ display: "flex", gap: 14, marginBottom: 22 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{
            width: 15, height: 15, borderRadius: "50%",
            background: i < pin.length ? accentColor : "transparent",
            border: `2px solid ${i < pin.length ? accentColor : "#6a5c82"}`,
            transition: "all .15s",
          }} />
        ))}
      </div>

      <div style={{ minHeight: 24, marginBottom: 14, textAlign: "center" }}>
        {showHint && (
          <p style={{ fontSize: 13, color: accentColor, margin: 0, animation: "jc-fadeup .3s" }}>💡 {hint}</p>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,72px)", gap: 12, marginTop: "auto" }}>
        {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((label, i) => {
          if (label === "") return <div key={i} />;
          if (label === "⌫") return (
            <button key={i} style={{ ...keyBase, fontSize: 22, background: "rgba(255,255,255,.04)" }} onClick={del}>⌫</button>
          );
          return <button key={i} style={keyBase} onClick={() => pressKey(label)}>{label}</button>;
        })}
      </div>

      <div style={{ minHeight: 44, marginTop: 12 }}>
        {showEscape && (
          <button onClick={escape} style={{ background: "none", border: "none", color: "#9c8fb8", fontSize: 13, textDecoration: "underline", cursor: "pointer", padding: 10 }}>
            그냥 열어보기
          </button>
        )}
      </div>

      {unlocked && (
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(165deg,#241b3d,#3a2650)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22, animation: "jc-fadeup .4s" }}>
          <div style={{ animation: "jc-pop .5s" }}>
            <svg width="100" height="112" viewBox="0 0 92 106" fill="none">
              <path d="M26 44 V31 a20 20 0 0 1 40 0 V51" stroke={accentColor} strokeWidth="9" strokeLinecap="round" />
              <rect x="16" y="44" width="60" height="54" rx="12" fill={accentColor} />
              <circle cx="46" cy="66" r="7" fill="#241b3d" />
              <rect x="43" y="70" width="6" height="16" rx="3" fill="#241b3d" />
            </svg>
          </div>
          <p style={{ fontFamily: "'Nanum Pen Script',cursive", fontSize: 34, color: "#fff", margin: 0, textAlign: "center" }}>{successMessage}</p>
          <div style={{ fontSize: 13, color: "#b6a9d0", background: "rgba(255,255,255,.1)", padding: "8px 18px", borderRadius: 20 }}>✓ 잠금 해제됨 · 다음 페이지로</div>
        </div>
      )}
    </div>
  );
}
