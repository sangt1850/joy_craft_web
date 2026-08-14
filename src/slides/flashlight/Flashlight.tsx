import { useState, useMemo, useCallback } from "react";
import type { SlideProps } from "../SlideProps";
import { useVibrate } from "../useVibrate";

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
    setFound((prev) => {
      const next = [...prev];
      let changed = false;
      spots.forEach((sp, i) => {
        if (next[i]) return;
        const dx = x - sp.x * r.width, dy = y - sp.y * r.height;
        if (Math.hypot(dx, dy) < 66) { next[i] = true; changed = true; vibe(20); }
      });
      if (changed && next.every(Boolean)) {
        vibe([12, 40, 12, 40, 90]);
        setClear(true);
        if (!isPreview) setTimeout(() => onComplete?.(), 1500);
      }
      return changed ? next : prev;
    });
    setBeam({ x, y, on: true });
  }, [clear, spots, vibe, isPreview, onComplete]);

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
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", background: backgroundColor, padding: "52px 22px 30px" }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: "#FFD97D", background: "rgba(255,217,125,.12)", padding: "6px 14px", borderRadius: 20, margin: "0 0 6px" }}>{foundCount} / {spots.length} 발견</p>
      <p style={{ fontSize: 16, fontWeight: 600, color: "#c9d4e0", margin: "6px 0 20px", textAlign: "center" }}>{instruction}</p>

      <div
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        style={{ position: "relative", width: 320, height: 470, borderRadius: 22, overflow: "hidden", touchAction: "none", cursor: "crosshair", background: "radial-gradient(circle at 22% 26%,#3a4a6a 0 15%,transparent 34%),radial-gradient(circle at 78% 30%,#5a3a5a 0 14%,transparent 32%),radial-gradient(circle at 32% 74%,#3a5a4a 0 16%,transparent 34%),radial-gradient(circle at 74% 70%,#4a3a6a 0 15%,transparent 33%),linear-gradient(150deg,#1a2030,#241a2e)" }}
      >
        {spots.map((sp, i) => (
          <div key={i} style={{ position: "absolute", left: `${sp.x * 100}%`, top: `${sp.y * 100}%`, transform: "translate(-50%,-50%)", display: "flex", flexDirection: "column", alignItems: "center", pointerEvents: "none", zIndex: 2 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, background: found[i] ? "#fff" : "rgba(255,255,255,.06)", boxShadow: found[i] ? "0 0 22px rgba(255,217,125,.8)" : "none", filter: found[i] ? "none" : "grayscale(1) opacity(.35)", transition: "all .3s", animation: found[i] ? "jc-sparkle .5s" : "none" }}>
              {sp.emoji}
            </div>
            {found[i] && (
              <div style={{ fontSize: 11, color: "#fff", fontWeight: 600, marginTop: 4, background: "rgba(0,0,0,.4)", padding: "2px 8px", borderRadius: 10, whiteSpace: "nowrap" }}>{sp.caption}</div>
            )}
          </div>
        ))}
        <div style={maskStyle} />
      </div>

      <p style={{ fontSize: 13, color: "#7c8a99", margin: "16px 0 0", minHeight: 18 }}>손가락 위쪽이 밝아져요 · 숨은 추억을 모두 찾아보세요</p>

      {clear && (
        <div style={{ position: "absolute", inset: 0, zIndex: 10, background: "linear-gradient(165deg,#141b2e,#20304a)", display: "flex", flexDirection: "column", padding: "56px 26px 34px", animation: "jc-fadeup .4s" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#FFD97D", textAlign: "center", margin: "0 0 20px", letterSpacing: ".03em" }}>✨ 찾은 추억 {foundCount} / {spots.length}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {spots.map((sp, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 16, padding: "12px 16px", animation: "jc-fadeup .4s both" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, boxShadow: "0 0 16px rgba(255,217,125,.6)" }}>{sp.emoji}</div>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{sp.caption}</span>
                <span style={{ marginLeft: "auto", color: "#4ade80", fontSize: 18 }}>✓</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <p style={{ whiteSpace: "pre-line", fontSize: 19, fontWeight: 700, color: "#fff", lineHeight: 1.5, margin: 0, textAlign: "center" }}>{clearText}</p>
            <button onClick={retry} style={{ width: "100%", padding: 15, borderRadius: 14, border: "none", background: "#E94F6A", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 20px rgba(233,79,106,.35)" }}>다시 찾기</button>
          </div>
        </div>
      )}
    </div>
  );
}
