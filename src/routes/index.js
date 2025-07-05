// src/routes/index.js
const express = require("express");
const router = express.Router();

// const getBaseContext = require("../utils/baseContext");
const analytics = require("./analytics");
const robots = require("./robots");
const blog_index = require("./blog_index");
const csrfToken = require("../middleware/csrfToken");
const errorHandler = require("./errorHandler");

const contact = require("./contact");
const sitemap = require("./sitemap");
const post = require("./post");
const pages = require("./pages");
const rssFeed = require("./rssFeed");

router.use(
  "/static",
  express.static("public", {
    dotfiles: "deny",
    index: false,
    extensions: false,
    fallthrough: false,
    setHeaders: (res) => {
      res.set("Cache-Control", "public, max-age=31536000, immutable");
    },
  })
);
router.get("/favicon.ico", (req, res) => res.status(204).end());

router.post("/track", analytics);

router.use(blog_index);
router.use(robots);
router.use(contact, csrfToken);
router.use(sitemap);
router.use(pages);
router.use(rssFeed);

router.get("/blog/:year/:month/:name", post);

// router.get("/", async (req, res) => {
//   const context = await getBaseContext({
//     title: "Blog Home",
//     content: "Welcome to the blog.",
//   });

//   res.render("pages/home.handlebars", context);
// });

router.get("/", async (req, res) => {
  res.redirect(301, "/blog");
});

router.use((req, res, next) => {
  const err = new Error("Not Found");
  err.statusCode = 404;
  next(err);
});

router.use(errorHandler);

module.exports = router;
