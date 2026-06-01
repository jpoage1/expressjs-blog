// src/middleware/baseContext.js
const { qualifyLink } = require("../utils/qualifyLinks");
const { generateToken } = require("../utils/adminToken");

// src/utils/baseContext.js
const path = require("path");
const getPostsMenu = require("#services/postsMenuService.js");
const { formatMonth } = require("#utils/formatMonth.js");
const { qualifyNavLinks } = require("#utils/qualifyLinks.js");
const { meta } = require("#config");
const navLinks = require("##config/navLinks.json");
const processMenuLinks = require("#utils/processMenuLinks.js");

const getSiteTitle = (owner) => `${owner}'s Software Blog`;

const POSTS_DIR = path.join(meta.content, "/posts");

/**
 * Merges CSS class and style overrides with default values.
 * @param {Object} overrides - Object containing classes and styles to override.
 * @returns {Object} The merged CSS configuration object.
 */

function cssOverride(overrides = {}) {
  const defaults = {
    classes: {
      body: "pattern-dots no-print",
      layout: "layout no-print",
      sidebar: "sidebar no-print",
      container: "container no-print",
    },
    styles: {},
  };

  return {
    classes: { ...defaults.classes, ...(overrides.classes || {}) },
    styles: { ...defaults.styles, ...(overrides.styles || {}) },
  };
}

const getDefaultContext = (view = "web") => {
  const isPaper = view == "paper";
  return {
    showSidebar: false,
    showFooter: !isPaper,
    showHeader: !isPaper,
    viewType: view,
    css: cssOverride(),
  };
};

module.exports.attachBaseContextGetter = async (req, res, next) => {
  res.locals.isPaper = req.query.view == "print";
  req.getBaseContext = async (isAuthenticated, overrides = {}) => {
    const filteredNavLinks = processMenuLinks(
      navLinks,
      res.locals.session,
      req.path,
    );
    const qualifiedNavLinks = qualifyNavLinks(filteredNavLinks);
    const menu = await getPostsMenu(POSTS_DIR, res.locals.baseUrl);
    const siteOwner = meta.site_owner;

    const context = {
      title: getSiteTitle(siteOwner),
      siteOwner,
      originCountry: meta.country,
      hCaptchaKey: meta.hcaptcha_key,
      navLinks: qualifiedNavLinks,
      years: menu,
      formatMonth,
      baseUrl: res.locals.baseUrl,
      isAuthenticated,
      node_env_dev: meta.node_env == "development",
      node_env_prod: meta.node_env != "development",
      ...getDefaultContext(req.query.view ?? "web"),
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
    // res.logger.info(cb);
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
  const adminLoginUrl = this.res.locals.qualifyLink(`/${token}`);

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
