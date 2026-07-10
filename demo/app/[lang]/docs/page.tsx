// In-repo demo: import from ../dist (no symlink); a real app uses the package name "/react".
import { DocsIndex } from "../../../../dist/react/index.js";
import { Link } from "../blog/_link";
import { docs } from "./_docs";

/** Unknown languages 404 at the router instead of rendering on demand. */
export const dynamicParams = false;

/** Prerender the docs index per locale (/en/docs served as /docs via proxy.ts, /fr/docs). */
export function generateStaticParams() {
    return docs.locales.map((l) => ({ lang: l.code }));
}

/** SEO metadata for the /<lang>/docs index. */
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    return docs.indexMetadata(lang);
}

/** The docs landing page at /<lang>/docs: a hero + section cards built from the nav tree. */
export default async function DocsIndexPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    return <DocsIndex docs={docs} lang={lang} linkComponent={Link} />;
}
