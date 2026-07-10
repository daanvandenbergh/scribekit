/**
 * Public surface of the docs React components. `DocsPage` and `DocsIndex` are server components;
 * `DocsNavbar` (top bar), `DocsTabs` (tab bar), `DocsSidebar` (left nav), `DocsToc` (right "on this
 * page" minimap), `DocsSearchButton` (a search trigger), and `DocsFeedback` are client components;
 * `DocsSearchProvider` owns the shared ⌘K palette (`useDocsSearch` opens it). Re-exported from the
 * react root barrel (`../index.js`).
 */

export { DocsPage, type DocsPageProps } from "./DocsPage.js";
export { DocsIndex, type DocsIndexProps } from "./DocsIndex.js";
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
