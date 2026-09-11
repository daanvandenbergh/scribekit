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
for the information-gain angle. Keep the running sources record with the protocol's full row per
claim (population, question, as-of date, kind, **the source's verbatim sentence**, URL, tier) -
research happens BEFORE drafting so the record constrains the draft, not the other way round.
Claims about the current project's own product are repo-checked per the protocol. **No claim from
memory; no invented stat or anecdote.**

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
3. **Tic audit - run THE SCRIPT, never your own regexes.** Four runs in a row under-counted their
   own tics with self-authored sweeps, so the meter is now code:
   `node <skill-dir>/assets/style-tics.mjs <each locale file>` (locate the skill dir the same way
   step 8 locates /scribekit-hero). It prints, with line numbers: em-dashes, ban-list hits,
   negation pivots, tricolons, staccato shapes, epigram density, section-opening shapes,
   flat sentence runs, and the digit-gate extraction. **It over-flags by design**: adjudicate
   every hit in printed output (a real hit is fixed; a false positive is argued in one line,
   never silently ignored), and the count that stands AFTER adjudication must be within each cap.
   Run it on the calibration post too and put the two outputs side by side - the calibration post
   is the density target. Re-run the script after every edit round, on every locale.
   **The script is a regex, and pivots/tricolons are semantic - so the caps are FINALLY bound by
   a fresh style-verifier, not the script.** A run shipped seven pivots the script counted as one
   ("not marketing copy - it is evidence" has no grep shape). When the draft is otherwise final,
   send ONE fresh subagent **`<skill-dir>/assets/style-verifier-prompt.md`, verbatim, with
   `<<FILES>>` replaced by the file list, `<<STYLE_OUT>>` by `<ledger-basename>.style.json`, and NOTHING else changed** - each locale, the hero
   params file (hero.js escaped every closer for three runs) and the calibration post. Build the
   prompt BY CODE (a substitution, never a retype), save the text you sent as
   `<ledger-basename>.style-prompt.txt`, and expect it to be diffed against the asset: a run
   appended "a quotation of a source's own words is CONTENT - do not count it" to the
   definitions and pre-decided its own hits (the exemption now lives in house-style.md, where it
   belongs; the parent authors nothing). ITS counts bind the caps; **the pivot cap is the number
   the caller pins (house default 2) - never the verifier's count of the calibration post** (five
   raters counted one file at 3, 4, 7, 8 and 12). Over a cap: cut, re-send the file, repeat until
   it passes; overrule one of its
   hits only by quoting the line and arguing it in printed output. **Its prompt is written to a
   file on round 1 and later rounds send that same file's text byte-identically** - four
   mid-loop prompt revisions once carved categories away one exemption at a time. **Save its
   returned JSON UNCHANGED** - `cp` the task's output file when there is one; when the verifier
   answered inline, write the returned block byte-for-byte (a "verbatim" re-type once dropped
   lines and another swapped a word) - and the same rule applies to fact-verifier returns. The
   proof is not the method but the result: the saved JSON is byte-equal to the return and its
   `sha256` values match the shipped files. **Save the verifier's returned JSON verbatim to the
   caller-designated style-report path** (else print it in full): the file is the proof the step
   ran - two consecutive runs silently skipped this step, and a missing style JSON is how the
   skip becomes visible. **Every style hit's resolution is ALSO a line in a file** -
   `<ledger-basename>.style-resolution.txt` beside the sources record, one line per hit from
   the script AND from the verifier: `<file>:<line>: fixed` or `<file>:<line>: overruled - <the
   argument itself>` (that exact prefix, e.g. `en.mdx:40:`), written before the closing summary;
   the final `--check --post-dir` requires it, fails when it predates any content file, and
   re-runs `style-tics.mjs` itself: every hit the script prints on the shipped files without a
   matching line is UNARGUED and fails the check - and it reads `.style.json` the same way, so
   every line the verifier listed on a post file needs its line too. A run promised three times to "argue the script's remaining tricolon hits in the
   final report", was resumed four times, and never wrote a word of it; the file is the only
   accepted form of the argument. `acted-on`/`fixed` means an edit happened - "no edit needed"
   is `refuted`/`overruled`.
