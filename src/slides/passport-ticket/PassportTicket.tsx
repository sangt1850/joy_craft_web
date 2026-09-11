import { useState, useEffect, useCallback, useRef } from "react";
import type { CSSProperties } from "react";
import type { SlideProps } from "../SlideProps";
import { useSlideTimeout } from "../useSlideTimeout";

/* ────────────────────────────────────────────────────────── */
/*  Data interface                                           */
/* ────────────────────────────────────────────────────────── */

export interface PassportTicketData {
  passengerName: string | string[];
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
  arrivalTime: string;
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
  initialView?: "auto" | "pc" | "mobile";
  travelMode?: "flight" | "car" | "train";
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

function CarSvg({
                  size = 34,
                  color = "#fff",
                  style,
                }: {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}) {
  return (
      <svg viewBox="0 0 24 24" width={size} height={size} fill={color} style={{ flexShrink: 0, ...style }}>
        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
      </svg>
  );
}

function TrainSvg({
                    size = 34,
                    color = "#fff",
                    style,
                  }: {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}) {
  return (
      <svg viewBox="0 0 24 24" width={size} height={size} fill={color} style={{ flexShrink: 0, ...style }}>
        <path d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2.23l2-2H14l2 2H18v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zm0 2c3.51 0 5.44.49 5.9 1H6.1c.46-.51 2.39-1 5.9-1zm-5.5 3h11V11h-11V7zm1.5 8c-.83 0-1.5-.67-1.5-1.5S7.17 12 8 12s1.5.67 1.5 1.5S8.83 15 8 15zm8 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
      </svg>
  );
}

function TravelIcon({ mode, size, color, style }: {
  mode?: "flight" | "car" | "train";
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}) {
  if (mode === "car")   return <CarSvg size={size} color={color} style={style} />;
  if (mode === "train") return <TrainSvg size={size} color={color} style={style} />;
  return <PlaneSvg size={size} color={color} style={style} />;
}

/* ────────────────────────────────────────────────────────── */
/*  Travel mode config                                        */
/* ────────────────────────────────────────────────────────── */

const TRAVEL_CONFIG = {
  flight: {
    passType: "탑승권",
    passTypeSub: "국제선",
    tagLine: "즐거운 비행 되세요!",
    vehicleLabel: "항공편",
    gateLabel: "게이트",
    terminalLabel: "터미널",
    timeLabel: "탑승 시간",
    backLabel: "여행 초대장",
    mVehicleLabel: "항공편",
    mGateCoachLabel: "게이트 / 터미널",
    mBoardingLabel: "탑승",
  },
  car: {
    passType: "ROAD PASS",
    passTypeSub: "드라이브",
    tagLine: "즐거운 드라이브!",
    vehicleLabel: "차량번호",
    gateLabel: "경유지",
    terminalLabel: "주차",
    timeLabel: "출발 시간",
    backLabel: "드라이브 초대장",
    mVehicleLabel: "차량번호",
    mGateCoachLabel: "경유 / 주차",
    mBoardingLabel: "출발",
  },
  train: {
    passType: "기차 티켓",
    passTypeSub: "특급",
    tagLine: "즐거운 여행!",
    vehicleLabel: "열차번호",
    gateLabel: "플랫폼",
    terminalLabel: "호차",
    timeLabel: "출발 시간",
    backLabel: "기차 여행 초대장",
    mVehicleLabel: "열차번호",
    mGateCoachLabel: "플랫폼 / 호차",
    mBoardingLabel: "출발",
  },
} as const;

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
    boardingDate, boardingTime, arrivalTime,
    tripTitle, flightClass, baggageNote,
    backTitle, backDescription,
    contactLabel, contactPhone, accommodationLabel, accommodationDuration,
    returnDate, returnRoute,
    passportImage, accentColor, backgroundColor,
    animationSpeed: rawSpeed,
    travelMode,
  } = data;

  const mode = travelMode ?? "flight";
  const cfg  = TRAVEL_CONFIG[mode];

  const passengerNames   = Array.isArray(passengerName) ? passengerName.filter(Boolean) : [String(passengerName ?? "")];
  const passengerDisplay = passengerNames.join(" · ");

  const speed = Math.max(0.4, Math.min(rawSpeed ?? 1, 2));
  // 원본 ms() / t() 함수 그대로
  const ms  = useCallback((v: number) => Math.round(v / speed), [speed]);
  const t   = useCallback((v: number) => `${Math.round(v / speed)}ms`, [speed]);
  const ease = "cubic-bezier(.22,1,.36,1)";

  /* ── state ── */
  const [phase,    setPhase]    = useState(0);
  const [flipped,  setFlipped]  = useState(false);
  const [selectedView, setSelectedView] = useState<"pc" | "mobile" | null>(null);
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
  // 여권과 꺼내기 연출은 원본 유지. 꺼낸 티켓에만 보기 모드를 적용한다.
  const view = selectedView ?? (data.initialView === "pc" || data.initialView === "mobile"
      ? data.initialView : isWide ? "pc" : "mobile");
  // 고정 비율의 한 장을 컨테이너에 맞춤: 모바일 티켓 내부 스크롤 없음.
  const mobileHeight = 560;
  const mobileScale = Math.max(0, Math.min(1, (vw - 24) / 340, (vh - 32) / mobileHeight)) / fit;

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
          rot: 0,
          sc: Math.max(0, Math.min(1.14, (vw - 24) / (900 * fit), (vh - 32) / (360 * fit))) * zoom,
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
    transition: `transform ${t(1000)} ${ease}, opacity ${t(450)} ease`,
    opacity: view === "mobile" ? 0 : 1,
    pointerEvents: view === "mobile" ? "none" : "auto",
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
    appearance: "none", minHeight: 40, display: "inline-flex", alignItems: "center",
    justifyContent: "center", gap: 7, padding: isWide ? "0 17px" : "0 11px",
    border: "none", borderRadius: 11, fontFamily: "inherit", fontSize: isWide ? 13 : 12,
    fontWeight: 600, letterSpacing: "-.02em", whiteSpace: "nowrap", cursor: "pointer",
    touchAction: "manipulation", color: "#bcc8de", background: "transparent",
    transition: "background 200ms ease, color 200ms ease, box-shadow 200ms ease",
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
            <div aria-hidden={p === 3 && view === "mobile"} style={ticketStyle} onPointerDown={handleTicketPointerDown}>
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
                      <TravelIcon mode={mode} size={34} color="#fff" style={{ opacity: 1, flexShrink: 0 }} />
                      <div style={{ display: "flex", flexDirection: "column", gap: 2, position: "relative" }}>
                    <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "0.01em", whiteSpace: "nowrap" }}>
                      {tripTitle}
                    </span>
                        <span style={{ fontSize: 13, fontStyle: "italic", opacity: 0.85 }}>{cfg.tagLine}</span>
                      </div>
                      <div style={{ marginLeft: "auto", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, position: "relative" }}>
                        <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: "0.14em", whiteSpace: "nowrap" }}>{cfg.passType}</span>
                        <span style={{ fontSize: 11, letterSpacing: "0.26em", opacity: 0.85, whiteSpace: "nowrap" }}>{cfg.passTypeSub}</span>
                      </div>
                    </div>

                    {/* 정보 영역 */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "20px 26px 10px", position: "relative" }}>
                      <div style={dotOverlay(`rgba(${accentRgb},.16)`, 0.7)} />

                      {/* 5열 그리드 */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, position: "relative" }}>
                        {[
                          { label: "탑승자",              value: passengerDisplay },
                          { label: cfg.vehicleLabel,     value: flightNo },
                          { label: "좌석",               value: seatNo },
                          { label: cfg.gateLabel,        value: gate },
                          { label: cfg.terminalLabel,    value: terminal },
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
                        {/* 출발/도착 시간 */}
                        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 4, marginLeft: "auto", marginRight: 6, textAlign: "right", whiteSpace: "nowrap" }}>
                          <span style={{ fontSize: 12, letterSpacing: "0.02em", color: "#6b7280" }}>{cfg.timeLabel}</span>
                          <span style={{ fontSize: 23, fontWeight: 700, color: accentColor, lineHeight: 1 }}>{boardingDate}</span>
                          <span style={{ fontSize: 13, color: "#6b7280" }}>{boardingTime}</span>
                          {arrivalTime && (
                            <span style={{ fontSize: 12, color: accentColor, marginTop: 2, fontWeight: 600 }}>도착 {arrivalTime}</span>
                          )}
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
                      {cfg.passType}
                    </div>
                    <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr auto", gap: "8px 12px", alignContent: "start", padding: "16px 20px", position: "relative" }}>
                      {/* 이동 수단 워터마크 */}
                      <div style={{ position: "absolute", right: -10, top: 52, pointerEvents: "none" }}>
                        <TravelIcon mode={mode} size={96} color={accentColor} style={{ opacity: 0.1 }} />
                      </div>
                      {/* Flight */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <span style={{ fontSize: 11, color: "#6b7280" }}>{cfg.vehicleLabel}</span>
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
                    {/* 큰 이동 수단 워터마크 */}
                    <div style={{ position: "absolute", left: -30, top: -24, transform: "rotate(-12deg)", pointerEvents: "none" }}>
                      <TravelIcon mode={mode} size={300} color="#fff" style={{ opacity: 0.3 }} />
                    </div>
                    {/* 텍스트 */}
                    <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", textAlign: "right", color: "#fff" }}>
                      <span style={{ fontSize: 13, letterSpacing: "0.34em", opacity: 0.85 }}>{cfg.backLabel}</span>
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
                      {cfg.passType}
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

            {/* 모바일 티켓: 모바일 뷰일 때 phases 0-2에서도 여권에 꽂혀 있는 상태로 표시 */}
            <div aria-hidden={view !== "mobile"} style={{
              position: "absolute", left: "50%", top: "50%", width: 340, height: mobileHeight,
              transform: p === 3
                ? `translate(-50%,-50%) translateY(0px) scale(${mobileScale})`
                : p === 2
                ? `translate(-50%,-50%) translateY(-290px) scale(0.77)`
                : p === 1
                ? `translate(-50%,-50%) translateY(-148px) scale(0.72)`
                : `translate(-50%,-50%) translateY(-130px) scale(0.72)`,
              transformOrigin: "center", perspective: 1800,
              opacity: view === "mobile" ? 1 : 0,
              pointerEvents: p === 3 && view === "mobile" ? "auto" : "none",
              zIndex: p < 3 ? 2 : 4,
              transition: `opacity ${t(450)} ease, transform ${t(1000)} ${ease}`,
            }}>
              <div style={{ width: "100%", height: "100%", transformStyle: "preserve-3d",
                transform: `rotateY(${flipped ? 180 : 0}deg)`, transition: `transform ${t(900)} ${ease}` }}>
                <MobileFaces data={data} flipped={flipped} />
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
          display: "flex", alignItems: "center", justifyContent: "center", gap: isWide ? 12 : 8,
          opacity: p === 3 ? 1 : 0,
          pointerEvents: p === 3 ? "auto" : "none",
          transition: `opacity ${t(500)} ease ${p === 3 ? t(600) : "0ms"}`,
        }}>
          <div role="group" aria-label="티켓 보기 방식" style={{
            display: "flex", padding: 3, borderRadius: 14, position: "relative",
            background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.09)",
          }}>
            {([{ value: "pc", label: "PC 보기" }, { value: "mobile", label: "모바일 보기" }] as const).map((option) => (
                <button type="button" key={option.value} disabled={p !== 3} aria-pressed={view === option.value}
                        onClick={() => setSelectedView(option.value)}
                        style={{ ...btnStyle, color: view === option.value ? accentColor : "#bcc8de",
                          background: view === option.value ? "#ffffff" : "transparent",
                          boxShadow: view === option.value ? "0 2px 7px #0002" : "none" }}>
                  <ControlIcon kind={option.value} />{option.label}
                </button>
            ))}
          </div>
          <button type="button" disabled={p !== 3} onClick={onFlip} style={{ ...btnStyle,
            border: "1px solid rgba(255,255,255,.14)", minHeight: 44, color: "#edf2ff",
            background: "rgba(255,255,255,.035)", borderRadius: 13 }}>
            <ControlIcon kind="flip" />{flipped ? "앞면 보기" : "뒷면 보기"}
          </button>
        </div>
      </div>
  );
}

