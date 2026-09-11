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

**Build the claim table BEFORE reading the post for quality - and not by your own hand.** Your
FIRST act of the run, before you open the sources record or any proof file beside it, is to
spawn ONE fresh subagent with `<skill-dir>/assets/claim-table-prompt.md` verbatim (`<<FILES>>` =
each locale + hero.js, `<<TABLE_OUT>>` = `<ledger-basename>.claim-table.json`, nothing else
changed): it is given the post and nothing else, so its extraction cannot inherit the writer's
rows, and it writes the table itself with `extractedAt` and the files' hashes. Two reviews in a
row read the ledger in their first parallel batch of reads and then wrote a table whose every
row already carried a `ledgerId` - honest, disclosed, and no longer an independent extraction.
Only once that file exists do you open the ledger and MERGE (add `ledgerId` to each table row,
or mint ledger rows for the unrowed ones). The table extracts every checkable claim - statistic, date, version, price, named fact,
comparative ("most", "twice as"), universal ("every", "only"), causal claim, quote, and every claim
about the project's own product - from EVERYWHERE a claim can sit: body prose, `title`,
`description`, the pull-quote, image alt text, the hero's title/subtitle, and table cells.
**`title` and `description` are the FIRST rows in the table** - the description is served
standalone in search results, so it is the post's most-read sentence, and a 43-row table once
skipped it: "the one document that decides whether you can charge at all" shipped, contradicted
by the body's own line 68, defended in the style pass as "the thesis" and never tested as a claim. One row
per claim: the post's sentence | where it sits | the source it claims (if any) | the source's
verbatim sentence | verdict. **Persist the table - verdicts `unverified` - BEFORE opening the
ledger or verifying anything** - and before opening ANY of the writer's proof files beside it
(`.final-audit.json`, `.style.json`, `.notes-resolution.txt`, `.report.md` are the writer's
framing as much as the ledger is; a review read all four first and its table could no longer
prove anything): write it as an object `{"extractedAt": "<date -u +%FT%TZ>", "rows": [...]}` to
`<ledger-basename>.claim-table.json` beside the
sources record (the check refuses a table stamped after this run's first verdict) (that exact name - never /tmp, where precedence artifacts die with the machine and
prove nothing to the next review) so
the artifact's existence proves the extraction preceded both the writer's rows and your own
verdicts. Printing it after dumping the ledger proves nothing - a run did exactly that and its
independence claim became unfalsifiable. Only after the table exists do you read for style and
structure - a reviewer who starts with the prose inherits the writer's framing and confirms it.
When you later JOIN table to ledger, report BOTH directions explicitly, "none found" included
(post claims without rows AND rows whose claim has left the post). **The join is not a report, it
is a MERGE: before the first verifier round, every table row either IS a ledger row (same id) or
carries `ledgerId` naming the ledger row that holds its claim - title and description rows
included.** Verifier rounds are built from the ledger by code, so a table row that never became
a ledger row is a claim no verifier ever sees: a review tabled the description as `t2`, sent 28
ledger rows to four rounds, and shipped the description stronger than every source with `t2`
still `unverified` and the report saying "no-row claims: two". The final check's `--claim-table`
fails UNJOINED for any table row with no verifier-judged ledger row - and a claim you CUT from the
post gets `"cut": true` on its table row (never a repoint to another claim): the check then greps
the content files to confirm the sentence is gone.

