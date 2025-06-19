// src/routes/post.js
const { marked } = require("marked");
const fs = require("fs").promises;
const path = require("path");
const matter = require("gray-matter");

const getBaseContext = require("../utils/baseContext");

module.exports = async (req, res, next) => {
  const { year, month, name } = req.params;

  // Validate year: 4 digits only
  if (!/^\d{4}$/.test(year)) {
    const error = new Error("Invalid year parameter.");
    error.statusCode = 400;
    return next(error);
  }

  // Validate month: 01-12 only
  if (!/^(0[1-9]|1[0-2])$/.test(month)) {
    const error = new Error("Invalid month parameter.");
    error.statusCode = 400;
    return next(error);
  }

  // Validate name: allow alphanumeric, dash, underscore only (no dots, no slashes)
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    const error = new Error("Invalid post name parameter.");
    error.statusCode = 400;
    return next(error);
  }

  const mdPath = path.join(
    __dirname,
    "../../content/posts",
    year,
    month,
    `${name}.md`
  );

  try {
    const fileContent = await fs.readFile(mdPath, "utf8");
    const { data: frontmatter, content } = matter(fileContent);
    const htmlContent = marked(content);
    const context = await getBaseContext({
      title: frontmatter.title,
      date: frontmatter.date,
      author: frontmatter.author,
      content: htmlContent,
    });
    res.render("pages/post", context);
  } catch (err) {
    const error = new Error("The requested blog post could not be found.");
    error.statusCode = 404;
    next(error);
  }
};
