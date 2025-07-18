const express = require("express");
const { getAllTags, getPostsByTag } = require("../services/tagsService");
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

router.get("/tags/:tag", async (req, res, next) => {
  const tag = req.params.tag;

  // Replace with your data source logic to fetch posts by tag
  const posts = await getPostsByTag(tag);

  console.log(posts);
  if (!posts || posts.length === 0) {
    return next(new HttpError("No posts found for this tag.", 404));
  }

  const context = {
    tag,
    posts,
  };

  res.renderWithBaseContext("pages/tag-posts", context);
});

module.exports = router;
