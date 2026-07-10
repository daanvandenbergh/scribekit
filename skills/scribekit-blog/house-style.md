# Blog House Style (project-adaptive)

Shared by the **write** and **rewrite** tasks. The goal: posts that read like a sharp human who
knows the subject wrote them - not like an AI filled a template - **in the current project's own
voice**. This file carries the universal craft; the *voice* itself you derive from the project
(Step 0 in `SKILL.md`).

## Derive the voice from the project (don't impose one)

- **Calibrate against the project's strongest existing post** and its landing-page copy (from
  Step 0). Match its register, sentence rhythm, level of formality, and how much opinion it takes.
  When the project has a voice/brand doc, follow it.
- If the project has **no** posts yet, infer the voice from the site copy and audience, propose a
  one-line voice description, and use it consistently.

Whatever the voice, the craft below makes it read human rather than machine. These are universal.

## Voice craft (applies to any register)

- **Concrete over abstract.** A specific number, named thing, or real example beats a vague
  adjective every time. Replace "improves performance" with the actual figure or mechanism.
- **Confident, not hype.** No exclamation marks, no "game-changer / revolutionary / best-in-class".
  Readers trust fact over superlative.
- **Second person, active voice.** Talk to the reader ("you"); do the verbs; avoid passive
  constructions.
- **Take a position** a machine would hedge on - where the project's voice allows it.
- **Earned brevity.** Short declaratives land hard after a longer setup. Cut ~30-50% of the first
  draft; one idea per paragraph.