**The table comes FROM THE POST; the ledger comes second.** Extract your table by reading the
post - BEFORE any read of the sources record, a `head` peek included (a run peeked at row c1
"just to check the shape" and its independence claim died there) - or you inherit the writer's
extraction. The extraction sweeps DIGITLESS claims with the same care as numbered ones: **what a
law, regulator, standard or authority requires and OF WHOM**, product capabilities, universals,
comparatives - the moderate that survived a full review was a legal-scope sentence with no number
in it and audit only
the claims the writer chose to record (a review did exactly this: it verified the ledger's 16 rows
diligently and never asked what the post claimed that the ledger didn't). Only once your table
exists, load the record (the caller may designate a path - a JSON ledger from the write run) and
JOIN the two: a post claim with no row is a finding; a row whose claim no longer appears in the
post is stale. The join IS the coverage sweep. Then verify: the record's verbatim sentences are
your corpus, but do not trust them - re-fetch and confirm each recorded sentence actually appears
at its URL (the ledger proves what the writer *recorded*, not that the post's sentence matches
it). Claims with no row get researched fresh; when you finish, update the record to match the post
as you leave it.

Then verify each row per [research-protocol.md](./research-protocol.md). **Two separate checks per
citation, in order: the URL resolves to the claimed document; the document's own sentence entails
the post's sentence as written.** Passing the first proves nothing about the second. **Re-derive,
don't confirm:** state what the source says first, then compare - never read the post's sentence
and ask "is this right?". Same-topic-but-doesn't-say-that is not support. Claims about the
project's own product are checked against the repo (code, pricing config, the project's own pages),
not the web. Mark each row:
✅ supported (cite source), ⚠️ stale/outdated (give the current figure + source), ❌ unsupported or
contradicted (explain, with source), and - the one people miss - 🔀 **MISATTRIBUTED: the number is
real and the sentence it sits in is not.** Flag any **invented named customer/case** as a hard fail.
A row you cannot verify either way is ❌, not ✅-by-charity - and per the protocol an unverifiable
number is deleted, not softened.

