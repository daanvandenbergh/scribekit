import Link from "next/link";
import { DemoNav } from "./_nav";

/**
 * Home page. Not part of the package - just a landing spot that links into the blog and docs.
 */
export default function HomePage() {
    return (
        <>
            <DemoNav />
            <section className="demo-shell">
            <h1>Claude Code Blog - demo</h1>
            <p>
                A minimal Next.js App Router app wired to <code>@daanvandenbergh/scribekit</code>. The
                entire blog is one <code>app/[lang]/blog/…</code> route tree plus one MDX folder per
                post in <code>demo/blog/&lt;slug&gt;/</code> (<code>en.mdx</code> for English,{" "}
                <code>fr.mdx</code> for French). The default language stays at the clean{" "}
                <code>/blog</code> via <code>proxy.ts</code>.
            </p>
            <p>
                <Link href="/blog">Read the blog →</Link> · <Link href="/docs">Browse the docs →</Link>
            </p>
            </section>
        </>
    );
}
