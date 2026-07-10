import Link from "next/link";

/**
 * The plain demo top nav used by the home and blog routes. The docs routes render the package's
 * `DocsNavbar` instead (the design's docs top bar), so this lives per-section rather than app-wide.
 */
export function DemoNav() {
    return (
        <nav className="demo-nav">
            <Link className="brand" href="/">
                Claude Code Blog demo
            </Link>
            <Link href="/blog">Blog</Link>
            <Link href="/docs">Docs</Link>
        </nav>
    );
}
