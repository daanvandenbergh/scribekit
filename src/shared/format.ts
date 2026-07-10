/**
 * Pure, framework-free date formatting for content metadata. Kept fs-free so both the
 * backend content classes (`Blog`, `Docs`) and the React components can import it without
 * pulling in `node:fs`.
 */

/**
 * Normalises a raw front-matter date value to an ISO `YYYY-MM-DD` string. Front-matter is
 * parsed as YAML, whose native date type turns an *unquoted* `date: 2026-06-28` into a `Date`
 * object - only a quoted `"2026-06-28"` stays a string. This coerces either form to the
 * `YYYY-MM-DD` string the metadata contract expects, so an author who omits the quotes does not
 * silently lose the date (it feeds the rendered date, the JSON-LD `datePublished`, the
 * OpenGraph `publishedTime`, and any date sort).
 *
 * @param value - the raw front-matter value (a string, a YAML `Date`, or anything else).
 * @returns the `YYYY-MM-DD` string; a string passes through unchanged, a valid `Date` is
 *   formatted at UTC, and any other value (including an invalid `Date`) yields `undefined`.
 */
export function isoDateString(value: unknown): string | undefined {
    if (typeof value === "string") {
        return value;
    }
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value.toISOString().slice(0, 10);
    }
    return undefined;
}

/**
 * Formats an ISO `YYYY-MM-DD` date as a human-readable long date (e.g. "28 June 2026").
 *
 * The date is interpreted at UTC midnight so the rendered day never shifts with the
 * host timezone. Empty or unparseable input is returned unchanged, which lets callers
 * pass a page's raw `date` field straight through.
 *
 * @param iso - the ISO date string (`YYYY-MM-DD`); empty or invalid input is returned as-is.
 * @param locale - the BCP 47 locale used for month/day names. Defaults to `en-GB`.
 * @returns the formatted date, or the original string when it is empty or unparseable.
 */
export function formatDate(iso: string, locale: string = "en-GB"): string {
    if (!iso) {
        return "";
    }
    const d = new Date(iso + "T00:00:00Z");
    if (Number.isNaN(d.getTime())) {
        return iso;
    }
    return d.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}
