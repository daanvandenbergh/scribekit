# To Do list
  
- [ ] Decide on a license for the package. `package.json` is `"UNLICENSED"` and v1.0.0 was **already
  published** to npm under that. Pick and add a real license, then publish a new version.

- [ ] Fix the duplicate `plug` icon in `src/react/docs/internal/icons.tsx`. The `plug` (line 52) and
  `link` (line 53) entries in `ICON_PATHS` have **byte-identical `<path d="...">` data** - a copy-paste
  slip - so a docs page with `icon: "plug"` renders the chain-link glyph. Both names are advertised as
  distinct icons in `README.md` ("Icons") and in the `/scribekit-docs` skill's `docs-style.md` icon list.
  Draw a real plug/outlet path (24x24 viewBox, `stroke="currentColor"`, `fill="none"`, matching the
  stroke-width and rounded-cap style of its neighbours) and replace `plug`'s `d`. Verify by rendering
  both side by side - `src/react/docs/tests/components.test.tsx` already exercises the icon set, so add a
  case asserting `ICON_PATHS.plug` !== `ICON_PATHS.link`.

- [ ] Reconcile the `server-only` / `next` dependency declaration in `package.json`. The shipped code
  hard-imports `server-only` (`src/docs/docs.ts:1`, `src/blog/blog.ts:1`, and others - it survives into
  `dist/`), but `server-only` is declared **only in `devDependencies`** (`package.json:76`): it is in neither
  `dependencies` nor `peerDependencies`. It resolves today purely because Next's bundler aliases it. Yet
  `next` is simultaneously marked `optional: true` in `peerDependenciesMeta` (`package.json:57-59`), so the
  manifest claims Next is optional while the shipped code cannot resolve without it. Pick one and make it
  true: either add `server-only` to real `dependencies`, or drop `next` from `peerDependenciesMeta` so it is
  a required peer. Verify by installing the packed tarball into a bare (non-Next) Vite/node app and importing
  the root entry - it should either resolve or fail with an honest peer warning, not a bare module-not-found.

- [ ] Fix the `NaN` tie-break bug in `compareItems` (`src/docs/navigation.ts:129-132`). `orderValue()`
  (`navigation.ts:31-33`) maps an unset `order` to `Number.POSITIVE_INFINITY`, so for **two pages that both
  have no `order`** the comparator computes `Infinity - Infinity` = `NaN`; `NaN !== 0` is `true`, so it
  returns `NaN`, and `Array#sort` coerces that to `0` = "equal". The pages therefore keep their **on-disk
  read order** instead of sorting alphabetically by title. Verified by executing the real builder:
  three untitled-order pages `[Zebra, Apple, Mango]` come back as `Zebra, Apple, Mango`, while two pages
  tied on a *finite* `order: 1` correctly come back as `Apple, Zebra`. The one-word fix is
  `Number.isNaN(delta) || delta === 0 ? a.title.localeCompare(b.title) : delta`. **Four places state the
  false rule and must be corrected together** (or left alone if you instead decide disk order is the
  intended behaviour, in which case fix the four docs rather than the code):
  `src/docs/navigation.ts:30` (JSDoc), `src/docs/types.ts:48-50` (JSDoc), `demo/docs/navigation/en.mdx:26`
  + its `fr.mdx` twin ("then alphabetically"), and **this repo's own skill**:
  `skills/scribekit-docs/SKILL.md` Step 0 and `skills/scribekit-docs/reorganize.md` step 2 both instruct
  agents to reconstruct the nav with "unset last, then by title (`localeCompare`)". Add the missing test to
  `src/docs/tests/navigation.test.ts` (it covers the tied-finite-order case at :125-134 but never two
  unordered pages, which is why this survived). Verify with `npm test`.

- [ ] Fix the wrong multilingual URL shape stated in the source JSDoc. `src/docs/types.ts:214` and
  `src/docs/docs.ts:37` both say a translation "is served under `<basePath>/<code>/`" (i.e. `/docs/fr/x`),
  and `src/blog/types.ts:82` + `src/blog/blog.ts:36` carry the same wrong wording. The **actual** behaviour
  puts the locale first: `localePath` (`src/shared/locales.ts:87-92`) produces `/fr/docs/x`, and the tests
  confirm it (`src/docs/tests/docs.test.ts:140`, `src/shared/tests/locales.test.ts:66`), as does
  `demo/docs/README.md:12`. The code is right and the comments are wrong, so **fix the four comments** to
  describe `/<lang><basePath>/<slug>`. This matters beyond tidiness: the `/scribekit-docs` skill instructs
  agents to trace every documented fact to a `file:line` in source, so a stale JSDoc actively teaches a
  docs-writing agent the wrong URL scheme. Behaviour is unchanged (comment-only), so verify with
  `npm run typecheck && npm test` and by grepping that no `<basePath>/<code>/` wording remains.

- [ ] Resolve the contradiction between `skills/scribekit-docs/docs-style.md` and
  `skills/scribekit-docs/write.md` about closing sections. `docs-style.md:62-65` bans a `## Next steps`
  list outright ("the renderer already emits prev/next ... so do **not** append a `## Next steps` list that
  restates the linear next page") and allows `## Related` **only** for cross-references prev/next cannot
  express, and only when sibling pages already carry one. But `write.md:78` tells the author to "close with
  a plain **`## Next steps`** / **`## Related`** link list". `docs-style.md:7` declares itself the winner on
  conflict ("Where the two conflict, this file wins for docs"), so **`write.md:78` is the line to fix**:
  reword it to match docs-style (no `## Next steps`; `## Related` only when the corpus already uses one and
  prev/next cannot express the link). Done when a `write` run against a corpus whose pages carry no
  `## Related` section produces a page with no such section either.

- [ ] Add a --self-improve-dev-only flag which is actually a mode to the /scribekit-blog skill
      Create a dedicated skill file for this command mode, this mode should actually scan and review the skill very thoroughly also deep logic
      And suggest and explain improvements to be made to the skill, number the improvements, and then show a input prompt with a checkbox which of the numbered improvements to make.

- [ ] Add a --self-improve-dev-only flag which is actually a mode to the /scribekit-docs skill
      Create a dedicated skill file for this command mode, this mode should actually scan and review the skill very thoroughly also deep logic
      And suggest and explain improvements to be made to the skill, number the improvements, and then show a input prompt with a checkbox which of the numbered improvements to make.

- [ ] Per-language stopwords for the similar-posts ranking. `src/blog/similar.ts` `STOPWORDS` is
  English-only, so a non-English corpus lets its glue words ("les/des/une") inflate similarity.
  Extend `LocaleConfig` with an optional `stopwords?` and thread it into `vectorFor`/`tokenize`;
  only worth doing once a non-English blog is in real use.

- [ ] Fold `categories` into the similar-posts ranking (`src/blog/similar.ts` `vectorFor`, the
  documented extension point at the top of that file) so shared categories boost similarity.
  Deferred to keep the categories change minimal; only worth doing once real posts use categories.

- [ ] Add an automated guard that `"use client"` stays the literal first line of every emitted client component in `dist/` (e.g. a post-build check or a test over the built files). It is only verified manually today; a future bundler/config change could silently regress it and Next would render the component on the server. Unblocked now - `dist/react/BlogSidebar.js` is the reference client component.
