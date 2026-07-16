// The single configured Docs instance for scribekit's own docs site. Renders the site/docs corpus.
// contentDir is relative to the build cwd (the site/ dir).
import { Docs } from "../../../dist/index.js";

export const docs = new Docs({
    contentDir: "./docs", // resolved against the build cwd (site/) -> site/docs
    siteUrl: "https://daanvandenbergh.github.io/scribekit",
    brandName: "Scribekit",
    // The distinct tabs and groups the corpus uses, in display order (required for a stable sidebar).
    tabs: ["Documentation", "Skills", "Tutorials"],
    groups: ["Get started", "Guides", "Reference", "Skills", "Tutorials"],
});
