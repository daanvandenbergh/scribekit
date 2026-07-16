import { redirect } from "next/navigation";

/** The site root sends visitors to the docs (the base path is applied by the router). */
export default function Home() {
    redirect("/docs");
}
