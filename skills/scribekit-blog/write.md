# Task: write

Generate one publish-ready blog post (MDX) for the **current project's** site, **plus its hero
image by default**. One-shot: no approval gates, but rigorous internally. You should already have
done **Step 0** (learned this project - niche, voice, content dir, frontmatter contract, routes)
from `SKILL.md`, and read [house-style.md](./house-style.md),
[research-protocol.md](./research-protocol.md), and [seo-checklist.md](./seo-checklist.md). If not,
do that now.

## Procedure

### 1. Resolve the topic
- **Topic given** -> use it. Sharpen a broad topic into a specific, search-intent-shaped angle.
- **No topic** -> auto-select: ground the niche from Step 0 (CLAUDE.md/README + landing page), list
  existing posts in the content dir so you don't overlap, and propose the single highest-value gap
  topic with real informational search intent. **State the chosen topic + a one-line rationale**
  before continuing.

### 2. Research (mandatory)
Follow [research-protocol.md](./research-protocol.md). Frame the 4-8 questions the post must answer,
then `WebSearch`/`WebFetch` for current, sourced facts. Skim what already ranks + "People Also Ask"
for the information-gain angle. Keep a running `{claim, number, publisher, date, URL}` sources list.
**No claim from memory; no invented stat or anecdote.**

### 3. SEO + GEO plan
Per [seo-checklist.md](./seo-checklist.md): pick the primary keyword + 2-4 secondaries + entities,
and confirm intent by **reading the live SERP**. Draft the `title` (front-loaded keyword),
`description` (benefit-led), a **question-shaped `##` outline**, the internal-link targets (**the
project's real routes from Step 0** + sibling posts - never invented), and the 1-3 external sources
to cite inline.

### 4. Draft
Write the body per [house-style.md](./house-style.md), **in the project's voice**: answer-first
opening; each `##` section standalone-quotable (direct answer first, then elaborate); inline
citations, front-loaded facts, concrete numbers; a comparison table for any "X vs Y" contrast;
insider detail that's **generic-and-true only** (no invented named customers or cases); second
person; one `>` pull-quote; exactly one soft CTA. Body starts at the renderer's level (no extra H1);
honour the project's punctuation rules (e.g. no `—` if the project bans it).

### 5. Anti-slop self-pass (the editorial pass - do all of it)
Re-read against [house-style.md](./house-style.md) and run, in order:
1. **Ban-list grep** - kill every banned phrase/word and close variant.
2. **Burstiness** - flag any run of 3+ consecutive sentences within ~5 words of each other in length
   and break it.
3. **Tic audit** - count dashes, adjective triples, "not X but Y", repeated sentence openings; cut
   each to ≤1.
4. **Specificity** - replace every vague claim/adjective with a number, name, or example; kill vague
   attributions.
5. **Cut 30-50%** - delete the hollow intro, any signposted/summary conclusion, and padding.
6. **Scannability** - headings, bolded anchors, short one-idea paragraphs, a list or two.
7. **Skeptic test** - would a sharp member of the audience call this fluff? Add proof or delete.
8. **CTA check** - exactly one, soft, a natural next step.

### 6. Frontmatter
Assemble per the contract in [house-style.md](./house-style.md), **matching the project's reader**:
`title`, `description`, `keywords` (~3-6), `categories` (usually one, from a small reused taxonomy;
always a list), `author` (project default or a named human), and `date` = today's real date from
`date +%F` (**quoted**; do not guess). Slug = kebab-case of the title; verify unique against existing
posts.

### 7. Hero image (default ON) - via /scribekit-hero
Hand the post's hero to the **[/scribekit-hero](../scribekit-hero/SKILL.md)** skill's **blog-hero** create
flow: on first use it seeds the project's `hero.settings.js` from the brand (its own Step 0 brand
discovery); then it writes the post's `<slug>/hero.js` params, renders an on-brand hero, saves the JPEG
to the project's assets dir, and sets the `image:` frontmatter. Locate the installed skill (first that
exists): `<this-skill-dir>/../scribekit-hero/SKILL.md`, `.claude/skills/scribekit-hero/SKILL.md` (from the
project root or `$HOME`), or `node_modules/@daanvandenbergh/scribekit/skills/scribekit-hero/SKILL.md`; then
follow its `blog.md` create flow for this slug (single-language blog = one JPEG; multi-language =
per-locale, see step 8). **If `/scribekit-hero` isn't installed**, skip the hero, leave `image:` unset, and
tell the user to install it to add one. **Skip on opt-out** too (`--no-hero` / "skip the image").

