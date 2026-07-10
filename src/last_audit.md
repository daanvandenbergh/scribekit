# Scribekit `src/` (shippable library) - Last Audit

**Last audit date:** 2026-07-08 (Pass 1)

Scope argument: `everything` -> resolved to the shippable package source, `src/` (the
`Blog` backend module + the `react/` components). Static MDX blog library: no auth, no
tenants, no DB, no money, no paid third-party APIs, so S1/S2/S6/S7(cost)/S8 are cheap
skips (noted below), and the live surface is path handling, input validation of
front-matter, injection (traversal / ReDoS / XSS), and the deep-logic + frontend passes.

## Issues Found and Patched (Pass 1)

### H1. Path traversal in `Blog.getPost` - arbitrary out-of-tree file read (High)
- `getPost(slug, lang)` built a file path straight from `slug`/`lang`
  (`${slug}/${lang}${ext}`) and passed it to `path.join(contentDir, ...)` with **no
  containment check**. A crafted `slug` or `lang` containing `..` escaped the content
  directory: `getPost("../content-i18n/ops")` resolved to a file *outside* `contentDir`,
  and if a matching `<lang>.mdx`/`post.mdx` existed there it was read and served as a post.
- Reachable in the library's documented primary usage: Next.js's `[slug]` route passes
  the URL segment as `slug`, and with `dynamicParams` at its **default `true`** an
  arbitrary `/blog/<x>` renders on demand. `lang` is likewise attacker-controllable in an
  `[lang]/[slug]` route. Any consumer calling `getPost` from a search/API handler with user
  input is exposed regardless of route config. Impact: information disclosure (arbitrary
  file read, constrained to files named `<lang>.mdx` / `post.mdx`).
- **Fix:** added a single containment guard `Blog.resolveWithin(file)`
  (`src/blog/blog.ts`) that `path.resolve`s the candidate and rejects anything not inside
  `contentDir`. Routed both the `getPost` candidate-existence loop (`blog.ts:246`) and the
  actual read in `readPostFile` (`blog.ts:181`) through it - the one choke point every read
  passes - so a traversal path now yields a clean `PostNotFoundError`. `getAllPosts` is
  unaffected (its paths come from `readdirSync`, already in-tree). Regression test added
  (`src/blog/tests/blog.test.ts`): asserts a traversal via slug **and** via lang both 404,
  against a fixture target that provably exists on disk (so the test bites without the fix).

### L1. JSON-LD `</script>` breakout not escaped (Low - defense-in-depth)
- `BlogPage` and `BlogOverview` inject schema.org JSON-LD via
  `dangerouslySetInnerHTML={{ __html: JSON.stringify(...) }}`. `JSON.stringify` does not
  escape `<`, so a metadata string containing `</script>` would close the `<script>` tag
  early and inject markup.
- **Not a privilege boundary crossing:** every field feeding the JSON-LD (`title`,
  `description`, `author`, ...) comes from the repo's own MDX front-matter, and an MDX
  author already has full JSX/component execution in the rendered post. No untrusted input
  reaches the sink, so this is hardening, not an exploitable XSS. Fixed anyway because it is
  one line, standard practice (Next.js's own docs escape it), and correct.
- **Fix:** appended `.replace(/</g, "\\u003c")` to the serialized payload at both sites
  (`src/react/BlogPage.tsx:200`, `src/react/BlogOverview.tsx:95`).

## Assessed but not Patched (Pass 1)
- **Equal-`date` sort order is unspecified** (Info): `getAllPosts`
  (`(a,b) => a.date < b.date ? 1 : -1`) and `similarPosts`'s date tie-break never return
  `0`, so two posts with identical `date` have a technically-inconsistent comparator and an
  unspecified (but deterministic) relative order. The "newest first" contract holds for
  distinct dates; equal-date ordering is not part of the contract. No data/UX impact worth a
  behavioural change.
- **`tableOfContents` heading regex backtracking** (Info): `^(#{2,3})\s+(.+?)\s*#*\s*$`
  has ambiguous `\s*#*\s*` trailing groups (O(n^2) worst case on a pathological all-space
  heading line). Input is author-controlled MDX parsed at build time, not an
  attacker-supplied request payload - not a reachable ReDoS. Left as-is.
- **`similarPosts` re-reads all posts per call** (Info): `Blog.similarPosts` calls
  `getAllPosts`, which re-parses every post file. Runs at build/SSG time and is cached by
  Next; a raw TF cosine over a blog's post count is trivial. Accepted (matches the existing
  `ponytail:` note in `similar.ts`).

## Recurring Findings
First pass - no prior audit to compare against. H1 (path traversal on a file-per-slug
reader with no base-dir confinement) is a canonical archetype; recorded here so future
passes and sibling file-reading modules scan for the same "user-derived path segment ->
`path.join` -> read, no containment" shape first.

