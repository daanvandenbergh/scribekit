# Plan: Build the docs frontend (React + demo + styles + README) (2026-07-09)

Backend (`src/docs/`) done. Built the entire UI on top, mirroring the blog React surface,
implementing the imported `SwiftGuard Docs v2` design (fetched via DesignSync).

## Phase 1 - Reorganize `src/react/` into blog/docs/shared [DONE]
- [x] `git mv` blog components -> `src/react/blog/`; i18n+styles+i18n.test -> `src/react/shared/`
- [x] Fix moved files' relative imports; per-subdir barrels; root barrel re-exports blog/docs/shared
- [x] build script sources styles from `src/react/shared/styles.css`
- [x] `npm run build` + `npm test` green (283 tests) - blog surface unchanged

## Phase 2 - Docs components + styles + i18n [DONE]
- [x] Docs i18n labels (24-lang): prev/next, feedback, search, updated + `docsLabels()`/`DocsLabels`
- [x] `DocsSidebar` (client): tabs+groups+items active highlight + Cmd-K palette + mobile collapse
- [x] `internal/search.ts` (fuse) + `internal/icons.tsx`; tests
- [x] `DocsFeedback` (client) Yes/No widget
- [x] `DocsPage` (server): breadcrumb, title/lead, meta, MDX prose (ids), feedback, prev/next, ToC, JSON-LD
- [x] `DocsIndex` (server): hero + section cards from getNavTree + JSON-LD
- [x] `shared/headings.tsx` extracted + reused by BlogPage & DocsPage
- [x] `.scribekit-docs-*` / `.scribekit-doc*` styles reusing --scribekit-* tokens
- [x] docs tests (313 tests green)

## Phase 3 - Demo wiring + package exports [DONE]
- [x] `_docs.ts` + `_docs-nav.tsx` (usePathname -> DocsSidebar); layout/index/[slug] routes
- [x] 6 demo docs pages (2 tabs) with tab/group/order/icon front-matter
- [x] proxy matcher extended for /docs + /en/docs; `app/sitemap.ts` merges blog+docs
- [x] docs served by `./react` barrel (no package.json change); demo `next build` green (29 pages)

## Phase 4 - Browser test (Claude-in-Chrome) on the demo [DONE + design-fidelity rebuild]
- [x] Verified live on :3002: nav active-highlight, ⌘K palette (open/type/results/Enter-navigate),
      tab-click navigation (Guides -> its groups), prev/next. Geometry confirmed vs design (sidebar
      300 / content 760+56 / toc 250 / Inter / 36px title). Scroll-spy: indicator positions correctly
      + proven BlogSidebar observer, but IntersectionObserver can't fire in the automated *hidden*
      tab (visibilityState:"hidden"); works for a visible viewer. Mobile: @media(max-width:1080) in
      place; the MCP window wouldn't change the CSS viewport so it wasn't exercised live.

## Phase 6 - Design-fidelity rebuild (user: "mirror the SwiftGuard design exactly") [DONE]
- [x] Full-width 3-col app: escaped the demo's centered .demo-shell (root layout no longer wraps;
      home + new blog layout keep their own .demo-shell); sidebar 300 (gradient + border-right),
      content 760 centered w/ 56px pad, toc 250 with border-left. `--scribekit-docs-max-width` escape hatch.
- [x] Tabs moved out of the sidebar into a full-width top `DocsTabs` bar: underline tabs + sliding
      gradient indicator; each tab links to its section's first page; active = current page's tab.
- [x] New `DocsToc` (replaces the reused BlogSidebar for docs): sticky bordered column, uppercase
      "On this page", blue sliding scroll-spy indicator, no toggle/card.
