# JoyCraft — Claude Code 붙여넣기용 프롬프트

> **사용법**
> - **PROMPT 1**(백엔드/DB)과 **PROMPT 2**(프론트 골격)를 **따로** 붙여넣으세요. 한 번에 넣으면 Claude Code가 범위를 잃습니다.
> - 각 프롬프트는 자립적입니다. 이전 대화 맥락 없이도 동작합니다.
> - `---8<--- 여기부터 복사 ---8<---` 부터 `---8<--- 여기까지 ---8<---` 까지가 붙여넣을 내용입니다.

---
---

# PROMPT 1 — 백엔드 / DB 스키마

**대상 리포지토리**: Spring Boot 백엔드 프로젝트 루트에서 실행

---8<--- 여기부터 복사 ---8<---

# 작업 요청: JoyCraft 백엔드 DB 스키마 + JPA 엔티티 구축

## 프로젝트 배경

JoyCraft는 생일·기념일용 **인터랙티브 웹사이트 제작 플랫폼**입니다.
사용자가 인터랙티브 컴포넌트(선물상자 열기, 편지, 퍼즐 등)를 조립해 개인화된 사이트를 만들고, 링크로 공유합니다.

**3개 역할**
- `MASTER` — 플랫폼 운영자(개발자)
- `CREATOR` — 컴포넌트를 코드로 제작해 등록하는 사람
- `CUSTOMER` — 컴포넌트를 조립해 사이트를 만드는 최종 사용자

## 기술 스택 (변경 금지)

- Java 21 (Amazon Corretto 21)
- Spring Boot 3.x
- Gradle **Kotlin DSL** (`build.gradle.kts`)
- PostgreSQL 16 + `jsonb`
- Flyway 마이그레이션
- Spring Data JPA (Hibernate 6)
- 설정은 **YAML** (`application.yml`)
- Group `com.joycraft`, Artifact `api`
- 객체 스토리지: MinIO (S3 호환) — 나중에 AWS S3로 무변경 전환 예정

## 이번 작업 범위

**DB 스키마 + JPA 엔티티 + Repository 까지만.**
Service / Controller / DTO / 인증 로직은 **만들지 마세요.** 다음 단계에서 합니다.

---

## 1. 핵심 데이터 모델 (반드시 이해하고 시작할 것)

5계층 구조입니다.

```
L1 Component Type          컴포넌트의 논리적 정체성 (slug, 이름)
L2 Component Type Version  ★불변★ 스키마 + 코드 번들 + capabilities
L3 Component Template      ★불변★ CREATOR가 만든 프리셋 (기본값 세트)
L4 Site + Site Slides      CUSTOMER가 조립한 사이트
L5 Site Publication        ★불변 스냅샷★ 발행된 공유 링크
```

### 설계 원칙 3가지 — 이걸 어기면 안 됩니다

**① 버전은 "불변 행"으로 표현한다**
`component_type_versions`와 `component_templates`는 **APPROVED/PUBLISHED 이후 UPDATE 금지**입니다.
수정 = 같은 `group_id`로 `version + 1` 인 **새 행 INSERT**.

이렇게 하면 `site_slides.template_id`가 특정 행을 가리키는 것만으로 **버전 고정(pin)이 자동 성립**합니다.
별도 `template_version` 컬럼이 필요 없습니다. CREATOR가 컴포넌트를 수정해도 이미 발행된 사이트는 절대 깨지지 않습니다.

**② 발행 시점에 스냅샷을 굽는다**
`site_publications.snapshot`(jsonb)에 **해석 완료된 사이트 JSON 전체**를 저장합니다.
발행된 사이트 페이지는 이 스냅샷을 HTML에 임베드해 프리렌더로 서빙합니다.
(프론트엔드에 `Content-Security-Policy: connect-src 'none'` 을 걸 예정이라 런타임 API 호출이 불가능합니다.)

**③ 스키마 정의는 코드가 아니라 jsonb다**
`component_type_versions.schema` 에 필드 정의 배열(JSON)이 들어갑니다.
Java 쪽에서는 이걸 **파싱하지 말고 jsonb 그대로 저장/전달**만 하세요. 해석은 프론트엔드가 합니다.

---

## 2. Flyway 마이그레이션 작성

`src/main/resources/db/migration/V1__init.sql` 하나로 작성하세요.

아래 DDL을 **그대로** 사용하되, 주석과 인덱스는 유지해 주세요.

