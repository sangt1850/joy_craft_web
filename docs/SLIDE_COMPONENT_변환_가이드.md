# JoyCraft 슬라이드 컴포넌트 개발 가이드

> 새 슬라이드 컴포넌트를 추가하거나 기존 컴포넌트를 수정할 때 참고하는 가이드.
> DC(Design Canvas) 프로토타입 → React TSX 변환 규칙 포함.

---

## 1. 현재 구현된 슬라이드 목록

| componentRef | 이름 | 카테고리 | 3D |
|---|---|---|---|
| `pin-lock` | 기념일 잠금 | 인터랙션 | |
| `roulette` | 룰렛 | 인터랙션 | |
| `fleeing-button` | 도망가는 버튼 | 인터랙션 | |
| `instagram` | 인스타그램 | 이야기 | |
| `envelope-letter` | 편지 열기 | 읽기 | |
| `ending-credits` | 엔딩 크레딧 | 연출 | |
| `dday-counter` | D-day 카운트다운 | 연출 | |
| `wish-lantern` | 소원 등불 | 연출 | |
| `vinyl-player` | 바이닐 플레이어 | 음악 | |
| `passport-ticket` | 여권/티켓 | 연출 | |
| `valentine-letter` | 발렌타인 편지 | 감정 | |
| `matryoshka-dog` | 마트료시카 강아지 | 인터랙션 | ✅ |
| `gift-unboxing` | 선물상자 언박싱 | 인터랙션 | ✅ |

---

## 2. 파일 구조

### 2-1. 전체 디렉토리

```
src/slides/
├── registry.ts              ← 컴포넌트 + 스키마 등록
├── SlideProps.ts             ← 공통 props 타입 + 스키마 타입
├── arrayFieldValue.ts        ← type:"array" 필드의 직렬화/역직렬화 유틸
├── schemaAdapter.ts          ← 서버 스키마 ↔ 로컬 스키마 변환·병합
├── schemaAdapter.test.ts     ← 어댑터 단위 테스트
├── useVibrate.ts             ← 공통 훅: 진동
├── useAudio.ts               ← 공통 훅: Web Audio 사운드
├── useHoldProgress.ts        ← 공통 훅: 길게 누르기 게이지
├── useSlideComplete.ts       ← 공통 훅: 완료 신호 (isPreview 체크 + 1회 보장)
├── useSlideTimeout.ts        ← 공통 훅: 언마운트 시 자동 정리 setTimeout
├── slide-animations.css      ← 공통 keyframes
├── index.ts                  ← 전체 슬라이드 일괄 import
│
└── {component-ref}/
    ├── ComponentName.tsx
    ├── schema.ts
    └── index.ts
```

### 2-2. 각 슬라이드 폴더 내 파일 역할

| 파일 | 역할 |
|------|------|
| `ComponentName.tsx` | 순수 React 컴포넌트. `data` props만 받아서 렌더링 |
| `schema.ts` | CUSTOMER에게 노출할 편집 필드 정의 + 기본값 |
| `index.ts` | 컴포넌트 export + `registerSlide()` 호출 (schema 포함) |

3D 슬라이드(Three.js 기반)는 `.glb` 파일도 폴더 안에 넣는다.

---

## 3. 공통 타입 정의

### 3-1. SlideProps

```ts
// src/slides/SlideProps.ts
export interface SlideProps<T extends object = Record<string, unknown>> {
  /** defaultValues + overrides가 merge된 최종 데이터 */
  data: T;

  /** 슬라이드 완료 시 호출 (다음 슬라이드로 전환) */
  onComplete?: () => void;

  /** 에디터 미리보기 모드 — true면 onComplete 호출 안 함 */
  isPreview?: boolean;
}
```

### 3-2. SchemaFieldDef

