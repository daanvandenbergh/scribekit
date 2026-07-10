/**
 * Shared MDX heading helpers used by both `BlogPage` and `DocsPage`: they inject a slugified
 * anchor `id` (via the shared {@link slugify}) into `##`/`###` headings so a page's
 * table-of-contents minimap links resolve to the rendered headings. The same `slugify` powers
 * `tableOfContents`, so the ids these produce always match the ToC entries' ids.
 *
 * Kept free of any `next`/`server-only` import so it can be pulled into the server content
 * components without widening the client import graph.
 */

import { isValidElement, type ComponentPropsWithoutRef, type ReactElement, type ReactNode } from "react";
import { slugify } from "../../shared/content.js";

/**
 * Flattens a React node to its plain-text content, so a heading rendered with inline markup
 * (`## Some **bold** title`) still slugs to the same id its table-of-contents entry expects.
 *
 * @param node - the node to read text from.
 * @returns the concatenated text content.
 */
export function textOf(node: ReactNode): string {
    if (typeof node === "string" || typeof node === "number") {
        return String(node);
    }
    if (Array.isArray(node)) {
        return node.map(textOf).join("");
    }
    if (isValidElement(node)) {
        return textOf((node.props as { children?: ReactNode }).children);
    }
    return "";
}

/**
 * Builds an MDX heading renderer that adds an anchor `id` (via {@link slugify}) so a page's
 * table-of-contents links resolve. The tag's other props are preserved.
 *
 * @param Tag - the heading tag to render (`"h2"` or `"h3"`).
 * @returns a component that renders `Tag` with a slugified `id`.
 */
export function withHeadingId(Tag: "h2" | "h3"): (props: ComponentPropsWithoutRef<"h2">) => ReactElement {
    return function Heading({ children, ...rest }: ComponentPropsWithoutRef<"h2">): ReactElement {
        return (
            <Tag {...rest} id={slugify(textOf(children))}>
                {children}
            </Tag>
        );
    };
}
