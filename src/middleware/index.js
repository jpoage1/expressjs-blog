// src/setupMiddleware.js
const express = require("express");
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

function setupMiddleware() {
  const app = express();
  // Setup logging
  app.use(logEvent);
  app.use(morganInfo);
  app.use(morganWarn);
  app.use(morganError);
  app.use(loggingMiddleware);

  // Setup view engine

  const hbs = exphbs.create({
    layoutsDir: "src/views/layouts",
    partialsDir: "src/views/partials",
    defaultLayout: "main",
    helpers: {
      section: function (name, options) {
        if (!this._sections) this._sections = {};
        this._sections[name] = options.fn(this);
        return null;
      },
    },
    defaultLayout: "main",
    extname: ".handlebars",
    runtimeOptions: {
      allowProtoPropertiesByDefault: true,
      allowProtoMethodsByDefault: true,
    },
  });
  registerHelpers(hbs);
  app.engine("handlebars", hbs.engine);
  app.set("view engine", "handlebars");
  app.set("views", "./src/views");

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

module.exports = setupMiddleware;