```ts
export type SchemaFieldType =
  | "text"
  | "textarea"
  | "color"
  | "number"
  | "font"
  | "image"
  | "imagelist"   // 이미지 URL 배열
  | "select"
  | "boolean"
  | "array"       // 항목 목록. JSON 문자열로 저장. itemFields로 내부 필드 기술
  | "textlist";   // 문자열 배열. 줄 단위로 편집

export interface SchemaFieldDef {
  key: string;
  label: string;
  type: SchemaFieldType;
  default: unknown;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  // number 전용
  min?: number;
  max?: number;
  step?: number;
  // select 전용
  options?: { label: string; value: string }[];
  // array 전용
  itemFields?: SchemaFieldDef[];
  itemLabel?: string;
  /**
   * 새 항목의 기본 골격. itemFields에 노출하지 않지만
   * 슬라이드가 필요로 하는 키를 여기에 둔다.
   * 기존 항목의 미노출 키는 편집 중에도 그대로 보존된다.
   */
  itemDefaults?: Record<string, unknown>;
}

export interface SlideSchema {
  fields: SchemaFieldDef[];
}
```

---

## 4. DC → React 문법 변환 규칙

### 4-1. 템플릿 바인딩

| DC 문법 | React JSX |
|---------|-----------|
| `{{ variable }}` | `{variable}` |
| `{{ obj.prop }}` | `{obj.prop}` |
| `style="{{ styleObj }}"` | `style={styleObj}` |
| `onClick="{{ handler }}"` | `onClick={handler}` |

### 4-2. 조건부 렌더링

```html
<!-- DC -->
<sc-if value="{{ isOpen }}">
  <div>열렸습니다</div>
</sc-if>
```

```tsx
// React
{isOpen && (
  <div>열렸습니다</div>
)}
```

### 4-3. 반복 렌더링

```html
<!-- DC -->
<sc-for list="{{ items }}" as="item">
  <div style="{{ item.style }}">{{ item.label }}</div>
</sc-for>
```

```tsx
// React
{items.map((item) => (
  <div key={item.key} style={item.style}>{item.label}</div>
))}
```

### 4-4. 클래스 → 함수형 컴포넌트

DC의 `DCLogic` 클래스는 React 클래스 컴포넌트와 유사한 구조다.
변환 시 함수형 컴포넌트 + Hooks로 바꾼다.

| DCLogic | React Hooks |
|---------|-------------|
| `state = { ... }` | `useState()` |
| `componentDidMount()` | `useEffect(() => { ... }, [])` |
| `componentDidUpdate(pp, ps)` | `useEffect()` 의존성 배열 활용 |
| `componentWillUnmount()` | `useEffect` 의 cleanup return |
| `this.setState(patch)` | `setState(prev => ({ ...prev, ...patch }))` |
| `renderVals()` | 컴포넌트 함수 본문에서 직접 계산 |
| 클래스 인스턴스 변수 (`this._xxx`) | `useRef()` |

---

## 5. schema.ts 작성 규칙

### 5-1. 기본 구조

```ts
// src/slides/{component-ref}/schema.ts
import type { SlideSchema } from "../SlideProps";

export const schema: SlideSchema = {
  fields: [
    {
      key: "message",
      label: "메시지",
      type: "textarea",
      default: "기본 메시지",
      required: true,
    },
    {
      key: "backgroundColor",
      label: "배경 색상",
      type: "color",
      default: "#1e1b3a",
    },
    {
      key: "accentColor",
      label: "강조 색상",
      type: "color",
      default: "#FFD97D",
    },
  ],
};

export const defaultValues: Record<string, unknown> = Object.fromEntries(
  schema.fields.map((f) => [f.key, f.default])
);
```

### 5-2. 콘텐츠 vs 로직 구분 원칙

DC 원본 상수 객체를 보고 어떤 값을 스키마에 넣을지 판단한다.

```js
// DC 원본 예시
B3 = { inside: '짜잔!', hint: '리본을 당겨보세요', pull: 130 };
```

- `inside`, `hint` → **사용자 콘텐츠** → `data` props + schema 필드로
- `pull` (130px) → **로직 상수** → 컴포넌트 내부에 하드코딩

판단 기준: "CUSTOMER가 이걸 바꾸고 싶어할까?" → Yes → schema 필드. "바꾸면 인터랙션이 깨지는가?" → Yes → 내부 상수.

### 5-3. 배열 필드 (type: "array")

