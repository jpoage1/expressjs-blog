// config/securityConfig.js

const { baseUrl } = require("../utils/baseUrl");

module.exports = {
  LOCALHOST_HOSTNAMES: ["127.0.0.1", "localhost"],
  HEALTHCHECK_METHOD: "HEAD",
  HEALTHCHECK_PATH: "/health",
  FORBIDDEN_MESSAGE: "Forbidden",
  FORBIDDEN_STATUS_CODE: 403,
  HSTS_MAX_AGE: 63072000,
  CSP_DIRECTIVES: {
    defaultSrc: ["'self'", baseUrl],
    scriptSrc: [
      "'self'",
      "https://hcaptcha.com",
      "https://cdn.jsdelivr.net",
      "https://cdnjs.cloudflare.com",
      "https://jigsaw.w3.org",
    ],
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
