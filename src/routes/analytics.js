const db = require("../utils/sqlite3");

// Route: JavaScript-enabled tracking
module.exports = (req, res) => {
  const {
    url = "",
    referrer = "",
    userAgent = "",
    viewport = "",
    loadTime = 0,
    event = "",
  } = req.body;

  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.connection.remoteAddress ||
    "";
  const timestamp = Date.now();

  db.run(
    `INSERT INTO analytics (timestamp, url, referrer, user_agent, viewport, load_time, event, ip, js_enabled)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [timestamp, url, referrer, userAgent, viewport, loadTime, event, ip, 1]
  );

  res.sendStatus(204);
};
