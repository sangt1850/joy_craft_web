import type { ComponentType } from "react";
import type { SlideProps, SlideSchema } from "./SlideProps";

/**
 * 플레이어/에디터가 다루는 공통 슬라이드 컴포넌트 타입.
 * data는 발행 스냅샷의 values(= defaultValues + overrides 병합 결과)가 들어온다.
 */
export type SlideComponent = ComponentType<SlideProps>;

// componentRef -> React 컴포넌트 매핑
const registry: Record<string, SlideComponent> = {};
// componentRef -> 로컬 편집 스키마 매핑 (에디터가 위젯을 그리는 근거)
const schemaRegistry: Record<string, SlideSchema> = {};

export function registerSlide<T extends object>(
  componentRef: string,
  component: ComponentType<SlideProps<T>>,
  schema?: SlideSchema
): void {
  // 각 슬라이드는 자기 전용 data 인터페이스를 쓰지만 레지스트리는 공통 타입으로 보관한다.
  // 실제 값의 형태는 서버 스키마(component_templates.schema)가 보장한다.
  registry[componentRef] = component as unknown as SlideComponent;
  if (schema) schemaRegistry[componentRef] = schema;
}

export function resolveSlide(componentRef: string): SlideComponent | undefined {
  return registry[componentRef];
}

/**
 * 로컬 스키마 조회.
 * 서버 스키마(`SchemaField[]`)는 textarea/select/boolean/default/options를 표현하지 못하므로
 * 에디터는 이쪽을 우선으로 쓴다. 변환·폴백은 `schemaAdapter.ts` 참고.
 */
export function resolveSlideSchema(componentRef: string): SlideSchema | undefined {
  return schemaRegistry[componentRef];
}

/** 등록된 componentRef 전체 (검증/디버깅용) */
export function registeredSlideRefs(): string[] {
  return Object.keys(registry);
}
