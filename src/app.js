// src/app.js
//
// Bootstrap order:
//   1. Schema composition  — mergeSchemas() before anything else loads
//   2. Config load         — createLoader() validates and resolves all values
//   3. Infrastructure      — logger, mailer, security, auth built from cfg
//   4. Blog engine         — createBlog() receives infra as injected deps
//   5. Express             — middleware, mount, listen

import express from "express";

import {
  baseSchema,
  mergeSchemas,
  createLoader,
  buildBaseUrl,
} from "@jpoage1/config";
import { securitySchema } from "@jpoage1/security/schema.js";
import { authSchema } from "@jpoage1/auth/schema.js";
import { mailerSchema } from "@jpoage1/mailer/schema.js";

const appSchema = mergeSchemas(baseSchema, securitySchema, authSchema, mailerSchema);

const cfg = createLoader(appSchema);

const meta = cfg.get("meta");
const network = cfg.get("network");
const logging = cfg.get("logging");
const baseUrl = buildBaseUrl(cfg.get("public"));

import { createInfrastructure } from "./modules/infrastructure.js";
const infra = createInfrastructure(cfg, baseUrl);

import { createContentRouter } from "./modules/contentRouter.js";
const contentRouter = createContentRouter({
  cspDirectives: infra.cspDirectives,
  securityPolicy: infra.securityPolicy,
  domain: cfg.get("public").domain,
});

import { createBlog, createStaticAssets } from "@jpoage1/expressjs-blog";
import { trace } from "@jpoage1/middleware";

const blog = createBlog({
  contentPath: meta.content_path,
  baseUrl,
  node_env: meta.node_env,
  siteOwner: meta.site_owner,
  country: meta.country,
  endpoints: cfg.get("endpoints"),
  hcaptchaKey: cfg.get("hcaptcha").key,

  verbose: logging.verbose,
  _oidcIssuer: cfg.get("auth").enabled
    ? cfg.get("auth").oidc.issuer_base_url
    : null,

  logger: infra.logger,
  mailer: infra.mailer,
  security: infra.security,
  generateToken: infra.generateToken,
  evaluateRules: infra.evaluateRules,

  features: {
    docs: true,
  },

  contentRoutes: {
    constructionRoutes: [
      { path: "/changelog", title: "Changelog" },
      { path: "/archive", title: "Archive" },
      { path: "/", title: "Home" },
    ],
    markdownRoutes: [{ path: "/about/blog", file: "projects/about-blog" }],
    htmlRoutes: [],
    router: contentRouter,
    redirects: cfg.get("redirection"),
  },
});

const app = express();

app.use(createStaticAssets());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(trace);

if (meta.node_env === "production" || meta.node_env === "testing") {
  app.use(infra.applyProductionSecurity);
}
app.use(infra.oidcMiddleware);
app.use(infra.authCheck);

blog.mount(app);

app.listen(network.port, network.address, () => {
  infra.logger.info(`Blog listening on ${baseUrl} (${meta.node_env})`);
});
