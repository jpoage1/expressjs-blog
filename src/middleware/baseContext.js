// src/middleware/baseContext.js
const { qualifyLink } = require("../utils/qualifyLinks");
const { generateToken } = require("../utils/adminToken");

// src/utils/baseContext.js
const path = require("path");
const getPostsMenu = require("../services/postsMenuService");
const { formatMonth } = require("../utils/formatMonth");
const { qualifyNavLinks } = require("../utils/qualifyLinks.js");
const { baseUrl } = require("../utils/baseUrl.js");
const navLinks = require(path.join(__dirname, "../../content/navLinks.json"));
const processMenuLinks = require("../utils/processMenuLinks");
const { meta } = require("../config/loader");

const getSiteTitle = (owner) => `${owner}'s Software Blog`;

const POSTS_DIR = path.join(__dirname, "../../content/posts");
const DEFAULT_CONTEXT = {
  showSidebar: true,
  showFooter: true,
};

module.exports.attachBaseContextGetter = async (req, res, next) => {
  req.getBaseContext = async (isAuthenticated, overrides = {}) => {
    const filteredNavLinks = processMenuLinks(
      navLinks,
      isAuthenticated,
      req.path,
    );
    const qualifiedNavLinks = qualifyNavLinks(filteredNavLinks);
    const menu = await getPostsMenu(POSTS_DIR);
    const siteOwner = meta.site_owner;

    const context = {
      title: getSiteTitle(siteOwner),
      siteOwner,
      originCountry: meta.country,
      hCaptchaKey: meta.hcaptcha_key,
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
  next();
};

module.exports.buildBaseContext = async (req, res, next) => {
  const isAuthenticated = req.isAuthenticated;
  const token = generateToken();
  const adminLoginUrl = qualifyLink(`/${token}`);

  const baseContext = await req.getBaseContext(isAuthenticated, {
    adminLoginUrl,
  });
  res.locals.baseContext = baseContext;

  res.renderWithBaseContext = (template, overrides = {}) => {
    const context = Object.assign({}, baseContext, overrides);
    res.render(template, context);
  };

  res.renderGenericMessage = (overrides = {}) => {
    res.render(
      "pages/generic-message",
      Object.assign({}, baseContext, overrides),
    );
  };

  next();
};