```sql
-- ============================================================
-- V1__init.sql — JoyCraft 초기 스키마
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------
-- 사용자
-- ------------------------------------------------------------
CREATE TABLE users (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email         text        NOT NULL UNIQUE,
    password_hash text,
    display_name  text        NOT NULL,
    role          text        NOT NULL DEFAULT 'CUSTOMER',
    status        text        NOT NULL DEFAULT 'ACTIVE',
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT users_role_chk   CHECK (role   IN ('MASTER','CREATOR','CUSTOMER')),
    CONSTRAINT users_status_chk CHECK (status IN ('ACTIVE','SUSPENDED','DELETED'))
);

-- ------------------------------------------------------------
-- 에셋 (MinIO 오브젝트 메타데이터)
--   실제 파일은 MinIO에, 여기엔 메타데이터만
-- ------------------------------------------------------------
CREATE TABLE assets (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id      uuid        REFERENCES users(id) ON DELETE SET NULL,
    kind          text        NOT NULL,
    bucket        text        NOT NULL,
    object_key    text        NOT NULL,
    mime_type     text        NOT NULL,
    byte_size     bigint      NOT NULL,
    checksum_sha256 text,
    width         int,
    height        int,
    duration_ms   int,
    -- 파일 시그니처(매직넘버) 검증 결과. 확장자만 믿지 않는다
    signature_ok  boolean     NOT NULL DEFAULT false,
    status        text        NOT NULL DEFAULT 'PENDING',
    created_at    timestamptz NOT NULL DEFAULT now(),
    deleted_at    timestamptz,
    CONSTRAINT assets_kind_chk   CHECK (kind   IN ('IMAGE','AUDIO')),
    CONSTRAINT assets_status_chk CHECK (status IN ('PENDING','READY','QUARANTINED','DELETED')),
    CONSTRAINT assets_object_uk  UNIQUE (bucket, object_key)
);
CREATE INDEX idx_assets_owner ON assets (owner_id, created_at DESC);

-- ------------------------------------------------------------
-- L1: 컴포넌트 타입 (논리적 정체성)
-- ------------------------------------------------------------
CREATE TABLE component_types (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        text        NOT NULL UNIQUE,
    name        text        NOT NULL,
    description text,
    category    text        NOT NULL,
    author_id   uuid        REFERENCES users(id) ON DELETE SET NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- L2: 컴포넌트 타입 버전  ★APPROVED 이후 UPDATE 금지★
-- ------------------------------------------------------------
CREATE TABLE component_type_versions (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type_id       uuid        NOT NULL REFERENCES component_types(id) ON DELETE CASCADE,
    version       int         NOT NULL,

    -- 필드 정의 배열 (FieldSchema[]). Java에서 파싱하지 않고 그대로 전달
    schema        jsonb       NOT NULL DEFAULT '[]',

    -- 컴포넌트가 요청하는 런타임 능력
    -- gestureLock | audio | haptics | motion | mic | state | effects | share
    capabilities  text[]      NOT NULL DEFAULT '{}',

    -- 배경 레이어로 사용 가능한가 (계절 배경 등)
    layerable     boolean     NOT NULL DEFAULT false,

    platform_mode text        NOT NULL DEFAULT 'responsive',
    pricing       text        NOT NULL DEFAULT 'free',
    tags          text[]      NOT NULL DEFAULT '{}',
    use_cases     text[]      NOT NULL DEFAULT '{}',

    -- 빌드된 ESM 번들의 MinIO 경로
    bundle_object_key  text,
    bundle_hash        text,
    thumbnail_asset_id uuid   REFERENCES assets(id) ON DELETE SET NULL,

    status        text        NOT NULL DEFAULT 'DRAFT',
    published_at  timestamptz,
    created_at    timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT ctv_version_uk   UNIQUE (type_id, version),
    CONSTRAINT ctv_status_chk   CHECK (status IN ('DRAFT','IN_REVIEW','APPROVED','REJECTED','DEPRECATED')),
    CONSTRAINT ctv_platform_chk CHECK (platform_mode IN ('responsive','mobile-only','web-only','webapp-only')),
    CONSTRAINT ctv_pricing_chk  CHECK (pricing IN ('free','premium'))
);
CREATE INDEX idx_ctv_type    ON component_type_versions (type_id, version DESC);
CREATE INDEX idx_ctv_status  ON component_type_versions (status) WHERE status = 'APPROVED';

-- ------------------------------------------------------------
-- 심사 기록
-- ------------------------------------------------------------
CREATE TABLE component_reviews (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type_version_id uuid        NOT NULL REFERENCES component_type_versions(id) ON DELETE CASCADE,
    reviewer_id     uuid        REFERENCES users(id) ON DELETE SET NULL,
    status          text        NOT NULL DEFAULT 'PENDING',
    -- 자동 검증 결과: [{ rule, level, passed, message }]
    auto_checks     jsonb       NOT NULL DEFAULT '[]',
    notes           text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    decided_at      timestamptz,
    CONSTRAINT cr_status_chk CHECK (status IN ('PENDING','AUTO_FAILED','APPROVED','REJECTED'))
);
CREATE INDEX idx_cr_version ON component_reviews (type_version_id, created_at DESC);

-- ------------------------------------------------------------
-- L3: 컴포넌트 템플릿 (CREATOR 프리셋)  ★PUBLISHED 이후 UPDATE 금지★
--     수정 = 같은 group_id로 version+1 새 행 INSERT
-- ------------------------------------------------------------
CREATE TABLE component_templates (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id           uuid        NOT NULL,
    version            int         NOT NULL,
    type_version_id    uuid        NOT NULL REFERENCES component_type_versions(id),
    creator_id         uuid        REFERENCES users(id) ON DELETE SET NULL,
    name               text        NOT NULL,
    description        text,
    -- 스키마 필드에 대한 CREATOR 기본값 { fieldKey: value }
    default_values     jsonb       NOT NULL DEFAULT '{}',
    thumbnail_asset_id uuid        REFERENCES assets(id) ON DELETE SET NULL,
    status             text        NOT NULL DEFAULT 'DRAFT',
    published_at       timestamptz,
    created_at         timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ct_group_version_uk UNIQUE (group_id, version),
    CONSTRAINT ct_status_chk CHECK (status IN ('DRAFT','PUBLISHED','DEPRECATED'))
);
CREATE INDEX idx_ct_group   ON component_templates (group_id, version DESC);
CREATE INDEX idx_ct_typever ON component_templates (type_version_id);
CREATE INDEX idx_ct_public  ON component_templates (status, published_at DESC) WHERE status = 'PUBLISHED';

-- ------------------------------------------------------------
-- L4: 사이트 (CUSTOMER 작업물)
-- ------------------------------------------------------------
CREATE TABLE sites (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id    uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       text        NOT NULL,

    -- { fontFamily, accentColor, ... }
    theme       jsonb       NOT NULL DEFAULT '{}',

    -- 배경 레이어. 여러 페이지에 걸쳐 깔린다
    -- { templateId, overrides: {}, applyTo: [] }   applyTo 빈 배열 = 전체 페이지
    background  jsonb,

    -- { mode: 'gated'|'free', showProgress: bool, escapeAfter: int(초) }
    -- gated  = complete() 전까지 다음 페이지로 못 감 (참여형 기본값)
    -- escapeAfter = 이 시간이 지나면 무조건 건너뛰기 버튼 노출 (사용자를 가두지 않기 위함)
    flow_policy jsonb       NOT NULL DEFAULT '{"mode":"gated","showProgress":true,"escapeAfter":120}',

    -- D-day 컴포넌트 타임존 판정 기준. 반드시 생성자 타임존으로 고정
    timezone    text        NOT NULL DEFAULT 'Asia/Seoul',

    status      text        NOT NULL DEFAULT 'DRAFT',
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    deleted_at  timestamptz,
    CONSTRAINT sites_status_chk CHECK (status IN ('DRAFT','PUBLISHED','EXPIRED','DELETED'))
);
CREATE INDEX idx_sites_owner ON sites (owner_id, updated_at DESC);

-- ------------------------------------------------------------
-- L4: 사이트 슬라이드 (페이지)
--   template_id는 불변 행을 가리키므로 그 자체로 버전 고정
-- ------------------------------------------------------------
CREATE TABLE site_slides (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id      uuid        NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    position     int         NOT NULL,
    template_id  uuid        NOT NULL REFERENCES component_templates(id),
    -- CUSTOMER가 덮어쓴 값 { fieldKey: value }
    overrides    jsonb       NOT NULL DEFAULT '{}',
    -- 이 페이지만 다른 탈출 시간을 쓸 때 (null이면 사이트 flow_policy 값 사용)
    escape_after int,
    created_at   timestamptz NOT NULL DEFAULT now(),
    -- 순서 변경을 트랜잭션 안에서 처리하기 위해 DEFERRABLE
    CONSTRAINT site_slides_pos_uk UNIQUE (site_id, position) DEFERRABLE INITIALLY DEFERRED
);
CREATE INDEX idx_slides_site ON site_slides (site_id, position);

-- ------------------------------------------------------------
-- L5: 발행 (공유 링크)  ★snapshot 불변★
-- ------------------------------------------------------------
CREATE TABLE site_publications (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id       uuid        NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    slug          text        NOT NULL UNIQUE,

    -- ★ 발행 시점에 구운 해석 완료 사이트 JSON 전체.
    --   뷰어는 이걸 HTML에 임베드해 프리렌더로 서빙한다 (CSP connect-src 'none')
    snapshot      jsonb       NOT NULL,

    password_hash text,
    expires_at    timestamptz,
    view_count    bigint      NOT NULL DEFAULT 0,
    published_at  timestamptz NOT NULL DEFAULT now(),
    revoked_at    timestamptz
);
CREATE INDEX idx_pub_site ON site_publications (site_id, published_at DESC);
CREATE INDEX idx_pub_live ON site_publications (slug) WHERE revoked_at IS NULL;

-- ------------------------------------------------------------
-- (선택 기능, 지금은 테이블만) 받는 사람 응답 수집
--   룰렛 결과 / 소원 등불 텍스트 / 퀴즈 점수 등
-- ------------------------------------------------------------
CREATE TABLE site_responses (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    publication_id uuid        NOT NULL REFERENCES site_publications(id) ON DELETE CASCADE,
    slide_id       uuid        REFERENCES site_slides(id) ON DELETE SET NULL,
    type           text        NOT NULL,
    payload        jsonb       NOT NULL,
    ip_hash        text,
    created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_resp_pub ON site_responses (publication_id, created_at DESC);
```

