// Base-path-aware hero <img>. The hero (`image:` front-matter) is a raw <img src="/assets/...">;
// under a project subpath that src must carry the deployment base path (next/image won't do it when
// images.unoptimized is set), so we prepend NEXT_PUBLIC_BASE_PATH - the same value next.config uses.
import type { ImgHTMLAttributes } from "react";

const BASE = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

/** Renders the hero image, prefixing a root-relative src with the deployment base path. */
export function BaseImg({ src = "", ...props }: ImgHTMLAttributes<HTMLImageElement>) {
    const resolved = typeof src === "string" && src.startsWith("/") ? `${BASE}${src}` : src;
    return <img src={resolved} {...props} />;
}
