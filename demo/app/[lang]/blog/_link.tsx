"use client";
// Next 16 + Turbopack: `next/link` imported in a server component is a plain function, not a
// serializable client reference, so it cannot cross a client boundary as a prop (e.g.
// `linkComponent`). Re-exporting it from a "use client" file restores the reference.
export { default as Link } from "next/link";
