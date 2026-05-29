// src/utils/MarkdownRoutes.js
const BaseRoute = require("./BaseRoute");
const fs = require("fs/promises");
const path = require("path");
const matter = require("gray-matter");
const { marked } = require("marked");
const { getProjectDates } = require("../utils/gitDates"); // Import the utility

const { meta } = require("../config/loader.js");

class MarkdownRoutes extends BaseRoute {
  constructor() {
    super();
  }

  register(routePath, markdownFile = "page", params = "page") {
    let extraParams = {};
    let handlebarsFile = params;

    if (typeof params !== "object" || params === null) {
      // Legacy mode: params is just the markdown filename string
      handlebarsFile = params;
    } else {
      ({ handlebarsFile = "page", ...extraParams } = params);
    }
    this.router.get(routePath, async (req, res, next) => {
      try {
        const filePath = path.join(`${meta.content}/pages/${markdownFile}.md`);
        const fileContent = await fs.readFile(filePath, "utf8");
        const { data: frontmatter, content } = matter(fileContent);

        // --- Start Git Polling Logic ---
        const needsCreated =
          !frontmatter.created || frontmatter.created.trim() === "";
        const needsUpdated =
          !frontmatter.updated || frontmatter.updated.trim() === "";

        if (frontmatter.repository && (needsCreated || needsUpdated)) {
          // Extract repo name from URL (e.g., "pipeline_runner" from "https://github.com/jpoage1/pipeline_runner")
          const repoName = frontmatter.repository
            .split("/")
            .pop()
            .replace(".git", "");
          const localRepoPath = path.resolve(
            __dirname,
            `../../projects_src/${repoName}`,
          );

          const gitDates = getProjectDates(localRepoPath);

          // Apply Git dates only if the frontmatter fields are blank
          if (needsCreated) frontmatter.created = gitDates.created;
          if (needsUpdated) frontmatter.updated = gitDates.updated;
        }
        // --- End Git Polling Logic ---

        const htmlContent = marked(content);
        const context = {
          // title: frontmatter.title,
          ...frontmatter,
          content: htmlContent,
          ...extraParams,
        };
        console.log("extraParams: ", extraParams);
        res.renderWithBaseContext(`pages/${handlebarsFile}`, context);
      } catch (err) {
        err.statusCode = 500;
        next(err);
      }
    });
  }
}

module.exports = MarkdownRoutes;
