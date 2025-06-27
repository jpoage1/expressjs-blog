// src/routes/index.js
const express = require("express");
const router = express.Router();

const getBaseContext = require("../utils/baseContext");
const analytics = require("./analytics");
const robots = require("./robots");
const blog_index = require("./blog_index");

router.post("/track", analytics);

const contact = require("./contact");
const sitemap = require("./sitemap");
const post = require("./post");
const pages = require("./pages");

router.use(blog_index);
router.use(robots);
router.use(contact);
router.use(sitemap);
router.use(pages);

router.get("/blog/:year/:month/:name", post);

router.get("/", async (req, res) => {
  const context = await getBaseContext({
    title: "Blog Home",
    content: "Welcome to the blog.",
  });

  res.render("pages/home.handlebars", context);
});

module.exports = router;
