import type { ReactNode } from "react";
import type { Metadata } from "next";
// The package stylesheet, app-wide. This in-repo site imports the built package from ../dist (like
// demo/); a consumer project imports "@daanvandenbergh/scribekit/styles.css".
import "../../dist/react/styles.css";
// Base document reset (body margin/font) for the document the docs shell sits in.
import "./globals.css";
import { docs } from "./_docs";
import { DocsChrome } from "./_docs-chrome";

export const metadata: Metadata = {
    metadataBase: new URL("https://daanvandenbergh.github.io/scribekit"),
    title: { default: "Scribekit docs", template: "%s | Scribekit" },
    description: "Documentation for @daanvandenbergh/scribekit.",
};

/**
 * Root layout: the document shell plus the docs chrome. This site is *only* docs, so it is mounted
 * at the root (`basePath: ""`) and every route is a docs route - no `/docs` segment to scope a
 * nested layout to. The nav tree is built once here, at build time.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <body>
                <DocsChrome nav={docs.getNavTree()}>{children}</DocsChrome>
            </body>
        </html>
    );
}
