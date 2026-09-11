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
- **One `>` blockquote per post**, a pull-quote that distils the thesis. Not more. **It may not carry
  a claim the body has not already made and sourced** - a pull-quote says something new only by
  inventing it. Distilling means sharpening, and a sharpened statistic is how a sourced post becomes
  a wrong one; see the source-fidelity pass in [research-protocol.md](./research-protocol.md).
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
- **Complete the branch the median reader is in.** When advice depends on the reader's situation
  (their legal form, their country, their plan), finish the branch most readers occupy - a
  paragraph that reassures via the OTHER branch's carve-out is a truth that misleads (a post told
  one-van sole traders the register's privacy line protects legal entities, and never said what
  that means for a sole trader).
- **Handle the audience's real objections** directly (derive them from the project + audience).
- **Explain the mechanism, don't stack testimonials.**
- **Don't over-polish** - a little plainspoken and real reads as trustworthy; glossy reads as fake.

## Banned AI-slop (hard fails) - universal

**Vocabulary - never ship these or close variants** (a living list - models drift, so when an
editor flags a new tell, append it here):
delve, tapestry, realm, underscore, leverage (as filler), robust, seamless, elevate, boast(s),
multifaceted, foster, meticulous, comprehensive, unlock, harness, supercharge, cutting-edge,
game-changer, revolutionary, best-in-class, pivotal, showcase, streamline, paradigm, synergy,
transformative, vibrant, intricate, "navigate the complexities", "in the realm of",
"a testament to", "ever-evolving".

**Filler phrases / empty transitions:**
"In today's fast-paced world", "In the digital age/landscape", "It's important to note", "It's
worth noting", "Needless to say", "When it comes to…" (as an opener), "At the end of the day",
"Let's dive in / explore", "Let's break this down", "Here's the kicker", "Rest assured", "plays a
crucial/vital role", stacked "Moreover / Furthermore / Additionally", "Importantly / Interestingly /
Notably" as sentence openers, "In conclusion / In summary / To sum up".

**Verb dodges:** "serves as", "stands as", "functions as", "represents" (for "is"), "boasts",
"features" (for "has") - write the plain verb. And the **trailing interpretive participle**: a
sentence that ends ", highlighting its importance" / ", ensuring reliability" / ", reflecting
broader trends" is analysis bolted on without evidence - either the point earns its own sourced
sentence or it goes.

