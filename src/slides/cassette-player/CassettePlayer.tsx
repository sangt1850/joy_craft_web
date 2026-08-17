import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type { SlideProps } from "../SlideProps";
import { useAudio } from "../useAudio";
import { useSlideComplete } from "../useSlideComplete";

interface Track { title: string; artist: string; dur: number; root: number; scale: number[]; tempo: number; }

interface CassettePlayerData {
  tracks: string | Track[];
  note: string;
  tapeColor: string;
  backgroundColor: string;
}

function fmt(s: number) {
  const m = Math.floor(s / 60), ss = Math.floor(s % 60);
  return m + ":" + (ss < 10 ? "0" : "") + ss;
}

export default function CassettePlayer({ data, onComplete, isPreview }: SlideProps<CassettePlayerData>) {
  const { note, tapeColor, backgroundColor } = data;
  const { getAc } = useAudio();
  const complete = useSlideComplete(onComplete, isPreview);

  const tracks = useMemo<Track[]>(() => {
    if (Array.isArray(data.tracks)) return data.tracks;
    try { return JSON.parse(data.tracks as string); } catch { return []; }
  }, [data.tracks]);

  const [trackIdx, setTrackIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  // 재생을 한 번이라도 시작해야 "다음으로" 안내가 뜬다 (테이프를 들어봤다는 신호)
  const [started, setStarted] = useState(false);

  const posRef = useRef(0);
  const masterRef = useRef<GainNode | null>(null);
  const oscsRef = useRef<OscillatorNode[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const melodyRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopAudio = useCallback(() => {
    clearInterval(melodyRef.current!);
    if (masterRef.current) {
      try {
        const ac = getAc();
        masterRef.current.gain.cancelScheduledValues(ac.currentTime);
        masterRef.current.gain.setValueAtTime(masterRef.current.gain.value, ac.currentTime);
        masterRef.current.gain.linearRampToValueAtTime(0, ac.currentTime + 0.2);
        const oscs = oscsRef.current;
        setTimeout(() => oscs.forEach((o) => { try { o.stop(); } catch {} }), 500);
      } catch {}
      masterRef.current = null;
      oscsRef.current = [];
    }
  }, [getAc]);

  // 멜로디는 스케일에서 즉흥 생성되므로 재생 위치(pos) 개념이 없다 — 인자로 받지 않는다
  const playMelody = useCallback((t: Track) => {
    stopAudio();
    const ac = getAc();
    const master = ac.createGain();
    master.gain.value = 0.0001;
    master.connect(ac.destination);
    master.gain.linearRampToValueAtTime(0.22, ac.currentTime + 0.4);
    masterRef.current = master;
    const step = t.tempo / 1000;
    const schedule = () => {
      const ac2 = getAc();
      const now = ac2.currentTime;
      for (let k = 0; k < 4; k++) {
        const when = now + k * step;
        const deg = t.scale[Math.floor(Math.random() * t.scale.length)];
        const oct = Math.random() < 0.3 ? 2 : 1;
        const freq = t.root * Math.pow(2, deg / 12) * oct;
        const o = ac2.createOscillator(), g = ac2.createGain();
        o.type = "triangle"; o.frequency.value = freq;
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(0.5, when + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, when + step * 0.9);
        o.connect(g); g.connect(master); o.start(when); o.stop(when + step);
        if (k % 2 === 0) {
          const b = ac2.createOscillator(), bg = ac2.createGain();
          b.type = "sine"; b.frequency.value = t.root / 2;
          bg.gain.setValueAtTime(0.3, when); bg.gain.exponentialRampToValueAtTime(0.001, when + step * 1.6);
          b.connect(bg); bg.connect(master); b.start(when); b.stop(when + step * 2);
        }
      }
    };
    schedule();
    melodyRef.current = setInterval(schedule, step * 4 * 1000);
  }, [getAc, stopAudio]);

  const toggle = useCallback(() => {
    if (!tracks.length) return;
    if (playing) {
      clearInterval(intervalRef.current!);
      stopAudio();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    setStarted(true);
    const t = tracks[trackIdx];
    const isLast = trackIdx === tracks.length - 1;
    playMelody(t);
    intervalRef.current = setInterval(() => {
      const next = posRef.current + 0.25;
      if (next >= t.dur) {
        clearInterval(intervalRef.current!);
        stopAudio();
        posRef.current = 0;
        setPos(0);
        setPlaying(false);
        // 마지막 트랙까지 다 들었다면 테이프가 끝난 것 = 슬라이드 완료
        if (isLast) complete();
        return;
      }
      posRef.current = next;
      setPos(next);
    }, 250);
  }, [playing, tracks, trackIdx, playMelody, stopAudio, complete]);

  const switchTrack = useCallback((dir: number) => {
    clearInterval(intervalRef.current!);
    stopAudio();
    const n = tracks.length;
    const next = (trackIdx + dir + n) % n;
    const wasPlaying = playing;
    setTrackIdx(next);
    posRef.current = 0;
    setPos(0);
    setPlaying(false);
    if (wasPlaying) {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = setTimeout(() => toggle(), 50);
    }
  }, [tracks, trackIdx, playing, stopAudio, toggle]);

  useEffect(() => () => {
    clearInterval(intervalRef.current!);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    stopAudio();
  }, [stopAudio]);

  if (!tracks.length) return null;
  const t = tracks[trackIdx];
  const progress = Math.min(100, (pos / t.dur) * 100) + "%";

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", background: backgroundColor, padding: "44px 24px 30px" }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: "#FFD97D", letterSpacing: ".1em", margin: "0 0 20px" }}>◦ MIX TAPE FOR YOU ◦</p>
      <div style={{ width: "100%", background: `linear-gradient(160deg,${tapeColor},#e0d3b8)`, borderRadius: 14, padding: "20px 18px", boxShadow: "0 12px 30px rgba(0,0,0,.35)", border: "2px solid rgba(0,0,0,.12)" }}>
        <div style={{ background: "#2a2420", borderRadius: 8, padding: "20px 18px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 8, border: "1px solid rgba(255,255,255,.08)", borderRadius: 5, pointerEvents: "none" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 6px" }}>
            {[0, 1].map((side) => (
              <div key={side} style={{ animation: playing ? "jc-spin 2.4s linear infinite" : "none" }}>
                <svg width="72" height="72" viewBox="0 0 72 72">
                  <circle cx="36" cy="36" r="34" fill="#1a1512" stroke="#4a3f36" strokeWidth="2" />
                  <circle cx="36" cy="36" r="12" fill="#3a322b" />
                  <g fill="#5a4d40">
                    <rect x="34" y="6" width="4" height="14" rx="2" />
                    <rect x="34" y="52" width="4" height="14" rx="2" />
                    <rect x="6" y="34" width="14" height="4" rx="2" />
                    <rect x="52" y="34" width="14" height="4" rx="2" />
                  </g>
                </svg>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 12, textAlign: "center", fontFamily: "'Gaegu',cursive" }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: "#3a2e28", margin: 0 }}>{t.title}</p>
          <p style={{ fontSize: 13, color: "#8a7862", margin: "2px 0 0" }}>{t.artist}</p>
        </div>
      </div>
      <div style={{ width: "100%", marginTop: 22 }}>
        <div style={{ height: 5, borderRadius: 5, background: "rgba(255,255,255,.14)", overflow: "hidden" }}>
          <div style={{ height: "100%", background: "#FFD97D", borderRadius: 5, width: progress, transition: "width .2s linear" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "#b0a290" }}>
          <span>{fmt(pos)}</span><span>{fmt(t.dur)}</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 22, marginTop: 24 }}>
        <button onClick={() => switchTrack(-1)} style={{ background: "none", border: "none", color: "#c9b89a", fontSize: 22, cursor: "pointer" }}>⏮</button>
        <button onClick={toggle} style={{ width: 66, height: 66, borderRadius: "50%", border: "none", background: "#FFD97D", color: "#2a201a", fontSize: 26, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 20px rgba(255,217,125,.35)" }}>
          {playing ? "❚❚" : "▶"}
        </button>
        <button onClick={() => switchTrack(1)} style={{ background: "none", border: "none", color: "#c9b89a", fontSize: 22, cursor: "pointer" }}>⏭</button>
      </div>
      <p style={{ fontSize: 12, color: "#8a7862", margin: "auto 0 0", textAlign: "center", lineHeight: 1.5, whiteSpace: "pre-line" }}>{note}</p>

      {/* 테이프는 스스로 끝나기까지 오래 걸린다 — 한 번 들어본 뒤에는 직접 넘어갈 수 있게 한다 */}
      {started && (
        <button onClick={complete} style={{ marginTop: 14, padding: "10px 26px", borderRadius: 14, border: "1px solid rgba(255,217,125,.45)", background: "rgba(255,217,125,.12)", color: "#FFD97D", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          다음으로 →
        </button>
      )}
    </div>
  );
}
