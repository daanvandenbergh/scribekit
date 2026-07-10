# Task: write

Generate one publish-ready documentation page (MDX) for the **current project's** docs site, **plus
its hero image by default**. One-shot: no approval gates, but rigorous internally. You should already
have done **Step 0** (learned this project - identity/voice, the `Docs` wiring, the existing corpus,
and the real product code) from `SKILL.md`, and read
[../scribekit-blog/house-style.md](../scribekit-blog/house-style.md),
[../scribekit-blog/research-protocol.md](../scribekit-blog/research-protocol.md), and
[docs-style.md](./docs-style.md). If not, do that now.

**The source of truth is this project's code, not the web.** Every option, default, signature, route,
and code sample is read from source at authoring time and carries a `file:line` trace - never recalled
from memory or copied from this skill's examples.

## Procedure

### 1. Resolve the topic - auto-investigate to propose the gap
- **Topic given** -> use it, but still run the coverage check (1c) to confirm it is not already
  covered; if it is, switch to **rewrite** on that slug and say so.
- **No topic** -> run the gap analysis and propose the single highest-value gap. It reuses Step 0's two
  maps (real capabilities + the corpus); build them now if skipped.
  - **1a. Enumerate the project's REAL capabilities** (source = the code; skip any surface the project
    lacks, never invent one): package exports (read `package.json` `exports`/`main`/`bin`, open each
    source barrel, follow `export *`, list every exported name); **public class methods and public
    `readonly` fields** (in TS, anything not `private`/`#` is API) with signature + one-line purpose;
    `*Config` options + their constructor defaults (the `?? value`); components (capitalized UI
    exports + notable props); routes (`app/**/page.tsx`, `route.ts`); CLI flags **only if
    `package.json` has a `bin`**. Record each as `{ id, kind, source: file:line, signature/default }`.
  - **1b. Reconstruct the whole corpus map** by reading front-matter directly, per **Step 0's sort
    rules** (**do not call `getNavTree`/`getAllDocs`/`getDoc`** - server-only, unwired): for every
    `<contentDir>/<slug>/` page read `tab`/`group`/`order`/`icon`/`hidden`. Additionally index each
    page's body (code fences + headings) so 1c sees which capabilities it mentions.
  - **1c. Diff.** For each capability `id`: **undocumented** (zero mentions), **stale** (mentioned but
    the page's signature/option/default/path differs from current source - dead samples count), or
    **covered**. Also a **getting-started integrity** check: is there a page walking the *current*
    wiring end-to-end (install -> `new Docs({...})` with today's config -> route files -> a rendered
    page)? (The literal-token match is cheap and can mis-classify, but the winner is always re-read
    against its source before drafting, so a miss costs one Read, not a wrong page.)
  - **1d. Rank, pick ONE** (first that applies): (1) getting-started broken or absent; (2) the
    undocumented gap with the widest blast radius **and** the cleanest slot fit - weigh actual reach,
    not just "is it a class": an undocumented cluster that drops into an existing tab/group (e.g. a
    config reference into `Configuration`) can outrank a greenfield page for a sibling product. If the
    strongest gap is a **sibling product's** surface (e.g. a `Blog` when this is a docs-about-docs
    corpus), whether it belongs here is exactly the ambiguity to ask about in 1e. (3) stale
    load-bearing fact (wrong install step / default / renamed core option). **Empty or unwired
    corpus** -> skip the diff; the winner is a getting-started **quickstart** by default (confirm
    content dir / basePath / default locale with the user first, per Step 0; do not invent a basePath
    for links).
  - **1e. Propose it, then proceed** (no gate): print the **topic** + **[Diátaxis type](./docs-style.md)**,
    the **tab** and **group** (reuse an EXISTING literal string, case- and space-sensitive - `Get
    started` != `Get Started`; introduce a new one only when nothing fits, and say so), the **order**
    (max order in that group + 1; a **brand-new** group starts at `order: 1` and only sorts/labels
    right once added to the `_docs.ts` `tabs`/`groups` - Step 0 scope), the **icon** (consistent with
    siblings), a **one-line rationale** naming the capability + its `source` file:line, and the
    **runner-up** gaps. Then continue. Pause to ask only when the corpus is empty/unwired, the top gaps
    tie (or one is a sibling product's surface), or a new tab/group label is needed.

### 2. Research (mandatory) = read the code
Per [../scribekit-blog/research-protocol.md](../scribekit-blog/research-protocol.md), **inverted**: the primary
source is **this project's source**, read directly. For every fact the page will state - each option,
default, signature, route, behaviour - open the real source, extract it, and record its `file:line`.
Use `WebSearch`/`WebFetch` **only** for a genuinely external fact (a published standard or spec) and
cite it. **No API detail from memory; no invented option or default.**

### 3. Pick the type + plan the page
Pick the **Diátaxis type** ([docs-style.md](./docs-style.md)) and hold to it (one type per page; split
if the topic spans two). Plan: the tab/group/order/icon slot (from 1e), a sentence-case
question/task **`##` outline** for that type's page shape, the internal links to real doc pages +
product routes (built per [docs-style.md](./docs-style.md) **Internal links**; never invented), and
the exact code samples (each traced to source).

### 4. Draft
Write the body in the project's voice per [docs-style.md](./docs-style.md) (which **reuses**
house-style's voice craft + anti-slop vocabulary and MDX rules, and **overrides** its blog-specific
frontmatter/pull-quote/CTA rules). Open with what the page lets the reader do (or the
signature/definition, for reference); one idea per section, standalone; code samples copy-paste-runnable
and traced to source; body starts at `##` (no extra H1); close with a plain **`## Next steps`** /
**`## Related`** link list, **not** a CTA. Honour the project's punctuation rules (e.g. no `-` -> em-dash
if the project bans it).

