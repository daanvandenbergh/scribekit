# Task: readme-hero

Make **one** hero/banner image for a project's **README** (or any single banner slot) in the shared
scribekit-hero style - white text on a full-bleed **gradient**, badge + eyebrow, auto-fit **H1**,
subtitle, optional byline - rendered deterministically to a **PNG**. It touches **no blog**: no posts,
slugs, frontmatter, rotation, or i18n. Read **[SKILL.md](./SKILL.md)** first - the three-files model,
auto-create settings, the 6 gradients, tune-gradients, and the render pipeline all live there; this file
adds only the README specifics (a single image, size/radius, rounded transparent PNG, README wiring).

Everything for this hero lives in **one directory**, `claude/scribekit-hero/readme/` (relative to the
project root; created if absent):

- **Settings (this project's brand):** `claude/scribekit-hero/readme/hero.settings.js` - seeded and
  recoloured per SKILL.md's "Auto-create `hero.settings.js`". **Optionally** also exports `size` and
  `radius` (see [Size & corner radius](#size--corner-radius)).
- **Params (this hero's text):** `claude/scribekit-hero/readme/hero.js` - a **plain object** (not a
  `(locale) => …` function - this hero is single-language):
  ```js
  export default {
      gradient: "aurora-glow",              // one of the 6 gradient names; omit -> first gradient
      title:    "Your project, in one line",// auto-fit shrinks long titles
      subtitle: "One tight supporting line beneath the title.",
      // byline: { name: "…", role: "…" },  // OPTIONAL - omit for no byline (usual for a README)
  };
  ```
- **Output:** `claude/scribekit-hero/readme/hero.png` - a **PNG** (so the rounded corners stay transparent
  - a JPEG can't hold an alpha channel).

There is **no rotation here** (rotation is a multi-post concern): a single hero uses its `gradient`
(default: the first gradient).

## Mode: readme-hero (generate / update)

1. **Brand discovery** (SKILL.md Step 0 - just the brand & assets part; the blog-only discovery is N/A).
2. **Ensure `claude/scribekit-hero/readme/hero.settings.js` exists.** If missing, auto-create it (copy
   `assets/hero.settings.template.js` there, recolour the palette to the project's brand hues, set
   `brand.font` / `brand.badge` (logo) / `brand.eyebrow`, then run **tune-gradients** once - all per
   SKILL.md). Respect an existing file - don't overwrite the user's.
3. **Ensure `claude/scribekit-hero/readme/hero.js` exists.** If missing, create it from the title +
   subtitle (ask the user if you don't have them), pick a `gradient` (default the first, or let the user
   choose), and add a `byline` only if the user wants one. Respect an existing file.
4. **Render** the hero to a PNG (see [Render](#render)).
5. **Downscale + save** the PNG to `claude/scribekit-hero/readme/hero.png` (see [Render](#render)).
6. **Verify** at full size and scaled down: gradient smooth, corners cleanly rounded (and transparent,
   not dark), brand correct, title legible, matches the post-hero family.
7. **Offer README wiring** (see [Wire into the README](#wire-into-the-readme)).

Re-running over an existing hero is the **update** path: edit `hero.js` (or `hero.settings.js`),
re-render, overwrite `hero.png`.

## Size & corner radius

The hero is **1200×630 by default** (the OG / GitHub social-preview ratio). To render a different shape
(e.g. a wide README banner), add an optional export to `hero.settings.js`:

```js
export const size = { w: 1200, h: 400 };   // omit this export entirely for the 1200x630 default
```

Only `hero.settings.js` carries size - the shared component is never edited. Wider/shorter is fine;
**keep `h` no smaller than ~420** so the auto-fit title (which fits within a fixed 300px band) and the
vertically-centred content don't clip. If a very short banner clips, shorten the title/subtitle.

The corners are **rounded by 10px by default** - baked into the image so they render everywhere,
including on GitHub (which strips inline CSS from READMEs, so a `style="border-radius"` on the `<img>`
would silently do nothing). The rounding is cut into a **transparent** PNG, so the corners adopt whatever
background the README sits on (light or dark). Override or disable it with an optional export:

```js
export const radius = 10;   // px at 1200-wide; omit -> 10; set 0 for square corners
```

`radius` is a CSS px value relative to the 1200-wide stage; the render bakes it in at 2× DPR so a
downscaled 1200-wide image shows exactly that radius.

## Render

Use SKILL.md's **"Render pipeline (headless Chrome)"** with the readme-variant paths and a **single**
render (no `?lang=` - this hero is single-language):

1. **Fill the host** (SKILL.md render step 1) with:
   - `{{HERO_COMPONENT}}` -> `file://<skill>/assets/hero.js`
   - `{{HERO_SETTINGS}}`  -> `file://<project>/claude/scribekit-hero/readme/hero.settings.js`
   - `{{HERO_PARAMS}}`    -> `file://<project>/claude/scribekit-hero/readme/hero.js`
2. **Apply size + rounded corners.** Read `W,H` from settings `size` (default `1200,630` when absent) and
   `R` from settings `radius` (default `10` when absent; `0` = square). Inject one style block into the
   scratchpad host's `<head>` (just before `</head>`):
   ```html
   <style>
     html, body { background: transparent !important; }  /* cut the corners through to transparency */
     .stage { border-radius: Rpx !important; }            /* omit this line when R is 0 */
     .stage { width: Wpx !important; height: Hpx !important; }  /* omit this line unless size is set */
   </style>
   ```
   `hero.js` paints an opaque page background (`html,body{background:#0e0e11}`), so without the
   `background:transparent` override the four corners outside the rounded stage would render dark instead
   of transparent. The inline `!important` beats the component's runtime rules, and the size override's
   auto-fit then fits the title at the overridden width. (When `R` is 0 **and** no custom `size`, only the
   `background:transparent` rule is needed - and even that is harmless to always inject.)
3. **Screenshot once** with SKILL.md's exact flags but `--window-size=W,H` (the stage is anchored at the
   page origin, so a `W×H` window at DPR 2 captures a crisp `2W×2H` source) and **no** `?lang=` on the
   `file://` URL. `--default-background-color=00000000` (already in the flags) screenshots on a
   transparent canvas, so the rounded corners come out transparent. Run it backgrounded and poll for the
   PNG exactly as SKILL.md's snippet shows.
4. **Downscale + save** the 2×-DPR PNG to the final PNG with `sips`, sized `H W` (a plain resize keeps the
   format PNG and preserves the transparent corners - no ImageMagick, no JPEG re-encode):
   ```
   sips -z H W <out>.png --out claude/scribekit-hero/readme/hero.png
   ```

## Wire into the README

After `hero.png` is written, **always print** the ready-to-paste Markdown so the user can embed it:

```md
![](claude/scribekit-hero/readme/hero.png)
```

Then **offer** to wire it into `README.md` (only edit it on the user's OK - it's their document):
- If `README.md` already contains an image (Markdown `![...](…)` or `<img src="…">`) pointing at
  `claude/scribekit-hero/readme/hero.png` (or a stale `hero.jpg` / old path), **replace that tag in place**
  (keeps its position/alt text, and swaps a `.jpg` reference to `.png`).
- Otherwise, offer to **insert** the snippet near the top (typically right under the H1 title).

(The guardrails - HTML/CSS render, `hero.settings.js`-only brand/size/radius, baked-in rounding, local
asset, no dev server, no git branches - are in SKILL.md's **Guardrails**.)