function ControlIcon({ kind }: { kind: "pc" | "mobile" | "flip" }) {
  return <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    {kind === "pc" ? <><rect x="3" y="4" width="18" height="12" rx="2.5" /><path d="M8 20h8m-4-4v4" /></>
        : kind === "mobile" ? <><rect x="6.5" y="2.5" width="11" height="19" rx="3" /><path d="M10 5h4m-3 13.5h2" /></>
            : <><rect x="7" y="5" width="10" height="14" rx="2" /><path d="M3.5 9A9 9 0 0 1 5 6M2 6.5 5 6l.5 3M20.5 15a9 9 0 0 1-1.5 3m3-0.5-3 .5-.5-3" /></>}
  </svg>;
}

/** Long text gets smaller before a line limit is applied. Full text remains in title/aria-label. */
function TicketText({ text, size = 14, lines = 1, capacity = 18, color, weight = 650, style }: {
  text: string; size?: number; lines?: number; capacity?: number; color?: string;
  weight?: number; style?: CSSProperties;
}) {
  const value = String(text ?? "");
  const length = Array.from(value).reduce((sum, char) => sum + (/[^\u0000-\u00ff]/.test(char) ? 1.7 : 1), 0);
  const adjusted = Math.max(size * .77, size * Math.min(1, Math.sqrt(capacity / Math.max(capacity, length))));
  return <div title={value} aria-label={value} style={{
    fontSize: adjusted, fontWeight: weight, lineHeight: 1.3, letterSpacing: "-.02em", color,
    display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: lines,
    overflow: "hidden", overflowWrap: "anywhere", whiteSpace: "pre-line", minWidth: 0,
    maxHeight: adjusted * 1.3 * lines, ...style,
  }}>{value}</div>;
}

