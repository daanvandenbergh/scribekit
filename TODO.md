# To Do list
  
- [ ] Decide on a license for the package. `package.json` is `"UNLICENSED"` and v1.0.0 was **already
  published** to npm under that. Pick and add a real license, then publish a new version.

- [ ] Publish a new version carrying the `Docs` slug-redirects feature. `package.json` is still at
  `1.0.2`, but `src/docs/` now exports `DocsConfig.redirects`, `Docs.getRedirect(slug, lang?)`, and
  `Docs.getRedirectRefs()`, and **both `README.md` ("Renaming a page: `redirects`") and the
  `/scribekit-docs` `reorganize` skill (step 7) already instruct users to use them** - so anyone on the
  published package follows those instructions and gets a `TypeError: docs.getRedirectRefs is not a
  function`. Bump the minor version (it is a backwards-compatible addition) and publish. Do it together
  with the license decision above, since that publish is blocked on it anyway. Verify with
  `npm pack --dry-run` that `dist/docs/docs.js` contains `getRedirectRefs`, then after publishing,
  `npm view @daanvandenbergh/scribekit version`.

- [ ] Fix the duplicate `plug` icon in `src/react/docs/internal/icons.tsx`. The `plug` (line 52) and
  `link` (line 53) entries in `ICON_PATHS` have **byte-identical `<path d="...">` data** - a copy-paste
  slip - so a docs page with `icon: "plug"` renders the chain-link glyph. Both names are advertised as
  distinct icons in `README.md` ("Icons") and in the `/scribekit-docs` skill's `docs-style.md` icon list.
  Draw a real plug/outlet path (24x24 viewBox, `stroke="currentColor"`, `fill="none"`, matching the
  stroke-width and rounded-cap style of its neighbours) and replace `plug`'s `d`. Verify by rendering
  both side by side - `src/react/docs/tests/components.test.tsx` already exercises the icon set, so add a
  case asserting `ICON_PATHS.plug` !== `ICON_PATHS.link`.

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
