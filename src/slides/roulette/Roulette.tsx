import {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  useId,
} from "react";
import type { CSSProperties } from "react";
import type { SlideProps } from "../SlideProps";
import { useVibrate } from "../useVibrate";
import { useSlideComplete } from "../useSlideComplete";

interface Slice {
  label: string;
  detail: string;
  weight: number;
  color: string;
}

interface RouletteData {
  title: string;
  slices: string | Slice[];
  backgroundColor: string;
  accentColor: string;
}

const DURATION = 4500;

const PALETTE = [
  "#F3B8A8",
  "#F8E8CF",
  "#BDCDBF",
  "#ECD1CA",
  "#CCD9E5",
  "#DED3E7",
];

function point(deg: number, radius: number): [number, number] {
  const radian = (deg * Math.PI) / 180;

  return [
    radius * Math.sin(radian),
    -radius * Math.cos(radian),
  ];
}

function getTextColor(color: string): string {
  let hex = color.replace("#", "");

  if (/^[0-9a-f]{3}$/i.test(hex)) {
    hex = hex
        .split("")
        .map((character) => character + character)
        .join("");
  }

  if (!/^[0-9a-f]{6}$/i.test(hex)) return "#38332F";

  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);

  return (red * 0.299 + green * 0.587 + blue * 0.114) / 255 > 0.6
      ? "#38332F"
      : "#FFFFFF";
}

function getWeight(weight: number): number {
  return Number.isFinite(weight) ? Math.max(0, weight) : 1;
}

