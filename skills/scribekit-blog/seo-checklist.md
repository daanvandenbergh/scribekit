# SEO + GEO Checklist & Scoring Rubric

Shared by the **write** and **rewrite** tasks. Two jobs, not one: rank in classic search (**SEO**)
*and* get quoted by AI answer engines - Google AI Overviews, ChatGPT, Perplexity, Claude (**GEO /
AEO**). They overlap heavily and GEO tactics don't hurt SEO, but they are not the same discipline.
Optimise for both.

**First, learn what the project already emits** (Step 0). Most MDX blog setups auto-generate, from
frontmatter, per-post canonical URLs, `article` OpenGraph, and `Article`/`BlogPosting` +
`BreadcrumbList` JSON-LD, and include posts in a sitemap. **Confirm which of these the project
actually does** (read the post renderer + check for a `sitemap`/`robots` file) and give those
mechanisms good inputs - accurate, complete frontmatter and a well-structured body. Don't hand-add
schema the project already emits. If a mechanism is **missing** (e.g. no sitemap), note it and lean
harder on internal linking; flag it for the user rather than silently assuming coverage.

## On-page SEO checklist

**Keyword & intent**
- [ ] One clear **primary keyword/phrase** from real search intent (informational for blog posts).
      **Read the live SERP for it first** and match the dominant format (guide vs. comparison vs.
      list) - the ranking pages are Google's own answer key.
- [ ] 2-4 **secondary keywords** / semantic variants + the related **entities** the topic needs
      covered (topical depth is the on-page factor now, not raw length).
- [ ] Primary keyword appears **naturally** in: `title`, `description`, the first ~50-100 words, and
      at least one `##` heading. **Never stuff** - keyword stuffing is now an active negative for
      both SEO and AI citation. Read it aloud; if forced, cut it.

**Title (`title` frontmatter = SEO title)**
- [ ] **Front-load the payload** (keyword/benefit first). Google rewrites ~60%+ of titles and
      truncates around ~580px/~60 chars, so the tail is expendable - the front is not.
- [ ] Specific and compelling - a reason to click, not just a label.

**Meta description (`description` frontmatter)**
- [ ] ~120-155 chars, benefit-led, includes the primary keyword. Treat as CTR copy, but expect
      Google to rewrite it - so put the same fact in the body too.

**Structure**
- [ ] Body starts at the level the renderer expects (usually `##`; the H1 is the rendered title -
      exactly one H1 per page).
- [ ] **Answer-first**: the opening answers the query in ~40-50 words (wins featured snippets and AI
      citations). Inverted pyramid throughout - point first, detail after.
- [ ] Logical heading hierarchy, no skipped levels; headings **phrased as the real question** a
      reader/AI would ask, mined from "People Also Ask" where natural.
- [ ] Scannable: short paragraphs (one idea each), a list or two, a pull-quote, bolded anchors.

