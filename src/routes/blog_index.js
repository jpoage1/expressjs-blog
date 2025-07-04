const express = require("express");
const path = require("path");
const { getAllPosts } = require("../utils/postFileUtils");
const getBaseContext = require("../utils/baseContext");
const router = express.Router();

router.get("/blog", async (req, res, next) => {
  const postsDir = path.join(__dirname, "../../content/posts");
  const allPosts = await getAllPosts(postsDir, {
    includeUnpublished: req.query.drafts === "true",
  });

  const publishedPosts = allPosts.filter(
    (post) => post.published || process.env.NODE_ENV === "production"
  );
  // Sort posts descending by date
  publishedPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

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

  const context = await getBaseContext({ collections: { posts } });
  res.render("pages/blog_index", context);
});

module.exports = router;
