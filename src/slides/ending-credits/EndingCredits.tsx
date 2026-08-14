import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type { SlideProps } from "../SlideProps";
import { useAudio } from "../useAudio";

interface Credit { role: string; name: string; }

interface EndingCreditsData {
  movieTitle: string;
  endMessage: string;
  credits: string | Credit[];
  enableSound: boolean;
}

export default function EndingCredits({ data, onComplete, isPreview }: SlideProps<EndingCreditsData>) {
  const { movieTitle, endMessage, enableSound } = data;
  const { getAc } = useAudio();

  const credits = useMemo<Credit[]>(() => {
    if (Array.isArray(data.credits)) return data.credits;
    try { return JSON.parse(data.credits as string); } catch { return []; }
  }, [data.credits]);

  const [playing, setPlaying] = useState(false);
  const [y, setY] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const oscsRef = useRef<OscillatorNode[]>([]);

  const maxY = 240 + credits.length * 78 + 260;

  const stopAudio = useCallback(() => {
    if (masterRef.current) {
      try {
        const ac = getAc();
        masterRef.current.gain.cancelScheduledValues(ac.currentTime);
        masterRef.current.gain.setValueAtTime(masterRef.current.gain.value, ac.currentTime);
        masterRef.current.gain.linearRampToValueAtTime(0.0001, ac.currentTime + 0.4);
        const oscs = [...oscsRef.current];
        setTimeout(() => oscs.forEach((o) => { try { o.stop(); } catch {} }), 500);
      } catch {}
      masterRef.current = null;
      oscsRef.current = [];
    }
  }, [getAc]);

  const startSwell = useCallback(() => {
    if (!enableSound) return;
    try {
      stopAudio();
      const ac = getAc();
      const master = ac.createGain();
      master.gain.value = 0.0001;
      master.connect(ac.destination);
      masterRef.current = master;
      master.gain.exponentialRampToValueAtTime(0.14, ac.currentTime + 1.5);
      [196, 246.94, 293.66].forEach((f) => {
        const o = ac.createOscillator();
        o.type = "sine"; o.frequency.value = f;
        o.connect(master); o.start();
        oscsRef.current.push(o);
      });
    } catch {}
  }, [enableSound, getAc, stopAudio]);

  const toggle = useCallback(() => {
    if (playing) {
      clearInterval(intervalRef.current!);
      stopAudio();
      setPlaying(false);
      return;
    }
    if (y >= maxY) setY(0);
    setPlaying(true);
    startSwell();
    intervalRef.current = setInterval(() => {
      setY((prev) => {
        const next = prev + 1.1;
        if (next >= maxY) {
          clearInterval(intervalRef.current!);
          stopAudio();
          setPlaying(false);
          if (!isPreview) onComplete?.();
          return maxY;
        }
        return next;
      });
    }, 16);
  }, [playing, y, maxY, startSwell, stopAudio, isPreview, onComplete]);

  const restart = useCallback(() => {
    clearInterval(intervalRef.current!);
    stopAudio();
    setY(0);
    setPlaying(false);
  }, [stopAudio]);

  useEffect(() => () => { clearInterval(intervalRef.current!); stopAudio(); }, [stopAudio]);

  const done = y >= maxY;
  const btnLabel = playing ? "❚❚ 멈춤" : (done ? "↻ 다시 보기" : "▶ 재생");

  return (
    <div style={{ position: "absolute", inset: 0, background: "#0a0a12", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, transform: `translateY(${466 - y}px)`, willChange: "transform" }}>
        <div style={{ textAlign: "center", padding: "60px 30px 40px" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎬</div>
          <p style={{ fontFamily: "'Nanum Pen Script',cursive", fontSize: 40, color: "#FFD97D", margin: 0, lineHeight: 1.2 }}>{movieTitle}</p>
        </div>
        {credits.map((c, i) => (
          <div key={i} style={{ textAlign: "center", padding: "16px 30px" }}>
            <p style={{ fontSize: 13, color: "#8a8fa0", letterSpacing: ".1em", margin: "0 0 4px" }}>{c.role}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>{c.name}</p>
          </div>
        ))}
        <div style={{ textAlign: "center", padding: "50px 30px 80px" }}>
          <p style={{ fontFamily: "'Nanum Pen Script',cursive", fontSize: 32, color: "#E94F6A", margin: 0, lineHeight: 1.4, whiteSpace: "pre-line" }}>{endMessage}</p>
        </div>
      </div>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 80, background: "linear-gradient(#0a0a12,transparent)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: 66, left: 0, right: 0, height: 80, background: "linear-gradient(transparent,#0a0a12)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", gap: 12, padding: "16px 22px", background: "#0a0a12" }}>
        <button onClick={done ? restart : toggle} style={{ flex: 1, padding: 14, borderRadius: 12, border: "none", background: "#E94F6A", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>{done ? "↻ 다시 보기" : btnLabel}</button>
        <button onClick={restart} style={{ padding: "14px 20px", borderRadius: 12, border: "1px solid #2a2a3a", background: "#15151f", color: "#aab", fontSize: 15, cursor: "pointer" }}>↻</button>
      </div>
    </div>
  );
}