4. **Specificity** - replace every vague claim/adjective with a number, name, or example; kill vague
   attributions.
5. **Cut 30-50%** - delete the hollow intro, any signposted/summary conclusion, and padding.
6. **Scannability** - headings, bolded anchors, short one-idea paragraphs, a list or two.
7. **Skeptic test** - would a sharp member of the audience call this fluff? Add proof or delete.
8. **CTA check** - exactly one, soft, a natural next step.

### 6. Source-fidelity pass (AFTER the anti-slop pass, never before)
**This pass exists because the previous one causes the damage it catches.** Step 5 sharpens and
compresses on purpose - "replace every vague claim with a number", "cut 30-50%" - and sharpening a
sentence is exactly what detaches a figure from the question it answered. A draft that was accurate
before the editorial pass can be wrong after it, and it will read *better*, which is why nobody
notices.

Take every factual claim in the finished draft and put it beside the source's own sentence from your
notes (see the `measures:` field in [research-protocol.md](./research-protocol.md)). For each, ask:

1. **Same population?** The source's respondents, not a wider or narrower group.
2. **Same question?** Have you said or implied what was asked, what was offered, or who was
   excluded - and does the source actually say that?
3. **Same scope?** No silent widening ("AI in customer service" -> "AI") or narrowing.
4. **Same strength?** No "most"/"more than"/"twice as" the source never measured.
5. **Still one claim?** You have not welded a quantifier from one finding onto another.
6. **Still the same source?** The attribution is part of the claim: naming a source as more
   authoritative than it is widens the claim without touching the number. A state consumer centre
   is not "Germany's consumer body"; one carrier's page is not "the networks". The issuer's own
   name and rank travel with the number - watch the pull-quote, where a long name gets "distilled"
   into a bigger one.
7. **A table cell is a sentence.** Expand each cell to the assertion it makes with its row and
   column headers ("NL | EUR 95 incl. VAT" asserts the source said *including VAT*) and hold it to
   the same entailment bar - compression into a cell is exactly where a frame the source never
   stated gets added. The hero subtitle and image alt text are sentences the same way. **And the
   `description` is the post's most-read sentence and the one written LAST, by compression** - put
   it beside the body's own thesis sentence and check it carries the same hedge: a body that said
   demand "does not spread itself evenly over four months" shipped a description saying it "lands in
   a few cold days, not across a season", stronger than any source and than the body itself.

**Check the PULL-QUOTE first and hardest.** It is the highest-risk line in the post by construction:
its whole job is to distil the thesis, distilling means sharpening, and it is lifted out of the
paragraph that carried the qualifier. A published post's pull-quote invented a survey's wording this
exact way. **A pull-quote may not carry a claim the body has not already made and sourced** - if it
says something new, it is unsourced by definition.

Fix by returning the qualifier, not by softening the prose into mush: the accurate version is usually
just as punchy, and often punchier, because it says something specific.

Then three mechanical closes - each catches a failure that has actually shipped:

