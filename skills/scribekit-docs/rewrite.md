# Task: rewrite

Independently audit one existing documentation page (MDX) for the **current project's** docs site
**against the current code, and apply the fixes**. Source-driven: this task **re-verifies every
documented fact against the real source**, it doesn't just proofread. You should already have done
**Step 0** (learned this project - the `Docs` wiring, the corpus, and the real product code) from
`SKILL.md`, and read [../scribekit-blog/house-style.md](../scribekit-blog/house-style.md),
[../scribekit-blog/research-protocol.md](../scribekit-blog/research-protocol.md), and
[docs-style.md](./docs-style.md). If not, do that now.

**Two behaviours, set by the argument:**
- **default (`rewrite`)** - run the full audit (Steps 1-10), then **apply** every fix directly
  (Step 11), up to a substantial rewrite. This is the normal mode.
- **`--scan`** - run the audit and print the report **only**. Change **no** files, apply **no** fixes;
  stop after Step 10. This is opt-in and report-only.

## Procedure

### 1. Load the page
Resolve the argument to a file: a slug -> `<contentDir>/<slug>/<defaultLocale><ext>` (where
`<defaultLocale>` is what the `Docs` config resolves to, from Step 0 - `en.mdx` only when it resolves
to `en`; falls back to `post<ext>`) or a direct path. For a **multi-language** docs site, a translation
is `<contentDir>/<slug>/<lang><ext>`; resolve the requested language (a bare slug = the default
locale). Read frontmatter + body.

### 2. Accuracy vs code (mandatory)
For every documented fact - each option name, default, method signature, `readonly` field, route, CLI
flag, and **code sample** - open the **real source** and mark it, recording the source `file:line`:
✅ correct, ⚠️ **stale** (renamed option, changed default, moved path, a sample that no longer runs),
❌ **wrong** (describes something that does not exist / never did). **Dead or incorrect code samples are
a hard fail.** Read from source, never from memory; use `WebSearch`/`WebFetch` only for a genuinely
external cited fact.

### 3. Completeness
Does the page cover the **current** behaviour, or has the product gained options / methods / fields /
flags the page omits? For a reference page especially, diff its documented surface against the real
`*Config` / class surface. Note every gap.

### 4. Structure / type audit
- **Single Diátaxis type?** ([docs-style.md](./docs-style.md)) - or has it blended (a reference that
  drifts into tutorial, a how-to that teaches concepts)? Blended -> flag to split or relocate.
- **Right type for its slot?** (a page under a "Guides" tab that is actually reference).
- **Type-scoped completeness**: reference missing params/defaults; a tutorial whose golden path is
  broken or missing a step; a how-to that stops before the task is done; an explanation that no longer
  matches the current design.

### 5. Freshness + slot
`updated:` current relative to the last material change; the page sits in the right **tab/group/order/
icon** slot (reconstructed from front-matter per Step 0, **not** by calling
`getNavTree`/`getAllDocs`/`getDoc`); not
mis-slotted, not orphaned, not duplicating a sibling; breadcrumb / prev-next make sense. **Check YAML
types**: a quoted `order`, a stringy `hidden`, or a comma-string `keywords` is silently dropped by the
reader - the page will have lost that field ([docs-style.md](./docs-style.md)).

### 6. Anti-slop scan (scoped for docs)
Flag every banned vocabulary/filler word from [../scribekit-blog/house-style.md](../scribekit-blog/house-style.md),
and any heading that is not a sentence-case question/task, skipped heading levels, a manual H1, or a
blog-style pull-quote / soft CTA that doesn't belong in docs. Any violation of the **project's
punctuation rule** (e.g. an em-dash where the project bans it) is a fail. **Do not** flag uniform
sentence rhythm / rule-of-three / low burstiness - those are correct in reference and how-to.

### 7. Light metadata check
Run the **light metadata check** in [docs-style.md](./docs-style.md): `title` **and** `description`
present, non-empty, and accurate; `keywords`; `image` a leading-slash root path that exists; opens
answer-first for its type; sections standalone; internal links root-relative and resolving;
`docMetadata`/`docJsonLd` will populate. (Not the blog 100-point GEO rubric.)

### 8. Voice consistency
Compare register, neutrality, and terminology consistency (one term per concept) to the project's
voice and its strongest existing docs page (Step 0). Note where it drifts marketing-flavoured,
inconsistent in terms, or off the page's type.

### 9. Verify hero image (only if the surface uses heroes)
`DocMeta.image` is **optional** and a docs surface may ship heroless. **If this page has no `image:`
and no sibling page does either, that is not a defect** - note it and move on; do **not** push to
generate one or to seed a `hero.settings.js`. Only when the page (or its siblings) actually use heroes,
check it per **[/scribekit-hero](../scribekit-hero/docs.md)**: the `<slug>/hero.js` params **exist**, the
`image:` file **exists** and is a leading-slash root path wired in frontmatter; it uses a **valid
gradient** from the docs `hero.settings.js` and is **on-brand** (matches sibling docs heroes); correct
ratio (~1200x630, an **opaque JPEG** - not a rounded PNG); **title legible** at full size and card
scale. **Translations**: language-specific hero (own
`<assets>/docs/<slug>/hero.<lang>.jpg`, same gradient) - flag one pointing at another language's file.
Missing or off-brand -> recommend **/scribekit-hero** `docs-hero`; gradients themselves off ->
**/scribekit-hero** `tune-gradients docs`.

### 10. Report
Output, in this order:
1. **Accuracy** - the ✅/⚠️/❌ list, each with the real **source `file:line`** and the correct value.
2. **Completeness + structure** - the coverage gaps (Step 3) and the type/slot findings (Step 4).
3. **Prioritized fix list** - most impactful first, each concrete and actionable.
4. **Metadata / voice / hero** - the light-check result, voice notes, and the hero verdict from step 9.
5. **Sources used** - any genuinely-external facts cited, per the research protocol.

### 11. Apply fixes
**If `--scan` was passed, stop after Step 10** - the report is the deliverable; do not modify any file.

Otherwise (default), apply the fix list: edit the page directly - up to a substantial rewrite - trace
every correction to source, and bump `updated:` to today's date (`date +%F`, quoted). Fix the YAML
types if any were wrong. If the hero needs work, run the relevant **/scribekit-hero** mode. Then re-print
the final fix summary noting what changed. Don't rewrite beyond what the audit found.

## Guardrails
- Never invent a "correct" API detail - every correction is read from the real source and carries its
  `file:line`. `DocMeta` has no `author`/`categories`; never hand-write JSON-LD.
- Don't touch anything but the page being rewritten + its hero. With `--scan`, touch **nothing**.
- Never start a dev server; never create git branches.
