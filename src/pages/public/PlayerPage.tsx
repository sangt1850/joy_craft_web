// 공개 플레이어 페이지 — 발행된 사이트를 링크로 여는 화면
//
// 슬라이드(src/slides/**)는 디자인 시스템을 따르지 않는 독립 캔버스다.
// 전부 position:absolute; inset:0 풀블리드이므로 플레이어는 크기를 잡아주는
// 컨테이너(position:relative)만 제공하고 슬라이드에 스타일을 주입하지 않는다.
// 플레이어 자신의 UI(로딩/에러/종료/상단 크롬)는 Neo-Brutalism 규칙을 따른다.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useParams } from "react-router-dom";
import { fetchPlaySnapshot, normalizeFlowPolicy, DEFAULT_FLOW_POLICY } from "../../api/play";
import { isApiError } from "../../api/client";
import type { PlaySnapshot } from "../../types/api";
import NeoCard from "../../components/ui/NeoCard";
import NeoButton from "../../components/ui/NeoButton";
import StatusBadge from "../../components/ui/StatusBadge";
import SlideCanvas from "../../components/player/SlideCanvas";

/** 슬라이드 캔버스 최대 폭/높이 — 슬라이드는 모바일 세로 화면 기준으로 만들어져 있다 */
const STAGE_MAX_W = 460;
const STAGE_MAX_H = 900;

type LoadState =
  | { status: "loading" }
  | { status: "error"; code: number | null }
  | { status: "ready"; snapshot: PlaySnapshot };

