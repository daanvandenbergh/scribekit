---
name: scribekit-hero
description: Generate polished, on-brand hero images - rendered deterministically from HTML/CSS (no AI image generator) - for a project's blog posts, docs pages, and its README. One skill for all hero work: create or update a single post/page hero, regenerate every post/page hero after a design change, tune the shared gradient palette, and make a README/social-preview banner in the same visual family. Self-contained (carries its own hero design assets) and portable - it learns each project's brand first. Use when the user wants to make/update/regenerate a blog post hero, a docs page hero, a README hero/banner, or tune the hero gradients.
user-invokable: true
argument-hint: "[blog-hero|regenerate-heroes|docs-hero|regenerate-docs-heroes|readme-hero|tune-gradients] [slug | blog|docs|readme]"
---

# scribekit-hero

All hero-image generation for a project, in one skill: **blog post heroes**, **docs page heroes**, and
a **README hero**, authored in HTML/CSS and rendered to an image (never an AI image generator). Every
hero shares one cohesive family - white text on a full-bleed **gradient**, with a **badge + eyebrow**,
an auto-fit **H1**, a **subtitle**, and an optional **byline**. **Nothing about any project is baked
in**: the skill **learns the current project first** (Step 0), then designs to match its brand. This
file is the router **and** the shared design foundation; the mode files (`blog.md`, `docs.md`,
`readme.md`) add only what differs.

This skill is **self-contained** - it carries its own design assets in `assets/` and depends on no
other skill. `/scribekit-blog` (the blog writer) calls into this skill for a new post's hero.

## Step 0 - Learn this project (every mode starts here)

Discover the project so the hero is *this project's*, not generic. Gather as working notes:

- **Brand & assets** - brand tokens (CSS custom properties in a `globals.css`/theme, or a
  Tailwind/theme config), the site font (family + its webfont stylesheet URL), and any logo / mark /
  motif in the assets dir. These seed the project's `hero.settings.js`. Note any existing hero images
  so a new one matches them.
- **Project style rules** - obey the project's own conventions (its `CLAUDE.md`): punctuation (some
  projects ban em-dashes), British vs US spelling, etc. - they show up in hero title/subtitle text.
- **For the blog and docs modes also learn** (skip for `readme-hero`): where posts/pages live (the
  blog content dir and its reader, or the docs `contentDir` from the project's `new Docs({...})` /
  `_docs.ts`), the **public assets dir** heroes are served from (e.g. `public/`, `static/`), and
  whether the surface is **multi-language** (look for `locales`/`defaultLocale` in the `Blog`/`Docs`
  config, or `<lang>.<ext>` files inside the folders) - note the configured codes and the default
  locale.

If the project genuinely has none of this (a near-empty repo), **ask the user** for the essentials
rather than guessing.

## Pick the mode

- **blog-hero** `<slug|path>` - create a blog post's hero, or update an existing one.
  -> **[blog.md](./blog.md)**.
- **regenerate-heroes** - re-render **every** blog post's hero from its saved params (e.g. after the
  component or `hero.settings.js` changed). -> **[blog.md](./blog.md)**.
- **docs-hero** `<slug|path>` - create a docs page's hero, or update an existing one.
  -> **[docs.md](./docs.md)**.
- **regenerate-docs-heroes** - re-render **every** docs page's hero from its saved params.
  -> **[docs.md](./docs.md)**.
- **readme-hero** - create or update the README (or any single banner) hero.
  -> **[readme.md](./readme.md)**.
- **tune-gradients** `[blog|docs|readme]` - review and adjust a project's hero gradient palette until
  every gradient is smooth, polished, and on-brand (blog palette by default; `docs` for the docs
  palette; `readme` for the README palette; below).

Edge cases:
- **`blog-hero`/`docs-hero` with no target** -> list the posts/pages in the content dir and ask which.
- **Ambiguous verb** -> ask one clarifying question first. **Never** run two modes in one invocation.

## Three files, one design (how every hero is built)

Design, brand, and content are separated so a design change never means re-editing posts:

- **Component (ships with this skill)**: `assets/hero.js` - the reusable hero design (structure, base
  styles, auto-fit, readiness). **Never copied into a project, never recoloured.** Update it once and
  re-run `regenerate-heroes` (and re-render the README hero) and every hero picks up the change.
- **Settings (one per surface)**: `hero.settings.js` - the brand: `gradients` (named background options
  over one palette) and `brand` (font, badge/logo, eyebrow, default byline). The **only** place a
  project customises how heroes look. Seeded from `assets/hero.settings.template.js`. Its location
  depends on the surface: blog = `<content-dir>/hero.settings.js`; docs =
  `<docs-content-dir>/hero.settings.js`; README = `claude/scribekit-hero/readme/hero.settings.js`.
- **Params (one per hero)**: `hero.js` - pure data: `export default` the hero's params (gradient pick +
  title + subtitle, optional byline). Saved so any hero is reproducible.

The HTML that wires the three together lives once in `assets/hero.host.html` (with `{{HERO_COMPONENT}}`
/ `{{HERO_SETTINGS}}` / `{{HERO_PARAMS}}` tokens); the render step fills those with absolute `file://`
paths into a throwaway scratchpad copy and screenshots it. **Committed files are never modified by a render.**

### Auto-create `hero.settings.js` if it's missing
When a hero is needed and the surface's `hero.settings.js` doesn't exist (or the user asks):
1. Copy `assets/hero.settings.template.js` to the surface's settings path.
2. **Recolour the palette** (the `c = {...}` triplets): one distinct brand hue per slot (from the site's
   tokens - e.g. blue / violet / cyan / indigo), applied across all 6 gradients. Keep a **dark
   `violetDeep`** so white text stays legible. (The 6 gradient recipes read from this palette, so
   recolouring the palette recolours every gradient cohesively.)
3. Set `brand.font` (family + the webfont stylesheet `url`) to the project font.
4. Set the **badge** to the project logo/mark: either an inline SVG string, or a logo image resolved
   relative to the settings file so it loads headless -
   `badge: { src: new URL("../public/logo/logo-rounded.png", import.meta.url).href }` (point at the real
   file under the discovered assets dir). Set `brand.eyebrow` to the uppercase site name and
   `brand.byline` to the default author.
5. Run **tune-gradients** (below) before first use.

**Migrating a legacy project**: if an old `<content-dir>/hero.template.html` exists, seed the new
settings from it - copy its `--c-*` slot colours into the palette, its `--font` into `brand.font`, and
its badge SVG + byline into `brand`. The legacy file is then unused (it can be deleted).

## The 6 gradients

Names (defined in `hero.settings.js`): `radial-mesh` · `diagonal-ribbon` · `aurora-glow` ·
`soft-sweep` · `horizon-glow` · `veil`. A hero uses one by name. **Blog posts and docs pages rotate
consecutively** so heroes cycle evenly (see [blog.md](./blog.md) / [docs.md](./docs.md)); a README hero
just uses its `gradient` (default: the first).

## tune-gradients

Verify/refine a `hero.settings.js`'s gradient palette until it's **very smooth and very polished, all
in-brand**. **Target**: `tune-gradients` (or `tune-gradients blog`) tunes the **blog** palette
`<content-dir>/hero.settings.js`; `tune-gradients docs` tunes the **docs** palette
`<docs-content-dir>/hero.settings.js`; `tune-gradients readme` tunes the **README** palette
`claude/scribekit-hero/readme/hero.settings.js`. (The `readme-hero` flow also runs this on the README
settings when it first seeds them.) The steps below are identical for any target.
1. Ensure the target `hero.settings.js` exists (auto-create first if not).
2. **Render the gallery**: fill `assets/hero.gallery.html`'s two tokens (`{{HERO_COMPONENT}}` ->
   `assets/hero.js`, `{{HERO_SETTINGS}}` -> the target settings) into a scratchpad copy and screenshot
   it at `--window-size=1200,<630 * number-of-gradients>` (6 gradients → `1200,3780`). It stacks one
   sample hero per gradient. (The palette is size-independent - render the gallery at its default 1200
   wide regardless of any README `size`.)
