import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { fetchTemplateDetailCached } from "../api/templates";
import { resolveSlideSchema } from "../slides/registry";
import { fillMissingWithDefaults } from "../slides/schemaAdapter";
import { isThreeDSlide } from "../slides/registry";
import {
  can2DActivate, register2D, unregister2D,
  can3DActivate, register3D, unregister3D,
} from "./activeThumbnailCount";
import type { TemplateDetailResponse } from "../types/api";

type Phase = "idle" | "loading" | "active" | "error";

export interface UseLiveThumbnailResult {
  phase: Phase;
  componentRef: string | null;
  slideValues: Record<string, unknown> | null;
  is3D: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  /** 루트 div에 붙일 ref (IntersectionObserver + 크기 측정 공용) */
  ioRef: React.RefObject<HTMLDivElement | null>;
}

export function useLiveThumbnail(templateId: string): UseLiveThumbnailResult {
  const [phase, setPhase] = useState<Phase>("idle");
  const [detail, setDetail] = useState<TemplateDetailResponse | null>(null);

  const phaseRef = useRef<Phase>("idle");
  const cancelledRef = useRef(false);
  const detailRef = useRef<TemplateDetailResponse | null>(null);
  const ioRef = useRef<HTMLDivElement | null>(null);

  // 항상 최신 함수를 가리키는 ref — IO 콜백이 stale closure 없이 호출
  const doActivateRef = useRef<() => void>(() => {});
  const doDeactivateRef = useRef<() => void>(() => {});

  const is3D = detail ? isThreeDSlide(detail.componentRef) : false;

  const slideValues = useMemo(() => {
    if (!detail) return null;
    const localSchema = resolveSlideSchema(detail.componentRef);
    return localSchema
      ? fillMissingWithDefaults(localSchema, detail.defaultValues)
      : detail.defaultValues;
  }, [detail]);

  const doDeactivate = useCallback(() => {
    const d = detailRef.current;
    if (phaseRef.current === "active" && d) {
      if (isThreeDSlide(d.componentRef)) unregister3D();
      else unregister2D();
    }
    setPhase("idle");
    phaseRef.current = "idle";
  }, []);

  const doActivate = useCallback(async () => {
    if (phaseRef.current === "active" || phaseRef.current === "loading") return;
    cancelledRef.current = false;
    setPhase("loading");
    phaseRef.current = "loading";
    try {
      const d = await fetchTemplateDetailCached(templateId);
      if (cancelledRef.current) return;
      const ref3D = isThreeDSlide(d.componentRef);
      if (ref3D && !can3DActivate()) {
        setPhase("idle");
        phaseRef.current = "idle";
        return;
      }
      if (!ref3D && !can2DActivate()) {
        setPhase("idle");
        phaseRef.current = "idle";
        return;
      }
      detailRef.current = d;
      setDetail(d);
      if (ref3D) register3D(); else register2D();
      setPhase("active");
      phaseRef.current = "active";
    } catch (err) {
      if (cancelledRef.current) return;
      console.error(`[LiveThumbnail] 템플릿 로드 실패 (id=${templateId}):`, err);
      setPhase("error");
      phaseRef.current = "error";
    }
  }, [templateId]);

  // ref 동기화
  useEffect(() => { doActivateRef.current = doActivate; }, [doActivate]);
  useEffect(() => { doDeactivateRef.current = doDeactivate; }, [doDeactivate]);

  // IntersectionObserver — 뷰포트 진입/이탈로 자동 activate/deactivate
  // 마운트 시 1회 생성, 내부에서 항상 최신 함수 ref를 통해 호출
  useEffect(() => {
    const el = ioRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          doActivateRef.current();
        } else {
          if (phaseRef.current === "loading") cancelledRef.current = true;
          doDeactivateRef.current();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // hover — 뷰포트 이탈 딜레이 취소 (hover 중이면 계속 표시)
  const onMouseEnter = useCallback(() => {}, []);
  const onMouseLeave = useCallback(() => {}, []);

  // 언마운트 정리
  useEffect(() => {
    return () => {
      const d = detailRef.current;
      if (phaseRef.current === "active" && d) {
        if (isThreeDSlide(d.componentRef)) unregister3D();
        else unregister2D();
      }
    };
  }, []);

  return { phase, componentRef: detail?.componentRef ?? null, slideValues, is3D, onMouseEnter, onMouseLeave, ioRef };
}
