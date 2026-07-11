import { describe, expect, it } from "vitest";
import remarkGfm from "remark-gfm";

import { withGfm } from "../mdx.js";

/**
 * `withGfm` is what makes pipe tables render at all: without `remark-gfm` a `| a | b |` table is
 * not an error, it silently becomes a paragraph of literal pipe characters. These tests pin both
 * halves of the contract - GFM is always present, and the caller's own options are never clobbered.
 */
describe("withGfm", () => {
    it("enables gfm when the caller passes no options at all (the default path)", () => {
        const options = withGfm();
        expect(options?.mdxOptions?.remarkPlugins).toEqual([remarkGfm]);
    });

    it("enables gfm when the caller passes options but no remark plugins", () => {
        const options = withGfm({ parseFrontmatter: false });
        expect(options?.mdxOptions?.remarkPlugins).toEqual([remarkGfm]);
    });

    it("preserves the caller's remark plugins and prepends gfm rather than replacing them", () => {
        const callerPlugin = (): undefined => undefined;
        const options = withGfm({ mdxOptions: { remarkPlugins: [callerPlugin] } });
        expect(options?.mdxOptions?.remarkPlugins).toEqual([remarkGfm, callerPlugin]);
    });

    it("carries every unrelated option through untouched", () => {
        const rehypePlugin = (): undefined => undefined;
        const options = withGfm({
            parseFrontmatter: true,
            mdxOptions: { rehypePlugins: [rehypePlugin], format: "mdx" },
        });
        expect(options?.parseFrontmatter).toBe(true);
        expect(options?.mdxOptions?.rehypePlugins).toEqual([rehypePlugin]);
        expect(options?.mdxOptions?.format).toBe("mdx");
        expect(options?.mdxOptions?.remarkPlugins).toEqual([remarkGfm]);
    });

    it("does not mutate the caller's options object", () => {
        const callerOptions = { mdxOptions: { remarkPlugins: [] as never[] } };
        withGfm(callerOptions);
        expect(callerOptions.mdxOptions.remarkPlugins).toEqual([]);
    });
});
