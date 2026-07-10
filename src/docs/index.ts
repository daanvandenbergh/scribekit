/**
 * Public surface of the docs backend module: the `Docs` class, its error types, the pure
 * navigation builders, the docs-specific SEO builders, and the docs domain types. The
 * framework-free primitives and shared types come from `../shared` (re-surfaced at the package
 * root), so they are intentionally not re-exported here (that would collide with the shared
 * re-export in `src/index.ts`).
 */

export { Docs } from "./docs.js";
export { DocNotFoundError, DuplicateDocError } from "./errors.js";
export { adjacentFor, breadcrumbFor, buildNavTree, flattenNav, type NavBuildOptions } from "./navigation.js";
export { buildDocMetadata, buildIndexMetadata, docJsonLd, indexJsonLd } from "./seo.js";
export type {
    Adjacent,
    Breadcrumb,
    BreadcrumbSegment,
    Doc,
    DocMeta,
    DocsConfig,
    NavConfigEntry,
    NavGroup,
    NavItem,
    NavTab,
    NavTree,
} from "./types.js";
