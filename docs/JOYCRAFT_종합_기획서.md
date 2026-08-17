# JoyCraft 종합 기획서

> 작성일: 2026-08-17 (M0~M3 구현 완료 반영: 2026-08-17)
> 목표 시점: **지인 대상 베타** (`플랫폼 기획 정리.md` 로드맵 1단계)
> 범위: 프론트(`joy_craft_web`) + 백엔드(`joy_craft_api`) 전체
>
> 이 문서는 기존 6개 문서를 **대체하지 않는다.** 현황을 실제 코드와 대조해 진단하고, 베타까지의 실행 순서를 정하는 상위 인덱스 문서다.
>
> **표기 규칙**: `[확인됨]`은 코드에서 직접 확인한 사실이며 파일·행 근거를 단다. `[판단]`은 이 문서의 권고이지 확정 사항이 아니다.

## 구현 현황 (M0~M3 완료, 검토 통과)

4장의 로드맵 M0~M3는 builder/reviewer 에이전트로 전부 구현·검토를 마쳤다. 각 단계는 구현 → 직접 검증 → 결함 발견 시 보수 → 재검증의 과정을 거쳤다. 상세 내역은 4장 본문에 최신 상태로 반영했다. 요약:

| 단계 | 최종 판정 | 핵심 성과 |
|---|---|---|
| M0 보안 지혈 | PASS | 시크릿 환경변수 외부화, `SECRET_ROTATION.md` 체크리스트, 로그 파일 추적 해제 |
| M1 플레이어 | PASS (M1.5 보수) | `resolveSlide` 연결 — 18종 전부 렌더 실증. free 모드 경쟁 상태·gated 데드락 4종·에러 바운더리 수정 |
| M2 에디터 | PASS (M2.5 보수) | 하드코딩 데모 제거, 스키마 3중화 해소, 배열 필드 8종 전용 에디터, 저장 실패 시 편집 유실 버그 수정 |
| M3 운영 준비 | PASS | `/editor` 인증 적용, CORS 설정(MockMvc로 실제 배선 검증), KST 자정 집계, 검색 기능 복구, 로그아웃 버그 수정 |

**베타 배포 전 남은 것 (중요도순, 코드 작업이 아니라 판단·외부 조치가 필요한 것 위주):**

1. **시크릿 전량 로테이션 — 미완, 사람이 해야 함.** `docs/SECRET_ROTATION.md` 체크박스가 전부 비어 있다. JWT 시크릿·DB 비밀번호·Kakao secret·MinIO 키가 여전히 Git 히스토리(및 현재 HEAD 커밋)에 평문으로 남아 있다. 이 하나만으로 베타 배포를 막아야 한다.
2. **백엔드 `./gradlew test`(전체)가 실패 상태.** `contextLoads`가 로컬 Postgres를 요구해 DB 없이는 항상 빨간불이다. Testcontainers 도입 또는 `contextLoads` 격리 필요.
3. **CORS 허용 오리진에 `*` 단독 지정을 막는 코드가 없다.** `allowCredentials=true`와 결합하면 위험하다. 배포 전 운영 도메인 확정 + 방어 코드 권장.
4. **수신자 반응(하트) 수집 엔드포인트 부재.** `SiteResponse` 저장 코드가 0건이라 대시보드 "받은 하트"가 영구 0. 베타의 관찰 목적 자체가 훼손된다.
5. **발행 스냅샷 병합 로직에 테스트가 없다.** 병합이 틀리면 이미 발행된 사이트가 잘못된 내용으로 영구 고정되고 되돌릴 수 없다. 2번(테스트 인프라)이 선행되어야 추가 가능.

이 5가지를 제외하면 로드맵상 코드 구현은 완료됐고, 프론트 빌드/린트/테스트(159개)와 백엔드 빌드(`-x test`)는 정상 통과한다.

---

## 요약 (3줄)

1. **부품은 다 있는데 조립이 안 되어 있다.** 백엔드 22개 엔드포인트와 슬라이드 18종이 각각 완성되어 있으나, 둘을 잇는 **에디터와 플레이어가 비어 있다.**
2. 그 결과 **제품이 한 번도 끝까지 동작한 적이 없다.** CUSTOMER는 슬라이드를 고를 수도, 편집할 수도 없고 수신자는 볼 수 없다.
3. 베타까지의 최단 경로는 신규 기능이 아니라 **연결**이다. `resolveSlide()` 호출부를 만드는 것 하나가 제품을 처음으로 살아나게 한다.

---

## 1장. 현황 진단 — 문서의 주장 vs 실제 코드

### 1-1. 대조표

`docs/API_구축_계획.md`는 머리말에서 **"Phase 0~5 전체 구현 완료"**를 선언한다. 이 선언은 **백엔드 기준으로는 대체로 사실이고, 프론트 기준으로는 사실이 아니다.**