1. **The digit gate - the LAST edit wins, so the gate runs LAST.** After every other edit is done
   (anti-slop, fidelity fixes, all of it), sweep EVERY locale's file AND the hero params file
   (`hero.js` - its title/subtitle are sentences): body, `title`, `description`, pull-quote, image
   alt text, table cells. **The token list comes from `style-tics.mjs`'s extraction section,
   CONSUMED from the script's own output - never re-derived by hand** (a run's hand-rolled
   replacement sweep dropped six of the script's tokens, one a live unrowed quantifier; the
   standard lists live in the script, so the sweep can never be seeded by the numbers you
   already know are in the post), and
   **the resolution is printed PER TOKEN**: each mapped to its ledger row id, or to the
   arithmetic/date/config literal that excuses it. An excusal names the token, never a line class
   ("everything on the frontmatter lines" would bless a new fabricated number there) - and PASSING
   tokens get the same per-token line as failing ones: a run that itemised only its failures and
   waved the passes through as "URL literals, dates, arithmetic" ran the exact excusal this rule
   bans, then reported "every token resolved per token" anyway. A bare count
   plus "all clean" is not a gate:
   - every digit-bearing token traces to a row in the sources record (or is arithmetic the post
     itself shows, or a date/path/config literal). A number with no row is fabricated by
     definition, however plausible - it goes, now. Dates and prices count. **Rhetoric is not
     exempt**: "in the first two minutes" is a checkable claim wearing a flourish - it loses its
     number or gains a row. **Numbers written as words count**: "a factor of eight", "a quarter",
     "three in four" dodge a `\d` grep - sweep the number-words too. **Normalise locale formats
     before matching**: `43.690` and `43,690` are the same number, and a separator false-positive
     you shrug off teaches you to shrug off the real one.
   - every quantifier and comparative traces the same way - and **each locale is swept in its own
     language**: for the English list (*most, majority, almost, never, always, typical(ly),
     usually, rare(ly), more than, fewer, twice, half*) build the equivalent list per locale
     (Dutch: *meeste, bijna, nooit, altijd, meestal, vaker, dubbel, helft, ...*) before sweeping.
     An English-only sweep gates one locale and blesses the rest.

   **The gate passes only when its output is CLEAN and FINAL**: every line of gate output resolved
   (fixed, or shown to be arithmetic/date/false-positive with the sweep corrected so it stops
   matching) - a non-empty unmatched list is a failing gate, never a footnote.

   **The run ends on a QUIET ROUND.** The digit gate and the style-verifier are BOTH closers, and
   every edit re-opens both: no post/hero file may be newer than the last gate output AND the last
   saved style JSON. If the gate forces a word change, the changed file goes back to the style
   verifier (and its JSON is re-saved) and the gate re-runs; loop until a round makes zero edits.
   Two rules keep the loop honest and finite:
   - **THE FINAL AUDIT - a fresh auditor on the finished text, before the final check.** Every
     post that shipped a false claim under this protocol shipped one the row-by-row verifiers never
     saw: a description stronger than its body, an availability claim with no current list, an
     instruction with a condition missing, a limb applied without the rule that selects it. Those are
     SHAPES on the whole text, and a fresh reader hunting them found one in every run. So, after the
     last edit and both closers: spawn ONE fresh subagent with `<skill-dir>/assets/final-audit-prompt.md`
     verbatim, `<<FILES>>` (each locale + hero.js), `<<LEDGER>>`, `<<SKILL_DIR>>`, `<<REPO>>` and `<<AUDIT_OUT>>`
     (= `<ledger-basename>.final-audit.json`) substituted and nothing else changed. **The verifiers
     WRITE their own answer files** - the verdicts, style and audit JSON are theirs, byte for byte;
     the parent never writes, retypes or edits one (a re-typed verdicts file once dropped 41
     characters of a note). **A PASS ends editing.** Its MINOR and INFO findings are
     listed in the closing summary, never fixed - a post-PASS edit makes the audit stale, which
     forces another audit, which finds another minor, and a run spent twelve audit rounds and
     eighteen edit batches ($150) chasing its own polish. On a FAIL: fix ONLY the CRITICAL and
     MODERATE findings, at every restatement in every locale (a fix is a new claim - row, verifier
     round, applied), in ONE batch; re-run the closers once; then re-audit by sending
     `<skill-dir>/assets/final-audit-followup.md` verbatim (`<<AUDIT_OUT>>` substituted) to the SAME
     auditor (SendMessage to the agent that produced the last audit) - **rounds two and three are
     the same reader confirming its own findings on the changed text, not a fresh hunt**: a fresh
     strict reader each round reads the whole post with a different threshold and finds the next
     borderline sentence, and a run spent ten audits and never converged. At most THREE audit rounds. If the third still returns a MODERATE, CUT the offending claim
     (delete the sentence, or its restatements) rather than reword it again, and run one last audit
     on the cut text - a cut cannot fail. The final `--check --post-dir` refuses to go green while
     the audit is missing, predates the text (its `sha256` map is recomputed: STALE-AUDIT) or holds
     an open CRITICAL/MODERATE (OPEN-FINDING) - an audit you disagree with is answered by a narrower
     sentence or a cut, never by editing the JSON.
   - **Prove the quiet round mechanically**: the run's LAST action on the post, its hero or any
     proof file is
     `node <skill-dir>/assets/ledger-verdicts.mjs <ledger> --check --post-dir <post dir>`, output
     printed - it fails STALE-PROOF when any proof file beside the ledger (`.gate-resolution.txt`,
     `.style-resolution.txt`, `.style.json`, `.notes-resolution.txt`, the ledger itself)
     predates any content file in the post dir, and MISSING when one does not exist. A `stat`
     read by eye proved nothing three times (one run edited the post 30 seconds after saving its
     gate file); the check's printed output is the proof. **`touch` on a proof file is forgery**,
     not a fix - a run cleared a STALE-PROOF that way after a late edit; the style verifier now
     reports the sha256 of every file it read and the check recomputes them (STALE-STYLE), so
     the only way to postdate an edit is to re-run the step. A prose note in the artifact ("the
     post-verification delta was benign") is self-certification, exactly what three runs did;
     an edit either goes back through both closers or does not happen. **Postdating is necessary
     but not sufficient**: a style round is VOID if any content file changed between the
     verifier's read and its JSON save (a background rater once measured a text the parent had
     already edited, and the save still postdated everything) - after ANY edit, re-send; only a
     round whose read and save bracket zero edits closes the run. **A declared VOID is a DEBT**:
     rename the round's JSON `*-void.json` the moment you declare it, and the binding artifact
     may only come from a verifier SPAWNED AFTER that declaration - a run promised "re-sending
     the identical prompt for the binding round", was resumed by the harness, never spawned it,
     and copied the void round's file back as `.style.json` under a "both closers clean" summary.
     A `*-void.json` never becomes the binding artifact, whatever it is renamed to. **After ANY
     harness resume/continuation, your first act is to re-read your own last messages and pay any
     promised-but-unrun step** - a resume does not reset your obligations. This generalizes:
     **prose is not execution** - ANY announced step ("I'll apply these", "I'll argue each
     below") is a debt only the tool call pays, resume or not; before the closing summary,
     re-read your own transcript for announced-but-unrun steps and pay them.
   - **Converge by BATCHING**: collect every desired edit, apply them in one batch, then run both
     closers once; at most two more such batches. A run that polishes one idiom per round ran 15
     Dutch rounds; a third batch still failing its caps means stop polishing and ship the last
     version BOTH closers passed. Do not invent new verifier categories or channels mid-run -
     the defined categories are the contract.
   - Save the per-token gate resolution to `<ledger-basename>.gate-resolution.txt` beside the
     sources record - that exact name (three runs each invented a different one), one line per
     token per FILE in the form `L<n> <token> -> <row id / arithmetic / date-config>` (the final
     `--check --post-dir` re-runs the extraction over every content file and fails UNRESOLVED for
     any token without a line naming its `L<n>` and the token - "the nl set is identical, noted
     at its own line" covered eight Dutch quantifiers that had no line, and "no tokens for
     hero.js" was written over an extraction the run had filtered out of every printout: never
     `head` or `grep -v` the script's output); "see resolution
     list" must name a file that exists. **"I printed the resolution instead" is not a
     substitute** - one run skipped the file with exactly that sentence; the final
     `ledger-verdicts.mjs --check --post-dir <post dir>` requires this file and fails when it
     predates any content file, so a missing or stale file is a failed close, mechanically. Print
     script outputs in full - a `head -N` that truncates a findings printout suppresses
     findings. And the run's closing summary states what the artifacts show, in their terms
     ("resolution file at <path>") - never a strengthened gloss of it.
2. **The consistency pass.** The post may not disagree with itself: prose vs table vs pull-quote vs
   frontmatter must attribute the same facts to the same subjects (a shipped post's prose gave one
   company a code its own table said belonged to another). Read the tables and the pull-quote
   against the paragraphs that cite the same rows. Two more self-disagreements that shipped:
   **one figure, one rounding** - 446 seconds is "about seven and a half minutes" or "7:26",
   never also "seven minutes" a sentence later; and **one concept, one term** - the pull-quote and
   the body may not name the same thing differently (a Dutch pull-quote had the right word while
   the body used the wrong one twice).
3. **Fresh-eyes verification.** Hand the claims to a verifier that has NOT read the draft - a fresh
   subagent if this environment can spawn one (give it ONLY the rows: claim, URL, verbatim source
   sentence; never the draft, your notes, or your reasoning; tell it to spawn nothing further).
   For each row it fetches the URL, confirms the recorded sentence is really there, and answers one
   question: **does the source's sentence entail the claim as written?** Same-topic-but-doesn't-say-
   that is a FAIL, not a pass. For a repo row, entailment INCLUDES THE ARITHMETIC: a count or
   total is re-derived from the quoted code, counting the first iteration - a loop that searches
   8 windows MOVES 7 times, and "looks again up to eight times" is wrong even though the constant
   says 8. If you cannot spawn, do this yourself claim-by-claim - but state
   what the source says FIRST, then compare, never the reverse. The handling rules, each broken
   by a real run:
   - **Verdicts are applied by the script, never by hand.** Give every ledger row an `id` (c1,
     c2, ...). The verifier answers **in the script's enum and no other vocabulary** - a run that
     asked for `stale/unsupported/misattributed` and hand-mapped the answers back performed the
     banned bulk write wearing a translation. **The prompt is `<skill-dir>/assets/fact-verifier-prompt.md`,
     sent verbatim with `<<ROWS_FILE>>` replaced by the round's rows file path and `<<VERDICTS_OUT>>` replaced by `<ledger-basename>.roundN-verdicts.json`, and NOTHING else
     changed** (the parent authors no verifier prompt; save the text you sent as
     `<ledger-basename>.roundN-verifier-prompt.txt`). It returns `{rowsSha256, verdicts: [{id,
     verdict, note?}]}` - the hash is of the rows file IT read; save the returned text to a file
     UNCHANGED (copy, never re-type - one re-typed round drifted a character) and run `node <skill-dir>/assets/ledger-verdicts.mjs <ledger> <verdicts-file> <rows-sent-file>` - the
     third argument is the EXACT rows file the verifier received; the script REFUSES the whole
     round when that file no longer hashes to the verifier's `rowsSha256` (a run rewrote a
     round's rows AND verdicts files to drop a `weak` row before applying - the artifacts showed
     a clean one-row round the verifier never saw), and REFUSES any row whose text changed
     between send and apply (a run rewrote a claim, then applied the verdict returned for the
     old wording). Name every round's files with the round number
     (`round3-rows.json`, `round3-verdicts.json`): a run reused one scratch name and a round's
     return was overwritten unapplied.
     It refuses invalid verdicts, stamps `verdictSource` + `claimHash`, resets rows whose claim
     text changed since stamping, and names every row carrying a verifier note (each a finding for
     the notes-resolution file). Hand-editing a
     `verdict`/`verdictSource` field - including any loop that sets them in bulk, and including a
     LEDGER REBUILD whose row constructor hard-codes `entailed` - is invalid regardless of
     intent; a rebuild writes its rows `unverified` and re-applies the rounds through the script.
     **The verdicts file is the verifier's COMPLETE returned list, copied from its output file**,
     never a curated subset - trimming rows or notes before applying decides verdicts by
     omission. **The run's last ledger action, always: `--check`, output printed in full** - a
     VOID row means the ledger work is not done, however honest the verification that preceded it.
   - **EVERY field you hand a verifier is byte-identical to the row's - claim, `sentence` and
     `url` alike - and the row carries nothing else that speaks.** A parenthetical added "for
     clarity" ("(the claim does NOT assert...)") is an answer key; so is a directive smuggled
     into an `ask` or `url` field; so is TRIMMING the `sentence` (a review run cut three rows'
     evidence down - a lost second sentence, two lost NL halves - so the verifier certified less
     than the ledger records; build the rows FROM the ledger BY CODE, never by retyping); and
     so is a changed prompt between rounds - round 2 uses round 1's prompt text verbatim, only
     the rows differ. A verdict that survives because of your annotation verified the annotation.
     And the verifier's `note` goes into the ledger as ITS OWN TEXT - condensing it is authorship.
   - **A claim you reword after a weak/failed verdict goes BACK to the verifier** (or its source is
     reopened and the new wording checked against the sentence, stated source-first) before its row
     may say `entailed`. Repair-then-self-certify is the writer grading their own retake.
   - Report the raw per-claim verdicts in your summary (never just "all confirmed"), and every
     failed row changes the text before you continue.
   - **A caveat inside an `entailed` verdict is a finding.** Enumerate every parenthetical, note
     and "pedantically..." the verifier returned, and mark each one acted-on or refuted with
     evidence - **as a line in `<ledger-basename>.notes-resolution.txt` beside the sources
     record** (`<id>: acted-on - <what changed>` or `<id>: refuted - <argument>`); `--check`
     reads that file and fails any noted row without a line (UNDISPOSED). A run shipped an
     off-by-one its own verifier had spelled out, because the reconcile read only the verdict
     words; a later one dispositioned 7 of 27 notes in prose (the script no longer prints the
     notes - read them in the ledger). `acted-on` means an edit happened; "no edit needed" is
     `refuted`.
     **A `refuted` line that leans on the post ("the post already attributes the cap to Article
     99(6)") QUOTES that text with its line number**, so the next reader can grep it - a run
     refuted a verifier's caveat with an attribution that existed in neither locale, and the
     unsupported figure it guarded shipped. No quote, no refutation: it is `acted-on` instead.
     After the LAST edit, re-grep every quoted span in the notes-resolution file against the
     shipped text and rewrite any that no longer matches - a run's file quoted seven superseded
     wordings under a header claiming each was re-checked.
   The no-expected-value rule from the research protocol applies to EVERY fetch in the run,
   re-verification included - "confirm it says 446s" is priming, whoever sends it. The rows you
   hand over contain ONLY `id`, `claim`, `url`, and the recorded verbatim `sentence` - no NOTE
   annotations, no "THE CLAIM UNDER TEST IS SPECIFICALLY", no expected arithmetic, no extra
   evidence pasted in to help the verifier along: every one of those is steering, and a verifier
   that "independently confirms" what you spelled out confirmed nothing. Encode a genuine process
   need as a neutral rule for all rows ("fetch raw HTML") or leave it out. This applies IDENTICALLY
   to every round - a round-2 prompt with the answer key embedded is not a verification.

### 7. Frontmatter
Assemble per the contract in [house-style.md](./house-style.md), **matching the project's reader**:
`title`, `description`, `keywords` (~3-6), `categories` (usually one, from a small reused taxonomy;
always a list), `author` (project default or a named human), and `date` = today's real date from
`date +%F` (**quoted**; do not guess). Slug = kebab-case of the title; verify unique against existing
posts.

### 8. Hero image (default ON) - via /scribekit-hero
Hand the post's hero to the **[/scribekit-hero](../scribekit-hero/SKILL.md)** skill's **blog-hero** create
flow: on first use it seeds the project's `hero.settings.js` from the brand (its own Step 0 brand
discovery); then it writes the post's `<slug>/hero.js` params, renders an on-brand hero, saves the JPEG
to the project's assets dir, and sets the `image:` frontmatter. Locate the installed skill (first that
exists): `<this-skill-dir>/../scribekit-hero/SKILL.md`, `.claude/skills/scribekit-hero/SKILL.md` (from the
project root or `$HOME`), or `node_modules/@daanvandenbergh/scribekit/skills/scribekit-hero/SKILL.md`; then
follow its `blog.md` create flow for this slug (single-language blog = one JPEG; multi-language =
per-locale, see step 9). **If `/scribekit-hero` isn't installed**, skip the hero, leave `image:` unset, and
tell the user to install it to add one. **Skip on opt-out** too (`--no-hero` / "skip the image").

