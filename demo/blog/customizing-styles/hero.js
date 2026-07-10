// Hero params for customizing-styles, all languages. See getting-started/hero.js for the pattern.
const text = {
    en: { title: "Customizing the blog styles", subtitle: "Override the scribekit- CSS custom properties to match your brand in a few lines." },
    fr: { title: "Personnaliser les styles du blog", subtitle: "Redéfinissez les propriétés CSS scribekit- pour l'adapter à votre marque en quelques lignes." },
};
export default (locale = "en") => ({ gradient: "radial-mesh", byline: { name: "Maya Lindholm", role: "", avatar: { src: new URL("../../public/assets/blog/authors/maya-lindholm.svg", import.meta.url).href } }, ...text[locale] });
