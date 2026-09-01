# Research Protocol

Shared by the **write** and **rewrite** tasks. Thorough research is the non-negotiable that
separates this skill from generic AI writing. **Never write a factual claim from memory. Never
invent a statistic.** If you can't source it, cut it or soften it to a qualitative statement you
can defend. This is also a ranking and AI-citation lever, not just honesty: cited sources and
concrete stats measurably lift AI-answer citation (see the GEO figures in
[seo-checklist.md](./seo-checklist.md)) - so good sourcing does double duty.

**The ban covers invented *experience*, not just numbers.** Subject-generic texture that anyone in
the field would recognise is fair game and is exactly the insider detail you want. But a *specific*
named customer, a particular case study, a dated event, or a "someone I know…" anecdote is
fabrication unless it is real and verifiable - and many projects (especially early-stage ones) have
no public casework yet, so do not manufacture it. Concrete-but-generic, yes; concrete-and-invented,
never.

## Tools

- `WebSearch` - find current sources. Bias to recent results (the current year / last 18 months)
  for anything time-sensitive (stats, prices, versions, market data).
- `WebFetch` - open a specific source and extract the exact figure, quote, or claim, plus the
  publication date and publisher. Prefer primary sources.

## Source quality ladder (prefer higher)

1. **Primary / authoritative**: official bodies, standards orgs, government/industry datasets,
   original research, the organisation that published the data. (Which bodies are authoritative
   depends on the project's domain - identify them from Step 0.)
2. **Reputable secondary**: established trade press, well-known expert blogs - especially when they
   cite their own data.
3. **Aggregators / listicles**: only to *find* a primary source, then cite the primary one. **Never
   cite the aggregator itself** - not even when it is a real company with a real research page, if
   the number on that page is somebody else's. A statistics round-up that re-reports a survey is a
   secondary source wearing a primary source's clothes: open the study it is quoting and cite that,
   or drop the number.

Avoid: undated content-farm articles, SEO spam, AI-generated roundups, anything you can't trace to
a real publisher and date.

## Loop

1. **Frame the questions.** Before searching, list the 4-8 specific things the post must establish
   (each stat, claim, or comparison). Research answers them, not vibes.
2. **Search -> fetch -> record.** For each claim: search, open the best source, extract the exact
   figure and the source's date. Record
   `{claim, number, WHAT IT MEASURES, THE SOURCE'S OWN SENTENCE, source URL, publisher, date}` in a
   running sources list.
   **The last two fields are not bookkeeping - they are what the fidelity pass below runs against.**
   *What it measures* is the population and the question actually asked ("adults in the US and UK who
   had bought in the last 12 months, asked which they would prefer if offered both"), never just the
   topic. *The source's own sentence* is copied verbatim, because by the time you are editing the
   draft you will no longer remember what the number was attached to, and the draft will look right.
3. **Corroborate load-bearing stats.** If a number carries the argument, confirm it in a second
   independent source. Note disagreement; prefer the more authoritative / more recent.
4. **Check recency.** Reject stats older than ~3 years for fast-moving topics unless citing them as
   historical. Slower-moving fundamentals age more gracefully - use judgement.
5. **Find the information-gain angle.** Skim what already ranks for the target keyword and the
   "People Also Ask" box. The post must add something they don't have: a sharper opinion, a worked
   example, a counter-take, first-hand detail, or primary data. Don't rewrite the consensus.

## Fidelity: a number is only as true as the sentence it sits in

Getting the digits right is the easy half, and passing it feels like being finished. **The failure
that actually ships is a REAL number attached to a claim its source never made** - and it survives
every check that looks for invented statistics, because nothing about it is invented.

A published post carried "the 64% who say they'd rather not talk to AI were asked to choose between
an AI and a person". The 64% was real, correctly attributed, correctly dated, and linked to the
issuing body's own press release. But that survey asked whether people would *prefer companies
didn't use AI in customer service* - a preference question that offered no alternative at all. The
number for people who chose a human *when offered both* was a different study's, and it was 59%. The
post had both studies in its own sources list and welded one's figure to the other's finding.

So, before a number goes in:

- **THE SCOPE TRAVELS WITH THE NUMBER.** "AI in customer service" does not become "AI". "Buyers in
  the US and UK" does not become "customers". Widening a scope makes a claim bigger than its
  evidence; narrowing it ("asked whether they wanted an AI *answering the phone*") is worse, because
  it asserts the study measured something specific that it did not.
- **NEVER STATE HOW A QUESTION WAS WORDED, OR WHAT RESPONDENTS WERE OFFERED, UNLESS THE SOURCE SAYS
  SO.** "They were asked to choose between X and Y", "every one of them was offered a human",
  "respondents who had already tried it" are claims about an instrument, and they are checkable.
  This is the single most common way a sourced post becomes a wrong one.
- **A COMPARATIVE IS A CLAIM.** "More X than Y", "most", "fewer", "twice as likely", "the majority"
  assert a measurement. Carrying no digits does not make one safe - it makes it harder to catch. Only
  write a comparison the source actually drew.
- **A QUANTIFIER TRAVELS WITH ITS OWN CLAIM AND NOTHING ELSE.** If the source says most people do A,
  and separately that people who do A then do B, it has NOT said most people do B. Welding the two
  manufactures a finding out of one measured half and one rhetorical half.
- **YOUR OWN RHETORIC IS NOT A SOURCE EITHER.** A line you wrote to sharpen a point ("every survey on
  this subject offers people a human") reads, three paragraphs later, exactly like something you
  looked up. If you cannot point at the sentence that measured it, mark it as the opinion it is or
  cut it.

## Citing in the post

Keep it clean prose, not an academic paper - don't litter with footnotes. Instead:
- **Attribute inline** when it adds authority ("Google's Core Web Vitals guidance puts the LCP
  target at 2.5 seconds").
- **Link the phrase** to the source with a normal Markdown link for the strongest 1-3 external
  references. Use credible, stable URLs, and confirm they're live before shipping.
- **Front-load the fact** in the sentence, not the tail - retrieval chunks can truncate, and the
  stat is the quotable unit.
- Every concrete number must be traceable to the sources list, even if not every one is hyperlinked.
- **Aim to be the original, quotable source** of at least one framing or worked number - being the
  source others cite is the strongest AI-citation signal there is.

## Output: sources list

Both tasks must surface the sources used (printed in chat, **not** in the post unless asked):

```
Sources used:
- <claim/stat> - <number> - measures: <population + the question actually asked> - <Publisher>, <date> - <URL>
- ...
```

The `measures:` field is the one that earns its keep. Without it the list proves only that the number
exists somewhere, which is exactly the check the failure above passed.

The **rewrite** task uses this same protocol in reverse: take each factual claim in an existing
post, find a current source, and flag anything unsupported, stale, or contradicted.
