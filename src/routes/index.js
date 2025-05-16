// src/routes/index.js
const express = require("express");
const router = express.Router();
const { marked } = require("marked");
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const getBaseContext = require("../utils/baseContext");
const getPostsMenu = require("../services/postsService");
const { formatMonth } = require("../utils/formatMonth");

router.get("/post/:year/:month/:name", (req, res) => {
  const { year, month, name } = req.params;
  const mdPath = path.join(__dirname, "../../posts", year, month, `${name}.md`);

  fs.readFile(mdPath, "utf8", async (err, fileContent) => {
    if (err) return res.status(404).send("Post not found");

    const menu = await getPostsMenu(path.join(__dirname, "../../posts"));
    const { data: frontmatter, content } = matter(fileContent);
    const htmlContent = marked(content);
    const context = getBaseContext({
      title: frontmatter.title,
      date: frontmatter.date,
      author: frontmatter.author,
      content: htmlContent,
      years: menu, // pass the built menu here
      formatMonth, // pass formatter to template
    });
    res.render("pages/post", context);
  });
});

router.get("/", async (req, res) => {
  const menu = await getPostsMenu(path.join(__dirname, "../../posts"));

  const context = getBaseContext({
    title: "Blog Home",
    content: "Welcome to the blog.",
    years: menu, // pass the built menu here
    formatMonth, // pass formatter to template
  });

  res.render("pages/home", context);
});
module.exports = router;
