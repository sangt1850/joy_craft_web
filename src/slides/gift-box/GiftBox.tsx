import { useState, useRef, useCallback } from "react";
import type { SlideProps } from "../SlideProps";
import { useVibrate } from "../useVibrate";
import { useAudio } from "../useAudio";
import { useSlideTimeout } from "../useSlideTimeout";

interface GiftBoxData {
  insideMessage: string;
  hint: string;
  boxColor: string;
  ribbonColor: string;
  backgroundColor: string;
}

const PULL_DIST = 130;
const CONFETTI_COLORS = ["#E94F6A", "#FFD97D", "#7EC8B1", "#F4A7C0", "#A78BCE", "#ff9a5c"];

export default function GiftBox({ data, onComplete, isPreview }: SlideProps<GiftBoxData>) {
  const { insideMessage, hint, boxColor, ribbonColor, backgroundColor } = data;
  const vibe = useVibrate();
  const { blip } = useAudio();
  const later = useSlideTimeout();

  const [pull, setPull] = useState(0);
  const [opened, setOpened] = useState(false);
  const [dragging, setDragging] = useState(false);
  const startYRef = useRef(0);
  const dragRef = useRef(false);

  const confetti = opened ? Array.from({ length: 26 }, (_, i) => {
    const ang = Math.random() * Math.PI * 2, dist = 90 + Math.random() * 150;
    return { id: i, tx: Math.cos(ang) * dist, ty: Math.sin(ang) * dist - 40, rot: Math.random() * 720 - 360, color: CONFETTI_COLORS[i % CONFETTI_COLORS.length], w: 6 + Math.random() * 6, h: 9 + Math.random() * 7, delay: Math.random() * 0.1, dur: 0.9 + Math.random() * 0.7 };
  }) : [];

  const open = useCallback(() => {
    dragRef.current = false;
    vibe([12, 40, 12, 40, 90]);
    blip(360, 0.3, "sine", 0.1);
    setOpened(true);
    setDragging(false);
    setPull(1);
    if (!isPreview) later(() => onComplete?.(), 2000);
  }, [vibe, blip, isPreview, onComplete, later]);

  const onDown = useCallback((e: React.PointerEvent) => {
    if (opened) return;
    startYRef.current = e.clientY;
    dragRef.current = true;
    setDragging(true);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
  }, [opened]);

  const onMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current || opened) return;
    const d = Math.max(0, e.clientY - startYRef.current);
    const p = Math.min(1, d / PULL_DIST);
    setPull(p);
    if (p >= 1) open();
  }, [opened, open]);

  const onUp = useCallback(() => {
    if (!opened) { setPull(0); setDragging(false); }
    dragRef.current = false;
  }, [opened]);

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: `linear-gradient(165deg,${backgroundColor},#ffe4d6)`, padding: "40px 26px", overflow: "hidden" }}>
      {/* 컨페티 */}
      {opened && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
          {confetti.map((cf) => (
            <div key={cf.id} style={{ position: "absolute", left: "50%", top: "46%", width: cf.w, height: cf.h, background: cf.color, borderRadius: 2, ["--tx" as string]: cf.tx + "px", ["--ty" as string]: cf.ty + "px", ["--rot" as string]: cf.rot + "deg", animation: `jc-burst ${cf.dur}s cubic-bezier(.2,.7,.3,1) ${cf.delay}s forwards` }} />
          ))}
        </div>
      )}

      <p style={{ fontSize: 15, fontWeight: 600, color: "#c07a8a", margin: 0, paddingTop: 6, minHeight: 22, textAlign: "center" }}>{opened ? "" : hint}</p>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
        <div style={{ position: "relative", width: 210, height: 230 }}>
          {/* 내용물 */}
          <div style={{ position: "absolute", left: "50%", bottom: 96, transform: opened ? "translateX(-50%) scale(1)" : "translateX(-50%) scale(.5)", transformOrigin: "center bottom", opacity: opened ? 1 : 0, transition: "transform .5s cubic-bezier(.34,1.56,.64,1) .18s, opacity .4s .18s", zIndex: 1, display: "flex", justifyContent: "center" }}>
            <div style={{ width: 150, background: "#fff", borderRadius: 16, padding: "20px 18px", textAlign: "center", boxShadow: "0 12px 30px rgba(0,0,0,.16)" }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>💝</div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#2A2320", lineHeight: 1.5, margin: 0, whiteSpace: "pre-line" }}>{insideMessage}</p>
            </div>
          </div>

          {/* 뚜껑 */}
          <div style={{ position: "absolute", left: "50%", bottom: 150, transformOrigin: "center bottom", zIndex: 3, transform: opened ? "translateX(-50%) translateY(-150px) rotate(-16deg)" : `translateX(-50%) translateY(${-pull * 8}px) rotate(${pull * 3}deg)`, opacity: opened ? 0 : 1, transition: dragging ? "none" : "transform .6s cubic-bezier(.34,1.56,.64,1), opacity .5s" }}>
            <div style={{ width: 190, height: 44, background: boxColor, borderRadius: "10px 10px 4px 4px", position: "relative", boxShadow: "0 4px 10px rgba(0,0,0,.15)" }}>
              <div style={{ position: "absolute", left: "50%", top: 0, transform: "translateX(-50%)", width: 26, height: "100%", background: ribbonColor }} />
            </div>
          </div>

          {/* 박스 */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "center", transformOrigin: "center bottom", animation: (!opened && !dragging) ? "jc-boxwiggle 2.2s ease-in-out infinite" : "none", zIndex: 2 }}>
            <div style={{ width: 170, height: 150, background: `color-mix(in srgb, ${boxColor} 90%, black)`, borderRadius: "6px 6px 12px 12px", position: "relative", boxShadow: "inset 0 -14px 24px rgba(0,0,0,.12)" }}>
              <div style={{ position: "absolute", left: "50%", top: 0, transform: "translateX(-50%)", width: 26, height: "100%", background: ribbonColor }} />
            </div>
          </div>

          {/* 리본 (드래그 핸들) */}
          {!opened && (
            <div
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerLeave={onUp}
              style={{ position: "absolute", left: 0, right: 0, bottom: 168, display: "flex", justifyContent: "center", transform: `translateY(${pull * PULL_DIST * 0.9}px)`, cursor: "grab", touchAction: "none", zIndex: 6, transition: dragging ? "none" : "transform .3s" }}
            >
              <svg width="52" height="60" viewBox="0 0 52 60">
                <path d="M26 6 C10 6 6 30 26 30 C46 30 42 6 26 6 Z" fill={ribbonColor} />
                <path d="M22 28 L14 58 L26 48 L38 58 L30 28 Z" fill="#ffcf5e" />
                <circle cx="26" cy="18" r="7" fill="#f3d98a" />
              </svg>
            </div>
          )}
        </div>
      </div>

      <div style={{ minHeight: 24, paddingBottom: 6 }}>
        {opened && (
          <div style={{ fontSize: 13, color: boxColor, background: "#fff", padding: "8px 18px", borderRadius: 20, fontWeight: 700, animation: "jc-fadeup .5s", boxShadow: "0 4px 12px rgba(233,79,106,.15)" }}>✓ 열었어요 · 다음 페이지로</div>
        )}
      </div>
    </div>
  );
}