**Fresh-eyes pass:** if this environment can spawn a subagent, hand the finished table's rows
(`id`, claim, URL, verbatim sentence ONLY - never the post, never your prose notes, no directives
or expected arithmetic) to a fresh verifier for independent entailment verdicts, **using
`<skill-dir>/assets/fact-verifier-prompt.md` verbatim with `<<ROWS_FILE>>` and `<<VERDICTS_OUT>>` (= `<ledger-basename>.roundN-verdicts.json`) substituted and
nothing else changed** (save the sent text as `<ledger-basename>.roundN-verifier-prompt.txt`);
it answers `{rowsSha256, verdicts}` and the script refuses a round whose rows file no longer
hashes to that value - a run rewrote a round's rows and verdicts files to drop a `weak` row - **repo rows included**: a file-path row gets the same treatment, the
verifier reading the file and re-deriving any count from the code itself. The verifier answers in
the script's enum and no other vocabulary; each row handed over is **copied byte-identical
from the table - EVERY field, never reworded**: an explanatory parenthetical is an answer key,
rephrasing a claim toward its source's vocabulary pre-bakes the entailment (a run reworded all
26 of its claims en route and verified its own paraphrases), and TRIMMING is the same move on
the evidence side - a run cut three rows' `sentence` fields down (one lost a quoted article's
second sentence, two lost their NL halves) under a "rows only" framing, so the verifier
certified less evidence than the ledger records. Build the verifier input FROM the ledger BY
CODE (jq/python), never by retyping. A row whose `url` is repointed resets to `unverified` the
moment you repoint it - the hash covers url, so `--check` voids the stale verdict anyway; the
returned JSON `[{id, verdict,
note?}]` is saved unchanged - the `note` stored in the ledger is the VERIFIER'S OWN TEXT,
never a condensed retelling (condensing is authorship: a run's summaries dropped two caveat
clauses) - and applied with
`node <skill-dir>/assets/ledger-verdicts.mjs <ledger> <verdicts-file> <rows-sent-file>` - the third
argument is the EXACT rows file the verifier received, and the script REFUSES any row whose text
changed between send and apply (a run rewrote a claim, then applied the verdict returned for the
old wording); name every round's files with the round number (`round3-rows.json`,
`round3-verdicts.json`) - a run reused one scratch name and a round's return was overwritten
unapplied (hand-set verdicts are invalid and `--check` voids them), then reconcile. **A round is COMPLETE only when its verdicts
are APPLIED through the script - the apply call happens immediately after the verifier returns,
before any other work.** Returned-but-unapplied verdicts are a debt exactly like a declared-void
round: a run applied rounds 2 and 3 but never round 1, the bare `--check` passed green on the
WRITE run's leftover provenance, and its closing summary claimed all three rounds were applied -
false. A green bare `--check` proves provenance EXISTS, not that THIS run wrote it. **A ledger REBUILD does not carry verdicts**: if
you restructure the record (new ids, refreshed `where`, reworded claims), every rebuilt row is
written `unverified` and the verifier rounds are re-applied THROUGH THE SCRIPT - a run rebuilt its
ledger at the end with `verdict="entailed"` hard-coded in the row constructor, and every verdict
in it was void despite two honest verification rounds. **THE FINAL AUDIT - a fresh auditor on the finished text, before the final check.** Every
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
**The run's LAST ledger action, always:**
`node <skill-dir>/assets/ledger-verdicts.mjs <ledger> --check --applied-after <run-start> --post-dir <post dir> --claim-table`,
output printed - record the run's start with `date -u +%FT%TZ` before touching the ledger, and
pass it here so every verdict is proven applied BY THIS RUN (a STALE row is an unapplied round
wearing the previous run's stamps); `--post-dir` is the quiet-round proof in code - every proof
file beside the ledger (`.gate-resolution.txt`, `.style-resolution.txt`, `.style.json`,
`.notes-resolution.txt`, the ledger) must postdate every content file, else STALE-PROOF (a run
edited the post 30 seconds after saving its gate file and never re-ran it). This command is the
run's LAST action on the post, its hero or any proof file - the caller's own bookkeeping steps
(scores, topic files, tests) may follow, touching none of those - and its printed output IS the
postdating proof. **`touch` on a proof file is forgery**, not a fix - a run cleared a
STALE-PROOF that way after a late edit; the style verifier reports the sha256 of every file it
read and the check recomputes them (STALE-STYLE), so the only way to postdate an edit is to
re-run the step. Any VOID, STALE,
UNDISPOSED, UNJOINED, MISSING or STALE-PROOF line means the ledger work is not done. Then reconcile: any row where it disagrees with you gets re-checked by opening the
source again, not by majority vote, and every returned note is quoted verbatim and marked
acted-on or refuted, every round - **as a line in `<ledger-basename>.notes-resolution.txt`
beside the sources record** (`<id>: acted-on - <what changed>` or `<id>: refuted - <argument>`),
which `--check` reads: a noted row with no such line is UNDISPOSED and fails the check (the
script no longer prints the notes - read them in the ledger; two runs dispositioned six of
thirty-plus in prose). `acted-on` means an edit happened; "no edit needed" is `refuted`. A
`refuted` line that leans on the post ("the post already attributes the cap to Article 99(6)")
QUOTES that text with its line number so it can be grepped - a run refuted a caveat with an
attribution that existed in neither locale, and the figure it guarded shipped. Report raw verdict counts,
never just "all confirmed". After the LAST edit, re-grep every quoted span in the notes-resolution file against the shipped text and rewrite any that no longer matches - a run's file quoted seven superseded wordings under a header claiming each was re-checked.

**Two checks that need no web at all - run them on every post:**
- **Internal consistency.** Prose vs tables vs pull-quote vs frontmatter may not disagree (a
  shipped post's prose attributed a fact its own sourced table gave to a different company; another's
  pull-quote contradicted its own line 18). Within each locale this includes **one rounding per
  figure** (446s may not be "seven and a half minutes" and "seven minutes" two sentences apart)
  and **one term per concept** (a pull-quote using the right word while the body uses the wrong
  one, twice, shipped and survived a review).
- **Locale claim parity** (multi-language blogs): every fact-bearing sentence in each translation
  says the same thing as the default locale - same numbers, same hedges, same attributions, same
  institutions (a localised institution name swaps the claim's subject: "HMRC" rendered as the
  bare local tax office asserts something about the wrong country), and terminology a native
  reader would recognise as the actual experience. **Where a sentence names a product setting or
  UI label, each locale must use the product's OWN label in that locale** (read the product's
  localisation/docs files - a review shipped a home-made Dutch term while the dashboard's real
  label sat in the docs it had open). A fix applied to one locale and not the others
  is a standing 🔀.

