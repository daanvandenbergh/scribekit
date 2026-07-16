"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DocsSearchProvider, DocsNavbar, DocsTabs, DocsSidebar } from "../../../dist/react/index.js";
import type { NavTree } from "../../../dist/index.js";

/** The persistent, interactive docs shell (navbar, tabs, sidebar, ⌘K search). */
export function DocsChrome({ nav, children }: { nav: NavTree; children: ReactNode }) {
    const activePath = usePathname();
    return (
        <DocsSearchProvider nav={nav} linkComponent={Link}>
            <div className="scribekit-docs">
                {/* DocsNavbar renders the centered ⌘K search itself (showSearch defaults true) - don't add another. */}
                <DocsNavbar brandName="Scribekit" docsText="Docs" linkComponent={Link} />
                <DocsTabs nav={nav} activePath={activePath} linkComponent={Link} />
                <div className="scribekit-docs-body">
                    <DocsSidebar nav={nav} activePath={activePath} linkComponent={Link} />
                    <main className="scribekit-docs-main">{children}</main>
                </div>
            </div>
        </DocsSearchProvider>
    );
}
