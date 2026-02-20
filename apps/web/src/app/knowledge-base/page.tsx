import { redirect } from "next/navigation";

/**
 * Legacy /knowledge-base page — permanently redirect to the new SEO-optimized /knowledge hub.
 * Middleware also handles the 301, but this is a safety net for direct renders.
 */
export default function Page() {
  redirect("/knowledge");
}
