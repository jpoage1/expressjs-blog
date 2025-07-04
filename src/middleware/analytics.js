const db = require("../utils/sqlite3");

module.exports = (req, res, next) => {
  if (req.method === "GET" && req.accepts("html")) {
    const ip = req.ip;
    // const ip =
    //   req.headers["x-forwarded-for"]?.split(",")[0] ||
    //   req.connection.remoteAddress ||
    //   "";
    const timestamp = Date.now();
    const url = req.originalUrl;
    const referrer = req.get("Referer") || "";
    const userAgent = req.get("User-Agent") || "";

    db.run(
      `INSERT INTO analytics (timestamp, url, referrer, user_agent, js_enabled, ip)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [timestamp, url, referrer, userAgent, 0, ip]
    );
  }
  next();
};
