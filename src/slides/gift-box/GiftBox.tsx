import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { SlideProps } from "../SlideProps";
import { useVibrate } from "../useVibrate";
import { useAudio } from "../useAudio";

interface GiftBoxData {
  insideMessage: string;
  insideImage: string | null;
  hint: string;
  boxColor: string;
  ribbonColor: string;
  backgroundColor: string;
}
type Phase = "idle" | "untying" | "opening" | "popup";
type Variables = CSSProperties & { [key: `--${string}`]: string | number };
const COLORS = ["#FF8E9E", "#FFD166", "#7BDAC6", "#B8A1EF", "#FFF1CB"];
// Stable particles: unrelated renders cannot change their trajectories.
const PARTICLES = Array.from({ length: 48 }, (_, i) => {
  const seed = (i * 73 + 19) % 101;
  const angle = ((i * 137.508) % 180) * Math.PI / 180;
  return {
    x: Math.cos(angle) * (110 + seed * 1.8),
    y: -(100 + Math.sin(angle) * (90 + seed)),
    endY: 150 + seed * 2,
    rotation: (i % 2 ? -1 : 1) * (180 + seed * 7),
    duration: 1250 + seed * 9,
    delay: (i % 6) * 22,
    color: COLORS[i % COLORS.length],
  };
});

