const path = require("path");
const {
  createBaseContext,
  createHbsEngine,
  applyHbsToApp,
} = require("@jpoage1/base-context");
const { getPostsMenu } = require("#services/postsMenuService.js");
const config = require("#config");

const hbs = createHbsEngine({
  layoutsDirs: [path.join(__dirname, "../views/layouts")],
  partialsDirs: [path.join(__dirname, "../views/partials")],
});

const navLinksPath = path.join(
  config.meta.content ?? "",
  "config/navLinks.json",
);
let navLinks;
try {
  navLinks = require(navLinksPath);
} catch (e) {
  console.warn(`navLink.js or navLinks.json not found at: ${navLinksPath}`);
}
const baseContextMiddleware = createBaseContext({
  navLinks: navLinks,
  baseUrl: config.public.baseUrl,
  basePath: config.public.basePath || "",
  siteOwner: config.meta.site_owner,
  siteTitle: config.meta.site_owner
    ? `${config.meta.site_owner}'s Software Blog`
    : "Blog",
  country: config.meta.country,
  hcaptchaKey: config.meta.hcaptcha_key,
  node_env: config.meta.node_env,
  endpoints: config.endpoints,
  bypass: {
    user: config.testing.username,
    group: config.testing.group,
  },
  getSidebarData: () =>
    getPostsMenu(
      path.join(config.meta.content, "posts"),
      config.public.baseUrl,
    ),
});

module.exports = { hbs, baseContextMiddleware, applyHbsToApp };
