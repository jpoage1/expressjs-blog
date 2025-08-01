// src/services/sitemapService.js
const path = require("path");
const matter = require("gray-matter");
const fs = require("fs").promises;
const { getAllPosts } = require("../utils/postFileUtils");
const hash = require("../utils/hash");
const yaml = require("js-yaml");

const glob = require("fast-glob");
const { qualifySitemapLinks } = require("../utils/qualifyLinks");
const { winstonLogger } = require("../utils/logging");

const CONTENT_ROOT = path.resolve(__dirname, "../../content");
const NAVLINKS_PATH = path.resolve(__dirname, "../../content/navLinks.json");

const pattern = `${CONTENT_ROOT}/**/*.md`;

function slugifyTag(tag) {
  return tag.toLowerCase().replace(/\s+/g, "-");
}

const {
  STATIC_SITEMAP_PATH,
  PAGES_PATH,
  POSTS_PATH,
  DEFAULT_CHANGEFREQ,
  DEFAULT_PRIORITY,
  BLOG_POST_CHANGEFREQ,
  BLOG_POST_PRIORITY,
} = require("../constants/sitemapConstants");

class SitemapService {
  constructor() {
    this.staticSitemapPath = path.resolve(__dirname, STATIC_SITEMAP_PATH);
    this.pagesPath = path.join(__dirname, PAGES_PATH);
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

  async getStaticPages() {
    try {
      const filenames = await fs.readdir(this.pagesPath);
      const pages = [];

      for (const file of filenames) {
        const fullPath = path.join(this.pagesPath, file);
        const stat = await fs.stat(fullPath);
        if (stat.isDirectory()) continue;

        const raw = await fs.readFile(fullPath, "utf8");
        const { data: frontmatter } = matter(raw);

        if (!frontmatter.published) continue;

        pages.push({
          id: hash(frontmatter),
          loc: `/${frontmatter.slug || file.replace(/\.(md|mdx|handlebars)$/, "")}`,
          title: frontmatter.title || "",
          lastmod: frontmatter.updated || frontmatter.date || null,
          changefreq: "monthly",
          priority: 0.7,
        });
      }

      return pages;
    } catch (err) {
      console.warn("Failed to load static pages:", err);
      return [];
    }
  }

  async getAllTags() {
    const tagMap = new Map();
    const files = await glob(pattern);

    for (const file of files) {
      try {
        const raw = await fs.readFile(file, "utf8");
        const { data } = matter(raw);

        if (!data.published || !Array.isArray(data.tags)) continue;

        for (const rawTag of data.tags) {
          const tag = rawTag.trim();
          const slug = slugifyTag(tag);
          const current = tagMap.get(slug) || {
            name: tag,
            loc: `/tags/${slug}`,
            slug,
            count: 0,
          };
          current.count += 1;
          tagMap.set(slug, current);
        }
      } catch (_) {
        continue;
      }
    }

    return Array.from(tagMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  async getBlogPosts() {
    const allPosts = await getAllPosts(this.postsPath);

    return allPosts.map((post) => ({
      id: hash(post.frontmatter),
      loc: `/blog/${post.year}/${post.month}/${post.slug}`,
      lastmod: post.date
        ? new Date(post.date).toISOString().split("T")[0]
        : null,
      changefreq: BLOG_POST_CHANGEFREQ,
      priority: BLOG_POST_PRIORITY,
      tags: post.tags,
    }));
  }

  async getDocsEntries(filePath) {
    const docsDir = path.resolve(__dirname, "../../content/docs");
    const files = await fs.readdir(docsDir);
    const entries = [];

    for (const file of files) {
      if (!file.endsWith(".yaml")) continue;

      const moduleType = file.replace(/\.yaml$/, "");
      const filePath = path.join(docsDir, file);
      const raw = await fs.readFile(filePath, "utf8");
      const parsed = yaml.load(raw);

      // Parent entry: /docs/:moduleType
      const parentEntry = {
        loc: `/docs/${moduleType}`,
        label: moduleType, // Use 'label' to match your JSON structure
        changefreq: "monthly",
        priority: 0.7,
        children: [],
      };

      // For each module inside modules, create child entries
      const modules = parsed || {};
      for (const [moduleKey, moduleData] of Object.entries(modules)) {
        parentEntry.children.push({
          loc: `/docs/${moduleType}/${moduleKey}`,
          label: (moduleData && moduleData.title) || moduleKey, // Use 'label' to match structure
          changefreq: "monthly",
          priority: 0.5,
        });
      }

      entries.push(parentEntry);
      winstonLogger.debug(
        `Added docs entry: ${parentEntry.loc} with ${parentEntry.children.length} children`
      );
    }

    return entries;
  }
  async getNavLinksPages(existingUrls = null) {
    try {
      const raw = await fs.readFile(NAVLINKS_PATH, "utf8");
      const navLinks = JSON.parse(raw);

      // If existingUrls not provided, get them (fallback for backward compatibility)
      let existingSet;
      if (existingUrls) {
        existingSet = new Set(
          existingUrls.map((url) => url.replace(/^https?:\/\/[^\/]+/, ""))
        );
      } else {
        const existing = await this.getAllUrls({ excludeNavLinks: true });
        existingSet = new Set(
          existing.map((e) => e.loc.replace(/^https?:\/\/[^\/]+/, ""))
        );
      }

      const transform = (items) => {
        const result = [];

        for (const item of items) {
          // Skip external links (not starting with "/")
          const isInternal = item.href && item.href.startsWith("/");
          const isMissing = isInternal && !existingSet.has(item.href);

          const node = {};

          // If this item has a missing internal href, add it as a leaf
          if (isMissing) {
            node.loc = item.href;
            node.title = item.label || "";
            node.changefreq = "monthly";
            node.priority = 0.6;
            node.id = hash(item.href);
          }

          // Process submenu if it exists
          if (item.submenu && Array.isArray(item.submenu)) {
            const children = transform(item.submenu);
            if (children.length > 0) {
              // If we have children, we need to include this node in the hierarchy
              if (!node.loc) {
                // This is a parent node with no direct URL but has children
                node.label = item.label || "";
              }
              node.children = children;
            }
          }

          // Only include nodes that either have a loc (missing page) or have children
          if (node.loc || (node.children && node.children.length > 0)) {
            result.push(node);
          }
        }

        return result;
      };

      const extraPages = transform(navLinks);

      winstonLogger.debug(
        `Generated ${extraPages.length} extra nav link entries`
      );
      return extraPages;
    } catch (err) {
      winstonLogger.warn("Failed to read navLinks.json:", err);
      return [];
    }
  }

  injectPlaceholder(tree, key, items) {
    for (const node of tree) {
      if (Array.isArray(node.children)) {
        const index = node.children.findIndex(
          (child) => child.loc === `#inject:${key}`
        );

        if (index !== -1) {
          winstonLogger.debug(
            `Found placeholder #inject:${key}, injecting ${items.length} items`
          );
          // Replace the placeholder with the actual items
          node.children.splice(index, 1, ...items);
          return true;
        }

        if (this.injectPlaceholder(node.children, key, items)) {
          return true;
        }
      }
    }
    return false;
  }

  async _loadStaticLayout() {
    try {
      const data = await fs.readFile(this.staticSitemapPath, "utf-8");
      return JSON.parse(data);
    } catch {
      console.warn("Could not load static sitemap.json, using empty array");
      return [];
    }
  }
  async getCompleteSitemap({ excludeNavLinks = false } = {}) {
    const [staticPagesJsonTree, staticPages, blogPosts, tags] =
      await Promise.all([
        this._loadStaticLayout(),
        this.getStaticPages(),
        this.getBlogPosts(),
        this.getAllTags(),
      ]);

    const pageItems = staticPages.map((page) => ({
      id: page.id,
      loc: page.loc,
      title: page.title,
      lastmod: page.lastmod,
      changefreq: page.changefreq,
      priority: page.priority,
      tags: page.tags,
    }));

    const postItems = blogPosts.map((post) => ({
      id: post.id,
      loc: post.loc,
      title: post.loc.split("/").pop().replace(/-/g, " "),
      lastmod: post.lastmod,
      changefreq: post.changefreq,
      priority: post.priority,
      tags: post.tags,
    }));

    const tagItems = tags.map((tag) => ({
      title: tag.name,
      loc: tag.loc,
      slug: tag.slug,
      count: tag.count,
    }));

    const docsEntries = await this.getDocsEntries();

    // Inject all the main content first
    this.injectPlaceholder(staticPagesJsonTree, "pages", pageItems);
    this.injectPlaceholder(staticPagesJsonTree, "blog-posts", postItems);
    this.injectPlaceholder(staticPagesJsonTree, "tags", tagItems);
    this.injectPlaceholder(staticPagesJsonTree, "docs", docsEntries);

    // Now get all existing URLs from the current state
    let extraNavPages = [];
    if (!excludeNavLinks) {
      const currentUrls = this.flatten(staticPagesJsonTree).map(
        (item) => item.loc
      );
      extraNavPages = await this.getNavLinksPages(currentUrls);
    }

    // Inject the extra nav pages last
    this.injectPlaceholder(staticPagesJsonTree, "extra-pages", extraNavPages);

    return qualifySitemapLinks(staticPagesJsonTree);
  }

  async getAllUrls({ excludeNavLinks = false } = {}) {
    const sitemap = await this.getCompleteSitemap({ excludeNavLinks });
    return this.flatten(sitemap);
  }

  flatten(entries, out = []) {
    for (const entry of entries) {
      if (entry.loc) {
        out.push({
          id: entry.id,
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
