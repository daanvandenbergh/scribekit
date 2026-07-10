// In-repo demo: import from ../dist (no symlink); a real app uses the package name "/react".
import { BlogOverview } from "../../../../dist/react/index.js";
import { Link } from "./_link";
import { blog } from "./_blog";

/** Unknown languages 404 at the router instead of rendering on demand. */
export const dynamicParams = false;

/** Prerender one overview per locale (/en/blog, /fr/blog): every locale is under [lang]. */
export function generateStaticParams() {
    return blog.locales.map((l) => ({ lang: l.code }));
}

/** SEO metadata for a /<lang>/blog index. */
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    return blog.overviewMetadata(lang);
}

/** A blog overview at /<lang>/blog. */
export default async function BlogIndex({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    return <BlogOverview blog={blog} lang={lang} linkComponent={Link} header={<h1>Blog</h1>} pageSize={3} />;
}
