// src/routes/pages.js
const express = require("express");
const router = express.Router();
const ConstructionRoutes = require("../utils/ConstructionRoutes");
const MarkdownRoutes = require("../utils/MarkdownRoutes");
const csrfToken = require("../middleware/csrfToken");

const construction = new ConstructionRoutes();
const markdown = new MarkdownRoutes();

if (process.env.NODE_ENV === "production") {
  // construction.register("/newsletter", "Newsletter");
  construction.register("/projects", "Projects");
  construction.register("/about/blog", "About this blog");
} else {
  markdown.register("/about/blog", "about-blog");
  markdown.register("/projects", "projects");
}

const newsletter = require("./newsletter");
router.use(newsletter, csrfToken);

construction.register("/changelog", "Changelog");
construction.register("/archive", "Archive");
// construction.register("/rss-feed.xml", "RSS Feed");
construction.register("/tags", "Tags");
construction.register("/about/blog", "About This Blog");
// construction.register("/contact", "Contact Me");

markdown.register("/tools", "tools", "tools");
markdown.register("/about/me", "about-me");

router.use(construction.getRouter());
router.use(markdown.getRouter());

module.exports = router;
