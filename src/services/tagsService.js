const fs = require("fs").promises;
const path = require("path");
const matter = require("gray-matter");
const { glob } = require("glob");
const createExcerpt = require("#utils/createExcerpt.js");
const { logger } = require("#logging");
const hash = require("#utils/hash.js");
const sitemapService = require("#services/sitemapService.js");

const CONTENT_ROOT = path.resolve(__dirname, "../../content");
const pattern = `${CONTENT_ROOT}/**/*.md`;

/**
 * Escapes special characters and handles flexible hyphen/space matching
 * @param {string} tag - The raw tag (e.g., "c++")
 * @returns {RegExp}
 */
const buildTagRegex = (tag) => {
  // 1. Escape all special regex characters (.*+?^${}()|[\]\)
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // 2. Apply your existing logic to allow flexible hyphens/spaces
  const flexible = escaped.replace(/[-\s]/g, "[-\\s]");

  return new RegExp(`^${flexible}$`, "i");
};

// async function getPostsByTag(tag) {
//   const allUrls = await sitemapService.getAllUrls();
//   const files = await glob(pattern);
//   const tagRegex = buildTagRegex(tag);

//   const matchedPosts = [];

//   for (const filePath of files) {
//     try {
//       const raw = await fs.readFile(filePath, "utf-8");
//       const { data: frontmatter, content } = matter(raw);
//       const fileHash = hash(frontmatter);

//       if (frontmatter.published !== true) continue;
//       if (!Array.isArray(frontmatter.tags)) continue;
//       if (!frontmatter.tags.some((t) => tagRegex.test(t))) continue;

//       const urlMatches = allUrls.find((url) => url.id == fileHash);
//       matchedPosts.push({
//         title: frontmatter.title || "Untitled",
//         loc: urlMatches.loc,
//         date: frontmatter.date || null,
//         excerpt: createExcerpt(content, 200),
//       });
//     } catch (e) {
//       // Prevent the entire route from going down due to one bad file
//       logger.error("File path", filePath, e.stack);
//     }
//   }

//   return matchedPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
// }
async function getPostsByTag(tag) {
  const allUrls = await sitemapService.getAllUrls();
  const files = await glob(pattern);
  const tagRegex = buildTagRegex(tag);

  const matchedPosts = [];

  for (const filePath of files) {
    try {
      const raw = await fs.readFile(filePath, "utf-8");
      const { data: frontmatter, content } = matter(raw);

      if (frontmatter.published !== true) continue;
      if (!Array.isArray(frontmatter.tags)) continue;
      if (!frontmatter.tags.some((t) => tagRegex.test(t))) continue;

      const fileHash = hash(frontmatter);

      // Look for the URL by hash
      const urlMatches = allUrls.find((url) => url.id == fileHash);

      // FALLBACK: If hash lookup fails, construct a temporary loc from slug
      // This prevents the 404 if the sitemap hasn't refreshed the hash
      const loc = urlMatches
        ? urlMatches.loc
        : `/${frontmatter.slug || path.basename(filePath, ".md")}`;

      matchedPosts.push({
        title: frontmatter.title || "Untitled",
        loc: loc,
        date: frontmatter.date || null,
        excerpt: createExcerpt(content, 200),
      });
    } catch (e) {
      logger.error(`Error processing ${filePath}: ${e.message}`);
    }
  }

  return matchedPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
}
module.exports = {
  getPostsByTag,
  buildTagRegex,
};
