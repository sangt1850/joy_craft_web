// 배열 항목 안의 number 필드가 빈 값이 되면 슬라이드가 깨지는 문제(M2.5 #3) 회귀 테스트.
//
// 실제 피해(코드 근거):
//   flashlight/Flashlight.tsx:38  `x - sp.x * r.width`        → x 없으면 NaN (히트 판정 불가)
//   flashlight/Flashlight.tsx:83  `left: \`${sp.x * 100}%\``  → "NaN%"
//   balloon-pop, cassette-player도 같은 형태로 좌표/길이를 곱한다.
import { describe, it, expect } from "vitest";
import type { SchemaFieldDef } from "../../../slides/SlideProps";
import { setItemValue, parseArrayValue, serializeArrayValue } from "../../../slides/arrayFieldValue";
import {
  readFiniteNumber,
  arrayItemNumberFallback,
  commitNumberInput,
  resolveArrayItemNumberBlur,
} from "./numberField";

const X_FIELD: SchemaFieldDef = {
  key: "x",
  label: "가로 위치",
  type: "number",
  default: 0.5,
  min: 0.05,
  max: 0.95,
  step: 0.01,
};

describe("readFiniteNumber", () => {
  it("숫자/숫자 문자열만 읽는다", () => {
    expect(readFiniteNumber(0.5)).toBe(0.5);
    expect(readFiniteNumber(0)).toBe(0);
    expect(readFiniteNumber("0.25")).toBe(0.25);
    expect(readFiniteNumber("")).toBeNull();
    expect(readFiniteNumber("  ")).toBeNull();
    expect(readFiniteNumber("abc")).toBeNull();
    expect(readFiniteNumber(NaN)).toBeNull();
    expect(readFiniteNumber(Infinity)).toBeNull();
    expect(readFiniteNumber(undefined)).toBeNull();
    expect(readFiniteNumber(null)).toBeNull();
  });
});

describe("arrayItemNumberFallback", () => {
  it("스키마 default를 쓴다", () => {
    expect(arrayItemNumberFallback(X_FIELD)).toBe(0.5);
  });
  it("default가 없으면 min을 쓴다", () => {
    expect(arrayItemNumberFallback({ ...X_FIELD, default: undefined })).toBe(0.05);
  });
  it("default도 min도 없으면 0", () => {
    expect(arrayItemNumberFallback({ key: "d", label: "d", type: "number", default: null })).toBe(0);
  });
});

describe("commitNumberInput", () => {
  it("최상위 필드: 비우면 undefined를 커밋해 기본값으로 되돌린다", () => {
    expect(commitNumberInput("", false)).toEqual({ emit: true, value: undefined });
  });

  it("배열 항목: 비워도 커밋하지 않는다 (키가 지워지면 NaN이 된다)", () => {
    expect(commitNumberInput("", true)).toEqual({ emit: false });
    expect(commitNumberInput("   ", true)).toEqual({ emit: false });
  });

  it("숫자로 못 읽는 중간 상태는 어느 쪽이든 커밋하지 않는다", () => {
    expect(commitNumberInput("2e", true)).toEqual({ emit: false });
    expect(commitNumberInput("2e", false)).toEqual({ emit: false });
  });

  it("정상 입력은 숫자로 커밋한다", () => {
    expect(commitNumberInput("0.3", true)).toEqual({ emit: true, value: 0.3 });
    expect(commitNumberInput("-2", false)).toEqual({ emit: true, value: -2 });
  });
});

describe("resolveArrayItemNumberBlur", () => {
  it("입력이 유효하면 그대로 둔다", () => {
    expect(resolveArrayItemNumberBlur("0.3", 0.3, X_FIELD)).toEqual({ text: "0.3", commit: null });
  });

  it("비운 채 blur하면 저장값으로 되돌린다 (데이터는 바뀌지 않는다)", () => {
    expect(resolveArrayItemNumberBlur("", 0.2, X_FIELD)).toEqual({ text: "0.2", commit: null });
  });

  it("저장값도 없으면 스키마 기본값을 저장한다", () => {
    expect(resolveArrayItemNumberBlur("", undefined, X_FIELD)).toEqual({ text: "0.5", commit: 0.5 });
  });

  it("저장값이 깨져 있어도 숫자로 복구한다", () => {
    expect(resolveArrayItemNumberBlur("", "abc", X_FIELD)).toEqual({ text: "0.5", commit: 0.5 });
  });
});

describe("통합 — flashlight spots[].x 를 비웠을 때", () => {
  const spots = [{ emoji: "✨", caption: "첫 만남", x: 0.2, y: 0.3 }];

  /** 위젯이 커밋을 결정하고 → ArrayFieldEditor가 항목에 반영하는 경로를 그대로 흉내낸다 */
  function typeInto(raw: string, inArrayItem: boolean) {
    const commit = commitNumberInput(raw, inArrayItem);
    if (!commit.emit) return spots[0]; // 커밋하지 않음 = 항목 그대로
    return setItemValue(spots[0], "x", commit.value);
  }

  it("[문제 재현] 최상위 규칙(undefined 커밋)을 항목에 그대로 쓰면 키가 지워지고 NaN이 된다", () => {
    const broken = typeInto("", false) as { x?: number };
    expect("x" in broken).toBe(false);
    expect(broken.x! * 320).toBeNaN();
    expect(`${broken.x! * 100}%`).toBe("NaN%");
  });

  it("[수정] 배열 항목에서는 커밋되지 않아 좌표가 그대로 살아 있다", () => {
    const kept = typeInto("", true) as { x?: number };
    expect(kept.x).toBe(0.2);
    expect(kept.x! * 320).toBe(64);
  });

  it("[수정] 저장/직렬화까지 왕복해도 x가 유지된다", () => {
    const item = typeInto("", true);
    const json = serializeArrayValue([item]);
    const back = parseArrayValue(json);
    expect(back.ok).toBe(true);
    expect(back.items[0].x).toBe(0.2);
  });
});