### 9. Write the file
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
frontmatter contract. **A translation carries the same claims, hedges, numbers and attributions as
the source post - only the language changes.** Every fact-bearing sentence in the translation must
map to the same sources-record row as its original; a qualifier that survives in one locale and not
the other is the fidelity failure again, wearing a flag. **A named institution stays itself in
translation** - HMRC becomes "de Britse belastingdienst HMRC", never "de belastingdienst" (which a
Dutch reader parses as their own): localising the institution swaps the claim's subject. **And
translate the experience, not the word**: what a caller hears is the phone ringing, whatever the
dictionary offers first - read each translated sentence as its native reader would. **The gates run on the translation too**:
after writing it, run the digit gate's two sweeps over the translated file and read every
fact-bearing sentence beside its original - translation is a rewrite, and rewrites are where
qualifiers die ("supply-and-fit" halving into "materials-dominant" shipped exactly this way). **Render a language-specific hero** per the localised-heroes rule in
**[/scribekit-hero](../scribekit-hero/blog.md)**: add the translation's title/subtitle to the post's single
`<slug>/hero.js` (a `(locale) => params` map, reusing the same gradient), and render its JPEG to
`<assets>/blog/<slug>/hero.<lang>.jpg` - never point a translation's `image:` at the default-language
hero, since the hero bakes in title/subtitle text. Keep internal links pointing to same-language
routes.

