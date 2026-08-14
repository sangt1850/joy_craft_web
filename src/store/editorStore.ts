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

interface EditorState {
  site: SiteDetailResponse | null;
  selectedSlideId: string | null;
  isDirty: boolean;
  isSaving: boolean;

  loadSite: (id: string) => Promise<void>;
  selectSlide: (id: string) => void;
  addSlide: (templateId: string) => Promise<void>;
  removeSlide: (slideId: string) => Promise<void>;
  reorderSlides: (slideIds: string[]) => Promise<void>;
  updateSlideOverrides: (slideId: string, overrides: Record<string, unknown>) => void;
  saveDraft: () => Promise<void>;
  updateTitle: (title: string) => void;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export const useEditorStore = create<EditorState>()((set, get) => ({
  site: null,
  selectedSlideId: null,
  isDirty: false,
  isSaving: false,

  loadSite: async (id: string) => {
    const site = await fetchSiteDetail(id);
    set({ site, selectedSlideId: site.slides[0]?.id ?? null });
  },

  selectSlide: (id: string) => set({ selectedSlideId: id }),

  addSlide: async (templateId: string) => {
    const { site } = get();
    if (!site) return;
    const updated = await apiAddSlide(site.id, templateId);
    const newSlide = updated.slides[updated.slides.length - 1];
    set({ site: updated, selectedSlideId: newSlide?.id ?? null });
  },

  removeSlide: async (slideId: string) => {
    const { site } = get();
    if (!site) return;
    await apiRemoveSlide(site.id, slideId);
    const updated = await fetchSiteDetail(site.id);
    set({ site: updated, selectedSlideId: updated.slides[0]?.id ?? null });
  },

  reorderSlides: async (slideIds: string[]) => {
    const { site } = get();
    if (!site) return;
    await apiReorderSlides(site.id, slideIds);
    const updated = await fetchSiteDetail(site.id);
    set({ site: updated });
  },

  updateSlideOverrides: (slideId: string, overrides: Record<string, unknown>) => {
    const { site } = get();
    if (!site) return;
    const newSlides = site.slides.map((s) =>
      s.id === slideId ? { ...s, overrides: { ...s.overrides, ...overrides } } : s
    );
    set({ site: { ...site, slides: newSlides }, isDirty: true });

    // debounced save
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => get().saveDraft(), 500);
  },

  updateTitle: (title: string) => {
    const { site } = get();
    if (!site) return;
    set({ site: { ...site, title }, isDirty: true });
  },

  saveDraft: async () => {
    const { site } = get();
    if (!site) return;
    set({ isSaving: true });
    try {
      const selectedId = get().selectedSlideId;
      if (selectedId) {
        const slide = site.slides.find((s) => s.id === selectedId);
        if (slide) {
          await apiUpdateSlide(site.id, selectedId, { overrides: slide.overrides });
        }
      }
      await apiUpdateSite(site.id, { title: site.title });
      set({ isDirty: false, isSaving: false });
    } catch {
      set({ isSaving: false });
    }
  },
}));
