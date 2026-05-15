const fs = require("fs");
const path = require("path");
const { parse } = require("smol-toml");

DEFAULT_CONFIG_PATH = "config.toml";

function hydrate(c = {}) {
  const schema = process.env.SERVER_SCHEMA || c?.network?.schema || "http";
  const domain = process.env.SERVER_DOMAIN || c?.network?.domain || "localhost";
  const address = process.env.ADDRESS || c?.network?.address || "0.0.0.0";
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
  let configPath = configIdx !== -1 ? process.argv[configIdx + 1] : null;

  if (!configPath) {
    console.info("Notice: No config file provided. Use --config <path>");
    console.info("  Using defaults");
    configPath = DEFAULT_CONFIG_PATH;
    let toml_config = {};
    try {
      const raw = fs.readFileSync(path.resolve(configPath), "utf8");
      const toml_config = parse(raw);
      return hydrate(toml_config);
    } catch (e) {
      console.warn("Warning: ", e.stack);
      return hydrate(toml_config);
    }
  }

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
