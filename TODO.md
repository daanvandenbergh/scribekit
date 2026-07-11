# To Do list
  
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
