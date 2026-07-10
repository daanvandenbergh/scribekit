// Hero params for the-blog-skill, all languages. See getting-started/hero.js for the pattern.
const text = {
    en: { title: "Writing posts with the Claude Code skill", subtitle: "Let the scribekit skill research, draft, and assign categories to new posts." },
    fr: { title: "Écrire des articles avec le skill Claude Code", subtitle: "Laissez le skill scribekit rechercher, rédiger et catégoriser les nouveaux articles." },
};
export default (locale = "en") => ({ gradient: "radial-mesh", byline: { name: "Maya Lindholm", role: "", avatar: { src: new URL("../../public/assets/blog/authors/maya-lindholm.svg", import.meta.url).href } }, ...text[locale] });
