// 슬라이드 1장을 그리는 공통 캔버스 — 플레이어와 에디터 미리보기가 함께 쓴다.
//
// 슬라이드(src/slides/**)는 디자인 시스템을 따르지 않는 독립 캔버스다.
// 전부 position:absolute; inset:0 풀블리드이므로 **여기서 스타일을 주입하지 않는다.**
// 크기/보더는 이 컴포넌트를 감싸는 쪽(position:relative 컨테이너)이 책임진다.
//
// 이 컴포넌트가 책임지는 것 3가지
//  1. componentRef → 컴포넌트 조회, 미등록이면 폴백 화면
//  2. SlideErrorBoundary로 감싸기 (값이 비면 렌더 중 throw하는 슬라이드가 있다)
//  3. slideKey가 바뀌면 리마운트 — 18종 중 14종이 언마운트 시 타이머를 정리하지 않아
//     죽은 타이머가 다음 슬라이드에서 튀는 것을 막는다
// 슬라이드 18종을 레지스트리에 등록한다(사이드 이펙트 import).
// 등록을 App이 아니라 **여기서** 하는 이유: SlideCanvas를 쓰는 곳은 플레이어와 에디터뿐이고
// 둘 다 지연 로딩되는 라우트다. App에서 등록하면 랜딩 페이지를 여는 사람까지
// 18종 슬라이드 코드를 전부 내려받게 된다.
import "../../slides";
import NeoCard from "../ui/NeoCard";
import NeoButton from "../ui/NeoButton";
import SlideErrorBoundary from "./SlideErrorBoundary";
import { resolveSlide } from "../../slides/registry";

interface SlideCanvasProps {
  /** 리마운트 + 에러 상태 리셋 키 (플레이어는 인덱스, 에디터는 슬라이드 id) */
  slideKey: string | number;
  componentRef: string;
  /** 슬라이드에 넘길 최종 데이터 (이미 병합된 값) */
  values: Record<string, unknown>;
  /** 에디터 미리보기 모드 — 슬라이드가 자동 전환을 하지 않는다 */
  isPreview?: boolean;
  /** 완료 콜백. 리렌더마다 새 함수를 넘기면 슬라이드 내부 effect가 다시 돌 수 있으니 안정적으로 유지할 것 */
  onComplete?: () => void;
  /** 렌더 실패/미지원일 때 빠져나가는 경로 */
  onSkip: () => void;
  /** 폴백 화면의 버튼 문구 */
  skipLabel?: string;
}

export default function SlideCanvas({
  slideKey,
  componentRef,
  values,
  isPreview,
  onComplete,
  onSkip,
  skipLabel = "다음으로",
}: SlideCanvasProps) {
  return (
    <SlideErrorBoundary key={slideKey} resetKey={slideKey} onSkip={onSkip}>
      <SlideBody
        componentRef={componentRef}
        values={values}
        isPreview={isPreview}
        onComplete={onComplete}
        onSkip={onSkip}
        skipLabel={skipLabel}
      />
    </SlideErrorBoundary>
  );
}

type SlideBodyProps = Omit<SlideCanvasProps, "slideKey">;

function SlideBody({ componentRef, values, isPreview, onComplete, onSkip, skipLabel }: SlideBodyProps) {
  const SlideComponent = resolveSlide(componentRef);

  if (!SlideComponent) {
    return (
      <div className="bg-cream absolute inset-0 flex items-center justify-center p-6">
        <NeoCard bg="var(--color-peach)" pad={20} shadow={5}>
          <h2 className="font-headline text-[18px] mb-2">표시할 수 없는 슬라이드</h2>
          <p className="font-body text-[12px] leading-relaxed mb-4">
            이 슬라이드 유형은 현재 버전에서 지원하지 않습니다.
          </p>
          <p className="font-pixel text-[10px] mb-4 break-all">{componentRef}</p>
          <NeoButton bg="var(--color-mustard)" size="sm" onClick={onSkip}>
            {skipLabel}
          </NeoButton>
        </NeoCard>
      </div>
    );
  }

  return <SlideComponent data={values} onComplete={onComplete} isPreview={isPreview} />;
}
