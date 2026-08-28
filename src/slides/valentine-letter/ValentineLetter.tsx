import { useState, useEffect, useCallback } from "react";
import type { SlideProps } from "../SlideProps";

interface ValentineLetterData {
  envelopeHint: string;
  letterTitle: string;
  yesTitle: string;
  finalText: string;
  accentColor: string;
}

export default function ValentineLetter({ data }: SlideProps<ValentineLetterData>) {
  const { envelopeHint, letterTitle, yesTitle, finalText, accentColor } = data;

  const [phase, setPhase] = useState<0 | 1 | 2>(0);
  const [letterOpen, setLetterOpen] = useState(false);
  const [noOffset, setNoOffset] = useState({ x: 0, y: 0 });

  // Google Fonts
  useEffect(() => {
    const id = "vl-font";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400..700&display=swap";
    document.head.appendChild(link);
  }, []);

  const openEnvelope = useCallback(() => {
    setPhase(1);
    setTimeout(() => setLetterOpen(true), 50);
  }, []);

  const handleYes = useCallback(() => setPhase(2), []);

  // 도망 거리 80px — 화면 밖으로 나가지 않는 안전한 범위
  const dodgeNo = useCallback(() => {
    const angle = Math.random() * Math.PI * 2;
    const d = 80;
    setNoOffset({ x: Math.cos(angle) * d, y: Math.sin(angle) * d });
  }, []);

  const preventClick = useCallback((e: React.MouseEvent) => e.preventDefault(), []);

  const px = "'Pixelify Sans', sans-serif";

  return (
    // overflow:hidden → NO 버튼이 슬라이드 영역 밖으로 절대 넘어가지 않음
    <div style={{
      position: "absolute", inset: 0, overflow: "hidden",
      backgroundImage: "url('/vl-heart-bg.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}>

      {/* ── Phase 0: Envelope ── */}
      {phase === 0 && (
        <div onClick={openEnvelope} style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          cursor: "pointer",
        }}>
          <img
            src="/vl-envelope.png"
            alt="Envelope"
            style={{ width: "clamp(120px, 30vw, 200px)", animation: "jc-beat 1.5s ease-in-out infinite" }}
          />
          <p style={{ fontFamily: px, fontSize: "clamp(16px, 4vw, 24px)", color: accentColor, marginTop: 12 }}>
            {envelopeHint}
          </p>
        </div>
      )}

      {/* ── Phase 1 & 2: Letter ── */}
      <div style={{
        position: "absolute", inset: 0,
        display: phase >= 1 ? "flex" : "none",
        alignItems: "center",
        justifyContent: "center",
        // 창이 화면 가장자리에 붙지 않도록 최소 여백 확보
        padding: "12px 16px",
        boxSizing: "border-box",
      }}>
        {/*
          너비:  화면 너비 90% / 높이(3:2 비율)이 화면 높이의 84% 이내 / 최대 800px
          → min(90vw, 126vh, 800px) 으로 모바일·PC 모두 창이 화면 안에 들어옴
          padding: 위=window.png 헤더 아트 영역 / 좌우=프레임 안쪽 / 아래=프레임 하단
          gap: 항목 간격 (px %, % 대신 고정값으로 단순화)
        */}
        <div style={{
          width: "min(90vw, 126vh, 800px)",
          aspectRatio: "3 / 2",
          backgroundImage: "url('/vl-window.png')",
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          // padding %는 항상 요소 너비 기준 → 창 크기에 비례해 여백 자동 조절
          padding: "13% 10% 6%",
          boxSizing: "border-box",
          gap: "clamp(4px, 1.8%, 14px)",
          textAlign: "center",
          transform: letterOpen ? "scale(1)" : "scale(1.2)",
          opacity: letterOpen ? 1 : 0,
          transition: "transform 0.6s ease, opacity 0.6s ease",
        }}>

          {/* 제목 */}
          <h1 style={{
            fontSize: "clamp(13px, 3.8vw, 30px)",
            margin: 0, flexShrink: 0,
            fontFamily: px,
            color: accentColor,
            lineHeight: 1.25,
          }}>
            {phase === 2 ? yesTitle : letterTitle}
          </h1>

          {/* 고양이 */}
          <img
            src={phase === 2 ? "/vl-cat-dance.gif" : "/vl-cat-heart.gif"}
            alt="cat"
            style={{
              width: phase === 2 ? "18%" : "20%",
              minWidth: 40,
              flexShrink: 0,
              transition: "width 0.4s ease",
            }}
          />

          {/* YES / NO 버튼 (phase 1) */}
          {phase < 2 && (
            <div style={{
              display: "flex",
              gap: "clamp(10px, 3vw, 28px)",
              alignItems: "center",
              flexShrink: 0,
            }}>
              <img
                src="/vl-yes.png"
                alt="Yes"
                onClick={handleYes}
                style={{ width: "clamp(58px, 14vw, 100px)", cursor: "pointer" }}
              />
              <img
                src="/vl-no.png"
                alt="No"
                onMouseEnter={dodgeNo}
                onTouchStart={dodgeNo}
                onClick={preventClick}
                style={{
                  width: "clamp(58px, 14vw, 100px)",
                  cursor: "default",
                  transform: `translate(${noOffset.x}px, ${noOffset.y}px)`,
                  transition: "transform 0.3s ease",
                }}
              />
            </div>
          )}

          {/* 최종 메시지 (phase 2) */}
          {phase === 2 && (
            <p
              style={{
                fontSize: "clamp(12px, 2.6vw, 20px)",
                lineHeight: 1.4,
                fontFamily: px,
                padding: "8px 16px",
                backgroundColor: "rgba(255,240,240,0.55)",
                borderRadius: 10,
                color: "#444",
                margin: 0,
                flexShrink: 0,
              }}
              dangerouslySetInnerHTML={{ __html: (finalText ?? "").replace(/\n/g, "<br/>") }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
