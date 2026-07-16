# app-template - a minimal Next.js App Router host for a single-locale scribekit docs corpus

The **create** path of `scribekit-docs-github-pages` copies these files to turn a bare
`docs/<slug>/en.mdx` corpus into a routed, static-exportable docs site. Destinations (relative to the
**Next app root** you choose - repo root for a dedicated docs repo):

| template file        | copy to                         |
| -------------------- | ------------------------------- |
| `_docs.ts`           | `app/docs/_docs.ts`             |
| `_docs-links.tsx`    | `app/docs/_docs-links.tsx`      |
| `_docs-image.tsx`    | `app/docs/_docs-image.tsx`      |
| `_docs-chrome.tsx`   | `app/docs/_docs-chrome.tsx`     |
| `layout.tsx`         | `app/docs/layout.tsx`           |
| `page.tsx`           | `app/docs/page.tsx`             |
| `slug-page.tsx`      | `app/docs/[slug]/page.tsx`      |
| `next.config.mjs`    | `next.config.mjs` (app root)    |
| `globals.css`        | `app/globals.css`               |

Then fill the placeholders (`<BRAND>`, `<your-pages-origin>`, the `tabs`/`groups` arrays) from the
corpus and the derived Pages origin, and add the two app-level files not carried here: a root
`app/layout.tsx` that imports **both** `@daanvandenbergh/scribekit/styles.css` **and** `./globals.css`
(the reset below), and `package.json` deps (`next`, `react`, `react-dom`, `next-mdx-remote`,
`@daanvandenbergh/scribekit`).

`globals.css` is a small base reset (`box-sizing: border-box`, `body { margin: 0 }`, a base font). It
matters: the package stylesheet assumes border-box, so without it the index section cards' padding
overflows their grid tracks and the cards wrap oddly; and `body { margin: 0 }` removes the browser's
default inset around the whole app.

**Why `_docs-links.tsx` and `_docs-image.tsx` exist (learned by building the real corpus).** Two things a
docs body carries are raw paths Next never rewrites, so on a project site (`/<repo>/`) they 404:
- **In-body prose links** (`[x](/docs/y)` -> raw `<a>`). `_docs-links.tsx`'s `BodyLink` routes internal
  links through `next/link`, so they pick up the base path and navigate client-side. Verified: under
  `basePath: '/scribekit'`, links come out `/scribekit/docs/...` with the override, `/docs/...` without.
- **Hero image** (`image:` front-matter -> raw `<img src="/assets/...">`). `next/image` does NOT help
  (under `images.unoptimized`, which export requires, it passes the src through unprefixed).
  `_docs-image.tsx`'s `BaseImg` prepends the deployment base path (from `NEXT_PUBLIC_BASE_PATH`, the same
  var `next.config.mjs` uses). Verified: hero src comes out `/scribekit/assets/...`.

So with these two components a scribekit corpus renders correctly on a **project site** as well as at the
root. The one thing they can't fix is scribekit's absolute SEO URLs (canonical/sitemap/OG), which omit the
`/<repo>` subpath - a library-level limitation. If that matters, prefer root hosting (custom domain or a
`<owner>.github.io` user/org site), where the base path is empty and even those are correct.
