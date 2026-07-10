# Docs Style (project-adaptive)

Shared by the **write** and **rewrite** tasks. The goal: pages a reader can trust and look things up
in - accurate against the current code, predictable in structure, in the current project's voice. This
file is the docs analog of the blog's [house-style.md](../scribekit-blog/house-style.md): **reuse that file's
universal voice craft, banned-AI-slop lists, and MDX formatting**, and apply the docs **deltas** below.
Where the two conflict, this file wins for docs.

## Pick the Diátaxis type (do this before drafting)

Every page is exactly **one** of four types. Pick it with the Diátaxis compass - two binary questions:

1. Is the reader **acting** (doing something) or **cognising** (understanding something)?
2. Is the reader **acquiring** skill (learning, new to it) or **applying** skill (getting work done)?

| | Acquiring (learning) | Applying (working) |
| --- | --- | --- |
| **Acting** | **Tutorial** - a guided first success | **How-to guide** - steps to reach a goal |
| **Cognising** | **Explanation** - why it works this way | **Reference** - the facts, looked up |

State the chosen **type + a one-line justification** before writing, exactly as you state the topic.

**One type per page - never blend.** This is the single most common docs failure. A **reference** must
not teach or argue *why* (link to an explanation); a **how-to** must not stop to teach concepts (link
to reference/explanation); a **tutorial** must not digress into exhaustive option tables (link to
reference). If a topic genuinely needs two modes, **split it into two pages** that link to each other.

## Per-type page shape

- **Tutorial / quickstart** (acting + acquiring) - state the end result and prerequisites up front,
  then numbered sequential steps down **one golden path** (minimal branching). Each step is "do this
  exact thing -> see this exact result". End at a visible, working success state. Be explicit: a
  tutorial assumes no prior knowledge, so "state exactly what to type and what appears" is **required**
  here - it is *not* the "pedagogical hand-holding" the blog ban-list warns against.
- **How-to guide** (acting + applying) - title it as the goal (`How to <do X>`), one sentence on when
  to use it, then ordered steps that assume competence and **may** branch (`if X, then Y`). Stop when
  the task is done. No concept-teaching.
- **Reference** (cognising + applying) - a terse, neutral description of the thing, then structured
  lists/tables of every method, option, parameter, and default, **mirroring the code's own structure**.
  Be complete and boring. No walkthroughs, no opinions, no persuasion. Uniform, predictable phrasing is
  correct here.
- **Explanation** (cognising + acquiring) - discursive prose on why the thing exists, its design
  decisions, trade-offs, alternatives, and how it connects to the rest. The **only** type allowed to
  make design-rationale claims.

For an **empty or unwired docs corpus** (no `Docs` instance, or `contentDir` has no pages) the correct
first page is a **getting-started quickstart** - a tutorial that walks the project's real install ->
`new Docs({...})` wiring -> route files -> a rendered page, mapped backward from that first success.

## Deltas from house-style.md (what to keep, what to override)

**Keep** (universal - apply as written): the banned-AI-slop **vocabulary and filler lists**; second
person + active voice; concrete over hype (a real signature/default beats an adjective); answer-first /
inverted-pyramid (lead with the point); and "invent nothing - trace to source".

**Override for docs:**
- **Drop the burstiness / "prefer the surprising-but-right word" rule.** Docs prize predictability and
  consistent terminology (one term per concept, used everywhere). Uniform sentence rhythm is fine -
  desirable in reference. Do **not** flag it as machine-flat.
- **No pull-quote.** The one-`>`-blockquote-per-post rule is a blog device; drop it.
- **No soft CTA / sales close, and no hand-rolled nav.** The renderer already emits prev/next
  (`getAdjacent`) and the sidebar (`getNavTree`), so do **not** append a `## Next steps` list that
  restates the linear next page. Add a short **`## Related`** list **only** for cross-references
  prev/next can't express (e.g. a how-to pointing at its reference page in another tab), and **match
  the corpus** - if sibling pages carry no such section, omit it. Never a conversion CTA.
- **Neutral, not opinionated.** "Take a position a machine would hedge on" is a blog rule; docs are
  descriptive. Only an **explanation** page weighs trade-offs.
- **Tutorials are explicit by design** - see above; step-by-step "type this, see that" is required, not
  slop.

## Headings and how a page opens

- **No manual H1.** The `DocMeta.title` renders the page's `<h1>`, so the body starts at `##` (confirm
  against the project's renderer, same as the blog). Never emit a second H1.
- **Phrase headings as the reader's question or task, in sentence case**: `Configure a Docs instance`,
  not `Configuration` or `Getting Started`. Never skip heading levels.
- **Open with what the page lets the reader do** (1-2 sentences, task/answer-first). A tutorial/how-to
  adds an explicit **prerequisites** line; a reference opens with the signature/definition, not a hook.

## Internal links

Link another doc page the way the frontend does (`localePath`): a **default-locale** page links a
sibling as **`<basePath>/<slug>`** (`basePath` from the `Docs` config, default `/docs` - e.g.
`/docs/quickstart`). A **non-default locale's** pages link as **`/<lang><basePath>/<slug>`** (e.g.
`/fr/docs/quickstart`); with `prefixDefaultLocale` the default locale is prefixed too. In a
translation, **re-localize every internal link to its own locale prefix** - never copy the
default-locale path. Links to non-doc product routes use those routes verbatim (root-relative).

## Code-sample discipline (the sharpest docs-vs-blog difference)

