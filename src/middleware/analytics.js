// src/middleware/analytics.js
module.exports = (context) => {
  return (req, res, next) => {
    if (req.method === "GET" && req.accepts("html")) {
      const forwardedIp = req.ip;
      const directIp = req.connection.remoteAddress;
      const timestamp = Date.now();
      const url = req.originalUrl;
      const referrer = req.get("Referer") || "";
      const userAgent = req.get("User-Agent") || "";

      req.log.analytics({
        context,
        timestamp,
        url,
        referrer,
        userAgent,
        js_enabled: false,
        forwardedIp,
        directIp,
      });
    }
    next();
  };
};