| 영역 | 문서의 주장 | 실제 | 판정 |
|---|---|---|---|
| 백엔드 도메인/API | 완료 | 컨트롤러 5개, 엔드포인트 22개 실동작 | ✅ 일치 |
| DB 스키마 | 완료 | Flyway V1~V7, 10개 테이블 | ✅ 일치 |
| 프론트 API 클라이언트 | 완료 | `src/api/` 5개 모듈, 목 데이터 0건 | ✅ 일치 |
| Dashboard/MySites/Browse/Master | 완료 | 스토어 경유 실제 API 연동 | ✅ 일치 |
| **사이트 에디터** | **"Phase 3 완료"** | **하드코딩 데모. 스키마 미사용** | ❌ **불일치** |
| **플레이어** | 🔲 미구현으로 표기 | 53줄 정적 스텁 | ⚠️ 문서가 정직함 |
| CREATOR 웹 IDE | 2개 문서 2,200줄로 설계됨 | 코드 0줄 | ⚠️ 설계만 존재 |
| PRO 구독 / 결제 | 🔲 미래 | 테이블조차 미설계 | ⚠️ 문서가 정직함 |

가장 중요한 항목은 굵게 표시한 **에디터**다. `API_구축_계획.md` Phase 3이 "완료"로 표기되어 있으나, 이는 **백엔드 API와 `editorStore` 배선까지만** 완료된 것이고 화면은 완료되지 않았다. 이 문서를 읽는 사람이 "에디터는 됐구나"로 오해할 여지가 크므로 여기서 바로잡는다.

### 1-2. 백엔드 — 예상보다 완성도가 높다 `[확인됨]`

스캐폴드가 아니라 실제로 동작하는 코드다.

- **스택**: Java 21 + Spring Boot 4.1.0, Gradle Kotlin DSL, PostgreSQL, Flyway 11.8.0, JJWT 0.12.6, Caffeine
- **규모**: 소스 62개 파일, 컨트롤러 5개 / 엔드포인트 22개, JPA 엔티티 11개, 리포지토리 11개
- **마이그레이션**: V1~V7 (약 1,056줄). `V7__seed_builtin_components.sql`(614줄)이 18종을 시드하며, `bundle_object_key`를 `'builtin:pin-lock'` 형태로 넣어둔다 — **이것이 DB와 프론트 레지스트리를 잇는 다리다**
- **5계층 모델 정상 구현**: `component_types` → `component_type_versions` → `component_templates` → `sites`/`site_slides` → `site_publications`
- **발행 스냅샷이 실제로 작동한다**: `SiteService.publish()`가 `defaultValues + overrides`를 병합한 불변 JSON을 구워 저장하고, `GET /api/play/{slug}`가 이를 서빙하며 `view_count`를 증가시킨다

기획서의 핵심 설계 원칙(**로직과 데이터 분리**, **template_version 고정으로 발행본 불변**)이 코드에 제대로 반영되어 있다. 이 부분은 잘 되어 있다.

**백엔드에서 비어 있는 것** `[확인됨]`
- `assets` 엔티티·리포지토리는 있으나 **컨트롤러·서비스 없음**. MinIO 설정만 있고 읽는 코드가 없어 **이미지 업로드가 통째로 부재**
- `site_responses`(받은 하트) 리포지토리는 있으나 **쓰기 경로 없음** — 수신자 반응을 수집하는 엔드포인트가 없다
- `ComponentReview` / `ComponentTypeVersion` 엔티티는 CREATOR 심사 워크플로용으로 준비되어 있으나 **조회 2개 외 엔드포인트 없음**
- `AdminController.getStats`의 `proSubscribers`·`monthlyRevenue`는 `0L` / `"₩0"` 하드코딩
- `ComponentController.browse`가 `search` 파라미터를 **받고서 무시**한다 (`category`만 서비스로 전달)

### 1-3. 프론트 — Editor·Player만 비어 있다 `[확인됨]`

- **스택**: Vite 8 + React 19 + TypeScript 6 + Tailwind v4, 파일 119개
- `src/api/` 5개 모듈이 백엔드 엔드포인트를 거의 전부 덮는다. `mock`/`dummy`/`더미` grep 결과 **0건** — 목 데이터는 완전히 제거되었다
- Dashboard / MySites / Browse / MasterDashboard는 Zustand 스토어를 통해 실제 API에 붙어 있다
- 슬라이드 18종이 `src/slides/`에 폴더당 3파일(`Component.tsx` / `schema.ts` / `index.ts`) 규약대로 완성

**비어 있는 곳은 정확히 두 군데다.** 이것이 이 문서 전체의 결론이다.

---

## 2장. 핵심 병목 — 슬라이드가 고아 상태인 이유

### 2-1. 끊어진 고리

레지스트리는 정상이다. `src/slides/registry.ts`:

