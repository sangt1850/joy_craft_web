// T는 슬라이드별 data 형태. 각 슬라이드가 interface로 선언하므로
// Record<string, unknown> 제약을 걸면 인덱스 시그니처가 없어 전부 컴파일 에러가 난다.
// 대신 object 제약을 걸어 원시값/undefined가 data로 들어오는 것은 막는다.
export interface SlideProps<T extends object = Record<string, unknown>> {
  /** defaultValues + overrides가 merge된 최종 데이터 */
  data: T;
  /** 슬라이드 완료 시 호출 (다음 슬라이드로 전환) */
  onComplete?: () => void;
  /** 에디터 미리보기 모드 — true면 onComplete 호출 안 함 */
  isPreview?: boolean;
}

/**
 * 편집 위젯 종류.
 *
 * - `array`    : 항목 목록. 값은 **JSON 문자열**로 저장한다 (DB/V7 시드와 동일한 형태).
 *                항목 내부 필드는 `itemFields`로 기술한다.
 * - `textlist` : 문자열 배열. 값은 `string[]`. 줄 단위로 편집한다.
 *                (예: quiz 문항의 `choices` — 첫 줄이 정답)
 */
export type SchemaFieldType =
  | "text"
  | "textarea"
  | "color"
  | "number"
  | "font"
  | "image"
  | "select"
  | "boolean"
  | "array"
  | "textlist"
  /** 이미지 URL / base64 배열. 값은 `string[]`. URL 입력 + 파일 업로드(base64) 지원 */
  | "imagelist";

export interface SchemaFieldDef {
  key: string;
  label: string;
  type: SchemaFieldType;
  default: unknown;
  required?: boolean;
  placeholder?: string;
  /** 편집 패널에 보조 설명으로 노출 */
  hint?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: string; icon?: string }[];
  /** select 필드를 드롭다운 대신 세그먼트 버튼으로 표시 */
  widget?: "segment";

  // ── type: "array" 전용 ────────────────────────────────────────────────────
  /** 항목 1개 안의 필드 정의 */
  itemFields?: SchemaFieldDef[];
  /** 항목 1개를 부르는 이름 (예: "문항", "슬라이스") */
  itemLabel?: string;
  /**
   * 새 항목을 만들 때 깔아주는 기본 골격.
   * `itemFields`로 노출하지 않지만 슬라이드가 필요로 하는 키를 여기에 둔다.
   * (예: cassette-player 트랙의 `root` / `scale` / `tempo`)
   * 기존 항목에 있는 미노출 키는 편집 중에도 그대로 보존된다.
   */
  itemDefaults?: Record<string, unknown>;
}

export interface SlideSchema {
  fields: SchemaFieldDef[];
}
