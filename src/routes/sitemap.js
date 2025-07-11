// src/routes/sitemap.js
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");
const getBaseContext = require("../utils/baseContext");
const sitemapService = require("../services/sitemapService");
const { qualifyLink } = require("../utils/qualifyLinks.js");
// const { baseUrl } = require("../utils/baseUrl");

// Precompile XML template once
const xmlTplSrc = fs.readFileSync(
  path.resolve(__dirname, "../views/pages/sitemap-xml.handlebars"),
  "utf-8"
);
const xmlTpl = Handlebars.compile(xmlTplSrc);

// function flatten(entries, out = []) {
//   for (const e of entries) {
//     if (e.loc) out.push(e.loc);
//     if (Array.isArray(e.children)) flatten(e.children, out);
//   }
//   return out;
// }

// HTML sitemap page
router.get("/sitemap", async (req, res) => {
  const context = {
    title: "Site Map",
    sitemap: await sitemapService.getCompleteSitemap(),
  }
  res.renderWithBaseContext("pages/sitemap", context);
});

// const getBaseUrl = require("../utils/baseUrl");

// XML sitemap endpoint
router.get("/sitemap.xml", async (req, res) => {
  const urls = await sitemapService.getAllUrls();
  // const baseUrl = getBaseUrl({ protocol: req.protocol, host: req.get("host") });

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
