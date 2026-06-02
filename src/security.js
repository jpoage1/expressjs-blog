// src/security.js (blog)
const {
  createProductionSecurity,
  createBlocklist,
  createRequestValidator,
  createSecurityEvent,
  xssSanitizer,
} = require("@jpoage1/security");
const { HttpError } = require("@jpoage1/errors");
const { logger } = require("#logging");
const { getBlockedIPs } = require("@jpoage1/security");
const config = require("#config");

const { applyProductionSecurity, securityPolicy } = createProductionSecurity({
  cspDirectives: config.security.CSP_DIRECTIVES,
  hstsMaxAge: config.security.HSTS_MAX_AGE,
  node_env: config.meta.node_env,
  HttpError,
});

const blocklist = createBlocklist({ getBlockedIPs });
blocklist.start();

const validateRequestIntegrity = createRequestValidator(HttpError);

const SecurityEvent = createSecurityEvent({
  logger,
  logDir: config.logging.logDir,
  HttpError,
});

module.exports = {
  applyProductionSecurity,
  securityPolicy,
  blocklist,
  validateRequestIntegrity,
  SecurityEvent,
  xssSanitizer,
};