**Linking** (use the project's real routes, from Step 0)
- [ ] **3-5 contextual internal links** to relevant existing pages of *this* site (its key
      product/service/pricing/about pages and sibling posts) - **discover them; never invent a
      route** or link a page that 404s.
- [ ] **Descriptive, varied anchor text** (not "click here", not the same exact anchor twice).
- [ ] **1-3 external links** to credible sources (per the research protocol).
- [ ] All links resolve - internal routes/posts exist; external URLs are live.

**Media**
- [ ] Every image has descriptive, specific `alt` (not "image" or the filename).
- [ ] The post has a **hero image** (see the **[/scribekit-hero](../scribekit-hero/SKILL.md)** skill) - a
      local file the site serves, ideally ~1200x630 for social cards.

**Frontmatter / structured-data completeness** (feeds the auto-emitted schema)
- [ ] `title`, `date` (quoted!), `description` present and valid.
- [ ] `keywords` set (~3-6).
- [ ] `categories` set (usually one, from a small reused taxonomy; always a list) - drives the
      overview's category filters.
- [ ] `author` set (or intentionally defaulted). A **named human with a one-line credential** is a
      stronger E-E-A-T + AI-trust signal than an org byline - prefer it when a real person is behind
      the post.
- [ ] `image` set to the hero (becomes per-post OG/Twitter + JSON-LD `image`).
- [ ] `updated` set (quoted) when revising an existing post - freshness is a live signal.

## GEO / AI-answer-engine checklist (the SOTA layer)

Get quoted by the answer engines, not just ranked. Every item is evidence-backed:

- [ ] **Answer-first per *section*.** Open each `##`/`###` with a 1-2 sentence direct answer, then
      elaborate. Sections that don't state their answer standalone don't get selected - even if the
      page ranks.
- [ ] **Standalone-quotable passages.** One concept per section; don't fuse a definition with a
      how-to or bury a stat mid-narrative. Assume each passage is lifted out of context.
- [ ] **Concrete statistics with named sources** (GEO study: ~+41% visibility) - numbers beat
      adjectives.
- [ ] **Inline citations to credible external sources** (~+115% for mid-ranked pages) - the single
      biggest lever. Link them.
- [ ] **A named-expert quotation** where one genuinely fits (~+28%).
- [ ] **A one-sentence definition** of the core term early - the extractable "X is Y" unit.
- [ ] **Front-load the fact** in each paragraph's first sentence (chunks can truncate the tail).
- [ ] **Fluent, authoritative prose** - clarity itself measurably lifts citation.
- [ ] **Freshness**: real `date`, and `updated` when revised.
- [ ] **Clean semantic structure** (proper headings, lists, tables) for reliable chunking.

## What changed - myths to actively avoid (2026)

- ❌ **FAQPage / HowTo schema for rich results** - deprecated; FAQ rich results were removed from
      Google Search in 2026 and HowTo earlier. Add an on-page FAQ only if it helps readers.
- ❌ **A word-count minimum** ("must be 1,500+ words") - not a ranking factor. Adding words without
      structure gives ~0 AI-citation lift.
- ❌ **Keyword density targets / stuffing** - measurably *worse* than baseline for AI citation.
- ❌ **Obsessing over exact title/meta character counts** - Google rewrites most; front-load instead.
- ❌ **`llms.txt`** - no major AI system uses it (Google confirmed); don't spend effort on it.
- ❌ **Treating hand-added schema/JSON-LD as a GEO lever** - controlled tests show ~no citation
      uplift. Emit the schema that matters for rich results (usually the project already does);
      that's enough.
- ❌ "click here" / identical repeated anchors, orphan posts, thin consensus rehash.

## Scoring rubric (100 points)

Used by the **rewrite** task to score a post. The **write** task self-scores before finishing and
does not ship below ~90 (a state-of-the-art bar, not a passing grade).

- **Content & Research - 25** - every factual claim/stat sourced and current (−5 each unsourced or
  stale load-bearing claim); clear information gain vs. what already ranks.
- **SEO & discoverability - 20** - intent matched to SERP format; title front-loads keyword;
  description benefit-led w/ keyword; natural placement (no stuffing); heading hierarchy; 3-5
  internal + 1-3 credible external links, descriptive/varied anchors, all resolving; frontmatter
  complete.
- **GEO / AI-answer extractability - 15** - answer-first opening *and* per section; passages
  standalone-quotable; stats + inline citations; question-shaped headings; core term defined;
  front-loaded facts.
- **Voice & Anti-slop - 20** - matches the project's voice; **zero banned phrases** (any banned
  phrase caps this category at ≤10); burstiness present; structural AI tells absent; no template feel.
- **Technical & MDX - 10** - valid MDX (parses, no stray/unclosed JSX); body starts at the right
  level; project punctuation rules honoured; local image paths; valid quoted-date frontmatter;
  JSON-LD will populate correctly.
- **Readability & conversion - 10** - scannable, well-paced, clean grammar, no padding; audience
  trust markers present; exactly one soft, non-salesy CTA.
- **Hero image** - not scored numerically here; the rewrite's **Verify hero** step (see `rewrite.md`)
  gates it separately: present, on-brand, correct ratio, legible at card scale, descriptive alt.

Report the score **per-category with a one-line justification** and a **prioritized, concrete fix
list** (most impactful first). Never report a bare number without the fixes.
