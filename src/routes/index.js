// src/routes/index.js
const express = require("express");
const router = express.Router();
const path = require("path");

const robots = require("../controllers/robotsController");
const csrfToken = require("../middleware/csrfToken");
const errorPage = require("../controllers/errorPageController");
const admin = require("./admin");
const tags = require("./tags");
const presentation = require("./presentation");

const contact = require("./contact");
const sitemap = require("./sitemap");
const { blogPost, blogIndex } = require("../controllers/blogControllers");
const pages = require("./pages");
const docs = require("./docs");
const rssFeedController = require("../controllers/rssFeedController");
const HttpError = require("../utils/HttpError");

const stack = require("../controllers/techkStackController");

const favicon = require("serve-favicon");
const faviconsPath = path.join(__dirname, "..", "..", "public", "favicons");
const faviconFile = path.resolve(faviconsPath, "favicon.ico");

router.head("/health", (req, res) => {
  res.sendStatus(200);
});

router.get("/error", errorPage); // Landing page after error is logged

router.use(admin);

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

router.use(contact, csrfToken);
router.use(sitemap);
router.use(pages);
router.use(tags);
router.use("/projects/website-presentation", presentation);
router.use("/docs", docs);

router.get("/blog/:year/:month/:name", blogPost);
router.get("/blog", blogIndex);

router.get("/stack", stack);

router.get("/robots.txt", robots);
router.get("/rss-feed.xml", rssFeedController);

router.get("/", (req, res) => {
  res.customRedirect("/blog", 301);
});

router.use((req, res, next) => {
  req.log.warn(req.url);
  next(new HttpError("Page not found", 404));
});

module.exports = router;
