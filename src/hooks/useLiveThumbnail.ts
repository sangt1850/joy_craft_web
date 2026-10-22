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
  /** 5초마다 증가 → React가 슬라이드를 remount해 처음부터 재시작 */
  slideKey: number;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  /** 루트 div에 붙일 ref (IntersectionObserver + 크기 측정 공용) */
  ioRef: React.RefObject<HTMLDivElement | null>;
}

export function useLiveThumbnail(templateId: string): UseLiveThumbnailResult {
  const [phase, setPhase] = useState<Phase>("idle");
  const [detail, setDetail] = useState<TemplateDetailResponse | null>(null);
  // slideKey: 5초마다 증가 → 슬라이드를 remount해 처음부터 재시작
  const [slideKey, setSlideKey] = useState(0);

  const phaseRef = useRef<Phase>("idle");
  const cancelledRef = useRef(false);
  const detailRef = useRef<TemplateDetailResponse | null>(null);
  const ioRef = useRef<HTMLDivElement | null>(null);

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
      if (ref3D && !can3DActivate()) { setPhase("idle"); phaseRef.current = "idle"; return; }
      if (!ref3D && !can2DActivate()) { setPhase("idle"); phaseRef.current = "idle"; return; }
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

  useEffect(() => { doActivateRef.current = doActivate; }, [doActivate]);
  useEffect(() => { doDeactivateRef.current = doDeactivate; }, [doDeactivate]);

  // IntersectionObserver — 뷰포트 진입 시 activate, 이탈 시 deactivate
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

  // active 상태에서 5초마다 슬라이드 remount → 처음부터 재시작
  useEffect(() => {
    if (phase !== "active") return;
    const t = setInterval(() => setSlideKey((k) => k + 1), 5000);
    return () => clearInterval(t);
  }, [phase]);

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

  return { phase, componentRef: detail?.componentRef ?? null, slideValues, is3D, slideKey, onMouseEnter, onMouseLeave, ioRef };
}