export default function GiftBox({ data, onComplete, isPreview }: SlideProps<GiftBoxData>) {
  const { insideMessage, insideImage, hint, boxColor, ribbonColor, backgroundColor } = data;
  const [phase, setPhase] = useState<Phase>("idle");
  const [imageFailed, setImageFailed] = useState(false);
  const busy = useRef(false);
  const completed = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const vibe = useVibrate();
  const { blip } = useAudio();
  const uid = useId().replace(/:/g, "");
  const id = (name: string) => `${uid}-${name}`;
  const burst = phase === "opening" || phase === "popup";

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);
  useEffect(() => clearTimers, [clearTimers]);
  useEffect(() => { setImageFailed(false); }, [insideImage]);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (phase === "popup" && dialog && !dialog.open) {
      dialog.showModal();
      nextRef.current?.focus();
    }
    return () => { if (dialog?.open) dialog.close(); };
  }, [phase]);

  const open = () => {
    if (busy.current) return;
    busy.current = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Sound is invoked inside the user gesture so mobile audio can unlock.
    vibe(12);
    blip(520, 0.12, "sine", 0.04);
    setPhase("untying");
    timers.current.push(setTimeout(() => {
      setPhase("opening");
      vibe([15, 35, 65]);
      blip(780, 0.25, "sine", 0.07);
    }, reduced ? 80 : 1050));
    timers.current.push(setTimeout(() => setPhase("popup"), reduced ? 180 : 2150));
  };

  const finish = () => {
    if (isPreview) {
      clearTimers();
      dialogRef.current?.close();
      busy.current = false;
      completed.current = false;
      setPhase("idle");
      requestAnimationFrame(() => triggerRef.current?.focus());
    } else if (!completed.current) {
      completed.current = true;
      onComplete?.();
    }
  };

  return (
    <div className="jc-gift" data-phase={phase} style={{
      "--box": boxColor || "#EAA09B",
      "--ribbon": ribbonColor || "#FFE4AA",
      background: backgroundColor || "#FCF4EE",
    } as Variables}>
      <style>{CSS}</style>
      <p className="jc-gift-hint" aria-live="polite">
        {phase === "idle" ? hint || "선물 상자를 터치해 주세요" : phase === "untying" ? "리본이 풀리고 있어요" : "당신을 위한 선물"}
      </p>
      <div className="jc-gift-stage">
        <div className="jc-gift-halo" />
        <button ref={triggerRef} type="button" className="jc-gift-trigger"
          onClick={open} aria-label="선물 상자 열기" aria-disabled={phase !== "idle"}>
          <svg viewBox="0 0 400 400" aria-hidden="true" className="jc-gift-art">
            <defs>
              <linearGradient id={id("front")} x2="0.8" y2="1">
                <stop stopColor="white" stopOpacity=".22" />
                <stop offset="1" stopColor="black" stopOpacity=".1" />
              </linearGradient>
              <linearGradient id={id("side")} x2="1" y2="1">
                <stop stopColor="black" stopOpacity=".08" />
                <stop offset="1" stopColor="black" stopOpacity=".26" />
              </linearGradient>
              <linearGradient id={id("satin")} x2="1" y2="0">
                <stop stopColor="white" stopOpacity=".05" />
                <stop offset=".45" stopColor="white" stopOpacity=".55" />
                <stop offset="1" stopColor="black" stopOpacity=".1" />
              </linearGradient>
              <radialGradient id={id("light")}>
                <stop stopColor="#FFF6C7" stopOpacity=".95" />
                <stop offset="1" stopColor="#FFF6C7" stopOpacity="0" />
              </radialGradient>
            </defs>
            <ellipse className="jc-gift-shadow" cx="203" cy="336" rx="119" ry="18" fill="#493124" opacity=".13" />
            <g className="jc-gift-body">
              {/* Open box interior and its front/right walls. */}
              <path d="M88 191 224 157 314 194 180 232Z" fill="var(--box)" />
              <path d="M88 191 224 157 314 194 180 232Z" fill="#352420" opacity=".7" />
              <path d="M88 191 180 232 180 330 88 285Z" fill="var(--box)" />
              <path d="M88 191 180 232 180 330 88 285Z" fill={`url(#${id("front")})`} />
              <path d="M180 232 314 194 314 291 180 330Z" fill="var(--box)" />
              <path d="M180 232 314 194 314 291 180 330Z" fill={`url(#${id("side")})`} />
              <path d="M88 191 180 232 314 194" fill="none" stroke="white" strokeOpacity=".3" strokeWidth="3" />
              <path className="jc-gift-wrap jc-gift-wrap-left" d="M132 210 132 305" pathLength="1" />
              <path className="jc-gift-wrap jc-gift-wrap-right" d="M246 213 246 311" pathLength="1" />
            </g>
            <ellipse className="jc-gift-light" cx="202" cy="193" rx="132" ry="115" fill={`url(#${id("light")})`} />
            <g className="jc-gift-lid">
              <path d="M79 174 224 136 324 176 179 219Z" fill="var(--box)" />
              <path d="M79 174 224 136 324 176 179 219Z" fill="white" opacity=".24" />
              <path d="M79 174 179 219 179 241 79 197Z" fill="var(--box)" />
              <path d="M79 174 179 219 179 241 79 197Z" fill={`url(#${id("front")})`} />
              <path d="M179 219 324 176 324 198 179 241Z" fill="var(--box)" />
              <path d="M179 219 324 176 324 198 179 241Z" fill={`url(#${id("side")})`} />
              <path d="M80 174 179 218 324 176" fill="none" stroke="white" strokeWidth="2" strokeOpacity=".4" />
              <g className="jc-gift-top-ribbon">
                <path d="M143 157 168 151 271 192 245 200Z" fill="var(--ribbon)" />
                <path d="M269 154 292 163 132 200 111 189Z" fill="var(--ribbon)" />
                <path d="M143 157 168 151 271 192 245 200Z" fill={`url(#${id("satin")})`} />
              </g>
              <g className="jc-gift-bow">
                <path className="jc-gift-loop jc-gift-loop-left" pathLength="1"
                  d="M202 173 C166 174 137 154 151 137 C166 118 196 144 202 173" />
                <path className="jc-gift-loop jc-gift-loop-right" pathLength="1"
                  d="M202 173 C233 166 258 137 239 129 C220 120 200 149 202 173" />
                <path className="jc-gift-tail jc-gift-tail-left" pathLength="1" d="M201 175 Q174 189 150 204 Q140 213 142 229" />
                <path className="jc-gift-tail jc-gift-tail-right" pathLength="1" d="M205 174 Q225 179 243 192 Q255 199 271 197" />
                <g className="jc-gift-knot">
                  <rect x="191" y="162" width="24" height="21" rx="7" fill="var(--ribbon)" transform="rotate(-12 203 172)" />
                  <rect x="191" y="162" width="24" height="21" rx="7" fill={`url(#${id("satin")})`} transform="rotate(-12 203 172)" />
                </g>
              </g>
            </g>
          </svg>
        </button>
        {burst && <div className="jc-gift-confetti" aria-hidden="true">
          {PARTICLES.map((p, i) => <i key={i} style={{
            "--x": `${p.x}px`, "--y": `${p.y}px`, "--end-y": `${p.endY}px`,
            "--rot": `${p.rotation}deg`, "--duration": `${p.duration}ms`, "--delay": `${p.delay}ms`,
            background: p.color, width: i % 3 ? 7 : 10, height: i % 3 ? 12 : 7,
            borderRadius: i % 4 === 0 ? "50%" : "2px",
          } as Variables} />)}
        </div>}
      </div>
      <p className="jc-gift-caption">{phase === "idle" ? "A little surprise, just for you" : "조금만 기다려 주세요 ✨"}</p>
      <dialog ref={dialogRef} className="jc-gift-dialog" aria-labelledby={id("title")}
        onCancel={(event) => { event.preventDefault(); finish(); }}>
        <div className="jc-gift-card">
          <span className="jc-gift-eyebrow">JUST FOR YOU</span>
          {insideImage && !imageFailed ? <img className="jc-gift-image" src={insideImage} alt="선물 이미지" onError={() => setImageFailed(true)} />
            : <div className="jc-gift-emoji" aria-hidden="true">💝</div>}
          <h2 id={id("title")}>선물이 도착했어요</h2>
          <p className="jc-gift-message">{insideMessage}</p>
          <button ref={nextRef} type="button" className="jc-gift-next" onClick={finish}>
            {isPreview ? "다시 열어보기" : "다음 페이지로"}<span aria-hidden="true"> →</span>
          </button>
        </div>
      </dialog>
    </div>
  );
}

