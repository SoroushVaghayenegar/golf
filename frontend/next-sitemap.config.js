/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://t-times.golf',
  generateRobotsTxt: false, // We already have a custom robots.txt
  generateIndexSitemap: false,
  exclude: ['/api/*', '/admin/*'],
  robotsTxtOptions: {
    additionalSitemaps: [
      'https://t-times.golf/sitemap.xml',
    ],
  },
  changefreq: 'daily',
  priority: 0.7,
} 