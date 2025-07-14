// src/utils/baseContext.js
const path = require("path");
const getPostsMenu = require("../services/postsMenuService");
const { formatMonth } = require("./formatMonth");
const { qualifyNavLinks } = require("./qualifyLinks.js");
const { baseUrl } = require("./baseUrl.js");
const navLinks = require(path.join(__dirname, "../../content/navLinks.json"));
const filterSecureLinks = require("../utils/filterSecureLinks");

module.exports = async function getBaseContext(
  isAuthenticated,
  overrides = {}
) {
  const filteredNavLinks = filterSecureLinks(navLinks, isAuthenticated);
  const qualifiedNavLinks = qualifyNavLinks(filteredNavLinks);
  const menu = await getPostsMenu(path.join(__dirname, "../../content/posts"));
  const siteOwner = process.env.SITE_OWNER;
  return Object.assign(
    {
      title: `${siteOwner}'s Software Blog`,
      siteOwner,
      originCountry: process.env.COUNTRY,
      hCaptchaKey: process.env.HCAPTCHA_KEY,
      navLinks: qualifiedNavLinks,
      years: menu,
      formatMonth,
      baseUrl,
      isAuthenticated,
      showSidebar: true,
      showFooter: true,
    },
    overrides
  );
};