```ts
export function registerSlide(componentRef: string, component: FC): void {
  registry[componentRef] = component;
}
export function resolveSlide(componentRef: string): FC | undefined {
  return registry[componentRef];
}
```

`src/slides/index.ts`가 18개 폴더를 side-effect import 하고, 각 `index.ts`가 `registerSlide("pin-lock", PinLock)`을 호출한다. `App.tsx:2`에서 `import "./slides"`로 앱 시작 시 전부 등록된다. **여기까지는 완벽히 동작한다.**

문제는 그 다음이다 — **`resolveSlide()`의 호출부가 코드베이스 전체에 단 한 곳도 없다** `[확인됨]`. 레지스트리는 매번 채워지기만 하고 아무도 읽지 않는다.

```
registerSlide (18회 호출)  →  registry {18개}  →  resolveSlide  →  ❌ 호출부 0건
```

이 단절의 양쪽 끝이 그대로 두 개의 빈 화면이다.

**플레이어** — `src/pages/public/PlayerPage.tsx`는 53줄이며 전부 정적이다:
```tsx
<div style={{ fontFamily: "var(--font-headline)", ... }}>
  사이트 준비 중 🎁
</div>
<p>슬라이드 플레이어가 곧 완성됩니다.</p>
```

**에디터** — `src/pages/editor/SiteEditorPage.tsx`의 가운데 미리보기는 슬라이드를 렌더링하지 않는다. yes/no 버튼 데모가 통째로 하드코딩되어 있고(211~244행), 우측 편집 패널도 `questionText` / `yesText` / `noText` / `yesColor` / `dotBg` **5개 필드가 하드코딩**되어 있다(255~293행). `slide.schema`는 서버에서 내려오지만 **읽지 않는다.**

즉 **어떤 슬라이드를 선택하든 화면에는 항상 같은 yes/no 데모가 뜬다.** 18종 중 무엇도 편집할 수 없다.

### 2-2. 구조적 장애물 — 스키마 표현 3중화 `[확인됨]`

연결을 시도하면 바로 부딪히는 문제. 같은 개념이 세 가지 형태로 존재하고 **변환기가 없다.**

| 위치 | 형태 | 상태 |
|---|---|---|
| `src/slides/SlideProps.ts` | `{ key, label, type: "text"\|"textarea"\|"color"\|"number"\|"font"\|"image"\|"select"\|"boolean", default, min?, max?, step?, options? }` | 슬라이드 18종이 실제로 쓰는 형태 |
| `src/types/api.ts:60` | `{ key, label, field: { kind: "string"\|"color"\|"number"\|"font"\|"image", min?, max? } }` | **백엔드가 실제로 내려주는 형태** |
| `src/types/index.ts` | `{ key, label, field: { kind: ... } }` 태그 유니언 | **어디서도 import되지 않는 죽은 코드** |

DB도 백엔드 형태를 따른다. V7 시드 실제 내용:
```json
{"key":"question","label":"질문 문구","field":{"kind":"string"}}
```

세 형태의 차이는 이름만이 아니다.
- **키 이름**: `type` vs `field.kind`
- **값 이름**: `"text"` vs `"string"`
- **표현력**: 슬라이드 쪽에는 `textarea` / `select` / `boolean` / `default` / `options`가 있으나 **백엔드 쪽에는 없다.** 즉 서버 스키마만으로는 편집 UI를 완전히 그릴 수 없다

`[판단]` 따라서 스키마 기반 에디터의 **전제 조건**은 다음 두 가지다.
1. **어댑터 1개 신설** — 서버의 `field.kind` → 슬라이드의 `type`으로 변환
2. **부족한 정보는 로컬 스키마에서 보충** — 각 슬라이드의 `schema.ts`가 `textarea`/`select`/`default`까지 갖고 있으므로, `componentRef`로 로컬 스키마를 찾아 **로컬을 우선**하고 서버 스키마는 검증용으로 쓰는 편이 안전하다
3. **`src/types/index.ts` 폐기** — 사용처가 없고 혼선만 만든다

이 판단의 근거는 "로컬 스키마가 서버보다 표현력이 높다"는 것 하나다. 반대로 서버를 정본으로 삼으려면 백엔드 스키마 포맷과 V7 시드를 전부 확장해야 하는데, 베타 규모에서는 과한 작업이다.

---

## 3장. 제품 방향성

### 3-1. 유지할 것

`플랫폼 기획 정리.md`의 **3역할(MASTER / CREATOR / CUSTOMER) · 3계층(Component Type → Template → Site Instance)** 모델은 타당하며 이미 DB에 구현되어 있다. 바꾸지 않는다.

특히 다음 두 설계 원칙은 이 제품의 자산이므로 유지한다.
- **코드와 데이터의 분리** — DB에는 스키마와 값만, 로직은 코드에
- **발행 스냅샷 불변** — 템플릿이 바뀌어도 이미 발행된 사이트는 깨지지 않는다