## Security Assessment
- **Path traversal (S4):** was present in `getPost` (H1); now confined to `contentDir` at
  a single choke point, with a regression test. `getAllPosts`/`entries` only ever read
  `readdirSync`-sourced in-tree paths.
- **Input validation (S3):** front-matter from `gray-matter` is defensively normalised in
  `readPostFile` - every field is type-checked (`typeof === "string"`, `Array.isArray` +
  per-element `is string` filters) with slug/empty-string fallbacks, so malformed YAML
  cannot inject non-string values into `PostMeta`. Sound.
- **Injection - XSS (S4):** MDX body is compiled by `next-mdx-remote` (consumer's trusted
  content); JSON-LD now escapes `<` (L1). No other `dangerouslySetInnerHTML` / `eval` /
  dynamic sink. Anchor ids go through `slugify` (Unicode-letter/number allowlist).
- **ReDoS (S3):** all regexes reviewed; `slugify`/`tokenize`/`localePath` are linear; the
  one ambiguous regex (`tableOfContents`) is build-time, author-controlled only.
- **Secrets / error leakage (S5):** no secrets in the module; error messages (`slug`,
  file paths relative to content dir) carry no host/absolute-path or credential detail.
- **N/A (cheap skips, no surface):** S1 authn/authz, S2 tenant isolation, S6 idempotency,
  S7 cost/quota, S8 money - this is a read-only static-content library with no request
  auth, no tenants, no writes, no metered calls, and no monetary values.

## Known Deviations
None. The module follows the project standards (4-space indent, `-` not `-`, namespace/
module layout, docstrings on every export, tests under `tests/`, no `@ts-*` directives).

## Audit Scope
Files audited line-by-line (~1,860 total source lines; tests excluded per the project's
`tests/` layout):
- `src/index.ts` - package root re-export (8 lines)
- `src/blog/blog.ts` - `Blog` class: fs walk, read/normalise, SEO facade (now ~460 lines)
- `src/blog/content.ts` - slugify / reading time / table-of-contents (79 lines)
- `src/blog/categories.ts` - distinct-category aggregation (18 lines)
- `src/blog/format.ts` - UTC-safe ISO date formatting (27 lines)
- `src/blog/locales.ts` - base-path / locale URL builder (51 lines)
- `src/blog/seo.ts` - page metadata / JSON-LD / sitemap builders (375 lines)
- `src/blog/similar.ts` - TF cosine "similar posts" ranking (133 lines)
- `src/blog/errors.ts` - `PostNotFoundError` / `DuplicatePostError` (54 lines)
- `src/blog/types.ts` - shared domain + structural Next types (211 lines)
- `src/blog/index.ts` - blog module public surface (23 lines)
- `src/react/BlogPage.tsx` - post article server component (250 lines)
- `src/react/BlogOverview.tsx` - overview server component (101 lines)
- `src/react/BlogOverviewGrid.tsx` - client grid: search/filter/infinite-scroll (221 lines)
- `src/react/BlogSidebar.tsx` - client sidebar: scroll-spy minimap (118 lines)
- `src/react/i18n.ts` - typed 24-language UI-copy catalog (462 lines)
- `src/react/internal/overview.ts` - fuse.js search + category filter (48 lines)
- `src/react/index.ts` - react module public surface (26 lines)

Not line-audited (out of the shippable-library scope, noted for honesty): `demo/`
(example Next.js app - consumer reference code, not library logic) and `skills/scribekit-blog/`
(markdown agent instructions, no executable library surface). The demo's route files are the
place to confirm a consumer follows the `getPost` try/catch -> `notFound()` guidance.

**Verdict:** ship. Both findings are fixed (H1 patched + regression-tested, L1 hardened);
build is clean (`tsc`) and all 183 tests pass. No unfixed Critical or High remains.

---

**Last audit date:** 2026-07-08 (Pass 2)

Fresh, unbiased re-audit of the same scope (`src/` shippable library: `blog/` backend +
`react/` components; `demo/`, `skills/`, and tests excluded from the line-audit). Every file
re-read line by line; Phase 2.5 (deep logic / call-chain) run in full. Pass 1's two fixes were
independently re-verified (see below), not assumed. Baseline was green (build clean, 183 tests).

## Issues Found and Patched (Pass 2)

### L1. Unquoted YAML front-matter date silently dropped to empty (Low)
- `Blog.readPostFile` normalised the date fields with `typeof data.date === "string" ? data.date : ""`
  (and the same shape for `updated`). Front-matter is parsed as YAML, whose **native date type**
  turns an *unquoted* `date: 2026-06-28` into a JS `Date` object - only a quoted `"2026-06-28"`
  stays a string. So a `Date` failed the `typeof === "string"` guard and the field collapsed to
  `""`/`undefined`. Writing an unquoted date (the more natural YAML form) therefore **silently
  erased the post's publish date** from every downstream consumer: the rendered date, the sort
  order (`getAllPosts` pushes empty-date posts last), the JSON-LD `datePublished`/`dateModified`,
  the OpenGraph `publishedTime`/`modifiedTime`, and the Twitter/article metadata. No crash, no
  wrong value - a natural authoring mistake at the front-matter input boundary that silently
  degrades SEO. Confirmed with gray-matter: `date: 2026-06-28` -> `object`/`Date`; `"2026-06-28"`
  -> `string`.
