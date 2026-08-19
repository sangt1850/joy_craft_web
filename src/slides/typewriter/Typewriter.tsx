import { useState, useRef, useCallback, useEffect } from "react";
import type { SlideProps } from "../SlideProps";
import { useAudio } from "../useAudio";

interface TypewriterData {
  letterText: string;
  typingSpeed: number;
  enableSound: boolean;
  paperColor: string;
  backgroundColor: string;
}

export default function Typewriter({ data, onComplete, isPreview }: SlideProps<TypewriterData>) {
  const { letterText, typingSpeed, enableSound, paperColor, backgroundColor } = data;
  const { blip } = useAudio();

  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [sound, setSound] = useState(enableSound);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPlaying(false);
  }, []);

  const start = useCallback(() => {
    setPlaying(true);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setIdx((i) => {
        if (i >= letterText.length) {
          if (timerRef.current) clearInterval(timerRef.current);
          setPlaying(false);
          if (!isPreview) setTimeout(() => onComplete?.(), 800);
          return i;
        }
        const ch = letterText[i];
        if (sound && ch.trim()) blip(1400 + Math.random() * 500, 0.02, "square", 0.05);
        return i + 1;
      });
    }, typingSpeed);
  }, [letterText, typingSpeed, sound, blip, isPreview, onComplete]);

  const toggle = useCallback(() => {
    if (playing) { stop(); return; }
    if (idx >= letterText.length) setIdx(0);
    start();
  }, [playing, stop, idx, letterText.length, start]);

  const restart = useCallback(() => { stop(); setIdx(0); }, [stop]);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const shown = letterText.slice(0, idx);
  const done = idx >= letterText.length;
  const ledColor = playing ? "#4ECDC4" : (done ? "#FFE66D" : "#888");
  const btnLabel = playing ? "❚❚ 멈춤" : (done ? "↻ 다시 보기" : "▶ 편지 받기");

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", background: backgroundColor, fontFamily: "'Space Grotesk', sans-serif", padding: "50px 24px 28px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{ width: 10, height: 10, borderRadius: 4, background: ledColor, border: "2px solid #1A1A1A" }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1A", letterSpacing: ".08em" }}>TYPEWRITER · {playing ? "TYPING" : (done ? "DONE" : "READY")}</span>
      </div>
      <div style={{ flex: 1, background: paperColor, borderRadius: 8, padding: "26px 24px", border: "2px solid #1A1A1A", boxShadow: "6px 6px 0 #1A1A1A", overflowY: "auto", backgroundImage: "repeating-linear-gradient(transparent,transparent 33px,#1A1A1A 33px,#1A1A1A 34px)" }}>
        <p style={{ fontFamily: "'Special Elite','Courier New',monospace", fontSize: 16, lineHeight: "34px", color: "#1A1A1A", margin: 0, whiteSpace: "pre-wrap", letterSpacing: ".01em" }}>
          {shown}
          <span style={{ color: "#FF6B6B", animation: "jc-caret 1s steps(1) infinite", display: (playing || !done) ? "inline" : "none" }}>▊</span>
        </p>
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
        <button onClick={done && !playing ? () => { restart(); setTimeout(start, 30); } : toggle} style={{ flex: 1, padding: 15, borderRadius: 8, border: "2px solid #1A1A1A", background: "#FF6B6B", color: "#1A1A1A", fontSize: 15, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", cursor: "pointer", boxShadow: "4px 4px 0 #1A1A1A" }}>{btnLabel}</button>
        <button onClick={restart} style={{ padding: "15px 20px", borderRadius: 8, border: "2px solid #1A1A1A", background: "#1A1A1A", color: "#FDF2E9", fontSize: 15, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", cursor: "pointer", boxShadow: "3px 3px 0 #FFE66D" }}>↻</button>
      </div>
      <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12, fontSize: 12, color: "#1A1A1A", fontWeight: 700, cursor: "pointer" }}>
        <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} style={{ accentColor: "#FF6B6B", width: 15, height: 15 }} /> 타이핑 사운드
      </label>
    </div>
  );
}
