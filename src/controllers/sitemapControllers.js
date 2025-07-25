const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");
const sitemapService = require("../services/sitemapService");
const { qualifyLink } = require("../utils/qualifyLinks");

// Precompile XML template once
const xmlTplSrc = fs.readFileSync(
  path.resolve(__dirname, "../views/pages/sitemap-xml.handlebars"),
  "utf-8"
);
const xmlTpl = Handlebars.compile(xmlTplSrc);

async function getSitemapHtml(req, res, next) {
  try {
    const sitemap = await sitemapService.getCompleteSitemap();
    const context = {
      title: "Site Map",
      sitemap,
    };
    res.renderWithBaseContext("pages/sitemap", context);
  } catch (err) {
    next(err);
  }
}

async function getSitemapJson(req, res, next) {
  try {
    const sitemap = await sitemapService.getCompleteSitemap();
    res.json({ title: "Site Map", sitemap });
  } catch (err) {
    next(err);
  }
}

async function getSitemapXml(req, res, next) {
  try {
    const urls = await sitemapService.getAllUrls();
    const formattedUrls = urls.map((url) => ({
      loc: qualifyLink(url.loc),
      lastmod: url.lastmod,
      changefreq: url.changefreq,
      priority: url.priority,
    }));
    const xml = xmlTpl({ urls: formattedUrls });
    res.type("application/xml").send(xml);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSitemapHtml,
  getSitemapJson,
  getSitemapXml,
};
