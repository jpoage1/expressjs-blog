// src/routes/index.js
const express = require("express");
const router = express.Router();
const { marked } = require("marked");
const fs = require("fs");
const path = require("path");

router.get("/", (req, res) => {
  res.render("home", { title: "Blog Home", content: "Welcome to the blog." });
});

router.get("/post/:name", (req, res) => {
  const mdPath = path.join(__dirname, "../posts", `${req.params.name}.md`);
  console.log(mdPath);
  fs.readFile(mdPath, "utf8", (err, data) => {
    if (err) return res.status(404).send("Post not found");
    const htmlContent = marked(data);
    res.render("post", { content: htmlContent });
  });
});
module.exports = router;
