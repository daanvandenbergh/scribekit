# Demo - Claude Code Blog

A minimal, complete Next.js (App Router) app that uses
[`@daanvandenbergh/scribekit`](../README.md). It's the full working reference: copy the
file layout into your own site.

> **Note:** to stay a single in-repo project (no `file:` symlink), this demo imports the built
> package straight from `../dist` (e.g. `../../dist/react`) and shares the repo-root
> `node_modules`, so exactly one React instance is used. In *your own* app you install the
> package and import it by name - `@daanvandenbergh/scribekit` / `.../react` /
> `.../styles.css` - as the snippets in the [root README](../README.md) show.

## What's here

```
demo/
  blog/                     # the MDX posts (file name = slug)
    getting-started.mdx
    writing-with-mdx.mdx
  app/
    layout.tsx              # imports the package stylesheet + your page chrome
    page.tsx                # home page (links into the blog)
    blog/
      _blog.ts              # the single configured Blog instance
      page.tsx              # /blog       - <BlogOverview>
      [slug]/page.tsx       # /blog/<slug> - <BlogPage>
```

That's the whole integration: one `Blog` instance and two route files.

## Run it

From the **repo root** (the demo has no dependencies of its own - it uses the repo's
`node_modules` and the built `../dist`):

```bash
npm install        # once, at the repo root
npm run demo       # builds the package, then serves the demo at http://localhost:3000 -> /blog
```

`npm run demo` runs `npm run build` first so `../dist` exists, then starts `next dev` in this
folder. After editing the package source, re-run `npm run build` (or `npm run demo`) to
refresh `dist`.
