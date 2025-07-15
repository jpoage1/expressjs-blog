// src/routes/post.js
const { marked } = require("marked");
const fs = require("fs").promises;
const path = require("path");
const matter = require("gray-matter");

const HttpError = require("../utils/HttpError");

module.exports = async (req, res, next) => {
  const { year, month, name } = req.params;

  // Validate year: 4 digits only
  if (!/^\d{4}$/.test(year)) {
    return next(new HttpError("Invalid year parameter.", 400));
  }

  // Validate month: 01-12 only
  if (!/^(0[1-9]|1[0-2])$/.test(month)) {
    return next(new HttpError("Invalid month parameter.", 400));
  }

  // Validate name: allow alphanumeric, dash, underscore only (no dots, no slashes)
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    return next(new HttpError("Invalid post name parameter.", 400));
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
    if (
      !frontmatter.published &&
      (process.env.NODE_ENV === "production" ||
        process.env.NODE_ENV === "testing")
    ) {
      throw new Error("Attempted to access an unpublished page in production");
    }
    const htmlContent = marked(content);
    const context = {
      title: frontmatter.title,
      date: frontmatter.date,
      author: frontmatter.author,
      content: htmlContent,
    };
    res.renderWithBaseContext("pages/post", context);
  } catch (err) {
    next(new HttpError("The requested blog post could not be found.", 404));
  }
};
