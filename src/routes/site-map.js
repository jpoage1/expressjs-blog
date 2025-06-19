// src/routes/site-map.js
const express = require("express");
const router = express.Router();
const getBaseContext = require("../utils/baseContext");

router.get("/site-map", async (req, res) => {
  const context = await getBaseContext({
    title: "Site Map",
  });
  res.render("pages/site-map.handlebars", context);
});

module.exports = router;
