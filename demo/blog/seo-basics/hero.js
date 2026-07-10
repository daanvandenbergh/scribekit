// Hero params for seo-basics, all languages. No byline defined -> the hero renders without one.
const text = {
    en: { title: "SEO basics for a Next.js blog", subtitle: "Titles, meta descriptions, canonical URLs, and the JSON-LD the package emits." },
    fr: { title: "Les bases du SEO pour un blog Next.js", subtitle: "Titres, méta-descriptions, URL canoniques, et le JSON-LD que le paquet émet." },
};
export default (locale = "en") => ({ gradient: "veil", ...text[locale] });
