const fs = require("fs");
const path = require("path");
const { parse } = require("smol-toml");
const os = require("os");

/**
 * Validates and resolves an explicit configuration path.
 * @param {string} rawPath - The raw path string from CLI or ENV.
 * @param {string} sourceName - The name of the source for error reporting.
 * @returns {{ path: string, isExplicit: true }}
 * @throws {Error} If the path does not exist.
 */
function validateExplicitPath(rawPath, sourceName) {
  const resolved = path.resolve(rawPath);

  if (!fs.existsSync(resolved)) {
    throw new Error(
      `Explicit ${sourceName} config path does not exist: ${resolved}`,
    );
  }

  return { path: resolved, isExplicit: true };
}

/**
 * Resolves the configuration file path based on priority.
 * Fallbacks include XDG standard paths and hidden home directory files.
 * @returns {{ path: string, isExplicit: boolean }}
 */
function resolveConfigPath() {
  // 1. CLI Argument Priority
  const cliPath = getCliArgument("--config");
  if (cliPath) return validateExplicitPath(cliPath, "CLI");

  // 2. Environment Variable Priority
  const envPath = process.env.CONFIG_PATH;
  if (envPath) return validateExplicitPath(envPath, "Environment");

  // 3. Implicit Fallbacks
  const tryPaths = [
    path.join(os.homedir(), ".config", "express-blog", "config.toml"), // XDG Compliance
    path.join(os.homedir(), ".express-blog.toml"), // Hidden Home file
    "/etc/express-blog/config.toml", // Global
    path.resolve("./config.toml"), // Local CWD
  ];

  const implicitPath = getFirstExistingPath(tryPaths);

  if (!implicitPath) {
    throw new Error(
      `No configuration found in searched paths: ${JSON.stringify(tryPaths)}`,
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
function getFirstExistingPath(paths) {
  return paths.find((p) => fs.existsSync(p)) || null;
}

function hydrate(c = {}) {
  const schema = process.env.SERVER_SCHEMA || c?.network?.schema || "http";
  const domain = process.env.SERVER_DOMAIN || c?.network?.domain || "localhost";
  const address =
    process.env.SERVER_ADDRESS || c?.network?.address || "0.0.0.0";
  const port = process.env.SERVER_PORT || c?.network?.port || 3400;
  const logDir = process.env.LOG_DIR || c?.logging?.log_dir;
  const dbPath = process.env.LOGS_DB_PATH || c?.logging?.db_path;

  if (logDir == undefined) {
    throw new Error("Log dir is undefined");
  }

  return {
    meta: {
      node_env: process.env.NODE_ENV || c?.meta?.node_env || "development",
      site_owner: process.env.SITE_OWNER || c?.meta?.site_owner || undefined,
      country: process.env.COUNTRY || c?.meta?.country || undefined,
      rootDir: process.env.ROOT_DIR || c?.meta?.root_dir,
    },
    logging: {
      logDir,
      logLevel: c?.logging?.log_level || process.env.LOG_LEVEL || "info",
      dbPath,
      getDBFile: (file) => path.join(dbPath, file),
    },
    public: {
      schema: process.env.SERVER_SCHEMA || c?.public?.schema || schema,
      port: process.env.SERVER_PORT || c?.public?.port || port,
      domain: process.env.SERVER_DOMAIN || c?.public?.domain || domain,
      address: process.env.SERVER_ADDRESS || c?.public?.address || address,
    },
    network: {
      domain,
      address,
      schema,
      port,
    },
    auth: {
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
    const raw = fs.readFileSync(path.resolve(configPath), "utf8");
    const toml_config = parse(raw);
    return hydrate(toml_config);
  } catch (err) {
    console.error(`Failed to load config at ${configPath}:`, err.stack);
    process.exit(1);
  }
}

const config = loadConfig();
module.exports = config;
