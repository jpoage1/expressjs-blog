// src/services/sitemapService.js
const path = require("path");
const fs = require("fs").promises;
const { getAllPosts } = require("../utils/postFileUtils");
const {
  STATIC_SITEMAP_PATH,
  POSTS_PATH,
  DEFAULT_CHANGEFREQ,
  DEFAULT_PRIORITY,
  BLOG_POST_CHANGEFREQ,
  BLOG_POST_PRIORITY,
} = require("../constants/sitemapConstants");

class SitemapService {
  constructor() {
    this.staticSitemapPath = path.resolve(__dirname, STATIC_SITEMAP_PATH);
    this.postsPath = path.join(__dirname, POSTS_PATH);
  }

  async getStaticPages() {
    try {
      const data = await fs.readFile(this.staticSitemapPath, "utf-8");
      return JSON.parse(data);
    } catch {
      console.warn("Could not load static sitemap.json, using empty array");
      return [];
    }
  }

  async getBlogPostUrls() {
    const allPosts = await getAllPosts(this.postsPath);

    return allPosts.map((post) => ({
      loc: `/blog/${post.year}/${post.month}/${post.slug}`,
      lastmod: post.date
        ? new Date(post.date).toISOString().split("T")[0]
        : null,
      changefreq: BLOG_POST_CHANGEFREQ,
      priority: BLOG_POST_PRIORITY,
    }));
  }

  async getCompleteSitemap() {
    const [staticPages, blogUrls] = await Promise.all([
      this.getStaticPages(),
      this.getBlogPostUrls(),
    ]);

    const blogSection = {
      title: "Blog Posts",
      children: blogUrls.map((url) => ({
        loc: url.loc,
        title: url.loc.split("/").pop().replace(/-/g, " "),
        lastmod: url.lastmod,
        changefreq: url.changefreq,
        priority: url.priority,
      })),
    };

    return [...staticPages, blogSection];
  }

  async getAllUrls() {
    const sitemap = await this.getCompleteSitemap();
    return this.flatten(sitemap);
  }

  flatten(entries, out = []) {
    for (const entry of entries) {
      if (entry.loc) {
        out.push({
          loc: entry.loc,
          lastmod: entry.lastmod,
          changefreq: entry.changefreq || DEFAULT_CHANGEFREQ,
          priority: entry.priority || DEFAULT_PRIORITY,
        });
      }
      if (Array.isArray(entry.children)) {
        this.flatten(entry.children, out);
      }
    }
    return out;
  }
}

module.exports = new SitemapService();
