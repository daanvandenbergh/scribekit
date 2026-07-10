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
3. **Aggregators / listicles**: only to *find* a primary source, then cite the primary one.

Avoid: undated content-farm articles, SEO spam, AI-generated roundups, anything you can't trace to
a real publisher and date.

## Loop

1. **Frame the questions.** Before searching, list the 4-8 specific things the post must establish
   (each stat, claim, or comparison). Research answers them, not vibes.
2. **Search -> fetch -> record.** For each claim: search, open the best source, extract the exact
   figure and the source's date. Record `{claim, number, source URL, publisher, date}` in a running
   sources list.
3. **Corroborate load-bearing stats.** If a number carries the argument, confirm it in a second
   independent source. Note disagreement; prefer the more authoritative / more recent.
4. **Check recency.** Reject stats older than ~3 years for fast-moving topics unless citing them as
   historical. Slower-moving fundamentals age more gracefully - use judgement.
5. **Find the information-gain angle.** Skim what already ranks for the target keyword and the
   "People Also Ask" box. The post must add something they don't have: a sharper opinion, a worked
   example, a counter-take, first-hand detail, or primary data. Don't rewrite the consensus.

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
- <claim/stat> - <number> - <Publisher>, <date> - <URL>
- ...
```

The **rewrite** task uses this same protocol in reverse: take each factual claim in an existing
post, find a current source, and flag anything unsupported, stale, or contradicted.
