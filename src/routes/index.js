// src/routes/index.js
const express = require("express");
const router = express.Router();

const getBaseContext = require("../utils/baseContext");

// const newsletter = require("./newsletter");
const contact = require("./contact");
const site_map = require("./site-map");
const post = require("./post");
const pages = require("./pages");

router.use(contact);
router.use(site_map);
router.use(pages);

router.get("/post/:year/:month/:name", post);

router.get("/", async (req, res) => {
  const context = await getBaseContext({
    title: "Blog Home",
    content: "Welcome to the blog.",
  });

  res.render("pages/home.handlebars", context);
});

module.exports = router;
