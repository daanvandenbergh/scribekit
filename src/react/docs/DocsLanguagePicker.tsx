"use client";

import { useEffect, useRef, useState, type ElementType, type MouseEvent, type ReactElement, type ReactNode } from "react";
import { localeFlag } from "@daanvandenbergh/i18nkit/react";
import type { LocaleConfig } from "../../docs/types.js";
import { docsLabels } from "../shared/i18n.js";
import { switchLocaleHref } from "./internal/nav.js";

/**
 * Props for {@link DocsLanguagePicker}.
 */
export interface DocsLanguagePickerProps {
    /**
     * The languages the docs are published in (`docs.locales`). The picker auto-hides when there is
     * one or fewer, so you can always render it.
     */
    locales: LocaleConfig[];
    /** The currently-rendered language code. */
    currentLang: string;
    /** The current page's URL path (e.g. `usePathname()`), used to build the same page's URL per locale. */
    activePath?: string | undefined;
    /** The docs section base path (e.g. `/docs`). Defaults to `/blog` via the shared normaliser. */
    basePath?: string | undefined;
    /** The locale served without a URL prefix (unless prefixed below). */
    defaultLocale: string;
    /** When `true`, the default locale is URL-prefixed too. */
    prefixDefaultLocale?: boolean | undefined;
    /** Element used for the language links. Defaults to `"a"`; pass `next/link` for client-side nav. */
    linkComponent?: ElementType;
    /**
     * Optional. Called with the chosen locale code instead of letting the link navigate - the app
     * then owns the switch (the click is `preventDefault`ed; the menu still closes).
     *
     * REQUIRED whenever your app resolves a bare URL's language from a stored preference (a cookie
     * or `Accept-Language`) in middleware. A plain link cannot work there: switching TO the default
     * locale means navigating to the unprefixed `/docs/<slug>`, which your middleware then redirects
     * straight back to the *old* stored language - so the reader clicks "English", stays in Dutch,
     * and can never leave. Only a handler that writes the new preference BEFORE navigating can win
     * that race. Wire it to your locale setter, e.g. i18nkit's `useSetLocale()` (it writes the
     * cookie synchronously, then its provider navigates).
     *
     * Leave it unset for a purely URL-routed site: the links navigate on their own, as before.
     */
    onSelect?: (code: string) => void;
    /**
     * Renders a flag (or any node) for a locale code, shown before its name. Defaults to i18nkit's
     * `localeFlag` (inline-SVG flags); pass `() => null` for a text-only picker.
     */
    renderFlag?: ((code: string) => ReactNode) | undefined;
    /** Language used to localize the picker's own copy ("Language", "Change language"). Defaults to `currentLang`. */
    lang?: string | undefined;
    /** Accessible name for the trigger. Defaults to the `lang` translation of "Change language". */
    changeLanguageLabel?: string | undefined;
    /** Heading above the list. Defaults to the `lang` translation of "Language". */
    headingLabel?: string | undefined;
    /** Extra class appended to the picker root, for positioning. */
    className?: string | undefined;
}

/** A small chevron for the trigger. */
function Caret(): ReactElement {
    return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 4.5l3 3 3-3" />
        </svg>
    );
}

/**
 * The docs language switcher: a compact flag-and-caret trigger that opens a menu of the docs'
 * languages, each a link to the same page in that locale (built via the shared `localePath`, so the
 * links match the rendered routes and carry `hreflang`). Modelled on the SwiftGuard picker's flag
 * trigger, but link-based - the right fit for scribekit's URL-per-locale docs (SSG + SEO). Reuses
 * i18nkit's `localeFlag` for the flags. **Auto-hides when the docs have a single locale**, so it can
 * always be rendered.
 *
 * A client component (open/close, click-away, Escape). Pass `activePath` (the current pathname) so a
 * switch keeps the reader on the same page in the new language.
 *
 * @param props - see {@link DocsLanguagePickerProps}.
 * @returns the picker, or `null` when there are fewer than two locales.
 */
export function DocsLanguagePicker({
    locales,
    currentLang,
    activePath,
    basePath,
    defaultLocale,
    prefixDefaultLocale,
    linkComponent: Link = "a",
    onSelect,
    renderFlag,
    lang,
    changeLanguageLabel,
    headingLabel,
    className,
}: DocsLanguagePickerProps): ReactElement | null {
    const labels = docsLabels(lang ?? currentLang);
    const changeLabel = changeLanguageLabel ?? labels.changeLanguage;
    const heading = headingLabel ?? labels.language;
    const flag = renderFlag ?? localeFlag;

    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement | null>(null);

    // Close on click-away and Escape while open.
    useEffect(() => {
        if (!open) {
            return undefined;
        }
        const onPointerDown = (event: globalThis.MouseEvent): void => {
            if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        const onKey = (event: globalThis.KeyboardEvent): void => {
            if (event.key === "Escape") {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    if (locales.length <= 1) {
        return null;
    }

    const current = locales.find((locale) => locale.code === currentLang) ?? locales[0];
    const currentName = current.label ?? current.code;

    return (
        <div ref={rootRef} className={className ? `scribekit-docs-lang ${className}` : "scribekit-docs-lang"}>
            <button
                type="button"
                className="scribekit-docs-lang-trigger"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label={`${changeLabel} (${currentName})`}
                onClick={() => setOpen((value) => !value)}
            >
                <span className="scribekit-docs-lang-flag">{flag(current.code)}</span>
                <Caret />
            </button>
            {open ? (
                <div className="scribekit-docs-lang-menu" role="menu" aria-label={heading}>
                    <div className="scribekit-docs-lang-heading">{heading}</div>
                    {locales.map((locale) => {
                        const active = locale.code === currentLang;
                        const href = switchLocaleHref(activePath ?? "", locale.code, { basePath, defaultLocale, prefixDefaultLocale });
                        return (
                            <Link
                                key={locale.code}
                                href={href}
                                hrefLang={locale.code}
                                role="menuitem"
                                aria-current={active ? "true" : undefined}
                                className={active ? "scribekit-docs-lang-item is-active" : "scribekit-docs-lang-item"}
                                onClick={(event: MouseEvent<HTMLAnchorElement>) => {
                                    setOpen(false);
                                    // With `onSelect`, the app owns the switch: suppress the link's
                                    // own navigation so it can write the new locale preference FIRST
                                    // and then route (see the prop's docblock). Without it, nothing
                                    // changes - the anchor navigates exactly as before.
                                    if (onSelect) {
                                        event.preventDefault();
                                        onSelect(locale.code);
                                    }
                                }}
                            >
                                <span className="scribekit-docs-lang-flag">{flag(locale.code)}</span>
                                <span className="scribekit-docs-lang-name">{locale.label ?? locale.code}</span>
                                {active ? (
                                    <svg className="scribekit-docs-lang-check" width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <path d="M3.5 8l3 3 5-6" />
                                    </svg>
                                ) : null}
                            </Link>
                        );
                    })}
                </div>
            ) : null}
        </div>
    );
}
