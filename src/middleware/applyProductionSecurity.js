const helmet = require("helmet");
const hpp = require("hpp");
const xssSanitizer = require("./xssSanitizer");
const HttpError = require("../utils/HttpError");
const { baseUrl } = require("../utils/baseUrl");
const {
  LOCALHOST_HOSTNAMES,
  HEALTHCHECK_METHOD,
  HEALTHCHECK_PATH,
  FORBIDDEN_MESSAGE,
  FORBIDDEN_STATUS_CODE,
  HSTS_MAX_AGE,
  CSP_DIRECTIVES,
} = require("../config/securityConfig");

const disablePoweredBy = (req, res, next) => {
  req.app.disable("x-powered-by");
  next();
};

const blockLocalhostAccess = (req, res, next) => {
  if (req.method === HEALTHCHECK_METHOD && req.path === HEALTHCHECK_PATH) {
    return next();
  }
  if (
    process.env.NODE_ENV === "production" &&
    LOCALHOST_HOSTNAMES.includes(req.hostname)
  ) {
    req.log.info(`Method: ${req.method} Path ${req.path}`);
    return next(new HttpError(FORBIDDEN_MESSAGE, FORBIDDEN_STATUS_CODE));
  }
  next();
};
const crypto = require("crypto");

function generateNonce() {
  return crypto.randomBytes(16).toString("base64");
}

const securityPolicy =
  (overrides = {}) =>
  (req, res, next) => {
    const nonce = generateNonce();
    res.locals.nonce = nonce;

    const mergedDirectives = {
      ...CSP_DIRECTIVES,
      ...overrides,
      scriptSrc: [
        ...(overrides.scriptSrc || CSP_DIRECTIVES.scriptSrc),
        `'nonce-${nonce}'`,
      ],
    };

    return helmet.contentSecurityPolicy({ directives: mergedDirectives })(
      req,
      res,
      next
    );
  };
const applyProductionSecurity = [
  disablePoweredBy,
  hpp(),
  xssSanitizer,
  // rateLimit middleware can be added here
  blockLocalhostAccess,
  helmet.hsts({ maxAge: HSTS_MAX_AGE }),
  securityPolicy(),
];

module.exports = { applyProductionSecurity, securityPolicy };