- [x] `DocsSidebar` slimmed to groups-of-active-tab + search + palette; `internal/nav.ts` helpers.
- [x] Inter font (design's family) via Google Fonts link in the demo + antialiased on `.scribekit-docs`.
- [x] Demo `_docs-chrome.tsx` (DocsTabs + DocsSidebar + main); docs prose scale (h2 23 / h3 16 / p 16).
- [x] Tests updated (+DocsTabs/DocsToc/nav): build + 323 tests + demo build (29 pages) green.

## Phase 8 - DocsLanguagePicker + navbar actions list + tab indicator (2026-07-10) [DONE]
- [x] `actions?: ReactNode[]` on DocsNavbar (replaced rightComponent) + `DocsNavbarButton`
      (link/primary/secondary variants) matching the design's right section.
- [x] `DocsLanguagePicker` (client): SwiftGuard-inspired flag dropdown, reuses i18nkit `localeFlag`,
      link-based (hreflang, URL-per-locale - fits SSG/SEO), auto-hides for single-locale, click-away
      /Escape/ARIA. `switchLocaleHref` helper (internal/nav) + `docsLanguage`/`docsChangeLanguage`
      catalog (24-lang). Navbar `languagePicker` slot = auto-detected default OR consumer override.
- [x] Demo now bilingual (en+fr; fr.mdx via subagent); picker verified live: en<->fr switch navigates,
      content + built-in copy + dates localize, picker trigger flag updates. 36 demo pages.
- [x] Tab active-indicator bumped 2px -> 3px (rounded) per "a bit bigger than the design".
- [x] build + 346 tests + demo build green. README updated (DocsLanguagePicker, actions, languagePicker).

## Phase 7 - Design top bar / navbar (user: logo/logoSize/docsText params + "Docs" pill + search) [DONE]
- [x] `DocsNavbar` (client, optional): logo (+logoSize) + brandName + "Docs" pill + centered ⌘K
      search + `right` slot; consumer can render their own navbar instead.
- [x] `DocsSearchProvider` + `useDocsSearch` + `DocsSearchButton`: lifted the ⌘K palette out of
      DocsSidebar into a shared provider so the navbar button AND ⌘K open one palette (focus-trap,
      focus-return, combobox aria all preserved). DocsSidebar slimmed to groups + mobile toggle only.
- [x] Navbar CSS (64px sticky, blur, logo scales to logoSize, violet "Docs" pill); demo sticky
      offsets navbar 64 / tabs 111. Demo restructure: per-section nav (`_nav.tsx` DemoNav for
      home+blog; docs uses DocsNavbar with an equalizer logo + Blog/npm right slot).
- [x] Browser-verified live: navbar renders (logo 22px, "Scribekit" + "Docs" pill, centered search,
      Blog/npm right); search opens from navbar button AND ⌘K into one palette; focus returns to the
      trigger on close. build + 328 tests + demo build (29 pages) green. README updated.

## Phase 5 - README + final adversarial review [DONE]
- [x] README "Docs" usage section (wire-in, DocMeta contract, nav/tabs/groups, theming, Docs API)
- [x] Adversarial review workflow (20 agents): 10 findings confirmed, all fixed:
      1-2. palette focus-return + focus-trap; 3. icons own-property guard (no proto-pollution crash);
      4. palette query reset-on-close; 5. combobox ARIA; 6. full tab pattern (roving + tabpanel);
      7. breadcrumb aria-current; 8. shared <JsonLd> (4 call sites); 9. DocsIndex hero i18n;
      10. DocsSidebar nav label i18n. Refuted (correctly): violet-token divergence, tabIdForPath
      reuse, feedback aria, textOf export. build + 314 tests + demo build all green after fixes.
- [x] Fixed default-locale active-highlight prerender/hydration (normalize /en prefix in demo wrapper)

---

# Plan: `/scribekit-docs` skill + `/scribekit-hero` docs surface (2026-07-09)

Added a docs *writer* skill mirroring the refactored `/scribekit` (write/rewrite/--scan), and a docs
*surface* to `/scribekit-hero` - not one monolith. Designed via a ~5-agent research + devil's-advocate
workflow (Diátaxis/Mintlify best-practices, gap-analysis flow, code-accuracy audit of the `Docs`
backend, skill-mirror audit), then re-reviewed the authored files with a second adversarial workflow.

## Phase 1 - `skills/scribekit-docs/` (the docs writer) [DONE]
- [x] `SKILL.md` router: docs-edition Step 0 (find `Docs` wiring / `_docs.ts`; reconstruct the corpus
      map from front-matter since `getNavTree`/`getAllDocs`/`getDoc` are `server-only`+unwired; map the
      real product code), write/rewrite modes, `--scan`, shared-file locate-fallback (STOP if `scribekit`
      absent), non-negotiables (trace every API fact to source; no `author`/`categories`; no hand-JSON-LD)
- [x] `docs-style.md` (docs analog of house-style): Diátaxis compass + one-type-per-page rule + per-type
      shapes; house-style deltas (drop pull-quote/CTA/burstiness for reference/how-to); sentence-case
      question headings; code-sample discipline; the `DocMeta` contract + **load-bearing YAML types**;
      light metadata check (replaces the 100-pt rubric)
- [x] `write.md`: gap-analysis auto-topic (enumerate real capabilities vs corpus), research=read-the-code,
      pick type, draft, DocMeta front-matter, hero via `/scribekit-hero docs-hero`, resolved default-locale
      filename (not hardcoded `en.mdx`), every-locale, verify
- [x] `rewrite.md`: audit-vs-code (✅/⚠️/❌ with source `file:line`) + structure/type audit + light
      metadata + hero verify + apply (or `--scan` report-only)

## Phase 2 - `skills/scribekit-hero/` docs surface [DONE]
- [x] `docs.md` mirroring `blog.md`: settings `<docs-content-dir>/hero.settings.js`, params
      `<slug>/hero.js` `(locale)=>params`, rotation by distinct-slug count, JPEG
      `<assets>/docs/<slug>/hero.<code>.jpg` -> `DocMeta.image` (leading-slash root path), **no byline**
- [x] `SKILL.md` wired: description, argument-hint (`docs-hero`/`regenerate-docs-heroes`), Step 0
      blog/docs, mode list + edge case, settings location, 6-gradients line, `tune-gradients docs`,
      render-pipeline `?lang` line, guardrails output-shape + touch-only line
- [x] README: three skills, `/scribekit-docs` symlink + bullet, docs heroes in the hero bullet

## Review
- Second adversarial workflow (code-accuracy + must-fix coverage + mirror/cross-ref + final devil):
  strong pass. Fixed 3 blocking defects it found - a false "invisible page" claim in the light check
  (wrong-typed `order`/`hidden` actually *leak* pages), `getDoc` missing from the never-execute list,
  and off-by-one step numbers in rewrite's two-behaviours block - plus nits (quoted-fields wording,
  tab/group ordering rule). Final sweep: no em-dashes, no scribekit-internal `src/` paths (portable to
  consumer projects), all cross-refs resolve. No source/TS changed - skills are markdown + README prose.
