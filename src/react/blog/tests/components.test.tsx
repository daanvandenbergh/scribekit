import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// Replace the RSC MDX compiler with a synchronous stub so the (otherwise async) BlogPage
// tree can be rendered with renderToStaticMarkup; the stub echoes `source` so we can assert
// the MDX body was passed through.
vi.mock("next-mdx-remote/rsc", async () => {
    const { jsx } = await import("react/jsx-runtime");
    return {
        MDXRemote: (props: { source: string }) => jsx("pre", { "data-testid": "mdx", children: props.source }),
    };
});

import type { ReactElement } from "react";
import { BlogOverview } from "../BlogOverview.js";
import { BlogPage } from "../BlogPage.js";
import { BlogSidebar } from "../BlogSidebar.js";
import { formatDate } from "../../../shared/format.js";
import type { Blog } from "../../../blog/blog.js";
import type { Post, PostMeta, SiteConfig, TocEntry } from "../../../blog/types.js";

/** A post with a hero image. */
const POST: Post = {
    meta: {
        slug: "hello-world",
        lang: "en",
        title: "Hello World",
        date: "2026-06-28",
        description: "A first post.",
        image: "/assets/blog/hello-world.jpg",
        categories: ["Guides"],
        readingTime: 5,
    },
    content: "MDX_BODY_CONTENT",
};

/** A second post's metadata (no image), for the overview grid. */
const SECOND: PostMeta = {
    slug: "second",
    lang: "en",
    title: "Second Post",
    date: "2026-07-01",
    description: "Second description.",
    categories: ["Tutorials"],
    readingTime: 3,
};

/** Site config to trigger JSON-LD rendering. */
const SITE: SiteConfig = { siteUrl: "https://example.com", brandName: "Example" };

/**
 * Builds a minimal fake `Blog` (no filesystem) exposing only what the components call.
 *
 * @param overrides - members to override on the fake.
 * @returns a `Blog`-typed stub.
 */
function fakeBlog(overrides: Partial<Blog> = {}): Blog {
    const locale = (overrides.locale as string | undefined) ?? "en-GB";
    return {
        getAllPosts: (_lang?: string) => [POST.meta, SECOND],
        getPost: (_slug: string, _lang?: string) => POST,
        getTranslations: (_slug: string) => ["en"],
        formatDate: (iso: string, _lang?: string) => formatDate(iso, locale),
        dateLocale: (_lang?: string) => locale,
        getAllCategories: () => ["Guides", "Tutorials"],
        locale,
        defaultLocale: "en",
        prefixDefaultLocale: false,
        locales: [],
        // Sidebar helpers default to "no content" so BlogPage renders article-only unless a
        // test opts into the sidebar by overriding them.
        tableOfContents: () => [],
        readingMinutes: () => 5,
        similarPosts: () => [],
        site: SITE,
        ...overrides,
    } as unknown as Blog;
}

/**
 * A fake two-language `Blog` (English default, French translation) for the switcher and
 * lang-aware link tests.
 *
 * @param overrides - members to override on the fake.
 * @returns a `Blog`-typed stub reporting two translations.
 */
function i18nFakeBlog(overrides: Partial<Blog> = {}): Blog {
    return fakeBlog({
        defaultLocale: "en",
        locales: [
            { code: "en", label: "English" },
            { code: "fr", label: "Français" },
        ],
        getTranslations: (_slug: string) => ["en", "fr"],
        site: { ...SITE, basePath: "/blog", defaultLocale: "en" },
        ...overrides,
    });
}

/** A heading minimap for the sidebar tests. */
const TOC: TocEntry[] = [
    { depth: 2, text: "Getting Started", id: "getting-started" },
    { depth: 3, text: "Install", id: "install" },
];

/** A similar post carrying a category, for exercising the similar-card category · date meta. */
const SIMILAR: PostMeta = {
    slug: "img-post",
    lang: "en",
    title: "Img Post",
    date: "2026-05-01",
    description: "Related.",
    categories: ["Design"],
    image: "/assets/blog/img-post.jpg",
};

