import type { ReactNode } from "react";
import type { Metadata } from "next";
// The package stylesheet, app-wide. This in-repo site imports the built package from ../dist (like
// demo/); a consumer project imports "@daanvandenbergh/scribekit/styles.css".
import "../../dist/react/styles.css";
// Base document reset (body margin/font) for the document the docs shell sits in.
import "./globals.css";

export const metadata: Metadata = {
    metadataBase: new URL("https://daanvandenbergh.github.io/scribekit"),
    title: { default: "Scribekit docs", template: "%s | Scribekit" },
    description: "Documentation for @daanvandenbergh/scribekit.",
};

/** Root layout: the document shell. The docs chrome is added by app/docs/layout.tsx. */
export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
