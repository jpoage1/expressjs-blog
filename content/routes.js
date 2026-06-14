const express = require("express");
const router = express.Router();

const path = require("path");
const fs = require("fs").promises;
const matter = require("gray-matter");

const HttpError = require("../src/utils/HttpError");

function getRoutes() {
  const { node_env, content: contentPath } = this.meta;
  router.get("/projects", async (req, res, next) => {
    try {
      const projectsDir = path.join(contentPath, "pages/projects");
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

  return {
    constructionRoutes: [
      { path: "/changelog", title: "Changelog" },
      { path: "/archive", title: "Archive" },
    ],
    markdownRoutes: [
      { path: "/tools", file: "tools", params: "tools" },
      { path: "/about/me", file: "about-me" },
      { path: "/projects", file: "projects" },
    ],
    htmlRoutes: [
      { path: "/games/word-guesser", contentFolder: "word-guesser" },
    ],
    projects: [
      { path: "/projects/lisp-interpreter", file: "projects/lisp_interpreter" },
      { path: "/projects/pipeline-runner", file: "projects/pipeline_runner" },
      { path: "/projects/telemetry", file: "projects/telemetry" },
      { path: "/projects/xmonad", file: "projects/xmonad" },
      { path: "/projects/word-guesser", file: "projects/word-guesser" },

      { path: "/about/blog", file: "projects/about-blog" },
      { path: "/projects", file: "projects/about-blog" },
    ],
    router,
  };
}
module.exports = getRoutes;