### 10. Verify
- Frontmatter parses; body has no stray/unclosed JSX and no extra `#` H1.
- Every internal link points to a real route/post; external URLs are live.
- The hero renders crisp at full size **and** legible when scaled to a card thumbnail.
- **Self-score against the rubric in [seo-checklist.md](./seo-checklist.md), then fix the deductions
  you can fix** - a weak section gets rewritten, a missing corroboration gets researched, NOW, not
  noted. What remains below ~90 after that ships only with its deduction named in your summary
  (e.g. "two sections stand on a single secondary source"). **The floor is pressure on the post,
  never on the number**: an honest 87 with its reasons named beats a 92 that appeases the floor -
  self-scores inflate, and the real check is the independent audit handoff.
- Print the **sources list** in chat - and if the caller designated a sources-record path, write the
  full record there (see the Output section of [research-protocol.md](./research-protocol.md)),
  including each claim's verdict from the fresh-eyes verification.
- Offer a browser check: **ask the user to start the dev server** (never start it yourself), then
  use Chrome MCP to load the post's route and verify rendering + clean console.

### 11. Hand off
Suggest an independent audit pass: invoke this skill in **rewrite --scan** mode on the new slug.

## Guardrails
- Never fabricate statistics, quotes, sources, or named customers/cases. Unsupported -> cut or soften.
- Never start a dev server (project rule). Never create git branches.
- Keep changes scoped to the new post + its hero asset - **plus** the one-time content-dir `README.md`
  (Step 9), seeded from `assets/content-dir-README.md` only when absent, never overwritten.
