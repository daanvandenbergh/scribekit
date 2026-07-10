// Hero params for writing-with-mdx, all languages. See getting-started/hero.js for the pattern.
const text = {
    en: { title: "Writing posts with MDX", subtitle: "Front-matter, headings, and how the slug is derived from the file name." },
    fr: { title: "Écrire des articles avec MDX", subtitle: "Frontmatter, titres, et comment le slug est dérivé du nom de fichier." },
};
export default (locale = "en") => ({ gradient: "diagonal-ribbon", byline: { name: "Neil Kakkar", role: "", avatar: { src: new URL("../../public/assets/blog/authors/neil-kakkar.svg", import.meta.url).href } }, ...text[locale] });
