// Hero params for search-and-pagination, all languages. See getting-started/hero.js for the pattern.
const text = {
    en: { title: "Fuzzy search and infinite scroll", subtitle: "Type to filter posts fuzzily, and scroll to load more without leaving the page." },
    fr: { title: "Recherche floue et défilement infini", subtitle: "Filtrez les articles de façon floue, et faites défiler pour en charger plus." },
};
export default (locale = "en") => ({ gradient: "horizon-glow", byline: { name: "Neil Kakkar", role: "", avatar: { src: new URL("../../public/assets/blog/authors/neil-kakkar.svg", import.meta.url).href } }, ...text[locale] });
