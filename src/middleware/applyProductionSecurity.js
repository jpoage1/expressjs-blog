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
} = require("../constants/securityConstants");

const disablePoweredBy = (req, res, next) => {
  req.app.disable("x-powered-by");
  next();
};

const blockLocalhostAccess = (req, res, next) => {
  if (req.method === HEALTHCHECK_METHOD && req.path === HEALTHCHECK_PATH) {
    return next();
  }
  if (LOCALHOST_HOSTNAMES.includes(req.hostname)) {
    req.log.info(`Method: ${req.method} Path ${req.path}`);
    return next(new HttpError(FORBIDDEN_MESSAGE, FORBIDDEN_STATUS_CODE));
  }
  next();
};

const applyProductionSecurity = [
  disablePoweredBy,
  hpp(),
  xssSanitizer,
  // rateLimit middleware can be added here
  blockLocalhostAccess,
  helmet.hsts({ maxAge: HSTS_MAX_AGE }),
  helmet.contentSecurityPolicy({
    directives: { ...CSP_DIRECTIVES, defaultSrc: ["'self'", baseUrl] },
  }),
];

module.exports = applyProductionSecurity;
