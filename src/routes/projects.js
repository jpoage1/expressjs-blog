// src/routes/pages.js
const express = require("express");
const router = express.Router();
const ConstructionRoutes = require("../utils/ConstructionRoutes");
const MarkdownRoutes = require("../utils/MarkdownRoutes");
const HtmlRoutes = require("../utils/htmlRoutes");
const csrfToken = require("../middleware/csrfToken");
const presentation = require("./presentation");
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

router.use("/projects/website-presentation", presentation);
html.register("/games/word-guesser", "word-guesser");

markdown.register("/projects/lisp-interpreter", "projects/lisp_interpreter");
markdown.register("/projects/pipeline-runner", "projects/pipeline_runner");
markdown.register("/projects/telemetry", "projects/telemetry");
markdown.register("/projects/xmonad", "projects/xmonad");

router.use(construction.getRouter());
router.use(html.getRouter());
router.use(markdown.getRouter());

module.exports = router;