- **Fix:** added `isoDateString(value: unknown): string | undefined` to `src/blog/format.ts`
  (the date domain) - a string passes through unchanged, a valid `Date` is coerced to its UTC
  `YYYY-MM-DD` (`toISOString().slice(0,10)`), an invalid `Date` or any other value yields
  `undefined`. Routed both fields through it in `readPostFile` (`src/blog/blog.ts:198,210`):
  `date: isoDateString(data.date) ?? ""`, `updated: isoDateString(data.updated)`. The
  quoted-string path is byte-for-byte unchanged (no regression). Exported from
  `src/blog/index.ts` alongside `formatDate`. Tests added: unit tests for `isoDateString`
  (string pass-through, `Date` coercion incl. a date-time literal, invalid `Date`/non-date ->
  `undefined`) in `src/blog/tests/format.test.ts`, plus an end-to-end `getPost` test against a
  new `fixtures/content-unquoted-date/plain-date/post.mdx` fixture that carries unquoted
  `date`/`updated` and asserts both normalise to `YYYY-MM-DD` (the test fails without the fix).

## Assessed but not Patched (Pass 2)

- **Symlink inside the content dir escapes containment** (Info - accepted): an adversarial probe
  of `Blog.resolveWithin` (scratchpad, exact-guard replica) confirmed every *string-based*
  traversal vector is blocked - prefix-collision sibling (`../content-evil/...`, both via slug
  and via lang), parent traversal, absolute-path slug, `.`/empty segments, POSIX backslash - but
  a **symlink** placed *inside* `contentDir` pointing outside is followed, because `path.resolve`
  does not resolve symlinks (no `fs.realpathSync`). Not attacker-reachable in the documented flow:
  a route param (`slug`/`lang`) is a string the guard already confines and cannot plant a symlink;
  introducing a symlink requires write access to the content directory, the same trust level as
  writing the MDX posts (which already have full JSX/component execution). Not fixed: adding
  `realpathSync` is disproportionate to a non-reachable risk and would **break legitimate
  symlinked content setups** (a `contentDir` or post symlinked in a monorepo, explicitly allowed
  by the `types.ts` contract) while requiring the file to exist to resolve, complicating the
  not-found path. Consistent with Pass 1's trusted-content model.
