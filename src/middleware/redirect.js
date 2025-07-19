// src/middleware/redirect.js

const { baseUrl } = require("../utils/baseUrl");
const { qualifyLink } = require("../utils/qualifyLinks");

// Configuration - adjust these as needed
const redirectConfig = {
  "/": `${baseUrl}/blog`,
  // Add more redirects as needed
  // '/old-path': '/new-path',
};

// Generic redirect handler
function handleRedirect(req, res, targetPath, status = 302) {
  const redirectUrl = qualifyLink(targetPath);

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
  redirectConfig,
};
