// src/routes/pages.js
const express = require("express");
const router = express.Router();
const ConstructionRoutes = require("../utils/ConstructionRoutes");
const MarkdownRoutes = require("../utils/MarkdownRoutes");
const HtmlRoutes = require("../utils/htmlRoutes");
const csrfToken = require("../middleware/csrfToken");
const presentation = require("./presentation");
const { meta } = require("../config/loader");

const path = require("path");
const fs = require("fs").promises;
const matter = require("gray-matter");
const HttpError = require("../utils/HttpError");

const construction = new ConstructionRoutes();
const html = new HtmlRoutes();
const markdown = new MarkdownRoutes();

const { node_env } = meta;

router.use("/projects/website-presentation", presentation);
html.register("/games/word-guesser", "word-guesser");

function createProject(url, file, overrides = {}) {
  markdown.register(url, file, { project: true, ...overrides });
}
createProject("/projects/lisp-interpreter", "projects/lisp_interpreter");
createProject("/projects/pipeline-runner", "projects/pipeline_runner");
createProject("/projects/telemetry", "projects/telemetry");
createProject("/projects/xmonad", "projects/xmonad");
createProject("/projects/word-guesser", "projects/word-guesser");
createProject("/about/blog", "projects/about-blog", {
  // showSidebar: true,
});

router.get("/projects", async (req, res, next) => {
  try {
    const projectsDir = path.join(meta.content, "/pages/projects");
    const files = await fs.readdir(projectsDir);

    const projects = [];

    for (const file of files) {
      if (!file.endsWith(".md")) continue;

      const filePath = path.join(projectsDir, file);
      const fileContent = await fs.readFile(filePath, "utf-8");
      const { data } = matter(fileContent);

      if (data.published || node_env === "development") {
        projects.push({
          title: data.title,
          status: data.published ? "Active" : "Archived",
          status_class: data.published ? "active" : "archived",
          description: data.description || "",
          target_url: data.repository || `/${data.slug}`,
          demo_url: data.demo_url,
          demo_label: data.demo_label,
          external: !!data.repository,
          retrospective_url: `/${data.slug}`,
          repository: data.repository,
        });
      }
    }

    res.renderWithBaseContext("pages/projects", { projects });
  } catch (err) {
    req.log.error(err.stack);
    next(new HttpError("Could not load projects", 500));
  }
});

router.use(construction.getRouter());
router.use(html.getRouter());
router.use(markdown.getRouter());

module.exports = router;
