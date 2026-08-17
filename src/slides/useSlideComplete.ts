import { useCallback, useEffect, useRef } from "react";

/**
 * 슬라이드가 완료 신호를 안전하게 보내기 위한 헬퍼.
 *
 * - `isPreview`면 호출하지 않는다 (에디터 미리보기에서 화면이 넘어가면 안 된다)
 * - 슬라이드 인스턴스당 한 번만 호출된다
 * - 언마운트 이후에는 호출되지 않는다 (지연 타이머가 죽은 뒤 완료를 쏘는 사고 방지)
 */
export function useSlideComplete(onComplete?: () => void, isPreview?: boolean) {
  const aliveRef = useRef(true);
  const firedRef = useRef(false);
  const cbRef = useRef(onComplete);
  cbRef.current = onComplete;

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  return useCallback(() => {
    if (isPreview) return;
    if (firedRef.current || !aliveRef.current) return;
    firedRef.current = true;
    cbRef.current?.();
  }, [isPreview]);
}