### 3-2. 베타에서 명시적으로 제외할 것 `[판단]`

기획 문서에 설계는 되어 있으나 **베타에 넣지 않는다**. 넣지 않기로 **문서에 적어두는 것** 자체가 목적이다 — 그래야 범위가 흐려지지 않는다.

| 제외 항목 | 설계 위치 | 제외 근거 |
|---|---|---|
| CREATOR 웹 IDE | `CREATER 상세 페이지 설계.md` (1,102줄) | 공급측. 수요 검증이 먼저 |
| 컴포넌트 심사 워크플로 | 동상 | CREATOR가 없으면 심사할 대상도 없음 |
| PRO 구독 / 결제 | `화면설계 & 흐름.md` PART 4 | 원문이 **"과금 요소 (고려만)"** — 미결정 |
| 커스텀 도메인 / 만료·연장 | 동상 | 과금과 묶여 있음 |
| 노코드 CREATOR 빌더 | 기획서 4단계 | 로드맵상 한참 뒤 |

근거: MASTER가 18종을 직접 만든 현재 상태가 **기획서 1단계 그대로**다. "MASTER가 핵심 컴포넌트 제작 + CUSTOMER 에디터 완성 → 지인 배포 후 반응 확인." 공급측을 열기 전에 **이 사이클을 한 번 완주하는 것**이 목표다.

### 3-3. 베타에 반드시 남길 것

```
CUSTOMER 로그인 → 사이트 생성 → 슬라이드 선택·배치 → 편집 → 발행
                                                              ↓
                                      수신자가 링크 열기 → 슬라이드 플레이
```

이 한 줄이 끊기지 않고 흐르는 것. 그 외는 전부 부차적이다.

### 3-4. 미해결 결정 3건

기존 문서가 미뤄둔 것들을 여기서 다시 꺼낸다.

**(1) 배열 필드 편집 UI — 가장 시급한 제품 결정** `[확인됨 + 판단]`

18종 중 **8종**이 배열 데이터를 **JSON 문자열 textarea**로 받는다:

| 슬라이드 | 필드 | 라벨 |
|---|---|---|
| `quiz` | `questions` | 퀴즈 목록 (JSON) |
| `roulette` | `slices` | 룰렛 항목 (JSON) |
| `story-book` | `pages` | 페이지 목록 (JSON) |
| `ending-credits` | `credits` | 크레딧 목록 (JSON) |
| `balloon-pop` | `balloons` | 풍선 목록 (JSON) |
| `cassette-player` | `tracks` | 트랙 목록 (JSON) |
| `flashlight` | `spots` | 숨겨진 아이템 (JSON) |
| `rolling-paper` | `seedNotes` | 초기 메모 (JSON) |

`SLIDE_COMPONENT_변환_가이드.md` §6-2가 "1차는 방법 A(JSON 직접 편집), 2차에 방법 B(전용 배열 에디터)"로 정해뒀다. 그런데 방법 A는 **"코딩 없이 만든다"는 제품 전제와 정면으로 충돌한다.** 라벨에 "(JSON)"이라고 쓰여 있는 입력창은 일반 사용자에게는 벽이다.

`[판단]` 베타 대상이 지인이라 해도 JSON을 손으로 짜게 할 수는 없다. 다만 8종 전부에 전용 에디터를 만드는 것도 베타에는 과하다. **절충안**: 배열 항목이 대부분 `{텍스트, 색상}` 수준의 단순 구조이므로, **범용 "항목 추가/삭제/순서변경 + 항목별 필드 입력" 컴포넌트 1개**를 만들어 8종이 공유하게 한다. 신규 스키마 타입 `array`를 추가하고 항목 내부 필드를 `itemFields`로 기술하는 방식.

→ **결정 필요**: 이 절충안으로 갈지, 아니면 베타는 JSON 그대로 두고 8종을 "고급" 표시할지.

**(2) 과금** — `화면설계 & 흐름.md` PART 4가 명시적으로 "고려만"이라고 적어둔 사항. `[판단]` **베타에서는 결정을 보류하는 것이 맞다.** 지인 대상이라 과금이 무의미하고, 무엇에 돈을 낼지는 반응을 본 뒤에 정하는 편이 낫다. 다만 `pricing: free|premium` 컬럼과 PRO 배지 UI는 이미 있으므로 **표시만 유지**하고 실제 제한은 걸지 않는다.

**(3) `platformMode`** `[확인됨]` — 기획서 §4의 핵심 개념이다. "렌더러는 접속 환경을 감지해 platformMode와 안 맞으면 대체 화면을 보여줘야 함." 그런데 이 개념은 **API 구축 계획·슬라이드 변환 가이드·디자인 시스템 어디에도 없다.** DB 컬럼(`component_type_versions.platform_mode`)과 프론트 타입 정의만 존재하고 **동작하는 코드가 0줄**이다.

