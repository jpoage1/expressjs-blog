// src/utils/baseContext.js
const path = require("path");
const getPostsMenu = require("../services/postsMenuService");
const { formatMonth } = require("../utils/formatMonth");
const { qualifyNavLinks, qualifyLink } = require("../utils/qualifyLinks");
const { baseUrl } = require("../utils/baseUrl.js");
const navLinks = require(path.join(__dirname, "../../content/navLinks.json"));
const processMenuLinks = require("../utils/processMenuLinks");
const { generateToken } = require("../utils/adminToken");
const { meta } = require("../config/loader");

const getSiteTitle = (owner) => `${owner}'s Software Blog`;

const POSTS_DIR = path.join(__dirname, "../../content/posts");

class BaseContextManager {
  constructor(req, res, next) {
    this.req = req;
    this.res = res;
    this.next = next;
    this.isPaper = req.query.view == "print";
    req.getBaseContext = this.getBaseContext.bind(this);
    res.renderWithBaseContext = this.renderWithBaseContext.bind(this);
    res.renderWithCallback = this.renderWithCallback.bind(this);
    res.renderGenericMessage = this.renderGenericMessage.bind(this);
    res.cssOverride = this.cssOverride.bind(this);
  }

  async init() {
    const isAuthenticated = this.req.isAuthenticated;
    const token = generateToken();
    const adminLoginUrl = qualifyLink(`/${token}`);
    this.baseContext = await this.getBaseContext(isAuthenticated, {
      adminLoginUrl,
    });
    this.next();
  }

  /**
   * Merges CSS class and style overrides with default values.
   * @param {Object} overrides - Object containing classes and styles to override.
   * @returns {Object} The merged CSS configuration object.
   */
  cssOverride(overrides = {}) {
    const defaults = {
      classes: {
        body: "pattern-dots no-print",
        layout: "layout no-print",
        sidebar: "sidebar no-print",
        container: "container no-print",
        content: "markdown-content",
      },
      styles: {},
    };

    return {
      classes: { ...defaults.classes, ...(overrides.classes || {}) },
      styles: { ...defaults.styles, ...(overrides.styles || {}) },
    };
  }

  getDefaultContext(view = "web") {
    const isPaper = view == "paper";
    return {
      showSidebar: false,
      showFooter: !isPaper,
      showHeader: !isPaper,
      viewType: view,
      css: this.cssOverride(),
    };
  }

  async getBaseContext(isAuthenticated, overrides = {}) {
    const filteredNavLinks = processMenuLinks(
      navLinks,
      isAuthenticated,
      this.req.path,
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
      node_env_dev: meta.node_env == "development",
      node_env_prod: meta.node_env != "development",
      ...this.getDefaultContext(this.req.query.view ?? "web"),
      ...overrides,
    };

    return context;
  }
  mergeOverrides(overrides = {}, cssOverrides = {}) {
    return {
      ...this.baseContext,
      ...overrides,
      css: {
        ...this.baseContext?.css,
        ...overrides?.css,
        ...cssOverrides,
      },
    };
  }
  renderWithBaseContext(template, overrides = {}, cssOverrides = {}) {
    this.res.render(template, this.mergeOverrides(overrides, cssOverrides));
  }

  renderWithCallback(template, cb, overrides = {}, cssOverrides = {}) {
    let context = this.mergeOverrides(overrides, cssOverrides);
    this.res.logger.info(cb);
    context = cb(context);
    this.res.render(template, context);
  }

  renderGenericMessage(overrides = {}, cssOverrides = {}) {
    this.res.render(
      "pages/generic-message",
      this.mergeOverrides(overrides, cssOverrides),
    );
  }
}

module.exports = async (req, res, next) => {
  await new BaseContextManager(req, res, next).init();
};
