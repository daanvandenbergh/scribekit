/**
 * Public surface of the shared React layer: the framework-free i18n core - the `@daanvandenbergh/
 * i18nkit` {@link ui} instance over the 24 EU languages, the copy {@link CATALOG} authored through
 * it, and the {@link blogLabels}/{@link docsLabels} resolvers - reused by both the blog and docs
 * components. Re-exported from the react root barrel (`../index.js`).
 */

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