### 8. Write the file
**First, seed the content-dir README (once, never overwrite).** Ensure a `README.md` exists at the
**root of the blog content dir** (`<contentDir>/README.md`, resolved in Step 0). If it is missing, copy
this skill's template into it **verbatim** from the first path that exists:
`<this-skill-dir>/assets/content-dir-README.md`, `.claude/skills/scribekit-blog/assets/content-dir-README.md`,
or `node_modules/@daanvandenbergh/scribekit/skills/scribekit-blog/assets/content-dir-README.md`. It warns
humans and AI agents that this directory is **live website content, not scratch space** - so the caution
ships into the implementer's own repo, not just this skill. A root-level `README.md` is a file, so
scribekit's reader ignores it (it only walks `<slug>/` subfolders) and it never becomes a post. **If a
`README.md` already exists, leave it untouched.**

Write the post as `<slug>/<locale>.<ext>` in the project's blog content dir (frontmatter + body),
where `<locale>` is the blog's default locale code (e.g. `en.mdx`). **Strongly favor the
locale-named file over `post.<ext>`** so every file in the folder is named by its language -
`en.mdx` beside `fr.mdx` reads far cleaner than `post.mdx` beside `fr.mdx`. (`<slug>/post.<ext>`
still resolves as a language-neutral fallback, but prefer `<locale>.<ext>`.)
**Multi-language blogs** (locales detected in Step 0): the default-language post is
`<slug>/<defaultLocale>.<ext>` (e.g. `en.mdx`); a post in a non-default language `<lang>` is
`<slug>/<lang>.<ext>` in the **same folder**. The language is the file's name, **never** a
frontmatter field.

**When the blog has i18n configured, a new post is not finished until it exists in every
configured locale.** Write the **default-language** post first, then - by default, without being
asked - produce a **dedicated translated post for each other configured locale** (via the
"Translating an existing post" flow below, including its per-language hero), so `<slug>/` ends up
holding one file per language. Do **not** stop after the default language and do **not** treat the
translations as optional follow-up work - they are part of writing the post. Only skip the other
locales if the user explicitly opts out (e.g. "default language only" / `--no-translations`). Print
which locales you wrote.

**Translating an existing post** (asked to render `<slug>` in `<lang>`): read the default-language
source (`<slug>/<defaultLocale>.<ext>`, e.g. `en.mdx`, or the `post.<ext>` fallback), then write
`<slug>/<lang>.<ext>` in the same folder, translating `title`,
`description`, `keywords`, and the body while preserving structure, heading order/anchors, and the
frontmatter contract. **Render a language-specific hero** per the localised-heroes rule in
**[/scribekit-hero](../scribekit-hero/blog.md)**: add the translation's title/subtitle to the post's single
`<slug>/hero.js` (a `(locale) => params` map, reusing the same gradient), and render its JPEG to
`<assets>/blog/<slug>/hero.<lang>.jpg` - never point a translation's `image:` at the default-language
hero, since the hero bakes in title/subtitle text. Keep internal links pointing to same-language
routes.

### 9. Verify
- Frontmatter parses; body has no stray/unclosed JSX and no extra `#` H1.
- Every internal link points to a real route/post; external URLs are live.
- The hero renders crisp at full size **and** legible when scaled to a card thumbnail.
- **Self-score against the rubric in [seo-checklist.md](./seo-checklist.md); treat ~90 as a floor,
  not a target** - revise if below. Self-scores inflate; the real check is the independent audit handoff.
- Print the **sources list** in chat.
- Offer a browser check: **ask the user to start the dev server** (never start it yourself), then
  use Chrome MCP to load the post's route and verify rendering + clean console.

### 10. Hand off
Suggest an independent audit pass: invoke this skill in **rewrite --scan** mode on the new slug.

## Guardrails
- Never fabricate statistics, quotes, sources, or named customers/cases. Unsupported -> cut or soften.
- Never start a dev server (project rule). Never create git branches.
- Keep changes scoped to the new post + its hero asset - **plus** the one-time content-dir `README.md`
  (Step 8), seeded from `assets/content-dir-README.md` only when absent, never overwritten.
