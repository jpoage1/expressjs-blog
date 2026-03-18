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

/**
 * Merges CSS class and style overrides with default values.
 * @param {Object} overrides - Object containing classes and styles to override.
 * @returns {Object} The merged CSS configuration object.
 */
function cssOverride(overrides = {}) {
  const defaults = {
    classes: {
      body: "pattern-dots",
      layout: "layout",
      sidebar: "sidebar",
      container: "container",
    },
    styles: {},
  };

  return {
    classes: { ...defaults.classes, ...(overrides.classes || {}) },
    styles: { ...defaults.styles, ...(overrides.styles || {}) },
  };
}

const DEFAULT_CONTEXT = {
  showSidebar: true,
  showFooter: true,
  showHeader: true,
  css: cssOverride(),
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

function renderWithBaseContext(res, baseContext) {
  return (template, overrides = {}) => {
    const context = Object.assign({}, baseContext, overrides);
    res.render(template, context);
  };
}

function renderWithCallback(res, baseContext) {
  return (template, cb, overrides = {}) => {
    let context = Object.assign({}, baseContext, overrides);
    res.logger.info(cb);
    context = cb(context);
    res.render(template, context);
  };
}
function renderGenericMessage(res, baseContext) {
  return (overrides = {}) => {
    res.render(
      "pages/generic-message",
      Object.assign({}, baseContext, overrides),
    );
  };
}
module.exports.buildBaseContext = async (req, res, next) => {
  const isAuthenticated = req.isAuthenticated;
  const token = generateToken();
  const adminLoginUrl = qualifyLink(`/${token}`);

  const baseContext = await req.getBaseContext(isAuthenticated, {
    adminLoginUrl,
  });
  res.locals.baseContext = baseContext;

  res.renderWithBaseContext = renderWithBaseContext(res, baseContext);

  res.renderWithCallback = renderWithCallback(res, baseContext);

  res.renderGenericMessage = renderGenericMessage(res, baseContext);

  res.cssOverride = cssOverride;

  next();
};
