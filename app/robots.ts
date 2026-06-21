import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Block the authenticated app and API surfaces. Locale prefix is wildcarded
// so /fr/dashboard, /ar/dashboard, /en/dashboard all match.
const APP_PATHS = [
  "/api/",
  "/auth/",
  "/*/dashboard",
  "/*/dashboard/*",
  "/*/settings",
  "/*/settings/*",
  "/*/products",
  "/*/products/*",
  "/*/agents",
  "/*/agents/*",
  "/*/stock",
  "/*/stock/*",
  "/*/onboarding",
  "/*/onboarding/*",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: APP_PATHS,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
