import { DocsIndex } from "../../../dist/react/index.js";
import { docs } from "./_docs";

/** SEO metadata for the /docs landing page. */
export function generateMetadata() {
    return docs.indexMetadata();
}

/** The /docs landing page: section cards for every tab/group. */
export default function DocsIndexPage() {
    return <DocsIndex docs={docs} />;
}
