/**
 * scribekit :: hero settings for the Claude Code Blog demo.
 * Brand + gradients for every hero image. Edit freely, then run the /scribekit-hero `regenerate-heroes`
 * mode to re-render every hero. See the /scribekit-hero skill (skills/scribekit-hero/).
 */

/** Brand palette (R, G, B triplets), built around the site accent #6d5df6. */
const c = {
    pink: "232, 196, 255",
    lilac: "196, 186, 255",
    peach: "255, 214, 196",
    blue: "158, 196, 255",
    violet: "109, 93, 246",
    violetMid: "82, 66, 206",
    violetDeep: "52, 40, 150",
};

/** Wraps a palette triplet as an opaque `rgb(...)` colour. */
const rgb = (t) => `rgb(${t})`;
/** Wraps a palette triplet as a same-hue, zero-alpha `rgba(..., 0)` fade (banding-free). */
const fade = (t) => `rgba(${t}, 0)`;

/** Brand identity baked into every demo hero. */
export const brand = {
    font: { family: "Space Grotesk", url: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" },
    badge: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6z"/></svg>`,
    accent: "109, 93, 246",
    eyebrow: "CLAUDE CODE BLOG",
    byline: { name: "Claude Code Blog", role: "" },
};

/** The gradient options, built from the palette above. A post picks one by `name`. */
export const gradients = [
    {
        name: "radial-mesh",
        css: [
            `radial-gradient(120% 120% at 12% 8%, ${rgb(c.pink)} 0%, ${fade(c.pink)} 46%)`,
            `radial-gradient(90% 90% at 88% -6%, ${rgb(c.lilac)} 0%, ${fade(c.lilac)} 42%)`,
            `radial-gradient(120% 120% at 96% 96%, ${rgb(c.peach)} 0%, ${fade(c.peach)} 46%)`,
            `radial-gradient(120% 120% at 4% 104%, ${rgb(c.blue)} 0%, ${fade(c.blue)} 48%)`,
            `linear-gradient(135deg, ${rgb(c.violet)} 0%, ${rgb(c.violetMid)} 60%, ${rgb(c.violetDeep)} 100%)`,
        ].join(", "),
    },
    {
        name: "diagonal-ribbon",
        css: `linear-gradient(118deg, ${rgb(c.violetDeep)} 0%, ${rgb(c.violetMid)} 14%, ${rgb(c.violet)} 28%, ${rgb(c.lilac)} 46%, ${rgb(c.pink)} 64%, ${rgb(c.peach)} 82%, ${rgb(c.blue)} 100%)`,
    },
    {
        name: "aurora-glow",
        css: [
            `radial-gradient(120% 100% at 50% -18%, ${rgb(c.lilac)} 0%, ${fade(c.lilac)} 55%)`,
            `radial-gradient(100% 90% at 92% 112%, ${rgb(c.pink)} 0%, ${fade(c.pink)} 52%)`,
            `radial-gradient(90% 90% at 8% 104%, ${rgb(c.blue)} 0%, ${fade(c.blue)} 48%)`,
            `linear-gradient(160deg, ${rgb(c.violet)} 0%, ${rgb(c.violetMid)} 55%, ${rgb(c.violetDeep)} 100%)`,
        ].join(", "),
    },
    {
        name: "soft-sweep",
        css: `linear-gradient(140deg, ${rgb(c.violetDeep)} 0%, ${rgb(c.violet)} 30%, ${rgb(c.lilac)} 56%, ${rgb(c.pink)} 80%, ${rgb(c.peach)} 100%)`,
    },
    {
        name: "horizon-glow",
        css: [
            `radial-gradient(130% 90% at 100% 100%, ${rgb(c.peach)} 0%, ${fade(c.peach)} 40%)`,
            `radial-gradient(120% 100% at 100% 100%, ${rgb(c.pink)} 0%, ${fade(c.pink)} 55%)`,
            `radial-gradient(110% 90% at 0% 0%, ${rgb(c.blue)} 0%, ${fade(c.blue)} 46%)`,
            `linear-gradient(120deg, ${rgb(c.violetMid)} 0%, ${rgb(c.violet)} 45%, ${rgb(c.lilac)} 100%)`,
        ].join(", "),
    },
    {
        name: "veil",
        css: [
            `radial-gradient(120% 100% at 8% 10%, ${rgb(c.blue)} 0%, ${fade(c.blue)} 44%)`,
            `radial-gradient(120% 110% at 100% 30%, ${rgb(c.pink)} 0%, ${fade(c.pink)} 50%)`,
            `radial-gradient(110% 100% at 55% 115%, ${rgb(c.peach)} 0%, ${fade(c.peach)} 48%)`,
            `linear-gradient(125deg, ${rgb(c.violet)} 0%, ${rgb(c.violetMid)} 55%, ${rgb(c.violetDeep)} 100%)`,
        ].join(", "),
    },
];