const styles = `
  .jc-roulette,
  .jc-roulette * {
    box-sizing: border-box;
  }

  .jc-roulette {
    position: absolute;
    inset: 0;
    overflow: auto;
    isolation: isolate;
    color: #38332f;
    font-family:
      "Pretendard", -apple-system, BlinkMacSystemFont,
      "Segoe UI", sans-serif;
    -webkit-tap-highlight-color: transparent;
  }

  .jc-roulette button {
    font: inherit;
  }

  .jc-roulette button:focus-visible {
    outline: 3px solid var(--roulette-accent);
    outline-offset: 5px;
  }

  .jc-roulette__ambient {
    position: absolute;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    overflow: hidden;
    background:
      radial-gradient(
        ellipse at 50% 36%,
        rgba(255, 255, 255, .85),
        transparent 62%
      );
  }

  .jc-roulette__ambient::before,
  .jc-roulette__ambient::after {
    content: "";
    position: absolute;
    width: 220px;
    height: 220px;
    border-radius: 50%;
    background: var(--roulette-accent);
    opacity: .07;
    filter: blur(45px);
  }

  .jc-roulette__ambient::before {
    top: 14%;
    left: -150px;
  }

  .jc-roulette__ambient::after {
    right: -150px;
    bottom: 8%;
  }

  .jc-roulette__content {
    width: 100%;
    min-height: 100%;
    max-width: 520px;
    margin: 0 auto;
    padding: clamp(32px, 7vh, 64px) 24px 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .jc-roulette__header {
    text-align: center;
    margin-bottom: clamp(26px, 5vh, 42px);
  }

  .jc-roulette__eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 15px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .23em;
    color: #91867e;
  }

  .jc-roulette__eyebrow::before,
  .jc-roulette__eyebrow::after {
    content: "";
    width: 18px;
    height: 1px;
    background: currentColor;
    opacity: .4;
  }

  .jc-roulette__title {
    margin: 0;
    font-size: clamp(25px, 6vw, 34px);
    font-weight: 800;
    letter-spacing: -.055em;
    line-height: 1.35;
    white-space: pre-line;
    overflow-wrap: anywhere;
    text-wrap: balance;
  }

  .jc-roulette__subtitle {
    margin: 12px 0 0;
    color: #978b82;
    font-size: 13px;
    line-height: 1.6;
    letter-spacing: -.02em;
  }

  .jc-roulette__stage {
    position: relative;
    width: min(100%, 340px);
    aspect-ratio: 1;
    flex-shrink: 0;
    margin-bottom: 28px;
  }

  .jc-roulette__stage::after {
    content: "";
    position: absolute;
    bottom: -14px;
    left: 18%;
    width: 64%;
    height: 20px;
    border-radius: 50%;
    background: #806447;
    filter: blur(14px);
    opacity: .13;
    z-index: -1;
  }

  .jc-roulette__rim {
    position: absolute;
    inset: 0;
    padding: 12px;
    border-radius: 50%;
    background: linear-gradient(145deg, #fff, #f0e8df);
    box-shadow:
      0 16px 36px rgba(96, 71, 48, .12),
      0 3px 6px rgba(96, 71, 48, .05),
      inset 0 0 0 1px rgba(255, 255, 255, .95),
      inset 0 -3px 5px rgba(139, 113, 89, .08);
  }

  .jc-roulette__wheel {
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    overflow: hidden;
    transform-origin: center;
  }

  .jc-roulette__pointer {
    position: absolute;
    top: -13px;
    left: 50%;
    width: 34px;
    height: 46px;
    transform: translateX(-50%);
    z-index: 3;
    filter: drop-shadow(0 4px 3px rgba(99, 65, 45, .16));
  }

  .jc-roulette__hub {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 66px;
    height: 66px;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    color: #b58a65;
    background: linear-gradient(145deg, #fffefa, #f2eade);
    border: 5px solid rgba(255, 255, 255, .92);
    box-shadow:
      0 4px 12px rgba(83, 64, 46, .15),
      inset 0 0 0 1px rgba(191, 164, 136, .23);
    pointer-events: none;
  }

  .jc-roulette__hub svg {
    width: 22px;
    height: 22px;
  }

  .jc-roulette__hub span {
    font-size: 7px;
    font-weight: 800;
    letter-spacing: .14em;
  }

  .jc-roulette__status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    min-height: 20px;
    margin: 0 0 21px;
    font-size: 12px;
    color: #9b8e84;
  }

  .jc-roulette__status-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--roulette-accent);
  }

  .jc-roulette__status[data-spinning="true"]
  .jc-roulette__status-dot {
    animation: jc-roulette-pulse 1s ease-in-out infinite;
  }

  .jc-roulette__spin {
    width: min(100%, 300px);
    min-height: 56px;
    padding: 16px 24px;
    border: 0;
    border-radius: 18px;
    background: var(--roulette-accent);
    color: var(--roulette-button-text);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-size: 15px !important;
    font-weight: 750 !important;
    letter-spacing: -.02em;
    cursor: pointer;
    box-shadow:
      0 8px 18px rgba(99, 65, 45, .12),
      inset 0 1px 0 rgba(255, 255, 255, .2);
    transition:
      transform .2s,
      opacity .2s,
      box-shadow .2s;
  }

  .jc-roulette__spin svg {
    width: 19px;
    height: 19px;
  }

  .jc-roulette__spin:active:not(:disabled) {
    transform: translateY(2px) scale(.985);
    box-shadow: 0 3px 8px rgba(99, 65, 45, .1);
  }

  .jc-roulette__spin:disabled {
    cursor: default;
    opacity: .55;
    box-shadow: none;
  }

  .jc-roulette__footnote {
    margin: 15px 0 0;
    font-size: 10px;
    color: #ab9e94;
    letter-spacing: .04em;
  }

  .jc-roulette__overlay {
    position: absolute;
    inset: 0;
    z-index: 10;
    padding: 24px;
    overflow: auto;
    display: flex;
    background: rgba(48, 39, 33, .32);
    backdrop-filter: blur(9px);
    -webkit-backdrop-filter: blur(9px);
    animation: jc-roulette-fade .3s ease both;
  }

  .jc-roulette__result {
    position: relative;
    width: 100%;
    max-width: 330px;
    margin: auto;
    padding: 36px 26px 24px;
    overflow: hidden;
    text-align: center;
    background: #fffcf7;
    border: 1px solid rgba(255, 255, 255, .9);
    border-radius: 28px;
    box-shadow: 0 24px 80px rgba(45, 32, 23, .2);
    animation: jc-roulette-reveal .5s cubic-bezier(.2, .8, .2, 1) both;
  }

  .jc-roulette__result::before {
    content: "";
    position: absolute;
    width: 230px;
    height: 160px;
    top: -100px;
    left: calc(50% - 115px);
    border-radius: 50%;
    background: var(--roulette-accent);
    opacity: .16;
    filter: blur(30px);
    pointer-events: none;
  }

  .jc-roulette__result-icon {
    width: 68px;
    height: 68px;
    display: grid;
    place-items: center;
    margin: 0 auto 21px;
    border-radius: 24px;
    background: #f7eddf;
    color: #b98b52;
    transform: rotate(-7deg);
  }

  .jc-roulette__result-icon svg {
    width: 34px;
    height: 34px;
    transform: rotate(7deg);
  }

  .jc-roulette__result-kicker {
    margin: 0 0 10px;
    color: #ab9581;
    font-size: 10px;
    font-weight: 750;
    letter-spacing: .22em;
  }

  .jc-roulette__result-title {
    margin: 0 0 12px;
    font-size: 30px;
    font-weight: 850;
    line-height: 1.25;
    letter-spacing: -.055em;
    overflow-wrap: anywhere;
  }

  .jc-roulette__result-detail {
    margin: 0;
    color: #918277;
    font-size: 14px;
    line-height: 1.75;
    white-space: pre-line;
    overflow-wrap: anywhere;
  }

  .jc-roulette__divider {
    width: 32px;
    height: 1px;
    margin: 25px auto;
    background: #e5dace;
  }

  .jc-roulette__next {
    width: 100%;
  }

  .jc-roulette__retry {
    margin-top: 13px;
    padding: 9px 16px;
    border: 0;
    background: transparent;
    color: #9b8c80;
    font-size: 12px !important;
    cursor: pointer;
  }

  @keyframes jc-roulette-pulse {
    50% { opacity: .25; }
  }

  @keyframes jc-roulette-fade {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes jc-roulette-reveal {
    from {
      opacity: 0;
      transform: translateY(18px) scale(.94);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .jc-roulette__result,
    .jc-roulette__overlay,
    .jc-roulette__status-dot {
      animation: none !important;
    }
  }
`;

