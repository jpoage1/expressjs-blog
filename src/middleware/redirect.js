// src/middleware/redirect.js

const { winstonLogger } = require("../utils/logging");

// Configuration - adjust these as needed
const getRedirectConfig = (baseUrl) => ({
  "/": `${baseUrl}/projects`,
  // Add more redirects as needed
  // '/old-path': '/new-path',
});

// Generic redirect handler
function handleRedirect(req, res, targetPath, status = 302) {
  const redirectUrl = res.locals.qualifyLink(targetPath);
  winstonLogger.info("Redirect Initiated", {
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
  res.renderWithBaseContext("pages/redirect", {
    redirectUrl: redirectUrl,
    originalUrl: req.originalUrl,
  });
}
// Middleware function to check for redirects
function redirectMiddleware(req, res, next) {
  res.customRedirect = (targetPath, status) =>
    handleRedirect(req, res, targetPath, status);
  const redirectConfig = getRedirectConfig(res.locals.baseUrl);

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
  getRedirectConfig,
};
