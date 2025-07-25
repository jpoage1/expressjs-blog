const express = require("express");
const {
  renderTagsPage,
  renderTagPostsPage,
} = require("../controllers/tagsController");

const router = express.Router();

router.get("/tags", renderTagsPage);
router.get("/tags/:tag", renderTagPostsPage);

module.exports = router;
