// app/docs/_docs.ts - the single configured Docs instance the routes read from.
import { Docs } from "@daanvandenbergh/scribekit";

export const docs = new Docs({
    contentDir: "./docs", // folder of <slug>/en.mdx pages, resolved against the app root (process.cwd())
    siteUrl: "https://<your-pages-origin>", // the deploy step sets this to your real Pages origin
    brandName: "<BRAND>",
    // REQUIRED: list every tab and group so the sidebar order is stable. Without these, tabs/groups
    // tie and fall back to filesystem read order. Fill from the corpus front-matter (`tab` / `group`).
    tabs: [/* e.g. "Documentation", "Skills", "Tutorials" */],
    groups: [/* e.g. "Get started", "Guides", "Reference" */],
});
