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
    const { method, url, headers, query, body, ip, connection } = req;
    const { statusCode } = res;

    let logLevel = determineLogLevel(statusCode);
    if (logLevel) {
      const meta = {
        statusCode: String(statusCode),
        directIp: String(connection.remoteAddress),
        forwardedIp: String(ip),
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
