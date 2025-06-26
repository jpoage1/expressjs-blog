// src/routes/about.js
const express = require("express");
const router = express.Router();
const markdownPage = require("../utils/markdownPage");
const constructionPage = require("../utils/constructionPage");

markdownPage("/about/me", "about-me");
constructionPage("/about/blog", "About this blog");
module.exports = router;
