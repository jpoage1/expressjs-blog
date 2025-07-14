// src/utils/baseContext.js
const path = require("path");
const getPostsMenu = require("../services/postsMenuService");
const { formatMonth } = require("./formatMonth");
const { qualifyNavLinks } = require("./qualifyLinks.js");
const { baseUrl } = require("./baseUrl.js");
const navLinks = require(path.join(__dirname, "../../content/navLinks.json"));
const filterSecureLinks = require("../utils/filterSecureLinks");

const getSiteTitle = (owner) => `${owner}'s Software Blog`;

const POSTS_DIR = path.join(__dirname, "../../content/posts");
const DEFAULT_CONTEXT = {
  showSidebar: true,
  showFooter: true,
};

module.exports = async function getBaseContext(
  isAuthenticated,
  overrides = {}
) {
  const filteredNavLinks = filterSecureLinks(navLinks, isAuthenticated);
  const qualifiedNavLinks = qualifyNavLinks(filteredNavLinks);
  const menu = await getPostsMenu(POSTS_DIR);
  const siteOwner = process.env.SITE_OWNER;

  const context = {
    title: getSiteTitle(siteOwner),
    siteOwner,
    originCountry: process.env.COUNTRY,
    hCaptchaKey: process.env.HCAPTCHA_KEY,
    navLinks: qualifiedNavLinks,
    years: menu,
    formatMonth,
    baseUrl,
    isAuthenticated,
    ...DEFAULT_CONTEXT,
    ...overrides,
  };

  return context;
};
