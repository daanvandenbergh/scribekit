/**
 * Public surface of the docs React components. `DocsPage`, `DocsIndex`, `DocsHero` and
 * `DocsRecentlyUpdated` are server components; `DocsTopicGrid` (its filter is local state),
 * `DocsNavbar` (top bar), `DocsTabs` (tab bar), `DocsSidebar` (left nav), `DocsToc` (right "on this
 * page" minimap), `DocsSearchButton` (a search trigger), and `DocsFeedback` are client components;
 * `DocsSearchProvider` owns the shared ⌘K palette (`useDocsSearch` opens it). Re-exported from the
 * react root barrel (`../index.js`).
 *
 * THE INDEX IS THREE SECTIONS PLUS A COMPOSER. `DocsHero`, `DocsTopicGrid` and
 * `DocsRecentlyUpdated` each take plain, already-localized data and can be dropped into a page in
 * any order, interleaved with bands of your own; `DocsIndex` is the batteries-included wrapper that
 * derives all three from one `Docs` instance. Reach for the pieces when the page needs sections the
 * kit does not ship, and for `DocsIndex` when it does not.
 */

export { DocsPage, type DocsPageProps } from "./DocsPage.js";
export { DocsIndex, type DocsIndexProps } from "./DocsIndex.js";
export { DocsHero, type DocsHeroProps, type DocsHeroAction, type DocsHeroStat, type DocsHeroVariant } from "./DocsHero.js";
export {
    DocsTopicGrid,
    type DocsTopicGridProps,
    type DocsTopicGridLabels,
    type DocsTopic,
    type DocsTopicPage,
} from "./DocsTopicGrid.js";
export { DocsRecentlyUpdated, type DocsRecentlyUpdatedProps, type DocsRecentItem } from "./DocsRecentlyUpdated.js";
export { DocsNavbar, type DocsNavbarProps } from "./DocsNavbar.js";
export { DocsNavbarButton, type DocsNavbarButtonProps, type DocsNavbarButtonVariant } from "./DocsNavbarButton.js";
export { DocsTabs, type DocsTabsProps } from "./DocsTabs.js";
export { DocsSidebar, type DocsSidebarProps } from "./DocsSidebar.js";
export { DocsLanguagePicker, type DocsLanguagePickerProps } from "./DocsLanguagePicker.js";
export { DocsToc, type DocsTocProps } from "./DocsToc.js";
export { DocsSearchProvider, useDocsSearch, type DocsSearchProviderProps } from "./DocsSearchProvider.js";
export { DocsSearchButton, type DocsSearchButtonProps } from "./DocsSearchButton.js";
export { DocsFeedback, type DocsFeedbackProps } from "./DocsFeedback.js";
export { DocsIcon } from "./internal/icons.js";
