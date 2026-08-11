"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DocsSearchProvider, DocsNavbar, DocsTabs, DocsSidebar } from "../../dist/react/index.js";
import type { NavTree } from "../../dist/index.js";

/**
 * The scribekit brand mark: the same open book the hero badge and the favicon carry, but BARE - no
 * white tile - so it sits straight on the navbar in the brand violet. `currentColor` takes that
 * violet from `--scribekit-primary` via the wrapper below, so the mark tracks the palette.
 */
const BookMark = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 6.5C10.2 5.2 7.7 4.5 4.8 4.5A1.8 1.8 0 003 6.3v9.4a1.8 1.8 0 001.8 1.8c2.9 0 5.4.7 7.2 2" />
        <path d="M12 6.5c1.8-1.3 4.3-2 7.2-2A1.8 1.8 0 0121 6.3v9.4a1.8 1.8 0 01-1.8 1.8c-2.9 0-5.4.7-7.2 2" />
        <path d="M12 6.5v13" />
    </svg>
);

/** The persistent, interactive docs shell (navbar, tabs, sidebar, ⌘K search). */
export function DocsChrome({ nav, children }: { nav: NavTree; children: ReactNode }) {
    const activePath = usePathname();
    return (
        <DocsSearchProvider nav={nav} linkComponent={Link}>
            <div className="scribekit-docs">
                {/* DocsNavbar renders the centered ⌘K search itself (showSearch defaults true) - don't add another. */}
                <DocsNavbar
                    logo={<span style={{ color: "var(--scribekit-primary)", display: "flex" }}>{BookMark}</span>}
                    logoSize={24}
                    brandName="Scribekit"
                    docsText="Docs"
                    linkComponent={Link}
                />
                <DocsTabs nav={nav} activePath={activePath} linkComponent={Link} />
                <div className="scribekit-docs-body">
                    <DocsSidebar nav={nav} activePath={activePath} linkComponent={Link} />
                    <main className="scribekit-docs-main">{children}</main>
                </div>
            </div>
        </DocsSearchProvider>
    );
}
