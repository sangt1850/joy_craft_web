export interface SlideProps<T extends Record<string, unknown> = Record<string, unknown>> {
  /** defaultValues + overrides가 merge된 최종 데이터 */
  data: T;
  /** 슬라이드 완료 시 호출 (다음 슬라이드로 전환) */
  onComplete?: () => void;
  /** 에디터 미리보기 모드 — true면 onComplete 호출 안 함 */
  isPreview?: boolean;
}

export interface SchemaFieldDef {
  key: string;
  label: string;
  type: "text" | "textarea" | "color" | "number" | "font" | "image" | "select" | "boolean";
  default: unknown;
  required?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: string }[];
}

export interface SlideSchema {
  fields: SchemaFieldDef[];
}
