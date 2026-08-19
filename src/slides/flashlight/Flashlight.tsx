import { useState, useMemo, useCallback } from "react";
import type { SlideProps } from "../SlideProps";
import { useVibrate } from "../useVibrate";
import { useSlideTimeout } from "../useSlideTimeout";

interface Spot { x: number; y: number; emoji: string; caption: string; }

interface FlashlightData {
  instruction: string;
  clearText: string;
  spots: string | Spot[];
  backgroundColor: string;
}

export default function Flashlight({ data, onComplete, isPreview }: SlideProps<FlashlightData>) {
  const { instruction, clearText, backgroundColor } = data;
  const vibe = useVibrate();
  const later = useSlideTimeout();

  const spots = useMemo<Spot[]>(() => {
    if (Array.isArray(data.spots)) return data.spots;
    try { return JSON.parse(data.spots as string); } catch { return []; }
  }, [data.spots]);

  const [found, setFound] = useState<boolean[]>(() => spots.map(() => false));
  const [beam, setBeam] = useState({ x: 160, y: 235, on: false });
  const [clear, setClear] = useState(false);

  const handleMove = useCallback((e: React.PointerEvent) => {
    if (clear) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left;
    const yoff = e.pointerType === "touch" ? 56 : 0;
    const y = e.clientY - r.top - yoff;
    const next = [...found];
    let changed = false;
    spots.forEach((sp, i) => {
      if (next[i]) return;
      const dx = x - sp.x * r.width, dy = y - sp.y * r.height;
      if (Math.hypot(dx, dy) < 66) { next[i] = true; changed = true; }
    });

    if (changed) {
      vibe(20);
      setFound(next);
      if (next.every(Boolean)) {
        vibe([12, 40, 12, 40, 90]);
        setClear(true);
        if (!isPreview) later(() => onComplete?.(), 1500);
      }
    }
    setBeam({ x, y, on: true });
  }, [clear, found, spots, vibe, isPreview, onComplete, later]);

  const handleLeave = useCallback(() => {
    setBeam((b) => ({ ...b, on: false }));
  }, []);

  const retry = useCallback(() => {
    setFound(spots.map(() => false));
    setClear(false);
    setBeam({ x: 160, y: 235, on: false });
  }, [spots]);

  const foundCount = found.filter(Boolean).length;
  const BEAM_R = 150;
  const maskStyle: React.CSSProperties = {
    position: "absolute", inset: 0, pointerEvents: "none", zIndex: 3,
    transition: clear ? "opacity .6s" : "none",
    opacity: clear ? 0 : 1,
    background: beam.on
      ? `radial-gradient(circle ${BEAM_R}px at ${beam.x}px ${beam.y}px, rgba(6,9,14,0) 0, rgba(6,9,14,0) ${BEAM_R * 0.5}px, rgba(6,9,14,.9) ${BEAM_R}px, rgba(6,9,14,.98) 100%)`
      : "rgba(6,9,14,.97)",
  };

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", background: backgroundColor, fontFamily: "'Space Grotesk', sans-serif", padding: "52px 22px 30px" }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", background: "#FFE66D", padding: "4px 12px", borderRadius: 6, border: "2px solid #1A1A1A", boxShadow: "2px 2px 0 #1A1A1A", margin: "0 0 6px" }}>{foundCount} / {spots.length} 발견</span>
      <p style={{ fontSize: 16, fontWeight: 700, color: "#FDF2E9", margin: "6px 0 20px", textAlign: "center" }}>{instruction}</p>

      <div
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        style={{ position: "relative", width: 320, height: 470, borderRadius: 8, overflow: "hidden", touchAction: "none", cursor: "crosshair", border: "2px solid #1A1A1A", boxShadow: "6px 6px 0 #1A1A1A", background: "radial-gradient(circle at 22% 26%,#3a4a6a 0 15%,transparent 34%),radial-gradient(circle at 78% 30%,#5a3a5a 0 14%,transparent 32%),radial-gradient(circle at 32% 74%,#3a5a4a 0 16%,transparent 34%),radial-gradient(circle at 74% 70%,#4a3a6a 0 15%,transparent 33%),linear-gradient(150deg,#1a2030,#241a2e)" }}
      >
        {spots.map((sp, i) => (
          <div key={i} style={{ position: "absolute", left: `${sp.x * 100}%`, top: `${sp.y * 100}%`, transform: "translate(-50%,-50%)", display: "flex", flexDirection: "column", alignItems: "center", pointerEvents: "none", zIndex: 2 }}>
            <div style={{ width: 52, height: 52, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, background: found[i] ? "#FDF2E9" : "rgba(255,255,255,.06)", border: found[i] ? "2px solid #1A1A1A" : "none", boxShadow: found[i] ? "3px 3px 0 #1A1A1A" : "none", filter: found[i] ? "none" : "grayscale(1) opacity(.35)", transition: "all .3s", animation: found[i] ? "jc-sparkle .5s" : "none" }}>
              {sp.emoji}
            </div>
            {found[i] && (
              <div style={{ fontSize: 11, color: "#1A1A1A", fontWeight: 700, marginTop: 4, background: "#FFE66D", padding: "2px 8px", borderRadius: 6, border: "2px solid #1A1A1A", whiteSpace: "nowrap" }}>{sp.caption}</div>
            )}
          </div>
        ))}
        <div style={maskStyle} />
      </div>

      <p style={{ fontSize: 13, color: "#888", fontWeight: 700, margin: "16px 0 0", minHeight: 18 }}>손가락 위쪽이 밝아져요 · 숨은 추억을 모두 찾아보세요</p>

      {clear && (
        <div style={{ position: "absolute", inset: 0, zIndex: 10, background: "#1A1A1A", display: "flex", flexDirection: "column", padding: "56px 26px 34px", animation: "jc-fadeup .4s", fontFamily: "'Space Grotesk', sans-serif" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", background: "#FFE66D", border: "2px solid #1A1A1A", borderRadius: 6, padding: "4px 12px", boxShadow: "2px 2px 0 #1A1A1A", textAlign: "center", margin: "0 0 20px", display: "inline-block", alignSelf: "center" }}>찾은 추억 {foundCount} / {spots.length}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {spots.map((sp, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, background: "#FDF2E9", border: "2px solid #1A1A1A", borderRadius: 8, padding: "12px 16px", boxShadow: "4px 4px 0 #1A1A1A", animation: "jc-fadeup .4s both" }}>
                <div style={{ width: 44, height: 44, borderRadius: 8, background: "#FFE66D", border: "2px solid #1A1A1A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, boxShadow: "2px 2px 0 #1A1A1A" }}>{sp.emoji}</div>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A" }}>{sp.caption}</span>
                <span style={{ marginLeft: "auto", color: "#4ECDC4", fontSize: 18, fontWeight: 700 }}>✓</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <p style={{ whiteSpace: "pre-line", fontSize: 19, fontWeight: 700, color: "#FDF2E9", lineHeight: 1.5, margin: 0, textAlign: "center" }}>{clearText}</p>
            <button onClick={retry} style={{ width: "100%", padding: 15, borderRadius: 8, border: "2px solid #1A1A1A", background: "#FF6B6B", color: "#1A1A1A", fontSize: 16, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", cursor: "pointer", boxShadow: "4px 4px 0 #1A1A1A" }}>다시 찾기</button>
          </div>
        </div>
      )}
    </div>
  );
}