**Structural / rhythmic tells (individually survivable, fatal when stacked - cap each):**
<!-- MIRRORED VERBATIM in assets/style-verifier-prompt.md - edit both, or the verifier judges by a different spec. -->
- **Negative parallelism**: "not just X, but Y", "It's not X - it's Y". Ban as a reflex - **and
  count the disguised forms against the same cap**: a standalone negation-pivot sentence ("Others
  do not.", "The pattern does not.", "Not under the usual rate.") is the same move with the comma
  removed. A post that audited clean on the literal pattern shipped six of these. **The cap: ≤2
  per locale, OR the number the CALLER PINS as the designated calibration post's count under the
  forms below.** That number is counted ONCE, by a maintainer, and written into the caller's
  prompt; **a run never re-counts the calibration post to set the cap** - five raters counted the
  same file at 3, 4, 7, 8 and 12, and two runs picked pivot-heavier pipeline-written siblings and
  gave themselves caps of 9 and 13. No pinned number means 2. A ceiling below the house's own best
  writing rejects the voice it exists to protect, which is why the pin exists; a ceiling that
  floats with the rater protects nothing. Same count in every locale.
  **Words inside a verbatim quotation of a source are the source's cadence, not the author's** -
  a quoted statute's "skills, knowledge, experience and behaviours" is not the writer's tricolon
  and a quoted regulator's "not X but Y" is not the writer's pivot; neither is counted. This is
  the ONE quotation exemption, and it lives here, not in a prompt.
  **THE COUNTED FORMS, enumerated - two honest raters once counted 3 and 10 on the same file, so
  the list, not judgement, is the standard. Each of these is ONE pivot:**
  - `not just X, but Y` / `It's not X - it's Y` / `isn't about X, it's about Y` (the comma pivot)
  - `X. Others do not.` / `The pattern does not.` (standalone negation sentence answering the
    previous one)
  - `Not under the usual rate.` / `Not through the register.` (a "Not ..." fragment or opener)
  - `cost is not what rules it out. The shape is what rules it out.` (the split form - negation in
    one sentence, replacement in the next)
  - `the contract, not the number` / `a mechanism and not a forecast` (the "X, not Y" appositive)
  - `...and you are not.` / `...is not something a missed call gives you.` (trailing negation
    that flips the frame)
  - `You have not published your margin. You have published the floor.` (the negation-antithesis
    pair)
  - `Neither the number nor the trade survives.` (neither/nor as a pivot)
  Data-bearing negations that report a source's finding ("the survey found most did NOT...") are
  content, not pivots. **And a topic warning: an X-vs-Y comparison topic breeds this device** -
  the contrast is the thesis, so write it as a pivot ONCE and let plain assertion carry it
  everywhere else; budget the pivots before drafting.
- **Staccato negation closers**: "Not X. Not Y. Just Z." / "No fluff. No filler." - the same pivot
  chopped into fragments. Ban.
- **Rule-of-three abuse**: any THREE-PARALLEL-ITEMS rhythm built for effect - adjective triples,
  three parallel clauses, three stacked negations, "X, Y, and Z" thesis sweeps, three parallel
  images. Counting only adjective triples is how a post shipped six tricolons under a cap of one.
  Max **one** intentional triple per post; vary list lengths. **A bare data or spec enumeration is
  content, not the tell**: "54%, 37% and 20%" reporting three survey cuts, or the three fields a
  form takes, is information that happens to have three items - the cap is on rhetoric. When in
  doubt ask whether a fourth item would change the sentence's music or just its facts: music =
  tricolon.
- **Anaphora abuse**: three sentences opening with the same word.
- **Self-posed rhetorical question answered instantly**: "The result? A win." Use once at most.
- **False ranges**: "from startups to enterprises" where the poles aren't a real scale.
- **Vague attribution**: "experts say", "studies show", "research suggests" with no name/link.
  Every claim carries a real source (see `research-protocol.md`) or gets cut.
- **Invented concept labels** that sound analytical but mean nothing.
- **Uniform sentence length** (see Burstiness) and **pedagogical hand-holding** (explaining the
  obvious to an expert reader).
- **Epigram saturation**: the paragraph-final short punch ("That premium is the product.") is a
  good device that becomes a metronome when most paragraphs end on one - cap it at about half the
  paragraphs, and vary where in the paragraph the punch lands.
- **Hollow intro** that restates the title, and **summary conclusion** that recaps instead of
  resolving - and at section level: a section's first sentence may not restate its heading, and a
  close must add something (a recommendation, a number, a next step), never re-say.
- **Bold-label-colon as the default bullet shape** everywhere: fine for a genuine tactics list (the
  formatting section allows it), a tell when every list in the post wears it. Vary.
- **Hedge stacking**: "can potentially help to, in some cases" - one hedge is honesty (and if the
  SOURCE hedged, its hedge is untouchable - see the research protocol); three are a dodge. Assert
  what you can source, cut what you can't.
- **The shuffle test**: if the `##` sections could be reordered and the post reads the same, it is
  coverage, not an argument. Order sections so each needs the one before it.

**And the over-correction trap:** a post that is ALL four-word punches, fragments, and "Here's the
thing" swagger is the newest tell of all - the model imitating anti-slop advice. The target is a
sharp human's natural range, not the inverse of the ban list. **The calibration post is the density
meter**: count its pivots, triples, fragments and paragraph-final epigrams before writing, and do
not exceed its per-section density - the caps above are ceilings, the calibration post is the
target, and "the house's best devices, everywhere, at maximum" reads as imitation, not voice. Vary
the SHAPE of section openings too: answer-first does not mean the same terse fragment five times -
open one section with the number, one with the scene, one with the plain sentence.

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