`[판단]` 현재 18종은 V7 시드에서 전부 `'responsive'`로 들어가 있어 베타에서는 실질적 영향이 없다. **베타 범위 밖으로 명시**하고, CREATOR 개방 시점에 되살리는 것을 권고한다. 다만 **문서에 "미구현"이라고 적어두지 않으면** 나중에 구현된 것으로 착각할 위험이 있다.

---

## 4장. 베타까지의 실행 로드맵

순서에 의미가 있다. M0는 안전, M1은 제품이 처음 살아나는 지점, M2는 실제로 쓸 수 있게 되는 지점, M3는 남에게 보여줄 수 있게 되는 지점이다.

### M0 — 보안 지혈 (최우선)

**다른 모든 작업보다 먼저 해야 한다.** 지인에게 링크를 뿌리는 순간 외부 노출이 시작되기 때문이다.

`[확인됨]` `joy_craft_api/src/main/resources/application.yaml`이 **Git에 커밋되어 있고**, 그 안에 실제 값이 들어 있다:

| 항목 | 내용 |
|---|---|
| DB 접속 | 원격 PostgreSQL 호스트/포트 `202.150.191.175:1851` + 계정 + 비밀번호 |
| JWT | 서명 시크릿 실값 |
| Kakao | REST API 키 + client secret |
| MinIO | access key + secret key |

이는 백엔드 자신의 `CLAUDE.md`에 적힌 **"설정 파일에 시크릿 금지"** 규칙을 위반한다. 또한 `src/test/resources/application-test.yaml`이 **같은 원격 DB를 가리켜서**, 테스트를 돌리면 운영 데이터에 붙는다.

해야 할 일:
1. 전 항목을 **환경변수 / 프로파일 분리**로 이전
2. **노출된 값 전량 로테이션** — 파일에서 지우는 것만으로는 부족하다. **Git 히스토리에 그대로 남는다.** DB 비밀번호, JWT 시크릿, Kakao secret, MinIO 키를 전부 새로 발급해야 한다
3. `flyway.clean-disabled: false` → `true`. 현재 설정은 **`flyway:clean` 한 번으로 스키마 전체가 삭제될 수 있다**
4. `flyway.validate-on-migrate: false` → `true` (V1 수정으로 인한 체크섬 불일치는 `repair`로 해소)
5. 테스트용 DB를 운영과 분리

`[판단]` JWT 시크릿이 노출된 상태에서는 **누구든 임의 사용자의 토큰을 위조할 수 있다.** 베타 이전 필수 조건이다.

### M1 — 플레이어: 제품이 처음으로 동작하는 지점

**가장 적은 코드로 가장 큰 효과를 내는 단계.** 백엔드가 이미 스냅샷을 굽고 있으므로 프론트만 붙이면 된다.

- `PlayerPage.tsx` 재작성. 핵심 로직은 변환 가이드 §9-2가 이미 명시해둔 형태 그대로다:
  ```tsx
  const SlideComponent = resolveSlide(slide.componentRef);
  const mergedData = { ...slide.defaultValues, ...slide.overrides };
  return <SlideComponent data={mergedData} onComplete={goNext} />;
  ```
  단, 발행 스냅샷은 이미 병합된 `values`를 내려주므로 플레이어에서는 재병합이 불필요하다.
- **버그 수정** `[확인됨]`: 라우트는 `/play/:slug`인데 `PlayerPage.tsx:5`가 `useParams<{ siteId: string }>()`를 읽는다. **파라미터가 항상 `undefined`다.**
- `GET /api/play/{slug}` 연동 (인증 불필요 — `SecurityConfig`에서 permit-all `[확인됨]`)
- `flowPolicy.mode`(`gated` / `free`)에 따른 전환 로직, 진행 표시
- 슬라이드는 **디자인 시스템을 따르지 않는 독립 캔버스**임에 유의. 변환 가이드 §8-1이 명시한 예외이며, 전부 `position:absolute; inset:0` 풀블리드다. 플레이어는 이를 감싸는 컨테이너만 제공하고 스타일을 주입하지 않아야 한다

**이 단계가 끝나면 처음으로 "발행된 사이트를 열어볼 수 있다."** 데이터는 DB에 직접 넣어서라도 확인 가능하다.

### M2 — 스키마 기반 에디터

베타의 본체. CUSTOMER가 실제로 만들 수 있게 되는 단계다.

- **2장의 스키마 어댑터 도입**, `src/types/index.ts` 폐기
- **우측 패널을 스키마 순회로 전환** — 하드코딩 5필드 제거. 위젯은 기존 컴포넌트를 최대한 재사용한다:

  | 스키마 `type` | 위젯 | 상태 |
  |---|---|---|
  | `color` | `ColorPicker` | 기존 재사용 |
  | `boolean` | `ToggleSwitch` | 기존 재사용 |
  | `text` | `neo-input` 클래스 | 기존 재사용 |
  | `textarea` / `number` / `select` / `font` | — | 신규 최소 구현 |
  | `image` | — | 6장 결정 필요 |
  | `array` | — | 3-4(1) 결정 필요 |

