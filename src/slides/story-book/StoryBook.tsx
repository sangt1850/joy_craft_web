import { useState, useMemo, useCallback, useRef } from "react";
import type { SlideProps } from "../SlideProps";
import { useVibrate } from "../useVibrate";
import { useAudio } from "../useAudio";
import { useSlideTimeout } from "../useSlideTimeout";

interface Page { emoji: string; title: string; text: string; bgColor: string; }

interface StoryBookData {
  pages: string | Page[];
  footerText: string;
  backgroundColor: string;
}

export default function StoryBook({ data, onComplete, isPreview }: SlideProps<StoryBookData>) {
  const { footerText, backgroundColor } = data;
  const vibe = useVibrate();
  const { blip } = useAudio();
  const later = useSlideTimeout();

  const pages = useMemo<Page[]>(() => {
    if (Array.isArray(data.pages)) return data.pages;
    try { return JSON.parse(data.pages as string); } catch { return []; }
  }, [data.pages]);

  const [pageIdx, setPageIdx] = useState(0);
  const [flip, setFlip] = useState(0);
  const [dir, setDir] = useState(1);
  const startXRef = useRef<number | null>(null);

  const go = useCallback((d: number) => {
    const next = pageIdx + d;
    if (next < 0 || next >= pages.length) return;
    vibe(12); blip(300, 0.12, "sine", 0.06);
    setDir(d);
    setFlip(1);
    later(() => { setPageIdx(next); setFlip(0); }, 260);
    if (next === pages.length - 1 && !isPreview) {
      later(() => onComplete?.(), 1000);
    }
  }, [pageIdx, pages.length, vibe, blip, isPreview, onComplete, later]);

  const onDown = useCallback((e: React.PointerEvent) => { startXRef.current = e.clientX; }, []);
  const onUp = useCallback((e: React.PointerEvent) => {
    if (startXRef.current == null) return;
    const dx = e.clientX - startXRef.current;
    startXRef.current = null;
    if (dx < -40) go(1);
    else if (dx > 40) go(-1);
  }, [go]);

  if (!pages.length) return null;
  const ep = pages[pageIdx];
  const np = pages.length;

  const navBtn = (disabled: boolean): React.CSSProperties => ({
    width: 46, height: 46, borderRadius: 8, border: "2px solid #1A1A1A",
    cursor: disabled ? "default" : "pointer",
    background: disabled ? "#e6dcc8" : "#1A1A1A",
    color: disabled ? "#bdae94" : "#FDF2E9",
    fontSize: 24, lineHeight: "1",
    fontWeight: 700,
    boxShadow: disabled ? "none" : "3px 3px 0 #1A1A1A",
    fontFamily: "'Space Grotesk', sans-serif",
  });

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", background: backgroundColor, fontFamily: "'Space Grotesk', sans-serif", padding: "50px 22px 26px" }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", background: "#FFE66D", padding: "4px 12px", borderRadius: 6, border: "2px solid #1A1A1A", boxShadow: "2px 2px 0 #1A1A1A", letterSpacing: ".05em", margin: "0 0 16px" }}>우리의 계절 · {pageIdx + 1}/{np}</p>

      <div
        onPointerDown={onDown}
        onPointerUp={onUp}
        style={{ position: "relative", width: 300, height: 410, perspective: 1400, touchAction: "pan-y" }}
      >
        <div style={{ position: "absolute", inset: 0, transformOrigin: dir > 0 ? "left center" : "right center", transformStyle: "preserve-3d", transform: flip ? `rotateY(${dir > 0 ? -22 : 22}deg)` : "rotateY(0deg)", opacity: flip ? 0.55 : 1, transition: "transform .26s ease, opacity .26s ease" }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: 8, background: ep.bgColor, padding: "34px 28px", display: "flex", flexDirection: "column", border: "2px solid #1A1A1A", boxShadow: "6px 6px 0 #1A1A1A" }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>{ep.emoji}</div>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 700, color: "#1A1A1A", lineHeight: 1.35, margin: "0 0 14px" }}>{ep.title}</p>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 600, color: "#1A1A1A", lineHeight: 1.6, margin: 0, whiteSpace: "pre-line" }}>{ep.text}</p>
            <p style={{ marginTop: "auto", textAlign: "right", fontSize: 13, color: "#1A1A1A", fontWeight: 700 }}>- {pageIdx + 1} -</p>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 20, alignItems: "center" }}>
        <button onClick={() => go(-1)} disabled={pageIdx === 0} style={navBtn(pageIdx === 0)}>‹</button>
        <div style={{ display: "flex", gap: 6 }}>
          {pages.map((_, i) => (
            <div key={i} style={{ width: i === pageIdx ? 18 : 7, height: 7, borderRadius: 4, background: i === pageIdx ? "#1A1A1A" : "#ccc", border: "2px solid #1A1A1A", transition: "all .2s" }} />
          ))}
        </div>
        <button onClick={() => go(1)} disabled={pageIdx === np - 1} style={navBtn(pageIdx === np - 1)}>›</button>
      </div>
      <p style={{ fontSize: 12, color: "#1A1A1A", fontWeight: 700, margin: "12px 0 0" }}>{footerText}</p>
    </div>
  );
}
