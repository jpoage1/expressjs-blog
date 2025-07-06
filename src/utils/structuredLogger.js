const { winstonLogger } = require("./logging");

module.exports = (level) => (req, res, next) => {
  const start = process.hrtime();

  res.on("finish", () => {
    const [s, ns] = process.hrtime(start);
    const ms = (s * 1e3 + ns / 1e6).toFixed(3);
    const { method, url, headers, query, body, ip } = req;
    const { statusCode } = res;

    if (
      (level === "info" && statusCode < 400) ||
      (level === "warn" && statusCode >= 400 && statusCode < 500) ||
      (level === "error" && statusCode >= 500)
    ) {
      // Flatten nested objects into key-value pairs for metadata
      const flatten = (obj, prefix = "") => {
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

      const meta = {
        statusCode: String(statusCode),
        ip: String(ip),
        responseTime: `${ms}ms`,
        contentLength: String(res.getHeader("content-length") || "0"),
        ...flatten(headers, "headers"),
        ...flatten(query, "query"),
        ...flatten(body, "body"),
      };

      winstonLogger.log({
        level,
        message: `${method} ${url}`,
        ...meta,
      });
    }
  });

  next();
};