### 5. Anti-slop self-pass (scoped for docs)
Re-read against [../scribekit-blog/house-style.md](../scribekit-blog/house-style.md) and run: **ban-list grep** (kill
every banned vocabulary/filler word and close variant); **specificity** (replace vague claims with the
real signature/name/default); **cut padding**; **scannability** (sentence-case question headings, no
skipped levels, short sections, a table where it helps). **Skip** the blog burstiness /
sentence-rhythm / rule-of-three / one-CTA checks - uniform, predictable phrasing is correct in
reference and how-to, and docs carry no CTA.

### 6. Frontmatter = the `DocMeta` contract
Assemble per the **`DocMeta` frontmatter contract in [docs-style.md](./docs-style.md)**, matching the
project's reader: `title`, `description` (**required, non-empty**), `tab`, `group`, `order`, `icon`,
optional `label`/`keywords`/`date`, and `image` (set by the hero step). **YAML types are
load-bearing**: `order` a bare number, `hidden` a bare boolean, `keywords` a YAML list, `icon` a bare
string, only dates quoted - a wrong type is silently dropped and the page loses its slot. Slug =
kebab-case of the title; **verify unique against every `<contentDir>/<slug>/` folder on disk, including
`hidden` ones**.

### 7. Hero image (default ON, but match the corpus) - via /scribekit-hero
**First check whether sibling pages carry `image:` / a `hero.js`.** If the docs corpus has **none** (a
surface that never wired heroes), match it - **skip the hero and leave `image:` unset** unless the user
asks for one: `DocMeta.image` is an optional OG/social-card field the page never renders inline, and a
lone hero no sibling has breaks consistency. Otherwise (siblings have heroes, or the user opts in),
hand the page's hero to the **[/scribekit-hero](../scribekit-hero/docs.md)** skill's **docs-hero** create
flow: on first use it seeds the docs surface's `hero.settings.js` from the brand; then it writes the
page's `<slug>/hero.js` params, renders an on-brand hero, saves the JPEG to the project's assets dir,
and sets the `image:` frontmatter. Locate the installed skill (first that exists):
`<this-skill-dir>/../scribekit-hero/SKILL.md`, `.claude/skills/scribekit-hero/SKILL.md` (from the project
root or `$HOME`), or `node_modules/<package-name>/skills/scribekit-hero/SKILL.md`; then follow its
`docs.md` create flow for this slug (single-language = one JPEG; multi-language = per-locale, step 8).
**If `/scribekit-hero` isn't installed**, skip the hero, leave `image:` unset, and tell the user to
install it. **Skip on opt-out** too (`--no-hero` / "skip the image").

