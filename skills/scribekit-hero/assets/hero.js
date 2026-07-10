/**
 * scribekit-hero :: hero component (project-agnostic)
 * ============================================
 * The single, reusable hero design: a 1200x630 blog hero - white text on a full-bleed gradient,
 * with a badge + eyebrow, an auto-fit H1, a subtitle, and an OPTIONAL byline (author avatar + name
 * + role). This file carries STRUCTURE + base styles only; a PROJECT supplies its brand (font,
 * badge, gradients, default byline) through `blog/hero.settings.js`, and each post supplies its text
 * through `blog/<slug>/hero.js`. The skill wires the three together in `hero.host.html` and
 * screenshots the result with headless Chrome (see the /scribekit-hero skill).
 *
 * Nothing is copied per project - update THIS file and re-run `regenerate-heroes` and every hero
 * picks up the change. The design is deterministic HTML/CSS; there is no AI image generation.
 *
 * Exports:
 *   - renderHero(opts, host?)          - render ONE hero for capture.
 *   - renderGallery(gradients, sample) - render one hero per gradient, for tuning the palette.
 */

/**
 * The base stylesheet shared by every hero. Holds the 1200x630 stage, the content layout, the
 * badge/eyebrow/title/subtitle/byline typography, and the sheen overlay. Brand-specific values
 * (the font family, the badge accent colour, and each gradient's background) are applied at
 * render time via CSS custom properties and inline styles, never here.
 */
