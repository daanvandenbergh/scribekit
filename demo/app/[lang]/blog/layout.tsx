import type { ReactNode } from "react";
import { DemoNav } from "../../_nav";

/**
 * Blog shell: the plain demo nav + the centered `.demo-shell` container the root layout used to
 * provide app-wide (the docs surface now renders full-width with its own `DocsNavbar`, so the nav
 * and the constraint moved down to the sections that want them). The blog components self-center.
 */
export default function BlogLayout({ children }: { children: ReactNode }) {
    return (
        <>
            <DemoNav />
            <div className="demo-shell">{children}</div>
        </>
    );
}
