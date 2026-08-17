// 스키마 어댑터 — 서버 스키마(SchemaField)와 로컬 스키마(SchemaFieldDef)를 잇는다.
//
// 배경(기획서 2-2장): 같은 개념이 두 형태로 존재한다.
//   서버: { key, label, field: { kind: "string"|"color"|"number"|"font"|"image", min?, max? } }
//   로컬: { key, label, type: "text"|"textarea"|...|"array", default, options?, ... }
// 서버 형태는 textarea/select/boolean/array/default/options를 표현하지 못하므로
// **로컬 스키마를 정본으로 쓰고 서버 스키마는 보조(누락 필드 보충)로만 쓴다.**
//
// 이 파일이 틀리면 편집 패널이 조용히 빈 값을 저장하므로 테스트가 붙어 있다.
// → src/slides/schemaAdapter.test.ts
import type { SchemaFieldDef, SchemaFieldType, SlideSchema } from "./SlideProps";
import type { SchemaField } from "../types/api";
import { resolveSlideSchema } from "./registry";

/** 서버 field.kind → 로컬 type */
export const KIND_TO_TYPE: Record<SchemaField["field"]["kind"], SchemaFieldType> = {
  string: "text",
  color: "color",
  number: "number",
  font: "font",
  image: "image",
};

/** 서버 스키마에 default가 없으므로 kind별 안전한 빈 값을 만든다 */
function fallbackDefault(kind: SchemaField["field"]["kind"], min?: number): unknown {
  switch (kind) {
    case "number":
      return typeof min === "number" ? min : 0;
    case "color":
      return "#111111";
    case "image":
      return null;
    default:
      return "";
  }
}

/** 서버 필드 1개 → 로컬 필드 정의 1개 */
export function serverFieldToFieldDef(field: SchemaField): SchemaFieldDef {
  const kind = field.field?.kind;
  // 서버가 모르는 kind를 보내도 편집 자체는 가능해야 하므로 text로 떨어뜨린다
  const type = (kind && KIND_TO_TYPE[kind]) ?? "text";
  const def: SchemaFieldDef = {
    key: field.key,
    label: field.label || field.key,
    type,
    default: fallbackDefault(kind, field.field?.min),
  };
  if (typeof field.field?.min === "number") def.min = field.field.min;
  if (typeof field.field?.max === "number") def.max = field.field.max;
  return def;
}

/** 서버 스키마 전체 → 로컬 스키마 */
export function serverSchemaToSlideSchema(fields: SchemaField[] | null | undefined): SlideSchema {
  if (!Array.isArray(fields)) return { fields: [] };
  return { fields: fields.filter((f) => f && typeof f.key === "string").map(serverFieldToFieldDef) };
}

export type SchemaSource = "local" | "server" | "empty";

export interface ResolvedEditorSchema extends SlideSchema {
  /** local = 로컬 스키마 사용, server = 로컬 미등록이라 서버 스키마 변환, empty = 둘 다 없음 */
  source: SchemaSource;
  /** 서버에만 있어서 뒤에 덧붙인 필드 키 (로컬 스키마가 서버보다 뒤처진 경우) */
  serverOnlyKeys: string[];
}

/**
 * 에디터가 실제로 그릴 스키마를 만든다.
 *
 * 우선순위
 *  1. `componentRef`로 로컬 스키마가 있으면 **그것을 그대로 정본**으로 쓴다 (필드 순서 포함).
 *  2. 로컬에 없는 키가 서버 스키마에 있으면 변환해 **뒤에 덧붙인다**
 *     (서버가 필드를 추가했는데 프론트가 못 따라간 경우에도 편집은 가능해야 한다).
 *  3. 로컬 스키마 자체가 없으면 서버 스키마를 통째로 변환해 폴백한다.
 */
export function resolveEditorSchema(
  componentRef: string,
  serverSchema?: SchemaField[] | null
): ResolvedEditorSchema {
  const local = resolveSlideSchema(componentRef);
  const server = serverSchemaToSlideSchema(serverSchema);

  if (!local || local.fields.length === 0) {
    return {
      fields: server.fields,
      source: server.fields.length > 0 ? "server" : "empty",
      serverOnlyKeys: server.fields.map((f) => f.key),
    };
  }

  const localKeys = new Set(local.fields.map((f) => f.key));
  const extra = server.fields.filter((f) => !localKeys.has(f.key));

  return {
    fields: extra.length > 0 ? [...local.fields, ...extra] : local.fields,
    source: "local",
    serverOnlyKeys: extra.map((f) => f.key),
  };
}

/**
 * 에디터용 값 병합.
 *
 * 플레이어와 달리 에디터는 서버가 병합해주지 않는다 —
 * `SlideResponse`가 `defaultValues`와 `overrides`를 따로 주므로 여기서 합친다.
 * `overrides`에 `undefined`가 들어 있으면 기본값을 덮어쓰지 않는다(= 기본값으로 되돌리기).
 */
export function mergeSlideValues(
  defaultValues: Record<string, unknown> | null | undefined,
  overrides: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...(defaultValues ?? {}) };
  if (overrides) {
    for (const [k, v] of Object.entries(overrides)) {
      if (v === undefined) continue;
      merged[k] = v;
    }
  }
  return merged;
}

/**
 * 스키마 기준으로 값이 비어 있는지 판단해 기본값으로 채운다.
 * 슬라이드 일부(envelope-letter, typewriter)는 값이 없으면 렌더 중 throw하므로
 * 미리보기에 넘기기 전에 스키마 default로 구멍을 메운다.
 */
export function fillMissingWithDefaults(
  schema: SlideSchema,
  values: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...values };
  for (const f of schema.fields) {
    if (out[f.key] === undefined) out[f.key] = f.default;
  }
  return out;
}
