# To Do list

- [ ] **Verify the blogkit→scribekit migration fully landed.** In a fresh session, confirm nothing
  still uses the old `@daanvandenbergh/blogkit`. Run and inspect:
  1. **Package is live:** `npm view @daanvandenbergh/scribekit@1.0.0 version` → `1.0.0`.
  2. **No stray blogkit anywhere under dev** (excluding build/vcs dirs):
     `grep -rIl "blogkit" /Users/administrator/persistance/private/dev --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next --exclude-dir=dist --exclude-dir=build --exclude-dir=.turbo`
     → expect **zero** hits (a hit in a lockfile or `*.tsbuildinfo` = stale, rebuild that project).
  3. **Each consumer's package.json** has `@daanvandenbergh/scribekit` (correct section) and **no**
     `@daanvandenbergh/blogkit`, for: `dev/swiftguard` (deps), `dev/i18nkit` (devDeps),
     `dev/claude-code-utils` (devDeps), `dev/bergh-software/bergh-software-website` (deps),
     `dev/bergh-software/bergh-software-website/customer-website-template` (deps).
  4. **Skill symlinks resolve** in each consumer's `.claude/skills/`: `scribekit-blog`,
     `scribekit-docs`, `scribekit-hero` point into `node_modules/@daanvandenbergh/scribekit/skills/`
     and are **not broken** (`ls -lL`); no `blogkit`/`blogkit-readme-hero` symlinks remain.
  5. **Hero dirs migrated:** `dev/i18nkit/claude/scribekit-hero/readme/` and
     `dev/claude-code-utils/claude/scribekit-hero/readme/` exist (with `hero.png`/`hero.js`/
     `hero.settings.js`); no `claude/blogkit-readme-hero/` remains; README image paths point at
     `claude/scribekit-hero/readme/hero.png`.
  6. **Consumers build clean:** in each of swiftguard, bergh-software-website, and
     customer-website-template run `npm run typecheck` (and `npm run build` if quick) — must pass with
     the renamed `.scribekit-*` classes.
  7. **scribekit repo itself:** `npm run typecheck && npm test && npm run build` pass; `git log`
     shows the initial commit pushed to `origin main`.
  "Done" = all seven checks pass. If any fail, migrate the offending project (dependency line, skill
  symlinks, `claude/` hero dir, source/CSS text) exactly as the others were done, then re-run.

- [ ] **Republish i18nkit so its scribekit references reach downstream.** During the blogkit→scribekit
  rename, `@daanvandenbergh/i18nkit`'s OWN shipped skills (`skills/i18nkit-sweep/SKILL.md`,
  `skills/i18nkit-add-locale/SKILL.md` — incl. their `description:` front-matter + `reference/*.md`)
  were updated to reference `@daanvandenbergh/scribekit` instead of `@daanvandenbergh/blogkit`. Those
  edits live only in the working tree at `/Users/administrator/persistance/private/dev/i18nkit`; the
  published npm version still carries the old `blogkit` text. To propagate: in that repo review the
  changes, bump the version, `npm publish`, then `git commit`/`push`. Done = `npm view
  @daanvandenbergh/i18nkit` shows the new version and its published `skills/*/SKILL.md` mention scribekit.

- [ ] **Republish claude-code-utils so its scribekit reference reaches downstream.** The rename edited a
  shipped skill file in `@daanvandenbergh/claude-code-utils`
  (`skills/web/seo/reference/knowledge/foundations/2026-seo-myths.md`, a source-citation line) from
  blogkit to scribekit. That change is only in the working tree at
  `/Users/administrator/persistance/private/dev/claude-code-utils`; the published npm version still says
  blogkit. To propagate: in that repo bump the version, `npm publish`, then `git commit`/`push`. Done =
  `npm view @daanvandenbergh/claude-code-utils` shows the new version.

- [ ] Set the GitHub repo description/topics for `daanvandenbergh/scribekit` (the repo was just created
  and pushed; its description on github.com is still empty). `gh` CLI is not installed here, so set it
  via the GitHub web UI, or install `gh` and run `gh repo edit daanvandenbergh/scribekit --description "…"`.

- [ ] Decide on a license for the package. `package.json` is `"UNLICENSED"` and v1.0.0 was **already
  published** to npm under that. Pick and add a real license, then publish a new version.

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
