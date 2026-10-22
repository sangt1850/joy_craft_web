/**
 * 체류 시간 누적 계산(프레임워크·DOM 비의존). useDwellTracker가 이벤트를 연결해 쓴다.
 * - activeMs: 탭이 보이는 구간만 누적
 * - hidden / blur: 탭 숨김·창 포커스 이탈 횟수
 */
export class DwellAccumulator {
  hidden = 0;
  blur = 0;

  private acc = 0;
  private since: number | null = null;
  private now: () => number;

  // tsconfig의 erasableSyntaxOnly 때문에 파라미터 프로퍼티를 쓸 수 없다
  constructor(now: () => number) {
    this.now = now;
  }

  /** 측정 시작. 이미 숨겨진 탭이면 아직 세지 않는다 */
  start(visible: boolean) {
    this.since = visible ? this.now() : null;
  }

  onVisibilityChange(visible: boolean) {
    if (!visible) {
      this.hidden += 1;
      this.pause();
    } else if (this.since == null) {
      this.since = this.now();
    }
  }

  onBlur() {
    this.blur += 1;
  }

  /** 측정 중단(누적값은 유지) */
  stop() {
    this.pause();
  }

  /** 지금까지의 활성 시간(ms) */
  read(): number {
    return this.acc + (this.since != null ? this.now() - this.since : 0);
  }

  private pause() {
    if (this.since != null) {
      this.acc += this.now() - this.since;
      this.since = null;
    }
  }
}
