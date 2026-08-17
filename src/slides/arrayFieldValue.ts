// 배열 필드(type: "array")의 저장 형태 변환.
//
// 저장 형태는 **JSON 문자열**이다. 근거:
//  - V7 시드가 그렇게 넣는다. 예) quiz.questions =
//    "[{\"q\":\"...\",\"choices\":[...],\"explain\":\"...\"}]"
//  - 슬라이드 8종은 전부 `Array.isArray(v) ? v : JSON.parse(v)` 로 양쪽을 받으므로
//    문자열로 써도 배열로 써도 렌더는 되지만, 기존 데이터와 형태를 맞추는 편이 안전하다.
//
// 왕복(파싱 → 편집 → 직렬화)에서 **편집하지 않은 키는 반드시 보존**해야 한다.
// 예) cassette-player 트랙의 root/scale/tempo는 편집 UI에 노출하지 않지만
//     item에 그대로 남아 있어야 재생이 깨지지 않는다.
import type { SchemaFieldDef } from "./SlideProps";

export type ArrayItem = Record<string, unknown>;

export interface ParsedArrayValue {
  /** 구조화 편집이 가능한 형태로 읽혔는지 */
  ok: boolean;
  items: ArrayItem[];
  /** ok=false일 때 사용자에게 그대로 보여줄 원본 텍스트 */
  raw: string;
}

function isPlainObject(v: unknown): v is ArrayItem {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function rawOf(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value ?? [], null, 2);
  } catch {
    return String(value);
  }
}

/**
 * 저장값 → 편집 가능한 항목 배열.
 * 문자열(JSON) / 실제 배열 / 빈 값을 모두 받는다.
 * 깨진 값이어도 예외를 던지지 않는다 — ok=false + raw로 폴백한다.
 */
export function parseArrayValue(value: unknown): ParsedArrayValue {
  if (value === undefined || value === null) {
    return { ok: true, items: [], raw: "[]" };
  }

  if (Array.isArray(value)) {
    if (value.every(isPlainObject)) {
      return { ok: true, items: value as ArrayItem[], raw: serializeArrayValue(value as ArrayItem[]) };
    }
    return { ok: false, items: [], raw: rawOf(value) };
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return { ok: true, items: [], raw: value };
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.every(isPlainObject)) {
        return { ok: true, items: parsed as ArrayItem[], raw: value };
      }
    } catch {
      // 아래 폴백으로
    }
    return { ok: false, items: [], raw: value };
  }

  return { ok: false, items: [], raw: rawOf(value) };
}

/** 항목 배열 → 저장값(JSON 문자열). JSON.stringify 기본 형태 = V7 시드와 동일 */
export function serializeArrayValue(items: ArrayItem[]): string {
  return JSON.stringify(items);
}

/** 스키마의 itemDefaults + itemFields default로 새 항목 1개를 만든다 */
export function makeArrayItem(field: SchemaFieldDef): ArrayItem {
  const base: ArrayItem = { ...(field.itemDefaults ?? {}) };
  for (const f of field.itemFields ?? []) {
    base[f.key] = f.default;
  }
  return base;
}

/** 항목 1개의 특정 키만 바꾼다. 나머지 키(미노출 포함)는 그대로 보존한다. */
export function setItemValue(item: ArrayItem, key: string, value: unknown): ArrayItem {
  const next: ArrayItem = { ...item };
  if (value === undefined) delete next[key];
  else next[key] = value;
  return next;
}

/** 항목을 from → to로 옮긴 새 배열 */
export function moveArrayItem(items: ArrayItem[], from: number, to: number): ArrayItem[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** 요약 라벨 — 항목 카드 헤더에 쓸 대표 문자열을 고른다 */
export function summarizeItem(item: ArrayItem, itemFields: SchemaFieldDef[]): string {
  for (const f of itemFields) {
    if (f.type !== "text" && f.type !== "textarea") continue;
    const v = item[f.key];
    if (typeof v === "string" && v.trim() !== "") return v.split("\n")[0].slice(0, 24);
  }
  return "";
}
