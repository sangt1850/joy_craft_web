import { useCallback, useEffect, useRef } from "react";

/**
 * 언마운트 시 자동으로 정리되는 setTimeout.
 *
 * 슬라이드는 대부분 "1~2초 뒤에 완료를 알린다" 같은 지연 동작을 갖는다.
 * 그런데 정리하지 않은 타이머는 슬라이드가 사라진 뒤에도 살아남아,
 * 이미 다음 장으로 넘어간 상태에서 콜백을 쏘거나 죽은 컴포넌트의 상태를 건드린다.
 *
 * 반환된 `later`로 예약한 타이머는 언마운트될 때 전부 취소된다.
 *
 * ```tsx
 * const later = useSlideTimeout();
 * later(() => setOpen(true), 300);
 * ```
 */
export function useSlideTimeout() {
  const idsRef = useRef<number[]>([]);

  useEffect(() => {
    const ids = idsRef;
    return () => {
      ids.current.forEach((id) => window.clearTimeout(id));
      ids.current = [];
    };
  }, []);

  return useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      // 이미 실행된 id는 목록에서 빼둔다 (오래 머무는 슬라이드에서 배열이 계속 커지지 않게)
      idsRef.current = idsRef.current.filter((x) => x !== id);
      fn();
    }, ms);
    idsRef.current.push(id);
    return id;
  }, []);
}