- **Heading-with-markdown-link ToC id mismatch** (Info): the ToC anchor id is produced twice -
  `content.tableOfContents` slugifies the *raw* heading text, `BlogPage.withHeadingId` slugifies
  the *rendered* node text (`textOf`). For plain text and for `**bold**`/`*italic*`/`` `code` ``
  they agree (slugify strips `*`/`` ` `` so raw and rendered converge), but a markdown **link** in
  a heading (`## [text](url)`) diverges: raw slugifies to `texturl`, rendered to `text`, so that
  one anchor would not resolve. Build-time, author-controlled content; a link inside an `##`/`###`
  heading is rare. Not fixed: matching them would require parsing markdown inline syntax in the
  regex-based extractor - disproportionate to the impact.
- **Prior Pass 1 Info items still stand** (Info): equal-`date` comparator returns `-1` not `0`
  in `getAllPosts`/`similarPosts` (deterministic in practice, "newest first" holds for distinct
  dates - not re-flagged, recorded accepted in Pass 1); `tableOfContents` trailing-`\s*#*\s*`
  regex is polynomial-backtracking only on pathological build-time input (not a request-path
  ReDoS); `similarPosts` re-reads all posts per call (build/SSG-time, cached, trivial corpus).

## Verification of Pass 1's fixes
- **H1 (path traversal in `getPost`) HOLDS.** Re-read `resolveWithin` (`blog.ts:168`) and both
  call sites (the `getPost` candidate loop at `blog.ts:254` and `readPostFile` at `blog.ts:186`).
  The `abs !== contentDir && !abs.startsWith(contentDir + path.sep)` check - crucially the
  `+ path.sep` - defeats the prefix-collision case (`contentDir` vs a sibling `contentDir-evil`)
  as well as `..`, absolute, and empty/`.` slugs. The existing regression test bites against a
  provably-on-disk target (`../content-i18n/ops/en.mdx`). An independent adversarial probe (9
  vectors) reproduced: 8/8 string vectors blocked, only the trusted-content symlink case escapes
  (Info above).
- **L1 (JSON-LD `</script>` breakout) HOLDS.** `.replace(/</g, "\\u003c")` is present at both and
  only sinks (`BlogPage.tsx:200`, `BlogOverview.tsx:95`); no other `dangerouslySetInnerHTML` /
  `eval` / dynamic HTML sink exists. Escaping `<` prevents the `</script>` break-out; the payload
  is `application/ld+json` (parsed as JSON, not executed), so U+2028/U+2029 are non-issues.

## Recurring Findings
Pass 2 confirms Pass 1's path-traversal archetype (user-derived segment -> `path.join` -> read)
is closed for string inputs. New archetype worth carrying forward: **format-typed input
boundaries** - a value the code assumes is a string can arrive as a *parser-native typed value*
(YAML dates, YAML numbers, TOML datetimes). A bare `typeof === "string"` guard silently discards
it instead of coercing. Scan every front-matter/config field whose source parser has a native
type for that shape.

## Security Assessment (Pass 2)
- **Path traversal (S4):** confined at a single choke point for all string-derived paths;
  re-verified by probe. Symlink-in-content is trusted-content-only (Info).
- **Input validation (S3):** front-matter normalisation is sound and now also coerces YAML-typed
  dates (L1); string/array fields remain type-checked with safe fallbacks.
- **Injection - XSS (S4):** JSON-LD escapes `<` at both sinks; MDX body is the consumer's trusted
  content; anchor ids go through the Unicode-allowlist `slugify`. No new sink.
- **ReDoS (S3):** all regexes re-reviewed; only `tableOfContents` is ambiguous and is build-time,
  author-controlled - not request-reachable.
- **Secrets / error leakage (S5):** error messages carry only the slug and content-relative file
  paths; no secrets, no absolute paths, no host detail.
- **N/A (cheap skips, no surface):** S1 authn/authz, S2 tenant isolation, S6 idempotency, S7
  cost/quota, S8 money - unchanged from Pass 1 (read-only static-content library).

## Known Deviations (Pass 2)
None. The Pass 2 change follows the project standards (4-space indent, `-` not em-dash,
docstrings on every export, helper placed in its domain module `format.ts`, tests under `tests/`,
no `@ts-*` directives).

## Audit Scope (Pass 2)
Same 17 source files as Pass 1 (~2,651 source lines incl. the new-since-Pass-1 growth to v2.0.0:
i18n catalog, author bio, folder-per-slug i18n layout), re-read line by line; tests excluded from
the line-audit but reviewed and extended.

**Verdict:** ship. One new Low found and fixed (unquoted-date coercion, +4 tests); Pass 1's H1
and L1 both independently re-verified as holding; the only residual items are Informational
(trusted-content symlink, heading-link ToC edge case) with documented rationale. Build clean
(`tsc`), all **187 tests pass**. No unfixed Critical, High, or Medium. This pass is **not fully
clean** by the convergence rule (one new Low was found and patched), so one more clean pass is
needed to converge.

---

**Last audit date:** 2026-07-08 (Pass 3)

Fresh, unbiased re-audit of the same scope (`src/` shippable library: `blog/` backend +
`react/` components; `demo/`, `skills/`, and tests excluded from the line-audit). Every file
re-read line by line; Phase 2.5 (deep logic / call-chain) run in full. Passes 1-2's three fixes
were independently re-verified (see below), not assumed. Baseline was green (clean `tsc` build,
187 tests passing).

## Issues Found and Patched (Pass 3)

### L1. Raw NUL byte in shipped source classifies `blog.ts`/`dist` as binary (Low)
- `Blog.entries` deduped `(slug, lang)` pairs with `` const key = `${slug}\x00${lang}` `` - a
  literal **NUL byte** (`U+0000`) as the separator (chosen because a NUL can never appear in a
  filename, making it collision-proof). It is functionally correct today, but a raw control byte
  embedded in a `.ts` template literal makes `file` classify both the source **and the compiled,
  published `dist/blog/blog.js`** as binary ("data"), so plain `grep` skips it (it silently
  returned nothing until run with `-a`), and linters, diff tools, and downstream
  bundlers/minifiers/CDNs (every consumer bundles `dist` through Next/Turbopack) may mishandle
  it. It is also **fragile**: any editor or formatter that strips control characters would turn
  the key into `` `${slug}${lang}` `` with **no** separator, silently reintroducing real
  collisions (slug `"ab"`+lang `""` vs slug `"a"`+lang `"b"`). Verified the NUL was pre-existing
  (present in `git HEAD` and in `dist/blog/blog.js`), only in this one file.
- **Fix:** replaced the NUL separator with a plain `/` (`src/blog/blog.ts:146`). `/` is equally
  collision-proof here - `slug` is a single directory name (`dirent.name`, no internal `/`) and
  `lang` is a developer-controlled locale code / the `"post"`-mapped default, neither of which
  can contain `/` (a `/` would break the on-disk path resolution anyway), so the
  `(slug, lang) -> key` map stays injective. Source and rebuilt `dist` now classify as ASCII
  text; the NUL is gone. Verified by the existing collision test (`content-collision`, which
  exercises the dedup key and still throws `DuplicatePostError`) and the i18n `getPostRefs` test
  (4 distinct pairs coexisting proves injectivity).

### L2. Unquoted numeric front-matter title/description/tags silently lost (Low)
- `Blog.readPostFile` normalised `title`/`description` with `typeof data.X === "string" ? ... :
  fallback` and filtered `keywords`/`categories` array members with `typeof k === "string"`.
  Front-matter is parsed as YAML, whose native scalar type turns an unquoted `title: 404`,
  `title: 2026`, `title: 3.14`, `description: 404`, or a `categories: [2024, Guides]` member
  into a JS **`number`** (empirically confirmed with gray-matter). Those numbers failed the
  string guard, so a numeric title **silently collapsed to the slug**, a numeric description to
  `""`, and numeric keyword/category members were **silently dropped** - a natural authoring
  value (a post titled "2026" or "404", a year-based tag) vanished with no crash and no warning,
  degrading the `<title>`, OG/Twitter, JSON-LD `headline`, and the overview's filter/search
  facets. This is the exact "parser-native-typed scalar dropped at a `typeof === 'string'`
  guard" archetype Pass 2 recorded for future scanning (Pass 2 fixed it for YAML dates; this is
  the same shape for numbers).
