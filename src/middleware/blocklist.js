// src/middleware/blocklist.js
// Checks the in-memory blocklist before any processing. Runs after
// trust proxy is set so req.ip is resolved correctly, but before body
// parsing, auth, templating — no resources wasted on blocked visitors.
const { isBlocked } = require("../services/blocklist");

module.exports = (req, res, next) => {
  if (isBlocked(req.ip)) {
    // 403 with no body. Don't reveal anything about why they're blocked.
    return res.status(403).end();
  }
  next();
};
