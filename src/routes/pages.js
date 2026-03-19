// src/routes/pages.js
const express = require("express");
const router = express.Router();
const ConstructionRoutes = require("../utils/ConstructionRoutes");
const MarkdownRoutes = require("../utils/MarkdownRoutes");
const HtmlRoutes = require("../utils/htmlRoutes");
const csrfToken = require("../middleware/csrfToken");
const newsletter = require("./newsletter");
const { meta } = require("../config/loader");

const construction = new ConstructionRoutes();
const html = new HtmlRoutes();
const markdown = new MarkdownRoutes();

router.use(newsletter, csrfToken);

construction.register("/changelog", "Changelog");
construction.register("/archive", "Archive");

markdown.register("/tools", "tools", "tools");
markdown.register("/about/me", "about-me");

router.use(construction.getRouter());
router.use(html.getRouter());
router.use(markdown.getRouter());

module.exports = router;
