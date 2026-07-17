---
name: scribekit-docs-github-pages
description: Publish a scribekit docs site to GitHub Pages as a static export - whether it already has a Next.js app or is just a bare `docs/<slug>/*.mdx` corpus. It learns the project; SCAFFOLDS the Next.js host app when the corpus has none; patches the config for `output: 'export'`; writes the deploy workflow; sets `siteUrl` to the Pages origin; and handles what static export changes in the routing layer (middleware clean-URLs and renamed-slug redirects). Use when the user wants to publish / deploy / host / ship their docs on GitHub Pages, turn a `docs/` folder into a live docs site, put their docs online, or asks "how do I get my docs on GitHub Pages?". This is the deployment/hosting skill - NOT for writing or editing docs content (that is /scribekit-docs).
user-invokable: true
argument-hint: "[--verify]"
---

# scribekit-docs-github-pages

A portable skill with **one job**: get a scribekit docs site **published on GitHub Pages** as a static
export, with as few manual steps left to the user as possible. It **learns the project first** (Step 0),
which puts it on one of two paths:

- **Deploy** - a Next.js app already renders the docs. Just make it export-and-publish: config, workflow,
  `siteUrl`, blockers.
- **Create** - there is a `docs/<slug>/*.mdx` corpus but **no app to render it** (no `new Docs(...)`, no
  routes). Scaffold the standard host app from the corpus first (the [Create mode](#create-mode---scaffold-the-host-app-corpus-but-no-app) step), then deploy it.

**Nothing is baked in.** It reads *this* project's corpus, any `Docs` wiring, Next app layout, and git
remote to decide the Pages URL and the base path - it does not assume any one project's shape.

**This is not a content skill.** Writing, rewriting, or reorganizing docs *pages* is
**[/scribekit-docs](../scribekit-docs/SKILL.md)**. This skill turns an existing corpus into a published
site; it never edits page bodies. If the project has **no docs content at all** (no `docs/` corpus), say
so and point at `/scribekit-docs`.

**Why this is mostly config, not code.** A scribekit docs site is already static-export-ready: the
`Docs` class reads the filesystem at build time, pages are rendered as React Server Components with
`next-mdx-remote/rsc`, search is client-side Fuse.js, and every dynamic route already ships
`generateStaticParams` + `export const dynamicParams = false`. So `next build` with `output: 'export'`
prerenders the whole site to static HTML. The only things affected are two **routing-layer** conveniences
a project may layer on top (Step 5): middleware clean-URLs **break**, and renamed-slug redirects
**degrade** to a client-side redirect.

`--verify` (optional argument): after setup, also run the local export build and browser check in Step 7.

---

## Step 0 - Learn this project

Gather these before changing anything. Keep them as working notes for the run.

1. **Decide the mode - is there an app, a corpus, or nothing?** `grep -rn "new Docs(" --include=*.ts
   --include=*.tsx` (ignore `dist/`, `node_modules/`, tests) and look for a `docs/` (or similarly named)
   folder of `<slug>/*.mdx` pages.
   - **A `Docs` instance exists -> DEPLOY mode.** Pick the real `_docs.ts` colocated with the route files
     (the one a project mirrors from `_blog.ts`) and read: `contentDir`, `siteUrl`, `basePath`
     (default `/docs`), `locales`, `defaultLocale`, `prefixDefaultLocale`, and `redirects`. Continue to
     Step 1.
   - **A corpus exists but NO `Docs` instance / no routes -> CREATE mode.** The content is there but
     nothing renders it. Read the corpus (below), then do the
     [Create mode](#create-mode---scaffold-the-host-app-corpus-but-no-app) step before Step 1.
     - **Learn the corpus:** enumerate `<slug>/` folders; is it single-locale (only `en.mdx`/`post.mdx`
       per folder) or multi-locale (also `<code>.mdx`)? Read each page's front-matter `tab` / `group` /
       `order` (you need the distinct **tabs** and **groups**, in order, for the `Docs` config) and
       `image` (the hero path), and **confirm the hero JPEGs exist** at those paths under a `public/`.
   - **Neither -> no docs content.** Say so and point at `/scribekit-docs`. Do not scaffold content here.

2. **Find (deploy) or choose (create) the Next app root.** DEPLOY: the nearest `package.json` whose deps
   include `next`, above the route files - where `next build` runs and where `next.config.*`, `public/`,
   and (usually) `.github/` belong; if it is a subdirectory (e.g. `web/`), note it (the workflow needs
   it, Step 3). CREATE: there is no app yet - decide **where it will live** (the Create step covers this;
   a corpus whose links are `/docs/...` and images `/assets/...` assumes an app served from that same
   root).

3. **Derive the Pages origin and base path** from `git remote get-url origin` (parse `owner` + `repo`):
   - `repo` is exactly `<owner>.github.io` -> **user/org site**, served at the root
     `https://<owner>.github.io/`. Base path is **empty**. `siteUrl` = `https://<owner>.github.io`.
   - a `public/CNAME` file exists -> **custom domain**, served at the root. Base path is **empty**.
     `siteUrl` = `https://<that-domain>`.
   - otherwise -> **project site**, served under `https://<owner>.github.io/<repo>/`. Base path is
     `/<repo>` (GitHub's `configure-pages` injects it in CI - see Step 5's project-site note).
     `siteUrl` = `https://<owner>.github.io/<repo>`.
   - No git remote yet? Ask the user for the final URL, or tell them to add the remote first.

4. **Detect the static-export blockers** (DEPLOY mode only - a freshly scaffolded app has none; Step 5
   handles whichever are present):
   - **Middleware**: a `middleware.ts`/`middleware.js` or `proxy.ts`/`proxy.js` at the app root that
     rewrites/redirects section URLs (the clean default-locale trick).
   - **Runtime redirects**: `permanentRedirect(` or `redirect(` called in a docs route file, fed by a
     non-empty `redirects` config on the `Docs` instance.
   - **`next/image`**: any `import ... from "next/image"` in the app (scribekit's `DocsPage` defaults
     to a plain `<img>`, but a blog on the same site, or a custom `imgComponent`, may use it).

5. **Note a coexisting blog.** `output: 'export'` exports the **whole** Next app, so a `Blog` section on
   the same app is exported too and is subject to the same rules (its own middleware/redirects/images).
   Keep the focus on docs, but flag blog-side blockers you see so the export does not surprise the user.

If the project is a near-empty repo with none of this, ask the user for the essentials rather than
guessing.

---

## Create mode - Scaffold the host app (corpus, but no app)

Skip this whole section in DEPLOY mode. Run it when Step 0 found a corpus with nothing rendering it, to
build the standard **single-locale flat** host app - the layout the README's `## Docs` section documents
and this skill's **[assets/app-template/](./assets/app-template/)** carries (proven by building the real
corpus: all pages export as static HTML). For a **multi-locale** corpus, scaffold the `[lang]` tree from
the README's `## Multiple locales` recipe with `prefixDefaultLocale: true` instead (a static host has no
middleware for clean default-locale URLs - see Step 5), then rejoin at Step 1.

1. **Decide where the app lives and how it is hosted - confirm both with the user.** A scribekit corpus
   writes internal links as `/docs/<slug>` and hero paths as `/assets/...`, i.e. it assumes an app served
   from **that same root**. Two consequences:
   - **App location.** If the repo is a dedicated docs repo, the app is the repo root. If the repo root is
     already a package (a library `package.json`, not a Next app), put the app in a subdirectory and make
     the corpus's hero assets reachable from that app's `public/` (move/copy `public/assets/...` under it,
     or point the corpus's `contentDir` at the shared folder). Do not fight the corpus's root-relative
     paths.
   - **Hosting model - both work.** A **project site** (`/<repo>/` base path) renders correctly: the
     template's `BaseImg` + `BodyLink` and the workflow's `NEXT_PUBLIC_BASE_PATH` plumbing make heroes,
     links, and assets resolve under the subpath (Step 5) - no custom domain needed. The **only** thing a
     subpath can't fix is scribekit's absolute SEO URLs (canonical/sitemap/OG omit `/<repo>`). If SEO
     matters, prefer **root hosting** - a custom domain (`public/CNAME`) or a `<owner>.github.io` user/org
     site - where the base path is empty and even those are correct.

2. **Copy the template and fill it in.** Copy **[assets/app-template/](./assets/app-template/)** per its
   `README.md` table (`_docs.ts`, `_docs-links.tsx`, `_docs-chrome.tsx`, `layout.tsx`, `page.tsx`,
   `slug-page.tsx` -> `app/docs/[slug]/page.tsx`). Then substitute, from Step 0's corpus read:
   - `_docs.ts`: `contentDir` (the corpus folder, resolved from the app root), `brandName`, and the
     **`tabs` / `groups` arrays** - list every distinct tab and group **in the intended order** (required,
     or the sidebar falls back to filesystem order). `siteUrl` is set in Step 4.
   - `<BRAND>` in `_docs.ts` and `_docs-chrome.tsx`.
   - The template's `slug-page.tsx` already passes `components={{ a: BodyLink }}` so in-body links are
     base-path-aware and client-side - keep it.

3. **Add the two app-level files** the template does not carry (it does carry `next.config.mjs` and
   `globals.css`):
   - `app/layout.tsx` - a root layout that renders `<html><body>` and imports **both**
     `@daanvandenbergh/scribekit/styles.css` **and** `./globals.css` (the reset - without its
     `box-sizing: border-box` the index section cards wrap oddly, and `body { margin: 0 }` removes the
     default inset).
   - `package.json` - deps `next`, `react`, `react-dom`, `next-mdx-remote`, and
     `@daanvandenbergh/scribekit`; commit a lockfile (the workflow's `npm ci` needs it).
   - Ensure the corpus's hero JPEGs sit under the app's `public/` at the `image:` paths.

Then continue to Step 1. A freshly scaffolded app has no middleware and no `redirects`, so most of Step 5
is inert - only the project-site note applies.

---

## Step 1 - Patch `next.config.*`

The config must (a) static-export, (b) not optimise images, and (c) take its base path from the
`NEXT_PUBLIC_BASE_PATH` env var, so the app and its hero `<img>` agree on it (Step 5). **CREATE mode**
already copied the template's `next.config.mjs`, which does exactly this - skip to Step 2. **DEPLOY mode:**
merge the equivalent into the existing config (preserve every existing key; do not clobber the file):

```js
// at the top of next.config.*:
const base = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
// inside the exported config object:
output: "export",
images: { unoptimized: true },
...(base ? { basePath: base, assetPrefix: base } : {}),
```

`output: "export"` emits a static `out/`; `images.unoptimized` is required for export (and lets a local
`next build` succeed). The `base` line makes routes, `next/link`, and `_next/` assets pick up the Pages
base path - the workflow feeds `NEXT_PUBLIC_BASE_PATH` from `configure-pages` (Step 3), and unset (local
build) means root-served. **Idempotent:** if these are present, leave them. Do **not** add
`trailingSlash: true`: the export writes `docs/<slug>.html`, which GitHub Pages already serves at the
extensionless `/docs/<slug>`, and that matches scribekit's no-trailing-slash canonical URLs - turning
trailing slashes on would make every canonical disagree with its served URL.

Handle whatever config shape exists: `next.config.mjs`/`.js` (a plain object or a function), or
`next.config.ts`. If the config wraps the object in a plugin call, merge into the inner object.

---

## Step 2 - Add `public/.nojekyll`

Create an empty `public/.nojekyll` (in the Next app root's `public/`) so the exported `_next/` folder is
never treated as Jekyll source. Belt-and-suspenders: the `deploy-pages` artifact flow does not run
Jekyll, but this costs nothing and removes all doubt. Skip if it already exists.

---

## Step 3 - Write the deploy workflow

Copy this skill's **[assets/deploy.yml](./assets/deploy.yml)** to `.github/workflows/deploy.yml` in the
**git repo root** (not the app subdir - workflows only run from the repo root's `.github/`). It derives the
base path from `configure-pages` and passes it to the build as `NEXT_PUBLIC_BASE_PATH` (which the Step 1
config and the hero `<img>` read), so heroes and links resolve under a project subpath - **it pairs with
the Step 1 config; don't swap in a workflow that relies on `static_site_generator: next` injection, or the
hero `<img>` won't know the base path.**

Adjust it to the project:
- **Default branch.** The template triggers on `push: branches: [main]`. If the repo's default branch is
  not `main` (check `git branch --show-current` / `git remote show origin`), change it.
- **App in a subdirectory.** If Step 0 found the Next app below the repo root, uncomment the
  `defaults.run.working-directory` block and set the subdir, and change the upload `path:` to
  `<subdir>/out`.
- **No `package-lock.json`.** Both `npm ci` **and** `setup-node`'s `cache: npm` fail without a committed
  lockfile. If there is none, either commit one, or drop the `cache: npm` line and change the install
  step to `npm install`. (For a subdir app, also set `cache-dependency-path: <subdir>/package-lock.json`.)

If `.github/workflows/deploy.yml` already exists, show the user the diff and ask before overwriting.

---

## Step 4 - Set `siteUrl` to the Pages origin

In the `_docs.ts` from Step 0, set `siteUrl` to the origin derived in Step 0.3 so canonical, sitemap,
`hreflang`, and OG URLs point at the real site (a stale `https://example.com` ships wrong SEO metadata).
**Confirm the domain with the user** before writing it - only they know if a custom domain is coming.
If a sibling `_blog.ts` shares the same origin, offer to update it too.

---

## Step 5 - Fix the blockers found in Step 0.4 (only those present)

**Middleware clean-URLs (hard blocker).** A `proxy.ts`/`middleware.ts` that rewrites `/docs/...` onto a
`/<defaultLocale>/docs/...` route tree **cannot run on a static host** - static export drops middleware
entirely, so only the prefixed paths (`/en/docs/...`, `/fr/docs/...`) get generated and the bare
`/docs/...` clean URLs 404. Explain this, then offer the clean fix:
- **Set `prefixDefaultLocale: true`** on the `Docs` (and `Blog`) instance so every locale - including the
  default - is served under its own prefix with **no middleware**. Then: delete the `proxy.ts`/
  `middleware.ts`, remove any `/en`-stripping the client chrome did on `usePathname()` (it assumed the
  rewrite), and add a static entry redirect from `/docs` to `/<defaultLocale>/docs` if the user wants
  bare `/docs` to land somewhere (a `public/docs/index.html` meta-refresh stub, or a root redirect).
  URLs become `/<lang>/docs/...` for every language - the honest trade for static hosting.
- If the site is **single-locale** (no `locales`, or one), there is usually no middleware and nothing to
  do here - the flat `/docs/...` export just works.

**Runtime slug redirects (degrades - does not hard-break).** A `redirects` config served via
`permanentRedirect()` in the `[slug]` route **still builds** under `output: 'export'`: Next turns the
308 into a **client-side redirect** - the old slug exports as a near-empty `200` HTML page carrying a
`NEXT_REDIRECT` marker in its payload, and once its JS hydrates the router navigates to the new URL (and
applies the deployment base path). So renamed slugs **do** redirect for real visitors. The only loss is
SEO / no-JS: to a crawler or a JS-less client the old URL is a blank `200` with **no** `308`,
`<meta refresh>`, or canonical - a weak signal. (Verified by building a redirecting page with Next 16 +
`output: 'export'`: build succeeds, the old path emits an HTML page whose payload holds
`NEXT_REDIRECT;replace;<newUrl>;308`.) Two honest options - pick with the user:
- **Leave it** if the old URLs are not SEO-critical: zero work, JS visitors get redirected.
- **Static stubs** if they are: drop `...getRedirectRefs()` from the route's `generateStaticParams` **and**
  the `permanentRedirect` branch (so the route stops emitting those pages), then write a
  `public/<oldpath>.html` stub with `<meta http-equiv="refresh" content="0; url=<newUrl>">` +
  `<link rel="canonical" href="<newUrl>">`. **You cannot keep both** - a `public/` file and a prerendered
  route at the same path collide. `getRedirect(slug, lang)` gives `<newUrl>` rooted at the **docs
  section** base path (`/docs/...`); on a **project site** it must **also** carry the deployment base
  path (`/<repo>`), or the stub lands on a 404 - another reason to prefer root hosting.

**Project-site base path - how a subpath is made to work (this is the crux for a corpus).** On a
**project site** (`https://<owner>.github.io/<repo>/`) three things a docs corpus carries are raw paths
Next never rewrites, so each 404s under `/<repo>/` unless handled. The Step 1 config + the app-template
components + the workflow's `NEXT_PUBLIC_BASE_PATH` (from `configure-pages`'s `base_path`) handle the first
two automatically; only the third has no clean fix. All verified by building the real corpus under
`NEXT_PUBLIC_BASE_PATH=/scribekit`:
1. **In-body prose links** (`[x](/docs/y)` -> raw `<a>`). **Handled:** `components={{ a: BodyLink }}`
   routes them through `next/link`, so they get the base path (`/scribekit/docs/...`, verified). Next's
   own `_next/` assets and the chrome links (next/link) are prefixed the same way.
2. **Hero images** (`image:` front-matter -> raw `<img src="/assets/...">`). **Handled:** `imgComponent`
   `BaseImg` prepends `NEXT_PUBLIC_BASE_PATH`, so the hero src becomes `/scribekit/assets/...` (verified).
   `next/image` does **not** do this - under `images.unoptimized` it passes the src through unprefixed -
   which is why `BaseImg` exists.
3. **Absolute SEO URLs** - `absoluteUrl` does `new URL(path, siteUrl)`, so a root-relative `localePath`
   **drops `siteUrl`'s subpath**: canonical / sitemap / `hreflang` / OG come out missing `/<repo>` even
   when `siteUrl` includes it. **No clean app-side fix** (it is a library limitation).

So a **project site now renders correctly** - heroes, links, assets all resolve - and needs **no custom
domain**. In DEPLOY mode, add `imgComponent={BaseImg}` + `components={{ a: BodyLink }}` (and the Step 1
`NEXT_PUBLIC_BASE_PATH` config) to the existing `[slug]` route to get the same. The **only** residue is
#3, the absolute SEO-metadata URLs. If those matter, **root hosting removes even that**: a custom domain
(`public/CNAME`, `siteUrl` set to it) or a `<owner>.github.io` user/org repo serves at the root, base path
empty, everything correct. Recommend root hosting when SEO is a priority; otherwise a project site is fine.

---

## Step 6 - Enable Pages, then push

The workflow's `configure-pages` step sets `enablement: true`, so on the first run it **turns Pages on
itself** (build type "GitHub Actions") - no manual step needed in the common case. Commit the changes,
push to the default branch (or run the workflow from the Actions tab), and the site publishes at the Pages
URL from Step 0.3. Give them that URL.

**Fallback:** if the first run fails with *"Get Pages site failed / Not Found"* (an org policy blocks
Actions from enabling Pages), enable it once by hand and re-run:

> **GitHub -> repo Settings -> Pages -> Build and deployment -> Source: "GitHub Actions".**

---

## Step 7 - Verify (always sanity-check; run the full build when `--verify` or the user asks)

- **Config sanity:** re-read the edited `next.config.*` and `_docs.ts` - the merge kept existing keys,
  `output: "export"` is set once, `siteUrl` is the real origin. Re-reading the workflow: action versions
  and the artifact `path` are intact.
- **Local export build** (with `--verify`, or offer it): from the Next app root, `npx next build`. Confirm
  `out/` holds the docs HTML (e.g. `out/<lang>/docs/<slug>.html` or `out/docs/<slug>.html`), a
  populated `_next/`, `.nojekyll`, and - if the app has an `app/sitemap.ts` - `sitemap.xml`. In CREATE
  mode, confirm **every** corpus slug produced a page and that the hero JPEGs landed in `out/assets/...`.
  **Never start the dev server** - only the one-shot build. **Never create a git branch.**
- **Real browser** (project rule - test rendered HTML, do not assume): serve the export
  (`npx serve out`) and open a docs page with the Claude-in-Chrome tool. Nav, tabs, sidebar, the
  Cmd/Ctrl-K search palette, and prev/next must all work - the client components hydrate from the static
  HTML. Check the browser console for base-path 404s on `_next/` assets (the project-site tell).

---

## Non-negotiables

- **Never start a dev server** (ask the user to run one if needed). **Never create a git branch.**
- **Preserve the user's config.** Merge into `next.config.*` and `_docs.ts`; never rewrite the file from
  scratch or drop existing keys. Every edit is **idempotent** - re-running the skill must not duplicate
  keys, workflows, or stub pages.
- **Do not touch docs content.** No editing MDX bodies, front-matter, slugs, or the nav - that is
  `/scribekit-docs`. DEPLOY mode edits only deploy config (`next.config.*`, `_docs.ts` `siteUrl`/routing
  flags, `.github/`, `public/`). CREATE mode additionally **creates** the host app (route files, layout,
  chrome, `_docs.ts`, `next.config.*`, `package.json`) - but still never edits the MDX page bodies or
  their front-matter.
- **Be honest about static-export limits.** Middleware clean-URLs, true 308 redirects, and correct
  absolute SEO URLs under a project subpath are the real trade-offs - state them, do not paper over them.
- **Confirm before destructive or outward-facing edits:** overwriting an existing workflow, deleting a
  `proxy.ts`/`middleware.ts`, or changing the public URL scheme (`prefixDefaultLocale`) all change how
  the live site behaves - show the user what changes and get agreement first.