3. **Assess each**: gradient smoothness (no harsh banding - fades use same-hue-zero-alpha), polish,
   on-brand hues, distinctness from siblings, and **white-text legibility** in the top-left content
   zone. Fold in any **user comments**.
4. **Edit only colour** in `hero.settings.js` - the palette `c` triplets (and, if needed, a gradient's
   stop positions); keep the mapping consistent across all 6 so the family holds. Re-render and repeat.
5. **Report** the before/after and the final palette.

## Render pipeline (headless Chrome) - shared mechanism

The claude-in-chrome MCP blocks `file://`, so use **headless Chrome from the CLI** (macOS:
`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`; Linux: `google-chrome`/`chromium`).
Each mode supplies its own settings/params paths, window size, output, and encoding; the mechanism is
the same.

**1. Fill the host into the scratchpad.** Copy `assets/hero.host.html` to a scratchpad file, replacing
the three tokens with absolute `file://` paths:
- `{{HERO_COMPONENT}}` → `file://<skill>/assets/hero.js`
- `{{HERO_SETTINGS}}`  → `file://<the surface's hero.settings.js>`
- `{{HERO_PARAMS}}`    → `file://<the hero's hero.js>`

**2. Screenshot** with headless Chrome. Blog and docs heroes pass the locale via the URL query
(`?lang=<code>`), one screenshot per locale; a README hero renders once (no `?lang=`):

```
"<chrome>" --headless=new --hide-scrollbars --force-device-scale-factor=2 \
  --window-size=<W>,<H> --virtual-time-budget=6000 --default-background-color=00000000 \
  --allow-file-access-from-files --user-data-dir="<fresh temp dir>" \
  --screenshot="<out>.png" "file://<scratchpad-host>.html[?lang=<code>]"
```

- `--allow-file-access-from-files` is **required** - it lets the host's ES-module `import`s resolve over
  `file://` (Chrome CORS-blocks them otherwise).
- The stage sits at the page origin, so a `W×H` window captures exactly the hero; DPR 2 → a crisp
  `2W×2H` source. The component flips `document.documentElement.dataset.ready="1"` once the font swaps,
  any logo image decodes, and the title is auto-fit. Default `W,H` is `1200,630`.
- Use a **fresh `--user-data-dir` per render** (a running/stale Chrome locks the profile).
- **Chrome lingers ~60s after writing the screenshot** in `--headless=new`. Don't block on it: run it in
  the background, poll for the `.png` to appear, then kill it. macOS has no GNU `timeout`, so poll:
  ```bash
  "<chrome>" ...flags... --screenshot="$OUT" "file://$HOST[?lang=$CODE]" >/dev/null 2>&1 &
  PID=$!; for i in $(seq 1 120); do [ -s "$OUT" ] && break; sleep 0.25; done; sleep 0.3
  kill "$PID" 2>/dev/null; wait "$PID" 2>/dev/null
  ```

**3. Optimise + save** - per mode (blog/docs → 1200×630 JPEG via `sips`; README → downscaled PNG keeping
the transparent rounded corners). See each mode file.

## Guardrails (all modes)
- Design is **HTML/CSS**, rendered deterministically - never an AI image generator or stock photo.
- **Only `hero.settings.js` carries brand/colour/size/radius.** Never hardcode a project's colours into
  the shared `assets/hero.js`, and never copy the component into a project.
- **Output shape per surface (never conflate them)**: a **blog** or **docs** hero is a full **opaque
  rectangle** JPEG - the site rounds/borders it in CSS, so never bake rounding into it. A **README**
  hero is a **PNG with rounding baked into transparent corners** (GitHub strips README CSS, so it can't
  round the `<img>`). Every hero is a **local asset**, never a remote URL.
- Never start a dev server (ask the user). Never create git branches. Touch only hero assets, the
  surface's `hero.settings.js` / `hero.js` params, and (blog/docs) the post/page `image:`/`updated:`
  frontmatter, or (README, on the user's OK) `README.md`.
