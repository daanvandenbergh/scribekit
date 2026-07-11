# Task: deep-verify

Prove the **whole docs corpus** is still true against the current code and safe to deploy. Where **rewrite**
audits one page and **reorganize** audits the corpus's *structure*, this mode audits the corpus's *content* -
every page, every locale, in parallel - and then computes the defects that **only the union of all those
pages can reveal**. You should already have done **Step 0** (learned this project - the `Docs` wiring, the
corpus, the real product code) from `SKILL.md`, and read [docs-style.md](./docs-style.md). If not, do that now.

**Why this mode exists.** Per-page verification already exists: it is [rewrite.md](./rewrite.md) Steps 2-9.
Running it on N pages is a `for` loop, not a mode. **This file therefore restates not one per-page check** -
`rewrite.md` stays the single source of truth for what "verified" means, and the subagents are simply told to
run it. What earns the mode its existence is **Phase 0** (a brief computed once, so N agents never re-derive
it) and **Phase 2** (the reduce step): a page can be individually perfect while the corpus is broken. Two
pages can each pass their own audit and still contradict each other. A page can be correct against `src/` and
wrong against the package users actually install. Nobody auditing one page can see any of that.

`reorganize` already assumes this pass exists - its Step 8 hands content problems off to "a `rewrite` pass"
but cannot tell you *which* pages need one. **deep-verify is the pass reorganize is handing off to.**

**Behaviour:** report-first, always. Nothing is edited until you approve specific findings (Phase 4).
**`--scan`** prints the report and stops, without offering the gate.

## Phase 0 - Build the shared brief, once

The parent enumerates; the agents only judge. **Do not make N agents re-derive what one pass can compute** -
that is the whole cost model of this mode. Assemble the brief, write it to a scratchpad file, and pass its
**absolute path** to every subagent:

1. **The `Docs` wiring** from Step 0: resolved `contentDir`, `basePath`, `extension`, `defaultLocale`,
   `prefixDefaultLocale`, `locales`, and the `tabs`/`groups` config.
2. **The project's whole public surface** - run [write.md](./write.md) **1a** exactly as written (package
   exports, public class methods and `readonly` fields, `*Config` options + their constructor defaults,
   components, routes, CLI flags only if there is a `bin`), each as `{ id, kind, source: file:line,
   signature/default }`. `write.md` **1c** then diffs this against the corpus and **1d throws all but one
   result away** ("Rank, pick **ONE**"). Here we keep the whole diff - it is check **C1**.
3. **The corpus map** - every `<contentDir>/<slug>/` folder and **every locale file in it**, with all
   front-matter. Include `hidden` pages: they are still routable, and a hidden page nothing links to is
   unreachable.
4. **A heading/anchor index per page** - the `##`/`###` ids each page exposes. Without this, no one can tell
   whether `/docs/config#retries` resolves; the anchor lives on the *target* page, not the linking one.
5. **Ground truth from the real reader, if it runs.** Step 0 says you cannot call
   `getNavTree`/`getAllDocs`/`getDoc` because `Docs` is `server-only`. That is true through the package
   **barrel under plain `node`** - and false under the **`react-server` export condition**, which is the
   condition the users' framework actually resolves. Try it:

   ```bash
   node --conditions=react-server --input-type=module -e "
     const { Docs } = await import('<the built package entry>');
     const d = new Docs({ /* the project's real config, from its _docs.ts */ });
     console.log(JSON.stringify({
       nav: d.getNavTree('<defaultLocale>'),
       adjacent: d.getAdjacent('<some-slug>'),
       toc: d.tableOfContents(d.getDoc('<some-slug>')),
       sitemap: d.sitemapEntries(),
     }, null, 2));
   "
   ```

   When it runs, you have the **real** nav, prev/next, breadcrumb, TOC anchors, hreflang, and sitemap -
   not a simulation of them. Verifying a deployment against the reader users actually execute is the point
   of the mode. **If it throws** (no build output, no wired instance, a different framework), fall back to
   Step 0's reconstruction rules and **say plainly in the report which of the two you used** - a
   reconstruction presented as ground truth is worse than no check.

## Phase 1 - Fan out: one subagent per page

Spawn **one `general-purpose` agent per slug, all in one message** so they run concurrently. Keep to
**~10-12 concurrent**; a larger corpus runs in a second batch (say so in the coverage line - a silently
truncated corpus is the one failure this mode must never have).

**One agent per slug, not per locale file.** The agent reads **every** locale file of its slug, because
translation drift is an intra-slug, cross-file check that `rewrite` - which loads a single language -
structurally cannot make.

Give each agent this task, filled in:

