// src/routes/sitemap.
const express = require("express");
const router = express.Router();
const sitemapController = require("../controllers/sitemapControllers");

router.get("/sitemap", sitemapController.getSitemapHtml);
router.get("/sitemap.json", sitemapController.getSitemapJson);
router.get("/sitemap.xml", sitemapController.getSitemapXml);

module.exports = router;
