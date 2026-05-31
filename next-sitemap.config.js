const path = require("path");
const fs = require("fs");

function getBlogSlugs() {
  const dir = path.join(process.cwd(), "content/blog");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://formlayer.co",
  generateRobotsTxt: true,
  exclude: [
    "/admin",
    "/admin/*",
    "/auth/callback",
    "/dashboard",
    "/dashboard/*",
    "/f/*",
    "/forgot-password",
    "/get-access",
    "/get-access/*",
    "/profile",
    "/reset-password",
    "/sign-in",
    "/sign-up",
  ],
  additionalPaths: async (config) => {
    const slugs = getBlogSlugs();
    return slugs.map((slug) => ({
      loc: `/blog/${slug}`,
      changefreq: "monthly",
      priority: 0.7,
      lastmod: new Date().toISOString(),
    }));
  },
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/auth/callback",
          "/dashboard",
          "/f",
          "/forgot-password",
          "/get-access",
          "/profile",
          "/reset-password",
          "/sign-in",
          "/sign-up",
        ],
      },
    ],
  },
};
