// The single configured Docs instance for scribekit's own docs site. Renders the docs/content corpus.
// contentDir is relative to the build cwd (the docs/ dir).
import { Docs } from "../../dist/index.js";

export const docs = new Docs({
    contentDir: "./content", // resolved against the build cwd (docs/) -> docs/content
    // This site is nothing but docs, so the section is mounted at the root: pages are /<slug> and
    // the index is /, instead of burying everything under a redundant /docs segment.
    basePath: "",
    siteUrl: "https://daanvandenbergh.github.io/scribekit",
    brandName: "Scribekit",
    // The distinct tabs and groups the corpus uses, in display order (required for a stable sidebar).
    tabs: ["Documentation", "Skills", "Tutorials"],
    groups: ["Get started", "Guides", "Reference", "Skills", "Tutorials"],
});
