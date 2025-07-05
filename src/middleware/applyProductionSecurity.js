const helmet = require("helmet");
const hpp = require("hpp");
const xssSanitizer = require("./xssSanitizer");

function applyProductionSecurity(app) {
  app.disable("x-powered-by");
  app.set("trust proxy", true);

  app.use((req, res, next) => {
    const forwardedIp = req.ip;
    const directIp = req.connection.remoteAddress;

    if (req.log?.info) {
      req.log.info(`Forwarded IP: ${forwardedIp}`);
      req.log.info(`Direct IP: ${directIp}`);
    }
    next();
  });
  app.use(hpp());
  app.use(xssSanitizer);
  // app.use(rateLimit({ windowMs: 1 * 60 * 1000, max: 100 }));
  app.use((req, res, next) => {
    const host = req.hostname;
    if (["127.0.0.1", "localhost"].includes(host)) {
      const err = new Error("Forbidden");
      err.statusCode = 403;
      return next(err);
    }
    next();
  });
  app.use(helmet.hsts({ maxAge: 63072000 }));

  app.use(
    helmet.contentSecurityPolicy({
      directives: {
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

        // add other directives as needed
      },
    })
  ); // Sets secure HTTP headers. Prevents common attacks.
}

module.exports = applyProductionSecurity;
