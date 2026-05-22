const fs = require("fs");
const path = require("path");
const { parse } = require("smol-toml");
const os = require("os");
const { PathNotFoundError } = require("../utils/errors.js");
const {
  validatePath,
  validateExplicitPath,
} = require("../utils/validation.js");
const FALLBACK_ROOT_DIR = path.resolve("./");

/**
 * Validates and resolves an explicit configuration path.
 * @param {string} rawPath - The raw path string from CLI or ENV.
 * @param {string} sourceName - The name of the source for error reporting.
 * @returns {{ path: string, isExplicit: true }}
 * @throws {Error} If the path does not exist.
 */

/**
 * Resolves the configuration file path based on priority.
 * Fallbacks include XDG standard paths and hidden home directory files.
 * @returns {{ path: string, isExplicit: boolean }}
 */
function resolveConfigPath(rootDir = FALLBACK_ROOT_DIR) {
  // 1. CLI Argument Priority
  const cliPath = getCliArgument("--config");
  if (cliPath) return validateExplicitPath(cliPath, "CLI");

  // 2. Environment Variable Priority
  const envPath = process.env.CONFIG_PATH;
  if (envPath) return validateExplicitPath(envPath, "ENV");

  // 3. Implicit Fallbacks
  const implicitPath = getFirstExistingPath(FALLBACK_CONFIG_PATHS, rootDir);

  if (!implicitPath) {
    console.log(
      `No configuration found in searched paths: ${JSON.stringify(FALLBACK_CONFIG_PATHS)}. Using defaults.`,
    );
  }

  return { path: implicitPath, isExplicit: false };
}

/**
 * Extracts value from CLI arguments.
 */
function getCliArgument(flag) {
  const index = process.argv.indexOf(flag);
  const hasNextValue = index !== -1 && process.argv[index + 1];
  return hasNextValue ? process.argv[index + 1] : null;
}

/**
 * Returns the first path in an array that exists on the filesystem.
 */

function getFirstExistingPath(paths, rootDir = FALLBACK_ROOT_DIR) {
  for (const p of paths) {
    const resolvedPath = path.resolve(p);
    if (fs.existsSync(resolvedPath)) {
      return resolvedPath;
    }
  }
  return null;
}

function logError(key) {
  const toEnvVar = (key) => key.replace(/([A-Z])/g, "_$1").toUpperCase();

  const toConfigKey = (key) => key.replace(/([A-Z])/g, "_$1").toLowerCase();

  console.log(
    `Notice: ${key} is not set. Use env var ${toEnvVar(key)} or config key ${toConfigKey(key)}`,
  );
}

const FALLBACK_CONTENT_PATHS = [
  "/var/lib/expressjs-blog",
  path.join(os.homedir(), "share", "expressjs-blog"),
  path.join(FALLBACK_ROOT_DIR, "content"),
];

const FALLBACK_LOG_PATHS = [
  "/var/log/expressjs-blog",
  path.join(os.homedir(), "local", "state", "expressjs-blog", "logs"),
  path.join(FALLBACK_ROOT_DIR, "logs"),
];

console.log(FALLBACK_ROOT_DIR);
console.log(FALLBACK_LOG_PATHS);
console.log(getFirstExistingPath(FALLBACK_LOG_PATHS));

const FALLBACK_DB_PATHS = [
  "/var/lib/expressjs-blog/data",
  "/var/log/expressjs-blog/data",
  path.join(os.homedir(), "local", "state", "expressjs-blog", "data"),
  path.join(FALLBACK_ROOT_DIR, "data"),
];

const FALLBACK_CONFIG_PATHS = [
  path.join(os.homedir(), ".config", "expressjs-blog", "config.toml"), // XDG Compliance
  path.join(os.homedir(), ".expressjs-blog.toml"), // Hidden Home file
  "/etc/expressjs-blog/config.toml", // Global
  "./config.toml",
];

