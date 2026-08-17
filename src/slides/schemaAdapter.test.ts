import { describe, it, expect } from "vitest";
import "./index"; // 18종 등록 (side effect)
import {
  KIND_TO_TYPE,
  serverFieldToFieldDef,
  serverSchemaToSlideSchema,
  resolveEditorSchema,
  mergeSlideValues,
  fillMissingWithDefaults,
} from "./schemaAdapter";
import { resolveSlide, resolveSlideSchema, registeredSlideRefs } from "./registry";
import {
  parseArrayValue,
  serializeArrayValue,
  makeArrayItem,
  setItemValue,
  moveArrayItem,
} from "./arrayFieldValue";
import type { SchemaField } from "../types/api";
import type { SchemaFieldDef } from "./SlideProps";

const ALL_REFS = [
  "pin-lock", "fingerprint", "quiz", "roulette",
  "scratch-lottery", "flashlight", "gift-box", "photo-puzzle",
  "heart-gauge", "balloon-pop",
  "envelope-letter", "typewriter", "rolling-paper", "cassette-player",
  "story-book", "ending-credits",
  "dday-counter", "wish-lantern",
];

const ARRAY_SLIDES: { ref: string; key: string }[] = [
  { ref: "quiz", key: "questions" },
  { ref: "roulette", key: "slices" },
  { ref: "story-book", key: "pages" },
  { ref: "ending-credits", key: "credits" },
  { ref: "balloon-pop", key: "balloons" },
  { ref: "cassette-player", key: "tracks" },
  { ref: "flashlight", key: "spots" },
  { ref: "rolling-paper", key: "seedNotes" },
];

