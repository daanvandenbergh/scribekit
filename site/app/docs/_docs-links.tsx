// The MDX `a` override: in-body prose links become client-side and base-path aware.
import Link from "next/link";
import type { AnchorHTMLAttributes } from "react";

/** Internal (`/`-rooted) links go through next/link (base-path aware); others stay a plain <a>. */
export function BodyLink({ href = "", children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
    if (href.startsWith("/")) {
        return (
            <Link href={href} {...props}>
                {children}
            </Link>
        );
    }
    return (
        <a href={href} {...props}>
            {children}
        </a>
    );
}
