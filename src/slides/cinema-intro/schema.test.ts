import { describe, expect, it } from "vitest";
import { parseArrayValue } from "../arrayFieldValue";
import { resolveSlide, resolveSlideSchema } from "../registry";
import "./index";
import { defaultValues, schema } from "./schema";

describe("loveflix-intro", () => {
  it("컴포넌트와 로컬 스키마가 레지스트리에 등록된다", () => {
    expect(resolveSlide("loveflix-intro")).toBeTypeOf("function");
    expect(resolveSlideSchema("loveflix-intro")).toBe(schema);
    expect(resolveSlide("cinema-intro")).toBe(
      resolveSlide("loveflix-intro"),
    );
  });

  it("모든 스키마 필드의 기본값을 제공한다", () => {
    expect(Object.keys(defaultValues)).toEqual(
      schema.fields.map((field) => field.key),
    );
  });

  it.each([
    ["profiles", ["name", "image"]],
    ["episodes", ["title", "image", "detailImage", "description"]],
  ] as const)("%s 배열 기본값을 편집 가능한 형태로 파싱한다", (key, itemKeys) => {
    const field = schema.fields.find((candidate) => candidate.key === key);

    expect(field?.type).toBe("array");
    expect(field?.itemFields?.map((item) => item.key)).toEqual(itemKeys);

    const parsed = parseArrayValue(field?.default);
    expect(parsed.ok).toBe(true);
    expect(parsed.items.length).toBeGreaterThan(0);
  });
});
