import { useState, useCallback } from "react";
import type { SlideProps } from "../SlideProps";
import { useVibrate } from "../useVibrate";
import { useAudio } from "../useAudio";
import { useHoldProgress } from "../useHoldProgress";
import { useSlideTimeout } from "../useSlideTimeout";

interface WishLanternData {
  prompt: string;
  doneMessage: string;
  lanternColor: string;
  backgroundColor: string;
}

const STARS = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  style: {
    position: "absolute" as const,
    left: (i * 53 % 100) + "%",
    top: (i * 29 % 70) + "%",
    width: (i % 3 === 0 ? 3 : 2) + "px",
    height: (i % 3 === 0 ? 3 : 2) + "px",
    borderRadius: "50%",
    background: "#FFE66D",
    opacity: 0.3 + (i % 5) * 0.14,
    animation: `jc-flick ${2 + (i % 4)}s ease-in-out ${i * 0.1}s infinite`,
  },
}));

export default function WishLantern({ data, onComplete, isPreview }: SlideProps<WishLanternData>) {
  const { prompt, doneMessage, lanternColor, backgroundColor } = data;
  const vibe = useVibrate();
  const { blip } = useAudio();
  const later = useSlideTimeout();

  const [wish, setWish] = useState("");
  const [launched, setLaunched] = useState(false);
  const [drift] = useState(() => (Math.random() * 80 - 40) + "px");

  const handleComplete = useCallback(() => {
    vibe([12, 40, 12, 40, 90]);
    blip(660, 0.5, "sine", 0.1);
    setLaunched(true);
    if (!isPreview) later(() => onComplete?.(), 2500);
  }, [vibe, blip, isPreview, onComplete, later]);

  const { progress, holding, down, up, reset } = useHoldProgress(1.2, handleComplete);

  const doReset = useCallback(() => {
    reset();
    setLaunched(false);
  }, [reset]);

  const doneMsg = (wish.trim() ? `"${wish.trim()}"\n` : "") + doneMessage;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: `linear-gradient(${backgroundColor} 0%,#1A1A1A 45%,#2a2a3a 100%)`, fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* 별 배경 */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {STARS.map((s) => <div key={s.id} style={s.style} />)}
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 90, background: "linear-gradient(transparent,#050814)" }} />

      {/* 날아가는 등불 */}
      {launched && (
        <div style={{ position: "absolute", left: "50%", bottom: 120, ["--drift" as string]: drift, animation: "jc-lanternfloat 5s ease-in forwards", pointerEvents: "none" }}>
          <div style={{ position: "relative", width: 56, height: 72 }}>
            <div style={{ position: "absolute", inset: 0, background: lanternColor, borderRadius: 8, border: "2px solid #1A1A1A", boxShadow: `4px 4px 0 #1A1A1A, 0 0 22px ${lanternColor}cc` }} />
            <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: 22, height: 10, background: "#FFE66D", borderRadius: "0 0 4px 4px" }} />
          </div>
        </div>
      )}

      {/* 타이틀 */}
      <div style={{ position: "absolute", top: 44, left: 0, right: 0, textAlign: "center", padding: "0 26px" }}>
        <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 30, fontWeight: 700, color: "#FFE66D", margin: 0 }}>소원 등불</p>
        <p style={{ fontSize: 13, color: "#FDF2E9", margin: "6px 0 0", fontWeight: 700 }}>{prompt}</p>
      </div>

      {!launched ? (
        <div style={{ position: "absolute", left: 26, right: 26, bottom: 34, display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
          {/* 등불 + 입력 */}
          <div style={{ position: "relative", width: 110, height: 140, animation: "jc-glow 2.2s ease-in-out infinite" }}>
            <div style={{ position: "absolute", inset: 0, background: lanternColor, borderRadius: 8, border: "2px solid #1A1A1A", boxShadow: "4px 4px 0 #1A1A1A" }} />
            <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: 40, height: 18, background: "#FFE66D", borderRadius: "0 0 8px 8px" }} />
            <textarea
              value={wish}
              onChange={(e) => setWish(e.target.value)}
              placeholder="소원을 적어보세요..."
              maxLength={40}
              style={{ position: "absolute", inset: "14px 12px 26px", border: "2px solid #1A1A1A", background: "rgba(255,255,255,.2)", borderRadius: 8, resize: "none", color: "#FDF2E9", fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, textAlign: "center", padding: 8, outline: "none" }}
            />
          </div>

          {/* 홀드 버튼 */}
          <button
            onPointerDown={down}
            onPointerUp={up}
            onPointerLeave={up}
            style={{ position: "relative", overflow: "hidden", width: "100%", padding: 17, borderRadius: 8, border: "2px solid #1A1A1A", background: "#1A1A1A", color: "#FFE66D", fontSize: 16, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", cursor: "pointer", touchAction: "none", boxShadow: "4px 4px 0 #FFE66D" }}
          >
            <span style={{ position: "relative", zIndex: 2 }}>{holding ? "길게 누르는 중..." : "꾹 눌러서 띄우기"}</span>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: (progress * 100) + "%", background: lanternColor, zIndex: 1, transition: holding ? "none" : "width .2s", opacity: 0.9 }} />
          </button>
        </div>
      ) : (
        <div style={{ position: "absolute", left: 26, right: 26, bottom: 44, textAlign: "center", animation: "jc-fadeup .6s" }}>
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: "#FFE66D", margin: "0 0 16px", lineHeight: 1.4, whiteSpace: "pre-line" }}>{doneMsg}</p>
          <button onClick={doReset} style={{ padding: "12px 26px", borderRadius: 8, border: "2px solid #1A1A1A", background: "#FDF2E9", color: "#1A1A1A", fontSize: 14, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", cursor: "pointer", boxShadow: "4px 4px 0 #1A1A1A" }}>새 소원 띄우기</button>
        </div>
      )}
    </div>
  );
}
