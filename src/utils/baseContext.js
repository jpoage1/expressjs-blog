// src/utils/baseContext.js
const path = require("path");
const getPostsMenu = require("#services/postsMenuService.js");
const { formatMonth } = require("#utils/formatMonth.js");
const { qualifyNavLinks, qualifyLink } = require("#utils/qualifyLinks.js");
const { getBaseUrl } = require("#utils/baseUrl.js");

const processMenuLinks = require("#utils/processMenuLinks.js");
const { generateToken } = require("#utils/adminToken.js");
const config = require("#config");
const { meta } = config;
const navLinks = require(path.join("##config/navLinks.json"));

const getSiteTitle = (owner) => `${owner}'s Software Blog`;

const POSTS_DIR = path.join(meta.content, "/posts");

class BaseContextManager {
  constructor(req, res, next) {
    this.basePath = "";
    this.baseUrl = config.public.baseUrl;
    this.req = req;
    this.res = res;
    this.next = next;
    this.isPaper = req.query.view == "print";
    req.getBaseContext = this.getBaseContext.bind(this);
    res.renderWithBaseContext = this.renderWithBaseContext.bind(this);
    res.renderWithCallback = this.renderWithCallback.bind(this);
    res.renderGenericMessage = this.renderGenericMessage.bind(this);
    res.cssOverride = this.cssOverride.bind(this);
    res.cssOverrideDefaults = this.cssOverrideDefaults.bind(this);
  }

  async init() {
    this.res.locals.basePath = this.getBasePath();
    this.res.locals.baseUrl = getBaseUrl({
      basePath: this.res.locals.basePath,
    });
    console.log(`basePath: ${this.res.locals.basePath}`);
    console.log(`baseUrl: ${this.res.locals.baseUrl}`);
    console.log(`port: ${config.public.port}`);
    console.log(`port: ${config.network.port}`);

    this.res.locals.qualifyLink = (path) =>
      qualifyLink(path, this.res.locals.baseUrl);

    const session = this.res.locals.session || {
      isAuthenticated: false,
      user: null,
      groups: [],
    };
    session.token = generateToken();
    this.baseContext = await this.getBaseContext(session, {});

    this.next();
  }

  getBasePath() {
    const basePath = this.req.headers["x-base-path"] || config.public.basePath;
    if (this.req.url.startsWith(basePath)) {
      // Strip the dynamic path so the router routes match correctly
      this.req.url = this.req.url.replace(basePath, "") || "/";
    }
    return basePath;
  }

  /**
   * Merges CSS class and style overrides with default values.
   * @param {Object} overrides - Object containing classes and styles to override.
   * @returns {Object} The merged CSS configuration object.
   */
  cssOverride(original, ...overridesList) {
    const css = {
      classes: { ...original.classes },
      styles: { ...original.styles },
    };

    overridesList.forEach((overrides) => {
      this.applyOverrides(css, overrides);
    });

    return css;
  }
  applyOverrides(target, overrides) {
    if (!overrides) {
      return;
    }

    target.classes = {
      ...target.classes,
      ...(overrides.classes || {}),
    };

    target.styles = {
      ...target.styles,
      ...(overrides.styles || {}),
    };
  }
  cssOverrideDefaults(...overridesList) {
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
    return this.cssOverride(defaults, ...overridesList);
  }

  getDefaultContext(view = "web") {
    const isPaper = view == "paper";
    return {
      showSidebar: false,
      showFooter: !isPaper,
      showHeader: !isPaper,
      viewType: view,
      css: this.cssOverrideDefaults(),
    };
  }

  async getBaseContext(session, overrides = {}) {
    const filteredNavLinks = processMenuLinks(navLinks, session, this.req.path);
    const qualifiedNavLinks = qualifyNavLinks(
      filteredNavLinks,
      this.res.locals.baseUrl,
    );
    const menu = await getPostsMenu(POSTS_DIR);
    const siteOwner = meta.site_owner;

    const context = {
      session: {
        ...session,
        groups: session,
      },
      title: getSiteTitle(siteOwner),
      siteOwner,
      originCountry: meta.country,
      hCaptchaKey: meta.hcaptcha_key,
      navLinks: qualifiedNavLinks,
      years: menu,
      formatMonth,
      basePath: this.res.locals.basePath,
      baseUrl: this.res.locals.baseUrl,
      isAuthenticated: session.isAuthenticated,
      endpoints: config.endpoints,
      userdata: session,
      node_env_dev: meta.node_env == "development",
      node_env_prod: meta.node_env != "development",
      ...this.getDefaultContext(this.req.query.view ?? "web"),
      ...overrides,
    };

    return context;
  }
  mergeOverrides(overrides = {}, cssOverrides = {}) {
    const css = this.cssOverride(
      this.baseContext?.css || { classes: {}, styles: {} },
      cssOverrides,
    );
    const context = {
      ...this.baseContext,
      ...overrides,
      css,
    };
    return context;
  }
  renderWithBaseContext(template, overrides = {}, cssOverrides = {}) {
    this.res.render(template, this.mergeOverrides(overrides, cssOverrides));
  }

  renderWithCallback(template, cb, overrides = {}, cssOverrides = {}) {
    let context = this.mergeOverrides(overrides, cssOverrides);
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
