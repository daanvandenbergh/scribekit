import type { ReactNode } from "react";
import type { Metadata } from "next";
// The package stylesheet - import it once, app-wide. Then ./globals.css for the demo chrome.
// This in-repo demo imports the built package straight from ../dist (no symlink); a real app
// would import "@daanvandenbergh/scribekit/styles.css".
import "../../dist/react/styles.css";
import "./globals.css";

/**
 * App-wide metadata. `metadataBase` lets the blog's relative OG/canonical URLs resolve.
 */
export const metadata: Metadata = {
    metadataBase: new URL("https://demo.example.com"),
    title: { default: "Claude Code Blog demo", template: "%s | Claude Code Blog demo" },
    description: "A minimal Next.js demo of @daanvandenbergh/scribekit.",
};

/**
 * Root layout: just the document + fonts. The top nav is per-section: the home and blog routes add
 * the plain `DemoNav` (and their own centered `.demo-shell`), while the docs routes render the
 * package's full-width `DocsNavbar`. Inter is loaded to match the docs design's typography (the docs
 * default to the Inter stack).
 */
export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body>{children}</body>
        </html>
    );
}
