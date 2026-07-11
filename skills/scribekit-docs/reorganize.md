# Task: reorganize

Redesign the **information architecture of the whole docs corpus** - which tab each page sits under,
which group it belongs to, what order it reads in, and how the sections themselves are ordered and
labelled - then apply it. Where **write** adds one page and **rewrite** fixes one page, this is the only
mode that looks at **every page at once** and asks whether the shape makes sense. You should already have
done **Step 0** (learned this project - the `Docs` wiring, the corpus, the sort rules) from `SKILL.md`,
and read [docs-style.md](./docs-style.md). If not, do that now.

**Why this mode exists.** A scribekit docs site has **no nav config file** - the sidebar is an emergent
property of N independently-authored YAML headers. So it drifts: pages land in the wrong tab, a group
ends up with one lonely page, two pages tie on `order`, a translation disagrees with its original about
which group it is in. And the `Docs` reader has **no validation layer at all**: every wrong value is
*silently dropped* to `undefined`, so the corpus looks fine while the nav is quietly wrong. Nobody
reviewing one page can see any of this.

**Two behaviours, set by the argument:**
- **default (`reorganize`)** - audit the corpus, print the plan, **wait for approval**, then apply it.
- **`--scan`** - audit and print the plan **only**. Change **no** files: run Steps 1-5, **skip Step 6
  (apply)**, then still do Steps 7-8 - they are report-only and are part of what you were asked for.

**This mode never renames a slug.** A slug is the page's public URL; renaming it breaks every inbound
link. Badly-named slugs are **collected and reported** at the end (Step 7) with the redirect wiring the
user needs to act on them safely. **A reorganize run therefore changes zero URLs** - it only moves pages
within the nav.

## Procedure

### 1. Read the whole corpus, every locale
For **every** `<contentDir>/<slug>/` folder, read the front-matter of **every** language file in it
(`<defaultLocale><ext>` or the `post<ext>` fallback, plus each `<lang><ext>`) - not just the default
language. This is the only mode that needs all of them, because the nav is rebuilt **per language** from
that language's own files (Step 3, cross-locale drift). Record for each `(slug, lang)`: `title`,
`description`, `tab`, `group`, `order`, `icon`, `label`, `hidden`, and the **raw YAML type** of each
value as written (a quoted `order` is a different fact from a bare one - see Step 3).

Also read the `tabs` / `groups` arrays from the project's `_docs.ts` (Step 0).

### 2. Reconstruct the nav exactly as the reader builds it, then classify every page
**Reconstruct** (per Step 0's sort rules - never call `getNavTree`/`getAllDocs`, which are `server-only`
and may be unwired): bucket by `tab` (unset = one implicit `""` tab), then `group` (unset = the ungrouped
bucket); within a group sort by `order` ascending, unset last, ties broken **alphabetically by `title`**;
tabs and groups themselves sort by their position in the `_docs.ts` `tabs`/`groups` config first, then by
their pages' minimum `order`, then first-seen. `hidden` pages are excluded. Also flatten it into the
**linear reading order** (tabs -> groups -> pages) - that is the prev/next order, and Step 4 depends on it.

**Then prove the reconstruction instead of trusting it.** `server-only` blocks the *`Docs` class*, but
the nav builder itself is usually a **pure, fs-free function** you can call directly: in scribekit,
`buildNavTree` / `flattenNav` / `adjacentFor` are exported from the docs module and import no `node:fs`,
no `next`, no `react`. Import the **module directly, not the package barrel** (the barrel pulls in the
`server-only` class and throws), hand it the front-matter you read in Step 1 plus the `tabs`/`groups`
config, and diff its output against your hand-built tree:

```bash
node -e "import('./dist/docs/navigation.js').then(({buildNavTree, flattenNav}) => { /* ... */ })"
```

Do this for the **current** tree and again for the **proposed** one in Step 4, so the before/after you
show the user is the real builder's output, not a simulation. If the project exposes no such pure
builder, fall back to the hand reconstruction and say so.

**Classify**: for each page, read its front-matter **and skim its body** to decide what the page
**actually is** - its [Diátaxis type](./docs-style.md) and its real subject - rather than trusting the
slot it currently claims. A page whose body is a reference table sitting in a "Get started" group is the
finding, and you can only see it by reading the body.

