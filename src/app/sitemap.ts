import type { MetadataRoute } from "next";
import { getStateSlugs } from "@/lib/states";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://anglerpermit.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/how-it-works",
    "/states",
    "/faq",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/refund",
    "/disclaimer",
  ].map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
  }));

  // State pages discovered dynamically from src/data/states/<slug>.ts
  const stateRoutes = getStateSlugs().map((slug) => ({
    url: `${BASE_URL}/${slug}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...stateRoutes];
}
