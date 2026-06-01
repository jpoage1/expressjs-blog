"use strict";

/**
 * src/config/schema.cjs
 *
 * Single convict schema for the entire application.
 * Replaces: defaults.js, loader.js hydrate(), securityConfig.js hardcoded values,
 *           logging.js inline config, and the abandoned index.js class approach.
 *
 * Priority order (highest wins):
 *   1. Environment variables (BLOG_*)
 *   2. config.toml (loaded by convict)
 *   3. These defaults
 */

const convict = require("convict");
const path = require("path");
const os = require("os");

// ---------------------------------------------------------------------------
// Custom formats
// ---------------------------------------------------------------------------

convict.addFormat({
  name: "log-level",
  validate(val) {
    const valid = [
      "error",
      "warn",
      "event",
      "security",
      "notice",
      "info",
      "debug",
      "analytics",
    ];
    if (!valid.includes(val)) {
      throw new Error(`log_level must be one of: ${valid.join(", ")}`);
    }
  },
});

convict.addFormat({
  name: "string-array",
  validate(val) {
    if (!Array.isArray(val)) throw new Error("must be an array of strings");
  },
  coerce(val) {
    // Allow comma-separated env var: BLOG_CSP_SCRIPT_SRC="'self','https://cdn.jsdelivr.net'"
    if (typeof val === "string") return val.split(",").map((s) => s.trim());
    return val;
  },
});

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const schema = {
  // ── Meta ────────────────────────────────────────────────────────────────

  meta: {
    node_env: {
      doc: "Application environment",
      format: ["development", "production", "testing"],
      default: "development",
      env: "NODE_ENV",
    },
    site_owner: {
      doc: "Name of the site owner, used in page titles",
      format: String,
      default: null,
      nullable: true,
      env: "BLOG_SITE_OWNER",
    },
    country: {
      doc: "ISO 3166-1 alpha-2 country code for the operator",
      format: String,
      default: null,
      nullable: true,
      env: "BLOG_COUNTRY",
    },
    root_dir: {
      doc: "Absolute path to the project root.",
      format: String,
      default: path.join(__dirname, "..", ".."),
      env: "ROOT_DIR",
    },
    content_path: {
      doc: "Path to the content directory (markdown, pages, routes module).",
      format: String,
      default: path.join(__dirname, "..", "..", "content"),
      env: "CONTENT_PATH",
    },
    health_check: {
      doc: "Path that bypasses localhost block for health checks",
      format: String,
      default: "/health",
      env: "HEALTHCHECK_PATH",
    },
  },

  // ── Network (internal listen address) ───────────────────────────────────

  network: {
    schema: {
      doc: "HTTP schema the server listens on internally",
      format: ["http", "https"],
      default: "http",
      env: "SERVER_SCHEMA",
    },
    domain: {
      doc: "Internal domain",
      format: String,
      default: "localhost",
      env: "SERVER_DOMAIN",
    },
    address: {
      doc: "Bind address",
      format: String,
      default: "0.0.0.0",
      env: "SERVER_ADDRESS",
    },
    port: {
      doc: "Port the server listens on",
      format: "port",
      default: 3000,
      env: "SERVER_PORT",
    },
    base_path: {
      doc: "Optional base path prefix (e.g. /app)",
      format: String,
      default: "",
      env: "SERVER_BASE_PATH",
    },
  },

  // ── Public (what clients see / used to build URLs) ───────────────────────

  public: {
    schema: {
      doc: "Public-facing schema",
      format: ["http", "https"],
      default: "https",
      env: "PUBLIC_SCHEMA",
    },
    domain: {
      doc: "Public domain name",
      format: String,
      default: "localhost",
      env: "PUBLIC_DOMAIN",
    },
    address: {
      doc: "Public address",
      format: String,
      default: "0.0.0.0",
      env: "PUBLIC_ADDRESS",
    },
    port: {
      doc: "Public port (defaults to 80/443 based on schema)",
      format: "port",
      default: 443,
      env: "PUBLIC_PORT",
    },
    base_path: {
      doc: "Public base path",
      format: String,
      default: "",
      env: "PUBLIC_BASE_PATH",
    },
  },

  // ── Database ─────────────────────────────────────────────────────────────

  db: {
    url: {
      doc: "Full PostgreSQL connection string. Overrides individual fields.",
      format: String,
      default: null,
      nullable: true,
      env: "DB_URL",
      sensitive: true,
    },
    host: {
      doc: "Database host",
      format: String,
      default: "localhost",
      env: "DB_HOST",
    },
    port: {
      doc: "Database port",
      format: "port",
      default: 5432,
      env: "DB_PORT",
    },
    database: {
      doc: "Database name",
      format: String,
      default: "expressjs-blog",
      env: "DB_DATABASE",
    },
    user: {
      doc: "Database user",
      format: String,
      default: "expressjs-blog",
      env: "DB_USER",
    },
    password: {
      doc: "Database password",
      format: String,
      default: null,
      nullable: true,
      env: "DB_PASSWORD",
      sensitive: true,
    },
    pool_max: {
      doc: "Maximum database pool connections",
      format: "nat",
      default: 6,
      env: "DB_POOL_MAX",
    },
  },

  // ── Logging ───────────────────────────────────────────────────────────────

  logging: {
    log_dir: {
      doc: "Directory where log files are written",
      format: String,
      default: path.join(__dirname, "..", "..", "logs"),
      env: "LOG_DIR",
    },
    log_level: {
      doc: "Minimum log level to emit",
      format: "log-level",
      default: "info",
      env: "LOG_LEVEL",
    },
    // These are static and intentionally not env-configurable —
    // they define the winston level/color map, not user-facing behavior.
    levels: {
      doc: "Winston custom level priorities (lower = higher priority)",
      format: Object,
      default: {
        error: 0,
        warn: 1,
        event: 2,
        security: 3,
        notice: 4,
        info: 5,
        debug: 6,
        analytics: 7,
      },
    },
    colors: {
      doc: "Winston level color map",
      format: Object,
      default: {
        error: "red",
        warn: "yellow",
        security: "magenta",
        notice: "cyan",
        info: "green",
        event: "blue",
        analytics: "white",
        debug: "gray",
      },
    },

    // Session log transport settings (DailyRotateFile for the per-boot session file)
    session: {
      filename: {
        doc: "Session log filename pattern",
        format: String,
        default: "session-%DATE%.log",
      },
      date_pattern: {
        doc: "Date pattern for session log rotation",
        format: String,
        default: "YYYY-MM-DD",
      },
      zipped_archive: {
        doc: "Gzip rotated session log files",
        format: Boolean,
        default: true,
      },
      max_files: {
        doc: 'Maximum session log files to retain (e.g. "30d" or a count)',
        format: String,
        default: "30d",
      },
    },

    // Daily rotate settings for per-level log files (info, error, warn, etc.)
    daily_rotate: {
      date_pattern: {
        doc: "Date pattern for daily log rotation",
        format: String,
        default: "YYYY-MM-DD",
      },
      zipped_archive: {
        doc: "Gzip rotated daily log files",
        format: Boolean,
        default: true,
      },
      max_files: {
        doc: "Maximum daily log files to retain",
        format: String,
        default: "14d",
      },
      filename_suffix: {
        doc: "Suffix appended to per-level log filenames before the date",
        format: String,
        default: "-%DATE%.log",
      },
    },
  },

  // ── Auth ──────────────────────────────────────────────────────────────────

  auth: {
    enabled: {
      doc: "Enable OIDC authentication middleware",
      format: Boolean,
      default: false,
      env: "AUTH_ENABLE",
    },
    verify: {
      doc: "URL of the auth verification endpoint",
      format: String,
      default: null,
      nullable: true,
      env: "AUTH_VERIFY",
    },
    login: {
      doc: "URL of the auth login endpoint",
      format: String,
      default: null,
      nullable: true,
      env: "AUTH_LOGIN",
    },
    cache_ttl: {
      doc: "Auth cache TTL in milliseconds",
      format: "nat",
      default: 120000,
      env: "AUTH_CACHE_TTL",
    },
    timeout_ms: {
      doc: "Auth request timeout in milliseconds",
      format: "nat",
      default: 5000,
      env: "AUTH_TIMEOUT_MS",
    },

    // OIDC / express-openid-connect — previously hardcoded in authConfig.js
    oidc: {
      secret: {
        doc: "Session encryption secret. MUST be changed in production.",
        format: String,
        default: "insecure_default_secret_change_me",
        env: "OIDC_SECRET",
        sensitive: true,
      },
      client_id: {
        doc: "OIDC client ID registered with your identity provider",
        format: String,
        default: "expressjs-blog",
        env: "OIDC_CLIENT_ID",
      },
      client_secret: {
        doc: "OIDC client secret",
        format: String,
        default: null,
        nullable: true,
        env: "OIDC_CLIENT_SECRET",
        sensitive: true,
      },
      issuer_base_url: {
        doc: "Base URL of your OIDC provider (Authelia, Auth0, etc.)",
        format: String,
        default: null,
        nullable: true,
        env: "OIDC_ISSUER_BASE_URL",
      },
      scope: {
        doc: "OAuth scopes to request",
        format: String,
        default: "openid profile email groups",
        env: "OIDC_SCOPE",
      },
      callback_path: {
        doc: "Path the OIDC provider redirects to after login",
        format: String,
        default: "/auth/callback",
        env: "OIDC_CALLBACK_PATH",
      },
    },
  },

  // ── Session ───────────────────────────────────────────────────────────────

  session: {
    cookie: {
      secure: {
        doc: "Require HTTPS for session cookie",
        format: Boolean,
        default: true,
        env: "SESSION_COOKIE_SECURE",
      },
      same_site: {
        doc: "SameSite policy for session cookie",
        format: ["Strict", "Lax", "None"],
        default: "Lax",
        env: "SESSION_COOKIE_SAME_SITE",
      },
      domain: {
        doc: "Cookie domain (enables subdomain sharing)",
        format: String,
        default: null,
        nullable: true,
        env: "SESSION_COOKIE_DOMAIN",
      },
    },
  },

  // ── Mail ──────────────────────────────────────────────────────────────────

  mail: {
    secure: {
      doc: "Use TLS for SMTP",
      format: Boolean,
      default: false,
      env: "MAIL_SECURE",
    },
    host: {
      doc: "SMTP host",
      format: String,
      default: "localhost",
      env: "MAIL_HOST",
    },
    port: {
      doc: "SMTP port",
      format: "port",
      default: 1025,
      env: "MAIL_PORT",
    },
    domain: {
      doc: "Mail domain used for from addresses",
      format: String,
      default: "localhost",
      env: "MAIL_DOMAIN",
    },
    newsletter: {
      doc: "Newsletter sender address",
      format: String,
      default: "newsletter@localhost",
      env: "MAIL_NEWSLETTER",
    },
    user: {
      doc: "SMTP user",
      format: String,
      default: null,
      nullable: true,
      env: "MAIL_USER",
    },
    pass: {
      doc: "SMTP password",
      format: String,
      default: null,
      nullable: true,
      env: "MAIL_PASS",
      sensitive: true,
    },
    auth: {
      doc: "SMTP auth string (overrides user/pass)",
      format: String,
      default: null,
      nullable: true,
      env: "MAIL_AUTH",
      sensitive: true,
    },
    default_subject: {
      doc: "Default subject line for contact form emails",
      format: String,
      default: "New Contact Form Submission",
      env: "MAIL_DEFAULT_SUBJECT",
    },
    log_path: {
      doc: "Path to email log JSON file",
      format: String,
      default: path.join(__dirname, "..", "..", "data", "emails.json"),
      env: "MAIL_LOG_PATH",
    },
  },

  // ── hCaptcha ──────────────────────────────────────────────────────────────

  hcaptcha: {
    secret: {
      doc: "hCaptcha server-side secret key",
      format: String,
      default: null,
      nullable: true,
      env: "HCAPTCHA_SECRET",
      sensitive: true,
    },
    key: {
      doc: "hCaptcha site key (public)",
      format: String,
      default: null,
      nullable: true,
      env: "HCAPTCHA_KEY",
    },
  },

  // ── Security / HTTP hardening ─────────────────────────────────────────────
  // Previously hardcoded in securityConfig.js — now config-driven.

  security: {
    hsts_max_age: {
      doc: "HSTS max-age in seconds",
      format: "nat",
      default: 63072000, // 2 years
      env: "SECURITY_HSTS_MAX_AGE",
    },
    // CSP is split into arrays so each directive can be extended per-environment
    // without touching source code.
    csp: {
      default_src: {
        doc: "CSP default-src directive sources",
        format: "string-array",
        default: ["'self'"],
        env: "SECURITY_CSP_DEFAULT_SRC",
      },
      script_src: {
        doc: "CSP script-src directive sources",
        format: "string-array",
        default: [
          "'self'",
          "https://hcaptcha.com",
          "https://cdn.jsdelivr.net",
          "https://cdnjs.cloudflare.com",
          "https://jigsaw.w3.org",
        ],
        env: "SECURITY_CSP_SCRIPT_SRC",
      },
      style_src: {
        doc: "CSP style-src directive sources",
        format: "string-array",
        default: [
          "'self'",
          "https:",
          // SHA updated here when your inline style changes; grep for this comment
          "'sha256-IFndQX5fbz502m3YOxm0DNm7rM0AXxtuHDGmEwvNjfk='",
        ],
        env: "SECURITY_CSP_STYLE_SRC",
      },
      img_src: {
        doc: "CSP img-src directive sources",
        format: "string-array",
        default: [
          "'self'",
          "data:",
          "https://licensebuttons.net",
          "https://cdn.jsdelivr.net",
          "https://jigsaw.w3.org",
        ],
        env: "SECURITY_CSP_IMG_SRC",
      },
      frame_src: {
        doc: "CSP frame-src directive sources",
        format: "string-array",
        default: ["'self'", "https://newassets.hcaptcha.com"],
        env: "SECURITY_CSP_FRAME_SRC",
      },
      connect_src: {
        doc: "CSP connect-src directive sources",
        format: "string-array",
        default: ["'self'"],
        env: "SECURITY_CSP_CONNECT_SRC",
      },
    },
    // Trusted auth domain for connect-src — kept separate so it's
    // explicit in the config file rather than buried in an array.
    auth_domain: {
      doc: "Auth server domain added to CSP connect-src",
      format: String,
      default: null,
      nullable: true,
      env: "SECURITY_AUTH_DOMAIN",
    },
  },

  redirection: {
    doc: "Key-value dictionary mapping source paths to destination paths",
    format: Object,
    default: {},
  },

  // ── Endpoints (OIDC / reveal links) ──────────────────────────────────────

  endpoints: {
    reveal_base: {
      doc: "Base URL for guest access reveal links",
      format: String,
      default: "",
      env: "ENDPOINT_REVEAL_BASE",
    },
    auth_endpoint: {
      doc: "Authelia firstfactor endpoint",
      format: String,
      default: "",
      env: "ENDPOINT_AUTH",
    },
    login_path: {
      doc: "Local login path",
      format: String,
      default: "/auth/login",
      env: "ENDPOINT_LOGIN_PATH",
    },
    status_endpoint: {
      doc: "Auth status check endpoint",
      format: String,
      default: "/api/auth/status",
      env: "ENDPOINT_STATUS",
    },
    logout_endpoint: {
      doc: "Auth logout endpoint",
      format: String,
      default: "/api/auth/logout",
      env: "ENDPOINT_LOGOUT",
    },
    default_redirect: {
      doc: "Default redirect after login",
      format: String,
      default: "/guest-access",
      env: "ENDPOINT_DEFAULT_REDIRECT",
    },
  },

  // ── Cleanup (log session management) ─────────────────────────────────────

  cleanup: {
    development: {
      max_session_count: {
        format: "nat",
        default: 25,
        doc: "Max log sessions in dev",
      },
      session_retention_hours: {
        format: Number,
        default: 1,
        doc: "Hours to retain sessions",
      },
      max_total_size_mb: {
        format: Number,
        default: 50,
        doc: "Max total log size MB",
      },
      max_disk_usage_percent: {
        format: Number,
        default: 85,
        doc: "Disk panic threshold %",
      },
      cleanup_interval_minutes: {
        format: "nat",
        default: 15,
        doc: "Cleanup interval minutes",
      },
      emergency_cleanup_ratio: {
        format: Number,
        default: 0.7,
        doc: "Fraction to keep in emergency",
      },
    },
    production: {
      max_session_count: {
        format: "nat",
        default: 100,
        doc: "Max log sessions in production",
      },
      session_retention_hours: {
        format: Number,
        default: 24,
        doc: "Hours to retain sessions",
      },
      max_total_size_mb: {
        format: Number,
        default: 200,
        doc: "Max total log size MB",
      },
      max_disk_usage_percent: {
        format: Number,
        default: 90,
        doc: "Disk panic threshold %",
      },
      cleanup_interval_minutes: {
        format: "nat",
        default: 60,
        doc: "Cleanup interval minutes",
      },
      emergency_cleanup_ratio: {
        format: Number,
        default: 0.5,
        doc: "Fraction to keep in emergency",
      },
    },
  },

  // ── Testing ───────────────────────────────────────────────────────────────

  testing: {
    username: {
      doc: "Bypass user for development/testing",
      format: String,
      default: "test",
      env: "TEST_USERNAME",
    },
    password: {
      doc: "Bypass password for development/testing",
      format: String,
      default: "test",
      env: "TEST_PASSWORD",
      sensitive: true,
    },
    group: {
      doc: "Bypass group for development/testing",
      format: String,
      default: "test-users",
      env: "TEST_GROUP",
    },
  },
};

module.exports = schema;