- **가운데 미리보기를 실제 슬라이드로 교체** — `resolveSlide` + `isPreview={true}`. M1과 렌더링 경로를 공유하므로 M1 이후가 자연스럽다
- **"페이지 추가" 구현** `[확인됨]` — 현재 `alert("템플릿 선택 기능 준비 중")`이다(195행). `GET /api/templates/browse`가 이미 있으므로 템플릿 선택 모달로 교체
- **순서 변경 UI** — `@dnd-kit` 3종이 설치되어 있으나 **한 번도 사용되지 않았다** `[확인됨]`. `editorStore.reorderSlides`와 백엔드 `PUT /sites/{id}/slides/reorder`는 이미 준비되어 있다
- **버그 수정** `[확인됨]` — `editorStore.saveDraft`가 **선택된 슬라이드 하나만** 저장한다(91~97행). 다른 슬라이드를 편집한 뒤 선택을 옮기면 **편집분이 유실된다.** 함께 정리할 것: 모듈 전역에 선언된 debounce 타이머(`let saveTimer`)

### M3 — 베타 운영 준비

남에게 링크를 주기 전에 막아야 할 것들.

- **`/editor/:siteId`가 유일하게 `AuthGuard` 미적용** `[확인됨]` (`App.tsx:68`). 다른 인증 라우트는 전부 감싸져 있다
- **`AuthGuard`가 렌더 중 `navigate()` 호출** `[확인됨]` (27행, 32행) → `<Navigate replace />` 반환으로 교체. React가 렌더 중 상태 변경을 경고한다
- **백엔드 CORS 설정 전무** `[확인됨]` (grep 결과 0건). Vite 프록시(`/api → localhost:8080`) 덕에 개발에서는 드러나지 않지만, **프론트와 API를 다른 오리진에 배포하는 순간 전부 깨진다**
- **세션이 Caffeine 5분 TTL 인메모리뿐** `[확인됨]`. 서버 재시작 또는 인스턴스 2대 이상이면 **전원 로그아웃**된다. 리프레시 토큰도 없다. `[판단]` 베타 규모(미니PC 단일 인스턴스)에서는 감수 가능하나, **정식 오픈 전에는 반드시 해결해야 할 항목**으로 기록해둔다
- **오늘 집계가 UTC 자정 기준** `[확인됨]` — `오늘 신규가입` / `오늘 생성 사이트`가 한국 시간과 **9시간 어긋난다.** 한국 대상 서비스에서는 오전 9시 이전 가입이 전날로 집계된다
- **README 갱신** — React 18→19, `api/ 미구현`·`player/ 미구현` 표기, `/editor` 라우트 등이 사실과 다르다
- `ComponentController.browse`의 `search` 무시 수정 (BrowsePage 검색창이 동작하지 않는다)

---

## 5장. 기술 부채 목록

| 심각도 | 항목 | 근거 위치 |
|---|---|---|
| **P0** | 시크릿 평문 커밋 (DB/JWT/Kakao/MinIO) + 히스토리 잔존 | `joy_craft_api/src/main/resources/application.yaml` |
| **P0** | `flyway.clean-disabled: false` — 스키마 전체 삭제 가능 | 동상 |
| **P0** | 테스트 설정이 운영 DB를 가리킴 | `src/test/resources/application-test.yaml` |
| **P0** | **프론트 빌드가 이미 깨져 있음** — 타입 에러 45건 (M1 착수 시 발견) | `npm run build` |
| **P1** | **gated 데드락** — 슬라이드 4종이 `onComplete`를 호출하지 않아 수신자가 갇힘 | `roulette`, `cassette-player`, `dday-counter`, `rolling-paper` |
| **P1** | `request()`가 204 응답에도 `res.json()` 호출 → 삭제 API가 파싱 에러로 실패 | `src/api/client.ts` |
| **P1** | `resolveSlide` 호출부 0건 — 슬라이드 18종 고아 상태 | `src/slides/registry.ts` |
| **P1** | 에디터 미리보기·편집 패널 하드코딩 | `SiteEditorPage.tsx` 211–244, 255–293 |
| **P1** | 플레이어 스텁 | `PlayerPage.tsx` 전체 |
| **P1** | 스키마 표현 3중화, 어댑터 없음 | `SlideProps.ts` / `types/api.ts:60` / `types/index.ts` |
| **P1** | `saveDraft`가 선택 슬라이드만 저장 → 편집분 유실 | `editorStore.ts` 91–97 |
| **P1** | 이미지 업로드 전무 (`assets` 컨트롤러·서비스 없음) | `joy_craft_api` asset 도메인 |
| **P2** | `/play/:slug` vs `useParams<{siteId}>` 불일치 | `PlayerPage.tsx:5` |
| **P2** | `/editor/:siteId` 인증 미적용 | `App.tsx:68` |
| **P2** | `AuthGuard` 렌더 중 `navigate()` | `AuthGuard.tsx` 27, 32 |
| **P2** | CORS 설정 없음 | `SecurityConfig.java` |
| **P2** | 세션 인메모리 5분, 리프레시 토큰 없음 | `SessionCacheService.java` |
| **P2** | 오늘 집계 UTC 기준 | `AdminController` / `SiteService` |
| **P2** | `browse`의 `search` 파라미터 무시 | `ComponentController.java` |
| **P2** | `types/index.ts` 죽은 코드 | `src/types/index.ts` |
| **P2** | `@dnd-kit`·`vite-plugin-pwa` 설치 후 미사용 | `package.json` |
| **P2** | README stale | `README.md` |
| **P2** | 마스터 하위 4개 라우트가 전부 같은 페이지 | `App.tsx` 48–51 |

