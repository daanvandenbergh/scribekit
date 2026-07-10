// Hero params for getting-started, all languages. Rendered to a JPEG by the scribekit skill; edit
// and re-run `regenerate-heroes`. The gradient is shared across languages so translations match.
const text = {
    en: { title: "Getting started with Claude Code Blog", subtitle: "Wire a Next.js blog together with three small route files and a folder of MDX." },
    fr: { title: "Démarrer avec Claude Code Blog", subtitle: "Assemblez un blog Next.js avec quelques petits fichiers de route et un dossier de MDX." },
};
export default (locale = "en") => ({ gradient: "aurora-glow", byline: { name: "Neil Kakkar", role: "", avatar: { src: new URL("../../public/assets/blog/authors/neil-kakkar.svg", import.meta.url).href } }, ...text[locale] });