> You are one of several agents verifying a docs corpus page-by-page against the project's real source code.
> Your page is the slug **`<slug>`**, and **every** locale file in `<contentDir>/<slug>/` is yours.
>
> **Read `<abs>/rewrite.md` first: run its Steps 2-9 on your page, under `--scan` semantics.** That file is
> the definition of "verified" - accuracy vs code, completeness, Diátaxis type, freshness + slot, anti-slop,
> the light metadata check, voice, hero. Also read `<abs>/docs-style.md` and `<abs>/../scribekit-blog/house-style.md`,
> which it depends on. Do not invent checks it does not name, and do not skip ones it does.
>
> The shared brief is at `<abs-brief-path>` - the `Docs` config, the project's full public API surface with
> `file:line` for every symbol, the corpus map, and the anchor index. **It is your starting point, not your
> evidence: every fact you assert must be re-read from the real source.** Where the source's own JSDoc
> disagrees with the executed behaviour, **the executed behaviour wins** - comments drift.
>
> Beyond rewrite.md's steps, one check it cannot make because it only ever loads one language: compare your
> slug's locale files against the default-locale original. Report a translation that is **missing entirely**,
> has lost sections the original gained, states a fact the original has since corrected, or whose code-sample
> comments were translated (samples must stay copy-paste-runnable).
>
> Framing: **assume this page has drifted from the code. Find where.** "It looks fine" usually means it was
> not read against source.
>
> Return findings as flat blocks in exactly this schema - **group nothing, sort nothing**, the parent orders them:
>
> ```
> - id: <slug>#<n>
>   file: <path>
>   line: <n>
>   category: stale-default | wrong-api | dead-sample | translation-drift | slop | frontmatter | link | hero
>   claim: "<what the page tells the reader>"
>   truth: "<what the source actually says>"   # with its file:line
>   severity: Critical | High | Medium | Low | Info
>   confidence: high | medium | low
>   fix: <concrete, traced to source>
> ```
>
> If a locale file is clean, emit `<path>: clean` - so the parent can prove it was read, not skipped.
> **Do not spawn sub-agents. Do not modify any file.** Return only the findings and the clean list.

**Severity** is the ecosystem's ladder: **Critical** = a reader following this page fails right now (dead
sample, an API that does not exist, a broken install step). **High** = wrong on a load-bearing fact (a default,
a signature). **Medium** = incomplete or mis-typed. **Low** = voice, slop, polish. **Info** = observation.
**Confidence** is separate and drives Phase 3.

Then **confirm coverage**: every slug came back either with findings or as `clean`. Re-dispatch any that did
not. No page goes unread.

## Phase 2 - Reduce: the checks no single page can see

This is why the mode exists. Compute each from the N reports plus the Phase 0 brief.

- **C1 Undocumented public API surface.** The full `write.md` 1c diff, kept whole: every capability in the
  brief that **no page mentions**. A corpus-level absence - no individual page is "missing" it.
- **C2 Documented-but-deleted APIs.** The union of every agent's `wrong-api` findings, deduplicated into one
  finding per dead symbol with the list of pages that cite it.
- **C3 Cross-page contradictions.** Two pages giving different defaults or signatures for the same option.
  Note the subtle class, and the only one that is *structurally* invisible: **conflicting prescriptions with
  no source anchor** ("prefer X" on one page, "prefer Y" on another). There is no `file:line` to check those
  against, so **both pages pass their own audit** and only the corpus view catches it.