---

## 3. JPA 엔티티 작성

### 패키지 구조 (feature 단위로 나눌 것)

```
com.joycraft.api
├── common/
│   ├── entity/BaseEntity.java          (id, createdAt, updatedAt)
│   └── converter/                       (필요 시)
├── user/
│   ├── entity/User.java
│   ├── entity/UserRole.java             (enum)
│   └── repository/UserRepository.java
├── asset/
│   ├── entity/Asset.java
│   ├── entity/AssetKind.java
│   ├── entity/AssetStatus.java
│   └── repository/AssetRepository.java
├── component/
│   ├── entity/ComponentType.java
│   ├── entity/ComponentTypeVersion.java
│   ├── entity/ComponentTemplate.java
│   ├── entity/ComponentReview.java
│   ├── entity/(관련 enum들)
│   └── repository/(4개)
└── site/
    ├── entity/Site.java
    ├── entity/SiteSlide.java
    ├── entity/SitePublication.java
    ├── entity/SiteResponse.java
    └── repository/(4개)
```

### 엔티티 작성 규칙

**jsonb 매핑** — Hibernate 6 네이티브 기능을 쓰세요. 추가 의존성 불필요합니다.

```java
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@JdbcTypeCode(SqlTypes.JSON)
@Column(name = "schema", columnDefinition = "jsonb")
private JsonNode schema;   // Jackson JsonNode 사용. DTO로 파싱하지 말 것
```

**text[] 매핑**

