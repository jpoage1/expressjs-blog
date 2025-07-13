const helmet = require("helmet");
const hpp = require("hpp");
const xssSanitizer = require("./xssSanitizer");
const HttpError = require("../utils/HttpError");
const { baseUrl } = require("../utils/baseUrl");

const applyProductionSecurity = [
  (req, res, next) => {
    req.app.disable("x-powered-by");
    next();
  },
  (req, res, next) => {
    const forwardedIp = req.ip;
    const directIp = req.connection.remoteAddress;

    req.log?.info?.(`Forwarded IP: ${forwardedIp}`);
    req.log?.info?.(`Direct IP: ${directIp}`);
    next();
  },
  hpp(),
  xssSanitizer,
  // rateLimit middleware can be added here
  (req, res, next) => {
    const isHealthcheck = req.method === "HEAD" && req.path === "/healthcheck";
    if (isHealthcheck) return next();

    const host = req.hostname;
    if (["127.0.0.1", "localhost"].includes(host)) {
      req.log.info(`Method: ${req.method} Path ${req.path}`);
      return next(new HttpError("Forbidden", 403));
    }

    next();
  },
  helmet.hsts({ maxAge: 63072000 }),
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", baseUrl],
      scriptSrc: ["'self'", "https://hcaptcha.com"],
      styleSrc: ["'self'", "https:"],
      imgSrc: [
        "'self'",
        "data:",
        "https://licensebuttons.net",
        "https://cdn.jsdelivr.net",
      ],
      frameSrc: ["'self'", "https://newassets.hcaptcha.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  }),
];

module.exports = applyProductionSecurity;
