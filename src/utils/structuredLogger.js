// src/utils/structuredLogger.js
// CHANGED: Added the visitor-tracking observer after existing logging logic.
// The observer fires on res "finish" (same hook), upserts the visitor,
// records the request, and evaluates flag conditions — all fire-and-forget.
// If Postgres is unreachable, the observer fails silently and your existing
// file-based logging continues unaffected.

const { logger } = require("@jpoage1/logger");
const {
  upsertVisitor,
  recordRequest,
  createFlag,
} = require("#services/visitorService.js");
const repeatDetector = require("#services/repeatDetector.js");

// --- Configuration ---

// Paths that suggest automated scanning when they 404.
// Extend this list as you see new patterns in your flags.
const PROBE_PATHS = [
  "/wp-admin",
  "/wp-login.php",
  "/wp-content",
  "/wp-includes",
  "/wp-cron.php",
  "/xmlrpc.php",
  "/.env",
  "/.git",
  "/.htaccess",
  "/.aws",
  "/phpinfo",
  "/phpmyadmin",
  "/pma",
  "/actuator",
  "/swagger",
  "/graphql",
  "/eval",
  "/exec",
  "/shell",
  "/cmd",
  "/etc/passwd",
  "/proc/self",
  "/cgi-bin",
  "/scripts",
];

// Static assets are recorded in file logs but don't create DB records.
// Keeps the requests table focused on meaningful visitor behavior.
const STATIC_EXT =
  /\.(js|css|png|jpe?g|gif|ico|svg|woff2?|ttf|eot|map|webp|avif)$/i;

// Clean up the repeat detector's in-memory Map every 5 minutes.
setInterval(() => repeatDetector.cleanup(), 5 * 60_000).unref();

// --- Helpers (unchanged from original) ---

function determineLogLevel(statusCode) {
  if (statusCode < 400) return "event";
  if (statusCode === 401 || statusCode === 403) return "security";
  if (statusCode >= 400 && statusCode < 500) return "warn";
  if (statusCode >= 500) return "error";
  return null;
}

const flatten = (obj, prefix = "") => {
  if (!obj || typeof obj !== "object") return {};
  const res = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object") {
      Object.assign(res, flatten(v, key));
    } else {
      res[key] = String(v);
    }
  }
  return res;
};

function isProbe(url, statusCode) {
  if (statusCode !== 404) return false;
  const lower = url.toLowerCase().split("?")[0];
  return PROBE_PATHS.some((p) => lower.startsWith(p));
}

// --- Observer (new) ---

async function observe(data) {
  const {
    ip,
    directIp,
    userAgent,
    method,
    url,
    statusCode,
    latencyMs,
    referrer,
    contentLength,
  } = data;

  try {
    const visitorId = await upsertVisitor(ip, userAgent);

    await recordRequest(visitorId, method, url, statusCode, referrer, {
      directIp,
      latencyMs,
      contentLength,
    });

    // --- Flag evaluation ---
    // Each flag type maps to something your middleware already detects.
    // The flag is created once per incident; you review and dismiss in your admin UI.

    // Rate: express-rate-limit responded with 429
    if (statusCode === 429) {
      await createFlag(visitorId, "rate", url, 1, { statusCode });
    }

    // Reject: validateRequestIntegrity blocked the request (400, 405, 413)
    if ([400, 405, 413].includes(statusCode)) {
      await createFlag(visitorId, "reject", url, 1, { statusCode, method });
    }

    // Auth: unauthorized or forbidden
    if (statusCode === 401 || statusCode === 403) {
      await createFlag(visitorId, "auth", url, 1, { statusCode });
    }

    // Probe: 404 on a known scanning path
    if (isProbe(url, statusCode)) {
      await createFlag(visitorId, "probe", url, 1, { statusCode });
    }

    // Repeat: same IP hitting the same route too many times in a short window
    const repeatCount = repeatDetector.record(ip, url);
    if (repeatCount) {
      await createFlag(visitorId, "repeat", url, repeatCount, {
        windowMs: repeatDetector.windowMs,
      });
    }
  } catch (err) {
    // Never let the observer break anything. Console only — avoids
    // recursing back into winston which would fire this hook again.
    console.error("Observer error:", err.message);
  }
}

// --- Middleware (extended) ---

module.exports = (req, res, next) => {
  const startTime = performance.now();

  res.on("finish", () => {
    const latencyMs = parseFloat((performance.now() - startTime).toFixed(2));
    const { method, url, originalUrl, headers, query, body, connection } = req;
    const forwardedIp = String(req.ip);
    const directIp = String(connection.remoteAddress);
    const { statusCode } = res;

    // --- Existing analytics logging (unchanged) ---
    if (req.method === "GET" && req.accepts("html")) {
      req.log.analytics({
        timestamp: Date.now(),
        originalUrl,
        referrer: req.get("Referer") || "",
        userAgent: req.get("User-Agent") || "",
        js_enabled: false,
        forwardedIp,
        directIp,
      });
    }

    // --- Existing structured logging (unchanged) ---
    let logLevel = determineLogLevel(statusCode);
    if (logLevel) {
      const meta = {
        statusCode: String(statusCode),
        directIp,
        forwardedIp,
        contentLength: String(res.getHeader("content-length") || "0"),
        ...flatten(headers, "headers"),
        ...flatten(query, "query"),
        ...flatten(body, "body"),
      };

      logger[logLevel]({
        message: `${method} ${url}`,
        ...meta,
      });
    }

    // --- Observer: visitor tracking + flag evaluation (new) ---
    // Skip static assets — they'd flood the requests table with noise.
    if (STATIC_EXT.test(originalUrl)) return;

    observe({
      ip: forwardedIp,
      directIp,
      userAgent: req.get("User-Agent") || "",
      method,
      url: originalUrl,
      statusCode,
      latencyMs,
      referrer: req.get("Referer") || "",
      contentLength: String(res.getHeader("content-length") || "0"),
    });
  });

  next();
};
