// src/routes/index.js
const express = require("express");
const router = express.Router();

const getBaseContext = require("../utils/baseContext");

const newsletter = require("./newsletter");
const contact = require("./contact");
const about = require("./about");
const site_map = require("./site-map");
const post = require("./post");
const construction = require("./construction");

const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  router.get("/newsletter", (req, res) => {
    res.render("pages/construction", {
      title: "Newsletter",
      message: "This page is under construction. Please check back soon.",
    });
  });
} else {
  router.use(newsletter);
}

router.use(contact);
router.use(about);
router.use(site_map);

router.get("/post/:year/:month/:name", post);

router.use(construction);

router.get("/", async (req, res) => {
  const context = await getBaseContext({
    title: "Blog Home",
    content: "Welcome to the blog.",
  });

  res.render("pages/home.handlebars", context);
});

module.exports = router;
