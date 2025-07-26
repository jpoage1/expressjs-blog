// src/routes/post.js
const { marked } = require("marked");
const fs = require("fs").promises;
const path = require("path");
const fsSync = require("fs");
const crypto = require("crypto");

const matter = require("gray-matter");
const { getAllPosts } = require("../utils/postFileUtils");

const HttpError = require("../utils/HttpError");

exports.blogPost = async (req, res, next) => {
  const { year, month, name } = req.params;

  // Validate year: 4 digits only
  if (!/^\d{4}$/.test(year)) {
    return next(new HttpError("Invalid year parameter.", 400));
  }

  // Validate month: 01-12 only
  if (!/^(0[1-9]|1[0-2])$/.test(month)) {
    return next(new HttpError("Invalid month parameter.", 400));
  }

  // Validate name: allow alphanumeric, dash, underscore only (no dots, no slashes)
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    return next(new HttpError("Invalid post name parameter.", 400));
  }

  const mdPath = path.join(
    __dirname,
    "../../content/posts",
    year,
    month,
    `${name}.md`
  );

  try {
    const stat = fsSync.statSync(mdPath);
    const fileContent = await fs.readFile(mdPath, "utf8");

    // Generate ETag from content hash
    const hash = crypto.createHash("sha256").update(fileContent).digest("hex");
    const lastModified = stat.mtime.toUTCString();

    res.setHeader("ETag", hash);
    res.setHeader("Last-Modified", lastModified);

    // Check conditional request headers
    if (
      req.headers["if-none-match"] === hash ||
      req.headers["if-modified-since"] === lastModified
    ) {
      res.statusCode = 304;
      return res.end();
    }
    if (req.checkCacheHeaders({ etag: hash, lastModified })) {
      return;
    }

    const { data: frontmatter, content } = matter(fileContent);
    if (
      !frontmatter.published &&
      (process.env.NODE_ENV === "production" ||
        process.env.NODE_ENV === "testing")
    ) {
      throw new Error("Attempted to access an unpublished page in production");
    }
    const htmlContent = marked(content);
    const context = {
      title: frontmatter.title,
      date: frontmatter.date,
      author: frontmatter.author,
      content: htmlContent,
    };
    res.renderWithBaseContext("pages/post", context);
  } catch (err) {
    next(new HttpError("The requested blog post could not be found.", 404));
  }
};

exports.blogIndex = async (req, res) => {
  const postsDir = path.join(__dirname, "../../content/posts");
  const allPosts = await getAllPosts(postsDir, {
    includeUnpublished: req.query.drafts === "true",
  });

  const publishedPosts = allPosts.filter(
    (post) =>
      post.published ||
      process.env.NODE_ENV === "production" ||
      process.env.NODE_ENV === "testing"
  );
  // Sort posts descending by date
  publishedPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

  const etagInput = publishedPosts.map((p) => p.id).join(",");
  const etag = `"${hash(etagInput)}"`;

  const lastModified =
    publishedPosts.length > 0
      ? new Date(
          Math.max(...publishedPosts.map((p) => new Date(p.date).getTime()))
        ).toUTCString()
      : new Date().toUTCString();

  if (req.checkCacheHeaders({ etag, lastModified })) return;

  // Prepare context compatible with the blog-index.hbs layout
  // Add `templateContent` as excerpt or limited content if needed here
  // For now, use a simple excerpt from markdown or placeholder
  const posts = publishedPosts.map((post) => ({
    url: post.url,
    data: {
      title: post.title,
      date: post.date,
      tags: post.tags,
      published: post.published, // add this
    },
    templateContent: post.excerpt || "",
  }));

  res.renderWithBaseContext("pages/blog_index", { collections: { posts } });
};
