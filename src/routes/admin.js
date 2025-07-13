// src/routes/admin.js (or wherever your router is)
const express = require("express");
const { validateToken, cleanupTokens } = require("../utils/adminToken");
const HttpError = require("../utils/HttpError");
const router = express.Router();

// Middleware to cleanup expired tokens periodically
router.use((req, res, next) => {
  // Clean up expired tokens on each request (you might want to do this less frequently)
  if (Math.random() < 0.1) {
    // 10% chance to cleanup on each request
    cleanupTokens();
  }
  next();
});

router.get("/:token", (req, res, next) => {
  const { token } = req.params;
  if (!token) {
    return next();
  }

  // Validate the token before proceeding
  if (!validateToken(token)) {
    const error = new HttpError("Invalid or expired token", 401, { token });
    req.log.warn({ err: error, token }, "Token validation failed");
    return next(); // fail silently
  }

  const scheme = req.protocol;
  const host = req.get("host");
  const referrer = req.get("Referer") || req.get("Referrer") || "";

  const rd = referrer.startsWith("http")
    ? referrer
    : `${scheme}://${host}${referrer}`;

  const adminLoginUrl = `${process.env.AUTH_LOGIN}${rd}`;
  res.set("Content-Type", "text/html");
  res.render("pages/redirect", { adminLoginUrl });
  //   res.redirect(301, adminLoginUrl);
});

module.exports = router;
