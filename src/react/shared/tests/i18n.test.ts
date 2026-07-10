import { describe, expect, it } from "vitest";
import { ui, CATALOG, blogLabels, docsLabels, resolveLanguage } from "../i18n.js";

/** Every language {@link ui} carries copy for - the modern replacement for the old `SUPPORTED`. */
const CODES = ui.list.map((l) => l.code);

describe("ui instance", () => {
    it("covers the EU's 24 official languages with `en` as the default", () => {
        expect(CODES).toHaveLength(24);
        expect(CODES).toContain("en");
        expect(CODES).toContain("mt");
        expect(ui.default).toBe("en");
    });
});

describe("resolveLanguage", () => {
    it("returns a supported code unchanged", () => {
        expect(resolveLanguage("fr")).toBe("fr");
        expect(resolveLanguage("en")).toBe("en");
        expect(resolveLanguage("mt")).toBe("mt");
    });

    it("matches on the primary subtag so regional variants resolve to their base", () => {
        expect(resolveLanguage("pt-BR")).toBe("pt");
        expect(resolveLanguage("de-AT")).toBe("de");
    });

    it("is case-insensitive", () => {
        expect(resolveLanguage("FR")).toBe("fr");
        expect(resolveLanguage("En-GB")).toBe("en");
    });

    it("falls back to the default for missing or unsupported codes", () => {
        expect(resolveLanguage(undefined)).toBe(ui.default);
        expect(resolveLanguage("")).toBe(ui.default);
        expect(resolveLanguage("zz")).toBe(ui.default);
        expect(resolveLanguage("ja")).toBe(ui.default);
    });
});

describe("CATALOG coverage", () => {
    it("carries a non-empty translation for every supported language in every entry", () => {
        for (const [key, entry] of Object.entries(CATALOG)) {
            for (const lang of CODES) {
                const value = (entry as Record<string, unknown>)[lang];
                expect(value, `${key}.${lang} missing`).toBeDefined();
                const resolved = typeof value === "function" ? (value as (m: number) => string)(5) : value;
                expect(String(resolved).trim(), `${key}.${lang} empty`).not.toBe("");
            }
        }
    });

    it("renders the minute count inside every reading-time translation", () => {
        for (const lang of CODES) {
            expect(CATALOG.readingTime[lang](7)).toContain("7");
        }
    });
});

describe("ui.translator", () => {
    it("resolves a static text for the bound locale", () => {
        expect(ui.translator("de")(CATALOG.loadMore)).toBe("Mehr laden");
        expect(ui.translator("en")(CATALOG.loadMore)).toBe("Load more");
    });

    it("resolves a parameterized text with its inferred argument", () => {
        expect(ui.translator("fr")(CATALOG.readingTime, 4)).toBe("4 min de lecture");
        expect(ui.translator("en")(CATALOG.readingTime, 4)).toBe("4 min read");
        expect(ui.translator("de")(CATALOG.publishedOn, "12 Jan 2026")).toBe("Veröffentlicht am 12 Jan 2026");
    });
});

describe("blogLabels", () => {
    it("returns localized labels for a supported language", () => {
        const fr = blogLabels("fr");
        expect(fr.readMore).toBe("Lire la suite →");
        expect(fr.searchPlaceholder).toBe("Rechercher des articles…");
        expect(fr.onThisPage).toBe("Sur cette page");
        expect(fr.readingLabel(3)).toBe("3 min de lecture");
    });

    it("falls back to English for an unsupported language", () => {
        const xx = blogLabels("xx");
        expect(xx.loadMore).toBe("Load more");
        expect(xx.readingLabel(2)).toBe("2 min read");
    });

    it("resolves regional variants via the primary subtag", () => {
        expect(blogLabels("es-MX").allCategories).toBe("Todos");
    });
});

describe("docsLabels", () => {
    it("returns localized docs labels for a supported language", () => {
        const fr = docsLabels("fr");
        expect(fr.title).toBe("Documentation");
        expect(docsLabels("de").title).toBe("Dokumentation");
        expect(docsLabels("nl").title).toBe("Documentatie");
        expect(fr.previous).toBe("Précédent");
        expect(fr.next).toBe("Suivant");
        expect(fr.feedbackQuestion).toBe("Cette page vous a-t-elle été utile ?");
        expect(fr.searchPlaceholder).toBe("Rechercher dans la doc…");
        expect(fr.onThisPage).toBe("Sur cette page");
        expect(fr.language).toBe("Langue");
        expect(fr.changeLanguage).toBe("Changer de langue");
        expect(fr.updatedLabel("3 juillet 2026")).toBe("Mis à jour le 3 juillet 2026");
        expect(fr.readingLabel(4)).toBe("4 min de lecture");
    });

    it("falls back to English for an unsupported language", () => {
        const xx = docsLabels("xx");
        expect(xx.feedbackYes).toBe("Yes");
        expect(xx.feedbackNo).toBe("No");
        expect(xx.searchEmpty).toBe("No results");
        expect(xx.updatedLabel("Jul 3")).toBe("Updated Jul 3");
    });
});
