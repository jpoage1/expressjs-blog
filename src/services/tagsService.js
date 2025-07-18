const fs = require("fs").promises;
const path = require("path");
const matter = require("gray-matter");
const glob = require("fast-glob");
const createExcerpt = require("../utils/createExcerpt");

const CONTENT_ROOT = path.resolve(__dirname, "../../content");
const pattern = `${CONTENT_ROOT}/**/*.md`;

function slugifyTag(tag) {
  return tag.toLowerCase().replace(/\s+/g, "-");
}

async function getAllTags() {
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
        const current = tagMap.get(slug) || { name: tag, slug, count: 0 };
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
async function getPostsByTag(tag) {
  const files = await glob(pattern);
  const tagRegex = new RegExp(`^${tag.replace(/[-\s]/g, "[-\\s]")}$`, "i");

  const matchedPosts = [];

  for (const filePath of files) {
    const raw = await fs.readFile(filePath, "utf-8");
    const { data: frontmatter, content } = matter(raw);

    if (frontmatter.published !== true) continue;
    if (!Array.isArray(frontmatter.tags)) continue;
    if (!frontmatter.tags.some((t) => tagRegex.test(t))) continue;

    matchedPosts.push({
      title: frontmatter.title || "Untitled",
      slug: frontmatter.slug || path.basename(filePath, ".md"),
      date: frontmatter.date || null,
      excerpt: createExcerpt(content, 200),
    });
  }

  return matchedPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
}
module.exports = {
  getAllTags,
  getPostsByTag,
};
