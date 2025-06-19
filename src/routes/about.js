// src/routes/about.js
const express = require("express");
const router = express.Router();

const { marked } = require("marked");
const fs = require("fs").promises;
const path = require("path");
const matter = require("gray-matter");

const getBaseContext = require("../utils/baseContext");

// router.get("/about", async (req, res) => {
//   const context = await getBaseContext({
//     title: "About",
//   });
//   res.render("pages/about.handlebars", context);
// });

router.get("/about", async (req, res, next) => {
  try {
    const aboutPath = path.join(__dirname, "../../content/pages/about.md");
    const fileContent = await fs.readFile(aboutPath, "utf8");
    const { data: frontmatter, content } = matter(fileContent);
    const htmlContent = marked(content);
    const context = await getBaseContext({
      title: frontmatter.title,
      author: frontmatter.author,
      date: frontmatter.date,
      content: htmlContent,
    });
    res.render("pages/page", context);
  } catch (err) {
    err.statusCode = 500;
    next(err);
  }
});
module.exports = router;
