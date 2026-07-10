// Hero params for reading-time-and-categories, all languages. See getting-started/hero.js.
const text = {
    en: { title: "Reading time and categories on cards", subtitle: "An estimated read time and category badges on every post in the overview." },
    fr: { title: "Temps de lecture et catégories sur les cartes", subtitle: "Un temps de lecture estimé et des badges de catégorie sur chaque article." },
};
export default (locale = "en") => ({ gradient: "soft-sweep", byline: { name: "Maya Lindholm", role: "", avatar: { src: new URL("../../public/assets/blog/authors/maya-lindholm.svg", import.meta.url).href } }, ...text[locale] });
