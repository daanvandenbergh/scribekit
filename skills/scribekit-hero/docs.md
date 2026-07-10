# Task: docs heroes (modes: docs-hero | regenerate-docs-heroes)

Create, update, or regenerate **docs page** hero images. A page's hero wires into it via the
**`DocMeta.image`** front-matter and is used as its **OG / social-card** image (the docs page component
does not render it inline), so every hero must share **one cohesive family**. Read **[SKILL.md](./SKILL.md)** first - Step 0, the three-files
model, auto-create settings, the 6 gradients, tune-gradients, and the render pipeline all live there;
this file adds only the docs specifics (rotation, i18n, JPEG output, `DocMeta.image` wiring).

The docs surface's settings file is **`<docs-content-dir>/hero.settings.js`**; a page's params are
**`<docs-content-dir>/<slug>/hero.js`** (one file per page, covering every language). The
`<docs-content-dir>` is the `Docs` config's `contentDir`, discovered in Step 0 (from a project's
`new Docs({ contentDir })` - a `_docs.ts`), exactly as the blog surface uses the `Blog` config.

## Consecutive rotation (docs)

Heroes cycle evenly through the 6 gradients: a new page picks
`gradients[(number of existing doc pages) mod gradients.length].name` (0 -> `radial-mesh`, 1 ->
`diagonal-ribbon`, ...). **Count distinct page folders** (`<docs-content-dir>/<slug>/`), one per slug -
include `hidden` pages, and count each slug **once** (a page keeps its gradient across every language,
since there is one params file). Deterministic, no random pick.

## docs-hero (create, or update an existing slug)

1. **Ensure `<docs-content-dir>/hero.settings.js` exists** (auto-create + tune-gradients per SKILL.md
   if not - its own docs palette, seeded from the brand).
2. **Resolve the target page** (slug/path). No target -> list the docs content dir and ask.
3. **If the slug has no hero yet (create)**: pick the gradient by rotation. **If it already has one
   (update)**: keep its gradient unless the user is restyling - you're editing the existing params.
4. **Write `<docs-content-dir>/<slug>/hero.js`** - the params the page needs, nothing more:
   ```js
   export default {
       gradient: "aurora-glow",                 // the rotated gradient name
       title:    "The exact page title",        // auto-fit shrinks long ones
       subtitle: "One tight supporting line",   // a shortened form of the page description (~1-2 lines)
   };
   ```
   The eyebrow (brand name) comes from `hero.settings.js` - do not repeat it here. **Omit the byline**:
   `DocMeta` has no author field, so docs heroes carry no byline (like the README, unlike blog.md's
   optional byline) - do not copy the byline block from blog.md. For a multi-language page, use the
   `(locale) => params` form (see i18n below) instead.
5. **Render** each configured locale (single-language docs = just the default) via the render pipeline
   (SKILL.md), passing `?lang=<code>`.
6. **Optimise + save**: downsample each render to 1200x630 and encode a JPEG (~80 KB), one per locale,
   to `<assets>/docs/<slug>/hero.<code>.jpg` - every language named by its code, default included
   (e.g. `hero.en.jpg`, `hero.fr.jpg`), matching the page files (`en.mdx`, `fr.mdx`):
   ```
   sips -z 630 1200 -s format jpeg -s formatOptions 82 <out>.png --out <assets>/docs/<slug>/hero.<code>.jpg
   ```
   A docs hero is an **opaque JPEG rectangle** (the site rounds/borders it in CSS) - **never** a
   rounded transparent PNG like the README hero.
7. **Wire** `image: "/<assets>/docs/<slug>/hero.<code>.jpg"` into each language's page front-matter -
   **always a site-root path with a leading slash**, never a bare filename and never a full URL (OG
   emits `DocMeta.image` as-is under `metadataBase`, JSON-LD absolutizes it; only a leading-slash root
   path is correct on both). **Updating an existing hero**: also bump `updated:` (`date +%F`, quoted).
8. **Verify** at full size **and** ~320px card scale: title legible, on-brand, matches sibling heroes.

### Localised heroes (multi-language docs)

The hero bakes in the page's text, so **every translation gets its own rendered JPEG** - a
translation's `image:` must never point at another language's file. But there is **one params file per
page**, not one per language: `<slug>/hero.js` exports a `(locale) => params` function.

```js
// <docs-content-dir>/<slug>/hero.js - one file, all languages.
const text = {
    en: { title: "Configure a Docs instance", subtitle: "Wire your docs content dir in one file." },
    fr: { title: "Configurer une instance Docs", subtitle: "Reliez votre dossier docs en un fichier." },
};
export default (locale = "en") => ({ gradient: "aurora-glow", ...text[locale] });
```

- **Same gradient across languages** - it is the one `gradient` value in the shared file, so no
  re-rotation is possible or needed.
- **Render loops the configured locales** (from Step 0), one JPEG each, into the page's folder as
  `<assets>/docs/<slug>/hero.<code>.jpg` - every language named by its code (e.g. `hero.en.jpg`).
- **Completeness**: if a configured locale returns no text (`params(locale)` empty), stop and fix the
  params file - that language would render a blank title.

## regenerate-docs-heroes

Re-render **every** docs hero from its saved params - run this after changing the component
(`assets/hero.js`) or the docs `hero.settings.js`, so a single design/brand tweak flows to all heroes
with zero per-page edits.
1. Glob `<docs-content-dir>/*/hero.js` (each page folder has exactly one).
2. For each, render **all configured locales** via the pipeline (SKILL.md) and overwrite
   `<assets>/docs/<slug>/hero.<code>.jpg`.
3. **Report** the count rendered (pages x locales). Do not touch the pages' frontmatter (the `image:`
   paths are unchanged).
