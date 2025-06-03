// src/routes/index.js
const express = require("express");
const router = express.Router();
const contact = require("./contact");
const about = require("./about");
const post = require("./post");

const getBaseContext = require("../utils/baseContext");

router.use(contact);
router.use(about);
router.get("/post/:year/:month/:name", post);
router.get("/", async (req, res) => {
  const context = await getBaseContext({
    title: "Blog Home",
    content: "Welcome to the blog.",
  });

  res.render("pages/home.handlebars", context);
});

module.exports = router;
