// src/routes/index.js
const express = require("express");
const router = express.Router();

const analytics = require("./analytics");
const robots = require("./robots");
const blog_index = require("./blog_index");
const csrfToken = require("../middleware/csrfToken");
const errorPage = require("./errorPage");

const contact = require("./contact");
const sitemap = require("./sitemap");
const post = require("./post");
const pages = require("./pages");
const rssFeed = require("./rssFeed");
const logs = require("./logs");

router.get("/error", errorPage); // Landing page after error is logged

router.get("/favicon.ico", (req, res) => res.status(204).end());

if (process.env.NODE_ENV != "production") {
  const logs = require("./logs");
  // router.use(logs);
}

router.post("/track", analytics);
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

router.use(blog_index);
router.use(robots);
router.use(contact, csrfToken);
router.use(sitemap);
router.use(pages);
router.use(rssFeed);

router.get("/blog/:year/:month/:name", post);

router.get("/", async (req, res) => {
  res.redirect(301, "/blog");
});

router.use((req, res, next) => {
  const err = new Error("Not Found");
  err.statusCode = 404;
  next(err);
});

module.exports = router;
