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
  const ledColor = playing ? "#4ade80" : (done ? "#FFD97D" : "#8a7d6f");
  const btnLabel = playing ? "❚❚ 멈춤" : (done ? "↻ 다시 보기" : "▶ 편지 받기");

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", background: backgroundColor, padding: "50px 24px 28px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: ledColor, boxShadow: `0 0 8px ${ledColor}` }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: "#9a8f7e", letterSpacing: ".08em" }}>TYPEWRITER · {playing ? "TYPING" : (done ? "DONE" : "READY")}</span>
      </div>
      <div style={{ flex: 1, background: paperColor, borderRadius: 6, padding: "26px 24px", boxShadow: "inset 0 2px 10px rgba(0,0,0,.12)", overflowY: "auto", backgroundImage: "repeating-linear-gradient(transparent,transparent 33px,#e6dcc4 33px,#e6dcc4 34px)" }}>
        <p style={{ fontFamily: "'Special Elite','Courier New',monospace", fontSize: 16, lineHeight: "34px", color: "#3a332a", margin: 0, whiteSpace: "pre-wrap", letterSpacing: ".01em" }}>
          {shown}
          <span style={{ color: "#E94F6A", animation: "jc-caret 1s steps(1) infinite", display: (playing || !done) ? "inline" : "none" }}>▊</span>
        </p>
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
        <button onClick={done && !playing ? () => { restart(); setTimeout(start, 30); } : toggle} style={{ flex: 1, padding: 15, borderRadius: 12, border: "none", background: "#E94F6A", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>{btnLabel}</button>
        <button onClick={restart} style={{ padding: "15px 20px", borderRadius: 12, border: "1px solid #554d40", background: "#3a342b", color: "#b8ac97", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>↻</button>
      </div>
      <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12, fontSize: 12, color: "#9a8f7e", cursor: "pointer" }}>
        <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} style={{ accentColor: "#E94F6A", width: 15, height: 15 }} /> 타이핑 사운드
      </label>
    </div>
  );
}
