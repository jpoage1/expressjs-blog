// config/securityConstants.js

module.exports = {
  LOCALHOST_HOSTNAMES: ["127.0.0.1", "localhost"],
  HEALTHCHECK_METHOD: "HEAD",
  HEALTHCHECK_PATH: "/healthcheck",
  FORBIDDEN_MESSAGE: "Forbidden",
  FORBIDDEN_STATUS_CODE: 403,
  HSTS_MAX_AGE: 63072000,
  CSP_DIRECTIVES: {
    defaultSrc: ["'self'"],
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
};
