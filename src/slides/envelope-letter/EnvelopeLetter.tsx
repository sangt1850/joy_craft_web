import { useState, useCallback } from "react";
import type { SlideProps } from "../SlideProps";
import { useVibrate } from "../useVibrate";
import { useAudio } from "../useAudio";
import { useSlideTimeout } from "../useSlideTimeout";

interface EnvelopeLetterData {
  letterBody: string;
  hint: string;
  envelopeColor: string;
  sealColor: string;
  backgroundColor: string;
}

export default function EnvelopeLetter({ data, onComplete, isPreview }: SlideProps<EnvelopeLetterData>) {
  const { letterBody, hint, envelopeColor, sealColor, backgroundColor } = data;
  const vibe = useVibrate();
  const { blip } = useAudio();
  const later = useSlideTimeout();
  const [opened, setOpened] = useState(false);

  const open = useCallback(() => {
    if (opened) return;
    vibe([12, 40, 70]);
    blip(360, 0.12, "sine", 0.1);
    setOpened(true);
    if (!isPreview) later(() => onComplete?.(), 1800);
  }, [opened, vibe, blip, isPreview, onComplete, later]);

  const reset = useCallback(() => setOpened(false), []);

  // 봉투 색상 어두운 버전
  const darkEnv = envelopeColor.replace(/^#/, "");
  const r = Math.max(0, parseInt(darkEnv.slice(0, 2), 16) - 20).toString(16).padStart(2, "0");
  const g2 = Math.max(0, parseInt(darkEnv.slice(2, 4), 16) - 20).toString(16).padStart(2, "0");
  const b2 = Math.max(0, parseInt(darkEnv.slice(4, 6), 16) - 20).toString(16).padStart(2, "0");
  const darkColor = `#${r}${g2}${b2}`;

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: `linear-gradient(165deg,${backgroundColor},#e8dcc8)`, padding: "40px 26px" }}>
      <p style={{ fontSize: 15, fontWeight: 600, color: "#a68b6a", margin: "0 0 auto", paddingTop: 6, minHeight: 22, textAlign: "center" }}>{opened ? "" : hint}</p>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
        <div onClick={open} style={{ position: "relative", width: 280, height: 190, cursor: opened ? "default" : "pointer" }}>
          {/* 봉투 본체 */}
          <div style={{ position: "absolute", inset: 0, background: "#fdfaf3", borderRadius: 8, boxShadow: "0 10px 26px rgba(90,70,40,.2)" }} />
          {/* 편지 내용 */}
          <div style={{ position: "absolute", left: "50%", bottom: 10, transform: opened ? "translateX(-50%) translateY(-96px)" : "translateX(-50%) translateY(0)", opacity: opened ? 1 : 0, transition: opened ? "transform .6s cubic-bezier(.34,1.4,.64,1) .35s, opacity .3s .35s" : "transform .3s, opacity .2s", zIndex: 4, display: "flex", justifyContent: "center", width: "100%" }}>
            <div style={{ width: 240, background: "#fff", borderRadius: 6, padding: "22px 20px", boxShadow: "0 8px 20px rgba(0,0,0,.14)", textAlign: "center" }}>
              <p style={{ fontFamily: "'Nanum Pen Script',cursive", fontSize: 23, color: "#2A2320", lineHeight: 1.5, margin: 0, whiteSpace: "pre-line" }}>{letterBody}</p>
            </div>
          </div>
          {/* 봉투 하단 */}
          <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: 118, background: `linear-gradient(160deg,${envelopeColor},${darkColor})`, borderRadius: "0 0 8px 8px", zIndex: 3, overflow: "hidden" }}>
            <div style={{ position: "absolute", bottom: 0, left: 0, width: "50%", height: "100%", background: `linear-gradient(120deg,${envelopeColor},${darkColor})`, clipPath: "polygon(0 0,100% 100%,0 100%)" }} />
            <div style={{ position: "absolute", bottom: 0, right: 0, width: "50%", height: "100%", background: `linear-gradient(240deg,${envelopeColor},${darkColor})`, clipPath: "polygon(100% 0,100% 100%,0 100%)" }} />
          </div>
          {/* 봉투 뚜껑 (접히는 부분) */}
          <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 92, transformOrigin: "top center", zIndex: opened ? 2 : 6, transform: opened ? "rotateX(-172deg)" : "rotateX(0deg)", transition: "transform .7s ease, z-index 0s .35s", transformStyle: "preserve-3d" }}>
            <div style={{ width: "100%", height: "100%", background: `linear-gradient(160deg,${envelopeColor},${darkColor})`, clipPath: "polygon(0 0,100% 0,50% 92%)" }} />
            {/* 봉랍 */}
            <div style={{ position: "absolute", top: "44%", left: "50%", transform: "translate(-50%,-50%)", width: 34, height: 34, borderRadius: "50%", background: sealColor, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 2px 6px rgba(0,0,0,.2)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div style={{ margin: "auto 0 6px", minHeight: 24 }}>
        {opened && (
          <button onClick={reset} style={{ padding: "9px 22px", borderRadius: 12, border: `1px solid ${envelopeColor}`, background: "#fff", color: "#a68b6a", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>봉투 다시 닫기</button>
        )}
      </div>
    </div>
  );
}
