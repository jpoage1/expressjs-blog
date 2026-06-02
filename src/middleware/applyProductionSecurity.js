const helmet = require("helmet");
const hpp = require("hpp");
const rateLimit = require("express-rate-limit");
console.warn("Hard coded values in applyProductionSecurity");

const xssSanitizer = require("@jpoage1/security");
const { HttpError } = require("@jpoage1/errors");
const {
  LOCALHOST_HOSTNAMES,
  HEALTHCHECK_METHOD,
  HEALTHCHECK_PATH,
  FORBIDDEN_MESSAGE,
  FORBIDDEN_STATUS_CODE,
  HSTS_MAX_AGE,
  CSP_DIRECTIVES,
} = require("../config/securityConfig");

const { meta } = require("#config");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: "Too many requests from this IP, please try again later.",
});

const disablePoweredBy = (req, res, next) => {
  req.app.disable("x-powered-by");
  next();
};

const blockLocalhostAccess = (req, res, next) => {
  if (req.method === HEALTHCHECK_METHOD && req.path === HEALTHCHECK_PATH) {
    return next();
  }
  if (
    meta.node_env === "production" &&
    LOCALHOST_HOSTNAMES.includes(req.hostname)
  ) {
    req.log.info(`Method: ${req.method} Path ${req.path}`);
    return next(new HttpError(FORBIDDEN_MESSAGE, FORBIDDEN_STATUS_CODE));
  }
  next();
};

const securityPolicy =
  (overrides = {}) =>
  (req, res, next) => {
    const mergedDirectives = {
      ...CSP_DIRECTIVES,
      ...overrides,
      scriptSrc: [
        ...(overrides.scriptSrc || CSP_DIRECTIVES.scriptSrc),
        `'nonce-${res.locals.session.nonce}'`,
      ],
    };

    return helmet.contentSecurityPolicy({ directives: mergedDirectives })(
      req,
      res,
      next,
    );
  };
const applyProductionSecurity = [
  disablePoweredBy,
  hpp(),
  xssSanitizer,
  limiter,
  blockLocalhostAccess,
  helmet.hsts({ maxAge: HSTS_MAX_AGE }),
  securityPolicy(),
];

module.exports = { applyProductionSecurity, securityPolicy };
