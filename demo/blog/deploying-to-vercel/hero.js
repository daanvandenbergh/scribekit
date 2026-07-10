// Hero params for deploying-to-vercel, all languages. See getting-started/hero.js for the pattern.
const text = {
    en: { title: "Deploying your blog to Vercel", subtitle: "Push the demo to Vercel and get automatic previews for every post you write." },
    fr: { title: "Déployer votre blog sur Vercel", subtitle: "Poussez la démo sur Vercel et obtenez des aperçus automatiques pour chaque article." },
};
export default (locale = "en") => ({ gradient: "diagonal-ribbon", byline: { name: "Neil Kakkar", role: "", avatar: { src: new URL("../../public/assets/blog/authors/neil-kakkar.svg", import.meta.url).href } }, ...text[locale] });