```java
@JdbcTypeCode(SqlTypes.ARRAY)
@Column(name = "capabilities", columnDefinition = "text[]")
private String[] capabilities;
```

**enum 매핑** — `@Enumerated(EnumType.STRING)` 사용. ordinal 절대 금지.

**연관관계**
- 전부 `FetchType.LAZY`
- `@ManyToOne` 만 사용. `@OneToMany` 양방향은 **만들지 마세요** (N+1과 삭제 사고의 원인)
- 예외: `Site → SiteSlide` 는 순서 관리가 필요하므로 `@OneToMany(mappedBy="site")` + `@OrderBy("position ASC")` 허용

**불변 엔티티 표시**
`ComponentTypeVersion`, `ComponentTemplate`, `SitePublication` 에는 클래스 최상단에 주석으로 명시하세요.

```java
/**
 * ★ 불변 엔티티 ★
 * status가 APPROVED/PUBLISHED가 된 이후에는 절대 UPDATE하지 않는다.
 * 수정이 필요하면 같은 groupId로 version+1인 새 행을 INSERT할 것.
 * site_slides가 이 행의 id를 직접 참조하므로, 수정하면 이미 발행된 사이트가 깨진다.
 */
```

**BaseEntity**
`createdAt`/`updatedAt`은 `@CreationTimestamp` / `@UpdateTimestamp` 로 처리하되,
DB 기본값과 충돌하지 않게 `@Column(insertable = false, updatable = false)` 여부를 확인하세요.

### Repository

Spring Data JPA 인터페이스만 만들고, 아래 조회 메서드를 포함하세요.

```java
// ComponentTemplateRepository
Optional<ComponentTemplate> findFirstByGroupIdOrderByVersionDesc(UUID groupId);
List<ComponentTemplate> findByStatusOrderByPublishedAtDesc(TemplateStatus status);

// ComponentTypeVersionRepository
Optional<ComponentTypeVersion> findFirstByTypeIdOrderByVersionDesc(UUID typeId);

// SiteSlideRepository
List<SiteSlide> findBySiteIdOrderByPositionAsc(UUID siteId);

// SitePublicationRepository
Optional<SitePublication> findBySlugAndRevokedAtIsNull(String slug);

// SiteRepository
List<Site> findByOwnerIdAndDeletedAtIsNullOrderByUpdatedAtDesc(UUID ownerId);
```

---

## 4. 설정 파일

`application.yml` 에 아래를 반영하세요. (개발용 프로파일)

- PostgreSQL 데이터소스
- `spring.jpa.hibernate.ddl-auto: validate` — **절대 `update`나 `create` 쓰지 마세요.** 스키마는 Flyway가 유일한 소유자입니다.
- `spring.jpa.open-in-view: false`
- Flyway 활성화
- MinIO 접속 정보는 `joycraft.storage.*` 네임스페이스로 분리 (endpoint, accessKey, secretKey, bucket)
  → 나중에 AWS S3로 갈 때 endpoint만 바꾸면 되도록

---

## 5. 검증

작업이 끝나면 아래를 실행해 확인하고 결과를 알려주세요.

```bash
./gradlew build
./gradlew flywayInfo    # 또는 애플리케이션 기동으로 마이그레이션 확인
```

- `ddl-auto: validate` 상태에서 애플리케이션이 정상 기동하면 엔티티-스키마 매핑이 맞는 것입니다.
- 기동 실패 시 로그의 매핑 불일치를 수정하세요.

## 6. 하지 말아야 할 것

- Service / Controller / DTO / Security 설정 만들지 마세요
- `ddl-auto`를 `update`/`create`로 바꾸지 마세요
- `schema`, `default_values`, `overrides`, `snapshot` 같은 jsonb 컬럼을 **Java DTO로 파싱하지 마세요.** `JsonNode`로 그대로 두세요
- Lombok `@Data` 쓰지 마세요. `@Getter` + `@Builder` + `@NoArgsConstructor(access = PROTECTED)` 조합으로
- 양방향 `@OneToMany` 남발하지 마세요 (Site→SiteSlide 하나만 예외)

---8<--- 여기까지 ---8<---

---
---

# PROMPT 2 — 프론트엔드 모노레포 골격

**대상**: 새 디렉토리 (예: `joycraft-web/`) 에서 실행

---8<--- 여기부터 복사 ---8<---

# 작업 요청: JoyCraft 프론트엔드 모노레포 골격 구축

## 프로젝트 배경

JoyCraft는 생일·기념일용 **인터랙티브 웹사이트 제작 플랫폼**입니다.
CREATOR가 만든 인터랙티브 컴포넌트(선물상자 열기, 편지, 퍼즐 등)를 CUSTOMER가 조립해 사이트를 만들고 링크로 공유합니다.

이번 작업은 **개별 컴포넌트가 아니라, 그 컴포넌트들을 실행하는 런타임 골격**을 만드는 것입니다.
컴포넌트 자체는 **하나도 구현하지 마세요.** 동작 확인용 더미 2개만 만듭니다.

## 기술 스택 (변경 금지)

- React 18 + TypeScript 5 + Vite 5
- pnpm workspace 모노레포
- 애니메이션: framer-motion
- 드래그 정렬: @dnd-kit/core, @dnd-kit/sortable
- **상태관리 라이브러리 쓰지 마세요.** React Context + useReducer 로 충분합니다
- **브라우저 스토리지 API 전면 금지** (localStorage / sessionStorage / IndexedDB / cookie)
  → 배포 환경에 CSP가 걸려 동작하지 않습니다. 모든 상태는 메모리에만 둡니다