function TicketField({ label, value, align = "left", color = "#19212e", lines = 1 }: {
  label: string; value: string; align?: "left" | "right"; color?: string; lines?: number;
}) {
  return <div style={{ minWidth: 0, textAlign: align }}>
    <TicketText text={label} size={9} capacity={26} color="#7b8089" weight={500} style={{ letterSpacing: ".04em", marginBottom: 5 }} />
    <TicketText text={value} size={14} capacity={18} lines={lines} color={color} />
  </div>;
}

/** Decorative QR artwork, consistent with the original ticket's non-scannable QR. */
function TicketCode({ size }: { size: number }) {
  const cells: React.ReactNode[] = [];
  for (let y = 0; y < 29; y++) {
    for (let x = 0; x < 29; x++) {
      if ((x < 8 && y < 8) || (x > 20 && y < 8) || (x < 8 && y > 20)) continue;
      if (((x * 17 + y * 13 + x * y * 7 + (x ^ y) * 19) % 23) < 11)
        cells.push(<rect key={`${x}-${y}`} x={x + 2} y={y + 2} width="1" height="1" />);
    }
  }
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 33 33" style={{ display: "block", flexShrink: 0, background: "white", maxWidth: "100%", maxHeight: "100%", aspectRatio: "1" }} fill="#20252c" shapeRendering="crispEdges">
    {cells}
    {[[2, 2], [24, 2], [2, 24]].map(([x, y]) => <g key={`${x}-${y}`}>
      <rect x={x} y={y} width="7" height="7" /><rect x={x + 1} y={y + 1} width="5" height="5" fill="white" /><rect x={x + 2} y={y + 2} width="3" height="3" />
    </g>)}
  </svg>;
}

