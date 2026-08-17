// editorStore 저장 안전성 회귀 테스트 (M2.5)
//
// 여기서 지키려는 계약은 두 가지다.
//  1) 저장이 실패하면 flush()/saveDraft()가 **실패를 알린다** (조용히 성공하지 않는다).
//     addSlide/removeSlide는 실패한 flush 뒤에 진행하지 않는다 —
//     진행하면 서버 응답으로 site를 갈아끼우며 미저장 편집이 영구 소실된다.
//  2) 저장이 진행 중(inflight)일 때 flush()는 **그 저장을 기다린다**.
//     예약만 하고 즉시 resolve하면 호출자가 "저장됐다"고 착각한다.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { SiteDetailResponse, SlideResponse } from "../types/api";

vi.mock("../api/editor", () => ({
  fetchSiteDetail: vi.fn(),
  updateSlide: vi.fn(),
  removeSlide: vi.fn(),
  reorderSlides: vi.fn(),
  addSlide: vi.fn(),
  updateSite: vi.fn(),
}));

import * as api from "../api/editor";
import { useEditorStore, UnsavedChangesError } from "./editorStore";

const mocked = vi.mocked(api);

function makeSlide(id: string, overrides: Record<string, unknown> = {}): SlideResponse {
  return {
    id,
    position: 0,
    templateId: "tpl-1",
    templateName: "테스트 슬라이드",
    componentRef: "quiz",
    schema: [],
    defaultValues: { title: "기본" },
    overrides,
    escapeAfter: null,
  };
}

function makeSite(slides: SlideResponse[]): SiteDetailResponse {
  return {
    id: "site-1",
    title: "테스트 사이트",
    theme: null,
    background: null,
    flowPolicy: null,
    timezone: "Asia/Seoul",
    status: "DRAFT",
    slides: slides.map((s, i) => ({ ...s, position: i })),
    updatedAt: "2026-01-01T00:00:00Z",
  };
}

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** 마이크로태스크를 넉넉히 흘려보낸다 (예약만 하고 즉시 resolve하는 구현을 잡아내기 위해) */
async function tick(n = 30) {
  for (let i = 0; i < n; i++) await Promise.resolve();
}

async function loadFixture(slides: SlideResponse[]) {
  mocked.fetchSiteDetail.mockResolvedValue(makeSite(slides));
  await useEditorStore.getState().loadSite("site-1");
}

beforeEach(() => {
  vi.clearAllMocks();
  useEditorStore.getState().reset();
});

afterEach(() => {
  useEditorStore.getState().reset();
});

describe("saveDraft — 실패를 삼키지 않는다", () => {
  it("저장이 성공하면 true를 반환하고 dirty가 풀린다", async () => {
    await loadFixture([makeSlide("s1")]);
    mocked.updateSlide.mockResolvedValue(makeSlide("s1"));

    useEditorStore.getState().updateSlideOverrides("s1", { title: "편집됨" });
    const ok = await useEditorStore.getState().saveDraft();

    expect(ok).toBe(true);
    expect(useEditorStore.getState().isDirty).toBe(false);
    expect(useEditorStore.getState().saveError).toBe(false);
  });

  it("저장이 실패하면 false를 반환하고 dirty/편집분을 유지한다", async () => {
    await loadFixture([makeSlide("s1")]);
    mocked.updateSlide.mockRejectedValue(new Error("500"));

    useEditorStore.getState().updateSlideOverrides("s1", { title: "편집됨" });
    const ok = await useEditorStore.getState().saveDraft();

    expect(ok).toBe(false);
    expect(useEditorStore.getState().saveError).toBe(true);
    expect(useEditorStore.getState().isDirty).toBe(true);
    expect(useEditorStore.getState().site?.slides[0].overrides).toEqual({ title: "편집됨" });
  });

  it("저장할 것이 없으면 true를 반환한다", async () => {
    await loadFixture([makeSlide("s1")]);
    await expect(useEditorStore.getState().saveDraft()).resolves.toBe(true);
    expect(mocked.updateSlide).not.toHaveBeenCalled();
  });
});

describe("flush — 인플라이트 저장을 기다린다", () => {
  it("저장이 진행 중이면 그 저장이 끝날 때까지 resolve하지 않는다", async () => {
    await loadFixture([makeSlide("s1")]);
    const gate = deferred<SlideResponse>();
    mocked.updateSlide.mockReturnValue(gate.promise);

    useEditorStore.getState().updateSlideOverrides("s1", { title: "A" });
    const first = useEditorStore.getState().saveDraft(); // 인플라이트 시작
    expect(useEditorStore.getState().isSaving).toBe(true);

    let flushed = false;
    const flushing = useEditorStore
      .getState()
      .flush()
      .then((ok) => {
        flushed = true;
        return ok;
      });

    await tick();
    expect(flushed).toBe(false); // 아직 서버 응답 전 — 기다려야 한다

    gate.resolve(makeSlide("s1"));
    await expect(flushing).resolves.toBe(true);
    await first;
    expect(useEditorStore.getState().isDirty).toBe(false);
  });

  it("인플라이트 저장이 실패하면 flush도 false를 반환한다", async () => {
    await loadFixture([makeSlide("s1")]);
    const gate = deferred<SlideResponse>();
    mocked.updateSlide.mockReturnValue(gate.promise);

    useEditorStore.getState().updateSlideOverrides("s1", { title: "A" });
    const first = useEditorStore.getState().saveDraft();
    const flushing = useEditorStore.getState().flush();

    gate.reject(new Error("500"));
    await expect(flushing).resolves.toBe(false);
    await expect(first).resolves.toBe(false);
    expect(useEditorStore.getState().isDirty).toBe(true);
  });

  it("인플라이트 중에 생긴 편집도 flush가 저장한다", async () => {
    await loadFixture([makeSlide("s1"), makeSlide("s2")]);
    const gate = deferred<SlideResponse>();
    mocked.updateSlide.mockReturnValueOnce(gate.promise);

    useEditorStore.getState().updateSlideOverrides("s1", { title: "A" });
    const first = useEditorStore.getState().saveDraft();

    // 저장이 나가 있는 동안 다른 슬라이드를 편집한다
    useEditorStore.getState().updateSlideOverrides("s2", { title: "B" });

    mocked.updateSlide.mockResolvedValue(makeSlide("s2"));
    const flushing = useEditorStore.getState().flush();
    gate.resolve(makeSlide("s1"));

    await expect(flushing).resolves.toBe(true);
    await first;
    expect(useEditorStore.getState().isDirty).toBe(false);
    expect(mocked.updateSlide).toHaveBeenCalledTimes(2);
  });
});

