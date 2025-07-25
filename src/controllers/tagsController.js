const { getPostsByTag } = require("../services/tagsService");
const { getAllTags } = require("../services/sitemapService");
const HttpError = require("../utils/HttpError");
const { normalizeTag } = require("../utils/normalize");

exports.renderTagsPage = async (req, res, next) => {
  try {
    const tags = await getAllTags();
    res.renderWithBaseContext("pages/tags", { tags });
  } catch (err) {
    next(err);
  }
};

exports.renderTagPostsPage = async (req, res, next) => {
  try {
    const rawTag = req.params.tag;
    const normalizedTag = normalizeTag(rawTag);
    const posts = await getPostsByTag(rawTag);

    if (!posts || posts.length === 0) {
      return next(new HttpError("No posts found for this tag.", 404));
    }

    res.renderWithBaseContext("pages/tag-posts", {
      tag: normalizedTag,
      posts,
    });
  } catch (err) {
    next(err);
  }
};
