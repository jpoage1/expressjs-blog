const fs = require("fs").promises;
const path = require("path");
const matter = require("gray-matter");
const glob = require("fast-glob");
const createExcerpt = require("../utils/createExcerpt");

const CONTENT_ROOT = path.resolve(__dirname, "../../content");
const pattern = `${CONTENT_ROOT}/**/*.md`;

const buildTagRegex = (tag) =>
  new RegExp(`^${tag.replace(/[-\s]/g, "[-\\s]")}$`, "i");

const hash = require("../utils/hash");
const sitemapService = require("../services/sitemapService");

async function getPostsByTag(tag) {
  const allUrls = await sitemapService.getAllUrls();
  const files = await glob(pattern);
  const tagRegex = buildTagRegex(tag);

  const matchedPosts = [];

  for (const filePath of files) {
    const raw = await fs.readFile(filePath, "utf-8");
    const { data: frontmatter, content } = matter(raw);
    const fileHash = hash(frontmatter);

    if (frontmatter.published !== true) continue;
    if (!Array.isArray(frontmatter.tags)) continue;
    if (!frontmatter.tags.some((t) => tagRegex.test(t))) continue;

    const urlMatches = allUrls.find((url) => url.id == fileHash);
    matchedPosts.push({
      title: frontmatter.title || "Untitled",
      loc: urlMatches.loc,
      date: frontmatter.date || null,
      excerpt: createExcerpt(content, 200),
    });
  }

  return matchedPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
}
module.exports = {
  getPostsByTag,
  buildTagRegex,
};