- **Fix:** added a module-private `coerceText(value): string | undefined`
  (`src/blog/blog.ts:39`) - string passes through unchanged, a **finite** number is stringified
  (`404` -> `"404"`; `NaN`/`Infinity`/`.inf` fall through), any other type (boolean, `null`,
  object) yields `undefined` so the caller's fallback applies. Routed `title`
  (`coerceText(data.title) ?? slug`), `description` (`?? ""`), and the `keywords`/`categories`
  array members (`.map(coerceText).filter(k => k !== undefined)`) through it
  (`src/blog/blog.ts:220-227`). `author`/`image`/`author-image` deliberately stay string-only
  (documented in the helper's docstring): a bare number there is not meaningful text and their
  own fallbacks - default author / no image - handle it correctly; coercing would produce a
  bogus author name or a broken `<img src>`. The quoted-string and array-of-strings paths are
  byte-for-byte unchanged (no regression; the existing "drops non-string entries" and
  slug/empty-fallback tests still pass). Test added
  (`src/blog/tests/blog.test.ts`, +1): a new fixture
  `fixtures/content-typed-scalars/numeric/post.mdx` carries unquoted numeric
  `title`/`description`/`keywords`/`categories` and asserts they normalise to `"2026"`, `"404"`,
  `["2026","seo"]`, `["2024","Guides"]` (the test fails without the fix).

## Assessed but not Patched (Pass 3)
- **Duplicate locale codes in config throw a self-referential `DuplicatePostError`** (Info):
  configuring `locales: [{code:"fr"}, {code:"fr"}]` makes `entries` check `fr.mdx` twice and
  throw `DuplicatePostError` naming the **same** file twice. It is a config mistake that fails
  loudly at build time (not silent), the message is only mildly misleading, and de-duplicating
  the configured codes is disproportionate to a self-inflicted misconfiguration. Left as-is.
- **`basePath: ""` yields an empty overview path** (Info): `normalizeBasePath("")` returns `""`
  (empty string is not nullish, so the `/blog` default does not apply), making a locale's
  overview `localePath` render as `""` and its canonical resolve to the site root. `basePath:
  ""` is undocumented (the default is `/blog` and consumers set a real path); the post URLs are
  still correct (`/<slug>`). Not worth a behavioural change.
- **Prior Info items still stand** (Info): equal-`date` comparators in `getAllPosts`/
  `similarPosts` return `-1` not `0` (deterministic; "newest first" holds for distinct dates);
  `tableOfContents` trailing `\s*#*\s*` regex is polynomial only on pathological build-time
  input (not a request-path ReDoS); `similarPosts` re-reads all posts per call (build/SSG-time,
  cached, trivial corpus); trusted-content symlink escapes `resolveWithin` (needs write access
  to the content dir, same trust level as authoring MDX); heading-with-markdown-link ToC id
  mismatch (build-time, rare). All previously accepted with rationale.

## Verification of Passes 1-2 fixes
- **Pass 1 H1 (path traversal in `getPost`) HOLDS.** Re-read `resolveWithin`
  (`src/blog/blog.ts:191`) and both call sites (the `getPost` candidate loop and
  `readPostFile`). The `abs !== contentDir && !abs.startsWith(contentDir + path.sep)` check -
  with the load-bearing `+ path.sep` - still defeats `..`, absolute-path, empty/`.`, and
  prefix-collision-sibling slugs/langs. The regression test (traversal via slug **and** via
  lang, against a provably-on-disk target) still passes. Not regressed by the NUL->`/` change
  (that touches only the in-memory dedup key, not path resolution).
- **Pass 1 L1 (JSON-LD `</script>` breakout) HOLDS.** `.replace(/</g, "\\u003c")` present at
  both and only sinks (`src/react/BlogPage.tsx:200`, `src/react/BlogOverview.tsx:95`); no other
  `dangerouslySetInnerHTML` / `eval` / dynamic HTML sink in scope.
- **Pass 2 L1 (unquoted-YAML-date coercion) HOLDS.** `isoDateString` present in
  `src/blog/format.ts:19` and routed for both `date`/`updated` in `readPostFile`
  (`src/blog/blog.ts:221,233`); its unit tests and the `content-unquoted-date` end-to-end test
  still pass. Complementary to this pass's `coerceText` (dates -> `isoDateString`, other scalars
  -> `coerceText`).

