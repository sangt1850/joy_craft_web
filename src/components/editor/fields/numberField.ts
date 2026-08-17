// number 위젯의 커밋 판단 — 순수 함수로 떼어 두고 NumberControl이 쓴다.
//
// 왜 떼어냈나: **배열 항목 안의 number 필드는 빈 값을 허용하면 안 된다.**
//   최상위 필드는 값을 지우면 mergeSlideValues가 defaultValues로 되돌려 주지만,
//   배열 항목은 setItemValue가 키를 통째로 delete하고 그대로 저장된다. 그 결과:
//     flashlight  spots[].x/y  → `sp.x * r.width` = NaN (히트 판정 불가 → gated에서 갇힘)
//     cassette    tracks[].dur → 진행률 "NaN%"
//     balloon-pop x/y          → left/top "undefined%"
//   그래서 항목 안에서는 빈 입력을 **커밋하지 않고**, blur 시 되돌린다.
import type { SchemaFieldDef } from "../../../slides/SlideProps";

/** 무엇이 오든 유한한 숫자로 읽는다. 못 읽으면 null */
export function readFiniteNumber(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    if (v.trim() === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** 배열 항목 안의 number 필드가 비었을 때 되돌릴 값 — 스키마 default → min → 0 */
export function arrayItemNumberFallback(field: SchemaFieldDef): number {
  const fromDefault = readFiniteNumber(field.default);
  if (fromDefault !== null) return fromDefault;
  if (typeof field.min === "number" && Number.isFinite(field.min)) return field.min;
  return 0;
}

export type NumberCommit =
  /** 저장하지 않는다 (입력 중간 상태 — 로컬 버퍼만 유지) */
  | { emit: false }
  /** 저장한다. value === undefined면 "기본값으로 되돌리기" */
  | { emit: true; value: number | undefined };

/**
 * 입력이 바뀔 때마다 무엇을 저장할지 결정한다.
 * @param inArrayItem 배열 항목 내부인가 — 빈 값 커밋(=키 삭제)을 막는다
 */
export function commitNumberInput(raw: string, inArrayItem: boolean): NumberCommit {
  if (raw.trim() === "") {
    // 최상위: 지우면 기본값으로 되돌린다 / 배열 항목: 아무것도 저장하지 않는다
    return inArrayItem ? { emit: false } : { emit: true, value: undefined };
  }
  const n = Number(raw);
  if (!Number.isFinite(n)) return { emit: false }; // "2e" 같은 중간 상태
  return { emit: true, value: n };
}

export interface NumberBlurResult {
  /** blur 이후 입력창이 보여줄 텍스트 */
  text: string;
  /** null이면 저장할 것이 없다 (표시만 복원) */
  commit: number | null;
}

/**
 * 배열 항목 안에서 blur 됐을 때 빈/깨진 입력을 되돌린다.
 *  1) 입력이 유효한 숫자면 그대로 둔다
 *  2) 아니면 **현재 저장값**으로 되돌린다 (저장값을 바꾸지 않는다)
 *  3) 저장값도 숫자가 아니면 스키마 default(없으면 min/0)를 저장한다
 */
export function resolveArrayItemNumberBlur(
  raw: string,
  committed: unknown,
  field: SchemaFieldDef
): NumberBlurResult {
  const typed = readFiniteNumber(raw);
  if (typed !== null) return { text: raw, commit: null };

  const stored = readFiniteNumber(committed);
  if (stored !== null) return { text: String(stored), commit: null };

  const fallback = arrayItemNumberFallback(field);
  return { text: String(fallback), commit: fallback };
}
