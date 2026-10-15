// useSiteLiveThumbnail — 사이트의 첫 번째 슬라이드를 라이브 썸네일로 렌더한다.
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { fetchSiteDetail } from "../api/editor";
import { resolveSlideSchema } from "../slides/registry";
import { fillMissingWithDefaults } from "../slides/schemaAdapter";
import { isThreeDSlide } from "../slides/registry";
import {
  can2DActivate, register2D, unregister2D,
  can3DActivate, register3D, unregister3D,
} from "./activeThumbnailCount";
import type { SlideResponse } from "../types/api";

type Phase = "idle" | "loading" | "active" | "error";

export interface UseSiteLiveThumbnailResult {
  phase: Phase;
  componentRef: string | null;
  slideValues: Record<string, unknown> | null;
  slideKey: number;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  ioRef: React.RefObject<HTMLDivElement | null>;
}

const _cache = new Map<string, Promise<SlideResponse | null>>();

function fetchFirstSlideCached(siteId: string): Promise<SlideResponse | null> {
  if (!_cache.has(siteId)) {
    _cache.set(
      siteId,
      fetchSiteDetail(siteId)
        .then((d) => d.slides[0] ?? null)
        .catch((err) => {
          _cache.delete(siteId);
          throw err;
        })
    );
  }
  return _cache.get(siteId)!;
}

export function useSiteLiveThumbnail(siteId: string): UseSiteLiveThumbnailResult {
  const [phase, setPhase] = useState<Phase>("idle");
  const [slide, setSlide] = useState<SlideResponse | null>(null);
  const [slideKey, setSlideKey] = useState(0);

  const phaseRef = useRef<Phase>("idle");
  const cancelledRef = useRef(false);
  const slideRef = useRef<SlideResponse | null>(null);
  const ioRef = useRef<HTMLDivElement | null>(null);

  const doActivateRef = useRef<() => void>(() => {});
  const doDeactivateRef = useRef<() => void>(() => {});

  const slideValues = useMemo(() => {
    if (!slide) return null;
    const localSchema = resolveSlideSchema(slide.componentRef);
    const merged = { ...slide.defaultValues, ...slide.overrides };
    return localSchema ? fillMissingWithDefaults(localSchema, merged) : merged;
  }, [slide]);

  const doDeactivate = useCallback(() => {
    const s = slideRef.current;
    if (phaseRef.current === "active" && s) {
      if (isThreeDSlide(s.componentRef)) unregister3D();
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
      const s = await fetchFirstSlideCached(siteId);
      if (cancelledRef.current) return;
      if (!s) { setPhase("idle"); phaseRef.current = "idle"; return; }
      const ref3D = isThreeDSlide(s.componentRef);
      if (ref3D && !can3DActivate()) { setPhase("idle"); phaseRef.current = "idle"; return; }
      if (!ref3D && !can2DActivate()) { setPhase("idle"); phaseRef.current = "idle"; return; }
      slideRef.current = s;
      setSlide(s);
      if (ref3D) register3D(); else register2D();
      setPhase("active");
      phaseRef.current = "active";
    } catch (err) {
      if (cancelledRef.current) return;
      console.error(`[SiteLiveThumbnail] 사이트 로드 실패 (id=${siteId}):`, err);
      setPhase("error");
      phaseRef.current = "error";
    }
  }, [siteId]);

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

  useEffect(() => {
    return () => {
      const s = slideRef.current;
      if (phaseRef.current === "active" && s) {
        if (isThreeDSlide(s.componentRef)) unregister3D();
        else unregister2D();
      }
    };
  }, []);

  // active 상태에서 5초마다 슬라이드 remount → 처음부터 재시작
  useEffect(() => {
    if (phase !== "active") return;
    const t = setInterval(() => setSlideKey((k) => k + 1), 5000);
    return () => clearInterval(t);
  }, [phase]);

  const onMouseEnter = useCallback(() => {}, []);
  const onMouseLeave = useCallback(() => {}, []);

  return { phase, componentRef: slide?.componentRef ?? null, slideValues, slideKey, onMouseEnter, onMouseLeave, ioRef };
}
