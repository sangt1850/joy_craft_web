import { create } from "zustand";
import {
  fetchSiteDetail,
  updateSlide as apiUpdateSlide,
  removeSlide as apiRemoveSlide,
  reorderSlides as apiReorderSlides,
  addSlide as apiAddSlide,
  updateSite as apiUpdateSite,
} from "../api/editor";
import type { SiteDetailResponse, SlideResponse } from "../types/api";

/**
 * 미저장 편집을 서버에 반영하지 못해 구조 변경(추가/삭제/발행)을 중단했을 때 던진다.
 * 그냥 진행하면 서버 응답이 site를 통째로 갈아끼우면서 편집분이 영구 소실된다.
 */
export class UnsavedChangesError extends Error {
  constructor() {
    super("저장하지 못한 변경이 있어 작업을 중단했습니다.");
    this.name = "UnsavedChangesError";
  }
}

interface EditorState {
  site: SiteDetailResponse | null;
  selectedSlideId: string | null;
  /** 저장되지 않은 변경이 하나라도 있는가 (dirtySlideIds + titleDirty의 요약) */
  isDirty: boolean;
  isSaving: boolean;
  /** 마지막 저장이 실패했는가 — 실패해도 dirty 상태는 유지된다 */
  saveError: boolean;
  /** 편집됐지만 아직 서버에 반영되지 않은 슬라이드 id 목록 */
  dirtySlideIds: string[];
  titleDirty: boolean;

  loadSite: (id: string) => Promise<void>;
  selectSlide: (id: string) => void;
  /** 선택 슬라이드의 overrides를 비워 기본값으로 되돌린다 */
  resetSlideOverrides: (slideId: string) => void;
  /** 저장 실패 시 UnsavedChangesError를 던지고 아무것도 추가하지 않는다 */
  addSlide: (templateId: string) => Promise<void>;
  /** 저장 실패 시 UnsavedChangesError를 던지고 아무것도 삭제하지 않는다 */
  removeSlide: (slideId: string) => Promise<void>;
  reorderSlides: (slideIds: string[]) => Promise<void>;
  updateSlideOverrides: (slideId: string, overrides: Record<string, unknown>) => void;
  /** 저장 성공 여부를 반환한다. 실패해도 throw하지 않는다(= 이벤트 핸들러에서 안전) */
  saveDraft: () => Promise<boolean>;
  /**
   * 예약된 저장을 지금 실행하고 **끝날 때까지 기다린다**.
   * 인플라이트 저장이 있으면 그것도 기다린다. 반환값 = 모든 편집이 서버에 반영됐는가.
   * 구조 변경 API(추가/삭제)·발행 직전에 반드시 호출한다.
   */
  flush: () => Promise<boolean>;
  updateTitle: (title: string) => void;
  /** 에디터를 떠날 때 — 예약된 저장을 취소하고 상태를 비운다 */
  reset: () => void;
}

// const SAVE_DEBOUNCE_MS = 600;

// debounce 타이머. 스토어가 싱글턴이라 모듈 스코프에 두되,
// 예약/취소를 함수로 감싸고 loadSite·reset·saveDraft에서 반드시 정리한다.
// (기존 코드는 취소 경로가 없어 에디터를 떠난 뒤에도 저장이 튀었다)
let saveTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 진행 중인 저장 1건. 겹쳐 쏘지 않기 위해 존재하며,
 * **flush/saveDraft가 이것을 반드시 await한다** — 예약만 하고 돌아가면
 * 호출자가 "저장됐다"고 착각해 미저장 편집을 버리게 된다.
 */
let inflightSave: Promise<boolean> | null = null;

function cancelScheduledSave() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
}