### 3. Find the silent failures
None of these throw, warn, or show up in a build - the page renders fine and the **nav** is wrong. This
list is the mode's core value:

- **quoted `order: "3"`** - dropped -> the page silently sorts **last** in its group.
- **stringy `hidden: "true"`** - **not hidden** -> a draft leaks into the public nav and sitemap.
- **comma-string `keywords`** - dropped (a YAML list is required).
- **an `icon` outside the built-in set** - silently renders the neutral `document` glyph
  ([docs-style.md](./docs-style.md) has the list).
- **`tab` / `group` literal drift** - `"Get started"` vs `"Get Started"` are **two different buckets**.
  Case- and space-sensitive, always.
- **duplicate `order` within one group** - a silent alphabetical-by-title tie-break, so the sidebar order
  is not the one the author intended. Two pages both at `order: 2` is a bug, not a tie.
- **cross-locale slot drift** - the nav is rebuilt per language from that language's own files, so if
  `fr.mdx` and `en.mdx` of one slug disagree on `tab` / `group` / `order` / `icon`, **the French sidebar
  differs from the English one**. These four must be **identical across every locale file of a page**.
  (`title` / `description` / `label` / `keywords` are the opposite: they *should* be translated.)
- **dead or missing config entries** - a `tabs`/`groups` entry matching no page (dead), or a page whose
  `tab`/`group` is absent from the config (so it sorts after every configured one, whatever its `order`).
- **missing `description`** - falls back to `""`, shipping a blank meta/OG description.
- **missing `title`** - falls back to the slug.

### 4. Design the target architecture
The craft, not just renumbering. Apply, in order:

- **Group by the reader's job, never by which module implements the feature.** A group is a thing a
  reader is trying to *do*, not a folder in `src/`.
- **One Diátaxis type per group**, once the corpus is big enough to separate them: a reference page does
  not belong in a tutorial group. A page in the wrong-type group is the most common real finding.
