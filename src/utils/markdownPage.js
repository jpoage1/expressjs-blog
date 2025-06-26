// src/utils/markdownPage.js
const express = require("express");
const router = express.Router();
const getBaseContext = require("../utils/baseContext");

const fs = require("fs/promises");
const path = require("path");
const matter = require("gray-matter");
const { marked } = require("marked");

const markdownPage = async (
  routePath,
  markdownFile = "page",
  handlebarsFile = "page"
) => {
  router.get(routePath, async (req, res, next) => {
    try {
      const filePath = path.join(
        __dirname,
        `../../content/pages/${markdownFile}.md`
      );
      const fileContent = await fs.readFile(filePath, "utf8");
      const { data: frontmatter, content } = matter(fileContent);
      const htmlContent = marked(content);

      const context = await getBaseContext({
        title: frontmatter.title,
        content: htmlContent,
      });

      res.render(`pages/${handlebarsFile}`, context);
    } catch (err) {
      err.statusCode = 500;
      next(err);
    }
  });
};
module.exports = markdownPage;
