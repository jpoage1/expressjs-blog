// src/services/sitemapService.js (refactored)
const path = require("path");
const fs = require("fs").promises;
const { getAllPosts } = require("../utils/postFileUtils");

class SitemapService {
  constructor() {
    this.staticSitemapPath = path.resolve(
      __dirname,
      "../../content/sitemap.json"
    );
    this.postsPath = path.join(__dirname, "../../content/posts");
  }

  async getStaticPages() {
    try {
      const data = await fs.readFile(this.staticSitemapPath, "utf-8");
      return JSON.parse(data);
    } catch (error) {
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
      changefreq: "monthly",
      priority: "0.7",
    }));
  }

  async getCompleteSitemap() {
    const [staticPages, blogUrls] = await Promise.all([
      this.getStaticPages(),
      this.getBlogPostUrls(),
    ]);

    // Add blog posts as a section in the sitemap
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
          changefreq: entry.changefreq || "monthly",
          priority: entry.priority || "0.5",
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
