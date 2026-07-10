/**
 * Package entry point (`@daanvandenbergh/scribekit`). Exposes the Node/server-side backends -
 * the `Blog` and `Docs` classes plus their types and SEO helpers - and the shared, framework-free
 * primitives both build on (`slugify`, `formatDate`, `localePath`, `buildSitemap`, the shared
 * types, ...). React components live in the `@daanvandenbergh/scribekit/react` subpath.
 *
 * `shared` is exported first so `blog`/`docs` never need to (and never do) re-export a shared
 * name - keeping this aggregation collision-free.
 */

export * from "./shared/index.js";
export * from "./blog/index.js";
export * from "./docs/index.js";
