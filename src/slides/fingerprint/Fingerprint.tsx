import { useCallback } from "react";
import type { SlideProps } from "../SlideProps";
import { useVibrate } from "../useVibrate";
import { useHoldProgress } from "../useHoldProgress";
import { useSlideTimeout } from "../useSlideTimeout";

interface FingerprintData {
  prompt: string;
  successMessage: string;
  holdDuration: number;
  ringColor: string;
}

export default function Fingerprint({ data, onComplete, isPreview }: SlideProps<FingerprintData>) {
  const { prompt, successMessage, holdDuration, ringColor } = data;
  const vibe = useVibrate();
  const later = useSlideTimeout();

  const handleComplete = useCallback(() => {
    vibe([15, 40, 15, 40, 90]);
    if (!isPreview) later(() => onComplete?.(), 1500);
  }, [vibe, isPreview, onComplete, later]);

  const { progress, holding, down, up } = useHoldProgress(holdDuration, handleComplete);

  const authed = progress >= 1;
  const failed = !holding && progress > 0 && progress < 1;

  const currentRingColor = failed ? "#FF4757" : ringColor;
  const dashOffset = 578 * (1 - progress);

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#1A1A1A", fontFamily: "'Space Grotesk', sans-serif", color: "#FDF2E9", padding: "40px 26px", userSelect: "none" }}>
      <p style={{ fontSize: 17, fontWeight: 700, textAlign: "center", color: "#FDF2E9", margin: "0 0 48px", lineHeight: 1.5, whiteSpace: "pre-line" }}>{prompt}</p>

      <div
        onPointerDown={down}
        onPointerUp={up}
        onPointerLeave={up}
        onPointerCancel={up}
        style={{ position: "relative", width: 220, height: 220, display: "flex", alignItems: "center", justifyContent: "center", touchAction: "none", cursor: "pointer" }}
      >
        <svg width="220" height="220" viewBox="0 0 220 220" style={{ position: "absolute", inset: 0 }}>
          <circle cx="110" cy="110" r="92" fill="none" stroke="#333333" strokeWidth="10" />
          <circle cx="110" cy="110" r="92" fill="none" stroke={currentRingColor} strokeWidth="10" strokeLinecap="round"
            strokeDasharray="578" transform="rotate(-90 110 110)"
            style={{ strokeDashoffset: dashOffset, transition: holding ? "none" : "stroke-dashoffset .1s" }} />
        </svg>
        <div style={{ position: "relative", width: 132, height: 132, borderRadius: 8, background: "#2a2a2a", border: "2px solid #1A1A1A", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", boxShadow: "4px 4px 0 #000" }}>
          <svg width="86" height="104" viewBox="0 0 100 120" fill="none" strokeWidth="3.2" strokeLinecap="round"
            style={{ stroke: failed ? "#FF4757" : (progress > 0.02 ? ringColor : "#555"), fill: "none", transition: "stroke .2s" }}>
            <path d="M18 62 a32 30 0 0 1 64 0" /><path d="M18 62 a32 40 0 0 0 64 2" />
            <path d="M27 62 a23 22 0 0 1 46 0" /><path d="M27 62 a23 30 0 0 0 46 2" />
            <path d="M36 62 a14 14 0 0 1 28 0" /><path d="M36 62 a14 20 0 0 0 28 2" />
            <path d="M45 62 a5 6 0 0 1 10 0" /><path d="M50 40 V96" />
          </svg>
          {holding && (
            <div style={{ position: "absolute", left: "8%", right: "8%", top: "6%", height: 3, borderRadius: 3, background: `linear-gradient(90deg,transparent,${ringColor},transparent)`, boxShadow: `0 0 12px ${ringColor}`, animation: "jc-scan .9s ease-in-out infinite alternate" }} />
          )}
        </div>
      </div>

      <p style={{ fontSize: 14, color: failed ? "#FF4757" : "#888", margin: "44px 0 0", fontWeight: 700, minHeight: 20 }}>
        {failed ? "조금 더 눌러주세요" : holding ? "인증 중..." : "동그라미를 길게 눌러주세요"}
      </p>

      {authed && (
        <div style={{ position: "absolute", inset: 0, background: "#1A1A1A", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 26, animation: "jc-fadeup .4s" }}>
          <div style={{ width: 96, height: 96, borderRadius: 8, background: "#4ECDC4", border: "2px solid #1A1A1A", display: "flex", alignItems: "center", justifyContent: "center", animation: "jc-pop .5s", boxShadow: "6px 6px 0 #1A1A1A" }}>
            <svg width="46" height="46" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#1A1A1A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <p style={{ whiteSpace: "pre-line", textAlign: "center", fontSize: 18, lineHeight: 1.55, color: "#FDF2E9", margin: 0, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>{successMessage}</p>
        </div>
      )}
    </div>
  );
}