**🔀 is the verdict this list existed without, and the reason a wrong post can audit clean.** A
published post said "the 64% who say they'd rather not talk to AI were asked to choose between an AI
and a person". Search for 64%, open the issuing body's press release, find 64% - ✅ supported, audit
passes, post stays wrong. The survey asked whether people would *prefer companies didn't use AI in
customer service*; nobody was offered anything. So ✅ requires more than finding the digits: open the
source, read the sentence that carries the number, and check the post's sentence says the same thing
about the same population - the scope, the question asked, the strength of the comparative. Run the
full **Fidelity** section of the research protocol over every claim, and over the pull-quote first:
it is the line most likely to have sharpened a qualifier away.

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
   category, each with a one-line justification, plus the hero verdict from step 7. **The Content &
   Research justification states the claim-table counts** (rows checked / ✅ / ⚠️ / ❌ / 🔀), and the
   rubric's cap applies: any ❌ or 🔀 still standing in the text caps that category - a score is a
   description of the table, not a mood.
2. **Fact-check results** - the full claim table with per-row verdicts and sources, including the
   fresh-eyes verifier's raw counts where one ran.
3. **Prioritized fix list** - most impactful first, each concrete and actionable.
4. **Sources used** - per the research protocol.

### 9. Apply fixes
**If `--scan` was passed, stop here** - the report is the deliverable; do not modify any file.

**No fix is applied while a verification round is still out.** The order is verify -> report ->
fix: a run that started editing before its verifier returned made an edit the verifier then proved
wrong, and only luck ordered the revert after the damage instead of after the ship. Step 8's
report (the per-category rubric with justifications and the prioritized fix list) is WRITTEN TO A
FILE beside the sources record before the first edit, **grading the post AS IT IS** - a rubric
"projected for the post as it will be left" grades fixes that have not happened - a report that first appears in the closing
summary was reconstructed after the fact; the file's existence before any edit is the gate that
makes the fixes auditable against what the audit found. The anti-slop half of the audit uses
`node <skill-dir>/assets/style-tics.mjs` exactly as write.md's step 5 does - script output,
adjudicated per hit, calibration post as the density meter. **And the caps are FINALLY bound by a
fresh STYLE-verifier subagent - this is a step of THIS task, not a cross-reference** (two
consecutive review runs skipped it because it lived in another file): after the last fix, spawn
ONE fresh subagent **`<skill-dir>/assets/style-verifier-prompt.md`, verbatim, with `<<FILES>>`
replaced by the file list, `<<STYLE_OUT>>` by `<ledger-basename>.style.json`, and NOTHING else changed** - each locale file AND hero.js AND the
calibration post (identical file set to write.md's - a looser list here re-opened the hero.js
hole once). Build it BY CODE, save the sent text as `<ledger-basename>.style-prompt.txt`, and
expect it diffed against the asset: no counts, no script output, NO parent-authored "counting
notes" or category-narrowing rules - one run smuggled a tricolon-narrowing rule into the prompt,
another a blanket quotation exemption, each pre-deciding the hits it had promised to argue (the
answer-key move with the verdict outsourced). Get JSON per category `{count, lines}`, enforce
every cap on ITS counts - **the pivot cap is the number the caller pins (house default 2), never
the verifier's count of the calibration post** (five raters counted one file at 3, 4, 7, 8 and
12) - (fix and re-send until it
passes; overrule a hit only by quoting the line and arguing it in print - EACH hit, its own
printed argument, before the run ends; "I'll argue these below" with no argument below is a
failed step), and **save its returned JSON verbatim to
the caller-designated style-report path** - the artifact that proves the step ran. **Each hit's
resolution is also a LINE IN A FILE, not only prose**: write
`<ledger-basename>.style-resolution.txt` beside the sources record, one line per hit from the
VERIFIER and one per hit from `style-tics.mjs` alike - `<file>:<line>: fixed` or
`<file>:<line>: overruled - <the argument itself>` (that exact prefix, e.g. `en.mdx:40:`) - saved
before the closing summary; the final `--check --post-dir` requires the file, fails when it
predates any content file, and re-runs `style-tics.mjs` itself: every hit the script prints on
the shipped files without a matching line is UNARGUED and fails the check (a run declared
"mechanical meter is clean" over a printout reading `tricolons: 6 (cap 1) OVER`), and reads
`.style.json` the same way - every line the VERIFIER listed on a post file needs its line too (a
run shipped the verifier's two "Nothing." pivots with no argument anywhere). A run wrote "six tricolon flags now - I'll
argue each in print" and no argument ever appeared; the file is the only accepted form, because
an announced argument is not an argument.

Otherwise (default), apply the fix list from Step 8: edit the post directly - up to a substantial
rewrite - and bump `updated:` to today's date (`date +%F`, quoted). If the hero needs work, run the
relevant **/scribekit-hero** mode. Then re-print the final fix summary noting what changed. Keep every correction
sourced (below); don't rewrite beyond what the audit found.

**A finding names a CLAIM, not a line.** Before a finding is marked fixed, fix it EVERYWHERE the
claim sits: the row's `where` list, plus a grep for its key phrase in each locale AND hero.js,
the `description` and the closing paragraph included. A review rewrote the description's "on a
single call" and left the closing line ("That is the whole audit, and it costs you four phone
calls") and the EN hero subtitle ("test each one on a call") saying exactly the same thing - one
site fixed, two shipped, and the two are the ones a reader actually meets. ✗ fix the line the
report quoted / ✓ fix every restatement, then re-grep to prove none is left.

**Your corrections are new claims, and they get the full treatment.** The reviewed post that
shipped a band its source never stated got it from a REVIEW EDIT - written after verification had
run, by a fixer who was now a writer with nobody checking. So, after the last fix:

1. Every sentence you added or changed goes through the write task's fidelity checklist (scope,
   question, comparative, attribution, table-cells - `write.md` step 6), against its source's own
   sentence.