---

## 1. 왜 이런 구조인가 (읽고 시작할 것)

기존에 "페이지 = 컴포넌트 1개" 구조로 만들었더니 아래가 전부 불가능했습니다.

- 계절 배경(눈 내리기)이 **여러 페이지에 걸쳐** 깔려야 함
- 진행 바 / 다음 버튼이 **모든 페이지 위에** 항상 떠 있어야 함
- 컨페티가 컴포넌트의 `overflow: hidden`에 잘림
- 컴포넌트가 드래그를 쓰면 **페이지 전환 스와이프와 충돌**해서 리본을 당기는 순간 다음 페이지로 넘어감
- 컴포넌트가 마이크/모션 권한을 쓸 때 거부되면 **사이트가 그 페이지에서 멈춤**

그래서 **3개 축의 레이어**로 재설계합니다.

### 축 A — 렌더링 레이어 (z-stack)

```
z:50  SystemLayer      권한 모달 · 기기 불일치 · 치명 에러      플랫폼 소유
z:40  ChromeLayer      진행 바 · 다음 · 건너뛰기 · 음소거       플랫폼 소유
z:30  EffectLayer      컨페티 · 토스트 · 화면 플래시            플랫폼 소유
z:20  PageLayer        ★ 컴포넌트 — 여기만 페이지마다 교체됨
z:10  BackgroundLayer  배경 컴포넌트 — 페이지가 바뀌어도 리마운트 안 함
z:0   Stage            뷰포트 · safe-area · 스와이프 판정        플랫폼 소유
```

핵심: **[다음] 버튼이 ChromeLayer(플랫폼) 소유**라서, 컴포넌트 코드가 무엇을 하든 사용자는 항상 빠져나갈 수 있습니다.

### 축 B — Capability 레이어

컴포넌트가 `meta.json`에 필요한 능력을 **선언**하고, 훅으로 소비합니다.
전역 객체(`window.joycraft`) 방식은 쓰지 않습니다.

```json
{ "capabilities": ["gestureLock", "audio", "haptics"] }
```

```tsx
const { complete, setProgress } = useFlow()
const { lock, unlock } = useGestureLock()
```

선언을 강제하는 이유: ① 심사 자동화 ② 지연 초기화 ③ 페이지 이탈 시 자원 자동 회수.

### 축 C — 데이터 해석

```
컴포넌트 스키마(필드 정의) + 템플릿 기본값 + 사이트 오버라이드
   → resolveData() → 타입별 resolver → 컴포넌트의 data props
```

컴포넌트는 `data.photo`를 그냥 `<img src={data.photo}>` 로 씁니다.
에셋 ID → URL 변환은 resolver가 흡수하므로, **MinIO에서 S3로 옮겨도 컴포넌트 코드는 한 줄도 안 바뀝니다.**

---

## 2. 만들 디렉토리 구조

```
joycraft-web/
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
│
├── packages/
│   ├── types/          공용 타입만 (런타임 코드 없음)
│   ├── schema/         필드 타입 레지스트리 + resolveData + 에디터 UI
│   ├── sdk/            컴포넌트가 import하는 훅 + React Context 정의
│   ├── runtime/        Stage + 5개 레이어 + Provider
│   └── ui/             공용 UI 프리미티브
│
└── apps/
    ├── viewer/         발행 사이트 재생
    ├── editor/         CUSTOMER 사이트 편집기
    └── studio/         CREATOR Web IDE
```

### 의존 방향 (반드시 지킬 것)

```
types  ←  schema  ←  runtime  ←  apps
   ↑         ↑          ↑
   └─────── sdk ────────┘
```

**★ 가장 중요한 규칙: `sdk`는 `runtime`을 import하면 안 됩니다.**

React Context 객체(`FlowContext`, `CapabilityScopeContext`, `ResolveContext`)는 **`sdk`가 소유**합니다.
`runtime`이 `sdk`의 Context에 값을 주입하고, 컴포넌트는 `sdk`의 훅으로 소비합니다.
이렇게 해야 컴포넌트가 `sdk`만 의존하면서도 같은 Context 인스턴스를 바라봅니다.

---

## 3. packages/types

```ts
// FieldSchema
export type FieldType =
  | 'text' | 'textarea' | 'image' | 'color' | 'font'
  | 'number' | 'select' | 'boolean'      // 기존 8종
  | 'array' | 'audio' | 'point' | 'datetime'  // 신규 4종

export interface FieldSchema {
  key: string
  type: FieldType
  label: string
  help?: string
  required?: boolean
  default?: unknown
  showWhen?: Record<string, unknown>   // 형제 필드 값에 따른 조건부 노출

  placeholder?: string
  maxLength?: number
  rows?: number
  min?: number; max?: number; step?: number
  options?: { label: string; value: string }[]
  onLabel?: string; offLabel?: string

  itemSchema?: FieldSchema[]   // array 전용
  itemLabel?: string           // array 접힘 상태 요약. "{name}" 패턴
  addButtonText?: string

  relativeTo?: string          // point 전용: 기준 이미지 필드 key

  accept?: string[]            // image/audio
  maxSize?: string
  maxDuration?: number
  ratioHint?: string
}

export type CapabilityId =
  | 'gestureLock' | 'audio' | 'haptics' | 'motion'
  | 'mic' | 'state' | 'effects' | 'share'

export type CapabilityStatus =
  | 'idle' | 'pending' | 'ready' | 'denied' | 'unsupported'

export interface ComponentMeta {
  name: string
  description: string
  category: string
  tags: string[]
  useCases: string[]
  platformMode: 'responsive' | 'mobile-only' | 'web-only' | 'webapp-only'
  capabilities: CapabilityId[]
  layerable?: boolean
  pricing: 'free' | 'premium'
}

export interface PageProps<D = Record<string, any>> { data: D }

// 사이트 JSON (백엔드 site_publications.snapshot 과 동일 형태)
export interface SiteJson {
  id: string
  title: string
  timezone: string
  theme: { fontFamily?: string; accentColor?: string }
  background?: SlideRef & { applyTo: number[] }
  flow: { mode: 'gated' | 'free'; showProgress: boolean; escapeAfter: number }
  slides: Slide[]
}

export interface SlideRef {
  templateId: string
  overrides: Record<string, unknown>
}

export interface Slide extends SlideRef {
  id: string
  escapeAfter?: number
}
```

