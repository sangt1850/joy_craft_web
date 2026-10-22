# Graph Report - joycraft-web  (2026-10-15)

## Corpus Check
- 147 files · ~341,296 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 505 nodes · 676 edges · 22 communities (21 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `171182d7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- NeoButton.tsx
- SlideCanvas.tsx
- JoyCraft 슬라이드 컴포넌트 개발 가이드
- ribbonGeometry.ts
- SiteEditorPage.tsx
- api.ts
- JoyCraft 전체 코드 점검 보고서
- CinemaIntro.tsx
- ColorPicker.tsx
- JoyCraft 종합 기획서
- JoyCraft 전체 디자인 리팩터링 계획
- joycraft-reviewer.md
- FieldWidget.tsx
- useSiteLiveThumbnail.ts
- App.tsx
- 5. 2차 검토 (수정본 대상 재점검)
- JoyCraft 개발 가이드
- EndingCredits.tsx
- JoyCraft 디자인 시스템 v2
- joycraft-builder.md

## God Nodes (most connected - your core abstractions)
1. `JoyCraft 전체 디자인 리팩터링 계획` - 12 edges
2. `JoyCraft 슬라이드 컴포넌트 개발 가이드` - 12 edges
3. `JoyCraft 종합 기획서` - 11 edges
4. `5. 2차 검토 (수정본 대상 재점검)` - 10 edges
5. `createRibbonWord()` - 10 edges
6. `JoyCraft 개발 가이드` - 9 edges
7. `useToastStore` - 9 edges
8. `JoyCraft 디자인 시스템 v2` - 8 edges
9. `JoyCraft 전체 코드 점검 보고서` - 7 edges
10. `🟡 중간` - 7 edges

## Surprising Connections (you probably didn't know these)
- `SiteCardProps` --references--> `ThumbViewport`  [EXTRACTED]
  src/components/ui/SiteCard.tsx → src/components/ui/LiveThumbnail.tsx
- `TemplateCardProps` --references--> `ThumbViewport`  [EXTRACTED]
  src/components/ui/TemplateCard.tsx → src/components/ui/LiveThumbnail.tsx
- `TextIntro()` --calls--> `createTextIntroScene()`  [EXTRACTED]
  src/components/TextIntro/TextIntro.tsx → src/components/TextIntro/textIntroRenderer.ts
- `ToastContainer()` --calls--> `useToastStore`  [EXTRACTED]
  src/components/ui/ToastContainer.tsx → src/store/toastStore.ts
- `DashboardPage()` --calls--> `useToastStore`  [EXTRACTED]
  src/pages/customer/DashboardPage.tsx → src/store/toastStore.ts

## Import Cycles
- None detected.

## Communities (22 total, 1 thin omitted)

### Community 0 - "NeoButton.tsx"
Cohesion: 0.07
Nodes (26): BG_COLORS, TemplatePickerModalProps, LiveThumbnail(), LiveThumbnailProps, STAGE, ThumbViewport, buttonVariants, NeoButton() (+18 more)

### Community 1 - "SlideCanvas.tsx"
Cohesion: 0.09
Nodes (13): SlideBodyProps, SlideCanvasProps, LoginModal(), LoginModalProps, cardVariants, NeoCard(), NeoCardProps, KakaoCallbackPage() (+5 more)

### Community 2 - "JoyCraft 슬라이드 컴포넌트 개발 가이드"
Cohesion: 0.04
Nodes (44): 10. 주의사항, 11. DB 마이그레이션 (Flyway SQL), 1. 현재 구현된 슬라이드 목록, 2-1. 전체 디렉토리, 2-2. 각 슬라이드 폴더 내 파일 역할, 2. 파일 구조, 3-1. SlideProps, 3-2. SchemaFieldDef (+36 more)

### Community 3 - "ribbonGeometry.ts"
Cohesion: 0.08
Nodes (41): arc(), bezier(), bowl(), face(), lowerOval(), normalizeEnglishText(), oval(), Point (+33 more)

### Community 4 - "SiteEditorPage.tsx"
Cohesion: 0.07
Nodes (26): SlideListProps, SortableSlideRowProps, SectionHeaderProps, IconName, StatCardProps, TabBar(), TabBarProps, tabVariants (+18 more)

### Community 5 - "api.ts"
Cohesion: 0.09
Nodes (20): SettingsTab, SiteState, useSiteStore, ApiResponse, FlowPolicy, FlowPolicyInput, KakaoAuthResponse, KakaoAuthUrlResponse (+12 more)

### Community 6 - "JoyCraft 전체 코드 점검 보고서"
Cohesion: 0.06
Nodes (34): 10. 발행 만료/비밀번호 기능 미구현, 12. 번들 크기 / 폰트 배포, #12에서 남긴 것, 13. `getMySites` N+1 쿼리, 14. 미사용 설정 키 / 불필요한 필수 시크릿, 15. `AuthGuard`가 라우트 이동마다 `/auth/me` 재호출, 1. 검증 실행 결과, 1. 카카오 OAuth `state` 파라미터 누락 (CSRF) (+26 more)

### Community 7 - "CinemaIntro.tsx"
Cohesion: 0.10
Nodes (27): CinemaIntro(), readItems(), cinemaDefaults, defaultValues, episodes, profiles, schema, CinemaEpisode (+19 more)

### Community 9 - "JoyCraft 종합 기획서"
Cohesion: 0.07
Nodes (28): 1-1. 대조표, 1-2. 백엔드 — 예상보다 완성도가 높다 `[확인됨]`, 1-3. 프론트 — Editor·Player만 비어 있다 `[확인됨]`, 1장. 현황 진단 — 문서의 주장 vs 실제 코드, 2-1. 끊어진 고리, 2-2. 구조적 장애물 — 스키마 표현 3중화 `[확인됨]`, 2장. 핵심 병목 — 슬라이드가 고아 상태인 이유, 3-1. 유지할 것 (+20 more)

### Community 10 - "JoyCraft 전체 디자인 리팩터링 계획"
Cohesion: 0.07
Nodes (27): 10. 검증 계획, 11. 최종 완료 기준, 1. 목표와 기준, 2. 현재 코드에서 확인한 사항, 3. 적용 범위, 4.1 색상과 토큰, 4.2 폰트와 크기, 4.3 보더·라운드·그림자·간격 (+19 more)

### Community 11 - "joycraft-reviewer.md"
Cohesion: 0.18
Nodes (10): 1단계 — 빌드 검증 (직접 실행), 2단계 — 요구사항 대조, 3단계 — 코드 리뷰, 4단계 — 실제 동작 테스트, 검토 절차, 반드시 먼저 읽을 것, 보고 형식, 수정 권한 (+2 more)

### Community 12 - "FieldWidget.tsx"
Cohesion: 0.08
Nodes (23): ArrayFieldEditor(), handleEnterTextMode(), handleItemFieldChange(), handleTextChange(), itemsToText(), textToItems(), ArrayFieldEditorProps, extractYouTubeVideoId() (+15 more)

### Community 13 - "useSiteLiveThumbnail.ts"
Cohesion: 0.40
Nodes (5): _cache, fetchFirstSlideCached(), Phase, useSiteLiveThumbnail(), UseSiteLiveThumbnailResult

### Community 16 - "App.tsx"
Cohesion: 0.08
Nodes (24): CreatorTemplateUpdateRequest, fetchMyTemplateDetail(), fetchMyTemplates(), updateMyTemplate(), BrowsePage, DashboardPage, KakaoCallbackPage, LandingPage (+16 more)

### Community 17 - "5. 2차 검토 (수정본 대상 재점검)"
Cohesion: 0.18
Nodes (11): 5. 2차 검토 (수정본 대상 재점검), ✅ R1. 6번 수정의 부작용 — 재발행하면 이미 공유한 링크가 죽는다 **(해결)**, ✅ R2. 인증 없는 `GET /api/auth/me` 가 500 (1차에서 놓침 — 수정 완료), ✅ R3. `PublicationService`의 준영속 접근 순서 (수정 완료), ✅ R4. 상태 updater 안에서 타이머를 예약한다 (수정 완료), ✅ R5. `TokenHashUtils` 삭제 (수정 완료), 🟢 R6~R7. 로그인 흐름 불일치 (미수정 — 기능 추가 시 정리 필요), ✅ R8. 검색어 LIKE 와일드카드 이스케이프 (수정 완료) (+3 more)

### Community 18 - "JoyCraft 개발 가이드"
Cohesion: 0.20
Nodes (9): JoyCraft 개발 가이드, 검증, 공통 컴포넌트, 디자인 원칙, 레이아웃과 반응형, 슬라이드 콘텐츠 경계, 코드 규칙, 크기와 밀도 (+1 more)

### Community 19 - "EndingCredits.tsx"
Cohesion: 0.29
Nodes (9): Credit, EndingCredits(), EndingCreditsData, loadYouTube(), Movie(), parseCredits(), Player, resolveVideo() (+1 more)

### Community 20 - "JoyCraft 디자인 시스템 v2"
Cohesion: 0.22
Nodes (8): JoyCraft 디자인 시스템 v2, 기본 컴포넌트, 레이아웃, 방향, 상태와 접근성, 타이포그래피, 토큰, 형태와 간격

### Community 21 - "joycraft-builder.md"
Cohesion: 0.25
Nodes (7): 반드시 먼저 읽을 것, 보고 형식, 완료 조건, 작업 원칙, 중대한 예외 — 슬라이드 컴포넌트, 코딩 규칙 (CLAUDE.md 요약 — 위반 금지), 프로젝트 경로

## Knowledge Gaps
- **244 isolated node(s):** `프로젝트 경로`, `반드시 먼저 읽을 것`, `중대한 예외 — 슬라이드 컴포넌트`, `작업 원칙`, `완료 조건` (+239 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `프로젝트 경로`, `반드시 먼저 읽을 것`, `중대한 예외 — 슬라이드 컴포넌트` to the rest of the system?**
  _244 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `NeoButton.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06866002214839424 - nodes in this community are weakly interconnected._
- **Should `SlideCanvas.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08547008547008547 - nodes in this community are weakly interconnected._
- **Should `JoyCraft 슬라이드 컴포넌트 개발 가이드` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._
- **Should `ribbonGeometry.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08163265306122448 - nodes in this community are weakly interconnected._
- **Should `SiteEditorPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06612685560053981 - nodes in this community are weakly interconnected._
- **Should `api.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08620689655172414 - nodes in this community are weakly interconnected._