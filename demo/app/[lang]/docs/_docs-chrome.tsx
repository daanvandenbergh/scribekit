"use client";
// The docs chrome (top navbar + tab bar + left navigation) is interactive - the navbar's ⌘K search,
// the tab bar's sliding indicator, the command palette, and the active-page highlight all need the
// current pathname. `usePathname()` is a client hook, so this thin wrapper reads it once and forwards
// it (plus `next/link`) to the package components, laying them out around the routed `{children}`.
// `DocsSearchProvider` owns the one ⌘K palette that both the navbar button and the shortcut open.
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DocsLanguagePicker, DocsNavbar, DocsNavbarButton, DocsSearchProvider, DocsSidebar, DocsTabs } from "../../../../dist/react/index.js";
import type { LocaleConfig, NavTree } from "../../../../dist/index.js";

/** A small equalizer wordmark for the demo brand (a real app passes its own `logo`). */
function ScribekitLogo() {
    return (
        <svg viewBox="302 334 424 360" aria-label="Scribekit">
            <defs>
                <linearGradient id="scribekit-demo-logo" gradientUnits="userSpaceOnUse" x1="302" y1="334" x2="726" y2="694">
                    <stop offset="0" stopColor="#2563EB" />
                    <stop offset="1" stopColor="#6D5DF6" />
                </linearGradient>
            </defs>
            <g fill="url(#scribekit-demo-logo)">
                <rect x="302" y="439" width="56" height="150" rx="28" />
                <rect x="394" y="389" width="56" height="250" rx="28" />
                <rect x="486" y="334" width="56" height="360" rx="28" />
                <rect x="578" y="384" width="56" height="260" rx="28" />
                <rect x="670" y="429" width="56" height="170" rx="28" />
            </g>
        </svg>
    );
}

/**
 * Renders the full docs shell for the demo: `DocsNavbar` (logo + "Docs" pill + ⌘K search) and
 * `DocsTabs` on top, then a row of `DocsSidebar` beside the routed content - all inside a
 * `DocsSearchProvider` so the navbar button and the ⌘K shortcut drive one palette.
 *
 * @param props.nav - the navigation tree for the current language (`docs.getNavTree(lang)`).
 * @param props.lang - the render language, forwarded for the built-in label translations.
 * @param props.children - the routed page (a `DocsPage` or `DocsIndex`).
 */
export function DocsChrome({
    nav,
    lang,
    locales,
    defaultLocale,
    prefixDefaultLocale,
    basePath,
    children,
}: {
    nav: NavTree;
    lang: string;
    locales: LocaleConfig[];
    defaultLocale: string;
    prefixDefaultLocale: boolean;
    basePath: string;
    children: ReactNode;
}) {
    // The default locale (en) is served unprefixed at /docs/... (proxy.ts rewrites onto /en/docs/...),
    // so nav hrefs are the clean /docs/... . `usePathname()` returns the clean path at runtime but the
    // /en-prefixed one at build-time prerender; strip that prefix so the highlight matches in both.
    const pathname = usePathname();
    const activePath = pathname ? pathname.replace(/^\/en(?=\/|$)/, "") : undefined;
    return (
        <DocsSearchProvider nav={nav} lang={lang} linkComponent={Link}>
            <div className="scribekit-docs">
                <DocsNavbar
                    logo={<ScribekitLogo />}
                    logoSize={22}
                    brandName="Scribekit"
                    docsText="Docs"
                    homeHref="/"
                    linkComponent={Link}
                    lang={lang}
                    languagePicker={
                        <DocsLanguagePicker
                            locales={locales}
                            currentLang={lang}
                            activePath={activePath}
                            basePath={basePath}
                            defaultLocale={defaultLocale}
                            prefixDefaultLocale={prefixDefaultLocale}
                            linkComponent={Link}
                            lang={lang}
                        />
                    }
                    actions={[
                        <DocsNavbarButton key="blog" href="/blog" linkComponent={Link}>
                            Blog
                        </DocsNavbarButton>,
                        <DocsNavbarButton
                            key="npm"
                            href="https://www.npmjs.com/package/@daanvandenbergh/scribekit"
                            target="_blank"
                            rel="noreferrer"
                            variant="primary"
                        >
                            npm ↗
                        </DocsNavbarButton>,
                    ]}
                />
                <DocsTabs nav={nav} activePath={activePath} lang={lang} linkComponent={Link} />
                <div className="scribekit-docs-body">
                    <DocsSidebar nav={nav} activePath={activePath} lang={lang} linkComponent={Link} />
                    <main className="scribekit-docs-main">{children}</main>
                </div>
            </div>
        </DocsSearchProvider>
    );
}