### 테스트에 대하여 `[확인됨 + 판단]`

**현재 테스트는 사실상 0건이다.** 백엔드는 `contextLoads()` 하나뿐이고, 프론트는 **테스트 프레임워크 자체가 설치되어 있지 않다**(`package.json`에 test 스크립트 없음).

`[판단]` 베타 규모에서 전면적인 테스트 도입은 과하다. 다만 **다음 두 곳에만은 테스트를 넣을 것을 권고한다** — 잘못되어도 에러가 나지 않고 **조용히 데이터가 깨지는** 지점이기 때문이다.

1. **발행 스냅샷 생성** (`SiteService.publish`) — 병합이 틀리면 이미 발행된 사이트가 잘못된 내용으로 영구 고정된다. 되돌릴 수 없다
2. **스키마 어댑터** (M2에서 신설) — 변환이 틀리면 편집 패널이 조용히 빈 값을 저장한다

---

## 6장. 결정 필요 사항

진행 전에 답이 필요한 항목들.

| # | 질문 | 선택지 | 이 문서의 권고 |
|---|---|---|---|
| 1 | 배열 필드 8종의 편집 UI | (A) JSON textarea 유지 (B) 범용 배열 에디터 1개 신설 | **(B)** — (A)는 "코딩 없이" 전제와 충돌 |
| 2 | 이미지 업로드 | (A) MinIO 업로드 API 구현 (B) 베타는 URL 직접 입력 | **(B)** — 백엔드 asset 도메인 전체 신설은 베타에 과함 |
| 3 | `platformMode` | (A) 베타에 구현 (B) 범위 밖 명시 | **(B)** — 현재 18종 전부 `responsive`라 실익 없음 |
| 4 | 과금 | (A) 베타에 제한 적용 (B) 표시만, 제한 없음 | **(B)** — 원문이 "고려만" |
| 5 | 테스트 범위 | (A) 없음 (B) 발행·어댑터 2곳만 (C) 전면 도입 | **(B)** |
| 6 | 시크릿 로테이션 시점 | (A) 즉시 (B) 배포 직전 | **(A)** — 이미 커밋된 상태 |
| 7 | **gated 데드락 4종** (`roulette`·`cassette-player`·`dday-counter`·`rolling-paper`가 `onComplete` 미호출) | (A) 각 슬라이드에 완료 조건 부여 (B) `escapeAfter` 건너뛰기로만 탈출 (C) 이 4종은 `free` 전용으로 제한 | **(A)** — (B)는 수신자가 N초를 기다려야 하고, (C)는 CUSTOMER가 이유를 알 수 없음 |
| 8 | `escapeAfter` 의미 확정 | M1이 "N초 후 건너뛰기 허용"으로 해석 (문서에 정의 없음) | 이 해석 확정 또는 재정의 |
| 9 | 저장 실패 시 `flush()`가 조용히 성공 처리 → 페이지 추가/삭제/발행 시 편집분 유실 | (A) `flush` 실패 시 addSlide/removeSlide/publish 중단 (B) 그대로 진행하되 경고 | **(A)** — (B)는 데이터 유실을 감수하는 것 |
| 10 | 배열 항목 숫자 필드를 비우면 키 삭제 → `flashlight`/`cassette-player`는 NaN으로 깨짐 | (A) 항목 내부는 빈 값 거부(최소값 유지) (B) 항목 기본값으로 복귀 | **(A)** — 항목 안에는 "필드 미설정"이 의미가 없음 |

---

## 7장. 부록

### 7-1. 슬라이드 18종

`src/slides/index.ts`와 `V7__seed_builtin_components.sql` 양쪽에서 대조 확인함 `[확인됨]`.

