# Task: rewrite

Independently audit one existing post (MDX) for the **current project's** site **and apply the
fixes**. Research-driven: this task **re-verifies the facts**, it doesn't just proofread. You should
already have done **Step 0** (learned this project) from `SKILL.md`, and read
[house-style.md](./house-style.md), [research-protocol.md](./research-protocol.md), and
[seo-checklist.md](./seo-checklist.md). If not, do that now.

**Two behaviours, set by the argument:**
- **default (`rewrite`)** - run the full audit (Steps 1-8), then **apply** every fix directly
  (Step 9), up to a substantial rewrite. This is the normal mode.
- **`--scan`** - run the audit and print the report **only**. Change **no** files, apply **no**
  fixes; stop after Step 8. This is opt-in and report-only.

## Procedure

### 1. Load the post
Resolve the argument to a file: a slug (-> `<content-dir>/<slug>/<defaultLocale>.<ext>`, e.g. `en.mdx`,
or the `post.<ext>` fallback, from Step 0) or a direct path. For a **multi-language** blog, a
translation is `<content-dir>/<slug>/<lang>.<ext>`; resolve
the requested language (a bare slug means the default locale). Read frontmatter + body.

### 2. Fact-check (mandatory)
For every concrete claim, statistic, date, version, price, or named fact: `WebSearch`/`WebFetch` for
a current authoritative source per [research-protocol.md](./research-protocol.md). Mark each:
✅ supported (cite source), ⚠️ stale/outdated (give the current figure + source), ❌ unsupported or
contradicted (explain, with source). Flag any **invented named customer/case** as a hard fail.

### 3. Anti-slop scan
Flag every banned phrase/word and structural tell from [house-style.md](./house-style.md) - negative
parallelism, adjective triples, dash addiction, repeated openings, vague attribution, hollow
intro/summary conclusion, uniform sentence rhythm. Give each its line and a concrete rewrite. Any
violation of the **project's punctuation rule** (e.g. an em-dash where the project bans it) is a fail.

### 4. SEO audit
Run the on-page checklist in [seo-checklist.md](./seo-checklist.md): title front-loads keyword;
description benefit-led; natural keyword placement (no stuffing); heading hierarchy; answer-first
opening; 3-5 internal (to **real project routes**) + 1-3 external links (**verify they resolve**);
image alt text; frontmatter completeness (`keywords`, `categories`, `author`, `image`, quoted
`date`/`updated`). **Multi-language:** internal links stay within the post's own language; a
translation shares the base slug with its siblings and carries the same frontmatter fields; flag
translation gaps (e.g. a default-language post with no counterpart in a language the blog claims).

### 5. GEO / AI-answer audit
Per the GEO section of [seo-checklist.md](./seo-checklist.md): opening answer-first? each section
standalone-quotable with its answer up front? concrete stats with named sources + inline citations?
question-shaped headings? core term defined in an extractable sentence? facts front-loaded? Flag
what's missing.

### 6. Voice consistency
Compare register, opinion, concreteness, and burstiness to the project's voice and its strongest
existing post (Step 0). Note where it drifts generic, pedagogical, or salesy, and whether it earns
trust with the site's actual audience (proof over adjectives, honest trade-offs, one soft CTA).

### 7. Verify hero image
Check the post's hero per **[/scribekit-hero](../scribekit-hero/blog.md)**: the post's `<slug>/hero.js` params source
**exists**, the `image:` file **exists** and is wired in frontmatter; it uses a **valid gradient
option** from `hero.settings.js` and is **on-brand** (matches the other posts' heroes - same layout,
baked-in brand identity, and gradient family); correct
dimensions/ratio (~1200x630, ~1.91:1); **white title legible** at full size and when scaled to a card
thumbnail; the `<img alt>`/title is descriptive. **Translations**: the hero is language-specific per
the localised-heroes rule (own `<assets>/blog/<slug>/hero.<lang>.jpg`, hero text in the post's language,
same gradient as the default-language hero) - flag a translation whose `image:` points at another
language's hero. Missing or off-brand -> recommend **/scribekit-hero** `blog-hero` (create/update); if the
gradients themselves look off (banding, off-brand hues) -> **/scribekit-hero** `tune-gradients`.

### 8. Report
Output, in this order:
1. **Score** - the 100-pt rubric from [seo-checklist.md](./seo-checklist.md), broken down by
   category, each with a one-line justification, plus the hero verdict from step 7.
2. **Fact-check results** - the ✅/⚠️/❌ list with sources.
3. **Prioritized fix list** - most impactful first, each concrete and actionable.
4. **Sources used** - per the research protocol.

### 9. Apply fixes
**If `--scan` was passed, stop here** - the report is the deliverable; do not modify any file.

Otherwise (default), apply the fix list from Step 8: edit the post directly - up to a substantial
rewrite - and bump `updated:` to today's date (`date +%F`, quoted). If the hero needs work, run the
relevant **/scribekit-hero** mode. Then re-print the final fix summary noting what changed. Keep every correction
sourced (below); don't rewrite beyond what the audit found.

## Guardrails
- Never invent a "correct" statistic - every correction must carry a live source.
- Don't touch anything but the post being rewritten + its hero. With `--scan`, touch **nothing**.
- Never start a dev server; never create git branches.
