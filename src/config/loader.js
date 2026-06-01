"use strict";

/**
 * src/config/loader.js
 *
 * Single config entry point. Replaces:
 *   - src/config/defaults.js       (fallback values now live in schema.cjs)
 *   - src/config/index.js          (the half-finished class refactor)
 *   - src/config/securityConfig.js (values now in convict schema + config.toml)
 *   - src/config/logging.js        (getLogConfig is now a helper here)
 *
 * Load order (highest priority wins):
 *   1. Environment variables  (BLOG_* / standard names per schema)
 *   2. config.toml            (path resolved via CLI --config or env CONFIG_PATH)
 *   3. Schema defaults        (schema.cjs)
 */

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const convict = require("convict");
const { parse } = require("smol-toml");

const schema = require("./schema.cjs");
const { buildBaseUrl } = require("#utils/baseUrl.js");

// ─────────────────────────────────────────────────────────────────────────────
// 1. Build convict instance
// ─────────────────────────────────────────────────────────────────────────────

const cfg = convict(schema);

// ─────────────────────────────────────────────────────────────────────────────
// 2. Locate and load config.toml
// ─────────────────────────────────────────────────────────────────────────────

function resolveConfigPath() {
  // Priority: --config CLI flag → CONFIG_PATH env → fallback search
  const cliIdx = process.argv.indexOf("--config");
  if (cliIdx !== -1 && process.argv[cliIdx + 1]) {
    return process.argv[cliIdx + 1];
  }
  if (process.env.CONFIG_PATH) {
    return process.env.CONFIG_PATH;
  }

  const candidates = [
    path.join(os().homedir(), ".config", "expressjs-blog", "config.toml"),
    path.join(os().homedir(), ".expressjs-blog.toml"),
    "/etc/expressjs-blog/config.toml",
    path.join(__dirname, "..", "..", "config.toml"),
  ];

  return candidates.find((p) => fs.existsSync(p)) ?? null;
}

// lazy require os only when needed
function os() {
  return require("os");
}

const configFilePath = resolveConfigPath();