## Recurring Findings
Pass 3 promotes Pass 2's "format-typed input boundary" note from a scan-hint to a **confirmed
bug** (numeric title/description/tags, not just dates) and adds a second archetype (**raw
control byte in a source literal**). Both are recorded in
`.claude/skills/audit/reference/recurring-patterns.md` under "Found in scribekit" so future passes
scan for them first. Pass 1's path-traversal archetype remains closed for string inputs.

## Security Assessment (Pass 3)
- **Path traversal (S4):** confined at the single `resolveWithin` choke point for all
  string-derived paths; re-verified. NUL->`/` change does not touch path resolution. Symlink-
  in-content remains trusted-content-only (Info).
- **Input validation (S3):** front-matter normalisation is now sound for YAML-typed dates (Pass
  2) **and** numbers (Pass 3); string/array fields remain type-checked with safe fallbacks;
  numeric members are coerced rather than dropped. Non-scalar (object/`null`) values still fall
  back safely (no `[object Object]` leakage).
- **Injection - XSS (S4):** JSON-LD escapes `<` at both sinks; MDX body is the consumer's
  trusted content; anchor ids go through the Unicode-allowlist `slugify`. No new sink.
- **ReDoS (S3):** all regexes re-reviewed; only `tableOfContents` is ambiguous and is
  build-time, author-controlled - not request-reachable.
- **Secrets / error leakage (S5):** error messages carry only the slug and content-relative
  file paths; no secrets, no absolute paths, no host detail.
- **Supply-chain hygiene:** removing the NUL byte means the published `dist` is now clean
  plain-text JS, eliminating a latent mishandling risk in consumers' bundlers.
- **N/A (cheap skips, no surface):** S1 authn/authz, S2 tenant isolation, S6 idempotency, S7
  cost/quota, S8 money - unchanged (read-only static-content library).

## Known Deviations (Pass 3)
None. Both Pass 3 changes follow the project standards (4-space indent, `-` not em-dash,
docstring on the new `coerceText` export-adjacent helper, helper co-located with its single
caller in the `blog` module, tests under `tests/`, no `@ts-*` directives).

## Audit Scope (Pass 3)
Same 17 source files as Passes 1-2 (~2,690 source lines incl. the +21-line `coerceText` helper),
re-read line by line; tests excluded from the line-audit but reviewed and extended (+1 test,
+1 fixture).

**Verdict:** ship. Two new Lows found and fixed (raw NUL byte in source/`dist`; numeric
front-matter scalar coercion; +1 test, +1 fixture); Passes 1-2's H1 and both L1s independently
re-verified as holding. Build clean (`tsc`), all **188 tests pass**. No unfixed Critical, High,
Medium - and no unfixed Low. This pass is **not fully clean** by the convergence rule (two new
Lows were found and patched), so it does **not** end the multi-pass run: one more genuinely
clean pass (zero new findings of any severity) is required to converge.

---

**Last audit date:** 2026-07-08 (Pass 4)

Fresh, unbiased re-audit of the same scope (`src/` shippable library: `blog/` backend + `react/`
components; `demo/`, `skills/`, and tests excluded from the line-audit). Every file re-read line
by line; Phase 2.5 (deep logic / call-chain) run in full, with fresh eyes on the areas prior
passes under-examined: the SEO/hreflang/x-default/sitemap graph, cross-file type/optionality
consistency, the similar-posts math, React effect/observer lifecycle + hydration, and the
`coerceText`/`isoDateString` coercions themselves. Passes 1-3's fixes were independently
re-verified (see below), not assumed. Baseline was green (clean `tsc` build, 188 tests, no NUL
bytes).

## Issues Found and Patched (Pass 4)

### L1. Date-shaped front-matter title/description/tags silently dropped to slug/empty (Low)
- `coerceText` (`src/blog/blog.ts`), the shared normaliser for `title`/`description`/`keywords`/
  `categories`, handled `string` and finite `number` but **not `Date`**. Front-matter is YAML, and
  an unquoted date-shaped scalar - `title: 2026-06-28`, `description: 2026-07-01`, a
  `categories: [2024-01-15]` member - is parsed as a native JS **`Date`** (empirically confirmed
  with gray-matter, distinct from the number case `title: 2026`). A `Date` failed every arm and
  fell through to `undefined`, so a date-shaped title **silently collapsed to the slug**, a
  date-shaped description to `""`, and date-shaped keyword/category members were **silently
  dropped** - the exact "parser-native-typed scalar dropped at a `typeof === 'string'` guard"
  archetype this project recorded in `recurring-patterns.md`, whose documented fix is "string
  passthrough, finite number -> String, **valid `Date` -> ISO**". Pass 3's `coerceText` implemented
  only the first two arms, leaving the `Date` variant open: a plausible authored value (a journal/
  changelog post titled `2026-06-28`) vanished with no crash and no warning, degrading the
  `<title>`, OG/Twitter, JSON-LD `headline`, and the overview's filter/search facets. This is the
  same shape and blast radius as the Pass 3 numeric-scalar Low - one variant still unpatched.