/**
 * A fake `Blog` whose sidebar helpers return content, so `BlogPage` renders the sidebar.
 *
 * @param overrides - members to override on the fake.
 * @returns a `Blog`-typed stub with a populated sidebar.
 */
function sidebarBlog(overrides: Partial<Blog> = {}): Blog {
    return fakeBlog({
        tableOfContents: () => TOC,
        readingMinutes: () => 4,
        similarPosts: () => [SIMILAR],
        ...overrides,
    });
}

/**
 * Finds the first function-typed React element in a tree (here, the mocked MDXRemote).
 *
 * @param node - a React element, array, or primitive.
 * @returns the matching element, or `null`.
 */
function findFunctionElement(node: unknown): { type: unknown; props: Record<string, unknown> } | null {
    if (Array.isArray(node)) {
        for (const n of node) {
            const found = findFunctionElement(n);
            if (found) {
                return found;
            }
        }
        return null;
    }
    if (!node || typeof node !== "object") {
        return null;
    }
    const el = node as { type?: unknown; props?: { children?: unknown } };
    if (typeof el.type === "function") {
        return el as { type: unknown; props: Record<string, unknown> };
    }
    return findFunctionElement(el.props?.children);
}

describe("BlogPage", () => {
    it("derives the post from blog+slug and renders title, date, hero, MDX body, back-link and JSON-LD", () => {
        const html = renderToStaticMarkup(<BlogPage blog={fakeBlog()} slug="hello-world" />);
        expect(html).toContain("Hello World");
        expect(html).toContain("28 June 2026");
        expect(html).toContain('src="/assets/blog/hello-world.jpg"');
        expect(html).toContain("MDX_BODY_CONTENT");
        expect(html).toContain("← Blog");
        expect(html).toContain('href="/blog"');
        expect(html).toContain("application/ld+json");
        expect(html).toContain("BlogPosting");
    });

    it("renders the meta row: category badge, author and reading time beside the date", () => {
        const withAuthor: Post = { ...POST, meta: { ...POST.meta, author: "Neil Kakkar" } };
        const html = renderToStaticMarkup(<BlogPage blog={fakeBlog({ getPost: () => withAuthor })} slug="hello-world" />);
        expect(html).toContain("scribekit-post-cat");
        expect(html).toContain("Guides"); // category badge
        expect(html).toContain("28 June 2026"); // date
        expect(html).toContain("Neil Kakkar"); // author
        expect(html).toContain("5 min read"); // reading time (readingMinutes => 5)
    });

    it("shows the author avatar in the meta row when author-image is set", () => {
        const withAvatar: Post = {
            ...POST,
            meta: { ...POST.meta, author: "Neil Kakkar", authorImage: "/assets/blog/authors/neil.svg" },
        };
        const html = renderToStaticMarkup(<BlogPage blog={fakeBlog({ getPost: () => withAvatar })} slug="hello-world" />);
        expect(html).toContain("scribekit-post-author-avatar");
        expect(html).toContain('src="/assets/blog/authors/neil.svg"');
        expect(html).toContain("Neil Kakkar");
    });

    it("omits the meta-row avatar when the post has an author but no author-image", () => {
        const withAuthor: Post = { ...POST, meta: { ...POST.meta, author: "Neil Kakkar" } };
        const html = renderToStaticMarkup(<BlogPage blog={fakeBlog({ getPost: () => withAuthor })} slug="hello-world" />);
        expect(html).toContain("Neil Kakkar");
        expect(html).not.toContain("scribekit-post-author-avatar");
    });

    it("renders the author bio after the body: written-by label, avatar, name, category and publish date", () => {
        const withAvatar: Post = {
            ...POST,
            meta: { ...POST.meta, author: "Neil Kakkar", authorImage: "/assets/blog/authors/neil.svg" },
        };
        const html = renderToStaticMarkup(<BlogPage blog={fakeBlog({ getPost: () => withAvatar })} slug="hello-world" />);
        expect(html).toContain("scribekit-author-bio");
        expect(html).toContain("Written by");
        expect(html).toContain("scribekit-author-bio-avatar");
        expect(html).toContain("Guides"); // category in the bio meta row
        expect(html).toContain("Published 28 June 2026");
        // The bio follows the MDX body.
        expect(html.indexOf("scribekit-author-bio")).toBeGreaterThan(html.indexOf("MDX_BODY_CONTENT"));
    });

    it("renders the author bio without an avatar when author-image is unset", () => {
        const withAuthor: Post = { ...POST, meta: { ...POST.meta, author: "Neil Kakkar" } };
        const html = renderToStaticMarkup(<BlogPage blog={fakeBlog({ getPost: () => withAuthor })} slug="hello-world" />);
        expect(html).toContain("scribekit-author-bio");
        expect(html).not.toContain("scribekit-author-bio-avatar");
    });

    it("omits the author bio entirely when the post has no author", () => {
        const html = renderToStaticMarkup(<BlogPage blog={fakeBlog()} slug="hello-world" />);
        expect(html).not.toContain("scribekit-author-bio");
        expect(html).not.toContain("Written by");
    });

    it("localizes the author bio copy to the lang prop", () => {
        const frPost: Post = { ...POST, meta: { ...POST.meta, lang: "fr", author: "Neil Kakkar" } };
        const html = renderToStaticMarkup(
            <BlogPage blog={i18nFakeBlog({ getPost: () => frPost })} slug="hello-world" lang="fr" />,
        );
        expect(html).toContain("Écrit par");
        expect(html).toContain("Publié le");
        expect(html).not.toContain("Written by");
    });

    it("omits the JSON-LD script when the blog has no site config", () => {
        const html = renderToStaticMarkup(<BlogPage blog={fakeBlog({ site: undefined })} slug="hello-world" />);
        expect(html).not.toContain("application/ld+json");
    });

    it("omits the back-link when showBackLink is false", () => {
        const html = renderToStaticMarkup(<BlogPage blog={fakeBlog()} slug="hello-world" showBackLink={false} />);
        expect(html).not.toContain("← Blog");
    });

    it("uses basePath for the back-link", () => {
        const html = renderToStaticMarkup(<BlogPage blog={fakeBlog()} slug="hello-world" basePath="/articles" />);
        expect(html).toContain('href="/articles"');
    });

    it("propagates errors from blog.getPost (e.g. an unknown slug in dynamic rendering)", () => {
        const blog = fakeBlog({
            getPost: () => {
                throw new Error("boom");
            },
        });
        expect(() => renderToStaticMarkup(<BlogPage blog={blog} slug="x" />)).toThrow("boom");
    });

    it("forwards source and options to MDXRemote and merges caller components over the id injectors", () => {
        const h2 = () => null;
        const components = { h2 };
        const mdxOptions = { parseFrontmatter: false };
        const element = BlogPage({ blog: fakeBlog(), slug: "hello-world", components, mdxOptions });
        const mdx = findFunctionElement(element);
        const merged = mdx?.props.components as Record<string, unknown>;
        expect(mdx?.props.source).toBe("MDX_BODY_CONTENT");
        expect(mdx?.props.options).toBe(mdxOptions);
        expect(merged.h2).toBe(h2); // caller's h2 wins over the injected one
        expect(typeof merged.h3).toBe("function"); // injected id renderer for headings the caller left alone
    });

    it("injects a slugified anchor id into headings so the minimap links resolve", () => {
        const element = BlogPage({ blog: sidebarBlog(), slug: "hello-world" });
        const mdx = findFunctionElement(element);
        const merged = mdx?.props.components as { h3: (props: { children: unknown }) => ReactElement };
        const rendered = renderToStaticMarkup(merged.h3({ children: "Install Steps" }));
        expect(rendered).toContain('id="install-steps"');
        expect(rendered).toContain("Install Steps");
    });
});

