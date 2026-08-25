import { useState, useRef, useEffect, useCallback } from "react";
import type { SlideProps } from "../SlideProps";
import { useVibrate } from "../useVibrate";
import { useSlideComplete } from "../useSlideComplete";
import { useSlideTimeout } from "../useSlideTimeout";

interface FleetingButtonData {
  question: string;
  yesLabel: string;
  noLabel: string;
  successTitle: string;
  successBody: string;
  accentColor: string;
  backgroundColor: string;
}

const TAUNTS = ["어라?", "한 번 더?", "거기 아니에요", "안 눌려요", "아쉽네요", "다시 시도해 보세요", "조금 빨랐어요", "거의 잡았는데"];
const CONFETTI_COLS = ["#ffffff", "#4ADE80", "#7FB3E8", "#A8B8CC", "#DCE4EE"];

const BTN_W = 90;   // 배치 계산용 추정 너비
const BTN_GAP = 12;

export default function FleetingButton({ data, onComplete, isPreview }: SlideProps<FleetingButtonData>) {
  const { question, yesLabel, noLabel, successTitle, successBody, accentColor, backgroundColor } = data;

  const [accepted, setAccepted] = useState(false);
  const [noPos, setNoPos] = useState<{ x: number; y: number } | null>(null);
  const [yesPos, setYesPos] = useState<{ x: number; y: number } | null>(null);
  const [dodges, setDodges] = useState(0);
  const [confetti, setConfetti] = useState<React.CSSProperties[]>([]);

  const arenaRef = useRef<HTMLDivElement>(null);
  const textRef  = useRef<HTMLDivElement>(null);
  const noBtnRef = useRef<HTMLButtonElement>(null);
  const noPosRef = useRef<{ x: number; y: number } | null>(null);
  const yesPosRef = useRef<{ x: number; y: number } | null>(null);
  const acceptedRef = useRef(false);

  const vibe = useVibrate();
  const complete = useSlideComplete(onComplete, isPreview);
  const later = useSlideTimeout();

  const place = useCallback(() => {
    const a = arenaRef.current;
    if (!a) { requestAnimationFrame(place); return; }
    const w = a.clientWidth, h = a.clientHeight;
    const yesX = w / 2 - BTN_W - BTN_GAP / 2;
    const noX  = w / 2 + BTN_GAP / 2;
    const btnY = h - 120;
    const yp = { x: yesX, y: btnY };
    const np = { x: noX,  y: btnY };
    yesPosRef.current = yp;
    noPosRef.current  = np;
    setYesPos(yp);
    setNoPos(np);
  }, []);

  useEffect(() => {
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [place]);

  const jump = useCallback(() => {
    const a = arenaRef.current, b = noBtnRef.current;
    if (!a) return;
    const w = a.clientWidth, h = a.clientHeight;
    const bw = b?.offsetWidth || BTN_W, bh = b?.offsetHeight || 44;
    const pad = 10;

    // 텍스트 영역 하단을 CSS 픽셀로 환산한다.
    // getBoundingClientRect()는 transform:scale 이후 시각 픽셀을 반환하므로
    // arena의 시각 크기(getBCR)와 CSS 레이아웃 크기(clientHeight)의 비율로 역산한다.
    const textEl = textRef.current;
    const arenaBCR = a.getBoundingClientRect();
    const visualH = arenaBCR.height || h;
    const cssScale = h / visualH; // 시각→CSS 변환 비율
    const textBottomVisual = textEl
      ? textEl.getBoundingClientRect().bottom - arenaBCR.top
      : visualH * 0.35;
    const topSafe = textBottomVisual * cssScale + 20;

    const xMax = Math.max(pad, w - bw - pad);
    const yMax = Math.max(topSafe, h - bh - pad);

    // 최소 도약 거리: 화면이 작을수록 비례해서 줄임
    const minDist = Math.min(220, (yMax - topSafe) * 0.55);
    const minDistYes = minDist * 0.5;

    const cur = noPosRef.current  || { x: w / 2, y: h - 120 };
    const yp  = yesPosRef.current || null;
    let x = 0, y = 0, tries = 0;
    do {
      x = pad + Math.random() * (xMax - pad);
      y = topSafe + Math.random() * (yMax - topSafe);
      tries++;
    } while (tries < 30 && (
      Math.hypot(x - cur.x, y - cur.y) < minDist ||
      (yp !== null && Math.hypot(x - yp.x, y - yp.y) < minDistYes)
    ));

    // 화면 밖으로 나가지 않도록 클램핑
    x = Math.max(pad, Math.min(x, xMax));
    y = Math.max(topSafe, Math.min(y, yMax));

    vibe(10);
    const np = { x, y };
    noPosRef.current = np;
    setNoPos(np);
    setDodges((d) => d + 1);
  }, [vibe]);

  const flee = useCallback(() => {
    if (!acceptedRef.current) jump();
  }, [jump]);



  const onYes = useCallback(() => {
    acceptedRef.current = true;
    vibe([14, 40, 14, 40, 90]);
    const styledItems: React.CSSProperties[] = Array.from({ length: 34 }, (_, i) => {
      const ang = Math.random() * Math.PI * 2, dist = 110 + Math.random() * 210;
      return {
        position: "absolute" as const, left: "50%", top: "46%",
        width: `${6 + Math.random() * 7}px`, height: `${10 + Math.random() * 9}px`,
        background: CONFETTI_COLS[i % CONFETTI_COLS.length], borderRadius: "2px",
        animation: `jc-burst ${1 + Math.random() * 0.8}s cubic-bezier(.2,.7,.3,1) ${Math.random() * 0.12}s forwards`,
        ["--tx" as string]: `${Math.cos(ang) * dist}px`,
        ["--ty" as string]: `${Math.sin(ang) * dist - 50}px`,
        ["--rot" as string]: `${Math.random() * 720 - 360}deg`,
      } as React.CSSProperties;
    });
    setConfetti(styledItems);
    setAccepted(true);
    later(() => complete(), 1500);
  }, [vibe, later, complete]);

  const onReset = useCallback(() => {
    acceptedRef.current = false;
    setAccepted(false);
    setDodges(0);
    setConfetti([]);
    setTimeout(() => place(), 0);
  }, [place]);

  const np = noPos  || { x: 125, y: 520 };
  const yp = yesPos || { x: 35,  y: 520 };
  const subline = dodges === 0
    ? "둘 중 하나를 골라줘"
    : `${TAUNTS[(dodges - 1) % TAUNTS.length]} (${dodges}번 도망)`;

  const btnBase: React.CSSProperties = {
    position: "absolute",
    padding: "10px 22px", borderRadius: 10, cursor: "pointer",
    fontSize: 14, fontWeight: 600, minWidth: 80, minHeight: 40,
    zIndex: 20,
  };

  return (
    <div
      ref={arenaRef}
      style={{
        position: "absolute", inset: 0, overflow: "hidden", touchAction: "manipulation",
        background: `linear-gradient(170deg, ${backgroundColor} 0%, #e0e4ea 100%)`,
        fontFamily: "'Noto Sans KR', 'Noto Sans', sans-serif",
      }}
    >
      {/* 질문 + 서브라인 */}
      {!accepted && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", padding: "96px 28px 160px" }}>
          <div ref={textRef}>
            <p style={{ fontSize: 27, fontWeight: 800, color: "#1F2733", textAlign: "center", lineHeight: 1.4, letterSpacing: "-.02em", margin: "0 0 10px", whiteSpace: "pre-line" }}>{question}</p>
            <p style={{ fontSize: 14, color: "#8A94A6", textAlign: "center", margin: 0, minHeight: 20 }}>{subline}</p>
          </div>
        </div>
      )}

      {/* YES 버튼 (고정) */}
      {!accepted && (
        <button
          onClick={onYes}
          style={{
            ...btnBase,
            left: yp.x, top: yp.y,
            border: "none", background: accentColor, color: "#fff",
            letterSpacing: "-.01em", boxShadow: "0 6px 16px rgba(44,62,80,.25)",
          }}
        >
          {yesLabel}
        </button>
      )}

      {/* NO 버튼 (도망) */}
      {!accepted && (
        <button
          ref={noBtnRef}
          onPointerEnter={flee}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!acceptedRef.current) jump(); }}
          style={{
            ...btnBase,
            left: np.x, top: np.y,
            border: "1.5px solid #D5DBE3", background: "#fff", color: "#6B7688",
            boxShadow: "0 4px 12px rgba(44,62,80,.1)", touchAction: "none", userSelect: "none",
            transition: "left .22s cubic-bezier(.34,1.4,.64,1), top .22s cubic-bezier(.34,1.4,.64,1)",
          }}
        >
          {noLabel}
        </button>
      )}

      {/* 성공 화면 */}
      {accepted && (
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(170deg,#2C3E50 0%,#3D5875 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "44px 30px", textAlign: "center", animation: "jc-fadeup .5s", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {confetti.map((s, i) => <div key={i} style={s} />)}
          </div>
          <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
            <div style={{ width: 88, height: 88, borderRadius: "50%", background: "#4ADE80", display: "flex", alignItems: "center", justifyContent: "center", animation: "jc-pop .55s", boxShadow: "0 10px 28px rgba(74,222,128,.35)" }}>
              <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#17402a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
            </div>
            <p style={{ fontSize: 34, fontWeight: 800, color: "#fff", lineHeight: 1.3, margin: 0, whiteSpace: "pre-line", letterSpacing: "-.02em" }}>{successTitle}</p>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,.92)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-line", fontWeight: 500 }}>{successBody}</p>
            {isPreview && (
              <button onClick={onReset} style={{ marginTop: 8, padding: "12px 26px", borderRadius: 14, border: "2px solid rgba(255,255,255,.55)", background: "rgba(255,255,255,.15)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                다시 물어보기
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