```ts
{
  key: "items",
  label: "항목 목록",
  type: "array",
  itemLabel: "항목",
  default: JSON.stringify([
    { label: "항목 1", color: "#E94F6A" },
  ]),
  itemFields: [
    { key: "label", label: "이름", type: "text", default: "새 항목", required: true },
    { key: "color", label: "색상", type: "color", default: "#E94F6A" },
  ],
  // itemFields에 노출하지 않는 내부 키가 있으면 itemDefaults에 정의
  itemDefaults: { weight: 1 },
}
```

배열 값은 **JSON 문자열**로 저장된다. 컴포넌트 내부에서 파싱:

```tsx
const items = useMemo(() => {
  if (Array.isArray(data.items)) return data.items;
  try { return JSON.parse(data.items as string); }
  catch { return DEFAULT_ITEMS; }
}, [data.items]);
```

`arrayFieldValue.ts` 유틸 함수:

| 함수 | 역할 |
|------|------|
| `parseArrayValue(value)` | 저장값(문자열/배열/null) → `{ok, items, raw}` |
| `serializeArrayValue(items)` | 항목 배열 → JSON 문자열 |
| `makeArrayItem(field)` | 스키마 기준 새 항목 생성 |
| `setItemValue(item, key, value)` | 항목 1개 특정 키만 변경 (미노출 키 보존) |
| `moveArrayItem(items, from, to)` | 항목 순서 변경 |
| `summarizeItem(item, itemFields)` | 항목 카드 헤더용 대표 문자열 |

---

## 6. 공통 훅 (Hooks)

### useVibrate

```ts
const vibrate = useVibrate();
vibrate([50, 30, 50]); // 진동 패턴
```

### useAudio

```ts
const { blip } = useAudio();
blip(440, 0.06, "square", 0.15); // freq, dur(s), type, gain
```

### useHoldProgress

길게 누르기 게이지 패턴 (예: 지문 인증).

```ts
const { progress, holding, down, up, reset } = useHoldProgress(duration, onComplete);
// progress: 0~1, holding: boolean
// down/up: pointerDown/Up 핸들러에 연결
```

### useSlideComplete

`isPreview` 체크 + 슬라이드 인스턴스당 단 1회 호출을 보장한다.

```tsx
const complete = useSlideComplete(onComplete, isPreview);
// 완료 조건 충족 시:
complete();
```

### useSlideTimeout

언마운트 시 예약된 타이머를 자동으로 정리한다.

```tsx
const later = useSlideTimeout();
later(() => complete(), 1500); // 1.5초 뒤 complete 호출
```

---

## 7. 스타일 처리 규칙

### 슬라이드는 플랫폼 디자인 시스템을 따르지 않는다

`CLAUDE.md`의 Neo-Brutalism 규칙(NeoButton, NeoCard, CSS 변수 등)은 플랫폼 UI에만 적용된다. 슬라이드 컴포넌트는 독립된 "캔버스"이므로 인라인 style을 그대로 사용하고, 색상은 `data.backgroundColor` 등 props로 직접 받는다.

```tsx
// ✅ 맞음
<div style={{ background: data.backgroundColor }}>

// ❌ 틀림 (슬라이드에서 플랫폼 토큰 사용 금지)
<div className="bg-cream">
```

### 슬라이드 루트 div

모든 슬라이드의 최상위 div는 전체 화면을 차지한다:

```tsx
<div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
```

### keyframes

DC 원본의 `@keyframes`는 `src/slides/slide-animations.css`에 모아둔다.
네임스페이스 접두사 `jc-`를 붙인다 (예: `jc-pop`, `jc-fadeup`, `jc-beat`).

### 반응형 UI 분기 (PC / 모바일)

슬라이드가 버튼·텍스트 등 UI 요소를 직접 렌더링할 때는 `window.innerWidth` 대신 ResizeObserver로 컨테이너 실제 크기를 측정한다. 에디터 폰 프레임(~390px) 같은 소형 컨테이너 안에 임베드될 수 있기 때문이다.

