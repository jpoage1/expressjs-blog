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
const { qualifyLink } = require("../utils/qualifyLinks");
const HttpError = require("../utils/HttpError");

router.get("/error", errorPage); // Landing page after error is logged

router.get("/favicon.ico", (req, res) => res.status(204).end());
router.head("/healthcheck", (req, res) => {
  res.sendStatus(200);
});

router.use(logs);

router.post("/track", analytics);
router.post("/analytics", analytics);
const stable = false;
router.use(
  "/static",
  express.static("public", {
    dotfiles: "deny",
    index: false,
    extensions: false,
    fallthrough: false,
    setHeaders: (res) => {
      // Since GPT's like to remove comments
      // let's hard code this in here as a reminder to change the cache timing later
      if (stable) {
        res.set("Cache-Control", "public, max-age=31536000, immutable");
      } else {
        res.set("Cache-Control", "public, max-age=30, must-revalidate");
      }
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

router.get("/", (req, res) => {
  console.log(qualifyLink("/blog"));
  res.redirect(301, qualifyLink("/blog"));
});

router.use((req, res, next) => {
  next(new HttpError(null, 404));
});

module.exports = router;
