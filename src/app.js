// src/app.js
//
// Bootstrap order:
//   1. Schema composition  — mergeSchemas() before anything else loads
//   2. Config load         — createLoader() validates and resolves all values
//   3. Infrastructure      — logger, mailer, security built from cfg
//   4. Blog engine         — createBlog() receives infra as injected deps
//   5. Express             — middleware, mount, listen

import express from "express";
import crypto from "node:crypto";
import path from "node:path";

import {
  baseSchema,
  mergeSchemas,
  createLoader,
  buildBaseUrl,
} from "@jpoage1/config";
import { securitySchema } from "@jpoage1/security/schema.js";
import { mailerSchema } from "@jpoage1/mailer/schema.js";

const appSchema = mergeSchemas(baseSchema, securitySchema, mailerSchema);

const cfg = createLoader(appSchema);

const meta = cfg.get("meta");
const network = cfg.get("network");
const logging = cfg.get("logging");
const mail = cfg.get("mail");
const baseUrl = buildBaseUrl(cfg.get("public"));

function createAnonymousSession(req, res, next) {
  if (!res.locals.session) {
    res.locals.session = {
      nonce: crypto.randomBytes(16).toString("base64"),
      isAuthenticated: false,
      user: null,
      groups: [],
    };
  }

  next();
}

function resolveNewsletterFile(mailLogPath) {
  const dataDir = path.dirname(mailLogPath);
  if (dataDir.includes("/node_packages/")) {
    return path.resolve("data/newsletter-emails.json");
  }

  return path.join(dataDir, "newsletter-emails.json");
}

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
  newsletterFile: resolveNewsletterFile(mail.log_path),

  verbose: logging.verbose,

  logger: infra.logger,
  mailer: infra.mailer,
  security: infra.security,

  features: {
    docs: true,
  },

  contentRoutes: {
    constructionRoutes: [
      { path: "/changelog", title: "Changelog" },
      { path: "/archive", title: "Archive" },
      { path: "/", title: "Home" },
    ],
    markdownRoutes: [
      { path: "/tools", file: "tools", params: "tools" },
      { path: "/about/me", file: "about-me" },
      { path: "/about/blog", file: "projects/about-blog" },
    ],
    htmlRoutes: [{ path: "/games/word-guesser", contentFolder: "word-guesser" }],
    projects: [
      { path: "/projects/lisp-interpreter", file: "projects/lisp_interpreter" },
      { path: "/projects/pipeline-runner", file: "projects/pipeline_runner" },
      { path: "/projects/telemetry", file: "projects/telemetry" },
      { path: "/projects/xmonad", file: "projects/xmonad" },
      { path: "/projects/word-guesser", file: "projects/word-guesser" },
    ],
    router: contentRouter,
    redirects: cfg.get("redirection"),
  },
});

const app = express();

app.use(createStaticAssets());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(createAnonymousSession);
app.use(trace);

if (meta.node_env === "production" || meta.node_env === "testing") {
  app.use(infra.applyProductionSecurity);
}

blog.mount(app);

const server = app.listen(network.port, network.address, () => {
  infra.logger.info(`Blog listening on ${baseUrl} (${meta.node_env})`);
});

export { app, server };
