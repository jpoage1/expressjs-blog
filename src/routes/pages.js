// src/routes/pages.js
const express = require("express");
const router = express.Router();

const { isExpressRouter } = require("@jpoage1/middleware");

const ConstructionRoutes = require("#utils/ConstructionRoutes.js");
const MarkdownRoutes = require("#utils/MarkdownRoutes.js");
const HtmlRoutes = require("#utils/htmlRoutes.js");
const csrfToken = require("#middleware/csrfToken.js");
const config = require("#config");

const path = require("path");
const fs = require("fs").promises;
const matter = require("gray-matter");
const { HttpError } = require("@jpoage1/errors");
const contentRoutes = require("#utils/loadContentRoutes.js");

const construction = new ConstructionRoutes();
const html = new HtmlRoutes();
const markdown = new MarkdownRoutes();

const { meta, routes } = config;
const { node_env } = meta;

function resolveContentRoutes(routesModule) {
  if (!routesModule) return {};
  if (typeof routesModule === "object" && !isExpressRouter(routesModule))
    return routesModule;
  if (isExpressRouter(routesModule)) return { router: routesModule };
  if (typeof routesModule === "function") return routesModule.call(config);
  return {};
}

const {
  constructionRoutes,
  markdownRoutes,
  htmlRoutes,
  projects,
  router: contentRouter,
} = resolveContentRoutes(contentRoutes);

function registerContent() {
  try {
    if (contentRouter) router.use(contentRouter);
  } catch (e) {
    console.warn("registerContentRoutes failed:", e.message, e.stack);
  }
}

function registerConstruction() {
  if (!constructionRoutes) return;
  try {
    constructionRoutes?.forEach((route) => {
      const { path, title } = route;
      construction.register(path, title);
    });
    router.use(construction.getRouter());
  } catch (e) {
    console.warn(e);
  }
}
function registerMarkdown() {
  try {
    if (!markdownRoutes) return;
    markdownRoutes.forEach((route) => {
      const { path, file } = route;
      markdown.register(path, file);
    });
    router.use(markdown.getRouter());
  } catch (e) {
    console.warn(e);
  }
}
function registerHtml() {
  try {
    if (!htmlRoutes) return;
    htmlRoutes.forEach((route) => {
      const { path, contentFolder } = route;
      html.register(path, contentFolder);
    });
    router.use(html.getRouter());
  } catch (e) {
    console.warn(e);
  }
}
function registerProjects() {
  try {
    if (!projects) return;
    projects.forEach((route) => {
      const { path, file, overrides } = route;
      markdown.register(path, file, {
        project: true,
        ...overrides,
      });
    });

    const projectsDir = path.join(meta.content, "pages/projects");
    if (path.resolve(projectsDir))
      router.get("/projects", async (req, res, next) => {
        try {
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

          res.locals.renderWithBaseContext("pages/projects", { projects });
        } catch (err) {
          req.log.error(err.stack);
          next(new HttpError("Could not load projects", 500));
        }
      });
    else console.warn(`[SKIPPING] Projects dir not found at: '${projectsDir}'`);
  } catch (e) {
    console.warn(e);
  }
}
registerContent();
registerConstruction();
registerMarkdown();
registerHtml();
registerProjects();

module.exports = router;
