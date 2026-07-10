# Task: blog heroes (modes: blog-hero | regenerate-heroes)

Create, update, or regenerate **blog post** hero images. A post's hero wires into it via `image:`
frontmatter and appears full-width on the post page and scaled-down on the overview grid, so every
hero must share **one cohesive family**. Read **[SKILL.md](./SKILL.md)** first - Step 0, the
three-files model, auto-create settings, the 6 gradients, tune-gradients, and the render pipeline all
live there; this file adds only the blog specifics (rotation, i18n, JPEG output, frontmatter wiring).

The blog surface's settings file is **`<content-dir>/hero.settings.js`**; a post's params are
**`<content-dir>/<slug>/hero.js`** (one file per post, covering every language).

## Consecutive rotation (blog only)

Heroes cycle evenly through the 6 gradients: a new post picks
`gradients[(number of existing posts) mod gradients.length].name` (0 → `radial-mesh`, 1 →
`diagonal-ribbon`, …). Deterministic, no random pick. A post keeps its picked gradient across every
language (one params file), so translations always match.

## blog-hero (create, or update an existing slug)

1. **Ensure `<content-dir>/hero.settings.js` exists** (auto-create + tune-gradients per SKILL.md if not).
2. **Resolve the target post** (slug/path). No target -> list the content dir and ask.
3. **If the slug has no hero yet (create)**: pick the gradient by rotation. **If it already has one
   (update)**: keep its gradient unless the user is restyling - you're editing the existing params.
4. **Write `<content-dir>/<slug>/hero.js`** - the params the post needs, nothing more:
   ```js
   export default {
       gradient: "aurora-glow",                 // the rotated gradient name
       title:    "The exact post title",        // auto-fit shrinks long ones
       subtitle: "One tight supporting line",   // a shortened form of the post description (~1-2 lines)
       // byline: { name: "Author", role: "", avatar: { src: new URL("../../public/assets/blog/authors/author.svg", import.meta.url).href } },
       //                                        // optional; define it to show a byline, OMIT it to render no
       //                                        // byline. `avatar` is an author image/SVG (resolved like the
       //                                        // settings `badge`) and falls back to the brand badge; any field
       //                                        // left out here is filled from `hero.settings.js`'s brand byline.
   };
   ```
   The eyebrow (brand name) comes from `hero.settings.js` - do not repeat it here. The byline is
   per-post: include it above to show one (brand defaults fill any omitted field), or leave it out for no
   byline. For a multi-language post, use the `(locale) => params` form (see i18n below) instead.
5. **Render** each configured locale (single-language blog = just the default) via the render pipeline
   (SKILL.md), passing `?lang=<code>`.
6. **Optimise + save**: downsample each render to 1200×630 and encode a JPEG (~80 KB), one per locale,
   to `<assets>/blog/<slug>/hero.<code>.jpg` - every language named by its code, default included
   (e.g. `hero.en.jpg`, `hero.fr.jpg`), matching the post files (`en.mdx`, `fr.mdx`):
   ```
   sips -z 630 1200 -s format jpeg -s formatOptions 82 <out>.png --out <assets>/blog/<slug>/hero.<code>.jpg
   ```
7. **Wire** `image: "/<assets>/blog/<slug>/hero.<code>.jpg"` into each language's post. **Updating an
   existing hero**: also bump `updated:` (`date +%F`, quoted) on the posts.
8. **Verify** at full size **and** ~320px card scale: title legible, on-brand, matches sibling heroes.

### Localised heroes (multi-language blogs)

The hero bakes in the post's text, so **every translation gets its own rendered JPEG** - a translation's
`image:` must never point at another language's file. But there is **one params file per post**, not one
per language: `<slug>/hero.js` exports a `(locale) => params` function that returns each language's text.

```js
// <content-dir>/<slug>/hero.js - one file, all languages.
// Optional compile-time safety: annotate with your i18nkit Locale type; the type import erases at
// runtime, so this still runs as plain JS in the headless browser (no bundler, no runtime i18nkit).
/** @satisfies {Record<import("../../app/i18n.js").Locale, { title: string, subtitle: string }>} */
const text = {
    en: { title: "Getting started", subtitle: "Wire a Next.js blog together in three files." },
    fr: { title: "Demarrer",        subtitle: "Assemblez un blog Next.js en trois fichiers." },
};   // drop a locale -> `tsc --noEmit` (checkJs) flags it; i18nkit-sweep flags it project-wide
export default (locale = "en") => ({ gradient: "aurora-glow", ...text[locale] });
```

- **Same gradient across languages** - it is the one `gradient` value in the shared file, so no
  re-rotation is possible or needed.
- **Render loops the configured locales** (from Step 0), one JPEG each, into the post's folder as
  `<assets>/blog/<slug>/hero.<code>.jpg` - every language named by its code (e.g. `hero.en.jpg`, `hero.fr.jpg`).
- **Completeness**: if a configured locale returns no text (`params(locale)` empty), stop and fix the
  params file - that language would render a blank title.

## regenerate-heroes

Re-render **every** blog hero from its saved params - run this after changing the component
(`assets/hero.js`) or the project's `hero.settings.js`, so a single design/brand tweak flows to all
heroes with zero per-post edits.
1. Glob `<content-dir>/*/hero.js` (each post folder has exactly one).
2. For each, render **all configured locales** via the pipeline (SKILL.md) and overwrite
   `<assets>/blog/<slug>/hero.<code>.jpg`.
3. **Report** the count rendered (posts × locales). Do not touch the posts' frontmatter (the `image:`
   paths are unchanged).