Every code block:
- is **language-tagged** (```` ```ts ````), and **copy-paste-runnable**, not pseudo-code;
- has **every symbol, import, method, option, and default traced to real source** - exact export names,
  real signatures, real defaults. Read them; do not recall them.
- uses the project's **real import path** - the `name` from `package.json` (e.g.
  `import { Docs } from "<package-name>"`), never a guessed package name;
- shows **input and the resulting output** where it helps (the call and what it returns, or the config
  and its effect) so the reader never guesses;
- prefers **one complete minimal example** over scattered fragments, with a consistent placeholder and
  naming convention across the page. Only use multi-language code groups when the product truly ships
  multiple SDKs;
- uses only **MDX components the project registers** (check for an `mdx-components` file); if it
  registers none, use plain MDX - a `<Callout>` / `<Note>` the project doesn't provide renders nothing.

## `DocMeta` frontmatter contract

Match scribekit's `Docs` reader (the `DocMeta` type, normalised from the MDX YAML header at parse time).
The fields:

```yaml
---
title: "Short, specific - the page's H1 and default sidebar label"   # falls back to the slug if omitted
description: "One sentence - the lead, meta description, and OG/Twitter"  # REQUIRED: falls back to "" (empty), never the slug
tab: "Documentation"          # top-level section; reuse an EXISTING tab string verbatim (below)
group: "Get started"          # sidebar group heading; reuse an EXISTING group string verbatim
order: 3                       # sort within the group, ascending. BARE NUMBER - see YAML types below
icon: "rocket"                # free-form icon name the frontend maps to an SVG; match sibling pages
label: "Quickstart"           # optional sidebar label override; defaults to title
keywords:                      # optional; a YAML LIST, not a comma string
    - docs
    - quickstart
image: "/assets/docs/<slug>/hero.en.jpg"   # optional OG/social-card image (NOT rendered on-page); illustrative path - the real leading-slash path is set by /scribekit-hero docs-hero, don't hardcode this prefix
updated: "2026-07-09"         # last-updated ISO date, QUOTED, from `date +%F`; set on any material revision
date: "2026-07-09"            # optional first-published ISO date, QUOTED
hidden: true                  # optional; page stays routable but leaves the nav/prev-next/index. BARE BOOLEAN
---
```

- **`DocMeta` has no `author`, `categories`, or `tags` field** - do not carry them over from the blog
  contract; the reader drops any field it does not parse. `readingTime` is computed from the body - never
  author it.
- **Language is the file's location, never a frontmatter field.** Each page is a `<slug>/` folder; the
  default-language page is named by its resolved default locale (`<slug>/<defaultLocale><ext>`, e.g.
  `en.mdx`), a translation is `<slug>/<lang><ext>` in the same folder (e.g. `fr.mdx`), sharing the
  slug. `post<ext>` still resolves as a fallback - but never create both `<default><ext>` and
  `post<ext>` in one folder (that throws `DuplicateDocError`).

### Frontmatter YAML types are load-bearing

The `Docs` reader keeps a field **only** when its YAML type is right, else it **silently drops it to
`undefined`** - the page still parses, but its placement or visibility is lost:

- **`order`** - a **bare number** (`order: 3`). `order: "3"` is dropped -> the page sorts into the
  unordered bucket (after every ordered sibling, alphabetically by title).
- **`hidden`** - a **bare boolean** (`hidden: true`). `hidden: "true"` is **not** hidden -> a draft
  becomes publicly navigable.
- **`keywords`** - a **YAML list** (`keywords:` then `- item` lines). A comma string is dropped.
- **`icon`** - a **bare string**. Quoting `date` / `updated` (from `date +%F`) is a safe convention,
  but unlike `order` / `hidden` / `keywords` an **unquoted** ISO date is still coerced to a
  `YYYY-MM-DD` string by the reader, not dropped; `order` / `hidden` must **not** be quoted.

**Verify by re-reading the header you wrote**: `order` a number, `hidden` a boolean, `keywords` a list.
If any is quoted or wrong-typed, the page silently loses that field.

## Light metadata check (replaces the blog 100-point rubric)

Docs still feed `Docs.docMetadata` / `docJsonLd`, so give them good inputs - but this is a **light**
on-page check, not the full GEO rubric. Assert:

- [ ] **`title` and `description` both present and non-empty** (description falls back to `""`, so an
      omitted one ships a blank meta/OG description) and accurate.
- [ ] **Slotted correctly**: `tab`/`group` reuse existing literals; `order` slots the page where it
      belongs; `icon` matches siblings; not orphaned, not duplicating a sibling. **Only a correctly-typed
      `hidden: true` removes a page from the nav** - watch the inverse failures: a quoted `order` still
      shows the page but mis-sorts it to the end (alphabetically by title), and a stringy `hidden`
      (`"true"`) fails to hide a draft, leaking it into the nav. A lone `tab` only hides the tab bar, not
      the page.
- [ ] **YAML types correct** (above) - the load-bearing check.
- [ ] **`image`** is a **site-root path with a leading slash** (never a bare filename, never a full
      URL) and the file exists; alt/title descriptive.
- [ ] **Opens answer-first for its type** (tutorial/how-to: end result + prerequisites; reference:
      signature/definition), sections standalone, headings sentence-case questions, no skipped levels,
      no manual H1.
- [ ] **Every internal link resolves** to a real doc route or product route (root-relative), and every
      code sample still matches current source.
- [ ] **No marketing language** (the house-style vocabulary ban-list) and the project's punctuation
      rule honoured.

The auto-emitted metadata (`docMetadata`/`docJsonLd`/`sitemapEntries`) needs `siteUrl`+`brandName` on
the `Docs` instance - do not hand-add schema the project already emits.
