// src/routes/index.js
const express = require("express");
const router = express.Router();
const path = require("path");

const analytics = require("./analytics");
const robots = require("./robots");
const blog_index = require("./blog_index");
const csrfToken = require("../middleware/csrfToken");
const errorPage = require("./errorPage");
const admin = require("./admin");
const tags = require("./tags");
const presentation = require("./presentation");

const contact = require("./contact");
const sitemap = require("./sitemap");
const post = require("./post");
const pages = require("./pages");
const docs = require("./docs");
const rssFeed = require("./rssFeed");
const { qualifyLink } = require("../utils/qualifyLinks");
const HttpError = require("../utils/HttpError");

const securedMiddleware = require("../middleware/secured");
const securedRoutes = require("./secured");
const stack = require("./stack");

const favicon = require("serve-favicon");
const faviconsPath = path.join(__dirname, "..", "..", "public", "favicons");
const faviconFile = path.resolve(faviconsPath, "favicon.ico");

router.head("/health", (req, res) => {
  res.sendStatus(200);
});

router.use("/admin", securedMiddleware, securedRoutes);

router.get("/error", errorPage); // Landing page after error is logged

router.use(admin);
router.use(stack);

router.post("/track", analytics);
router.post("/analytics", analytics);

router.use(
  "/static",
  express.static("public", {
    dotfiles: "deny",
    index: false,
    extensions: false,
    fallthrough: false,
    setHeaders: (res) => {
      if (process.env.NODE_ENV == "production") {
        // Doesn't expire
        res.set("Cache-Control", "public, max-age=31536000, immutable");
      } else {
        // Live long enough for the page to load
        res.set("Cache-Control", "public, max-age=30, must-revalidate");
      }
    },
  })
);

router.use(
  "/media",
  express.static("content/images", {
    dotfiles: "deny",
    index: false,
    extensions: false,
    fallthrough: false,
    setHeaders: (res) => {
      if (process.env.NODE_ENV == "production") {
        // Cache for 1 day, allow revalidation
        res.set("Cache-Control", "public, max-age=86400, must-revalidate");
      } else {
        // Minimal caching for dev
        res.set("Cache-Control", "public, max-age=30, must-revalidate");
      }
    },
  })
);

router.use("/favicons", express.static(faviconsPath));
router.use(favicon(faviconFile));

router.use(blog_index);
router.use(robots);
router.use(contact, csrfToken);
router.use(sitemap);
router.use(pages);
router.use(rssFeed);
router.use(tags);
router.use("/projects/website-presentation", presentation);
router.use("/docs", docs);

router.get("/blog/:year/:month/:name", post);

router.get("/", (req, res) => {
  res.customRedirect("/blog", 301);
});

router.use((req, res, next) => {
  req.log.warn(req.url);
  next(new HttpError("Page not found", 404));
});

module.exports = router;