- Follow-on captured in `TODO.md`: the pending `scribekit` -> `scribekit-blog` rename must also update
  `scribekit-docs`'s `../scribekit/` references + README symlink.

## Audit + improvements (2026-07-10) [DONE]
Thorough audit dogfooded against the now-wired demo docs corpus (6 pages + `_docs.ts`): a 5-lens
workflow (dogfood, code-accuracy, over-engineering, completeness, skill-quality) + synthesis, a re-run
of 3 lenses that stubbed, and a final source red-team (7/7 new claims correct, 10/10 must-fixes intact,
no contradictions). Applied, all source-traced:
- **contentDir resolution** (HIGH): resolved against the app's `process.cwd()`, not repo root / `_docs.ts`
  dir; added an existence check - prevents writing a page to a dead location.
- **Internal-link form**: exact `localePath` shape (`<basePath>/<slug>`, `/<lang><basePath>/<slug>`) +
  `prefixDefaultLocale` in Step 0 + re-localize links in translations.
- **Heroless corpus**: `write` matches the corpus (skip hero if no sibling has one); `rewrite` Step 9 no
  longer flags a deliberately-absent hero as a defect.
- **New tab/group registration**: must edit `_docs.ts` `tabs`/`groups` (else sorts last under raw id);
  scope guardrail amended to allow it.
- **Accuracy**: unquoted ISO dates coerced not dropped; docs `image` is OG-only (not on-page); `?? "en"`
  added to the default-locale formula; multi-language trigger = non-empty `locales` array.
- **Clarity/laziness**: Step 0 scoped by mode (rewrite skips the full API+corpus enumeration) + DRY'd the
  duplicate sort spec; gap-rank weighs slot-fit + asks before documenting a sibling product; description
  gained a `document` verb + negative anchor vs `/scribekit`; added "auto prev/next, no manual `## Next
  steps`" and "use only registered MDX components" rules.
Skipped as churn: soften "never a full URL", drop guardrail tails, cosmetic link anchor. Skills-only
(markdown); no source/tests touched.
