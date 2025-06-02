// src/routes/about.js
const express = require("express");
const router = express.Router();
const getBaseContext = require("../utils/baseContext");

router.get("/about", async (req, res) => {
  const context = await getBaseContext({
    title: "About",
  });
  res.render("pages/about.handlebars", context);
});

module.exports = router;
