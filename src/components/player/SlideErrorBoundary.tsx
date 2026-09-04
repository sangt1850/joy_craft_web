// 슬라이드 렌더 중 발생한 예외를 잡아 플레이어 전체가 백지가 되는 것을 막는다.
//
// 슬라이드(src/slides/**)는 서버가 내려준 values를 그대로 신뢰하고 그린다.
// 값이 비거나 형태가 어긋나면 렌더 중 throw할 수 있고(예: undefined.replace),
// 그러면 React가 트리 전체를 언마운트해 건너뛰기 버튼까지 사라진다.
// 이 경계는 슬라이드 캔버스 영역만 폴백으로 대체하고, 플레이어 크롬은 살려둔다.
import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import NeoCard from "../ui/NeoCard";
import NeoButton from "../ui/NeoButton";

interface SlideErrorBoundaryProps {
  /** 값이 바뀌면 에러 상태를 초기화한다 (보통 슬라이드 인덱스) */
  resetKey: string | number;
  /** 폴백에서 "다음으로" 눌렀을 때 */
  onSkip: () => void;
  children: ReactNode;
}

interface SlideErrorBoundaryState {
  error: Error | null;
  resetKey: string | number;
}

export default class SlideErrorBoundary extends Component<
  SlideErrorBoundaryProps,
  SlideErrorBoundaryState
> {
  constructor(props: SlideErrorBoundaryProps) {
    super(props);
    this.state = { error: null, resetKey: props.resetKey };
  }

  static getDerivedStateFromError(error: Error): Partial<SlideErrorBoundaryState> {
    return { error };
  }

  static getDerivedStateFromProps(
    props: SlideErrorBoundaryProps,
    state: SlideErrorBoundaryState
  ): Partial<SlideErrorBoundaryState> | null {
    // 다른 슬라이드로 넘어가면 에러 상태를 푼다
    if (props.resetKey !== state.resetKey) {
      return { error: null, resetKey: props.resetKey };
    }
    return null;
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[SlideErrorBoundary] 슬라이드 렌더 실패", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="absolute inset-0 bg-bg flex items-center justify-center p-6">
        <NeoCard bg="var(--color-surface)" pad={20} shadow={5}>
          <h2 className="font-headline text-[18px] mb-2">이 슬라이드를 표시할 수 없어요</h2>
          <p className="font-body text-[12px] leading-relaxed mb-4">
            내용을 불러오는 중 문제가 생겼습니다. 다음 장으로 넘어가 주세요.
          </p>
          <NeoButton bg="var(--color-secondary)" size="sm" onClick={this.props.onSkip}>
            다음으로
          </NeoButton>
        </NeoCard>
      </div>
    );
  }
}