---

## 4. packages/schema

### 4-1. 필드 타입 레지스트리

`registry.tsx` — 타입별로 아래 4가지를 한 곳에 등록합니다.

```ts
export interface FieldTypeDef {
  /** array의 itemSchema 안에 들어갈 수 있는가. array 자신은 false (중첩 금지) */
  nestable: boolean
  defaultValue: (f: FieldSchema) => unknown
  resolve: (raw: unknown, f: FieldSchema, ctx: ResolveCtx) => unknown
  validate?: (raw: unknown, f: FieldSchema) => string | null
  Editor: React.ComponentType<FieldEditorProps>
}

export interface ResolveCtx {
  assetUrl: (assetId: string) => string
  siteTz: string
}
```

12개 타입 전부 등록하세요. 주요 resolver 규칙:

| 타입 | resolve 동작 |
| :---- | :---- |
| `text`/`textarea` | 문자열 보정 + `maxLength` 자르기 |
| `number` | `min`/`max` clamp |
| `image`/`audio` | 에셋 ID → `ctx.assetUrl(id)` 로 URL 변환. 빈 값이면 `null` |
| `point` | `{x,y}` 를 0~1로 clamp (정규화 좌표. px 저장 금지) |
| `datetime` | `{utc, tz}` → `{epochMs, tz}`. tz 없으면 `ctx.siteTz` 사용 |
| `array` | `itemSchema`로 **재귀 resolveData** + 각 항목에 `_key` 부여 |
| `select` | options에 없는 값이면 첫 번째 option으로 폴백 |
| `color` | `#RRGGBB` 형식 검증, 아니면 default |

### 4-2. resolveData

```ts
export function resolveData(
  schema: FieldSchema[],
  defaults: Record<string, unknown>,
  overrides: Record<string, unknown>,
  ctx: ResolveCtx,
): Record<string, unknown>
```

우선순위: `overrides` → `defaults` → `field.default` → `typeDef.defaultValue(field)`

`array` resolver가 자기 `itemSchema`로 `resolveData`를 재귀 호출하는 구조입니다. 이게 핵심입니다.

`_key` 부여 이유: 컴포넌트가 `.map()`에서 React key로 index 대신 `item._key`를 쓰게 하기 위함.

### 4-3. 에디터 컴포넌트

`editors/` 아래에 타입별 에디터를 만드세요. 렌더러와 **같은 레지스트리**를 쓰므로,
필드 타입 하나를 등록하면 렌더링과 편집 UI가 동시에 생깁니다.

`SchemaForm.tsx` — 스키마 배열을 받아 폼 전체를 자동 생성. `showWhen` 조건 평가 포함.

**`ArrayFieldEditor` 는 특별히 신경 써서 만드세요.** 최악 케이스는 사진 20장짜리 앨범입니다.

1. 기본은 **접힌 상태**. 20개가 다 펼쳐지면 편집 불가능
2. **한 번에 하나만 펼침** (아코디언)
3. `itemLabel` 패턴(`"{name}"`)을 실제 값으로 치환한 **요약 라벨** 표시 — 접힌 채로 식별 가능해야 함
4. `@dnd-kit`으로 드래그 정렬
5. `min` 미만이면 삭제 버튼 비활성 + 툴팁으로 이유 안내
6. `max` 도달 시 추가 버튼 비활성 + `(3/12)` 카운터 표시

`PointFieldEditor` — `relativeTo`가 가리키는 이미지를 캔버스로 띄우고 클릭해서 좌표를 찍는 방식.
지금은 **UI 골격만** 만들고 좌표 저장 로직까지만 구현하세요.

---

## 5. packages/sdk

### 5-1. Context 정의 (이 패키지가 소유)

```ts
export const FlowContext = createContext<FlowApi | null>(null)
export const ScopeContext = createContext<ScopeValue | null>(null)
export const ResolveContext = createContext<ResolveCtx | null>(null)
```

### 5-2. 훅

```ts
useFlow()          // index, total, progress, canAdvance, escapeOffered,
                   // setProgress, complete, next, prev, goTo, isCompleted
useGestureLock()   // { lock(axis?), unlock }
useAudio(src)      // { status, play, pause, seek, current, duration }
useHaptics()       // (pattern) => void   미지원이면 조용히 무시
useMotion()        // { status, request, shake }
useMic()           // { status, request, level }
useSessionState()  // 세션 내 페이지 간 값 공유 (메모리만. 새로고침 시 소실)
useEffects()       // { confetti, toast, flash }
useShare()         // { share }  미지원이면 클립보드 폴백
useAsset()         // assetUrl
```

### 5-3. 반드시 구현할 동작 4가지