- **C4 Terminology drift.** One concept, two names across pages (`contentDir` / "content dir" / "the docs
  directory"). `rewrite` Step 8 checks one term per concept *within* a page; consistency *across* pages is
  only visible here.
- **C5 Link graph.** Links to slugs that do not exist; links to `hidden` pages; **dead anchors** (resolve
  against the target page's headings from the brief); **orphans** (a page nothing links to - lethal combined
  with `hidden`, which removes it from nav, breadcrumb, prev/next and index, leaving it unreachable); and
  **per-locale target existence** - `fr.mdx` correctly links `/fr/docs/x`, but `x/fr.mdx` was never written,
  so the link "resolves to a real slug" and still 404s in French.
- **C6 Translation drift, corpus-wide.** Aggregate the agents' per-slug drift findings, and add the one they
  cannot see: a slug **missing a configured locale entirely**. `write.md` Step 8 mandates that a page "is not
  finished until it exists in every configured locale" - and nothing in the skill has ever enforced it.
- **C7 Reading-order coherence.** Prev/next crosses group *and* tab boundaries, so the corpus has one linear
  reading order whether or not anyone designed it. Walk it (from the executed reader if Phase 0 got one) and
  flag jumps that read as nonsense.
- **C8 Stale `updated:`.** For each page, `git log -1 --format=%as -- <the source files its facts traced to>`
  versus its `updated:`. Treat this as a **prioritizer, not a defect**: a refactor or whitespace commit to a
  traced file is not a material change. Cross it with the page's own findings - a page whose sources moved
  *and* which has Critical/High findings is the one to fix first.
- **C9 Code samples typecheck.** Extract every ` ```ts `/` ```tsx ` fence and run **one batched**
  `tsc --noEmit`. Beware the trap: a sample imports the package by its published **name**, which usually does
  not self-resolve inside its own repo - rewrite the specifier to the built entry, or **skip the check
  cleanly and say so**. Skip if the project has no tsconfig. Do **not** build a sample runner; this is one
  compile pass or nothing.
- **C10 Published-artifact drift.** The deployment-readiness check, and the one no other check can make:
  diff the documented surface against the **shipped** package, not just `src/`. Compare `package.json`'s
  version to the published one (`npm view <name> version`) and confirm the symbols pages tell readers to call
  actually exist in what `npm install` delivers. A page can be true against the working tree and **wrong for
  every reader who installed the package** - it passes accuracy, freshness, and sample checks, and still
  hands the reader a `TypeError`.
- **C11 Getting-started integrity.** Is there still a page walking the **current** wiring end to end
  (install -> instance -> routes -> a rendered page)? If the wiring changed and no page followed, that is a
  Critical, and it belongs to no single page.

## Phase 3 - Falsify, then collapse

**A wrong finding is worse than a missing one.** Re-verify every `medium`/`low` confidence finding yourself by
reading the spot (or hand a batch to one skeptical verifier agent). Drop the false positives. A finding whose
"truth" you cannot re-read from source is not a finding.

Then **collapse repeats**. One banned word on 12 pages is **one** finding with 12 sites, not 12 findings; a
stale default cited by 4 pages is one finding with 4 sites. Report the affected-page count. This is what keeps
a large corpus's report readable without ever truncating it.

## Phase 4 - Report, then gate

Print, in this order:

1. **The verdict, in one line** - the **worst unfixed severity**. Any unfixed Critical or High = **not ready
   to deploy**. This is the question the mode was run to answer; answer it first.
2. **Corpus findings** (`C1`..`Cn`), then **page findings** (`<slug>#<n>`), each **grouped by severity,
   Critical first**. Every finding carries its `file:line`, the claim, the truth with its source `file:line`,
   and the proposed fix.
3. **The coverage line** - pages verified, pages that came back clean, anything skipped and **why** (a second
   batch, a skipped typecheck, a reconstruction instead of the executed reader). "Not reported" must never be
   mistaken for "clean".

**If `--scan` was passed, stop here.** Otherwise close with exactly this:

> Reply `approve` to apply all, `approve <ids>` for a subset, or `skip`.
> Add a note in parentheses after any id to steer the fix - e.g. `approve quickstart#2 (keep the bash sample), C3`.

Then **wait**. Edit nothing until the reply lands.

## Phase 5 - Apply the approved findings

Work through the approved ids **one page at a time**, applying [rewrite.md](./rewrite.md) Step 11's rules:
edit the page directly, **trace every correction to real source** (never to this report - re-read the source
as you fix), honour any note the user attached to that id, and bump `updated:` to today's date
(`date +%F`, quoted) **only on pages you actually changed**. Fix nothing that was not approved. On a
multi-language page, carry a content fix into **every** locale file, or the fix creates the very translation
drift C6 exists to catch.

**Findings the user did not approve are dropped.** Do not write them to `TODO.md`, do not persist a report,
do not re-raise them. The next run will find them again if they still matter.

Then print what changed, per page, and re-state the verdict now that the approved findings are fixed.

## Phase 6 - Hand off what this mode must not fix

- **Nav / slot / structure problems** -> **`reorganize`**. You will *detect* these (duplicate `order` inside a
  group, `tab`/`group` literal drift, dead `_docs.ts` entries, cross-locale slot drift) because you hold every
  page's front-matter. **Report them and stop.** Fixing them here would duplicate `reorganize` and put two
  modes in charge of the nav.
- **Undocumented API surface (C1)** -> **`write`**, one page per gap. Name the suggested slug, tab, and group.
- **A page whose body is a different Diátaxis type than its slot** -> `rewrite` that slug, or `reorganize` if
  the slot is what is wrong.

## Guardrails

- **Never fabricate an API detail.** Every asserted truth is re-read from real source with a `file:line`.
  Where JSDoc and executed behaviour disagree, **the executed behaviour wins**.
- **Never edit before approval**, and never edit anything outside the approved findings.
- **Never rename a slug** and never restructure the nav - that is `reorganize`.
- **Subagents never write.** They verify and report; the parent applies.
- Never start a dev server (ask the user). Never create git branches.
