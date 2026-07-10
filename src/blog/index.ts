/**
 * Public surface of the blog backend module: the `Blog` class, its error types, the
 * blog-specific SEO builders, and the blog domain types. The framework-free primitives
 * (`slugify`, `formatDate`, `localePath`, `buildSitemap`, the shared types, ...) are exported
 * from `../shared` and re-surfaced at the package root, so they are intentionally not re-exported
 * here (that would collide with the shared re-export in `src/index.ts`).
 */

export { Blog } from "./blog.js";
export { DuplicatePostError, PostNotFoundError } from "./errors.js";
export { collectCategories } from "./categories.js";
export { similarPosts } from "./similar.js";
export { buildOverviewMetadata, buildPostMetadata, overviewJsonLd, postJsonLd } from "./seo.js";
export type { BlogConfig, Post, PostMeta } from "./types.js";
