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
    background: "#fff",
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
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: `linear-gradient(${backgroundColor} 0%,#14203f 45%,#243a5e 100%)` }}>
      {/* 별 배경 */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {STARS.map((s) => <div key={s.id} style={s.style} />)}
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 90, background: "linear-gradient(transparent,#050814)" }} />

      {/* 날아가는 등불 */}
      {launched && (
        <div style={{ position: "absolute", left: "50%", bottom: 120, ["--drift" as string]: drift, animation: "jc-lanternfloat 5s ease-in forwards", pointerEvents: "none" }}>
          <div style={{ position: "relative", width: 56, height: 72 }}>
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(${lanternColor},#e8582f)`, borderRadius: "10px 10px 16px 16px", boxShadow: `0 0 22px ${lanternColor}cc` }} />
            <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: 22, height: 10, background: "#ffdf8a", borderRadius: "0 0 6px 6px", boxShadow: "0 0 14px #ffcf6a" }} />
          </div>
        </div>
      )}

      {/* 타이틀 */}
      <div style={{ position: "absolute", top: 44, left: 0, right: 0, textAlign: "center", padding: "0 26px" }}>
        <p style={{ fontFamily: "'Nanum Pen Script',cursive", fontSize: 34, color: "#ffe9c2", margin: 0 }}>소원 등불</p>
        <p style={{ fontSize: 13, color: "#a9c0e0", margin: "6px 0 0" }}>{prompt}</p>
      </div>

      {!launched ? (
        <div style={{ position: "absolute", left: 26, right: 26, bottom: 34, display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
          {/* 등불 + 입력 */}
          <div style={{ position: "relative", width: 110, height: 140, animation: "jc-glow 2.2s ease-in-out infinite" }}>
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(${lanternColor},#e8582f)`, borderRadius: "16px 16px 26px 26px" }} />
            <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: 40, height: 18, background: "#ffe08a", borderRadius: "0 0 10px 10px" }} />
            <textarea
              value={wish}
              onChange={(e) => setWish(e.target.value)}
              placeholder="소원을 적어보세요..."
              maxLength={40}
              style={{ position: "absolute", inset: "14px 12px 26px", border: "none", background: "rgba(255,255,255,.16)", borderRadius: 10, resize: "none", color: "#fff", fontFamily: "'Gaegu',cursive", fontSize: 15, textAlign: "center", padding: 8, outline: "none" }}
            />
          </div>

          {/* 홀드 버튼 */}
          <button
            onPointerDown={down}
            onPointerUp={up}
            onPointerLeave={up}
            style={{ position: "relative", overflow: "hidden", width: "100%", padding: 17, borderRadius: 16, border: "none", background: "#3a2e52", color: "#ffe9c2", fontSize: 16, fontWeight: 700, cursor: "pointer", touchAction: "none", boxShadow: "0 8px 20px rgba(0,0,0,.3)" }}
          >
            <span style={{ position: "relative", zIndex: 2 }}>{holding ? "길게 누르는 중..." : "꾹 눌러서 띄우기"}</span>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: (progress * 100) + "%", background: `linear-gradient(90deg,${lanternColor},#ffd97d)`, zIndex: 1, transition: holding ? "none" : "width .2s", opacity: 0.9 }} />
          </button>
        </div>
      ) : (
        <div style={{ position: "absolute", left: 26, right: 26, bottom: 44, textAlign: "center", animation: "jc-fadeup .6s" }}>
          <p style={{ fontFamily: "'Nanum Pen Script',cursive", fontSize: 28, color: "#ffe9c2", margin: "0 0 16px", lineHeight: 1.4, whiteSpace: "pre-line" }}>{doneMsg}</p>
          <button onClick={doReset} style={{ padding: "12px 26px", borderRadius: 12, border: "1px solid rgba(255,255,255,.3)", background: "rgba(255,255,255,.1)", color: "#ffe9c2", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>새 소원 띄우기</button>
        </div>
      )}
    </div>
  );
}
