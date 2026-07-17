/**
 * Public surface of the content-store module: the filesystem layer the `Blog` and `Docs` backends
 * share - the directory walk, the path-traversal guard, and the memoized read + front-matter parse.
 *
 * Package-internal by design. This module is deliberately **not** re-exported from `src/index.ts`:
 * it is an implementation detail of the two backends, not part of the package's public API, and
 * exporting it would put a `node:fs` import on the root entry's surface for no consumer benefit.
 */

export { ContentStore } from "./content-store.js";
export type { ContentEntry, ContentStoreConfig, ParsedFile } from "./types.js";
