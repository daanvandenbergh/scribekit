import { type ElementType, type ReactElement, type ReactNode } from "react";

/** The visual styles a {@link DocsNavbarButton} can take, matching the design's top-right section. */
export type DocsNavbarButtonVariant = "link" | "primary" | "secondary";

/**
 * Props for {@link DocsNavbarButton}.
 */
export interface DocsNavbarButtonProps {
    /** The button's label. */
    children: ReactNode;
    /** When set, renders a link to this href; otherwise a `<button>`. */
    href?: string;
    /** Click handler for the `<button>` form (ignored when `href` is set). */
    onClick?: () => void;
    /**
     * The look: `"link"` (a quiet text link, like the design's Support/Status), `"primary"` (the dark
     * filled button, like the design's "Dashboard"), or `"secondary"` (a bordered pill). Defaults to `"link"`.
     */
    variant?: DocsNavbarButtonVariant;
    /** Element used when rendering a link (with `href`). Defaults to `"a"`; pass `next/link`. */
    linkComponent?: ElementType;
    /** Optional leading icon. */
    icon?: ReactNode;
    /** Link target (e.g. `"_blank"` for external links). */
    target?: string;
    /** Link `rel` (e.g. `"noreferrer"`). */
    rel?: string;
    /** Accessible label, for icon-only buttons. */
    ariaLabel?: string;
    /** Extra class appended to the button. */
    className?: string;
}

/**
 * A navbar action styled to match the design's top-right section: a quiet text `link`, the dark
 * `primary` button ("Dashboard"), or a bordered `secondary` pill. Renders a link when given `href`
 * (via `linkComponent`), else a `<button>`. Pass a list of these to `DocsNavbar`'s `actions`.
 *
 * Presentational (no hooks), so it renders in a server or client tree - but the `<button>` `onClick`
 * form must be used within a client component.
 *
 * @param props - see {@link DocsNavbarButtonProps}.
 * @returns the styled link or button.
 */
export function DocsNavbarButton({
    children,
    href,
    onClick,
    variant = "link",
    linkComponent: Link = "a",
    icon,
    target,
    rel,
    ariaLabel,
    className,
}: DocsNavbarButtonProps): ReactElement {
    const classes = [`scribekit-docs-navbar-btn`, `scribekit-docs-navbar-btn-${variant}`, className].filter(Boolean).join(" ");
    const inner = (
        <>
            {icon ? <span className="scribekit-docs-navbar-btn-icon">{icon}</span> : null}
            {children}
        </>
    );
    if (href !== undefined) {
        return (
            <Link href={href} className={classes} target={target} rel={rel} aria-label={ariaLabel}>
                {inner}
            </Link>
        );
    }
    return (
        <button type="button" className={classes} onClick={onClick} aria-label={ariaLabel}>
            {inner}
        </button>
    );
}
