const db = require("../utils/sqlite3");

// Route: JavaScript-enabled tracking
module.exports = (context) => (req, res) => {
  const {
    url = "",
    referrer = "",
    userAgent = "",
    viewport = "",
    loadTime = 0,
    event = "",
  } = req.body;

  const forwardedIp = req.ip;
  const directIp = req.connection.remoteAddress;
  const timestamp = Date.now();

  req.log.analytics({
    context,
    timestamp,
    url,
    referrer,
    userAgent,
    viewport,
    loadTime,
    event,
    forwardedIp,
    directIp,
    js_enabled: true,
  });
  res.sendStatus(204);
};
