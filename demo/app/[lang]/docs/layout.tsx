import type { ReactNode } from "react";
import { docs } from "./_docs";
import { DocsChrome } from "./_docs-chrome";

/**
 * Docs shell layout, shared by the index and every page: the persistent top tab bar + left
 * navigation (`DocsChrome` -> `DocsTabs` + `DocsSidebar`) around the routed content. Because the
 * chrome lives in the layout it survives client-side navigation, so the open tab, scroll position,
 * and command palette persist between pages. The shell renders full-width (the docs are an app, not
 * a centered article).
 */
export default async function DocsLayout({
    children,
    params,
}: {
    children: ReactNode;
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    const nav = docs.getNavTree(lang);
    return (
        <DocsChrome
            nav={nav}
            lang={lang}
            locales={docs.locales}
            defaultLocale={docs.defaultLocale}
            prefixDefaultLocale={docs.prefixDefaultLocale}
            basePath={docs.site?.basePath ?? "/docs"}
        >
            {children}
        </DocsChrome>
    );
}
