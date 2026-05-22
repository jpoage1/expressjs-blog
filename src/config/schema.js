import JSONConfigParser from "./jsConfigLoader/jsonConfig.js";
import jsonSettings from "../../config.json";

const makeSchema = () => ([
  {
    positional: true,
    internal: true,
    flags: "config",
    key: "config",
    type: "file",
    position: 0,
    description: "The path to the configuration",
    defaultValue: "config.toml",
  },
  { flags: "--root-dir <dir>", description: "Root directory", type: "directory", key: "root_dir" },
  { flags: "--content-path <dir>", description: "Content directory", type: "directory", key: "content_path" },
  { flags: "--log-dir <dir>", description: "Log directory", type: "directory", key: "log_dir" },
  { flags: "--db-path <dir>", description: "Database path", type: "directory", key: "db_path" },
  { flags: "--log-level <level>", description: "Logging level", type: "string", key: "log_level" },
  { flags: "--server-schema <schema>", description: "Server schema (http/https)", type: "string", key: "server_schema" },
  { flags: "--server-domain <domain>", description: "Server domain", type: "string", key: "server_domain" },
  { flags: "--server-address <address>", description: "Server address", type: "string", key: "server_address" },
  { flags: "--server-port <port>", description: "Server port", type: "int", key: "server_port" },
  { flags: "--server-base-path <path>", description: "Server base path", type: "string", key: "server_base_path" },
  { flags: "--public-schema <schema>", description: "Public schema", type: "string", key: "public_schema" },
  { flags: "--public-port <port>", description: "Public port", type: "int", key: "public_port" },
  { flags: "--public-domain <domain>", description: "Public domain", type: "string", key: "public_domain" },
  { flags: "--public-address <address>", description: "Public address", type: "string", key: "public_address" },
  { flags: "--public-base-path <path>", description: "Public base path", type: "string", key: "public_base_path" },
  { flags: "--node-env <env>", description: "Node environment", type: "string", key: "node_env" },
  { flags: "--site-owner <owner>", description: "Site owner", type: "string", key: "site_owner" },
  { flags: "--country <country>", description: "Country code", type: "string", key: "country" },
  { flags: "--auth-enable", description: "Enable authentication", type: "bool", key: "auth_enable" },
  { flags: "--auth-verify <path>", description: "Auth verification path", type: "string", key: "auth_verify" },
  { flags: "--auth-login <path>", description: "Auth login path", type: "string", key: "auth_login" },
  { flags: "--auth-cache-ttl <ms>", description: "Auth cache TTL in ms", type: "int", key: "auth_cache_ttl" },
  { flags: "--auth-timeout-ms <ms>", description: "Auth timeout in ms", type: "int", key: "auth_timeout_ms" },
  { flags: "--session-cookie-secure", description: "Secure session cookie", type: "bool", key: "session_cookie_secure" },
  { flags: "--session-cookie-same-site <value>", description: "Session cookie SameSite policy", type: "string", key: "session_cookie_same_site" },
  { flags: "--session-cookie-domain <domain>", description: "Session cookie domain", type: "string", key: "session_cookie_domain" },
  { flags: "--mail-secure", description: "Secure mail transport", type: "bool", key: "mail_secure" },
  { flags: "--mail-auth <auth>", description: "Mail authentication string", type: "string", key: "mail_auth" },
  { flags: "--mail-domain <domain>", description: "Mail domain", type: "string", key: "mail_domain" },
  { flags: "--mail-host <host>", description: "Mail host", type: "string", key: "mail_host" },
  { flags: "--mail-port <port>", description: "Mail port", type: "int", key: "mail_port" },
  { flags: "--mail-newsletter <email>", description: "Newsletter return address", type: "string", key: "mail_newsletter" },
  { flags: "--mail-pass <pass>", description: "Mail password", type: "string", key: "mail_pass" },
  { flags: "--hcaptcha-secret <secret>", description: "hCaptcha secret", type: "string", key: "hcaptcha_secret" },
  { flags: "--hcaptcha-key <key>", description: "hCaptcha key", type: "string", key: "hcaptcha_key" }
]);

export const schema = makeSchema();

export const configDefaults = {
  key: "blog",
  mappings: {
    "root_dir": "meta.root_dir",
    "content_path": "meta.content_path",
    "node_env": "meta.node_env",
    "site_owner": "meta.site_owner",
    "country": "meta.country",
    "log_dir": "logging.log_dir",
    "log_level": "logging.log_level",
    "db_path": "logging.db_path",
    "server_schema": "network.schema",
    "server_domain": "network.domain",
    "server_address": "network.address",
    "server_port": "network.port",
    "server_base_path": "network.base_path",
    "public_schema": "public.schema",
    "public_port": "public.port",
    "public_domain": "public.domain",
    "public_address": "public.address",
    "public_base_path": "public.base_path",
    "auth_enable": "auth.enabled",
    "auth_verify": "auth.verify",
    "auth_login": "auth.login",
    "auth_cache_ttl": "auth.cache_ttl",
    "auth_timeout_ms": "auth.timeout_ms",
    "session_cookie_secure": "session.cookie.secure",
    "session_cookie_same_site": "session.cookie.sameSite",
    "session_cookie_domain": "session.cookie.domain",
    "mail_secure": "mail.secure",
    "mail_auth": "mail.auth",
    "mail_domain": "mail.domain",
    "mail_host": "mail.host",
    "mail_port": "mail.port",
    "mail_newsletter": "mail.newsletter",
    "mail_pass": "mail.pass",
    "hcaptcha_secret": "hcaptcha.secret",
    "hcaptcha_key": "hcaptcha.key"
  }
};

const staticConfig = new JSONConfigParser({
  defaults: configDefaults,
  settings: jsonSettings
});

export function getDefaults(map) {
  return map.reduce((acc, opt) => {
    if (opt.defaultValue !== undefined) {
      acc[opt.key] = opt.defaultValue;
    }
    return acc;
  }, {});
}

export const defaultSettings = getDefaults(schema);

export default {
  defaultSettings, staticConfig, schema
};