**① `useCapability(id)` 가드**
`meta.capabilities`에 선언되지 않은 능력을 쓰면
- 개발 모드: `throw new Error('meta.json의 capabilities에 "audio"를 추가하세요')`
- 프로덕션: `console.warn` 후 진행

**② 자동 회수**
모든 훅은 `ScopeContext.register(dispose)` 로 정리 함수를 등록합니다.
페이지 언마운트 시 스코프가 전부 호출합니다.
→ CREATOR가 `unlock()`을 깜빡해도 사이트가 잠기지 않습니다.

**③ `useAudio` 자동재생 정책 흡수**
`play()`가 `NotAllowedError`로 실패하면, 문서 최초 `pointerdown`을 기다렸다가 재시도합니다.
모듈 레벨 싱글턴 Promise로 구현하세요. 컴포넌트 쪽에 정책 우회 코드가 없어야 합니다.

**④ `useMotion().request()` 는 반드시 동기 호출 가능해야 함**
iOS 13+ `DeviceMotionEvent.requestPermission()`은 **사용자 제스처 핸들러 동기 실행 중**에만 동작합니다.
`await` 뒤에서 부르면 조용히 거부됩니다.
→ `request`를 `onClick`에서 직접 부를 수 있는 형태로 만들고, 안드로이드(`requestPermission` 미존재)는 바로 `ready` 처리하세요.
흔들기 판정은 `accelerationIncludingGravity` **벡터 변화량**을 쓰세요(절대값 쓰면 중력 9.8 때문에 가만히 있어도 오탐). 200ms 디바운스 필수.

### 5-4. 이중 빌드 (direct / bridge)

```
CREATOR 코드 (import { useFlow } from '@joycraft/sdk')
  ├── 배포 빌드  → impl-direct.ts   같은 문서에서 Context 직접 소비
  └── IDE 미리보기 → impl-bridge.ts  iframe 안에서 postMessage로 부모에 위임
```

이유: React Context는 iframe 경계를 넘지 못합니다. 하지만 배포 환경에서 모든 훅 호출을
postMessage 왕복으로 만들면 드래그 중 매 프레임 `setProgress()` 호출이 지연됩니다.

**이번 작업에서는 `impl-direct.ts`만 완성하고, `impl-bridge.ts`는 인터페이스와 TODO 주석만 두세요.**
빌드 시 alias로 교체 가능하도록 진입점만 분리해 두면 됩니다.

---

## 6. packages/runtime

### 6-1. FlowProvider

`useReducer` 기반. 상태:

```ts
interface FlowState {
  index: number
  total: number
  progress: number                   // 현재 페이지 0~1
  completed: Record<number, boolean> // 앞뒤로 오가도 유지
  escapeOffered: boolean
  locks: Record<string, 'x'|'y'|'both'>  // 토큰별 잠금
}
```

구현 포인트:
- `canAdvance` = `flow.mode === 'free'` 이거나, 현재 페이지가 completed거나, escape가 열렸을 때
- **탈출구 타이머**: 페이지 진입 후 `escapeAfter`초가 지나면 무조건 건너뛰기 버튼 노출.
  어떤 페이지도 사용자를 영구히 가둘 수 없어야 합니다
- 페이지 전환(`GOTO`) 시 `locks`를 `{}`로 초기화 (1차 안전장치)
- 잠금은 **토큰 기반 합산**. 여러 곳에서 잠가도 안전

### 6-2. Stage — 스와이프 판정

```tsx
<div onPointerDownCapture={...} onPointerUpCapture={...} style={{ height: '100dvh' }}>
```

**★ 절대 규칙: `stopPropagation()` 쓰지 마세요.**
Stage가 이벤트를 삼키면 컴포넌트가 드래그를 못 받습니다.
잠긴 축이면 **전환 판정만 건너뛰고 이벤트는 그대로 흘려보냅니다.**

판정 조건: 이동거리 60px 이상 + 600ms 이내. 주축(x/y)을 판별해 잠긴 축이면 스킵.
`canAdvance`가 false인데 앞으로 스와이프하면 → 살짝 밀렸다 복귀 + "아직 할 게 남았어요" 힌트.
완전 무반응이면 사용자가 고장으로 오해합니다.

`100vh` 대신 **`100dvh`** 를 쓰세요. 모바일 주소창 때문에 하단 버튼이 잘립니다.

### 6-3. 5개 레이어

| 파일 | 요구사항 |
| :---- | :---- |
| `BackgroundLayer.tsx` | `pointer-events: none`. **`key`를 페이지 index에 걸지 말 것** — 리마운트되면 눈이 처음부터 다시 떨어져 몰입이 깨짐. `applyTo`에 없는 페이지에서는 opacity만 0으로 |
| `PageLayer.tsx` | `key={slide.id}` 로 페이지마다 **완전 재마운트** (상태 확실히 초기화) |
| `EffectLayer.tsx` | 전체 화면 덮음, `pointer-events: none`. 컨페티가 컴포넌트 `overflow:hidden`에 잘리지 않게 |
| `ChromeLayer.tsx` | 진행 바 + [다음] + [건너뛰기] + 음소거. **플랫폼 소유, CREATOR 접근 불가** |
| `SystemLayer.tsx` | 권한 요청 모달 · mobile-only 페이지를 PC에서 열었을 때 안내 화면 · 치명 에러 |

### 6-4. PageHost