function Perforation({ accentColor, travelMode }: { accentColor?: string; travelMode?: "flight" | "car" | "train" }) {
  const mode = travelMode ?? "flight";
  const iconRotate = mode === "flight" ? "rotate(65deg)" : "rotate(0deg)";
  return <div aria-hidden="true" style={{ position: "relative", height: 1, flexShrink: 0, margin: "0 12px", background: "repeating-linear-gradient(90deg,#afb4be 0 5px,transparent 5px 11px)" }}>
    {accentColor && <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 40, height: 40, borderRadius: "50%", background: accentColor, border: "6px solid white", display: "grid", placeItems: "center" }}>
      <TravelIcon mode={mode} size={25} style={{ transform: iconRotate }} />
    </div>}
  </div>;
}

function MobileFaces({ data: d, flipped }: { data: PassportTicketData; flipped: boolean }) {
  const mMode = d.travelMode ?? "flight";
  const mCfg  = TRAVEL_CONFIG[mMode];
  const mPassengers    = Array.isArray(d.passengerName) ? d.passengerName.filter(Boolean) : [String(d.passengerName ?? "")];
  const mPassengerDisplay = mPassengers.join(" · ");
  const face: CSSProperties = {
    position: "absolute", inset: 0, borderRadius: 24, overflow: "hidden",
    background: "#fff", color: "#19212e", display: "flex", flexDirection: "column",
    backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
    boxShadow: "0 20px 50px #0005", boxSizing: "border-box",
  };
  // Both layers cut real transparent notches, preserving the original stage background.
  const notches = (y: number): CSSProperties => ({
    maskImage: `radial-gradient(circle at 0 ${y}px,transparent 9px,#000 9.5px),radial-gradient(circle at 100% ${y}px,transparent 9px,#000 9.5px)`,
    maskComposite: "intersect",
    WebkitMaskImage: `radial-gradient(circle at 0 ${y}px,transparent 9px,#000 9.5px),radial-gradient(circle at 100% ${y}px,transparent 9px,#000 9.5px)`,
    WebkitMaskComposite: "source-in",
  });
  return <>
    <div aria-hidden={flipped} style={{ ...face, ...notches(408), pointerEvents: flipped ? "none" : "auto" }}>
      {/* Color and itinerary header — the existing accentColor is authoritative. */}
      <div style={{ height: 208, flexShrink: 0, background: d.accentColor, color: "#fff", padding: "20px 28px 17px", boxSizing: "border-box", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <span style={{ background: "#fff", color: d.accentColor, fontSize: 11, fontWeight: 750, letterSpacing: ".03em", padding: "7px 14px", borderRadius: 5 }}>{mCfg.passType}</span>
        </div>
        <svg aria-hidden="true" viewBox="0 0 280 62" width="100%" height="62" style={{ display: "block", marginTop: 11, overflow: "visible" }}>
          <path d="M39 55 Q140 -19 241 55" fill="none" stroke="white" strokeOpacity=".75" strokeWidth="1" strokeDasharray="2 4" />
          <circle cx="39" cy="55" r="3.5" fill="white" /><circle cx="241" cy="55" r="3.5" fill="white" />
          {mMode === "car"
            ? <g transform="translate(118 8) scale(1.3)" fill="white"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" /></g>
            : mMode === "train"
            ? <g transform="translate(118 4) scale(1.3)" fill="white"><path d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2.23l2-2H14l2 2H18v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zm0 2c3.51 0 5.44.49 5.9 1H6.1c.46-.51 2.39-1 5.9-1zm-5.5 3h11V11h-11V7zm1.5 8c-.83 0-1.5-.67-1.5-1.5S7.17 12 8 12s1.5.67 1.5 1.5S8.83 15 8 15zm8 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" /></g>
            : <g transform="translate(119 5) rotate(58 14 14) scale(1.45)" fill="white"><path d="M21 16v-2l-8-2.5V6.5a1.5 1.5 0 0 0-3 0v5L2 14v2l8-1.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-4.5L21 16z" /></g>
          }
        </svg>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: -1 }}>
          {[{ code: d.fromCode, name: d.fromName }, { code: d.toCode, name: d.toName }].map((stop, i) => <div key={i} style={{ minWidth: 0, textAlign: i === 0 ? "left" : "right" }}>
            <TicketText text={stop.code} size={36} capacity={4} weight={750} style={{ lineHeight: 1.08, letterSpacing: "-.035em" }} />
            <TicketText text={stop.name} size={10} capacity={22} weight={550} style={{ marginTop: 3, opacity: .9, letterSpacing: ".02em" }} />
          </div>)}
        </div>
        <TicketText text={d.tripTitle} size={9} capacity={35} weight={500} style={{ position: "absolute", bottom: 10, left: 28, right: 28, textAlign: "center", opacity: .75, letterSpacing: ".05em" }} />
      </div>
      <div style={{ height: 200, flexShrink: 0, padding: "20px 28px 13px", boxSizing: "border-box" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", columnGap: 20, rowGap: 11 }}>
          <TicketField label={mCfg.mVehicleLabel} value={d.flightNo} color={d.accentColor} />
          <TicketField label="날짜" value={d.boardingDate} align="right" />
          <TicketField label={mCfg.mGateCoachLabel} value={`${d.gate} / ${d.terminal}`} />
          <TicketField label={mCfg.mBoardingLabel} value={d.boardingTime} align="right" />
          <TicketField label="클래스" value={d.flightClass} />
          {d.arrivalTime ? <TicketField label="도착" value={d.arrivalTime} align="right" color={d.accentColor} /> : <div />}
          <TicketField label="CLASS" value={d.flightClass} />
          <TicketField label="SEAT" value={d.seatNo} align="right" color={d.accentColor} />
        </div>
        <TicketText text={d.baggageNote} size={9} lines={2} capacity={95} weight={400} color="#8b9099" style={{ marginTop: 12 }} />
      </div>
      <Perforation travelMode={mMode} />
      <div style={{ flex: 1, minHeight: 0, padding: "24px 28px", display: "flex", alignItems: "center", gap: 18, boxSizing: "border-box" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <TicketField label="탑승자" value={mPassengerDisplay} color={d.accentColor} lines={2} />
          <div style={{ marginTop: 12 }}><TicketField label="SEAT" value={d.seatNo} color={d.accentColor} /></div>
        </div>
        <TicketCode size={86} />
      </div>
    </div>

    <div aria-hidden={!flipped} style={{ ...face, ...notches(134), transform: "rotateY(180deg)", pointerEvents: flipped ? "auto" : "none" }}>
      <div style={{ height: 134, flexShrink: 0, padding: "22px 28px 18px", boxSizing: "border-box" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <TicketField label={d.contactLabel} value={d.contactPhone} />
          <TicketField label="RETURN" value={d.returnDate} align="right" />
        </div>
        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <TicketField label={d.accommodationLabel} value={d.accommodationDuration} />
          <TicketField label="ROUTE" value={d.returnRoute} align="right" />
        </div>
      </div>
      <Perforation accentColor={d.accentColor} travelMode={mMode} />
      <div style={{ flex: 1, minHeight: 0, padding: "35px 28px 14px", display: "flex", flexDirection: "column", alignItems: "center", boxSizing: "border-box", textAlign: "center" }}>
        <TicketText text={d.backTitle} size={22} lines={2} capacity={34} color={d.accentColor} weight={750} style={{ width: "100%" }} />
        <TicketText text={d.backDescription} size={11} lines={3} capacity={125} weight={400} color="#747a86" style={{ marginTop: 9, width: "100%", flexShrink: 0 }} />
        <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", width: "100%", overflow: "hidden", paddingTop: 8 }}>
          <div style={{ width: "100%", height: "100%", maxWidth: 178, maxHeight: 178, display: "flex", alignItems: "center", justifyContent: "center" }}><TicketCode size={158} /></div>
        </div>
        <span style={{ fontSize: 8, letterSpacing: ".12em", color: "#9298a2", marginTop: 6 }}>A LITTLE TICKET TO OUR NEXT MEMORY</span>
      </div>
      <div style={{ height: 88, flexShrink: 0, padding: "21px 28px", background: d.accentColor, color: "white", display: "grid", gridTemplateColumns: "minmax(0,1fr) 52px", gap: 20, boxSizing: "border-box" }}>
        <div><div style={{ fontSize: 8, opacity: .8, letterSpacing: ".04em", marginBottom: 5 }}>탑승자</div><TicketText text={mPassengerDisplay} size={14} capacity={24} lines={2} /></div>
        <div style={{ textAlign: "right" }}><div style={{ fontSize: 8, opacity: .8, letterSpacing: ".04em", marginBottom: 5 }}>SEAT</div><TicketText text={d.seatNo} size={15} capacity={5} /></div>
      </div>
    </div>
  </>;
}
