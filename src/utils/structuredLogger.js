const { winstonLogger } = require("./logging");
function determineLogLevel(statusCode) {
  if (statusCode < 400) return "event";
  if (statusCode === 401 || statusCode === 403) return "security";
  if (statusCode >= 400 && statusCode < 500) return "warn";
  if (statusCode >= 500) return "error";
  return null;
}

// Flatten nested objects into key-value pairs for metadata
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
module.exports = (req, res, next) => {
  res.on("finish", () => {
    const { method, url, originalUrl, headers, query, body, connection } = req;
    const forwardedIp = String(req.ip);
    const directIp = String(connection.remoteAddress);
    const { statusCode } = res;

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

      winstonLogger[logLevel]({
        message: `${method} ${url}`,
        ...meta,
      });
    }
  });

  next();
};
