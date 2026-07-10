/**
 * Public surface of the React subpath (`@daanvandenbergh/scribekit/react`): the drop-in components
 * and their prop types, split by domain. Blog: `BlogOverview`/`BlogPage` are server components,
 * `BlogOverviewGrid`/`BlogSidebar` client. Docs: `DocsPage`/`DocsIndex` server,
 * `DocsSidebar`/`DocsFeedback` client. The shared i18n core (`blogLabels`, `docsLabels`, the copy
 * catalog) backs both. Remember to import the stylesheet once in your app:
 * `import "@daanvandenbergh/scribekit/styles.css"`.
 */

export * from "./blog/index.js";
export * from "./docs/index.js";
export * from "./shared/index.js";
