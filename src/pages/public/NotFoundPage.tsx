import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Home, ArrowLeft, LayoutGrid, Files, Settings, Gift } from "lucide-react";
import { useAuthStore } from "../../store/authStore";

const BASE_ROT = [-6, 3, -4];
const DIGIT_BG = ["var(--color-accent)", "var(--color-secondary)", "var(--color-primary)"];
const SPIN_MSGS = [
  "숫자를 클릭해보세요.",
  "돌려도 페이지는 안 돌아와요.",
  "여전히 404. 꽤 일관적이네요.",
  "사실 좀 중독적이죠?",
  "이제 그만 돌아가볼까요?",
];

const DESTINATIONS = [
  { icon: Home, label: "홈", desc: "대시보드로 돌아가기", to: "/dashboard", bg: "bg-info" },
  { icon: LayoutGrid, label: "둘러보기", desc: "템플릿 탐색하기", to: "/browse", bg: "bg-selected" },
  { icon: Files, label: "내 사이트", desc: "내 사이트 관리", to: "/sites", bg: "bg-subtle" },
  { icon: Settings, label: "설정", desc: "계정 설정", to: "/settings", bg: "bg-surface" },
];

export default function NotFoundPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [rots, setRots] = useState(BASE_ROT);
  const [spins, setSpins] = useState(0);

  const spin = useCallback((i: number) => {
    setRots((prev) => {
      const next = [...prev];
      next[i] += 360;
      return next;
    });
    setSpins((s) => s + 1);
  }, []);

  const spinMessage = SPIN_MSGS[Math.min(spins, SPIN_MSGS.length - 1)];

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-ink">
      <main className="flex flex-1 flex-col items-center px-5 pb-16 pt-12 md:px-8 md:pt-20">
        <div className="flex w-full max-w-[640px] flex-col items-center gap-10">

          {/* 에러 배지 */}
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-[11px] font-semibold text-muted">
            <span className="size-[7px] rounded-full bg-danger" />
            페이지를 찾을 수 없어요
          </span>

          {/* 404 숫자 */}
          <div className="flex justify-center gap-3 md:gap-5">
            {(["4", "0", "4"] as const).map((ch, i) => (
              <button
                key={i}
                type="button"
                onClick={() => spin(i)}
                className="grid cursor-pointer place-items-center rounded-2xl border border-border text-white select-none md:rounded-[20px]"
                style={{
                  width: "clamp(80px, 22vw, 180px)",
                  height: "clamp(100px, 28vw, 220px)",
                  fontSize: "clamp(60px, 18vw, 150px)",
                  fontWeight: 700,
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                  background: DIGIT_BG[i],
                  transform: `rotate(${rots[i]}deg)`,
                  transition: "transform 0.7s cubic-bezier(.34,1.56,.64,1)",
                  boxShadow: "var(--shadow-md)",
                }}
              >
                {ch}
              </button>
            ))}
          </div>

          {/* 메시지 */}
          <div className="flex flex-col items-center gap-3 text-center">
            <h1 className="m-0 text-[28px] font-semibold leading-tight tracking-tight md:text-[36px]">
              이 페이지는 길을 잃었어요
            </h1>
            <p className="m-0 max-w-[440px] text-[14px] leading-relaxed text-muted md:text-[15px]">
              주소가 잘못되었거나, 페이지가 이동했을 수 있어요.
              <br />
              아래에서 원하는 곳으로 이동해보세요.
            </p>
            <p className="m-0 min-h-[20px] text-[12px] text-muted/60">
              {spinMessage}
            </p>
          </div>

          {/* 액션 버튼 */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate(isAuthenticated ? "/dashboard" : "/")}
              className="jc-button h-11 rounded-[10px] bg-primary px-5 text-[13px] text-white"
            >
              <Home size={15} />
              홈으로 돌아가기
            </button>
            <button
              type="button"
              onClick={() => { if (window.history.length > 1) navigate(-1); else navigate("/"); }}
              className="jc-button h-11 rounded-[10px] bg-surface px-5 text-[13px] text-heading"
            >
              <ArrowLeft size={15} />
              이전 페이지
            </button>
          </div>

          {/* 바로가기 카드 */}
          {isAuthenticated && (
            <div className="w-full">
              <h2 className="mb-4 text-center text-[15px] font-semibold text-heading">
                바로가기
              </h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {DESTINATIONS.map(({ icon: Icon, label, desc, to, bg }) => (
                  <button
                    key={to}
                    type="button"
                    onClick={() => navigate(to)}
                    className="flex cursor-pointer flex-col items-start gap-3 rounded-2xl border border-border bg-surface p-5 text-left transition-shadow hover:shadow-md"
                    style={{ boxShadow: "var(--shadow-sm)" }}
                  >
                    <div className={`grid size-9 place-items-center rounded-xl ${bg}`}>
                      <Icon size={16} strokeWidth={1.8} className="text-heading" />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-heading">{label}</div>
                      <div className="mt-0.5 text-[11px] leading-snug text-muted">{desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 장식 */}
          <div className="flex items-center gap-2 text-muted/40">
            <Gift size={14} />
            <span className="text-[11px]">JoyCraft</span>
          </div>
        </div>
      </main>
    </div>
  );
}
