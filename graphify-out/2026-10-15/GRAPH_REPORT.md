# Graph Report - joycraft-web  (2026-10-15)

## Corpus Check
- 147 files · ~341,296 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 319 nodes · 498 edges · 14 communities (13 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `45374cb8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- NeoButton.tsx
- SlideCanvas.tsx
- CinemaIntro.tsx
- ribbonGeometry.ts
- SiteEditorPage.tsx
- api.ts
- TemplatePreviewModal.tsx
- SlideProps.ts
- ColorPicker.tsx
- FieldWidget.tsx
- useSiteLiveThumbnail.ts
- App.tsx

## God Nodes (most connected - your core abstractions)
1. `createRibbonWord()` - 10 edges
2. `useToastStore` - 9 edges
3. `ThumbViewport` - 7 edges
4. `ArrayFieldEditor()` - 7 edges
5. `asText()` - 7 edges
6. `rawShape()` - 7 edges
7. `createTextIntroScene()` - 7 edges
8. `normalizeEnglishText()` - 6 edges
9. `NeoButton()` - 5 edges
10. `safeImageUrl()` - 5 edges

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

## Communities (14 total, 1 thin omitted)

### Community 0 - "NeoButton.tsx"
Cohesion: 0.09
Nodes (20): BG_COLORS, TemplatePickerModalProps, LiveThumbnail(), LiveThumbnailProps, STAGE, ThumbViewport, buttonVariants, NeoButton() (+12 more)

### Community 1 - "SlideCanvas.tsx"
Cohesion: 0.09
Nodes (13): SlideBodyProps, SlideCanvasProps, LoginModal(), LoginModalProps, cardVariants, NeoCard(), NeoCardProps, KakaoCallbackPage() (+5 more)

### Community 2 - "CinemaIntro.tsx"
Cohesion: 0.25
Nodes (10): CinemaIntro(), readItems(), cinemaDefaults, defaultValues, episodes, profiles, schema, CinemaEpisode (+2 more)

### Community 3 - "ribbonGeometry.ts"
Cohesion: 0.08
Nodes (41): arc(), bezier(), bowl(), face(), lowerOval(), normalizeEnglishText(), oval(), Point (+33 more)

### Community 4 - "SiteEditorPage.tsx"
Cohesion: 0.06
Nodes (27): SlideListProps, SortableSlideRowProps, DashedButtonProps, SectionHeaderProps, IconName, StatCardProps, TabBar(), TabBarProps (+19 more)

### Community 5 - "api.ts"
Cohesion: 0.09
Nodes (20): SettingsTab, SiteState, useSiteStore, ApiResponse, FlowPolicy, FlowPolicyInput, KakaoAuthResponse, KakaoAuthUrlResponse (+12 more)

### Community 6 - "TemplatePreviewModal.tsx"
Cohesion: 0.29
Nodes (6): LoadState, STAGE, TemplatePreviewModal(), TemplatePreviewModalProps, useFitScale(), Viewport

### Community 7 - "SlideProps.ts"
Cohesion: 0.10
Nodes (26): CorgiGift(), Phase, ProductImage(), CorgiGiftData, defaultValues, safeHttpUrl(), safeImageUrl(), schema (+18 more)

### Community 12 - "FieldWidget.tsx"
Cohesion: 0.09
Nodes (22): ArrayFieldEditor(), handleEnterTextMode(), handleItemFieldChange(), handleTextChange(), itemsToText(), textToItems(), ArrayFieldEditorProps, extractYouTubeVideoId() (+14 more)

### Community 13 - "useSiteLiveThumbnail.ts"
Cohesion: 0.40
Nodes (5): _cache, fetchFirstSlideCached(), Phase, useSiteLiveThumbnail(), UseSiteLiveThumbnailResult

### Community 16 - "App.tsx"
Cohesion: 0.08
Nodes (24): CreatorTemplateUpdateRequest, fetchMyTemplateDetail(), fetchMyTemplates(), updateMyTemplate(), BrowsePage, DashboardPage, KakaoCallbackPage, LandingPage (+16 more)

## Knowledge Gaps
- **102 isolated node(s):** `BG_COLORS`, `SettingsTab`, `Step`, `STEPS`, `EXAMPLES` (+97 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `BG_COLORS`, `SettingsTab`, `Step` to the rest of the system?**
  _102 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `NeoButton.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08739495798319327 - nodes in this community are weakly interconnected._
- **Should `SlideCanvas.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08547008547008547 - nodes in this community are weakly interconnected._
- **Should `ribbonGeometry.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08163265306122448 - nodes in this community are weakly interconnected._
- **Should `SiteEditorPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06039488966318235 - nodes in this community are weakly interconnected._
- **Should `api.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08620689655172414 - nodes in this community are weakly interconnected._
- **Should `SlideProps.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09982174688057041 - nodes in this community are weakly interconnected._