const CSS = `
.jc-gift,.jc-gift *{box-sizing:border-box}
.jc-gift{position:absolute;inset:0;isolation:isolate;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;padding:28px 20px;color:#503E39;font-family:inherit}
.jc-gift-hint{font-size:15px;font-weight:600;text-align:center;margin:0;line-height:1.6;min-height:24px}
.jc-gift-stage{position:relative;width:min(380px,100%);flex:0 1 400px;min-height:0;display:grid;place-items:center}
.jc-gift-halo{position:absolute;width:90%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,#fff9 0%,#fff0 70%);pointer-events:none}
.jc-gift-trigger{position:relative;width:100%;max-height:100%;aspect-ratio:1;border:0;background:none;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.jc-gift-trigger:focus-visible{outline:2px solid #806253;outline-offset:-10px;border-radius:24px}
.jc-gift-trigger[aria-disabled=true]{cursor:default}
.jc-gift-art{width:100%;height:100%;overflow:visible}
.jc-gift-lid{transform-origin:202px 194px;filter:drop-shadow(0 5px 3px #39221818)}
.jc-gift-wrap{fill:none;stroke:var(--ribbon);stroke-width:24;stroke-dasharray:1;stroke-dashoffset:0}
.jc-gift-loop,.jc-gift-tail{fill:none;stroke:var(--ribbon);stroke-width:12;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:0;filter:drop-shadow(0 2px 1px #54312125)}
.jc-gift-loop-left{transform-origin:202px 173px}
.jc-gift-loop-right{transform-origin:202px 173px}
.jc-gift-knot{transform-origin:203px 172px}
.jc-gift-light{opacity:0;pointer-events:none}
.jc-gift-caption{font-size:12px;letter-spacing:.06em;opacity:.6;text-align:center;margin:0;min-height:20px}
.jc-gift[data-phase=idle] .jc-gift-bow{animation:jcg-breathe 2.8s ease-in-out infinite;transform-origin:202px 173px}
.jc-gift:not([data-phase=idle]) .jc-gift-loop-left{animation:jcg-loop-left .68s cubic-bezier(.4,0,.2,1) forwards}
.jc-gift:not([data-phase=idle]) .jc-gift-loop-right{animation:jcg-loop-right .68s .08s cubic-bezier(.4,0,.2,1) forwards}
.jc-gift:not([data-phase=idle]) .jc-gift-knot{animation:jcg-knot .35s .23s ease-in forwards}
.jc-gift:not([data-phase=idle]) .jc-gift-tail{animation:jcg-thread .55s .32s ease-in forwards}
.jc-gift:not([data-phase=idle]) .jc-gift-top-ribbon{animation:jcg-ribbon-top .45s .5s ease-in forwards;transform-origin:202px 173px}
.jc-gift:not([data-phase=idle]) .jc-gift-wrap{animation:jcg-unwrap .55s .55s ease-in forwards}
.jc-gift:not([data-phase=idle]) .jc-gift-wrap-right{animation-delay:.63s}
.jc-gift[data-phase=opening] .jc-gift-lid,.jc-gift[data-phase=popup] .jc-gift-lid{animation:jcg-lid 1.1s cubic-bezier(.22,.7,.25,1) forwards}
.jc-gift[data-phase=opening] .jc-gift-body,.jc-gift[data-phase=popup] .jc-gift-body{animation:jcg-recoil .6s ease-out both;transform-origin:200px 330px}
.jc-gift[data-phase=opening] .jc-gift-light,.jc-gift[data-phase=popup] .jc-gift-light{animation:jcg-glow 1.4s ease-out forwards}
.jc-gift-confetti{position:absolute;left:50%;top:48%;pointer-events:none;z-index:3}
.jc-gift-confetti i{position:absolute;opacity:0;animation:jcg-confetti var(--duration) .18s both;animation-delay:calc(.18s + var(--delay));will-change:transform,opacity}
.jc-gift-dialog{position:fixed;inset:0;margin:auto;width:min(360px,calc(100vw - 36px));max-height:85vh;max-height:85dvh;border:1px solid #fff9;border-radius:24px;padding:0;background:#FFFAF5;color:#503E39;box-shadow:0 28px 90px #38231933;font-family:inherit;overflow:auto;overscroll-behavior:contain}
.jc-gift-dialog[open]{animation:jcg-popup .45s cubic-bezier(.22,1,.36,1) both}
.jc-gift-dialog::backdrop{background:#30232055;backdrop-filter:blur(7px);animation:jcg-backdrop .35s both}
.jc-gift-card{padding:28px 24px;text-align:center}
.jc-gift-eyebrow{display:block;font-size:10px;letter-spacing:.24em;color:#997667;font-weight:700;margin-bottom:20px}
.jc-gift-image{display:block;width:100%;max-height:230px;object-fit:contain;border-radius:14px;margin:0 auto 22px;background:#F6EEE7}
.jc-gift-emoji{font-size:62px;margin:8px 0 20px}
.jc-gift-card h2{font-size:21px;margin:0 0 14px;letter-spacing:-.04em}
.jc-gift-message{font-size:15px;line-height:1.8;white-space:pre-wrap;overflow-wrap:anywhere;margin:0 0 26px}
.jc-gift-next{width:100%;border:0;border-radius:13px;padding:15px;background:#503E39;color:white;font:inherit;font-size:14px;font-weight:600;cursor:pointer}
.jc-gift-next:focus-visible{outline:3px solid #C99368;outline-offset:3px}
@keyframes jcg-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.035)}}
@keyframes jcg-loop-left{35%{transform:translate(-7px,2px) rotate(-9deg);stroke-dashoffset:.12}100%{transform:translate(-32px,15px) rotate(-28deg);stroke-dashoffset:1;opacity:0}}
@keyframes jcg-loop-right{35%{transform:translate(7px,-2px) rotate(9deg);stroke-dashoffset:.12}100%{transform:translate(35px,8px) rotate(26deg);stroke-dashoffset:1;opacity:0}}
@keyframes jcg-knot{to{transform:scale(.45) rotate(20deg);opacity:0}}
@keyframes jcg-thread{to{stroke-dashoffset:1;transform:translateY(18px);opacity:0}}
@keyframes jcg-ribbon-top{to{transform:translateY(9px) scaleX(1.12);opacity:0}}
@keyframes jcg-unwrap{40%{opacity:1}100%{stroke-dashoffset:-1;transform:translateY(25px);opacity:0}}
@keyframes jcg-lid{0%{transform:translateY(0) rotate(0);opacity:1}16%{transform:translateY(3px) rotate(1deg)}55%{opacity:1}100%{transform:translate(24px,-132px) rotate(-18deg);opacity:0}}
@keyframes jcg-recoil{0%,100%{transform:scale(1)}25%{transform:scale(1.025,.96)}60%{transform:scale(.99,1.02)}}
@keyframes jcg-glow{0%{opacity:0;transform:translateY(10px)}30%,60%{opacity:1}100%{opacity:0;transform:translateY(-30px)}}
@keyframes jcg-confetti{0%{transform:translate(0,0) rotate(0) scale(.3);opacity:0;animation-timing-function:cubic-bezier(.12,.65,.3,1)}8%{opacity:1}45%{transform:translate(var(--x),var(--y)) rotate(var(--rot)) scale(1);opacity:1;animation-timing-function:cubic-bezier(.4,0,.8,.5)}100%{transform:translate(calc(var(--x) * 1.2),var(--end-y)) rotate(calc(var(--rot) * 2)) scale(.7);opacity:0}}
@keyframes jcg-popup{from{opacity:0;transform:translateY(22px) scale(.93)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes jcg-backdrop{from{opacity:0}to{opacity:1}}
@media(prefers-reduced-motion:reduce){.jc-gift *,.jc-gift *::backdrop{animation-duration:1ms!important;animation-delay:0ms!important;transition:none!important}.jc-gift-confetti{display:none}}
`;
