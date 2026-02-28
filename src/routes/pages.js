// src/routes/pages.js
const express = require("express");
const router = express.Router();
const ConstructionRoutes = require("../utils/ConstructionRoutes");
const MarkdownRoutes = require("../utils/MarkdownRoutes");
const HtmlRoutes = require("../utils/htmlRoutes");
const csrfToken = require("../middleware/csrfToken");
const { meta } = require("../config/loader");

const construction = new ConstructionRoutes();
const html = new HtmlRoutes();
const markdown = new MarkdownRoutes();

const { node_env } = meta;
if (node_env === "production" || node_env === "testing") {
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
html.register("/games/word-guesser", "word-guesser");

router.use(construction.getRouter());
router.use(html.getRouter());
router.use(markdown.getRouter());

module.exports = router;