function hydrate(c = {}) {
  let rootDir = process.env.ROOT_DIR || c?.meta?.root_dir || FALLBACK_ROOT_DIR;
  const paths = {
    rootDir,
    logDir:
      process.env.LOG_DIR ||
      c?.logging?.log_dir ||
      getFirstExistingPath(FALLBACK_LOG_PATHS, rootDir) ||
      FALLBACK_LOG_PATHS.at(-1),
    dbPath:
      process.env.LOGGING_DB_PATH ||
      c?.logging?.db_path ||
      getFirstExistingPath(FALLBACK_DB_PATHS, rootDir) ||
      FALLBACK_DB_PATHS.at(-1),
    contentPath:
      process.env.CONTENT_PATH ||
      c?.meta?.content_path ||
      getFirstExistingPath(FALLBACK_CONTENT_PATHS, rootDir),
  };

  console.log(`[DEBUG_DB_PATHS] ${JSON.stringify(FALLBACK_DB_PATHS)}`);
  console.log(`[DEBUG_ENV] ${JSON.stringify(paths)}`);

  [paths.logDir, paths.dbPath]
    .filter((dir) => !fs.existsSync(dir))
    .forEach((dir) => {
      fs.mkdirSync(dir, { recursive: true });
    });

  Object.entries(paths).forEach(([key, p]) => {
    if (!key) {
      throw new Error(
        `Unexpected behavior: path key '${key}' is not a valid key for value '${p}' `,
      );
    }
    if (!p) {
      logError(key);
      return;
    }
    paths[key] = path.resolve(p);
    validatePath(paths[key], key);
  });

  const { logDir, dbPath, contentPath } = paths;
  if (dbPath === FALLBACK_ROOT_DIR) {
    console.warn(
      `Using fallback root dir "${FALLBACK_ROOT_DIR}". This may be a potential security risk.`,
    );
  }
  rootDir = paths.rootDir;

  const schema = process.env.SERVER_SCHEMA || c?.network?.schema || "http";
  const domain = process.env.SERVER_DOMAIN || c?.network?.domain || "localhost";
  const address =
    process.env.SERVER_ADDRESS || c?.network?.address || "0.0.0.0";
  const port = process.env.SERVER_PORT || c?.network?.port || 3400;
  const basePath = process.env.SERVER_BASE_PATH || c?.network?.base_path || "";
  const publicSchema = process.env.PUBLIC_SCHEMA || c?.public?.schema || schema;
  const fallbackPort =
    publicSchema == "http" ? 80 : publicSchema == "https" ? 443 : port;
  const publicPort = process.env.PUBLIC_PORT || c?.public?.port || fallbackPort;

  return {
    views: process.env.HANDLEBARS_VIEWS || c?.handlebars?.views || [],
    meta: {
      node_env: process.env.NODE_ENV || c?.meta?.node_env || "development",
      site_owner: process.env.SITE_OWNER || c?.meta?.site_owner || undefined,
      country: process.env.COUNTRY || c?.meta?.country || undefined,
      rootDir,
      content: contentPath,
    },
    logging: {
      logDir,
      logLevel: c?.logging?.log_level || process.env.LOG_LEVEL || "info",
      dbPath,
      getDBFile(file = "storage.db") {
        console.log("[DEBUG_PATH]", dbPath, file);
        return path.join(dbPath, file);
      },
    },
    // For constructing URL's
    public: {
      basePath: process.env.PUBLIC_BASE_PATH || c?.public?.base_path || "",
      schema: publicSchema,
      port: publicPort,
      domain: process.env.PUBLIC_DOMAIN || c?.public?.domain || domain,
      address: process.env.PUBLIC_ADDRESS || c?.public?.address || address,
    },
    // For bootstrap
    network: {
      domain,
      address,
      schema,
      port,
      basePath,
    },
    auth: {
      enabled: process.env.AUTH_ENABLE || c?.auth?.enable || false,
      verify: process.env.AUTH_VERIFY || c?.auth?.verify || null,
      login: process.env.AUTH_LOGIN || c?.auth?.login || null,
      cache_ttl:
        parseInt(process.env.AUTH_CACHE_TTL, 10) ||
        c?.auth?.cache_ttl ||
        120000,
      timeout_ms: process.env.AUTH_TIMEOUT_MS || c?.auth?.timeout_ms || 5000,
    },
    session: {
      cookie: {
        secure:
          process.env.SESSION_COOKIE_SECURE ||
          c?.session?.cookie?.secure ||
          true, // Required since you are using HTTPS via Nginx
        sameSite:
          process.env.SESSION_COOKIE_SAME_SITE ||
          c?.session?.cookie?.sameSite ||
          "Lax", // Allows the cookie to be sent on the top-level redirect back
        domain:
          process.env.SESSION_COOKIE_DOMAIN ||
          c?.session?.cookie?.domain ||
          domain, // Ensures the cookie is visible across subdomains
      },
    },
    mail: {
      secure: process.env.MAIL_SECURE || c?.mail?.secure || false,
      auth: process.env.MAIL_AUTH || c?.mail?.auth || null,
      domain: process.env.MAIL_DOMAIN || c?.mail?.domain || domain,
      host: process.env.MAIL_HOST || c?.mail?.host || domain,
      port: process.env.MAIL_PORT || c?.mail?.port || 1025,
      newsletter:
        process.env.MAIL_NEWSLETTER ||
        c?.mail?.newsletter ||
        `newsletter@${domain}`,
      pass: process.env.MAIL_PASS || c?.mail?.pass || null,
    },
    hcaptcha: {
      secret: process.env.HCAPTCHA_SECRET || c?.hcaptcha?.secret || null,
      key: process.env.HCAPTCHA_KEY || c?.hcaptcha?.key || null,
    },
  };
}
function loadConfig() {
  // Use a simple flag parser (e.g., --config)
  const configIdx = process.argv.indexOf("--config");
  let configPath = resolveConfigPath().path;

  try {
    let toml_config = {};
    if (configPath) {
      const raw = fs.readFileSync(path.resolve(configPath), "utf8");
      toml_config = parse(raw);
    }
    const config = hydrate(toml_config);
    const include = function (file) {
      if (!this.meta.content) {
        console.log(FALLBACK_CONTENT_PATHS);
        throw new Error("Content path is not set");
      }
      const fullPath = path.join(this.meta.content, file);
      const resolved = path.resolve(fullPath);
      return require(resolved);
    }.bind(config);
    config.include = include;
    config.routes = include("routes.js");

    return config;
  } catch (err) {
    console.error(`Failed to load config at ${configPath}:`, err.stack);
    process.exit(1);
  }
}

const config = loadConfig();
console.log("--------------------------------------------------");
console.log("------------------CONFIGURATION-------------------");
console.log("--------------------------------------------------");
console.log(config);
module.exports = config;