describe("BlogPage sidebar", () => {
    it("renders the two-column layout with the minimap, reading time and similar cards", () => {
        const html = renderToStaticMarkup(<BlogPage blog={sidebarBlog()} slug="hello-world" />);
        expect(html).toContain("scribekit-post-layout");
        expect(html).toContain("On this page");
        expect(html).toContain('href="#getting-started"');
        expect(html).toContain('href="#install"');
        expect(html).toContain("Getting Started");
        expect(html).toContain("4 min read");
        expect(html).toContain("Similar pages");
        expect(html).toContain('href="/blog/img-post"');
        expect(html).toContain("Img Post");
        // Similar cards are text rows (title + category · date + arrow), no thumbnail.
        expect(html).toContain("scribekit-similar-arrow");
        expect(html).toContain("Design");
        expect(html).not.toContain("scribekit-similar-image");
    });

    it("omits the sidebar entirely when showSidebar is false", () => {
        const html = renderToStaticMarkup(<BlogPage blog={sidebarBlog()} slug="hello-world" showSidebar={false} />);
        expect(html).not.toContain("scribekit-post-layout");
        expect(html).not.toContain("scribekit-sidebar");
        expect(html).not.toContain("Similar pages");
        // The article itself still renders.
        expect(html).toContain("Hello World");
    });

    it("renders no sidebar when there is neither a minimap nor similar posts", () => {
        const html = renderToStaticMarkup(<BlogPage blog={fakeBlog()} slug="hello-world" />);
        expect(html).not.toContain("scribekit-post-layout");
        expect(html).not.toContain("scribekit-sidebar");
    });

    it("shows the minimap but omits the similar section when there are no similar posts", () => {
        const html = renderToStaticMarkup(
            <BlogPage blog={sidebarBlog({ similarPosts: () => [] })} slug="hello-world" />,
        );
        expect(html).toContain("scribekit-post-layout");
        expect(html).toContain('href="#getting-started"');
        expect(html).not.toContain("Similar pages");
    });

    it("shows similar posts but omits the minimap when there are no headings", () => {
        const html = renderToStaticMarkup(<BlogPage blog={sidebarBlog({ tableOfContents: () => [] })} slug="hello-world" />);
        expect(html).toContain("Similar pages");
        expect(html).toContain('href="/blog/img-post"');
        expect(html).not.toContain("scribekit-toc");
    });

    it("uses basePath for similar-post links and honours custom titles and reading label", () => {
        const html = renderToStaticMarkup(
            <BlogPage
                blog={sidebarBlog()}
                slug="hello-world"
                basePath="/articles"
                tocTitle="Contents"
                similarTitle="Related"
                readingLabel={(m) => `${m} minuten`}
            />,
        );
        expect(html).toContain('href="/articles/img-post"');
        expect(html).toContain("Contents");
        expect(html).toContain("Related");
        expect(html).toContain("4 minuten");
    });

    it("renders the hero image with a custom image component", () => {
        const Img = (props: { src: string }) => <img data-custom-img="" src={props.src} />;
        const html = renderToStaticMarkup(<BlogPage blog={sidebarBlog()} slug="hello-world" imgComponent={Img} />);
        expect(html).toContain("data-custom-img");
        expect(html).toContain('src="/assets/blog/hello-world.jpg"');
    });
});

