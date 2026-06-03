// constants/sitemapConstants.js
const path = require("path");
const { meta } = require("#config");
const STATIC_SITEMAP_PATH = path.join(meta.content, "config", "sitemap.json");
const POSTS_PATH = path.join(meta.content, "posts");
const PAGES_PATH = path.join(meta.content, "pages");

const DEFAULT_CHANGEFREQ = "monthly";
const DEFAULT_PRIORITY = "0.5";
const BLOG_POST_CHANGEFREQ = "monthly";
const BLOG_POST_PRIORITY = "0.7";

module.exports = {
  STATIC_SITEMAP_PATH,
  PAGES_PATH,
  POSTS_PATH,
  DEFAULT_CHANGEFREQ,
  DEFAULT_PRIORITY,
  BLOG_POST_CHANGEFREQ,
  BLOG_POST_PRIORITY,
};
