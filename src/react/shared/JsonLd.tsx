import type { ReactElement } from "react";

/**
 * Serialises a schema.org JSON-LD document into a `<script type="application/ld+json">`, shared by
 * every content surface (`BlogOverview`/`BlogPage`/`DocsPage`/`DocsIndex`) so the one place the
 * payload is embedded - and its `<` escaping - lives in a single component instead of four copies.
 *
 * The `<` characters are escaped to `<` so the JSON can never terminate the surrounding
 * `</script>` early or open a nested tag (the standard, sufficient technique for JSON in a script
 * element - `>` and `&` do not need escaping inside a JSON string). Kept free of any `next` import
 * so it renders in a server component.
 *
 * @param props.data - the JSON-LD document (a plain object) to embed.
 * @returns the `<script>` element.
 */
export function JsonLd({ data }: { data: unknown }): ReactElement {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
        />
    );
}