export const useEditorStore = create<EditorState>()((set, get) => {
  // TODO: 자동 저장 스케줄러 — 향후 자동 저장 기능 복원 시 사용
  // const scheduleSave = () => {
  //   cancelScheduledSave();
  //   saveTimer = setTimeout(() => {
  //     saveTimer = null;
  //     void get().saveDraft();
  //   }, SAVE_DEBOUNCE_MS);
  // };

  /**
   * 예약된 저장을 지금 실행하고 기다린다 (구조 변경 API 호출 전에 쓴다).
   * saveDraft가 인플라이트 대기·dirty 없음 처리를 모두 맡으므로 그대로 위임한다.
   */
  const flush = (): Promise<boolean> => get().saveDraft();

  return {
    site: null,
    selectedSlideId: null,
    isDirty: false,
    isSaving: false,
    saveError: false,
    dirtySlideIds: [],
    titleDirty: false,

    loadSite: async (id: string) => {
      cancelScheduledSave();
      const site = await fetchSiteDetail(id);
      set({
        site,
        selectedSlideId: site.slides[0]?.id ?? null,
        isDirty: false,
        saveError: false,
        dirtySlideIds: [],
        titleDirty: false,
      });
    },

    selectSlide: (id: string) => set({ selectedSlideId: id }),

    addSlide: async (templateId: string) => {
      const { site } = get();
      if (!site) return;
      // 서버가 사이트 전체를 다시 내려주므로 미저장 편집이 덮이지 않게 먼저 저장한다.
      // 저장이 실패했는데 그냥 진행하면 편집분이 조용히 사라진다 → 중단하고 호출자에게 알린다.
      if (!(await flush())) throw new UnsavedChangesError();
      const current = get().site;
      if (!current) return;
      const updated = await apiAddSlide(current.id, templateId);
      const newSlide = updated.slides[updated.slides.length - 1];
      set({
        site: updated,
        selectedSlideId: newSlide?.id ?? null,
        dirtySlideIds: [],
        titleDirty: false,
        isDirty: false,
      });
    },

    removeSlide: async (slideId: string) => {
      const { site } = get();
      if (!site) return;
      // 저장에 실패한 채로 지우면 다른 슬라이드의 미저장 편집까지 잃는다 → 중단한다
      if (!(await flush())) throw new UnsavedChangesError();
      const current = get().site;
      if (!current) return;

      await apiRemoveSlide(current.id, slideId);

      const remaining = current.slides.filter((s) => s.id !== slideId);
      const removedAt = current.slides.findIndex((s) => s.id === slideId);
      // 삭제된 자리 근처를 다시 고른다 (항상 첫 장으로 튀지 않도록)
      const nextSelected =
        get().selectedSlideId === slideId
          ? (remaining[Math.min(removedAt, remaining.length - 1)]?.id ?? null)
          : get().selectedSlideId;

      set({
        site: {
          ...current,
          slides: remaining.map((s, i) => ({ ...s, position: i })),
        },
        selectedSlideId: nextSelected,
        dirtySlideIds: get().dirtySlideIds.filter((id) => id !== slideId),
        isDirty: get().dirtySlideIds.filter((id) => id !== slideId).length > 0 || get().titleDirty,
      });
    },

    reorderSlides: async (slideIds: string[]) => {
      const { site } = get();
      if (!site) return;

      // 낙관적 적용 — 미저장 overrides를 그대로 들고 순서만 바꾼다
      const byId = new Map(site.slides.map((s) => [s.id, s]));
      const reordered = slideIds
        .map((id) => byId.get(id))
        .filter((s): s is SlideResponse => !!s)
        .map((s, i) => ({ ...s, position: i }));
      if (reordered.length !== site.slides.length) return;

      const before = site.slides;
      set({ site: { ...site, slides: reordered } });

      try {
        await apiReorderSlides(site.id, slideIds);
      } catch {
        // 실패하면 원래 순서로 되돌린다 (편집분은 유지된다)
        const cur = get().site;
        if (cur) set({ site: { ...cur, slides: before } });
      }
    },

    resetSlideOverrides: (slideId: string) => {
      const { site } = get();
      if (!site) return;
      const newSlides = site.slides.map((s) =>
        s.id === slideId ? { ...s, overrides: {} } : s
      );
      const dirty = get().dirtySlideIds.includes(slideId)
        ? get().dirtySlideIds
        : [...get().dirtySlideIds, slideId];
      set({ site: { ...site, slides: newSlides }, dirtySlideIds: dirty, isDirty: true });
    },

    updateSlideOverrides: (slideId: string, overrides: Record<string, unknown>) => {
      const { site } = get();
      if (!site) return;

      const newSlides = site.slides.map((s) =>
        s.id === slideId ? { ...s, overrides: { ...s.overrides, ...overrides } } : s
      );
      const dirty = get().dirtySlideIds.includes(slideId)
        ? get().dirtySlideIds
        : [...get().dirtySlideIds, slideId];

      set({ site: { ...site, slides: newSlides }, dirtySlideIds: dirty, isDirty: true });
    },

    updateTitle: (title: string) => {
      const { site } = get();
      if (!site) return;
      set({ site: { ...site, title }, titleDirty: true, isDirty: true });
    },

    /**
     * dirty한 슬라이드를 **전부** 저장한다.
     * (기존 버그: 선택된 슬라이드 하나만 저장해서 다른 슬라이드 편집분이 유실됐다)
     *
     * 반환값 = "지금 dirty한 편집이 서버에 반영됐는가".
     * - 저장할 게 없으면 true
     * - 인플라이트 저장이 있으면 그것을 기다린 뒤, 그 사이 쌓인 편집을 이어서 저장한다
     * - 실패하면 false (throw하지 않는다 — onBlur 같은 곳에서 void로 불린다)
     */
    saveDraft: async () => {
      cancelScheduledSave();

      // 저장 중이면 겹쳐 쏘지 않는다. 다만 **반드시 기다린다** —
      // 예약만 하고 true를 돌려주면 호출자가 저장됐다고 착각한다.
      if (inflightSave) {
        const ok = await inflightSave;
        if (!ok) return false;
        // 인플라이트가 처리하지 못한(그 사이 생긴) 편집이 남아 있으면 이어서 저장한다
        if (!get().isDirty) return true;
        return get().saveDraft();
      }

      const { site, dirtySlideIds, titleDirty } = get();
      if (!site) return true;
      if (dirtySlideIds.length === 0 && !titleDirty) return true;

      // 저장 시점의 overrides "객체 참조"를 기억한다.
      // 저장 중에 같은 슬라이드를 또 편집하면 참조가 바뀌므로 dirty로 남길 수 있다.
      const pending = dirtySlideIds
        .map((id) => site.slides.find((s) => s.id === id))
        .filter((s): s is SlideResponse => !!s)
        .map((s) => ({ id: s.id, overrides: s.overrides }));
      const savedTitle = site.title;

      set({ isSaving: true, saveError: false });

      const run = async (): Promise<boolean> => {
        try {
          for (const p of pending) {
            await apiUpdateSlide(site.id, p.id, { overrides: p.overrides });
          }
          if (titleDirty) {
            await apiUpdateSite(site.id, { title: savedTitle });
          }

          const cur = get().site;
          const stillDirty = get().dirtySlideIds.filter((id) => {
            const saved = pending.find((p) => p.id === id);
            if (!saved) return true; // 저장 중에 새로 dirty가 된 슬라이드
            const now = cur?.slides.find((s) => s.id === id);
            return !!now && now.overrides !== saved.overrides; // 저장 후 또 바뀌었다
          });
          const titleStillDirty = get().titleDirty && cur?.title !== savedTitle;

          set({
            isSaving: false,
            saveError: false,
            dirtySlideIds: stillDirty,
            titleDirty: titleStillDirty,
            isDirty: stillDirty.length > 0 || titleStillDirty,
          });
          return true;
        } catch {
          // dirty 상태를 유지해 다음 저장 때 다시 시도한다
          set({ isSaving: false, saveError: true });
          return false;
        }
      };

      const p = run();
      inflightSave = p;
      try {
        return await p;
      } finally {
        inflightSave = null;
      }
    },

    flush,

    reset: () => {
      cancelScheduledSave();
      set({
        site: null,
        selectedSlideId: null,
        isDirty: false,
        isSaving: false,
        saveError: false,
        dirtySlideIds: [],
        titleDirty: false,
      });
    },
  };
});