describe("addSlide / removeSlide — 저장 실패 시 중단한다", () => {
  it("addSlide: flush가 실패하면 서버 호출 없이 throw하고 편집분을 지킨다", async () => {
    await loadFixture([makeSlide("s1")]);
    mocked.updateSlide.mockRejectedValue(new Error("500"));
    mocked.addSlide.mockResolvedValue(makeSite([makeSlide("s1"), makeSlide("s2")]));

    useEditorStore.getState().updateSlideOverrides("s1", { title: "지키고 싶은 편집" });

    await expect(useEditorStore.getState().addSlide("tpl-2")).rejects.toBeInstanceOf(
      UnsavedChangesError
    );

    expect(mocked.addSlide).not.toHaveBeenCalled();
    expect(useEditorStore.getState().site?.slides).toHaveLength(1);
    expect(useEditorStore.getState().site?.slides[0].overrides).toEqual({
      title: "지키고 싶은 편집",
    });
    expect(useEditorStore.getState().dirtySlideIds).toEqual(["s1"]);
    expect(useEditorStore.getState().isDirty).toBe(true);
  });

  it("addSlide: 저장이 성공하면 정상 진행한다", async () => {
    await loadFixture([makeSlide("s1")]);
    mocked.updateSlide.mockResolvedValue(makeSlide("s1"));
    mocked.addSlide.mockResolvedValue(makeSite([makeSlide("s1"), makeSlide("s2")]));

    useEditorStore.getState().updateSlideOverrides("s1", { title: "편집됨" });
    await useEditorStore.getState().addSlide("tpl-2");

    expect(mocked.addSlide).toHaveBeenCalledWith("site-1", "tpl-2");
    expect(useEditorStore.getState().site?.slides).toHaveLength(2);
    expect(useEditorStore.getState().selectedSlideId).toBe("s2");
  });

  it("removeSlide: flush가 실패하면 삭제 API를 부르지 않는다", async () => {
    await loadFixture([makeSlide("s1"), makeSlide("s2")]);
    mocked.updateSlide.mockRejectedValue(new Error("500"));

    useEditorStore.getState().updateSlideOverrides("s1", { title: "지키고 싶은 편집" });

    await expect(useEditorStore.getState().removeSlide("s2")).rejects.toBeInstanceOf(
      UnsavedChangesError
    );

    expect(mocked.removeSlide).not.toHaveBeenCalled();
    expect(useEditorStore.getState().site?.slides).toHaveLength(2);
    expect(useEditorStore.getState().site?.slides[0].overrides).toEqual({
      title: "지키고 싶은 편집",
    });
  });

  it("removeSlide: 인플라이트 저장 중이면 그 저장을 끝낸 뒤 삭제한다", async () => {
    await loadFixture([makeSlide("s1"), makeSlide("s2")]);
    const gate = deferred<SlideResponse>();
    mocked.updateSlide.mockReturnValue(gate.promise);
    mocked.removeSlide.mockResolvedValue(undefined);

    useEditorStore.getState().updateSlideOverrides("s1", { title: "A" });
    const saving = useEditorStore.getState().saveDraft();

    const removing = useEditorStore.getState().removeSlide("s2");
    await tick();
    expect(mocked.removeSlide).not.toHaveBeenCalled(); // 저장이 끝나기 전에 지우면 안 된다

    gate.resolve(makeSlide("s1"));
    await removing;
    await saving;
    expect(mocked.removeSlide).toHaveBeenCalledWith("site-1", "s2");
    expect(useEditorStore.getState().site?.slides).toHaveLength(1);
  });
});

describe("발행 전 안전 저장 (SiteEditorPage.handlePublish가 쓰는 계약)", () => {
  it("미저장 + 저장 실패면 flush가 false → 발행을 막을 수 있다", async () => {
    await loadFixture([makeSlide("s1")]);
    mocked.updateSlide.mockRejectedValue(new Error("500"));
    useEditorStore.getState().updateSlideOverrides("s1", { title: "편집됨" });

    // 페이지는 렌더 클로저가 아니라 getState()로 최신 상태를 읽는다
    const ok = await useEditorStore.getState().flush();
    expect(ok).toBe(false);
  });

  it("인플라이트 저장이 있으면 flush가 그것을 기다린 뒤 true를 준다", async () => {
    await loadFixture([makeSlide("s1")]);
    const gate = deferred<SlideResponse>();
    mocked.updateSlide.mockReturnValue(gate.promise);
    useEditorStore.getState().updateSlideOverrides("s1", { title: "편집됨" });
    const saving = useEditorStore.getState().saveDraft();

    let done = false;
    const flushing = useEditorStore
      .getState()
      .flush()
      .then((ok) => {
        done = true;
        return ok;
      });
    await tick();
    expect(done).toBe(false);

    gate.resolve(makeSlide("s1"));
    await expect(flushing).resolves.toBe(true);
    await saving;
  });
});
