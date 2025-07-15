// src/routes/sitemap.js
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");
const sitemapService = require("../services/sitemapService");
const { qualifyLink } = require("../utils/qualifyLinks.js");

// Precompile XML template once
const xmlTplSrc = fs.readFileSync(
  path.resolve(__dirname, "../views/pages/sitemap-xml.handlebars"),
  "utf-8"
);
const xmlTpl = Handlebars.compile(xmlTplSrc);

// HTML sitemap page
router.get("/sitemap", async (req, res) => {
  const context = {
    title: "Site Map",
    sitemap: await sitemapService.getCompleteSitemap(),
  };
  res.renderWithBaseContext("pages/sitemap", context);
});

// HTML sitemap page
router.get("/sitemap.json", async (req, res) => {
  const context = {
    title: "Site Map",
    sitemap: await sitemapService.getCompleteSitemap(),
  };
  res.json(context);
});

// XML sitemap endpoint
router.get("/sitemap.xml", async (req, res) => {
  const urls = await sitemapService.getAllUrls();

  // Format URLs for XML template
  const formattedUrls = urls.map((url) => ({
    loc: qualifyLink(url.loc),
    lastmod: url.lastmod,
    changefreq: url.changefreq,
    priority: url.priority,
  }));

  const xml = xmlTpl({ urls: formattedUrls });
  res.type("application/xml").send(xml);
});

module.exports = router;