function SparkleIcon() {
  return (
      <svg
          viewBox="0 0 32 32"
          fill="none"
          aria-hidden="true"
      >
        <path
            d="M16 4 19.4 12.6 28 16 19.4 19.4 16 28 12.6 19.4 4 16 12.6 12.6Z"
            fill="currentColor"
        />
        <path
            d="m26 3 1.1 2.9L30 7l-2.9 1.1L26 11l-1.1-2.9L22 7l2.9-1.1Z"
            fill="currentColor"
            opacity=".6"
        />
      </svg>
  );
}

export default function Roulette({
                                   data,
                                   onComplete,
                                   isPreview,
                                 }: SlideProps<RouletteData>) {
  const vibe = useVibrate();
  const complete = useSlideComplete(onComplete, isPreview);
  const id = useId();

  const spinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spinningRef = useRef(false);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  const spinButtonRef = useRef<HTMLButtonElement>(null);

  const [angle, setAngle] = useState<number>(0);
  const [spinning, setSpinning] = useState<boolean>(false);
  const [result, setResult] = useState<Slice | null>(null);

  const accentColor = data.accentColor || "#D8816B";
  const backgroundColor = data.backgroundColor || "#F8F4ED";

  useEffect(() => {
    return () => {
      if (spinTimerRef.current !== null) {
        clearTimeout(spinTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (result) resultHeadingRef.current?.focus();
  }, [result]);

  const slices = useMemo<Slice[]>(() => {
    try {
      const parsed: unknown =
          typeof data.slices === "string"
              ? JSON.parse(data.slices)
              : data.slices;

      if (!Array.isArray(parsed)) return [];

      return parsed
          .filter(
              (item): item is Slice =>
                  item !== null &&
                  typeof item === "object" &&
                  typeof item.label === "string",
          )
          .map((item, index) => ({
            label: item.label,
            detail: typeof item.detail === "string" ? item.detail : "",
            weight: getWeight(item.weight),
            color:
                typeof item.color === "string" && item.color.trim()
                    ? item.color
                    : PALETTE[index % PALETTE.length],
          }));
    } catch {
      return [];
    }
  }, [data.slices]);

  const totalWeight = useMemo(
      () => slices.reduce((sum, slice) => sum + slice.weight, 0),
      [slices],
  );

  const wheelSlices = useMemo(() => {
    const segment = 360 / slices.length;

    return slices.map((slice, index) => {
      const start = index * segment;
      const end = start + segment;
      const middle = start + segment / 2;

      const [x0, y0] = point(start, 100);
      const [x1, y1] = point(end, 100);
      const [labelX, labelY] = point(middle, 64);

      // 항목이 하나인 경우 원 전체를 두 개의 반원으로 그립니다.
      const path =
          slices.length === 1
              ? "M 0 -100 A 100 100 0 1 1 0 100 A 100 100 0 1 1 0 -100 Z"
              : `M 0 0 L ${x0} ${y0}
             A 100 100 0 ${segment > 180 ? 1 : 0} 1 ${x1} ${y1} Z`;

      const characters = Array.from(slice.label);
      const maxLength = slices.length > 8 ? 6 : 9;
      const displayLabel =
          characters.length > maxLength
              ? `${characters.slice(0, maxLength - 1).join("")}…`
              : slice.label;

      // 글씨를 부채꼴의 반지름 방향으로 배치합니다.
      let textRotation = middle - 90;

      if (middle > 180) textRotation += 180;

      return {
        ...slice,
        path,
        labelX: slices.length === 1 ? 0 : labelX,
        labelY: slices.length === 1 ? -58 : labelY,
        textRotation: slices.length === 1 ? 0 : textRotation,
        textColor: getTextColor(slice.color),
        displayLabel,
      };
    });
  }, [slices]);

  const spin = useCallback(() => {
    if (
        spinningRef.current ||
        result !== null ||
        slices.length === 0 ||
        totalWeight <= 0
    ) {
      return;
    }

    let randomWeight = Math.random() * totalWeight;
    let selectedIndex = slices.findLastIndex((slice) => slice.weight > 0);

    for (let index = 0; index < slices.length; index += 1) {
      randomWeight -= slices[index].weight;

      if (randomWeight < 0) {
        selectedIndex = index;
        break;
      }
    }

    const segment = 360 / slices.length;
    const middle = selectedIndex * segment + segment / 2;

    // 경계선에서 충분히 떨어진 위치에 멈춥니다.
    const offset = (Math.random() - 0.5) * segment * 0.4;
    const destination = ((360 - middle - offset) % 360 + 360) % 360;
    const currentRotation = ((angle % 360) + 360) % 360;
    const remaining = (destination - currentRotation + 360) % 360;

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;

    spinningRef.current = true;
    setSpinning(true);
    vibe(20);

    setAngle(
        angle + (reducedMotion ? 0 : 360 * 5) + remaining,
    );

    spinTimerRef.current = setTimeout(
        () => {
          spinningRef.current = false;
          spinTimerRef.current = null;
          setSpinning(false);
          setResult(slices[selectedIndex]);
          vibe([12, 40, 12, 40, 90]);
        },
        reducedMotion ? 180 : DURATION,
    );
  }, [angle, result, slices, totalWeight, vibe]);

  const reset = useCallback(() => {
    setResult(null);
    spinButtonRef.current?.focus();
  }, []);

  const unavailable = slices.length === 0 || totalWeight <= 0;
  const disabled = spinning || result !== null || unavailable;

  const rootStyle = {
    background: backgroundColor,
    "--roulette-accent": accentColor,
    "--roulette-button-text": getTextColor(accentColor),
  } as CSSProperties;

  return (
      <div className="jc-roulette" style={rootStyle}>
        <style>{styles}</style>

        <div className="jc-roulette__ambient" aria-hidden="true" />

        <div
            className="jc-roulette__content"
            inert={result !== null}
        >
          <header className="jc-roulette__header">
            <div className="jc-roulette__eyebrow">
              A LITTLE SURPRISE
            </div>

            <h2 className="jc-roulette__title">
              {data.title || "오늘은 무엇을 해볼까?"}
            </h2>

            <p className="jc-roulette__subtitle">
              고민은 잠깐 내려놓고, 행운에 맡겨봐요.
            </p>
          </header>

          <div className="jc-roulette__stage">
            <svg
                className="jc-roulette__pointer"
                viewBox="0 0 34 46"
                fill="none"
                aria-hidden="true"
            >
              <path
                  d="M5 15C5 8.37 10.37 3 17 3S29 8.37 29 15C29 23 17 42 17 42S5 23 5 15Z"
                  fill={accentColor}
                  stroke="#FFFCF7"
                  strokeWidth="3"
              />

              <circle
                  cx="17"
                  cy="15"
                  r="3.5"
                  fill="#FFFCF7"
                  opacity=".95"
              />
            </svg>

            <div className="jc-roulette__rim">
              <svg
                  className="jc-roulette__wheel"
                  viewBox="-102 -102 204 204"
                  role="img"
                  aria-label={`룰렛 항목: ${slices
                      .map((slice) => slice.label)
                      .join(", ")}`}
                  style={{
                    transform: `rotate(${angle}deg)`,
                    transition: spinning
                        ? `transform ${DURATION}ms cubic-bezier(.14,.78,.16,1)`
                        : "none",
                    willChange: spinning ? "transform" : "auto",
                  }}
              >
                <circle r="101" fill="#EEE6DC" />

                {wheelSlices.map((slice, index) => (
                    <path
                        key={`slice-${index}`}
                        d={slice.path}
                        fill={slice.color}
                        stroke="#FFFCF7"
                        strokeWidth="1"
                        strokeLinejoin="round"
                    />
                ))}

                {wheelSlices.map((slice, index) => (
                    <text
                        key={`label-${index}`}
                        x={slice.labelX}
                        y={slice.labelY}
                        transform={`rotate(
                    ${slice.textRotation}
                    ${slice.labelX}
                    ${slice.labelY}
                  )`}
                        fill={slice.textColor}
                        fontSize={slices.length > 8 ? 6 : 7.5}
                        fontWeight="700"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        letterSpacing="-.2"
                    >
                      {slice.displayLabel}
                    </text>
                ))}

                <circle
                    r="99"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeOpacity=".55"
                    strokeWidth="1"
                />
              </svg>
            </div>

            <div className="jc-roulette__hub" aria-hidden="true">
              <SparkleIcon />
              <span>LUCKY</span>
            </div>
          </div>

          <p
              className="jc-roulette__status"
              data-spinning={spinning}
              role="status"
          >
            <span className="jc-roulette__status-dot" />

            {unavailable
                ? "추첨 가능한 항목을 추가해 주세요"
                : spinning
                    ? "당신의 행운을 고르는 중이에요"
                    : `${slices.length}개의 선택지, 어떤 순간이 기다릴까요?`}
          </p>

          <button
              ref={spinButtonRef}
              type="button"
              className="jc-roulette__spin"
              onClick={spin}
              disabled={disabled}
          >
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
              <path d="M20 7v5h-5" />
              <path d="M19.4 12a7.5 7.5 0 1 0-1.8 5" />
            </svg>

            {spinning ? "두근두근, 돌아가는 중" : "행운의 룰렛 돌리기"}
          </button>

          <p className="jc-roulette__footnote">
            작은 우연이 즐거운 하루를 만들어요
          </p>
        </div>

        {result && (
            <div className="jc-roulette__overlay">
              <section
                  className="jc-roulette__result"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby={`${id}-result-title`}
                  aria-describedby={`${id}-result-detail`}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      event.preventDefault();
                      reset();
                      return;
                    }

                    if (event.key !== "Tab") return;

                    const buttons = Array.from(
                        event.currentTarget.querySelectorAll<HTMLButtonElement>(
                            "button:not(:disabled)",
                        ),
                    );

                    const first = buttons[0];
                    const last = buttons[buttons.length - 1];
                    const active = document.activeElement;

                    if (
                        event.shiftKey &&
                        (active === first || active === resultHeadingRef.current)
                    ) {
                      event.preventDefault();
                      last?.focus();
                    } else if (!event.shiftKey && active === last) {
                      event.preventDefault();
                      first?.focus();
                    }
                  }}
              >
                <div className="jc-roulette__result-icon">
                  <SparkleIcon />
                </div>

                <p className="jc-roulette__result-kicker">
                  YOUR LUCKY PICK
                </p>

                <h3
                    ref={resultHeadingRef}
                    id={`${id}-result-title`}
                    className="jc-roulette__result-title"
                    tabIndex={-1}
                    style={{ outline: "none" }}
                >
                  {result.label}
                </h3>

                <p
                    id={`${id}-result-detail`}
                    className="jc-roulette__result-detail"
                >
                  {result.detail || "오늘의 선택이 정해졌어요!"}
                </p>

                <div className="jc-roulette__divider" />

                <button
                    type="button"
                    className="jc-roulette__spin jc-roulette__next"
                    onClick={complete}
                >
                  좋아요, 다음으로
                  <span aria-hidden="true">→</span>
                </button>

                <button
                    type="button"
                    className="jc-roulette__retry"
                    onClick={reset}
                >
                  한 번 더 돌려볼래요
                </button>
              </section>
            </div>
        )}
      </div>
  );
}