- **Fix:** added a single `value instanceof Date` arm to `coerceText` (`src/blog/blog.ts:47`) that
  reuses the already-imported `isoDateString` (a valid `Date` -> UTC `YYYY-MM-DD`, an invalid
  `Date` -> `undefined`), so the four text fields coerce a date-shaped scalar rather than dropping
  it. Fixed once in the shared helper, so all four callers (title, description, keywords,
  categories) are covered by the same diff. The `string`/`number`/other-type paths are byte-for-
  byte unchanged (the `date`/`updated` fields already route through `isoDateString` directly and
  are untouched), so no regression: the existing numeric-coercion, "drops non-string entries", and
  slug/empty-fallback tests still pass. Docstring updated to document the `Date` arm. Test added
  (`src/blog/tests/blog.test.ts`, +1): a new fixture
  `fixtures/content-typed-scalars/date-shaped/post.mdx` carries unquoted date-shaped
  `title`/`description`/`keywords`/`categories` and asserts they normalise to `"2026-06-28"`,
  `"2026-07-01"`, `["2026-06-28","seo"]`, `["2024-01-15","Guides"]` (the test fails without the fix
  - pre-fix `coerceText` returns `undefined` for a `Date`, so the title would be the slug
  `"date-shaped"`).

## Assessed but not Patched (Pass 4)
- **`isoDateString` day-shift for an unquoted datetime with a timezone offset** (Info): an unquoted
  `date: 2026-06-28T23:30:00-05:00` is a YAML `Date`; `toISOString().slice(0,10)` renders its UTC
  calendar day (`2026-06-29`), a one-day shift from the authored local day. Not a defect: the
  `PostMeta.date` contract is a date-only `YYYY-MM-DD`, the documented behaviour formats `Date`s at
  UTC (consistent with `formatDate`'s `T00:00:00Z`), and a date-with-time-and-tz publish date is an
  unusual authoring form. Date-only input (the norm) is exact. Accepted, consistent with the
  UTC-normalisation choice Pass 2 shipped.
- **Bare-number `date: 2026` yields an empty date** (Info): unlike a date-shaped `date: 2026-06-28`
  (a `Date`), a bare `date: 2026` is a YAML **number**, which `isoDateString` maps to `undefined`
  (-> `""`). A bare year is not a valid `YYYY-MM-DD` publish date, so dropping it is the defensible
  fallback (the same class the prompt flags as "not a bug"). Deliberately not coerced.
- **Overview `x-default` targets `defaultLocale` even when it is absent from the configured
  `locales`** (Info): `overviewLanguages` (`seo.ts`) always points `x-default` at the default
  locale's URL, whereas the post/sitemap `hreflangMap` falls back to `translations[0]` when the
  default is absent. Reachable only under a misconfiguration (`defaultLocale` set to a code not in
  `locales`); the default-locale overview page is still servable (it is served unprefixed) and the
  emitted URL is valid, so the tags are not wrong, only slightly unusual. Not worth a behavioural
  change for a self-inflicted config.
- **`getPost` prefers `<default><ext>` over `post<ext>` without raising `DuplicatePostError`**
  (Info): when a folder contains both, the enumeration paths (`getPostRefs`/`getAllPosts`) throw at
  build time via `generateStaticParams`, so the ambiguity already fails loudly; `getPost` only ever
  sees valid slugs and its deterministic locale-file preference is reasonable. Pre-existing,
  accepted.
- **Prior Info items still stand** (Info): equal-`date` comparators in `getAllPosts`/`similarPosts`
  (deterministic; "newest first" holds for distinct dates); `tableOfContents` trailing `\s*#*\s*`
  regex (polynomial only on pathological build-time input, not request-reachable); `similarPosts`
  re-reads all posts per call (build/SSG-time, cached, trivial corpus); trusted-content symlink
  escapes `resolveWithin` (needs write access to the content dir); heading-with-markdown-link ToC id
  mismatch (build-time, rare); `basePath: ""` yields an empty overview path (undocumented). All
  previously accepted with rationale.

## Verification of Passes 1-3 fixes
- **Pass 1 H1 (path traversal in `getPost`) HOLDS.** Re-read `resolveWithin` (`src/blog/blog.ts:191`)
  and both call sites (the `getPost` candidate loop at `blog.ts:277` and `readPostFile` at
  `blog.ts:209`). The `abs !== contentDir && !abs.startsWith(contentDir + path.sep)` check - with the
  load-bearing `+ path.sep` - still defeats `..`, absolute-path, empty/`.`, and prefix-collision-
  sibling slugs/langs. The regression test (traversal via slug and via lang against a provably-on-
  disk target) still passes. Not touched by this pass's change.
- **Pass 1 L1 (JSON-LD `</script>` breakout) HOLDS.** `.replace(/</g, "\\u003c")` present at both and
  only sinks (`src/react/BlogPage.tsx:200`, `src/react/BlogOverview.tsx:95`); no other
  `dangerouslySetInnerHTML` / `eval` / dynamic HTML sink in scope.
- **Pass 2 L1 (unquoted-YAML-date coercion) HOLDS.** `isoDateString` present in `src/blog/format.ts:19`
  and routed for `date`/`updated` in `readPostFile` (`blog.ts:221,233`); its unit tests and the
  `content-unquoted-date` end-to-end test still pass. This pass's `coerceText` change reuses it for
  the text fields, extending the same coercion consistently.
- **Pass 3 L1 (raw NUL byte) HOLDS.** The `entries` dedup key is `` `${slug}/${lang}` `` (`blog.ts:146`),
  a plain `/`; a fresh scan of `src/` and the rebuilt `dist/` finds no NUL bytes and `dist/blog/blog.js`
  classifies as ASCII text.
- **Pass 3 L2 (numeric scalar coercion) HOLDS.** `coerceText`'s string+number arms are unchanged; the
  numeric fixture/test still pass. This pass adds the `Date` arm the archetype note prescribed.

## Recurring Findings
Pass 4 closes the third and final variant of the **"parser-native-typed scalar dropped at a
`typeof === 'string'` guard"** archetype: Pass 2 fixed YAML `Date` for the `date`/`updated` fields,
Pass 3 fixed YAML `number` for `title`/`description`/`keywords`/`categories`, and Pass 4 fixes YAML
`Date` for those same four text fields (the arm Pass 3's `coerceText` omitted). The archetype's
prescribed fix in `recurring-patterns.md` (string passthrough, finite number -> String, valid `Date`
-> ISO) is now fully implemented for every text-bearing front-matter field. No sharpening of the
reference entry is needed - it already named the `Date` arm; this pass simply completed the code to
match it.

## Security Assessment (Pass 4)
- **Path traversal (S4):** confined at the single `resolveWithin` choke point for all string-derived
  paths; re-verified. Symlink-in-content remains trusted-content-only (Info).
- **Input validation (S3):** front-matter normalisation is now sound for YAML-typed dates (Pass 2)
  and numbers (Pass 3) across every field, and this pass closes the date-shaped-`Date` gap for the
  four text fields; non-scalar (plain object / `null` / boolean / invalid `Date`) values still fall
  back safely (no `[object Object]` leakage).
- **Injection - XSS (S4):** JSON-LD escapes `<` at both sinks; MDX body is the consumer's trusted
  content; anchor ids go through the Unicode-allowlist `slugify`. No new sink.
- **SEO graph (verified this pass):** hreflang/`x-default`/canonical/sitemap and the JSON-LD
  `translationOfWork`/`workTranslation` cross-links were traced end to end via the single `localePath`
  source of truth - self-referencing hreflang present, `x-default` targets the default (or first
  translation when the default is absent), post/index/sitemap URLs agree with the rendered links, and
  every `@id` in a post's `@graph` is distinct. Correct.
- **ReDoS (S3):** all regexes re-reviewed; only `tableOfContents` is ambiguous and is build-time,
  author-controlled - not request-reachable.
- **Secrets / error leakage (S5):** error messages carry only the slug and content-relative file
  paths; no secrets, no absolute paths, no host detail.
- **N/A (cheap skips, no surface):** S1 authn/authz, S2 tenant isolation, S6 idempotency, S7
  cost/quota, S8 money - unchanged (read-only static-content library).

## Known Deviations (Pass 4)
None. The Pass 4 change follows the project standards (4-space indent, `-` not em-dash, updated
docstring, helper reuse within the `blog` module / `format` date domain, tests under `tests/`, no
`@ts-*` directives).

## Audit Scope (Pass 4)
Same 17 source files as Passes 1-3 (~2,696 source lines; `blog.ts` grew by 4 lines for the `Date`
arm), re-read line by line; tests excluded from the line-audit but reviewed and extended (+1 test,
+1 fixture).

**Verdict:** ship. One new Low found and fixed (date-shaped front-matter scalar coercion - the final
variant of the parser-native-typed-scalar archetype; +1 test, +1 fixture); Passes 1-3's H1 and all
four Lows independently re-verified as holding. Build clean (`tsc`), all **189 tests pass**. No
unfixed Critical, High, Medium - and no unfixed Low. This pass is **not fully clean** by the
convergence rule (one new Low was found and patched), so it does **not** end the multi-pass run: one
more genuinely clean pass (zero new findings of any severity) is required to converge.
