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

const contact = require("./contact");
const sitemap = require("./sitemap");
const post = require("./post");
const pages = require("./pages");
const rssFeed = require("./rssFeed");
const { qualifyLink } = require("../utils/qualifyLinks");
const HttpError = require("../utils/HttpError");

const securedMiddleware = require("../middleware/secured");
const securedRoutes = require("./secured");
const testingRoutes = require("./testing");

const favicon = require("serve-favicon");
const faviconsPath = path.join(__dirname, "..", "..", "public", "favicons");
const faviconFile = path.resolve(faviconsPath, "favicon.ico");

router.head("/health", (req, res) => {
  res.sendStatus(200);
});

router.use("/admin", securedMiddleware, securedRoutes);
router.use(
  "/test",
  (req, res, next) => {
    if (process.env.NODE_ENV !== "production") {
      return next();
    }
    next(new HttpError(403, "Attempt to access test data"));
  },
  testingRoutes
);

router.get("/error", errorPage); // Landing page after error is logged

router.use(admin);

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
router.use("/favicons", express.static(faviconsPath));
router.use(favicon(faviconFile));

router.use(blog_index);
router.use(robots);
router.use(contact, csrfToken);
router.use(sitemap);
router.use(pages);
router.use(rssFeed);

router.get("/blog/:year/:month/:name", post);

function flattenRouterLayers(stack, acc = []) {
  for (const layer of stack) {
    acc.push(layer);
    const h = layer.handle;
    if (typeof h === "function") {
      if (h.stack && Array.isArray(h.stack)) {
        flattenRouterLayers(h.stack, acc);
      } else if (h.handle && h.handle.stack && Array.isArray(h.handle.stack)) {
        flattenRouterLayers(h.handle.stack, acc);
      }
    }
  }
  return acc;
}

// router.use((req, res) => {
//   const rootStack = req.app._router?.stack || req.app.router?.stack;
//   if (!rootStack) return res.sendStatus(500);
//   const flat = flattenRouterLayers(rootStack);
//   const routes = [];
//   flat.forEach((l) => {
//     if (l.route) {
//       routes.push(l.route.path);
//     }
//   });
//   res.json(routes).send(200);
// });

// router.use((req, res) => {
//   const appStack = req.app._router?.stack || req.app.router?.stack;
//   if (!appStack) return res.sendStatus(500);
//   const flatStack = flattenRouterStack(appStack);
//   flatStack.forEach((layer) => {
//     console.log(layer);
//   });
//   res.sendStatus(200);
// });

router.get("/", (req, res) => {
  console.log(qualifyLink("/blog"));
  // res.redirect(301, qualifyLink("/blog"));
  res.redirect(301, "/blog");
});

router.use((req, res, next) => {
  console.log(req.url);
  next(new HttpError("Page not found", 404));
});

module.exports = router;
