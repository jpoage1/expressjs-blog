// src/setupMiddleware.js
const express = require("express");
const path = require("path");
const exphbs = require("express-handlebars");
const bodyParser = require("body-parser");
const compression = require("compression");

const routes = require("../routes");
const formatHtml = require("./formatHtml");
const logEvent = require("./analytics.js");
const applyProductionSecurity = require("./applyProductionSecurity");
const validateRequestIntegrity = require("./validateRequestIntegrity");
const { registerHelpers } = require("../utils/hbsHelpers");

const {
  loggingMiddleware,
  morganInfo,
  morganWarn,
  morganError,
} = require("./logging");

function setupApp() {
  const app = express();
  // Setup logging
  app.use(logEvent, morganInfo, morganWarn, morganError, loggingMiddleware);

  // Setup view engine

  const hbs = exphbs.create({
    layoutsDir: path.join(__dirname, "../views/layouts"),
    partialsDir: path.join(__dirname, "../views/partials"),
    defaultLayout: "main",
    helpers: {
      section: function (name, options) {
        this._sections ??= {};
        this._sections[name] = options.fn(this);
        return null;
      },
    },
    extname: ".handlebars",
    runtimeOptions: {
      allowProtoPropertiesByDefault: true,
      allowProtoMethodsByDefault: true,
    },
  });
  registerHelpers(hbs);
  app.engine("handlebars", hbs.engine);
  app.set("view engine", "handlebars");
  app.set("views", path.join(__dirname, "../views"));

  // Setup production environment
  if (process.env.NODE_ENV === "production") {
    applyProductionSecurity(app);
  }

  app.use(express.json({ limit: "4kb" }));
  app.use(bodyParser.urlencoded({ extended: false, limit: "4kb" }));
  app.use(compression());
  app.use(validateRequestIntegrity);
  app.use(formatHtml);
  app.use(routes);
  return app;
}

module.exports = setupApp;
