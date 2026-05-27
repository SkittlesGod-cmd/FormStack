/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://enhancelabs.ai",
  generateRobotsTxt: true,
  exclude: ["/get-access", "/get-access/*", "/admin", "/admin/*"],
  robotsTxtOptions: {
    policies: [
      { userAgent: "*", allow: "/" },
      { userAgent: "*", disallow: ["/get-access", "/admin"] },
    ],
  },
};