| # | componentRef | 한글명 | 그룹 | 배열 필드 |
|---|---|---|---|---|
| 1 | `pin-lock` | 기념일 잠금 | 인터랙션 | — |
| 2 | `fingerprint` | 지문 인증 | 인터랙션 | — |
| 3 | `quiz` | 퀴즈 | 인터랙션 | ⚠️ `questions` |
| 4 | `roulette` | 룰렛 | 인터랙션 | ⚠️ `slices` |
| 5 | `scratch-lottery` | 스크래치 복권 | 인터랙션 | — |
| 6 | `flashlight` | 어둠 속 손전등 | 인터랙션 | ⚠️ `spots` |
| 7 | `gift-box` | 선물상자 열기 | 인터랙션 | — |
| 8 | `photo-puzzle` | 사진 퍼즐 | 인터랙션 | — |
| 9 | `heart-gauge` | 하트 연타 | 감정 | — |
| 10 | `balloon-pop` | 풍선 터뜨리기 | 감정 | ⚠️ `balloons` |
| 11 | `envelope-letter` | 편지 열기 | 읽기 | — |
| 12 | `typewriter` | 타자기 편지 | 읽기 | — |
| 13 | `rolling-paper` | 롤링페이퍼 | 읽기 | ⚠️ `seedNotes` |
| 14 | `cassette-player` | 카세트 플레이어 | 읽기 | ⚠️ `tracks` |
| 15 | `story-book` | 페이지 책 | 이야기 | ⚠️ `pages` |
| 16 | `ending-credits` | 엔딩 크레딧 | 이야기 | ⚠️ `credits` |
| 17 | `dday-counter` | D-day 카운트다운 | 연출 | — |
| 18 | `wish-lantern` | 소원 등불 | 연출 | — |

⚠️ 표시 8종은 3-4(1)의 결정 대상이다.

### 7-2. 백엔드 엔드포인트 22개 `[확인됨]`

**인증** — `AuthController` `/api/auth`
| 메서드 | 경로 | 인증 |
|---|---|---|
| POST | `/login` | 공개 |
| POST | `/force-login` | 공개 |
| POST | `/register` | 공개 |
| GET | `/me` | JWT |
| GET | `/kakao/url` | 공개 |
| POST | `/kakao/callback` | 공개 |
| POST | `/kakao/register` | 공개 |

**사이트** — `SiteController` `/api/sites` (전부 JWT)
| 메서드 | 경로 |
|---|---|
| GET | `/` |
| GET | `/stats` |
| POST | `/` (201) |
| GET | `/{id}` |
| PUT | `/{id}` |
| DELETE | `/{id}` (204, soft delete) |
| POST | `/{id}/slides` |
| DELETE | `/{id}/slides/{slideId}` (204) |
| PUT | `/{id}/slides/reorder` |
| PUT | `/{id}/slides/{slideId}` |
| POST | `/{id}/publish` |

**공개/템플릿/관리자**
| 메서드 | 경로 | 컨트롤러 | 인증 |
|---|---|---|---|
| GET | `/api/play/{slug}` | `PublicationController` | 공개 |
| GET | `/api/templates/browse` | `ComponentController` | 공개 |
| GET | `/api/templates/categories` | `ComponentController` | 공개 |
| GET | `/api/admin/stats` | `AdminController` | MASTER |
| GET | `/api/admin/users/recent` | `AdminController` | MASTER |

응답은 전부 `ApiResponse<T> = { data: T }` 봉투로 감싼다.

### 7-3. 기존 문서 6종의 역할과 신뢰도

| 문서 | 역할 | 신뢰도 |
|---|---|---|
| `플랫폼 기획 정리.md` | **제품 정본.** 역할·데이터모델·로드맵 | ✅ 유효 |
| `DESIGN_SYSTEM.md` | 디자인 시스템 상세 | ✅ 유효 |
| `SLIDE_COMPONENT_변환_가이드.md` | DC→React 변환 규약, 18종 스키마 | ✅ 유효 (§6-2 배열 결정은 재검토 대상) |
| `화면설계 & 흐름.md` | CREATOR/CUSTOMER 화면·흐름 | ⚠️ 상당 부분 베타 범위 밖 |
| `CREATER 상세 페이지 설계.md` | CREATOR 웹 IDE 설계 | ⚠️ 미구현. 2단계 이후 |
| `API_구축_계획.md` | 백엔드 구축 기록 | ⚠️ **"Phase 3 완료" 표기 주의** — 1장 참조 |

용어 주의: `화면설계 & 흐름.md`는 단위를 **"페이지"**라 부르지만 코드는 **"슬라이드"**다. 같은 것이다.

---

## 다음 행동

1. **M0 시크릿 로테이션** — 코드 작업 전에
2. **M1 플레이어** — 제품을 처음으로 살린다
3. 6장 결정 6건에 답하고 **M2 에디터** 착수