export default function PlayerPage() {
  const { slug } = useParams<{ slug: string }>();

  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [index, setIndex] = useState(0);
  const [canEscape, setCanEscape] = useState(false);

  // onComplete 중복 호출로 슬라이드를 건너뛰지 않도록 현재 인덱스를 즉시 추적한다
  const indexRef = useRef(0);
  indexRef.current = index;
  const completedRef = useRef<number | null>(null);

  // ─── 스냅샷 로드 ───────────────────────────────────────────────────────────
  const load = useCallback(() => {
    if (!slug) {
      setState({ status: "error", code: 404 });
      return;
    }
    let alive = true;
    setState({ status: "loading" });
    fetchPlaySnapshot(slug)
      .then((snapshot) => {
        if (!alive) return;
        setIndex(0);
        completedRef.current = null;
        setState({ status: "ready", snapshot });
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setState({ status: "error", code: isApiError(e) ? e.status : null });
      });
    return () => {
      alive = false;
    };
  }, [slug]);

  useEffect(() => load(), [load]);

  const snapshot = state.status === "ready" ? state.snapshot : null;

  // 플레이어를 벗어나면 원래 문서 제목으로 되돌린다
  useEffect(() => {
    if (!snapshot?.title) return;
    const prev = document.title;
    document.title = snapshot.title;
    return () => {
      document.title = prev;
    };
  }, [snapshot]);

  const policy = useMemo(
    () => (snapshot ? normalizeFlowPolicy(snapshot.flowPolicy) : DEFAULT_FLOW_POLICY),
    [snapshot]
  );

  const slides = snapshot?.slides ?? [];
  const total = slides.length;
  const finished = total > 0 && index >= total;
  const slide = finished ? undefined : slides[index];

  // ─── 이동 ─────────────────────────────────────────────────────────────────
  const goNext = useCallback(() => {
    setIndex((i) => Math.min(i + 1, total));
  }, [total]);

  const goPrev = useCallback(() => {
    completedRef.current = null;
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  const restart = useCallback(() => {
    completedRef.current = null;
    setIndex(0);
  }, []);

  /**
   * 슬라이드가 스스로 완료를 알릴 때 (gated / free 공통).
   *
   * `from`은 완료를 보낸 슬라이드 인스턴스의 인덱스다. 18종 중 여럿이 setTimeout으로
   * onComplete를 1~2초 뒤에 호출하면서 언마운트 시 타이머를 정리하지 않는다.
   * free 모드에서 그 사이에 "다음"을 누르면 죽은 타이머가 한 장을 더 넘겨버리므로,
   * 완료 신호를 현재 인덱스와 대조해 지나간 슬라이드의 신호를 버린다.
   */
  const handleComplete = useCallback((from: number) => {
    if (from !== indexRef.current) return;  // 지나간 슬라이드의 지연 콜백 무시
    if (completedRef.current === from) return; // 동일 슬라이드 중복 호출 방어
    completedRef.current = from;
    goNext();
  }, [goNext]);

  // 슬라이드에 넘길 완료 콜백 — 자기 인덱스를 실어 보내 지연 콜백을 구분할 수 있게 한다.
  // index가 바뀌면 어차피 캔버스가 리마운트되므로 참조가 바뀌어도 문제없다.
  const handleCompleteHere = useCallback(() => handleComplete(index), [handleComplete, index]);

  // ─── escapeAfter — N초 뒤 건너뛰기 허용 ───────────────────────────────────
  // 슬라이드별 값이 있으면 우선, 없으면 사이트 flowPolicy 값을 쓴다.
  const escapeSeconds = slide?.escapeAfter ?? policy.escapeAfter;

  useEffect(() => {
    setCanEscape(false);
    if (!escapeSeconds || escapeSeconds <= 0) return;
    const t = window.setTimeout(() => setCanEscape(true), escapeSeconds * 1000);
    return () => window.clearTimeout(t);
  }, [index, escapeSeconds]);

  // ─── 로딩 / 에러 ──────────────────────────────────────────────────────────
  if (state.status === "loading") {
    return (
      <PlayerMessage title="불러오는 중..." bg="var(--color-blue)">
        <p className="font-body text-[13px] leading-relaxed">잠시만 기다려주세요.</p>
      </PlayerMessage>
    );
  }

  if (state.status === "error") {
    const notFound = state.code === 404;
    return (
      <PlayerMessage
        title={notFound ? "없거나 삭제된 링크예요" : "사이트를 불러오지 못했어요"}
        bg={notFound ? "var(--color-peach)" : "var(--color-mustard)"}
      >
        <p className="font-body text-[13px] leading-relaxed">
          {notFound
            ? "링크가 만료되었거나 아직 발행되지 않은 사이트입니다. 보낸 사람에게 링크를 다시 확인해 주세요."
            : "잠시 후 다시 시도해 주세요."}
        </p>
        <div className="mt-5 flex gap-2">
          {!notFound && (
            <NeoButton bg="var(--color-mustard)" size="sm" onClick={load}>
              다시 시도
            </NeoButton>
          )}
          <NeoButton bg="var(--color-cream)" size="sm" href="/">
            홈으로
          </NeoButton>
        </div>
      </PlayerMessage>
    );
  }

  if (total === 0) {
    return (
      <PlayerMessage title="아직 준비 중이에요" bg="var(--color-mint)">
        <p className="font-body text-[13px] leading-relaxed">이 사이트에는 아직 슬라이드가 없습니다.</p>
      </PlayerMessage>
    );
  }

  const free = policy.mode === "free";
  const showEscape = !free && canEscape && !finished;

  return (
    <div className="flex items-center justify-center bg-ink min-h-dvh w-full">
      {/* 슬라이드 캔버스 — position:relative + 크기만 제공. 스타일 주입 금지 */}
      <div
        className="neo-border-4 bg-cream relative overflow-hidden"
        style={{
          width: `min(100vw, ${STAGE_MAX_W}px)`,
          height: `min(100dvh, ${STAGE_MAX_H}px)`,
        }}
      >
        {slide ? (
          // values는 서버에서 이미 병합된 최종 값 — 그대로 넘긴다 (재병합 금지)
          <SlideCanvas
            slideKey={index}
            componentRef={slide.componentRef}
            values={slide.values}
            onComplete={handleCompleteHere}
            onSkip={goNext}
          />
        ) : (
          <EndScreen title={state.snapshot.title} onRestart={restart} />
        )}

        {/* 플레이어 크롬 — 슬라이드 위에 겹치는 오버레이.
            슬라이드 내부 z-index 최대값은 10 (BalloonPop.tsx:89, Flashlight.tsx:98 —
            둘 다 inset:0 풀커버 오버레이)이므로 크롬은 50으로 항상 위에 온다. */}
        {slide && (
          <div className="absolute top-0 left-0 right-0 z-50 flex items-start justify-between gap-2 p-2.5 pointer-events-none">
            {policy.showProgress ? (
              <StatusBadge variant="default">
                {index + 1} / {total}
              </StatusBadge>
            ) : (
              <span />
            )}

            <div className="flex gap-1.5 pointer-events-auto">
              {free && index > 0 && (
                <NeoButton bg="var(--color-cream)" size="sm" shadow={3} onClick={goPrev}>
                  이전
                </NeoButton>
              )}
              {free && (
                <NeoButton bg="var(--color-mustard)" size="sm" shadow={3} onClick={goNext}>
                  다음
                </NeoButton>
              )}
              {showEscape && (
                <NeoButton bg="var(--color-cream)" size="sm" shadow={3} onClick={goNext}>
                  건너뛰기
                </NeoButton>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 종료 화면
// ─────────────────────────────────────────────────────────────────────────────
function EndScreen({ title, onRestart }: { title: string; onRestart: () => void }) {
  return (
    <div className="bg-cream absolute inset-0 flex flex-col items-center justify-center p-6">
      <NeoCard bg="var(--color-mustard)" pad={24} shadow={6}>
        <div className="text-center">
          <div className="font-pixel text-[10px] mb-3">THE END</div>
          <h1 className="font-headline text-[24px] mb-2">{title}</h1>
          <p className="font-body text-[13px] leading-relaxed mb-5">끝까지 봐주셔서 고마워요 🎁</p>
          <div className="flex justify-center gap-2">
            <NeoButton bg="var(--color-pink)" size="sm" onClick={onRestart}>
              처음부터 다시 보기
            </NeoButton>
            <NeoButton bg="var(--color-cream)" size="sm" href="/">
              JoyCraft
            </NeoButton>
          </div>
        </div>
      </NeoCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 로딩 / 에러 공통 화면
// ─────────────────────────────────────────────────────────────────────────────
function PlayerMessage({ title, bg, children }: { title: string; bg: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-center bg-ink px-6 min-h-dvh">
      <NeoCard bg={bg} pad={24} shadow={6} className="max-w-[420px] w-full">
        <h1 className="font-headline text-[22px] mb-3">{title}</h1>
        {children}
      </NeoCard>
    </div>
  );
}