if (configFilePath) {
  try {
    const raw = fs.readFileSync(path.resolve(configFilePath), "utf8");
    const toml = parse(raw);
    // convict.load() does a deep merge — env vars applied after still win
    cfg.load(toml);
  } catch (err) {
    console.error(`[config] Failed to load ${configFilePath}: ${err.message}`);
    // Non-fatal: fall through to defaults + env
  }
} else {
  console.log(
    "[config] No config.toml found. Using defaults and environment variables.",
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Validate
// ─────────────────────────────────────────────────────────────────────────────

try {
  cfg.validate({ allowed: "warn" });
  // 'warn' = unknown keys in TOML emit a warning instead of throwing.
  // Change to 'strict' once you've audited your config.toml.
} catch (err) {
  console.error("[config] Validation failed:", err.message);
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Derive computed values
//    Convict doesn't support computed fields natively, so we resolve them here
//    once after validation — same pattern as the old hydrate().
// ─────────────────────────────────────────────────────────────────────────────

const _pub = cfg.get("public");
const _net = cfg.get("network");

/** Build the pg connection config from db.url or individual fields. */
function buildDbCredentials() {
  const db = cfg.get("db");
  if (db.url) return { connectionString: db.url, max: db.pool_max };
  return {
    host: db.host,
    port: db.port,
    database: db.database,
    user: db.user,
    password: db.password,
    max: db.pool_max,
  };
}

/** Ensure log directories exist, creating them if needed. */
function ensureLogDirs() {
  const logDir = cfg.get("logging.log_dir");
  // const dbPath = cfg.get("logging.db_path");
  for (const dir of [
    logDir,
    // dbPath,
  ]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  return logDir;
}

/** Build the logging config block consumed by winston setup. */
function buildLogConfig(logDir) {
  const sessionTimestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const sessionDir = path.join(logDir, "sessions", sessionTimestamp);
  const logging = cfg.get("logging");

  return {
    logDir,
    sessionDir,
    sessionTimestamp,
    logLevel: logging.log_level,
    customLevels: {
      levels: logging.levels,
      colors: logging.colors,
    },
    LOG_LEVELS: logging.levels,
    logFiles: {
      session: path.join(sessionDir, "session.log"),
      info: path.join(logDir, "info", "info.log"),
      notice: path.join(logDir, "notice", "notice.log"),
      error: path.join(logDir, "error", "error.log"),
      warn: path.join(logDir, "warn", "warn.log"),
      event: path.join(logDir, "event", "event.log"),
      security: path.join(logDir, "security", "security.log"),
      debug: path.join(logDir, "debug", "debug.log"),
      analytics: path.join(logDir, "debug", "analytics.log"),
    },
    // getDBFile(file = "storage.db") {
    //   return path.join(cfg.get("logging.db_path"), file);
    // },
    // These two blocks are consumed directly by streams.js.
    // Key names use camelCase to match what the old defaults.js exported
    // so streams.js keeps working without changes.
    session: {
      filename: logging.session.filename,
      datePattern: logging.session.date_pattern,
      zippedArchive: logging.session.zipped_archive,
      maxFiles: logging.session.max_files,
    },
    dailyRotate: {
      datePattern: logging.daily_rotate.date_pattern,
      zippedArchive: logging.daily_rotate.zipped_archive,
      maxFiles: logging.daily_rotate.max_files,
      filenameSuffix: logging.daily_rotate.filename_suffix,
    },
    prettyPrint: {
      colors: true,
      depth: null,
      breakLength: 80,
      compact: false,
    },
  };
}

/** Build CSP directives, appending the computed base URL and auth domain. */
function buildCspDirectives(baseUrl) {
  const csp = cfg.get("security.csp");
  const authDomain = cfg.get("security.auth_domain");

  const connectSrc = [...csp.connect_src];
  if (authDomain && !connectSrc.includes(authDomain)) {
    connectSrc.push(authDomain);
  }

  return {
    defaultSrc: [...csp.default_src, baseUrl],
    scriptSrc: csp.script_src,
    styleSrc: csp.style_src,
    imgSrc: csp.img_src,
    frameSrc: csp.frame_src,
    objectSrc: ["'none'"],
    upgradeInsecureRequests: [],
    connectSrc,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Assemble and export
// ─────────────────────────────────────────────────────────────────────────────

const logDir = ensureLogDirs();
const baseUrl = buildBaseUrl(_pub);
const logging = buildLogConfig(logDir);

const config = {
  // Raw convict instance — use config.get('some.key') for validated access
  _convict: cfg,

  // ── Convenience mirrors (matching the old loader.js shape) ─────────────
  // These let existing consumers keep working without changes.

  meta: {
    node_env: cfg.get("meta.node_env"),
    site_owner: cfg.get("meta.site_owner"),
    country: cfg.get("meta.country"),
    rootDir: cfg.get("meta.root_dir"),
    root_dir: cfg.get("meta.root_dir"), // snake_case alias
    content: cfg.get("meta.content_path"),
    content_path: cfg.get("meta.content_path"),
    hcaptcha_key: cfg.get("hcaptcha.key"), // template engines read this off meta
  },

  network: {
    schema: _net.schema,
    domain: _net.domain,
    address: _net.address,
    port: _net.port,
    basePath: _net.base_path,
    base_path: _net.base_path,
  },

  public: {
    baseUrl,
    schema: _pub.schema,
    domain: _pub.domain,
    address: _pub.address,
    port: _pub.port,
    basePath: _pub.base_path,
    base_path: _pub.base_path,
  },

  // Database
  db: cfg.get("db"),
  dbUrl: cfg.get("db.url"),
  dbCredentials: buildDbCredentials(),

  // Auth
  auth: cfg.get("auth"),

  // Session — keep sameSite camelCase for express-openid-connect compat
  session: {
    cookie: {
      secure: cfg.get("session.cookie.secure"),
      sameSite: cfg.get("session.cookie.same_site"),
      domain: cfg.get("session.cookie.domain"),
    },
  },

  // Mail — camelCase aliases for nodemailer compat
  mail: {
    ...cfg.get("mail"),
    defaultSubject: cfg.get("mail.default_subject"),
    logPath: cfg.get("mail.log_path"),
  },

  // hCaptcha
  hcaptcha: cfg.get("hcaptcha"),

  // Logging — full block consumed by winston setup, consolePatch, logManager
  logging,

  // Security — replaces securityConfig.js
  security: {
    LOCALHOST_HOSTNAMES: ["127.0.0.1", "localhost"],
    HEALTHCHECK_METHOD: "HEAD",
    HEALTHCHECK_PATH: cfg.get("meta.health_check"),
    FORBIDDEN_MESSAGE: "Forbidden",
    FORBIDDEN_STATUS_CODE: 403,
    HSTS_MAX_AGE: cfg.get("security.hsts_max_age"),
    CSP_DIRECTIVES: buildCspDirectives(baseUrl),
  },

  // Endpoints
  endpoints: cfg.get("endpoints"),

  // Cleanup thresholds — logManager reads these
  cleanup: cfg.get("cleanup"),

  // Testing bypass
  testing: cfg.get("testing"),

  // Views (handlebars extra views) — kept for hbs.js compat
  views: [],

  // ── Routes + include() — loaded after config is stable ─────────────────
  // Populated by loadRoutes() below; kept null until then.
  routes: null,
  include: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. Routes loader  (identical logic to the old loadConfig, isolated here)
// ─────────────────────────────────────────────────────────────────────────────

function include(file) {
  const contentPath = this.meta.content;
  if (!contentPath) throw new Error("[config] meta.content_path is not set");
  const resolved = path.resolve(path.join(contentPath, file));
  try {
    return require(resolved);
  } catch (err) {
    throw new Error(
      `[config] Failed to include module "${file}": ${err.message}`,
      { cause: err },
    );
  }
}

config.include = include.bind(config);

// ─────────────────────────────────────────────────────────────────────────────
// 7. Debug dump (mirrors old console.log block, respects log level)
// ─────────────────────────────────────────────────────────────────────────────

if (cfg.get("meta.node_env") === "development") {
  // Redact sensitive fields before printing
  const safe = cfg.getProperties();
  [
    "db.password",
    "db.url",
    "mail.pass",
    "mail.auth",
    "hcaptcha.secret",
  ].forEach((k) => {
    const parts = k.split(".");
    let obj = safe;
    parts.slice(0, -1).forEach((p) => {
      obj = obj?.[p];
    });
    if (obj) obj[parts.at(-1)] = "[REDACTED]";
  });
  console.log("──────────────────────────────────────────");
  console.log("           CONFIGURATION LOADED           ");
  console.log("──────────────────────────────────────────");
  console.log(JSON.stringify(safe, null, 2));
}

module.exports = config;
