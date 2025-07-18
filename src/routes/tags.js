const express = require("express");
const { getPostsByTag } = require("../services/tagsService");
const { getAllTags } = require("../services/sitemapService");
const HttpError = require("../utils/HttpError");

const router = express.Router();

router.get("/tags", async (req, res, next) => {
  try {
    const tags = await getAllTags();
    const context = { tags };
    res.renderWithBaseContext("pages/tags", context);
  } catch (err) {
    next(err);
  }
});
function normalizeTag(tag) {
  return tag
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, " ");
}

router.get("/tags/:tag", async (req, res, next) => {
  const tag = req.params.tag;
  const normalizedTag = normalizeTag(tag);

  // Replace with your data source logic to fetch posts by tag
  const posts = await getPostsByTag(tag);

  if (!posts || posts.length === 0) {
    return next(new HttpError("No posts found for this tag.", 404));
  }

  const context = {
    tag: normalizedTag,
    posts,
  };

  res.renderWithBaseContext("pages/tag-posts", context);
});

module.exports = router;
