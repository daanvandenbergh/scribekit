import { type ElementType, type ReactElement, type ReactNode } from "react";

/**
 * One call-to-action in the {@link DocsHero}'s button row.
 */
export interface DocsHeroAction {
    /** The button's visible text. */
    label: string;
    /** Where it goes. Rendered through the hero's `linkComponent`. */
    href: string;
    /**
     * `"primary"` renders the filled, brand-gradient button; `"secondary"` the outlined one.
     * Defaults to `"primary"` for the FIRST action and `"secondary"` for every one after it, so
     * the common two-button row needs no variant at all.
     */
    variant?: "primary" | "secondary" | undefined;
    /** Optional leading glyph, rendered before the label. */
    icon?: ReactNode;
}

/**
 * One fact in the {@link DocsHero}'s stat row - "19 articles", "7 topics", "Updated 28 Jul".
 */
export interface DocsHeroStat {
    /** The fully-formed, already-localized text. The hero never pluralizes or formats. */
    label: string;
    /**
     * When `true` a green dot precedes the label, marking it as a liveness signal (the design
     * uses it on "Updated <date>", to say the corpus is actively maintained). Purely decorative:
     * the dot is `aria-hidden`, so the label must read correctly on its own.
     */
    live?: boolean | undefined;
}

/**
 * How the {@link DocsHero} is framed.
 *
 * `"plain"` is bare content on the page background - no border, no fill, no decoration - which is
 * what most docs sites want and is therefore the default. `"card"` wraps the same content in the
 * tinted gradient panel: a rounded, bordered surface with two colour washes, a graph-paper grid
 * fading downwards, and a spectrum rule along the top edge.
 *
 * The choice is purely presentational; the markup inside is identical either way.
 */
export type DocsHeroVariant = "plain" | "card";

/**
 * Props for {@link DocsHero}.
 */
export interface DocsHeroProps {
    /** The `<h1>`. The only required prop. */
    title: string;
    /** The supporting sentence under the title. Omitted when unset. */
    description?: string | undefined;
    /** Small uppercase pill above the title (e.g. the localized word "Documentation"). */
    eyebrow?: string | undefined;
    /** The button row. Omitted entirely when empty. */
    actions?: DocsHeroAction[] | undefined;
    /** The dot-separated fact row under the buttons. Omitted entirely when empty. */
    stats?: DocsHeroStat[] | undefined;
    /** How the hero is framed. Defaults to `"plain"`. See {@link DocsHeroVariant}. */
    variant?: DocsHeroVariant | undefined;
    /** Element used for the action links. Defaults to `"a"`; pass `next/link` for client-side nav. */
    linkComponent?: ElementType;
    /** Extra nodes rendered inside the panel, after the stat row. */
    children?: ReactNode;
    /** Appended to the section's class list, for consumer-side overrides. */
    className?: string | undefined;
}

/**
 * The docs index's opening block: an eyebrow, the title, a lead paragraph, a row of calls to action
 * and a row of facts - bare on the page by default, or wrapped in the tinted gradient panel with
 * `variant="card"`.
 *
 * A pure presentational server component - it takes finished, already-localized strings and knows
 * nothing about a `Docs` instance, which is what lets it head a hand-assembled index page as
 * happily as the packaged {@link DocsIndex}.
 *
 * The card's decorative layers are `aria-hidden` and NOT RENDERED AT ALL in the plain variant,
 * rather than hidden with CSS: they are three absolutely-positioned elements that only make sense
 * inside a bounded surface, and leaving them in the tree for a consumer to un-style is how a
 * "plain" hero ends up with a stray gradient bar across the top of the page. Each one is driven by
 * a `--scribekit-hero-*` custom property, so a card can be restyled without forking the component.
 *
 * @param props - see {@link DocsHeroProps}.
 * @returns the hero section.
 */
export function DocsHero({
    title,
    description,
    eyebrow,
    actions,
    stats,
    variant = "plain",
    linkComponent: Link = "a",
    children,
    className,
}: DocsHeroProps): ReactElement {
    const buttons = actions ?? [];
    const facts = stats ?? [];
    const card = variant === "card";
    return (
        <section className={`scribekit-docs-hero${card ? " is-card" : ""}${className ? ` ${className}` : ""}`}>
            {card ? (
                <>
                    <span aria-hidden="true" className="scribekit-docs-hero-glow" />
                    <span aria-hidden="true" className="scribekit-docs-hero-grid" />
                    <span aria-hidden="true" className="scribekit-docs-hero-rule" />
                </>
            ) : null}

            <div className="scribekit-docs-hero-body">
                {eyebrow ? <span className="scribekit-docs-hero-eyebrow">{eyebrow}</span> : null}
                <h1 className="scribekit-docs-hero-title">{title}</h1>
                {description ? <p className="scribekit-docs-hero-desc">{description}</p> : null}

                {buttons.length > 0 ? (
                    <div className="scribekit-docs-hero-actions">
                        {buttons.map((action, index) => {
                            // First action leads unless told otherwise - the overwhelmingly common
                            // shape is one primary followed by quieter alternatives.
                            const variant = action.variant ?? (index === 0 ? "primary" : "secondary");
                            return (
                                <Link
                                    key={`${action.href}-${action.label}`}
                                    href={action.href}
                                    className={`scribekit-docs-hero-action is-${variant}`}
                                >
                                    {action.icon ? <span className="scribekit-docs-hero-action-icon">{action.icon}</span> : null}
                                    {action.label}
                                    {variant === "primary" ? (
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 16 16"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            aria-hidden="true"
                                        >
                                            <path d="M3 8h9M8.5 4.5L12 8l-3.5 3.5" />
                                        </svg>
                                    ) : null}
                                </Link>
                            );
                        })}
                    </div>
                ) : null}

                {facts.length > 0 ? (
                    <div className="scribekit-docs-hero-stats">
                        {facts.map((stat, index) => (
                            // The separator is a sibling rather than a ::before, so it can be
                            // dropped before the first item without a :first-child rule fighting
                            // the flex-wrap that puts a different item first on a narrow screen.
                            <span key={stat.label} className="scribekit-docs-hero-stat">
                                {index > 0 ? <span aria-hidden="true" className="scribekit-docs-hero-stat-sep" /> : null}
                                {stat.live ? <span aria-hidden="true" className="scribekit-docs-hero-stat-dot" /> : null}
                                {stat.label}
                            </span>
                        ))}
                    </div>
                ) : null}

                {children}
            </div>
        </section>
    );
}
