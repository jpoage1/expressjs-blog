// src/utils/constructionPage.js
const express = require("express");
const router = express.Router();
const getBaseContext = require("../utils/baseContext");

const constructionPage = async (path, title) => {
  router.get(path, async (req, res) => {
    const context = await getBaseContext({
      title,
    });
    res.render("pages/construction.handlebars", context);
  });
};
module.exports = constructionPage;
