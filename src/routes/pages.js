// src/routes/pages.js
const express = require("express");
const router = express.Router();
const ConstructionRoutes = require("../utils/ConstructionRoutes");
const MarkdownRoutes = require("../utils/MarkdownRoutes");
const csrfToken = require("../middleware/csrfToken");

const construction = new ConstructionRoutes();
const markdown = new MarkdownRoutes();

if (
  process.env.NODE_ENV === "production" ||
  process.env.NODE_ENV === "testing"
) {
  // construction.register("/newsletter", "Newsletter");
  construction.register("/projects", "Projects");
} else {
  markdown.register("/projects", "projects");
}
markdown.register("/about/blog", "about-blog");

const newsletter = require("./newsletter");
router.use(newsletter, csrfToken);

construction.register("/changelog", "Changelog");
construction.register("/archive", "Archive");

markdown.register("/tools", "tools", "tools");
markdown.register("/about/me", "about-me");

router.use(construction.getRouter());
router.use(markdown.getRouter());

module.exports = router;
