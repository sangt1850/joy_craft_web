// 플랫폼 모드
export type PlatformMode = "responsive" | "mobile-only" | "web-only" | "webapp-only";

// customization schema 필드 타입
export type SchemaFieldType =
  | { kind: "string" }
  | { kind: "color" }
  | { kind: "number"; min: number; max: number; default: number }
  | { kind: "font" }
  | { kind: "image" };

export interface SchemaField {
  key: string;
  label: string;
  field: SchemaFieldType;
}

// 컴포넌트 타입 (슬라이드 종류 정의)
export interface ComponentType {
  id: string;
  name: string;
  componentRef: string;
  platformMode: PlatformMode;
  schema: SchemaField[];
}

// 컴포넌트 템플릿 (기본값 포함)
export interface ComponentTemplate {
  id: string;
  componentTypeId: string;
  defaultValues: Record<string, unknown>;
  version: number;
}

// 사이트 인스턴스
export interface SlideInstance {
  templateId: string;
  templateVersion: number;
  overrides: Record<string, unknown>;
}

export interface SiteInstance {
  id: string;
  title: string;
  slides: SlideInstance[];
}