// Static-markup only: renderToStaticMarkup does not run effects or clicks, so the scroll-spy
// and mobile collapse (useEffect / useState toggle) are not exercised here - only structure.
describe("BlogSidebar", () => {
    it("renders the minimap links and the similar slot, collapsed by default", () => {
        const html = renderToStaticMarkup(<BlogSidebar toc={TOC} similar={<a href="/blog/x">X</a>} />);
        expect(html).toContain("On this page");
        expect(html).toContain('aria-expanded="false"');
        expect(html).toContain('href="#getting-started"');
        expect(html).toContain('href="#install"');
        expect(html).toContain("scribekit-toc-sub"); // the ### entry is marked as a sub-heading
        expect(html).toContain("Similar pages");
        expect(html).toContain('href="/blog/x"');
    });

    it("marks the first heading active by default so the minimap always shows a selection", () => {
        const html = renderToStaticMarkup(<BlogSidebar toc={TOC} />);
        // First entry is highlighted before any scroll; the second stays inactive.
        expect(html).toContain('href="#getting-started" class="scribekit-toc-link is-active"');
        expect(html).toContain('href="#install" class="scribekit-toc-link"');
    });

    it("omits the minimap nav and similar block when there is no content for them", () => {
        const html = renderToStaticMarkup(<BlogSidebar toc={[]} />);
        expect(html).not.toContain("scribekit-toc");
        expect(html).not.toContain("Similar pages");
    });

    it("uses custom titles", () => {
        const html = renderToStaticMarkup(
            <BlogSidebar toc={TOC} title="Contents" similarTitle="Related" similar={<span>s</span>} />,
        );
        expect(html).toContain("Contents");
        expect(html).toContain("Related");
    });
});

