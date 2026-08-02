/**
 * Public surface of the shared React layer: the framework-free i18n core - the `@daanvandenbergh/
 * i18nkit` {@link ui} instance over the 24 EU languages, the copy {@link CATALOG} authored through
 * it, and the {@link blogLabels}/{@link docsLabels} resolvers - reused by both the blog and docs
 * components - plus {@link JsonLd}. Re-exported from the react root barrel (`../index.js`).
 *
 * `JsonLd` is public because the index sections are: a page assembled from `DocsHero` +
 * `DocsTopicGrid` + `DocsRecentlyUpdated` instead of from `DocsIndex` still needs to emit
 * `docs.indexJsonLd(lang)`, and without this export its only options were to hand-roll the
 * `<script>` (and its `<` escaping) or silently ship no structured data at all.
 */

export { JsonLd } from "./JsonLd.js";
export {
    ui,
    CATALOG,
    blogLabels,
    docsLabels,
    resolveLanguage,
    type Language,
    type BlogLabels,
    type DocsLabels,
} from "./i18n.js";
