// src/middleware/redirect.js

const { logger } = require("#logging");
const config = require("#config");

// Generic redirect handler
function handleRedirect(req, res, targetPath, status = 302) {
  const redirectUrl = res.locals.qualifyLink(targetPath);
  logger.info("Redirect Initiated", {
    from: req.originalUrl,
    // referrer: req.referrer,
    method: req.method,
    ip: req.ip,
  });

  // Check if this is a request that expects JSON (API calls)
  if (req.accepts("json") && !req.accepts("html")) {
    return res.status(status).json({
      redirect: true,
      url: redirectUrl,
    });
  }

  // For browsers, render the redirect page
  res.status(301);
  res.set("Location", redirectUrl);
  res.locals.renderWithBaseContext("pages/redirect", {
    redirectUrl: redirectUrl,
    originalUrl: req.originalUrl,
  });
}
// Middleware function to check for redirects
function redirectMiddleware(req, res, next) {
  res.customRedirect = (targetPath, status) =>
    handleRedirect(req, res, targetPath, status);
  const redirectConfig = config.redirects || {};

  const targetPath = redirectConfig[req.path];
  if (targetPath) {
    return handleRedirect(req, res, targetPath, 301);
  }

  // No redirect needed, continue to next middleware
  next();
}

// Export the middleware and utility functions
module.exports = {
  redirectMiddleware,
  handleRedirect,
};