```tsx
const containerRef = useRef<HTMLDivElement>(null);
const [vw, setVw] = useState(0);

useEffect(() => {
  const el = containerRef.current;
  if (!el) return;
  const ro = new ResizeObserver(([entry]) => setVw(entry.contentRect.width));
  ro.observe(el);
  return () => ro.disconnect();
}, []);

const isWide = vw >= 600;

// 크기 분기 예시
const btnStyle: React.CSSProperties = {
  padding: isWide ? "10px 28px" : "6px 14px",
  fontSize: isWide ? 14 : 11,
};

// 모바일 390px 기준 비례 스케일이 필요하면
const mobileScale = !isWide && vw > 0 ? vw / 390 : 1;
```

| 요소 | 모바일 (`vw < 600`) | PC (`vw ≥ 600`) |
|------|---------------------|-----------------|
| 버튼 패딩 | `6–8px 14–16px` | `10–12px 24–28px` |
| 버튼 폰트 | `11px` | `13–15px` |
| 고정 영역 높이 | `56px` | `68–72px` |
| 간격(gap) | `8px` | `12–16px` |

---

## 8. 등록 방법

### 8-1. 개별 슬라이드 index.ts

```ts
// src/slides/{component-ref}/index.ts
import { registerSlide } from "../registry";
import MySlide from "./MySlide";
import { schema } from "./schema";

export { MySlide };
export { schema, defaultValues } from "./schema";

registerSlide("my-slide", MySlide, schema);
```

### 8-2. src/slides/index.ts 에 추가

```ts
// 소속 그룹 주석 아래에 한 줄 추가
import "./my-slide";
```

### 8-3. 3D 슬라이드 (Three.js)

registry.ts의 `THREEJS_REFS` Set에도 추가한다:

```ts
const THREEJS_REFS = new Set(["gift-unboxing", "matryoshka-dog", "my-3d-slide"]);
```

### 8-4. 플레이어/에디터에서 사용

```tsx
import { resolveSlide } from "@/slides/registry";

const SlideComponent = resolveSlide(slide.componentRef);
if (SlideComponent) {
  const mergedData = { ...slide.defaultValues, ...slide.overrides };
  return <SlideComponent data={mergedData} onComplete={goNext} />;
}
```

### 8-5. 에디터용 스키마 조회

```ts
import { resolveEditorSchema } from "@/slides/schemaAdapter";

// 로컬 스키마 우선, 서버 스키마는 누락 필드 보충에만 사용
const schema = resolveEditorSchema(componentRef, serverSchemaFields);
// schema.source: "local" | "server" | "empty"
```

---

## 9. 새 슬라이드 체크리스트

```
□ src/slides/{ref}/ComponentName.tsx 작성
□ src/slides/{ref}/schema.ts 작성 (fields + defaultValues export)
□ src/slides/{ref}/index.ts 작성 (registerSlide 호출)
□ src/slides/index.ts 에 import 추가
□ 3D 슬라이드라면 registry.ts의 THREEJS_REFS에 추가
□ TypeScript 에러 없음
□ defaultValues만으로 정상 렌더링 됨
□ data props 변경 시 실시간 반영 됨
□ onComplete 콜백이 완료 조건 충족 시 1회만 호출됨 (useSlideComplete 사용)
□ isPreview=true일 때 onComplete 호출하지 않음
□ 모바일 터치 동작 정상 (touch-action 설정)
□ 진동/사운드 try-catch로 안전하게 처리
□ useEffect cleanup에서 타이머/rAF/오디오 정리 (useSlideTimeout 활용)
□ 포인터 이벤트의 setPointerCapture try-catch로 감싸기
```

---

## 10. 주의사항

### DC 원본의 쇼케이스 래퍼는 변환하지 않는다

DC 파일에는 탭 전환 UI, 폰 프레임, 설명 텍스트 등 쇼케이스용 래퍼가 있다.
변환 대상은 `<sc-if>` 안쪽의 **실제 인터랙션 영역**만.

### schemaAdapter와 서버 스키마

로컬 `schema.ts`가 정본이고, 서버 스키마는 보조로만 쓴다.
로컬에 없는 필드만 서버 스키마에서 변환해 뒤에 덧붙인다.
어댑터 로직이 틀리면 편집 패널이 조용히 빈 값을 저장하므로 `schemaAdapter.test.ts` 테스트를 유지한다.