```tsx
<PageErrorBoundary onError={(e) => { report(e); flow.complete() }}>
  <Suspense fallback={<PageSkeleton />}>
    <CapabilityScope declared={type.capabilities}>
      <Comp data={resolvedData} />
    </CapabilityScope>
  </Suspense>
</PageErrorBoundary>
```

**에러 바운더리가 `complete()`를 호출하는 게 중요합니다.**
컴포넌트가 터져도 사이트가 그 페이지에서 멈추면 안 됩니다.

### 6-5. CapabilityScope

`declared: Set<CapabilityId>` + `register(dispose)` 를 Context로 제공.
언마운트 시 등록된 dispose를 전부 호출(각각 try/catch).

---

## 7. apps/viewer

- `SiteRenderer.tsx` — Provider 조립 + Stage + 5레이어
- `fixtures/demo-site.json` — 더미 사이트 JSON (슬라이드 3개)
- 개발 서버에서 `/preview` 로 이 fixture를 렌더

### 동작 확인용 더미 컴포넌트 2개만 만드세요

**`__dev/DummyTap.tsx`** — 탭하면 `complete()` 호출. `capabilities: []`
**`__dev/DummyDrag.tsx`** — 드래그로 게이지를 채우고 100%에서 `complete()`.
`capabilities: ['gestureLock', 'haptics']`. `lock()`/`unlock()` 사용.

이 둘은 **레이어 동작 검증용**입니다. 실제 컴포넌트 카탈로그는 다음 단계에서 만듭니다.

### CSP 설정

`vite.config.ts`의 dev server 헤더와 `index.html` meta에 아래를 걸어두세요.

```
default-src 'none';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
media-src 'self' blob:;
font-src 'self';
connect-src 'none';
frame-src 'none';
base-uri 'none';
form-action 'none';
```

`connect-src 'none'` 이 fetch/XHR/WebSocket/sendBeacon을 브라우저 레벨에서 전면 차단합니다.
그래서 **발행 사이트는 JSON을 HTML에 임베드한 프리렌더 방식**이어야 합니다.
개발 중 HMR이 막히면 dev 프로파일에서만 `connect-src 'self' ws:` 로 완화하되, 주석으로 이유를 남기세요.

## 8. apps/editor, apps/studio

이번엔 **Vite 스캐폴딩과 빈 라우팅만** 만들어두세요.
`editor`는 `SchemaForm`을 import해서 렌더되는 것만 확인하면 됩니다.

---

## 9. 검증

```bash
pnpm install
pnpm -r build          # 모든 패키지 빌드 통과
pnpm --filter viewer dev
```

`/preview` 접속 후 아래를 확인하고 결과를 알려주세요.

1. 슬라이드 3개가 순서대로 보인다
2. 상단 진행 바가 보이고, `setProgress()` 호출 시 실시간으로 찬다
3. `complete()` 호출 **전에는** 스와이프/다음 버튼으로 넘어가지 않는다
4. `complete()` 후 [다음] 버튼이 활성화된다
5. `DummyDrag`에서 드래그하는 동안 **페이지가 넘어가지 않는다** (gestureLock 검증)
6. 드래그를 끝내고 손을 떼면 다시 스와이프로 넘어간다
7. 아무것도 안 하고 `escapeAfter`초 기다리면 [건너뛰기] 버튼이 나타난다
8. 배경 레이어가 페이지를 넘겨도 **리셋되지 않는다** (콘솔에 마운트 로그 1회만 찍히는지 확인)
9. 브라우저 콘솔에 CSP 위반 에러가 없다

## 10. 하지 말아야 할 것

- **실제 컴포넌트 26종을 구현하지 마세요.** 더미 2개만입니다
- localStorage / sessionStorage / IndexedDB / cookie **일절 금지**
- 상태관리 라이브러리(Redux, Zustand, Jotai 등) 추가하지 마세요
- `sdk`가 `runtime`을 import하지 않게 하세요 (의존 방향 위반)
- Stage에서 `stopPropagation()` 쓰지 마세요
- `100vh` 쓰지 마세요. `100dvh` 입니다
- `array` 안에 `array` 중첩 허용하지 마세요 (`nestable: false`)
- 백엔드 API 호출 코드 만들지 마세요. fixture JSON만 씁니다

---8<--- 여기까지 ---8<---

---
---

## 부록 — 두 프롬프트의 접점

| 백엔드 컬럼 | 프론트 타입 | 비고 |
| :---- | :---- | :---- |
| `component_type_versions.schema` (jsonb) | `FieldSchema[]` | 백엔드는 파싱하지 않고 그대로 전달 |
| `component_type_versions.capabilities` (text[]) | `CapabilityId[]` | `CapabilityScope`의 `declared` |
| `component_templates.default_values` (jsonb) | `resolveData`의 `defaults` | |
| `site_slides.overrides` (jsonb) | `resolveData`의 `overrides` | 우선순위 최상 |
| `sites.background` (jsonb) | `SiteJson.background` | `BackgroundLayer` 입력 |
| `sites.flow_policy` (jsonb) | `SiteJson.flow` | `FlowProvider` 입력 |
| `sites.timezone` | `ResolveCtx.siteTz` | `datetime` resolver가 사용 |
| `site_publications.snapshot` (jsonb) | `SiteJson` 전체 | 발행 시점에 구움. 뷰어가 이걸 그대로 읽음 |

**PROMPT 1을 먼저 실행하고, 완료 후 PROMPT 2를 실행하세요.**
두 프롬프트가 `SiteJson` 형태를 공유하므로, 백엔드 `snapshot` 구조가 확정된 뒤 프론트를 만드는 편이 안전합니다.
