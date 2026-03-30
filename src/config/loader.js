const fs = require("fs");
const path = require("path");
const { parse } = require("smol-toml");

function hydrate(c = {}) {
  const schema = c?.network?.schema || process.env.SERVER_SCHEMA || "http";
  const domain = c?.network?.domain || process.env.SERVER_DOMAIN || "localhost";
  const address = c?.network?.address || process.env.ADDRESS || "0.0.0.0";
  const port = c?.network?.port || process.env.SERVER_PORT || 3400;
  const logDir = c?.logging?.log_dir || process.env.LOG_DIR;
  const dbPath = c?.logging?.db_path || process.env.LOGS_DB_PATH;

  if (logDir == undefined) {
    throw new Error("Log dir is undefined");
  }

  return {
    meta: {
      node_env: c?.meta?.node_env || process.env.NODE_ENV || "development",
      site_owner: c?.meta?.site_owner || process.env.SITE_OWNER || undefined,
      country: c?.meta?.country || process.env.COUNTRY || undefined,
      rootDir: c?.meta?.root_dir || process.env.ROOT_DIR,
    },
    logging: {
      logDir,
      logLevel: c?.logging?.log_level || process.env.LOG_LEVEL || "info",
      dbPath,
      getDBFile: (file) => path.join(dbPath, file),
    },
    public: {
      schema: c?.public?.schema || process.env.SERVER_SCHEMA || schema,
      port: c?.public?.port || process.env.SERVER_PORT || port,
      domain: c?.public?.domain || process.env.SERVER_DOMAIN || domain,
      address: c?.public?.address || process.env.SERVER_ADDRESS || address,
    },
    network: {
      domain,
      address,
      schema,
      port,
    },
    auth: {
      verify: c?.auth?.verify || process.env.AUTH_VERIFY || null,
      login: c?.auth?.login || process.env.AUTH_LOGIN || null,
      cache_ttl:
        c?.auth?.cache_ttl ||
        parseInt(process.env.AUTH_CACHE_TTL, 10) ||
        120000,
      timeout_ms: c?.auth?.timeout_ms || process.env.AUTH_TIMEOUT_MS || 5000,
    },
    session: {
      cookie: {
        secure: true, // Required since you are using HTTPS via Nginx
        sameSite: "Lax", // Allows the cookie to be sent on the top-level redirect back
        domain: ".jasonpoage.com", // Ensures the cookie is visible across subdomains
      },
    },
    mail: {
      secure: c?.mail?.secure || process.env.MAIL_SECURE || false,
      auth: c?.mail?.auth || process.env.MAIL_AUTH || null,
      domain: c?.mail?.domain || process.env.MAIL_DOMAIN || "localhost",
      host: c?.mail?.host || process.env.MAIL_HOST || "localhost",
      port: c?.mail?.port || process.env.MAIL_PORT || 1025,
      newsletter:
        c?.mail?.newsletter ||
        process.env.MAIL_NEWSLETTER ||
        "newsletter@localhost",
      pass: c?.mail?.pass || null,
    },
    hcaptcha: {
      secret: c?.hcaptcha?.secret || process.env.HCAPTCHA_SECRET || null,
      key: c?.hcaptcha?.key || process.env.HCAPTCHA_KEY || null,
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
    configPath = "config.toml";
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