describe("BlogOverview", () => {
    it("derives posts from blog.getAllPosts() and renders a card grid with JSON-LD", () => {
        const html = renderToStaticMarkup(<BlogOverview blog={fakeBlog()} />);
        expect(html).toContain('href="/blog/hello-world"');
        expect(html).toContain('href="/blog/second"');
        expect(html).toContain("Hello World");
        expect(html).toContain("Second Post");
        expect(html).toContain('src="/assets/blog/hello-world.jpg"');
        expect(html).toContain("28 June 2026");
        expect(html).toContain("Read more");
        expect(html).toContain("application/ld+json");
        expect(html).toContain("CollectionPage");
    });

    it("renders each card's reading time and category badges", () => {
        const html = renderToStaticMarkup(<BlogOverview blog={fakeBlog()} />);
        expect(html).toContain("5 min read");
        expect(html).toContain("3 min read");
        expect(html).toContain("scribekit-cat");
        expect(html).toContain("Guides");
        expect(html).toContain("Tutorials");
    });

    it("renders the search box and category filter buttons when there are 2+ categories", () => {
        const html = renderToStaticMarkup(<BlogOverview blog={fakeBlog()} />);
        expect(html).toContain("scribekit-search");
        expect(html).toContain("scribekit-filters");
        expect(html).toContain(">All<"); // the clear-filter button
    });

    it("omits the category filter buttons when the posts share a single category", () => {
        const html = renderToStaticMarkup(<BlogOverview blog={fakeBlog()} posts={[POST.meta]} />);
        expect(html).toContain("scribekit-search"); // search always shown
        expect(html).not.toContain("scribekit-filters"); // only one distinct category -> no filter bar
    });

    it("uses the blog locale to format card dates", () => {
        const html = renderToStaticMarkup(<BlogOverview blog={fakeBlog({ locale: "en-US" })} posts={[POST.meta]} />);
        expect(html).toContain("June 28, 2026");
    });

    it("uses the posts prop to override the derived posts", () => {
        const html = renderToStaticMarkup(<BlogOverview blog={fakeBlog()} posts={[POST.meta]} />);
        expect(html).toContain('href="/blog/hello-world"');
        expect(html).not.toContain('href="/blog/second"');
    });

    it("renders the empty state and no grid/JSON-LD when there are no posts", () => {
        const html = renderToStaticMarkup(<BlogOverview blog={fakeBlog({ site: undefined })} posts={[]} />);
        expect(html).toContain("No posts yet");
        expect(html).not.toContain("scribekit-grid");
        expect(html).not.toContain("application/ld+json");
    });

    it("uses a custom basePath for card links", () => {
        const html = renderToStaticMarkup(<BlogOverview blog={fakeBlog()} posts={[POST.meta]} basePath="/articles" />);
        expect(html).toContain('href="/articles/hello-world"');
    });

    it("uses custom link and img components", () => {
        const Link = (props: { href: string; children: unknown }) => (
            <a data-custom-link="" href={props.href}>
                {props.children as never}
            </a>
        );
        const Img = (props: { src: string }) => <img data-custom-img="" src={props.src} />;
        const html = renderToStaticMarkup(
            <BlogOverview blog={fakeBlog()} posts={[POST.meta]} linkComponent={Link} imgComponent={Img} />,
        );
        expect(html).toContain("data-custom-link");
        expect(html).toContain("data-custom-img");
    });

    it("localizes the built-in UI copy to the lang prop (no English on /fr/blog)", () => {
        const html = renderToStaticMarkup(<BlogOverview blog={i18nFakeBlog()} lang="fr" />);
        expect(html).toContain("Rechercher des articles…"); // search placeholder
        expect(html).toContain("Lire la suite →"); // read-more CTA
        expect(html).toContain("min de lecture"); // per-card reading time
        expect(html).toContain(">Tous<"); // clear-filter button
        expect(html).not.toContain("Read more");
        expect(html).not.toContain("min read");
    });

    it("renders custom empty and read-more labels", () => {
        expect(renderToStaticMarkup(<BlogOverview blog={fakeBlog()} posts={[]} emptyLabel="Nothing here" />)).toContain(
            "Nothing here",
        );
        expect(
            renderToStaticMarkup(<BlogOverview blog={fakeBlog()} posts={[POST.meta]} readMoreLabel="Keep reading" />),
        ).toContain("Keep reading");
    });

    it("defaults the card basePath from blog.site.basePath", () => {
        const html = renderToStaticMarkup(
            <BlogOverview blog={fakeBlog({ site: { ...SITE, basePath: "/articles" } })} posts={[POST.meta]} />,
        );
        expect(html).toContain('href="/articles/hello-world"');
    });

    it("prefixes card links for a non-default language (front-locale scheme)", () => {
        const frPost: PostMeta = { ...POST.meta, lang: "fr" };
        const html = renderToStaticMarkup(<BlogOverview blog={i18nFakeBlog({ getAllPosts: () => [frPost] })} lang="fr" />);
        expect(html).toContain('href="/fr/blog/hello-world"');
    });

    it("prefixes default-language card links when prefixDefaultLocale is set", () => {
        const html = renderToStaticMarkup(
            <BlogOverview blog={i18nFakeBlog({ prefixDefaultLocale: true, getAllPosts: () => [POST.meta] })} lang="en" />,
        );
        expect(html).toContain('href="/en/blog/hello-world"');
    });
});