const BASE_CSS = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { background: #0e0e11; }
    body { display: flex; flex-direction: column; align-items: flex-start; font-family: var(--font); }

    .stage {
        position: relative; width: 1200px; height: 630px; overflow: hidden;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22);
        font-family: var(--font); isolation: isolate;
    }
    .stage .sheen {
        position: absolute; inset: -20% -10%; transform: skewY(-8deg); pointer-events: none;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0) 34%);
    }

    .content { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center; padding: 0 80px; }
    .eyebrow { display: flex; align-items: center; gap: 13px; margin-bottom: 26px; }
    .badge {
        width: 42px; height: 42px; border-radius: 11px; background: #fff; flex: none;
        display: flex; align-items: center; justify-content: center; overflow: hidden;
        color: rgb(var(--accent)); font-weight: 700; font-size: 22px;
    }
    .badge svg { height: 24px; width: auto; display: block; }
    .badge img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .eyebrow-text { color: rgba(255, 255, 255, 0.9); font-size: 16px; letter-spacing: 0.2em; font-weight: 600; text-transform: uppercase; }
    .title { color: #fff; font-size: 72px; line-height: 1.03; font-weight: 600; letter-spacing: -0.025em; max-width: 880px; }
    .subtitle { margin-top: 22px; color: rgba(255, 255, 255, 0.86); font-size: 22px; line-height: 1.45; font-weight: 400; max-width: 640px; }
    .byline { display: flex; align-items: center; gap: 13px; margin-top: 38px; }
    .avatar {
        width: 46px; height: 46px; border-radius: 50%; background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.4); flex: none; display: flex;
        align-items: center; justify-content: center; overflow: hidden;
    }
    .avatar svg { height: 26px; width: auto; }
    .avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .byline-text { display: flex; flex-direction: column; gap: 1px; }
    .byline-name { color: #fff; font-size: 19px; font-weight: 600; }
    .byline-role { color: rgba(255, 255, 255, 0.72); font-size: 15px; }
`;

/**
 * Injects {@link BASE_CSS} into the document head exactly once, keyed by a fixed id so repeat
 * renders (or a gallery of stages) never duplicate the stylesheet.
 *
 * @returns {void}
 */
function ensureBaseStyles() {
    if (document.getElementById("scribekit-hero-css")) return;
    const style = document.createElement("style");
    style.id = "scribekit-hero-css";
    style.textContent = BASE_CSS;
    document.head.appendChild(style);
}

/**
 * Applies the brand's font and badge accent to the document root as CSS custom properties, and
 * loads the brand webfont stylesheet once.
 *
 * @param font {object} The brand webfont. Optional; a missing family falls back to a system stack.
 * @param font.family {string} The CSS `font-family` name to apply (e.g. `"Space Grotesk"`).
 * @param font.url {string} The stylesheet URL that serves the family (e.g. a Google Fonts link), loaded once.
 * @param accent {string} An `R, G, B` triplet for the badge glyph colour (inline-SVG `currentColor`).
 *     Defaults to the design's violet when omitted.
 * @returns {void}
 */
function applyBrand(font, accent) {
    const family = font && font.family ? `"${font.family}", system-ui, -apple-system, sans-serif` : "system-ui, -apple-system, sans-serif";
    document.documentElement.style.setProperty("--font", family);
    document.documentElement.style.setProperty("--accent", accent || "107, 75, 214");
    if (font && font.url && !document.querySelector(`link[href="${font.url}"]`)) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = font.url;
        document.head.appendChild(link);
    }
}

/**
 * Fills a badge/avatar container with a mark. Accepts either an inline SVG (or glyph) string,
 * injected as markup, or a `{ src }` image reference, appended as an `<img>` so a project can point
 * at a logo or author-avatar file (e.g. `public/logo/logo-rounded.png`) instead of hand-inlined SVG.
 *
 * @param container {HTMLElement} The `.badge` or `.avatar` element to fill.
 * @param mark {string|object} An inline SVG/glyph string, or an object with an image `src`. Falsy renders nothing.
 * @param mark.src {string} URL of an image to append as an `<img>` (when `mark` is an object).
 * @returns {void}
 */
function setBadge(container, mark) {
    if (!mark) return;
    if (typeof mark === "string") {
        container.innerHTML = mark;
        return;
    }
    if (mark.src) {
        const img = document.createElement("img");
        img.src = mark.src;
        img.alt = "";
        container.appendChild(img);
    }
}

/**
 * Builds one 1200x630 stage element from a resolved content object. Text is set via `textContent`
 * (HTML-safe); the badge and byline avatar are the one place raw markup is allowed (for inline SVG).
 * The byline block is omitted entirely when no byline name or avatar is supplied, so a hero without
 * an author simply renders without a byline.
 *
 * @param c {object} The resolved hero content. Any field may be omitted.
 * @param c.gradient {object} The stage background.
 * @param c.gradient.css {string} A CSS `background` value applied to the stage.
 * @param c.badge {string|object} Brand mark for the eyebrow badge - inline SVG/glyph string or `{ src }`
 *     image. Also the fallback byline avatar when `c.byline.avatar` is absent.
 * @param c.eyebrow {string} Uppercase brand/eyebrow text shown above the title.
 * @param c.title {string} The hero headline (auto-fitted later by {@link fitTitle}).
 * @param c.subtitle {string} The supporting line under the title.
 * @param c.byline {object} Author byline. Omit it (or leave both name and avatar empty) to hide the byline.
 * @param c.byline.name {string} Author display name shown next to the avatar.
 * @param c.byline.role {string} Author role/title shown under the name.
 * @param c.byline.avatar {string|object} Author avatar - inline SVG/glyph string or `{ src }` image.
 *     Falls back to `c.badge` when absent.
 * @returns {HTMLElement} The `.stage` element, not yet attached to the document.
 */
function makeStage(c) {
    const el = document.createElement("div");
    el.className = "stage";
    if (c.gradient && c.gradient.css) el.style.background = c.gradient.css;
    const byline = c.byline || {};
    const showByline = !!(byline.name || byline.avatar);
    el.innerHTML =
        '<div class="sheen"></div>' +
        '<div class="content">' +
            '<div class="eyebrow"><span class="badge"></span><span class="eyebrow-text"></span></div>' +
            '<h1 class="title"></h1>' +
            '<p class="subtitle"></p>' +
            (showByline
                ? '<div class="byline"><span class="avatar"></span>' +
                      '<span class="byline-text"><span class="byline-name"></span><span class="byline-role"></span></span>' +
                  '</div>'
                : '') +
        '</div>';
    setBadge(el.querySelector(".badge"), c.badge);
    el.querySelector(".eyebrow-text").textContent = c.eyebrow || "";
    el.querySelector(".title").textContent = c.title || "";
    el.querySelector(".subtitle").textContent = c.subtitle || "";
    if (showByline) {
        setBadge(el.querySelector(".avatar"), byline.avatar || c.badge);
        el.querySelector(".byline-name").textContent = byline.name || "";
        el.querySelector(".byline-role").textContent = byline.role || "";
    }
    return el;
}

/**
 * Shrinks a stage's title from 72px down to a 38px floor (in 2px steps) until it fits within a
 * 300px height, so long headlines never overflow the hero.
 *
 * @param el {HTMLElement} A `.stage` element whose `.title` should be fitted.
 * @returns {void}
 */
function fitTitle(el) {
    const t = el.querySelector(".title");
    let size = 72;
    const min = 38, maxHeight = 300;
    t.style.fontSize = size + "px";
    while (size > min && t.scrollHeight > maxHeight) {
        size -= 2;
        t.style.fontSize = size + "px";
    }
}

/**
 * Waits for the webfont and every badge/avatar image to finish loading, fits each stage's title,
 * then flips `document.documentElement.dataset.ready = "1"` across two animation frames. The
 * headless-Chrome capture step waits for this flag, so the screenshot never fires before the
 * font has swapped, a logo/avatar image has decoded, or a long title has been auto-fitted.
 *
 * @param stages {HTMLElement[]} The stage elements to settle before signalling readiness.
 * @returns {void}
 */
function signalReady(stages) {
    const images = [];
    stages.forEach((s) => s.querySelectorAll("img").forEach((img) => images.push(img)));
    const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    const imagesReady = images.map((img) => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()));
    Promise.all([fontsReady, ...imagesReady]).then(() => {
        stages.forEach(fitTitle);
        requestAnimationFrame(() => requestAnimationFrame(() => {
            document.documentElement.dataset.ready = "1";
        }));
    });
}

/**
 * Renders a single hero for capture and appends it to the host.
 *
 * @param opts {object} The resolved hero content, typically `{ ...brand, ...postParams, gradient }`.
 *     Missing fields degrade gracefully.
 * @param opts.font {object} Brand webfont (see {@link applyBrand}).
 * @param opts.font.family {string} The CSS `font-family` name.
 * @param opts.font.url {string} The webfont stylesheet URL.
 * @param opts.accent {string} An `R, G, B` triplet for the inline-SVG badge glyph colour.
 * @param opts.badge {string|object} Brand mark - inline SVG/glyph string or `{ src }` image.
 * @param opts.eyebrow {string} Uppercase brand/eyebrow text shown above the title.
 * @param opts.title {string} The hero headline.
 * @param opts.subtitle {string} The supporting line under the title.
 * @param opts.byline {object} Author byline. Omit it to render the hero without a byline.
 * @param opts.byline.name {string} Author display name.
 * @param opts.byline.role {string} Author role/title under the name.
 * @param opts.byline.avatar {string|object} Author avatar - inline SVG/glyph string or `{ src }` image.
 *     Falls back to `opts.badge` when absent.
 * @param opts.gradient {object} The stage background.
 * @param opts.gradient.name {string} The gradient's name (informational).
 * @param opts.gradient.css {string} The CSS `background` value applied to the stage.
 * @param host {HTMLElement} The element to append the stage to. Defaults to `document.body` so the
 *     stage sits at the page origin, which is exactly what the 1200x630 capture window expects.
 * @returns {HTMLElement} The rendered `.stage` element.
 */
export function renderHero(opts, host = document.body) {
    ensureBaseStyles();
    applyBrand(opts.font, opts.accent);
    const stage = makeStage(opts);
    host.appendChild(stage);
    signalReady([stage]);
    return stage;
}

/**
 * Renders one hero per gradient (each with the same sample content), stacked vertically, for
 * reviewing and tuning a project's gradient palette. The capture window height is
 * `gradients.length * 630`.
 *
 * @param gradients {object[]} The gradient list from `hero.settings.js`.
 * @param gradients[].name {string} The gradient's name (used by a post to pick it).
 * @param gradients[].css {string} The gradient's CSS `background` value.
 * @param sample {object} The shared brand + sample content shown on every stage.
 * @param sample.font {object} Brand webfont (see {@link applyBrand}).
 * @param sample.font.family {string} The CSS `font-family` name.
 * @param sample.font.url {string} The webfont stylesheet URL.
 * @param sample.accent {string} An `R, G, B` triplet for the inline-SVG badge glyph colour.
 * @param sample.badge {string|object} Brand mark - inline SVG/glyph string or `{ src }` image.
 * @param sample.eyebrow {string} Uppercase brand/eyebrow text.
 * @param sample.title {string} The sample headline.
 * @param sample.subtitle {string} The sample subtitle.
 * @param sample.byline {object} The sample byline. Omit it to preview heroes without a byline.
 * @param sample.byline.name {string} Author display name.
 * @param sample.byline.role {string} Author role/title.
 * @param sample.byline.avatar {string|object} Author avatar - inline SVG/glyph string or `{ src }` image.
 * @param host {HTMLElement} The element to append the stages to. Defaults to `document.body`.
 * @returns {HTMLElement[]} The rendered `.stage` elements, in gradient order.
 */
export function renderGallery(gradients, sample, host = document.body) {
    ensureBaseStyles();
    applyBrand(sample.font, sample.accent);
    const stages = gradients.map((gradient) => {
        const stage = makeStage({ ...sample, gradient });
        host.appendChild(stage);
        return stage;
    });
    signalReady(stages);
    return stages;
}
