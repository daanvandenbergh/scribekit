import type { ReactNode } from "react";
import { docs } from "./_docs";
import { DocsChrome } from "./_docs-chrome";

/** Wraps every docs route in the shell; builds the nav tree at build time. */
export default function DocsLayout({ children }: { children: ReactNode }) {
    return <DocsChrome nav={docs.getNavTree()}>{children}</DocsChrome>;
}
