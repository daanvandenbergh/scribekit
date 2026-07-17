# To Do list

- [ ] **Commit and publish the `scribekit-docs-github-pages` skill - the docs already claim it ships,
  and that is currently false.** The caveat-removal half of this item is DONE: `site/docs` was rewritten
  on 2026-07-16 to describe the skill as a shipped, installable, fourth skill
  (`site/docs/installation/en.mdx` now prints the fourth `ln -s` line and says "Link only what you need";
  `site/docs/skills/en.mdx` says "you already have all four after `npm install`";
  `site/docs/getting-started/en.mdx` says "four portable Claude Code skills";
  `site/docs/scribekit-docs-github-pages/en.mdx` leads with "Not using Claude Code?" instead of the caveat;
  `site/docs/publish-to-github-pages/en.mdx` says the skill "ships in the package"). `README.md` says
  "four" too. **None of that is true yet**: the skill is still untracked
  (`git status --short skills/` -> `?? skills/scribekit-docs-github-pages/`), so it is absent from
  published npm 1.1.1, and a reader following the docs today gets a dangling symlink. Publishing is
  what makes the docs honest, so do it. Verified already: `npm pack --dry-run` packs all 12 skill files
  (`package.json` `files: ["dist", "skills", "demo"]` picks up `skills/` by path), `npm run typecheck` is
  clean, and `npm test` is 371/371 green. To finish: `git add` the skill
  (`skills/scribekit-docs-github-pages/`), its symlink (`.claude/skills/scribekit-docs-github-pages`),
  and `site/` (the whole docs site is untracked, so the docs edits above are NOT in git yet) plus
  `README.md`, `CLAUDE.md`, `package.json`, `TODO.md`; then `npm version minor` (1.1.1 -> 1.2.0; a new
  skill is a feature, matching 1.1.0's precedent - note `package.json`'s `push-and-publish` script
  hardcodes `npm version patch`, so do not blindly run it) and `npm publish`. Decide separately whether
  to commit `.github/workflows/deploy.yml` (also untracked): it deploys scribekit's own `site/` to
  GitHub Pages on every push to `main` and only works once repo Settings -> Pages -> Source is set to
  "GitHub Actions". Done when `npm view @daanvandenbergh/scribekit version` reports the new version and
  `npm view @daanvandenbergh/scribekit files` (or a fresh install) shows `skills/scribekit-docs-github-pages`.

- [ ] Make scribekit's absolute SEO URLs correct on a GitHub Pages **project site**
  (`https://<owner>.github.io/<repo>/`). `absoluteUrl` (`src/shared/seo.ts:29`) does
  `new URL(pathOrUrl, siteUrl)`, and a root-relative path (e.g. `/docs/x` from `localePath`)
  **drops the subpath** of `siteUrl`, so with `siteUrl: "https://owner.github.io/repo"` the
  canonical/sitemap/`hreflang`/OG URLs come out as `https://owner.github.io/docs/x` - missing
  `/repo`. Navigation, assets, and heroes are already fine (the deploy workflow feeds the base path in
  as `NEXT_PUBLIC_BASE_PATH` from `configure-pages`, so `next.config` sets `basePath`/`assetPrefix`,
  scribekit chrome links go through `next/link`, and the app-template's `BaseImg`/`BodyLink` prefix the
  hero `<img>` and in-body links); only the **absolute** SEO URLs are wrong. Decide the fix: e.g. teach
  the SEO builders to prepend `siteUrl`'s path before the
  root-relative `localePath` (join, don't `new URL`-resolve), or add a deployment `pathPrefix` to
  `SiteConfig` that `absoluteUrl`/`buildSitemap` honour. Cover it with a test in
  `src/shared/tests/sitemap.test.ts` / `src/shared/tests/locales.test.ts` using a `siteUrl` that has
  a subpath. Until then, the `scribekit-docs-github-pages` skill and the README's "Deploy to GitHub
  Pages" section tell users to prefer a custom domain / user-org site (empty base path), where this
  does not arise.

- [ ] Reconcile `site/docs/publish-to-github-pages/en.mdx` (the manual tutorial) with what the
  `scribekit-docs-github-pages` skill actually ships - they now diverge, and the tutorial's path
  **404s every hero image on a project site**. The docs present the two as equivalent ("The
  `/scribekit-docs-github-pages` skill does every step below for you"), but the tutorial's workflow
  snippet (`site/docs/publish-to-github-pages/en.mdx:71-147`) uses
  `configure-pages@v5` `with: static_site_generator: next` and tells the reader that is what injects
  `basePath`/`assetPrefix` (line 147). The shipped asset
  (`skills/scribekit-docs-github-pages/assets/deploy.yml:55-65`) **deliberately does not** use
  `static_site_generator`, and says why: it passes `configure-pages`' `base_path` output to the build as
  `NEXT_PUBLIC_BASE_PATH`, which the app reads **twice** - in `next.config.mjs` for `basePath`/`assetPrefix`,
  and in `_docs-image.tsx`'s `BaseImg` to prefix the hero's raw `<img src="/assets/...">`
  (see `assets/app-template/next.config.mjs` and `assets/app-template/_docs-image.tsx`, both of which
  document this). `static_site_generator: next` sets Next's basePath but **never sets
  `NEXT_PUBLIC_BASE_PATH`**, so `BaseImg`'s `BASE` is empty and every hero 404s under `/<repo>/`. The
  tutorial never mentions heroes or `BaseImg` at all; its only project-site caveat is the SEO-URL one
  (line 178), and its 404 troubleshooting note (line 240) blames the wrong cause. Fix by rewriting the
  tutorial's snippet to match the shipped `assets/deploy.yml` (drop `static_site_generator`, add the
  `NEXT_PUBLIC_BASE_PATH` env + the `base`-aware `next.config.mjs` from the app template, and add the
  `imgComponent={BaseImg}` step), or explicitly scope the tutorial to root-hosted sites only. Also note
  the tutorial's snippet lacks `enablement: true` (the shipped asset has it), which is why its "## 6. Flip
  the Pages source" step is still correct as written - keep the two consistent whichever way you go.
  Done when a reader following the tutorial onto a `<owner>.github.io/<repo>/` project site gets working
  hero images, verified by an actual Pages deploy or a local `NEXT_PUBLIC_BASE_PATH=/repo next build` whose
  `out/` HTML shows hero `src` starting with `/repo/assets/`.

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
