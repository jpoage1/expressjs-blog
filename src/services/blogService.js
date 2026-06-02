// src/services/blogService.js
const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const crypto = require("crypto");
const matter = require("gray-matter");
const { marked } = require("marked");
const { getAllPosts } = require("#utils/postFileUtils.js");
const { HttpError } = require("#errors");

function createBlogService({ contentPath, node_env }) {
  const postsDir = path.join(contentPath, "posts");

  async function getPost(year, month, name) {
    const mdPath = path.join(postsDir, year, month, `${name}.md`);

    const stat = fsSync.statSync(mdPath);
    const fileContent = await fs.readFile(mdPath, "utf8");

    const hash = crypto.createHash("sha256").update(fileContent).digest("hex");
    const lastModified = stat.mtime.toUTCString();

    const { data: frontmatter, content } = matter(fileContent);

    if (
      !frontmatter.published &&
      (node_env === "production" || node_env === "testing")
    ) {
      throw new HttpError("The requested blog post could not be found.", 404);
    }

    const htmlContent = marked(content);

    return {
      hash,
      lastModified,
      frontmatter,
      htmlContent,
    };
  }

  async function getPosts({ includeUnpublished = false } = {}) {
    const allPosts = await getAllPosts(postsDir, { includeUnpublished });

    const published = allPosts
      .filter(
        (post) =>
          post.published || node_env === "production" || node_env === "testing",
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const etagInput = published.map((p) => p.id).join(",");
    const etag = `"${crypto
      .createHash("sha256")
      .update(etagInput)
      .digest("hex")}"`;

    const lastModified =
      published.length > 0
        ? new Date(
            Math.max(...published.map((p) => new Date(p.date).getTime())),
          ).toUTCString()
        : new Date().toUTCString();

    return { posts: published, etag, lastModified };
  }

  return { getPost, getPosts };
}

module.exports = { createBlogService };
