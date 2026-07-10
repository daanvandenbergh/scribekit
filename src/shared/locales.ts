/**
 * Pure, framework-free locale/URL helpers shared by the SEO builders (`seo.ts`) and the React
 * components, so a page's URL is built exactly one way everywhere - eliminating any drift
 * between the rendered links and the canonical/hreflang metadata. Kept fs-free (no `node:fs`,
 * no `next`/`react` import): the folder-based content layout is walked by each backend reader,
 * while this module only turns a `(slug, lang)` pair into a URL path.
 *
 * The locale-prefix math is delegated to `@daanvandenbergh/i18nkit`'s {@link I18n.prefixFor}
 * (the "default at bare URLs, others under `/<code>`" scheme, or `prefix-all` when the default is
 * prefixed too), rather than reimplemented here. `localePath` stays a pure function of plain
 * serializable inputs - not an `I18n` instance - because it is also called from a client
 * component (`BlogOverviewGrid`), across which a class instance cannot be passed as a prop.
 */

import { I18n } from "@daanvandenbergh/i18nkit";

/** Default route a section is mounted at when no base path is configured. */
const DEFAULT_BASE_PATH = "/blog";

/**
 * Memoized locale-prefix lookups. A `(defaultLocale, prefixDefaultLocale, lang)` triple always
 * yields the same prefix, and the distinct set is tiny (bounded by the locale count), so the
 * per-call {@link I18n} construction is done once and its result reused - this helper is hit once
 * per rendered card/link.
 */
const prefixCache = new Map<string, string>();

/**
 * The leading locale segment for a page's URL, via i18nkit's `prefixFor`: `""` for the default
 * locale (unless `prefixDefaultLocale` prefixes it too), else `/<lang>` (lowercased, the URL
 * convention). Builds a minimal two-locale {@link I18n} because `prefixFor` only ever inspects the
 * target `lang` and the default; the result is memoized.
 *
 * @param lang - the target locale code.
 * @param defaultLocale - the locale served without a prefix.
 * @param prefixDefaultLocale - when `true`, the default locale is prefixed too (`prefix-all`).
 * @returns the leading URL segment (`""` or `/<lang>`).
 */
function localePrefix(lang: string, defaultLocale: string, prefixDefaultLocale: boolean): string {
    const key = `${defaultLocale} ${prefixDefaultLocale} ${lang}`;
    let prefix = prefixCache.get(key);
    if (prefix === undefined) {
        const i18n = new I18n({
            locales: { [defaultLocale]: { label: defaultLocale }, [lang]: { label: lang } },
            default: defaultLocale,
            strategy: prefixDefaultLocale ? "prefix-all" : "prefix-except-default",
        });
        prefix = i18n.prefixFor(lang);
        prefixCache.set(key, prefix);
    }
    return prefix;
}

/**
 * Normalises a base path: guarantees a single leading slash and strips any trailing slash, so
 * callers can append URL segments with a plain `/`.
 *
 * @param basePath - the configured base path (e.g. `/blog`, `docs/`); defaults to `/blog`.
 * @returns the normalised base path without a trailing slash (e.g. `/blog`, `/docs`).
 */
export function normalizeBasePath(basePath: string | undefined): string {
    const raw = basePath ?? DEFAULT_BASE_PATH;
    const withLeading = raw.startsWith("/") ? raw : `/${raw}`;
    return withLeading.endsWith("/") ? withLeading.slice(0, -1) : withLeading;
}

/**
 * Builds the root-relative URL path for a page - or, when `slug` is omitted, for a locale's
 * index page. The single source of truth shared by the SEO metadata and the rendered links:
 * every locale is prefixed with its code at the very front of the path (`/<lang><base>/<slug>`,
 * e.g. `/fr/docs/getting-started`), except the default locale, which is served unprefixed
 * (`<base>/<slug>`) unless `prefixDefaultLocale` is set - useful when every locale should route
 * through a single `[lang]` segment (`/en/docs/...`, `/fr/docs/...`).
 *
 * @param opts.basePath - the section base path; defaults to `/blog`.
 * @param opts.defaultLocale - the locale code served without a prefix (unless prefixed below).
 * @param opts.lang - the target locale code.
 * @param opts.slug - the page slug; omit for the locale's index URL.
 * @param opts.prefixDefaultLocale - when `true`, the default locale is prefixed too.
 * @returns the root-relative URL path (resolves against `metadataBase`, like the canonical).
 */
export function localePath(opts: {
    basePath?: string | undefined;
    defaultLocale: string;
    lang: string;
    slug?: string | undefined;
    prefixDefaultLocale?: boolean | undefined;
}): string {
    const base = normalizeBasePath(opts.basePath);
    const prefix = localePrefix(opts.lang, opts.defaultLocale, opts.prefixDefaultLocale ?? false);
    const path = `${prefix}${base}`;
    return opts.slug ? `${path}/${opts.slug}` : path;
}
