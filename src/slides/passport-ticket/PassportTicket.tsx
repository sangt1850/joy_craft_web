import { useState, useEffect, useCallback, useRef } from "react";
import type { SlideProps } from "../SlideProps";
import { useSlideTimeout } from "../useSlideTimeout";

/* ────────────────────────────────────────────────────────── */
/*  Data interface                                           */
/* ────────────────────────────────────────────────────────── */

interface PassportTicketData {
  passengerName: string;
  flightNo: string;
  seatNo: string;
  gate: string;
  terminal: string;
  fromCode: string;
  fromName: string;
  toCode: string;
  toName: string;
  boardingDate: string;
  boardingTime: string;
  tripTitle: string;
  flightClass: string;
  baggageNote: string;
  backTitle: string;
  backDescription: string;
  contactLabel: string;
  contactPhone: string;
  accommodationLabel: string;
  accommodationDuration: string;
  returnDate: string;
  returnRoute: string;
  passportImage: string | null;
  accentColor: string;
  backgroundColor: string;
  animationSpeed: number;
}

/* ────────────────────────────────────────────────────────── */
/*  Plane SVG (원본 path 그대로)                              */
/* ────────────────────────────────────────────────────────── */

function PlaneSvg({
  size = 34,
  color = "#fff",
  style,
}: {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={color}
      style={{ flexShrink: 0, ...style }}
    >
      <path d="M21 16v-2l-8-2.5V6.5a1.5 1.5 0 0 0-3 0v5L2 14v2l8-1.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-4.5L21 16z" />
    </svg>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  QR placeholder (원본: repeating-conic-gradient + 3 corners) */
/* ────────────────────────────────────────────────────────── */

function QrBlock({ size }: { size: number }) {
  const corner = Math.round((size * 27) / 78);
  return (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        marginBottom: 2,
        position: "relative",
        background: "repeating-conic-gradient(#111 0% 25%, #fff 0% 50%)",
        backgroundSize: "4px 4px",
        backgroundColor: "#fff",
      }}
    >
      <div style={{ position: "absolute", left: 0, top: 0, width: corner, height: corner, background: "#fff", border: "5px solid #111", boxSizing: "border-box" }} />
      <div style={{ position: "absolute", right: 0, top: 0, width: corner, height: corner, background: "#fff", border: "5px solid #111", boxSizing: "border-box" }} />
      <div style={{ position: "absolute", left: 0, bottom: 0, width: corner, height: corner, background: "#fff", border: "5px solid #111", boxSizing: "border-box" }} />
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Utils                                                    */
/* ────────────────────────────────────────────────────────── */

// hex → "r,g,b" 문자열 (rgba() 안에서 사용)
function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

/* ────────────────────────────────────────────────────────── */
/*  Component                                                */
/* ────────────────────────────────────────────────────────── */

export default function PassportTicket({
  data,
  isPreview: _isPreview,
}: SlideProps<PassportTicketData>) {
  const {
    passengerName, flightNo, seatNo, gate, terminal,
    fromCode, fromName, toCode, toName,
    boardingDate, boardingTime,
    tripTitle, flightClass, baggageNote,
    backTitle, backDescription,
    contactLabel, contactPhone, accommodationLabel, accommodationDuration,
    returnDate, returnRoute,
    passportImage, accentColor, backgroundColor,
    animationSpeed: rawSpeed,
  } = data;

  const speed = Math.max(0.4, Math.min(rawSpeed ?? 1, 2));
  // 원본 ms() / t() 함수 그대로
  const ms  = useCallback((v: number) => Math.round(v / speed), [speed]);
  const t   = useCallback((v: number) => `${Math.round(v / speed)}ms`, [speed]);
  const ease = "cubic-bezier(.22,1,.36,1)";

  /* ── state ── */
  const [phase,    setPhase]    = useState(0);
  const [flipped,  setFlipped]  = useState(false);
  const [portrait, setPortrait] = useState(false);
  const [zoom,     /* setZoom */] = useState(1);
  const [px,       setPx]       = useState(0);
  const [py,       setPy]       = useState(0);
  const [fit,      setFit]      = useState(1);
  const [vh,       setVh]       = useState(800);
  const [vw,       setVw]       = useState(1200);

  /* ── refs ── */
  const didDrag  = useRef(false);
  const pxRef    = useRef(0);
  const pyRef    = useRef(0);
  const cleanupDragRef = useRef<(() => void) | null>(null);
  const containerRef   = useRef<HTMLDivElement>(null);

  useEffect(() => { pxRef.current = px; }, [px]);
  useEffect(() => { pyRef.current = py; }, [py]);
  // 언마운트 시 드래그 리스너 정리
  useEffect(() => () => { cleanupDragRef.current?.(); }, []);

  /* ── hooks ── */
  const later = useSlideTimeout();

  /* ── fit 계산: ResizeObserver로 실제 컨테이너 크기 사용 ──
     window.innerWidth/Height는 브라우저 전체 크기라 에디터 폰 프레임 안에서 틀린 값이 나옴.
     컨테이너 자체를 관찰해서 fit 계산 (원본 공식 동일, 기준 크기만 변경). ── */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const w = el.clientWidth  || window.innerWidth;
      const h = el.clientHeight || window.innerHeight;
      // padding 제거: 컨테이너를 꽉 채워야 pc/mobile 모두 원본과 비슷하게 보임
      // 원본 공식의 120/130 여백은 standalone 브라우저 기준이라 폰 프레임에서는 너무 줄어듦
      const f = Math.min(1, h / 760, w / 720);
      setFit(Math.max(0.35, f));
      setVh(h);
      setVw(w);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ── portraitScale ──
     세로 모드에서 티켓이 화면을 충분히 채우도록 padding 최소화.
     byH: 높이 기준, byW: 너비 기준, 1.6 상한 유지. ── */
  const portraitScale = useCallback(() => {
    const byH = (vh - 40)  / (900 * fit);   // 상하 여백 40px (원본 170px → 축소)
    const byW = (vw - 24)  / (360 * fit);   // 좌우 여백 24px (원본 60px → 축소)
    return Math.max(0.5, Math.min(byH, byW, 1.6));
  }, [vh, vw, fit]);

  /* ── run / reset (원본 동일) ── */
  const run = useCallback(() => {
    setPhase(1);
    later(() => setPhase(2), ms(260));
    later(() => setPhase(3), ms(260 + 1240));
  }, [later, ms]);

  /* ── onStageClick ── */
  const onStageClick = useCallback(() => {
    if (phase === 0) { run(); return; }
    if (didDrag.current) { didDrag.current = false; return; }
    // phase 3: 아무것도 안 함 (다시 여권에 넣는 기능 없음)
  }, [phase, run]);

  const onFlip = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setFlipped((f) => !f);
  }, []);

  const onRotate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setPortrait((p) => !p);
  }, []);

  /* ── zoomBy (원본 zoomBy 동일) — 향후 줌 UI 복원 시 사용 ── */
  // const zoomBy = (d: number) => (e: React.MouseEvent) => {
  //   e.stopPropagation();
  //   setZoom((z) => {
  //     const nz = Math.min(3.2, Math.max(1, +(z + d).toFixed(2)));
  //     if (nz === 1) { setPx(0); setPy(0); }
  //     return nz;
  //   });
  // };

  /* ── 드래그 (원본: window.addEventListener 방식) ── */
  const handleTicketPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (zoom <= 1 || phase !== 3) return;
      e.stopPropagation();
      const sx = e.clientX, sy = e.clientY;
      const ox = pxRef.current, oy = pyRef.current;

      const move = (ev: PointerEvent) => {
        if (Math.abs(ev.clientX - sx) > 3 || Math.abs(ev.clientY - sy) > 3)
          didDrag.current = true;
        setPx(ox + (ev.clientX - sx));
        setPy(oy + (ev.clientY - sy));
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        cleanupDragRef.current = null;
      };
      cleanupDragRef.current = up;
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [phase, zoom]
  );

  /* ══════════════════════════════════════════════════════════
     renderVals 계산 — 원본 renderVals() 충실 재현
     ══════════════════════════════════════════════════════════ */
  const p      = phase;
  const open   = p >= 1;
  // VinylPlayer 패턴: 600px 이상이면 PC(와이드) 레이아웃
  const isWide = vw >= 600;
  const fl   = flipped;

  // 여권 phase별 값
  const pass = (
    {
      0: { tr: "translate(-50%,-50%) rotateX(16deg) scale(1)",    op: 1, flap: 0 },
      1: { tr: "translate(-50%,-50%) rotateX(22deg) scale(1.02)", op: 1, flap: 1 },
      2: { tr: "translate(-50%,-50%) rotateX(20deg) scale(1.02)", op: 1, flap: 1 },
      3: { tr: "translate(-50%,-50%) rotateX(26deg) scale(.86)",  op: 0, flap: 1 },
    } as Record<number, { tr: string; op: number; flap: number }>
  )[p];

  // 티켓 phase별 값
  const tk = (
    {
      0: { x: 0, y: -104,  rot: 90, sc: 0.63, z: 2 },
      1: { x: 0, y: -120,  rot: 90, sc: 0.63, z: 2 },
      2: { x: 4, y: -262,  rot: 90, sc: 0.68, z: 2 },
      3: {
        x: px / fit,
        y: py / fit,
        rot: portrait ? 90 : 0,
        sc: (portrait ? portraitScale() : isWide ? 1.14 : 0.76) * zoom,
        z: 4,
      },
    } as Record<number, { x: number; y: number; rot: number; sc: number; z: number }>
  )[p];

  // dot 배경 오버레이 헬퍼
  const dotOverlay = (color: string, opacity: number): React.CSSProperties => ({
    position: "absolute", inset: 0, pointerEvents: "none",
    backgroundImage: `radial-gradient(${color} 1.4px, transparent 1.4px)`,
    backgroundSize: "11px 11px",
    opacity,
  });

  /* ── inline styles ── */

  // 스테이지 (720×760 고정, scale(fit) 전체 축소) — 원본 stageStyle
  // phase 0-2: 스테이지를 104px(stage좌표) 아래로 내려서 티켓(y=-104)이 화면 중앙에 위치
  // phase 3: 스테이지를 자연 중앙으로 복귀 (티켓도 stage중앙 = 화면중앙)
  const stageOffsetPx = p === 3 ? 0 : Math.round(104 * fit);
  const stageStyle: React.CSSProperties = {
    position: "absolute", left: "50%", top: "50%",
    width: 720, height: 760,
    cursor: "pointer", userSelect: "none",
    transform: `translate(-50%, calc(-50% + ${stageOffsetPx}px)) scale(${fit})`,
    transformOrigin: "center center",
    transition: p === 3 ? `transform ${t(1000)} ${ease}` : "none",
  };

  // 땅 그림자
  const groundShadowStyle: React.CSSProperties = {
    position: "absolute", left: "50%", top: "50%",
    width: 340, height: 74,
    borderRadius: "50%", pointerEvents: "none",
    background: "radial-gradient(50% 50% at 50% 50%, rgba(0,0,0,.55), rgba(0,0,0,0) 72%)",
    transform: "translate(-50%,-50%) translateY(214px)",
    opacity: p === 3 ? 0 : 0.7,
    transition: `opacity ${t(700)} ease`,
    zIndex: 1,
  };

  // 여권 wrapper
  const passportStyle: React.CSSProperties = {
    position: "absolute", left: "50%", top: "50%",
    width: 584, height: 424,
    transformStyle: "preserve-3d", perspective: 1600,
    transform: pass.tr,
    opacity: pass.op,
    transition: `transform ${t(900)} ${ease}, opacity ${t(700)} ease ${p === 3 ? t(150) : "0ms"}`,
    zIndex: 3, pointerEvents: "none",
  };

  // 여권 커버 (오른쪽 절반, left:146px)
  const coverStyle: React.CSSProperties = {
    position: "absolute", left: 146, top: 0,
    width: 292, height: 424,
    transformOrigin: "center center",
    boxShadow: "0 30px 50px rgba(0,0,0,.5), 0 70px 100px rgba(0,0,0,.4)",
    borderRadius: 14,
    transformStyle: "preserve-3d",
    transform: "none",
    transition: `transform ${t(950)} ${ease}`,
    zIndex: 3,
  };

  // 커버 조명 오버레이 (열림 각도에 따라 방향 변경)
  const coverShadeStyle: React.CSSProperties = {
    position: "absolute", inset: 0, pointerEvents: "none",
    background: `linear-gradient(${open ? 250 : 115}deg, rgba(255,255,255,.22), rgba(255,255,255,0) 42%, rgba(0,0,0,.3))`,
    transition: `background ${t(900)} ease`,
  };

  // 열리는 플랩 (표지 왼쪽에서 rotateY)
  const flapStyle: React.CSSProperties = {
    position: "absolute", left: 0, top: 0,
    width: 292, height: 424,
    borderRadius: 14, pointerEvents: "none",
    background: "linear-gradient(100deg, rgba(255,255,255,.16), rgba(255,255,255,0) 45%)",
    transformOrigin: "left center",
    backfaceVisibility: "hidden",
    transform: `perspective(1400px) rotateY(${pass.flap ? -26 : 0}deg)`,
    opacity: pass.flap ? 1 : 0,
    transition: `transform ${t(800)} ${ease}, opacity ${t(400)} ease`,
  };

  // 티켓 컨테이너 (900×360 고정)
  const ticketStyle: React.CSSProperties = {
    position: "absolute", left: "50%", top: "50%",
    width: 900, height: 360,
    transformOrigin: "center center",
    transformStyle: "preserve-3d", perspective: 1600,
    cursor: p === 3 && zoom > 1 ? "grab" : "inherit",
    transform: `translate(-50%,-50%) translate(${tk.x}px,${tk.y}px) rotate(${tk.rot}deg) scale(${tk.sc})`,
    transition: `transform ${t(1000)} ${ease}`,
    zIndex: tk.z,
  };

  // 플리퍼 (flip 회전)
  const flipperStyle: React.CSSProperties = {
    position: "relative", width: 900, height: 360,
    transformStyle: "preserve-3d", perspective: 1800,
    transform: `rotateY(${fl ? 180 : 0}deg)`,
    transition: `transform ${t(900)} ${ease}`,
  };

  // face 공통 기반 (원본 faceBase)
  const faceBase: React.CSSProperties = {
    position: "absolute", inset: 0,
    width: 900, height: 360,
    display: "flex", borderRadius: 10, overflow: "hidden",
    backfaceVisibility: "hidden",
    boxShadow: "0 18px 26px rgba(0,0,0,.34), 0 44px 70px rgba(0,0,0,.42)",
    fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif",
  };

  // 앞면 — opacity+visibility로 플립 (원본과 동일)
  const frontFaceStyle: React.CSSProperties = {
    ...faceBase, background: "#fff",
    opacity: fl ? 0 : 1,
    visibility: fl ? "hidden" : "visible",
    zIndex: 2,
    transition: `opacity ${t(160)} linear ${fl ? t(420) : t(430)}, visibility 0s linear ${fl ? t(450) : t(430)}`,
  };

  // 뒷면
  const backFaceStyle: React.CSSProperties = {
    ...faceBase, background: accentColor,
    transform: "rotateY(180deg)",
    opacity: fl ? 1 : 0,
    visibility: fl ? "visible" : "hidden",
    zIndex: 1,
    transition: `opacity ${t(160)} linear ${fl ? t(430) : t(420)}, visibility 0s linear ${fl ? t(430) : t(450)}`,
  };

  // hint (phase 0)
  const hintStyle: React.CSSProperties = {
    position: "absolute", left: "50%", bottom: 56,
    transform: "translateX(-50%)",
    textAlign: "center", whiteSpace: "nowrap",
    opacity: p === 0 ? 1 : 0,
    transition: `opacity ${t(300)} ease`,
  };

  const btnStyle: React.CSSProperties = {
    padding: isWide ? "10px 28px" : "6px 14px", borderRadius: 999,
    border: "1px solid rgba(255,255,255,.22)",
    background: "rgba(255,255,255,.1)",
    color: "rgba(255,255,255,.85)", fontSize: isWide ? 14 : 11,
    letterSpacing: isWide ? "0.12em" : "0.08em",
    fontFamily: "inherit", cursor: "pointer",
    backdropFilter: "blur(8px)", whiteSpace: "nowrap",
    transition: "background 180ms ease",
  };

  const accentRgb = hexToRgb(accentColor);

  /* ── 여권 표지 이미지 (없으면 기본 passport-cover.png 사용) ── */
  const coverSrc = passportImage || "/passport-cover.png";

  /* ══════════════════════════════════════════════════════════
     Render
     ══════════════════════════════════════════════════════════ */
  return (
    <div
      style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        background: `radial-gradient(120% 90% at 50% 15%, #16305f 0%, ${backgroundColor} 55%, #060f24 100%)`,
        fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif",
      }}
    >
      {/* ────── 티켓 영역 (flex:1 + overflow:hidden → 티켓이 버튼 영역 침범 불가) ────── */}
      <div
        ref={containerRef}
        style={{ flex: 1, position: "relative", overflow: "hidden" }}
        onClick={onStageClick}
      >
      {/* ────── Stage (720×760, scale(fit)) ────── */}
      <div style={stageStyle}>

        {/* 땅 그림자 */}
        <div style={groundShadowStyle} />

        {/* ══ PASSPORT ══ */}
        <div style={passportStyle}>
          <div style={coverStyle}>
            {/* 커버 이미지 레이어 */}
            <div style={{
              position: "absolute", left: 0, top: 0, width: "100%", height: "100%",
              borderRadius: 14, overflow: "hidden",
              transform: "translateZ(3px)", backfaceVisibility: "hidden",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,.1)",
            }}>
              <img
                src={coverSrc}
                alt="여권"
                style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }}
              />
              {/* 조명 오버레이 */}
              <div style={coverShadeStyle} />
            </div>

            {/* Spine (등대) */}
            <div style={{
              position: "absolute", left: 0, top: 0,
              width: 7, height: "100%",
              borderRadius: "4px 0 0 4px",
              background: "linear-gradient(90deg,#0b1226,#1a2748)",
              transform: "translateZ(1.5px)",
            }} />

            {/* Flap (표지 열리는 효과) */}
            <div style={flapStyle} />
          </div>
        </div>

        {/* ══ TICKET ══ */}
        <div style={ticketStyle} onPointerDown={handleTicketPointerDown}>
          <div style={flipperStyle}>

            {/* ── 앞면 ── */}
            <div style={frontFaceStyle}>

              {/* 메인 섹션 */}
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: "#fff" }}>

                {/* 헤더 */}
                <div style={{
                  display: "flex", alignItems: "center", flexWrap: "nowrap", gap: 18,
                  padding: "16px 26px", background: accentColor, color: "#fff", position: "relative",
                }}>
                  <div style={dotOverlay("rgba(255,255,255,.28)", 0.5)} />
                  <PlaneSvg size={34} color="#fff" style={{ opacity: 1, flexShrink: 0 }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, position: "relative" }}>
                    <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "0.01em", whiteSpace: "nowrap" }}>
                      {tripTitle}
                    </span>
                    <span style={{ fontSize: 13, fontStyle: "italic", opacity: 0.85 }}>Bon voyage!</span>
                  </div>
                  <div style={{ marginLeft: "auto", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, position: "relative" }}>
                    <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: "0.14em", whiteSpace: "nowrap" }}>BOARDING PASS</span>
                    <span style={{ fontSize: 11, letterSpacing: "0.26em", opacity: 0.85, whiteSpace: "nowrap" }}>INTERNATIONAL</span>
                  </div>
                </div>

                {/* 정보 영역 */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "20px 26px 10px", position: "relative" }}>
                  <div style={dotOverlay(`rgba(${accentRgb},.16)`, 0.7)} />

                  {/* 5열 그리드 */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, position: "relative" }}>
                    {[
                      { label: "Passenger", value: passengerName },
                      { label: "Flight",    value: flightNo },
                      { label: "Seat",      value: seatNo },
                      { label: "Gate",      value: gate },
                      { label: "Terminal",  value: terminal },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        <span style={{ fontSize: 12, letterSpacing: "0.02em", color: "#6b7280" }}>{label}</span>
                        <span style={{ fontSize: 15, fontWeight: 600, color: accentColor }}>{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* FROM / TO / 탑승시간 / QR */}
                  <div style={{ display: "flex", alignItems: "flex-end", minWidth: 0, gap: 22, padding: "18px 0 0", flex: 1, position: "relative" }}>
                    {/* FROM */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 12, letterSpacing: "0.02em", color: "#6b7280" }}>FROM</span>
                      <span style={{ fontSize: 38, fontWeight: 800, lineHeight: 1, color: accentColor, letterSpacing: "0.01em", whiteSpace: "nowrap" }}>
                        {fromCode}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#111827", letterSpacing: "0.06em" }}>{fromName}</span>
                    </div>
                    {/* TO */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 12, letterSpacing: "0.02em", color: "#6b7280" }}>TO</span>
                      <span style={{ fontSize: 38, fontWeight: 800, lineHeight: 1, color: accentColor, letterSpacing: "0.01em", whiteSpace: "nowrap" }}>
                        {toCode}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#111827", letterSpacing: "0.06em" }}>{toName}</span>
                    </div>
                    {/* 탑승 시간 */}
                    <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 4, marginLeft: "auto", marginRight: 6, textAlign: "right", whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: 12, letterSpacing: "0.02em", color: "#6b7280" }}>Boarding Time</span>
                      <span style={{ fontSize: 23, fontWeight: 700, color: accentColor, lineHeight: 1 }}>{boardingDate}</span>
                      <span style={{ fontSize: 13, color: "#6b7280" }}>{boardingTime}</span>
                    </div>
                    {/* QR */}
                    <QrBlock size={78} />
                  </div>
                </div>

                {/* 사선 줄무늬 (원본 height:26px) */}
                <div style={{
                  height: 26, flexShrink: 0,
                  background: `repeating-linear-gradient(115deg, ${accentColor} 0 12px, #fff 12px 24px)`,
                }} />
              </div>

              {/* 사이드 패널 */}
              <div style={{
                width: 236, flexShrink: 0,
                borderLeft: `2px dashed rgba(${accentRgb},.45)`,
                display: "flex", flexDirection: "column", background: "#fff",
              }}>
                <div style={{
                  padding: "14px 20px", background: accentColor,
                  color: "#fff", fontSize: 16, fontWeight: 700,
                  letterSpacing: "0.16em", textAlign: "center",
                }}>
                  BOARDING PASS
                </div>
                <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr auto", gap: "8px 12px", alignContent: "start", padding: "16px 20px", position: "relative" }}>
                  {/* 비행기 워터마크 */}
                  <div style={{ position: "absolute", right: -10, top: 52, pointerEvents: "none" }}>
                    <PlaneSvg size={96} color={accentColor} style={{ opacity: 0.1 }} />
                  </div>
                  {/* Flight */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <span style={{ fontSize: 11, color: "#6b7280" }}>Flight</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: accentColor }}>{flightNo}</span>
                  </div>
                  {/* Class */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 3, textAlign: "right" }}>
                    <span style={{ fontSize: 11, color: "#6b7280" }}>Class</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: accentColor }}>{flightClass}</span>
                  </div>
                  {/* 구분선 */}
                  <div style={{ gridColumn: "1/-1", height: 1, background: "#e5e7eb" }} />
                  {/* Route */}
                  <div style={{ gridColumn: "1/-1", display: "flex", flexDirection: "column", gap: 3 }}>
                    <span style={{ fontSize: 11, color: "#6b7280" }}>Route</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: accentColor, lineHeight: 1.5 }}>
                      {fromCode} → {toCode}
                    </span>
                  </div>
                  {/* Departure */}
                  <div style={{ gridColumn: "1/-1", display: "flex", flexDirection: "column", gap: 3 }}>
                    <span style={{ fontSize: 11, color: "#6b7280" }}>Departure</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: accentColor }}>{boardingDate} {boardingTime}</span>
                  </div>
                  {/* 수하물 */}
                  <div style={{ gridColumn: "1/-1", marginTop: 2, fontSize: 11, lineHeight: 1.5, color: "#9ca3af" }}>
                    {baggageNote}
                  </div>
                </div>
              </div>
            </div>

            {/* ── 뒷면 ── */}
            <div style={backFaceStyle}>
              {/* 메인 뒷면 */}
              <div style={{
                flex: 1, minWidth: 0, position: "relative",
                display: "flex", flexDirection: "column", justifyContent: "flex-end",
                padding: "34px 38px", background: accentColor, overflow: "hidden",
              }}>
                <div style={dotOverlay("rgba(255,255,255,.28)", 0.55)} />
                {/* 큰 비행기 워터마크 */}
                <div style={{ position: "absolute", left: -30, top: -24, transform: "rotate(-12deg)", pointerEvents: "none" }}>
                  <PlaneSvg size={300} color="#fff" style={{ opacity: 0.3 }} />
                </div>
                {/* 텍스트 */}
                <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", textAlign: "right", color: "#fff" }}>
                  <span style={{ fontSize: 13, letterSpacing: "0.34em", opacity: 0.85 }}>TRAVEL INVITATION</span>
                  <span
                    style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.05 }}
                    dangerouslySetInnerHTML={{ __html: (backTitle ?? "").replace(/\n/g, "<br/>") }}
                  />
                  <span style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.9, maxWidth: 420 }}>
                    {backDescription}
                  </span>
                </div>
              </div>

              {/* 사이드 뒷면 */}
              <div style={{ width: 236, flexShrink: 0, display: "flex", flexDirection: "column", background: "#fff" }}>
                <div style={{
                  padding: "14px 20px", background: "#111827",
                  color: "#fff", fontSize: 16, fontWeight: 700,
                  letterSpacing: "0.16em", textAlign: "center",
                }}>
                  BOARDING PASS
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, padding: "18px 20px" }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: accentColor }}>CONTACT</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 11, color: "#6b7280" }}>{contactLabel}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: accentColor }}>{contactPhone}</span>
                    <span style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>{accommodationLabel}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: accentColor }}>{accommodationDuration}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginTop: "auto" }}>
                    <QrBlock size={88} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontSize: 11, color: "#6b7280" }}>Return</span>
                      <span
                        style={{ fontSize: 12, fontWeight: 600, color: accentColor, lineHeight: 1.4 }}
                        dangerouslySetInnerHTML={{ __html: `${returnDate}<br/>${returnRoute}` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ══ HINT (phase 0) ══ */}
        <div style={hintStyle}>
          <span style={{
            fontSize: 15, letterSpacing: "0.22em", textTransform: "uppercase",
            color: "rgba(255,255,255,.82)",
            animation: "pt-pulse 2.4s ease-in-out infinite",
          }}>
            클릭해서 티켓 꺼내기
          </span>
        </div>

      </div>
      </div>{/* 티켓 영역 끝 */}

      {/* ────── 버튼 영역 (고정 높이, 티켓과 완전히 분리) ────── */}
      <div style={{
        flexShrink: 0, height: isWide ? 72 : 56,
        display: "flex", alignItems: "center", justifyContent: "center", gap: isWide ? 24 : 12,
        opacity: p === 3 ? 1 : 0,
        pointerEvents: p === 3 ? "auto" : "none",
        transition: `opacity ${t(500)} ease ${p === 3 ? t(600) : "0ms"}`,
      }}>
        <button onClick={onRotate} style={btnStyle}>
          {portrait ? "가로로 보기" : "세로로 보기"}
        </button>
        <button onClick={onFlip} style={btnStyle}>
          {flipped ? "앞면 보기" : "뒷면 보기"}
        </button>
      </div>
    </div>
  );
}


