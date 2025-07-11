// src/utils/baseContext.js
const path = require("path");
const getPostsMenu = require("../services/postsMenuService");
const { formatMonth } = require("./formatMonth");
const { qualifyNavLinks } = require("./qualifyLinks.js");
const { baseUrl } = require("./baseUrl.js");
const navLinks = require(path.join(__dirname, "../../content/navLinks.json"));

async function getBaseContext(overrides = {}) {

  const qualifiedNavLinks = qualifyNavLinks(navLinks);
  const menu = await getPostsMenu(path.join(__dirname, "../../content/posts"));

  return Object.assign(
    {
      siteOwner: process.env.SITE_OWNER,
      originCountry: process.env.COUNTRY,
      hCaptchaKey: process.env.HCAPTCHA_KEY,
      navLinks: qualifiedNavLinks,
      years: menu,
      formatMonth,
      baseUrl
    },
    overrides
  );
}

module.exports = getBaseContext;
