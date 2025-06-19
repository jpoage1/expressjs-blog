// src/routes/construction.js
const express = require("express");
const router = express.Router();
const getBaseContext = require("../utils/baseContext");

// const construction = async (req, res) => {
//   const context = await getBaseContext({
//     title: "Page Under Construction",
//   });
//   res.render("pages/construction.handlebars", context);
// };

const construction = async (path, title) => {
  router.get(path, async (req, res) => {
    const context = await getBaseContext({
      title,
    });
    res.render("pages/construction.handlebars", context);
  });
};
const fs = require("fs/promises");
const path = require("path");
const matter = require("gray-matter");
const { marked } = require("marked");

const page = async (routePath, pageFile) => {
  router.get(routePath, async (req, res, next) => {
    try {
      const filePath = path.join(
        __dirname,
        `../../content/pages/${pageFile}.md`
      );
      const fileContent = await fs.readFile(filePath, "utf8");
      const { data: frontmatter, content } = matter(fileContent);
      const htmlContent = marked(content);

      const context = await getBaseContext({
        title: frontmatter.title,
        content: htmlContent,
      });

      res.render(`pages/${pageFile}`, context);
    } catch (err) {
      err.statusCode = 500;
      next(err);
    }
  });
};

construction("/newsletter", "Newsletter");
construction("/changelog", "Changelog");
construction("/archive", "Archive");
construction("/rss-feed.xml", "RSS Feed");
construction("/tags", "Tags");
construction("/blog", "Blog");

page("/projects", "projects", "Projects");
page("/tools", "tools", "Tools");

module.exports = router;
