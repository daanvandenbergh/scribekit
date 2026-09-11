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
  publication date and publisher. Prefer primary sources. **Ask the page what it says - never tell
  it what you expect.** A fetch prompt that embeds the figure you hope to confirm ("check it says
  £75") primes the extraction to agree; ask "what call-out fee does this page give, in its own
  sentence?" and let the answer surprise you.

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

Two sources that look like tier 1 and are not:

- **A press release is a pointer, even the issuing org's own.** Releases routinely sharpen the
  report they announce (a hedge dropped, a subgroup promoted to the headline). Open the report or
  data table the release points at and record THAT sentence; cite the release itself only when it
  is the only public document, and say so in the record. A shipped post quoted a secondary write-up
  of a survey and got both the sample size and the headline figure subtly wrong; the publisher's own
  page disagreed on both.
- **An interested vendor is tier 3 for any claim that helps sell its product** - market sizes,
  "businesses lose X", competitor pricing bands - no matter how much the page says "our data". A
  vendor's page is citable only for facts about the vendor itself (its own price, its own feature).
  "Their own data" on a vendor's SEO listicle is an aggregator wearing a lab coat.
- **A lead-gen "cost guide" is tier 3 too.** Trade-directory and quote-platform price pages
  (the "how much does X cost in <year>" genre) publish editorial estimate bands built to rank, not
  measurements - there is no survey behind the band. Usable only corroborated by an independent
  second source, and attributed as what it is ("<site>'s guide estimates ..."), never as a market
  figure.

**The floor: one primary source, or two independent secondary sources, per load-bearing fact.** A
single secondary source is a lead, not support - upgrade it or corroborate it.

**Follow the page's own citation one hop, always.** When a source's sentence links or names where
IT got the number, open that. The origin's figure and scope are the real claim - and when origin
and citing page disagree, the citing page's number is DEAD, not hedgeable: a contradiction one hop
behind your citation is not uncertainty to soften around, it is the number being wrong. A post
shipped a vendor's "27% of home-services calls" with careful hedging while the vendor's own linked
source said 26%, all industries - the hedges dressed a broken chain as a modest claim.

Avoid: undated content-farm articles, SEO spam, AI-generated roundups, anything you can't trace to
a real publisher and date.

## Loop

1. **Frame the questions.** Before searching, list the 4-8 specific things the post must establish
   (each stat, claim, or comparison). Research answers them, not vibes.
2. **Search -> fetch -> record.** For each claim: search, open the best source, extract the exact
   figure and the source's date. Record every claim as a row with these fields, in a running
   sources list:
   - `claim` - the fact as the post will use it, and `number` if it carries one.
   - `population` - who was measured ("adults in the US and UK who had bought in the last 12
     months"), never just the topic.
   - `question` - the exact question asked or thing counted, **and who ran and who paid for it** if
     it is a survey (a vendor-funded survey is disclosed or demoted a tier).
   - `asOf` - the date the figure describes (not the date of the page that mentions it).
   - `kind` - is this a typical value, a ceiling ("up to"), a subgroup, a percentage vs percentage
     points? The frame that must travel with the number.
   - `sentence` - **THE SOURCE'S OWN SENTENCE, copied verbatim**, because by the time you are
     editing the draft you will no longer remember what the number was attached to, and the draft
     will look right. It holds the source's bytes and NOTHING of yours: a writer's bracket inside
     it (`["How leads work" page: no numeric benchmark of any kind appears on it.]`) is an answer
     key handed to the verifier in the evidence field, and it survived three rounds. An ABSENCE
     row has an empty `sentence` - the `claim` names what was searched for and where, and the
     verifier searches for it.
   - `url`, `publisher`, `tier` (1/2/3 from the ladder above), `date` published.
   - `where` - every place the claim appears in the post ("body: ## Germany", "table: NL row",
     "pull-quote", "title", "description", "hero subtitle"). This is what makes coverage
     auditable: a claim in the post with no row, and a row whose `where` is stale, are both
     findable mechanically.

   **These fields are not bookkeeping - they are what the fidelity pass below runs against.** A row
   with an empty `population`, `question`, `asOf` or `sentence` is a stat you cannot use yet: fill
   the field from the source, or the number stays out of the post.
   **Record the row WHEN YOU FETCH, never later from memory.** A row reconstructed while editing
   ("for figures I used but hadn't recorded") is the draft citing itself - the verbatim sentence
   must be copied while the source is open, and a figure that reaches the draft without a row
   already existing arrived from memory by definition.
3. **Corroborate load-bearing stats.** If a number carries the argument, confirm it in a second
   independent source. Note disagreement; prefer the more authoritative / more recent.
4. **Check recency.** Reject stats older than ~3 years for fast-moving topics unless citing them as
   historical. Slower-moving fundamentals age more gracefully - use judgement. **A time-varying
   figure carries its as-of date in the article text** ("in 2024, ..."): prices, market sizes,
   adoption shares all drift, and an undated one silently claims to be current forever.
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
  write a comparison the source actually drew. **The IMPLIED comparative counts too**: quoting a
  clause of X as X's weakness ("it is weaker than it sounds ... 'evidence (but not conclusive
  evidence)'") asserts that X's siblings LACK that clause - a comparison nobody drew. The
  regularisation certificate carries that formula, and so, word for word, do the completion and
  compliance certificates the same post offers as the stronger routes (regs 17(4), 20(5)); the
  "weakness" was shared by every option on the table. Before a feature of X is presented as
  distinguishing, open the siblings' own text and check they lack it; if they share it, the
  distinguishing fact is something else (here: reg 18's "may give" against reg 17's "shall give
  ... in all cases") or there is none. ✗ "X is weaker: it is only 'evidence (but not conclusive
  evidence)'" / ✓ "every certificate is 'evidence (but not conclusive evidence)'; what sets X apart
  is that the council MAY give it, where Y SHALL".
  **A WORKED EXAMPLE THAT APPLIES ONE LIMB OF A RULE ASSERTS THAT LIMB IS THE ONE THAT APPLIES.**
  "3% of a €300,000 turnover is €9,000" reads as the fine a small business faces; art 99(4) says
  "whichever is HIGHER", so the ceiling on that sentence is €15m, and the small-business result
  only exists through art 99(6)'s lower-of rule - which the post never named and the ledger never
  rowed. The SELECTION rule (whichever is higher / lower, the SME carve-out, the threshold that
  picks the limb) is its own claim with its own row, and the arithmetic is written only after it.
  ✗ "the percentage limb scales with you: 3% of €300,000 is €9,000" / ✓ "for an SME, art 99(6)
  takes the LOWER of the two: 3% of €300,000 is €9,000" (with the 99(6) row).
  **WHEN THE LEDGER HOLDS A TIER-1 AND A TIER-2 SOURCE ON THE SAME POINT, THE TIER-1 TEXT
  GOVERNS.** A tier-2 paraphrase can be entailed verbatim and still be wrong where the tier-1
  page carries a qualifier it drops: a think-tank's "the Omnibus postpones Article 50(2) to 2
  December 2026" was rowed, verified and called "precise", while the Commission's own FAQ, also
  in the ledger, says the grace period exists "only for AI systems placed on the market before 2
  August 2026". Before a tier-2 sentence carries a rule, read the tier-1 row on the same point
  and take its hedges.
  **AVAILABILITY IS A CURRENT-LIST CLAIM, AND A RESTRICTIONS PAGE IS NOT AN AVAILABILITY LIST.**
  "Is this programme offered in my country" is answered only by the vendor's own current list of
  where it runs (Google's LSA country selector: eleven countries), dated in the row. A post built
  its whole availability picture on a 2020 trade article and then told readers to "check that
  your country is on the right side of" a page that lists RESTRICTIONS - absence from a ban list
  is not presence on an offer list, and a reader in a country the programme never reached
  follows the instruction and concludes they are clear. ✗ "check the policy page for your
  country" / ✓ "Google's own list of LSA countries is <list> as of <date>; the policy page then
  says which trades are excluded inside those" (two rows, both dated).
  **A METHOD STATEMENT BELONGS TO THE ELEMENT IT IS ATTACHED TO, NOT TO THE PAGE.** A price page
  said its AVERAGE was "based on requests made through the platform" - in the tooltip of one
  widget - and the post lent that provenance to a night-rate band that sits in a separate
  editorial table with no stated method, then built its hook, description and hero on the band.
  Record, per figure, WHERE on the page its method is stated; a figure with none is a tier-3
  editorial estimate whatever its neighbours are. ✗ "the page, built from requests through its
  platform, puts a night hour at €80-160" / ✓ "the page's average (which it says is built from
  platform requests) is €40-80 an hour; its editorial table, with no stated method, lists a
  night band of €80-160".
- **A QUANTIFIER TRAVELS WITH ITS OWN CLAIM AND NOTHING ELSE.** If the source says most people do A,
  and separately that people who do A then do B, it has NOT said most people do B. Welding the two
  manufactures a finding out of one measured half and one rhetorical half.
- **A RANGE ASSEMBLED FROM TWO SOURCES IS A SYNTHESIS, NOT A CITATION.** Taking one guide's floor
  and another's ceiling composes a band neither published - and so does re-scoping one source's
  national range to a city. Present a composed figure as your own synthesis naming both sources, or
  use one source's own band with its own scope; never hang the composite on one source's link. A
  reviewed post shipped "€75 to €95 for Dublin" from a source that said €75-€90, nationwide.
- **A CLAIM ABOUT A SOURCE IS A CLAIM.** "Both pages attribute it to platform data", "the page
  gives no dates", "the survey names no country" are checkable assertions about a document - they
  get rows and the same entailment bar as any statistic. Two failures ship here: asserting an
  attribution a page does not carry (one page said "our platform data", the other said nothing -
  "both pages attribute" was false), and imprecise absence ("no dates given" when the page is
  dated and only the FIELDWORK dates are missing - say which thing is absent, because you can only
  assert an absence you specifically looked for).
- **YOUR OWN RHETORIC IS NOT A SOURCE EITHER.** A line you wrote to sharpen a point ("every survey on
  this subject offers people a human") reads, three paragraphs later, exactly like something you
  looked up. If you cannot point at the sentence that measured it, mark it as the opinion it is or
  cut it. **And the flourish NEXT TO a sourced sentence is its own claim**: rendering a finding
  faithfully and then re-stating it sharper ("longer, more detailed complaints" ... "better-argued
  ones") ships the sharper version under the faithful one's citation - the restatement gets its
  own row or it goes.
- **A RULE'S SCOPE IS A CLAIM, DIGITS OR NOT.** What a law, regulator, standard or authority
  requires, permits or asks - and OF WHOM - is checkable, and extending it to a class the source
  never names asserts scope the source must entail. A review re-authored "anyone employed to work
  on gas appliances" into "the same thing when it is a favour between mates" - no number anywhere,
  so every numeric gate waved it through, and the regulator's page says nothing about favours.
  Such sentences get their own rows; sharpening one during a fix is writing a new legal claim.
  **And a "so/therefore" clause drawing a legal consequence from a sourced definition is ITS OWN
  claim, not part of the sourced one.** "The Act defines a consumer as ..., so what you owe a
  business customer is whatever your own terms say" shipped with only the definition rowed - the
  inference ("outside this statute, only your contract governs") asserts the ABSENCE of every
  other rule in the field, which is a checkable negative needing its own source (here it was
  false three ways: NL and DE service-defect law binds business customers too, and UK B2B still
  carries SGSA 1982 s.13's implied care-and-skill term). ✗ "the Act covers consumers, so B2B is
  whatever you agreed" / ✓ "the Act covers consumers; a business customer's rights come from the
  general law of the contract instead" (with a row for what that general law says).
  **An ABSENCE claim about an instrument is a claim about the WHOLE instrument as amended
  today.** "Nothing in the Building Regulations says who may fit one" was sourced to the one
  Schedule the writer had read; Part 2A (reg 11F, inserted 2023) requires competence of any
  person carrying out any building work, so the headline answer was false. The row's evidence for
  a "nothing in X" / "X does not require" sentence is a SEARCH of X's current consolidated text
  for the concept (the instrument's own contents page, plus a grep of its full text for the
  terms - "competen", "skills", "qualif"), recorded as such; a single provision entails only
  "provision Y names no ...". ✗ "Nothing in the Building Regulations says" (evidence: Sch. 1 G3)
  / ✓ "Schedule 1 G3 names no qualification; Part 2A reg 11F requires competence of anyone
  carrying out building work" (two rows). **And a verifier caveat is acted on by NARROWING the
  sentence it warned about, never by widening it**: c4 said "only safe if the article keeps it
  pinned to the Schedule 1 text", and the run's fix changed "No law says" to "Nothing in the
  Building Regulations says" - a wider claim, marked `acted-on`.
  **A RELATION BETWEEN TWO SOURCED RULES IS A THIRD CLAIM.** "Which of the two applies follows
  from the kind of contract you struck", "A replaces B", "outside A, B governs" - each asserts how
  the rules interact, and neither source said it. Two rows proving A and B do not prove A-or-B: a
  kitchen-table consumer repair is BOTH an aanneming van werk (7:764, whole price minus savings)
  AND an off-premises contract (6:230g), and afdeling 2B is mandatory law (6:230i) - for fourteen
  days the withdrawal right governs and the customer owes nothing, which the post's own cited
  regulator page said. The relation gets its own row, sourced to the provision that RANKS them
  (a mandatory-law clause, an exclusion list, a "without prejudice to") or to a regulator's
  statement of the combined effect; absent that, write both rules and say they stack. ✗ "which
  of the two is in play follows from the kind of contract" / ✓ "both apply: the withdrawal right
  first, and 7:764 for what remains once it has lapsed" (with the 6:230i row).
  **"Is defined as" is a closed list; "includes" / "means any of" is open** - a refutation that
  treats them as equivalent is the widening move wearing a disposition. A note said the row was
  safe only as "includes"; the text kept "is defined as" over a four-limb definition and dropped
  the limb that is the trade's default case (an offer made in the trader's presence, accepted
  later).
  **EVERY SECTION OF A MULTI-JURISDICTION POST ANSWERS FOR EVERY JURISDICTION IT PROMISED, OR
  SAYS IT DOES NOT.** A deposit section that answers with CRA 2015 and CMA guidance alone, in a
  post framed as UK + NL, silently tells the Dutch reader the English answer; 6:237 sub i (the
  grey-list presumption against termination payments beyond a reasonable compensation) was on
  the regulator page the post already cited. Per section: one row per jurisdiction, or one
  sentence naming the gap. **And the inverse: a section addressed to "you" inherits the post's
  WHOLE audience, so a regime that binds only part of it names its territory in that section** -
  an AI Act section with no "in the EU" and no "the UK has no equivalent" told a British reader
  a disclosure duty binds them that Art 2 does not extend to them. If every other section names
  its jurisdiction, the unmarked one reads as covering all of them.
  **AN INSTRUCTION IS A SUFFICIENCY CLAIM.** "Get these two facts in writing and you can charge"
  asserts that two facts SUFFICE - and the provision that grants the charge lists its own
  conditions (reg 10/13 also require the model cancellation form; 6:230t lid 3 a declaration on
  a durable medium, and 6:230s lid 5 zeroes the charge without it). The row for an instruction
  is the provision's COMPLETE condition list, read from the provision, with every condition the
  post names ticked off against it; a condition the post omits is a reader who follows the post
  and invoices zero. ✗ "two facts in writing" / ✓ "the form, the express request in writing and
  the acknowledgement - all three, or the charge is nothing" (one row per condition), or
  "among the conditions" when you will not list them all.
  **"THE RULE THAT MAKES X LAWFUL" IS A NECESSITY CLAIM** - it asserts X would be unlawful
  without that rule, which needs the provision that prohibits X absent it. A post named the 2018
  interception-by-businesses Regulations as "the regulation that makes your recording lawful",
  but IPA 2016 s.4 defines interception as making content available to someone who is NOT the
  intended recipient - a business answering its own line is the recipient, so the offence is
  generally not engaged and the Regulations are not what saves it. ✗ "the regulation that makes
  your recording lawful" / ✓ "the Regulations authorise the cases the interception offence would
  otherwise reach; answering your own line is usually not one of them" (two rows: the offence's
  definition, and the authorisation).
  **A TRANSLATED LOCALE KEEPS EVERY VERIFIED URL BYTE-IDENTICAL.** Localising a link
  (`/en/` -> `/nl/`) is a NEW url that nobody fetched: a Dutch locale pointed at the Commission's
  `/nl/` path for a page that exists only in English, and it 302'd to page-not-found while the
  ledger showed `entailed` for the `/en/` url. A locale-specific url is allowed only as its own
  row, fetched and entailed on its own; otherwise the translation carries the source locale's
  url.
- **A UNIVERSAL IS A MEASUREMENT.** "Every", "no ... anywhere", "only", "always", "first",
  "largest" assert that someone checked all the cases - authorial voice does not exempt them. A
  shipped post said "every network keeps a switch" in the same revision that admitted it could not
  find one network's. Write the universal only when a source measured the whole set; otherwise name
  the cases you actually have ("the four largest Dutch carriers all publish one"). **The first
  set to check a universal against is the post's OWN body**: a draft opened "ONE hot water
  temperature in England is a statutory requirement, 48°C at the bath" and, twenty lines on,
  correctly quoted a second statutory one (the 100°C storage ceiling in the same Schedule). ✗ "one
  temperature is statutory" / ✓ "one DELIVERY temperature is statutory" - grep your own draft for
  every other instance of the class before the word "one", "only" or "the" survives.
- **A PARAPHRASE MAY NARROW A SOURCE'S CLAIM, NEVER WIDEN IT.** The hedges are load-bearing:
  "some", "among respondents", "was associated with", "in this sample", the tense, the population,
  **and the modality**: a source's "you can apply with X" does not entail "X is required" -
  may/can/must each assert a different rule, and upgrading one is widening. **Translation is where
  the modal drifts**: an Approved Document's "should be limited to 48°C" became "moet worden
  begrensd" in the Dutch locale - guidance rendered as statute in one language only, while the
  English kept "should". ✗ should -> moet / ✓ should -> "zou moeten" or "hoort", must -> moet;
  the locale-parity pass compares MODALS sentence by sentence, not just facts and figures, and
  a normative-register word ("moet", "muss", "doit") is a claim that the source is binding.
  Each one the source wrote and your sentence dropped is a widening - "associated with" becoming
  "causes" and "generative AI" becoming "AI" are the two that actually shipped. When compressing,
  keep the hedge and cut elsewhere.
  **Splitting an enumerated list is widening too**: "ten years for books and annual accounts, six
  for the other documents it lists" assigns a period to EVERY item in the statute's list, including
  the ones the sentence never read (§147 AO's ten-year class also holds inventories, management
  reports and the opening balance - "the rest" filed them under six). Name only the items you keep,
  and stay silent on the remainder - "and the rest" / "the others" is a claim about each of them.
- **FACTS THAT ARRIVE IN THE BRIEF ARE UNVERIFIED INPUT.** A topic entry, an outline, a rationale
  from an earlier pipeline stage may embed numbers and claims. They seed the research; they are
  never sources. Every one that ends up in the post gets its own row, sourced fresh.

## Claims about the current project itself: repo-checked, not web-checked

The web cannot verify what *this project's* product does, costs, or promises - but the repo can,
and a false claim about your own product is the most damaging fabrication there is. Two shipped:
a post promised the agent "greets in the caller's own language" (the code pins one language per
call), and another sold an automatic review follow-up a week after the product removed it.

- A claim about the project's **features or behaviour** is verified against the code or the
  project's own docs/marketing pages - and recorded like any other claim, with the file path or
  route as the `url` and the code's own line as the `sentence`.
- A claim about the project's **prices or plans** comes from the pricing config/page, never from
  memory of it.
- **Marketing-plausible is not true.** If you cannot find the feature in the repo, the product does
  not have it for the purposes of this post. When something reads like it *should* exist but you
  cannot find it, flag it as a question in your summary instead of shipping it as a fact.
- **The code proves CAN; the repo also records NOT-YET.** Before any invitation or "today"/
  availability claim ("connect it today", "covers X today", "try it now"), check the project's own
  record of unfinished real-world steps (its TODO / launch checklist / deferred-work file) for a
  blocker on that exact path - **TODO-first, and the row's note names the check**: for an
  availability claim, the docs page can never be the sole source, because a feature can be fully
  coded, documented on the live docs site, and still not work for an arbitrary customer (an
  unverified OAuth app, an unproven carrier path) - **your own docs are launderable too**: a post
  that mirrors them mirrors their optimism. When the docs and the TODO disagree, the TODO wins,
  the claim is scoped honestly or dropped, and your summary flags the DOCS as the bug.

## Citing in the post

Keep it clean prose, not an academic paper - don't litter with footnotes. Instead:
- **Attribute inline** when it adds authority ("Google's Core Web Vitals guidance puts the LCP
  target at 2.5 seconds").
- **Link the phrase** to the source with a normal Markdown link for the strongest 1-3 external
  references. Use credible, stable URLs, and confirm they're live before shipping.
- **Front-load the fact** in the sentence, not the tail - retrieval chunks can truncate, and the
  stat is the quotable unit.
- Every concrete number must be traceable to the sources list, even if not every one is hyperlinked.
- **Name the issuer and the year with the number** where it reads naturally ("Gartner's 2025 survey
  found ...") - attribution in the sentence is what makes the stat quotable AND checkable.
- **Few verified stats beat many unverified ones.** Target roughly 5-7 load-bearing data points per
  post, each with a complete record row. The AI-citation lift comes from well-attributed verifiable
  claims being present, not from their count - and a wrong stat is worse than none: it is an
  easily-verified factual error (a search-quality demotion signal), and if an answer engine repeats
  it, the error propagates under your brand.
- **An unverifiable number is deleted, not softened.** "Softening" a number you could not verify
  into "most" or "the majority" keeps the claim and hides the problem (a comparative is still a
  claim). Soften only *to what the source does say*; when no source says anything, the sentence
  loses the claim entirely.
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

**When the caller designates a sources-record path** (a project's pipeline may - e.g. a JSON file
per post outside the public content dir), also write the full record there: one object per claim
with the fields from the Loop above (`claim`, `number`, `population`, `question`, `asOf`, `kind`,
`sentence`, `url`, `publisher`, `tier`, `date`, `where`, and after verification a `verdict`).
**`verdict` takes exactly one of: `entailed`, `weak`, `contradicted`, `unverified`.** A repo-checked
claim is `entailed` with a file-path `url` - never a home-made verdict word ("repo-verified",
"confirmed-ish"): any vocabulary outside the four is a hole in every rule that counts verdicts, and
`unverified` is what a row is until a verifier has read its source. **And a note is not an
action**: a caveat recorded in a row (a verifier's doubt, a scope worry, a conflicting sibling
source) that the prose does not then act on is a finding you buried - every recorded problem either
changes the text or is resolved with evidence, in the same run that wrote it down. That file is
what lets a later review check the *sentences* instead of re-proving the digits exist - without it,
the record dies with this session and every review starts from nothing. Never write it into the
public content dir itself.

The **rewrite** task uses this same protocol in reverse: take each factual claim in an existing
post, find a current source, and flag anything unsupported, stale, or contradicted.
