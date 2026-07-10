import { describe, expect, it } from "vitest";
import { formatDate, isoDateString } from "../format.js";

describe("formatDate", () => {
    it("formats an ISO date as an en-GB long date by default", () => {
        expect(formatDate("2026-06-28")).toBe("28 June 2026");
    });

    it("is timezone-stable (renders the same calendar day regardless of host TZ)", () => {
        expect(formatDate("2026-01-01")).toBe("1 January 2026");
        expect(formatDate("2026-12-31")).toBe("31 December 2026");
    });

    it("returns an empty string unchanged", () => {
        expect(formatDate("")).toBe("");
    });

    it("returns unparseable input unchanged", () => {
        expect(formatDate("not-a-date")).toBe("not-a-date");
        expect(formatDate("2026-13-40")).toBe("2026-13-40");
    });

    it("honours a custom locale", () => {
        expect(formatDate("2026-06-28", "en-US")).toBe("June 28, 2026");
    });
});

describe("isoDateString", () => {
    it("passes a string through unchanged (the quoted-front-matter path)", () => {
        expect(isoDateString("2026-06-28")).toBe("2026-06-28");
        expect(isoDateString("")).toBe("");
        // Not re-validated: a string is trusted as-is, mirroring the prior behaviour.
        expect(isoDateString("whatever")).toBe("whatever");
    });

    it("coerces a YAML Date (the unquoted-front-matter path) to a UTC YYYY-MM-DD string", () => {
        // gray-matter/YAML parses an unquoted `date: 2026-06-28` as a Date at UTC midnight.
        expect(isoDateString(new Date("2026-06-28T00:00:00Z"))).toBe("2026-06-28");
        // A date-time literal still collapses to its UTC calendar day.
        expect(isoDateString(new Date("2026-06-28T23:30:00Z"))).toBe("2026-06-28");
    });

    it("returns undefined for an invalid Date or a non-date value", () => {
        expect(isoDateString(new Date("nonsense"))).toBeUndefined();
        expect(isoDateString(undefined)).toBeUndefined();
        expect(isoDateString(null)).toBeUndefined();
        expect(isoDateString(20260628)).toBeUndefined();
        expect(isoDateString({ year: 2026 })).toBeUndefined();
    });
});