### 8. Write the file(s)
**First, seed the content-dir README (once, never overwrite).** Ensure a `README.md` exists at the
**root of the docs content dir** (`<contentDir>/README.md`, resolved in Step 0). If it is missing,
copy this skill's template into it **verbatim** from the first path that exists:
`<this-skill-dir>/assets/content-dir-README.md`, `.claude/skills/scribekit-docs/assets/content-dir-README.md`,
or `node_modules/<package-name>/skills/scribekit-docs/assets/content-dir-README.md`. It warns humans and
AI agents that this directory is **live website content, not scratch space** - so the caution ships
into the implementer's own repo, not just this skill. A root-level `README.md` is a file, so scribekit's
reader ignores it (it only walks `<slug>/` subfolders) and it never becomes a page. **If a `README.md`
already exists, leave it untouched.**

Write the page as `<slug>/<defaultLocale><ext>` in the project's docs content dir (resolved per Step 0,
against the app root), where `<defaultLocale>` is what the `Docs` config resolves to
(`config.defaultLocale ?? locales[0].code ?? locale.split("-")[0] ?? "en"`, from Step 0) - it is
`en.mdx` **only** when that resolves to `en`; a German default is `de.mdx`. **Favor the locale-named
file over `post.<ext>`**, and never create both (that throws `DuplicateDocError`).
**Multi-language docs** (locales detected in Step 0): the default-language page is not finished until
it exists in every configured locale. Write the default-language page first, then - by default, without
being asked - a **dedicated translated page for each other locale** (translate `title`/`description`/
`keywords`/body while preserving structure, heading order, tab/group/order slot, and its per-locale
hero). **Re-localize every internal link to the translation's own locale prefix** ([docs-style.md](./docs-style.md)
Internal links) - do not copy the default-locale path. Language is the file's name, **never** a
frontmatter field. Print which locales you wrote. Only
skip on explicit opt-out.

### 9. Verify
- Frontmatter parses; **re-read the header**: `order` a number, `hidden` a boolean, `keywords` a list
  ([docs-style.md](./docs-style.md) YAML types). Body is valid MDX, no stray/unclosed JSX, no extra H1.
- The page slots into the right tab/group/order/icon (reconstructed nav, not orphaned, not duplicating
  a sibling); `image` is a leading-slash root path that exists.
- Every internal link resolves to a real doc route/product route; every code sample, option, and
  default matches current source (spot-re-read the traces).
- Run the **light metadata check** ([docs-style.md](./docs-style.md)); the hero renders crisp and is
  legible at card scale.
- Print any **`Sources used:`** list (per the research protocol) for genuinely-external facts cited.
- Offer a browser check: **ask the user to start the dev server** (never start it yourself), then use
  Chrome MCP to load the page's route and verify rendering + clean console. Note if no docs route is
  wired in the target yet - the links are provisional until it is.

### 10. Hand off
Suggest an independent audit pass: invoke this skill in **rewrite --scan** mode on the new slug.

## Guardrails
- Never fabricate an API detail, option, default, signature, or the package name - every one traces to
  source at authoring time. `DocMeta` has no `author`/`categories`; never hand-write JSON-LD.
- Never start a dev server (project rule). Never create git branches.
- Keep changes scoped to the new page + its hero asset (plus the `_docs.ts` `tabs`/`groups` array only
  when you introduce a brand-new tab/group) - **plus** the one-time content-dir `README.md` (Step 8),
  seeded from `assets/content-dir-README.md` only when absent, never overwritten.