- **Section order follows the reader's journey** - get started, then configure, then extend, then
  reference. Set it in the `_docs.ts` `tabs`/`groups` arrays, which win over any page's `order`.
  **Every tab and every group must appear in those arrays.** The documented fallback for an unlisted
  section (its pages' *minimum* `order`) is a mirage once you apply the density rule below: if every
  group starts at `order: 1`, every group's minimum is 1, so they all tie and the real tie-break is
  **first-seen = `readdir` order on disk**. An unlisted section is therefore ordered by the filesystem,
  which is not an order anyone chose. List them all.
- **Within a group, `order` is dependency order** (install before configure), **dense `1..N`, no gaps and
  no ties** - so the next `write` can safely append `max + 1`, and no page falls back to the alphabetical
  tie-break.
- **A one-page group is noise** - a heading with a single item under it. Merge it up, or into a sibling.
  Same for a tab holding a single group. (A tab is a whole top-level section; it must earn one. Note a
  single distinct tab across the corpus hides the tab bar entirely.)
  **Before you dissolve a section, check nothing outside the corpus depends on it existing** - a nav link
  or marketing page that deep-links into the tab, or (the trap) a docs corpus that doubles as the
  project's own **demo/fixture**, where a second tab is what makes the tab bar render at all. Grep for
  the tab/group literal outside `<contentDir>` first. If something does depend on it, do not delete the
  section: make it **earn itself** by moving a page that genuinely belongs there, and say why in the
  report.
- **The flattened reading order must read as one coherent document end to end.** Prev/next crosses group
  **and tab** boundaries, so the last page of one tab links straight to the first page of the next. If
  that jump is nonsense, the tab order is wrong. **A per-page mode cannot see this** - it is the main
  reason this mode exists.
- **Tab and group names are searched** ([docs-style.md](./docs-style.md)) - use words a reader would type.
- **Rename a section's display label without touching a single page** by using the `{ id, label }` form of
  a `tabs`/`groups` entry: the id stays the literal every page carries, the label is what renders.
- **The first page in a group supplies the group's card icon** on the docs index
  ([docs-style.md](./docs-style.md)), so whichever page you order first should carry an icon that
  represents the whole group.

Change as little as achieves the right shape. Moving a page that is already correctly slotted, purely to
make a diff look thorough, is a regression - it churns the nav for no reader benefit.

### 5. Report the plan, then stop
Print, in this order:

1. **The nav today -> the nav proposed**, as two trees side by side (tab -> group -> ordered pages), so
   the whole change is visible at a glance.
2. **Per-page changes** - one line each: `<slug>: tab/group/order/icon <old> -> <new>`, with a
   **one-line reason**. Pages that do not move are not listed.
3. **Silent failures fixed** (Step 3), each with the concrete consequence it was having.
4. **The `_docs.ts` diff** - the new `tabs` / `groups` arrays.
5. **"No URLs change."** State it plainly - every slug is untouched.

**If `--scan` was passed, skip Step 6** (apply nothing, modify no file) and go straight to Steps 7-8 -
they change nothing and are part of the report.

Otherwise **ask for approval** and wait. This is the one gated mode: it rewrites the front-matter of the
entire corpus at once, so the user sees the whole shape before any of it lands.

### 6. Apply (skipped entirely under `--scan`)
On approval:
- Edit the front-matter of **every locale file** of each moved page. `tab` / `group` / `order` / `icon`
  must come out **identical across all of a page's languages**; `label` is translated when set.
- Fix every silent failure from Step 3 (correct the YAML types: `order` a bare number, `hidden` a bare
  boolean, `keywords` a YAML list).
- Update the `tabs` / `groups` arrays in `_docs.ts`.
- **Do not touch page bodies.** **Do not bump `updated:`** - a slot change is not a content revision, and
  bumping it would churn every page's sitemap `lastmod` for nothing.
- Re-read each header you wrote and confirm the YAML types survived
  ([docs-style.md](./docs-style.md)).

Then print what changed, and re-verify the flattened reading order reads coherently end to end.

### 7. Report badly-named slugs - never rename them
Close the run with the slugs you would have renamed, **which you did not touch**:

- a redundant prefix (`docs-theming` under a `/docs` basePath - the section is already in the URL)
- vague or internal naming (`misc`, `page2`, a module name no reader would guess)
- a slug that no longer matches what the page is now about
- inconsistent casing/word-separators against the rest of the corpus (`writingDocs` among kebab-case)

For each: the current slug, the suggested slug, and the one-line reason. Then give the user the **exact,
safe way to act on it** - scribekit ships slug redirects, so a rename does not have to break URLs:

```ts
// _docs.ts - keep the old URL alive as a permanent 308
export const docs = new Docs({
    // ...
    redirects: { "<old-slug>": "<new-slug>" },
});
```

...plus, in the `[slug]` route, `getRedirectRefs()` spread into `generateStaticParams` and
`getRedirect(slug, lang)` called before `notFound()` (**both** are required - with
`dynamicParams = false` an unrendered slug 404s at the router, so the old slug must be prerendered for
the redirect to ever run). Point them at the project's own README for the wiring, and **read the real
`Docs` surface from source** before quoting any of it - never from this example.

End by stating plainly that **nothing was renamed** and no URL changed.

### 8. Hand off the content problems you cannot fix here
Restructuring reveals content defects that only a body edit can fix, and this mode never edits a body.
List them as recommendations for a **`rewrite`** pass - most usefully, the ones that only became visible
once the pages were placed side by side:

- **two pages that now sit in one group and duplicate each other** (the overlap the old structure hid)
- a page whose **body is a different Diátaxis type** than the group it belongs in
- a gap the new structure makes obvious - a group that clearly wants a page nobody has written

Name the target slug and the suggested `rewrite`/`write` invocation. Do not fix any of it here.

## Guardrails
- **Never rename a slug or move a `<slug>/` folder.** Report them (Step 7); that is the whole contract.
- **Never edit a page body**, and never create, delete, split, or merge pages - that is `write` /
  `rewrite`. If the audit finds a content problem (a blended page that should be split, a missing page
  the structure clearly wants), **flag it as a recommendation and hand off**; do not fix it here.
- Scope: page **front-matter** + the `_docs.ts` `tabs`/`groups` arrays. Nothing else.
- With `--scan`, touch **nothing**.
- Never apply without approval. Never start a dev server; never create git branches.
