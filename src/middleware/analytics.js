const db = require("../utils/sqlite3");

module.exports = (req, res, next) => {
  if (req.method === "GET" && req.accepts("html")) {
    const forwardedIp = req.ip;
    const directIp = req.connection.remoteAddress;
    const timestamp = Date.now();
    const url = req.originalUrl;
    const referrer = req.get("Referer") || "";
    const userAgent = req.get("User-Agent") || "";

    db.run(
      `INSERT INTO analytics (timestamp, url, referrer, user_agent, js_enabled, forwardedIp, directIp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`, // fixme, join together in main table? i dont know what i was suppose to fix. it works fine
      [timestamp, url, referrer, userAgent, 0, forwardedIp, directIp]
    );
  }
  next();
};