// ─────────────────────────────────────────────────────────────────────────────
// kind → type 변환
// ─────────────────────────────────────────────────────────────────────────────
describe("서버 kind → 로컬 type 변환", () => {
  it("5종 kind가 전부 매핑된다", () => {
    expect(KIND_TO_TYPE).toEqual({
      string: "text",
      color: "color",
      number: "number",
      font: "font",
      image: "image",
    });
  });

  it("필드 1개를 변환한다", () => {
    const f: SchemaField = { key: "question", label: "질문 문구", field: { kind: "string" } };
    expect(serverFieldToFieldDef(f)).toEqual({
      key: "question",
      label: "질문 문구",
      type: "text",
      default: "",
    });
  });

  it("number의 min/max를 옮기고 default를 min으로 잡는다", () => {
    const f: SchemaField = { key: "n", label: "N", field: { kind: "number", min: 3, max: 9 } };
    expect(serverFieldToFieldDef(f)).toEqual({
      key: "n", label: "N", type: "number", default: 3, min: 3, max: 9,
    });
  });

  it("label이 비면 key를 쓴다", () => {
    const f: SchemaField = { key: "k", label: "", field: { kind: "color" } };
    const def = serverFieldToFieldDef(f);
    expect(def.label).toBe("k");
    expect(def.default).toBe("#111111");
  });

  it("모르는 kind는 text로 떨어진다 (조용히 죽지 않는다)", () => {
    const f = { key: "x", label: "X", field: { kind: "wat" } } as unknown as SchemaField;
    expect(serverFieldToFieldDef(f).type).toBe("text");
  });

  it("image의 default는 null", () => {
    const f: SchemaField = { key: "img", label: "이미지", field: { kind: "image" } };
    expect(serverFieldToFieldDef(f).default).toBeNull();
  });

  it("스키마가 null/비배열이어도 빈 스키마를 돌려준다", () => {
    expect(serverSchemaToSlideSchema(null)).toEqual({ fields: [] });
    expect(serverSchemaToSlideSchema(undefined)).toEqual({ fields: [] });
    expect(serverSchemaToSlideSchema([])).toEqual({ fields: [] });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 로컬 우선 / 서버 폴백
// ─────────────────────────────────────────────────────────────────────────────
describe("resolveEditorSchema — 로컬 우선, 서버 보조", () => {
  it("로컬이 있으면 로컬을 정본으로 쓴다 (순서 포함)", () => {
    const serverSchema: SchemaField[] = [
      { key: "question", label: "서버 라벨", field: { kind: "string" } },
    ];
    const r = resolveEditorSchema("pin-lock", serverSchema);
    expect(r.source).toBe("local");
    expect(r.fields).toEqual(resolveSlideSchema("pin-lock")!.fields);
    // 라벨도 로컬 것이 이긴다
    expect(r.fields.find((f) => f.key === "question")!.label).toBe("질문 문구");
  });

  it("서버에만 있는 키는 변환해 뒤에 덧붙인다", () => {
    const serverSchema: SchemaField[] = [
      { key: "question", label: "질문 문구", field: { kind: "string" } },
      { key: "brandNewField", label: "새 필드", field: { kind: "color" } },
    ];
    const r = resolveEditorSchema("pin-lock", serverSchema);
    expect(r.source).toBe("local");
    expect(r.serverOnlyKeys).toEqual(["brandNewField"]);
    expect(r.fields.at(-1)).toEqual({
      key: "brandNewField", label: "새 필드", type: "color", default: "#111111",
    });
  });

  it("로컬에 없는 componentRef면 서버 스키마로 폴백한다", () => {
    const serverSchema: SchemaField[] = [
      { key: "a", label: "A", field: { kind: "string" } },
      { key: "b", label: "B", field: { kind: "number", min: 1, max: 5 } },
    ];
    const r = resolveEditorSchema("no-such-slide", serverSchema);
    expect(r.source).toBe("server");
    expect(r.fields.map((f) => f.type)).toEqual(["text", "number"]);
  });

  it("로컬도 서버도 없으면 empty", () => {
    const r = resolveEditorSchema("no-such-slide", null);
    expect(r.source).toBe("empty");
    expect(r.fields).toEqual([]);
  });

  it("서버 스키마가 없어도 로컬만으로 편집 UI를 그릴 수 있다", () => {
    const r = resolveEditorSchema("quiz", null);
    expect(r.source).toBe("local");
    expect(r.fields.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 18종 전수 검사
// ─────────────────────────────────────────────────────────────────────────────
describe("슬라이드 18종 전수", () => {
  it("레지스트리에 18종이 등록된다", () => {
    expect(registeredSlideRefs().sort()).toEqual([...ALL_REFS].sort());
  });

  it.each(ALL_REFS)("%s — 컴포넌트와 스키마가 모두 조회된다", (ref) => {
    expect(resolveSlide(ref)).toBeTypeOf("function");
    const r = resolveEditorSchema(ref, null);
    expect(r.source).toBe("local");
    expect(r.fields.length).toBeGreaterThan(0);
  });

  it.each(ALL_REFS)("%s — 모든 필드에 key/label/type/default가 있다", (ref) => {
    const { fields } = resolveEditorSchema(ref, null);
    for (const f of fields) {
      expect(f.key, `${ref}.${f.key}`).toBeTruthy();
      expect(f.label, `${ref}.${f.key}`).toBeTruthy();
      expect(f.type, `${ref}.${f.key}`).toBeTruthy();
      expect(f, `${ref}.${f.key}`).toHaveProperty("default");
    }
  });

  it.each(ALL_REFS)("%s — 키 중복이 없다", (ref) => {
    const keys = resolveEditorSchema(ref, null).fields.map((f) => f.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 값 병합
// ─────────────────────────────────────────────────────────────────────────────
describe("mergeSlideValues", () => {
  it("overrides가 defaultValues를 덮는다", () => {
    expect(mergeSlideValues({ a: 1, b: 2 }, { b: 9 })).toEqual({ a: 1, b: 9 });
  });

  it("null/undefined 인자를 허용한다", () => {
    expect(mergeSlideValues(null, null)).toEqual({});
    expect(mergeSlideValues({ a: 1 }, undefined)).toEqual({ a: 1 });
    expect(mergeSlideValues(undefined, { a: 1 })).toEqual({ a: 1 });
  });

  it("overrides의 undefined는 기본값을 덮지 않는다 (기본값 복귀)", () => {
    expect(mergeSlideValues({ a: 1 }, { a: undefined })).toEqual({ a: 1 });
  });

  it("null / 빈 문자열 / false 는 유효한 덮어쓰기다", () => {
    expect(mergeSlideValues({ a: 1, b: "x", c: true }, { a: null, b: "", c: false }))
      .toEqual({ a: null, b: "", c: false });
  });

  it("원본을 변형하지 않는다", () => {
    const d = { a: 1 };
    const o = { b: 2 };
    mergeSlideValues(d, o);
    expect(d).toEqual({ a: 1 });
    expect(o).toEqual({ b: 2 });
  });

  it("스키마 default로 빠진 키를 메운다", () => {
    const schema = { fields: [{ key: "a", label: "A", type: "text", default: "기본" }] as SchemaFieldDef[] };
    expect(fillMissingWithDefaults(schema, {})).toEqual({ a: "기본" });
    expect(fillMissingWithDefaults(schema, { a: "" })).toEqual({ a: "" });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 배열 필드 — 여기가 틀리면 사용자 데이터가 조용히 깨진다
// ─────────────────────────────────────────────────────────────────────────────
describe("배열 필드 파싱/직렬화", () => {
  it("빈 값은 빈 배열로 읽는다", () => {
    expect(parseArrayValue(undefined)).toMatchObject({ ok: true, items: [] });
    expect(parseArrayValue(null)).toMatchObject({ ok: true, items: [] });
    expect(parseArrayValue("")).toMatchObject({ ok: true, items: [] });
    expect(parseArrayValue("   ")).toMatchObject({ ok: true, items: [] });
  });

  it("JSON 문자열을 읽는다", () => {
    const v = JSON.stringify([{ a: 1 }, { a: 2 }]);
    const r = parseArrayValue(v);
    expect(r.ok).toBe(true);
    expect(r.items).toEqual([{ a: 1 }, { a: 2 }]);
  });

  it("실제 배열도 읽는다 (슬라이드가 양쪽을 받으므로)", () => {
    const r = parseArrayValue([{ a: 1 }]);
    expect(r.ok).toBe(true);
    expect(r.items).toEqual([{ a: 1 }]);
  });

  it("깨진 JSON은 던지지 않고 ok=false + 원본 raw를 준다", () => {
    const broken = '[{"a": 1,,,}]';
    const r = parseArrayValue(broken);
    expect(r.ok).toBe(false);
    expect(r.raw).toBe(broken);
    expect(r.items).toEqual([]);
  });

  it("배열이 아닌 JSON도 ok=false", () => {
    const r = parseArrayValue('{"a":1}');
    expect(r.ok).toBe(false);
    expect(r.raw).toBe('{"a":1}');
  });

  it("객체가 아닌 원소가 섞이면 ok=false (구조화 편집 불가)", () => {
    expect(parseArrayValue('["a","b"]').ok).toBe(false);
    expect(parseArrayValue([1, 2]).ok).toBe(false);
  });

  it("숫자/불린 등 엉뚱한 타입도 던지지 않는다", () => {
    expect(parseArrayValue(42).ok).toBe(false);
    expect(parseArrayValue(true).ok).toBe(false);
  });

  it("항목 이동은 원본을 변형하지 않는다", () => {
    const items = [{ a: 1 }, { a: 2 }, { a: 3 }];
    expect(moveArrayItem(items, 0, 2)).toEqual([{ a: 2 }, { a: 3 }, { a: 1 }]);
    expect(items).toEqual([{ a: 1 }, { a: 2 }, { a: 3 }]);
    expect(moveArrayItem(items, 0, 0)).toBe(items);
    expect(moveArrayItem(items, -1, 0)).toBe(items);
    expect(moveArrayItem(items, 0, 5)).toBe(items);
  });

  it("항목 값 수정은 다른 키를 보존한다", () => {
    const item = { title: "a", scale: [0, 2, 4], tempo: 300 };
    expect(setItemValue(item, "title", "b")).toEqual({ title: "b", scale: [0, 2, 4], tempo: 300 });
    expect(setItemValue(item, "title", undefined)).toEqual({ scale: [0, 2, 4], tempo: 300 });
    expect(item.title).toBe("a");
  });
});

describe("배열 필드 왕복 — 8종 기존 기본값이 깨지지 않는가", () => {
  it.each(ARRAY_SLIDES)("$ref.$key 가 array 타입으로 선언되어 있다", ({ ref, key }) => {
    const field = resolveEditorSchema(ref, null).fields.find((f) => f.key === key);
    expect(field, `${ref}.${key} 필드 없음`).toBeDefined();
    expect(field!.type).toBe("array");
    expect(field!.itemFields?.length ?? 0).toBeGreaterThan(0);
  });

  it.each(ARRAY_SLIDES)("$ref.$key — 기본값이 그대로 파싱된다", ({ ref, key }) => {
    const field = resolveEditorSchema(ref, null).fields.find((f) => f.key === key)!;
    const parsed = parseArrayValue(field.default);
    expect(parsed.ok).toBe(true);
    expect(parsed.items.length).toBeGreaterThan(0);
  });

  it.each(ARRAY_SLIDES)("$ref.$key — 파싱 → 직렬화가 원본과 완전히 동일하다", ({ ref, key }) => {
    const field = resolveEditorSchema(ref, null).fields.find((f) => f.key === key)!;
    const original = field.default as string;
    const round = serializeArrayValue(parseArrayValue(original).items);
    expect(round).toBe(original);
  });

  it.each(ARRAY_SLIDES)("$ref.$key — 편집 후에도 미노출 키가 보존된다", ({ ref, key }) => {
    const field = resolveEditorSchema(ref, null).fields.find((f) => f.key === key)!;
    const { items } = parseArrayValue(field.default);
    const first = items[0];
    const target = field.itemFields![0];

    const edited = [...items];
    edited[0] = setItemValue(first, target.key, "편집됨");
    const reparsed = parseArrayValue(serializeArrayValue(edited)).items;

    // 편집한 키만 바뀌고 나머지 키는 값까지 동일해야 한다
    for (const k of Object.keys(first)) {
      if (k === target.key) continue;
      expect(reparsed[0][k], `${ref}.${key}.${k} 유실`).toEqual(first[k]);
    }
    expect(reparsed[0][target.key]).toBe("편집됨");
    expect(Object.keys(reparsed[0])).toEqual(Object.keys(first));
  });

  it.each(ARRAY_SLIDES)("$ref.$key — 새 항목이 기존 항목과 같은 키 집합을 갖는다", ({ ref, key }) => {
    const field = resolveEditorSchema(ref, null).fields.find((f) => f.key === key)!;
    const { items } = parseArrayValue(field.default);
    const fresh = makeArrayItem(field);
    // 기존 항목이 가진 키 중 optional이 아닌 것은 새 항목에도 있어야 한다.
    // (없으면 슬라이드가 undefined를 그대로 쓰다 크래시한다 — 예: roulette lum(color))
    const existingKeys = Object.keys(items[0]);
    const freshKeys = Object.keys(fresh);
    const missing = existingKeys.filter(
      (k) => !freshKeys.includes(k) && items.every((it) => it[k] !== undefined)
    );
    expect(missing, `${ref}.${key} 새 항목에 빠진 키`).toEqual([]);
  });

  it.each(ARRAY_SLIDES)("$ref.$key — 항목 추가/삭제/이동 후에도 다시 파싱된다", ({ ref, key }) => {
    const field = resolveEditorSchema(ref, null).fields.find((f) => f.key === key)!;
    let items = parseArrayValue(field.default).items;
    const originalLen = items.length;

    items = [...items, makeArrayItem(field)];
    items = moveArrayItem(items, items.length - 1, 0);
    items = items.filter((_, i) => i !== 1);

    const serialized = serializeArrayValue(items);
    const back = parseArrayValue(serialized);
    expect(back.ok).toBe(true);
    expect(back.items.length).toBe(originalLen);
  });

  it("quiz 문항의 choices는 문자열 배열로 유지된다 (첫 원소 = 정답)", () => {
    const field = resolveEditorSchema("quiz", null).fields.find((f) => f.key === "questions")!;
    const { items } = parseArrayValue(field.default);
    for (const q of items) {
      expect(Array.isArray(q.choices)).toBe(true);
      expect((q.choices as unknown[]).every((c) => typeof c === "string")).toBe(true);
    }
    const fresh = makeArrayItem(field);
    expect(Array.isArray(fresh.choices)).toBe(true);
  });

  it("cassette-player 새 트랙에 root/scale/tempo가 채워진다", () => {
    const field = resolveEditorSchema("cassette-player", null).fields.find((f) => f.key === "tracks")!;
    const fresh = makeArrayItem(field);
    expect(fresh.root).toBe(261.63);
    expect(fresh.scale).toEqual([0, 2, 4, 7, 9]);
    expect(fresh.tempo).toBe(300);
  });
});