- **Insider detail** only someone who knows the subject would write - the texture generic AI can't
  fake. **But invent nothing specific:** subject-generic detail is fine; a *named customer*, a
  *particular case*, a dated event, or a "someone I know" anecdote is fabrication unless it is real
  and verifiable (many early-stage sites have no real casework - don't manufacture it). See
  [research-protocol.md](./research-protocol.md).

## Burstiness (this is what beats the AI-detector feel)

Uniform sentence rhythm is the single biggest tell of machine writing. Vary it hard:
- Mix a 4-word sentence against a 30-word one. **Concrete check:** if 3+ consecutive sentences land
  within ~5 words of each other in length, the rhythm is machine-flat - break it.
- Prefer the surprising-but-right word over the predictable one - never at the cost of clarity.
- One thought per sentence, every sentence, in a row = a robot. Combine some, fragment others.

## Formatting (MDX)

- Most MDX blog templates render the `<h1>` from frontmatter `title`, so **the body typically
  starts at `##`**. Confirm against the project's post renderer (Step 0) and follow it - never emit
  a second H1 if the template already renders one.
- `##` for sections, `###` for sub-points. Logical hierarchy, no skipped levels. Phrase headings as
  the **question a reader (or an AI answer engine) would actually ask** where it's natural.
- `**bold**` the key phrase in a line - sparingly, to anchor a scan. *Italics* for a single
  emphasised word, not whole sentences.
- **One `>` blockquote per post**, a pull-quote that distils the thesis. Not more.
- Tight bullet lists when enumerating concrete items; prose everywhere else. Lead each bullet with a
  **bolded label** when listing tactics.
- **Comparison tables** (`| … |` Markdown) are encouraged where you're contrasting options: they
  scan cleanly *and* are prime for AI-answer extraction. Don't force one where prose is clearer.
- **Dashes: follow the project's convention.** If the project's `CLAUDE.md` bans em-dashes (`—`) -
  as many do - use a spaced hyphen ` - ` instead. Ration dashes regardless (≤1 per paragraph);
  em-dash/aside addiction is a classic AI tell.
- Inline `code` only for genuine technical terms/filenames.
- Images: plain Markdown `![descriptive alt](...)` or `<figure>`, using **local paths** the site
  serves (many sites' CSP blocks remote images). The post's **hero image** is created separately -
  by the **[/scribekit-hero](../scribekit-hero/SKILL.md)** skill.

## Structure of a post (answer-first / inverted pyramid)

1. **Answer-first opening.** The first paragraph gives the answer and the payoff in ~40-50 words -
   no "In this post we'll explore" throat-clearing. This wins featured snippets and AI citations.
2. **2-5 `##` sections**, each making one argument, ordered so they build. Front-load each section:
   the point first, the detail after (readers scan in an F-pattern).
3. **Each section should stand alone** - a passage lifted out of context still answers its heading.
   That's how both Google snippets and AI answer engines quote you.
4. **One pull-quote** near the middle or end.
5. **A close that resolves and points to one clear next step**, tied to what the project offers -
   but earned, not a sales pitch bolted on. Exactly **one** soft CTA (an invitation, not "BUY NOW").

**Length: as long as the topic genuinely needs, no padding.** Word count is not a ranking factor;
topical coverage is. Cover the subtopics a reader actually needs, then stop.

## Trust & conversion (match the audience, keep it honest)

- **Proof over adjectives.** A real number, named scenario, or concrete mechanism beats any
  superlative. If you can't back a claim, cut it.
- **Name the honest trade-off** - where the project's thing *isn't* the answer. Acknowledging the
  limit up front is what makes the rest believable.
- **Handle the audience's real objections** directly (derive them from the project + audience).
- **Explain the mechanism, don't stack testimonials.**
- **Don't over-polish** - a little plainspoken and real reads as trustworthy; glossy reads as fake.

## Banned AI-slop (hard fails) - universal

**Vocabulary - never ship these or close variants:**
delve, tapestry, realm, underscore, leverage (as filler), robust, seamless, elevate, boast(s),
multifaceted, foster, meticulous, comprehensive, unlock, harness, supercharge, cutting-edge,
game-changer, revolutionary, best-in-class, "navigate the complexities", "in the realm of",
"a testament to", "ever-evolving".

**Filler phrases / empty transitions:**
"In today's fast-paced world", "In the digital age/landscape", "It's important to note", "It's
worth noting", "Needless to say", "When it comes to…" (as an opener), "At the end of the day",
"Let's dive in / explore", "Let's break this down", "Here's the kicker", "Rest assured", "plays a
crucial/vital role", stacked "Moreover / Furthermore / Additionally", "In conclusion / In summary /
To sum up".

**Structural / rhythmic tells (individually survivable, fatal when stacked - cap each):**
- **Negative parallelism**: "not just X, but Y", "It's not X - it's Y". Ban as a reflex.
- **Rule-of-three abuse**: back-to-back adjective triples ("fast, reliable, and effective"). Max
  **one** intentional triple per post; vary list lengths.
- **Anaphora abuse**: three sentences opening with the same word.
- **Self-posed rhetorical question answered instantly**: "The result? A win." Use once at most.
- **False ranges**: "from startups to enterprises" where the poles aren't a real scale.
- **Vague attribution**: "experts say", "studies show", "research suggests" with no name/link.
  Every claim carries a real source (see `research-protocol.md`) or gets cut.
- **Invented concept labels** that sound analytical but mean nothing.
- **Uniform sentence length** (see Burstiness) and **pedagogical hand-holding** (explaining the
  obvious to an expert reader).
- **Hollow intro** that restates the title, and **summary conclusion** that recaps instead of
  resolving.

## Frontmatter contract

**Match the project's reader** (Step 0) - it defines which fields are parsed and required. The
common shape:

```yaml
---
title: "Short, specific, front-loads the primary keyword"
date: "2026-07-07"            # real publish date, from `date +%F`. QUOTE IT (see below).
description: "Benefit-led, includes primary keyword. Meta + OG source."
keywords:                     # optional, ~3-6
    - primary keyword
    - secondary
categories:                   # 1 (occasionally more), from a small reused taxonomy; always a list
    - Guides
author: "…"                   # optional; match how the project defaults it
image: "/…/<slug>/hero.en.jpg"  # the hero image (see /scribekit-hero); local path the site serves
updated: "2026-07-07"         # optional; set when the post is materially revised
---
```

- **Quote every date** (`date:` and `updated:`). Many YAML/frontmatter parsers turn an unquoted
  `date: 2026-07-07` into a timestamp object that a string-typed reader then drops. Quoting is the
  safe default; confirm against the project's reader.
- `title` and `description` are the SEO title/meta - write them as such. See
  [seo-checklist.md](./seo-checklist.md).
- **Categories** power the blog overview's filter buttons. Assign **one** (occasionally more)
  from a **small, consistent taxonomy reused across posts** so the filters actually group -
  reuse an existing category label verbatim rather than coining a near-duplicate. Always a YAML
  list, even for a single category. If the project's reader has no category field, omit it.
- Slug = kebab-case of the title, deduped against existing posts.
- **Language is the file's location, never a frontmatter field.** Each post is a `<slug>/` folder;
  the default-language post is named by its locale, `<slug>/<defaultLocale>.<ext>` (e.g. `en.mdx`),
  and a translation is `<slug>/<lang>.<ext>` in the same folder (e.g. `<slug>/fr.mdx`), sharing the
  **same slug**. **Favor the locale-named default (`en.mdx`) over `post.<ext>`** so the whole folder
  is named by language; `post.<ext>` still resolves as a fallback. Do not add a `lang:` field - the
  reader derives it from the file name, and a stray field would just drift.
- **Author & E-E-A-T:** if the project defaults the author to an org name, that's fine, but a
  **named human with a one-line credential** is a stronger experience/authority signal for Google
  E-E-A-T *and* AI answer engines - prefer one whenever a real person stands behind the post. Don't
  invent a persona.
- `image` is the post's **hero** - produced by the **[/scribekit-hero](../scribekit-hero/SKILL.md)** skill
  and expected by default on new posts.
