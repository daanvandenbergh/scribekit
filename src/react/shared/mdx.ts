/**
 * Shared MDX render options used by both `BlogPage` and `DocsPage`. Like `headings.tsx`, this is
 * kept free of any `next`/`server-only` import so it can be pulled into the server content
 * components without widening the client import graph.
 */
import remarkGfm from "remark-gfm";
import type { MDXRemoteProps } from "next-mdx-remote/rsc";

/**
 * Merges GitHub-Flavoured Markdown into a caller's MDX options, so tables, strikethrough,
 * task lists, and autolinks work out of the box.
 *
 * WHY THIS IS A DEFAULT AND NOT AN OPT-IN. Pipe tables are **not** core Markdown - they are a GFM
 * extension - so without `remark-gfm` a `| a | b |` table does not fail loudly, it renders as a
 * paragraph of literal pipe characters. That is a silent content corruption: the post looks fine in
 * every editor and preview, and only the published page is wrong. Meanwhile `styles.css` has always
 * shipped `.scribekit-prose table` styling, i.e. the library already promised tables it could not
 * actually produce. GFM is the baseline every Markdown author assumes, so it is on by default.
 *
 * The caller's own plugins are PRESERVED, never replaced: `remarkGfm` is prepended to whatever
 * `remarkPlugins` they passed, and every other option (`rehypePlugins`, `parseFrontmatter`, ...) is
 * carried through untouched. The doubly-nested `options.mdxOptions.remarkPlugins` shape is
 * `next-mdx-remote`'s own, not a typo.
 *
 * @param options - the consumer's `mdxOptions` prop, if any.
 * @returns the same options with `remark-gfm` merged into `mdxOptions.remarkPlugins`.
 */
export function withGfm(options?: MDXRemoteProps["options"]): MDXRemoteProps["options"] {
    const remarkPlugins = options?.mdxOptions?.remarkPlugins ?? [];
    return {
        ...options,
        mdxOptions: { ...options?.mdxOptions, remarkPlugins: [remarkGfm, ...remarkPlugins] },
    };
}