2. Every ledger row you added or changed gets a **second fresh-eyes round over just those rows** -
   same rules as the first (rows only, no post, no spawn). Rows born in the fix phase are exactly
   the ones the first round never saw. **A changed row's `verdict` stays `unverified` until that
   round RETURNS** - persisting `entailed` while the verifier is still out is writing the grade
   before the exam.
3. The **digit gate runs LAST in this task too - it is a step of THIS task, not a
   cross-reference** (review runs have skipped its load-bearing parts three times while write runs
   complied): token extraction from `style-tics.mjs` over every locale file AND hero.js, digits
   plus number-words plus the standard per-locale quantifier lists, and **the per-token
   resolution saved to `<ledger-basename>.gate-resolution.txt` beside the sources record** -
   that exact name, three runs each invented a different one - one line per token per FILE,
   `L<n> <token> -> <row id / arithmetic / date-config>`; the final `--check --post-dir` re-runs
   the extraction over every content file and fails UNRESOLVED for any token without a line
   naming its `L<n>` and the token (a blanket "all tokens resolve" sentence, or "the nl set is
   identical", is a failing gate; never `head` or `grep -v` the script's output). If you
   edit after it, it runs again. The QUIET ROUND rules apply identically: the postdating proof
   is the final `--check ... --post-dir` printout (a review run once left the right mtimes on
   disk but never printed them, which proves nothing to a reader of the run), batched
   convergence (max three batches), no self-certified post-closer edits.
4. Re-check locale parity across the sentences you touched - a fix applied to one locale is half
   a fix.

## Guardrails
- **Prose is not execution.** Every step you ANNOUNCE ("I'll apply these", "I'll argue each
  below", "then I re-run the gate") is a DEBT only the tool call pays - a run's three process
  defects in one audit were all this one habit. Before the closing summary, re-read your own
  transcript for announced-but-unrun steps and pay each one; a summary sentence describing a
  step that never ran is dishonesty, not compression.
- Never invent a "correct" statistic - every correction must carry a live source.
- Don't touch anything but the post being rewritten + its hero. With `--scan`, touch **nothing**.
- Never start a dev server; never create git branches.
