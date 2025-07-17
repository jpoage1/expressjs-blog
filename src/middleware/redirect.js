// src/middleware/redirect.js

const { baseUrl } = require("../utils/baseUrl");

// Configuration - adjust these as needed
const redirectConfig = {
  "/": `${baseUrl}/blog`,
  // Add more redirects as needed
  // '/old-path': '/new-path',
};

// Helper function to build full URL
function buildRedirectUrl(req, targetPath) {
  const protocol = req.get("x-forwarded-proto") || req.protocol;
  const host = req.get("host");

  // If targetPath is already a full URL, return it as-is
  if (targetPath.startsWith("http")) {
    return targetPath;
  }

  // Build full URL
  return `${protocol}://${host}${targetPath}`;
}

// Generic redirect handler
function handleRedirect(req, res, targetPath, status = 302) {
  const redirectUrl = buildRedirectUrl(req, targetPath);

  // Log the redirect for debugging
  console.log(`[REDIRECT] ${req.originalUrl} -> ${redirectUrl}`);

  // Check if this is a request that expects JSON (API calls)
  if (req.accepts("json") && !req.accepts("html")) {
    return res.status(301).json({
      redirect: true,
      url: redirectUrl,
    });
  }

  res.set("Location", redirectUrl);

  // For browsers, render the redirect page
  res.status(301);
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