describe("BlogPage multi-language", () => {
    it("does not render a built-in language switcher (that is the implementer's job)", () => {
        const html = renderToStaticMarkup(<BlogPage blog={i18nFakeBlog()} slug="hello-world" lang="en" />);
        expect(html).not.toContain("scribekit-lang-switcher");
    });

    it("builds the back-link in the current language's URL space (front-locale scheme)", () => {
        const frPost: Post = { ...POST, meta: { ...POST.meta, lang: "fr" } };
        const html = renderToStaticMarkup(
            <BlogPage blog={i18nFakeBlog({ getPost: () => frPost })} slug="hello-world" lang="fr" />,
        );
        expect(html).toContain('href="/fr/blog"'); // back-link to the fr overview
    });

    it("defaults basePath from blog.site.basePath", () => {
        const html = renderToStaticMarkup(
            <BlogPage blog={fakeBlog({ site: { ...SITE, basePath: "/articles" } })} slug="hello-world" />,
        );
        expect(html).toContain('href="/articles"'); // back-link uses site.basePath (default language)
    });

    it("localizes the post + sidebar UI copy to the lang prop", () => {
        const html = renderToStaticMarkup(<BlogPage blog={sidebarBlog()} slug="hello-world" lang="fr" />);
        expect(html).toContain("Sur cette page"); // sidebar minimap heading
        expect(html).toContain("Pages similaires"); // similar-post heading
        expect(html).toContain("min de lecture"); // reading time
        expect(html).not.toContain("On this page");
        expect(html).not.toContain("min read");
    });
});