---

## 11. DB 마이그레이션 (Flyway SQL)

슬라이드 컴포넌트 추가 후 반드시 Flyway 마이그레이션으로 DB에도 등록해야 에디터에서 선택·배치할 수 있다.

### 마이그레이션 파일 위치

```
joy_craft_api/src/main/resources/db/migration/
└── V{N}__seed_{slug}.sql
```

버전 번호는 기존 파일 중 가장 큰 번호 + 1. 반드시 `ls`로 현황 확인 후 결정. 버전 충돌 시 Flyway가 서버 시작을 거부한다.

### SQL 템플릿

```sql
-- V{N}__seed_{slug}.sql

DO $$
DECLARE
  ct_id  uuid;
  ctv_id uuid;
BEGIN

-- ① component_types
INSERT INTO component_types (id, slug, name, description, category, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '{componentRef}',
  '{한글 이름}',
  '{한 줄 설명}',
  '{카테고리}',   -- 인터랙션 | 감정 | 읽기 | 이야기 | 연출 | 음악
  now(), now()
)
RETURNING id INTO ct_id;

-- ② component_type_versions
INSERT INTO component_type_versions (
  id, type_id, version, schema, capabilities, layerable, platform_mode, pricing,
  tags, use_cases, bundle_object_key, status, published_at, created_at
) VALUES (
  gen_random_uuid(), ct_id, 1,
  '[
    {"key":"{key}", "label":"{label}", "field":{"kind":"{kind}"}},
    ...
  ]'::jsonb,
  ARRAY['haptics'],       -- haptics | audio | camera 등
  false,
  'responsive',
  'free',                 -- free | pro
  ARRAY['{태그1}', '{태그2}'],
  ARRAY['{유스케이스}'],
  'builtin:{componentRef}',
  'APPROVED', now(), now()
) RETURNING id INTO ctv_id;

-- ③ component_templates
INSERT INTO component_templates (
  id, group_id, version, type_version_id, name, description,
  default_values, status, published_at, created_at
) VALUES (
  gen_random_uuid(), gen_random_uuid(), 1, ctv_id,
  '{템플릿 이름}',
  '{한 줄 설명}',
  '{
    "key1": "value1",
    "key2": "value2"
  }'::jsonb,
  'PUBLISHED', now(), now()
);

END $$;
```

### schema의 field.kind 값

| SchemaFieldType (로컬) | field.kind (DB) |
|----------------------|-----------------|
| `text` / `textarea` | `"string"` |
| `color` | `"color"` |
| `number` | `"number"` |
| `image` / `imagelist` | `"image"` |
| `boolean` | `"boolean"` |
| `select` | `"string"` |
| `array` / `textlist` | `"string"` (JSON 직렬화) |

`number` 타입에는 `min`, `max`, `step`을 함께 기록:

```json
{"key":"animationSpeed", "label":"속도", "field":{"kind":"number","min":0.4,"max":2,"step":0.1}}
```

### default_values 작성 규칙

- `schema.ts`의 `default` 값과 **반드시 일치**시킨다. 불일치 시 에디터가 서버값을 우선해 로컬 기본값을 무시한다.
- `array` / `textlist` 필드는 JSON 문자열로 직렬화: `"[{\"q\":\"...\"}]"`
- `null` 허용 필드(이미지 등)는 그대로 `null`.
- JSONB이므로 `'{...}'::jsonb` 캐스팅 필수.

### DB 등록 체크리스트

```
□ 기존 마이그레이션 버전 확인 후 V{N+1} 번호 결정
□ component_types — slug가 componentRef와 동일한지 확인
□ component_type_versions — schema key가 schema.ts fields와 일치하는지 확인
□ component_templates — default_values가 schema.ts defaultValues와 일치하는지 확인
□ 서버 재시작 후 Flyway 로그에 "Successfully applied 1 migration" 확인
□ API로 컴포넌트 목록 조회 시 새 슬라이드가 노출되는지 확인
```
